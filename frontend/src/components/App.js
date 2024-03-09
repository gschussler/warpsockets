import React, { useEffect, useRef, useState, useMemo } from 'react';
import { minidenticon } from 'minidenticons';
import Lobby from './Lobby';

export const MinidenticonImg = React.memo(({ username, saturation, lightness, ...props}) => {
  const svgURI = useMemo(
    () => 'data:image/svg+xml;utf8,' + encodeURIComponent(minidenticon(username, saturation, lightness)),
    [username, saturation, lightness]
  )

  // console.log('SVG URI:', svgURI) // test for rerenders of variable
  return (<img src={svgURI} alt={username} {...props} />)
});

const App = () => {
  const [user, setUser] = useState('');
  const [userColor, setUserColor] = useState('')
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

      socket.current.onopen = (e) => {
        console.log('WebSocket connected');
        resolve();
      };

      socket.current.onclose = (e) => {
        console.log('WebSocket closed');
        reject(new Error('WebSocket closed'));
      };
    });
  };

  const joinLobby = async (e) => {
    e.preventDefault();
    if(user !== "" && lobby !== "") {
      try {
        console.log('Attempting to join lobby...')
        // set user color for the lobby
        const generatedAvatar = minidenticon(user, '90', '55')
        const match = /fill="([^"]+)"/.exec(generatedAvatar);
        const extractedColor = match ? match[1] : 'defaultColor';
        setUserColor(extractedColor);
        
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
    // clean up WebSocket connection when the component unmounts or leaving the lobby
    return () => {
      if(socket.current) {
        console.log('Closing WebSocket connection...')
        socket.current.close();
      }
    };
  }, []);

  return (
    <div className='App'>
      {showLobby ? ( // show lobby when userID is received
          <Lobby
            socket={socket}
            user={user}
            lobby={lobby}
            userColor={userColor}
            setUser={setUser}
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
              <div className='app-enter-container'>
                <MinidenticonImg
                  style={{ visibility: user !== '' ? 'visible' : 'hidden'}}
                  className="app-avatar"
                  username={user}
                  saturation="90"
                  lightness="55"
                />
                <button className='app-enter' onClick={joinLobby}>ENTER</button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  };

export default App;