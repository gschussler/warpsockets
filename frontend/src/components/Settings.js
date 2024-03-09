import React from 'react';

const Settings = ({ closeModal }) => {
  return (
    <div className='settings-modal'>
      <h2>Settings</h2>
      <p>
        To be added: <br />
        - toggle keep scroll at bottom <br />
        - light mode / dark mode <br />
      </p>
      <h3>
        Credits
      </h3>
      <p>
        <a href='https://github.com/laurentpayot/minidenticons'>minidenticons</a> by laurentpayot
      </p>
      <button onClick={closeModal}>Close</button>
    </div>
  );
};

export default Settings;