import React from 'react';

const Sidebar = ({ isOpen, onClose }) => {
  return (
    <div className={`sidebar ${isOpen ? 'open' : ''}`}>
      <button className="sidebar-close" onClick={onClose}>
        &times;
      </button>
      <h2>Checks</h2>
      <button className="check-button">AI Check</button>
      <button className="check-button">Plagiarism Check</button>
      <button className="check-button">Copy Check</button>
    </div>
  );
};

export default Sidebar;