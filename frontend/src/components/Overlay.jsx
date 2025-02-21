import React from 'react';

const Overlay = ({ isVisible, onClick }) => {
  return <div className={`overlay ${isVisible ? 'visible' : ''}`} onClick={onClick}></div>;
};

export default Overlay;