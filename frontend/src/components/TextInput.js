import React, { useState, useRef } from 'react';

const ExpandingTextarea = ({ value, onChange, onKeyDown, textareaRef}) => {

  const adjustTextareaHeight = () => {
    if(textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  return (
    <div className="text-input">
      <textarea
        ref={textareaRef}
        value={value}
        rows={1}
        onChange={(e) => {
          onChange(e);
          adjustTextareaHeight();
        }}
        onKeyDown={onKeyDown}
        placeholder="Send a message..."
      />
    </div>
  )
};

export default ExpandingTextarea;