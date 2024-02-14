// main file of execution -- package main at the top of other packages removes requirement to import here
// http server and WebSocket initialization

package main

import (
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"

	"github.com/rs/cors"
)

// declare a channel to receive signals for graceful shutdown (ctrl + c)
var shutdown = make(chan os.Signal, 1)

func main() {
	// handle cors
	c := cors.New(cors.Options{
		AllowedOrigins: []string{"*"},
		AllowedMethods: []string{"GET", "POST", "PUT", "DELETE"},
		AllowedHeaders: []string{"Content-Type"},
	})

	// init Redis db
	initRedis()

	// notify server of OS signals
	signal.Notify(shutdown, os.Interrupt, syscall.SIGTERM)

	go func() {
		<-shutdown
		log.Println("SHUTDOWN SIGNAL -- Closing connections and cleaning up...")

		// Delete information in the Redis key/store
		if err := deleteRedisData(); err != nil {
			log.Printf("Error deleting Redis data: %v", err)
		}

		// Close WebSocket connections to prevent errors
		for lobby, connections := range lobbyConnections {
			_ = lobby //empty usage to avoid linting error
			for _, conn := range connections {
				conn.Close()
			}
		}

		log.Println("Shutting down...")
		os.Exit(0)
	}()

	// start http server for homepage
	// prepare WebSocket for incoming connections
	log.Println("server started on port 8085")
	// wrap http.Handle in c.Handler if you bring CORS settings back
	http.Handle("/", c.Handler(http.FileServer(http.Dir("../frontend/dist"))))
	http.HandleFunc("/ws", handleWebSocket)

	err := http.ListenAndServe(":8085", nil)
	if err != nil {
		log.Fatal("Error starting server: ", err)
	}
}
