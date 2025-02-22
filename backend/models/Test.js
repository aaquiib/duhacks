const mongoose = require('mongoose');

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
    plagiarismFlag: { type: Boolean, default: false },
  }],
});

module.exports = mongoose.model('Test', testSchema);