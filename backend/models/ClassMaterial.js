const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
  studentName: { type: String, required: true },
  rollNo: { type: String },
  submittedAt: { type: Date, default: Date.now },
  marksObtained: { type: Number },
  maxMarks: { type: Number, default: 50 },
  feedback: { type: String },
  submissionText: { type: String },
  attachmentUrl: { type: String },
  status: { type: String, enum: ['Submitted', 'Graded', 'Pending'], default: 'Submitted' }
});

const classMaterialSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  type: { 
    type: String, 
    enum: ['Note', 'Assignment', 'Study Material', 'Circular'], 
    default: 'Note' 
  },
  classSection: { type: String, required: true }, // e.g. "Class 10 - A"
  className: { type: String, required: true },
  section: { type: String, required: true },
  subject: { type: String, required: true },
  chapter: { type: String, default: '' },
  content: { type: String, required: true },
  attachments: [{
    title: { type: String },
    url: { type: String },
    fileType: { type: String, default: 'PDF' },
    fileSize: { type: String, default: '1.2 MB' }
  }],
  dueDate: { type: Date },
  maxMarks: { type: Number, default: 50 },
  teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff' },
  teacherName: { type: String, default: 'Class Faculty' },
  entityId: { type: String, required: true, index: true },
  schoolSlug: { type: String },
  submissions: [submissionSchema],
  status: { type: String, enum: ['Active', 'Archived'], default: 'Active' }
}, { timestamps: true });

module.exports = mongoose.model('ClassMaterial', classMaterialSchema);

