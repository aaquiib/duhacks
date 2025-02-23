// src/components/TeacherDashboard.jsx
import { useState, useEffect } from 'react';
import TestForm from './TestForm';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'; // Fallback URL

const TeacherDashboard = ({ user }) => {
  const [tests, setTests] = useState([]);
  const [students, setStudents] = useState([]);
  const [assignEmail, setAssignEmail] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchTests();
    fetchStudents();
  }, [user]); // Include user in dependency array to refetch if user changes

  const fetchTests = async () => {
    try {
      setError(null); // Reset error state on new fetch attempt
      const res = await fetch(`${BACKEND_URL}/tests`, {
        credentials: 'include', // Include cookies in request
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to fetch tests');
      }
      const data = await res.json();
      setTests(data);
    } catch (err) {
      setError(err.message);
      console.error('Fetch tests error:', err);
    }
  };

  const fetchStudents = async () => {
    try {
      setError(null); // Reset error state on new fetch attempt
      const res = await fetch(`${BACKEND_URL}/students`, {
        credentials: 'include', // Include cookies in request
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to fetch students');
      }
      const data = await res.json();
      setStudents(data);
    } catch (err) {
      setError(err.message);
      console.error('Fetch students error:', err);
    }
  };

  const assignStudent = async (testId) => {
    if (!assignEmail.trim()) {
      setError('Please enter a student email');
      return;
    }
    try {
      setError(null); // Reset error state on new assign attempt
      const res = await fetch(`${BACKEND_URL}/tests/${testId}/assign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies in request
        body: JSON.stringify({ studentEmail: assignEmail }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to assign student');
      
      // Update tests state with the new data
      setTests((prevTests) =>
        prevTests.map((t) => (t._id === testId ? data : t))
      );
      setAssignEmail('');
      console.log('Assigned student successfully:', data);
    } catch (err) {
      setError(err.message);
      console.error('Assign student error:', err);
    }
  };

  return (
    <div className="dashboard">
      <h1>Welcome, {user.email} (Teacher)</h1>
      {error && <p className="error">{error}</p>}
      <TestForm onTestCreated={fetchTests} />
      <div className="tests-list">
        <h2>All Tests</h2>
        {tests.length > 0 ? (
          tests.map((t) => (
            <div key={t._id} className="test-item">
              <h4>{t.title}</h4>
              <p>{t.questions.length} Questions</p>
              <div className="assign-form">
                <input
                  type="email"
                  placeholder="Assign student by email"
                  value={assignEmail}
                  onChange={(e) => setAssignEmail(e.target.value)}
                />
                <button onClick={() => assignStudent(t._id)}>Assign</button>
              </div>
              <div className="assigned-students">
                <h5>Assigned Students:</h5>
                {t.assignedStudents.length > 0 ? (
                  t.assignedStudents.map((s) => (
                    <p key={s._id || s.email}>{s.email}</p> // Fallback to email if _id is missing
                  ))
                ) : (
                  <p>No students assigned</p>
                )}
              </div>
              <div className="submissions">
                <h5>Submissions:</h5>
                {t.submissions.length > 0 ? (
                  t.submissions.map((sub, i) => (
                    <div key={i} className="submission-item">
                      <p>
                        <strong>{sub.studentId?.email || 'Unknown Student'}</strong> - Submitted:{' '}
                        {new Date(sub.submittedAt).toLocaleString()}
                        {sub.wasPasted && (
                          <span className="paste-flag"> (Copy-Pasted)</span>
                        )}
                        {sub.plagiarismFlag && (
                          <span className="plagiarism-flag"> (Plagiarism Detected)</span>
                        )}
                        {sub.aiGeneratedFlag && (
                          <span className="ai-flag"> (AI-Generated)</span>
                        )}
                      </p>
                      {sub.answers.map((ans, j) => (
                        <p key={j}>
                          <strong>Q{j + 1}:</strong> {t.questions[ans.questionIndex].text} -{' '}
                          <strong>A:</strong> {ans.text}
                        </p>
                      ))}
                    </div>
                  ))
                ) : (
                  <p>No submissions yet</p>
                )}
              </div>
            </div>
          ))
        ) : (
          <p>No tests available yet.</p>
        )}
      </div>
    </div>
  );
};

export default TeacherDashboard;