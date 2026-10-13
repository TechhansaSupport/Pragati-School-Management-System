const express = require('express');
const router = express.Router();
const Student = require('../models/Student');

// Seed helper if school has 0 students
const seedInitialStudentsIfEmpty = async (entityId) => {
  if (!entityId) return;
  const count = await Student.countDocuments({ entityId });
  if (count === 0) {
    const sampleStudents = [
      { name: 'Aarav Sharma', rollNo: 'STU-1001', grade: 'Class 10', section: 'A', gender: 'Male', parentName: 'Rajesh Sharma', parentContact: '+91 98201 12345', email: 'aarav.sharma@pragati.edu', attendance: 96, status: 'Active', entityId },
      { name: 'Diya Patel', rollNo: 'STU-1002', grade: 'Class 10', section: 'A', gender: 'Female', parentName: 'Kiran Patel', parentContact: '+91 98201 12346', email: 'diya.patel@pragati.edu', attendance: 92, status: 'Active', entityId },
      { name: 'Vihaan Verma', rollNo: 'STU-1003', grade: 'Class 10', section: 'B', gender: 'Male', parentName: 'Alok Verma', parentContact: '+91 98201 12347', email: 'vihaan.verma@pragati.edu', attendance: 88, status: 'Active', entityId },
      { name: 'Ananya Iyer', rollNo: 'STU-1004', grade: 'Class 9', section: 'A', gender: 'Female', parentName: 'Subramanian Iyer', parentContact: '+91 98201 12348', email: 'ananya.iyer@pragati.edu', attendance: 98, status: 'Active', entityId },
      { name: 'Kabir Mehta', rollNo: 'STU-1005', grade: 'Class 9', section: 'B', gender: 'Male', parentName: 'Sunil Mehta', parentContact: '+91 98201 12349', email: 'kabir.mehta@pragati.edu', attendance: 91, status: 'Active', entityId },
      { name: 'Riya Sen', rollNo: 'STU-1006', grade: 'Class 11', section: 'Science', gender: 'Female', parentName: 'Debashis Sen', parentContact: '+91 98201 12350', email: 'riya.sen@pragati.edu', attendance: 94, status: 'Active', entityId },
      { name: 'Rohan Gupta', rollNo: 'STU-1007', grade: 'Class 12', section: 'Science', gender: 'Male', parentName: 'Mahesh Gupta', parentContact: '+91 98201 12351', email: 'rohan.gupta@pragati.edu', attendance: 89, status: 'Active', entityId },
      { name: 'Sneha Reddy', rollNo: 'STU-1008', grade: 'Class 10', section: 'A', gender: 'Female', parentName: 'Venkatesh Reddy', parentContact: '+91 98201 12352', email: 'sneha.reddy@pragati.edu', attendance: 95, status: 'Active', entityId },
    ];
    await Student.insertMany(sampleStudents).catch(() => {});
  }
};

// GET /api/students — List all students with class & section filters, search, pagination
router.get('/', async (req, res) => {
  try {
    await seedInitialStudentsIfEmpty(req.entityId);

    const { search, page = 1, limit = 50, status, grade, section } = req.query;
    const query = { entityId: req.entityId };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { rollNo: { $regex: search, $options: 'i' } },
        { grade: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { parentName: { $regex: search, $options: 'i' } },
      ];
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
    const students = await Student.find(query)
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    res.json({
      students,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / Number(limit)),
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// GET /api/students/stats — KPI stats
router.get('/stats', async (req, res) => {
  try {
    await seedInitialStudentsIfEmpty(req.entityId);

    const totalStudents = await Student.countDocuments({ entityId: req.entityId });
    const activeStudents = await Student.countDocuments({ status: 'Active', entityId: req.entityId });
    const inactiveStudents = await Student.countDocuments({ status: { $ne: 'Active' }, entityId: req.entityId });

    // Calculate average attendance
    const attendanceResult = await Student.aggregate([
      { $match: { entityId: req.entityId } },
      { $group: { _id: null, avgAttendance: { $avg: '$attendance' } } },
    ]);
    const avgAttendance = attendanceResult.length > 0
      ? Math.round(attendanceResult[0].avgAttendance * 10) / 10
      : 94.5;

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

// GET /api/students/:id — Get single student
router.get('/:id', async (req, res) => {
  try {
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
      const count = await Student.countDocuments({ entityId: req.entityId });
      finalRollNo = `STU-${1000 + count + 1}`;
    }

    const newStudent = new Student({
      ...req.body,
      name: name.trim(),
      rollNo: finalRollNo,
      grade: grade.trim(),
      section: (section || 'A').trim().toUpperCase(),
      entityId: req.entityId,
    });

    await newStudent.save();
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
  try {
    const student = await Student.findOneAndUpdate(
      { _id: req.params.id, entityId: req.entityId },
      req.body,
      { new: true, runValidators: true }
    );
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
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

// DELETE /api/students/:id — Delete student
router.delete('/:id', async (req, res) => {
  try {
    const student = await Student.findOneAndDelete({ _id: req.params.id, entityId: req.entityId });
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    res.json({ success: true, message: `Student "${student.name}" deleted successfully` });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
