// proctoring-backend/index.js
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const stringSimilarity = require('string-similarity'); // Import library

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

// Test Schema (Updated with plagiarismFlag)
const testSchema = new mongoose.Schema({
  title: { type: String, required: true },
  teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  questions: [{ text: String }],
  assignedStudents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  submissions: [{
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    answers: [{ questionIndex: Number, text: String }],
    submittedAt: { type: Date, default: Date.now },
    wasPasted: { type: Boolean, default: false },
    plagiarismFlag: { type: Boolean, default: false } // New field for plagiarism
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
  console.log('Test created:', test);
  res.status(201).json(test);
});

app.get('/tests', auth, async (req, res) => {
  try {
    if (req.user.role === 'teacher') {
      const tests = await Test.find({ teacherId: req.user.id })
        .populate('assignedStudents', 'email')
        .populate('submissions.studentId', 'email');
      console.log('Teacher tests:', tests);
      return res.json(tests);
    }
    const tests = await Test.find({ assignedStudents: req.user.id })
      .populate('assignedStudents', 'email')
      .populate('submissions.studentId', 'email');
    console.log('Student tests:', tests);
    res.json(tests);
  } catch (err) {
    console.error('Error fetching tests:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/tests/:id/assign', auth, async (req, res) => {
  if (req.user.role !== 'teacher') return res.status(403).json({ message: 'Unauthorized' });
  const { studentEmail } = req.body;
  console.log(`Assigning student ${studentEmail} to test ${req.params.id}`);
  try {
    const test = await Test.findById(req.params.id);
    if (!test || test.teacherId.toString() !== req.user.id) {
      console.log('Test not found or unauthorized');
      return res.status(404).json({ message: 'Test not found or unauthorized' });
    }
    const student = await User.findOne({ email: studentEmail, role: 'student' });
    if (!student) {
      console.log('Student not found');
      return res.status(404).json({ message: 'Student not found' });
    }
    if (!test.assignedStudents.includes(student._id)) {
      test.assignedStudents.push(student._id);
      await test.save();
      console.log(`Student ${student._id} assigned to test ${test._id}`);
    } else {
      console.log('Student already assigned');
    }
    const updatedTest = await Test.findById(req.params.id)
      .populate('assignedStudents', 'email')
      .populate('submissions.studentId', 'email');
    console.log('Updated test:', updatedTest);
    res.json(updatedTest);
  } catch (err) {
    console.error('Error assigning student:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Plagiarism Detection Function
const checkPlagiarism = (text) => {
  // Sample common web phrases or external content to check against
  const webContent = [
    "Lorem ipsum dolor sit amet",
    "The quick brown fox jumps over the lazy dog",
    "To be or not to be, that is the question",
    // Add more real-world examples or fetch from an external source in production
  ];
  
  let maxSimilarity = 0;
  webContent.forEach(source => {
    const similarity = stringSimilarity.compareTwoStrings(text.toLowerCase(), source.toLowerCase());
    if (similarity > maxSimilarity) maxSimilarity = similarity;
  });

  // Flag as plagiarized if similarity exceeds a threshold (e.g., 0.6)
  return maxSimilarity > 0.6;
};

app.post('/tests/:id/submit', auth, async (req, res) => {
  if (req.user.role !== 'student') return res.status(403).json({ message: 'Unauthorized' });
  const { answers, wasPasted } = req.body;
  console.log(`Submission for test ${req.params.id}: wasPasted = ${wasPasted}`);
  const test = await Test.findById(req.params.id);
  if (!test || !test.assignedStudents.includes(req.user.id)) {
    return res.status(403).json({ message: 'Not authorized to submit' });
  }
  const hasSubmitted = test.submissions.some(sub => sub.studentId.toString() === req.user.id);
  if (hasSubmitted) return res.status(403).json({ message: 'You have already submitted this test' });

  // Check for plagiarism
  const plagiarismFlag = answers.some(ans => checkPlagiarism(ans.text));
  console.log(`Plagiarism check result: ${plagiarismFlag}`);

  test.submissions.push({ studentId: req.user.id, answers, wasPasted, plagiarismFlag });
  await test.save();
  console.log('Saved submission:', test.submissions[test.submissions.length - 1]);
  res.json(test);
});

app.get('/students', auth, async (req, res) => {
  if (req.user.role !== 'teacher') return res.status(403).json({ message: 'Unauthorized' });
  const students = await User.find({ role: 'student' }, 'email');
  res.json(students);
});

app.listen(5000, () => console.log('Server running on port 5000'));