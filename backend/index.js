// proctoring-backend/index.js
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const app = express();
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log('MongoDB connected')).catch(err => console.log(err));

// User Schema
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['teacher', 'student'], required: true },
});
const User = mongoose.model('User', userSchema);

// Test Schema (Updated)
const testSchema = new mongoose.Schema({
  title: { type: String, required: true },
  teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  questions: [{ text: String }],
  assignedStudents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  submissions: [{
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    answers: [{ questionIndex: Number, text: String }],
    submittedAt: { type: Date, default: Date.now }
  }],
});
const Test = mongoose.model('Test', testSchema);

// Middleware to verify JWT
const auth = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ message: 'No token provided' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

// Auth Routes
app.post('/register', async (req, res) => {
  const { email, password, role } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const user = new User({ email, password: hashedPassword, role });
  await user.save();
  res.status(201).json({ message: 'User registered' });
});

app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(400).json({ message: 'Invalid credentials' });
  }
  const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET);
  res.json({ token, user: { id: user._id, email: user.email, role: user.role } });
});

// Test Routes
app.post('/tests', auth, async (req, res) => {
  if (req.user.role !== 'teacher') return res.status(403).json({ message: 'Unauthorized' });
  const { title, questions } = req.body;
  if (!title || !questions || !Array.isArray(questions) || questions.length === 0) {
    return res.status(400).json({ message: 'Title and at least one question are required' });
  }
  const test = new Test({ title, teacherId: req.user.id, questions, assignedStudents: [] });
  await test.save();
  res.status(201).json(test);
});

app.get('/tests', auth, async (req, res) => {
  if (req.user.role === 'teacher') {
    const tests = await Test.find({ teacherId: req.user.id })
      .populate('assignedStudents', 'email')
      .populate('submissions.studentId', 'email');
    return res.json(tests);
  }
  const tests = await Test.find({ assignedStudents: req.user.id })
    .populate('assignedStudents', 'email')
    .populate('submissions.studentId', 'email');
  res.json(tests);
});

app.post('/tests/:id/assign', auth, async (req, res) => {
  if (req.user.role !== 'teacher') return res.status(403).json({ message: 'Unauthorized' });
  const { studentEmail } = req.body;
  const test = await Test.findById(req.params.id);
  if (!test || test.teacherId.toString() !== req.user.id) {
    return res.status(404).json({ message: 'Test not found or unauthorized' });
  }
  const student = await User.findOne({ email: studentEmail, role: 'student' });
  if (!student) return res.status(404).json({ message: 'Student not found' });
  if (!test.assignedStudents.includes(student._id)) {
    test.assignedStudents.push(student._id);
    await test.save();
  }
  const updatedTest = await Test.findById(req.params.id)
    .populate('assignedStudents', 'email')
    .populate('submissions.studentId', 'email');
  res.json(updatedTest);
});

app.post('/tests/:id/submit', auth, async (req, res) => {
  if (req.user.role !== 'student') return res.status(403).json({ message: 'Unauthorized' });
  const { answers } = req.body;
  const test = await Test.findById(req.params.id);
  if (!test || !test.assignedStudents.includes(req.user.id)) {
    return res.status(403).json({ message: 'Not authorized to submit' });
  }
  const hasSubmitted = test.submissions.some(sub => sub.studentId.toString() === req.user.id);
  if (hasSubmitted) return res.status(403).json({ message: 'You have already submitted this test' });
  test.submissions.push({ studentId: req.user.id, answers });
  await test.save();
  res.json(test);
});

// Get all students for assigning (optional)
app.get('/students', auth, async (req, res) => {
  if (req.user.role !== 'teacher') return res.status(403).json({ message: 'Unauthorized' });
  const students = await User.find({ role: 'student' }, 'email');
  res.json(students);
});

app.listen(5000, () => console.log('Server running on port 5000'));