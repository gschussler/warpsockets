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