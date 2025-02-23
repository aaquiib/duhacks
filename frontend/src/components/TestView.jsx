import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import FaceVerification from './FaceVerification';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
const socket = io(`${BACKEND_URL}`, { withCredentials: true });

const TestView = ({ user, onLogout }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [test, setTest] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [error, setError] = useState(null);
  const [wasPasted, setWasPasted] = useState(false);
  const [faceStatus, setFaceStatus] = useState('Face detected');
  const [alertClass, setAlertClass] = useState('alert-success');
  const [alertCount, setAlertCount] = useState(0);
  const [isVerified, setIsVerified] = useState(false);
  const MAX_ALERTS = 3;
  const textareaRefs = useRef([]);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamingRef = useRef(false);
  const lastAlertTimeRef = useRef(0);

  useEffect(() => {
    fetchTest();
  }, [id]);

  const fetchTest = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/tests`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch test');
      const data = await res.json();
      const foundTest = data.find((t) => t._id === id);
      if (!foundTest) throw new Error('Test not found');
      setTest(foundTest);
      setAnswers(foundTest.questions.map(() => ''));
      textareaRefs.current = foundTest.questions.map(() => null);
    } catch (err) {
      setError(err.message);
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamingRef.current = true;
        captureAndSend();
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      setFaceStatus('Camera access denied');
      setAlertClass('alert-danger');
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject;
      const tracks = stream.getTracks();
      tracks.forEach((track) => track.stop());
      videoRef.current.srcObject = null;
      streamingRef.current = false;
    }
  };

  const handleSocketAlert = useCallback((data) => {
    const currentTime = Date.now();
    if (currentTime - lastAlertTimeRef.current >= 5000) {
      let message = '';
      if (data.type === 'warning') {
        message = 'No face detected!';
      } else if (data.type === 'danger') {
        message = 'Multiple faces detected!';
      }

      if (message) {
        setFaceStatus(message);
        setAlertClass(data.type === 'warning' ? 'alert-warning' : 'alert-danger');
        setAlertCount((prev) => {
          const newCount = prev + 1;
          if (newCount >= MAX_ALERTS) {
            autoSubmitTest();
          }
          return newCount;
        });
        alert(`${message} (Alert ${alertCount + 1}/${MAX_ALERTS})`);
        lastAlertTimeRef.current = currentTime;
      } else {
        setFaceStatus('Face detected');
        setAlertClass('alert-success');
      }
    }
  }, [alertCount]);

  const captureAndSend = useCallback(() => {
    if (!streamingRef.current || !canvasRef.current || !videoRef.current) {
      setTimeout(captureAndSend, 3000);
      return;
    }

    const context = canvasRef.current.getContext('2d');
    context.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);

    canvasRef.current.toBlob((blob) => {
      const formData = new FormData();
      formData.append('image', blob, 'snapshot.jpg');

      fetch(`${BACKEND_URL}/detect-faces`, {
        method: 'POST',
        body: formData,
        credentials: 'include',
      })
        .then((res) => res.json())
        .then((data) => {
          console.log('Detection Result:', data);
          setFaceStatus(data.message);
          setAlertClass(
            data.alertType === 'success' ? 'alert-success' :
            data.alertType === 'warning' ? 'alert-warning' : 'alert-danger'
          );
        })
        .catch((error) => {
          console.error('Error:', error);
          setFaceStatus('Error detecting faces');
          setAlertClass('alert-danger');
        });
    }, 'image/jpeg');

    setTimeout(captureAndSend, 3000);
  }, []);

  const updateAnswer = (index, value) => {
    const newAnswers = [...answers];
    newAnswers[index] = value;
    setAnswers(newAnswers);
  };

  const submitTest = async (force = false) => {
    if (!force && answers.some((a) => !a.trim())) {
      setError('Please answer all questions');
      return;
    }
    try {
      const res = await fetch(`${BACKEND_URL}/tests/${id}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          answers: answers.map((text, index) => ({ questionIndex: index, text: text || 'Auto-submitted due to violations' })),
          wasPasted,
        }),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to submit test');
      }
      stopCamera();
      navigate('/student');
    } catch (err) {
      setError(err.message);
    }
  };

  const autoSubmitTest = useCallback(() => {
    submitTest(true); // Silent submission
  }, []);

  const handleVerificationSuccess = () => {
    setIsVerified(true);
    startCamera();
    // Delay socket listener to avoid catching residual verification alerts
    setTimeout(() => {
      socket.on('alert', handleSocketAlert);
    }, 3000); // Matches first capture cycle
  };

  const handleLogoutClick = () => {
    stopCamera();
    onLogout();
    navigate('/');
  };

  if (!test) return <div>Loading...</div>;

  if (!isVerified) {
    return <FaceVerification onVerificationSuccess={handleVerificationSuccess} />;
  }

  return (
    <div className="dashboard test-view">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1>{test.title}</h1>
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
      {error && <p className="error">{error}</p>}
      <div className="camera-container">
        <video ref={videoRef} width="320" height="240" autoPlay style={{ borderRadius: '8px', marginBottom: '10px' }}></video>
        <canvas ref={canvasRef} width="320" height="240" style={{ display: 'none' }}></canvas>
        <p id="status" className={alertClass}>{faceStatus}</p>
        <p>Alert Count: {alertCount}/{MAX_ALERTS} (Test will auto-submit at {MAX_ALERTS} alerts)</p>
      </div>


      <form onSubmit={(e) => submitTest(e, false)}>
        {test.questions.map((q, index) => (
          <div key={index} className="question-item">
            <h3>{index + 1}. {q.text}</h3>
            <textarea
              ref={(el) => (textareaRefs.current[index] = el)}
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