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
    unique: true,
    trim: true,
  },
  role: {
    type: String,
    enum: ['Teacher', 'Administrator', 'Support Staff', 'Librarian', 'Accountant'],
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
    enum: ['Low', 'Medium', 'High'],
    default: 'Medium',
  },
  status: {
    type: String,
    enum: ['Active', 'On Leave', 'Resigned', 'Retired'],
    default: 'Active',
  },
  joiningDate: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Staff', staffSchema);
