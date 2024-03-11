import React, { useEffect, useRef, useState, useMemo } from 'react';
import { minidenticon } from 'minidenticons';
import Lobby from './Lobby';
import useSound from 'use-sound';
import EnterSound from '../sounds/wheep-wheep.mp3';
import Click from '../sounds/mouse-click.mp3';
import mutedSVG from '../images/muted.svg'
import unmutedSVG from '../images/unmuted.svg'

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
  const [muted, setMuted] = useState(false);
  const [playEnter] = useSound(EnterSound, {volume: muted ? 0: 0.2});
  const [playClick] = useSound(Click, {volume: muted ? 0: 0.2});
  const maxLength = 16;
  
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
    if(user !== "" && lobby !== "") {
      if(user.length > 16 || lobby.length > 16) {
        console.error('Username and lobby name should be 16 characters or less.')
        return;
      }
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
        playEnter();
        // then switch display to lobby
        setShowLobby(true);
      } catch (error) {
        console.error('Error joining lobby:', error.message);
      }
    }
  };

  const toggleMute = () => {
    setMuted((prevMuted) => !prevMuted);
    // stop sounds whether muting or unmuting
    stop();
    if(muted) {
      playClick();
    }
  }

  useEffect(() => {
    // clean up WebSocket connection when the component unmounts or leaving the lobby
    return () => {
      if(socket.current) {
        console.log('Closing WebSocket connection...')
        socket.current.close();
      }
    };
  }, []);

  // 'Enter' should only be used for trying to enter a lobby
  useEffect(() => {
    const handleKeyPress = (e) => {
      if(e && e.key === 'Enter') {
        e.preventDefault();
        joinLobby();
      }
    };

    document.addEventListener('keypress', handleKeyPress);

    return () => {
      document.removeEventListener('keypress', handleKeyPress);
    };
  }, [joinLobby])

  return (
    <div className='App'>
      {showLobby ? ( // show lobby when userID is received
          <Lobby
            socket={socket}
            user={user}
            userColor={userColor}
            lobby={lobby}
            setUser={setUser}
            setLobby={setLobby}
            setShowLobby={setShowLobby}
          />
        ) : (
          <div className='welcome-container'>
            <h1 className='app-h'>Word Roulette Go!</h1>
            <h3 className='app-sh'>create or join a lobby.</h3>
            <div className='app-input'>
              <div className='app-user'>
                <p className='no-select'>Username:</p>
                <textarea
                  className='app-textarea'
                  value={user}
                  onChange={(e) => setUser(e.target.value)}
                  placeholder='Choose your username!'
                  maxLength={maxLength}
                />
              </div>
              <div className='app-lobby'>
                <p className='no-select'>Lobby Name:</p>
                <textarea
                  className='app-textarea'
                  value={lobby}
                  onChange={(e) => setLobby(e.target.value)}
                  placeholder='Create or join a lobby!'
                  maxLength={maxLength}
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
                <button className='toggle-mute' onClick={toggleMute}>
                  <img
                    src={muted ? mutedSVG : unmutedSVG}
                    alt={muted ? 'Unmute' : 'Mute'}
                  />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  };

export default App;