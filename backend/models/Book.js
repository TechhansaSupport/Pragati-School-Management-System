const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
  bookId: {
    type: String,
    required: true,
    trim: true,
  },
  title: {
    type: String,
    required: [true, 'Book title is required'],
    trim: true,
  },
  author: {
    type: String,
    required: [true, 'Author name is required'],
    trim: true,
  },
  category: {
    type: String,
    default: 'General',
    trim: true,
  },
  totalCopies: {
    type: Number,
    default: 5,
  },
  availableCopies: {
    type: Number,
    default: 5,
  },
  status: {
    type: String,
    enum: ['Available', 'Low Stock', 'Issued Out'],
    default: 'Available',
  },
  entityId: {
    type: String,
    required: true,
    index: true,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Book', bookSchema);
