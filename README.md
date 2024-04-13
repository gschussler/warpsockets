# word-roulette_go
## [Word Roulette](https://github.com/gschussler/word-roulette) with backend rebuilt in Go.
_Real-time, ephemeral chatrooms powered by Go, WebSocket, and React_

Chatting with sub-millisecond latency should be what all communication platforms strive for where possible.
Try Word Roulette out, see how fast communication can be.
- Chat with whoever, just enter the same lobby name!
- When no one is left in the lobby, the messages are deleted.

---

### Setup
Currently, the production build of Word Roulette requires NGINX as a reverse proxy server that handles incoming requests and forwards them to the backend server. With no hosting service being used yet, your host machine's external IP address must be exposed through port-forwarding in order to chat with clients from other networks.

This part of setup is skippable but limits you to the development build, which is only local.

See instructions for setting NGINX up for Word Roulette [here](#nginx-configuration).

*DISCLAIMER:*
```
*** THIS IS VERY MUCH A TEMPORARY SOLUTION AND IS NOT SECURE. ***
It's fine to try the application out with those you trust, but in general, exposing your IP address can lead to serious privacy and security risks.

A more viable hosting solution is in the works (cloud hosting services such as GCP Compute Engine are currently at the top of my list, followed by containerization with Docker and Kubernetes for more scalability in the future).
```

#### Start the server
*If you have made changes to the frontend or backend prior to starting the server...*
- For the *frontend*, navigate to the `frontend` directory and run `npm install`.
- For the *backend*, navigate to the `backend` directory and run `go build`.

Everything you need to get up and running for each build lies in one script. These scripts *should* install dependencies and bundle resources, but the above steps would be a safe move. **Relevant scripts should be run at the root directory.**

For the **development** build, run `./devStart.sh` and head over to `http://localhost:3000/`. The development build is strictly local because the Go server is not exposed in that case.

For the **production** build, run `./start.sh`. Remember, the production build currently requires NGINX [configuration](#nginx-configuration) and port-forwarding in order for users other than the host machine to join.
  - If accessing the client on the host machine, go to `http://localhost:8085/`.
  - Currently, any other client must access the application through the external IP of the host machine.

#### Close out
`Ctrl + C` in the running terminal should gracefully stop all processes.

---

#### NGINX Configuration

#### Troubleshooting
If you cannot start Redis or the Go backend, an action other than gracefully exiting the process(es) has likely occured and resulted in dangling processes.
- run `lsof -i` and search for the `redis-ser` and `word-roul` processes.
- run `kill` with both of the processes PIDs as arguments to resolve the issue. e.g. `kill 93197 93198`
  - if `kill` is not successfully terminating on its own, graceful termination was not possible. Upgrading the kill command will forcefully stop the process (NOTE: Could result in zombie processes or data loss related to the application. Not really a problem at the moment if that occurs). e.g. `kill -9 93197`