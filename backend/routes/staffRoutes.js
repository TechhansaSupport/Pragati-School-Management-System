const express = require('express');
const router = express.Router();
const Staff = require('../models/Staff');
const User = require('../models/User');

// Helper to verify admin authority
const checkAdminAuthority = (req, res) => {
  const allowedRoles = ['admin', 'superadmin', 'principal', 'frontdesk'];
  const userRole = (req.user && req.user.role) ? req.user.role.toLowerCase() : '';
  
  // If request passed through auth token with role
  if (userRole && !allowedRoles.includes(userRole)) {
    res.status(403).json({
      error: 'Access Denied: Only School Administrators have authority to manage staff',
      code: 'FORBIDDEN_ADMIN_ONLY',
      message: 'Access Denied: Only School Administrators have authority to manage staff'
    });
    return false;
  }
  return true;
};

// Seed helper on demand if a school workspace has 0 staff
const seedInitialStaffIfEmpty = async (entityId, force = false) => {
  const count = await Staff.countDocuments(entityId ? { entityId } : {});
  if (count === 0 || force) {
    const defaultStaff = [
      {
        name: 'Dr. Anita Desai',
        employeeId: 'EMP-102',
        role: 'Principal',
        department: 'Administration',
        qualification: 'Ph.D in Education, M.Sc',
        email: 'principal@pragati.edu',
        phone: '+91 98765 43210',
        salary: 95000,
        workload: 'Medium',
        status: 'Active',
        entityId: entityId || 'default-school'
      },
      {
        name: 'R. K. Sharma',
        employeeId: 'EMP-103',
        role: 'Teacher',
        department: 'Science',
        qualification: 'M.Sc Physics, B.Ed',
        subjects: ['Physics', 'General Science'],
        classes: ['10th - A', '11th - Sci', '12th - Sci'],
        email: 'rk.sharma@pragati.edu',
        phone: '+91 98765 43211',
        salary: 62000,
        workload: 'High',
        status: 'Active',
        entityId: entityId || 'default-school'
      },
      {
        name: 'Pooja Iyer',
        employeeId: 'EMP-104',
        role: 'Teacher',
        department: 'Mathematics',
        qualification: 'M.Sc Mathematics, B.Ed',
        subjects: ['Mathematics', 'Advanced Calculus'],
        classes: ['9th - B', '10th - B'],
        email: 'pooja.iyer@pragati.edu',
        phone: '+91 98765 43212',
        salary: 58000,
        workload: 'Medium',
        status: 'Active',
        entityId: entityId || 'default-school'
      },
      {
        name: 'Sunil Verma',
        employeeId: 'EMP-105',
        role: 'Accountant',
        department: 'Finance',
        qualification: 'M.Com, Chartered Accounting Inter',
        email: 'accounts@pragati.edu',
        phone: '+91 98765 43213',
        salary: 50000,
        workload: 'Medium',
        status: 'Active',
        entityId: entityId || 'default-school'
      },
      {
        name: 'Kavita Singh',
        employeeId: 'EMP-106',
        role: 'Librarian',
        department: 'Library',
        qualification: 'Master of Library Science (M.Lib)',
        email: 'library@pragati.edu',
        phone: '+91 98765 43214',
        salary: 42000,
        workload: 'Low',
        status: 'Active',
        entityId: entityId || 'default-school'
      }
    ];
    for (const s of defaultStaff) {
      const exists = await Staff.findOne({ employeeId: s.employeeId, entityId: s.entityId });
      if (!exists) {
        try {
          await Staff.create(s);
        } catch (e) {
          // ignore duplicate in race
        }
      }
    }
  }
};

// GET /api/staff — List all staff (with search, filtering, pagination)
router.get('/', async (req, res) => {
  try {
    const { search, page = 1, limit = 50, role, department, status, schoolSlug, all } = req.query;
    const query = { entityId: req.entityId };

    const effectiveSchoolSlug = schoolSlug || (req.user?.role !== 'superadmin' ? (req.schoolSlug || req.headers['x-school-slug']) : null);
    if (effectiveSchoolSlug && effectiveSchoolSlug !== 'all' && effectiveSchoolSlug !== 'central') {
      query.schoolSlug = effectiveSchoolSlug;
    }

    if (search) {
      const searchOr = [
        { name: { $regex: search, $options: 'i' } },
        { employeeId: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { department: { $regex: search, $options: 'i' } },
        { role: { $regex: search, $options: 'i' } },
        { subjects: { $elemMatch: { $regex: search, $options: 'i' } } },
      ];
      if (query.$or) {
        query.$and = [{ $or: query.$or }, { $or: searchOr }];
        delete query.$or;
      } else {
        query.$or = searchOr;
      }
    }

    if (role && role !== 'All') query.role = role;
    if (department && department !== 'All') query.department = department;
    if (status && status !== 'All') query.status = status;

    const total = await Staff.countDocuments(query);

    let queryBuilder = Staff.find(query).sort({ createdAt: -1 });

    if (all !== 'true') {
      queryBuilder = queryBuilder.skip((Number(page) - 1) * Number(limit)).limit(Number(limit));
    }

    const staff = await queryBuilder;

    res.json({
      staff,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / Number(limit)) || 1,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// GET /api/staff/stats — KPI stats
router.get('/stats', async (req, res) => {
  try {
    const targetSlug = req.query.schoolSlug || (req.user?.role !== 'superadmin' ? (req.schoolSlug || req.headers['x-school-slug']) : null);
    
    let scopeFilter = { entityId: req.entityId };
    if (targetSlug && targetSlug !== 'all' && targetSlug !== 'central') {
      scopeFilter.schoolSlug = targetSlug;
    }

    const totalStaff = await Staff.countDocuments(scopeFilter);
    const teachingStaff = await Staff.countDocuments({ role: 'Teacher', ...scopeFilter });
    const adminSupport = await Staff.countDocuments({ 
      role: { $in: ['Principal', 'Administrator', 'Support Staff', 'Librarian', 'Accountant', 'Transport Incharge'] }, 
      ...scopeFilter 
    });
    const onLeave = await Staff.countDocuments({ status: 'On Leave', ...scopeFilter });

    res.json({
      totalStaff,
      teachingStaff,
      adminSupport,
      onLeave,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// GET /api/staff/teachers — Teachers only
router.get('/teachers', async (req, res) => {
  try {
    const { search } = req.query;
    const query = { role: 'Teacher', entityId: req.entityId };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { subjects: { $elemMatch: { $regex: search, $options: 'i' } } },
        { employeeId: { $regex: search, $options: 'i' } },
      ];
    }

    const teachers = await Staff.find(query).sort({ name: 1 });
    res.json(teachers);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// GET /api/staff/:id — Get single staff member
router.get('/:id', async (req, res) => {
  try {
    const member = await Staff.findOne({ _id: req.params.id, entityId: req.entityId });
    if (!member) {
      return res.status(404).json({ message: 'Staff member not found' });
    }
    res.json(member);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// POST /api/staff — Create new staff member (Admin Authority Only)
router.post('/', async (req, res) => {
  if (!checkAdminAuthority(req, res)) return;

  try {
    const {
      name,
      employeeId,
      role,
      department,
      subjects,
      classes,
      qualification,
      email,
      phone,
      salary,
      workload,
      status,
      joiningDate,
      createPortalAccess,
      portalPassword,
      portalUsername,
      schoolSlug,
    } = req.body;

    if (!name || !role || !department) {
      return res.status(400).json({ message: 'Name, Role, and Department are required' });
    }

    const assignedSchoolSlug = (schoolSlug || req.schoolSlug || req.headers['x-school-slug'] || req.headers['x-tenant-slug'] || '').trim();

    // Auto-generate employeeId if not supplied
    let empId = employeeId;
    if (!empId) {
      const staffCount = await Staff.countDocuments({ entityId: req.entityId });
      let nextNum = staffCount + 101;
      while (await Staff.findOne({ employeeId: `EMP-${String(nextNum).padStart(3, '0')}`, entityId: req.entityId })) {
        nextNum++;
      }
      empId = `EMP-${String(nextNum).padStart(3, '0')}`;
    }

    // Check if employeeId already exists for this school
    const existing = await Staff.findOne({ employeeId: empId, entityId: req.entityId });
    if (existing) {
      return res.status(400).json({ message: `Employee ID "${empId}" already exists in this school.` });
    }

    // Format subjects & classes into arrays if passed as strings
    const formattedSubjects = Array.isArray(subjects) 
      ? subjects 
      : (typeof subjects === 'string' && subjects.trim()) 
        ? subjects.split(',').map(s => s.trim()).filter(Boolean) 
        : [];

    const formattedClasses = Array.isArray(classes) 
      ? classes 
      : (typeof classes === 'string' && classes.trim()) 
        ? classes.split(',').map(c => c.trim()).filter(Boolean) 
        : [];

    const usernameForPortal = portalUsername || email || empId;

    const staffData = {
      name: name.trim(),
      employeeId: empId.trim(),
      role,
      department: department.trim(),
      subjects: formattedSubjects,
      classes: formattedClasses,
      qualification: qualification ? qualification.trim() : '',
      email: email ? email.trim().toLowerCase() : '',
      phone: phone ? phone.trim() : '',
      salary: salary ? Number(salary) : 0,
      workload: workload || 'Medium',
      status: status || 'Active',
      joiningDate: joiningDate ? new Date(joiningDate) : new Date(),
      portalUsername: createPortalAccess ? usernameForPortal : undefined,
      schoolSlug: assignedSchoolSlug,
      entityId: req.entityId,
    };

    const member = new Staff(staffData);
    await member.save();

    // Provision local portal user credentials if requested by Admin
    let portalCreated = false;
    if (createPortalAccess && portalPassword) {
      try {
        const roleMap = {
          'Teacher': 'teacher',
          'Principal': 'principal',
          'Administrator': 'admin',
          'Librarian': 'librarian',
          'Accountant': 'accountant',
          'Transport Incharge': 'transport',
          'Support Staff': 'admin',
        };
        const systemRole = roleMap[role] || 'teacher';

        // Check if user already exists
        let user = await User.findOne({ uniqueId: usernameForPortal, entityId: req.entityId });
        if (!user) {
          user = new User({
            uniqueId: usernameForPortal,
            password: portalPassword,
            role: systemRole,
            entityId: req.entityId,
            schoolSlug: assignedSchoolSlug,
            referenceId: member._id,
            onModel: 'Staff',
            name: member.name,
            email: member.email,
            phone: member.phone
          });
          await user.save();
          portalCreated = true;
        } else {
          user.schoolSlug = assignedSchoolSlug;
          user.role = systemRole;
          await user.save();
        }
      } catch (userErr) {
        console.error('Portal account creation notice:', userErr.message);
      }
    }

    res.status(201).json({
      message: 'Staff member created successfully',
      staff: member,
      portalCreated,
      portalUsername: createPortalAccess ? usernameForPortal : null,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Employee ID already exists for this school' });
    }
    res.status(400).json({ message: 'Validation error', error: error.message });
  }
});

// PUT /api/staff/:id — Update staff member (Admin Authority Only)
router.put('/:id', async (req, res) => {
  if (!checkAdminAuthority(req, res)) return;

  try {
    const { subjects, classes, ...otherData } = req.body;

    if (subjects !== undefined) {
      otherData.subjects = Array.isArray(subjects) 
        ? subjects 
        : (typeof subjects === 'string' && subjects.trim()) 
          ? subjects.split(',').map(s => s.trim()).filter(Boolean) 
          : [];
    }

    if (classes !== undefined) {
      otherData.classes = Array.isArray(classes) 
        ? classes 
        : (typeof classes === 'string' && classes.trim()) 
          ? classes.split(',').map(c => c.trim()).filter(Boolean) 
          : [];
    }

    const member = await Staff.findOneAndUpdate(
      { _id: req.params.id, entityId: req.entityId },
      otherData,
      { new: true, runValidators: true }
    );

    if (!member) {
      return res.status(404).json({ message: 'Staff member not found' });
    }

    // Update portal user password if provided
    if (req.body.portalPassword && member.portalUsername) {
      const user = await User.findOne({ uniqueId: member.portalUsername, entityId: req.entityId });
      if (user) {
        user.password = req.body.portalPassword;
        await user.save();
      }
    }

    res.json({
      message: 'Staff member updated successfully',
      staff: member,
    });
  } catch (error) {
    res.status(400).json({ message: 'Update error', error: error.message });
  }
});

// DELETE /api/staff/:id — Delete staff member (Admin Authority Only)
router.delete('/:id', async (req, res) => {
  if (!checkAdminAuthority(req, res)) return;

  try {
    const member = await Staff.findOneAndDelete({ _id: req.params.id, entityId: req.entityId });

    if (!member) {
      return res.status(404).json({ message: 'Staff member not found' });
    }

    // Also remove associated local portal user if any
    if (member.portalUsername) {
      await User.findOneAndDelete({ uniqueId: member.portalUsername, entityId: req.entityId });
    }

    res.json({ message: 'Staff member deleted successfully', id: req.params.id });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// DELETE /api/staff — Delete ALL staff members (Admin Authority Only)
router.delete('/', async (req, res) => {
  if (!checkAdminAuthority(req, res)) return;

  try {
    const filter = { entityId: req.entityId };

    const staffList = await Staff.find(filter).select('portalUsername');
    const usernames = staffList.map(s => s.portalUsername).filter(Boolean);

    const result = await Staff.deleteMany(filter);

    if (usernames.length > 0) {
      await User.deleteMany({ uniqueId: { $in: usernames }, entityId: req.entityId, role: { $ne: 'superadmin' } });
    }

    res.json({
      success: true,
      message: `Successfully deleted all ${result.deletedCount} staff records`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// POST /api/staff/seed — Explicitly generate starter staff (Admin Authority Only)
router.post('/seed', async (req, res) => {
  if (!checkAdminAuthority(req, res)) return;

  try {
    const Store = require('../models/Store');
    const schoolUsers = await User.find({ role: 'school' });
    const localStores = await Store.find({});
    if (schoolUsers.length === 0 && localStores.length === 0) {
      return res.status(400).json({
        error: 'School Required',
        message: 'Cannot generate starter staff without a registered school campus. Please create a school campus first.',
        code: 'SCHOOL_REQUIRED'
      });
    }

    await seedInitialStaffIfEmpty(req.entityId, true);
    res.json({
      success: true,
      message: 'Default starter faculty and staff created successfully'
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
