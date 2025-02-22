// src/components/TestView.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const TestView = ({ user }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [test, setTest] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchTest();
  }, [id]);

  const fetchTest = async () => {
    try {
      const res = await fetch('http://localhost:5000/tests', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
      });
      if (!res.ok) throw new Error('Failed to fetch test');
      const data = await res.json();
      const foundTest = data.find(t => t._id === id);
      if (!foundTest) throw new Error('Test not found');
      setTest(foundTest);
      setAnswers(foundTest.questions.map(() => ''));
    } catch (err) {
      setError(err.message);
    }
  };

  const updateAnswer = (index, value) => {
    const newAnswers = [...answers];
    newAnswers[index] = value;
    setAnswers(newAnswers);
  };

  const submitTest = async (e) => {
    e.preventDefault();
    if (answers.some(a => !a.trim())) {
      setError('Please answer all questions');
      return;
    }
    try {
      const res = await fetch(`http://localhost:5000/tests/${id}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ answers: answers.map((text, index) => ({ questionIndex: index, text })) }),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to submit test');
      }
      navigate('/student');
    } catch (err) {
      setError(err.message);
    }
  };

  if (!test) return <div>Loading...</div>;

  return (
    <div className="dashboard test-view">
      <h1>{test.title}</h1>
      {error && <p className="error">{error}</p>}
      <form onSubmit={submitTest}>
        {test.questions.map((q, index) => (
          <div key={index} className="question-item">
            <h3>{index + 1}. {q.text}</h3>
            <textarea
              placeholder="Your answer..."
              value={answers[index]}
              onChange={(e) => updateAnswer(index, e.target.value)}
            />
          </div>
        ))}
        <button type="submit">Submit Test</button>
      </form>
    </div>
  );
};

export default TestView;