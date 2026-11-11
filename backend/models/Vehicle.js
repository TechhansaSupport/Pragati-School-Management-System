const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema({
  vehicleNumber: {
    type: String,
    required: [true, 'Vehicle number is required'],
    trim: true,
  },
  model: {
    type: String,
    default: 'Tata Starbus 40-Seater',
    trim: true,
  },
  vehicleType: {
    type: String,
    enum: ['Bus', 'Mini Bus', 'Van', 'Other'],
    default: 'Bus',
  },
  capacity: {
    type: Number,
    required: true,
    default: 40,
  },
  fuelType: {
    type: String,
    enum: ['Diesel', 'CNG', 'Electric', 'Petrol'],
    default: 'Diesel',
  },
  insuranceExpiry: {
    type: String,
    default: '2027-03-31',
    trim: true,
  },
  fitnessExpiry: {
    type: String,
    default: '2027-06-30',
    trim: true,
  },
  assignedRoute: {
    type: String,
    default: '',
    trim: true,
  },
  assignedDriver: {
    type: String,
    default: '',
    trim: true,
  },
  status: {
    type: String,
    enum: ['Active', 'In Service', 'Maintenance', 'Standby'],
    default: 'Active',
  },
  entityId: {
    type: String,
    required: true,
    index: true,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Vehicle', vehicleSchema);

