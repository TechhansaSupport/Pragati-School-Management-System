const mongoose = require('mongoose');

const inquirySchema = new mongoose.Schema({
  inquiryNumber: {
    type: String,
    trim: true,
  },
  parentName: {
    type: String,
    required: [true, 'Parent / Guardian name is required'],
    trim: true,
  },
  studentName: {
    type: String,
    trim: true,
    default: '',
  },
  phone: {
    type: String,
    required: [true, 'Contact number is required'],
    trim: true,
  },
  email: {
    type: String,
    trim: true,
    default: '',
  },
  gradeSeeking: {
    type: String,
    default: 'Class 1',
    trim: true,
  },
  previousSchool: {
    type: String,
    trim: true,
    default: '',
  },
  source: {
    type: String,
    enum: ['Walk-in', 'Phone Call', 'Referral', 'Banner / Hoarding', 'Website / Online', 'Social Media', 'Other'],
    default: 'Walk-in',
  },
  status: {
    type: String,
    enum: ['New', 'Contacted', 'Form Issued', 'Follow-up Required', 'Admitted', 'Closed'],
    default: 'New',
  },
  followUpDate: {
    type: Date,
  },
  notes: {
    type: String,
    trim: true,
    default: '',
  },
  handledBy: {
    type: String,
    default: 'Support Staff',
  },
  schoolSlug: { type: String, trim: true, index: true },
  entityId: { type: String, required: true, index: true },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Inquiry', inquirySchema);
