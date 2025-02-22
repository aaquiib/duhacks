const Test = require('../models/Test');
const User = require('../models/User');

const stringSimilarity = require('string-similarity');

const checkPlagiarism = (text) => {
  const webContent = [
    "Lorem ipsum dolor sit amet",
    "The quick brown fox jumps over the lazy dog",
    "To be or not to be, that is the question",
  ];
  let maxSimilarity = 0;
  webContent.forEach(source => {
    const similarity = stringSimilarity.compareTwoStrings(text.toLowerCase(), source.toLowerCase());
    if (similarity > maxSimilarity) maxSimilarity = similarity;
  });
  return maxSimilarity > 0.6;
};

exports.createTest = async (req, res) => {
  const { title, questions } = req.body;
  if (!title || !questions || !Array.isArray(questions) || questions.length === 0) {
    return res.status(400).json({ message: 'Title and at least one question are required' });
  }
  try {
    const test = new Test({ title, teacherId: req.user.id, questions, assignedStudents: [] });
    await test.save();
    res.status(201).json(test);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getTests = async (req, res) => {
  try {
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
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.submitTest = async (req, res) => {
  const { answers, wasPasted } = req.body;
  try {
    const test = await Test.findById(req.params.id);
    if (!test || !test.assignedStudents.includes(req.user.id)) {
      return res.status(403).json({ message: 'Not authorized to submit' });
    }
    const hasSubmitted = test.submissions.some(sub => sub.studentId.toString() === req.user.id);
    if (hasSubmitted) return res.status(403).json({ message: 'You have already submitted this test' });

    const plagiarismFlag = answers.some(ans => checkPlagiarism(ans.text));
    test.submissions.push({ studentId: req.user.id, answers, wasPasted, plagiarismFlag });
    await test.save();
    res.json(test);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.assignTest = async (req, res) => {
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
}