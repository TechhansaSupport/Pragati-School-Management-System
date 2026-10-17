const express = require('express');
const router = express.Router();
const Announcement = require('../models/Announcement');
const Staff = require('../models/Staff');
const Student = require('../models/Student');

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

// POST /api/communication/announcements
router.post('/announcements', async (req, res) => {
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
      author: author || 'School Administration',
      entityId: req.entityId,
    });

    await announcement.save();
    res.status(201).json(announcement);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create announcement', error: error.message });
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

// POST /api/communication/emergency — Publish urgent school-wide emergency alert (Admin/Principal Authority)
router.post('/emergency', async (req, res) => {
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

// DELETE /api/communication/emergency — Revoke / deactivate emergency broadcast
router.delete('/emergency', (req, res) => {
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

// POST /api/communication/events — Create Event
router.post('/events', (req, res) => {
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

// In-memory store for Grievances / Support tickets per entity
let grievancesStore = {};

// GET /api/communication/grievances — Grievance Management
router.get('/grievances', (req, res) => {
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

// POST /api/communication/grievances — Submit Grievance
router.post('/grievances', (req, res) => {
  const entityId = req.entityId || 'default';
  const { title, category, raisedBy, student, priority, description } = req.body;
  if (!title) return res.status(400).json({ message: 'Title is required' });

  if (!grievancesStore[entityId]) grievancesStore[entityId] = [];
  const ticket = {
    id: `GRV-${100 + grievancesStore[entityId].length + 1}`,
    title: title.trim(),
    category: category || 'General',
    raisedBy: raisedBy || req.user?.name || 'Concerned Parent',
    student: student || 'General',
    priority: priority || 'Medium',
    status: 'Open',
    date: new Date().toISOString().split('T')[0],
    remarks: description || 'Ticket logged for administrative investigation.'
  };
  grievancesStore[entityId].unshift(ticket);
  res.status(201).json(ticket);
});

// PUT /api/communication/grievances/:id — Update ticket status
router.put('/grievances/:id', (req, res) => {
  const entityId = req.entityId || 'default';
  const { status, remarks } = req.body;
  const list = grievancesStore[entityId] || [];
  const item = list.find(g => g.id === req.params.id);
  if (!item) return res.status(404).json({ message: 'Ticket not found' });
  if (status) item.status = status;
  if (remarks) item.remarks = remarks;
  res.json(item);
});

module.exports = router;
