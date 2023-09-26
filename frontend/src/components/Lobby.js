import React, { useEffect, useState } from 'react';

const Lobby = ({ socket, user, lobby, receivedMessages }) => {
  const [message, setMessage] = useState('');
  const [messageList, setMessageList] = useState([]);

  const sendMessage = async () => {
    if(message !== '') {
      const messageContent = {
        lobby: lobby,
        user: user,
        message: message,
        time: new Date(Date.now()).getHours() + ':' + new Date(Date.now()).getMinutes(),
      };
      await socket.current.send(JSON.stringify(messageContent));
      setMessageList((list) => [...list, messageContent]);
    }
  };

  useEffect(() => {
    setMessageList((list) => [...list, ...receivedMessages]);
  }, [receivedMessages]);

  return (
    <div className='lobby'>
      <div className='lobby-h'>
        <p className='welcome'>You are in the {lobby} lobby, let's goooo.</p>
      </div>
      <div className='lobby-body'>
        {messageList.map((messageContent, index) => {
          return (
            <div className='message' key={index}>
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
      <div className='lobby-footer'>
        <input
          className='text-input'
          type='text'
          placeholder='Send a message...'
          value={message}
          onChange={(e) => {
            setMessage(e.target.value);
          }}
        />
        <button className='send' onClick={sendMessage}>
          Send
        </button>
      </div>
    </div>
  );
};

export default Lobby;