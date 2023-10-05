// cross-module structs
package main

import (
	"time"
)

// Chat messages
type Message struct {
	ID      string
	Lobby   string
	User    string
	Content string
	Time    time.Time
}

// read lobby JSON info sent from the frontend
type LobbyInfo struct {
	Action string `json:"action"`
	User   string `json:"user"`
	Lobby  string `json:"lobby"`
}
