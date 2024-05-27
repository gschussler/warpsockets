import React, { useEffect } from 'react';
import Return from '../images/return.svg'

const Info = ({ closeModal }) => {
  return (
    <div className='info-modal'>
      <div className='info-header'>
        <h2>ENGINEER'S LOG</h2>
        <p>Greetings, user.</p>
        <button className='info-close' onMouseDown={closeModal} onKeyDown={(e) => {if(e.key === "Enter") closeModal()}}>
          <img src={Return} alt='Close' />
        </button>
      </div>
      <div className='info-body'>
        <p>
          The following are prerequisites for communication via <span className='bold-info-text'>WarpSockets</span>...
        </p>
        <span className='small-info-text'>
            1. Input your <span className='bold-info-text'>username</span> and destination <span className='bold-info-text'>lobby</span>.
            <br />
            <br />
            2. <span className='bold-info-text' style={{color: '#c8ffd2'}}>CREATE</span> a new lobby or <span className='bold-info-text' style={{color: '#9cc0e7'}}>JOIN</span> one already existing. <br />
            <br />
            3. <span className='bold-info-text'>ENTER</span>.
        </span>
        <p>
          If no users remain in a lobby, the lobby and all messages within it are permanently deleted.
        </p>
      </div>
      <div className='info-credits'>
        <p>
          For detailed information, visit the <a className="repo" href='https://github.com/gschussler/word-roulette_go' target='_blank'>repository</a>.
        </p>
      </div>
    </div>
  );
};

export default Info;