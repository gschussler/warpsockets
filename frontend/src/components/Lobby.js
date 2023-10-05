import React, { useEffect, useState, useRef } from 'react';

const Lobby = ({ socket, user, lobby }) => {
  const [message, setMessage] = useState('');
  const [messageList, setMessageList] = useState([]);
  const lobbyRef = useRef(null);


  const sendMessage = async () => {
    if(message !== '') {
      const messageContent = {
        lobby: lobby,
        user: user,
        content: message,
        time: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
      };
      await socket.current.send(JSON.stringify(messageContent));
      // prepare a message to be appended to the message list
      setMessage('');
    }
  };

  useEffect(() => {
    socket.current.addEventListener('message', (e) => {
      // receive incoming message(s) -- can receive from backend in different order need to fix
      let messageContent = JSON.parse(e.data);
      console.log("received message: ", messageContent)

      // 'Content' is only a property in existing messages in Redis db
      if(messageContent.Content) {
        //additional parse unfortunately
        messageContent = JSON.parse(messageContent.Content)
        // 'User' also unique to existing messages
        const isCurrentUser = messageContent.User === user;
        // insert newest of the existing messages first to maintain normal order
        setMessageList((list) => [{ ...messageContent, isCurrentUser }, ...list]);
      } else {
        // case if current user is the one who sent the message
        const isCurrentUser = messageContent.user === user;
        setMessageList((list) => [...list, { ...messageContent, isCurrentUser }]);
      }

      if(lobbyRef.current) {
        lobbyRef.current.scrollTop = lobbyRef.current.scrollHeight;
      }
    });
  }, [socket]);

  return (
    <div className='lobby'>
      <div className='lobby-h'>
        <p className='welcome'>You are in the {lobby} lobby, let's goooo.</p>
      </div>
      <div className='lobby-content'>
        <div className='lobby-body' ref={lobbyRef}>
          <div className='message-list'>
          {messageList.slice().reverse().map((messageContent, index) => {
            const isCurrentUser = messageContent.user === user;
            return (
              <div 
                className={`message ${isCurrentUser ? 'message-cr' : 'message-cl'}`}
                key={index}
              >
                <div className='message-c'>
                  <p>{messageContent.content}</p>
                </div>
                <div className='message-info'>
                  <p className='user'>{messageContent.user || messageContent.User}</p>
                  <p className='time'>{`at: ${messageContent.time}`}</p>
                </div>
              </div>
            );
          })}
          </div>
        </div>
        <div className='lobby-footer'>
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