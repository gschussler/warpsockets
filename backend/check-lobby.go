package main

import (
	"encoding/json"
	"log"
	"net/http"
)

// Response struct for JSON responses
type Response struct {
	Type    string `json:"type"`
	Message string `json:"message"`
}

// check if the lobby exists in the database
// respond to the HTTP request accordingly based on the requests `action` property
func checkLobbyExist(w http.ResponseWriter, r *http.Request) {
	// parse request body to extract action, user, and lobby
	var requestData struct {
		Action string `json:"action"`
		User   string `json:"user"`
		Lobby  string `json:"lobby"`
	}
	if err := json.NewDecoder(r.Body).Decode(&requestData); err != nil {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(Response{Type: "error", Message: "Invalid request body."})
		return
	}

	// action switch case to determine whether the lobby's existence matters or not for allowing WebSocket upgrade
	switch requestData.Action {
	case "create":
		if _, exists := lobbyConnections[requestData.Lobby]; exists {
			log.Printf(`"%s" tried to create a lobby that already exists.`, requestData.User)
			w.WriteHeader(http.StatusNotFound)
			json.NewEncoder(w).Encode(Response{Type: "error", Message: "Lobby already exists."})
			return
		}
		// if lobby doesn't exist, do nothing so that the OK response can be sent to client.
	case "join":
		if _, exists := lobbyConnections[requestData.Lobby]; !exists {
			log.Printf(`"%s" tried to join a lobby that doesn't exist.`, requestData.User)
			w.WriteHeader(http.StatusNotFound)
			json.NewEncoder(w).Encode(Response{Type: "error", Message: "Lobby does not exist."})
			return
		}
		// if lobby exists, do nothing so that the OK response can be sent to client.
	default:
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(Response{Type: "error", Message: "Invalid action."})
		return
	}

	// WebSocket upgrade is approved, respond OK
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(Response{Type: "success", Message: "Lobby check successful"})
}
