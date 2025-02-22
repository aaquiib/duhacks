// src/components/StudentDashboard.jsx
import { useState, useEffect } from 'react';
import Question from './Question';

const StudentDashboard = ({ user }) => {
  const [questions, setQuestions] = useState([]);

  useEffect(() => {
    fetch('http://localhost:5000/questions', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
    }).then(res => res.json()).then(data => setQuestions(data));
  }, []);

  return (
    <div className="dashboard">
      <h1>Welcome, {user.email} (Student)</h1>
      <div className="questions-list">
        {questions.length > 0 ? (
          questions.map((q) => <Question key={q._id} question={q} />)
        ) : (
          <p>No questions available.</p>
        )}
      </div>
    </div>
  );
};

export default StudentDashboard;