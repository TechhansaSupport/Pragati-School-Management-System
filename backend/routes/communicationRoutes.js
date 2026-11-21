const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
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



// GET /api/communication/announcements
router.get('/announcements', async (req, res) => {
  try {
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
    const requesterRole = (
      req.user?.role || 
      req.headers['x-user-role'] || 
      req.query?.role || 
      ''
    ).toLowerCase().trim();
    const isAssistant = ['lab_assistant', 'assistant', 'support_staff', 'support', 'frontdesk'].includes(requesterRole) || requesterRole.includes('assistant');

    const staff = await Staff.find({ entityId: req.entityId, status: 'Active' })
      .select('name role department email phone')
      .limit(10);

    let studentContacts = [];
    // Assistants are strictly prohibited from messaging students directly
    if (!isAssistant) {
      const students = await Student.find({ entityId: req.entityId, status: 'Active' })
        .select('name grade section rollNumber parentContact')
        .limit(10);
      studentContacts = students.map(st => ({
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
      }));
    }

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
      ...studentContacts
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
    grievancesStore[entityId] = [];
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
    const { classSection, className, section, type, search } = req.query;
    const filter = { entityId: req.entityId };

    // Check if requester is a student to restrict data access strictly to their class
    let isStudent = false;
    let studentDoc = null;
    const authHeader = req.headers.authorization || req.headers['x-auth-token'];
    if (authHeader) {
      try {
        const rawToken = authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : authHeader;
        const decoded = jwt.verify(rawToken, process.env.JWT_SECRET || 'pragati_school_jwt_secret_key_2024');
        if ((decoded.role || '').toLowerCase() === 'student') {
          isStudent = true;
          if (decoded.referenceId) {
            studentDoc = await Student.findById(decoded.referenceId);
          }
          if (!studentDoc && decoded.username) {
            studentDoc = await Student.findOne({ rollNo: decoded.username });
          }
        }
      } catch (e) {}
    }

    if (isStudent && studentDoc) {
      const cleanGrade = (studentDoc.grade || '').replace(/Class\s*/i, '').replace(/th|st|nd|rd/i, '').trim();
      filter.className = { $regex: new RegExp(`(${studentDoc.grade}|Class\\s*${cleanGrade}|${cleanGrade}th)`, 'i') };
      if (studentDoc.section) {
        filter.section = new RegExp(`^${studentDoc.section.trim()}$`, 'i');
      }
    } else if (classSection && classSection !== 'All') {
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
    const requesterRole = (
      req.user?.role || 
      req.headers['x-user-role'] || 
      req.body?.userRole || 
      ''
    ).toLowerCase().trim();
    const isAssistant = ['lab_assistant', 'assistant', 'support_staff', 'support', 'frontdesk'].includes(requesterRole) || requesterRole.includes('assistant');
    if (isAssistant) {
      return res.status(403).json({ success: false, message: 'Access Denied: Assistants are not authorized to post class materials or assignments.' });
    }

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
