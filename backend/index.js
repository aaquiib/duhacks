require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const authMiddleware = require('./middleware/authMiddleware');
const authController = require('./controllers/authController');
const testController = require('./controllers/testController');
const studentController = require('./controllers/studentController');

const app = express();
app.use(cors());
app.use(express.json());

// MongoDB Connection
const connectDB = require('./config/db');
connectDB();

// Auth Routes
app.post('/register', authController.register);
app.post('/login', authController.login);

// Test Routes
app.post('/tests', authMiddleware, testController.createTest);
app.get('/tests', authMiddleware, testController.getTests);
app.post('/tests/:id/submit', authMiddleware, testController.submitTest);

// Student Routes
app.get('/students', authMiddleware, studentController.getStudents);

app.listen(5000, () => console.log('Server running on port 5000'));