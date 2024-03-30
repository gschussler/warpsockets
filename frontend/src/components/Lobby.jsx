import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/lobby.scss';
import Settings from './Settings.jsx';
import useSound from 'use-sound';
import Send from '../sounds/zap.mp3';
import leaveSvg from '../images/leave.svg';
import settingsSvg from '../images/settings.svg'
import { MinidenticonImg, groupMessages, isNearBottom } from './utils.js';
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
  const [newMessagesButton, setNewMessagesButton] = useState(false);
  const [disconnected, setDisconnected] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [playSend] = useSound(Send, {volume: muted ? 0: 0.05});
  const lobbyRef = useRef(null);
  const textareaRef = useRef(null);
  const navigate = useNavigate();
  // const startTimeRef = useRef(null);

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
    navigate('/');
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

        //! Displays sent message instantly for sender. (latency of broadcast is consistently ~50-300ms for receiving users. There could be desync if the message is not successfully sent in try/catch statement)
        let date = new Date();
        const formattedTime = (date) => {
          let hrs = date.getHours();
          const meridiem = hrs > 11 ? ' PM' : ' AM';
          hrs = hrs % 12 || 12;

          let mins = date.getMinutes();
          if(mins < 10) mins  = '0' + mins;

          return `${hrs}:${mins}${meridiem}`;
        }

        // add message to message list immediately (currently, crudely changes property names to match message properties when returned from the server.)
        setMessageList(prevMessages => groupMessages({ ...messageContent, User: user, Content: message, messageColor: userColor, FormattedTime: formattedTime(date) }, prevMessages));
        
        // if message fails to send, retry sending
        let retries = 0;
        const maxRetries = 3;

        while (retries < maxRetries) {
          // try sending to server as normal
          try {
            await socket.current.send(JSON.stringify(messageContent));
            playSend();
            // prepare a message to be appended to the message list
            setMessage('');
            // return input box to original height
            if(textareaRef.current) {
              textareaRef.current.style.height = 'auto';
            }
            if(isNearBottom()) {
              lobbyRef.current.scrollTop = lobbyRef.current.scrollHeight;
            }
            return;
          } catch (error) {
            // message failed to send
            console.error('Failed to send message:', error);
            retries++;
            // retry sending the message with delay
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
        // reached max tries --> should display something to user.
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

  /**
   * Check scroll wheel height to:
   * 1. Keep scroll wheel at the bottom of the lobby
   * 2. Display new messages button if not near the bottom.
   * @returns Boolean - scroll wheel is at the bottom or not.
   */

  const isNearBottom = () => {
    const { scrollTop, scrollHeight, clientHeight } = lobbyRef.current;
    return scrollHeight - scrollTop <= clientHeight + 100;
  };

  const handleScroll = () => {
    if(isNearBottom()) {
      setNewMessagesButton(false);
    } else {
      setNewMessagesButton(true);
    }
  }

  useEffect(() => {
    if(lobbyRef.current) {
      lobbyRef.current.addEventListener('scroll', handleScroll);

      return () => {
        if(lobbyRef.current) {
          lobbyRef.current.removeEventListener('scroll', handleScroll);
        }
      };
    }
  }, []);

  // TIME is set up on the backend, figure out proper order of parsing here (current user message vs existing message)
  useEffect(() => {
    const handleMessage = (e) => {
      // receive incoming message(s) -- can receive from backend in different order need to fix
      let messageContent = JSON.parse(e.data);

      // Removed broadcasting back to the current user, so this is unnecessary
      // // check if current user sent the message being handled
      // const messageColor = messageContent.User === user ? userColor : messageContent.Color;
      const messageColor = messageContent.Color;

      setMessageList(prevMessages => groupMessages({ ...messageContent, messageColor}, prevMessages));

      // // log the amount of time it took for a message to be sent and received back on the frontend
      // const endTime = performance.now();
      // const duration = endTime - startTimeRef.current;
      // console.log(`Send/receive speed of current client's last message: ${duration}ms`)

      // check if the scrollbar is at the bottom after the message is added
      if(isNearBottom()) {
        lobbyRef.current.scrollTop = lobbyRef.current.scrollHeight;
      } else {
        setNewMessagesButton(true);
      }
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

  const handleNewMessageScroll = useMemo(() => {
    return () => {
      if(isNearBottom()) {
        setNewMessagesButton(false);
      }
    }
  }, [setNewMessagesButton]);

  useEffect(() => {
    if(lobbyRef.current) {
      lobbyRef.current.addEventListener("scroll", handleNewMessageScroll);

      return () => {
        // need to check lobbyRef once more to make sure it is necessary to remove the reference during unmounting
        if(lobbyRef.current) {
          lobbyRef.current.removeEventListener("scroll", handleNewMessageScroll);
        }
      };
    }
  }, [handleNewMessageScroll, lobbyRef]);

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
          <button className='settings' onClick={() => setSettingsModalOpen(true)}>
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
        <div className='lobby-body' ref={lobbyRef}>
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
                  <p className='user' style={{ color: messageContent.messageColor }}>{messageContent.User}</p>
                  <p className='time'>{`${messageContent.FormattedTime}`}</p>
                </div>
                <div className='message-content'>
                  {messageContent.Content}
                </div>
              </div>
            );
          })}
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
        {newMessagesButton && (
            <button
              className={`new-messages ${newMessagesButton ? 'visible' : ''}`}
              onClick={() => {
                if (lobbyRef.current) {
                  lobbyRef.current.scrollTop = lobbyRef.current.scrollHeight;
                  setNewMessagesButton(false);
                }
              }}
            >
              ↓ New Messages ↓
            </button>
          )}
          { disconnected && (
            <div className='disconnected'>
              <p> DISCONNECTED... </p>
            </div>
          )}
      </div>
    </div>
  );
};

export default Lobby;