const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Student name is required'],
    trim: true,
  },
  rollNo: {
    type: String,
    required: [true, 'Roll number is required'],
    trim: true,
  },
  grade: {
    type: String,
    required: [true, 'Grade/Class is required'],
    trim: true,
  },
  section: {
    type: String,
    default: 'A',
    trim: true,
  },
  dateOfBirth: {
    type: Date,
  },
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other'],
  },
  parentName: {
    type: String,
    trim: true,
  },
  parentContact: {
    type: String,
    trim: true,
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
  },
  address: {
    type: String,
    trim: true,
  },
  attendance: {
    type: Number,
    default: 100,
    min: 0,
    max: 100,
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive', 'Graduated', 'Transferred'],
    default: 'Active',
  },
  admissionDate: {
    type: Date,
    default: Date.now,
  },
  schoolSlug: { type: String, trim: true, index: true },
  entityId: { type: String, required: true, index: true },
  // Student Portal Login Credentials
  userId: { type: String, trim: true },
  portalPassword: { type: String, default: 'student123' },
}, {
  timestamps: true,
});

// Compound unique index per school workspace
studentSchema.index({ rollNo: 1, entityId: 1 }, { unique: true });

module.exports = mongoose.model('Student', studentSchema);
