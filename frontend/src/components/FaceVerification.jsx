// src/components/FaceVerification.jsx
import { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import { useNavigate } from 'react-router-dom';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
const socket = io(`${BACKEND_URL}`, { withCredentials: true });

const FaceVerification = ({ onVerificationSuccess }) => {
  const [status, setStatus] = useState('Initializing camera...');
  const [alertClass, setAlertClass] = useState('');
  const [timeLeft, setTimeLeft] = useState(15);
  const [faceDetected, setFaceDetected] = useState(false);
  const [examStarted, setExamStarted] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamingRef = useRef(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (examStarted) {
      startCamera();

      socket.on('alert', handleSocketAlert);

      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            if (faceDetected) {
              onVerificationSuccess();
            } else {
              alert('Face verification failed. Please try again.');
              navigate('/student');
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => {
        clearInterval(timer);
        stopCamera();
        socket.off('alert', handleSocketAlert);
      };
    }
  }, [examStarted, faceDetected, onVerificationSuccess, navigate]);

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
      setStatus('Camera access denied');
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

  const handleSocketAlert = (data) => {
    setStatus(data.message);
    setAlertClass(
      data.type === 'success' ? 'alert-success' :
      data.type === 'warning' ? 'alert-warning' : 'alert-danger'
    );
    if (data.type === 'success') {
      setFaceDetected(true);
    }
  };

  const captureAndSend = () => {
    if (!streamingRef.current || !canvasRef.current || !videoRef.current) return;

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
        .catch((error) => {
          console.error('Error:', error);
          setStatus('Error detecting face');
          setAlertClass('alert-danger');
        });
    }, 'image/jpeg');

    if (streamingRef.current) {
      setTimeout(captureAndSend, 2000);
    }
  };

  const handleStartExam = () => {
    setExamStarted(true);
  };

  return (
    <div className="dashboard">
      {examStarted ? (
        <>
          <h1 style={{ color: '#2a5298', fontSize: '24px', marginBottom: '20px' }}>Face Scanning</h1>
          <div className="camera-container">
            <video ref={videoRef} width="320" height="240" autoPlay style={{ borderRadius: '8px', marginBottom: '10px' }}></video>
            <canvas ref={canvasRef} width="320" height="240" style={{ display: 'none' }}></canvas>
            <p id="status" className={alertClass}>{status}</p>
            <p>Time remaining: {timeLeft} seconds</p>
          </div>
        </>
      ) : (
        <div style={{ textAlign: 'center' }}>
          <p>Please read the guidelines below before starting the exam.</p>
        </div>
      )}
      <div style={{ marginTop: '20px', textAlign: 'left' }}>
        <h2 style={{ color: '#2a5298', fontSize: '22px', marginBottom: '15px' }}>
          Read the Guidelines Before Starting
        </h2>
        <ul style={{ listStyleType: 'disc', paddingLeft: '20px', color: '#333' }}>
          <li>Please ensure your face is clearly visible in the camera frame.</li>
          <li>Only one face should be detected at all times.</li>
          <li>After clicking "Start Exam", you have 15 seconds to verify your face. If successful, the exam will begin.</li>
          <li>During the exam, face detection will continue:</li>
          <ul style={{ listStyleType: 'circle', paddingLeft: '20px' }}>
            <li>3 warnings for "No face detected" or "Multiple faces detected" will result in silent auto-submission.</li>
            <li>Warnings are issued every 5 seconds if violations persist.</li>
          </ul>
          <li>Copy-pasting answers will be flagged.</li>
          <li>Ensure a stable internet connection and good lighting.</li>
        </ul>
      </div>
      {!examStarted && (
        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <button
            onClick={handleStartExam}
            style={{
              padding: '12px 25px',
              background: 'linear-gradient(90deg, #1e3c72, #2a5298)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: '500',
              transition: 'background 0.3s ease, transform 0.2s ease',
            }}
            onMouseOver={(e) => (e.target.style.background = 'linear-gradient(90deg, #2a5298, #3b6db5)')}
            onMouseOut={(e) => (e.target.style.background = 'linear-gradient(90deg, #1e3c72, #2a5298)')}
          >
            Start Exam
          </button>
        </div>
      )}
    </div>
  );
};

export default FaceVerification;