// instantiate Redis db
package main

import (
	"context"
	"encoding/json"
	"log"

	"github.com/redis/go-redis/v9"
)

var redisClient *redis.Client

func initRedis() {
	redisClient = redis.NewClient(&redis.Options{
		Addr:     "localhost:6379", // port 6379 is redis default port
		Password: "",               // not caring about a password at the moment
		DB:       0,                // again default database
	})

	// ping server to check for successful connection
	pong, err := redisClient.Ping(context.Background()).Result()
	if err != nil {
		log.Fatalf("Error connecting to Redis: %v", err)
	}
	log.Printf("Connected to Redis: %s", pong)
}

func storeMessage(message Message) {
	// serialize as JSON before storing in Redis db
	messageJSON, err := json.Marshal(message)
	if err != nil {
		log.Printf("Error serializing message: %v", err)
		return
	}

	// store serialized message in a Redis list tied to lobby
	key := "lobby:" + message.Lobby + ":messages"
	err = redisClient.LPush(context.Background(), key, messageJSON).Err()
	if err != nil {
		log.Printf("Error storing message in Redis: %v", err)
	}
}

// upon entering a lobby, retrieve messages from Redis db
func getExistingMessages(lobbyID string) []Message {
	key := "lobby:" + lobbyID + ":messages"
	messagesJSON, err := redisClient.LRange(context.Background(), key, 0, -1).Result()
	if err != nil {
		log.Printf("Error retrieving messages from Redis: %v", err)
		return nil
	}

	var messages []Message
	for _, msgJSON := range messagesJSON {
		var message Message
		err := json.Unmarshal([]byte(msgJSON), &message)
		if err != nil {
			log.Printf("Error deserializing message: %v", err)
			continue
		}
		messages = append(messages, message)
	}
	return messages
}

func deleteEmptyLobbies(lobby string) {
	// delete messages associated with the lobby
	key := "lobby:" + lobby + ":messages"
	err := redisClient.Del(context.Background(), key).Err()
	if err != nil {
		log.Printf("Error deleting messages for empty lobby %s: %v", lobby, err)
	} else {
		log.Printf("Deleted messages for empty lobby: %s", lobby)
	}

	// key for the lobby as well
	lobbyKey := "lobby:" + lobby
	err = redisClient.Del(context.Background(), lobbyKey).Err()
	if err != nil {
		log.Printf("Error deleting lobby key %s %v", lobbyKey, err)
	} else {
		log.Printf("Deleted lobby key: %s", lobbyKey)
	}
}
