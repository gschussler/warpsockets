import React, { useEffect, useRef, useState } from 'react';
import Select from 'react-select';
import Lobby from './Lobby'

const colorList = [
  'rgb(255, 87, 51)',
  'rgb(51, 255, 87)',
  'rgb(87, 51, 255)',
  'rgb(255, 51, 166)',
  'rgb(51, 166, 255)',
]

const App = () => {
  const [user, setUser] = useState('');
  const [userColor, setUserColor] = useState(colorList[0])
  const [lobby, setLobby] = useState('');
  const [showLobby, setShowLobby] = useState(false);
  const socket = useRef(null);
  
  useEffect(() => {
    socket.current = new WebSocket('ws://localhost:8085/ws');

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
      const color = userColor;
      setUserColor(color)
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
            marginRight: '8px'
          }}
        ></div>
      </div>
    ),
  }));

  // const handleEnterPress = (e) => {
  //   if(e.key === 'Enter') {
  //     e.preventDefault();
  //     joinLobby();
  //   }
  // } onKeyDown={handleEnterPress} <-- put in return

  // useEffect(() => {
  //   socket.on("receive_message", (data) => {
  //     setMessReceived(data.message);
  //   })
  // }, [socket])
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
            <h1 className='app-h'>Welcome!</h1>
            <h3 className='app-sh'>create or join a room!</h3>
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
              <div className='options'>
                <Select
                  value={colorOptions.find((option) => option.value === userColor)}
                  options={colorOptions}
                  onChange={(selected) => setUserColor(selected.value)}
                  styles={{
                    control: (styles) => ({
                      ...styles,
                      width: '300px',
                    }),
                  }}
                />
                {/* <div className='color-box' style={{ backgroundColor: userColor }}></div> */}
                <button className='app-j' onClick={joinLobby}>ENTER</button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  };

// {/* <input
//         placeholder="Message..."
//         onChange={(e) => {setMessage(e.target.value)}}
//       />
//       <button onClick={sendMessage}>Send Message</button>
//       <p className="messages">{messReceived}</p> */}


// {/* <Lobby
//         socket={socket}
//         lobbyName={lobbyName}
//         setLobbyName={(e) => setLobbyName(e)}
//         setIsNamed={() => setIsNamed(true)}
//       /> */}

export default App;