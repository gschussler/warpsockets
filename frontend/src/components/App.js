import React, { useEffect, useRef, useState } from 'react';
import Lobby from './Lobby';

const colorList = [
  'rgb(255, 87, 51)',    // Reddish-Orange
  'rgb(255, 0, 0)',      // Red
  'rgb(255, 51, 166)',   // Pink
  'rgb(0, 0, 255)',      // Blue
  'rgb(51, 166, 255)',   // Sky Blue
  'rgb(0, 128, 0)',      // Green
  'rgb(128, 0, 128)',    // Purple
  'rgb(0, 0, 0)',        // Black
  'rgb(255, 255, 255)',  // White
]

const App = () => {
  const [user, setUser] = useState('');
  const [userColor, setUserColor] = useState(colorList[0])
  const [lobby, setLobby] = useState('');
  const [showLobby, setShowLobby] = useState(false);
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

      console.log("Creating new WebSocket connection...")
      socket.current = new WebSocket(wsPath);

      socket.current.addEventListener('open', (e) => {
        console.log('WebSocket connected');
        resolve();
      });

      socket.current.addEventListener('close', (e) => {
        console.log('WebSocket closed');
        reject(new Error('WebSocket closed'));
      });
    });
  };

  const joinLobby = async (e) => {
    e.preventDefault();
    if(user !== "" && lobby !== "") {
      try {
        console.log('Attempting to join lobby...')
        // generate their color for the lobby
        setUserColor(userColor);
        // connect WebSocket when the user joins a lobby
        await connectWebSocket();
        // send lobby information to the server
        socket.current.send(JSON.stringify({action: "join", user, lobby}));
        // then switch display to lobby
        setShowLobby(true);
      } catch (error) {
        console.error('Error joining lobby:', error.message);
      }
    }
  };

  useEffect(() => {
    // clean up WebSocket connection when the component unmounts
    return () => {
      if(socket.current) {
        console.log('Closing WebSocket connection...')
        socket.current.close();
      }
    };
  }, []);

  const colorOptions = colorList.map((color) => ({
    value: color,
    label: (
      <div style={{ display: 'flex', alignItems: 'center'}}>
        <div
          style={{
            backgroundColor: color,
            width: '20px',
            height: '20px',
            marginRight: '8px',
          }}
        ></div>
      </div>
    ),
  }));

  return (
    <div className='App'>
      {showLobby ? ( // show lobby when userID is received
          <Lobby
            socket={socket}
            user={user}
            lobby={lobby}
            userColor={userColor}
            showLobby={showLobby}
            setShowLobby={setShowLobby}
          />
        ) : (
          <div className='welcome-container'>
            <h1 className='app-h'>Word Roulette Go!</h1>
            <h3 className='app-sh'>create or join a lobby.</h3>
            <div className='app-input'>
              <div className='app-user'>
                <p>Username:</p>
                <input
                  className='app-input'
                  type="text"
                  placeholder='Choose your username!'
                  onChange={(e) => {
                    setUser(e.target.value);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && user !== '' && lobby !== '') {
                      e.preventDefault();
                      joinLobby(e);
                    }
                  }}
                />
              </div>
              <div className='app-lobby'>
                <p>Lobby Name:</p>
                <input
                  className='app-input'
                  type="text"
                  placeholder='Create or join a lobby!'
                  onChange={(e) => {
                    setLobby(e.target.value);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && user !== '' && lobby !== '') {
                      e.preventDefault();
                      joinLobby(e);
                    }
                  }}
                />
              </div>
              <div className='color-grid'>
              {colorOptions.map((option) => (
                <div
                  key={option.value}
                  className={`color-option ${userColor === option.value ? 'selected' : ''}`}
                  style={{ backgroundColor: option.value }}
                  onClick={() => setUserColor(option.value)}
                />
              ))}
              </div>
                <button className='app-j' onClick={joinLobby}>ENTER</button>
              </div>
            </div>
        )}
      </div>
    )
  };

export default App;