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
  
  useEffect(() => {
    // assign external IP to `EXT_IP` in a .env created in frontend dir
    // add the .env to your `.gitignore` to avoid pushing it to GitHub
    socket.current = new WebSocket(`ws://${process.env.EXT_IP}/ws`) //|| new WebSocket('ws://localhost:8085/ws');

    socket.current.addEventListener('open', (e) => {
      console.log('WebSocket connected');
    });

    socket.current.addEventListener('close', (e) => {
      // console.log(e);
      console.log('WebSocket closed');
    });

    // clean up WebSocket connection when the component unmounts
    return () => {
      socket.current.close();
    };
  }, []);

  const joinLobby = (e) => {
    e.preventDefault();
    if(user !== "" && lobby !== "") {
      // generate their color for the lobby
      setUserColor(userColor)
      // send lobby information to the server
      socket.current.send(JSON.stringify({action: "join", user, lobby}));
      // then switch display to lobby
      setShowLobby(true);
    }
  }

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