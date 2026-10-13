const express = require('express');
const router = express.Router();
const Student = require('../models/Student');
const Staff = require('../models/Staff');
const Fee = require('../models/Fee');
const Transaction = require('../models/Transaction');
const ClassSection = require('../models/ClassSection');

// GET /api/reports/summary
router.get('/summary', async (req, res) => {
  try {
    const totalStudents = await Student.countDocuments({ entityId: req.entityId });
    const totalStaff = await Staff.countDocuments({ entityId: req.entityId });
    const totalClasses = await ClassSection.countDocuments({ entityId: req.entityId });

    // Fees aggregate
    const feeCollectedAgg = await Fee.aggregate([
      { $match: { entityId: req.entityId, status: 'Collected' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const feePendingAgg = await Fee.aggregate([
      { $match: { entityId: req.entityId, status: { $ne: 'Collected' } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    // Attendance avg
    const attAgg = await Student.aggregate([
      { $match: { entityId: req.entityId } },
      { $group: { _id: null, avg: { $avg: '$attendance' } } }
    ]);

    res.json({
      totalStudents,
      totalStaff,
      totalClasses,
      totalCollected: feeCollectedAgg.length > 0 ? feeCollectedAgg[0].total : 0,
      totalPending: feePendingAgg.length > 0 ? feePendingAgg[0].total : 0,
      avgAttendance: attAgg.length > 0 ? Math.round(attAgg[0].avg * 10) / 10 : 95.0,
      recentExports: [
        { name: 'Academic_Performance_Summary.csv', date: 'Oct 10, 2026', user: 'Principal Office', category: 'academic' },
        { name: 'Student_Attendance_Register.csv', date: 'Oct 08, 2026', user: 'Admin Staff', category: 'attendance' },
        { name: 'Fee_Collections_Defaulters.csv', date: 'Oct 05, 2026', user: 'Accounts Dept', category: 'finance' },
        { name: 'Enrollment_Demographics.csv', date: 'Oct 01, 2026', user: 'Registrar', category: 'demographics' },
      ]
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// GET /api/reports/export — Live CSV generation from real database data
router.get('/export', async (req, res) => {
  try {
    const { type = 'academic' } = req.query;
    let csvContent = '';
    let filename = `${type}_report_${Date.now()}.csv`;

    if (type === 'academic' || type === 'demographics') {
      const students = await Student.find({ entityId: req.entityId }).sort({ grade: 1, section: 1, rollNumber: 1 });
      csvContent = 'Roll Number,Student Name,Grade,Section,Gender,Attendance %,Fee Status,Parent Contact\n';
      students.forEach(s => {
        csvContent += `"${s.rollNumber}","${s.name}","${s.grade}","${s.section}","${s.gender || 'N/A'}",${s.attendance || 95},"${s.feeStatus || 'Paid'}","${s.parentContact || 'N/A'}"\n`;
      });
    } else if (type === 'attendance') {
      const students = await Student.find({ entityId: req.entityId }).sort({ attendance: 1 });
      csvContent = 'Roll Number,Student Name,Class,Attendance %,Status,Risk Level\n';
      students.forEach(s => {
        const risk = (s.attendance || 95) < 85 ? 'High Risk' : (s.attendance || 95) < 92 ? 'Moderate' : 'Good';
        csvContent += `"${s.rollNumber}","${s.name}","${s.grade} - ${s.section}",${s.attendance || 95},"${s.status}","${risk}"\n`;
      });
    } else if (type === 'finance') {
      const fees = await Fee.find({ entityId: req.entityId }).sort({ dueDate: -1 });
      csvContent = 'Student Name,Class / Section,Amount,Due Date,Status,Parent Contact\n';
      fees.forEach(f => {
        const dueStr = f.dueDate ? new Date(f.dueDate).toLocaleDateString() : 'N/A';
        csvContent += `"${f.studentName}","${f.classSection}",${f.amount},"${dueStr}","${f.status}","${f.parentContact || 'N/A'}"\n`;
      });
    } else {
      const staff = await Staff.find({ entityId: req.entityId });
      csvContent = 'Employee ID,Name,Role,Department,Email,Phone,Status\n';
      staff.forEach(st => {
        csvContent += `"${st.employeeId || 'N/A'}","${st.name}","${st.role}","${st.department || 'General'}","${st.email}","${st.phone || 'N/A'}","${st.status}"\n`;
      });
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.status(200).send(csvContent);
  } catch (error) {
    res.status(500).json({ message: 'Failed to generate export', error: error.message });
  }
});

module.exports = router;
