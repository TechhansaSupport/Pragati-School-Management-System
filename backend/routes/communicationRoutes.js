const express = require('express');
const router = express.Router();
const Announcement = require('../models/Announcement');
const Staff = require('../models/Staff');
const Student = require('../models/Student');
const ClassMaterial = require('../models/ClassMaterial');
const Assignment = require('../models/Assignment');
const ClassSection = require('../models/ClassSection');

// Authority verification middleware: Superadmin, Admin, and Principal
const checkLeaderAuthority = (req, res, next) => {
  const role = (
    req.user?.role || 
    req.headers['x-user-role'] || 
    req.body?.userRole || 
    ''
  ).toLowerCase().trim();

  const allowedRoles = ['superadmin', 'super_admin', 'admin', 'branch_admin', 'school_admin', 'school', 'principal'];
  if (!allowedRoles.includes(role)) {
    return res.status(403).json({
      success: false,
      error: `Access Denied: Only Superadmin, Admin, and Principal have authority to perform this action. Requester role is '${role || 'unauthorized'}'.`,
      code: 'LEADERSHIP_AUTHORITY_REQUIRED',
      message: 'Access Denied: Only Superadmin, Admin, and Principal have authority to perform this action.'
    });
  }
  next();
};

// Seed helper for class-wise notes and assignments
const seedInitialClassMaterialsIfEmpty = async (entityId) => {
  if (!entityId) return;
  const count = await ClassMaterial.countDocuments({ entityId });
  if (count === 0) {
    const starterMaterials = [
      {
        title: 'Chapter 4: Quadratic Equations - Formula Cheat Sheet & Core Derivations',
        type: 'Note',
        classSection: 'Class 10 - A',
        className: 'Class 10',
        section: 'A',
        subject: 'Mathematics',
        chapter: 'Chapter 4: Quadratic Equations',
        content: `Comprehensive Lecture Notes for Class 10:\n\n1. Standard Form:\n   ax² + bx + c = 0 (where a ≠ 0, and a, b, c are real numbers)\n\n2. Nature of Roots (Discriminant D = b² - 4ac):\n   • If D > 0: Two distinct and real roots exist.\n   • If D = 0: Two equal real roots (x = -b / 2a).\n   • If D < 0: No real roots (roots are imaginary/complex).\n\n3. Methods to Solve:\n   • Factorisation (Splitting the middle term)\n   • Quadratic Formula: x = [-b ± √(b² - 4ac)] / (2a)\n\n4. Important Word Problems:\n   Review exercises 4.2 & 4.3 covering speed-distance problems, age problems, and consecutive integers. Complete the self-assessment before next lecture.`,
        attachments: [
          { title: 'Quadratic_Equations_Formulas.pdf', url: 'https://example.com/notes/math10-quadratic.pdf', fileType: 'PDF', fileSize: '2.1 MB' }
        ],
        teacherName: 'Mr. Ramesh Singh',
        entityId
      },
      {
        title: 'Weekly Homework Assignment: Calculus & Quadratic Equations Problem Set',
        type: 'Assignment',
        classSection: 'Class 10 - A',
        className: 'Class 10',
        section: 'A',
        subject: 'Mathematics',
        chapter: 'Chapter 4: Quadratic Equations',
        content: `Please solve questions 1 through 15 from Chapter 4 Exercise 4.3 in your assignment notebook. Show complete step-by-step working for full marks.\n\nKey Focus Areas:\n1. Solve by completing the square method (Q1-Q5)\n2. Solve by quadratic formula (Q6-Q10)\n3. Applications in speed and time word problems (Q11-Q15)\n\nSubmit your scanned solutions before the due date.`,
        dueDate: new Date(Date.now() + 4 * 86400000),
        maxMarks: 50,
        attachments: [
          { title: 'Class10_Math_Assignment_4.pdf', url: 'https://example.com/assignments/math10-asg4.pdf', fileType: 'PDF', fileSize: '1.4 MB' }
        ],
        teacherName: 'Mr. Ramesh Singh',
        entityId
      },
      {
        title: 'Unit 3: Newton\'s Laws of Motion & Momentum Conservation Notes',
        type: 'Note',
        classSection: 'Class 9 - B',
        className: 'Class 9',
        section: 'B',
        subject: 'Physics & Chemistry',
        chapter: 'Unit 3: Force & Laws of Motion',
        content: `Core Physics Concepts Summary:\n\n• First Law (Law of Inertia): An object remains at rest or in uniform motion unless acted upon by an external net force.\n• Second Law (Rate of Change of Momentum): F = dp/dt = ma (Force = mass × acceleration).\n• Third Law (Action-Reaction): For every action, there is an equal and opposite reaction acting on different bodies.\n• Conservation of Momentum: Total momentum before collision = Total momentum after collision (m₁u₁ + m₂u₂ = m₁v₁ + m₂v₂).`,
        attachments: [
          { title: 'Laws_of_Motion_Summary.pdf', url: 'https://example.com/notes/physics9-laws.pdf', fileType: 'PDF', fileSize: '1.8 MB' }
        ],
        teacherName: 'Dr. S. Mukherjee',
        entityId
      },
      {
        title: 'Algebra Homework Set #3: Polynomial Factoring & Identities',
        type: 'Assignment',
        classSection: 'Class 9 - B',
        className: 'Class 9',
        section: 'B',
        subject: 'Mathematics',
        chapter: 'Chapter 2: Polynomials',
        content: `Complete factoring exercises 2.4 and 2.5 on algebraic identities:\n1. (x + y + z)² = x² + y² + z² + 2xy + 2yz + 2zx\n2. x³ + y³ + z³ - 3xyz = (x + y + z)(x² + y² + z² - xy - yz - zx)\n\nSubmit handwritten notebook scans or submit physical copy in Monday morning period.`,
        dueDate: new Date(Date.now() + 5 * 86400000),
        maxMarks: 40,
        attachments: [
          { title: 'Algebra_Problem_Set_3.pdf', url: 'https://example.com/assignments/algebra9-asg3.pdf', fileType: 'PDF', fileSize: '980 KB' }
        ],
        teacherName: 'Mr. Ramesh Singh',
        entityId
      },
      {
        title: 'Rational Numbers & Number Line Visualisation Guide',
        type: 'Note',
        classSection: 'Class 8 - A',
        className: 'Class 8',
        section: 'A',
        subject: 'Mathematics',
        chapter: 'Chapter 1: Rational Numbers',
        content: `Key properties of Rational Numbers:\n1. Closure Property under addition, subtraction, and multiplication.\n2. Commutative and Associative Properties.\n3. Additive Identity (0) and Multiplicative Identity (1).\n4. Finding rational numbers between two given rational numbers using mean method.`,
        attachments: [
          { title: 'Rational_Numbers_Guide.pdf', url: 'https://example.com/notes/math8-rational.pdf', fileType: 'PDF', fileSize: '1.2 MB' }
        ],
        teacherName: 'Mrs. Sharma',
        entityId
      }
    ];

    try {
      await ClassMaterial.insertMany(starterMaterials);
    } catch (e) {
      console.warn('ClassMaterial seed error:', e);
    }
  }
};

// Seed helper if tenant has 0 announcements
const seedInitialAnnouncementsIfEmpty = async (entityId) => {
  if (!entityId) return;
  const count = await Announcement.countDocuments({ entityId });
  if (count === 0) {
    const sampleAnnouncements = [
      {
        title: 'Diwali Holidays & Festive Break Schedule',
        content: 'School will remain closed from Oct 20th to Oct 25th on account of Diwali. Classes will resume with regular timings on Oct 26th.',
        targetAudience: 'All Students & Parents',
        priority: 'Important',
        author: 'Principal Office',
        date: new Date('2026-10-09'),
        entityId
      },
      {
        title: 'Emergency Alert: Heavy Rain Advisory',
        content: 'Due to severe weather warnings issued by regional authorities, afternoon sports and transport routes will run 30 minutes earlier today.',
        targetAudience: 'All',
        priority: 'Urgent',
        author: 'Administration',
        date: new Date('2026-10-05'),
        entityId
      },
      {
        title: 'Annual Science & Tech Exhibition 2026',
        content: 'Project submissions for Grades 8 through 12 are now open. Final prototypes must be submitted to the Science Department coordinator by Nov 2nd.',
        targetAudience: 'Students',
        priority: 'Normal',
        author: 'Science Department',
        date: new Date('2026-10-02'),
        entityId
      },
      {
        title: 'Term 2 Fee Payment Deadline Approaching',
        content: 'Reminder that the Term 2 tuition fee payment portal is open. Families are requested to clear dues by Oct 15th to avoid late processing.',
        targetAudience: 'All Students & Parents',
        priority: 'Important',
        author: 'Finance & Accounts',
        date: new Date('2026-10-01'),
        entityId
      }
    ];
    await Announcement.insertMany(sampleAnnouncements).catch(() => {});
  }
};

// GET /api/communication/announcements
router.get('/announcements', async (req, res) => {
  try {
    await seedInitialAnnouncementsIfEmpty(req.entityId);
    const announcements = await Announcement.find({ entityId: req.entityId }).sort({ date: -1 });
    res.json(announcements);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// POST /api/communication/announcements (Superadmin, Admin & Principal Authority Only)
router.post('/announcements', checkLeaderAuthority, async (req, res) => {
  try {
    const { title, content, targetAudience = 'All Students & Parents', priority = 'Normal', author } = req.body;
    if (!title || !content) {
      return res.status(400).json({ message: 'Title and content are required' });
    }

    const announcement = new Announcement({
      title: title.trim(),
      content: content.trim(),
      targetAudience,
      priority,
      author: author || req.user?.name || 'School Administration',
      entityId: req.entityId,
    });

    await announcement.save();
    res.status(201).json(announcement);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create announcement', error: error.message });
  }
});

// DELETE /api/communication/announcements/:id (Superadmin, Admin & Principal Authority Only)
router.delete('/announcements/:id', checkLeaderAuthority, async (req, res) => {
  try {
    const deleted = await Announcement.findOneAndDelete({ _id: req.params.id, entityId: req.entityId });
    if (!deleted) {
      return res.status(404).json({ message: 'Announcement not found' });
    }
    res.json({ success: true, message: 'Notice deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete announcement', error: error.message });
  }
});

// GET /api/communication/contacts — Real DB people (staff & students) for messaging
router.get('/contacts', async (req, res) => {
  try {
    const staff = await Staff.find({ entityId: req.entityId, status: 'Active' })
      .select('name role department email phone')
      .limit(10);
    const students = await Student.find({ entityId: req.entityId, status: 'Active' })
      .select('name grade section rollNumber parentContact')
      .limit(10);

    const contacts = [
      ...staff.map(s => ({
        id: s._id.toString(),
        name: s.name,
        role: s.role || 'Teacher',
        avatar: s.name.charAt(0).toUpperCase(),
        department: s.department,
        email: s.email,
        phone: s.phone,
        preview: `Inquiries for ${s.department || s.role}`,
        time: 'Active today',
        unread: 0,
      })),
      ...students.map(st => ({
        id: st._id.toString(),
        name: st.name,
        role: `Student (${st.grade} - ${st.section})`,
        avatar: st.name.charAt(0).toUpperCase(),
        department: 'Academic',
        email: `${st.rollNumber}@school.edu`,
        phone: st.parentContact,
        preview: `Enrolled in ${st.grade} - Section ${st.section}`,
        time: 'Enrolled',
        unread: 0,
      }))
    ];

    res.json(contacts);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// In-memory / persistent emergency alert store per entityId
let activeEmergencyAlerts = {};

// GET /api/communication/emergency — Active emergency broadcast
router.get('/emergency', (req, res) => {
  const alert = activeEmergencyAlerts[req.entityId] || null;
  res.json({ active: !!alert, alert });
});

// POST /api/communication/emergency — Publish urgent school-wide emergency alert (Superadmin, Admin & Principal Authority Only)
router.post('/emergency', checkLeaderAuthority, async (req, res) => {
  try {
    const { title, message, severity = 'Urgent', actionRequired } = req.body;
    if (!title || !message) {
      return res.status(400).json({ message: 'Title and message are required' });
    }

    const alert = {
      id: `EMG-${Date.now()}`,
      title: title.trim(),
      message: message.trim(),
      severity,
      actionRequired: actionRequired || 'Follow school protocol and stay updated via official communication.',
      publishedBy: req.user?.name || 'School Administration',
      publishedAt: new Date().toISOString(),
      entityId: req.entityId,
    };

    activeEmergencyAlerts[req.entityId] = alert;

    // Also persist as an urgent announcement
    try {
      await Announcement.create({
        title: `🚨 EMERGENCY: ${title}`,
        content: `${message}\nAction: ${alert.actionRequired}`,
        targetAudience: 'All',
        priority: 'Urgent',
        author: alert.publishedBy,
        entityId: req.entityId,
      });
    } catch (e) {
      // ignore
    }

    res.json({ success: true, message: 'Emergency alert published across all campus portals.', alert });
  } catch (error) {
    res.status(500).json({ message: 'Failed to publish emergency alert', error: error.message });
  }
});

// DELETE /api/communication/emergency — Revoke / deactivate emergency broadcast (Superadmin, Admin & Principal Authority Only)
router.delete('/emergency', checkLeaderAuthority, (req, res) => {
  delete activeEmergencyAlerts[req.entityId];
  res.json({ success: true, message: 'Emergency alert deactivated.' });
});

// In-memory store for school events per entity
let schoolEventsStore = {};

// GET /api/communication/events — School Events Calendar
router.get('/events', (req, res) => {
  const entityId = req.entityId || 'default';
  if (!schoolEventsStore[entityId]) {
    schoolEventsStore[entityId] = [
      { id: 'EVT-1', title: 'Annual Science & Robotics Fair', date: '2026-11-05', time: '09:00 AM - 03:00 PM', location: 'Main Auditorium & Labs', category: 'Academic', audience: 'All Grades', status: 'Upcoming' },
      { id: 'EVT-2', title: 'Term 1 Parent-Teacher Meeting (PTM)', date: '2026-10-28', time: '10:00 AM - 02:00 PM', location: 'Classrooms & Quadrangle', category: 'Meeting', audience: 'All Parents', status: 'Scheduled' },
      { id: 'EVT-3', title: 'Inter-House Sports Meet & Athletics', date: '2026-11-18', time: '08:30 AM - 04:30 PM', location: 'School Sports Ground', category: 'Sports', audience: 'Grades 6 - 12', status: 'Upcoming' },
      { id: 'EVT-4', title: 'Mid-Term Board Mock Examinations', date: '2026-12-01', time: '08:30 AM - 11:30 AM', location: 'Examination Hall', category: 'Exam', audience: 'Class 10 & 12', status: 'Draft' },
    ];
  }
  res.json(schoolEventsStore[entityId]);
});

// POST /api/communication/events — Create Event (Superadmin, Admin & Principal Authority Only)
router.post('/events', checkLeaderAuthority, (req, res) => {
  const entityId = req.entityId || 'default';
  const { title, date, time, location, category, audience } = req.body;
  if (!title || !date) return res.status(400).json({ message: 'Title and date required' });
  
  if (!schoolEventsStore[entityId]) schoolEventsStore[entityId] = [];
  const newEvent = {
    id: `EVT-${Date.now()}`,
    title: title.trim(),
    date,
    time: time || '09:00 AM - 01:00 PM',
    location: location || 'Campus',
    category: category || 'General',
    audience: audience || 'All Students & Parents',
    status: 'Upcoming'
  };
  schoolEventsStore[entityId].unshift(newEvent);
  res.status(201).json(newEvent);
});

// DELETE /api/communication/events/:id — Delete Event (Superadmin, Admin & Principal Authority Only)
router.delete('/events/:id', checkLeaderAuthority, (req, res) => {
  const entityId = req.entityId || 'default';
  if (schoolEventsStore[entityId]) {
    schoolEventsStore[entityId] = schoolEventsStore[entityId].filter(e => e.id !== req.params.id);
  }
  res.json({ success: true, message: 'Event removed' });
});

// In-memory store for Grievances / Support tickets per entity
let grievancesStore = {};

// GET /api/communication/grievances — Grievance Management (Superadmin, Admin & Principal Authority Only)
router.get('/grievances', checkLeaderAuthority, (req, res) => {
  const entityId = req.entityId || 'default';
  if (!grievancesStore[entityId]) {
    grievancesStore[entityId] = [
      { id: 'GRV-101', title: 'Route 4 Bus Delayed Repeatedly', category: 'Transport', raisedBy: 'Ramesh Patel (Parent)', student: 'Aarav Patel (Class 10 - A)', priority: 'High', status: 'In Progress', date: '2026-10-14', remarks: 'Transport in-charge reviewing stop schedule with driver.' },
      { id: 'GRV-102', title: 'Lab Equipment Maintenance Request', category: 'Facilities', raisedBy: 'Dr. Vikram Malhotra (Faculty)', student: 'Physics Lab', priority: 'Medium', status: 'Open', date: '2026-10-12', remarks: 'Requisition sent to admin store.' },
      { id: 'GRV-103', title: 'Duplicate Fee Receipt Query', category: 'Fees', raisedBy: 'Kiran Patel (Parent)', student: 'Diya Patel (Class 10 - A)', priority: 'Low', status: 'Resolved', date: '2026-10-08', remarks: 'Corrected receipt re-issued via portal.' },
    ];
  }
  res.json(grievancesStore[entityId]);
});

// POST /api/communication/grievances — Submit Grievance (All campus members can submit concern tickets)
router.post('/grievances', (req, res) => {
  const entityId = req.entityId || 'default';
  const { title, category, raisedBy, student, priority, description } = req.body;
  if (!title) return res.status(400).json({ message: 'Title is required' });

  if (!grievancesStore[entityId]) grievancesStore[entityId] = [];
  const ticket = {
    id: `GRV-${100 + grievancesStore[entityId].length + 1}`,
    title: title.trim(),
    category: category || 'General',
    raisedBy: raisedBy || req.user?.name || 'Concerned Member',
    student: student || 'General',
    priority: priority || 'Medium',
    status: 'Open',
    date: new Date().toISOString().split('T')[0],
    remarks: description || 'Ticket logged for administrative investigation.'
  };
  grievancesStore[entityId].unshift(ticket);
  res.status(201).json(ticket);
});

// PUT /api/communication/grievances/:id — Manage grievance / update status (Superadmin, Admin & Principal Authority Only)
router.put('/grievances/:id', checkLeaderAuthority, (req, res) => {
  const entityId = req.entityId || 'default';
  const { status, remarks, priority } = req.body;
  const list = grievancesStore[entityId] || [];
  const item = list.find(g => g.id === req.params.id);
  if (!item) return res.status(404).json({ message: 'Ticket not found' });
  if (status) item.status = status;
  if (remarks !== undefined) item.remarks = remarks;
  if (priority) item.priority = priority;
  item.updatedAt = new Date().toISOString();
  item.managedBy = req.user?.name || 'School Leadership';
  res.json(item);
});

// DELETE /api/communication/grievances/:id — Delete/dismiss grievance (Superadmin, Admin & Principal Authority Only)
router.delete('/grievances/:id', checkLeaderAuthority, (req, res) => {
  const entityId = req.entityId || 'default';
  if (grievancesStore[entityId]) {
    grievancesStore[entityId] = grievancesStore[entityId].filter(g => g.id !== req.params.id);
  }
  res.json({ success: true, message: 'Ticket dismissed' });
});

// =========================================================================
// CLASS NOTES & ASSIGNMENTS (Class-wise System)
// =========================================================================

// GET /api/communication/class-materials — Fetch notes & assignments class-wise
router.get('/class-materials', async (req, res) => {
  try {
    await seedInitialClassMaterialsIfEmpty(req.entityId);

    const { classSection, className, section, type, search } = req.query;
    const filter = { entityId: req.entityId };

    if (classSection && classSection !== 'All') {
      filter.classSection = new RegExp(`^${classSection.trim()}$`, 'i');
    } else {
      if (className && className !== 'All') {
        const cleanGrade = className.replace(/Class\s*/i, '').replace(/th|st|nd|rd/i, '').trim();
        filter.className = { $regex: new RegExp(`(${className}|Class\\s*${cleanGrade}|${cleanGrade}th)`, 'i') };
      }
      if (section && section !== 'All') {
        filter.section = new RegExp(`^${section.trim()}$`, 'i');
      }
    }

    if (type && type !== 'All') {
      if (type === 'Assignments') {
        filter.type = 'Assignment';
      } else if (type === 'Notes') {
        filter.type = { $in: ['Note', 'Study Material', 'Circular'] };
      } else {
        filter.type = type;
      }
    }

    if (search && search.trim()) {
      const q = search.trim();
      filter.$or = [
        { title: { $regex: q, $options: 'i' } },
        { subject: { $regex: q, $options: 'i' } },
        { chapter: { $regex: q, $options: 'i' } },
        { content: { $regex: q, $options: 'i' } },
        { teacherName: { $regex: q, $options: 'i' } }
      ];
    }

    const materials = await ClassMaterial.find(filter).sort({ createdAt: -1 });

    res.json({
      success: true,
      count: materials.length,
      materials
    });
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving class materials', error: error.message });
  }
});

// POST /api/communication/class-materials — Create & publish note or assignment class-wise
router.post('/class-materials', async (req, res) => {
  try {
    const { 
      title, 
      type = 'Note', 
      classSection, 
      className: rawClassName, 
      section: rawSection, 
      subject, 
      chapter = '', 
      content, 
      dueDate, 
      maxMarks = 50, 
      attachments = [], 
      teacherName 
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ message: 'Title is required' });
    }
    if (!content || !content.trim()) {
      return res.status(400).json({ message: 'Content / instructions are required' });
    }
    if (!classSection && (!rawClassName || !rawSection)) {
      return res.status(400).json({ message: 'Target class and section are required' });
    }

    // Determine clean class and section
    let resolvedClassName = rawClassName;
    let resolvedSection = rawSection;
    let resolvedClassSection = classSection;

    if (classSection && classSection.includes(' - ')) {
      const parts = classSection.split(' - ');
      resolvedClassName = parts[0].trim();
      resolvedSection = parts[1].trim();
    } else if (rawClassName && rawSection) {
      resolvedClassSection = `${rawClassName.trim()} - ${rawSection.trim()}`;
    }

    const cleanGrade = (resolvedClassName || 'Class 10').replace(/Class\s*/i, '').replace(/th|st|nd|rd/i, '').trim();

    // Query enrolled students for this class section
    const enrolledStudents = await Student.find({
      entityId: req.entityId,
      grade: { $regex: new RegExp(`(${resolvedClassName}|Class\\s*${cleanGrade}|${cleanGrade}th)`, 'i') },
      section: { $regex: new RegExp(`^${resolvedSection}$`, 'i') }
    });

    const initialSubmissions = enrolledStudents.map(st => ({
      studentId: st._id,
      studentName: st.name,
      rollNo: st.rollNumber || st.rollNo || '',
      status: 'Pending',
      marksObtained: null,
      feedback: '',
      submittedAt: null
    }));

    const authorTeacherName = teacherName || req.user?.name || 'Class Faculty';

    // Create ClassMaterial document
    const newMaterial = new ClassMaterial({
      title: title.trim(),
      type: type === 'Assignment' ? 'Assignment' : 'Note',
      classSection: resolvedClassSection,
      className: resolvedClassName,
      section: resolvedSection,
      subject: subject ? subject.trim() : 'General',
      chapter: chapter ? chapter.trim() : '',
      content: content.trim(),
      attachments: Array.isArray(attachments) ? attachments : [],
      dueDate: dueDate ? new Date(dueDate) : null,
      maxMarks: Number(maxMarks) || 50,
      teacherName: authorTeacherName,
      entityId: req.entityId,
      schoolSlug: req.schoolSlug || '',
      submissions: type === 'Assignment' ? initialSubmissions : []
    });

    await newMaterial.save();

    // If it's an assignment, also sync with Assignment model for teacher review
    if (type === 'Assignment') {
      try {
        const newAssignment = new Assignment({
          title: title.trim(),
          classSection: resolvedClassSection,
          className: resolvedClassName,
          section: resolvedSection,
          subject: subject ? subject.trim() : 'General',
          dueDate: dueDate ? new Date(dueDate) : new Date(Date.now() + 7 * 86400000),
          maxMarks: Number(maxMarks) || 50,
          instructions: content.trim(),
          teacherName: authorTeacherName,
          entityId: req.entityId,
          schoolSlug: req.schoolSlug || '',
          submissions: enrolledStudents.map(st => ({
            studentId: st._id,
            studentName: st.name,
            rollNo: st.rollNumber || st.rollNo || '',
            status: 'Submitted'
          }))
        });
        await newAssignment.save();
      } catch (err) {
        console.warn('Sync to Assignment collection warning:', err.message);
      }
    }

    res.status(201).json({
      success: true,
      message: `${type === 'Assignment' ? 'Assignment' : 'Class Note'} sent successfully to ${resolvedClassSection}!`,
      material: newMaterial
    });
  } catch (error) {
    res.status(500).json({ message: 'Error publishing class material', error: error.message });
  }
});

// DELETE /api/communication/class-materials/:id — Remove material
router.delete('/class-materials/:id', async (req, res) => {
  try {
    const item = await ClassMaterial.findOneAndDelete({ _id: req.params.id, entityId: req.entityId });
    if (!item) {
      return res.status(404).json({ message: 'Class material not found' });
    }
    // Also remove from Assignment if matching title and classSection
    if (item.type === 'Assignment') {
      await Assignment.deleteMany({ title: item.title, classSection: item.classSection, entityId: req.entityId }).catch(() => {});
    }
    res.json({ success: true, message: 'Class material removed successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting class material', error: error.message });
  }
});

// POST /api/communication/class-materials/:id/submit — Submit assignment by student
router.post('/class-materials/:id/submit', async (req, res) => {
  try {
    const { studentName, rollNo, submissionText, attachmentUrl } = req.body;
    const material = await ClassMaterial.findOne({ _id: req.params.id, entityId: req.entityId });
    if (!material) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    const studentId = req.user?._id || null;
    const sName = studentName || req.user?.name || 'Student';

    // Find if submission exists
    const existingIndex = material.submissions.findIndex(s => 
      (studentId && s.studentId && s.studentId.toString() === studentId.toString()) || 
      (s.studentName?.toLowerCase() === sName.toLowerCase())
    );

    if (existingIndex !== -1) {
      material.submissions[existingIndex].submissionText = submissionText || '';
      material.submissions[existingIndex].attachmentUrl = attachmentUrl || '';
      material.submissions[existingIndex].status = 'Submitted';
      material.submissions[existingIndex].submittedAt = new Date();
    } else {
      material.submissions.push({
        studentId,
        studentName: sName,
        rollNo: rollNo || '',
        submissionText: submissionText || '',
        attachmentUrl: attachmentUrl || '',
        status: 'Submitted',
        submittedAt: new Date()
      });
    }

    await material.save();
    res.json({ success: true, message: 'Assignment submitted successfully!' });
  } catch (error) {
    res.status(500).json({ message: 'Error submitting assignment', error: error.message });
  }
});

module.exports = router;
