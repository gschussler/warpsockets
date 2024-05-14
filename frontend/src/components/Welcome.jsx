/**
 * Landing page component.
 * @module Welcome
 */

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/welcome.scss';
import '../styles/info.scss';
import { minidenticon } from 'minidenticons';
import { MinidenticonImg, applyShift } from './utils.js';
import Info from './Info.jsx';
import useSound from 'use-sound';
import Enter from '../sounds/wrgEnter3_short.mp3';
import Click from '../sounds/mouse-click.mp3';
import soundOff from '../images/sound-off.svg';
import soundOn from '../images/sound-on.svg';
import logoL from '../images/astronaut-galaxy-l.svg'
import logoR from '../images/astronaut-galaxy-r.svg'
import infoSH from '../images/question-mark.svg'

/**
 * Handles client information state and other interactions with the landing page.
 * @returns {JSX.Element} Rendered Welcome component.
 */

const Welcome = ({ connectWebSocket, action, setAction, user, setUser, setUserColor, lobby, setLobby, muted, setMuted, playDenied }) => {
  const [infoModalOpen, setInfoModalOpen] = useState(false);
  const [playEnter] = useSound(Enter, {volume: muted ? 0: 0.1});
  const [playClick] = useSound(Click, {volume: muted ? 0: 0.2});
  const [joinError, setJoinError] = useState(false);
  const maxLength = 20;
  const navigate = useNavigate();

  const handleActionSelect = (actionName) => {
    if(actionName !== action) {
      setAction(actionName);
    }
  }

  const openInfo = () => {
    setInfoModalOpen(true);
  }

  const joinLobby = async (e) => {
    if(user !== "" && lobby !== "") {
      if(user.length > 20 || lobby.length > 20) {
        setJoinError(true);
        console.error(`Not sure how you've done it, but username and lobby name should be 20 characters or less.`)
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
        // console.log(`before connectWebSocket invocation ${action}`)
        await connectWebSocket();
        playEnter();
        // then switch display to lobby
        setJoinError(false);
        applyShift();
        navigate('/lobby');
      } catch (error) {
        // should log the error from server if connectWebSocket is what fails
        console.error('Error joining lobby:', error.message);
        setJoinError(true);
        if(!muted) {
          playDenied();
        }
      }
    } else {
      // reset button back to normal state. need a delay because this is called immediately after setButtonClicked(true)
      setJoinError(true);
      if(!muted) {
        playDenied();
      }
    }
    setTimeout(() => {
      setJoinError(false);
    }, 100);
  };

  const toggleMute = () => {
    setMuted((prevMuted) => !prevMuted);
    // stop sounds whether muting or unmuting
    stop();
    if(muted) {
      playClick();
    }
  }

  // // 'Enter' should only be used for trying to enter a lobby
  // useEffect(() => {
  //   const handleKeyPress = (e) => {
  //     if(e && e.key === 'Enter') {
  //       e.preventDefault();
  //       joinLobby();
  //     }
  //   };

  //   document.addEventListener('keypress', handleKeyPress);

  //   return () => {
  //     document.removeEventListener('keypress', handleKeyPress);
  //   };
  // }, [joinLobby])

  return (
    <div className='Welcome'>
      <div className='welcome-container'>
        <div className='app-h'>
          <img src={logoL} className='logo-l' />
          <h3 className='title'>WarpSockets</h3>
          <img src={logoR} className='logo-r' />
        </div>
        <div className={'app-sh' + `${action === 'join' ? ' ijoin' : ' icreate'}`}>
          <p className='subtitle'> Connect with friends throughout the galaxy! </p>
          <button className='info' onClick={() => openInfo()}>
            <img src={infoSH} alt='info' />
          </button>
          {infoModalOpen && (
            <div className='modal-overlay'>
              <Info closeModal={() => setInfoModalOpen(false)} />
            </div>
          )}
        </div>
        <div className={'app-input' + `${action === 'join' ? ' ijoin' : ' icreate'}`}>
          <div className='app-user'>
            <div className='container-user'>
              <p className='label-user'>user</p>
              <textarea
                className='app-textarea'
                value={user}
                onChange={(e) => setUser(e.target.value)}
                placeholder='Enter your username...'
                maxLength={maxLength}
              />
            </div>
            <MinidenticonImg
              style={{ visibility: user !== '' ? 'visible' : 'hidden'}}
              className="app-avatar"
              username={user}
              saturation="90"
              lightness="55"
            />
          </div>
          <div className='app-lobby'>
            <div className='container-lobby'>
              <p className='label-lobby'>lobby</p>
              <textarea
                className='app-textarea'
                value={lobby}
                onChange={(e) => setLobby(e.target.value)}
                placeholder='Enter a lobby name...'
                maxLength={maxLength}
              />
            </div>
            <div className='action-buttons'>
              <button className={'create' + `${action === 'create' ? ' selected' : ''}`} onClick={() => handleActionSelect('create')}>CREATE</button>
              <button className={'join' + `${action === 'join' ? ' selected' : ''}`} onClick={() => handleActionSelect('join')}>JOIN</button>
            </div>
          </div>
          <div className='app-enter-container'>
            <button className={`app-enter ${joinError ? 'error' : ''}`} onClick={joinLobby}>ENTER</button>
            <button className='toggle-mute' onClick={toggleMute}>
              <img
                src={muted ? soundOff : soundOn}
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