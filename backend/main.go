package main

import (
	"log"
	"net/http"

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

func handleWebSocket(w http.ResponseWriter, r *http.Request) {
	// upgrade http connection to a WebSocket connection using upgrader struct
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println("Error upgrading to WebSocket: ", err)
		return
	}
	defer conn.Close()

	// read lobby JSON info sent from the frontend
	var lobbyInfo struct {
		Action string `json:"action"`
		User   string `json:"user"`
		Lobby  string `json:"lobby"`
	}

	err = conn.ReadJSON(&lobbyInfo)
	if err != nil {
		log.Println("Error reading lobby information", err)
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
		log.Printf("%s joined lobby %s", lobbyInfo.User, lobby)
	default:
		log.Printf("Unknown action: %s", lobbyInfo.Action)
	}

	log.Printf("socket connection started for lobby %s", lobby)

	for {
		// Read a message from the WebSocket
		_, msg, err := conn.ReadMessage()
		if err != nil {
			log.Println("Error reading message: ", err)
			// remove connection from the lobby
			removeUserFromLobby(lobby, conn)
			log.Printf("socket connection ended for lobby %s", lobby)
			return
		}

		broadcastMessage(lobby, msg)
	}

	// 	// Optionally, you can send a response back to the client
	// 	err = conn.WriteMessage(websocket.TextMessage, []byte("message sent"))
	// 	if err != nil {
	// 		log.Println("Error writing response: ", err)
	// 		break
	// 	}
	// }
}

func removeUserFromLobby(lobby string, conn *websocket.Conn) {
	// remove a connection from the list of clients in the specified lobby
	connections := lobbyConnections[lobby]
	for i, c := range connections {
		if c == conn {
			lobbyConnections[lobby] = append(connections[:i], connections[i+1:]...)
			break
		}
	}
}

func broadcastMessage(lobby string, msg []byte) {
	// broadcast a message to all clients in the specified lobby
	connections := lobbyConnections[lobby]
	for _, conn := range connections {
		err := conn.WriteMessage(websocket.TextMessage, msg)
		if err != nil {
			log.Println("Error writing message: ", err)
		}
	}
}

// // extract lobby name info from user request to enter lobby
// func getLobbyName(r *http.Request) string {

// }

func main() {
	log.Println("server started on port 8085")
	http.Handle("/", http.FileServer(http.Dir("../frontend/dist")))
	http.HandleFunc("/ws", handleWebSocket)
	// start WebSocket server)
	err := http.ListenAndServe(":8085", nil)
	if err != nil {
		log.Fatal("Error starting server: ", err)
	}
}
