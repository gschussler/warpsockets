import React from 'react';
import Return from '../images/return.svg'

const Settings = ({ closeModal }) => {
  return (
    <div className='settings-modal'>
      <button className='settings-close' onClick={closeModal}>
          <img src={Return} alt='Close' />
      </button>
      <div className='settings-header'>
        <h2>Settings</h2>
        <p>
          To be added: <br />
          - toggle keep scroll at bottom <br />
          - light mode / dark mode <br />
          - message sounds on/off <br />
        </p>
      </div>
      <div className='settings-credits'>
        <h3>
          Credits
        </h3>
        <p>
          <a href='https://github.com/laurentpayot/minidenticons' target='_blank'>minidenticons</a> by laurentpayot <br/>
          <a href='https://github.com/joshwcomeau/use-sound' target='_blank'>use-sound</a> by joshwcomeau
        </p>
      </div>
    </div>
  );
};

export default Settings;