// src/components/TeacherDashboard.jsx
import { useState, useEffect } from 'react';
import Question from './Question';

const TeacherDashboard = ({ user }) => {
  const [newQuestion, setNewQuestion] = useState('');
  const [questions, setQuestions] = useState([]);
  const [studentEmail, setStudentEmail] = useState('');
  const [students, setStudents] = useState([]);
  const [error, setError] = useState(null); // Add error state for debugging

  useEffect(() => {
    fetchQuestions();
    fetchStudents();
  }, []);

  const fetchQuestions = async () => {
    try {
      const res = await fetch('http://localhost:5000/questions', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
      });
      if (!res.ok) throw new Error('Failed to fetch questions');
      const data = await res.json();
      setQuestions(data);
    } catch (err) {
      setError(err.message);
    }
  };

  const fetchStudents = async () => {
    try {
      const res = await fetch('http://localhost:5000/students', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
      });
      if (!res.ok) throw new Error('Failed to fetch students');
      const data = await res.json();
      setStudents(data);
    } catch (err) {
      setError(err.message);
    }
  };

  const addQuestion = async (e) => {
    e.preventDefault();
    if (!newQuestion.trim()) return;
    try {
      const res = await fetch('http://localhost:5000/questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ text: newQuestion }),
      });
      if (!res.ok) throw new Error('Failed to add question');
      const data = await res.json();
      setQuestions([...questions, data]);
      setNewQuestion('');
    } catch (err) {
      setError(err.message);
    }
  };

  const addStudent = async (e) => {
    e.preventDefault();
    if (!studentEmail.trim()) return;
    try {
      const res = await fetch('http://localhost:5000/students', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ studentEmail }),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to add student');
      }
      const data = await res.json();
      setStudents(data); // Update students with the returned list
      setStudentEmail('');
      setError(null); // Clear any previous errors
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="dashboard">
      <h1>Welcome, {user.email} (Teacher)</h1>
      {error && <p className="error">{error}</p>}
      <form onSubmit={addQuestion} className="question-form">
        <input
          type="text"
          placeholder="Enter a new question"
          value={newQuestion}
          onChange={(e) => setNewQuestion(e.target.value)}
        />
        <button type="submit">Add Question</button>
      </form>
      <form onSubmit={addStudent} className="student-form">
        <input
          type="email"
          placeholder="Add student by email"
          value={studentEmail}
          onChange={(e) => setStudentEmail(e.target.value)}
        />
        <button type="submit">Add Student</button>
      </form>
      <div className="students-list">
        <h2>Students</h2>
        {students.length > 0 ? (
          students.map((student, index) => (
            <p key={index}>{student.email}</p>
          ))
        ) : (
          <p>No students added yet.</p>
        )}
      </div>
      <div className="questions-list">
        {questions.map((q) => (
          <div key={q._id} className="question-item">
            <h3>{q.text}</h3>
            <div className="answers">
              {q.answers.length > 0 ? (
                q.answers.map((ans, i) => (
                  <p key={i}><strong>Student Answer {i + 1}:</strong> {ans.text}</p>
                ))
              ) : (
                <p>No answers yet.</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TeacherDashboard;