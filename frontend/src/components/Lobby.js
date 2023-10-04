import React, { useEffect, useState, useRef } from 'react';

const Lobby = ({ socket, user, lobby, receivedMessages }) => {
  const [message, setMessage] = useState('');
  const [messageList, setMessageList] = useState([]);
  const lobbyRef = useRef(null);


  const sendMessage = async () => {
    if(message !== '') {
      const messageContent = {
        lobby: lobby,
        user: user,
        message: message,
        time: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
      };
      await socket.current.send(JSON.stringify(messageContent));
      // prepare a message to be appended to the message list
      setMessage('');
    }
  };

  useEffect(() => {
    socket.current.addEventListener('message', (e) => {
      const messageContent = JSON.parse(e.data);

      const isCurrentUser = messageContent.user === user || messageContent.userID === userID;
      setMessageList((list) => [...list, { ...messageContent, isCurrentUser }]);

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
            return (
              <div className={`message ${messageContent.sender === 'current-user' ? 'message-cr' : 'message-cl'}`} key={index}>
                <div className='message-c'>
                  <p>{messageContent.message}</p>
                </div>
                <div className='message-info'>
                  <p className='user'>{`sent by ${messageContent.user} at:`}</p>
                  <p className='time'>{messageContent.time}</p>
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