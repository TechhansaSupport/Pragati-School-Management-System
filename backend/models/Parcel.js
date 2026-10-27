const mongoose = require('mongoose');

const parcelSchema = new mongoose.Schema({
  trackingNumber: {
    type: String,
    trim: true,
    default: '',
  },
  courierService: {
    type: String,
    default: 'India Post',
    trim: true,
  },
  type: {
    type: String,
    enum: ['Inward', 'Outward'],
    default: 'Inward',
  },
  sender: {
    type: String,
    trim: true,
    default: '',
  },
  recipient: {
    type: String,
    required: [true, 'Recipient name/department is required'],
    trim: true,
  },
  department: {
    type: String,
    default: 'Administration',
    trim: true,
  },
  status: {
    type: String,
    enum: ['Received at Desk', 'Handed Over', 'Dispatched', 'Returned'],
    default: 'Received at Desk',
  },
  receivedDate: {
    type: Date,
    default: Date.now,
  },
  handedOverDate: {
    type: Date,
  },
  receivedByStaff: {
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

module.exports = mongoose.model('Parcel', parcelSchema);
