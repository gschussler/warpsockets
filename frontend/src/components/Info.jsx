import React, { useEffect } from 'react';
import Return from '../images/return.svg'

const Info = ({ closeModal }) => {
  return (
    <div className='info-modal'>
      <div className='info-header'>
        <h2>ENGINEER'S LOG</h2>
        <p>Greetings, user.</p>
        <button className='info-close' onClick={closeModal}>
          <img src={Return} alt='Close' />
        </button>
      </div>
      <div className='info-body'>
        <p>
          The following are instructions to help make use of a <span className='bold-info-text'>WarpSocket</span>...
        </p>
        <span className='small-info-text'>
            1. Identify yourself with a <span className='bold-info-text'>username</span>. <br />
            <br />
            2. Provide a <span className='bold-info-text'>lobby name</span> to be shared amongst fellow users. <br />
            <br />
            3. Choose whether you wish to <span className='bold-info-text'>CREATE</span> a new lobby or <span className='bold-info-text'>JOIN</span> an existing lobby. <br />
            <br />
            4. <span className='bold-info-text'>ENTER</span>.
        </span>
        <p>
          If no users remain in a lobby, the lobby and all messages within it are permanently deleted.
        </p>
      </div>
      <div className='info-credits'>
        <p>
          For further information, visit the <a className="repo" href='https://github.com/gschussler/word-roulette_go' target='_blank'>repository</a>.
        </p>
      </div>
    </div>
  );
};

export default Info;