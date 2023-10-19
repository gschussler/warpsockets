import React, { useEffect, useState, useRef } from 'react';

const Lobby = ({ socket, user, lobby, userColor }) => {
  const [message, setMessage] = useState('');
  const [messageList, setMessageList] = useState([]);
  const [scrollAtBottom, setScrollAtBottom] = useState(true);
  const [newMessagesButton, setNewMessagesButton] = useState(false);
  const lobbyRef = useRef(null);

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


  // TIME is set up on the backend, figure out proper order of parsing here (current user message vs existing message)
  useEffect(() => {
    socket.current.addEventListener('message', (e) => {
      // receive incoming message(s) -- can receive from backend in different order need to fix
      let messageContent = JSON.parse(e.data);
      // console.log("received message: ", messageContent)
      // case if current user is the one who sent the message
      const isCurrentUser = messageContent.User === user;

      const messageColor = isCurrentUser ? userColor : messageContent.Color;

      setMessageList((list) => [...list, { ...messageContent, isCurrentUser, messageColor }]);
    
      // check if the scrollbar is at the bottom after the message is added
      if(lobbyRef.current) {
        //scrollbar gets smaller as it goes, must account for this in scrollbar calculation with a buffer
        const buff = 5;
        const isScrolledToBottom = lobbyRef.current.scrollHeight - lobbyRef.current.scrollTop <= lobbyRef.current.clientHeight + buff;
        setScrollAtBottom(isScrolledToBottom);

        // if not at the bottom, show the "New Messages" button
        if(isScrolledToBottom) {
          lobbyRef.current.scrollTop = lobbyRef.current.scrollHeight;
        } else {
          setNewMessagesButton(true);
        }
      }
    });
  }, [socket]);
// Add this useEffect block to your Lobby component
useEffect(() => {
  if (lobbyRef.current) {
    const handleScroll = () => {
      const isScrolledToBottom =
        lobbyRef.current.scrollHeight - lobbyRef.current.scrollTop === lobbyRef.current.clientHeight;
      setScrollAtBottom(isScrolledToBottom);

      // If the user is at the bottom, hide the "New Messages" button
      if (isScrolledToBottom) {
        setNewMessagesButton(false);
      }
    };

    lobbyRef.current.addEventListener("scroll", handleScroll);

    return () => {
      lobbyRef.current.removeEventListener("scroll", handleScroll);
    };
  }
}, [lobbyRef]);

  return (
    <div className='lobby'>
      <div className='lobby-h'>
        <p className='welcome'>You are in the {lobby} lobby, let's goooo.</p>
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
        </div>
      </div>
    </div>
  );
};

export default Lobby;