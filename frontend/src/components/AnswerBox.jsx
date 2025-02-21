import React from 'react';

const AnswerBox = ({ value, onChange }) => {
  return (
    <textarea
      className="answer-box"
      placeholder="Type your answer here..."
      value={value}
      onChange={onChange}
    />
  );
};

export default AnswerBox;