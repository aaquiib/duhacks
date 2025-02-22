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

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetch('http://localhost:5000/tests', {
        headers: { 'Authorization': `Bearer ${token}` },
      }).then(res => res.json()).then(() => setUser(JSON.parse(localStorage.getItem('user'))));
    }
  }, []);

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