// src/components/TeacherDashboard.jsx
import { useState, useEffect } from 'react';
import TestForm from './TestForm';

const TeacherDashboard = ({ user }) => {
  const [tests, setTests] = useState([]);
  const [studentEmail, setStudentEmail] = useState('');
  const [students, setStudents] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchTests();
    fetchStudents();
  }, []);

  const fetchTests = async () => {
    try {
      const res = await fetch('http://localhost:5000/tests', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
      });
      if (!res.ok) throw new Error('Failed to fetch tests');
      const data = await res.json();
      setTests(data);
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error('Fetch tests error:', err);
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
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error('Fetch students error:', err);
    }
  };

  const addStudent = async (e) => {
    e.preventDefault();
    if (!studentEmail.trim()) {
      setError('Please enter a student email');
      return;
    }
    try {
      const res = await fetch('http://localhost:5000/students', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ studentEmail }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to add student');
      setStudents(data);
      setStudentEmail('');
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error('Add student error:', err);
    }
  };

  return (
    <div className="dashboard">
      <h1>Welcome, {user.email} (Teacher)</h1>
      {error && <p className="error">{error}</p>}
      <TestForm onTestCreated={fetchTests} />
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
            <div key={index} className="student-item">
              <h3>{student.email}</h3>
              <div className="tests-list">
                {tests.filter(t => t.submissions.some(s => s.studentId.email === student.email)).map(t => (
                  <div key={t._id} className="test-item">
                    <h4>{t.title}</h4>
                    <div className="submissions">
                      {t.submissions.filter(s => s.studentId.email === student.email).map((sub, i) => (
                        <div key={i}>
                          <p><strong>Submitted At:</strong> {new Date(sub.submittedAt).toLocaleString()}</p>
                          {sub.answers.map((ans, j) => (
                            <p key={j}><strong>Q{j + 1}:</strong> {t.questions[ans.questionIndex].text} - <strong>A:</strong> {ans.text}</p>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        ) : (
          <p>No students added yet.</p>
        )}
      </div>
      <div className="tests-list">
        <h2>All Tests</h2>
        {tests.length > 0 ? (
          tests.map(t => (
            <div key={t._id} className="test-item">
              <h4>{t.title}</h4>
              <p>{t.questions.length} Questions</p>
            </div>
          ))
        ) : (
          <p>No tests created yet.</p>
        )}
      </div>
    </div>
  );
};

export default TeacherDashboard;