const mongoose = require('mongoose');

const attendanceRecordSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true,
  },
  studentName: {
    type: String,
    required: true,
    trim: true,
  },
  rollNo: {
    type: String,
    trim: true,
    default: '',
  },
  status: {
    type: String,
    enum: ['Present', 'Absent', 'Late', 'Excused'],
    default: 'Present',
  },
  remarks: {
    type: String,
    trim: true,
    default: '',
  },
}, { _id: false });

const attendanceSchema = new mongoose.Schema({
  className: {
    type: String,
    required: [true, 'Class name is required'],
    trim: true,
    index: true,
  },
  section: {
    type: String,
    required: [true, 'Section is required'],
    trim: true,
    uppercase: true,
    default: 'A',
    index: true,
  },
  date: {
    type: String, // Format: YYYY-MM-DD
    required: [true, 'Attendance date (YYYY-MM-DD) is required'],
    trim: true,
    index: true,
  },
  academicSession: {
    type: String,
    default: '2026-2027',
    trim: true,
  },
  records: {
    type: [attendanceRecordSchema],
    default: [],
  },
  summary: {
    total: { type: Number, default: 0 },
    present: { type: Number, default: 0 },
    absent: { type: Number, default: 0 },
    late: { type: Number, default: 0 },
    excused: { type: Number, default: 0 },
    attendanceRate: { type: Number, default: 100 }, // percentage
  },
  markedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  markedByName: {
    type: String,
    trim: true,
    default: 'Class Teacher',
  },
  notes: {
    type: String,
    trim: true,
    default: '',
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

// Compound unique index: Only 1 attendance sheet per class, section, date and school workspace
attendanceSchema.index({ className: 1, section: 1, date: 1, entityId: 1 }, { unique: true });
attendanceSchema.index({ entityId: 1, date: 1 });
attendanceSchema.index({ entityId: 1, className: 1, section: 1 });

module.exports = mongoose.models.Attendance || mongoose.model('Attendance', attendanceSchema);
