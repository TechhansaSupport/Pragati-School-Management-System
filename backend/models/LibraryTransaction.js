const mongoose = require('mongoose');

const libraryTransactionSchema = new mongoose.Schema({
  transactionId: {
    type: String,
    required: true,
    trim: true,
  },
  student: {
    type: String,
    required: [true, 'Student name is required'],
    trim: true,
  },
  classSection: {
    type: String,
    default: 'Class 10 - A',
    trim: true,
  },
  rollNo: {
    type: String,
    default: '',
    trim: true,
  },
  phone: {
    type: String,
    default: '',
    trim: true,
  },
  email: {
    type: String,
    default: '',
    trim: true,
  },
  book: {
    type: String,
    required: [true, 'Book title is required'],
    trim: true,
  },
  bookId: {
    type: String,
    default: '',
    trim: true,
  },
  category: {
    type: String,
    default: 'General',
    trim: true,
  },
  action: {
    type: String,
    enum: ['Issued', 'Returned'],
    default: 'Issued',
  },
  date: {
    type: String,
    default: () => new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
  },
  dueDate: {
    type: String,
    required: true,
  },
  returnDate: {
    type: String,
    default: '',
  },
  status: {
    type: String,
    enum: ['Active', 'Completed', 'Overdue'],
    default: 'Active',
  },
  fine: {
    type: Number,
    default: 0,
  },
  finePaid: {
    type: Boolean,
    default: false,
  },
  daysOverdue: {
    type: Number,
    default: 0,
  },
  entityId: {
    type: String,
    required: true,
    index: true,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('LibraryTransaction', libraryTransactionSchema);
