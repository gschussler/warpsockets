# word-roulette_go
## [Word Roulette](https://github.com/gschussler/word-roulette) with backend rebuilt in Go.
_Real-time, ephemeral chatrooms powered by Go, WebSocket, and React_

Chatting with sub-millisecond latency should be what all communication platforms strive for where possible.
Try Word Roulette out, see how fast communication can be.
- Chat with whoever, just enter the same lobby name!
- Automatically retrieve messages that have been sent in an existing lobby upon connecting to it.
- When no one is left in the lobby, the messages are deleted.

---

### Setup
Navigate to the `frontend` directory and run `npm install`.

Everything you need to get up and running lies in one script. **Relevant scripts should be run at the root directory.**

#### Start the server
For the **development** build, run `./devStart.sh` in the root directory and head over to `http://localhost:8085/`.

For the **production** build, run `./start.sh` in the root directory. Currently, the production build requires NGINX configuration and port forwarding in order for users other than the host machine to join. Considering more reasonable solutions for serving the application at this time.

#### Close out
`Ctrl + C` in the terminal should gracefully stop all processes.

---

#### Troubleshooting
If you cannot start Redis or the Go backend, an action other than gracefully exiting the process(es) has likely occured.
- run `lsof -i` and search for the `redis-ser` and `word-roul` processes.
- run `kill` with both of the processes PIDs as arguments to resolve the issue. e.g. `kill 93197 93198`
  - if `kill` is not successfully terminating on its own, graceful termination was not possible. Upgrading the kill command will forcefully stop the process (NOTE: Could result in zombie processes or data loss related to the application. Not really a problem at the moment if that occurs). e.g. `kill -9 93197`
