const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const Store = require('../models/Store'); // Local Store/Tenant metadata mapping
const User = require('../models/User');   // Local School Users (Staff, Teachers, Students, Accountants)
const { PragatiTenant, PragatiUser } = require('../models/PragatiDb');
const { protect } = require('../middleware/auth');

// @desc    Store / School Admin & Staff Login API
// @route   POST /api/auth/login
// @access  Public
router.post('/login', async (req, res) => {
  try {
    // 1. Frontend sends slug (or tenantSlug), username (or uniqueId/email), and password
    let slug = (req.body.slug || req.body.tenantSlug || '').trim();
    const username = (req.body.username || req.body.uniqueId || req.body.email || '').trim();
    const password = req.body.password;

    if (!username || !password) {
      return res.status(400).json({
        error: 'Please provide both username and password',
        code: 'MISSING_CREDENTIALS',
        message: 'Please provide both username and password'
      });
    }

    // Auto-resolve workspace slug by looking up authentic PragatiUser or local User
    const pragatiUserMatch = await PragatiUser.findOne({
      $or: [
        { username: username },
        { username: new RegExp(`^${username}$`, 'i') },
        { email: new RegExp(`^${username}$`, 'i') },
        { frontdeskEmail: new RegExp(`^${username}$`, 'i') }
      ]
    });

    if (pragatiUserMatch && pragatiUserMatch.entity_id) {
      const pt = await PragatiTenant.findOne({ entity_id: pragatiUserMatch.entity_id });
      if (pt && pt.slug) {
        slug = pt.slug;
      }
    } else if (!slug || slug === 'universal' || slug === 'superadmin' || slug === 'central') {
      const localUser = await User.findOne({
        $or: [
          { uniqueId: username },
          { uniqueId: new RegExp(`^${username}$`, 'i') },
          { email: new RegExp(`^${username}$`, 'i') }
        ]
      });
      if (localUser) {
        if (localUser.schoolSlug) {
          slug = localUser.schoolSlug;
        } else if (localUser.slug) {
          slug = localUser.slug;
        } else if (localUser.entityId) {
          const sch = await User.findOne({ role: 'school', entityId: localUser.entityId });
          const st = sch ? null : await Store.findOne({ entityId: localUser.entityId });
          const pt = (sch || st) ? null : await PragatiTenant.findOne({ entity_id: localUser.entityId });
          slug = sch?.slug || st?.slug || pt?.slug;
        }

        if (!slug) {
          const defaultSchool = await User.findOne({ role: 'school', status: 'active' })
            || await User.findOne({ role: 'school' })
            || await Store.findOne({});
          slug = defaultSchool?.slug || 'pragati';
        }
      }
    }

    if (!slug) {
      return res.status(400).json({
        error: 'Please provide workspace slug (e.g. /your-school-name/login)',
        code: 'MISSING_SLUG',
        message: 'Please provide slug (workspace identifier)'
      });
    }

    // 2. Resolve school/workspace context from User (school_ms) or licensed Store / PragatiTenant
    let schoolUser = await User.findOne({
      role: 'school',
      $or: [
        { slug: slug },
        { schoolSlug: slug },
        { uniqueId: slug }
      ]
    });

    let localTenant = null;
    let pragatiTenant = null;

    if (schoolUser) {
      // School exists in users collection under licensed tenant entity
      pragatiTenant = await PragatiTenant.findOne({
        entity_id: schoolUser.entityId
      }).catch(() => null);
    } else {
      localTenant = await Store.findOne({
        $or: [
          { slug: slug },
          { slug: new RegExp(`^${slug}$`, 'i') },
          { storeId: slug }
        ]
      });

      pragatiTenant = await PragatiTenant.findOne({
        $or: [
          { slug: slug },
          { slug: new RegExp(`^${slug}$`, 'i') }
        ]
      }).catch(() => null);
    }

    if (!schoolUser && !pragatiTenant && !localTenant) {
      return res.status(404).json({
        error: `School workspace "${slug}" not found or has been deleted from the Pragati License Portal.`,
        code: 'TENANT_NOT_FOUND',
        message: `School workspace "${slug}" not found or has been deleted from the Pragati License Portal.`
      });
    }

    // 3. Validate status & SMS product license in Pragati Control Plane
    if (pragatiTenant) {
      if (pragatiTenant.status && pragatiTenant.status !== 'active') {
        return res.status(403).json({
          error: 'Your organization account or license has been suspended or revoked by Pragati Licensing.',
          code: 'TENANT_SUSPENDED',
          message: 'Your organization account or license has been suspended or revoked by Pragati Licensing.'
        });
      }

      if (pragatiTenant.subscribed_products && Array.isArray(pragatiTenant.subscribed_products) && pragatiTenant.subscribed_products.length > 0) {
        const hasShms = pragatiTenant.subscribed_products.some(p => p.toLowerCase() === 'shms');
        if (!hasShms) {
          return res.status(403).json({
            error: 'This organization does not have an active School Management System (SHMS) license in Pragati.',
            code: 'NO_SHMS_LICENSE',
            message: 'This organization does not have an active School Management System (SHMS) license in Pragati.'
          });
        }
      }
    }

    if (schoolUser && schoolUser.status && schoolUser.status !== 'active') {
      return res.status(403).json({
        error: 'This school campus is currently inactive.',
        code: 'TENANT_INACTIVE',
        message: 'This school campus is currently inactive.'
      });
    }

    const resolvedEntityId = schoolUser?.entityId || pragatiTenant?.entity_id || localTenant?.entityId;

    // Auto-provision primary school in school_ms for new entity from License Team if missing
    let primarySchool = schoolUser;
    if (!primarySchool && resolvedEntityId && pragatiTenant && (pragatiTenant.status === 'active' || !pragatiTenant.status)) {
      primarySchool = await User.findOne({ role: 'school', entityId: resolvedEntityId });
      if (!primarySchool) {
        const rootSlug = pragatiTenant.slug || (pragatiTenant.name ? pragatiTenant.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') : `school-${resolvedEntityId.slice(-6)}`);
        try {
          primarySchool = await User.create({
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
            entityId: resolvedEntityId,
            status: 'active',
            branches: [],
            city: pragatiTenant.address || 'Central',
            state: 'Main',
            board: 'CBSE',
            email: pragatiTenant.contact_email || `${rootSlug}@pragati.edu`,
            phone: pragatiTenant.contact_phone || 'N/A',
          });
        } catch (e) {
          primarySchool = await User.findOne({ role: 'school', entityId: resolvedEntityId });
        }
      }
    }

    const resolvedSlug = primarySchool?.slug || schoolUser?.slug || pragatiTenant?.slug || localTenant?.slug || slug;
    const resolvedSchoolName = primarySchool?.name || schoolUser?.name || schoolUser?.schoolName || localTenant?.name || pragatiTenant?.name || resolvedSlug || 'Pragati School';

    let authenticatedUser = null;
    let isPragatiUser = false;

    // 4. Check PragatiUser first (Control Plane School Admin / Owner - READ ONLY)
    if (pragatiTenant) {
      const pragatiUser = await PragatiUser.findOne({
        entity_id: resolvedEntityId,
        $or: [
          { username: username },
          { username: new RegExp(`^${username}$`, 'i') },
          { email: new RegExp(`^${username}$`, 'i') },
          { frontdeskEmail: new RegExp(`^${username}$`, 'i') }
        ]
      });

      if (pragatiUser) {
        const hash = pragatiUser.password_hash || pragatiUser.password;
        let isMatch = false;

        if (hash) {
          isMatch = await bcrypt.compare(password, hash);
        }
        // Fallback for plain text stored in legacy/test records
        if (!isMatch && (pragatiUser.frontdeskPassword === password || pragatiUser.password === password)) {
          isMatch = true;
        }

        if (isMatch) {
          authenticatedUser = pragatiUser;
          isPragatiUser = true;
        }
      }
    }

    // 5. If not authenticated via Pragati control plane user, check local school User (Principals, Staff, Teachers, Accountants, etc.)
    if (!authenticatedUser) {
      const localUser = await User.findOne({
        $or: [
          { entityId: resolvedEntityId, uniqueId: username },
          { entityId: resolvedEntityId, uniqueId: new RegExp(`^${username}$`, 'i') },
          { schoolSlug: resolvedSlug, uniqueId: username },
          { schoolSlug: resolvedSlug, uniqueId: new RegExp(`^${username}$`, 'i') }
        ]
      });

      if (localUser) {
        let isMatch = false;
        if (typeof localUser.matchPassword === 'function') {
          isMatch = await localUser.matchPassword(password);
        } else if (localUser.password) {
          isMatch = await bcrypt.compare(password, localUser.password);
        }
        if (!isMatch && localUser.password === password) {
          isMatch = true;
        }

        if (isMatch) {
          authenticatedUser = localUser;
          isPragatiUser = false;
        }
      }
    }

    if (!authenticatedUser) {
      return res.status(401).json({
        error: 'Invalid credentials',
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid credentials'
      });
    }

    let userRole = isPragatiUser
      ? (authenticatedUser.role || authenticatedUser.frontdeskRole || 'admin').toLowerCase()
      : (authenticatedUser.role || 'teacher').toLowerCase();

    // Multi-Tier Hierarchy: The central entity owner/admin is Super Admin; local branch admins are Admin
    if (isPragatiUser && (userRole === 'admin' || userRole === 'superadmin')) {
      userRole = 'superadmin';
    }

    let finalSlug = resolvedSlug;
    let finalSchoolName = resolvedSchoolName;

    // Appointed Branch Admin: locked to their specific assigned schoolSlug
    if (!isPragatiUser && userRole === 'admin') {
      const branchSlug = authenticatedUser.schoolSlug;
      if (branchSlug) {
        finalSlug = branchSlug;
        const branchSchool = await User.findOne({
          role: 'school',
          entityId: resolvedEntityId,
          $or: [{ slug: branchSlug }, { schoolSlug: branchSlug }, { uniqueId: branchSlug }]
        });
        if (branchSchool) {
          finalSchoolName = branchSchool.name || branchSchool.schoolName || branchSlug;
        }
      }
    }

    const resolvedUsername = isPragatiUser
      ? (authenticatedUser.username || username)
      : (authenticatedUser.uniqueId || username);

    const token = jwt.sign(
      {
        id: authenticatedUser._id,
        userId: authenticatedUser._id,
        username: resolvedUsername,
        role: userRole,
        entityId: resolvedEntityId,
        slug: finalSlug,
        storeId: finalSlug,
        tenantSlug: finalSlug,
        schoolSlug: finalSlug,
      },
      process.env.JWT_SECRET || 'pragati_school_jwt_secret_key_2024',
      { expiresIn: '30d' }
    );

    return res.json({
      _id: authenticatedUser._id,
      userId: authenticatedUser._id,
      username: resolvedUsername,
      uniqueId: resolvedUsername,
      name: authenticatedUser.name || '',
      email: authenticatedUser.email || '',
      profileImage: authenticatedUser.profileImage || authenticatedUser.avatar || '',
      role: userRole,
      isSuperAdmin: userRole === 'superadmin',
      isBranchAdmin: userRole === 'admin',
      branchSlug: userRole === 'admin' ? finalSlug : null,
      tenantSlug: finalSlug,
      slug: finalSlug,
      storeId: finalSlug,
      schoolSlug: finalSlug,
      entityId: resolvedEntityId,
      schoolName: finalSchoolName,
      token,
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Server error', message: error.message });
  }
});

// @desc    Verify current token and return tenant/user info
// @route   GET /api/auth/me
// @access  Protected
router.get('/me', protect, async (req, res) => {
  const schoolName = req.tenant?.name || req.pragatiTenant?.name || req.tenant?.slug || 'Pragati School';
  
  let fullUser = null;
  const userId = req.user?.id || req.user?.userId;
  const currentUsername = req.user?.username;
  const entityId = req.entityId;

  if (userId) {
    fullUser = await User.findById(userId).catch(() => null);
    if (!fullUser) fullUser = await PragatiUser.findById(userId).catch(() => null);
  }
  if (!fullUser && currentUsername && entityId) {
    fullUser = await User.findOne({
      entityId,
      $or: [{ uniqueId: currentUsername }, { uniqueId: new RegExp(`^${currentUsername}$`, 'i') }]
    }).catch(() => null);
    if (!fullUser) {
      fullUser = await PragatiUser.findOne({
        entity_id: entityId,
        $or: [{ username: currentUsername }, { email: new RegExp(`^${currentUsername}$`, 'i') }]
      }).catch(() => null);
    }
  }

  let effectiveRole = req.user?.role;
  // If the user belongs to Pragati control plane (or fullUser is PragatiUser), promote to superadmin
  const isPragatiRecord = fullUser && (fullUser.entity_id || fullUser.username || fullUser.password_hash);
  if (isPragatiRecord && (effectiveRole === 'admin' || !effectiveRole)) {
    effectiveRole = 'superadmin';
  }

  const isBranchAdmin = effectiveRole === 'admin';
  const branchSlug = isBranchAdmin ? (fullUser?.schoolSlug || req.user?.schoolSlug || req.schoolSlug) : null;

  res.json({
    user: {
      ...req.user,
      role: effectiveRole || req.user?.role,
      isSuperAdmin: effectiveRole === 'superadmin',
      isBranchAdmin,
      branchSlug,
      schoolSlug: req.schoolSlug || req.user?.schoolSlug,
      name: fullUser?.name || '',
      email: fullUser?.email || '',
      profileImage: fullUser?.profileImage || fullUser?.avatar || ''
    },
    tenant: req.tenant,
    pragatiTenant: req.pragatiTenant,
    entityId: req.entityId,
    schoolName
  });
});

// @desc    Update User Profile (Profile Image, Display Name, Email)
// @route   PUT /api/auth/profile
// @access  Protected
router.put('/profile', protect, async (req, res) => {
  try {
    const { profileImage, name, email } = req.body;
    const userId = req.user?.id || req.user?.userId;
    const currentUsername = req.user?.username;
    const entityId = req.entityId;

    let localUser = null;
    let pragatiUser = null;

    if (userId) {
      localUser = await User.findById(userId).catch(() => null);
      pragatiUser = await PragatiUser.findById(userId).catch(() => null);
    }

    if (!localUser && currentUsername && entityId) {
      localUser = await User.findOne({
        entityId: entityId,
        $or: [
          { uniqueId: currentUsername },
          { uniqueId: new RegExp(`^${currentUsername}$`, 'i') }
        ]
      }).catch(() => null);
    }

    if (!pragatiUser && currentUsername && entityId) {
      pragatiUser = await PragatiUser.findOne({
        entity_id: entityId,
        $or: [
          { username: currentUsername },
          { email: new RegExp(`^${currentUsername}$`, 'i') }
        ]
      }).catch(() => null);
    }

    if (!localUser && !pragatiUser) {
      return res.status(404).json({
        error: 'User account not found.',
        code: 'USER_NOT_FOUND'
      });
    }

    if (!localUser && pragatiUser) {
      localUser = new User({
        uniqueId: currentUsername,
        role: req.user?.role || 'admin',
        entityId: entityId,
        name: pragatiUser.name || name || '',
        email: pragatiUser.email || email || '',
        profileImage: profileImage || ''
      });
    }

    if (localUser) {
      if (profileImage !== undefined) localUser.profileImage = profileImage;
      if (name !== undefined) localUser.name = name;
      if (email !== undefined) localUser.email = email;
      await localUser.save();
    }

    const updatedUserDoc = localUser || pragatiUser;
    const resolvedUsername = updatedUserDoc.uniqueId || updatedUserDoc.username || currentUsername;
    const updatedUser = {
      ...req.user,
      uniqueId: resolvedUsername,
      username: resolvedUsername,
      name: updatedUserDoc.name || name || '',
      email: updatedUserDoc.email || email || '',
      profileImage: updatedUserDoc.profileImage !== undefined ? updatedUserDoc.profileImage : (profileImage || ''),
    };

    return res.json({
      success: true,
      message: 'Profile updated successfully!',
      user: updatedUser
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    return res.status(500).json({ error: 'Server error', message: error.message });
  }
});

// @desc    Change User Login Credentials (Username and/or Password)
// @route   PUT /api/auth/change-credentials
// @access  Protected (Any logged-in user: Admin, Teacher, Staff, Student, etc.)
router.put('/change-credentials', protect, async (req, res) => {
  try {
    const { currentPassword, newUsername, newPassword } = req.body;

    // 1. Current password is required for security verification
    if (!currentPassword) {
      return res.status(400).json({
        error: 'Current password is required to verify your identity.',
        code: 'MISSING_CURRENT_PASSWORD'
      });
    }

    if (!newUsername && !newPassword) {
      return res.status(400).json({
        error: 'Please provide a new username or a new password to update.',
        code: 'NO_CHANGES_SPECIFIED'
      });
    }

    const userId = req.user?.id || req.user?.userId;
    const currentUsername = req.user?.username;
    const entityId = req.entityId;

    // 2. Locate user in local User or PragatiUser
    let localUser = null;
    let pragatiUser = null;

    if (userId) {
      localUser = await User.findById(userId);
      pragatiUser = await PragatiUser.findById(userId);
    }

    if (!localUser && currentUsername && entityId) {
      localUser = await User.findOne({
        entityId: entityId,
        $or: [
          { uniqueId: currentUsername },
          { uniqueId: new RegExp(`^${currentUsername}$`, 'i') }
        ]
      });
    }

    if (!pragatiUser && currentUsername && entityId) {
      pragatiUser = await PragatiUser.findOne({
        entity_id: entityId,
        $or: [
          { username: currentUsername },
          { email: new RegExp(`^${currentUsername}$`, 'i') }
        ]
      });
    }

    if (!localUser && !pragatiUser) {
      return res.status(404).json({
        error: 'User account not found.',
        code: 'USER_NOT_FOUND'
      });
    }

    // 3. Verify Current Password
    let isPasswordCorrect = false;

    if (localUser) {
      if (typeof localUser.matchPassword === 'function') {
        isPasswordCorrect = await localUser.matchPassword(currentPassword);
      } else if (localUser.password) {
        isPasswordCorrect = await bcrypt.compare(currentPassword, localUser.password);
      }
      if (!isPasswordCorrect && localUser.password === currentPassword) {
        isPasswordCorrect = true;
      }
    }

    if (!isPasswordCorrect && pragatiUser) {
      const pHash = pragatiUser.password_hash || pragatiUser.password;
      if (pHash) {
        isPasswordCorrect = await bcrypt.compare(currentPassword, pHash);
      }
      if (!isPasswordCorrect && (pragatiUser.password === currentPassword || pragatiUser.frontdeskPassword === currentPassword)) {
        isPasswordCorrect = true;
      }
    }

    if (!isPasswordCorrect) {
      return res.status(401).json({
        error: 'Incorrect current password. Please verify and try again.',
        code: 'INVALID_PASSWORD'
      });
    }

    const updates = [];

    // 4. Validate and Apply Username Update
    let updatedUsername = currentUsername;
    if (newUsername && newUsername.trim() && newUsername.trim() !== currentUsername) {
      const trimmedUser = newUsername.trim();

      if (trimmedUser.length < 3) {
        return res.status(400).json({
          error: 'Username must be at least 3 characters long.',
          code: 'USERNAME_TOO_SHORT'
        });
      }

      if (trimmedUser.length > 50) {
        return res.status(400).json({
          error: 'Username cannot exceed 50 characters.',
          code: 'USERNAME_TOO_LONG'
        });
      }

      // Check if username already exists in this school entity
      const existingLocal = await User.findOne({
        entityId: entityId,
        uniqueId: new RegExp(`^${trimmedUser}$`, 'i'),
        ...(localUser ? { _id: { $ne: localUser._id } } : {})
      });

      if (existingLocal) {
        return res.status(400).json({
          error: `Username "${trimmedUser}" is already taken in this school. Please choose a different username.`,
          code: 'USERNAME_TAKEN'
        });
      }

      const existingPragati = await PragatiUser.findOne({
        entity_id: entityId,
        username: new RegExp(`^${trimmedUser}$`, 'i'),
        ...(pragatiUser ? { _id: { $ne: pragatiUser._id } } : {})
      });

      if (existingPragati) {
        return res.status(400).json({
          error: `Username "${trimmedUser}" is already taken in this school. Please choose a different username.`,
          code: 'USERNAME_TAKEN'
        });
      }

      if (localUser) {
        localUser.uniqueId = trimmedUser;
        // If linked to a Staff member, also update portalUsername
        if (localUser.onModel === 'Staff' && localUser.referenceId) {
          const Staff = require('../models/Staff');
          await Staff.findByIdAndUpdate(localUser.referenceId, { portalUsername: trimmedUser }).catch(() => {});
        }
      }

      if (pragatiUser) {
        pragatiUser.username = trimmedUser;
      }

      updatedUsername = trimmedUser;
      updates.push('username');
    }

    // 5. Validate and Apply Password Update
    if (newPassword) {
      if (typeof newPassword !== 'string' || newPassword.length < 6) {
        return res.status(400).json({
          error: 'New password must be at least 6 characters long.',
          code: 'WEAK_PASSWORD'
        });
      }

      if (!localUser && pragatiUser) {
        localUser = new User({
          uniqueId: currentUsername,
          role: req.user?.role || 'admin',
          entityId: entityId,
          name: pragatiUser.name || '',
          email: pragatiUser.email || ''
        });
      }

      if (localUser) {
        localUser.password = newPassword;
      }

      updates.push('password');
    }

    // 6. Save the record in school_ms (Zero writes to pragati DB)
    if (localUser) {
      await localUser.save();
    }

    // 7. Issue a fresh JWT token with the updated credentials
    const targetId = (localUser?._id || pragatiUser?._id);
    const token = jwt.sign(
      {
        id: targetId,
        userId: targetId,
        username: updatedUsername,
        role: req.user.role,
        entityId: entityId,
        slug: req.user.slug || req.user.tenantSlug,
        storeId: req.user.storeId || req.user.tenantSlug,
        tenantSlug: req.user.tenantSlug || req.user.slug,
      },
      process.env.JWT_SECRET || 'pragati_school_jwt_secret_key_2024',
      { expiresIn: '30d' }
    );

    return res.json({
      success: true,
      message: updates.length === 2 
        ? 'Username and password updated successfully!'
        : updates.includes('password')
          ? 'Password updated successfully!'
          : 'Username updated successfully!',
      user: {
        _id: targetId,
        userId: targetId,
        username: updatedUsername,
        uniqueId: updatedUsername,
        role: req.user.role,
        tenantSlug: req.user.tenantSlug || req.user.slug,
        token
      }
    });
  } catch (error) {
    console.error('Error changing credentials:', error);
    return res.status(500).json({ error: 'Server error', message: error.message });
  }
});

module.exports = router;
