// main file of execution -- package main at the top of other packages removes requirement to import here
// http server and WebSocket initialization

package main

import (
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"

	"github.com/gorilla/handlers"
	"github.com/gorilla/mux"
)

// declare a channel to receive signals for graceful shutdown (ctrl + c)
var shutdown = make(chan os.Signal, 1)

func main() {
	// handle cors
	c := handlers.CORS(
		handlers.AllowedOrigins([]string{"*"}),
		handlers.AllowedMethods([]string{"GET", "POST", "PUT", "DELETE"}),
		handlers.AllowedHeaders([]string{"Content-Type"}),
	)

	// init Redis db
	initRedis()

	// notify server of OS signals
	signal.Notify(shutdown, os.Interrupt, syscall.SIGTERM)

	router := mux.NewRouter()

	// // use to help debug routing problems
	// router.Use(loggingMiddleware)

	// // server static to load fonts -- moved assets to frontend
	// router.PathPrefix("/static/").Handler(http.StripPrefix("/static/", http.FileServer(http.Dir("static"))))
	// accept reqs to check lobby existence
	router.HandleFunc("/check-lobby", checkLobbyExist).Methods("POST")
	// accept reqs to upgrade HTTP to WebSocket connection
	router.HandleFunc("/ws", handleWebSocket)
	// serve frontend dir (default path always last to properly expose other routes)
	router.PathPrefix("/").Handler(http.FileServer(http.Dir("./frontend/dist")))

	handler := c(router)

	go func() {
		<-shutdown
		log.Println("SHUTDOWN SIGNAL -- Closing connections and cleaning up...")

		// Delete information in the Redis key/store
		if err := deleteRedisData(); err != nil {
			log.Printf("Error deleting Redis data: %v", err)
		}

		// close WebSocket connections to prevent errors
		lobbyConnections.Range(func(key, value interface{}) bool {
			lobby := key.(string)
			users := value.([]LobbyUser)

			// log.Printf("Closing connections for lobby: %s", lobby)
			for _, user := range users {
				if err := user.Conn.Close(); err != nil {
					log.Printf("Error closing connection for user %s: %v", user.User, err)
				}
			}
			lobbyConnections.Delete(lobby)

			return true
		})

		log.Println("Shutting down...")
		os.Exit(0)
	}()

	// start http server for homepage
	// prepare WebSocket for incoming connections
	// should work in containerized environment -- specified only the port, not the IP
	log.Println("server started on port 8085")
	srv := &http.Server{
		Addr:    ":8085",
		Handler: handler,
	}
	err := srv.ListenAndServe()
	if err != nil {
		log.Fatal("Error starting server: ", err)
	}
}

// // loggingMiddleware logs the incoming HTTP requests -- uncomment along with its router for logging
// func loggingMiddleware(next http.Handler) http.Handler {
// 	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
// 		log.Printf("Received request: %s %s", r.Method, r.RequestURI)
// 		next.ServeHTTP(w, r)
// 	})
// }
