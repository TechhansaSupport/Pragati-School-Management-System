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
    unique: true,
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
}, {
  timestamps: true,
});

module.exports = mongoose.model('Student', studentSchema);
