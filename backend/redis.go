/* Handles Redis db interactions */
package main

import (
	"context"
	"encoding/json"
	"log"
	"os"

	"github.com/redis/go-redis/v9"
)

var redisClient *redis.Client

/* initialize Redis db for server */
func initRedis() {
	// Get Redis host and port from docker-compose.yaml environment variables (defaults to localhost when running dev build)
	redisHost := os.Getenv("REDIS_HOST")
	if redisHost == "" {
		redisHost = "localhost"
	}

	redisPort := os.Getenv("REDIS_PORT")
	if redisPort == "" {
		redisPort = "6379"
	}

	redisAddr := redisHost + ":" + redisPort

	redisClient = redis.NewClient(&redis.Options{
		Addr:     redisAddr, // port 6379 is redis default port
		Password: "",        // not caring about a password at the moment
		DB:       0,         // again default database
	})

	// ping server to check for successful connection
	pong, err := redisClient.Ping(context.Background()).Result()
	if err != nil {
		log.Fatalf("Error connecting to Redis: %v", err)
	}
	log.Printf("Connected to Redis: %s", pong)
}

/* stores received messages in Redis db */
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

/* Upon entering a lobby, retrieve messages from Redis db */
func getExistingMessages(lobbyID string) []Message {
	key := "lobby:" + lobbyID + ":messages"
	messagesJSON, err := redisClient.LRange(context.Background(), key, 0, -1).Result()
	if err != nil {
		log.Printf("Error retrieving messages from Redis: %v", err)
		return nil
	}

	// reverse messages here when sending to client for proper order
	var messages []Message
	for i := len(messagesJSON) - 1; i >= 0; i-- {
		var message Message
		err := json.Unmarshal([]byte(messagesJSON[i]), &message)
		if err != nil {
			log.Printf("Error deserializing message: %v", err)
			continue
		}
		messages = append(messages, message)
	}
	return messages
}

/* Cleans up an empty lobby when the last remaining user leaves */
func deleteEmptyLobbies(lobby string) {
	// check if lobby is empty or null (likely caused by user leaving before joining a lobby)
	if lobby == "" {
		log.Println("Empty or null lobby name provided.")
		return
	}
	// delete messages associated with the lobby
	key := "lobby:" + lobby + ":messages"
	err := redisClient.Del(context.Background(), key).Err()
	if err != nil {
		if err.Error() != "redis: client is closed" {
			log.Printf("Error deleting messages for empty lobby %s: %v", lobby, err)
		}
		// } else {
		// 	log.Printf("Removed messages from '%s' lobby cache.", lobby) // check that messages are removed from Redis
	}

	// delete the lobby's key store once the last user leaves
	lobbyKey := "lobby:" + lobby
	if lobbyKey == "lobby:" {
		return
	}
	err = redisClient.Del(context.Background(), lobbyKey).Err()
	if err != nil {
		if err.Error() != "redis: client is closed" {
			log.Printf("Error deleting lobby key %s %v", lobbyKey, err)
		}
	}
	// } else {
	// 	log.Printf("Deleted lobby key for '%s' lobby", lobby) // check that lobby key is also removed from Redis
	// }
}

/* Flush entire Redis db and close. Called upon server shutdown */
func deleteRedisData() error {
	// need to create a context for the redis FlushDB method
	ctx := context.Background()

	err := redisClient.FlushDB(ctx).Err()
	if err != nil {
		return err
	}

	// close the Redis client
	if err := redisClient.Close(); err != nil {
		return err
	}

	return nil
}
