const User = require('../models/User');

exports.getStudents = async (req, res) => {
  try {
    const students = await User.find({ role: 'student' }, 'email');
    res.json(students);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};