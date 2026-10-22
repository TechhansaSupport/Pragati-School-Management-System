const express = require('express');
const router = express.Router();
const Student = require('../models/Student');

// Helper to verify admin authority
const checkAdminAuthority = (req, res) => {
  const allowedRoles = ['admin', 'superadmin', 'principal', 'frontdesk', 'school', 'school_admin'];
  const userRole = (req.user && req.user.role) ? req.user.role.toLowerCase() : '';
  
  if (userRole && !allowedRoles.includes(userRole)) {
    res.status(403).json({
      error: 'Access Denied: Only School Administrators have authority to manage students',
      code: 'FORBIDDEN_ADMIN_ONLY',
      message: 'Access Denied: Only School Administrators have authority to manage students'
    });
    return false;
  }
  return true;
};

// Seed helper on demand if a school workspace has 0 students
const seedInitialStudentsIfEmpty = async (entityId, force = false, schoolSlug = null) => {
  if (!entityId && !force) return;
  const count = await Student.countDocuments(entityId ? { entityId } : {});
  if (count === 0 || force) {
    const sampleStudents = [
      { name: 'Aarav Sharma', rollNo: 'STU-1001', grade: 'Class 10', section: 'A', gender: 'Male', parentName: 'Rajesh Sharma', parentContact: '+91 98201 12345', email: 'aarav.sharma@pragati.edu', attendance: 96, status: 'Active', entityId: entityId || 'default-school', schoolSlug },
      { name: 'Diya Patel', rollNo: 'STU-1002', grade: 'Class 10', section: 'A', gender: 'Female', parentName: 'Kiran Patel', parentContact: '+91 98201 12346', email: 'diya.patel@pragati.edu', attendance: 92, status: 'Active', entityId: entityId || 'default-school', schoolSlug },
      { name: 'Vihaan Verma', rollNo: 'STU-1003', grade: 'Class 10', section: 'B', gender: 'Male', parentName: 'Alok Verma', parentContact: '+91 98201 12347', email: 'vihaan.verma@pragati.edu', attendance: 88, status: 'Active', entityId: entityId || 'default-school', schoolSlug },
      { name: 'Ananya Iyer', rollNo: 'STU-1004', grade: 'Class 9', section: 'A', gender: 'Female', parentName: 'Subramanian Iyer', parentContact: '+91 98201 12348', email: 'ananya.iyer@pragati.edu', attendance: 98, status: 'Active', entityId: entityId || 'default-school', schoolSlug },
      { name: 'Kabir Mehta', rollNo: 'STU-1005', grade: 'Class 9', section: 'B', gender: 'Male', parentName: 'Sunil Mehta', parentContact: '+91 98201 12349', email: 'kabir.mehta@pragati.edu', attendance: 91, status: 'Active', entityId: entityId || 'default-school', schoolSlug },
      { name: 'Riya Sen', rollNo: 'STU-1006', grade: 'Class 11', section: 'Science', gender: 'Female', parentName: 'Debashis Sen', parentContact: '+91 98201 12350', email: 'riya.sen@pragati.edu', attendance: 94, status: 'Active', entityId: entityId || 'default-school', schoolSlug },
      { name: 'Rohan Gupta', rollNo: 'STU-1007', grade: 'Class 12', section: 'Science', gender: 'Male', parentName: 'Mahesh Gupta', parentContact: '+91 98201 12351', email: 'rohan.gupta@pragati.edu', attendance: 89, status: 'Active', entityId: entityId || 'default-school', schoolSlug },
      { name: 'Sneha Reddy', rollNo: 'STU-1008', grade: 'Class 10', section: 'A', gender: 'Female', parentName: 'Venkatesh Reddy', parentContact: '+91 98201 12352', email: 'sneha.reddy@pragati.edu', attendance: 95, status: 'Active', entityId: entityId || 'default-school', schoolSlug },
    ];
    for (const s of sampleStudents) {
      const exists = await Student.findOne({ rollNo: s.rollNo, entityId: s.entityId });
      if (!exists) {
        try {
          await Student.create(s);
        } catch (e) {
          // ignore duplicate in race
        }
      }
    }
  }
};

// GET /api/students — List all students with class & section filters, search, pagination
router.get('/', async (req, res) => {
  try {
    const { search, page = 1, limit = 50, grade, section, status, schoolSlug, all } = req.query;
    const query = { entityId: req.entityId };

    const effectiveSchoolSlug = schoolSlug || (req.user?.role !== 'superadmin' ? (req.schoolSlug || req.headers['x-school-slug']) : null);
    if (effectiveSchoolSlug && effectiveSchoolSlug !== 'all' && effectiveSchoolSlug !== 'central') {
      query.schoolSlug = effectiveSchoolSlug;
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
      entityId: req.entityId,
      schoolSlug: req.schoolSlug || req.headers['x-school-slug'],
    });

    await newStudent.save();
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
    const student = await Student.findOneAndUpdate(
      { _id: req.params.id, entityId: req.entityId },
      req.body,
      { new: true, runValidators: true }
    );

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

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

// DELETE /api/students — Delete ALL or SELECTED students (Admin Authority Only)
router.delete('/', async (req, res) => {
  if (!checkAdminAuthority(req, res)) return;

  try {
    const { ids } = req.body || {};
    const targetSlug = req.query.schoolSlug || req.headers['x-school-slug'] || req.headers['x-tenant-slug'] || req.schoolSlug;

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
    const student = await Student.findOneAndDelete({ _id: req.params.id, entityId: req.entityId });

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
      User.updateMany(
        { entityId: req.entityId },
        { $set: { studentsInitialized: true } }
      )
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
