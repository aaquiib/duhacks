// src/components/TeacherDashboard.jsx
import { useState, useEffect } from 'react';
import TestForm from './TestForm';
import { useNavigate } from 'react-router-dom';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const TeacherDashboard = ({ user, onLogout }) => {
  const [tests, setTests] = useState([]);
  const [students, setStudents] = useState([]);
  const [assignEmails, setAssignEmails] = useState({});
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('tests');
  const navigate = useNavigate();

  useEffect(() => {
    fetchTests();
    fetchStudents();
  }, []);

  const fetchTests = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/tests`, {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to fetch tests');
      const data = await res.json();
      setTests(data.reverse());
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error('Fetch tests error:', err);
    }
  };

  const fetchStudents = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/students`, {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to fetch students');
      const data = await res.json();
      setStudents(data);
    } catch (err) {
      setError(err.message);
      console.error('Fetch students error:', err);
    }
  };

  const handleEmailChange = (testId, value) => {
    setAssignEmails((prev) => ({
      ...prev,
      [testId]: value,
    }));
  };

  const assignStudent = async (testId) => {
    const email = assignEmails[testId] || '';
    if (!email.trim()) {
      setError('Please enter a student email');
      return;
    }
    try {
      const res = await fetch(`${BACKEND_URL}/tests/${testId}/assign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ studentEmail: email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to assign student');

      setTests((prevTests) => {
        const updatedTests = prevTests.filter((t) => t._id !== testId);
        return [data, ...updatedTests];
      });

      setAssignEmails((prev) => ({
        ...prev,
        [testId]: '',
      }));
      setError(null);
      console.log('Assigned student successfully:', data);
    } catch (err) {
      setError(err.message);
      console.error('Assign student error:', err);
    }
  };

  const handleLogoutClick = () => {
    onLogout();
    navigate('/');
  };

  return (
    <div className="teacher-dashboard">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1>Welcome, {user.email}</h1>
        <button
          onClick={handleLogoutClick}
          style={{
            padding: '10px 20px',
            background: 'linear-gradient(90deg, #721c24, #9b2c2c)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: '500',
            transition: 'background 0.3s ease, transform 0.2s ease',
          }}
          onMouseOver={(e) => (e.target.style.background = 'linear-gradient(90deg, #9b2c2c, #c53030)')}
          onMouseOut={(e) => (e.target.style.background = 'linear-gradient(90deg, #721c24, #9b2c2c)')}
        >
          Logout
        </button>
      </div>
      {error && <p className="error-message">{error}</p>}

      <div className="dashboard-tabs">
        <button
          className={activeTab === 'tests' ? 'active' : ''}
          onClick={() => setActiveTab('tests')}
        >
          Tests
        </button>
        <button
          className={activeTab === 'create' ? 'active' : ''}
          onClick={() => setActiveTab('create')}
        >
          Create Test
        </button>
        <button
          className={activeTab === 'students' ? 'active' : ''}
          onClick={() => setActiveTab('students')}
        >
          Students
        </button>
      </div>

      <main className="dashboard-content">
        {activeTab === 'create' && (
          <section className="test-creation">
            <TestForm onTestCreated={fetchTests} />
          </section>
        )}

        {activeTab === 'tests' && (
          <section className="tests-section">
            <h2>Your Tests</h2>
            {tests.length > 0 ? (
              <div className="tests-grid">
                {tests.map((test) => (
                  <TestCard
                    key={test._id}
                    test={test}
                    assignEmails={assignEmails}
                    onEmailChange={handleEmailChange}
                    onAssign={assignStudent}
                  />
                ))}
              </div>
            ) : (
              <p className="empty-message">No tests created yet.</p>
            )}
          </section>
        )}

        {activeTab === 'students' && (
          <section className="students-section">
            <h2>Your Students</h2>
            {students.length > 0 ? (
              <div className="students-list">
                {students.map((student) => (
                  <div key={student._id} className="student-card">
                    <p>{student.email}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="empty-message">No students enrolled yet.</p>
            )}
          </section>
        )}
      </main>
    </div>
  );
};

const TestCard = ({ test, assignEmails, onEmailChange, onAssign }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="test-card">
      <div className="test-header" onClick={() => setIsExpanded(!isExpanded)}>
        <h3>{test.title}</h3>
        <span className="question-count">{test.questions.length} Questions</span>
        <span className="expand-icon">{isExpanded ? '▲' : '▼'}</span>
      </div>

      {isExpanded && (
        <div className="test-details">
          <div className="assign-section">
            <input
              type="email"
              placeholder="Assign student by email"
              value={assignEmails[test._id] || ''}
              onChange={(e) => onEmailChange(test._id, e.target.value)}
            />
            <button onClick={() => onAssign(test._id)}>Assign</button>
          </div>

          <div className="assigned-students">
            <h4>Assigned Students</h4>
            {test.assignedStudents.length > 0 ? (
              test.assignedStudents.map((student) => (
                <p key={student._id}>{student.email}</p>
              ))
            ) : (
              <p>No students assigned</p>
            )}
          </div>

          <div className="submissions-section">
            <h4>Submissions</h4>
            {test.submissions.length > 0 ? (
              test.submissions.map((sub, index) => (
                <div key={index} className="submission">
                  <p className="submission-meta">
                    <strong>{sub.studentId.email}</strong> -{' '}
                    {new Date(sub.submittedAt).toLocaleString()}
                    {sub.wasPasted && <span className="flag paste">Copy-Pasted</span>}
                    {sub.plagiarismFlag && <span className="flag plagiarism">Plagiarism</span>}
                    {sub.aiGeneratedFlag && <span className="flag ai">AI-Generated</span>}
                  </p>
                  {sub.answers.map((ans, j) => (
                    <p key={j} className="answer">
                      <strong>Q{j + 1}:</strong> {test.questions[ans.questionIndex].text}
                      <br />
                      <span>A: {ans.text}</span>
                    </p>
                  ))}
                </div>
              ))
            ) : (
              <p>No submissions yet</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherDashboard;