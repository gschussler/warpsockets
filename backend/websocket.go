// websocket handling
package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"time"

	"github.com/google/uuid"
	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

var lobbyConnections = make(map[string][]*websocket.Conn)

// handle WebSocket connections
func handleWebSocket(w http.ResponseWriter, r *http.Request) {
	retries := 0
	for {
		// upgrade http connection to a WebSocket connection using upgrader struct
		conn, err := upgrader.Upgrade(w, r, nil)
		if err != nil {
			log.Println("Error upgrading to WebSocket: ", err)

			if retries < 5 {
				retries++
				log.Printf("Retrying WebSocket connection...")
				time.Sleep(time.Second * 5)
				continue
			} else {
				log.Printf("Max retries exceeded. WebSocket connection failed.")
				return
			}
		}

		retries = 0
		// defer conn.Close() // possibly preventing closure when user leaves lobby

		// import LobbyInfo struct from models.go
		var lobbyInfo LobbyInfo

		err = conn.ReadJSON(&lobbyInfo)
		if err != nil {
			if websocket.IsCloseError(err, websocket.CloseGoingAway) {
				log.Println("A user left before entering a lobby.")
			} else {
				log.Println("Error reading lobby information", err)
			}
			deleteEmptyLobbies(lobbyInfo.Lobby)
			return
		}

		// used often in following code, assigned to variable
		lobby := lobbyInfo.Lobby

		// // check if lobby name exists in lobbyConnections --> placement changed to allow more logical difference between creating a lobby and joining an existing one
		// if _, exists := lobbyConnections[lobby]; !exists {
		// 	lobbyConnections[lobby] = make([]*websocket.Conn, 0)
		// }

		switch lobbyInfo.Action {
		case "join":
			if _, exists := lobbyConnections[lobby]; !exists {
				// Lobby doesn't exist, reject join request.
				// log.Println("Sending error response: Lobby does not exist.")
				conn.WriteJSON(ErrorResponse{Type: "error", Message: "Lobby does not exist."})
				conn.Close()
				return
			}
			addUserToLobby(conn, lobby, lobbyInfo)
		case "create":
			if _, exists := lobbyConnections[lobby]; exists {
				// Lobby already exists, reject create request.
				// log.Println("Sending error response: Lobby already exist.")
				conn.WriteJSON(ErrorResponse{Type: "error", Message: "Lobby already exists."})
				conn.Close()
				return
			}
			// the lobby doesn't exist yet, so add it as a map entry to lobbyConnections
			lobbyConnections[lobby] = make([]*websocket.Conn, 0)
			addUserToLobby(conn, lobby, lobbyInfo)
		default:
			log.Printf("Unknown action: %s", lobbyInfo.Action)
		}

		for {
			// Read a message from the WebSocket
			_, msg, err := conn.ReadMessage()
			if err != nil {
				// log.Println("Error reading message: ", err)

				systemMessage := generateSystemMessage("departed", lobby, lobbyInfo.User, "#b5b3b0")

				// remove connection from the lobby
				removeUserFromLobby(lobby, conn)
				log.Printf(`"%s" disconnected from Lobby "%s" -- Socket closed`, lobbyInfo.User, lobby)

				// // Log the lobbyConnections map after attempting to remove the connection, check if problems with
				// log.Printf("After removal - Lobby: %s, Connections: %v", lobby, lobbyConnections[lobby])

				// if the lobby is empty after the removal of this user, remove all lobby references
				if len(lobbyConnections[lobby]) == 0 {
					// delete the lobby key from database
					deleteEmptyLobbies(lobby)
					// delete lobby from lobbyConnections map once its stored information has properly been deleted from db
					delete(lobbyConnections, lobby)
				} else {
					// there are still other users in the lobby, broadcast that this user has left
					storeMessage(systemMessage)
					broadcastMessage(lobby, systemMessage, nil)
				}

				conn.Close()
				return
			}

			// JSON formatting is solid, so this error is unlikely (maybe data corruption could throw this error?)
			if err := json.Unmarshal(msg, &ReceivedMessage); err != nil {
				log.Printf("Error unmarshaling sent message content: %v", err)
				// tell the user that they weren't responsible for the connection closing.
				conn.WriteJSON(ErrorResponse{Type: "error", Message: "An error caused you to lose connection to your lobby."})
				conn.Close()
				return
			}

			// test if server is receiving messages
			// log.Printf(`msg is -- %s`, ReceivedMessage.Content)

			// build message from struct to be stored in Redis
			message := Message{
				ID:            generateMessageID(),
				Lobby:         lobby,
				User:          lobbyInfo.User,
				Content:       ReceivedMessage.Content,
				Color:         ReceivedMessage.Color,
				Time:          time.Now(),
				FormattedTime: time.Now().Format("3:04 PM"),
			}

			storeMessage(message)

			broadcastMessage(lobby, message, conn)
		}
	}
}

func addUserToLobby(conn *websocket.Conn, lobby string, lobbyInfo LobbyInfo) {
	// add the connection to the lobby's list of clients
	lobbyConnections[lobby] = append(lobbyConnections[lobby], conn)
	log.Printf(`"%s" connected to Lobby "%s" -- Socket opened`, lobbyInfo.User, lobby)

	systemMessage := generateSystemMessage("arrived", lobby, lobbyInfo.User, "#b5b3b0")

	// retrieve existing messages from Redis
	existingMessages := getExistingMessages(lobby)
	for _, message := range existingMessages {
		// send each message to the connected client
		msgJSON, err := json.Marshal(message)
		if err != nil {
			log.Printf("Error serializing existing message: %v", err)
			continue
		}
		conn.WriteMessage(websocket.TextMessage, msgJSON)
	}
	storeMessage(systemMessage)
	broadcastMessage(lobby, systemMessage, nil)
}

func generateMessageID() string {
	id := uuid.New()
	return id.String()
}

func removeUserFromLobby(lobby string, conn *websocket.Conn) {
	// // Log the lobbyConnections map before attempting to remove the connection
	// log.Printf("Before removal - Lobby: %s, Connections: %v", lobby, lobbyConnections[lobby])

	// remove a connection from the list of clients in the specified lobby
	connections := lobbyConnections[lobby]
	for i, c := range connections {
		if c == conn {
			lobbyConnections[lobby] = append(connections[:i], connections[i+1:]...)
			conn.Close()
			// break
		}
	}
}

func broadcastMessage(lobby string, message Message, senderConn *websocket.Conn) {
	// serialize message to JSON
	msgJSON, err := json.Marshal(message)
	if err != nil {
		log.Println("Error serializing message to JSON: ", err)
		return
	}
	// // log that a message was broadcasted to all connections in the lobby
	// log.Printf("Message broadcasted in '%s' lobby", lobby)

	// broadcast a message to all clients (except for the sender) in the specified lobby
	connections := lobbyConnections[lobby]
	for _, conn := range connections {
		if conn != senderConn {
			err := conn.WriteMessage(websocket.TextMessage, msgJSON)
			if err != nil {
				log.Println("Error writing message: ", err)
			}
		}
	}
}

func generateSystemMessage(action, lobby, user, color string) Message {
	return Message{
		ID:            generateMessageID(),
		Lobby:         lobby,
		User:          "System",
		Content:       fmt.Sprintf("%s has %s.", user, action),
		Color:         color,
		Time:          time.Now(),
		FormattedTime: time.Now().Format("3:04 PM"),
	}
}
