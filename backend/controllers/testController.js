const Test = require('../models/Test');
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