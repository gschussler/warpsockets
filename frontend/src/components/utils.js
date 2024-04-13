/**
 * Utility functions for app components
 * @module utils
 */

import React, { useMemo } from "react";
import { minidenticon } from "minidenticons";

/**
 * Displays a minidenticon image. Credit: https://github.com/laurentpayot/minidenticons
 * @param {string} props.username Username.
 * @param {string} props.saturation Saturation value.
 * @param {string} props.lightness Lightness value.
 * @param {object} props Other applicable component props. See Github link for more properties.
 * @returns {JSX.Element} minidenticon image element.
 */

export const MinidenticonImg = React.memo(({ username, saturation, lightness, ...props}) => {
  const svgURI = useMemo(
    () => 'data:image/svg+xml;utf8,' + encodeURIComponent(minidenticon(username, saturation, lightness)),
    [username, saturation, lightness]
  )

  // console.log('SVG URI:', svgURI) // test for rerenders of variable
  return (<img src={svgURI} alt={username} {...props} />)
});

/**
 * Groups messages based on timestamp.
 * @param {string} newMessage Message content to be added to and grouped within the message list (must be parsed first if received from the server).
 * @param {string[]} messageList Current array of messages displayed in the lobby.
 * @returns {string[]} Updated message list within lobby.
 */

/* 
When setting the message list, check if the last sent message was from the same user (also the timestamp).
  - If from the same user AND sent in the same minute, append the new message to the previous message, with a new line in between.
  - Otherwise, the message is from a different user OR sent by the same user in a different minute. Append message to the list as normal
*/
export const groupMessages = (newMessage, messageList) => {
  const lastMessage = messageList[messageList.length - 1];

  if(lastMessage && lastMessage.User === newMessage.User) {
    const isNewMessageGroup = lastMessage.FormattedTime !== newMessage.FormattedTime;
    if(isNewMessageGroup) {
      // messages have not been sent within the same minute, add to message list as normal (with its new message info)
      return [...messageList, newMessage];
    } else {
      // messages have been sent within the same minute, only update messageContent.Content for the current message
      return [
        ...messageList.slice(0, messageList.length - 1),
        {
          ...lastMessage,
          Content: `${lastMessage.Content}\n${newMessage.Content}`,
        },
      ];
    }
  } else {
    // last message was sent by a different user or it's the first message in the lobby. add to message list as normal
    return [...messageList, newMessage];
  }
};

// Use trigonometry to assign a direction for the stars background shift
const getRandomDirection = () => {
  // Assign random angle between 0 and 359 degrees
  const randomAngle = Math.floor(Math.random() * 360);
  // calculate horizontal and vertical components assuming 500 pixel linear directional movement
  const deltaX = Math.cos(randomAngle * Math.PI / 180) * 500;
  const deltaY = Math.sin(randomAngle * Math.PI / 180) * 500;
  return `${deltaX}px ${deltaY}px`;
}

// apply getRandomDirection to the stars div
export const applyShift = () => {
  const stars = document.querySelector('.stars');
  stars.style.backgroundPosition = getRandomDirection();
}


// /**
//  * Limits the rate of invocation of a passed in function
//  * @param {Function} func - Function to throttle.
//  * @param {number} delay - Number of milliseconds to throttle the function invocation.
//  * @returns {Function} - Throttled version of the provided function.
//  */
// export const throttle = (func, delay) => {
//   let lastExecuted = 0;
//   let timeoutId;
//   return function (...args) {
//     const context = this;
//     const now = Date.now();
//     const timeSinceLastExecution = now - lastExecuted;
//     if (timeSinceLastExecution >= delay) {
//       clearTimeout(timeoutId);
//       func.apply(context, args);
//       lastExecuted = now;
//     } else {
//       clearTimeout(timeoutId);
//       timeoutId = setTimeout(() => {
//         func.apply(context, args);
//         lastExecuted = now;
//       }, delay - timeSinceLastExecution);
//     }
//   };
// };