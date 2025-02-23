// src/components/TestForm.jsx
import { useState } from 'react';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const TestForm = ({ onTestCreated }) => {
  const [title, setTitle] = useState('');
  const [questions, setQuestions] = useState(['']);
  const [error, setError] = useState(null);

  const addQuestion = () => setQuestions([...questions, '']);
  const updateQuestion = (index, value) => {
    const newQuestions = [...questions];
    newQuestions[index] = value;
    setQuestions(newQuestions);
  };

  const createTest = async (e) => {
    e.preventDefault();
    if (!title.trim() || questions.some(q => !q.trim())) {
      setError('Please fill in all fields');
      return;
    }
    try {
      const res = await fetch(`${BACKEND_URL}/tests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies in request
        body: JSON.stringify({ title, questions: questions.map(text => ({ text })) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to create test');
      setTitle('');
      setQuestions(['']);
      setError(null);
      onTestCreated(); // Trigger refresh
    } catch (err) {
      setError(err.message);
      console.error('Test creation error:', err);
    }
  };

  return (
    <form onSubmit={createTest} className="test-form">
      <input
        type="text"
        placeholder="Test Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      {questions.map((q, index) => (
        <input
          key={index}
          type="text"
          placeholder={`Question ${index + 1}`}
          value={q}
          onChange={(e) => updateQuestion(index, e.target.value)}
        />
      ))}
      <button type="button" onClick={addQuestion}>Add Question</button>
      <button type="submit">Create Test</button>
      {error && <p className="error">{error}</p>}
    </form>
  );
};

export default TestForm;