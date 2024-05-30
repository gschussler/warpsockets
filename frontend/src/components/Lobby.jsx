import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/lobby.scss';
import '../styles/settings.scss';
import Settings from './Settings.jsx';
import useSound from 'use-sound';
import Leave from '../sounds/wrgExit2_short.mp3';
import Send from '../sounds/zap.mp3';
import Cog from '../sounds/cog.mp3';
import usersSvg from '../images/friends.svg';
import leaveSvg from '../images/leave.svg';
import settingsSvg from '../images/settings.svg';
import astronautSvg from '../images/astronaut.svg';
import { generateAvatarAndColor, groupMessages } from './utils.js';
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

const Lobby = ({ socket, user, userColor, lobby, setLobby, setUser, muted, setMuted, playDenied, playNormal }) => {
  const [message, setMessage] = useState('');
  const [messageList, setMessageList] = useState([]);
  const [userList, setUserList] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [newMessages, setNewMessages] = useState(false);
  const [disconnected, setDisconnected] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [playSend] = useSound(Send, {volume: muted ? 0: 0.05});
  const [playCog] = useSound(Cog, {volume: muted ? 0: 0.02});
  const [playLeave] = useSound(Leave, {volume: muted ? 0: 0.1});
  const dropdownRef = useRef(null);
  const textareaRef = useRef(null);
  const lobbyBodyRef = useRef(null);
  const lastMessage = useRef(null);
  const navigate = useNavigate();
  // const startTimeRef = useRef(null);

  // toggle userlist dropdown visibility
  const toggleUserList = () => {
    setShowDropdown(prevShowDropdown => !prevShowDropdown);
    playNormal();
  };

  const openSettings = () => {
    setSettingsModalOpen(true);
    playCog();
  }

  /**
   * Leaves the lobby and initiates WebSocket closure.
   * @returns {void}
   */
  const leaveLobby = async () => {
    if(socket.current) {
      await socket.current.close(1000, "client left lobby using intended functionality");
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
        // remove leading or trailing whitespace
        const trimmedMessage = message.trim();
        if(trimmedMessage.length > 0) {
          const messageContent = {
            lobby: lobby,
            user: user,
            content: trimmedMessage,
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
            try {
              // send the message to the server
              await socket.current.send(JSON.stringify(messageContent));

              // add message to message list immediately for the sender
                // currently message property key labels are hardcoded to match server-side Message struct properties
              setMessageList(prevMessages => groupMessages({ ...messageContent, User: user, Content: trimmedMessage, Color: userColor, FormattedTime: formattedTime(date) }, prevMessages));

              playSend();
              setMessage('');
              // resize input box to original height
              textareaRef.current.style.height = 'auto';
              // scroll to the bottom of the lobby-body after the message is sent
              // DOM changes are barely too slow, setTimeout to add a few ms for React to reflect changes (consider a more exact solution).
              setTimeout(() => {
                if(lobbyBodyRef.current) {
                  lobbyBodyRef.current.scrollTo(0, 1);
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
      }
      playDenied();
      return
    } else {
      setMessage('');
      playDenied();
      return;
    }
  };

  /**
   * Tracks updates to the y-position of the scroll wheel in order to remove the new messages button upon manually
   * scrolling to the bottom of the message list.
   * @returns {void}
   */
  useEffect(() => {
    // add scroll event listener that removes the new messages button from display if a user scrolls near the bottom of the container. at the same time, the scroll wheel snaps to the bottom of the container
    const handleScroll = () => {
      if(lobbyBodyRef.current !== null) {
        const { scrollTop } = lobbyBodyRef.current;
        // scrollTop is 0 on page load but 0.5 when a user manually scrolls to the bottom. there is no case where the user would not be fully up to date with messages between the value of 0 and 0.5, so >= is fine
        if(scrollTop >= 0) {
          setNewMessages(false);
        }
      }
    }

    lobbyBodyRef.current.addEventListener('scroll', handleScroll);

    return () => {
      // built-in useEffect cleanup logic should handle removal, but this is good practice 
      if(lobbyBodyRef.current) {
        lobbyBodyRef.current.removeEventListener('scroll', handleScroll);
      }
    };
  }, []);

  // close the userList dropdown if clicking outside of it
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  /**
   * Listens for actions sent from the server such as a user message or the current WebSocket's connection/
   * disconnection state update.
   * @returns {void}
   */
  useEffect(() => {
    /**
     * Handles incoming messages from server.
     * - Broadcasted message is parsed and grouped based on user identity and timestamp.
     * - Message is then appended to messageList.
     * - New messages button is displayed or not based on scroll wheel position.
     * @param {MessageEvent} e - The event containing the incoming message data from server.
     * @returns {void}
     */
    const handleMessage = (e) => {
      // receive incoming message(s) -- can receive from backend in different order need to fix
      let messageContent = JSON.parse(e.data);
      // console.log(messageContent);

      // system messages send either an "arrived" or "departed" type along with the associated user,
      // add the user to the userList
      if(messageContent.Type) {
        // extract the two strings sent on the Type property
        const [action, sentUser] = messageContent.Type;
        // manipulate userList based on user arrival or departure
        if(action === "arrived") {
          setUserList((prevList) => [...prevList, sentUser])
        } else if(action === "departed") {
          setUserList((prevList) => prevList.filter(user => user !== sentUser))
        }
      }

      setMessageList(prevMessages => groupMessages(messageContent, prevMessages));

      //! new messages logic remains flawed --> useRef solves most problems with changing div dimensions
      // scroll logic has greatly improved with more knowledge of the scrollwheel and div calculations.
        // due to lobby-body rendering child divs in column-reverse order, the visual "bottom" of the div (or highest possible value) is actually...1 (scrollTop === 0 on page load, and setting scrollTo to Infinity ends up at 0).
        // if the user manually scrolls to the "bottom" of the container: scrollTop === 1
      if(lobbyBodyRef.current !== null) {
        const { scrollTop } = lobbyBodyRef.current;
        if(lastMessage.current) {
          // console.log(lastMessage.current.scrollHeight);
          // check if the scroll wheel is not at the bottom of the container nor within the range between the bottom and the height of the last sent message. 
            //! minor flaw: lastMessage.current is referencing the message sent one before the current one despite JSX logic targeting reversed messageList[0] as the React reference. (line 254)
          if(scrollTop !== 0 && scrollTop * -1 >= lastMessage.current.scrollHeight) {
            // // console.log(`returned true -- scrollT: ${scrollTop} lMsH: ${lastMessage.current.scrollHeight}`)
            setNewMessages(true);
          } else {
            // // console.log(`returned false -- scrollT: ${scrollTop} lMsH: ${lastMessage.current.scrollHeight}`)
            setNewMessages(false);
            lobbyBodyRef.current.scrollTo(0, 1);
          }
        }
      }

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
        socket.current.close(1000, "OK - client closed the application with browser functionality");
      };
    }
  }, [socket]);

  return (
    <div className='lobby'>
      <div className='lobby-h'>
        <p className='lobby-title'>{lobby}</p>
        <div className='buttons-container-h'>
          <button className={'users' + `${showDropdown ? ' selected' : ''}`}
            onMouseDown={(e) => {e.stopPropagation(); toggleUserList(); }}
            onKeyDown={(e) => {if(e.key === 'Enter') toggleUserList(); }}
          >
            <img src={usersSvg} alt='Users' />
          </button>
          <button className='settings'
            onMouseDown={openSettings}
            onKeyDown={(e) => {if(e.key === 'Enter') openSettings(); }}
          >
            <img src={settingsSvg} alt='Settings' />
          </button>
          <button 
            className="leave-lobby"
            onMouseDown={leaveLobby}
            onKeyDown={(e) => {if(e.key === 'Enter') leaveLobby(); }}
          >
            <img src={leaveSvg} alt='Leave' />
          </button>
        </div>
      </div>
      <div className='lobby-content'>
          {showDropdown && (
            <div ref={dropdownRef} className='dropdown'>
              <span className='dropdown-h'>Users</span>
              <ul className='user-list'>
                {userList.map((user, index) => {
                  const { avatar, color } = generateAvatarAndColor(user);
                  return (
                    <li key={index}>
                      <img className='user-avatar' src={`data:image/svg+xml;utf8,${encodeURIComponent(avatar)}`}
                        alt={user} style={{ marginRight: '8px'}} />
                      <span style={{ color }}>{user}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        <div className='lobby-body' ref={lobbyBodyRef}>
          <div className='message-list'>
            {messageList.slice().reverse().map((messageContent, index) => {
              // define message class based on who sent the message
              // determine if this is the last message to have been sent
              const isLastMessage = index === 0;
              return (
                <div
                  className={
                    messageContent.User === 'System' ? 'message system-message'
                    : messageContent.User === user ? 'message message-cr'
                    : 'message message-cl'
                  }
                  key={index}
                  // assign ref to the newest message in the list
                  ref={isLastMessage ? lastMessage : null}
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
      </div>
      <div className='lobby-footer'>
        <ExpandingTextarea
          textareaRef={textareaRef}
          value={message}
          onChange={(e) => {setMessage(e.target.value)}}
          onKeyDown={(e) => {
            if(e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              sendMessage();
            }
          }}
          maxLength={160}
        />
        <button className='send' onMouseDown={sendMessage} onKeyDown={(e) => {if(e.key === 'Enter') sendMessage()}}>
          SEND
        </button>
      </div>
      {newMessages && (
        <button
          className={`new-messages`}
          onClick={() => {
            if (lobbyBodyRef.current) {
              lobbyBodyRef.current.scrollTo(0, 1);
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
      {settingsModalOpen && (
        <div className='modal-overlay'>
          <Settings closeModal={() => setSettingsModalOpen(false)} />
        </div>
      )}      
    </div>
  );
};

export default Lobby;