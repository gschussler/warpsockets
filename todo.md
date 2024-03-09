## ADD
- [x] A user may leave a lobby through a button. Returns user to homepage
- [x] `${user} joined the lobby.` / `${user} left the lobby` as text in the Lobby messaging.
- [ ] non-annoying sound when a message is sent/received
- [ ] `...` chat bubble appearing while a user is actively typing
- [ ] Increase size of input box when typing a message in lobby
- [ ] Limit max username/lobby name length
- [ ] Limit max number of messages in the chatroom

## FIX
- [x] usage of dotenv for external ip in the socket connection from the frontend (possibly find solution not dotenv?)
- [ ] mobile UI (honestly the UI in general as well lol)

## REFACTOR
- [x] A WebSocket connection should only be instantiated when a user enters a lobby, not upon coming to the site itself