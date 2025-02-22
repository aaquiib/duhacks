// src/App.jsx
import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Register from './components/Register';
import TeacherDashboard from './components/TeacherDashboard';
import StudentDashboard from './components/StudentDashboard';
import TestView from './components/TestView';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // Add loading state to prevent flicker

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('http://localhost:5000/me', {
          credentials: 'include', // Include cookies in request
        });
        if (res.ok) {
          const data = await res.json();
          localStorage.setItem('user', JSON.stringify(data.user)); // Persist user info for UI
          setUser(data.user);
        } else {
          localStorage.removeItem('user'); // Clear user info if not authenticated
          setUser(null);
        }
      } catch (err) {
        console.error('Auth check failed:', err);
        setUser(null);
        localStorage.removeItem('user');
      } finally {
        setLoading(false); // Done checking auth
      }
    };

    checkAuth();
  }, []);

  if (loading) return <div>Loading...</div>; // Show loading state while checking auth

  return (
    <Router>
      <div className="app">
        <Routes>
          <Route path="/" element={<Login setUser={setUser} />} />
          <Route path="/register" element={<Register setUser={setUser} />} />
          <Route
            path="/teacher"
            element={user && user.role === 'teacher' ? <TeacherDashboard user={user} /> : <Navigate to="/" />}
          />
          <Route
            path="/student"
            element={user && user.role === 'student' ? <StudentDashboard user={user} /> : <Navigate to="/" />}
          />
          <Route
            path="/test/:id"
            element={user && user.role === 'student' ? <TestView user={user} /> : <Navigate to="/" />}
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;