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

const Welcome = ({ connectWebSocket, loading, setLoading, action, setAction, user, setUser, setUserColor, lobby, setLobby, muted, setMuted, playDenied }) => {
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
    let loadingTimeout;
    try {
      if(user !== "" && lobby !== "") {
        if(user.length <= 20 || lobby.length <= 20) {
          loadingTimeout = setTimeout(() => setLoading(true), 50);

          // simulate a delay in the enter operation for testing
          // await new Promise(resolve => setTimeout(resolve, 3500));

          // console.log('Attempting to join lobby...')
          // set user color for the lobby
          const generatedAvatar = minidenticon(user, '90', '55')
          const match = /fill="([^"]+)"/.exec(generatedAvatar);
          const extractedColor = match ? match[1] : 'defaultColor';
          setUserColor(extractedColor);

          // connect WebSocket when the user tries to join a lobby
          // console.log(`before connectWebSocket invocation ${action}`)
          await connectWebSocket();
          setLoading(false);
          playEnter();
          // then switch display to lobby
          // setJoinError(false);
          applyShift();
          navigate('/lobby');
        }
      } else {
        // slight wait to emulate ping to server
        setTimeout(() => {
          handleJoinError();
        }, 30)
      }
    } catch (error) {
      if(error.status === 404) {
        // do something other than just logging when an intended error occurs
        handleJoinError(error.message);
      } else {
        // log unexpected errors
        handleJoinError('Error joining lobby: ' + error.message)
      }
    } finally {
      clearTimeout(loadingTimeout);
      setLoading(false);
    }
  }

  const handleJoinError = (message = null) => {
    setLoading(false);
    setJoinError(true);
    if(message) {
      console.error(message);
    }
    if(!muted) {
      playDenied();
    }
    setTimeout(() => {
      setJoinError(false);
    }, 100);
  }

  const toggleMute = () => {
    setMuted((prevMuted) => !prevMuted);
    // stop sounds whether muting or unmuting
    stop();
    if(muted) {
      playClick();
    }
  }

  // pass as a JSX property to prevent Enter key from performing unwanted effects
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
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
          <p className='subtitle'> Chat with friends throughout the galaxy! </p>
          <button className='info' onMouseDown={() => openInfo()}>
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
                onKeyDown={handleKeyDown}
                placeholder='pilot'
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
                onKeyDown={handleKeyDown}
                placeholder='terra incognita'
                maxLength={maxLength}
              />
            </div>
            <div className='action-buttons'>
              <button className={'create' + `${action === 'create' ? ' selected' : ''}`} onMouseDown={() => handleActionSelect('create')}>CREATE</button>
              <button className={'join' + `${action === 'join' ? ' selected' : ''}`} onMouseDown={() => handleActionSelect('join')}>JOIN</button>
            </div>
          </div>
          <div className='app-enter-container'>
            { loading ? (
              <div className={`lds-ellipsis` + `${action === 'join' ? ' lj' : ' lc'}`}><div></div><div></div><div></div><div></div></div>
            ): (
              <button className={`app-enter ${joinError ? 'error' : ''}`} onMouseDown={joinLobby}>ENTER</button>
            )}
            <button className='toggle-mute' onMouseDown={toggleMute}>
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