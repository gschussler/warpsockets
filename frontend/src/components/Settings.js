import React from 'react';

const Settings = ({ closeModal }) => {
  return (
    <div className='settings-modal'>
      <h2>Settings</h2>
      <p>
        To be added: <br></br>
        - toggle keep scroll at bottom <br></br>
        - light mode / dark mode
      </p>
      <button onClick={closeModal}>Close</button>
    </div>
  );
};

export default Settings;