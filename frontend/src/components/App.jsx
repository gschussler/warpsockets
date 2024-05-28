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
import Normal from '../sounds/button-normal.mp3'
import Lobby from './Lobby.jsx';
import Welcome from './Welcome.jsx';

const App = () => {
  const [action, setAction] = useState('join');
  const [user, setUser] = useState('');
  const [userColor, setUserColor] = useState('')
  const [lobby, setLobby] = useState('');
  const [playDenied] = useSound(Denied, {volume: muted ? 0: 0.03});
  const [playNormal] = useSound(Normal, {volume: muted ? 0: 0.03})
  const [muted, setMuted] = useState(false);
  const [loading, setLoading] = useState(false);
  // socket data needs to be accessible by other components through socket.current; Lobby.jsx after the call to join a lobby within Welcome.jsx
  const socket = useRef(null);

  const checkLobbyExist = async (action, user, lobby) => {
    // console.log(action, user, lobby)
    // `https://${process.env.EXT_IP}/check-lobby`
    const checkPath = process.env.NODE_ENV === 'production'
      ? `https://warpsockets.xyz/check-lobby`
      : `http://localhost:8085/check-lobby`;
  
    const response = await fetch(checkPath, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action, user, lobby }),
    });

    const data = await response.json()
    
    if (!response.ok) {
      const errorMessage = new Error(`${data.message}` || `Failed to check lobby existence`);
      errorMessage.status = response.status;
      throw errorMessage;
    }

    return data;
  };

  const connectWebSocket = async () => {
    try {
      // check for lobby's existence in db before continuing with WebSocket upgrade
      await checkLobbyExist(action, user, lobby);
      // async/await syntax not supported by WebSockets, so the ws upgrade itself requires a Promise
      return new Promise((resolve, reject) => {
        if(socket.current && socket.current.readyState === WebSocket.OPEN) {
          // already open ws connection could occur when leaving a lobby and immediately trying to enter another
          console.log("WebSocket is already open.")
          resolve();
        }
        // the WebSocket connection is not open, create a new connection
        // `EXT_IP` variable in .env that needs to be in top-level of frontend dir
          // add .env to your `.gitignore` to avoid pushing it to GitHub
        // `ws://${process.env.EXT_IP}/ws` <-- old way to expose server
        const wsPath = process.env.NODE_ENV === 'production'
        ? `wss://warpsockets.xyz/ws` // registered a domain and configured with nginx
        : `ws://localhost:8085/ws`;

        // console.log("Creating new WebSocket connection...")
        socket.current = new WebSocket(wsPath);

        socket.current.onopen = (e) => {
          // console.log(`in socket.current.onopen ${action}`)
          // console.log('WebSocket connected');
          resolve();
        };

        socket.current.onclose = (e) => {
          // console.log('WebSocket closed code: ', e.code)
          // console.log('WebSocket closed');
          reject(new Error('WebSocket closed: ', e.code));
        };
      });
    } catch (error) {
      return Promise.reject(error);
    }
  };

  useEffect(() => {
    // clean up WebSocket connection when the application unmounts
    return () => {
      // need socket closure if user returns to the landing page from a lobby
      if(socket.current) {
        console.log('Closing WebSocket connection for unmount...')
        socket.current.close();
      } else {
        console.log('Websocket connection already closed or not initialized.')
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
            loading={loading}
            setLoading={setLoading}
            socket={socket}
            user={user}
            setUserColor={setUserColor}
            lobby={lobby}
            setLobby={setLobby}
            setUser={setUser}
            action={action}
            setAction={setAction}
            muted={muted}
            setMuted={setMuted}
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
            playNormal={playNormal}
          />
        }
      />
    </Routes>
  );
};

export default App;