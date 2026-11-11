const mongoose = require('mongoose');

const driverSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Driver name is required'],
    trim: true,
  },
  contact: {
    type: String,
    required: [true, 'Contact number is required'],
    trim: true,
  },
  licenseNumber: {
    type: String,
    required: [true, 'Commercial driving license number is required'],
    trim: true,
  },
  licenseExpiry: {
    type: String,
    default: '2028-12-31',
    trim: true,
  },
  experienceYears: {
    type: Number,
    default: 5,
  },
  assignedBus: {
    type: String,
    default: '',
    trim: true,
  },
  assignedRoute: {
    type: String,
    default: '',
    trim: true,
  },
  status: {
    type: String,
    enum: ['On Duty', 'Available', 'On Leave'],
    default: 'On Duty',
  },
  entityId: {
    type: String,
    required: true,
    index: true,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Driver', driverSchema);

