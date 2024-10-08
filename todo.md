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
  - [ ] Change user name display to a dropdown to the left of the header buttons (because of lobby/user name length interactions with css) -- also make it a list of ALL users in the lobby with their minidenticons next to them

- Welcome Page features
  - [x] ~~Separate lobby input method into `Create` and `Join` for more user clarity (username input remains shown)~~
    - [x] ~~If *creating* a lobby and the name exists in the database -> `Lobby already exists...`~~
  - [x] Prevent additional clicks of `ENTER` button until the attempt to connect to the WebSocket is finished (item below is the solution I'm going with atm)
  - [x] **A loading wheel replaces `ENTER` button during attempt to enter lobby.** - last feature addition before updating portfolio with the project

  README considerations
  - [ ] Add that node.js, go, redis, and nginx must be installed on the machine that hosts the server

## FIX
- General fixes
  - [x] ~~usage of dotenv for external ip in the socket connection from the frontend (possibly find solution not dotenv?)~~
  - [ ] mobile UI
  - [ ] pay attention to rerendering amount intermittently (keep resources low)
  <!-- - [ ] possibly render user text immediately instead of waiting for sync with db (probably bad practice though) -->
  - [ ] Support intuitive function of holding 'Shift' + 'Enter' for the lobby input textbox. *at the moment, that action sends unknown actions to the backend*. Not allowing users to insert new lines into their messages as a temporary solution.
  - [ ] **Think of better solution to serve up the backend than port-forwarding** (NGINX is a solid start, but needs a better pairing). UPDATE - going to experiment with GCP Compute Engine free tier, keep frontend on vercel?

- Welcome fixes
  - [x] Get a better handle on WebSocket closure when a request occurs that is designed to fail. The fail case of `create` and `join` is not closing the WebSocket request fast enough to allow retries.
    - SOLUTION IN PROGRESS: Initial HTTP request that will allow upgrade to a WebSocket in the two passing cases ('create' and `!exists` OR 'join' and `exists`). Send error response back in either of the rejection cases
    - Update 5/17: *Functioning properly, but unable to upgrade WebSocket if accessing production mode of client-side from the same machine and network the server runs on. Possibly solvable by learning more about NGINX, because all other cases work well.*

- Lobby fixes
  - [] Scroll logic (one flaw remains regarding the lastMessage state being assigned to one message before last)
    - [x] ~~Snap to the bottom if SENDING a message (**reference container of scrollwheel (.lobby-body)**).~~
    - [x] ~~Show "New Messages" button IF RECEIVING a message AND not in range determined "near-bottom".~~
    - [x] ~~Remove "New Messages" button in two scenarios~~
      - [x] ~~Client scrolls to the bottom manually (need listener)~~
      - [x] ~~"New Messages" button is clicked (which snaps user to the bottom)~~
    - [ ] Remove awkward scroll wheel movement when a new message div is added to message-list (maybe because lobby-body's scrollHeight changes are not timed with virtual dom diff?)
    - [ ] Figure out reconnection logic (should users be able to try and reload? or does that result in them leaving the lobby).
      - At the moment, the user stays at warpsockets.xyz/lobby without being in a lobby. So that is bad

## REFACTOR
- [x] ~~A WebSocket connection should only be instantiated when a user enters a lobby, not upon coming to the site itself~~
- [x] ~~Reduce served font file sizes~~
- [x] ~~Use React Router as good practice instead of conditional.~~
- [x] New name ideas
  - **warpsockets**
- [ ] Modularize mute logic (the more frequent sounds can be seperately muted)
- [ ] Include keyboard shortcuts for more common tasks (ex: leave lobby might need an explicit keyboard shortcut)
- [ ] CSS Styling generalization to avoid repetition
- [ ] Add actual settings to the settings modal
  - [ ] Toggle snap to bottom
  - [ ] Light/Dark mode
  - [ ] be able to mute from lobby