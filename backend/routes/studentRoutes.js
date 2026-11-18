const express = require('express');
const router = express.Router();
const Student = require('../models/Student');
const User = require('../models/User');
const PromotionLog = require('../models/PromotionLog');
const ClassSection = require('../models/ClassSection');

const resolveSchoolSlug = (req) => {
  return (req.query?.schoolSlug || req.body?.schoolSlug || req.headers['x-school-slug'] || req.schoolSlug || '').trim();
};

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
  const username = (studentDoc.userId || studentDoc.rollNo || '').trim();
  const targetPassword = (explicitPassword || studentDoc.portalPassword || 'student123').trim();
  const email = (studentDoc.email || `${username.toLowerCase()}@pragati.edu`).trim().toLowerCase();

  try {
    let user = await User.findOne({
      entityId: studentDoc.entityId,
      $or: [
        { referenceId: studentDoc._id },
        { uniqueId: username },
        { uniqueId: new RegExp(`^${username}$`, 'i') },
        { uniqueId: studentDoc.rollNo },
        { uniqueId: new RegExp(`^${studentDoc.rollNo}$`, 'i') }
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

// ==========================================
// STUDENT PROMOTION & SESSION ROLLOVER API
// ==========================================

const STANDARD_GRADE_ORDER = [
  'Nursery', 'LKG', 'UKG',
  'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5',
  'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10',
  'Class 11', 'Class 12'
];

const getNextGradeInfo = (currentGrade = '') => {
  const cg = String(currentGrade || '').trim();
  const idx = STANDARD_GRADE_ORDER.findIndex(g => g.toLowerCase() === cg.toLowerCase());
  if (idx !== -1) {
    if (idx === STANDARD_GRADE_ORDER.length - 1) {
      return { nextGrade: 'Graduated', isFinalYear: true };
    }
    return { nextGrade: STANDARD_GRADE_ORDER[idx + 1], isFinalYear: false };
  }
  const match = cg.match(/(?:Class|Grade)\s*(\d+)/i);
  if (match) {
    const num = parseInt(match[1], 10);
    if (num >= 12) return { nextGrade: 'Graduated', isFinalYear: true };
    return { nextGrade: `Class ${num + 1}`, isFinalYear: false };
  }
  return { nextGrade: cg, isFinalYear: false };
};

// GET /api/students/promotion-classes — Summary of all classes for session rollover planning
router.get('/promotion-classes', async (req, res) => {
  try {
    const schoolSlug = resolveSchoolSlug(req);
    const query = { entityId: req.entityId, status: 'Active' };
    if (schoolSlug && schoolSlug !== 'central' && schoolSlug !== 'all') {
      query.$or = [{ schoolSlug }, { schoolSlug: { $exists: false } }, { schoolSlug: '' }];
    }

    const students = await Student.find(query).select('grade section academicSession');

    const classMap = {};
    students.forEach(st => {
      const g = st.grade || 'Unassigned';
      const s = st.section || 'A';
      const key = `${g} - Section ${s}`;
      if (!classMap[key]) {
        const nextInfo = getNextGradeInfo(g);
        classMap[key] = {
          grade: g,
          section: s,
          classLabel: key,
          studentCount: 0,
          currentSession: st.academicSession || '2026-2027',
          suggestedNextGrade: nextInfo.nextGrade,
          isFinalYear: nextInfo.isFinalYear
        };
      }
      classMap[key].studentCount++;
    });

    const classList = Object.values(classMap).sort((a, b) => {
      const idxA = STANDARD_GRADE_ORDER.findIndex(g => g.toLowerCase() === a.grade.toLowerCase());
      const idxB = STANDARD_GRADE_ORDER.findIndex(g => g.toLowerCase() === b.grade.toLowerCase());
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      return a.grade.localeCompare(b.grade, undefined, { numeric: true });
    });

    res.json({
      success: true,
      classes: classList,
      totalActiveStudents: students.length,
      standardSessions: ['2025-2026', '2026-2027', '2027-2028', '2028-2029', '2029-2030']
    });
  } catch (error) {
    console.error('Error fetching promotion classes:', error);
    res.status(500).json({ message: 'Error retrieving promotion classes', error: error.message });
  }
});

// GET /api/students/promotion-candidates — Get active students eligible for promotion in a class
router.get('/promotion-candidates', async (req, res) => {
  try {
    const { grade, section } = req.query;
    const schoolSlug = resolveSchoolSlug(req);

    if (!grade) {
      return res.status(400).json({ message: 'Grade/Class parameter is required' });
    }

    const query = { entityId: req.entityId, grade: grade.trim() };
    if (section && section !== 'All') {
      query.section = section.trim().toUpperCase();
    }
    if (schoolSlug && schoolSlug !== 'central' && schoolSlug !== 'all') {
      query.$or = [{ schoolSlug }, { schoolSlug: { $exists: false } }, { schoolSlug: '' }];
    }

    const students = await Student.find(query)
      .select('name rollNo grade section attendance status academicSession parentName parentContact')
      .sort({ rollNo: 1, name: 1 });

    const nextInfo = getNextGradeInfo(grade);

    res.json({
      success: true,
      grade,
      section: section || 'All',
      suggestedNextGrade: nextInfo.nextGrade,
      isFinalYear: nextInfo.isFinalYear,
      totalCandidates: students.length,
      candidates: students
    });
  } catch (error) {
    console.error('Error fetching promotion candidates:', error);
    res.status(500).json({ message: 'Error retrieving promotion candidates', error: error.message });
  }
});

// POST /api/students/promote-batch — Execute class-wise student promotion & rollover
router.post('/promote-batch', async (req, res) => {
  if (!checkAdminAuthority(req, res)) return;

  try {
    const {
      sourceClass,
      sourceSection,
      targetClass,
      targetSection,
      fromSession = '2026-2027',
      toSession = '2027-2028',
      students = [],
      remarks = ''
    } = req.body;

    const schoolSlug = resolveSchoolSlug(req);

    if (!sourceClass || !Array.isArray(students) || students.length === 0) {
      return res.status(400).json({ message: 'Source class and student actions list are required' });
    }

    const userName = req.user?.name || req.headers['x-user-name'] || 'Administrator';
    const userRole = (req.user?.role || req.headers['x-user-role'] || 'admin').toLowerCase();

    let promotedCount = 0;
    let retainedCount = 0;
    let graduatedCount = 0;
    let transferredCount = 0;
    const logDetails = [];

    for (const item of students) {
      const { studentId, action, targetGrade, targetSec, studentRemarks } = item;
      if (!studentId) continue;

      const studentDoc = await Student.findOne({ _id: studentId, entityId: req.entityId });
      if (!studentDoc) continue;

      const prevGrade = studentDoc.grade;
      const prevSec = studentDoc.section;
      const effectiveAction = action || 'Promoted';

      let newGrade = prevGrade;
      let newSec = prevSec;
      let newStatus = studentDoc.status || 'Active';

      if (effectiveAction === 'Promoted') {
        const destGrade = targetGrade || targetClass || getNextGradeInfo(prevGrade).nextGrade;
        if (destGrade === 'Graduated') {
          newStatus = 'Graduated';
          newGrade = prevGrade;
          graduatedCount++;
        } else {
          newGrade = destGrade;
          newSec = targetSec || targetSection || prevSec;
          newStatus = 'Active';
          promotedCount++;
        }
      } else if (effectiveAction === 'Graduated') {
        newStatus = 'Graduated';
        graduatedCount++;
      } else if (effectiveAction === 'Retained') {
        newGrade = prevGrade;
        newSec = targetSec || prevSec;
        newStatus = 'Active';
        retainedCount++;
      } else if (effectiveAction === 'Transferred') {
        newStatus = 'Transferred';
        transferredCount++;
      }

      studentDoc.grade = newGrade;
      studentDoc.section = newSec;
      studentDoc.status = newStatus;
      studentDoc.academicSession = toSession;

      if (!Array.isArray(studentDoc.promotionHistory)) {
        studentDoc.promotionHistory = [];
      }

      studentDoc.promotionHistory.push({
        fromGrade: prevGrade,
        toGrade: newGrade,
        fromSection: prevSec,
        toSection: newSec,
        fromSession,
        toSession,
        action: effectiveAction,
        remarks: studentRemarks || remarks || `Class progression: ${fromSession} to ${toSession}`,
        promotedAt: new Date(),
        promotedBy: userName
      });

      await studentDoc.save();

      logDetails.push({
        studentId: studentDoc._id,
        studentName: studentDoc.name,
        rollNo: studentDoc.rollNo,
        fromGrade: prevGrade,
        toGrade: newGrade,
        fromSection: prevSec,
        toSection: newSec,
        action: effectiveAction,
        remarks: studentRemarks || remarks || ''
      });
    }

    // Ensure target class exists in ClassSection for the new session
    if (targetClass && targetClass !== 'Graduated') {
      const effectiveTargetSec = targetSection || sourceSection || 'A';
      await ClassSection.findOneAndUpdate(
        {
          className: targetClass.trim(),
          section: effectiveTargetSec.trim().toUpperCase(),
          entityId: req.entityId
        },
        {
          $setOnInsert: {
            className: targetClass.trim(),
            section: effectiveTargetSec.trim().toUpperCase(),
            academicSession: toSession,
            entityId: req.entityId,
            schoolSlug: schoolSlug || req.schoolSlug || '',
            status: 'Active',
            capacity: 40,
            subjects: ['Mathematics', 'Science', 'English', 'Social Studies']
          }
        },
        { upsert: true }
      ).catch(() => null);
    }

    const promotionLog = new PromotionLog({
      entityId: req.entityId,
      schoolSlug: schoolSlug || req.schoolSlug || '',
      mode: 'class_wise',
      fromSession,
      toSession,
      sourceClass: `${sourceClass}${sourceSection ? ` - ${sourceSection}` : ''}`,
      targetClass: `${targetClass || 'Graduated'}${targetSection ? ` - ${targetSection}` : ''}`,
      totalProcessed: logDetails.length,
      promotedCount,
      retainedCount,
      graduatedCount,
      transferredCount,
      executedBy: userName,
      executedByRole: userRole,
      details: logDetails,
      notes: remarks || `Promoted ${promotedCount} students from ${sourceClass} to ${targetClass || 'next level'}`
    });

    await promotionLog.save();

    res.json({
      success: true,
      message: `Promotion complete! ${promotedCount} promoted, ${retainedCount} retained, ${graduatedCount} graduated, ${transferredCount} marked transferred for session ${toSession}.`,
      summary: {
        totalProcessed: logDetails.length,
        promotedCount,
        retainedCount,
        graduatedCount,
        transferredCount,
        fromSession,
        toSession
      },
      promotionLogId: promotionLog._id
    });
  } catch (error) {
    console.error('Error in batch student promotion:', error);
    res.status(500).json({ message: 'Error processing batch promotion', error: error.message });
  }
});

// POST /api/students/promote-school-rollover — Whole-school automated academic session progression
router.post('/promote-school-rollover', async (req, res) => {
  if (!checkAdminAuthority(req, res)) return;

  try {
    const { fromSession = '2026-2027', toSession = '2027-2028', remarks = '' } = req.body;
    const schoolSlug = resolveSchoolSlug(req);
    const userName = req.user?.name || req.headers['x-user-name'] || 'Administrator';
    const userRole = (req.user?.role || req.headers['x-user-role'] || 'admin').toLowerCase();

    const query = { entityId: req.entityId, status: 'Active' };
    if (schoolSlug && schoolSlug !== 'central' && schoolSlug !== 'all') {
      query.$or = [{ schoolSlug }, { schoolSlug: { $exists: false } }, { schoolSlug: '' }];
    }

    const activeStudents = await Student.find(query);

    let promotedCount = 0;
    let graduatedCount = 0;
    const logDetails = [];

    for (const st of activeStudents) {
      const prevGrade = st.grade;
      const prevSec = st.section;
      const nextInfo = getNextGradeInfo(prevGrade);

      let newGrade = prevGrade;
      let newStatus = 'Active';
      let action = 'Promoted';

      if (nextInfo.isFinalYear || nextInfo.nextGrade === 'Graduated') {
        newStatus = 'Graduated';
        action = 'Graduated';
        graduatedCount++;
      } else {
        newGrade = nextInfo.nextGrade;
        promotedCount++;
      }

      st.grade = newGrade;
      st.status = newStatus;
      st.academicSession = toSession;

      if (!Array.isArray(st.promotionHistory)) {
        st.promotionHistory = [];
      }

      st.promotionHistory.push({
        fromGrade: prevGrade,
        toGrade: newGrade,
        fromSection: prevSec,
        toSection: prevSec,
        fromSession,
        toSession,
        action,
        remarks: remarks || `Annual School Rollover ${fromSession} → ${toSession}`,
        promotedAt: new Date(),
        promotedBy: userName
      });

      await st.save();

      logDetails.push({
        studentId: st._id,
        studentName: st.name,
        rollNo: st.rollNo,
        fromGrade: prevGrade,
        toGrade: newGrade,
        fromSection: prevSec,
        toSection: prevSec,
        action,
        remarks
      });
    }

    const classQuery = { entityId: req.entityId };
    if (schoolSlug && schoolSlug !== 'central' && schoolSlug !== 'all') {
      classQuery.$or = [{ schoolSlug }, { schoolSlug: { $exists: false } }, { schoolSlug: '' }];
    }
    await ClassSection.updateMany(classQuery, { $set: { academicSession: toSession } }).catch(() => null);

    const promotionLog = new PromotionLog({
      entityId: req.entityId,
      schoolSlug: schoolSlug || req.schoolSlug || '',
      mode: 'school_rollover',
      fromSession,
      toSession,
      sourceClass: 'All School Classes',
      targetClass: 'Next Grade Hierarchy',
      totalProcessed: logDetails.length,
      promotedCount,
      retainedCount: 0,
      graduatedCount,
      transferredCount: 0,
      executedBy: userName,
      executedByRole: userRole,
      details: logDetails,
      notes: remarks || `Whole-school annual session rollover from ${fromSession} to ${toSession}`
    });

    await promotionLog.save();

    res.json({
      success: true,
      message: `Annual school session rollover successful! ${promotedCount} students advanced to next classes, ${graduatedCount} graduated. Active session is now ${toSession}.`,
      summary: {
        totalProcessed: logDetails.length,
        promotedCount,
        graduatedCount,
        fromSession,
        toSession
      },
      promotionLogId: promotionLog._id
    });
  } catch (error) {
    console.error('Error in school-wide rollover:', error);
    res.status(500).json({ message: 'Error processing annual rollover', error: error.message });
  }
});

// GET /api/students/promotion-history — Retrieve promotion audit history
router.get('/promotion-history', async (req, res) => {
  try {
    const schoolSlug = resolveSchoolSlug(req);
    const query = { entityId: req.entityId };
    if (schoolSlug && schoolSlug !== 'central' && schoolSlug !== 'all') {
      query.$or = [{ schoolSlug }, { schoolSlug: { $exists: false } }, { schoolSlug: '' }];
    }

    const history = await PromotionLog.find(query)
      .sort({ createdAt: -1 })
      .limit(30);

    res.json({
      success: true,
      history: history || []
    });
  } catch (error) {
    console.error('Error retrieving promotion history:', error);
    res.status(500).json({ message: 'Error retrieving promotion history', error: error.message });
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

    const finalUserId = (req.body.userId || req.body.portalUsername || finalRollNo).trim();

    const newStudent = new Student({
      ...req.body,
      name: name.trim(),
      rollNo: finalRollNo,
      userId: finalUserId,
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

    const updateData = { ...req.body };
    if (updateData.portalUsername !== undefined && updateData.userId === undefined) {
      updateData.userId = updateData.portalUsername ? updateData.portalUsername.trim() : '';
    }
    if (updateData.userId !== undefined) {
      updateData.userId = (updateData.userId || updateData.rollNo || '').trim();
    }
    if (updateData.portalPassword) {
      updateData.portalPassword = updateData.portalPassword.trim();
    }

    const student = await Student.findOneAndUpdate(
      filter,
      updateData,
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
