const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Announcement title is required'],
    trim: true,
  },
  content: {
    type: String,
    required: [true, 'Content is required'],
    trim: true,
  },
  targetAudience: {
    type: String,
    enum: ['All Students & Parents', 'Staff Only', 'Teachers', 'Students', 'All'],
    default: 'All Students & Parents',
  },
  priority: {
    type: String,
    enum: ['Normal', 'Important', 'Urgent'],
    default: 'Normal',
  },
  author: {
    type: String,
    default: 'School Administration',
    trim: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  entityId: {
    type: String,
    required: true,
    index: true,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Announcement', announcementSchema);
