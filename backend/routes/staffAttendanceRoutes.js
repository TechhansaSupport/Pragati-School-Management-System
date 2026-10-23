const express = require('express');
const router = express.Router();
const Staff = require('../models/Staff');
const StaffAttendance = require('../models/StaffAttendance');
const User = require('../models/User');

// Helper to get formatted current date string YYYY-MM-DD in IST/local
const getTodayDateString = (dateObj = new Date()) => {
  const d = new Date(dateObj);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Helper to check admin authority
const checkAdminAuthority = (req) => {
  const allowed = ['admin', 'superadmin', 'principal', 'frontdesk', 'school', 'school_admin'];
  const role = (req.user && req.user.role) ? req.user.role.toLowerCase() : '';
  if (!role && req.headers['x-school-slug'] && !req.headers.authorization) {
    return true;
  }
  return allowed.includes(role);
};

// Helper to resolve the Staff profile for the current user
const resolveStaffMember = async (req) => {
  // 1. If explicit staffId is passed by an Admin
  if (req.body?.staffId && checkAdminAuthority(req)) {
    const staff = await Staff.findOne({
      _id: req.body.staffId,
      entityId: req.entityId
    });
    if (staff) return staff;
  }

  // 2. Check if user has direct referenceId to Staff
  if (req.user?.referenceId) {
    const staff = await Staff.findOne({
      _id: req.user.referenceId,
      entityId: req.entityId
    });
    if (staff) return staff;
  }

  // 3. Match by portal username
  if (req.user?.username) {
    const staff = await Staff.findOne({
      entityId: req.entityId,
      portalUsername: req.user.username
    });
    if (staff) return staff;
  }

  // 4. Match by email
  if (req.user?.email) {
    const staff = await Staff.findOne({
      entityId: req.entityId,
      email: req.user.email
    });
    if (staff) return staff;
  }

  // 5. Match by full name
  if (req.user?.name) {
    const staff = await Staff.findOne({
      entityId: req.entityId,
      name: req.user.name
    });
    if (staff) return staff;
  }

  // 6. If role is teacher/staff and there is a matching staff record in this entity
  const anyTeacher = await Staff.findOne({
    entityId: req.entityId,
    role: { $in: ['Teacher', 'Principal', 'Administrator', 'Support Staff'] }
  });
  if (anyTeacher) return anyTeacher;

  // 7. Auto-provision staff record if user is an authentic staff/teacher account
  if (req.user) {
    try {
      const newStaff = await Staff.create({
        name: req.user.name || req.user.username || 'Faculty Member',
        employeeId: `EMP-${Math.floor(1000 + Math.random() * 9000)}`,
        role: req.user.role === 'teacher' ? 'Teacher' : 'Administrator',
        department: 'General',
        email: req.user.email || '',
        portalUsername: req.user.username || '',
        entityId: req.entityId,
        schoolSlug: req.schoolSlug || req.headers['x-school-slug'] || req.headers['x-tenant-slug'],
      });
      return newStaff;
    } catch (e) {
      // Ignore in race
    }
  }

  return null;
};

// Helper to calculate distance in meters between two GPS coordinates using the Haversine formula
const calculateDistanceInMeters = (lat1, lon1, lat2, lon2) => {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return null;
  const R = 6371e3; // Earth radius in meters
  const toRad = (angle) => (angle * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
};

// Helper to resolve school campus geofence configuration
const getSchoolGeofenceConfig = async (req) => {
  const entityId = req.entityId;
  const schoolSlug = req.schoolSlug || req.headers['x-school-slug'] || req.headers['x-tenant-slug'];

  let schoolUser = null;
  if (schoolSlug) {
    schoolUser = await User.findOne({
      role: 'school',
      entityId,
      $or: [{ slug: schoolSlug }, { schoolSlug: schoolSlug }, { uniqueId: schoolSlug }]
    });
  }
  if (!schoolUser) {
    schoolUser = await User.findOne({ role: 'school', entityId });
  }

  // If school has campus coords set
  if (schoolUser && schoolUser.campusLatitude != null && schoolUser.campusLongitude != null) {
    return {
      campusLatitude: schoolUser.campusLatitude,
      campusLongitude: schoolUser.campusLongitude,
      campusRadiusMeters: schoolUser.campusRadiusMeters || 300,
      geofenceEnabled: schoolUser.geofenceEnabled !== false,
      campusName: schoolUser.schoolName || schoolUser.name || 'Campus Premises',
      isConfigured: true
    };
  }

  // If not calibrated yet, return default coordinates but flagged as isConfigured: false
  return {
    campusLatitude: 28.6139,
    campusLongitude: 77.2090,
    campusRadiusMeters: 300,
    geofenceEnabled: schoolUser ? schoolUser.geofenceEnabled !== false : false,
    campusName: schoolUser?.schoolName || 'Campus Premises',
    isConfigured: false
  };
};

// GET /api/staff-attendance/geofence-config — Fetch Campus Geofence boundary
router.get('/geofence-config', async (req, res) => {
  try {
    const config = await getSchoolGeofenceConfig(req);
    res.json({
      success: true,
      config
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error loading geofence config', error: err.message });
  }
});

// PUT /api/staff-attendance/geofence-config — Update Campus Geofence boundary (Admin/Principal only)
router.put('/geofence-config', async (req, res) => {
  if (!checkAdminAuthority(req)) {
    return res.status(403).json({
      success: false,
      message: 'Access Denied: Only School Administrators and Principals can update Geofence configuration.'
    });
  }

  try {
    const { campusLatitude, campusLongitude, campusRadiusMeters, geofenceEnabled, campusName } = req.body;
    const entityId = req.entityId;
    const schoolSlug = req.schoolSlug || req.headers['x-school-slug'] || req.headers['x-tenant-slug'];

    let schoolUser = null;
    if (schoolSlug) {
      schoolUser = await User.findOne({
        role: 'school',
        entityId,
        $or: [{ slug: schoolSlug }, { schoolSlug: schoolSlug }, { uniqueId: schoolSlug }]
      });
    }
    if (!schoolUser) {
      schoolUser = await User.findOne({ role: 'school', entityId });
    }
    if (!schoolUser && req.user?._id) {
      schoolUser = await User.findOne({ _id: req.user._id });
    }

    if (!schoolUser) {
      return res.status(404).json({ success: false, message: 'School profile not found to save geofence configuration' });
    }

    if (campusLatitude !== undefined) schoolUser.campusLatitude = Number(campusLatitude);
    if (campusLongitude !== undefined) schoolUser.campusLongitude = Number(campusLongitude);
    if (campusRadiusMeters !== undefined) schoolUser.campusRadiusMeters = Number(campusRadiusMeters);
    if (geofenceEnabled !== undefined) schoolUser.geofenceEnabled = Boolean(geofenceEnabled);
    if (campusName && !schoolUser.schoolName) schoolUser.schoolName = campusName;

    await schoolUser.save();

    res.json({
      success: true,
      message: 'Campus Geofence configuration updated successfully!',
      config: {
        campusLatitude: schoolUser.campusLatitude,
        campusLongitude: schoolUser.campusLongitude,
        campusRadiusMeters: schoolUser.campusRadiusMeters,
        geofenceEnabled: schoolUser.geofenceEnabled,
        campusName: schoolUser.schoolName || schoolUser.name,
        isConfigured: true
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error updating geofence config', error: err.message });
  }
});

// POST /api/staff-attendance/punch — Mark Punch In or Punch Out
router.post('/punch', async (req, res) => {
  try {
    const staff = await resolveStaffMember(req);
    if (!staff) {
      return res.status(404).json({
        success: false,
        message: 'No associated Staff profile found for this user account. Please contact the administrator.'
      });
    }

    const todayDate = getTodayDateString();
    const now = new Date();
    const { note = '', location = 'Campus Web Portal', latitude, longitude, accuracy } = req.body;
    let requestedType = req.body.type ? req.body.type.toUpperCase() : null;

    // --- Geofence Verification ---
    const geofence = await getSchoolGeofenceConfig(req);
    let distanceMeters = null;
    let isWithinGeofence = true;

    if (geofence.geofenceEnabled && geofence.isConfigured) {
      if (latitude == null || longitude == null) {
        return res.status(400).json({
          success: false,
          code: 'GEO_REQUIRED',
          message: 'Campus Geofence required: GPS coordinates not received. Please allow location permissions in your browser.'
        });
      }

      distanceMeters = calculateDistanceInMeters(
        Number(latitude),
        Number(longitude),
        geofence.campusLatitude,
        geofence.campusLongitude
      );

      const allowedRadius = geofence.campusRadiusMeters || 300;
      isWithinGeofence = distanceMeters <= allowedRadius;

      if (!isWithinGeofence) {
        return res.status(403).json({
          success: false,
          code: 'OUTSIDE_CAMPUS',
          message: `Outside Campus Area: You are ${distanceMeters}m away from the campus center (Allowed radius: ${allowedRadius}m). Attendance can only be recorded on campus grounds.`,
          distanceMeters,
          allowedRadius
        });
      }
    } else if (latitude != null && longitude != null && geofence.campusLatitude != null) {
      distanceMeters = calculateDistanceInMeters(
        Number(latitude),
        Number(longitude),
        geofence.campusLatitude,
        geofence.campusLongitude
      );
      isWithinGeofence = geofence.campusRadiusMeters ? (distanceMeters <= geofence.campusRadiusMeters) : true;
    }

    // Find or initialize today's attendance record
    let attendance = await StaffAttendance.findOne({
      staffId: staff._id,
      date: todayDate,
      entityId: req.entityId
    });

    const isCurrentlyPunchedIn = Boolean(
      attendance && 
      attendance.punches && 
      attendance.punches.length > 0 && 
      attendance.punches[attendance.punches.length - 1].type === 'IN'
    );

    // Auto-detect punch type if not explicitly supplied
    if (!requestedType) {
      requestedType = isCurrentlyPunchedIn ? 'OUT' : 'IN';
    }

    if (requestedType === 'IN') {
      if (isCurrentlyPunchedIn) {
        return res.status(400).json({
          success: false,
          message: `Already punched in today at ${new Date(attendance.punches[attendance.punches.length - 1].time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}. Please punch out first.`,
          isPunchedIn: true,
          attendance
        });
      }

      // Check for late arrival (e.g. after 09:15 AM)
      const currentHours = now.getHours();
      const currentMins = now.getMinutes();
      const isLate = (currentHours > 9) || (currentHours === 9 && currentMins > 15);

      if (!attendance) {
        attendance = new StaffAttendance({
          staffId: staff._id,
          staffName: staff.name,
          employeeId: staff.employeeId,
          role: staff.role,
          department: staff.department,
          date: todayDate,
          punchIn: now,
          status: isLate ? 'Late' : 'Present',
          entityId: req.entityId,
          schoolSlug: staff.schoolSlug || req.schoolSlug,
          punches: []
        });
      }

      if (!attendance.punchIn) {
        attendance.punchIn = now;
        if (isLate && attendance.status !== 'Half Day') {
          attendance.status = 'Late';
        }
      }

      attendance.punches.push({
        type: 'IN',
        time: now,
        note: note.trim(),
        location: location.trim(),
        ip: req.ip || '',
        latitude: latitude != null ? Number(latitude) : null,
        longitude: longitude != null ? Number(longitude) : null,
        accuracy: accuracy != null ? Number(accuracy) : null,
        distanceMeters,
        isWithinGeofence
      });

      await attendance.save();

      return res.json({
        success: true,
        type: 'IN',
        message: `Successfully Punched IN at ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
        isPunchedIn: true,
        attendance,
        distanceMeters
      });

    } else if (requestedType === 'OUT') {
      if (!attendance || !isCurrentlyPunchedIn) {
        return res.status(400).json({
          success: false,
          message: 'Cannot Punch Out: You have not punched in for today yet.',
          isPunchedIn: false
        });
      }

      attendance.punchOut = now;
      attendance.punches.push({
        type: 'OUT',
        time: now,
        note: note.trim(),
        location: location.trim(),
        ip: req.ip || '',
        latitude: latitude != null ? Number(latitude) : null,
        longitude: longitude != null ? Number(longitude) : null,
        accuracy: accuracy != null ? Number(accuracy) : null,
        distanceMeters,
        isWithinGeofence
      });

      // Calculate total work duration in minutes across all IN-OUT pairs
      let totalMinutes = 0;
      let lastInTime = null;

      for (const p of attendance.punches) {
        if (p.type === 'IN') {
          lastInTime = new Date(p.time);
        } else if (p.type === 'OUT' && lastInTime) {
          const diffMs = new Date(p.time) - lastInTime;
          totalMinutes += Math.max(0, Math.round(diffMs / (1000 * 60)));
          lastInTime = null;
        }
      }

      attendance.workDurationMinutes = totalMinutes;

      // Determine working status based on hours
      if (totalMinutes < 240) { // < 4 hours
        attendance.status = 'Half Day';
      } else if (totalMinutes >= 540) { // >= 9 hours
        attendance.status = 'Overtime';
      } else if (attendance.status !== 'Late') {
        attendance.status = 'Present';
      }

      await attendance.save();

      const hours = Math.floor(totalMinutes / 60);
      const mins = totalMinutes % 60;
      const durationText = hours > 0 ? `${hours} hr ${mins} min` : `${mins} min`;

      return res.json({
        success: true,
        type: 'OUT',
        message: `Successfully Punched OUT at ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} (Total Worked: ${durationText})`,
        isPunchedIn: false,
        durationText,
        attendance,
        distanceMeters
      });
    } else {
      return res.status(400).json({ success: false, message: 'Invalid punch type. Must be IN or OUT.' });
    }

  } catch (error) {
    console.error('Punch action error:', error);
    res.status(500).json({ success: false, message: 'Server error processing punch', error: error.message });
  }
});

// GET /api/staff-attendance/my-status — Today's Live Punch Status for Current User
router.get('/my-status', async (req, res) => {
  try {
    const staff = await resolveStaffMember(req);
    const geofenceConfig = await getSchoolGeofenceConfig(req);

    if (!staff) {
      return res.json({
        hasStaffProfile: false,
        isPunchedIn: false,
        todayAttendance: null,
        message: 'No linked staff profile',
        geofenceConfig
      });
    }

    const todayDate = getTodayDateString();
    const attendance = await StaffAttendance.findOne({
      staffId: staff._id,
      date: todayDate,
      entityId: req.entityId
    });

    const isCurrentlyPunchedIn = Boolean(
      attendance &&
      attendance.punches &&
      attendance.punches.length > 0 &&
      attendance.punches[attendance.punches.length - 1].type === 'IN'
    );

    let activeDurationMinutes = attendance?.workDurationMinutes || 0;
    if (isCurrentlyPunchedIn && attendance?.punches?.length > 0) {
      const lastIn = new Date(attendance.punches[attendance.punches.length - 1].time);
      const liveDiff = Math.max(0, Math.round((new Date() - lastIn) / (1000 * 60)));
      activeDurationMinutes += liveDiff;
    }

    // Get last 7 days punch history for this user
    const recentHistory = await StaffAttendance.find({
      staffId: staff._id,
      entityId: req.entityId
    })
      .sort({ date: -1 })
      .limit(7);

    res.json({
      hasStaffProfile: true,
      staff: {
        _id: staff._id,
        name: staff.name,
        employeeId: staff.employeeId,
        role: staff.role,
        department: staff.department
      },
      isPunchedIn: isCurrentlyPunchedIn,
      firstPunchIn: attendance?.punchIn || null,
      lastPunchOut: attendance?.punchOut || null,
      totalDurationMinutes: activeDurationMinutes,
      status: attendance?.status || (isCurrentlyPunchedIn ? 'Present' : 'Not Punched In'),
      punches: attendance?.punches || [],
      todayAttendance: attendance,
      recentHistory,
      geofenceConfig
    });

  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error fetching punch status', error: error.message });
  }
});

// GET /api/staff-attendance/daily-sheet — Full Daily Staff Punch Sheet (Admin & Management View)
router.get('/daily-sheet', async (req, res) => {
  try {
    const { date, department, search, schoolSlug } = req.query;
    const targetDate = date || getTodayDateString();
    const isSuperAdmin = (req.user?.role || '').toLowerCase() === 'superadmin';
    const targetSlug = isSuperAdmin ? (schoolSlug || req.schoolSlug) : req.schoolSlug;

    // 1. Fetch all Staff members for this campus
    const staffQuery = { entityId: req.entityId, status: { $ne: 'Resigned' } };
    if (targetSlug && targetSlug !== 'all' && targetSlug !== 'central') {
      staffQuery.$or = [
        { schoolSlug: targetSlug },
        { schoolSlug: null },
        { schoolSlug: { $exists: false } }
      ];
    }
    if (department && department !== 'All') {
      staffQuery.department = department;
    }
    if (search) {
      staffQuery.$or = [
        { name: { $regex: search, $options: 'i' } },
        { employeeId: { $regex: search, $options: 'i' } },
        { department: { $regex: search, $options: 'i' } },
        { role: { $regex: search, $options: 'i' } }
      ];
    }

    const allStaff = await Staff.find(staffQuery).sort({ name: 1 });

    // 2. Fetch all attendance punch records for targetDate
    const attendanceRecords = await StaffAttendance.find({
      entityId: req.entityId,
      date: targetDate
    });

    const attendanceMap = new Map();
    attendanceRecords.forEach(att => {
      attendanceMap.set(String(att.staffId), att);
    });

    // 3. Combine staff directory with their punch attendance record
    let currentlyWorkingCount = 0;
    let completedShiftCount = 0;
    let lateCount = 0;
    let notMarkedCount = 0;
    let totalWorkMinutes = 0;

    const sheet = allStaff.map(staff => {
      const att = attendanceMap.get(String(staff._id));
      const hasRecord = Boolean(att);
      const punches = att?.punches || [];
      const isCurrentlyPunchedIn = Boolean(
        punches.length > 0 && punches[punches.length - 1].type === 'IN'
      );
      const isCompleted = Boolean(
        punches.length > 0 && punches[punches.length - 1].type === 'OUT'
      );

      if (isCurrentlyPunchedIn) currentlyWorkingCount++;
      if (isCompleted) completedShiftCount++;
      if (att?.status === 'Late') lateCount++;
      if (!hasRecord && staff.status === 'Active') notMarkedCount++;
      if (att?.workDurationMinutes) totalWorkMinutes += att.workDurationMinutes;

      let displayStatus = 'Not Punched In';
      if (staff.status === 'On Leave') {
        displayStatus = 'On Leave';
      } else if (isCurrentlyPunchedIn) {
        displayStatus = 'Working (Punched In)';
      } else if (isCompleted) {
        displayStatus = att.status || 'Shift Completed';
      } else if (hasRecord) {
        displayStatus = att.status || 'Present';
      }

      return {
        staffId: staff._id,
        name: staff.name,
        employeeId: staff.employeeId,
        role: staff.role,
        department: staff.department,
        email: staff.email,
        phone: staff.phone,
        status: staff.status,
        attendanceId: att?._id || null,
        punchIn: att?.punchIn || null,
        punchOut: att?.punchOut || null,
        isCurrentlyPunchedIn,
        workDurationMinutes: att?.workDurationMinutes || 0,
        attendanceStatus: displayStatus,
        punchesCount: punches.length,
        punches: punches,
        notes: att?.notes || ''
      };
    });

    const activeAttendees = sheet.filter(s => s.punchIn).length;
    const avgWorkMinutes = activeAttendees > 0 ? Math.round(totalWorkMinutes / activeAttendees) : 0;

    res.json({
      success: true,
      date: targetDate,
      totalStaff: allStaff.length,
      currentlyWorking: currentlyWorkingCount,
      completedShift: completedShiftCount,
      lateArrivals: lateCount,
      notMarked: notMarkedCount,
      avgWorkMinutes,
      sheet
    });

  } catch (error) {
    console.error('Daily sheet error:', error);
    res.status(500).json({ success: false, message: 'Server error loading daily sheet', error: error.message });
  }
});

// POST /api/staff-attendance/manual-entry — Admin Manual Punch Adjustment
router.post('/manual-entry', async (req, res) => {
  if (!checkAdminAuthority(req)) {
    return res.status(403).json({
      success: false,
      message: 'Access Denied: Only School Administrators can record manual punch entries.'
    });
  }

  try {
    const { staffId, date, punchInTime, punchOutTime, status = 'Present', notes = '' } = req.body;
    if (!staffId) {
      return res.status(400).json({ success: false, message: 'Staff member selection is required' });
    }

    const staff = await Staff.findOne({ _id: staffId, entityId: req.entityId });
    if (!staff) {
      return res.status(404).json({ success: false, message: 'Staff member not found' });
    }

    const targetDate = date || getTodayDateString();
    let attendance = await StaffAttendance.findOne({
      staffId: staff._id,
      date: targetDate,
      entityId: req.entityId
    });

    const inDate = punchInTime ? new Date(punchInTime) : new Date(`${targetDate}T09:00:00`);
    const outDate = punchOutTime ? new Date(punchOutTime) : null;

    let workMinutes = 0;
    if (inDate && outDate) {
      workMinutes = Math.max(0, Math.round((outDate - inDate) / (1000 * 60)));
    }

    if (!attendance) {
      attendance = new StaffAttendance({
        staffId: staff._id,
        staffName: staff.name,
        employeeId: staff.employeeId,
        role: staff.role,
        department: staff.department,
        date: targetDate,
        punchIn: inDate,
        punchOut: outDate,
        workDurationMinutes: workMinutes,
        status: status,
        notes: notes.trim(),
        entityId: req.entityId,
        schoolSlug: staff.schoolSlug || req.schoolSlug,
        punches: [
          { type: 'IN', time: inDate, note: notes || 'Admin Manual Entry', location: 'Administrative Override' },
          ...(outDate ? [{ type: 'OUT', time: outDate, note: notes || 'Admin Manual Entry', location: 'Administrative Override' }] : [])
        ]
      });
    } else {
      attendance.punchIn = inDate;
      if (outDate) attendance.punchOut = outDate;
      attendance.workDurationMinutes = workMinutes;
      attendance.status = status;
      if (notes) attendance.notes = notes.trim();
      attendance.punches = [
        { type: 'IN', time: inDate, note: notes || 'Admin Override', location: 'Administrative Override' },
        ...(outDate ? [{ type: 'OUT', time: outDate, note: notes || 'Admin Override', location: 'Administrative Override' }] : [])
      ];
    }

    await attendance.save();

    res.json({
      success: true,
      message: `Punch attendance successfully updated for ${staff.name}`,
      attendance
    });

  } catch (error) {
    console.error('Manual entry error:', error);
    res.status(500).json({ success: false, message: 'Server error saving manual entry', error: error.message });
  }
});

module.exports = router;
