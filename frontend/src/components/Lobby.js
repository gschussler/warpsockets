import React, { useEffect, useState, useRef } from 'react';
import leaveSvg from "../images/leave.svg";

// custom hook to determine whether scrollbar is at the bottom
const useScrollToBottom = (ref) => {
  const isAtBottomRef = useRef(true);

  const handleScroll = () => {
    const { scrollTop, scrollHeight, clientHeight } = ref.current;
    const isAtBottom = scrollHeight - scrollTop <= clientHeight + 5;
    isAtBottomRef.current = isAtBottom;
  }

  useEffect(() => {
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

const Lobby = ({ socket, user, lobby, userColor, setShowLobby }) => {
  const [message, setMessage] = useState('');
  const [messageList, setMessageList] = useState([]);
  const [newMessagesButton, setNewMessagesButton] = useState(false);
  const [hovered, setHovered] = useState(false);
  const lobbyRef = useRef(null);

  // handle users leaving the lobby
  const leaveLobby = async () => {
    if(socket.current) {
      await socket.current.close();
    }
    setShowLobby(false);
  }

  const sendMessage = async () => {
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
    }
  };

  const isAtBottomRef = useScrollToBottom(lobbyRef);

  // TIME is set up on the backend, figure out proper order of parsing here (current user message vs existing message)
  useEffect(() => {
    const handleMessage = (e) => {
      // receive incoming message(s) -- can receive from backend in different order need to fix
      let messageContent = JSON.parse(e.data);
      // console.log("received message: ", messageContent)
      // case if current user is the one who sent the message
      const isCurrentUser = messageContent.User === user;

      const messageColor = isCurrentUser ? userColor : messageContent.Color;

      setMessageList((list) => [...list, { ...messageContent, isCurrentUser, messageColor }]);
    
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

  useEffect(() => {
    const handleScroll = () => {
      const isScrolledToBottom = lobbyRef.current.scrollHeight - lobbyRef.current.scrollTop === lobbyRef.current.clientHeight;

      if(isScrolledToBottom) {
        setNewMessagesButton(false);
      }
    };

    if(lobbyRef.current) {
      lobbyRef.current.addEventListener("scroll", handleScroll);

      return () => {
        // need to check lobbyRef once more to make sure it is necessary to remove the reference during unmounting
        if(lobbyRef.current) {
          lobbyRef.current.removeEventListener("scroll", handleScroll);
        }
      };
    }
  }, [lobbyRef, isAtBottomRef]);

  return (
    <div className='lobby'>
      <div className='lobby-h'>
        <p className='welcome'>{lobby} lobby</p>
        <button 
            className="leave-lobby"
            onClick={leaveLobby}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
          >
            <img src={leaveSvg} alt='Leave' />
          </button>
      </div>
      <div className='lobby-content'>
        <div className='lobby-body' ref={lobbyRef}>
          <div className='message-list'>
          {messageList.slice().reverse().map((messageContent, index) => {
            const isCurrentUser = messageContent.User === user;
            return (
              <div 
                className={`message ${isCurrentUser ? 'message-cr' : 'message-cl'}`}
                key={index}
              >
                <div className='message-c'>
                  <p>{messageContent.Content}</p>
                </div>
                <div className='message-info'>
                  <p className='user' style={{ color: messageContent.messageColor}}>{messageContent.User}</p>
                  <p className='time'>{`at: ${messageContent.FormattedTime}`}</p>
                </div>
              </div>
            );
          })}
          </div>
        </div>
        <div className='lobby-footer'>
          <div className='user-avatar' style={{ backgroundColor: userColor }}></div>
          <input
            className='text-input'
            type='text'
            placeholder='Send a message...'
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
            }}
            onKeyDown={(e) => {
              if(e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
          />
          <button className='send' onClick={sendMessage}>
            Send
          </button>
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
    </div>
  );
};

export default Lobby;