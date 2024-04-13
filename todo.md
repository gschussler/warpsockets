## ADD
- [x] A user may leave a lobby through a button. Returns user to homepage
- [x] `${user} joined the lobby.` / `${user} left the lobby` as text in the Lobby messaging.
- [ ] non-annoying sound when a message is sent/received
- [ ] `...` chat bubble appearing while a user is actively typing (real-time chat aspect might make this too resource-intensive)
- [x] Increase size of input box when typing a message in lobby
- [x] Limit max username/lobby name length (16 char at the moment)
- [ ] Limit max number of messages in the chatroom
- [x] Add onto an already-sent message if the immediate next message is sent by the same user (prevents unnecessary repetition of message-info)
- [ ] Robust scroll logic
  - [x] Snap to the bottom if SENDING a message (**reference container of scrollwheel (.lobby-body)**).
  - [x] Show "New Messages" button IF RECEIVING a message AND not in range determined "near-bottom".
  - [ ] Remove "New Messages" button in two scenarios: 1. Client scrolls to the bottom manually (need listener) 2. "New Messages" button is clicked (which snaps user to the bottom)
- [ ] Think of better solution to serve up the backend than port-forwarding (NGINX is a solid start, but needs a better pairing). UPDATE - going to experiment with GCP Compute Engine free tier, keep frontend on vercel?

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
- [ ] New name ideas
  - WarpSocket