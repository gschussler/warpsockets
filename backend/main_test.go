package main

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gorilla/websocket"
)

func TestWebSocketUpgradeFailure(t *testing.T) {
	// create a mock HTTP server for testing
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Attempt WebSocket upgrade with an invalid URL
		upgrader := websocket.Upgrader{}
		_, err := upgrader.Upgrade(w, r, nil)
		if err != nil {
			// Handle the WebSocket upgrade failure here
			w.WriteHeader(http.StatusUpgradeRequired)
		}
	}))
	defer server.Close()

	wsURL := "ws://invalid"
	conn, _, err := websocket.DefaultDialer.Dial(wsURL, nil)
	if err != nil {
		t.Logf("WebSocket upgrade failed with error: %v", err)
	}

	// Check if the WebSocket upgrade failed (status code 426)
	if conn != nil {
		conn.Close()
		t.Error("Expected WebSocket upgrade to fail")
	}
}
