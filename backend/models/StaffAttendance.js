const mongoose = require('mongoose');

const punchItemSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['IN', 'OUT'],
    required: true,
  },
  time: {
    type: Date,
    default: Date.now,
  },
  note: {
    type: String,
    trim: true,
    default: '',
  },
  location: {
    type: String,
    trim: true,
    default: 'Campus Portal',
  },
  ip: {
    type: String,
    default: '',
  },
  latitude: {
    type: Number,
    default: null,
  },
  longitude: {
    type: Number,
    default: null,
  },
  accuracy: {
    type: Number,
    default: null, // GPS accuracy radius in meters
  },
  distanceMeters: {
    type: Number,
    default: null, // Distance from campus center in meters at time of punch
  },
  isWithinGeofence: {
    type: Boolean,
    default: false,
  }
}, { _id: true });

const staffAttendanceSchema = new mongoose.Schema({
  staffId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Staff',
    required: true,
    index: true,
  },
  staffName: {
    type: String,
    required: true,
    trim: true,
  },
  employeeId: {
    type: String,
    required: true,
    trim: true,
  },
  role: {
    type: String,
    default: 'Staff',
  },
  department: {
    type: String,
    default: 'General',
  },
  date: {
    type: String, // 'YYYY-MM-DD'
    required: true,
    index: true,
  },
  punchIn: {
    type: Date,
    default: null,
  },
  punchOut: {
    type: Date,
    default: null,
  },
  punches: [punchItemSchema],
  workDurationMinutes: {
    type: Number,
    default: 0,
  },
  status: {
    type: String,
    enum: ['Present', 'Half Day', 'Late', 'Overtime', 'Left Early', 'On Duty', 'Absent'],
    default: 'Present',
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

// Ensure unique record per staff member per date in the school workspace
staffAttendanceSchema.index({ staffId: 1, date: 1, entityId: 1 }, { unique: true });
staffAttendanceSchema.index({ entityId: 1, date: 1 });
staffAttendanceSchema.index({ schoolSlug: 1, date: 1 });

module.exports = mongoose.models.StaffAttendance || mongoose.model('StaffAttendance', staffAttendanceSchema);
