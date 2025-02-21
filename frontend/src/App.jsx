import React, { useState } from 'react';
import './App.css';
import QuestionBox from './components/QuestionBox';
import AnswerBox from './components/AnswerBox';
import SubmitButton from './components/SubmitButton';
import Sidebar from './components/Sidebar';
import Overlay from './components/Overlay';

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [answer, setAnswer] = useState('');

  const handleSubmit = () => {
    if (answer.trim()) {
      setSidebarOpen(true);
    }
  };

  return (
    <div className="container">
      {/* Card */}
      <div className="card">
        <QuestionBox />
        <AnswerBox value={answer} onChange={(e) => setAnswer(e.target.value)} />
        <SubmitButton onClick={handleSubmit} />
      </div>

      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Overlay */}
      <Overlay isVisible={sidebarOpen} onClick={() => setSidebarOpen(false)} />
    </div>
  );
}

export default App;