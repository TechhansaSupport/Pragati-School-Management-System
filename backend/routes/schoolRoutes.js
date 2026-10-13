const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Store = require('../models/Store');
const { PragatiTenant } = require('../models/PragatiDb');
const Staff = require('../models/Staff');
const Student = require('../models/Student');
const User = require('../models/User');
const ClassSection = require('../models/ClassSection');
const Fee = require('../models/Fee');
const Transaction = require('../models/Transaction');
const Academic = require('../models/Academic');
const { protect, authorize } = require('../middleware/auth');

// @desc    Get all schools/campuses for the admin with appointed principals and stats
// @route   GET /api/school/list
// @access  Protected (Admin / Superadmin / Principal)
router.get('/list', protect, async (req, res) => {
  try {
    const schoolMap = new Map();

    // 1. Fetch schools stored in Users (where role is 'school' in school_ms)
    const schoolUsers = await User.find({
      role: 'school',
      ...(req.entityId ? { entityId: req.entityId } : {})
    }).sort({ createdAt: -1 });

    for (const u of schoolUsers) {
      const sSlug = u.slug || u.schoolSlug || u.uniqueId;
      if (sSlug) {
        schoolMap.set(sSlug, {
          id: u._id,
          name: u.name || u.schoolName || sSlug,
          slug: sSlug,
          address: u.address || '',
          entityId: u.entityId,
          status: u.status || 'active',
          academicYear: u.academicYear || '2026-2027',
          currency: u.currency || 'INR (₹)',
          timezone: u.timezone || 'Asia/Kolkata (IST)'
        });
      }
    }

    // 2. Fetch root licensed tenant / store records in school_ms
    const localStores = await Store.find({
      ...(req.entityId ? { entityId: req.entityId } : {})
    }).sort({ createdAt: -1 });

    for (const store of localStores) {
      if (!schoolMap.has(store.slug)) {
        schoolMap.set(store.slug, {
          id: store._id,
          name: store.name || store.slug,
          slug: store.slug,
          address: store.address || '',
          entityId: store.entityId,
          status: store.status || 'active',
          academicYear: store.academicYear || '2026-2027',
          currency: store.currency || 'INR (₹)',
          timezone: store.timezone || 'Asia/Kolkata (IST)'
        });
      }
    }

    // 3. Fallback: If no schools found yet but req.tenant or req.pragatiTenant exists (licensed root tenant)
    const rootSlug = req.tenant?.slug || req.pragatiTenant?.slug;
    if (rootSlug && !schoolMap.has(rootSlug)) {
      schoolMap.set(rootSlug, {
        id: req.tenant?._id || 'root-tenant',
        name: req.tenant?.name || req.pragatiTenant?.name || rootSlug,
        slug: rootSlug,
        address: req.tenant?.address || req.pragatiTenant?.address || '',
        entityId: req.entityId,
        status: req.tenant?.status || req.pragatiTenant?.status || 'active',
        academicYear: req.tenant?.academicYear || '2026-2027',
        currency: req.tenant?.currency || 'INR (₹)',
        timezone: req.tenant?.timezone || 'Asia/Kolkata (IST)'
      });
    }

    const schoolsArray = Array.from(schoolMap.values());

    // Enrich each school with appointed Admin, Principal, and counts
    const enrichedSchools = await Promise.all(
      schoolsArray.map(async (sch) => {
        // Appointed Branch Admin for this specific school branch
        let adminStaff = await Staff.findOne({
          role: 'Administrator',
          schoolSlug: sch.slug,
          status: { $ne: 'Resigned' }
        }).select('_id name email phone qualification portalUsername employeeId status');

        let adminUser = null;
        if (!adminStaff) {
          adminUser = await User.findOne({
            role: 'admin',
            schoolSlug: sch.slug
          }).select('_id name email phone uniqueId status referenceId');
        }

        const adminObj = adminStaff ? {
          id: adminStaff._id,
          name: adminStaff.name,
          email: adminStaff.email,
          phone: adminStaff.phone,
          qualification: adminStaff.qualification,
          portalUsername: adminStaff.portalUsername,
          employeeId: adminStaff.employeeId,
          status: adminStaff.status
        } : (adminUser ? {
          id: adminUser._id,
          name: adminUser.name || adminUser.uniqueId,
          email: adminUser.email,
          phone: adminUser.phone,
          qualification: 'School Administrator',
          portalUsername: adminUser.uniqueId,
          employeeId: 'ADM-001',
          status: 'Active'
        } : null);

        // Appointed Principal for this specific school branch
        let principal = await Staff.findOne({
          role: 'Principal',
          schoolSlug: sch.slug,
          status: { $ne: 'Resigned' }
        }).select('_id name email phone qualification portalUsername employeeId status');

        if (!principal && sch.slug === rootSlug) {
          principal = await Staff.findOne({
            role: 'Principal',
            entityId: sch.entityId,
            $or: [{ schoolSlug: { $exists: false } }, { schoolSlug: null }, { schoolSlug: '' }, { schoolSlug: sch.slug }],
            status: { $ne: 'Resigned' }
          }).select('_id name email phone qualification portalUsername employeeId status');
        }

        // Staff count for this specific branch
        const staffCount = await Staff.countDocuments(
          sch.slug === rootSlug
            ? { entityId: sch.entityId, $or: [{ schoolSlug: sch.slug }, { schoolSlug: { $exists: false } }, { schoolSlug: null }, { schoolSlug: '' }] }
            : { schoolSlug: sch.slug }
        );

        // Student count for this specific branch
        const studentCount = await Student.countDocuments(
          sch.slug === rootSlug
            ? { entityId: sch.entityId, $or: [{ schoolSlug: sch.slug }, { schoolSlug: { $exists: false } }, { schoolSlug: null }, { schoolSlug: '' }] }
            : { schoolSlug: sch.slug }
        );

        const isCurrent = sch.slug === (req.schoolSlug || req.tenant?.slug || req.user?.slug || req.user?.tenantSlug);

        return {
          ...sch,
          isCurrent,
          admin: adminObj,
          principal: principal ? {
            id: principal._id,
            name: principal.name,
            email: principal.email,
            phone: principal.phone,
            qualification: principal.qualification,
            portalUsername: principal.portalUsername,
            employeeId: principal.employeeId,
            status: principal.status
          } : null,
          staffCount,
          studentCount
        };
      })
    );

    return res.json({
      success: true,
      count: enrichedSchools.length,
      currentSchoolSlug: req.schoolSlug || req.tenant?.slug || req.user?.slug,
      currentEntityId: req.entityId,
      schools: enrichedSchools
    });
  } catch (error) {
    console.error('Error fetching schools list:', error);
    return res.status(500).json({ error: 'Server error', message: error.message });
  }
});

// @desc    Register a New School Campus / Branch (Admin Authority)
//          Schools are stored in `users` in `school_ms` DB. DO NOT create new tenants or touch `pragati` DB.
// @route   POST /api/school/create
// @access  Protected (Admin / Superadmin)
router.post('/create', protect, authorize('admin', 'superadmin'), async (req, res) => {
  try {
    const { name, slug, address, academicYear, currency, timezone, principal, admin } = req.body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'School name is required', code: 'MISSING_NAME' });
    }

    const trimmedName = name.trim();
    // Auto-generate clean slug if not provided
    const baseSlug = (slug || trimmedName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')).trim();
    if (!baseSlug) {
      return res.status(400).json({ error: 'A valid school slug identifier is required', code: 'INVALID_SLUG' });
    }

    // Check if slug already exists in User or Store
    const existingSchoolUser = await User.findOne({
      $or: [
        { slug: baseSlug },
        { schoolSlug: baseSlug },
        { uniqueId: baseSlug }
      ]
    });
    const existingStore = await Store.findOne({
      $or: [{ slug: baseSlug }, { storeId: baseSlug }]
    });

    if (existingSchoolUser || existingStore) {
      return res.status(400).json({
        error: `A school with the URL handle "${baseSlug}" already exists. Please pick a different name or slug.`,
        code: 'SLUG_EXISTS'
      });
    }

    // All schools fall under the existing licensed tenant entity in school_ms (NO new entity created)
    const entityId = req.entityId || req.tenant?.entityId;
    if (!entityId) {
      return res.status(403).json({ error: 'Cannot create branch without an active licensed school entity.', code: 'MISSING_ENTITY_ID' });
    }

    const parentSlug = req.schoolSlug || req.tenant?.slug || req.user?.slug || 'main';

    // 1. Store the new branch school in Users collection (in school_ms DB - NOT as a tenant, NO new entity, NO writes to pragati DB)
    const newSchool = await User.create({
      uniqueId: baseSlug,
      slug: baseSlug,
      schoolSlug: baseSlug,
      name: trimmedName,
      schoolName: trimmedName,
      branchName: trimmedName,
      isBranch: true,
      parentSchoolSlug: parentSlug,
      address: (address || '').trim(),
      academicYear: academicYear || '2026-2027',
      currency: currency || 'INR (₹)',
      timezone: timezone || 'Asia/Kolkata (IST)',
      role: 'school',
      entityId, // Explicitly reuses existing licensed school entityId
      status: 'active',
      password: 'SchoolPassword@123',
      maintenanceMode: false
    });

    // 2. Appoint Branch Admin if provided
    let createdAdmin = null;
    if (admin && admin.name && admin.name.trim()) {
      const aName = admin.name.trim();
      const aEmail = (admin.email || `${baseSlug}.admin@pragati.edu`).trim().toLowerCase();
      const aUsername = (admin.portalUsername || `${baseSlug}_admin`).trim().toLowerCase();
      const aPassword = admin.portalPassword || 'Admin@123';

      const adminStaff = await Staff.create({
        name: aName,
        employeeId: 'ADM-001',
        role: 'Administrator',
        department: 'Administration',
        qualification: admin.qualification || 'School Administrator',
        email: aEmail,
        phone: admin.phone || '',
        salary: admin.salary ? Number(admin.salary) : 85000,
        workload: 'Medium',
        status: 'Active',
        portalUsername: aUsername,
        schoolSlug: baseSlug,
        entityId
      });

      const adminUser = new User({
        uniqueId: aUsername,
        password: aPassword,
        role: 'admin',
        entityId,
        schoolSlug: baseSlug,
        referenceId: adminStaff._id,
        onModel: 'Staff',
        name: aName,
        email: aEmail,
        phone: admin.phone || ''
      });
      await adminUser.save();

      createdAdmin = {
        name: adminStaff.name,
        email: adminStaff.email,
        portalUsername: aUsername,
        portalPassword: aPassword,
        employeeId: adminStaff.employeeId
      };
    }

    // 3. Appoint Principal if provided
    let createdPrincipal = null;
    if (principal && principal.name && principal.name.trim()) {
      const pName = principal.name.trim();
      const pEmail = (principal.email || `${baseSlug}.principal@pragati.edu`).trim().toLowerCase();
      const pUsername = (principal.portalUsername || `${baseSlug}_principal`).trim().toLowerCase();
      const pPassword = principal.portalPassword || 'Principal@123';

      const principalStaff = await Staff.create({
        name: pName,
        employeeId: 'PRIN-001',
        role: 'Principal',
        department: 'Administration',
        qualification: principal.qualification || 'M.Ed / Ph.D in Educational Leadership',
        email: pEmail,
        phone: principal.phone || '',
        salary: principal.salary ? Number(principal.salary) : 95000,
        workload: 'Medium',
        status: 'Active',
        portalUsername: pUsername,
        schoolSlug: baseSlug,
        entityId
      });

      // Provision Principal login credentials in User
      const user = new User({
        uniqueId: pUsername,
        password: pPassword,
        role: 'principal',
        entityId,
        schoolSlug: baseSlug,
        referenceId: principalStaff._id,
        onModel: 'Staff',
        name: pName,
        email: pEmail
      });
      await user.save();

      createdPrincipal = {
        name: principalStaff.name,
        email: principalStaff.email,
        portalUsername: pUsername,
        portalPassword: pPassword,
        employeeId: principalStaff.employeeId
      };
    }

    // 4. Seed initial default staff for this new school branch
    const defaultStaff = [
      {
        name: 'Senior Academic Coordinator',
        employeeId: 'EMP-102',
        role: 'Teacher',
        department: 'Science',
        qualification: 'M.Sc, B.Ed',
        subjects: ['Science', 'Physics'],
        classes: ['9th - A', '10th - A'],
        email: `coord.${baseSlug}@pragati.edu`,
        status: 'Active',
        schoolSlug: baseSlug,
        entityId
      },
      {
        name: 'Head Accountant',
        employeeId: 'EMP-103',
        role: 'Accountant',
        department: 'Finance',
        qualification: 'M.Com, Chartered Accounting',
        email: `accounts.${baseSlug}@pragati.edu`,
        status: 'Active',
        schoolSlug: baseSlug,
        entityId
      }
    ];

    for (const st of defaultStaff) {
      await Staff.create(st).catch(() => {});
    }

    return res.status(201).json({
      success: true,
      message: `School "${trimmedName}" registered successfully!`,
      school: {
        id: newSchool._id,
        name: newSchool.name,
        slug: newSchool.slug,
        address: newSchool.address || '',
        entityId: newSchool.entityId,
        academicYear: newSchool.academicYear,
        status: newSchool.status,
        admin: createdAdmin,
        principal: createdPrincipal
      }
    });
  } catch (error) {
    console.error('Error creating school:', error);
    return res.status(500).json({ error: 'Server error', message: error.message });
  }
});

// @desc    Delete a School Campus / Branch (Admin Authority)
//          Deletes from `users` (or local store) and cascade deletes data in school_ms. Zero writes to pragati DB.
// @route   DELETE /api/school/:slug
// @access  Protected (Admin / Superadmin)
router.delete('/:slug', protect, authorize('admin', 'superadmin'), async (req, res) => {
  try {
    const targetSlug = (req.params.slug || '').trim();
    if (!targetSlug) {
      return res.status(400).json({ error: 'School identifier is required', code: 'MISSING_SLUG' });
    }

    const isObjectId = mongoose.isValidObjectId(targetSlug);

    // 1. Locate school in User (role: 'school') or Store
    let schoolUser = await User.findOne({
      role: 'school',
      $or: [
        { slug: targetSlug },
        { schoolSlug: targetSlug },
        { uniqueId: targetSlug },
        ...(isObjectId ? [{ _id: targetSlug }] : [])
      ]
    });

    let schoolStore = null;
    if (!schoolUser) {
      schoolStore = await Store.findOne({
        $or: [
          { slug: targetSlug },
          { storeId: targetSlug },
          { slug: new RegExp(`^${targetSlug}$`, 'i') },
          ...(isObjectId ? [{ _id: targetSlug }] : [])
        ]
      });
    }

    const targetSchool = schoolUser || schoolStore;
    if (!targetSchool) {
      return res.status(404).json({
        error: `School campus "${targetSlug}" not found.`,
        code: 'SCHOOL_NOT_FOUND'
      });
    }

    // Safeguard: Ensure organization retains at least one active school
    const schoolUserCount = await User.countDocuments({ role: 'school' });
    const storeCount = await Store.countDocuments({});
    if (schoolUserCount + storeCount <= 1) {
      return res.status(400).json({
        error: 'Cannot delete the only remaining school campus. Your organization must retain at least one active school branch.',
        code: 'CANNOT_DELETE_LAST_SCHOOL'
      });
    }

    const deletedSlug = targetSchool.slug || targetSchool.schoolSlug || targetSlug;
    const deletedName = targetSchool.name || targetSchool.schoolName || deletedSlug;

    // Remove from User or Store (DO NOT TOUCH PRAGATI DATABASE!)
    if (schoolUser) {
      await User.deleteOne({ _id: schoolUser._id });
    }
    if (schoolStore) {
      await Store.deleteOne({ _id: schoolStore._id });
    }

    // Cascade clean all data records associated with this school in school_ms
    await Promise.allSettled([
      Staff.deleteMany({ schoolSlug: deletedSlug }),
      Student.deleteMany({ schoolSlug: deletedSlug }),
      User.deleteMany({ schoolSlug: deletedSlug }),
      ClassSection.deleteMany({ schoolSlug: deletedSlug }),
      Fee.deleteMany({ schoolSlug: deletedSlug }),
      Transaction.deleteMany({ schoolSlug: deletedSlug }),
      Academic.deleteMany({ schoolSlug: deletedSlug })
    ]);

    // Find the next active school for safe fallback navigation
    const nextSchool = await User.findOne({ role: 'school', slug: { $ne: deletedSlug } })
      || await Store.findOne({ slug: { $ne: deletedSlug } });

    return res.json({
      success: true,
      message: `School campus "${deletedName}" has been successfully deleted.`,
      deletedSlug,
      fallbackSlug: nextSchool ? (nextSchool.slug || nextSchool.schoolSlug) : null,
      fallbackName: nextSchool ? (nextSchool.name || nextSchool.schoolName) : null
    });
  } catch (error) {
    console.error('Error deleting school branch:', error);
    return res.status(500).json({ error: 'Server error', message: error.message });
  }
});

// @desc    Appoint or Update the Branch Admin for a specific school (Super Admin Authority)
// @route   POST /api/school/:slug/appoint-admin
// @access  Protected (Superadmin)
router.post('/:slug/appoint-admin', protect, authorize('superadmin', 'admin'), async (req, res) => {
  try {
    const slug = (req.params.slug || '').trim();
    const { name, email, phone, qualification, portalUsername, portalPassword } = req.body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'Admin name is required', code: 'MISSING_NAME' });
    }

    // Find target school in User or Store
    let targetSchool = await User.findOne({
      role: 'school',
      $or: [{ slug }, { schoolSlug: slug }, { uniqueId: slug }]
    });

    if (!targetSchool) {
      targetSchool = await Store.findOne({
        $or: [{ slug }, { storeId: slug }]
      });
    }

    if (!targetSchool) {
      return res.status(404).json({ error: `School with slug "${slug}" not found` });
    }

    const entityId = targetSchool.entityId || req.entityId;
    const schoolSlug = targetSchool.slug || slug;
    const schoolName = targetSchool.name || targetSchool.schoolName || schoolSlug;
    const trimmedName = name.trim();
    const aEmail = (email || `${schoolSlug}.admin@pragati.edu`).trim().toLowerCase();
    const aUsername = (portalUsername || `${schoolSlug}_admin`).trim().toLowerCase();

    // Check if an existing Administrator staff record exists for this school
    let adminStaff = await Staff.findOne({
      role: 'Administrator',
      $or: [
        { schoolSlug: schoolSlug },
        { entityId, employeeId: 'ADM-001' }
      ]
    });

    if (adminStaff) {
      adminStaff.name = trimmedName;
      if (email) adminStaff.email = aEmail;
      if (phone) adminStaff.phone = phone.trim();
      if (qualification) adminStaff.qualification = qualification.trim();
      adminStaff.portalUsername = aUsername;
      adminStaff.schoolSlug = schoolSlug;
      adminStaff.status = 'Active';
      await adminStaff.save();
    } else {
      adminStaff = await Staff.create({
        name: trimmedName,
        employeeId: 'ADM-001',
        role: 'Administrator',
        department: 'Administration',
        qualification: qualification || 'School Administrator',
        email: aEmail,
        phone: phone ? phone.trim() : '',
        salary: 85000,
        workload: 'Medium',
        status: 'Active',
        portalUsername: aUsername,
        schoolSlug,
        entityId
      });
    }

    // Provision or update portal user credentials in User (school_ms)
    let portalUser = await User.findOne({
      $or: [
        { uniqueId: aUsername, entityId },
        { referenceId: adminStaff._id },
        { schoolSlug: schoolSlug, role: 'admin' }
      ]
    });

    if (portalUser) {
      portalUser.uniqueId = aUsername;
      portalUser.role = 'admin';
      portalUser.schoolSlug = schoolSlug;
      portalUser.name = trimmedName;
      portalUser.email = aEmail;
      if (phone) portalUser.phone = phone.trim();
      if (portalPassword && portalPassword.trim()) {
        portalUser.password = portalPassword.trim();
      }
      await portalUser.save();
    } else {
      portalUser = new User({
        uniqueId: aUsername,
        password: portalPassword || 'Admin@123',
        role: 'admin',
        entityId,
        schoolSlug,
        referenceId: adminStaff._id,
        onModel: 'Staff',
        name: trimmedName,
        email: aEmail,
        phone: phone ? phone.trim() : ''
      });
      await portalUser.save();
    }

    return res.json({
      success: true,
      message: `Branch Admin "${trimmedName}" appointed for ${schoolName}!`,
      admin: {
        id: adminStaff._id,
        userId: portalUser._id,
        name: adminStaff.name,
        email: adminStaff.email,
        phone: adminStaff.phone,
        qualification: adminStaff.qualification,
        portalUsername: aUsername,
        schoolName: schoolName,
        schoolSlug: schoolSlug,
        role: 'admin'
      }
    });
  } catch (error) {
    console.error('Error appointing branch admin:', error);
    return res.status(500).json({ error: 'Server error', message: error.message });
  }
});

// @desc    Appoint or Update the Principal for a specific school
// @route   POST /api/school/:slug/appoint-principal
// @access  Protected (Admin / Superadmin)
router.post('/:slug/appoint-principal', protect, authorize('admin', 'superadmin'), async (req, res) => {
  try {
    const slug = (req.params.slug || '').trim();
    const { name, email, phone, qualification, portalUsername, portalPassword } = req.body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'Principal name is required', code: 'MISSING_NAME' });
    }

    // Find target school in User or Store
    let targetSchool = await User.findOne({
      role: 'school',
      $or: [{ slug }, { schoolSlug: slug }, { uniqueId: slug }]
    });

    if (!targetSchool) {
      targetSchool = await Store.findOne({
        $or: [{ slug }, { storeId: slug }]
      });
    }

    if (!targetSchool) {
      return res.status(404).json({ error: `School with slug "${slug}" not found` });
    }

    const entityId = targetSchool.entityId || req.entityId;
    const schoolSlug = targetSchool.slug || slug;
    const schoolName = targetSchool.name || targetSchool.schoolName || schoolSlug;
    const trimmedName = name.trim();
    const pEmail = (email || `${schoolSlug}.principal@pragati.edu`).trim().toLowerCase();
    const pUsername = (portalUsername || `${schoolSlug}_principal`).trim().toLowerCase();

    // Check if an existing Principal staff record exists for this school
    let principalStaff = await Staff.findOne({
      role: 'Principal',
      $or: [
        { schoolSlug: schoolSlug },
        { entityId, employeeId: 'PRIN-001' }
      ]
    });

    if (principalStaff) {
      principalStaff.name = trimmedName;
      if (email) principalStaff.email = pEmail;
      if (phone) principalStaff.phone = phone.trim();
      if (qualification) principalStaff.qualification = qualification.trim();
      principalStaff.portalUsername = pUsername;
      principalStaff.schoolSlug = schoolSlug;
      principalStaff.status = 'Active';
      await principalStaff.save();
    } else {
      principalStaff = await Staff.create({
        name: trimmedName,
        employeeId: 'PRIN-001',
        role: 'Principal',
        department: 'Administration',
        qualification: qualification || 'M.Ed / Ph.D in Educational Leadership',
        email: pEmail,
        phone: phone ? phone.trim() : '',
        salary: 95000,
        workload: 'Medium',
        status: 'Active',
        portalUsername: pUsername,
        schoolSlug,
        entityId
      });
    }

    // Provision or update portal user credentials in User (school_ms)
    let portalUser = await User.findOne({
      $or: [
        { uniqueId: pUsername },
        { referenceId: principalStaff._id }
      ]
    });

    if (portalUser) {
      portalUser.uniqueId = pUsername;
      portalUser.role = 'principal';
      portalUser.schoolSlug = schoolSlug;
      if (portalPassword && portalPassword.trim()) {
        portalUser.password = portalPassword.trim();
      }
      await portalUser.save();
    } else {
      portalUser = new User({
        uniqueId: pUsername,
        password: portalPassword || 'Principal@123',
        role: 'principal',
        entityId,
        schoolSlug,
        referenceId: principalStaff._id,
        onModel: 'Staff',
        name: trimmedName,
        email: pEmail
      });
      await portalUser.save();
    }

    return res.json({
      success: true,
      message: `Principal "${trimmedName}" appointed for ${schoolName}!`,
      principal: {
        id: principalStaff._id,
        name: principalStaff.name,
        email: principalStaff.email,
        phone: principalStaff.phone,
        qualification: principalStaff.qualification,
        portalUsername: pUsername,
        schoolName: schoolName,
        schoolSlug: schoolSlug
      }
    });
  } catch (error) {
    console.error('Error appointing principal:', error);
    return res.status(500).json({ error: 'Server error', message: error.message });
  }
});

// @desc    Get the default active licensed school for login fallback routing
// @route   GET /api/school/public-default
// @access  Public
router.get('/public-default', async (req, res) => {
  try {
    // 1. Check schools in User with role: 'school'
    const schoolUsers = await User.find({ role: 'school', status: 'active' });
    for (const school of schoolUsers) {
      if (school.entityId) {
        const pt = await PragatiTenant.findOne({ entity_id: school.entityId }).catch(() => null);
        if (pt && pt.status === 'active') {
          const hasShms = !pt.subscribed_products || pt.subscribed_products.some(p => p.toLowerCase() === 'shms');
          if (hasShms) {
            return res.json({ success: true, slug: school.slug, name: school.name });
          }
        }
      }
    }

    // 2. Fallback to any active Pragati tenant with SHMS (School Management System) subscription
    const activePragati = await PragatiTenant.findOne({
      status: 'active',
      subscribed_products: { $in: ['shms', 'SHMS'] }
    });
    if (activePragati) {
      return res.json({ success: true, slug: activePragati.slug, name: activePragati.name });
    }

    return res.status(404).json({ success: false, message: 'No active licensed school found.' });
  } catch (error) {
    return res.status(500).json({ error: 'Server error', message: error.message });
  }
});

// @desc    Get public school info by tenant slug (for login page / public branding)
// @route   GET /api/school/public/:slug
// @access  Public
router.get('/public/:slug', async (req, res) => {
  try {
    const slug = (req.params.slug || '').trim();
    if (!slug) {
      return res.status(400).json({ error: 'Tenant slug is required', code: 'MISSING_SLUG' });
    }

    // 1. Locate school record in User (role: 'school') or Store (school_ms DB)
    const schoolUser = await User.findOne({
      role: 'school',
      $or: [
        { slug: slug },
        { schoolSlug: slug },
        { uniqueId: slug }
      ]
    });

    let localTenant = null;
    if (!schoolUser) {
      localTenant = await Store.findOne({
        $or: [
          { slug: slug },
          { slug: new RegExp(`^${slug}$`, 'i') },
          { storeId: slug }
        ]
      });
    }

    const schoolEntityId = schoolUser?.entityId || localTenant?.entityId;

    // 2. Live License Verification with Pragati Control Plane (License Portal)
    let pragatiTenant = null;
    if (schoolEntityId) {
      pragatiTenant = await PragatiTenant.findOne({ entity_id: schoolEntityId }).catch(() => null);
    }
    if (!pragatiTenant) {
      pragatiTenant = await PragatiTenant.findOne({
        $or: [
          { slug: slug },
          { slug: new RegExp(`^${slug}$`, 'i') }
        ]
      }).catch(() => null);
    }

    // A. If the tenant entity was DELETED or does not exist in the License Portal:
    if (!pragatiTenant) {
      return res.status(404).json({
        success: false,
        error: `School workspace "${slug}" was not found or is not registered under an active license in the Pragati License Portal.`,
        code: 'TENANT_NOT_FOUND',
        status: 'deleted'
      });
    }

    // B. Check if SHMS (School Management System) product is subscribed
    if (pragatiTenant.subscribed_products && Array.isArray(pragatiTenant.subscribed_products) && pragatiTenant.subscribed_products.length > 0) {
      const hasShms = pragatiTenant.subscribed_products.some(p => p.toLowerCase() === 'shms');
      if (!hasShms) {
        return res.status(403).json({
          success: false,
          error: `This organization does not have an active School Management System (SHMS) license in Pragati.`,
          code: 'NO_SHMS_LICENSE',
          status: 'unlicensed'
        });
      }
    }

    // C. If the tenant is SUSPENDED in the License Portal:
    if (pragatiTenant.status && pragatiTenant.status !== 'active') {
      return res.status(403).json({
        success: false,
        error: `School workspace "${pragatiTenant.name || slug}" has been suspended or revoked by Pragati Licensing.`,
        code: 'TENANT_SUSPENDED',
        status: 'suspended',
        schoolName: pragatiTenant.name || slug
      });
    }

    // D. If the specific school branch is marked inactive locally:
    if (schoolUser && schoolUser.status && schoolUser.status !== 'active') {
      return res.status(403).json({
        success: false,
        error: `School campus "${schoolUser.name || slug}" is currently inactive.`,
        code: 'TENANT_INACTIVE',
        status: 'inactive'
      });
    }

    const schoolName = schoolUser?.name || schoolUser?.schoolName || localTenant?.name || pragatiTenant?.name || slug;

    return res.json({
      success: true,
      school: {
        name: schoolName,
        slug: schoolUser?.slug || localTenant?.slug || pragatiTenant?.slug || slug,
        address: schoolUser?.address || localTenant?.address || pragatiTenant?.address || '',
        status: 'active'
      }
    });
  } catch (error) {
    console.error('Error fetching public school info:', error);
    return res.status(500).json({ error: 'Server error', message: error.message });
  }
});

// @desc    Get current school details & configuration for authenticated tenant
// @route   GET /api/school
// @access  Protected
router.get('/', protect, async (req, res) => {
  try {
    const slug = req.schoolSlug || req.headers['x-school-slug'] || req.headers['x-tenant-slug'] || req.tenant?.slug || req.pragatiTenant?.slug || req.user?.slug;
    const entityId = req.entityId || req.tenant?.entityId;

    // 1. Check school in User
    let school = await User.findOne({
      role: 'school',
      $or: [
        { slug: slug },
        { schoolSlug: slug },
        { uniqueId: slug }
      ]
    });

    let schoolName = school?.name || school?.schoolName;
    let schoolAddress = school?.address || '';
    let schoolStatus = school?.status || 'active';
    let academicYear = school?.academicYear || '2026-2027';
    let currency = school?.currency || 'INR (₹)';
    let timezone = school?.timezone || 'Asia/Kolkata (IST)';
    let maintenanceMode = !!school?.maintenanceMode;

    if (!school) {
      // Fallback to Store
      const tenant = await Store.findOne({
        $or: [
          { entityId: entityId },
          { slug: slug },
          { storeId: slug }
        ]
      });

      if (tenant) {
        schoolName = tenant.name || tenant.slug;
        schoolAddress = tenant.address || '';
        schoolStatus = tenant.status || 'active';
        academicYear = tenant.academicYear || '2026-2027';
        currency = tenant.currency || 'INR (₹)';
        timezone = tenant.timezone || 'Asia/Kolkata (IST)';
        maintenanceMode = !!tenant.maintenanceMode;
      } else {
        schoolName = req.tenant?.name || req.pragatiTenant?.name || slug || 'Pragati School';
      }
    }

    // Find appointed Principal for this school
    const principalStaff = await Staff.findOne({
      role: 'Principal',
      $or: [
        { schoolSlug: slug },
        { entityId: entityId }
      ],
      status: { $ne: 'Resigned' }
    }).select('_id name email phone qualification portalUsername employeeId status');

    return res.json({
      success: true,
      school: {
        name: schoolName,
        slug: slug,
        address: schoolAddress,
        entityId: entityId,
        status: schoolStatus,
        academicYear,
        currency,
        timezone,
        maintenanceMode,
        principal: principalStaff ? {
          id: principalStaff._id,
          name: principalStaff.name,
          email: principalStaff.email,
          phone: principalStaff.phone,
          qualification: principalStaff.qualification,
          portalUsername: principalStaff.portalUsername,
          employeeId: principalStaff.employeeId,
          status: principalStaff.status
        } : null
      }
    });
  } catch (error) {
    console.error('Error fetching school info:', error);
    return res.status(500).json({ error: 'Server error', message: error.message });
  }
});

// @desc    Assign / Update the School Name (Admin Authority only)
// @route   PUT /api/school/name
// @access  Protected (Admin / Superadmin / Principal)
router.put('/name', protect, authorize('admin', 'superadmin', 'principal'), async (req, res) => {
  try {
    const { name, address } = req.body;
    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({
        error: 'Please provide a valid school name (at least 2 characters)',
        code: 'INVALID_NAME'
      });
    }

    const trimmedName = name.trim();
    if (trimmedName.length < 2 || trimmedName.length > 100) {
      return res.status(400).json({
        error: 'School name must be between 2 and 100 characters',
        code: 'INVALID_NAME_LENGTH'
      });
    }

    const slug = req.schoolSlug || req.tenant?.slug || req.pragatiTenant?.slug || req.user?.slug;
    const entityId = req.entityId || req.tenant?.entityId;

    const setObj = {
      name: trimmedName,
      schoolName: trimmedName
    };
    if (address !== undefined && typeof address === 'string') {
      setObj.address = address.trim();
    }

    // 1. Update school in User if it exists there
    let updatedSchool = await User.findOneAndUpdate(
      {
        role: 'school',
        $or: [
          { slug: slug },
          { schoolSlug: slug },
          { uniqueId: slug }
        ]
      },
      { $set: setObj },
      { new: true }
    );

    // 2. If not in User, update local Store record
    if (!updatedSchool) {
      updatedSchool = await Store.findOneAndUpdate(
        {
          $or: [
            { entityId: entityId },
            { slug: slug },
            { storeId: slug }
          ]
        },
        { $set: setObj },
        { new: true, upsert: true }
      );
    }

    // NOTE: Zero writes to Pragati Control Plane DB (Pragati DB is for license generation only)

    return res.json({
      success: true,
      message: `School name successfully assigned to "${trimmedName}"`,
      school: {
        name: updatedSchool.name,
        slug: updatedSchool.slug || slug,
        address: updatedSchool.address || '',
        entityId: updatedSchool.entityId || entityId
      }
    });
  } catch (error) {
    console.error('Error updating school name:', error);
    return res.status(500).json({ error: 'Server error', message: error.message });
  }
});

// @desc    Update Full School Global Configuration & Parameters (Admin Authority)
// @route   PUT /api/school/config
// @access  Protected (Admin / Superadmin / Principal)
router.put('/config', protect, authorize('admin', 'superadmin', 'principal'), async (req, res) => {
  try {
    const { name, address, academicYear, currency, timezone, maintenanceMode } = req.body;
    const slug = req.schoolSlug || req.tenant?.slug || req.pragatiTenant?.slug || req.user?.slug;
    const entityId = req.entityId || req.tenant?.entityId;

    const updateFields = {};
    if (name && typeof name === 'string' && name.trim()) {
      updateFields.name = name.trim();
      updateFields.schoolName = name.trim();
    }
    if (address !== undefined && typeof address === 'string') {
      updateFields.address = address.trim();
    }
    if (academicYear) updateFields.academicYear = academicYear;
    if (currency) updateFields.currency = currency;
    if (timezone) updateFields.timezone = timezone;
    if (typeof maintenanceMode === 'boolean') updateFields.maintenanceMode = maintenanceMode;

    // 1. Update in User if school is stored there
    let updatedSchool = await User.findOneAndUpdate(
      {
        role: 'school',
        $or: [
          { slug: slug },
          { schoolSlug: slug },
          { uniqueId: slug }
        ]
      },
      { $set: updateFields },
      { new: true }
    );

    // 2. Fallback to Store
    if (!updatedSchool) {
      updatedSchool = await Store.findOneAndUpdate(
        {
          $or: [
            { entityId: entityId },
            { slug: slug },
            { storeId: slug }
          ]
        },
        { $set: updateFields },
        { new: true, upsert: true }
      );
    }

    // NOTE: Zero writes to Pragati Control Plane DB (Pragati DB is for license generation only)

    return res.json({
      success: true,
      message: 'Global School Configuration saved successfully',
      school: {
        name: updatedSchool.name,
        slug: updatedSchool.slug || slug,
        address: updatedSchool.address || '',
        academicYear: updatedSchool.academicYear,
        currency: updatedSchool.currency,
        timezone: updatedSchool.timezone,
        maintenanceMode: updatedSchool.maintenanceMode
      }
    });
  } catch (error) {
    console.error('Error saving global configuration:', error);
    return res.status(500).json({ error: 'Server error', message: error.message });
  }
});

module.exports = router;
