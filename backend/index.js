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

// Test Schema
const testSchema = new mongoose.Schema({
  title: { type: String, required: true },
  teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  questions: [{ text: String }],
  submissions: [{
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    answers: [{ questionIndex: Number, text: String }],
    submittedAt: { type: Date, default: Date.now }
  }],
});
const Test = mongoose.model('Test', testSchema);

// Student List Schema
const studentListSchema = new mongoose.Schema({
  teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  studentIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
});
const StudentList = mongoose.model('StudentList', studentListSchema);

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
  const test = new Test({ title, teacherId: req.user.id, questions });
  await test.save();
  res.status(201).json(test);
});

app.get('/tests', auth, async (req, res) => {
  if (req.user.role === 'teacher') {
    const tests = await Test.find({ teacherId: req.user.id }).populate('submissions.studentId', 'email');
    return res.json(tests);
  }
  const studentList = await StudentList.findOne({ studentIds: req.user.id });
  if (!studentList) return res.json([]);
  const tests = await Test.find({ teacherId: studentList.teacherId }).populate('submissions.studentId', 'email');
  res.json(tests);
});

app.post('/tests/:id/submit', auth, async (req, res) => {
  if (req.user.role !== 'student') return res.status(403).json({ message: 'Unauthorized' });
  const { answers } = req.body; // Array of { questionIndex, text }
  const test = await Test.findById(req.params.id);
  if (!test) return res.status(404).json({ message: 'Test not found' });

  const studentList = await StudentList.findOne({ teacherId: test.teacherId, studentIds: req.user.id });
  if (!studentList) return res.status(403).json({ message: 'Not authorized to submit' });

  const hasSubmitted = test.submissions.some(sub => sub.studentId.toString() === req.user.id);
  if (hasSubmitted) return res.status(403).json({ message: 'You have already submitted this test' });

  test.submissions.push({ studentId: req.user.id, answers });
  await test.save();
  res.json(test);
});

// proctoring-backend/index.js (update /students)
app.post('/students', auth, async (req, res) => {
  if (req.user.role !== 'teacher') return res.status(403).json({ message: 'Unauthorized' });
  const { studentEmail } = req.body;
  if (!studentEmail) return res.status(400).json({ message: 'Student email is required' });
  const student = await User.findOne({ email: studentEmail, role: 'student' });
  if (!student) return res.status(404).json({ message: 'Student not found' });

  let studentList = await StudentList.findOne({ teacherId: req.user.id });
  if (!studentList) {
    studentList = new StudentList({ teacherId: req.user.id, studentIds: [] });
  }
  if (!studentList.studentIds.includes(student._id)) {
    studentList.studentIds.push(student._id);
    await studentList.save();
  }
  const populatedList = await StudentList.findOne({ teacherId: req.user.id }).populate('studentIds', 'email');
  res.status(200).json(populatedList ? populatedList.studentIds : []);
});

app.get('/students', auth, async (req, res) => {
  if (req.user.role !== 'teacher') return res.status(403).json({ message: 'Unauthorized' });
  const studentList = await StudentList.findOne({ teacherId: req.user.id }).populate('studentIds', 'email');
  res.json(studentList ? studentList.studentIds : []);
});

app.listen(5000, () => console.log('Server running on port 5000'));