const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  refId: {
    type: String,
    required: [true, 'Reference ID is required'],
    unique: true,
    trim: true,
  },
  type: {
    type: String,
    enum: ['Fee Collection', 'Expense'],
    required: [true, 'Transaction type is required'],
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    trim: true,
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: 0,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
  },
  studentName: {
    type: String,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  paymentMethod: {
    type: String,
    enum: ['Cash', 'UPI', 'Bank Transfer', 'Cheque', 'Online'],
    default: 'Cash',
  },
  status: {
    type: String,
    enum: ['Completed', 'Pending', 'Failed', 'Refunded'],
    default: 'Completed',
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Transaction', transactionSchema);
