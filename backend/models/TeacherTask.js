const mongoose = require('mongoose');

const teacherTaskSchema = new mongoose.Schema({
  text: { type: String, required: true, trim: true },
  due: { type: String, default: 'Due Tomorrow' },
  priority: { type: String, enum: ['Urgent', 'Normal', 'Important'], default: 'Normal' },
  completed: { type: Boolean, default: false },
  teacherUsername: { type: String },
  teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff' },
  entityId: { type: String, required: true, index: true },
  schoolSlug: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('TeacherTask', teacherTaskSchema);
