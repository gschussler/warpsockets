## ADD
- [x] A user may leave a lobby through a button. Returns user to homepage
- [x] `${user} joined the lobby.` / `${user} left the lobby` as text in the Lobby messaging.
- [ ] non-annoying sound when a message is sent/received
- [ ] `...` chat bubble appearing while a user is actively typing (real-time chat aspect might make this too resource-intensive)
- [x] Increase size of input box when typing a message in lobby
- [x] Limit max username/lobby name length (16 char at the moment)
- [ ] Limit max number of messages in the chatroom
- [x] Add onto an already-sent message if the immediate next message is sent by the same user (prevents unnecessary repetition of message-info)

## FIX
- [x] usage of dotenv for external ip in the socket connection from the frontend (possibly find solution not dotenv?)
- [ ] mobile UI (honestly the UI in general as well lol)
- [ ] pay attention to rerendering amount intermittently (keep resources low)
<!-- - [ ] possibly render user text immediately instead of waiting for sync with db (probably bad practice though) -->
- [ ] Holding 'Shift' + 'Enter' when sending a message was sending unknown actions to the backend. Not allowing users to insert new lines into their messages as a temporary solution. But want to support normal functionality at some point.

## REFACTOR
- [x] A WebSocket connection should only be instantiated when a user enters a lobby, not upon coming to the site itself
- [x] Reduce served font file sizes
- [ ] Use React Router as good practice instead of conditional.