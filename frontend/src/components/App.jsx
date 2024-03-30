/**
 * Main application component, state management of global variables.
 * - Must pass entire `socket` reference to Welcome and Lobby, not just `socket.current`
 * @module App
 */

import React, { useState, useRef, useEffect } from "react";
import { Routes, Route } from 'react-router-dom';
import '../styles/global.scss';
import useSound from "use-sound";
import Denied from '../sounds/keycard-denial.mp3';
import Lobby from './Lobby.jsx';
import Welcome from './Welcome.jsx';

const App = () => {
  const [user, setUser] = useState('');
  const [userColor, setUserColor] = useState('')
  const [lobby, setLobby] = useState('');
  const [buttonClicked, setButtonClicked] = useState(false);
  const [playDenied] = useSound(Denied, {volume: muted ? 0: 0.03});
  const [muted, setMuted] = useState(false);
  // socket data needs to be accessible by other components through socket.current; Lobby.jsx after the call to join a lobby within Welcome.jsx
  const socket = useRef(null);

  const connectWebSocket = () => {
    // need to wait until connection is completed. async/await syntax not supported by WebSockets
    return new Promise((resolve, reject) => {
      if(socket.current && socket.current.readyState === WebSocket.OPEN) {
        // the WebSocket connection is already open, resolve immediately
        // likely to occur when leaving a lobby then trying to enter another
        console.log("WebSocket is already open.")
        resolve();
      }
      // the WebSocket connection is not open, create a new connection
      // assign external IP to `EXT_IP` in a .env created in frontend dir
      // add the .env to your `.gitignore` to avoid pushing it to GitHub
      const wsPath = process.env.NODE_ENV === 'production'
      ? `ws://${process.env.EXT_IP}/ws` :
      `ws://localhost:8085/ws`;

      // console.log("Creating new WebSocket connection...")
      socket.current = new WebSocket(wsPath);

      socket.current.onopen = async (e) => {
        // console.log('WebSocket connected');
        // send lobby information to the server and confirm join action before resolving
        resolve();
      };

      socket.current.onclose = (e) => {
        // console.log('WebSocket closed code: ', e.code)
        // console.log('WebSocket closed');
        reject(new Error('WebSocket closed'));
      };
    });
  };

  useEffect(() => {
    // clean up WebSocket connection when the application unmounts
    return () => {
      // need socket closure if user returns to the landing page from a lobby
      if(socket.current) {
        console.log('Closing WebSocket connection...')
        socket.current.close();
      }
      //otherwise, socket closure is handled server-side upon losing connection to client
    };
  }, []);

  return (
    <Routes>
      <Route
        exact path="/"
        element={
          <Welcome
            connectWebSocket={connectWebSocket}
            socket={socket}
            user={user}
            setUserColor={setUserColor}
            lobby={lobby}
            setLobby={setLobby}
            setUser={setUser}
            muted={muted}
            setMuted={setMuted}
            buttonClicked={buttonClicked}
            setButtonClicked={setButtonClicked}
            playDenied={playDenied}
          />
        }
      />
      <Route
        path="/lobby"
        element={
          <Lobby
            socket={socket}
            user={user}
            userColor={userColor}
            lobby={lobby}
            setLobby={setLobby}
            setUser={setUser}
            muted={muted}
            setMuted={setMuted}
            playDenied={playDenied}
          />
        }
      />
    </Routes>
  );
};

export default App;