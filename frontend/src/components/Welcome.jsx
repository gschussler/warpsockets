/**
 * Landing page component.
 * @module Welcome
 */

import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/welcome.scss';
import { minidenticon } from 'minidenticons';
import { MinidenticonImg } from './utils.js';
import useSound from 'use-sound';
import Enter from '../sounds/wheep-wheep.mp3';
import Click from '../sounds/mouse-click.mp3';
import mutedSVG from '../images/muted.svg';
import unmutedSVG from '../images/unmuted.svg';

/**
 * Handles client information state and other interactions with the landing page.
 * @returns {JSX.Element} Rendered Welcome component.
 */

const Welcome = ({ connectWebSocket, user, setUser, setUserColor, lobby, setLobby, muted, setMuted, setButtonClicked, buttonClicked, playDenied }) => {
  const [playEnter] = useSound(Enter, {volume: muted ? 0: 0.1});
  const [playClick] = useSound(Click, {volume: muted ? 0: 0.2});
  const maxLength = 16;
  const navigate = useNavigate();

  const joinLobby = async (e) => {
    setButtonClicked(true);
    if(user !== "" && lobby !== "") {
      if(user.length > 16 || lobby.length > 16) {
        console.error('Username and lobby name should be 16 characters or less.')
        return;
      }
      try {
        // console.log('Attempting to join lobby...')
        // set user color for the lobby
        const generatedAvatar = minidenticon(user, '90', '55')
        const match = /fill="([^"]+)"/.exec(generatedAvatar);
        const extractedColor = match ? match[1] : 'defaultColor';
        setUserColor(extractedColor);
        // connect WebSocket when the user joins a lobby
        await connectWebSocket();
        playEnter();
        // then switch display to lobby
        setButtonClicked(false);
        navigate('/lobby');
      } catch (error) {
        console.error('Error joining lobby:', error.message);
      }
    } else {
      // reset button back to normal state. need a delay because this is called immediately after setButtonClicked(true)
      setTimeout(() => {
        setButtonClicked(false);
      }, 100);

      playDenied();
    }
  };

  const toggleMute = () => {
    setMuted((prevMuted) => !prevMuted);
    // stop sounds whether muting or unmuting
    stop();
    if(muted) {
      playClick();
    }
  }

  // 'Enter' should only be used for trying to enter a lobby
  useEffect(() => {
    const handleKeyPress = (e) => {
      if(e && e.key === 'Enter') {
        e.preventDefault();
        joinLobby();
      }
    };

    document.addEventListener('keypress', handleKeyPress);

    return () => {
      document.removeEventListener('keypress', handleKeyPress);
    };
  }, [joinLobby])

  return (
    <div className='Welcome'>
      <div className='welcome-container'>
        <h1 className='app-h'>WarpSockets</h1>
        <h3 className='app-sh'>create or join a lobby.</h3>
        <div className='app-input'>
          <div className='app-user'>
            <p className='no-select'>Username:</p>
            <textarea
              className='app-textarea'
              value={user}
              onChange={(e) => setUser(e.target.value)}
              placeholder='Choose your username!'
              maxLength={maxLength}
            />
          </div>
          <div className='app-lobby'>
            <p className='no-select'>Lobby Name:</p>
            <textarea
              className='app-textarea'
              value={lobby}
              onChange={(e) => setLobby(e.target.value)}
              placeholder='Create or join a lobby!'
              maxLength={maxLength}
            />
          </div>
          <div className='app-enter-container'>
            <MinidenticonImg
              style={{ visibility: user !== '' ? 'visible' : 'hidden'}}
              className="app-avatar"
              username={user}
              saturation="90"
              lightness="55"
            />
            <button className={`app-enter ${buttonClicked && (user === '' || lobby === '') ? 'error' : ''}`} onClick={joinLobby}>ENTER</button>
            <button className='toggle-mute' onClick={toggleMute}>
              <img
                src={muted ? mutedSVG : unmutedSVG}
                alt={muted ? 'Unmute' : 'Mute'}
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
};

export default Welcome;