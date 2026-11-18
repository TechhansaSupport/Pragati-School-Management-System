const mongoose = require('mongoose');

const promotionLogSchema = new mongoose.Schema({
  entityId: {
    type: String,
    required: true,
    index: true,
  },
  schoolSlug: {
    type: String,
    trim: true,
    index: true,
  },
  mode: {
    type: String,
    enum: ['class_wise', 'school_rollover'],
    default: 'class_wise',
  },
  fromSession: {
    type: String,
    required: true,
    trim: true,
  },
  toSession: {
    type: String,
    required: true,
    trim: true,
  },
  sourceClass: {
    type: String,
    trim: true,
  },
  targetClass: {
    type: String,
    trim: true,
  },
  totalProcessed: {
    type: Number,
    default: 0,
  },
  promotedCount: {
    type: Number,
    default: 0,
  },
  retainedCount: {
    type: Number,
    default: 0,
  },
  graduatedCount: {
    type: Number,
    default: 0,
  },
  transferredCount: {
    type: Number,
    default: 0,
  },
  executedBy: {
    type: String,
    trim: true,
    default: 'Administrator',
  },
  executedByRole: {
    type: String,
    trim: true,
  },
  details: [{
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
    studentName: String,
    rollNo: String,
    fromGrade: String,
    toGrade: String,
    fromSection: String,
    toSection: String,
    action: String,
    remarks: String,
  }],
  notes: {
    type: String,
    trim: true,
  },
}, {
  timestamps: true,
});

promotionLogSchema.index({ entityId: 1, createdAt: -1 });

module.exports = mongoose.models.PromotionLog || mongoose.model('PromotionLog', promotionLogSchema);
