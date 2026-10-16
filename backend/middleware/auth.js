const jwt = require('jsonwebtoken');
const Store = require('../models/Store'); // Local Store/Tenant mapping
const User = require('../models/User');   // Local School Users & Schools
const { PragatiTenant } = require('../models/PragatiDb');

/**
 * Real-Time Verification Middleware
 * Validates JWT signature, resolves school context (from User or Store),
 * and performs live read-only license check against Pragati Control Plane DB.
 */
const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.headers['x-auth-token']) {
    token = req.headers['x-auth-token'];
  }

  if (!token) {
    return res.status(401).json({
      error: 'Not authorized, no token provided',
      code: 'NO_TOKEN',
      message: 'Not authorized, no token provided'
    });
  }

  try {
    // 1. Decode JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'pragati_school_jwt_secret_key_2024');

    // 2. Multi-School Context Resolution strictly bounded to the user's entityId
    const requestedSlug = (req.headers['x-tenant-slug'] || req.headers['x-school-slug'] || '').trim();
    const userRole = (decoded.role || '').toLowerCase();
    const isAdmin = ['admin', 'superadmin'].includes(userRole);
    const userEntityId = decoded.entityId;

    let targetSlug = (isAdmin && requestedSlug) ? requestedSlug : (decoded.storeId || decoded.slug || decoded.tenantSlug || requestedSlug);
    let tenant = null;
    let schoolUser = null;

    // Check if targetSlug corresponds to a School belonging strictly to userEntityId
    if (targetSlug && userEntityId) {
      schoolUser = await User.findOne({
        role: 'school',
        entityId: userEntityId,
        $or: [
          { slug: targetSlug },
          { schoolSlug: targetSlug },
          { uniqueId: targetSlug }
        ]
      });
    }

    // For SuperAdmin, allow cross-entity school resolution when targetSlug belongs to another school
    if (!schoolUser && userRole === 'superadmin' && targetSlug && targetSlug !== 'central' && targetSlug !== 'all') {
      schoolUser = await User.findOne({
        role: 'school',
        $or: [
          { slug: targetSlug },
          { schoolSlug: targetSlug },
          { uniqueId: targetSlug }
        ]
      });
    }

    // If requested slug does not belong to this entity or wasn't found, find primary school for this entity
    if (!schoolUser && userEntityId) {
      schoolUser = await User.findOne({
        role: 'school',
        entityId: userEntityId
      }).sort({ createdAt: 1 });
    }

    // 3. Live Authorization Check against Pragati DB (Read-Only License Check)
    let pragatiTenant = null;
    if (userEntityId) {
      pragatiTenant = await PragatiTenant.findOne({ entity_id: userEntityId }).catch(() => null);
    }
    if (!pragatiTenant && targetSlug && !userEntityId) {
      pragatiTenant = await PragatiTenant.findOne({ slug: targetSlug }).catch(() => null);
    }

    // Auto-provision primary school in school_ms if new licensed entity from License Team has no school record yet
    if (!schoolUser && userEntityId && pragatiTenant && (pragatiTenant.status === 'active' || !pragatiTenant.status)) {
      const rootSlug = pragatiTenant.slug || (pragatiTenant.name ? pragatiTenant.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') : `school-${userEntityId.slice(-6)}`);
      try {
        schoolUser = await User.create({
          uniqueId: rootSlug,
          slug: rootSlug,
          schoolSlug: rootSlug,
          name: pragatiTenant.name || 'New School Campus',
          schoolName: pragatiTenant.name || 'New School Campus',
          address: pragatiTenant.address || '',
          academicYear: '2026-2027',
          currency: 'INR (₹)',
          timezone: 'Asia/Kolkata (IST)',
          role: 'school',
          entityId: userEntityId,
          status: 'active',
          password: 'SchoolPassword@123',
          maintenanceMode: false,
          isBranch: false,
          branchName: '',
          parentSchoolSlug: ''
        });
      } catch (err) {
        schoolUser = await User.findOne({ role: 'school', entityId: userEntityId });
      }
    }

    const effectiveSlug = schoolUser?.slug || pragatiTenant?.slug || targetSlug;

    if (schoolUser) {
      tenant = {
        _id: schoolUser._id,
        slug: schoolUser.slug || effectiveSlug,
        storeId: schoolUser.slug || effectiveSlug,
        name: schoolUser.name || schoolUser.schoolName || effectiveSlug,
        address: schoolUser.address || '',
        entityId: userEntityId,
        status: schoolUser.status || 'active',
        academicYear: schoolUser.academicYear || '2026-2027',
        currency: schoolUser.currency || 'INR (₹)',
        timezone: schoolUser.timezone || 'Asia/Kolkata (IST)',
        maintenanceMode: !!schoolUser.maintenanceMode
      };
    } else if (targetSlug && !userEntityId) {
      tenant = await Store.findOne({
        $or: [
          { storeId: targetSlug },
          { slug: targetSlug },
          { slug: new RegExp(`^${targetSlug}$`, 'i') }
        ]
      });
    }

    if (pragatiTenant && pragatiTenant.status && pragatiTenant.status !== 'active') {
      return res.status(403).json({
        error: 'Your organization account or license has been suspended or revoked by Pragati.',
        code: 'TENANT_SUSPENDED',
        message: 'Your organization account or license has been suspended or revoked by Pragati.'
      });
    }

    if (pragatiTenant && pragatiTenant.subscribed_products && Array.isArray(pragatiTenant.subscribed_products) && pragatiTenant.subscribed_products.length > 0) {
      const hasShms = pragatiTenant.subscribed_products.some(p => p.toLowerCase() === 'shms');
      if (!hasShms) {
        return res.status(403).json({
          error: 'This organization does not have an active School Management System (SHMS) license in Pragati.',
          code: 'NO_SHMS_LICENSE',
          message: 'This organization does not have an active School Management System (SHMS) license in Pragati.'
        });
      }
    }

    if (tenant && tenant.status && tenant.status !== 'active') {
      return res.status(403).json({
        error: 'This school workspace is currently inactive.',
        code: 'TENANT_INACTIVE',
        message: 'This school workspace is currently inactive.'
      });
    }

    const effectiveEntityId = (userRole === 'superadmin' && schoolUser?.entityId) || userEntityId || (tenant && tenant.entityId) || (pragatiTenant && pragatiTenant.entity_id);
    const effectiveTenant = tenant || pragatiTenant || { 
      slug: effectiveSlug, 
      storeId: effectiveSlug, 
      entityId: effectiveEntityId, 
      name: tenant?.name || pragatiTenant?.name || effectiveSlug 
    };

    // Attach verified user, school and tenant context strictly isolated to user's entity
    req.user = decoded;
    req.tenant = effectiveTenant;
    req.pragatiTenant = pragatiTenant;
    req.entityId = effectiveEntityId;
    req.school = schoolUser;
    req.schoolSlug = schoolUser ? (schoolUser.slug || schoolUser.schoolSlug) : (effectiveSlug || effectiveTenant.slug);

    next();
  } catch (error) {
    console.error('Auth verification error:', error.message);
    return res.status(401).json({
      error: 'Not authorized, token invalid or expired',
      code: 'INVALID_TOKEN',
      message: 'Not authorized, token invalid or expired'
    });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    const userRole = (req.user && req.user.role) ? req.user.role.toLowerCase() : '';
    const allowedRoles = roles.map(r => r.toLowerCase());

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        error: `User role '${req.user?.role}' is not authorized to access this route`,
        code: 'FORBIDDEN',
        message: `User role '${req.user?.role}' is not authorized to access this route`
      });
    }
    next();
  };
};

module.exports = {
  protect,
  authorize,
};
