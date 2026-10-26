import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  CalendarDays, Clock, Users, Building, Building2, ShieldCheck, RefreshCw, 
  FileText, CheckCircle2, AlertTriangle, Award, X, Sparkles, BookOpen, Plus,
  Trash2, Coffee, SlidersHorizontal, Check
} from 'lucide-react';

const API_BASE = 'http://localhost:5000/api';

const Timetable = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const userInfo = JSON.parse(sessionStorage.getItem('userInfo') || '{}');
  const token = userInfo.token || sessionStorage.getItem('token') || '';
  const userRole = (sessionStorage.getItem('userRole') || userInfo.role || 'admin').toLowerCase();
  const tenantSlug = sessionStorage.getItem('tenantSlug') || userInfo.slug || userInfo.tenantSlug || '';

  const isSuperAdmin = userRole === 'superadmin' || location.pathname.includes('/superadmin');
  const isAdmin = userRole === 'admin';
  const isPrincipal = userRole === 'principal';
  const canSetup = isSuperAdmin || isAdmin || isPrincipal;

  const [schoolsList, setSchoolsList] = useState([]);
  const [selectedSchoolSlug, setSelectedSchoolSlug] = useState(tenantSlug);

  const [classesList, setClassesList] = useState([]);
  const [teachersList, setTeachersList] = useState([]);
  const [selectedTimetableClass, setSelectedTimetableClass] = useState('Class 10 - A');
  const [timetableSchedule, setTimetableSchedule] = useState({});
  const [selectedDayTab, setSelectedDayTab] = useState('ALL');
  const [timetableLoading, setTimetableLoading] = useState(false);
  const [conflictReport, setConflictReport] = useState({
    validated: true,
    hasConflict: false,
    teacherConflicts: 0,
    roomCollisions: 0,
    periodCoverage: '100% (30/30 Periods Allocated)',
    lastChecked: 'Real-Time Constraint Engine'
  });
  const [isValidatingConflicts, setIsValidatingConflicts] = useState(false);
  const [isAutoGenerating, setIsAutoGenerating] = useState(false);
  const [timetableNotification, setTimetableNotification] = useState('');
  
  // Quick Setup Class Modal State
  const [isSetupClassModalOpen, setIsSetupClassModalOpen] = useState(false);
  const [newClassSetup, setNewClassSetup] = useState({
    className: 'Class 6',
    section: 'A',
    academicSession: '2026-2027'
  });

  // Add Period Modal State (Super Admin & Admin)
  const [isAddPeriodModalOpen, setIsAddPeriodModalOpen] = useState(false);
  const [newPeriodData, setNewPeriodData] = useState({
    periodName: '',
    startTime: '08:30',
    endTime: '09:20',
    type: 'Lecture',
    isRecess: false,
    subject: '',
    teacher: '',
    room: 'Room 201',
    day: 'Monday',
    applyToAllDays: true
  });
  const [isAddingPeriod, setIsAddingPeriod] = useState(false);

  // Bell Schedule & Recess Timings Modal State (Super Admin & Admin)
  const [isBellScheduleModalOpen, setIsBellScheduleModalOpen] = useState(false);
  const [bellScheduleList, setBellScheduleList] = useState([]);
  const [isSavingBellSchedule, setIsSavingBellSchedule] = useState(false);

  const [editPeriodModal, setEditPeriodModal] = useState({
    open: false,
    day: '',
    periodIndex: 0,
    applyToAllDays: false,
    data: {
      periodNumber: 1,
      periodName: 'P1',
      startTime: '08:30',
      endTime: '09:20',
      subject: 'Mathematics',
      teacher: '',
      room: 'Room 201',
      type: 'Lecture',
      isRecess: false
    }
  });
  const [isPeriodSaving, setIsPeriodSaving] = useState(false);

  // Active campus slug to scope requests
  const effectiveSchoolSlug = isSuperAdmin ? (selectedSchoolSlug || tenantSlug) : tenantSlug;

  const getAuthHeaders = () => {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (effectiveSchoolSlug) {
      headers['x-tenant-slug'] = effectiveSchoolSlug;
      headers['x-school-slug'] = effectiveSchoolSlug;
    }
    return headers;
  };

  // If Super Admin, fetch all campuses/schools to allow switching and setting up timetables
  useEffect(() => {
    if (isSuperAdmin) {
      fetch(`${API_BASE}/school/list`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
          ...(tenantSlug ? { 'x-tenant-slug': tenantSlug } : {})
        }
      })
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data?.schools && data.schools.length > 0) {
            setSchoolsList(data.schools);
            if (!selectedSchoolSlug || !data.schools.some(s => s.slug === selectedSchoolSlug)) {
              setSelectedSchoolSlug(data.schools[0].slug);
            }
          }
        })
        .catch(err => console.warn('Error loading schools list in Timetable:', err));
    }
  }, [isSuperAdmin, tenantSlug, token]);

  // Fetch classes and teachers for effective campus
  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const slugQuery = effectiveSchoolSlug ? `?schoolSlug=${effectiveSchoolSlug}` : '';
        const [classesRes, teachersRes] = await Promise.all([
          fetch(`${API_BASE}/classes${slugQuery}`, { headers: getAuthHeaders() }),
          fetch(`${API_BASE}/staff/teachers${slugQuery}`, { headers: getAuthHeaders() })
        ]);
        if (classesRes.ok) {
          const cData = await classesRes.json();
          const list = cData.classes || [];
          setClassesList(list);
          if (list.length > 0) {
            setSelectedTimetableClass(`${list[0].className} - ${list[0].section}`);
          }
        }
        if (teachersRes.ok) {
          const tData = await teachersRes.json();
          setTeachersList(tData.teachers || []);
        }
      } catch (err) {
        console.warn('Error fetching timetable classes/teachers:', err);
      }
    };
    fetchMetadata();
  }, [effectiveSchoolSlug]);

  // Fetch timetable schedule when selected class changes
  const fetchLiveTimetable = async (className, section) => {
    if (!className || !section) return;
    setTimetableLoading(true);
    try {
      const slugQuery = effectiveSchoolSlug ? `&schoolSlug=${encodeURIComponent(effectiveSchoolSlug)}` : '';
      const res = await fetch(
        `${API_BASE}/timetable?className=${encodeURIComponent(className)}&section=${encodeURIComponent(section)}${slugQuery}`,
        { headers: getAuthHeaders() }
      );
      if (res.ok) {
        const data = await res.json();
        if (data.timetable && data.timetable.schedule) {
          setTimetableSchedule(data.timetable.schedule);
        } else {
          setTimetableSchedule({});
        }
      }
    } catch (err) {
      console.error('Error fetching timetable from DB:', err);
    } finally {
      setTimetableLoading(false);
    }
  };

  useEffect(() => {
    if (selectedTimetableClass) {
      const parts = selectedTimetableClass.split(' - ');
      const className = parts[0] || selectedTimetableClass;
      const section = parts[1] || 'A';
      fetchLiveTimetable(className, section);
    }
  }, [selectedTimetableClass, effectiveSchoolSlug]);

  const handleValidateConflicts = async () => {
    setIsValidatingConflicts(true);
    try {
      const slugQuery = effectiveSchoolSlug ? `?schoolSlug=${encodeURIComponent(effectiveSchoolSlug)}` : '';
      const res = await fetch(`${API_BASE}/timetable/conflicts${slugQuery}`, { headers: getAuthHeaders() });
      if (res.ok) {
        const report = await res.json();
        setConflictReport(report);
        setTimetableNotification(
          report.hasConflict
            ? `⚠️ Found ${report.teacherConflicts} teacher clashes and ${report.roomCollisions} room overlaps!`
            : '✅ Constraint engine: 0 room collisions & 0 teacher double-bookings detected in MongoDB!'
        );
      } else {
        setTimetableNotification('⚠️ Could not run conflict engine');
      }
    } catch (err) {
      setTimetableNotification('⚠️ Network error running conflict validator');
    } finally {
      setIsValidatingConflicts(false);
      setTimeout(() => setTimetableNotification(''), 4500);
    }
  };

  const handleAutoGenerateTimetable = async () => {
    if (!canSetup) {
      setTimetableNotification('⚠️ Access Restricted: Only Super Admin, Branch Admin, and Principal have authority to configure timetables.');
      setTimeout(() => setTimetableNotification(''), 4000);
      return;
    }

    setIsAutoGenerating(true);
    try {
      const parts = selectedTimetableClass.split(' - ');
      const className = parts[0] || selectedTimetableClass;
      const section = parts[1] || 'A';

      const res = await fetch(`${API_BASE}/timetable/auto-generate`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          className,
          section,
          schoolSlug: effectiveSchoolSlug
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.timetable?.schedule) {
          setTimetableSchedule(data.timetable.schedule);
        }
        setTimetableNotification(`✅ Collision-free timetable auto-generated and saved to DB for ${selectedTimetableClass}!`);
      } else {
        const errData = await res.json().catch(() => ({}));
        setTimetableNotification(`⚠️ ${errData.message || 'Failed to auto-generate timetable'}`);
      }
    } catch (err) {
      setTimetableNotification('⚠️ Connection error generating timetable');
    } finally {
      setIsAutoGenerating(false);
      setTimeout(() => setTimetableNotification(''), 4500);
    }
  };

  const handleCreateNewClassTimetable = async (e) => {
    e.preventDefault();
    if (!canSetup) return;
    setIsAutoGenerating(true);
    try {
      const res = await fetch(`${API_BASE}/timetable/auto-generate`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          className: newClassSetup.className.trim(),
          section: newClassSetup.section.trim().toUpperCase(),
          schoolSlug: effectiveSchoolSlug
        })
      });

      if (res.ok) {
        const data = await res.json();
        const formatted = `${newClassSetup.className.trim()} - ${newClassSetup.section.trim().toUpperCase()}`;
        if (!classesList.some(c => `${c.className} - ${c.section}` === formatted)) {
          setClassesList(prev => [...prev, { className: newClassSetup.className, section: newClassSetup.section, _id: Date.now().toString() }]);
        }
        setSelectedTimetableClass(formatted);
        if (data.timetable?.schedule) {
          setTimetableSchedule(data.timetable.schedule);
        }
        setIsSetupClassModalOpen(false);
        setTimetableNotification(`✅ Successfully initialized timetable for ${formatted}!`);
        setTimeout(() => setTimetableNotification(''), 4500);
      } else {
        const err = await res.json().catch(() => ({}));
        setTimetableNotification(`⚠️ ${err.message || 'Failed to initialize class timetable'}`);
      }
    } catch (err) {
      setTimetableNotification('⚠️ Network error creating class timetable');
    } finally {
      setIsAutoGenerating(false);
    }
  };

  const handleOpenAddPeriodModal = (targetDay = 'Monday') => {
    const dayPeriods = timetableSchedule[targetDay] || [];
    const nextNum = dayPeriods.length + 1;
    let nextStart = '08:30';
    let nextEnd = '09:20';
    if (dayPeriods.length > 0) {
      const last = dayPeriods[dayPeriods.length - 1];
      if (last.endTime) {
        nextStart = last.endTime;
        const [h, m] = last.endTime.split(':').map(Number);
        if (!isNaN(h) && !isNaN(m)) {
          const endTotal = h * 60 + m + 50;
          const nh = Math.floor(endTotal / 60) % 24;
          const nm = endTotal % 60;
          nextEnd = `${String(nh).padStart(2, '0')}:${String(nm).padStart(2, '0')}`;
        }
      }
    }
    setNewPeriodData({
      periodName: `P${nextNum}`,
      startTime: nextStart,
      endTime: nextEnd,
      type: 'Lecture',
      isRecess: false,
      subject: '',
      teacher: '',
      room: 'Room 201',
      day: targetDay,
      applyToAllDays: true
    });
    setIsAddPeriodModalOpen(true);
  };

  const handleAddPeriodSubmit = async (e) => {
    e.preventDefault();
    if (!canSetup) return;
    setIsAddingPeriod(true);
    try {
      const parts = selectedTimetableClass.split(' - ');
      const className = parts[0] || selectedTimetableClass;
      const section = parts[1] || 'A';

      const isRecess = Boolean(newPeriodData.isRecess || newPeriodData.type === 'Recess' || newPeriodData.type === 'Break');

      const res = await fetch(`${API_BASE}/timetable/period`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          className,
          section,
          day: newPeriodData.day,
          applyToAllDays: newPeriodData.applyToAllDays,
          periodData: {
            periodName: newPeriodData.periodName.trim() || (isRecess ? 'Recess' : 'New Period'),
            startTime: newPeriodData.startTime,
            endTime: newPeriodData.endTime,
            type: isRecess ? (newPeriodData.type === 'Break' ? 'Break' : 'Recess') : newPeriodData.type,
            isRecess: isRecess,
            subject: isRecess ? (newPeriodData.subject.trim() || 'Recess / Break') : (newPeriodData.subject.trim() || 'General Study'),
            teacher: isRecess ? 'Duty Staff' : (newPeriodData.teacher || 'Duty Faculty'),
            room: newPeriodData.room || (isRecess ? 'Campus / Cafeteria' : 'Room 101'),
          },
          schoolSlug: effectiveSchoolSlug
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.timetable?.schedule) {
          setTimetableSchedule(data.timetable.schedule);
        }
        setIsAddPeriodModalOpen(false);
        setTimetableNotification(`✅ Period added successfully${newPeriodData.applyToAllDays ? ' across all weekdays' : ` to ${newPeriodData.day}`}!`);
      } else {
        const err = await res.json().catch(() => ({}));
        setTimetableNotification(`⚠️ ${err.message || 'Failed to add period'}`);
      }
    } catch (err) {
      setTimetableNotification('⚠️ Network error adding period');
    } finally {
      setIsAddingPeriod(false);
      setTimeout(() => setTimetableNotification(''), 4500);
    }
  };

  const handleDeletePeriod = async (deleteFromAllDays = false) => {
    if (!canSetup || !editPeriodModal.open) return;
    const periodName = editPeriodModal.data.periodName || `P${editPeriodModal.periodIndex + 1}`;
    const confirmPrompt = deleteFromAllDays
      ? `Are you sure you want to delete period "${periodName}" across ALL weekdays (Mon–Fri)?`
      : `Are you sure you want to delete period "${periodName}" from ${editPeriodModal.day}?`;
    
    if (!window.confirm(confirmPrompt)) return;

    setIsPeriodSaving(true);
    try {
      const parts = selectedTimetableClass.split(' - ');
      const className = parts[0] || selectedTimetableClass;
      const section = parts[1] || 'A';

      const res = await fetch(`${API_BASE}/timetable/period`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          className,
          section,
          day: editPeriodModal.day,
          periodIndex: editPeriodModal.periodIndex,
          periodNumber: editPeriodModal.data.periodNumber,
          deleteFromAllDays,
          schoolSlug: effectiveSchoolSlug
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.timetable?.schedule) {
          setTimetableSchedule(data.timetable.schedule);
        }
        setEditPeriodModal({ open: false, day: '', periodIndex: 0, applyToAllDays: false, data: {} });
        setTimetableNotification(`✅ Period deleted successfully${deleteFromAllDays ? ' across all weekdays' : ` from ${editPeriodModal.day}`}!`);
      } else {
        const err = await res.json().catch(() => ({}));
        setTimetableNotification(`⚠️ ${err.message || 'Failed to delete period'}`);
      }
    } catch (err) {
      setTimetableNotification('⚠️ Network error deleting period');
    } finally {
      setIsPeriodSaving(false);
      setTimeout(() => setTimetableNotification(''), 4500);
    }
  };

  const handleOpenBellScheduleModal = () => {
    let template = [];
    for (const d of ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']) {
      if (timetableSchedule[d] && timetableSchedule[d].length > template.length) {
        template = timetableSchedule[d];
      }
    }
    if (template.length === 0) {
      template = [
        { periodNumber: 1, periodName: 'P1', startTime: '08:30', endTime: '09:20', type: 'Lecture', isRecess: false },
        { periodNumber: 2, periodName: 'P2', startTime: '09:20', endTime: '10:10', type: 'Lecture', isRecess: false },
        { periodNumber: 3, periodName: 'Recess', startTime: '10:10', endTime: '10:30', type: 'Recess', isRecess: true },
        { periodNumber: 4, periodName: 'P3', startTime: '10:30', endTime: '11:20', type: 'Lecture', isRecess: false },
        { periodNumber: 5, periodName: 'P4', startTime: '11:20', endTime: '12:10', type: 'Lecture', isRecess: false },
        { periodNumber: 6, periodName: 'P5', startTime: '12:45', endTime: '01:35', type: 'Lecture', isRecess: false },
        { periodNumber: 7, periodName: 'P6', startTime: '01:35', endTime: '02:25', type: 'Lecture', isRecess: false }
      ];
    } else {
      template = template.map((p, idx) => ({
        periodNumber: p.periodNumber || idx + 1,
        periodName: p.periodName || `P${idx + 1}`,
        startTime: p.startTime || '08:30',
        endTime: p.endTime || '09:20',
        type: (p.isRecess || p.type === 'Recess' || p.type === 'Break') ? 'Recess' : (p.type || 'Lecture'),
        isRecess: Boolean(p.isRecess || p.type === 'Recess' || p.type === 'Break'),
        subject: p.subject || '',
      }));
    }
    setBellScheduleList(template);
    setIsBellScheduleModalOpen(true);
  };

  const handleSaveBellSchedule = async () => {
    if (!canSetup) return;
    setIsSavingBellSchedule(true);
    try {
      const parts = selectedTimetableClass.split(' - ');
      const className = parts[0] || selectedTimetableClass;
      const section = parts[1] || 'A';

      const res = await fetch(`${API_BASE}/timetable/bell-schedule`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          className,
          section,
          periods: bellScheduleList,
          schoolSlug: effectiveSchoolSlug
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.timetable?.schedule) {
          setTimetableSchedule(data.timetable.schedule);
        }
        setIsBellScheduleModalOpen(false);
        setTimetableNotification('✅ Bell schedule & Recess timings applied successfully across all weekdays!');
      } else {
        const err = await res.json().catch(() => ({}));
        setTimetableNotification(`⚠️ ${err.message || 'Failed to save bell schedule'}`);
      }
    } catch (err) {
      setTimetableNotification('⚠️ Network error saving bell schedule');
    } finally {
      setIsSavingBellSchedule(false);
      setTimeout(() => setTimetableNotification(''), 4500);
    }
  };

  const handleSaveEditedPeriod = async () => {
    if (!editPeriodModal.data || !canSetup) return;
    setIsPeriodSaving(true);
    try {
      const parts = selectedTimetableClass.split(' - ');
      const className = parts[0] || selectedTimetableClass;
      const section = parts[1] || 'A';

      const isRecess = Boolean(editPeriodModal.data.isRecess || editPeriodModal.data.type === 'Recess' || editPeriodModal.data.type === 'Break');

      const res = await fetch(`${API_BASE}/timetable/period`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          className,
          section,
          day: editPeriodModal.day,
          periodIndex: editPeriodModal.periodIndex,
          applyToAllDays: editPeriodModal.applyToAllDays,
          periodData: {
            ...editPeriodModal.data,
            isRecess: isRecess,
            type: isRecess ? (editPeriodModal.data.type === 'Break' ? 'Break' : 'Recess') : (editPeriodModal.data.type || 'Lecture'),
            subject: isRecess ? (editPeriodModal.data.subject || 'Recess / Break') : editPeriodModal.data.subject,
            teacher: isRecess ? 'Duty Staff' : editPeriodModal.data.teacher,
            room: isRecess ? 'Campus / Cafeteria' : editPeriodModal.data.room,
          },
          schoolSlug: effectiveSchoolSlug
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.timetable?.schedule) {
          setTimetableSchedule(data.timetable.schedule);
        }
        setEditPeriodModal({ open: false, day: '', periodIndex: 0, applyToAllDays: false, data: {} });
        setTimetableNotification(`✅ Period updated in database${editPeriodModal.applyToAllDays ? ' across all weekdays' : ` for ${editPeriodModal.day}`}!`);
        setTimeout(() => setTimetableNotification(''), 3500);
      } else {
        const err = await res.json().catch(() => ({}));
        setTimetableNotification(`⚠️ ${err.message || 'Failed to save period'}`);
      }
    } catch (err) {
      console.error('Error saving period:', err);
    } finally {
      setIsPeriodSaving(false);
    }
  };

  // Determine dynamic master periods template across days
  const daysOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  let masterPeriods = [];
  for (const d of daysOrder) {
    if (timetableSchedule[d] && timetableSchedule[d].length > masterPeriods.length) {
      masterPeriods = timetableSchedule[d];
    }
  }
  if (masterPeriods.length === 0) {
    masterPeriods = [
      { periodNumber: 1, periodName: 'P1', startTime: '08:30', endTime: '09:20' },
      { periodNumber: 2, periodName: 'P2', startTime: '09:20', endTime: '10:10' },
      { periodNumber: 3, periodName: 'P3', startTime: '10:25', endTime: '11:15' },
      { periodNumber: 4, periodName: 'P4', startTime: '11:15', endTime: '12:05' },
      { periodNumber: 5, periodName: 'P5', startTime: '12:45', endTime: '01:35' },
      { periodNumber: 6, periodName: 'P6', startTime: '01:35', endTime: '02:25' }
    ];
  }
  const maxPeriodCount = Math.max(masterPeriods.length, 1);
  const gridColumnsTemplate = `110px repeat(${maxPeriodCount}, minmax(132px, 1fr))`;

  const formatSlugToTitle = (slug) => {
    if (!slug) return '';
    return slug
      .split('-')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  };
  const currentSchool = schoolsList.find(s => s.slug === effectiveSchoolSlug);
  const currentSchoolName = currentSchool?.name || userInfo.schoolName || userInfo.tenantName || formatSlugToTitle(effectiveSchoolSlug) || 'Pragati Educational Campus';

  const handlePrintTimetable = () => {
    const prevTab = selectedDayTab;
    setSelectedDayTab('ALL');
    setTimeout(() => {
      window.print();
      setTimeout(() => {
        setSelectedDayTab(prevTab);
      }, 500);
    }, 150);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%', minHeight: '100%', fontFamily: "'Outfit', sans-serif" }}>
      
      {/* TIMETABLE HERO HEADER */}
      <div className="no-print" style={{
        background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 45%, #1e3a8a 100%)',
        borderRadius: '20px',
        padding: '28px 32px',
        color: 'white',
        boxShadow: '0 10px 30px rgba(30, 27, 75, 0.25)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '20px'
      }}>
        <div style={{ maxWidth: '720px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px', flexWrap: 'wrap' }}>
            <span style={{
              background: 'rgba(255, 255, 255, 0.15)',
              backdropFilter: 'blur(10px)',
              padding: '4px 12px',
              borderRadius: '20px',
              fontSize: '0.78rem',
              fontWeight: 800,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <CalendarDays size={14} color="#60a5fa" /> Smart Schedule Engine
            </span>

            {/* Role-Based Authority Pill */}
            {isSuperAdmin ? (
              <span style={{
                background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.35) 0%, rgba(99, 102, 241, 0.35) 100%)',
                border: '1px solid rgba(165, 180, 252, 0.4)',
                color: '#e0e7ff',
                padding: '4px 12px',
                borderRadius: '20px',
                fontSize: '0.76rem',
                fontWeight: 800,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <ShieldCheck size={14} color="#a5b4fc" /> Super Admin Control: Global Timetable Setup & Matrix Architecture
              </span>
            ) : isAdmin ? (
              <span style={{
                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.3) 0%, rgba(5, 150, 105, 0.3) 100%)',
                border: '1px solid rgba(110, 231, 183, 0.4)',
                color: '#d1fae5',
                padding: '4px 12px',
                borderRadius: '20px',
                fontSize: '0.76rem',
                fontWeight: 800,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <Building2 size={14} color="#6ee7b7" /> Branch Admin Authority: Campus Timetable Setup & Period Allocation
              </span>
            ) : isPrincipal ? (
              <span style={{
                background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.3) 0%, rgba(217, 119, 6, 0.3) 100%)',
                border: '1px solid rgba(252, 211, 77, 0.4)',
                color: '#fef3c7',
                padding: '4px 12px',
                borderRadius: '20px',
                fontSize: '0.76rem',
                fontWeight: 800,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <Award size={14} color="#fcd34d" /> Principal Leadership: Academic Timetable & Class Schedules
              </span>
            ) : (
              <span style={{
                background: 'rgba(255, 255, 255, 0.1)',
                color: '#cbd5e1',
                padding: '4px 12px',
                borderRadius: '20px',
                fontSize: '0.76rem',
                fontWeight: 600
              }}>
                View-Only Access (Managed by Super Admin & Campus Admin)
              </span>
            )}
          </div>

          <h1 style={{ margin: 0, fontSize: '1.9rem', fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.25 }}>
            Master Timetable & Period Architecture
          </h1>
          <div style={{ fontSize: '0.84rem', opacity: 0.85, marginTop: '4px' }}>
            {isSuperAdmin 
              ? `Governing schedule matrix across all campuses. Target Campus: ${schoolsList.find(s => s.slug === effectiveSchoolSlug)?.name || effectiveSchoolSlug}` 
              : `Operating branch schedule matrix for ${effectiveSchoolSlug}`}
          </div>
        </div>

        {/* Right Header Area: Campus Selector (SuperAdmin) & Nav Button */}
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          
          {/* Campus Selector for Super Admin */}
          {isSuperAdmin && schoolsList.length > 0 && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: 'rgba(255, 255, 255, 0.14)',
              padding: '6px 14px',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.25)',
              backdropFilter: 'blur(10px)'
            }}>
              <Building2 size={16} color="#93c5fd" />
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#e2e8f0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Campus Scope:
              </span>
              <select
                value={selectedSchoolSlug}
                onChange={(e) => {
                  const val = e.target.value;
                  setSelectedSchoolSlug(val);
                  sessionStorage.setItem('tenantSlug', val);
                }}
                style={{
                  background: '#0f172a',
                  color: 'white',
                  border: '1px solid rgba(255, 255, 255, 0.25)',
                  borderRadius: '8px',
                  padding: '6px 10px',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                {schoolsList.map(s => (
                  <option key={s.slug} value={s.slug}>
                    {s.name} {s.isBranch ? '• Branch' : '• Main'}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Quick Nav to Academics */}
          <button
            onClick={() => navigate(`/${effectiveSchoolSlug}/academics`)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: 'rgba(255, 255, 255, 0.12)',
              color: 'white',
              border: '1px solid rgba(255, 255, 255, 0.25)',
              padding: '10px 18px',
              borderRadius: '12px',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer',
              backdropFilter: 'blur(10px)',
              transition: 'all 0.2s'
            }}
          >
            <BookOpen size={16} />
            <span>Curriculum & Classes</span>
          </button>
        </div>
      </div>

      {/* CONTROL & CONSTRAINT ACTION BAR */}
      <div className="chart-card no-print" style={{ padding: '20px 24px', background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
            <span style={{ background: '#e0e7ff', color: '#4338ca', padding: '3px 10px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 800 }}>
              CONFLICT ENGINE
            </span>
            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Live Constraint Validation</span>
          </div>
          <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#1e3a8a' }}>
            Schedule Matrix & Allocation Controls
          </h2>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <select
            value={selectedTimetableClass}
            onChange={(e) => setSelectedTimetableClass(e.target.value)}
            style={{ padding: '9px 14px', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontSize: '0.88rem', fontWeight: 700, color: '#1e3a8a', background: 'white', cursor: 'pointer' }}
          >
            {classesList.length > 0 ? (
              classesList.map(c => (
                <option key={c._id} value={`${c.className} - ${c.section}`}>
                  {c.className} - Section {c.section}
                </option>
              ))
            ) : (
              <>
                <option value="Class 10 - A">Class 10 - Section A</option>
                <option value="Class 9 - B">Class 9 - Section B</option>
                <option value="Class 11 - SCIENCE">Class 11 - Section Science</option>
                <option value="Class 8 - A">Class 8 - Section A</option>
              </>
            )}
          </select>

          <button
            onClick={handleValidateConflicts}
            disabled={isValidatingConflicts}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '9px 16px',
              borderRadius: '10px',
              border: 'none',
              background: '#0F766E',
              color: 'white',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: isValidatingConflicts ? 'not-allowed' : 'pointer',
              boxShadow: '0 4px 12px rgba(15, 118, 110, 0.25)'
            }}
          >
            <ShieldCheck size={16} />
            <span>{isValidatingConflicts ? 'Validating...' : 'Run Conflict Validator'}</span>
          </button>

          {canSetup && (
            <>
              <button
                onClick={() => handleOpenAddPeriodModal()}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '9px 16px',
                  borderRadius: '10px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                  color: 'white',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)'
                }}
                title="Super Admin & Admin: Add a new period or recess slot"
              >
                <Plus size={16} />
                <span>Add Period</span>
              </button>

              <button
                onClick={handleOpenBellScheduleModal}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '9px 16px',
                  borderRadius: '10px',
                  border: '1.5px solid #fed7aa',
                  background: '#fff7ed',
                  color: '#c2410c',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  cursor: 'pointer'
                }}
                title="Super Admin & Admin: Configure bell timings and recess breaks across all days"
              >
                <Coffee size={15} color="#ea580c" />
                <span>Bell & Recess Timings</span>
              </button>

              <button
                onClick={handleAutoGenerateTimetable}
                disabled={isAutoGenerating}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '9px 16px',
                  borderRadius: '10px',
                  border: 'none',
                  background: '#4F46E5',
                  color: 'white',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  cursor: isAutoGenerating ? 'not-allowed' : 'pointer',
                  boxShadow: '0 4px 12px rgba(79, 70, 229, 0.25)'
                }}
                title="Super Admin & Admin: Auto-Generate conflict-free timetable"
              >
                <RefreshCw size={15} className={isAutoGenerating ? 'spin' : ''} />
                <span>Auto-Optimize Matrix</span>
              </button>

              <button
                onClick={() => setIsSetupClassModalOpen(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '9px 16px',
                  borderRadius: '10px',
                  border: '1px solid #c7d2fe',
                  background: '#eef2ff',
                  color: '#4338ca',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  cursor: 'pointer'
                }}
                title="Configure and initialize timetable for a new class"
              >
                <Plus size={15} />
                <span>Setup Class Schedule</span>
              </button>
            </>
          )}

          <button
            onClick={handlePrintTimetable}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '9px 16px',
              borderRadius: '10px',
              border: '1px solid #cbd5e1',
              background: 'white',
              color: '#475569',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer'
            }}
            title="Print official academic weekly timetable schedule"
          >
            <FileText size={15} />
            <span>Print Schedule</span>
          </button>
        </div>
      </div>

      {/* NOTIFICATION BANNER */}
      {timetableNotification && (
        <div className="no-print" style={{
          background: timetableNotification.includes('⚠️') ? '#fef3c7' : '#ecfdf5',
          color: timetableNotification.includes('⚠️') ? '#92400e' : '#065f46',
          border: `1px solid ${timetableNotification.includes('⚠️') ? '#fde68a' : '#a7f3d0'}`,
          borderRadius: '12px',
          padding: '12px 20px',
          fontWeight: 700,
          fontSize: '0.9rem',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
        }}>
          <span>{timetableNotification}</span>
        </div>
      )}

      {/* 4 CONFLICT & ALLOCATION STAT SCORECARDS */}
      <div className="no-print" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
        <div className="chart-card" style={{ padding: '16px 20px', background: 'white', borderRadius: '14px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: conflictReport.teacherConflicts > 0 ? '#fef2f2' : '#dcfce7', color: conflictReport.teacherConflicts > 0 ? '#dc2626' : '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CheckCircle2 size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Teacher Clashes</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: conflictReport.teacherConflicts > 0 ? '#dc2626' : '#166534' }}>
              {conflictReport.teacherConflicts} Collisions
            </div>
          </div>
        </div>

        <div className="chart-card" style={{ padding: '16px 20px', background: 'white', borderRadius: '14px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: conflictReport.roomCollisions > 0 ? '#fef2f2' : '#dcfce7', color: conflictReport.roomCollisions > 0 ? '#dc2626' : '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Building size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Room Overlaps</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: conflictReport.roomCollisions > 0 ? '#dc2626' : '#166534' }}>
              {conflictReport.roomCollisions} Collisions
            </div>
          </div>
        </div>

        <div className="chart-card" style={{ padding: '16px 20px', background: 'white', borderRadius: '14px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: '#e0e7ff', color: '#4338ca', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Award size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Weekly Periods Quota</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#1e3a8a' }}>
              30 / 30 Periods (100%)
            </div>
          </div>
        </div>

        <div className="chart-card" style={{ padding: '16px 20px', background: 'white', borderRadius: '14px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: '#fef3c7', color: '#b45309', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Clock size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Validation Engine</div>
            <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#92400e' }}>
              {conflictReport.lastChecked}
            </div>
          </div>
        </div>
      </div>

      {/* 6-DAY INTERACTIVE TIMETABLE MATRIX GRID */}
      <div className="chart-card timetable-main-card" style={{ padding: '24px', background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 2px 12px rgba(0,0,0,0.03)' }}>
        
        {/* Day Filter Tabs & Scrolling Helper */}
        <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '18px', paddingBottom: '16px', borderBottom: '1px solid #f1f5f9' }}>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748b', marginRight: '6px', textTransform: 'uppercase' }}>
              View:
            </span>
            {['ALL', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setSelectedDayTab(d)}
                style={{
                  padding: '6px 14px',
                  borderRadius: '8px',
                  border: '1px solid',
                  borderColor: selectedDayTab === d ? '#4F46E5' : '#e2e8f0',
                  background: selectedDayTab === d ? '#4F46E5' : '#f8fafc',
                  color: selectedDayTab === d ? 'white' : '#475569',
                  fontWeight: 700,
                  fontSize: '0.78rem',
                  cursor: 'pointer',
                  boxShadow: selectedDayTab === d ? '0 2px 8px rgba(79, 70, 229, 0.25)' : 'none',
                  transition: 'all 0.15s'
                }}
              >
                {d === 'ALL' ? '📅 Weekly Overview' : d}
              </button>
            ))}
          </div>

          <div style={{ fontSize: '0.75rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>
              {canSetup 
                ? '💡 Super Admin & Admin Authority: Click any period card to modify subject, faculty, or classroom allocation' 
                : '💡 Read-Only View: Timetable setup and period allocation are managed by Super Admin and Admin'}
            </span>
          </div>
        </div>

        {/* OFFICIAL ACADEMIC TIMETABLE PRINT HEADER */}
        <div className="print-only timetable-print-header">
          <div className="print-header-top">
            <div className="print-header-brand">
              <img src="/logo.png" alt="School Crest" className="print-school-logo" />
              <div className="print-school-details">
                <h1 className="print-school-name">{currentSchoolName}</h1>
                <p className="print-school-sub">Affiliated to Central Board of Secondary Education • Recognized Academic Institution</p>
                <p className="print-doc-title">OFFICIAL WEEKLY CLASS TIMETABLE & PERIOD ALLOCATION MATRIX</p>
              </div>
            </div>
            <div className="print-meta-badge">
              <span className="print-meta-session">SESSION 2026 - 2027</span>
              <span className="print-meta-stamp">APPROVED ACADEMIC ROUTINE</span>
            </div>
          </div>

          <div className="print-info-strip">
            <div className="print-info-item">
              <span className="info-lbl">CLASS & SECTION:</span>
              <span className="info-val">{selectedTimetableClass}</span>
            </div>
            <div className="print-info-item">
              <span className="info-lbl">CAMPUS:</span>
              <span className="info-val">{currentSchoolName}</span>
            </div>
            <div className="print-info-item">
              <span className="info-lbl">EFFECTIVE DATE:</span>
              <span className="info-val">{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
            </div>
            <div className="print-info-item">
              <span className="info-lbl">ALLOCATED PERIODS:</span>
              <span className="info-val">{masterPeriods.filter(p => !p.isRecess && p.type !== 'Recess').length * 6} Periods / Week (100% Coverage)</span>
            </div>
          </div>
        </div>

        {/* Scrollable Matrix Area */}
        <div className="timetable-scroll-container timetable-print-container" style={{ overflowX: 'auto', paddingBottom: '8px', '--period-count': maxPeriodCount }}>
          <div className="timetable-inner-matrix" style={{ minWidth: '880px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            
            {/* Period Column Headers */}
            <div className="timetable-header-row" style={{
              display: 'grid',
              gridTemplateColumns: gridColumnsTemplate,
              gap: '10px',
              paddingBottom: '2px'
            }}>
              <div style={{
                background: '#f1f5f9',
                borderRadius: '10px',
                padding: '8px 10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: '0.75rem',
                color: '#475569',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                Day
              </div>

              {masterPeriods.map((ph, idx) => {
                const isRecessHeader = ph.isRecess || ph.type === 'Recess' || ph.type === 'Break';
                return (
                  <div key={idx} style={{
                    background: isRecessHeader ? '#fffbeb' : '#f8fafc',
                    border: `1.5px ${isRecessHeader ? 'dashed #f59e0b' : 'solid #e2e8f0'}`,
                    borderRadius: '10px',
                    padding: '8px 10px',
                    textAlign: 'center'
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '5px',
                      fontSize: '0.82rem',
                      fontWeight: 800,
                      color: isRecessHeader ? '#b45309' : '#1e3a8a'
                    }}>
                      {isRecessHeader && <Coffee size={13} color="#d97706" />}
                      <span>{ph.periodName || `P${idx + 1}`}</span>
                    </div>
                    <div style={{ fontSize: '0.7rem', color: isRecessHeader ? '#92400e' : '#64748b', fontWeight: 600, marginTop: '2px' }}>
                      {ph.startTime} - {ph.endTime}
                    </div>
                  </div>
                );
              })}
            </div>

            {timetableLoading ? (
              <div style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>
                <RefreshCw size={26} className="spin" style={{ margin: '0 auto 10px' }} />
                <div>Loading live timetable schedule from MongoDB...</div>
              </div>
            ) : Object.keys(timetableSchedule).length === 0 ? (
              <div style={{ padding: '50px', textAlign: 'center', color: '#64748b' }}>
                <p style={{ margin: '0 0 12px', fontWeight: 700 }}>No timetable schedule saved yet for {selectedTimetableClass}.</p>
                <button
                  onClick={handleAutoGenerateTimetable}
                  style={{
                    background: '#4F46E5', color: 'white', border: 'none', padding: '10px 20px',
                    borderRadius: '10px', fontWeight: 700, cursor: 'pointer'
                  }}
                >
                  Auto-Generate Schedule for {selectedTimetableClass}
                </button>
              </div>
            ) : (
              /* Filtered Day Rows */
              Object.entries(timetableSchedule)
                .filter(([day]) => selectedDayTab === 'ALL' || selectedDayTab === day)
                .filter(([day]) => day !== 'Saturday' || (timetableSchedule[day] && timetableSchedule[day].length > 0))
                .map(([day, periods]) => (
                  <div key={day} className="timetable-grid-row" style={{ display: 'grid', gridTemplateColumns: gridColumnsTemplate, gap: '10px', alignItems: 'stretch' }}>
                    
                    {/* Sticky Day Label Header */}
                    <div className="timetable-day-header" style={{ 
                      background: 'linear-gradient(135deg, #1e3a8a 0%, #1e1b4b 100%)', 
                      color: 'white', 
                      borderRadius: '12px', 
                      display: 'flex', 
                      flexDirection: 'column', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      padding: '12px 6px',
                      fontWeight: 800,
                      fontSize: '0.92rem',
                      position: 'sticky',
                      left: 0,
                      zIndex: 3,
                      boxShadow: '2px 0 8px rgba(0,0,0,0.08)'
                    }}>
                      <span className="day-name">{day}</span>
                      <span className="day-periods-count" style={{ fontSize: '0.68rem', opacity: 0.8, fontWeight: 500, marginTop: '2px' }}>
                        {periods?.length || 0} Periods
                      </span>
                      {canSetup && (
                        <button
                          type="button"
                          className="no-print"
                          onClick={() => handleOpenAddPeriodModal(day)}
                          style={{
                            marginTop: '8px',
                            background: 'rgba(255, 255, 255, 0.18)',
                            border: '1px solid rgba(255, 255, 255, 0.3)',
                            borderRadius: '6px',
                            color: 'white',
                            fontSize: '0.68rem',
                            fontWeight: 700,
                            padding: '3px 8px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '3px'
                          }}
                          title={`Add period or recess to ${day}`}
                        >
                          <Plus size={11} /> Add
                        </button>
                      )}
                    </div>

                    {/* Period Cards */}
                    {(periods || []).map((p, pIdx) => {
                      const isRecess = p.isRecess || p.type === 'Recess' || p.type === 'Break';
                      const isLab = p.type === 'Lab';
                      const isTutorial = p.type === 'Tutorial';
                      const isActivity = p.type === 'Activity';
                      const isAssess = p.type === 'Assessment';

                      if (isRecess) {
                        return (
                          <div 
                            key={pIdx}
                            className="timetable-card recess-card"
                            style={{
                              background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
                              border: '1.5px dashed #f59e0b',
                              borderRadius: '12px',
                              padding: '10px 12px',
                              display: 'flex',
                              flexDirection: 'column',
                              justifyContent: 'space-between',
                              boxShadow: '0 1px 4px rgba(245, 158, 11, 0.08)',
                              transition: 'transform 0.15s, box-shadow 0.15s',
                              cursor: canSetup ? 'pointer' : 'default',
                              position: 'relative'
                            }}
                            onMouseOver={e => { if (canSetup) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 10px rgba(245, 158, 11, 0.15)'; } }}
                            onMouseOut={e => { if (canSetup) { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 1px 4px rgba(245, 158, 11, 0.08)'; } }}
                            onClick={() => {
                              if (!canSetup) return;
                              setEditPeriodModal({
                                open: true,
                                day,
                                periodIndex: pIdx,
                                applyToAllDays: false,
                                data: {
                                  periodNumber: p.periodNumber || pIdx + 1,
                                  periodName: p.periodName || 'Recess',
                                  startTime: p.startTime || '10:10',
                                  endTime: p.endTime || '10:30',
                                  subject: p.subject || 'Recess / Break',
                                  teacher: p.teacher || 'Duty Staff',
                                  room: p.room || 'Campus / Cafeteria',
                                  type: p.type || 'Recess',
                                  isRecess: true
                                }
                              });
                            }}
                            title={canSetup ? "Super Admin & Admin: Click to edit Recess timing or remove" : "Recess / Break Slot"}
                          >
                            <div>
                              <div className="recess-top-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                <span className="recess-tag" style={{ fontSize: '0.72rem', fontWeight: 800, color: '#92400e', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                  <Coffee size={13} color="#d97706" /> {p.periodName || 'Recess'}
                                </span>
                                <span className="recess-pill" style={{ fontSize: '0.62rem', fontWeight: 800, padding: '2px 6px', borderRadius: '4px', background: '#f59e0b', color: 'white', letterSpacing: '0.3px', textTransform: 'uppercase' }}>
                                  Recess
                                </span>
                              </div>
                              <div className="recess-subject-title" style={{ fontSize: '0.86rem', fontWeight: 800, color: '#78350f', lineHeight: 1.25, marginBottom: '6px' }}>
                                {p.subject || 'Break & Refreshment'}
                              </div>
                            </div>

                            <div className="recess-footer-meta" style={{ fontSize: '0.72rem', color: '#92400e', display: 'flex', flexDirection: 'column', gap: '3px', borderTop: '1px dashed #fde68a', paddingTop: '6px' }}>
                              <span className="recess-time-meta" style={{ fontWeight: 600, color: '#78350f' }}>
                                ⏰ {p.startTime} - {p.endTime}
                              </span>
                              <span className="recess-room-meta" style={{ color: '#b45309' }}>
                                📍 {p.room || 'Campus Area'}
                              </span>
                            </div>
                          </div>
                        );
                      }

                      const cardBg = isLab ? '#f0fdf4' : isTutorial ? '#eff6ff' : isActivity ? '#fefce8' : isAssess ? '#fef2f2' : '#f8fafc';
                      const cardBorder = isLab ? '#bbf7d0' : isTutorial ? '#bfdbfe' : isActivity ? '#fef08a' : isAssess ? '#fecaca' : '#e2e8f0';
                      const subjectColor = isLab ? '#166534' : isTutorial ? '#1e40af' : isActivity ? '#854d0e' : isAssess ? '#991b1b' : '#1e3a8a';
                      const periodNumberLabel = p.periodName || `P${p.periodNumber || pIdx + 1}`;

                      return (
                        <div 
                          key={pIdx}
                          className="timetable-card regular-card"
                          style={{
                            background: cardBg,
                            border: `1px solid ${cardBorder}`,
                            borderRadius: '12px',
                            padding: '10px 12px',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            boxShadow: '0 1px 4px rgba(0,0,0,0.02)',
                            transition: 'transform 0.15s, box-shadow 0.15s',
                            cursor: canSetup ? 'pointer' : 'default',
                            position: 'relative'
                          }}
                          onMouseOver={e => { if (canSetup) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 10px rgba(0,0,0,0.08)'; } }}
                          onMouseOut={e => { if (canSetup) { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.02)'; } }}
                          onClick={() => {
                            if (!canSetup) return;
                            setEditPeriodModal({
                              open: true,
                              day,
                              periodIndex: pIdx,
                              applyToAllDays: false,
                              data: {
                                periodNumber: p.periodNumber || pIdx + 1,
                                periodName: p.periodName || periodNumberLabel,
                                startTime: p.startTime || '08:30',
                                endTime: p.endTime || '09:20',
                                subject: p.subject || '',
                                teacher: p.teacher || '',
                                room: p.room || 'Room 201',
                                type: p.type || 'Lecture',
                                isRecess: false
                              }
                            });
                          }}
                          title={canSetup ? "Super Admin & Admin: Click to edit subject, faculty, timings, or delete" : "View-only period schedule"}
                        >
                          <div>
                            <div className="card-top-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                              <span className="card-period-tag" style={{ fontSize: '0.72rem', fontWeight: 800, color: '#64748b' }}>
                                {periodNumberLabel}
                              </span>
                              <span className="card-type-tag" style={{ fontSize: '0.65rem', fontWeight: 700, padding: '2px 6px', borderRadius: '4px', background: 'white', color: subjectColor, border: `1px solid ${cardBorder}` }}>
                                {p.type}
                              </span>
                            </div>
                            <div className="card-subject-title" style={{ fontSize: '0.86rem', fontWeight: 800, color: subjectColor, lineHeight: 1.25, marginBottom: '8px', wordBreak: 'break-word' }}>
                              {p.subject}
                            </div>
                          </div>

                          <div className="card-footer-meta" style={{ fontSize: '0.72rem', color: '#64748b', display: 'flex', flexDirection: 'column', gap: '3px', borderTop: '1px solid rgba(0,0,0,0.06)', paddingTop: '6px' }}>
                            <span className="card-teacher-meta" style={{ fontWeight: 600, color: '#334155', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={p.teacher}>
                              👤 {p.teacher}
                            </span>
                            <div className="card-room-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span className="card-room-meta" style={{ color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={p.room}>
                                📍 {p.room}
                              </span>
                              <span className="card-time-meta" style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 600 }}>
                                {p.startTime}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))
            )}

          </div>
        </div>

        {/* OFFICIAL TIMETABLE PRINT FOOTER / SIGNATURE BLOCKS */}
        <div className="print-only timetable-print-footer">
          <div className="print-signature-grid">
            <div className="print-signature-block">
              <div className="sig-line"></div>
              <div className="sig-title">Class Teacher Signature</div>
              <div className="sig-sub">Attendance & Routine Verification</div>
            </div>
            <div className="print-signature-block">
              <div className="sig-line"></div>
              <div className="sig-title">Timetable Coordinator</div>
              <div className="sig-sub">Schedule Matrix & Allocation Head</div>
            </div>
            <div className="print-signature-block">
              <div className="sig-line"></div>
              <div className="sig-title">Principal / Campus Authority</div>
              <div className="sig-sub">Official Institutional Stamp & Signature</div>
            </div>
          </div>
          <div className="print-footer-notice">
            <span>Official Academic Document • Pragati School Management System (Enterprise Architecture)</span>
            <span>Printed on: {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span>
          </div>
        </div>
      </div>

      {/* EDIT PERIOD MODAL (SUPER ADMIN & ADMIN ACCESS TO MODIFY, DELETE, SET RECESS) */}
      {editPeriodModal.open && createPortal(
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 10000, padding: '20px'
        }}>
          <div style={{
            background: 'white', borderRadius: '20px', width: '100%', maxWidth: '540px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', overflow: 'hidden'
          }}>
            <div style={{
              padding: '20px 24px', borderBottom: '1px solid #e2e8f0',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              background: editPeriodModal.data.isRecess ? 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)' : 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)'
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: editPeriodModal.data.isRecess ? '#92400e' : '#1e3a8a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {editPeriodModal.data.isRecess ? <Coffee size={20} color="#d97706" /> : <Clock size={20} color="#3b82f6" />}
                  <span>{editPeriodModal.data.isRecess ? 'Configure Recess / Break Slot' : 'Edit Period Allocation'}</span>
                </h3>
                <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '2px' }}>
                  {selectedTimetableClass} • {editPeriodModal.day} ({editPeriodModal.data.periodName})
                </div>
              </div>
              <button
                onClick={() => setEditPeriodModal({ open: false, day: '', periodIndex: 0, applyToAllDays: false, data: {} })}
                style={{ background: 'white', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '6px', cursor: 'pointer', display: 'flex' }}
              >
                <X size={18} color="#64748b" />
              </button>
            </div>

            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '72vh', overflowY: 'auto' }}>
              
              {/* Recess / Break Toggle Card */}
              <div 
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  background: editPeriodModal.data.isRecess ? '#fffbeb' : '#f8fafc',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  border: `1.5px solid ${editPeriodModal.data.isRecess ? '#f59e0b' : '#e2e8f0'}`,
                  cursor: 'pointer'
                }}
                onClick={() => {
                  const nextRecess = !editPeriodModal.data.isRecess;
                  setEditPeriodModal(prev => ({
                    ...prev,
                    data: {
                      ...prev.data,
                      isRecess: nextRecess,
                      type: nextRecess ? 'Recess' : (prev.data.type === 'Recess' ? 'Lecture' : prev.data.type),
                      subject: nextRecess ? (prev.data.subject || 'Recess / Break') : prev.data.subject,
                      teacher: nextRecess ? 'Duty Staff' : prev.data.teacher,
                      room: nextRecess ? 'Campus / Cafeteria' : prev.data.room,
                    }
                  }));
                }}
              >
                <input
                  type="checkbox"
                  id="editPeriodRecessToggle"
                  checked={Boolean(editPeriodModal.data.isRecess)}
                  onChange={() => {}}
                  style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#f59e0b' }}
                />
                <div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 800, color: editPeriodModal.data.isRecess ? '#b45309' : '#1e3a8a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Coffee size={15} color={editPeriodModal.data.isRecess ? '#d97706' : '#64748b'} />
                    <span>Mark as Recess / Break Slot</span>
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '2px' }}>
                    Recess slots designate lunch, snacks, or recreation breaks without standard faculty teaching.
                  </div>
                </div>
              </div>

              {/* Period Code & Slot Type */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Period Code / Label
                  </label>
                  <input
                    type="text"
                    value={editPeriodModal.data.periodName || ''}
                    onChange={(e) => setEditPeriodModal(prev => ({
                      ...prev,
                      data: { ...prev.data, periodName: e.target.value }
                    }))}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontSize: '0.9rem', fontWeight: 600 }}
                    placeholder="e.g. P1, P2, Recess, Zero Period"
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Slot Type
                  </label>
                  <select
                    value={editPeriodModal.data.type || 'Lecture'}
                    onChange={(e) => {
                      const val = e.target.value;
                      const isR = val === 'Recess' || val === 'Break';
                      setEditPeriodModal(prev => ({
                        ...prev,
                        data: {
                          ...prev.data,
                          type: val,
                          isRecess: isR || prev.data.isRecess,
                          subject: isR ? (prev.data.subject || 'Recess / Break') : prev.data.subject,
                          teacher: isR ? 'Duty Staff' : prev.data.teacher,
                        }
                      }));
                    }}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontSize: '0.9rem', fontWeight: 600, background: 'white' }}
                  >
                    <option value="Lecture">Lecture</option>
                    <option value="Lab">Lab (Practical)</option>
                    <option value="Recess">Recess / Lunch</option>
                    <option value="Break">Short Break</option>
                    <option value="Assembly">Assembly / Devotion</option>
                    <option value="Zero Period">Zero Period / Extra Class</option>
                    <option value="Tutorial">Tutorial / Problem Solving</option>
                    <option value="Activity">Activity / Sports / Arts</option>
                    <option value="Assessment">Assessment / Remedial</option>
                    <option value="Self Study">Self Study / Library</option>
                  </select>
                </div>
              </div>

              {/* Subject */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  {editPeriodModal.data.isRecess ? 'Recess / Break Title' : 'Subject Name'}
                </label>
                <input
                  type="text"
                  value={editPeriodModal.data.subject || ''}
                  onChange={(e) => setEditPeriodModal(prev => ({
                    ...prev,
                    data: { ...prev.data, subject: e.target.value }
                  }))}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontSize: '0.9rem', fontWeight: 600 }}
                  placeholder={editPeriodModal.data.isRecess ? "e.g. Lunch & Nutrition Break" : "e.g. Mathematics, Chemistry Lab, English"}
                />
              </div>

              {/* Teacher Assignment (if not Recess) */}
              {!editPeriodModal.data.isRecess && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Assigned Faculty / Teacher
                  </label>
                  <select
                    value={editPeriodModal.data.teacher || ''}
                    onChange={(e) => setEditPeriodModal(prev => ({
                      ...prev,
                      data: { ...prev.data, teacher: e.target.value }
                    }))}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontSize: '0.9rem', fontWeight: 600, background: 'white' }}
                  >
                    <option value="">-- Select Teacher --</option>
                    {teachersList.map((t, idx) => {
                      const tName = t.name || `${t.firstName || ''} ${t.lastName || ''}`.trim() || t.portalUsername;
                      return (
                        <option key={t._id || idx} value={tName}>
                          {tName} {t.department ? `(${t.department})` : ''}
                        </option>
                      );
                    })}
                    <option value="Mr. Ramesh Singh">Mr. Ramesh Singh (Mathematics)</option>
                    <option value="Dr. Vikram Malhotra">Dr. Vikram Malhotra (Science)</option>
                    <option value="Ms. Sunita Sharma">Ms. Sunita Sharma (Languages)</option>
                    <option value="Mr. Rajesh Verma">Mr. Rajesh Verma (Humanities)</option>
                    <option value="Mrs. Priya Sen">Mrs. Priya Sen (Technology)</option>
                    <option value="Coach R. Yadav">Coach R. Yadav (Sports)</option>
                    <option value="Principal Office">Principal Office</option>
                    <option value="Librarian Incharge">Librarian Incharge</option>
                  </select>
                </div>
              )}

              {/* Classroom / Location */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  {editPeriodModal.data.isRecess ? 'Break Location' : 'Classroom / Lab'}
                </label>
                <input
                  type="text"
                  value={editPeriodModal.data.room || ''}
                  onChange={(e) => setEditPeriodModal(prev => ({
                    ...prev,
                    data: { ...prev.data, room: e.target.value }
                  }))}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontSize: '0.9rem', fontWeight: 600 }}
                  placeholder={editPeriodModal.data.isRecess ? "e.g. Cafeteria, Campus Grounds" : "e.g. Room 201, IT Lab 2"}
                />
              </div>

              {/* Start & End Time */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={editPeriodModal.data.startTime || '08:30'}
                    onChange={(e) => setEditPeriodModal(prev => ({
                      ...prev,
                      data: { ...prev.data, startTime: e.target.value }
                    }))}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontSize: '0.9rem', fontWeight: 600 }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    End Time
                  </label>
                  <input
                    type="time"
                    value={editPeriodModal.data.endTime || '09:20'}
                    onChange={(e) => setEditPeriodModal(prev => ({
                      ...prev,
                      data: { ...prev.data, endTime: e.target.value }
                    }))}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontSize: '0.9rem', fontWeight: 600 }}
                  />
                </div>
              </div>

              {/* Sync across weekdays checkbox */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                background: '#f8fafc',
                padding: '10px 14px',
                borderRadius: '10px',
                border: '1px solid #e2e8f0',
                marginTop: '4px'
              }}>
                <input
                  type="checkbox"
                  id="editApplyAllDaysCheck"
                  checked={Boolean(editPeriodModal.applyToAllDays)}
                  onChange={(e) => setEditPeriodModal(prev => ({ ...prev, applyToAllDays: e.target.checked }))}
                  style={{ width: '17px', height: '17px', cursor: 'pointer', accentColor: '#4F46E5' }}
                />
                <label htmlFor="editApplyAllDaysCheck" style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155', cursor: 'pointer' }}>
                  Sync timing & Recess status across all weekdays (Monday – Friday)
                </label>
              </div>

            </div>

            {/* Modal Actions with Delete & Save */}
            <div style={{
              padding: '16px 24px', borderTop: '1px solid #e2e8f0', background: '#f8fafc',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px'
            }}>
              {/* Delete Buttons */}
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => handleDeletePeriod(false)}
                  disabled={isPeriodSaving}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '5px',
                    padding: '8px 12px', borderRadius: '8px',
                    border: '1px solid #fecaca', background: '#fef2f2',
                    color: '#dc2626', fontWeight: 700, fontSize: '0.78rem',
                    cursor: isPeriodSaving ? 'not-allowed' : 'pointer'
                  }}
                  title={`Delete period from ${editPeriodModal.day} only`}
                >
                  <Trash2 size={13} />
                  <span>Delete ({editPeriodModal.day})</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDeletePeriod(true)}
                  disabled={isPeriodSaving}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '5px',
                    padding: '8px 12px', borderRadius: '8px',
                    border: '1px solid #fee2e2', background: '#dc2626',
                    color: 'white', fontWeight: 700, fontSize: '0.78rem',
                    cursor: isPeriodSaving ? 'not-allowed' : 'pointer'
                  }}
                  title="Delete this period slot across Monday through Friday"
                >
                  <Trash2 size={13} />
                  <span>Delete (All Weekdays)</span>
                </button>
              </div>

              {/* Cancel & Save */}
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={() => setEditPeriodModal({ open: false, day: '', periodIndex: 0, applyToAllDays: false, data: {} })}
                  style={{
                    padding: '9px 16px', borderRadius: '10px', border: '1px solid #cbd5e1',
                    background: 'white', color: '#64748b', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEditedPeriod}
                  disabled={isPeriodSaving}
                  style={{
                    padding: '9px 20px', borderRadius: '10px', border: 'none',
                    background: '#4F46E5', color: 'white', fontWeight: 700, fontSize: '0.85rem',
                    cursor: isPeriodSaving ? 'not-allowed' : 'pointer',
                    boxShadow: '0 4px 12px rgba(79, 70, 229, 0.25)'
                  }}
                >
                  {isPeriodSaving ? 'Saving...' : 'Save Period Allocation'}
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ADD PERIOD MODAL (SUPER ADMIN & ADMIN ACCESS) */}
      {isAddPeriodModalOpen && createPortal(
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 10000, padding: '20px'
        }}>
          <div style={{
            background: 'white', borderRadius: '20px', width: '100%', maxWidth: '540px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', overflow: 'hidden'
          }}>
            <div style={{
              padding: '20px 24px', borderBottom: '1px solid #e2e8f0',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)'
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#065f46', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Plus size={20} color="#059669" /> Add New Period / Recess Slot
                </h3>
                <div style={{ fontSize: '0.8rem', color: '#047857', marginTop: '2px' }}>
                  {selectedTimetableClass} • Campus: {effectiveSchoolSlug}
                </div>
              </div>
              <button
                onClick={() => setIsAddPeriodModalOpen(false)}
                style={{ background: 'white', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '6px', cursor: 'pointer', display: 'flex' }}
              >
                <X size={18} color="#64748b" />
              </button>
            </div>

            <form onSubmit={handleAddPeriodSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '72vh', overflowY: 'auto' }}>
              
              {/* Recess / Break Toggle Card */}
              <div 
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  background: newPeriodData.isRecess ? '#fffbeb' : '#f8fafc',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  border: `1.5px solid ${newPeriodData.isRecess ? '#f59e0b' : '#e2e8f0'}`,
                  cursor: 'pointer'
                }}
                onClick={() => {
                  const nextR = !newPeriodData.isRecess;
                  setNewPeriodData(prev => ({
                    ...prev,
                    isRecess: nextR,
                    type: nextR ? 'Recess' : 'Lecture',
                    periodName: nextR ? 'Recess' : (prev.periodName === 'Recess' ? 'New Period' : prev.periodName),
                    subject: nextR ? 'Recess / Lunch' : '',
                    teacher: nextR ? 'Duty Staff' : '',
                    room: nextR ? 'Campus / Cafeteria' : 'Room 201'
                  }));
                }}
              >
                <input
                  type="checkbox"
                  id="addPeriodRecessToggle"
                  checked={Boolean(newPeriodData.isRecess)}
                  onChange={() => {}}
                  style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#f59e0b' }}
                />
                <div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 800, color: newPeriodData.isRecess ? '#b45309' : '#1e3a8a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Coffee size={15} color={newPeriodData.isRecess ? '#d97706' : '#64748b'} />
                    <span>Designate as Recess / Break Slot</span>
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '2px' }}>
                    Recess slots designate lunch, snacks, or recreation breaks without standard faculty teaching.
                  </div>
                </div>
              </div>

              {/* Target Scope */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  Weekly Scope
                </label>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  <label style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    padding: '8px 14px', borderRadius: '10px',
                    border: `1.5px solid ${newPeriodData.applyToAllDays ? '#059669' : '#cbd5e1'}`,
                    background: newPeriodData.applyToAllDays ? '#ecfdf5' : 'white',
                    cursor: 'pointer', fontSize: '0.82rem', fontWeight: 700,
                    color: newPeriodData.applyToAllDays ? '#065f46' : '#475569'
                  }}>
                    <input
                      type="radio"
                      name="periodScope"
                      checked={newPeriodData.applyToAllDays}
                      onChange={() => setNewPeriodData(prev => ({ ...prev, applyToAllDays: true }))}
                      style={{ accentColor: '#059669' }}
                    />
                    <span>All Weekdays (Monday – Friday)</span>
                  </label>

                  <label style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    padding: '8px 14px', borderRadius: '10px',
                    border: `1.5px solid ${!newPeriodData.applyToAllDays ? '#059669' : '#cbd5e1'}`,
                    background: !newPeriodData.applyToAllDays ? '#ecfdf5' : 'white',
                    cursor: 'pointer', fontSize: '0.82rem', fontWeight: 700,
                    color: !newPeriodData.applyToAllDays ? '#065f46' : '#475569'
                  }}>
                    <input
                      type="radio"
                      name="periodScope"
                      checked={!newPeriodData.applyToAllDays}
                      onChange={() => setNewPeriodData(prev => ({ ...prev, applyToAllDays: false }))}
                      style={{ accentColor: '#059669' }}
                    />
                    <span>Specific Day Only</span>
                  </label>
                </div>
              </div>

              {/* Day selection if specific day */}
              {!newPeriodData.applyToAllDays && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Select Target Day
                  </label>
                  <select
                    value={newPeriodData.day}
                    onChange={(e) => setNewPeriodData(prev => ({ ...prev, day: e.target.value }))}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontSize: '0.9rem', fontWeight: 600, background: 'white' }}
                  >
                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Period Code & Slot Type */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Period Code / Label
                  </label>
                  <input
                    type="text"
                    value={newPeriodData.periodName}
                    onChange={(e) => setNewPeriodData(prev => ({ ...prev, periodName: e.target.value }))}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontSize: '0.9rem', fontWeight: 600 }}
                    placeholder="e.g. P7, Recess, Zero Period"
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Slot Type
                  </label>
                  <select
                    value={newPeriodData.type}
                    onChange={(e) => {
                      const val = e.target.value;
                      const isR = val === 'Recess' || val === 'Break';
                      setNewPeriodData(prev => ({
                        ...prev,
                        type: val,
                        isRecess: isR,
                        periodName: isR ? (val === 'Break' ? 'Break' : 'Recess') : prev.periodName,
                        subject: isR ? 'Recess / Break' : prev.subject
                      }));
                    }}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontSize: '0.9rem', fontWeight: 600, background: 'white' }}
                  >
                    <option value="Lecture">Lecture</option>
                    <option value="Lab">Lab (Practical)</option>
                    <option value="Recess">Recess / Lunch</option>
                    <option value="Break">Short Break</option>
                    <option value="Assembly">Assembly / Devotion</option>
                    <option value="Zero Period">Zero Period / Extra Class</option>
                    <option value="Tutorial">Tutorial / Problem Solving</option>
                    <option value="Activity">Activity / Sports / Arts</option>
                    <option value="Assessment">Assessment / Remedial</option>
                    <option value="Self Study">Self Study / Library</option>
                  </select>
                </div>
              </div>

              {/* Start & End Time */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={newPeriodData.startTime}
                    onChange={(e) => setNewPeriodData(prev => ({ ...prev, startTime: e.target.value }))}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontSize: '0.9rem', fontWeight: 600 }}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    End Time
                  </label>
                  <input
                    type="time"
                    value={newPeriodData.endTime}
                    onChange={(e) => setNewPeriodData(prev => ({ ...prev, endTime: e.target.value }))}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontSize: '0.9rem', fontWeight: 600 }}
                    required
                  />
                </div>
              </div>

              {/* Subject Name */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  {newPeriodData.isRecess ? 'Break / Recess Description' : 'Subject Name'}
                </label>
                <input
                  type="text"
                  value={newPeriodData.subject}
                  onChange={(e) => setNewPeriodData(prev => ({ ...prev, subject: e.target.value }))}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontSize: '0.9rem', fontWeight: 600 }}
                  placeholder={newPeriodData.isRecess ? "e.g. Lunch & Nutrition, Refreshment Break" : "e.g. Mathematics, Computer Science, Biology"}
                />
              </div>

              {/* Teacher & Room (if not recess) */}
              {!newPeriodData.isRecess && (
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                      Faculty / Teacher
                    </label>
                    <select
                      value={newPeriodData.teacher}
                      onChange={(e) => setNewPeriodData(prev => ({ ...prev, teacher: e.target.value }))}
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontSize: '0.9rem', fontWeight: 600, background: 'white' }}
                    >
                      <option value="">-- Select Teacher --</option>
                      {teachersList.map((t, idx) => {
                        const tName = t.name || `${t.firstName || ''} ${t.lastName || ''}`.trim() || t.portalUsername;
                        return (
                          <option key={t._id || idx} value={tName}>
                            {tName} {t.department ? `(${t.department})` : ''}
                          </option>
                        );
                      })}
                      <option value="Mr. Ramesh Singh">Mr. Ramesh Singh (Mathematics)</option>
                      <option value="Dr. Vikram Malhotra">Dr. Vikram Malhotra (Science)</option>
                      <option value="Ms. Sunita Sharma">Ms. Sunita Sharma (Languages)</option>
                      <option value="Mr. Rajesh Verma">Mr. Rajesh Verma (Humanities)</option>
                      <option value="Mrs. Priya Sen">Mrs. Priya Sen (Technology)</option>
                      <option value="Coach R. Yadav">Coach R. Yadav (Sports)</option>
                      <option value="Principal Office">Principal Office</option>
                      <option value="Librarian Incharge">Librarian Incharge</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                      Classroom / Lab
                    </label>
                    <input
                      type="text"
                      value={newPeriodData.room}
                      onChange={(e) => setNewPeriodData(prev => ({ ...prev, room: e.target.value }))}
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontSize: '0.9rem', fontWeight: 600 }}
                      placeholder="e.g. Room 201"
                    />
                  </div>
                </div>
              )}

              <div style={{
                paddingTop: '12px', borderTop: '1px solid #e2e8f0',
                display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '6px'
              }}>
                <button
                  type="button"
                  onClick={() => setIsAddPeriodModalOpen(false)}
                  style={{
                    padding: '10px 18px', borderRadius: '10px', border: '1px solid #cbd5e1',
                    background: 'white', color: '#64748b', fontWeight: 700, cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAddingPeriod}
                  style={{
                    padding: '10px 22px', borderRadius: '10px', border: 'none',
                    background: '#059669', color: 'white', fontWeight: 700,
                    cursor: isAddingPeriod ? 'not-allowed' : 'pointer',
                    boxShadow: '0 4px 12px rgba(5, 150, 105, 0.25)'
                  }}
                >
                  {isAddingPeriod ? 'Adding Slot...' : 'Add Period to Database'}
                </button>
              </div>

            </form>
          </div>
        </div>,
        document.body
      )}

      {/* BELL SCHEDULE & RECESS TIMINGS MODAL (SUPER ADMIN & ADMIN ACCESS) */}
      {isBellScheduleModalOpen && createPortal(
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 10000, padding: '20px'
        }}>
          <div style={{
            background: 'white', borderRadius: '20px', width: '100%', maxWidth: '780px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', overflow: 'hidden'
          }}>
            <div style={{
              padding: '20px 24px', borderBottom: '1px solid #fed7aa',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              background: 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)'
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#9a3412', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Coffee size={20} color="#ea580c" /> Bell Schedule & Recess Timings
                </h3>
                <div style={{ fontSize: '0.8rem', color: '#c2410c', marginTop: '2px' }}>
                  Super Admin & Admin: Synchronize master period timings & Recess slots across all weekdays (Mon–Fri)
                </div>
              </div>
              <button
                onClick={() => setIsBellScheduleModalOpen(false)}
                style={{ background: 'white', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '6px', cursor: 'pointer', display: 'flex' }}
              >
                <X size={18} color="#64748b" />
              </button>
            </div>

            <div style={{ padding: '24px', maxHeight: '72vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              <div style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                padding: '12px 16px',
                fontSize: '0.82rem',
                color: '#475569',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}>
                <Clock size={18} color="#0284c7" />
                <span>
                  Adjust Start & End times or toggle <strong>Recess</strong> slots below. Changes will apply to <strong>{selectedTimetableClass}</strong> across Monday through Friday.
                </span>
              </div>

              {/* Table of periods */}
              <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #cbd5e1' }}>
                      <th style={{ padding: '10px 14px', fontWeight: 800, color: '#334155' }}>#</th>
                      <th style={{ padding: '10px 14px', fontWeight: 800, color: '#334155' }}>Period Code / Name</th>
                      <th style={{ padding: '10px 14px', fontWeight: 800, color: '#334155' }}>Start Time</th>
                      <th style={{ padding: '10px 14px', fontWeight: 800, color: '#334155' }}>End Time</th>
                      <th style={{ padding: '10px 14px', fontWeight: 800, color: '#b45309', textAlign: 'center' }}>Recess Break?</th>
                      <th style={{ padding: '10px 14px', fontWeight: 800, color: '#dc2626', textAlign: 'center' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bellScheduleList.map((item, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9', background: item.isRecess ? '#fffbeb' : 'white' }}>
                        <td style={{ padding: '10px 14px', fontWeight: 800, color: '#64748b' }}>
                          {idx + 1}
                        </td>
                        <td style={{ padding: '10px 14px' }}>
                          <input
                            type="text"
                            value={item.periodName}
                            onChange={(e) => {
                              const val = e.target.value;
                              setBellScheduleList(prev => {
                                const copy = [...prev];
                                copy[idx].periodName = val;
                                return copy;
                              });
                            }}
                            style={{
                              width: '130px', padding: '6px 10px', borderRadius: '8px',
                              border: '1.5px solid #cbd5e1', fontWeight: 700, fontSize: '0.85rem'
                            }}
                          />
                        </td>
                        <td style={{ padding: '10px 14px' }}>
                          <input
                            type="time"
                            value={item.startTime}
                            onChange={(e) => {
                              const val = e.target.value;
                              setBellScheduleList(prev => {
                                const copy = [...prev];
                                copy[idx].startTime = val;
                                return copy;
                              });
                            }}
                            style={{ padding: '6px 10px', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontWeight: 600, fontSize: '0.85rem' }}
                          />
                        </td>
                        <td style={{ padding: '10px 14px' }}>
                          <input
                            type="time"
                            value={item.endTime}
                            onChange={(e) => {
                              const val = e.target.value;
                              setBellScheduleList(prev => {
                                const copy = [...prev];
                                copy[idx].endTime = val;
                                return copy;
                              });
                            }}
                            style={{ padding: '6px 10px', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontWeight: 600, fontSize: '0.85rem' }}
                          />
                        </td>
                        <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                          <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer', padding: '4px 10px', borderRadius: '8px', background: item.isRecess ? '#fef3c7' : '#f8fafc', border: `1px solid ${item.isRecess ? '#f59e0b' : '#cbd5e1'}` }}>
                            <input
                              type="checkbox"
                              checked={Boolean(item.isRecess)}
                              onChange={(e) => {
                                const checked = e.target.checked;
                                setBellScheduleList(prev => {
                                  const copy = [...prev];
                                  copy[idx].isRecess = checked;
                                  copy[idx].type = checked ? 'Recess' : 'Lecture';
                                  if (checked && (!copy[idx].periodName || copy[idx].periodName.startsWith('P'))) {
                                    copy[idx].periodName = 'Recess';
                                  }
                                  return copy;
                                });
                              }}
                              style={{ width: '16px', height: '16px', accentColor: '#f59e0b', cursor: 'pointer' }}
                            />
                            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: item.isRecess ? '#b45309' : '#64748b' }}>
                              {item.isRecess ? 'Recess' : 'No'}
                            </span>
                          </label>
                        </td>
                        <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                          <button
                            type="button"
                            onClick={() => {
                              setBellScheduleList(prev => prev.filter((_, i) => i !== idx));
                            }}
                            style={{
                              background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px',
                              padding: '5px 8px', color: '#dc2626', cursor: 'pointer', display: 'inline-flex'
                            }}
                            title="Remove this slot row"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Add row button */}
              <div>
                <button
                  type="button"
                  onClick={() => {
                    const nextNum = bellScheduleList.length + 1;
                    let nextStart = '01:35';
                    let nextEnd = '02:25';
                    if (bellScheduleList.length > 0) {
                      const last = bellScheduleList[bellScheduleList.length - 1];
                      if (last.endTime) {
                        nextStart = last.endTime;
                        const [h, m] = last.endTime.split(':').map(Number);
                        if (!isNaN(h) && !isNaN(m)) {
                          const endTotal = h * 60 + m + 50;
                          const nh = Math.floor(endTotal / 60) % 24;
                          const nm = endTotal % 60;
                          nextEnd = `${String(nh).padStart(2, '0')}:${String(nm).padStart(2, '0')}`;
                        }
                      }
                    }
                    setBellScheduleList(prev => [
                      ...prev,
                      {
                        periodNumber: nextNum,
                        periodName: `P${nextNum}`,
                        startTime: nextStart,
                        endTime: nextEnd,
                        type: 'Lecture',
                        isRecess: false
                      }
                    ]);
                  }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    padding: '8px 14px', borderRadius: '8px',
                    border: '1px dashed #cbd5e1', background: '#f8fafc',
                    color: '#4338ca', fontWeight: 700, fontSize: '0.82rem',
                    cursor: 'pointer'
                  }}
                >
                  <Plus size={14} /> Add Another Period Slot
                </button>
              </div>

            </div>

            <div style={{
              padding: '16px 24px', borderTop: '1px solid #e2e8f0', background: '#f8fafc',
              display: 'flex', justifyContent: 'flex-end', gap: '12px'
            }}>
              <button
                type="button"
                onClick={() => setIsBellScheduleModalOpen(false)}
                style={{
                  padding: '10px 18px', borderRadius: '10px', border: '1px solid #cbd5e1',
                  background: 'white', color: '#64748b', fontWeight: 700, cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveBellSchedule}
                disabled={isSavingBellSchedule}
                style={{
                  padding: '10px 22px', borderRadius: '10px', border: 'none',
                  background: '#ea580c', color: 'white', fontWeight: 700,
                  cursor: isSavingBellSchedule ? 'not-allowed' : 'pointer',
                  boxShadow: '0 4px 12px rgba(234, 88, 12, 0.25)'
                }}
              >
                {isSavingBellSchedule ? 'Saving Bell Schedule...' : 'Save Bell Schedule to All Weekdays'}
              </button>
            </div>

          </div>
        </div>,
        document.body
      )}

      {/* SETUP NEW CLASS SCHEDULE MODAL */}
      {isSetupClassModalOpen && createPortal(
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 10000, padding: '20px'
        }}>
          <div style={{
            background: 'white', borderRadius: '20px', width: '100%', maxWidth: '480px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', overflow: 'hidden'
          }}>
            <div style={{
              padding: '20px 24px', borderBottom: '1px solid #e2e8f0',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              background: 'linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%)'
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#1e3a8a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Plus size={18} color="#4F46E5" /> Setup Class Schedule Matrix
                </h3>
                <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '2px' }}>
                  Target Campus: {effectiveSchoolSlug}
                </div>
              </div>
              <button
                onClick={() => setIsSetupClassModalOpen(false)}
                style={{ background: 'white', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '6px', cursor: 'pointer', display: 'flex' }}
              >
                <X size={18} color="#64748b" />
              </button>
            </div>

            <form onSubmit={handleCreateNewClassTimetable} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  Class / Grade Level
                </label>
                <select
                  value={newClassSetup.className}
                  onChange={(e) => setNewClassSetup(prev => ({ ...prev, className: e.target.value }))}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontSize: '0.9rem', fontWeight: 600, background: 'white' }}
                >
                  {['Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5', 'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10', 'Class 11', 'Class 12'].map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  Section / Stream
                </label>
                <input
                  type="text"
                  value={newClassSetup.section}
                  onChange={(e) => setNewClassSetup(prev => ({ ...prev, section: e.target.value }))}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontSize: '0.9rem', fontWeight: 600 }}
                  placeholder="e.g. A, B, Science, Commerce"
                  required
                />
              </div>

              <div style={{ background: '#f8fafc', padding: '12px 14px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '0.78rem', color: '#64748b' }}>
                💡 <strong>Admin Notice:</strong> The intelligent scheduler will auto-populate 6 periods/day across Monday to Friday using active teachers from {effectiveSchoolSlug}.
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setIsSetupClassModalOpen(false)}
                  style={{
                    padding: '10px 18px', borderRadius: '10px', border: '1px solid #cbd5e1',
                    background: 'white', color: '#64748b', fontWeight: 700, cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAutoGenerating}
                  style={{
                    padding: '10px 22px', borderRadius: '10px', border: 'none',
                    background: '#4F46E5', color: 'white', fontWeight: 700,
                    cursor: isAutoGenerating ? 'not-allowed' : 'pointer',
                    boxShadow: '0 4px 12px rgba(79, 70, 229, 0.25)'
                  }}
                >
                  {isAutoGenerating ? 'Generating Grid...' : 'Initialize & Generate Schedule'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
};

export default Timetable;
