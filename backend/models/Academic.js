const mongoose = require('mongoose');

const academicSchema = new mongoose.Schema({
  subject: {
    type: String,
    required: [true, 'Subject name is required'],
    trim: true,
  },
  gradeLevel: {
    type: String,
    required: [true, 'Grade level is required'],
    trim: true,
  },
  section: {
    type: String,
    default: 'A',
    trim: true,
  },
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Staff',
  },
  teacherName: {
    type: String,
    trim: true,
  },
  studentsEnrolled: {
    type: Number,
    default: 0,
  },
  schedule: {
    type: String,
    trim: true,
  },
  status: {
    type: String,
    enum: ['Active', 'Archived', 'Upcoming'],
    default: 'Active',
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Academic', academicSchema);
