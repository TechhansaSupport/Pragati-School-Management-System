const express = require('express');
const router = express.Router();
const Staff = require('../models/Staff');

// GET /api/staff — List all staff (with optional search, pagination)
router.get('/', async (req, res) => {
  try {
    const { search, page = 1, limit = 10, role, status } = req.query;
    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { employeeId: { $regex: search, $options: 'i' } },
        { role: { $regex: search, $options: 'i' } },
        { department: { $regex: search, $options: 'i' } },
      ];
    }

    if (role) query.role = role;
    if (status) query.status = status;

    const total = await Staff.countDocuments(query);
    const staff = await Staff.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({
      staff,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// GET /api/staff/stats — KPI stats
router.get('/stats', async (req, res) => {
  try {
    const totalStaff = await Staff.countDocuments();
    const teachingStaff = await Staff.countDocuments({ role: 'Teacher' });
    const adminSupport = await Staff.countDocuments({ role: { $in: ['Administrator', 'Support Staff', 'Librarian', 'Accountant'] } });
    const onLeave = await Staff.countDocuments({ status: 'On Leave' });

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

// GET /api/staff/teachers — Teachers only (for Teachers page)
router.get('/teachers', async (req, res) => {
  try {
    const { search } = req.query;
    const query = { role: 'Teacher' };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { subjects: { $elemMatch: { $regex: search, $options: 'i' } } },
      ];
      query.role = 'Teacher';
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
    const member = await Staff.findById(req.params.id);
    if (!member) {
      return res.status(404).json({ message: 'Staff member not found' });
    }
    res.json(member);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// POST /api/staff — Create new staff member
router.post('/', async (req, res) => {
  try {
    const member = new Staff(req.body);
    await member.save();
    res.status(201).json(member);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Employee ID already exists' });
    }
    res.status(400).json({ message: 'Validation error', error: error.message });
  }
});

// PUT /api/staff/:id — Update staff member
router.put('/:id', async (req, res) => {
  try {
    const member = await Staff.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!member) {
      return res.status(404).json({ message: 'Staff member not found' });
    }
    res.json(member);
  } catch (error) {
    res.status(400).json({ message: 'Update error', error: error.message });
  }
});

// DELETE /api/staff/:id — Delete staff member
router.delete('/:id', async (req, res) => {
  try {
    const member = await Staff.findByIdAndDelete(req.params.id);
    if (!member) {
      return res.status(404).json({ message: 'Staff member not found' });
    }
    res.json({ message: 'Staff member deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
