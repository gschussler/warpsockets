import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/lobby.scss';
import Settings from './Settings.jsx';
import useSound from 'use-sound';
import Leave from '../sounds/wrgExit2_short.mp3';
import Send from '../sounds/zap.mp3';
import Cog from '../sounds/cog.mp3';
import leaveSvg from '../images/leave.svg';
import settingsSvg from '../images/settings.svg';
import astronautSvg from '../images/astronaut.svg';
import { MinidenticonImg, groupMessages } from './utils.js';
import { ExpandingTextarea } from './TextInput.js';

/**
 * Component to handle sending/receiving messages from server and other client interactions within the 'lobby'.
 * @module Lobby
 * @param {React.MutableRefObject} props.socket - A reference to the WebSocket instance instantiated in App.jsx
 * @param {string} props.user - Current client username.
 * @param {string} props.userColor - Color assigned to the current user
 * @param {string} props.lobby - Lobby name.
 * @param {Function} props.setLobby - Function to set lobby name state.
 * @param {Function} props.setShowLobby - Function to set lobby visibility.
 * @param {Function} props.setUser - Function to set username state.
 * @returns {JSX.Element} - Rendered Lobby component
 */

const Lobby = ({ socket, user, userColor, lobby, setLobby, setUser, muted, setMuted, playDenied }) => {
  const [message, setMessage] = useState('');
  const [messageList, setMessageList] = useState([]);
  const [newMessages, setNewMessages] = useState(false);
  const [disconnected, setDisconnected] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [playSend] = useSound(Send, {volume: muted ? 0: 0.05});
  const [playCog] = useSound(Cog, {volume: muted ? 0: 0.02});
  const [playLeave] = useSound(Leave, {volume: muted ? 0: 0.1});
  const textareaRef = useRef(null);
  const lobbyBodyRef = useRef(null);
  const navigate = useNavigate();
  // const startTimeRef = useRef(null);

  const openModal = () => {
    setSettingsModalOpen(true);
    playCog();
  }

  /**
   * Leaves the lobby and closes the client's WebSocket connection
   * @returns {void}
   */
  const leaveLobby = async () => {
    if(socket.current) {
      await socket.current.close();
      // console.log(`${socket.current.readyState}`);
    }
    setUser('');
    setLobby('');
    playLeave();
    lobbyBackgroundShift();
    navigate('/');
  }

  const lobbyBackgroundShift = () => {
    const stars = document.querySelector('.stars');
    // Return to star background to original position
    stars.style.backgroundPosition = '0 0';
  }

  /**
   * Sends a message via WebSocket connection to the server and immediately displays the message for the sender.
   * @returns {void}
   */

  const sendMessage = async () => {
    // // captures time of process client-side; used to get duration of sending and receiving a message
    // startTimeRef.current  = performance.now();
    if(socket.current.readyState === 1) {
      if(message !== '') {
        const messageContent = {
          lobby: lobby,
          user: user,
          content: message,
          color: userColor
        };

        //* Displays sent message instantly for sender. (latency of broadcast is consistently ~50-300ms for receiving users. There could be desync if the message is not successfully sent through socket.)
        let date = new Date();
        const formattedTime = (date) => {
          let hrs = date.getHours();
          const meridiem = hrs > 11 ? ' PM' : ' AM';
          hrs = hrs % 12 || 12;

          let mins = date.getMinutes();
          if(mins < 10) mins  = '0' + mins;

          return `${hrs}:${mins}${meridiem}`;
        }
        
        // if message fails to send, retry sending
        let retries = 0;
        const maxRetries = 3;

        while (retries < maxRetries) {
          // try sending to server as normal
          try {
            // send to server to be broadcasted to lobby
            await socket.current.send(JSON.stringify(messageContent));

            // add message to message list immediately for sender (currently, crudely changes property names to match server-side Message struct properties.)
            setMessageList(prevMessages => groupMessages({ ...messageContent, User: user, Content: message, Color: userColor, FormattedTime: formattedTime(date) }, prevMessages));

            playSend();
            setMessage('');
            // return input box to original height
            textareaRef.current.style.height = 'auto';
            // Scroll to the bottom of the lobby-body after the message is sent
            // DOM changes are barely too slow, setTimeout to add a few ms (consider a more exact solution).
            setTimeout(() => {
              if(lobbyBodyRef.current) {
                const { scrollHeight, clientHeight } = lobbyBodyRef.current
                lobbyBodyRef.current.scrollTo(0, scrollHeight - clientHeight);
              }
            }, 0);
            return;
          } catch (error) {
            // message failed to send
            console.error('Failed to send message:', error);
            retries++;
            // retry sending the message with delay
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
        // reached max tries --> need to display something to user.
        console.error('Max retry count reached. Failed to send message.');
      } else {
        playDenied();
      }
    } else {
      setMessage('');
      playDenied();
      return;
    }
  };

  useEffect(() => {
    lobbyBodyRef.current = document.querySelector('.lobby-body');
  }, []);

  /**
   * Checks if the position of the scroll wheel is near the bottom of the lobby.
   * @returns {boolean} - True if at the bottom; False if not.
   */

  useEffect(() => {
    /**
     * Handles incoming messages from server.
     * - Broadcasted message is parsed and grouped based on user identity and timestamp.
     * - Message is then appended to messageList.
     * @param {MessageEvent} e - The event containing the incoming message data from server.
     */
    const handleMessage = (e) => {
      // receive incoming message(s) -- can receive from backend in different order need to fix
      let messageContent = JSON.parse(e.data);

      setMessageList(prevMessages => groupMessages(messageContent, prevMessages));

      //! new messages logic remains flawed --> useRef solves most problems with changing div dimensions
      //  however, message grouping logic in groupMessages interferes with the below calculations:
      //    - bind scroll logic for receiving messages to the groupMessages function? introduces prop drilling unless groupMessages is relocated :(
      //    - relocate groupMessages
      setTimeout(() => {
        if(lobbyBodyRef.current) {
          const { scrollTop, scrollHeight, clientHeight } = lobbyBodyRef.current;
          // need a more robust buffer than a hardcoded value (message divs have dynamic height because of groupMessages)
          if(scrollHeight - clientHeight >= scrollTop + 81.5) {
            setNewMessages(true);
          } else {
            setNewMessages(false);
            lobbyBodyRef.current.scrollTo(0, scrollHeight - clientHeight);
          }
        }
      })

      // // log the amount of time it took for a message to be sent and received back on the frontend
      // const endTime = performance.now();
      // const duration = endTime - startTimeRef.current;
      // console.log(`Send/receive speed of current client's last message: ${duration}ms`)
    };

    const handleSocketClose = () => {
      setDisconnected(true);
    };

    const handleSocketOpen = () => {
      setDisconnected(false);
    }

    if (socket.current) {
      // console.log("WebSocket state in Lobby: ", socket.current.readyState);
      socket.current.addEventListener('message', handleMessage);
      socket.current.addEventListener('close', handleSocketClose);
      socket.current.addEventListener('open', handleSocketOpen);
      // send 'join' action to server in order to receive back an announcement that a user has joined the lobby
      socket.current.send(JSON.stringify({action: "join", user, lobby}));

      return () => {
        socket.current.removeEventListener('message', handleMessage);
        socket.current.removeEventListener('close', handleSocketClose);
        socket.current.removeEventListener('open', handleSocketOpen);
        socket.current.close();
      };
    }
  }, [socket]);

  return (
    <div className='lobby'>
      <div className='lobby-h'>
        <p className='lobby-title'>lobby: {lobby}</p>
        <div className='user-container'>
          <div className='app-avatar'>
            <MinidenticonImg
              username={user}
              saturation="90"
              lightness="55"
            />
          </div>
          <div className='user-title' style={{ color: userColor }}>{user}</div>
        </div>
        <div className='buttons-container-h'>
          <button className='settings' onClick={() => openModal()}>
            <img src={settingsSvg} alt='Settings' />
          </button>
          {settingsModalOpen && (
            <div className='modal-overlay'>
              <Settings closeModal={() => setSettingsModalOpen(false)} />
            </div>
          )}
          <button 
            className="leave-lobby"
            onClick={leaveLobby}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
          >
            <img src={leaveSvg} alt='Leave' />
          </button>
        </div>
      </div>
      <div className='lobby-content'>
        <div className='lobby-body' ref={lobbyBodyRef}>
          <div className='message-list'>
            {messageList.slice().reverse().map((messageContent, index) => {
              // define message class based on who sent the message
              return (
                <div
                  className={
                    messageContent.User === 'System' ? 'message system-message'
                    : messageContent.User === user ? 'message message-cr'
                    : 'message message-cl'
                  }
                  key={index}
                >
                  <div className='message-info'>
                    <p className='user' style={{ color: messageContent.Color }}>{messageContent.User}</p>
                    <p className='time'>{`${messageContent.FormattedTime}`}</p>
                  </div>
                  <div className='message-content'>
                    {messageContent.Content}
                  </div>
                </div>
              );
            })}
          </div>
          <div className='lobby-welcome'>
            <p className='astronaut-greet'> For a moment in time, you are connected...</p>
            <img src={astronautSvg} alt='Welcome!' className='astronaut'/>
          </div>
        </div>
        <div className='lobby-footer'>
          <ExpandingTextarea
            textareaRef={textareaRef}
            value={message}
            onChange={(e) => {setMessage(e.target.value)}}
            onKeyDown={(e) => {
              if(e.key === 'Enter') {
                e.preventDefault();
                sendMessage();
              }
            }}
            maxLength={160}
          />
          <button className='send' onClick={sendMessage}>
            Send
          </button>
        </div>
        {newMessages && (
          <button
            className={`new-messages`}
            onClick={() => {
              if (lobbyBodyRef.current) {
                const { scrollHeight, clientHeight } = lobbyBodyRef.current;
                lobbyBodyRef.current.scrollTo(0, scrollHeight - clientHeight);
                setNewMessages(false);
              }
            }}
          >
            ↓ New Messages ↓
          </button>
        )}
        {disconnected && (
          <div className='disconnected'>
            <p> Signal Lost... </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Lobby;