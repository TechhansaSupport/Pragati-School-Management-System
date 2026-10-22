const express = require('express');
const router = express.Router();
const Attendance = require('../models/Attendance');
const Student = require('../models/Student');
const ClassSection = require('../models/ClassSection');

// Helper to format date YYYY-MM-DD
const getTodayDate = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// GET /api/attendance — Retrieve attendance for class and date (or daily summary)
router.get('/', async (req, res) => {
  try {
    const date = req.query.date || getTodayDate();
    const { className, section } = req.query;

    if (className && section) {
      const cleanClass = className.trim();
      const cleanSection = section.trim().toUpperCase();

      // Find saved attendance sheet
      const savedAttendance = await Attendance.findOne({
        className: cleanClass,
        section: cleanSection,
        date,
        entityId: req.entityId,
      });

      // Find enrolled students in this class
      const cleanGrade = cleanClass.replace(/Class\s*/i, '').replace(/th|st|nd|rd/i, '').trim();
      const enrolledStudents = await Student.find({
        entityId: req.entityId,
        $or: [
          { grade: { $regex: new RegExp(`^(${cleanClass}|Class\\s*${cleanGrade}|${cleanGrade}th)$`, 'i') } },
          { grade: cleanClass }
        ],
        section: { $regex: new RegExp(`^${cleanSection}$`, 'i') }
      }).sort({ rollNo: 1, name: 1 });

      // If already marked, map students with saved status
      const savedMap = new Map();
      if (savedAttendance && savedAttendance.records) {
        for (const r of savedAttendance.records) {
          savedMap.set(r.studentId.toString(), r);
        }
      }

      const roster = enrolledStudents.map(s => {
        const existing = savedMap.get(s._id.toString());
        return {
          studentId: s._id,
          studentName: s.name,
          rollNo: s.rollNo || '',
          gender: s.gender || 'Other',
          photo: s.avatar || s.photo || '',
          status: existing ? existing.status : 'Present',
          remarks: existing ? existing.remarks : '',
        };
      });

      return res.json({
        success: true,
        isMarked: Boolean(savedAttendance),
        date,
        className: cleanClass,
        section: cleanSection,
        roster,
        summary: savedAttendance?.summary || {
          total: roster.length,
          present: roster.length,
          absent: 0,
          late: 0,
          excused: 0,
          attendanceRate: roster.length > 0 ? 100 : 0,
        },
        notes: savedAttendance?.notes || '',
        markedByName: savedAttendance?.markedByName || '',
        updatedAt: savedAttendance?.updatedAt || null,
      });
    }

    // If no specific class, return all marked sheets for the given date
    const sheets = await Attendance.find({
      date,
      entityId: req.entityId,
    }).sort({ className: 1, section: 1 });

    res.json({
      success: true,
      date,
      count: sheets.length,
      sheets,
    });
  } catch (error) {
    console.error('Error fetching attendance:', error);
    res.status(500).json({ message: 'Error retrieving attendance', error: error.message });
  }
});

// POST /api/attendance — Save / Update attendance sheet
router.post('/', async (req, res) => {
  try {
    const { className, section, date = getTodayDate(), records = [], notes = '', markedByName = '' } = req.body;

    if (!className || !section || !records) {
      return res.status(400).json({ message: 'className, section, and records are required' });
    }

    const cleanClass = className.trim();
    const cleanSection = section.trim().toUpperCase();

    // Calculate summary statistics
    const total = records.length;
    let present = 0;
    let absent = 0;
    let late = 0;
    let excused = 0;

    for (const rec of records) {
      if (rec.status === 'Absent') absent++;
      else if (rec.status === 'Late') late++;
      else if (rec.status === 'Excused') excused++;
      else present++;
    }

    const attendanceRate = total > 0 ? Math.round(((present + late) / total) * 100) : 100;

    const summary = {
      total,
      present,
      absent,
      late,
      excused,
      attendanceRate,
    };

    const attendanceDoc = await Attendance.findOneAndUpdate(
      {
        className: cleanClass,
        section: cleanSection,
        date,
        entityId: req.entityId,
      },
      {
        $set: {
          className: cleanClass,
          section: cleanSection,
          date,
          academicSession: req.body.academicSession || '2026-2027',
          records,
          summary,
          notes,
          markedByName: markedByName || req.user?.name || 'Class Teacher',
          markedBy: req.user?._id || null,
          entityId: req.entityId,
          schoolSlug: req.schoolSlug || '',
        }
      },
      { new: true, upsert: true, runValidators: true }
    );

    // Update cumulative attendance on Student documents asynchronously
    for (const rec of records) {
      if (rec.studentId) {
        try {
          const studentHistory = await Attendance.find({
            entityId: req.entityId,
            'records.studentId': rec.studentId,
          }).select('records');

          let sTotal = 0;
          let sPresent = 0;

          for (const sheet of studentHistory) {
            const entry = sheet.records.find(r => r.studentId.toString() === rec.studentId.toString());
            if (entry) {
              sTotal++;
              if (entry.status === 'Present' || entry.status === 'Late') {
                sPresent++;
              }
            }
          }

          const cumRate = sTotal > 0 ? Math.round((sPresent / sTotal) * 100) : 100;
          await Student.updateOne(
            { _id: rec.studentId, entityId: req.entityId },
            { $set: { attendance: cumRate } }
          );
        } catch (e) {
          // ignore single student background sync failure
        }
      }
    }

    res.json({
      success: true,
      message: `Attendance marked successfully for ${cleanClass} - ${cleanSection} (${present}/${total} present)`,
      attendance: attendanceDoc,
    });
  } catch (error) {
    console.error('Error recording attendance:', error);
    res.status(500).json({ message: 'Error recording attendance', error: error.message });
  }
});

// GET /api/attendance/stats — Daily school-wide attendance KPIs
router.get('/stats', async (req, res) => {
  try {
    const date = req.query.date || getTodayDate();

    // All active classes for this school
    const classes = await ClassSection.find({ entityId: req.entityId, status: 'Active' });
    const totalStudents = await Student.countDocuments({ entityId: req.entityId });

    // All marked attendance sheets today
    const sheets = await Attendance.find({ date, entityId: req.entityId });

    const markedClassSet = new Set();
    let overallPresent = 0;
    let overallAbsent = 0;
    let overallLate = 0;
    let overallExcused = 0;
    let totalMarkedStudents = 0;

    for (const sheet of sheets) {
      const key = `${sheet.className}-${sheet.section}`;
      markedClassSet.add(key);
      overallPresent += (sheet.summary?.present || 0);
      overallAbsent += (sheet.summary?.absent || 0);
      overallLate += (sheet.summary?.late || 0);
      overallExcused += (sheet.summary?.excused || 0);
      totalMarkedStudents += (sheet.summary?.total || 0);
    }

    const averageRate = totalMarkedStudents > 0 
      ? Math.round(((overallPresent + overallLate) / totalMarkedStudents) * 100)
      : (totalStudents > 0 ? 95 : 0);

    const classBreakdown = classes.map(c => {
      const match = sheets.find(s => s.className === c.className && s.section === c.section);
      return {
        id: c._id,
        className: c.className,
        section: c.section,
        classTeacher: c.classTeacherName || 'Unassigned',
        room: c.roomNumber,
        isMarked: Boolean(match),
        present: match ? match.summary.present : 0,
        absent: match ? match.summary.absent : 0,
        total: match ? match.summary.total : c.capacity || 0,
        rate: match ? match.summary.attendanceRate : null,
      };
    });

    res.json({
      success: true,
      date,
      totalStudents,
      totalClasses: classes.length,
      markedClasses: markedClassSet.size,
      pendingClasses: Math.max(0, classes.length - markedClassSet.size),
      overallPresent,
      overallAbsent,
      overallLate,
      overallExcused,
      averageRate,
      classBreakdown,
    });
  } catch (error) {
    console.error('Error fetching attendance stats:', error);
    res.status(500).json({ message: 'Error retrieving attendance stats', error: error.message });
  }
});

// GET /api/attendance/student/:studentId — Individual student attendance history
router.get('/student/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;

    const student = await Student.findOne({ _id: studentId, entityId: req.entityId });
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    const sheets = await Attendance.find({
      entityId: req.entityId,
      'records.studentId': studentId,
    }).sort({ date: -1 }).limit(30);

    const history = [];
    let presentCount = 0;
    let absentCount = 0;

    for (const sheet of sheets) {
      const entry = sheet.records.find(r => r.studentId.toString() === studentId);
      if (entry) {
        history.push({
          date: sheet.date,
          className: sheet.className,
          section: sheet.section,
          status: entry.status,
          remarks: entry.remarks,
        });
        if (entry.status === 'Present' || entry.status === 'Late') presentCount++;
        else if (entry.status === 'Absent') absentCount++;
      }
    }

    const calculatedRate = history.length > 0 ? Math.round((presentCount / history.length) * 100) : (student.attendance || 100);

    res.json({
      success: true,
      student: {
        id: student._id,
        name: student.name,
        rollNo: student.rollNo,
        grade: student.grade,
        section: student.section,
        attendanceRate: calculatedRate,
      },
      stats: {
        totalDays: history.length,
        presentDays: presentCount,
        absentDays: absentCount,
      },
      history,
    });
  } catch (error) {
    console.error('Error fetching student attendance history:', error);
    res.status(500).json({ message: 'Error retrieving student history', error: error.message });
  }
});

module.exports = router;
