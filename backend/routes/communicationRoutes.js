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

module.exports = router;
