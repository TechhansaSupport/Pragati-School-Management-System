const express = require('express');
const router = express.Router();
const Fee = require('../models/Fee');
const Student = require('../models/Student');
const Staff = require('../models/Staff');
const Transaction = require('../models/Transaction');

// GET /api/dashboard/overview — Main dashboard KPIs
router.get('/overview', async (req, res) => {
  try {
    const totalStudents = await Student.countDocuments();
    const totalStaff = await Staff.countDocuments();

    const attendanceResult = await Student.aggregate([
      { $group: { _id: null, avgAttendance: { $avg: '$attendance' } } },
    ]);
    const avgAttendance = attendanceResult.length > 0
      ? Math.round(attendanceResult[0].avgAttendance * 10) / 10
      : 0;

    // Seat utilization (assume capacity of 3600)
    const seatUtilization = totalStudents > 0
      ? Math.round((totalStudents / 3600) * 1000) / 10
      : 0;

    res.json({
      totalStudents,
      totalStaff,
      avgAttendance,
      seatUtilization,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// GET /api/dashboard/pending-fees — Pending fees table
router.get('/pending-fees', async (req, res) => {
  try {
    const { search, page = 1, limit = 10, status } = req.query;
    const query = {};

    if (search) {
      query.$or = [
        { studentName: { $regex: search, $options: 'i' } },
        { classSection: { $regex: search, $options: 'i' } },
      ];
    }

    if (status && status !== 'All') {
      query.status = status;
    }

    const total = await Fee.countDocuments(query);
    const fees = await Fee.find(query)
      .sort({ dueDate: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    // Fee stats
    const collected = await Fee.aggregate([
      { $match: { status: 'Collected' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    const dueThisMonth = await Fee.aggregate([
      { $match: { status: 'Due this month' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    const overdue = await Fee.aggregate([
      { $match: { status: 'Overdue' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);

    res.json({
      fees,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / limit),
      stats: {
        collected: collected.length > 0 ? collected[0].total : 0,
        dueThisMonth: dueThisMonth.length > 0 ? dueThisMonth[0].total : 0,
        overdue: overdue.length > 0 ? overdue[0].total : 0,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
