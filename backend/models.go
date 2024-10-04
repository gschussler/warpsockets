/* Cross-module structs */
package main

import (
	"time"

	"github.com/gorilla/websocket"
)

// Chat messages
type Message struct {
	ID            string
	Type          [2]string
	Lobby         string
	User          string
	Content       string
	Color         string
	Time          time.Time
	FormattedTime string
}

// read lobby JSON info sent from the frontend
type LobbyInfo struct {
	Lobby  string `json:"lobby"`
	User   string `json:"user"`
	Action string `json:"action"`
}

type LobbyUser struct {
	Conn *websocket.Conn
	User string
}

var ReceivedMessage struct {
	Lobby   string `json:"lobby"`
	User    string `json:"user"`
	Content string `json:"content"`
	Color   string `json:"color"`
}

// Represents an error response message.
type ErrorResponse struct {
	Type    string `json:"type"`
	Message string `json:"message"`
}
