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

		// check if lobby name exists in lobbyConnections
		if _, exists := lobbyConnections[lobby]; !exists {
			lobbyConnections[lobby] = make([]*websocket.Conn, 0)
		}

		switch lobbyInfo.Action {
		case "join":
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
			broadcastMessage(lobby, systemMessage)
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

				// check if lobby is empty in order to delete messages from Redis
				if len(lobbyConnections[lobby]) == 0 {
					deleteEmptyLobbies(lobby)
				} else {
					storeMessage(systemMessage)
					broadcastMessage(lobby, systemMessage)
				}
				return
			}

			if err := json.Unmarshal(msg, &ReceivedMessage); err != nil {
				log.Printf("Error unmarshaling sent message content: %v", err)
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

			broadcastMessage(lobby, message)
		}
	}
}

func generateMessageID() string {
	id := uuid.New()
	return id.String()
}

func removeUserFromLobby(lobby string, conn *websocket.Conn) {
	// remove a connection from the list of clients in the specified lobby
	connections := lobbyConnections[lobby]
	for i, c := range connections {
		if c == conn {
			lobbyConnections[lobby] = append(connections[:i], connections[i+1:]...)
			conn.Close()
			break
		}
	}
}

func broadcastMessage(lobby string, message Message) {
	// serialize message to JSON
	msgJSON, err := json.Marshal(message)
	if err != nil {
		log.Println("Error serializing message to JSON: ", err)
		return
	}
	// // log that a message was broadcasted to all connections in the lobby
	// log.Printf("Message broadcasted in '%s' lobby", lobby)

	// broadcast a message to all clients in the specified lobby
	connections := lobbyConnections[lobby]
	for _, conn := range connections {
		err := conn.WriteMessage(websocket.TextMessage, msgJSON)
		if err != nil {
			log.Println("Error writing message: ", err)
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
