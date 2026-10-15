const mongoose = require('mongoose');

const tenantSchema = new mongoose.Schema({
  slug: { type: String, required: true, unique: true },
  name: { type: String },
  address: { type: String, default: '' },
  entityId: { type: String, required: true },
  storeId: { type: String },
  status: {
    type: String,
    enum: ['active', 'suspended', 'trial'],
    default: 'active',
  },
  academicYear: { type: String, default: '2026-2027' },
  currency: { type: String, default: 'INR (₹)' },
  timezone: { type: String, default: 'Asia/Kolkata (IST)' },
  maintenanceMode: { type: Boolean, default: false },
  phone: { type: String, default: '' },
  email: { type: String, default: '' },
  affiliationNo: { type: String, default: '' }
}, { timestamps: true });

tenantSchema.pre('save', function (next) {
  if (!this.storeId && this.slug) {
    this.storeId = this.slug;
  }
  next();
});

module.exports = mongoose.models.Tenant || mongoose.model('Tenant', tenantSchema);
