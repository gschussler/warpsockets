import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/lobby.scss';
import Settings from './Settings.jsx';
import useSound from 'use-sound';
import Send from '../sounds/zap.mp3';
import leaveSvg from '../images/leave.svg';
import settingsSvg from '../images/settings.svg'
import { MinidenticonImg } from './utils.js';
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

const Lobby = ({ socket, user, userColor, lobby, setLobby, setUser, muted, setMuted }) => {
  const [message, setMessage] = useState('');
  const [messageList, setMessageList] = useState([]);
  const [newMessagesButton, setNewMessagesButton] = useState(false);
  const [hovered, setHovered] = useState(false);
  const lobbyRef = useRef(null);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [playSend] = useSound(Send, {volume: muted ? 0: 0.05});
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
      console.log(`${socket.current.readyState}`);
    }
    setUser('');
    setLobby('');
    navigate('/');
  }


  /**
   * Sends a message via WebSocket connection to the server
   * @returns {void}
   */
  const sendMessage = async () => {
    // // captures time of process client-side; used to get duration of sending and receiving a message
    // startTimeRef.current  = performance.now();
    if(message !== '') {
      const messageContent = {
        lobby: lobby,
        user: user,
        content: message,
        color: userColor
      };
      await socket.current.send(JSON.stringify(messageContent));
      playSend();

      // prepare a message to be appended to the message list
      setMessage('');
      // return input box to original height
      if(textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  /**
   * 
   * @param {React.MutableRefObject} ref - Reference to the lobby container.
   * @returns {React.MutableRefObject} - Reference to whether the scrollbar is at the bottom of the container.
   */

  const useScrollToBottom = (ref) => {
    const isAtBottomRef = useRef(true);

    useEffect(() => {
      const handleScroll = () => {
        const { scrollTop, scrollHeight, clientHeight } = ref.current;
        // added num represents minimum height of a single message
        const isAtBottom = scrollHeight - scrollTop <= clientHeight + 5;
        isAtBottomRef.current = isAtBottom;
      }
    
      if(ref.current) {
        ref.current.addEventListener('scroll', handleScroll);
      }

      return () => {
        if(ref.current) {
          ref.current.removeEventListener('scroll', handleScroll);
        }
      };
    }, [ref]);

    return isAtBottomRef;
  };

  const isAtBottomRef = useScrollToBottom(lobbyRef);

  // TIME is set up on the backend, figure out proper order of parsing here (current user message vs existing message)
  useEffect(() => {
    const handleMessage = (e) => {
      // receive incoming message(s) -- can receive from backend in different order need to fix
      let messageContent = JSON.parse(e.data);

      // check if current user sent the message being handled
      const messageColor = messageContent.User === user ? userColor : messageContent.Color;

      /* 
      When setting the message list, check if the last sent message was from the same user (also the timestamp).
        - If from the same user AND sent in the same minute, append the new message to the previous message, with a new line in between.
        - Otherwise, the message is from a different user OR sent by the same user in a different minute. Append message to the list as normal
      */
      setMessageList((list) => {
        const lastMessage = list[list.length - 1];
        if(lastMessage && lastMessage.User === messageContent.User) {

          const isNewMessageGroup = lastMessage.FormattedTime !== messageContent.FormattedTime;
          if(isNewMessageGroup) {
            // messages have not been sent within the same minute, send with new message-info
            return [...list, { ...messageContent, messageColor }];
          } else {
            // messages have been sent in the same minute, only update messageContent.Content for the current message
            return [
              ...list.slice(0, list.length - 1),
              {
                ...lastMessage,
                Content: `${lastMessage.Content}\n${messageContent.Content}`,
              },
            ];
          }
        } else {
          // if the last message was sent by a different user, or there was not one previously; add as normal
          return [...list, { ...messageContent, messageColor }]
        }
      });

      // // log the amount of time it took for a message to be sent and received back on the frontend
      // const endTime = performance.now();
      // const duration = endTime - startTimeRef.current;
      // console.log(`Send/receive speed of current client's last message: ${duration}ms`)

      // check if the scrollbar is at the bottom after the message is added
      if(isAtBottomRef.current) {
        lobbyRef.current.scrollTop = lobbyRef.current.scrollHeight;
      } else {
        setNewMessagesButton(true);
      }
    };

    if (socket.current) {
      console.log("WebSocket state in Lobby: ", socket.current.readyState);
      socket.current.addEventListener('message', handleMessage);

      return () => {
        socket.current.removeEventListener('message', handleMessage);
        socket.current.close();
      };
    }
  }, [socket, isAtBottomRef]);

  const handleNewMessageScroll = useMemo(() => {
    return () => {
      const isScrolledToBottom = lobbyRef.current.scrollHeight - lobbyRef.current.scrollTop <= lobbyRef.current.clientHeight + 100;

      if(isScrolledToBottom) {
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
  }, [handleNewMessageScroll, lobbyRef, isAtBottomRef]);

  return (
    <div className='lobby'>
      <div className='lobby-h'>
        <p className='lobby-welcome'>lobby: {lobby}</p>
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
      </div>
    </div>
  );
};

export default Lobby;