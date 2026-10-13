const mongoose = require('mongoose');

const transportRouteSchema = new mongoose.Schema({
  routeId: {
    type: String,
    required: true,
    trim: true,
  },
  name: {
    type: String,
    required: [true, 'Route name is required'],
    trim: true,
  },
  start: {
    type: String,
    required: true,
    trim: true,
  },
  end: {
    type: String,
    default: 'School Campus',
    trim: true,
  },
  stops: {
    type: Number,
    default: 5,
  },
  busNumber: {
    type: String,
    required: true,
    trim: true,
  },
  driverName: {
    type: String,
    required: true,
    trim: true,
  },
  driverContact: {
    type: String,
    trim: true,
  },
  timing: {
    type: String,
    default: '07:00 AM - 08:00 AM',
    trim: true,
  },
  studentsAssigned: {
    type: Number,
    default: 30,
  },
  capacity: {
    type: Number,
    default: 45,
  },
  distance: {
    type: String,
    default: '10 km',
    trim: true,
  },
  status: {
    type: String,
    enum: ['On Time', 'Delayed', 'Completed', 'Maintenance'],
    default: 'On Time',
  },
  entityId: {
    type: String,
    required: true,
    index: true,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('TransportRoute', transportRouteSchema);
