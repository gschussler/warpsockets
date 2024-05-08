import React from 'react';
import Return from '../images/return.svg'

const Info = ({ closeModal }) => {
  return (
    <div className='info-modal'>
      <div className='info-header'>
        <h2>ENGINEER'S LOG</h2>
        <p>Greetings, pilot.</p>
        <button className='info-close' onClick={closeModal}>
          <img src={Return} alt='Close' />
        </button>
      </div>
      <div className='info-body'>
        <p>
          The following are instructions for usage concerning <span className='bold-info-text'>WarpSockets</span>... <br />
          <br />
          <span className="small-info-text">
            1. Provide a <span className='bold-info-text'>username</span> so that your vessel may be identified. <br />
            <br />
            2. Provide a <span className='bold-info-text'>lobby name</span> to be shared amongst fellow astronauts. <br />
            <br />
            3. Choose a connection method. <span className='bold-info-text'>CREATE</span> for a new lobby or <span className='bold-info-text'>JOIN</span> for an existing lobby.
          </span>
          <br />
          <br />
          If no users remain in a lobby, the lobby and all messages within it are permanently deleted. <br />
        </p>
      </div>
      <div className='info-credits'>
        <p>
          For further information, visit the repository:
        </p>
        <p>
          <a className='repo' href='https://github.com/gschussler/word-roulette_go' target='_blank'>https://github.com/gschussler/word-roulette_go</a>
        </p>
      </div>
    </div>
  );
};

export default Info;