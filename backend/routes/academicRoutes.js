const express = require('express');
const router = express.Router();
const Academic = require('../models/Academic');

// GET /api/academics — List all classes/subjects
router.get('/', async (req, res) => {
  try {
    const { search, page = 1, limit = 10, status } = req.query;
    const query = { entityId: req.entityId };

    if (search) {
      query.$or = [
        { subject: { $regex: search, $options: 'i' } },
        { gradeLevel: { $regex: search, $options: 'i' } },
        { teacherName: { $regex: search, $options: 'i' } },
      ];
    }

    if (status) query.status = status;

    const total = await Academic.countDocuments(query);
    const academics = await Academic.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({
      academics,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// GET /api/academics/stats — KPI stats
router.get('/stats', async (req, res) => {
  try {
    const totalClasses = await Academic.countDocuments({ entityId: req.entityId, entityId: req.entityId });
    const activeSubjects = await Academic.countDocuments({ status: 'Active', entityId: req.entityId });

    const avgClassSize = await Academic.aggregate([
      { $match: { entityId: req.entityId } },
      { $group: { _id: null, avg: { $avg: '$studentsEnrolled' } } },
    ]);

    const upcomingExams = 4; // Placeholder — would come from an Exams model

    res.json({
      totalClasses,
      activeSubjects,
      avgClassSize: avgClassSize.length > 0 ? Math.round(avgClassSize[0].avg) : 0,
      upcomingExams,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// GET /api/academics/:id
router.get('/:id', async (req, res) => {
  try {
    const academic = await Academic.findOne({ _id: req.params.id, entityId: req.entityId });
    if (!academic) {
      return res.status(404).json({ message: 'Class not found' });
    }
    res.json(academic);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// POST /api/academics
router.post('/', async (req, res) => {
  try {
    req.body.entityId = req.entityId;
    const academic = new Academic(req.body);
    await academic.save();
    res.status(201).json(academic);
  } catch (error) {
    res.status(400).json({ message: 'Validation error', error: error.message });
  }
});

// PUT /api/academics/:id
router.put('/:id', async (req, res) => {
  try {
    const academic = await Academic.findOneAndUpdate(
      { _id: req.params.id, entityId: req.entityId },
      req.body,
      { new: true, runValidators: true }
    );
    if (!academic) {
      return res.status(404).json({ message: 'Class not found' });
    }
    res.json(academic);
  } catch (error) {
    res.status(400).json({ message: 'Update error', error: error.message });
  }
});

// DELETE /api/academics/:id
router.delete('/:id', async (req, res) => {
  try {
    const academic = await Academic.findOneAndDelete({ _id: req.params.id, entityId: req.entityId });
    if (!academic) {
      return res.status(404).json({ message: 'Class not found' });
    }
    res.json({ message: 'Class deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
