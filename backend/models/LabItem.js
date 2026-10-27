const mongoose = require('mongoose');

const labItemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Lab item name is required'],
    trim: true,
  },
  labType: {
    type: String,
    enum: ['Physics', 'Chemistry', 'Biology', 'Computer & STEM', 'General Science'],
    default: 'General Science',
  },
  category: {
    type: String,
    enum: ['Apparatus', 'Chemical', 'Glassware', 'Instrument', 'Electronic Instrument', 'Specimen & Kit', 'Consumable', 'Safety & Protective'],
    default: 'Apparatus',
  },
  quantity: {
    type: Number,
    default: 1,
  },
  unit: {
    type: String,
    default: 'units',
  },
  status: {
    type: String,
    enum: ['Operational', 'In Use', 'Low Stock', 'Needs Calibration', 'Under Repair', 'Damaged', 'Expired'],
    default: 'Operational',
  },
  location: {
    type: String,
    default: 'Storage Shelf 1',
    trim: true,
  },
  hazardLevel: {
    type: String,
    enum: ['None', 'Low', 'Moderate', 'High', 'Corrosive / Toxic'],
    default: 'None',
  },
  minimumThreshold: {
    type: Number,
    default: 5,
  },
  lastInspected: {
    type: Date,
    default: Date.now,
  },
  notes: {
    type: String,
    default: '',
    trim: true,
  },
  entityId: {
    type: String,
    required: true,
    index: true,
  },
  schoolSlug: {
    type: String,
    default: '',
  }
}, { timestamps: true });

module.exports = mongoose.models.LabItem || mongoose.model('LabItem', labItemSchema);
