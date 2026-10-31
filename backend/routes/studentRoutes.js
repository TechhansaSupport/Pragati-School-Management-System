const express = require('express');
const router = express.Router();
const Student = require('../models/Student');
const User = require('../models/User');

// Helper to verify authority to admit and manage students
const checkAdminAuthority = (req, res) => {
  const allowedRoles = ['admin', 'superadmin', 'principal', 'frontdesk', 'support_staff', 'support', 'school', 'school_admin'];
  const userRole = (
    req.user?.role || 
    req.headers['x-user-role'] || 
    req.body?.userRole || 
    ''
  ).toLowerCase().trim();
  
  if (userRole && !allowedRoles.includes(userRole)) {
    res.status(403).json({
      error: 'Access Denied: You do not have authority to admit or manage students',
      code: 'FORBIDDEN_UNAUTHORIZED',
      message: 'Access Denied: You do not have authority to admit or manage students'
    });
    return false;
  }
  return true;
};

// Helper for bulk destructive actions (Delete All) - Restricted to leadership
const checkBulkDeleteAuthority = (req, res) => {
  const allowedRoles = ['admin', 'superadmin', 'principal', 'school', 'school_admin'];
  const userRole = (
    req.user?.role || 
    req.headers['x-user-role'] || 
    req.body?.userRole || 
    ''
  ).toLowerCase().trim();

  if (userRole && !allowedRoles.includes(userRole)) {
    res.status(403).json({
      error: 'Access Denied: Only School Administrators have authority to perform bulk student deletions',
      code: 'FORBIDDEN_ADMIN_ONLY',
      message: 'Access Denied: Only School Administrators have authority to perform bulk student deletions'
    });
    return false;
  }
  return true;
};

// Helper to synchronize Student with User account for portal login
const syncStudentUser = async (studentDoc, explicitPassword = null) => {
  if (!studentDoc || !studentDoc.rollNo || !studentDoc.entityId) return null;
  const username = (studentDoc.rollNo || '').trim();
  const targetPassword = (explicitPassword || studentDoc.portalPassword || 'student123').trim();
  const email = (studentDoc.email || `${username.toLowerCase()}@pragati.edu`).trim().toLowerCase();

  try {
    let user = await User.findOne({
      entityId: studentDoc.entityId,
      $or: [
        { referenceId: studentDoc._id },
        { uniqueId: username },
        { uniqueId: new RegExp(`^${username}$`, 'i') }
      ]
    });

    if (user) {
      user.name = studentDoc.name;
      user.uniqueId = username;
      user.email = email;
      user.phone = studentDoc.parentContact || '';
      user.role = 'student';
      user.referenceId = studentDoc._id;
      user.onModel = 'Student';
      user.entityId = studentDoc.entityId;
      user.schoolSlug = studentDoc.schoolSlug || user.schoolSlug;
      user.status = studentDoc.status === 'Inactive' ? 'inactive' : 'active';
      if (explicitPassword || !user.password) {
        user.password = targetPassword;
      }
      await user.save();
      return user;
    } else {
      user = new User({
        uniqueId: username,
        password: targetPassword,
        name: studentDoc.name,
        email: email,
        phone: studentDoc.parentContact || '',
        role: 'student',
        referenceId: studentDoc._id,
        onModel: 'Student',
        entityId: studentDoc.entityId,
        schoolSlug: studentDoc.schoolSlug,
        status: studentDoc.status === 'Inactive' ? 'inactive' : 'active'
      });
      await user.save();
      return user;
    }
  } catch (err) {
    console.error(`Failed to sync student user ${username}:`, err.message);
    return null;
  }
};

// Seed helper on demand if a school workspace has 0 students
const seedInitialStudentsIfEmpty = async (entityId, force = false, schoolSlug = null) => {
  if (!entityId && !force) return;
  const count = await Student.countDocuments(entityId ? { entityId } : {});
  if (count === 0 || force) {
    const sampleStudents = [
      { name: 'Aarav Sharma', rollNo: 'STU-1001', grade: 'Class 10', section: 'A', gender: 'Male', parentName: 'Rajesh Sharma', parentContact: '+91 98201 12345', email: 'aarav.sharma@pragati.edu', attendance: 96, status: 'Active', entityId: entityId || 'default-school', schoolSlug, portalPassword: 'student123' },
      { name: 'Diya Patel', rollNo: 'STU-1002', grade: 'Class 10', section: 'A', gender: 'Female', parentName: 'Kiran Patel', parentContact: '+91 98201 12346', email: 'diya.patel@pragati.edu', attendance: 92, status: 'Active', entityId: entityId || 'default-school', schoolSlug, portalPassword: 'student123' },
      { name: 'Vihaan Verma', rollNo: 'STU-1003', grade: 'Class 10', section: 'B', gender: 'Male', parentName: 'Alok Verma', parentContact: '+91 98201 12347', email: 'vihaan.verma@pragati.edu', attendance: 88, status: 'Active', entityId: entityId || 'default-school', schoolSlug, portalPassword: 'student123' },
      { name: 'Ananya Iyer', rollNo: 'STU-1004', grade: 'Class 9', section: 'A', gender: 'Female', parentName: 'Subramanian Iyer', parentContact: '+91 98201 12348', email: 'ananya.iyer@pragati.edu', attendance: 98, status: 'Active', entityId: entityId || 'default-school', schoolSlug, portalPassword: 'student123' },
      { name: 'Kabir Mehta', rollNo: 'STU-1005', grade: 'Class 9', section: 'B', gender: 'Male', parentName: 'Sunil Mehta', parentContact: '+91 98201 12349', email: 'kabir.mehta@pragati.edu', attendance: 91, status: 'Active', entityId: entityId || 'default-school', schoolSlug, portalPassword: 'student123' },
      { name: 'Riya Sen', rollNo: 'STU-1006', grade: 'Class 11', section: 'Science', gender: 'Female', parentName: 'Debashis Sen', parentContact: '+91 98201 12350', email: 'riya.sen@pragati.edu', attendance: 94, status: 'Active', entityId: entityId || 'default-school', schoolSlug, portalPassword: 'student123' },
      { name: 'Rohan Gupta', rollNo: 'STU-1007', grade: 'Class 12', section: 'Science', gender: 'Male', parentName: 'Mahesh Gupta', parentContact: '+91 98201 12351', email: 'rohan.gupta@pragati.edu', attendance: 89, status: 'Active', entityId: entityId || 'default-school', schoolSlug, portalPassword: 'student123' },
      { name: 'Sneha Reddy', rollNo: 'STU-1008', grade: 'Class 10', section: 'A', gender: 'Female', parentName: 'Venkatesh Reddy', parentContact: '+91 98201 12352', email: 'sneha.reddy@pragati.edu', attendance: 95, status: 'Active', entityId: entityId || 'default-school', schoolSlug, portalPassword: 'student123' },
    ];
    for (const s of sampleStudents) {
      let existingStudent = await Student.findOne({ rollNo: s.rollNo, entityId: s.entityId });
      if (!existingStudent) {
        try {
          existingStudent = await Student.create(s);
        } catch (e) {
          // ignore duplicate in race
        }
      }
      if (existingStudent) {
        await syncStudentUser(existingStudent, 'student123');
      }
    }
  }
};

// GET /api/students — List all students with class & section filters, search, pagination
router.get('/', async (req, res) => {
  try {
    const userRole = (req.user?.role || '').toLowerCase();
    if (userRole === 'student') {
      const studentId = req.user.referenceId;
      const username = req.user.username;
      const ownStudent = await Student.findOne({
        entityId: req.entityId,
        $or: [
          ...(studentId ? [{ _id: studentId }] : []),
          { rollNo: username },
          ...(req.user.email ? [{ email: req.user.email }] : [])
        ]
      });
      return res.json({
        students: ownStudent ? [ownStudent] : [],
        total: ownStudent ? 1 : 0,
        page: 1,
        pages: 1
      });
    }

    const { search, page = 1, limit = 50, grade, section, status, schoolSlug, all } = req.query;
    const query = { entityId: req.entityId };

    const isSuperAdmin = (req.user?.role || '').toLowerCase() === 'superadmin';
    const effectiveSchoolSlug = isSuperAdmin
      ? (schoolSlug || req.schoolSlug || req.headers['x-school-slug'])
      : req.schoolSlug;

    if (effectiveSchoolSlug && effectiveSchoolSlug !== 'all' && effectiveSchoolSlug !== 'central') {
      const primarySchool = await User.findOne({ role: 'school', entityId: req.entityId }).sort({ createdAt: 1 });
      const isPrimary = !primarySchool || primarySchool.slug === effectiveSchoolSlug;
      if (isPrimary) {
        query.$or = [
          { schoolSlug: effectiveSchoolSlug },
          { schoolSlug: null },
          { schoolSlug: { $exists: false } },
          { schoolSlug: '' }
        ];
      } else {
        query.schoolSlug = effectiveSchoolSlug;
      }
    }

    if (search) {
      const searchOr = [
        { name: { $regex: search, $options: 'i' } },
        { rollNo: { $regex: search, $options: 'i' } },
        { grade: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { parentName: { $regex: search, $options: 'i' } },
      ];
      if (query.$or) {
        query.$and = [{ $or: query.$or }, { $or: searchOr }];
        delete query.$or;
      } else {
        query.$or = searchOr;
      }
    }

    if (status && status !== 'All') {
      query.status = status;
    }

    if (grade && grade !== 'All') {
      query.grade = grade;
    }

    if (section && section !== 'All') {
      query.section = section;
    }

    const total = await Student.countDocuments(query);
    let queryBuilder = Student.find(query).sort({ createdAt: -1 });

    if (all !== 'true') {
      queryBuilder = queryBuilder.skip((Number(page) - 1) * Number(limit)).limit(Number(limit));
    }

    const students = await queryBuilder;

    res.json({
      students,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / Number(limit)) || 1,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// GET /api/students/stats — KPI stats
router.get('/stats', async (req, res) => {
  try {
    const targetSlug = req.query.schoolSlug || (req.user?.role !== 'superadmin' ? (req.schoolSlug || req.headers['x-school-slug']) : null);
    
    let scopeFilter = { entityId: req.entityId };
    if (targetSlug && targetSlug !== 'all' && targetSlug !== 'central') {
      scopeFilter.schoolSlug = targetSlug;
    }

    const totalStudents = await Student.countDocuments(scopeFilter);
    const activeStudents = await Student.countDocuments({ status: 'Active', ...scopeFilter });
    const inactiveStudents = await Student.countDocuments({ status: { $ne: 'Active' }, ...scopeFilter });

    // Calculate average attendance
    const attendanceMatch = Object.keys(scopeFilter).length > 0 ? { $match: scopeFilter } : { $match: {} };
    const attendanceResult = await Student.aggregate([
      attendanceMatch,
      { $group: { _id: null, avgAttendance: { $avg: '$attendance' } } },
    ]);
    const avgAttendance = (attendanceResult.length > 0 && attendanceResult[0].avgAttendance !== null)
      ? Math.round(attendanceResult[0].avgAttendance * 10) / 10
      : 0;

    res.json({
      totalStudents,
      activeStudents,
      inactiveStudents,
      avgAttendance,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// GET /api/students/:id — Get single student
router.get('/:id', async (req, res) => {
  try {
    const userRole = (req.user?.role || '').toLowerCase();
    if (userRole === 'student') {
      const studentId = String(req.user.referenceId || '');
      const reqId = String(req.params.id);
      if (reqId !== studentId) {
        const ownStudent = await Student.findOne({
          _id: req.params.id,
          entityId: req.entityId,
          $or: [
            { rollNo: req.user.username },
            ...(req.user.email ? [{ email: req.user.email }] : [])
          ]
        });
        if (!ownStudent) {
          return res.status(403).json({ message: 'Access Denied: Students can only view their own student details' });
        }
        return res.json(ownStudent);
      }
    }

    const student = await Student.findOne({ _id: req.params.id, entityId: req.entityId });
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    res.json(student);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// POST /api/students — Create new student & assign to class/section
router.post('/', async (req, res) => {
  if (!checkAdminAuthority(req, res)) return;

  try {
    const { name, rollNo, grade, section } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Student full name is required' });
    }
    if (!grade || !grade.trim()) {
      return res.status(400).json({ message: 'Assigned class/grade is required' });
    }

    // Auto-generate roll number if not provided
    let finalRollNo = rollNo && rollNo.trim();
    if (!finalRollNo) {
      const count = await Student.countDocuments(req.entityId ? { entityId: req.entityId } : {});
      finalRollNo = `STU-${1000 + count + 1}`;
    }

    const newStudent = new Student({
      ...req.body,
      name: name.trim(),
      rollNo: finalRollNo,
      grade: grade.trim(),
      section: (section || 'A').trim().toUpperCase(),
      portalPassword: (req.body.portalPassword || 'student123').trim(),
      entityId: req.entityId,
      schoolSlug: req.schoolSlug || req.headers['x-school-slug'],
    });

    await newStudent.save();
    // Synchronize User account for student portal authentication
    await syncStudentUser(newStudent, newStudent.portalPassword);

    res.status(201).json({
      success: true,
      message: `Student "${newStudent.name}" enrolled in ${newStudent.grade} - Section ${newStudent.section} successfully.`,
      student: newStudent
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'A student with this Roll Number already exists in this school.' });
    }
    res.status(400).json({ message: 'Validation error', error: error.message });
  }
});

// PUT /api/students/:id — Update student & reassign class/section
router.put('/:id', async (req, res) => {
  if (!checkAdminAuthority(req, res)) return;

  try {
    const isSuperAdmin = (req.user?.role || '').toLowerCase() === 'superadmin';
    const filter = { _id: req.params.id, entityId: req.entityId };
    if (!isSuperAdmin && req.schoolSlug) {
      filter.$or = [{ schoolSlug: req.schoolSlug }, { schoolSlug: null }, { schoolSlug: { $exists: false } }, { schoolSlug: '' }];
    }

    const student = await Student.findOneAndUpdate(
      filter,
      req.body,
      { new: true, runValidators: true }
    );

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Synchronize User account for student portal authentication
    await syncStudentUser(student, req.body.portalPassword || student.portalPassword);

    res.json({
      success: true,
      message: 'Student record updated successfully',
      student
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'A student with this Roll Number already exists in this school.' });
    }
    res.status(400).json({ message: 'Update error', error: error.message });
  }
});

// DELETE /api/students — Delete ALL or SELECTED students (Leadership Authority Only)
router.delete('/', async (req, res) => {
  if (!checkBulkDeleteAuthority(req, res)) return;

  try {
    const { ids } = req.body || {};
    const isSuperAdmin = (req.user?.role || '').toLowerCase() === 'superadmin';
    const targetSlug = isSuperAdmin 
      ? (req.query.schoolSlug || req.headers['x-school-slug'] || req.schoolSlug) 
      : req.schoolSlug;

    // Strict isolation to entity
    const filter = { entityId: req.entityId };

    // 1. Bulk delete selected IDs if provided
    if (Array.isArray(ids) && ids.length > 0) {
      filter._id = { $in: ids };
      const result = await Student.deleteMany(filter);

      const Assignment = require('../models/Assignment');
      const Fee = require('../models/Fee');
      const User = require('../models/User');

      await Promise.allSettled([
        Assignment.updateMany(
          { entityId: req.entityId },
          { $pull: { submissions: { studentId: { $in: ids } } } }
        ),
        Fee.deleteMany({ entityId: req.entityId, student: { $in: ids } }),
        User.updateMany(
          { entityId: req.entityId },
          { $set: { studentsInitialized: true } }
        )
      ]);

      return res.json({
        success: true,
        message: `Successfully deleted ${result.deletedCount} selected student record(s)`,
        deletedCount: result.deletedCount
      });
    }

    // 2. Delete all students for target campus (or entire school entity if 'all' or 'central')
    if (targetSlug && targetSlug !== 'all' && targetSlug !== 'central') {
      filter.$or = [
        { schoolSlug: targetSlug },
        { schoolSlug: { $exists: false } },
        { schoolSlug: null },
        { schoolSlug: '' }
      ];
    }

    const result = await Student.deleteMany(filter);

    // Cascading cleanup of related collections
    const Assignment = require('../models/Assignment');
    const Fee = require('../models/Fee');
    const User = require('../models/User');

    const cascadeFilter = { entityId: req.entityId };
    if (targetSlug && targetSlug !== 'all' && targetSlug !== 'central') {
      cascadeFilter.schoolSlug = targetSlug;
    }

    await Promise.allSettled([
      Assignment.deleteMany(cascadeFilter),
      Fee.deleteMany(cascadeFilter),
      User.updateMany(
        { entityId: req.entityId },
        { $set: { studentsInitialized: true } }
      )
    ]);

    res.json({
      success: true,
      message: `Successfully deleted all ${result.deletedCount} student records`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// DELETE /api/students/:id — Delete single student (Admin Authority Only)
router.delete('/:id', async (req, res) => {
  if (!checkAdminAuthority(req, res)) return;

  try {
    const isSuperAdmin = (req.user?.role || '').toLowerCase() === 'superadmin';
    const filter = { _id: req.params.id, entityId: req.entityId };
    if (!isSuperAdmin && req.schoolSlug) {
      filter.$or = [{ schoolSlug: req.schoolSlug }, { schoolSlug: null }, { schoolSlug: { $exists: false } }, { schoolSlug: '' }];
    }

    const student = await Student.findOneAndDelete(filter);

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    const Assignment = require('../models/Assignment');
    const Fee = require('../models/Fee');
    const User = require('../models/User');

    await Promise.allSettled([
      Assignment.updateMany(
        { entityId: req.entityId },
        { $pull: { submissions: { studentId: req.params.id } } }
      ),
      Fee.deleteMany({ entityId: req.entityId, student: req.params.id }),
      User.deleteMany({
        entityId: req.entityId,
        role: 'student',
        $or: [
          { referenceId: req.params.id },
          { uniqueId: student.rollNo }
        ]
      })
    ]);

    res.json({
      success: true,
      message: `Student "${student.name}" deleted successfully`,
      id: req.params.id
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// POST /api/students/sync-credentials — Synchronize and ensure portal credentials for all students
router.post('/sync-credentials', async (req, res) => {
  try {
    const filter = req.entityId ? { entityId: req.entityId } : {};
    const students = await Student.find(filter);
    let count = 0;
    for (const st of students) {
      const pwd = st.portalPassword || 'student123';
      if (!st.portalPassword) {
        st.portalPassword = pwd;
        await st.save();
      }
      await syncStudentUser(st, pwd);
      count++;
    }
    res.json({
      success: true,
      message: `Successfully synchronized and provisioned portal login credentials for ${count} students.`,
      count
    });
  } catch (error) {
    res.status(500).json({ message: 'Error syncing credentials', error: error.message });
  }
});

// POST /api/students/seed — Explicitly generate starter students (Admin Authority Only)
router.post('/seed', async (req, res) => {
  if (!checkAdminAuthority(req, res)) return;

  try {
    const Store = require('../models/Store');
    const User = require('../models/User');
    const schoolUsers = await User.find({ role: 'school' });
    const localStores = await Store.find({});
    if (schoolUsers.length === 0 && localStores.length === 0) {
      return res.status(400).json({
        error: 'School Required',
        message: 'Cannot generate starter students without a registered school campus. Please create a school campus first.',
        code: 'SCHOOL_REQUIRED'
      });
    }

    await seedInitialStudentsIfEmpty(req.entityId, true, req.schoolSlug);
    res.json({
      success: true,
      message: 'Default starter students enrolled successfully'
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
module.exports.syncStudentUser = syncStudentUser;
