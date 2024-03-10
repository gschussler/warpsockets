import React, { useEffect, useState, useRef, useMemo } from 'react';
import Settings from './Settings';
import leaveSvg from '../images/leave.svg';
import settingsSvg from '../images/settings.svg'
import { MinidenticonImg } from './App';
import { ExpandingTextarea } from './TextInput';

// custom hook to determine whether scrollbar is at the bottom, then stick to bottom if in range
const useScrollToBottom = (ref) => {
  const isAtBottomRef = useRef(true);
  useEffect(() => {
    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = ref.current;
      // added num represents minimum height of a single message
      const isAtBottom = scrollHeight - scrollTop <= clientHeight + 100;
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
}

const Lobby = ({ socket, user, userColor, setLobby, lobby, setShowLobby, setUser }) => {
  const [message, setMessage] = useState('');
  const [messageList, setMessageList] = useState([]);
  const [newMessagesButton, setNewMessagesButton] = useState(false);
  const [hovered, setHovered] = useState(false);
  const lobbyRef = useRef(null);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const textareaRef = useRef(null);
  // const startTimeRef = useRef(null);

  // handle users leaving the lobby
  const leaveLobby = async () => {
    if(socket.current) {
      await socket.current.close();
    }
    setUser('');
    setLobby('');
    setShowLobby(false);
  }

  const sendMessage = async () => {
    // startTimeRef.current  = performance.now(); // captures time of process; used to get duration of sending and receiving a message
    if(message !== '') {
      const messageContent = {
        lobby: lobby,
        user: user,
        content: message,
        color: userColor
      };
      await socket.current.send(JSON.stringify(messageContent));

      // prepare a message to be appended to the message list
      setMessage('');
      if(textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const isAtBottomRef = useScrollToBottom(lobbyRef);

  // TIME is set up on the backend, figure out proper order of parsing here (current user message vs existing message)
  useEffect(() => {
    const handleMessage = (e) => {
      // receive incoming message(s) -- can receive from backend in different order need to fix
      let messageContent = JSON.parse(e.data);

      // check if current user sent the message being handled
      const messageColor = messageContent.User === user ? userColor : messageContent.Color;

      setMessageList((list) => [...list, { ...messageContent, messageColor }]);

      // // log the amount of time it took for a message to be sent and received back on the frontend
      // const endTime = performance.now();
      // const duration = endTime - startTimeRef.current;
      // console.log(`Sending and handling took ${duration}`)

      // check if the scrollbar is at the bottom after the message is added
      if(isAtBottomRef.current) {
        lobbyRef.current.scrollTop = lobbyRef.current.scrollHeight + 5;
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
        <p className='welcome'>lobby: {lobby}</p>
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
            const isSystemMessage = messageContent.User === "System";
            const messageClass = messageContent.User === user ? 'message message-cr'
            : isSystemMessage ? 'system-message'
            : 'message message-cl';

            return (
              <div 
                className={messageClass}
                key={index}
              >
                <div className='message-c'>
                  <p>{messageContent.Content}</p>
                </div>
                <div className='message-info'>
                  <p className='user' style={{ color: messageContent.messageColor }}>{messageContent.User}</p>
                  <p className='time'>{`at: ${messageContent.FormattedTime}`}</p>
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
              if(e.key === 'Enter' && !e.shiftKey) {
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