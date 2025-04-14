import React from 'react';

// Dummy provider that simply renders children
export const KeyboardProvider = ({ children }) => {
  return children;
};

// Dummy hook that returns a default value for keyboard height
export const useReanimatedKeyboardAnimation = () => {
  return { height: { value: 0 } };
};
