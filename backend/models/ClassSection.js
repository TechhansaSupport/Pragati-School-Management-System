const mongoose = require('mongoose');

const classSectionSchema = new mongoose.Schema({
  className: {
    type: String,
    required: [true, 'Class name or grade level is required'],
    trim: true,
  },
  section: {
    type: String,
    required: [true, 'Section identifier is required'],
    trim: true,
    uppercase: true,
    default: 'A',
  },
  classTeacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Staff',
    default: null,
  },
  classTeacherName: {
    type: String,
    trim: true,
    default: 'Unassigned',
  },
  roomNumber: {
    type: String,
    trim: true,
    default: 'TBD',
  },
  capacity: {
    type: Number,
    default: 40,
    min: 1,
  },
  academicSession: {
    type: String,
    trim: true,
    default: '2026-2027',
  },
  subjects: {
    type: [String],
    default: ['Mathematics', 'Science', 'English', 'Social Studies'],
  },
  schedule: {
    type: String,
    trim: true,
    default: 'Mon - Fri | 08:30 AM - 02:30 PM',
  },
  status: {
    type: String,
    enum: ['Active', 'Archived'],
    default: 'Active',
  },
  entityId: {
    type: String,
    required: true,
    index: true,
  },
  schoolSlug: {
    type: String,
    trim: true,
    index: true,
  },
}, {
  timestamps: true,
});

// Compound unique index per school workspace: Each school can have only one unique Class + Section pair
classSectionSchema.index({ className: 1, section: 1, entityId: 1 }, { unique: true });
classSectionSchema.index({ className: 1, section: 1, schoolSlug: 1 });

module.exports = mongoose.models.ClassSection || mongoose.model('ClassSection', classSectionSchema);
