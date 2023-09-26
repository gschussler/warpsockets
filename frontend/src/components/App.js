import React, {useEffect , useState} from 'react';
import Lobby from './Lobby'

const App = () => {
  const [user, setUser] = useState('');
  const [lobby, setLobby] = useState('');
  const [showLobby, setShowLobby] = useState(false);
  const [receivedMessages, setReceivedMessages] = useState([]); //store messages to be passed to Lobby

  useEffect(() => {
    const socket = new WebSocket('ws://localhost:8080/ws');

    socket.addEventListener('open', (e) => {
      console.log('WebSocket connected');
    });

    socket.addEventListener('message', (e) => {
      const message = e.data;
      console.log('Received message:', message);

      //need to handle incoming WebSocket messages, update message state
      setRecievedMessage((message) => [...receivedMessages, message]);
    });

    socket.addEventListener('close', (e) => {
      console.log('WebSocket closed');
    });

    // clean up WebSocket connection when the component unmounts
    return () => {
      socket.close();
    };
  }, []);

  const joinLobby = (e) => {
    e.preventDefault();
    if(user !== "" && lobby !== "") {
      setShowLobby(true);
    }
  }

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
      {!showLobby ? (
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
              />
            </div>
            <button className='app-j' onClick={joinLobby}>ENTER</button>
          </div>
        </div>
      )
    : (
      <Lobby
        socket={socket}
        user={user}
        lobby={lobby}
        receivedMessages={receivedMessages}
      />
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