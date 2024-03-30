import React from 'react';

export const ExpandingTextarea = ({ value, onChange, onKeyDown, textareaRef, maxLength, buttonClicked}) => {
  const adjustTextareaHeight = () => {
    if(textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  return (
    <div className={'expanding-text'}>
      <textarea
        ref={textareaRef}
        value={value}
        rows={1}
        onChange={(e) => {
          if(e.target.value.length <= maxLength) {
            onChange(e);
            adjustTextareaHeight();
          }
        }}
        onKeyDown={onKeyDown}
        placeholder="Send a message..."
      />
    </div>
  )
};