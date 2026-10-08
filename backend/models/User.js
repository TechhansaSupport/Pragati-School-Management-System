const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  uniqueId: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { 
    type: String, 
    required: true, 
    enum: ['superadmin', 'principal', 'admin', 'teacher', 'student', 'parent', 'accountant', 'librarian'] 
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
  }
}, { timestamps: true });

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
