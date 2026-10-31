const mongoose = require('mongoose');

const periodSchema = new mongoose.Schema({
  periodNumber: {
    type: Number,
    required: true,
  },
  periodName: {
    type: String,
    default: function() { return `P${this.periodNumber}`; },
  },
  startTime: {
    type: String,
    default: '08:30',
  },
  endTime: {
    type: String,
    default: '09:20',
  },
  subject: {
    type: String,
    default: 'General Study',
    trim: true,
  },
  subjectCode: {
    type: String,
    trim: true,
  },
  teacher: {
    type: String,
    default: 'Duty Faculty',
    trim: true,
  },
  teacherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Staff',
    default: null,
  },
  room: {
    type: String,
    default: 'Room 101',
    trim: true,
  },
  type: {
    type: String,
    enum: ['Lecture', 'Lab', 'Tutorial', 'Activity', 'Assessment', 'Break', 'Recess', 'Assembly', 'Zero Period', 'Self Study'],
    default: 'Lecture',
  },
  isRecess: {
    type: Boolean,
    default: false,
  },
}, { _id: true });

const timetableSchema = new mongoose.Schema({
  className: {
    type: String,
    required: [true, 'Class name is required'],
    trim: true,
  },
  section: {
    type: String,
    required: [true, 'Section is required'],
    trim: true,
    uppercase: true,
    default: 'A',
  },
  academicSession: {
    type: String,
    default: '2026-2027',
    trim: true,
  },
  schedule: {
    Monday: { type: [periodSchema], default: [] },
    Tuesday: { type: [periodSchema], default: [] },
    Wednesday: { type: [periodSchema], default: [] },
    Thursday: { type: [periodSchema], default: [] },
    Friday: { type: [periodSchema], default: [] },
    Saturday: { type: [periodSchema], default: [] },
    Sunday: { type: [periodSchema], default: [] },
  },
  offDays: {
    type: [String],
    default: ['Sunday'],
  },
  status: {
    type: String,
    enum: ['Active', 'Draft', 'Archived'],
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

// Compound unique index: Each school entity has one timetable per class and section
timetableSchema.index({ className: 1, section: 1, entityId: 1 }, { unique: true });
timetableSchema.index({ entityId: 1, schoolSlug: 1 });

module.exports = mongoose.models.Timetable || mongoose.model('Timetable', timetableSchema);
