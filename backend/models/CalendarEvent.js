const mongoose = require('mongoose');

const calendarEventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: '',
    trim: true
  },
  category: {
    type: String,
    enum: ['Holiday', 'Event', 'Examination', 'Activity', 'Meeting', 'Sports', 'Cultural', 'Other'],
    default: 'Event'
  },
  type: {
    type: String,
    enum: ['holiday', 'event', 'exam', 'meeting'],
    default: 'event'
  },
  startDate: {
    type: String, // 'YYYY-MM-DD'
    required: true,
    trim: true
  },
  endDate: {
    type: String, // 'YYYY-MM-DD'
    required: true,
    trim: true
  },
  startTime: {
    type: String,
    default: '09:00 AM',
    trim: true
  },
  endTime: {
    type: String,
    default: '03:00 PM',
    trim: true
  },
  allDay: {
    type: Boolean,
    default: true
  },
  location: {
    type: String,
    default: 'Main Campus',
    trim: true
  },
  audience: {
    type: String,
    enum: ['All', 'Students', 'Teachers & Staff', 'Parents', 'Grades 9-12', 'Grades 1-8'],
    default: 'All'
  },
  isHoliday: {
    type: Boolean,
    default: false
  },
  color: {
    type: String,
    default: '#4F46E5'
  },
  entityId: {
    type: String,
    required: true
  },
  schoolSlug: {
    type: String,
    default: ''
  },
  createdBy: {
    type: String,
    default: 'Administrator'
  },
  createdRole: {
    type: String,
    default: 'admin'
  }
}, {
  timestamps: true
});

calendarEventSchema.index({ entityId: 1, schoolSlug: 1, startDate: 1 });

module.exports = mongoose.model('CalendarEvent', calendarEventSchema);

