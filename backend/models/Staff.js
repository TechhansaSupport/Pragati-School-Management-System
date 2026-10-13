const mongoose = require('mongoose');

const staffSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Staff name is required'],
    trim: true,
  },
  employeeId: {
    type: String,
    required: [true, 'Employee ID is required'],
    trim: true,
  },
  role: {
    type: String,
    enum: ['Teacher', 'Principal', 'Administrator', 'Support Staff', 'Librarian', 'Accountant', 'Transport Incharge', 'Lab Assistant', 'Other'],
    required: [true, 'Role is required'],
  },
  department: {
    type: String,
    required: [true, 'Department is required'],
    trim: true,
  },
  subjects: {
    type: [String],
    default: [],
  },
  classes: {
    type: [String],
    default: [],
  },
  qualification: {
    type: String,
    trim: true,
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
  },
  phone: {
    type: String,
    trim: true,
  },
  salary: {
    type: Number,
    default: 0,
  },
  workload: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'N/A'],
    default: 'Medium',
  },
  status: {
    type: String,
    enum: ['Active', 'On Leave', 'Resigned', 'Retired', 'Probation'],
    default: 'Active',
  },
  joiningDate: {
    type: Date,
    default: Date.now,
  },
  portalUsername: {
    type: String,
    trim: true,
  },
  schoolSlug: { type: String, trim: true, index: true },
  entityId: { type: String, required: true, index: true },
}, {
  timestamps: true,
});

// Compound unique index per school workspace
staffSchema.index({ employeeId: 1, entityId: 1 }, { unique: true });

module.exports = mongoose.models.Staff || mongoose.model('Staff', staffSchema);
