## ADD
- Lobby features
  - [x] ~~A user may leave a lobby through a button. Returns user to homepage~~
  - [x] ~~`${user} joined the lobby.` / `${user} left the lobby` as text in the Lobby messaging.~~
  - [x] ~~sound when a message is *sent*~~
  - [ ] sound when a message is *received* (*going to incorporate 'recieve' sound with new message instead*)
  - [ ] `...` chat bubble appearing while a user is actively typing (need to prevent excess resource usage for the feature)
  - [x] ~~Increase size of input box when typing a message in lobby~~
  - [x] ~~Limit max username/lobby name length (16 char at the moment)~~
  - [ ] Limit max number of messages in the lobby
  - [x] ~~Add onto an already-sent message if the immediate next message is sent by the same user (prevents unnecessary repetition of message-info)~~

- Welcome Page features
  - [x] ~~Separate lobby input method into `Create` and `Join` for more user clarity (username input remains shown)~~
    - [x] ~~If *creating* a lobby and the name exists in the database -> `Lobby already exists...`~~
  - [ ] Prevent additional clicks of `ENTER` button until the attempt to connect to the WebSocket is finished
  - [ ] Loading wheel replaces username and lobby input methods on welcome page if lobby entry takes more than 1 second

## FIX
- General fixes
  - [x] ~~usage of dotenv for external ip in the socket connection from the frontend (possibly find solution not dotenv?)~~
  - [ ] mobile UI
  - [ ] pay attention to rerendering amount intermittently (keep resources low)
  <!-- - [ ] possibly render user text immediately instead of waiting for sync with db (probably bad practice though) -->
  - [ ] Support intuitive function of holding 'Shift' + 'Enter' for the lobby input textbox. *at the moment, that action sends unknown actions to the backend*. Not allowing users to insert new lines into their messages as a temporary solution.
  - [ ] **Think of better solution to serve up the backend than port-forwarding** (NGINX is a solid start, but needs a better pairing). UPDATE - going to experiment with GCP Compute Engine free tier, keep frontend on vercel?

- Welcome fixes
  - [ ] Get a better handle on WebSocket closure when a request occurs that is designed to fail. The fail case of `create` and `join` is not closing the WebSocket request fast enough to allow retries.
    - SOLUTION IN PROGRESS: Initial HTTP request that will allow upgrade to a WebSocket in the two passing cases ('create' and `!exists` OR 'join' and `exists`). Send error response back in either of the rejection cases

- Lobby fixes
  - [] Scroll logic (one flaw remains regarding the lastMessage state being assigned to one message before last)
    - [x] ~~Snap to the bottom if SENDING a message (**reference container of scrollwheel (.lobby-body)**).~~
    - [x] ~~Show "New Messages" button IF RECEIVING a message AND not in range determined "near-bottom".~~
    - [x] ~~Remove "New Messages" button in two scenarios~~
      - [x] ~~Client scrolls to the bottom manually (need listener)~~
      - [x] ~~"New Messages" button is clicked (which snaps user to the bottom)~~
    - [ ] Remove awkward scroll wheel movement when a new message div is added to message-list (maybe because lobby-body's scrollHeight changes?)

## REFACTOR
- [x] ~~A WebSocket connection should only be instantiated when a user enters a lobby, not upon coming to the site itself~~
- [x] ~~Reduce served font file sizes~~
- [x] ~~Use React Router as good practice instead of conditional.~~
- [ ] New name ideas
  - WarpSockets
- [ ] Modularize mute logic (the more frequent sounds can be seperately muted)
- [ ] Include keyboard shortcuts for more common tasks (ex: leave lobby might need an explicit keyboard shortcut)
- [ ] CSS Styling generalization to avoid repetition