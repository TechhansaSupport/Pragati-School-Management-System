const mongoose = require('mongoose');

const gatePassSchema = new mongoose.Schema({
  passNumber: {
    type: String,
    trim: true,
  },
  studentName: {
    type: String,
    required: [true, 'Student name is required'],
    trim: true,
  },
  rollNo: {
    type: String,
    trim: true,
    default: '',
  },
  classSection: {
    type: String,
    trim: true,
    default: '',
  },
  passType: {
    type: String,
    enum: ['Early Departure', 'Late Arrival', 'Campus Movement', 'Emergency Leave'],
    default: 'Early Departure',
  },
  reason: {
    type: String,
    required: [true, 'Reason is required'],
    trim: true,
  },
  escortedBy: {
    type: String,
    default: 'Parent / Guardian',
    trim: true,
  },
  parentContact: {
    type: String,
    trim: true,
    default: '',
  },
  parentPermissionVerified: {
    type: Boolean,
    default: true,
  },
  outTime: {
    type: Date,
    default: Date.now,
  },
  inTime: {
    type: Date,
  },
  status: {
    type: String,
    enum: ['Approved & Exited', 'Pending Departure', 'Returned', 'Cancelled'],
    default: 'Approved & Exited',
  },
  issuedBy: {
    type: String,
    default: 'Support Staff',
  },
  remarks: {
    type: String,
    trim: true,
    default: '',
  },
  schoolSlug: { type: String, trim: true, index: true },
  entityId: { type: String, required: true, index: true },
}, {
  timestamps: true,
});

module.exports = mongoose.model('GatePass', gatePassSchema);
