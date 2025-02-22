// frontend/src/components/TestView.jsx
import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import io from 'socket.io-client';

const socket = io('http://localhost:5000');

const TestView = ({ user }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [test, setTest] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [error, setError] = useState(null);
  const [wasPasted, setWasPasted] = useState(false);
  const [faceStatus, setFaceStatus] = useState('Waiting for detection...');
  const [alertClass, setAlertClass] = useState('');
  const textareaRefs = useRef([]);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamingRef = useRef(false);

  useEffect(() => {
    fetchTest();
    startCamera();

    // Socket.IO listener for alerts
    socket.on('alert', (data) => {
      setFaceStatus(data.message);
      setAlertClass(
        data.type === 'success' ? 'alert-success' :
        data.type === 'warning' ? 'alert-warning' : 'alert-danger'
      );
    });

    return () => {
      stopCamera();
      socket.off('alert');
    };
  }, [id]);

  useEffect(() => {
    textareaRefs.current.forEach((textarea, index) => {
      if (textarea) {
        textarea.addEventListener('paste', () => {
          console.log(`Paste detected in textarea ${index}`);
          setWasPasted(true);
        });
      }
    });

    return () => {
      textareaRefs.current.forEach((textarea) => {
        if (textarea) {
          textarea.removeEventListener('paste', () => setWasPasted(true));
        }
      });
    };
  }, [test]);

  const fetchTest = async () => {
    try {
      const res = await fetch('http://localhost:5000/tests', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
      });
      if (!res.ok) throw new Error('Failed to fetch test');
      const data = await res.json();
      const foundTest = data.find(t => t._id === id);
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
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
      streamingRef.current = false;
    }
  };

  const captureAndSend = () => {
    if (!streamingRef.current || !canvasRef.current || !videoRef.current) return;

    const context = canvasRef.current.getContext('2d');
    context.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);

    canvasRef.current.toBlob((blob) => {
      const formData = new FormData();
      formData.append('image', blob, 'snapshot.jpg');

      fetch('http://localhost:5000/detect-faces', {
        method: 'POST',
        body: formData,
      })
        .then(res => res.json())
        .then(data => {
          console.log('Detection Result:', data);
          setFaceStatus(data.message);
          setAlertClass(
            data.alertType === 'success' ? 'alert-success' :
            data.alertType === 'warning' ? 'alert-warning' : 'alert-danger'
          );
          if (data.faceCount === 0 || data.faceCount > 1) {
            alert(data.message); // Browser alert for critical issues
          }
        })
        .catch(error => {
          console.error('Error:', error);
          setFaceStatus('Error detecting faces');
          setAlertClass('alert-danger');
        });
    }, 'image/jpeg');

    setTimeout(captureAndSend, 3000); // Check every 3 seconds
  };

  const updateAnswer = (index, value) => {
    const newAnswers = [...answers];
    newAnswers[index] = value;
    setAnswers(newAnswers);
  };

  const submitTest = async (e) => {
    e.preventDefault();
    if (answers.some(a => !a.trim())) {
      setError('Please answer all questions');
      return;
    }
    try {
      const res = await fetch(`http://localhost:5000/tests/${id}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          answers: answers.map((text, index) => ({ questionIndex: index, text })),
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

  if (!test) return <div>Loading...</div>;

  return (
    <div className="dashboard test-view">
      <h1>{test.title}</h1>
      {error && <p className="error">{error}</p>}
      <div className="camera-container">
        <video ref={videoRef} width="320" height="240" autoPlay style={{ borderRadius: '8px', marginBottom: '10px' }}></video>
        <canvas ref={canvasRef} width="320" height="240" style={{ display: 'none' }}></canvas>
        <p id="status" className={alertClass}>{faceStatus}</p>
      </div>
      <form onSubmit={submitTest}>
        {test.questions.map((q, index) => (
          <div key={index} className="question-item">
            <h3>{index + 1}. {q.text}</h3>
            <textarea
              ref={el => (textareaRefs.current[index] = el)}
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