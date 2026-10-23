const express = require('express');
const router = express.Router();
const ClassSection = require('../models/ClassSection');
const Staff = require('../models/Staff');
const Student = require('../models/Student');
const User = require('../models/User');
const Store = require('../models/Store');

// Helper to check administrator authority
const checkAdminAuthority = (req, res) => {
  const allowedRoles = ['admin', 'superadmin', 'principal', 'frontdesk'];
  const userRole = (req.user && req.user.role) ? req.user.role.toLowerCase() : '';
  
  if (userRole && !allowedRoles.includes(userRole)) {
    res.status(403).json({
      error: 'Access Denied: Only School Administrators have authority to configure classes and sections',
      code: 'FORBIDDEN_ADMIN_ONLY',
      message: 'Access Denied: Only School Administrators have authority to configure classes and sections'
    });
    return false;
  }
  return true;
};

// Helper to retrieve all valid registered school campuses strictly for an entity
const getRegisteredSchools = async (entityId = null) => {
  const query = entityId ? { entityId } : {};
  const schoolUsers = await User.find({ role: 'school', ...query }).sort({ createdAt: 1 });
  const localStores = await Store.find(query).sort({ createdAt: 1 });
  const list = [];
  const slugs = new Set();

  for (const u of schoolUsers) {
    const s = u.slug || u.schoolSlug || u.uniqueId;
    if (s && !slugs.has(s)) {
      slugs.add(s);
      list.push({
        id: u._id,
        name: u.name || u.schoolName || s,
        slug: s,
        entityId: u.entityId || s,
        address: u.address || ''
      });
    }
  }

  for (const st of localStores) {
    if (st.slug && !slugs.has(st.slug)) {
      slugs.add(st.slug);
      list.push({
        id: st._id,
        name: st.name || st.slug,
        slug: st.slug,
        entityId: st.entityId || st.slug,
        address: st.address || ''
      });
    }
  }

  return list;
};

// Seed helper if a school has 0 classes configured
const seedInitialClassesIfEmpty = async (entityId, schoolSlug = null) => {
  if (!entityId) return;
  const registeredSchools = await getRegisteredSchools(entityId);
  if (registeredSchools.length === 0) {
    return; // Strictly DO NOT seed if no school campus exists
  }

  const targetSchool = registeredSchools.find(s => s.slug === schoolSlug || s.entityId === entityId) || registeredSchools[0];
  const targetEntityId = entityId;
  const targetSchoolSlug = targetSchool.slug;

  const count = await ClassSection.countDocuments({
    entityId: targetEntityId
  });

  if (count === 0) {
    // Look up any available teachers to assign as class teachers
    const teachers = await Staff.find({ entityId: targetEntityId, role: 'Teacher' }).limit(5);

    const defaultClasses = [
      {
        className: 'Class 10',
        section: 'A',
        classTeacher: teachers[0]?._id || null,
        classTeacherName: teachers[0]?.name || 'R. K. Sharma',
        roomNumber: 'Room 201',
        capacity: 40,
        academicSession: '2026-2027',
        subjects: ['Mathematics', 'Physics', 'Chemistry', 'English', 'Social Science'],
        schedule: 'Mon - Fri | 08:30 AM - 02:30 PM',
        status: 'Active',
        entityId: targetEntityId,
        schoolSlug: targetSchoolSlug
      },
      {
        className: 'Class 10',
        section: 'B',
        classTeacher: teachers[1]?._id || null,
        classTeacherName: teachers[1]?.name || 'Pooja Iyer',
        roomNumber: 'Room 202',
        capacity: 40,
        academicSession: '2026-2027',
        subjects: ['Mathematics', 'Physics', 'Chemistry', 'English', 'Social Science'],
        schedule: 'Mon - Fri | 08:30 AM - 02:30 PM',
        status: 'Active',
        entityId: targetEntityId,
        schoolSlug: targetSchoolSlug
      },
      {
        className: 'Class 9',
        section: 'A',
        classTeacher: teachers[2]?._id || null,
        classTeacherName: teachers[2]?.name || 'Dr. Vikram Malhotra',
        roomNumber: 'Room 105',
        capacity: 45,
        academicSession: '2026-2027',
        subjects: ['Mathematics', 'General Science', 'English', 'Hindi', 'History'],
        schedule: 'Mon - Fri | 08:30 AM - 02:30 PM',
        status: 'Active',
        entityId: targetEntityId,
        schoolSlug: targetSchoolSlug
      },
      {
        className: 'Class 9',
        section: 'B',
        classTeacher: null,
        classTeacherName: 'Unassigned',
        roomNumber: 'Room 106',
        capacity: 45,
        academicSession: '2026-2027',
        subjects: ['Mathematics', 'General Science', 'English', 'Hindi', 'Geography'],
        schedule: 'Mon - Fri | 08:30 AM - 02:30 PM',
        status: 'Active',
        entityId: targetEntityId,
        schoolSlug: targetSchoolSlug
      },
      {
        className: 'Class 11',
        section: 'Science',
        classTeacher: teachers[0]?._id || null,
        classTeacherName: teachers[0]?.name || 'R. K. Sharma',
        roomNumber: 'Science Wing B-1',
        capacity: 35,
        academicSession: '2026-2027',
        subjects: ['Physics', 'Chemistry', 'Mathematics', 'Biology', 'Computer Science'],
        schedule: 'Mon - Fri | 08:00 AM - 02:00 PM',
        status: 'Active',
        entityId: targetEntityId,
        schoolSlug: targetSchoolSlug
      },
      {
        className: 'Class 12',
        section: 'Science',
        classTeacher: teachers[2]?._id || null,
        classTeacherName: teachers[2]?.name || 'Dr. Vikram Malhotra',
        roomNumber: 'Science Wing B-2',
        capacity: 35,
        academicSession: '2026-2027',
        subjects: ['Advanced Physics', 'Chemistry', 'Mathematics', 'Computer Science', 'English'],
        schedule: 'Mon - Fri | 08:00 AM - 02:00 PM',
        status: 'Active',
        entityId: targetEntityId,
        schoolSlug: targetSchoolSlug
      }
    ];

    for (const c of defaultClasses) {
      try {
        await ClassSection.create(c);
      } catch (err) {
        // ignore duplicate race
      }
    }
  }
};

// GET /api/classes — List all classes and sections
router.get('/', async (req, res) => {
  try {
    const { search, grade, status, schoolSlug } = req.query;
    const registeredSchools = await getRegisteredSchools(req.entityId);
    const schoolsCount = registeredSchools.length;

    // If 0 schools exist in the system, no valid school classes exist
    if (schoolsCount === 0) {
      return res.json({
        classes: [],
        total: 0,
        distinctGrades: [],
        schoolsCount: 0,
        schools: []
      });
    }

    const query = { entityId: req.entityId };

    const isSuperAdmin = (req.user?.role || '').toLowerCase() === 'superadmin';
    const effectiveSlug = isSuperAdmin ? schoolSlug : req.schoolSlug;

    if (effectiveSlug && effectiveSlug !== 'All' && effectiveSlug !== 'all') {
      const primarySchool = await User.findOne({ role: 'school', entityId: req.entityId }).sort({ createdAt: 1 });
      const isPrimary = !primarySchool || primarySchool.slug === effectiveSlug;
      if (isPrimary) {
        query.$or = [
          { schoolSlug: effectiveSlug },
          { schoolSlug: null },
          { schoolSlug: { $exists: false } },
          { schoolSlug: '' }
        ];
      } else {
        query.schoolSlug = effectiveSlug;
      }
    }

    if (search) {
      const searchOr = [
        { className: { $regex: search, $options: 'i' } },
        { section: { $regex: search, $options: 'i' } },
        { classTeacherName: { $regex: search, $options: 'i' } },
        { roomNumber: { $regex: search, $options: 'i' } },
        { subjects: { $elemMatch: { $regex: search, $options: 'i' } } },
      ];
      if (query.$or) {
        query.$and = [{ $or: query.$or }, { $or: searchOr }];
        delete query.$or;
      } else {
        query.$or = searchOr;
      }
    }

    if (grade && grade !== 'All') {
      query.className = grade;
    }

    if (status && status !== 'All') {
      query.status = status;
    }

    const classes = await ClassSection.find(query).sort({ className: 1, section: 1 });

    // Attach real-time enrolled student count for each class section
    const classesWithCounts = await Promise.all(
      classes.map(async (cls) => {
        const studentQuery = {
          entityId: req.entityId,
          $or: [
            { grade: cls.className, section: cls.section },
            { grade: new RegExp(`^${cls.className}$`, 'i'), section: new RegExp(`^${cls.section}$`, 'i') }
          ]
        };

        const studentCount = await Student.countDocuments(studentQuery);
        const schoolMatch = registeredSchools.find(s => s.slug === cls.schoolSlug || s.entityId === cls.entityId);

        const clsObj = cls.toObject();
        // Dynamically resolve teacher name from Staff or default to 'Unassigned'
        if (cls.classTeacher) {
          const teacher = await Staff.findById(cls.classTeacher).select('name');
          if (teacher) {
            clsObj.classTeacherName = teacher.name;
          } else {
            clsObj.classTeacher = null;
            clsObj.classTeacherName = 'Unassigned';
          }
        } else if (!cls.classTeacher || cls.classTeacherName === 'Senior Faculty' || cls.classTeacherName === 'Faculty Member') {
          clsObj.classTeacher = null;
          clsObj.classTeacherName = 'Unassigned';
        }

        clsObj.enrolledStudents = studentCount;
        clsObj.occupancyPercent = cls.capacity > 0 ? Math.round((studentCount / cls.capacity) * 100) : 0;
        clsObj.schoolName = schoolMatch ? schoolMatch.name : (cls.schoolSlug || 'Main Campus');
        clsObj.schoolSlug = cls.schoolSlug || (schoolMatch ? schoolMatch.slug : '');
        return clsObj;
      })
    );

    // Extract unique grades list for dropdown filter
    const distinctQuery = { entityId: req.entityId };
    const allDistinctGrades = await ClassSection.distinct('className', distinctQuery);

    res.json({
      classes: classesWithCounts,
      total: classesWithCounts.length,
      distinctGrades: allDistinctGrades.sort(),
      schoolsCount,
      schools: registeredSchools
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// GET /api/classes/stats — KPI Summary
router.get('/stats', async (req, res) => {
  try {
    const registeredSchools = await getRegisteredSchools(req.entityId);
    if (registeredSchools.length === 0) {
      return res.json({
        totalClasses: 0,
        totalSections: 0,
        assignedTeachers: 0,
        unassignedSections: 0,
        totalCapacity: 0,
        totalStudents: 0,
        overallOccupancy: 0,
        schoolsCount: 0
      });
    }

    const filter = { entityId: req.entityId };

    const totalSections = await ClassSection.countDocuments({ ...filter, status: 'Active' });
    const distinctGrades = await ClassSection.distinct('className', { ...filter, status: 'Active' });
    const totalClasses = distinctGrades.length;

    const assignedSections = await ClassSection.countDocuments({
      ...filter,
      status: 'Active',
      classTeacher: { $ne: null }
    });

    const capacityAgg = await ClassSection.aggregate([
      { $match: { ...filter, status: 'Active' } },
      { $group: { _id: null, totalCapacity: { $sum: '$capacity' } } }
    ]);
    const totalCapacity = capacityAgg.length > 0 ? capacityAgg[0].totalCapacity : 0;

    const totalStudents = await Student.countDocuments({ ...filter, status: 'Active' });

    res.json({
      totalClasses,
      totalSections,
      assignedTeachers: assignedSections,
      unassignedSections: totalSections - assignedSections,
      totalCapacity,
      totalStudents,
      overallOccupancy: totalCapacity > 0 ? Math.round((totalStudents / totalCapacity) * 100) : 0,
      schoolsCount: registeredSchools.length
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// GET /api/classes/:id — Get single class section with student roster
router.get('/:id', async (req, res) => {
  try {
    const cls = await ClassSection.findOne({ _id: req.params.id, entityId: req.entityId });
    if (!cls) {
      return res.status(404).json({ message: 'Class section not found' });
    }

    // Get list of students enrolled in this class and section
    const students = await Student.find({
      entityId: req.entityId,
      $or: [
        { grade: cls.className, section: cls.section },
        { grade: new RegExp(`^${cls.className}$`, 'i'), section: new RegExp(`^${cls.section}$`, 'i') }
      ]
    }).sort({ rollNo: 1, name: 1 });

    const clsObj = cls.toObject();
    if (cls.classTeacher) {
      const teacher = await Staff.findById(cls.classTeacher).select('name');
      if (teacher) {
        clsObj.classTeacherName = teacher.name;
      } else {
        clsObj.classTeacher = null;
        clsObj.classTeacherName = 'Unassigned';
      }
    } else if (!cls.classTeacher || cls.classTeacherName === 'Senior Faculty' || cls.classTeacherName === 'Faculty Member') {
      clsObj.classTeacher = null;
      clsObj.classTeacherName = 'Unassigned';
    }
    clsObj.students = students;
    clsObj.enrolledStudents = students.length;

    res.json(clsObj);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// POST /api/classes — Create a new Class & Section (Admin Authority Only)
router.post('/', async (req, res) => {
  if (!checkAdminAuthority(req, res)) return;

  try {
    // 1. Strict Validation: Cannot create class without creating a school first
    const registeredSchools = await getRegisteredSchools(req.entityId);
    if (registeredSchools.length === 0) {
      return res.status(400).json({
        error: 'School Required',
        message: 'Cannot create a class without creating a school first. Please create or register a school campus before adding classes.',
        code: 'SCHOOL_REQUIRED'
      });
    }

    const {
      className,
      section,
      classTeacher,
      roomNumber,
      capacity,
      academicSession,
      subjects,
      schedule,
      status,
      schoolSlug,
    } = req.body;

    if (!className || !className.trim()) {
      return res.status(400).json({ message: 'Class name (e.g. "Class 10") is required.' });
    }

    if (!section || !section.trim()) {
      return res.status(400).json({ message: 'Section identifier (e.g. "A", "B") is required.' });
    }

    const cleanClassName = className.trim();
    const cleanSection = section.trim().toUpperCase();

    // 2. Resolve Target School Campus strictly for this entity
    const requestedSlug = (schoolSlug || req.headers['x-tenant-slug'] || req.headers['x-school-slug'] || '').trim();
    let targetSchool = null;

    if (requestedSlug && requestedSlug !== 'central' && requestedSlug !== 'test-school') {
      targetSchool = registeredSchools.find(s => s.slug === requestedSlug || s.entityId === requestedSlug);
      if (!targetSchool) {
        return res.status(400).json({
          error: 'Invalid School Campus',
          message: `School campus "${requestedSlug}" not found. Please select a valid registered school campus.`,
          code: 'INVALID_SCHOOL'
        });
      }
    } else {
      targetSchool = registeredSchools[0];
    }

    const targetEntityId = req.entityId;
    const targetSchoolSlug = targetSchool.slug;

    // 3. Check for duplicate Class + Section in this school campus
    const existing = await ClassSection.findOne({
      className: cleanClassName,
      section: cleanSection,
      entityId: targetEntityId
    });

    if (existing) {
      return res.status(400).json({
        message: `Class "${cleanClassName}" with Section "${cleanSection}" already exists in ${targetSchool.name}.`
      });
    }

    // Look up teacher name if ID was provided
    let teacherName = 'Unassigned';
    let teacherObjectId = null;

    if (classTeacher) {
      const teacherDoc = await Staff.findOne({
        _id: classTeacher,
        $or: [{ entityId: targetEntityId }, { schoolSlug: targetSchoolSlug }]
      });
      if (teacherDoc) {
        teacherName = teacherDoc.name;
        teacherObjectId = teacherDoc._id;
      }
    }

    // Parse subjects into array
    const parsedSubjects = Array.isArray(subjects)
      ? subjects
      : (typeof subjects === 'string' && subjects.trim())
        ? subjects.split(',').map(s => s.trim()).filter(Boolean)
        : ['Mathematics', 'Science', 'English', 'Social Studies'];

    const newClassSection = new ClassSection({
      className: cleanClassName,
      section: cleanSection,
      classTeacher: teacherObjectId,
      classTeacherName: teacherName,
      roomNumber: roomNumber ? roomNumber.trim() : 'TBD',
      capacity: capacity ? Number(capacity) : 40,
      academicSession: academicSession ? academicSession.trim() : '2026-2027',
      subjects: parsedSubjects,
      schedule: schedule ? schedule.trim() : 'Mon - Fri | 08:30 AM - 02:30 PM',
      status: status || 'Active',
      entityId: targetEntityId,
      schoolSlug: targetSchoolSlug,
    });

    await newClassSection.save();

    res.status(201).json({
      message: `Successfully created ${cleanClassName} - Section ${cleanSection} for ${targetSchool.name}`,
      classSection: newClassSection,
      schoolName: targetSchool.name,
      schoolSlug: targetSchoolSlug
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'This class and section combination already exists for this school.' });
    }
    res.status(400).json({ message: 'Validation error', error: error.message });
  }
});

// PUT /api/classes/:id — Update Class & Section (Admin Authority Only)
router.put('/:id', async (req, res) => {
  if (!checkAdminAuthority(req, res)) return;

  try {
    const {
      className,
      section,
      classTeacher,
      roomNumber,
      capacity,
      academicSession,
      subjects,
      schedule,
      status,
    } = req.body;

    const updateData = {};
    if (className) updateData.className = className.trim();
    if (section) updateData.section = section.trim().toUpperCase();
    if (roomNumber !== undefined) updateData.roomNumber = roomNumber.trim();
    if (capacity !== undefined) updateData.capacity = Number(capacity);
    if (academicSession !== undefined) updateData.academicSession = academicSession.trim();
    if (schedule !== undefined) updateData.schedule = schedule.trim();
    if (status) updateData.status = status;

    if (subjects !== undefined) {
      updateData.subjects = Array.isArray(subjects)
        ? subjects
        : (typeof subjects === 'string')
          ? subjects.split(',').map(s => s.trim()).filter(Boolean)
          : [];
    }

    if (classTeacher !== undefined) {
      if (classTeacher) {
        const teacherDoc = await Staff.findOne({ _id: classTeacher, entityId: req.entityId });
        if (teacherDoc) {
          updateData.classTeacher = teacherDoc._id;
          updateData.classTeacherName = teacherDoc.name;
        } else {
          updateData.classTeacher = null;
          updateData.classTeacherName = 'Unassigned';
        }
      } else {
        updateData.classTeacher = null;
        updateData.classTeacherName = 'Unassigned';
      }
    }

    const updated = await ClassSection.findOneAndUpdate(
      { _id: req.params.id, entityId: req.entityId },
      updateData,
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({ message: 'Class section not found' });
    }

    res.json({
      message: 'Class section updated successfully',
      classSection: updated,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Another class already exists with that name and section.' });
    }
    res.status(400).json({ message: 'Update error', error: error.message });
  }
});

// DELETE /api/classes — Delete ALL Class Sections (Admin Authority Only)
router.delete('/', async (req, res) => {
  if (!checkAdminAuthority(req, res)) return;

  try {
    const filter = { entityId: req.entityId };

    const result = await ClassSection.deleteMany(filter);

    res.json({
      success: true,
      message: `Successfully deleted all ${result.deletedCount} classes and sections`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// POST /api/classes/seed — Explicitly generate starter classes (Admin Authority Only)
router.post('/seed', async (req, res) => {
  if (!checkAdminAuthority(req, res)) return;

  try {
    const registeredSchools = await getRegisteredSchools(req.entityId);
    if (registeredSchools.length === 0) {
      return res.status(400).json({
        error: 'School Required',
        message: 'Cannot generate starter classes without a registered school campus. Please create a school campus first.',
        code: 'SCHOOL_REQUIRED'
      });
    }

    const requestedSlug = (req.body?.schoolSlug || req.headers['x-tenant-slug'] || req.headers['x-school-slug'] || '').trim();
    const targetSchool = registeredSchools.find(s => s.slug === requestedSlug || s.entityId === requestedSlug) || registeredSchools[0];

    await seedInitialClassesIfEmpty(req.entityId, targetSchool.slug);
    res.json({
      success: true,
      message: `Default starter classes created successfully for ${targetSchool.name}`
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// DELETE /api/classes/:id — Delete Class & Section (Admin Authority Only)
router.delete('/:id', async (req, res) => {
  if (!checkAdminAuthority(req, res)) return;

  try {
    const deleted = await ClassSection.findOneAndDelete({
      _id: req.params.id,
      entityId: req.entityId
    });

    if (!deleted) {
      return res.status(404).json({ message: 'Class section not found' });
    }

    res.json({
      success: true,
      message: `Successfully deleted ${deleted.className} - Section ${deleted.section}`,
      id: req.params.id
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
