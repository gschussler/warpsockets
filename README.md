# word-roulette_go
## [Word Roulette](https://github.com/gschussler/word-roulette) with backend rebuilt in Go.
_Lobby-based, ephemeral chatrooms powered by Go, WebSocket, and React_

- Automatically retrieve messages that have been sent in a lobby upon connecting.
- When no one is left in the lobby, the messages are deleted.

---

### Setup
Everything you need to get up and running lies in one script.

#### Start the server
For the **development** build, run `./devStart.sh` in the root directory and head over to `http://localhost:8085/` in a browser to try Word Roulette out.

For the **production** build, run `./start.sh` in the root directory. Currently, production must be accessed via `http://localhost:8085/` as well.

#### Close out
Currently, you must exit the application in the browser before closing the application. Otherwise, closing the server with `Ctrl + C` will fail to gracefully stop all processes.

---

#### Troubleshooting
If you cannot start Redis or the Go backend, you've likely stopped the server before exiting from the browser end.
- run `lsof -i` and search for the `redis-ser` and `word-roul` processes.
- run `kill` with both of the processes PIDs as arguments to resolve the issue. e.g. `kill 93197 93198`
