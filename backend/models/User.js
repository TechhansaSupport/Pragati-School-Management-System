const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  uniqueId: { type: String, required: true },
  password: { type: String, default: '' },
  role: { 
    type: String, 
    required: true, 
    enum: [
      'superadmin', 
      'principal', 
      'admin', 
      'teacher', 
      'student', 
      'parent', 
      'accountant', 
      'librarian', 
      'transport', 
      'frontdesk',
      'school',
      'school_admin'
    ] 
  },
  referenceId: { 
    type: mongoose.Schema.Types.ObjectId, 
    refPath: 'onModel',
    default: null
  },
  onModel: {
    type: String,
    enum: ['Student', 'Staff'],
    default: null
  },
  entityId: { type: String, required: true },
  profileImage: { type: String, default: '' },
  name: { type: String, default: '' },
  email: { type: String, default: '' },
  phone: { type: String, default: '' },
  // School profile metadata (when stored as school under users)
  slug: { type: String, index: true },
  schoolSlug: { type: String, index: true },
  schoolName: { type: String },
  address: { type: String, default: '' },
  academicYear: { type: String, default: '2026-2027' },
  currency: { type: String, default: 'INR (₹)' },
  timezone: { type: String, default: 'Asia/Kolkata (IST)' },
  status: { type: String, default: 'active' },
  maintenanceMode: { type: Boolean, default: false },
  isBranch: { type: Boolean, default: false },
  branchName: { type: String, default: '' },
  parentSchoolSlug: { type: String, default: '' },
  affiliationNo: { type: String, default: '' },
  // Campus Geofence Configuration
  campusLatitude: { type: Number, default: null },
  campusLongitude: { type: Number, default: null },
  campusRadiusMeters: { type: Number, default: 300 }, // Default 300m campus boundary
  geofenceEnabled: { type: Boolean, default: true }
}, { timestamps: true });

// Compound unique index per school workspace
userSchema.index({ uniqueId: 1, entityId: 1 }, { unique: true });

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.password || !this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function (enteredPassword) {
  if (!this.password) return false;
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.models.User || mongoose.model('User', userSchema);
