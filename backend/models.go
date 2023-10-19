// cross-module structs
package main

import (
	"time"
)

// Chat messages
type Message struct {
	ID            string
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
