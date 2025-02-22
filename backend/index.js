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

// Question Schema
const questionSchema = new mongoose.Schema({
  text: { type: String, required: true },
  teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  answers: [{ studentId: mongoose.Schema.Types.ObjectId, text: String }],
});
const Question = mongoose.model('Question', questionSchema);

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

// Routes
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

app.post('/questions', auth, async (req, res) => {
  if (req.user.role !== 'teacher') return res.status(403).json({ message: 'Unauthorized' });
  const { text } = req.body;
  const question = new Question({ text, teacherId: req.user.id });
  await question.save();
  res.status(201).json(question);
});

app.get('/questions', auth, async (req, res) => {
  if (req.user.role === 'teacher') {
    const questions = await Question.find({ teacherId: req.user.id });
    return res.json(questions);
  }
  const studentList = await StudentList.findOne({ studentIds: req.user.id });
  if (!studentList) return res.json([]);
  const questions = await Question.find({ teacherId: studentList.teacherId });
  res.json(questions);
});

app.post('/questions/:id/answer', auth, async (req, res) => {
  if (req.user.role !== 'student') return res.status(403).json({ message: 'Unauthorized' });
  const { text } = req.body;
  const question = await Question.findById(req.params.id);
  const studentList = await StudentList.findOne({ teacherId: question.teacherId, studentIds: req.user.id });
  if (!studentList) return res.status(403).json({ message: 'Not authorized to answer' });
  question.answers.push({ studentId: req.user.id, text });
  await question.save();
  res.json(question);
});

app.post('/students', auth, async (req, res) => {
  if (req.user.role !== 'teacher') return res.status(403).json({ message: 'Unauthorized' });
  const { studentEmail } = req.body;
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
  // Populate student details in the response
  const populatedList = await StudentList.findOne({ teacherId: req.user.id }).populate('studentIds', 'email');
  res.json(populatedList ? populatedList.studentIds : []);
});

app.get('/students', auth, async (req, res) => {
  if (req.user.role !== 'teacher') return res.status(403).json({ message: 'Unauthorized' });
  const studentList = await StudentList.findOne({ teacherId: req.user.id }).populate('studentIds', 'email');
  res.json(studentList ? studentList.studentIds : []);
});

app.listen(5000, () => console.log('Server running on port 5000'));