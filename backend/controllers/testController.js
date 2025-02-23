const Test = require('../models/Test');
const User = require('../models/User');
const Groq = require('groq-sdk');

// Initialize Groq with API key from environment variables
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Function to analyze content for AI generation and plagiarism using Groq API
const analyzeContent = async (text) => {
  const prompt = `
    Analyze the following content and return a JSON object indicating whether it is AI-generated and/or plagiarized. The response must be valid JSON with the following structure:
    {
      "isAIGenerated": true/false,
      "isPlagiarized": true/false
    }
    Ensure the output is strictly JSON, with no additional text or explanation outside the JSON object.

    Content to analyze:
    ${text}
  `;

  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.3-70b-versatile',
      temperature: 1,
      max_completion_tokens: 1024,
      top_p: 1,
      stream: false,
    });

    const result = chatCompletion.choices[0]?.message?.content || '{}';
    console.log('Raw Groq Response:', result); // Log raw response for debugging

    // Attempt to parse the response as JSON
    let parsedResult;
    try {
      parsedResult = JSON.parse(result);
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError.message);
      // Fallback: Manually extract flags if JSON parsing fails
      const lowerResult = result.toLowerCase();
      parsedResult = {
        isAIGenerated: lowerResult.includes('isaigenerated": true'),
        isPlagiarized: lowerResult.includes('isplagiarized": true'),
      };
    }

    return {
      aiGenerated: parsedResult.isAIGenerated || false,
      plagiarized: parsedResult.isPlagiarized || false,
    };
  } catch (error) {
    console.error('Groq API Error:', error);
    return { aiGenerated: false, plagiarized: false }; // Default to false on error
  }
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

    // Analyze each answer for AI and plagiarism
    const analysisResults = await Promise.all(answers.map(async (ans) => await analyzeContent(ans.text)));
    const plagiarismFlag = analysisResults.some(result => result.plagiarized);
    const aiGeneratedFlag = analysisResults.some(result => result.aiGenerated);

    test.submissions.push({
      studentId: req.user.id,
      answers,
      wasPasted,
      plagiarismFlag,
      aiGeneratedFlag,
    });
    await test.save();
    res.json(test);
  } catch (err) {
    console.error('Submit Test Error:', err);
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
};