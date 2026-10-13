// models/PragatiDb.js
const mongoose = require('mongoose');
const controlPlane = require('./controlPlane');

/**
 * PragatiTenantSchema (Control Plane Tenant / License Registry)
 * STRICTLY READ-ONLY for School Management System.
 * All write, update, and delete operations are strictly blocked by security hooks.
 */
const PragatiTenantSchema = new mongoose.Schema({
  slug: String,
  entity_id: String,
  status: String,
  subscribed_products: [String],
  name: String,
  address: String,
}, { strict: false });

const blockTenantWrites = function(next) {
  const err = new Error('SECURITY_VIOLATION: Pragati tenants collection is strictly READ-ONLY for School Management System (SHMS). Only the licensing team can create/modify tenants.');
  err.code = 'PRAGATI_TENANTS_READ_ONLY';
  if (typeof next === 'function') return next(err);
  throw err;
};

// Block document-level writes
PragatiTenantSchema.pre('save', blockTenantWrites);
// Block query-level writes & deletes
PragatiTenantSchema.pre(['updateOne', 'updateMany', 'findOneAndUpdate', 'findByIdAndUpdate', 'deleteOne', 'deleteMany', 'findOneAndDelete', 'findOneAndRemove'], blockTenantWrites);
PragatiTenantSchema.pre('insertMany', blockTenantWrites);

const PragatiTenant = controlPlane.model('Tenant', PragatiTenantSchema, 'tenants');

/**
 * PragatiUserSchema (Control Plane User Store)
 * Scoped strictly to the active SHMS entity_id.
 * Cannot affect or query users from other entities (RMS, HRMS, SMS, etc.).
 */
const PragatiUserSchema = new mongoose.Schema({
  entity_id: { type: String, required: true, index: true },
  username: { type: String, required: true, index: true },
  email: String,
  password_hash: String,
  plainPassword: String,
  role: String,
  product: { type: String, default: 'shms' },
  schoolSlug: String,
  status: { type: String, default: 'active' },
  permissions: mongoose.Schema.Types.Mixed,
}, { strict: false, timestamps: true });

// Enforce entity_id scoping on document saves
PragatiUserSchema.pre('save', function(next) {
  if (!this.entity_id) {
    const err = new Error('SECURITY_VIOLATION: Cannot save user in Pragati DB without an explicit entity_id scoping.');
    err.code = 'ENTITY_ID_REQUIRED';
    return next(err);
  }
  next();
});

// Enforce entity_id scoping on query-level updates & deletes
PragatiUserSchema.pre(['updateOne', 'updateMany', 'findOneAndUpdate', 'deleteOne', 'deleteMany', 'findOneAndDelete', 'findOneAndRemove'], function(next) {
  const filter = this.getFilter ? this.getFilter() : {};
  if (!filter.entity_id && !filter._id) {
    const err = new Error('SECURITY_VIOLATION: All PragatiUser mutations must be strictly scoped to entity_id.');
    err.code = 'ENTITY_ID_REQUIRED';
    return next(err);
  }
  next();
});

const PragatiUser = controlPlane.model('User', PragatiUserSchema, 'users');

module.exports = {
  controlPlane,
  PragatiTenant,
  PragatiUser,
};
