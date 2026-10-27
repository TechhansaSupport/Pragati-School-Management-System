const mongoose = require('mongoose');

const practicalSessionSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Practical session title / experiment is required'],
    trim: true,
  },
  subject: {
    type: String,
    enum: ['Physics Practical', 'Chemistry Practical', 'Biology Practical', 'STEM & Robotics Lab', 'General Science'],
    default: 'General Science',
  },
  labRoom: {
    type: String,
    required: [true, 'Laboratory room is required'],
    trim: true,
    default: 'Main Science Lab',
  },
  classSection: {
    type: String,
    required: [true, 'Class and section are required'],
    trim: true,
  },
  studentCount: {
    type: Number,
    required: [true, 'Number of students in the class is required'],
    min: 1,
    default: 30,
  },
  workstationsCount: {
    type: Number,
    default: 15,
  },
  instructor: {
    type: String,
    required: [true, 'Supervising faculty / teacher is required'],
    trim: true,
    default: 'Science Faculty',
  },
  scheduledDate: {
    type: Date,
    default: Date.now,
  },
  timeSlot: {
    type: String,
    required: [true, 'Time slot is required'],
    trim: true,
    default: '10:00 AM - 11:30 AM',
  },
  requiredEquipments: {
    type: [String],
    default: [],
  },
  requiredChemicals: {
    type: [String],
    default: [],
  },
  safetyRequirements: {
    type: [String],
    default: [],
  },
  readinessStatus: {
    type: String,
    enum: ['Setup Required', 'In Progress', 'Ready & Sanitized', 'Completed', 'Cancelled'],
    default: 'Setup Required',
  },
  color: {
    type: String,
    default: '#4F46E5',
  },
  notes: {
    type: String,
    default: '',
    trim: true,
  },
  createdBy: {
    type: String,
    default: 'Lab Assistant',
  },
  entityId: {
    type: String,
    required: true,
    index: true,
  },
  schoolSlug: {
    type: String,
    default: '',
    index: true,
  }
}, { timestamps: true });

module.exports = mongoose.models.PracticalSession || mongoose.model('PracticalSession', practicalSessionSchema);
