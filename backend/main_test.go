package main

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/gorilla/mux"
	"github.com/gorilla/websocket"
)

// test if websockets are properly upgraded
// func TestWebSocketUpgrade(t *testing.T) {
// 	// create a mock HTTP server for testing
// 	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
// 		// attempt WebSocket upgrade with valid test url
// 		upgrader := websocket.Upgrader{
// 			ReadBufferSize:  1024,
// 			WriteBufferSize: 1024,
// 			CheckOrigin: func(r *http.Request) bool {
// 				return true
// 			},
// 		}
// 		conn, err := upgrader.Upgrade(w, r, nil)
// 		if err != nil {
// 			t.Errorf("Unexpected error during WebSocket upgrade: %v", err)
// 			return
// 		}
// 		defer conn.Close()
// 	}))
// 	defer server.Close()

// 	wsURL := "ws://" + server.Listener.Addr().String() + "/ws"
// 	conn, _, err := websocket.DefaultDialer.Dial(wsURL, nil)
// 	if err != nil {
// 		t.Logf("WebSocket upgrade failed with error: %v", err)
// 	}

// 	// check if the WebSocket upgrade succeeded
// 	if conn == nil {
// 		t.Errorf("Expected WebSocket upgrade to succeed")
// 	} else {
// 		t.Logf("WebSocket upgrade succeeded")
// 		conn.Close()
// 	}
// }

// Test if WebSocket upgrade request will succeed
func TestWebSocketUpgrade(t *testing.T) {
	// Set up router and handlers as in main.go
	router := mux.NewRouter()
	router.Use(loggingMiddleware)
	router.HandleFunc("/ws", handleWebSocket)

	// start test HTTP server in a goroutine
	srv := httptest.NewServer(router)
	defer srv.Close()

	// Create HTTP request to '/ws' endpoint with proper headers
	req, err := http.NewRequest("GET", srv.URL+"/ws", nil)
	if err != nil {
		t.Fatalf("failed to create request %v", err)
	}

	// Manually set necessary headers for WebSocket upgrade (imitating request from client-side WebSocket object)
	req.Header.Set("Connection", "Upgrade")
	req.Header.Set("Upgrade", "websocket")
	// JS WebSocket object handles setting the two following required headers before the request is sent
	req.Header.Set("Sec-WebSocket-Version", "13")
	req.Header.Set("Sec-WebSocket-Key", "dGhlIHNhbXBsZSBub25jZQ==") // example key (base64 encoded string)

	// Serve the HTTP request asking to upgrade to WebSocket
	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		t.Fatalf("failed to upgrade connection: %v", err)
	}
	defer resp.Body.Close()

	// Check that the response status is 101 -- Switching Protocols
	if resp.StatusCode != http.StatusSwitchingProtocols {
		t.Errorf("handler returned the wrong status code: got %v want %v", resp.StatusCode, http.StatusSwitchingProtocols)
	}

	// Upgrade the connection to WebSocket
	conn, _, err := websocket.DefaultDialer.Dial("ws://"+srv.URL[len("http://"):]+"/ws", nil)
	if err != nil {
		t.Fatalf("failed to connect to WebSocket: %v", err)
	}
	defer conn.Close()

	// Create a sample LobbyInfo object to send
	lobbyInfo := LobbyInfo{
		Lobby:  "test-lobby",
		User:   "test-user",
		Action: "create",
	}

	// Marshal the LobbyInfo into JSON format
	lobbyInfoJSON, err := json.Marshal(lobbyInfo)
	if err != nil {
		t.Fatalf("Failed to marshal LobbyInfo: %v", err)
	}

	// Send the LobbyInfo JSON to the server over the WebSocket
	err = conn.WriteMessage(websocket.TextMessage, lobbyInfoJSON)
	if err != nil {
		t.Fatalf("Failed to send LobbyInfo message: %v", err)
	}

	// Delay to imitate likely fastest possible closure by a user
	time.Sleep(100 * time.Millisecond)

	// Gracefully close WebSocket connection from 'client-side'
	conn.WriteMessage(websocket.CloseMessage, websocket.FormatCloseMessage(websocket.CloseNormalClosure, ""))
	if err != nil {
		t.Fatalf("Failed to close WebSocket connection: %v", err)
	}

	// Upgrade successful (assess lobby validation in next test)
	t.Log("WebSocket connection established successfully.")
}
