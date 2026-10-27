const mongoose = require('mongoose');

const visitorSchema = new mongoose.Schema({
  visitorName: {
    type: String,
    required: [true, 'Visitor name is required'],
    trim: true,
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true,
  },
  purpose: {
    type: String,
    default: 'Meeting',
    trim: true,
  },
  hostPerson: {
    type: String,
    default: 'Administration',
    trim: true,
  },
  department: {
    type: String,
    default: 'General Duty',
    trim: true,
  },
  idType: {
    type: String,
    enum: ['Aadhaar Card', 'Driving License', 'Voter ID', 'PAN Card', 'Student ID', 'Other', 'None'],
    default: 'Aadhaar Card',
  },
  idNumber: {
    type: String,
    trim: true,
    default: '',
  },
  vehicleNumber: {
    type: String,
    trim: true,
    default: '',
  },
  passNumber: {
    type: String,
    trim: true,
  },
  badgeNumber: {
    type: String,
    trim: true,
    default: '',
  },
  checkInTime: {
    type: Date,
    default: Date.now,
  },
  checkOutTime: {
    type: Date,
  },
  status: {
    type: String,
    enum: ['Checked In', 'Completed', 'Cancelled'],
    default: 'Checked In',
  },
  remarks: {
    type: String,
    trim: true,
    default: '',
  },
  recordedBy: {
    type: String,
    default: 'Support Staff',
  },
  schoolSlug: { type: String, trim: true, index: true },
  entityId: { type: String, required: true, index: true },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Visitor', visitorSchema);
