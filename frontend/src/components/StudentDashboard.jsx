import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const StudentDashboard = ({ user, onLogout }) => {
  const [tests, setTests] = useState([]);
  const [submittedTests, setSubmittedTests] = useState([]);
  const [newTests, setNewTests] = useState([]);
  const [expandedTest, setExpandedTest] = useState(null); // New state to track expanded test
  const navigate = useNavigate();

  useEffect(() => {
    fetchTests();
  }, []);

  const fetchTests = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/tests`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch tests');
      const data = await res.json();
      setTests(data);
      setSubmittedTests(data.filter((t) => t.submissions.some((s) => s.studentId._id === user.id)));
      setNewTests(data.filter((t) => !t.submissions.some((s) => s.studentId._id === user.id)));
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogoutClick = () => {
    onLogout();
    navigate('/');
  };

  const toggleTestDetails = (testId) => {
    setExpandedTest(expandedTest === testId ? null : testId); // Toggle visibility
  };

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Welcome, {user.email} (Student)</h1>
        <button className="logout-button" onClick={handleLogoutClick}>
          Logout
        </button>
      </div>
      <div className="tests-section">
        <h2>New Tests</h2>
        <div className="tests-list">
          {newTests.length > 0 ? (
            newTests.map((t) => (
              <div key={t._id} className="test-item">
                <h4>{t.title}</h4>
                <p>{t.questions.length} Questions</p>
                <Link to={`/test/${t._id}`} className="test-link">Take Test</Link>
              </div>
            ))
          ) : (
            <p>No new tests assigned.</p>
          )}
        </div>
      </div>
      <div className="tests-section">
        <h2>Submitted Tests</h2>
        <div className="tests-list">
          {submittedTests.length > 0 ? (
            submittedTests.map((t) => (
              <div key={t._id} className="test-item submitted">
                <h4
                  className="test-title"
                  onClick={() => toggleTestDetails(t._id)}
                >
                  {t.title} <span className="expand-icon">{expandedTest === t._id ? '▲' : '▼'}</span>
                </h4>
                <p>{t.questions.length} Questions</p>
                {expandedTest === t._id && (
                  <div className="submissions">
                    {t.submissions
                      .filter((s) => s.studentId._id === user.id)
                      .map((sub, i) => (
                        <div key={i} className="submission-details">
                          <p><strong>Submitted At:</strong> {new Date(sub.submittedAt).toLocaleString()}</p>
                          {sub.answers.map((ans, j) => (
                            <p key={j}>
                              <strong>Q{j + 1}:</strong> {t.questions[ans.questionIndex].text} - 
                              <strong> A:</strong> {ans.text}
                            </p>
                          ))}
                        </div>
                      ))}
                  </div>
                )}
              </div>
            ))
          ) : (
            <p>No submitted tests.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;