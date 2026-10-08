const mongoose = require('mongoose');

const feeSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
  },
  studentName: {
    type: String,
    required: [true, 'Student name is required'],
    trim: true,
  },
  classSection: {
    type: String,
    trim: true,
  },
  parentContact: {
    type: String,
    trim: true,
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: 0,
  },
  dueDate: {
    type: Date,
    required: [true, 'Due date is required'],
  },
  status: {
    type: String,
    enum: ['Collected', 'Due this month', 'Overdue'],
    default: 'Due this month',
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Fee', feeSchema);
