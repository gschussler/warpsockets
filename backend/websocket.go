// websocket handling
package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"sync"
	"time"

	"github.com/google/uuid"
	"github.com/gorilla/websocket"
)

// // fleshed out close handler function
// func closeWebSocket(conn *websocket.Conn) error {
// 	// send close message
// 	deadline := time.Now().Add(time.Minute)
// 	err := conn.WriteControl(
// 		websocket.CloseMessage,
// 		websocket.FormatCloseMessage(websocket.CloseNormalClosure, ""),
// 		deadline,
// 	)
// 	if err != nil {
// 		return err
// 	}

// 	// set deadline for reading the next message to prevent hanging
// 	err = conn.SetReadDeadline(time.Now().Add(5 * time.Second))
// 	if err != nil {
// 		return err
// 	}

// 	// read messages until the close message is confirmed to prevent data loss
// 	for {
// 		_, _, err = conn.NextReader()
// 		if websocket.IsCloseError(err, websocket.CloseNormalClosure) {
// 			break
// 		}
// 		if err != nil {
// 			break
// 		}
// 	}
// 	// close TCP connection
// 	err = conn.Close()
// 	if err != nil {
// 		return err
// 	}
// 	return nil
// }

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

// var lobbyConnections = make(map[string][]*websocket.Conn)
var lobbyConnections sync.Map // REPLACING map with sync.Map -> https://pkg.go.dev/sync#Map

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
		// prime handleWebSocket to gracefully close the WebSocket connection no matter the return scenario
		// also trying to send message along with the closure, could find a better way
		defer conn.Close()
		// defer func() {
		// 	err := closeWebSocket(conn)
		// 	if err != nil {
		// 		log.Println("Error closing WebSocket connection: ", err)
		// 	}
		// }()

		// import LobbyInfo struct from models.go
		var lobbyInfo LobbyInfo

		err = conn.ReadJSON(&lobbyInfo)
		if err != nil {
			if websocket.IsCloseError(err, websocket.CloseGoingAway) {
				log.Println("A user left before entering a lobby.")
			} else {
				log.Println("Error reading lobby information", err)
			}
			// pass the lobby from the client-side WebSocket upgrade message into the deletion function so it is not
			// improperly referenced during cleanup
			deleteEmptyLobbies(lobbyInfo.Lobby)
			return
		}

		// frequently referenced by the following operations of handleWebSocket
		lobby := lobbyInfo.Lobby
		user := lobbyInfo.User
		// action := lobbyInfo.Action

		// check if the lobby exists in the sync.Map
		if _, exists := lobbyConnections.Load(lobby); !exists {
			// create a new slice for storing connections to that lobby
			newConnections := make([]*LobbyUser, 0)
			// store new slice in the sync.Map
			lobbyConnections.Store(lobby, newConnections)
		}

		// switch action {
		// case "join":
		// 	if _, exists := lobbyConnections[lobby]; !exists {
		// 		// Lobby doesn't exist, reject join request.
		// 		log.Printf(`"%s" tried to join a lobby that doesn't exist.`, user)
		// 		conn.WriteJSON(ErrorResponse{Type: "error", Message: "Lobby does not exist."})
		// 		return
		// 	}
		// 	// lobby exists, add user to lobbyConnections[lobby]
		// 	addUserToLobby(conn, lobby, user)
		// case "create":
		// 	if _, exists := lobbyConnections[lobby]; exists {
		// 		// Lobby already exists, reject create request.
		// 		log.Printf(`"%s" tried to create a lobby that already exists.`, user)
		// 		conn.WriteJSON(ErrorResponse{Type: "error", Message: "Lobby already exists."})
		// 		return
		// 	}
		// 	// the lobby doesn't exist yet, so add it as a map entry to lobbyConnections
		// 	lobbyConnections[lobby] = make([]*websocket.Conn, 0)
		// 	addUserToLobby(conn, lobby, user)
		// default:
		// 	// not set on closing the connection because of an unknown action at this point
		// 	log.Printf("Unknown action: %s", action)
		// }

		// associate the client's WebSocket connection id and username with the requested lobby
		addUserToLobby(conn, lobby, user)

		for {
			// as long as the client's WebSocket connection remains, read a message from the WebSocket when it arrives
			_, msg, err := conn.ReadMessage()
			if err != nil {
				// log.Println("Error sent. Reading message: ", err)

				systemMessage := generateSystemMessage("departed", lobby, user, "#b5b3b0")

				// remove reference to user connection from the lobby
				// log.Printf(`Removing "%s" from Lobby "%s"`, user, lobby)
				removeUserFromLobby(lobby, user, conn)

				// // Log the lobbyConnections map after attempting to remove the connection, check if problems with
				// log.Printf("After removal - Lobby: %s, Connections: %v", lobby, lobbyConnections[lobby])

				conns, _ := lobbyConnections.Load(lobby)
				if conns == nil {
					log.Printf("Lobby %s does not exist", lobby)
					return
				}

				lobbyConns := conns.([]*LobbyUser)

				// if the lobby is empty after the removal of this user, remove all lobby references
				if len(lobbyConns) == 0 {
					// delete the lobby key from database
					deleteEmptyLobbies(lobby)
					// delete lobby from lobbyConnections map once its stored information has properly been deleted from db
					lobbyConnections.Delete(lobby)
				} else {
					// there are still other users in the lobby, broadcast that this user has left
					storeMessage(systemMessage)
					broadcastMessage(lobby, systemMessage, nil)
				}

				// log.Printf(`"%s" disconnected from Lobby "%s" -- Socket closed`, user, lobby)
				return
			}

			// JSON formatting is solid, so this error is unlikely (maybe data corruption could throw this error?)
			if err := json.Unmarshal(msg, &ReceivedMessage); err != nil {
				log.Printf("Error unmarshaling sent message content: %v", err)
				// tell the user that aren't responsible for the connection closing caused by returning this error.
				conn.WriteJSON(ErrorResponse{Type: "error", Message: "An internal error caused you to lose connection to your lobby."})
				return
			}

			// test if server is receiving messages
			// log.Printf(`msg is -- %s`, ReceivedMessage.Content)

			// build message from struct to be stored in Redis
			message := Message{
				ID:            generateMessageID(),
				Lobby:         lobby,
				User:          user,
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

func addUserToLobby(conn *websocket.Conn, lobby string, user string) {
	// load the current list of connections for lobby
	conns, _ := lobbyConnections.Load(lobby)
	var lobbyUsers []*LobbyUser

	if conns != nil {
		lobbyUsers = conns.([]*LobbyUser)
	}

	// append the new connection
	lobbyUsers = append(lobbyUsers, &LobbyUser{Conn: conn, User: user})

	// store the updated connections back to the sync.Map
	lobbyConnections.Store(lobby, lobbyUsers)

	log.Printf(`"%s" connected to Lobby "%s" -- Socket opened`, user, lobby)

	systemMessage := generateSystemMessage("arrived", lobby, user, "#b5b3b0")

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

func removeUserFromLobby(lobby string, user string, conn *websocket.Conn) {
	// // Log the lobbyConnections map before attempting to remove the connection
	// log.Printf("Before removal - Lobby: %s, Connections: %v", lobby, lobbyConnections[lobby])

	conns, _ := lobbyConnections.Load(lobby)
	if conns == nil {
		log.Printf("Lobby %s does not exist", lobby)
		return
	}

	lobbyUsers := conns.([]*LobbyUser)

	// Remove the connection
	for i, lobbyUser := range lobbyUsers {
		if lobbyUser.Conn == conn {
			lobbyUsers = append(lobbyUsers[:i], lobbyUsers[i+1:]...)
			log.Printf(`"%s" disconnected from Lobby "%s" -- Socket closed`, user, lobby)
			break
		}
	}

	// Store updated connections back to sync.Map
	lobbyConnections.Store(lobby, lobbyUsers)
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

	// load the connections from the sync.Map
	conns, ok := lobbyConnections.Load(lobby)
	if !ok {
		log.Printf("No connections in Lobby %s", lobby)
		return
	}

	lobbyUsers := conns.([]*LobbyUser)

	// broadcast a message to all clients (except for the sender) in the specified lobby
	for _, lobbyUser := range lobbyUsers {
		if lobbyUser.Conn != senderConn {
			err := lobbyUser.Conn.WriteMessage(websocket.TextMessage, msgJSON)
			if err != nil {
				log.Println("Error writing message: ", err)
			}
		}
	}
}

func generateSystemMessage(action, lobby, user, color string) Message {
	return Message{
		ID:            generateMessageID(),
		Type:          [2]string{action, user},
		Lobby:         lobby,
		User:          "System",
		Content:       fmt.Sprintf("%s has %s.", user, action),
		Color:         color,
		Time:          time.Now(),
		FormattedTime: time.Now().Format("3:04 PM"),
	}
}
