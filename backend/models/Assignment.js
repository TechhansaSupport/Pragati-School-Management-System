const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
  studentName: { type: String, required: true },
  rollNo: { type: String },
  submittedAt: { type: Date, default: Date.now },
  marksObtained: { type: Number },
  maxMarks: { type: Number, default: 50 },
  feedback: { type: String },
  status: { type: String, enum: ['Submitted', 'Graded', 'Pending'], default: 'Submitted' }
});

const assignmentSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  classSection: { type: String, required: true }, // e.g. "Class 10 - A"
  className: { type: String },
  section: { type: String },
  subject: { type: String, required: true },
  dueDate: { type: Date },
  maxMarks: { type: Number, default: 50 },
  instructions: { type: String },
  teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff' },
  teacherName: { type: String },
  entityId: { type: String, required: true, index: true },
  schoolSlug: { type: String },
  submissions: [submissionSchema],
  status: { type: String, enum: ['Active', 'Completed', 'Draft'], default: 'Active' },
}, { timestamps: true });

module.exports = mongoose.model('Assignment', assignmentSchema);
