// src/components/Question.jsx
import { useState } from 'react';

const Question = ({ question }) => {
  const [answer, setAnswer] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

  const submitAnswer = async (e) => {
    e.preventDefault();
    if (answer.trim()) {
      await fetch(`${BACKEND_URL}/questions/${question._id}/answer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ text: answer }),
      });
      setAnswer('');
      setIsOpen(false);
      window.location.reload(); // Refresh to show updated answers (replace with state update in production)
    }
  };

  return (
    <div className="question-item">
      <h3 onClick={() => setIsOpen(!isOpen)} style={{ cursor: 'pointer' }}>{question.text}</h3>
      {isOpen && (
        <form onSubmit={submitAnswer}>
          <textarea
            placeholder="Type your answer here..."
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
          />
          <button type="submit">Submit Answer</button>
        </form>
      )}
    </div>
  );
};

export default Question;