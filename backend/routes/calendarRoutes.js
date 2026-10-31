const express = require('express');
const router = express.Router();
const https = require('https');
const CalendarEvent = require('../models/CalendarEvent');

const GOOGLE_CALENDAR_ICAL_URL = 'https://calendar.google.com/calendar/ical/en.indian%23holiday%40group.v.calendar.google.com/public/basic.ics';

// Fetch Google Calendar official public holidays & observances feed
const fetchGoogleCalendarHolidays = () => {
  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      resolve([]);
    }, 8000);

    https.get(GOOGLE_CALENDAR_ICAL_URL, (res) => {
      let raw = '';
      res.on('data', chunk => raw += chunk);
      res.on('end', () => {
        clearTimeout(timeout);
        const events = [];
        const vEvents = raw.split('BEGIN:VEVENT');
        for (let i = 1; i < vEvents.length; i++) {
          const block = vEvents[i].split('END:VEVENT')[0];
          const summaryMatch = block.match(/SUMMARY:(.*)/);
          let summary = summaryMatch ? summaryMatch[1].trim() : '';
          summary = summary.replace(/\\,/g, ',');

          const dtstartMatch = block.match(/DTSTART[^:]*:(.*)/);
          const dtstart = dtstartMatch ? dtstartMatch[1].trim() : '';

          const dtendMatch = block.match(/DTEND[^:]*:(.*)/);
          const dtend = dtendMatch ? dtendMatch[1].trim() : '';

          const descMatch = block.match(/DESCRIPTION:(.*)/);
          let desc = descMatch ? descMatch[1].trim() : '';
          desc = desc.replace(/\\,/g, ',').replace(/\\n/g, ' ');

          if (dtstart && dtstart.length >= 8) {
            const y = dtstart.slice(0, 4);
            const m = dtstart.slice(4, 6);
            const d = dtstart.slice(6, 8);
            const startDate = `${y}-${m}-${d}`;

            let endDate = startDate;
            if (dtend && dtend.length >= 8) {
              const ey = Number(dtend.slice(0, 4));
              const em = Number(dtend.slice(4, 6));
              const ed = Number(dtend.slice(6, 8));
              const endDateObj = new Date(Date.UTC(ey, em - 1, ed));
              endDateObj.setUTCDate(endDateObj.getUTCDate() - 1);
              const sy = endDateObj.getUTCFullYear();
              const sm = String(endDateObj.getUTCMonth() + 1).padStart(2, '0');
              const sd = String(endDateObj.getUTCDate()).padStart(2, '0');
              endDate = `${sy}-${sm}-${sd}`;
              if (endDate < startDate) endDate = startDate;
            }

            const isPublicHoliday = desc.toLowerCase().includes('public holiday');
            events.push({
              summary,
              startDate,
              endDate,
              description: isPublicHoliday
                ? `${summary} - Official Gazetted Public Holiday (Google Calendar / Govt. of India). Campus remains closed.`
                : `${summary} - Official Indian Observance / Festive Occasion (Google Calendar).`,
              isPublicHoliday
            });
          }
        }
        resolve(events);
      });
    }).on('error', (err) => {
      clearTimeout(timeout);
      console.warn('Google Calendar iCal network fetch error:', err.message);
      resolve([]);
    });
  });
};

// Helper to resolve effective school slug
const resolveSchoolSlug = (req) => {
  return (
    req.query.schoolSlug ||
    req.body?.schoolSlug ||
    req.headers['x-school-slug'] ||
    req.headers['x-tenant-slug'] ||
    req.schoolSlug ||
    ''
  ).trim();
};

// Helper to get local YYYY-MM-DD today string
const getSystemTodayStr = () => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

// Check if user has administrative authority (Super Admin or Branch Admin)
const checkCalendarAdminAuthority = (req, res, next) => {
  const role = (
    req.user?.role ||
    req.headers['x-user-role'] ||
    req.body?.userRole ||
    ''
  ).toLowerCase().trim();

  const isSuperAdmin = role === 'superadmin';
  const isAdmin = role === 'admin';

  if (!isSuperAdmin && !isAdmin) {
    return res.status(403).json({
      success: false,
      message: 'Access denied: Only Super Admin and School Admin have the authority to add, update, or remove calendar events and holidays. Other roles have view-only access.',
      requiredRoles: ['superadmin', 'admin'],
      currentRole: role || 'unspecified'
    });
  }

  next();
};

// Standard initial institutional calendar events seed (aligned with Google Calendar)
const getInitialCalendarSeed = (entityId, schoolSlug, createdBy) => {
  return [
    {
      title: 'Karaka Chaturthi (Karwa Chauth)',
      description: 'Official festive observance as per Google Calendar.',
      category: 'Holiday',
      type: 'holiday',
      startDate: '2026-10-29',
      endDate: '2026-10-29',
      startTime: 'All Day',
      endTime: 'All Day',
      allDay: true,
      location: 'All Campuses',
      audience: 'All',
      isHoliday: true,
      color: '#EA580C',
      entityId,
      schoolSlug: schoolSlug || '',
      createdBy: createdBy || 'Google Calendar Sync',
      createdRole: 'admin'
    },
    {
      title: 'Diwali Festive Vacation & Deepavali Holidays',
      description: 'Campus closed for Diwali and Bhai Dooj celebrations as per Google Calendar. Regular classes resume after festive break.',
      category: 'Holiday',
      type: 'holiday',
      startDate: '2026-11-08',
      endDate: '2026-11-11',
      startTime: 'All Day',
      endTime: 'All Day',
      allDay: true,
      location: 'All Campuses & Branches',
      audience: 'All',
      isHoliday: true,
      color: '#DC2626',
      entityId,
      schoolSlug: schoolSlug || '',
      createdBy: createdBy || 'Super Admin',
      createdRole: 'superadmin'
    },
    {
      title: 'Annual Science & Robotics Innovation Fair 2026',
      description: 'Students from Grades 6 to 12 present STEM, AI, and Robotics projects. Parents and visitors cordially invited.',
      category: 'Event',
      type: 'event',
      startDate: '2026-11-07',
      endDate: '2026-11-07',
      startTime: '09:00 AM',
      endTime: '03:30 PM',
      allDay: false,
      location: 'Central Auditorium & Senior Physics Labs',
      audience: 'All',
      isHoliday: false,
      color: '#4F46E5',
      entityId,
      schoolSlug: schoolSlug || '',
      createdBy: createdBy || 'School Admin',
      createdRole: 'admin'
    },
    {
      title: 'Term 1 Parent-Teacher Meeting (PTM)',
      description: 'Comprehensive review of student mid-term progress, attendance records, and assessment report cards.',
      category: 'Meeting',
      type: 'meeting',
      startDate: '2026-11-14',
      endDate: '2026-11-14',
      startTime: '09:30 AM',
      endTime: '01:30 PM',
      allDay: false,
      location: 'Respective Classrooms',
      audience: 'Parents',
      isHoliday: false,
      color: '#2563EB',
      entityId,
      schoolSlug: schoolSlug || '',
      createdBy: createdBy || 'School Admin',
      createdRole: 'admin'
    },
    {
      title: 'Guru Nanak Jayanti Holiday',
      description: 'Institutional gazetted holiday on the auspicious occasion of Guru Nanak Jayanti. School operations will remain suspended.',
      category: 'Holiday',
      type: 'holiday',
      startDate: '2026-11-24',
      endDate: '2026-11-24',
      startTime: 'All Day',
      endTime: 'All Day',
      allDay: true,
      location: 'School-wide',
      audience: 'All',
      isHoliday: true,
      color: '#DC2626',
      entityId,
      schoolSlug: schoolSlug || '',
      createdBy: createdBy || 'Super Admin',
      createdRole: 'superadmin'
    },
    {
      title: 'Pre-Board Mock Examinations (Classes 10 & 12)',
      description: 'Mandatory pre-board theory examinations conducted according to CBSE pattern. Standard uniform and admit cards required.',
      category: 'Examination',
      type: 'exam',
      startDate: '2026-12-01',
      endDate: '2026-12-12',
      startTime: '08:30 AM',
      endTime: '11:45 AM',
      allDay: false,
      location: 'Senior Examination Wing & Hall B',
      audience: 'Grades 9-12',
      isHoliday: false,
      color: '#D97706',
      entityId,
      schoolSlug: schoolSlug || '',
      createdBy: createdBy || 'School Admin',
      createdRole: 'admin'
    },
    {
      title: 'Annual Inter-House Sports & Athletic Meet',
      description: 'Track and field events, relay races, inter-house football and basketball championships.',
      category: 'Sports',
      type: 'event',
      startDate: '2026-12-18',
      endDate: '2026-12-19',
      startTime: '08:00 AM',
      endTime: '04:00 PM',
      allDay: false,
      location: 'Main Sports Complex & Ground',
      audience: 'All',
      isHoliday: false,
      color: '#16A34A',
      entityId,
      schoolSlug: schoolSlug || '',
      createdBy: createdBy || 'School Admin',
      createdRole: 'admin'
    },
    {
      title: 'Christmas & Winter Break Holidays',
      description: 'Winter vacation for all students and academic staff. School administration and admission office remain open on select days.',
      category: 'Holiday',
      type: 'holiday',
      startDate: '2026-12-24',
      endDate: '2027-01-02',
      startTime: 'All Day',
      endTime: 'All Day',
      allDay: true,
      location: 'All Campuses',
      audience: 'All',
      isHoliday: true,
      color: '#DC2626',
      entityId,
      schoolSlug: schoolSlug || '',
      createdBy: createdBy || 'Super Admin',
      createdRole: 'superadmin'
    },
    {
      title: 'Republic Day Celebration & Flag Hoisting',
      description: 'Ceremonial flag hoisting followed by patriotic cultural performances and NCC parade by students.',
      category: 'Cultural',
      type: 'event',
      startDate: '2027-01-26',
      endDate: '2027-01-26',
      startTime: '08:30 AM',
      endTime: '11:30 AM',
      allDay: false,
      location: 'School Front Lawn & Assembly Ground',
      audience: 'All',
      isHoliday: false,
      color: '#0D9488',
      entityId,
      schoolSlug: schoolSlug || '',
      createdBy: createdBy || 'Super Admin',
      createdRole: 'superadmin'
    }
  ];
};

// GET /api/calendar/events — Retrieve all institutional calendar events & holidays (Viewable by ALL roles)
router.get('/events', async (req, res) => {
  try {
    const schoolSlug = resolveSchoolSlug(req);
    const { category, isHoliday, month, year } = req.query;

    const query = { entityId: req.entityId };
    if (schoolSlug && schoolSlug !== 'central' && schoolSlug !== 'all') {
      query.$or = [{ schoolSlug }, { schoolSlug: { $exists: false } }, { schoolSlug: '' }];
    }

    if (category && category !== 'All') {
      query.category = category;
    }

    if (isHoliday !== undefined) {
      query.isHoliday = isHoliday === 'true';
    }

    let events = await CalendarEvent.find(query).sort({ startDate: 1 });

    // Seed defaults if empty
    if (!events || events.length === 0) {
      const seedData = getInitialCalendarSeed(
        req.entityId,
        schoolSlug,
        req.user?.name || req.user?.username || 'Super Admin'
      );
      await CalendarEvent.insertMany(seedData);
      events = await CalendarEvent.find(query).sort({ startDate: 1 });
    }

    // Role detection for client authority badge
    const role = (
      req.user?.role ||
      req.headers['x-user-role'] ||
      ''
    ).toLowerCase();
    const canManage = ['superadmin', 'admin'].includes(role);

    res.json({
      success: true,
      count: events.length,
      canManage,
      userRole: role || 'guest',
      events
    });
  } catch (error) {
    console.error('Error fetching calendar events:', error);
    res.status(500).json({ success: false, message: 'Error retrieving calendar events', error: error.message });
  }
});

// POST /api/calendar/events — Create a new holiday or event (RESTRICTED TO SUPER ADMIN & ADMIN)
router.post('/events', checkCalendarAdminAuthority, async (req, res) => {
  try {
    const {
      title,
      description = '',
      category = 'Event',
      type = 'event',
      startDate,
      endDate,
      startTime = '09:00 AM',
      endTime = '03:00 PM',
      allDay = true,
      location = 'Main Campus',
      audience = 'All',
      color,
      isHoliday
    } = req.body;

    const schoolSlug = resolveSchoolSlug(req);

    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Event or Holiday title is required' });
    }

    if (!startDate) {
      return res.status(400).json({ success: false, message: 'Start date is required (YYYY-MM-DD)' });
    }

    const todayStr = getSystemTodayStr();
    if (startDate.trim() < todayStr) {
      return res.status(400).json({
        success: false,
        message: `Editing or declaring events on passed dates is disabled (Selected date ${startDate.trim()} is prior to today ${todayStr}).`
      });
    }

    const calculatedIsHoliday = Boolean(
      isHoliday !== undefined
        ? isHoliday
        : (category === 'Holiday' || type === 'holiday')
    );

    // Default category colors if none provided
    let calculatedColor = color;
    if (!calculatedColor) {
      if (calculatedIsHoliday) calculatedColor = '#DC2626'; // Crimson Red
      else if (category === 'Examination') calculatedColor = '#D97706'; // Amber
      else if (category === 'Sports') calculatedColor = '#16A34A'; // Green
      else if (category === 'Meeting') calculatedColor = '#2563EB'; // Blue
      else if (category === 'Cultural') calculatedColor = '#0D9488'; // Teal
      else calculatedColor = '#4F46E5'; // Indigo
    }

    const creatorName = req.user?.name || req.user?.username || req.user?.portalUsername || 'Administrator';
    const creatorRole = (req.user?.role || req.headers['x-user-role'] || 'admin').toLowerCase();

    const newEvent = new CalendarEvent({
      title: title.trim(),
      description: description.trim(),
      category: calculatedIsHoliday ? 'Holiday' : category,
      type: calculatedIsHoliday ? 'holiday' : type,
      startDate: startDate.trim(),
      endDate: (endDate || startDate).trim(),
      startTime: allDay ? 'All Day' : startTime,
      endTime: allDay ? 'All Day' : endTime,
      allDay: Boolean(allDay),
      location: location.trim(),
      audience,
      isHoliday: calculatedIsHoliday,
      color: calculatedColor,
      entityId: req.entityId,
      schoolSlug: schoolSlug || '',
      createdBy: creatorName,
      createdRole: creatorRole
    });

    const savedEvent = await newEvent.save();

    res.status(201).json({
      success: true,
      message: `${calculatedIsHoliday ? 'Holiday' : 'Event'} "${savedEvent.title}" added to the school calendar successfully!`,
      event: savedEvent
    });
  } catch (error) {
    console.error('Error creating calendar event:', error);
    res.status(500).json({ success: false, message: 'Error adding calendar event', error: error.message });
  }
});

// POST /api/calendar/sync-google-holidays — Sync official public holidays & observances directly from Google Calendar
router.post('/sync-google-holidays', checkCalendarAdminAuthority, async (req, res) => {
  try {
    const schoolSlug = resolveSchoolSlug(req);
    const todayStr = getSystemTodayStr();

    let gcalEvents = await fetchGoogleCalendarHolidays();
    if (!gcalEvents || gcalEvents.length === 0) {
      return res.status(502).json({
        success: false,
        message: 'Could not fetch Google Calendar iCal feed. Please check internet connection.'
      });
    }

    // Filter events from todayStr to end of next academic year
    gcalEvents = gcalEvents.filter(e => e.startDate >= todayStr && e.startDate <= '2027-12-31');

    const existingEvents = await CalendarEvent.find({ entityId: req.entityId });

    // Fix incorrect Oct 29 Diwali if present
    const incorrectDiwali = existingEvents.find(e => e.title.includes('Diwali') && e.startDate === '2026-10-29');
    if (incorrectDiwali) {
      incorrectDiwali.startDate = '2026-11-08';
      incorrectDiwali.endDate = '2026-11-11';
      incorrectDiwali.title = 'Diwali / Deepavali Festive Holidays';
      incorrectDiwali.description = 'Official Diwali & Bhai Dooj Festive Break (Google Calendar). Campus closed for festivities.';
      await incorrectDiwali.save();
    }

    let syncedCount = 0;
    for (const h of gcalEvents) {
      const cleanTitle = h.summary.toLowerCase().trim();
      const alreadyExists = existingEvents.some(e => {
        const eTitle = e.title.toLowerCase();
        return (
          e.startDate === h.startDate &&
          (eTitle.includes(cleanTitle.slice(0, 6)) || cleanTitle.includes(eTitle.slice(0, 6)))
        );
      });

      if (!alreadyExists) {
        const newEvt = await CalendarEvent.create({
          title: h.summary,
          description: h.description,
          category: 'Holiday',
          type: 'holiday',
          startDate: h.startDate,
          endDate: h.endDate,
          startTime: 'All Day',
          endTime: 'All Day',
          allDay: true,
          location: 'All Campuses & Branches',
          audience: 'All',
          isHoliday: true,
          color: h.isPublicHoliday ? '#DC2626' : '#EA580C',
          entityId: req.entityId,
          schoolSlug: schoolSlug || 'neel-public-school',
          createdBy: 'Google Calendar Sync',
          createdRole: 'admin'
        });
        existingEvents.push(newEvt);
        syncedCount++;
      }
    }

    res.json({
      success: true,
      count: syncedCount,
      message: syncedCount > 0
        ? `Successfully synchronized ${syncedCount} holidays and observances from Google Calendar!`
        : `All official holidays from Google Calendar are already up to date!`
    });
  } catch (error) {
    console.error('Error syncing Google Calendar holidays:', error);
    res.status(500).json({ success: false, message: 'Failed to sync Google Calendar holidays', error: error.message });
  }
});

// PUT /api/calendar/events/:id — Update existing event or holiday (RESTRICTED TO SUPER ADMIN & ADMIN)
router.put('/events/:id', checkCalendarAdminAuthority, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      category,
      type,
      startDate,
      endDate,
      startTime,
      endTime,
      allDay,
      location,
      audience,
      color,
      isHoliday
    } = req.body;

    const existing = await CalendarEvent.findOne({ _id: id, entityId: req.entityId });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Calendar event not found' });
    }

    const todayStr = getSystemTodayStr();
    if ((existing.endDate || existing.startDate) < todayStr) {
      return res.status(400).json({
        success: false,
        message: 'Editing past calendar entries is disabled. Historical records cannot be modified.'
      });
    }

    if (startDate && startDate.trim() < todayStr) {
      return res.status(400).json({
        success: false,
        message: `Cannot change event start date to a passed date (Selected: ${startDate}, Today: ${todayStr}).`
      });
    }

    if (title !== undefined) existing.title = title.trim();
    if (description !== undefined) existing.description = description.trim();
    if (category !== undefined) existing.category = category;
    if (type !== undefined) existing.type = type;
    if (startDate !== undefined) existing.startDate = startDate.trim();
    if (endDate !== undefined) existing.endDate = endDate.trim();
    if (startTime !== undefined) existing.startTime = startTime;
    if (endTime !== undefined) existing.endTime = endTime;
    if (allDay !== undefined) existing.allDay = Boolean(allDay);
    if (location !== undefined) existing.location = location.trim();
    if (audience !== undefined) existing.audience = audience;
    if (color !== undefined) existing.color = color;

    if (isHoliday !== undefined) {
      existing.isHoliday = Boolean(isHoliday);
    } else if (category === 'Holiday' || type === 'holiday') {
      existing.isHoliday = true;
    }

    const updated = await existing.save();

    res.json({
      success: true,
      message: `Calendar entry "${updated.title}" updated successfully!`,
      event: updated
    });
  } catch (error) {
    console.error('Error updating calendar event:', error);
    res.status(500).json({ success: false, message: 'Error updating calendar event', error: error.message });
  }
});

// DELETE /api/calendar/events/:id — Delete event or holiday (RESTRICTED TO SUPER ADMIN & ADMIN)
router.delete('/events/:id', checkCalendarAdminAuthority, async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await CalendarEvent.findOne({ _id: id, entityId: req.entityId });

    if (!existing) {
      return res.status(404).json({ success: false, message: 'Calendar event not found' });
    }

    const todayStr = getSystemTodayStr();
    if ((existing.endDate || existing.startDate) < todayStr) {
      return res.status(400).json({
        success: false,
        message: 'Deleting past calendar entries is disabled. Historical records are preserved.'
      });
    }

    await CalendarEvent.deleteOne({ _id: id });

    res.json({
      success: true,
      message: `Calendar entry "${existing.title}" deleted successfully!`,
      eventId: id
    });
  } catch (error) {
    console.error('Error deleting calendar event:', error);
    res.status(500).json({ success: false, message: 'Error deleting calendar event', error: error.message });
  }
});

module.exports = router;

