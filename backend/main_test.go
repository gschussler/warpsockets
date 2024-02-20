package main

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gorilla/websocket"
)

// test if websockets are properly upgraded
func TestWebSocketUpgrade(t *testing.T) {
	// create a mock HTTP server for testing
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// attempt WebSocket upgrade with valid test url
		upgrader := websocket.Upgrader{
			ReadBufferSize:  1024,
			WriteBufferSize: 1024,
			CheckOrigin: func(r *http.Request) bool {
				return true
			},
		}
		conn, err := upgrader.Upgrade(w, r, nil)
		if err != nil {
			t.Errorf("Unexpected error during WebSocket upgrade: %v", err)
			return
		}
		defer conn.Close()
	}))
	defer server.Close()

	wsURL := "ws://" + server.Listener.Addr().String() + "/ws"
	conn, _, err := websocket.DefaultDialer.Dial(wsURL, nil)
	if err != nil {
		t.Logf("WebSocket upgrade failed with error: %v", err)
	}

	// check if the WebSocket upgrade succeeded
	if conn == nil {
		t.Errorf("Expected WebSocket upgrade to succeed")
	} else {
		t.Logf("WebSocket upgrade succeeded")
		conn.Close()
	}
}
