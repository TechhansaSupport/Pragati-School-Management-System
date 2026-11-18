import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  CalendarDays, Clock, Users, Building, Building2, ShieldCheck, RefreshCw, 
  FileText, CheckCircle2, AlertTriangle, Award, X, Sparkles, BookOpen, Plus,
  Trash2, Coffee, SlidersHorizontal, Check, LayoutGrid, RotateCcw, Edit3, Grid,
  GraduationCap, Activity, Palette, Dumbbell, Music, Bookmark, Layers, Filter, Printer
} from 'lucide-react';

const API_BASE = 'http://localhost:5000/api';

const COMMON_SUBJECTS = [
  'Mathematics',
  'Science',
  'English',
  'Hindi',
  'Social Science',
  'Physics',
  'Chemistry',
  'Biology',
  'Computer Science',
  'History',
  'Geography',
  'Economics',
  'Physical Education',
  'Art & Craft',
  'Music',
  'Environmental Studies (EVS)',
  'Library',
  'Moral Science',
  'General Knowledge (GK)'
];

// Helper to check if a period slot is a Recess / Break
const isRecessPeriod = (period) => Boolean(
  period && (
    period.isRecess === true ||
    period.type === 'Recess' ||
    period.type === 'Break' ||
    (period.periodName && period.periodName.toLowerCase().trim() === 'recess') ||
    (period.subject && period.subject.toLowerCase().trim().startsWith('recess'))
  )
);

// Helper to count only academic periods (excluding recess / breaks)
const getAcademicPeriodsCount = (periodsList) => {
  if (!Array.isArray(periodsList)) return 0;
  return periodsList.filter(p => !isRecessPeriod(p)).length;
};

// Helper to ensure recess does NOT replace any academic period and is appointed as recess only
const getAcademicPeriodLabel = (period, index, allPeriods) => {
  if (!period) return `P${index + 1}`;
  if (isRecessPeriod(period)) return 'Recess';

  let academicNumber = 1;
  if (Array.isArray(allPeriods)) {
    for (let i = 0; i < index; i++) {
      const p = allPeriods[i];
      if (!isRecessPeriod(p)) {
        academicNumber++;
      }
    }
  } else {
    academicNumber = index + 1;
  }

  if (period.periodName && !/^P\d+$/i.test(period.periodName) && period.periodName !== 'New Period') {
    return period.periodName;
  }
  return `P${academicNumber}`;
};

const Timetable = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const userInfo = JSON.parse(sessionStorage.getItem('userInfo') || '{}');
  const token = userInfo.token || sessionStorage.getItem('token') || '';
  const userRole = (sessionStorage.getItem('userRole') || userInfo.role || 'admin').toLowerCase();
  const tenantSlug = sessionStorage.getItem('tenantSlug') || userInfo.slug || userInfo.tenantSlug || '';

  const isStudent = userRole === 'student';
  const isSuperAdmin = !isStudent && (userRole === 'superadmin' || location.pathname.includes('/superadmin'));
  const isAdmin = !isStudent && userRole === 'admin';
  const isPrincipal = !isStudent && userRole === 'principal';
  const canSetup = !isStudent && (isSuperAdmin || isAdmin || isPrincipal);

  const [studentInfo, setStudentInfo] = useState(null);
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
  
  // Coordinated Class and Section dropdown options
  const effectiveClassesList = useMemo(() => {
    return classesList.length > 0 ? classesList : [
      { className: 'Class 10', section: 'A' },
      { className: 'Class 11', section: 'SCIENCE' },
      { className: 'Class 9', section: 'B' },
      { className: 'Class 8', section: 'A' }
    ];
  }, [classesList]);

  const uniqueClassNames = useMemo(() => {
    const set = new Set();
    effectiveClassesList.forEach(c => {
      if (c?.className) set.add(c.className);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));
  }, [effectiveClassesList]);

  const currentSelectedClassName = useMemo(() => {
    const parts = (selectedTimetableClass || '').split(' - ');
    return parts[0] || (uniqueClassNames[0] || 'Class 10');
  }, [selectedTimetableClass, uniqueClassNames]);

  const currentSelectedSectionName = useMemo(() => {
    const parts = (selectedTimetableClass || '').split(' - ');
    return parts[1] || 'A';
  }, [selectedTimetableClass]);

  const availableSectionsForCurrentClass = useMemo(() => {
    const sections = effectiveClassesList
      .filter(c => String(c.className || '').toLowerCase() === currentSelectedClassName.toLowerCase())
      .map(c => c.section)
      .filter(Boolean);
    const combined = Array.from(new Set(sections.length > 0 ? sections : ['A', 'B', 'C']));
    return combined.sort((a, b) => String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: 'base' }));
  }, [effectiveClassesList, currentSelectedClassName]);
  
  // Master Timetable Structure for ALL Classes Modal State (Super Admin & Admin)
  const [isMasterStructureModalOpen, setIsMasterStructureModalOpen] = useState(false);
  const [isApplyingMasterStructure, setIsApplyingMasterStructure] = useState(false);
  const [masterStructureConfig, setMasterStructureConfig] = useState({
    periodsPerDay: 8,
    startTime: '08:30',
    periodDurationMinutes: 50,
    includeSaturday: false,
    includeRecess: true,
    recessAfterPeriod: 4,
    recessDurationMinutes: 20,
    applyMode: 'blank', // 'blank' | 'sync_times' | 'auto'
    targetClasses: 'all', // 'all' | 'custom'
    selectedClassesList: []
  });

  // Quick Setup Class Modal State
  const [isSetupClassModalOpen, setIsSetupClassModalOpen] = useState(false);
  const [newClassSetup, setNewClassSetup] = useState({
    className: 'Class 6',
    section: 'A',
    academicSession: '2026-2027',
    mode: 'scratch',
    periodsPerDay: 8,
    startTime: '08:30',
    periodDurationMinutes: 50,
    includeSaturday: false,
    includeRecess: true,
    recessAfterPeriod: 4,
    recessDurationMinutes: 20,
    blankSlots: true
  });

  // Reset to Scratch Modal State
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);

  // Class-wise Subjects & Activity Classes Modal State (Restricting AI Matrix Generator)
  const [isClassCurriculumModalOpen, setIsClassCurriculumModalOpen] = useState(false);
  const [curriculumLoading, setCurriculumLoading] = useState(false);
  const [curriculumSaving, setCurriculumSaving] = useState(false);
  const [curriculumClassTarget, setCurriculumClassTarget] = useState({ className: 'Class 10', section: 'A' });
  const [classAcademicSubjects, setClassAcademicSubjects] = useState([]);
  const [classActivityClasses, setClassActivityClasses] = useState([]);
  const [classCurriculumItems, setClassCurriculumItems] = useState([]);
  const [curriculumStaffList, setCurriculumStaffList] = useState([]);
  const [curriculumActiveTab, setCurriculumActiveTab] = useState('ALL'); // 'ALL' | 'ACADEMIC' | 'ACTIVITY'
  const [curriculumFeedback, setCurriculumFeedback] = useState({ type: '', message: '' });
  const [newCurriculumInput, setNewCurriculumInput] = useState({
    name: '',
    type: 'Academic', // 'Academic' | 'Activity' | 'Lab'
    teacher: '',
    room: '',
    periodsPerWeek: 5
  });
  const [resetOptions, setResetOptions] = useState({
    resetType: 'blank_slots', // 'blank_slots' | 'clear_all'
    periodsPerDay: 8,
    startTime: '08:30',
    periodDurationMinutes: 50,
    includeSaturday: false,
    includeRecess: true,
    recessAfterPeriod: 4,
    recessDurationMinutes: 20
  });
  const [isResetting, setIsResetting] = useState(false);

  // Working Days & Off Days State
  const [offDays, setOffDays] = useState(['Sunday']);
  const [isWorkingDaysModalOpen, setIsWorkingDaysModalOpen] = useState(false);
  const [workingDaysDraftOffDays, setWorkingDaysDraftOffDays] = useState(['Sunday']);
  const [isSavingWorkingDays, setIsSavingWorkingDays] = useState(false);

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
      subject: '',
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

  // If user is a student, fetch their specific enrolled class & details and lock timetable
  useEffect(() => {
    if (isStudent) {
      fetch(`${API_BASE}/dashboard/student-summary`, { headers: getAuthHeaders() })
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data) {
            setStudentInfo(data);
            const targetClass = `${data.grade || 'Class 10'} - ${data.section || 'A'}`;
            setSelectedTimetableClass(targetClass);
            fetchLiveTimetable(data.grade || 'Class 10', data.section || 'A');
          }
        })
        .catch(err => console.warn('Student summary fetch error in Timetable:', err));
    }
  }, [isStudent]);

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
          
          // Check URL query parameters for pre-selected class from Academics or navigation
          const searchParams = new URLSearchParams(window.location.search);
          const qClass = searchParams.get('class');
          const qSection = searchParams.get('section');
          const qAction = searchParams.get('action');

          if (qAction === 'master-structure') {
            setIsMasterStructureModalOpen(true);
          }

          let initialClass = '';
          if (qClass) {
            const cleanQClass = qClass.trim().toLowerCase();
            const cleanQSection = (qSection || '').trim().toLowerCase();
            const matched = list.find(c => {
              const fullFormatted = `${c.className} - ${c.section}`.toLowerCase();
              if (cleanQSection) {
                return c.className.toLowerCase() === cleanQClass && c.section.toLowerCase() === cleanQSection;
              }
              return c.className.toLowerCase() === cleanQClass || fullFormatted === cleanQClass;
            });
            if (matched) {
              initialClass = `${matched.className} - ${matched.section}`;
            } else if (cleanQSection) {
              initialClass = `${qClass} - ${qSection}`;
            } else {
              initialClass = qClass;
            }
          } else if (list.length > 0) {
            initialClass = `${list[0].className} - ${list[0].section}`;
          }

          if (!isStudent && initialClass) {
            setSelectedTimetableClass(initialClass);
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
          if (Array.isArray(data.timetable.offDays)) {
            setOffDays(data.timetable.offDays);
          } else {
            const satPeriods = data.timetable.schedule?.Saturday || [];
            setOffDays(satPeriods.length === 0 ? ['Saturday', 'Sunday'] : ['Sunday']);
          }
        } else {
          setTimetableSchedule({});
          setOffDays(['Sunday']);
        }
      }
    } catch (err) {
      console.error('Error fetching timetable from DB:', err);
    } finally {
      setTimetableLoading(false);
    }
  };

  const fetchClassCurriculum = async (targetClass, targetSec) => {
    const cName = targetClass || currentSelectedClassName;
    const sName = targetSec || currentSelectedSectionName;
    if (!cName || !sName) return;

    setCurriculumLoading(true);
    try {
      const slugQuery = effectiveSchoolSlug ? `&schoolSlug=${encodeURIComponent(effectiveSchoolSlug)}` : '';
      const res = await fetch(
        `${API_BASE}/timetable/class-curriculum?className=${encodeURIComponent(cName)}&section=${encodeURIComponent(sName)}${slugQuery}`,
        { headers: getAuthHeaders() }
      );
      if (res.ok) {
        const data = await res.json();
        setClassAcademicSubjects(data.subjects || []);
        setClassActivityClasses(data.activityClasses || []);
        setClassCurriculumItems(data.curriculum || []);
        if (Array.isArray(data.staffList) && data.staffList.length > 0) {
          setCurriculumStaffList(data.staffList);
        }
      }
    } catch (err) {
      console.error('Error fetching class curriculum:', err);
    } finally {
      setCurriculumLoading(false);
    }
  };

  const handleOpenClassCurriculumModal = (cls = null, sec = null) => {
    const targetC = cls || currentSelectedClassName;
    const targetS = sec || currentSelectedSectionName;
    setCurriculumFeedback({ type: '', message: '' });
    setCurriculumClassTarget({ className: targetC, section: targetS });
    fetchClassCurriculum(targetC, targetS);
    setIsClassCurriculumModalOpen(true);
  };

  const handleSaveClassCurriculum = async (autoGenerateImmediately = false) => {
    if (!canSetup) return;
    setCurriculumSaving(true);
    try {
      const { className, section } = curriculumClassTarget;
      const res = await fetch(`${API_BASE}/timetable/class-curriculum`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          className,
          section,
          schoolSlug: effectiveSchoolSlug,
          subjects: classAcademicSubjects,
          activityClasses: classActivityClasses,
          curriculum: classCurriculumItems
        })
      });

      if (res.ok) {
        if (autoGenerateImmediately) {
          setTimetableNotification(`✨ Generating AI Matrix timetable strictly restricted to ${classAcademicSubjects.length} subjects & ${classActivityClasses.length} activity classes...`);
          setIsAutoGenerating(true);
          const genRes = await fetch(`${API_BASE}/timetable/auto-generate`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({
              className,
              section,
              schoolSlug: effectiveSchoolSlug,
              offDays,
              subjects: classAcademicSubjects,
              activityClasses: classActivityClasses,
              curriculum: classCurriculumItems
            })
          });
          if (genRes.ok) {
            const genData = await genRes.json();
            if (genData.timetable?.schedule) {
              setTimetableSchedule(genData.timetable.schedule);
            }
            if (Array.isArray(genData.timetable?.offDays)) {
              setOffDays(genData.timetable.offDays);
            }
            setSelectedTimetableClass(`${className} - ${section}`);
            setTimetableNotification(`🎉 AI Timetable Matrix generated successfully! Strictly includes only the ${classAcademicSubjects.length} subjects and ${classActivityClasses.length} activity classes configured for ${className} - ${section}.`);
            setIsClassCurriculumModalOpen(false);
          } else {
            const err = await genRes.json().catch(() => ({}));
            setTimetableNotification(`⚠️ ${err.message || 'Error auto-generating timetable'}`);
          }
          setIsAutoGenerating(false);
        } else {
          setTimetableNotification(`✅ Class curriculum saved! AI Matrix is now locked to schedule only these ${classAcademicSubjects.length} subjects & ${classActivityClasses.length} activity classes for ${className} - ${section}.`);
          setIsClassCurriculumModalOpen(false);
        }
      } else {
        const err = await res.json().catch(() => ({}));
        setTimetableNotification(`⚠️ ${err.message || 'Failed to save class curriculum'}`);
      }
    } catch (err) {
      setTimetableNotification('⚠️ Network error saving curriculum');
    } finally {
      setCurriculumSaving(false);
      setTimeout(() => setTimetableNotification(''), 5500);
    }
  };

  const showCurriculumFeedback = (type, message) => {
    setCurriculumFeedback({ type, message });
    setTimeout(() => {
      setCurriculumFeedback(prev => (prev.message === message ? { type: '', message: '' } : prev));
    }, 4500);
  };

  const handleAddCurriculumItem = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    const rawName = newCurriculumInput.name || '';
    const name = rawName.trim();
    if (!name) {
      showCurriculumFeedback('error', 'Please enter a subject or activity name (e.g. Mathematics, Robotics, Karate) before clicking Add.');
      const inputEl = document.getElementById('curriculum-subject-input');
      if (inputEl) inputEl.focus();
      return;
    }

    const type = newCurriculumInput.type || 'Academic';
    const isActivity = type === 'Activity';
    const lowerName = name.toLowerCase();

    const existsInAcademic = classAcademicSubjects.some(s => String(s || '').trim().toLowerCase() === lowerName);
    const existsInActivity = classActivityClasses.some(a => String(a || '').trim().toLowerCase() === lowerName);

    if (existsInAcademic || existsInActivity) {
      showCurriculumFeedback('warning', `"${name}" is already included in this class's curriculum as ${existsInAcademic ? 'an Academic Subject' : 'an Activity Class'}.`);
      return;
    }

    if (isActivity) {
      setClassActivityClasses(prev => [...prev, name]);
    } else {
      setClassAcademicSubjects(prev => [...prev, name]);
    }

    setClassCurriculumItems(prev => {
      const filtered = prev.filter(item => String(item.name || '').trim().toLowerCase() !== lowerName);
      return [...filtered, {
        name,
        type,
        teacher: newCurriculumInput.teacher || '',
        room: newCurriculumInput.room || (isActivity ? 'Activity Hall' : 'Room 101'),
        periodsPerWeek: Number(newCurriculumInput.periodsPerWeek) || (isActivity ? 2 : 5)
      }];
    });

    setNewCurriculumInput({
      name: '',
      type,
      teacher: '',
      room: '',
      periodsPerWeek: 5
    });

    showCurriculumFeedback('success', `✓ Added "${name}" (${type}) to ${curriculumClassTarget.className} - Section ${curriculumClassTarget.section}!`);
  };

  const handleQuickAddSubject = (name, type = 'Academic', defaultRoom = '') => {
    const isActivity = type === 'Activity';
    const cleanName = String(name || '').trim();
    const lowerName = cleanName.toLowerCase();

    if (isActivity) {
      if (classActivityClasses.some(a => String(a || '').trim().toLowerCase() === lowerName)) {
        showCurriculumFeedback('warning', `"${cleanName}" is already in this class's activity list.`);
        return;
      }
      setClassActivityClasses(prev => [...prev, cleanName]);
      setClassCurriculumItems(prev => [
        ...prev.filter(i => String(i.name || '').trim().toLowerCase() !== lowerName),
        { name: cleanName, type: 'Activity', teacher: '', room: defaultRoom || 'Activity Hall', periodsPerWeek: 2 }
      ]);
      showCurriculumFeedback('success', `✓ Added "${cleanName}" (Activity)`);
    } else {
      if (classAcademicSubjects.some(s => String(s || '').trim().toLowerCase() === lowerName)) {
        showCurriculumFeedback('warning', `"${cleanName}" is already in this class's subjects list.`);
        return;
      }
      setClassAcademicSubjects(prev => [...prev, cleanName]);
      setClassCurriculumItems(prev => [
        ...prev.filter(i => String(i.name || '').trim().toLowerCase() !== lowerName),
        { name: cleanName, type: type || 'Academic', teacher: '', room: defaultRoom || 'Room 101', periodsPerWeek: 5 }
      ]);
      showCurriculumFeedback('success', `✓ Added "${cleanName}" (Academic)`);
    }
  };

  const handleRemoveAcademicSubject = (subjectName) => {
    const target = String(subjectName || '').trim().toLowerCase();
    setClassAcademicSubjects(prev => prev.filter(s => String(s || '').trim().toLowerCase() !== target));
    setClassCurriculumItems(prev => prev.filter(i => String(i.name || '').trim().toLowerCase() !== target));
    showCurriculumFeedback('warning', `Removed "${subjectName}" from curriculum.`);
  };

  const handleRemoveActivityClass = (activityName) => {
    const target = String(activityName || '').trim().toLowerCase();
    setClassActivityClasses(prev => prev.filter(a => String(a || '').trim().toLowerCase() !== target));
    setClassCurriculumItems(prev => prev.filter(i => String(i.name || '').trim().toLowerCase() !== target));
    showCurriculumFeedback('warning', `Removed "${activityName}" from curriculum.`);
  };

  const handleCurriculumItemTeacherChange = (itemName, teacherName) => {
    setClassCurriculumItems(prev => {
      const exists = prev.some(i => i.name.toLowerCase() === itemName.toLowerCase());
      if (exists) {
        return prev.map(i => i.name.toLowerCase() === itemName.toLowerCase() ? { ...i, teacher: teacherName } : i);
      }
      return [...prev, { name: itemName, type: 'Academic', teacher: teacherName, room: '', periodsPerWeek: 5 }];
    });
  };

  const handleCurriculumItemRoomChange = (itemName, roomName) => {
    setClassCurriculumItems(prev => {
      const exists = prev.some(i => i.name.toLowerCase() === itemName.toLowerCase());
      if (exists) {
        return prev.map(i => i.name.toLowerCase() === itemName.toLowerCase() ? { ...i, room: roomName } : i);
      }
      return [...prev, { name: itemName, type: 'Academic', teacher: '', room: roomName, periodsPerWeek: 5 }];
    });
  };

  useEffect(() => {
    if (selectedTimetableClass) {
      const parts = selectedTimetableClass.split(' - ');
      const className = parts[0] || selectedTimetableClass;
      const section = parts[1] || 'A';
      fetchLiveTimetable(className, section);
      fetchClassCurriculum(className, section);
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

  // Helper to calculate live slots preview for the master structure modal
  const calculateMasterSlotsPreview = (config) => {
    const [startH, startM] = (config.startTime || '08:30').split(':').map(Number);
    let curMins = (isNaN(startH) ? 8 : startH) * 60 + (isNaN(startM) ? 30 : startM);
    const formatTime = (mins) => {
      const h = Math.floor(mins / 60) % 24;
      const m = mins % 60;
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    };
    const count = Number(config.periodsPerDay) || 8;
    const dur = Number(config.periodDurationMinutes) || 50;
    const rDur = Number(config.recessDurationMinutes) || 20;
    const rAfter = Number(config.recessAfterPeriod) || 4;

    const slots = [];
    for (let i = 1; i <= count; i++) {
      const s = formatTime(curMins);
      curMins += dur;
      const e = formatTime(curMins);
      slots.push({ name: `P${i}`, periodNumber: i, start: s, end: e, isRecess: false });
      if (config.includeRecess && i === rAfter) {
        const rs = formatTime(curMins);
        curMins += rDur;
        const re = formatTime(curMins);
        slots.push({ name: 'Recess', periodNumber: i, start: rs, end: re, isRecess: true });
      }
    }
    return slots;
  };

  // Handle Apply Master Timetable Structure to ALL classes at once
  const handleApplyMasterStructure = async () => {
    if (!canSetup) return;
    setIsApplyingMasterStructure(true);
    try {
      let targetClassesPayload = 'all';
      if (masterStructureConfig.targetClasses !== 'all') {
        targetClassesPayload = masterStructureConfig.selectedClassesList.map(item => {
          const parts = item.split(' - ');
          return {
            className: parts[0]?.trim(),
            section: parts[1]?.trim() || 'A'
          };
        });
      }

      const res = await fetch(`${API_BASE}/timetable/structure-all`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          periodsPerDay: Number(masterStructureConfig.periodsPerDay) || 8,
          startTime: masterStructureConfig.startTime || '08:30',
          periodDurationMinutes: Number(masterStructureConfig.periodDurationMinutes) || 50,
          includeSaturday: Boolean(masterStructureConfig.includeSaturday),
          includeRecess: Boolean(masterStructureConfig.includeRecess),
          recessAfterPeriod: Number(masterStructureConfig.recessAfterPeriod) || 4,
          recessDurationMinutes: Number(masterStructureConfig.recessDurationMinutes) || 20,
          applyMode: masterStructureConfig.applyMode,
          targetClasses: targetClassesPayload,
          schoolSlug: effectiveSchoolSlug
        })
      });

      if (res.ok) {
        const data = await res.json();
        setTimetableNotification(`🏛️ Master Timetable Structure (${data.periodsPerDay || 8} periods + Recess) applied across all ${data.totalClasses || ''} classes! You can now assign periods separately for each class.`);
        setIsMasterStructureModalOpen(false);
        // Refresh current selected class schedule
        if (selectedTimetableClass) {
          const parts = selectedTimetableClass.split(' - ');
          fetchLiveTimetable(parts[0], parts[1]);
        }
      } else {
        const err = await res.json().catch(() => ({}));
        setTimetableNotification(`⚠️ ${err.message || 'Error applying master structure'}`);
      }
    } catch (err) {
      console.error('Error applying master timetable structure:', err);
      setTimetableNotification('⚠️ Network error applying master structure');
    } finally {
      setIsApplyingMasterStructure(false);
      setTimeout(() => setTimetableNotification(''), 6000);
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
          schoolSlug: effectiveSchoolSlug,
          offDays,
          subjects: classAcademicSubjects,
          activityClasses: classActivityClasses,
          curriculum: classCurriculumItems
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.timetable?.schedule) {
          setTimetableSchedule(data.timetable.schedule);
        }
        if (Array.isArray(data.timetable?.offDays)) {
          setOffDays(data.timetable.offDays);
        }
        if (Array.isArray(data.subjects)) {
          setClassAcademicSubjects(data.subjects);
        }
        if (Array.isArray(data.activityClasses)) {
          setClassActivityClasses(data.activityClasses);
        }
        setTimetableNotification(`✨ AI Matrix Timetable auto-generated! Strictly restricted to the ${data.subjects?.length || classAcademicSubjects.length} subjects & ${data.activityClasses?.length || classActivityClasses.length} activity classes listed for ${selectedTimetableClass}.`);
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
      const cleanClass = newClassSetup.className.trim();
      const cleanSection = newClassSetup.section.trim().toUpperCase();

      let res;
      if (newClassSetup.mode === 'scratch') {
        res = await fetch(`${API_BASE}/timetable/reset`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            className: cleanClass,
            section: cleanSection,
            periodsPerDay: Number(newClassSetup.periodsPerDay) || 8,
            startTime: newClassSetup.startTime || '08:30',
            periodDurationMinutes: Number(newClassSetup.periodDurationMinutes) || 50,
            includeSaturday: Boolean(newClassSetup.includeSaturday),
            includeRecess: Boolean(newClassSetup.includeRecess),
            recessAfterPeriod: Number(newClassSetup.recessAfterPeriod) || 4,
            recessDurationMinutes: Number(newClassSetup.recessDurationMinutes) || 20,
            blankSlots: Boolean(newClassSetup.blankSlots),
            schoolSlug: effectiveSchoolSlug
          })
        });
      } else {
        res = await fetch(`${API_BASE}/timetable/auto-generate`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            className: cleanClass,
            section: cleanSection,
            schoolSlug: effectiveSchoolSlug
          })
        });
      }

      if (res.ok) {
        const data = await res.json();
        const formatted = `${cleanClass} - ${cleanSection}`;
        if (!classesList.some(c => `${c.className} - ${c.section}` === formatted)) {
          setClassesList(prev => [...prev, { className: cleanClass, section: cleanSection, _id: Date.now().toString() }]);
        }
        setSelectedTimetableClass(formatted);
        if (data.timetable?.schedule) {
          setTimetableSchedule(data.timetable.schedule);
        }
        setIsSetupClassModalOpen(false);
        setTimetableNotification(`✅ Timetable initialized for ${formatted}!`);
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
    const nextNum = getAcademicPeriodsCount(dayPeriods) + 1;
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

  const handleResetTimetable = async () => {
    if (!canSetup) return;
    setIsResetting(true);
    try {
      const parts = selectedTimetableClass.split(' - ');
      const className = parts[0] || selectedTimetableClass;
      const section = parts[1] || 'A';

      if (resetOptions.resetType === 'clear_all') {
        const res = await fetch(`${API_BASE}/timetable`, {
          method: 'DELETE',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            className,
            section,
            clearOnly: true,
            schoolSlug: effectiveSchoolSlug
          })
        });
        if (res.ok) {
          const data = await res.json();
          if (data.timetable?.schedule) {
            setTimetableSchedule(data.timetable.schedule);
          }
          setIsResetModalOpen(false);
          setTimetableNotification(`✅ Timetable wiped to 0 periods for ${selectedTimetableClass}.`);
        }
      } else {
        const res = await fetch(`${API_BASE}/timetable/reset`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            className,
            section,
            periodsPerDay: Number(resetOptions.periodsPerDay) || 8,
            startTime: resetOptions.startTime || '08:30',
            periodDurationMinutes: Number(resetOptions.periodDurationMinutes) || 50,
            includeSaturday: Boolean(resetOptions.includeSaturday),
            includeRecess: Boolean(resetOptions.includeRecess),
            recessAfterPeriod: Number(resetOptions.recessAfterPeriod) || 4,
            recessDurationMinutes: Number(resetOptions.recessDurationMinutes) || 20,
            blankSlots: true,
            schoolSlug: effectiveSchoolSlug
          })
        });
        if (res.ok) {
          const data = await res.json();
          if (data.timetable?.schedule) {
            setTimetableSchedule(data.timetable.schedule);
          }
          if (Array.isArray(data.timetable?.offDays)) {
            setOffDays(data.timetable.offDays);
          }
          setIsResetModalOpen(false);
          setTimetableNotification(`✅ Timetable reset to clean blank matrix from scratch for ${selectedTimetableClass}!`);
        } else {
          const err = await res.json().catch(() => ({}));
          setTimetableNotification(`⚠️ ${err.message || 'Failed to reset timetable'}`);
        }
      }
    } catch (err) {
      setTimetableNotification('⚠️ Network error resetting timetable');
    } finally {
      setIsResetting(false);
      setTimeout(() => setTimetableNotification(''), 4500);
    }
  };

  const handleOpenWorkingDaysModal = () => {
    setWorkingDaysDraftOffDays([...offDays]);
    setIsWorkingDaysModalOpen(true);
  };

  const handleToggleDayStatus = async (day, targetIsOff) => {
    if (!canSetup) return;
    const parts = selectedTimetableClass.split(' - ');
    const className = parts[0] || selectedTimetableClass;
    const section = parts[1] || 'A';

    try {
      const res = await fetch(`${API_BASE}/timetable/toggle-day`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          className,
          section,
          day,
          isOff: targetIsOff,
          schoolSlug: effectiveSchoolSlug
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.timetable?.schedule) {
          setTimetableSchedule(data.timetable.schedule);
        }
        if (Array.isArray(data.timetable?.offDays)) {
          setOffDays(data.timetable.offDays);
        }
        setTimetableNotification(
          targetIsOff
            ? `🏖️ ${day} has been marked as an OFF DAY (Holiday) for ${selectedTimetableClass}!`
            : `✅ ${day} has been enabled as an ACTIVE WORKING DAY (ON) for ${selectedTimetableClass}!`
        );
      }
    } catch (err) {
      console.error('Error toggling day status:', err);
    } finally {
      setTimeout(() => setTimetableNotification(''), 4000);
    }
  };

  const handleSaveWorkingDays = async () => {
    if (!canSetup) return;
    setIsSavingWorkingDays(true);
    try {
      const parts = selectedTimetableClass.split(' - ');
      const className = parts[0] || selectedTimetableClass;
      const section = parts[1] || 'A';

      const res = await fetch(`${API_BASE}/timetable/working-days`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          className,
          section,
          offDays: workingDaysDraftOffDays,
          schoolSlug: effectiveSchoolSlug
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.timetable?.schedule) {
          setTimetableSchedule(data.timetable.schedule);
        }
        if (Array.isArray(data.timetable?.offDays)) {
          setOffDays(data.timetable.offDays);
        }
        setIsWorkingDaysModalOpen(false);
        setTimetableNotification(`✅ Working Days and Off Days updated successfully for ${selectedTimetableClass}!`);
      }
    } catch (err) {
      console.error('Error saving working days:', err);
    } finally {
      setIsSavingWorkingDays(false);
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
        { periodNumber: 3, periodName: 'P3', startTime: '10:10', endTime: '11:00', type: 'Lecture', isRecess: false },
        { periodNumber: 4, periodName: 'P4', startTime: '11:00', endTime: '11:50', type: 'Lecture', isRecess: false },
        { periodNumber: 4, periodName: 'Recess', startTime: '11:50', endTime: '12:10', type: 'Recess', isRecess: true },
        { periodNumber: 5, periodName: 'P5', startTime: '12:10', endTime: '13:00', type: 'Lecture', isRecess: false },
        { periodNumber: 6, periodName: 'P6', startTime: '13:00', endTime: '13:50', type: 'Lecture', isRecess: false },
        { periodNumber: 7, periodName: 'P7', startTime: '13:50', endTime: '14:40', type: 'Lecture', isRecess: false },
        { periodNumber: 8, periodName: 'P8', startTime: '14:40', endTime: '15:30', type: 'Lecture', isRecess: false }
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
            periodName: isRecess ? 'Recess' : (editPeriodModal.data.periodName || 'P1'),
            type: isRecess ? (editPeriodModal.data.type === 'Break' ? 'Break' : 'Recess') : (editPeriodModal.data.type || 'Lecture'),
            subject: isRecess ? (editPeriodModal.data.subject?.trim() || 'Recess / Break') : editPeriodModal.data.subject,
            teacher: isRecess ? (editPeriodModal.data.teacher?.trim() || 'Duty Staff') : editPeriodModal.data.teacher,
            room: isRecess ? (editPeriodModal.data.room?.trim() || 'Campus / Cafeteria') : editPeriodModal.data.room,
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

  const isDayOff = (day) => {
    return offDays.includes(day);
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
      { periodNumber: 1, periodName: 'P1', startTime: '08:30', endTime: '09:20', isRecess: false },
      { periodNumber: 2, periodName: 'P2', startTime: '09:20', endTime: '10:10', isRecess: false },
      { periodNumber: 3, periodName: 'P3', startTime: '10:10', endTime: '11:00', isRecess: false },
      { periodNumber: 4, periodName: 'P4', startTime: '11:00', endTime: '11:50', isRecess: false },
      { periodNumber: 4, periodName: 'Recess', startTime: '11:50', endTime: '12:10', isRecess: true, type: 'Recess' },
      { periodNumber: 5, periodName: 'P5', startTime: '12:10', endTime: '13:00', isRecess: false },
      { periodNumber: 6, periodName: 'P6', startTime: '13:00', endTime: '13:50', isRecess: false },
      { periodNumber: 7, periodName: 'P7', startTime: '13:50', endTime: '14:40', isRecess: false },
      { periodNumber: 8, periodName: 'P8', startTime: '14:40', endTime: '15:30', isRecess: false }
    ];
  }
  const maxPeriodCount = Math.max(masterPeriods.length, 1);
  const gridColumnsTemplate = `minmax(78px, 94px) repeat(${maxPeriodCount}, minmax(0, 1fr))`;

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
      
      {/* CONTROL & CONSTRAINT ACTION BAR */}
      {!isStudent && (
        <div className="chart-card no-print" style={{
          padding: '18px 22px',
          background: 'white',
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          {/* Header Row: Title, Category Badge & Campus Selector */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px',
            borderBottom: '1px solid #f1f5f9',
            paddingBottom: '12px'
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                <span style={{
                  background: '#e0e7ff',
                  color: '#4338ca',
                  padding: '2px 8px',
                  borderRadius: '6px',
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  letterSpacing: '0.4px'
                }}>
                  CONFLICT ENGINE
                </span>
                <span style={{ fontSize: '0.76rem', color: '#64748b', fontWeight: 600 }}>
                  Real-Time Matrix Allocation & Optimization
                </span>
              </div>
              <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#1e3a8a', letterSpacing: '-0.01em' }}>
                Schedule Matrix & Allocation Controls
              </h2>
            </div>

            {/* Campus Selector for Super Admin */}
            {isSuperAdmin && schoolsList.length > 0 && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '7px',
                background: '#f8fafc',
                padding: '0 12px',
                borderRadius: '10px',
                border: '1px solid #cbd5e1',
                height: '36px',
                boxSizing: 'border-box'
              }}>
                <Building2 size={15} color="#4F46E5" />
                <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>
                  Campus:
                </span>
                <select
                  value={selectedSchoolSlug}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSelectedSchoolSlug(val);
                    sessionStorage.setItem('tenantSlug', val);
                  }}
                  style={{
                    background: 'transparent',
                    color: '#1e3a8a',
                    border: 'none',
                    fontSize: '0.84rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    outline: 'none',
                    padding: 0
                  }}
                >
                  {schoolsList.map(s => (
                    <option key={s.slug} value={s.slug} style={{ color: '#1e3a8a', background: 'white' }}>
                      {s.name} {s.isBranch ? '• Branch' : '• Main'}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Tier 1: Matrix Operations (Left: Actions, Right: Class Scope & Print) */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '10px'
          }}>
            {/* Left Operational Actions */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              {canSetup && (
                <>
                  <button
                    type="button"
                    onClick={handleAutoGenerateTimetable}
                    disabled={isAutoGenerating}
                    style={{
                      height: '36px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '7px',
                      padding: '0 15px',
                      borderRadius: '8px',
                      border: 'none',
                      background: 'linear-gradient(135deg, #4F46E5 0%, #3730A3 100%)',
                      color: 'white',
                      fontWeight: 700,
                      fontSize: '0.82rem',
                      cursor: isAutoGenerating ? 'not-allowed' : 'pointer',
                      boxShadow: '0 2px 6px rgba(79, 70, 229, 0.25)',
                      transition: 'all 0.15s'
                    }}
                    onMouseOver={e => { if (!isAutoGenerating) e.currentTarget.style.transform = 'translateY(-1px)'; }}
                    onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0)'; }}
                    title="Super Admin & Admin: Auto-Generate conflict-free timetable"
                  >
                    <RefreshCw size={14} className={isAutoGenerating ? 'spin' : ''} />
                    <span>Auto-Optimize Matrix</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const allNames = classesList.map(c => `${c.className} - ${c.section}`);
                      setMasterStructureConfig(prev => ({
                        ...prev,
                        targetClasses: 'all',
                        selectedClassesList: allNames
                      }));
                      setIsMasterStructureModalOpen(true);
                    }}
                    style={{
                      height: '36px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '7px',
                      padding: '0 14px',
                      borderRadius: '8px',
                      border: '1px solid #1e1b4b',
                      background: '#1e1b4b',
                      color: '#f8fafc',
                      fontWeight: 700,
                      fontSize: '0.82rem',
                      cursor: 'pointer',
                      boxShadow: '0 2px 6px rgba(30, 27, 75, 0.15)',
                      transition: 'all 0.15s'
                    }}
                    onMouseOver={e => { e.currentTarget.style.background = '#2e1065'; }}
                    onMouseOut={e => { e.currentTarget.style.background = '#1e1b4b'; }}
                    title="Super Admin & Admin: Structure timetable for all school classes at once"
                  >
                    <Sparkles size={14} color="#c7d2fe" />
                    <span>Structure All Classes (Master)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOpenAddPeriodModal()}
                    style={{
                      height: '36px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '0 13px',
                      borderRadius: '8px',
                      border: 'none',
                      background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                      color: 'white',
                      fontWeight: 700,
                      fontSize: '0.82rem',
                      cursor: 'pointer',
                      boxShadow: '0 2px 6px rgba(16, 185, 129, 0.2)',
                      transition: 'all 0.15s'
                    }}
                    onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-1px)'; }}
                    onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0)'; }}
                    title="Add a new period or recess slot"
                  >
                    <Plus size={15} />
                    <span>Add Period</span>
                  </button>
                </>
              )}

              <button
                type="button"
                onClick={handleValidateConflicts}
                disabled={isValidatingConflicts}
                style={{
                  height: '36px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '0 13px',
                  borderRadius: '8px',
                  border: '1.5px solid #0d9488',
                  background: '#f0fdfa',
                  color: '#0f766e',
                  fontWeight: 700,
                  fontSize: '0.82rem',
                  cursor: isValidatingConflicts ? 'not-allowed' : 'pointer',
                  transition: 'all 0.15s'
                }}
                onMouseOver={e => { if (!isValidatingConflicts) e.currentTarget.style.background = '#ccfbf1'; }}
                onMouseOut={e => { e.currentTarget.style.background = '#f0fdfa'; }}
                title="Run live teacher, room, and period constraint checker"
              >
                <ShieldCheck size={15} color="#0d9488" />
                <span>{isValidatingConflicts ? 'Validating...' : 'Run Conflict Validator'}</span>
              </button>
            </div>

            {/* Right Side: Class Selector & Print Schedule */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <select
                value={selectedTimetableClass}
                onChange={(e) => setSelectedTimetableClass(e.target.value)}
                style={{
                  height: '36px',
                  padding: '0 12px',
                  borderRadius: '8px',
                  border: '1.5px solid #cbd5e1',
                  fontSize: '0.84rem',
                  fontWeight: 700,
                  color: '#1e3a8a',
                  background: 'white',
                  cursor: 'pointer',
                  outline: 'none',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
                }}
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
                type="button"
                onClick={handlePrintTimetable}
                style={{
                  height: '36px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '0 13px',
                  borderRadius: '8px',
                  border: '1.5px solid #cbd5e1',
                  background: 'white',
                  color: '#475569',
                  fontWeight: 700,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  transition: 'all 0.15s'
                }}
                onMouseOver={e => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.color = '#1e293b'; }}
                onMouseOut={e => { e.currentTarget.style.background = 'white'; e.currentTarget.style.color = '#475569'; }}
                title="Print official academic weekly timetable schedule"
              >
                <Printer size={15} />
                <span>Print Schedule</span>
              </button>
            </div>
          </div>

          {/* Tier 2: Rules & Configurations (Left: Constraints, Right: Reset) */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '10px',
            paddingTop: '10px',
            borderTop: '1px dashed #e2e8f0'
          }}>
            {/* Left: Curriculum & Timing Rules */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              {canSetup && (
                <>
                  <button
                    type="button"
                    onClick={() => handleOpenClassCurriculumModal()}
                    style={{
                      height: '36px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '7px',
                      padding: '0 13px',
                      borderRadius: '8px',
                      border: '1.5px solid #c7d2fe',
                      background: '#eef2ff',
                      color: '#3730a3',
                      fontWeight: 700,
                      fontSize: '0.82rem',
                      cursor: 'pointer',
                      transition: 'all 0.15s'
                    }}
                    onMouseOver={e => { e.currentTarget.style.background = '#e0e7ff'; }}
                    onMouseOut={e => { e.currentTarget.style.background = '#eef2ff'; }}
                    title="Configure Class Subjects & Activity Classes for AI Matrix"
                  >
                    <BookOpen size={14} color="#4f46e5" />
                    <span>Class Subjects & Activities</span>
                    {(classAcademicSubjects.length + classActivityClasses.length) > 0 && (
                      <span style={{
                        background: '#4f46e5',
                        color: 'white',
                        borderRadius: '10px',
                        padding: '1px 6px',
                        fontSize: '0.72rem',
                        fontWeight: 800
                      }}>
                        {classAcademicSubjects.length + classActivityClasses.length}
                      </span>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleOpenBellScheduleModal}
                    style={{
                      height: '36px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '0 13px',
                      borderRadius: '8px',
                      border: '1.5px solid #fed7aa',
                      background: '#fff7ed',
                      color: '#c2410c',
                      fontWeight: 700,
                      fontSize: '0.82rem',
                      cursor: 'pointer',
                      transition: 'all 0.15s'
                    }}
                    onMouseOver={e => { e.currentTarget.style.background = '#ffedd5'; }}
                    onMouseOut={e => { e.currentTarget.style.background = '#fff7ed'; }}
                    title="Configure Bell & Recess Timings across all days"
                  >
                    <Coffee size={14} color="#ea580c" />
                    <span>Bell & Recess Timings</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleOpenWorkingDaysModal}
                    style={{
                      height: '36px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '0 13px',
                      borderRadius: '8px',
                      border: '1.5px solid #cbd5e1',
                      background: '#f8fafc',
                      color: '#475569',
                      fontWeight: 700,
                      fontSize: '0.82rem',
                      cursor: 'pointer',
                      transition: 'all 0.15s'
                    }}
                    onMouseOver={e => { e.currentTarget.style.background = '#f1f5f9'; }}
                    onMouseOut={e => { e.currentTarget.style.background = '#f8fafc'; }}
                    title="Manage instructional working days & holidays"
                  >
                    <CalendarDays size={14} color="#64748b" />
                    <span>Days ON / OFF</span>
                  </button>
                </>
              )}
            </div>

            {/* Right: Reset Action */}
            {canSetup && (
              <button
                type="button"
                onClick={() => setIsResetModalOpen(true)}
                style={{
                  height: '36px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '0 12px',
                  borderRadius: '8px',
                  border: '1.5px solid #fecdd3',
                  background: '#fff1f2',
                  color: '#e11d48',
                  fontWeight: 700,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  transition: 'all 0.15s'
                }}
                onMouseOver={e => { e.currentTarget.style.background = '#ffe4e6'; }}
                onMouseOut={e => { e.currentTarget.style.background = '#fff1f2'; }}
                title="Reset this class' schedule to blank scratch matrix"
              >
                <RotateCcw size={13} color="#e11d48" />
                <span>Reset to Scratch</span>
              </button>
            )}
          </div>
        </div>
      )}


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
      {!isStudent && (
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
                {getAcademicPeriodsCount(masterPeriods) * 5} Periods / Week
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
      )}

      {/* 6-DAY INTERACTIVE TIMETABLE MATRIX GRID */}
      <div className="chart-card timetable-main-card" style={{ padding: '24px', background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 2px 12px rgba(0,0,0,0.03)' }}>
        
        {/* CLASS SELECTOR RIBBON: ASSIGN PERIODS SEPARATELY FOR EACH CLASS */}
        {!isStudent && (
          <div className="no-print" style={{
            background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
            border: '1.5px solid #e2e8f0',
            borderRadius: '12px',
            padding: '12px 16px',
            marginBottom: '18px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <BookOpen size={18} color="#4f46e5" />
                <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#1e3a8a', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                  Select Class to Assign Periods:
                </span>
              </div>
              
              {/* Class Dropdown */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <label htmlFor="ribbon-class-select" style={{ fontSize: '0.82rem', fontWeight: 700, color: '#475569' }}>
                  Class:
                </label>
                <select
                  id="ribbon-class-select"
                  aria-label="Select Class"
                  value={currentSelectedClassName}
                  onChange={(e) => {
                    const nextClass = e.target.value;
                    const matching = effectiveClassesList.filter(c => c.className === nextClass);
                    const nextSec = matching.some(c => c.section === currentSelectedSectionName)
                      ? currentSelectedSectionName 
                      : (matching[0]?.section || 'A');
                    setSelectedTimetableClass(`${nextClass} - ${nextSec}`);
                  }}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '8px',
                    border: '1.5px solid #4f46e5',
                    fontSize: '0.86rem',
                    fontWeight: 700,
                    color: '#1e3a8a',
                    background: 'white',
                    cursor: 'pointer',
                    outline: 'none',
                    boxShadow: '0 2px 5px rgba(79, 70, 229, 0.1)'
                  }}
                >
                  {uniqueClassNames.map(cls => (
                    <option key={cls} value={cls}>🏫 {cls}</option>
                  ))}
                </select>
              </div>

              {/* Section Dropdown */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <label htmlFor="ribbon-sec-select" style={{ fontSize: '0.82rem', fontWeight: 700, color: '#475569' }}>
                  Section:
                </label>
                <select
                  id="ribbon-sec-select"
                  aria-label="Select Section"
                  value={currentSelectedSectionName}
                  onChange={(e) => {
                    const nextSec = e.target.value;
                    setSelectedTimetableClass(`${currentSelectedClassName} - ${nextSec}`);
                  }}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '8px',
                    border: '1.5px solid #4f46e5',
                    fontSize: '0.86rem',
                    fontWeight: 700,
                    color: '#1e3a8a',
                    background: 'white',
                    cursor: 'pointer',
                    outline: 'none',
                    boxShadow: '0 2px 5px rgba(79, 70, 229, 0.1)'
                  }}
                >
                  {availableSectionsForCurrentClass.map(sec => (
                    <option key={sec} value={sec}>Section {sec}</option>
                  ))}
                </select>
              </div>

              {/* Active indicator */}
              <span style={{
                fontSize: '0.78rem',
                fontWeight: 700,
                background: '#ecfdf5',
                color: '#065f46',
                border: '1px solid #a7f3d0',
                padding: '6px 12px',
                borderRadius: '8px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px'
              }}>
                <CheckCircle2 size={14} color="#059669" />
                Active Class: <strong>{selectedTimetableClass}</strong>
              </span>

              {canSetup && (
                <button
                  type="button"
                  onClick={() => handleOpenClassCurriculumModal()}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 13px',
                    borderRadius: '8px',
                    background: '#eff6ff',
                    color: '#1d4ed8',
                    border: '1.5px solid #bfdbfe',
                    fontWeight: 700,
                    fontSize: '0.78rem',
                    cursor: 'pointer',
                    boxShadow: '0 1px 3px rgba(37, 99, 235, 0.1)'
                  }}
                  title="Add subjects & activity classes classwise so AI Matrix only schedules listed items"
                >
                  <SlidersHorizontal size={13} color="#2563eb" />
                  <span>Configure Subjects & Activities</span>
                  {(classAcademicSubjects.length + classActivityClasses.length) > 0 && (
                    <span style={{
                      background: '#2563eb',
                      color: 'white',
                      borderRadius: '10px',
                      padding: '1px 6px',
                      fontSize: '0.68rem',
                      fontWeight: 800
                    }}>
                      {classAcademicSubjects.length + classActivityClasses.length}
                    </span>
                  )}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Day Filter Tabs & Scrolling Helper */}
        <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '18px', paddingBottom: '16px', borderBottom: '1px solid #f1f5f9' }}>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748b', marginRight: '6px', textTransform: 'uppercase' }}>
              View:
            </span>
            {['ALL', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((d) => {
              const isOff = d !== 'ALL' && isDayOff(d);
              const isSelected = selectedDayTab === d;
              return (
                <button
                  key={d}
                  type="button"
                  onClick={() => setSelectedDayTab(d)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '8px',
                    border: '1px solid',
                    borderColor: isSelected ? '#4F46E5' : isOff ? '#fca5a5' : '#e2e8f0',
                    background: isSelected ? '#4F46E5' : isOff ? '#fff1f2' : '#f8fafc',
                    color: isSelected ? 'white' : isOff ? '#be123c' : '#475569',
                    fontWeight: 700,
                    fontSize: '0.78rem',
                    cursor: 'pointer',
                    boxShadow: isSelected ? '0 2px 8px rgba(79, 70, 229, 0.25)' : 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 0.15s'
                  }}
                >
                  <span>{d === 'ALL' ? '📅 Weekly Overview' : d}</span>
                  {isOff && (
                    <span style={{
                      fontSize: '0.62rem',
                      padding: '1px 5px',
                      borderRadius: '4px',
                      background: isSelected ? 'rgba(255, 255, 255, 0.3)' : '#fee2e2',
                      color: isSelected ? 'white' : '#991b1b',
                      fontWeight: 800,
                      textTransform: 'uppercase'
                    }}>
                      OFF
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Student Quick Action: Print Timetable */}
          {isStudent && (
            <button
              type="button"
              onClick={handlePrintTimetable}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '7px',
                padding: '6px 14px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                background: '#f8fafc',
                color: '#334155',
                fontWeight: 700,
                fontSize: '0.8rem',
                cursor: 'pointer',
                boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                transition: 'all 0.15s ease'
              }}
              onMouseOver={e => { e.currentTarget.style.background = '#4F46E5'; e.currentTarget.style.color = 'white'; e.currentTarget.style.borderColor = '#4F46E5'; }}
              onMouseOut={e => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.color = '#334155'; e.currentTarget.style.borderColor = '#cbd5e1'; }}
              title="Print official class timetable"
            >
              <FileText size={15} />
              <span>Print Timetable</span>
            </button>
          )}
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
              <span className="info-val">{getAcademicPeriodsCount(masterPeriods) * 5} Periods / Week (100% Coverage)</span>
            </div>
          </div>
        </div>

        {/* Full-Width 8-Period Timetable Grid Container (No Horizontal Scrollbar) */}
        <div className="timetable-scroll-container timetable-print-container" style={{ width: '100%', overflowX: 'hidden', paddingBottom: '4px', '--period-count': maxPeriodCount }}>
          <div className="timetable-inner-matrix" style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            
            {/* Period Column Headers */}
            <div className="timetable-header-row" style={{
              display: 'grid',
              gridTemplateColumns: gridColumnsTemplate,
              gap: '6px',
              paddingBottom: '2px'
            }}>
              {/* Corner "Day" Header */}
              <div 
                className="timetable-corner-header"
                style={{
                  background: '#f1f5f9',
                  borderRadius: '10px',
                  padding: '6px 4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '0.74rem',
                  color: '#475569',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  position: 'sticky',
                  left: 0,
                  zIndex: 4,
                  boxShadow: '2px 0 6px rgba(0,0,0,0.03)'
                }}
              >
                <span style={{ whiteSpace: 'nowrap' }}>Day</span>
              </div>

              {masterPeriods.map((ph, idx) => {
                const isRecessHeader = Boolean(
                  ph.isRecess ||
                  ph.type === 'Recess' ||
                  ph.type === 'Break' ||
                  (ph.periodName && ph.periodName.toLowerCase().trim() === 'recess') ||
                  (ph.subject && ph.subject.toLowerCase().trim().startsWith('recess'))
                );
                const periodLabel = getAcademicPeriodLabel(ph, idx, masterPeriods);
                return (
                  <div key={idx} style={{
                    background: isRecessHeader ? '#fffbeb' : '#f8fafc',
                    border: `1.5px ${isRecessHeader ? 'dashed #f59e0b' : 'solid #e2e8f0'}`,
                    borderRadius: '10px',
                    padding: '6px 4px',
                    textAlign: 'center',
                    minWidth: 0
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px',
                      fontSize: '0.76rem',
                      fontWeight: 800,
                      color: isRecessHeader ? '#b45309' : '#1e3a8a',
                      whiteSpace: 'nowrap'
                    }}>
                      {isRecessHeader && <Coffee size={12} color="#d97706" />}
                      <span>{periodLabel}</span>
                    </div>
                    <div style={{ fontSize: '0.64rem', color: isRecessHeader ? '#92400e' : '#64748b', fontWeight: 600, marginTop: '1px', whiteSpace: 'nowrap' }}>
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
              <div style={{ padding: '50px 20px', textAlign: 'center', color: '#64748b', background: '#f8fafc', borderRadius: '16px', border: '2px dashed #cbd5e1' }}>
                <p style={{ margin: '0 0 8px', fontWeight: 800, fontSize: '1.1rem', color: '#1e3a8a' }}>
                  No timetable schedule exists yet for {selectedTimetableClass}.
                </p>
                <p style={{ margin: '0 0 20px', fontSize: '0.88rem', color: '#64748b' }}>
                  Structure all classes at once or build this class' schedule:
                </p>
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => {
                      const allNames = classesList.map(c => `${c.className} - ${c.section}`);
                      setMasterStructureConfig(prev => ({
                        ...prev,
                        targetClasses: 'all',
                        selectedClassesList: allNames
                      }));
                      setIsMasterStructureModalOpen(true);
                    }}
                    style={{
                      background: 'linear-gradient(135deg, #1e1b4b 0%, #3730a3 50%, #4338ca 100%)',
                      color: 'white', border: 'none', padding: '11px 22px',
                      borderRadius: '10px', fontWeight: 700, fontSize: '0.88rem', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: '8px',
                      boxShadow: '0 4px 14px rgba(55, 48, 163, 0.35)'
                    }}
                  >
                    <Sparkles size={16} /> Structure All Classes at Once
                  </button>
                  <button
                    onClick={handleAutoGenerateTimetable}
                    disabled={isAutoGenerating}
                    style={{
                      background: '#4F46E5', color: 'white', border: 'none', padding: '11px 22px',
                      borderRadius: '10px', fontWeight: 700, fontSize: '0.88rem',
                      cursor: isAutoGenerating ? 'not-allowed' : 'pointer',
                      display: 'flex', alignItems: 'center', gap: '8px',
                      boxShadow: '0 4px 12px rgba(79, 70, 229, 0.25)'
                    }}
                  >
                    <RefreshCw size={15} className={isAutoGenerating ? 'spin' : ''} />
                    Auto-Generate Single Class
                  </button>
                </div>
              </div>
            ) : (
              /* Filtered Day Rows */
              daysOrder
                .filter((day) => selectedDayTab === 'ALL' || selectedDayTab === day)
                .map((day) => {
                  const periods = timetableSchedule[day] || [];
                  const isOff = isDayOff(day);
                  return (
                    <div key={day} className="timetable-grid-row" style={{ display: 'grid', gridTemplateColumns: gridColumnsTemplate, gap: '6px', alignItems: 'stretch' }}>
                      
                      {/* Day Label Header */}
                      <div className="timetable-day-header" style={{ 
                        background: isOff
                          ? 'linear-gradient(135deg, #475569 0%, #334155 100%)'
                          : 'linear-gradient(135deg, #1e3a8a 0%, #1e1b4b 100%)', 
                        color: 'white', 
                        borderRadius: '10px', 
                        display: 'flex', 
                        flexDirection: 'column', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        padding: '10px 4px',
                        fontWeight: 800,
                        fontSize: '0.84rem',
                        position: 'sticky',
                        left: 0,
                        zIndex: 4,
                        boxShadow: '2px 0 8px rgba(0,0,0,0.1)'
                      }}>
                        <span className="day-name" style={{ whiteSpace: 'nowrap' }}>{day}</span>
                        {isOff ? (
                          <span style={{
                            fontSize: '0.58rem',
                            background: 'rgba(239, 68, 68, 0.35)',
                            border: '1px solid rgba(254, 202, 202, 0.5)',
                            color: '#fecaca',
                            padding: '1px 4px',
                            borderRadius: '4px',
                            fontWeight: 800,
                            marginTop: '3px',
                            letterSpacing: '0.3px',
                            whiteSpace: 'nowrap'
                          }}>
                            🏖️ OFF DAY
                          </span>
                        ) : (
                          <span className="day-periods-count" style={{ fontSize: '0.62rem', opacity: 0.8, fontWeight: 500, marginTop: '2px', whiteSpace: 'nowrap' }}>
                            {getAcademicPeriodsCount(periods)} {getAcademicPeriodsCount(periods) === 1 ? 'Period' : 'Periods'}
                          </span>
                        )}

                        {canSetup && (
                          <div className="no-print" style={{ display: 'flex', flexDirection: 'column', gap: '3px', marginTop: '6px', width: '92%' }}>
                            {isOff ? (
                              <button
                                type="button"
                                onClick={() => handleToggleDayStatus(day, false)}
                                style={{
                                  background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                                  border: 'none',
                                  borderRadius: '6px',
                                  color: 'white',
                                  fontSize: '0.68rem',
                                  fontWeight: 700,
                                  padding: '4px 6px',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: '3px',
                                  boxShadow: '0 2px 6px rgba(16, 185, 129, 0.3)'
                                }}
                                title={`Make ${day} an active instructional working day (Turn ON)`}
                              >
                                <Check size={11} /> Turn ON
                              </button>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleOpenAddPeriodModal(day)}
                                  style={{
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
                                    justifyContent: 'center',
                                    gap: '3px'
                                  }}
                                  title={`Add period or recess to ${day}`}
                                >
                                  <Plus size={11} /> Add
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleToggleDayStatus(day, true)}
                                  style={{
                                    background: 'rgba(239, 68, 68, 0.25)',
                                    border: '1px solid rgba(248, 113, 113, 0.4)',
                                    borderRadius: '6px',
                                    color: '#fecaca',
                                    fontSize: '0.64rem',
                                    fontWeight: 700,
                                    padding: '2px 6px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '2px'
                                  }}
                                  title={`Mark ${day} as an Off Day / Holiday`}
                                >
                                  Set OFF
                                </button>
                              </>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Handle OFF DAY state */}
                      {isOff ? (
                        <div style={{
                          gridColumn: `2 / span ${maxPeriodCount}`,
                          background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                          border: '1.5px dashed #cbd5e1',
                          borderRadius: '12px',
                          padding: '24px 20px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          flexWrap: 'wrap',
                          gap: '16px'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                            <div style={{
                              width: '44px',
                              height: '44px',
                              borderRadius: '12px',
                              background: '#fee2e2',
                              color: '#dc2626',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '1.4rem'
                            }}>
                              🏖️
                            </div>
                            <div>
                              <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#334155' }}>
                                {day} is marked as an OFF DAY (Weekend / Holiday)
                              </div>
                              <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '2px' }}>
                                No regular instructional periods are scheduled for {selectedTimetableClass} on {day}.
                              </div>
                            </div>
                          </div>

                          {canSetup && (
                            <div className="no-print" style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                              <button
                                type="button"
                                onClick={() => handleToggleDayStatus(day, false)}
                                style={{
                                  background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '9px',
                                  padding: '9px 18px',
                                  fontSize: '0.82rem',
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)'
                                }}
                              >
                                <Check size={14} />
                                <span>Make {day} a Working Day (Turn ON)</span>
                              </button>
                            </div>
                          )}
                        </div>
                      ) : (!periods || periods.length === 0) ? (
                        <div style={{
                          gridColumn: `2 / span ${maxPeriodCount}`,
                          background: '#f8fafc',
                          border: '2px dashed #cbd5e1',
                          borderRadius: '12px',
                          padding: '16px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '12px',
                          color: '#64748b'
                        }}>
                          <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>No periods scheduled for {day} yet.</span>
                          {canSetup && (
                            <button
                              type="button"
                              onClick={() => handleOpenAddPeriodModal(day)}
                              style={{
                                background: '#4F46E5', color: 'white', border: 'none',
                                borderRadius: '8px', padding: '6px 14px', fontSize: '0.78rem',
                                fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px'
                              }}
                            >
                              <Plus size={13} /> Add First Period
                            </button>
                          )}
                        </div>
                      ) : (
                      /* Period Cards */
                      periods.map((p, pIdx) => {
                        const isRecess = Boolean(
                          p.isRecess ||
                          p.type === 'Recess' ||
                          p.type === 'Break' ||
                          (p.periodName && p.periodName.toLowerCase().trim() === 'recess') ||
                          (p.subject && p.subject.toLowerCase().trim().startsWith('recess'))
                        );
                        const isLab = p.type === 'Lab';
                        const isTutorial = p.type === 'Tutorial';
                        const isActivity = p.type === 'Activity';
                        const isAssess = p.type === 'Assessment';
                        const isUnassigned = !isRecess && (!p.subject || p.subject.trim() === '' || p.subject.toLowerCase() === 'unassigned');
                        const periodNumberLabel = getAcademicPeriodLabel(p, pIdx, periods);

                        if (isRecess) {
                          return (
                            <div 
                              key={pIdx}
                              className="timetable-card recess-card"
                              style={{
                                background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
                                border: '1.5px dashed #f59e0b',
                                borderRadius: '10px',
                                padding: '7px 7px',
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'space-between',
                                boxShadow: '0 1px 3px rgba(245, 158, 11, 0.08)',
                                transition: 'transform 0.15s, box-shadow 0.15s',
                                cursor: canSetup ? 'pointer' : 'default',
                                position: 'relative',
                                minWidth: 0
                              }}
                              onMouseOver={e => { if (canSetup) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 10px rgba(245, 158, 11, 0.15)'; } }}
                              onMouseOut={e => { if (canSetup) { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 1px 3px rgba(245, 158, 11, 0.08)'; } }}
                              onClick={() => {
                                if (!canSetup) return;
                                setEditPeriodModal({
                                  open: true,
                                  day,
                                  periodIndex: pIdx,
                                  applyToAllDays: true,
                                  data: {
                                    periodNumber: p.periodNumber || pIdx + 1,
                                    periodName: 'Recess',
                                    startTime: p.startTime || '11:50',
                                    endTime: p.endTime || '12:10',
                                    subject: p.subject || 'Recess / Break',
                                    teacher: p.teacher || 'Duty Staff',
                                    room: p.room || 'Campus / Cafeteria',
                                    type: 'Recess',
                                    isRecess: true
                                  }
                                });
                              }}
                              title={canSetup ? "Super Admin & Admin: Click to edit Recess timing or remove" : "Recess / Break Slot"}
                            >
                              <div>
                                <div className="recess-top-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                  <span className="recess-tag" style={{ fontSize: '0.68rem', fontWeight: 800, color: '#92400e', display: 'flex', alignItems: 'center', gap: '3px' }}>
                                    <Coffee size={11} color="#d97706" /> Recess
                                  </span>
                                  <span style={{ fontSize: '0.55rem', fontWeight: 800, padding: '1px 5px', borderRadius: '4px', background: '#f59e0b', color: 'white', textTransform: 'uppercase' }}>
                                    RECESS
                                  </span>
                                </div>
                                <div className="recess-title" style={{ fontWeight: 800, color: '#78350f', fontSize: '0.78rem', lineHeight: 1.2 }}>
                                  {p.subject || 'Recess / Break'}
                                </div>
                              </div>

                              <div className="recess-footer-meta" style={{ fontSize: '0.64rem', color: '#92400e', display: 'flex', flexDirection: 'column', gap: '2px', borderTop: '1px dashed #fde68a', paddingTop: '4px' }}>
                                <span className="recess-time-meta" style={{ fontWeight: 600, color: '#78350f', whiteSpace: 'nowrap' }}>
                                  ⏰ {p.startTime}-{p.endTime}
                                </span>
                                <span className="recess-room-meta" style={{ color: '#b45309', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                  📍 {p.room || 'Campus Area'}
                                </span>
                              </div>
                            </div>
                          );
                        }

                        // Unassigned / Blank scratch period slot
                        if (isUnassigned) {
                          return (
                            <div 
                              key={pIdx}
                              className="timetable-card unassigned-card"
                              style={{
                                background: '#fafbfc',
                                border: '1.5px dashed #cbd5e1',
                                borderRadius: '10px',
                                padding: '7px 7px',
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'space-between',
                                boxShadow: 'none',
                                transition: 'all 0.15s ease',
                                cursor: canSetup ? 'pointer' : 'default',
                                position: 'relative',
                                minWidth: 0
                              }}
                              onMouseOver={e => { if (canSetup) { e.currentTarget.style.borderColor = '#6366f1'; e.currentTarget.style.background = '#f5f3ff'; e.currentTarget.style.transform = 'translateY(-2px)'; } }}
                              onMouseOut={e => { if (canSetup) { e.currentTarget.style.borderColor = '#cbd5e1'; e.currentTarget.style.background = '#fafbfc'; e.currentTarget.style.transform = 'translateY(0)'; } }}
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
                                    subject: '',
                                    teacher: '',
                                    room: p.room || 'Room 101',
                                    type: 'Lecture',
                                    isRecess: false
                                  }
                                });
                              }}
                              title={canSetup ? `Click to assign subject & teacher for ${periodNumberLabel} (${day})` : "Unassigned slot"}
                            >
                              <div>
                                <div className="card-top-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                  <span className="card-period-tag" style={{ fontSize: '0.68rem', fontWeight: 800, color: '#64748b' }}>
                                    {periodNumberLabel}
                                  </span>
                                  <span style={{ fontSize: '0.55rem', fontWeight: 800, padding: '1px 5px', borderRadius: '4px', background: '#e2e8f0', color: '#475569', textTransform: 'uppercase' }}>
                                    BLANK SLOT
                                  </span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '3px', color: '#4f46e5', fontWeight: 700, fontSize: '0.76rem', minHeight: '30px' }}>
                                  <Plus size={12} /> <span>Assign</span>
                                </div>
                              </div>

                              <div className="card-footer-meta" style={{ fontSize: '0.64rem', color: '#94a3b8', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px dashed #e2e8f0', paddingTop: '4px' }}>
                                <span style={{ fontWeight: 600, color: '#64748b', whiteSpace: 'nowrap' }}>⏰ {p.startTime}-{p.endTime}</span>
                              </div>
                            </div>
                          );
                        }

                        const cardBg = isLab ? '#f0fdf4' : isTutorial ? '#eff6ff' : isActivity ? '#fefce8' : isAssess ? '#fef2f2' : '#f8fafc';
                        const cardBorder = isLab ? '#bbf7d0' : isTutorial ? '#bfdbfe' : isActivity ? '#fef08a' : isAssess ? '#fecaca' : '#e2e8f0';
                        const subjectColor = isLab ? '#166534' : isTutorial ? '#1e40af' : isActivity ? '#854d0e' : isAssess ? '#991b1b' : '#1e3a8a';

                        return (
                          <div 
                            key={pIdx}
                            className="timetable-card regular-card"
                            style={{
                              background: cardBg,
                              border: `1px solid ${cardBorder}`,
                              borderRadius: '10px',
                              padding: '7px 7px',
                              display: 'flex',
                              flexDirection: 'column',
                              justifyContent: 'space-between',
                              boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                              transition: 'transform 0.15s, box-shadow 0.15s',
                              cursor: canSetup ? 'pointer' : 'default',
                              position: 'relative',
                              minWidth: 0
                            }}
                            onMouseOver={e => { if (canSetup) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 10px rgba(0,0,0,0.08)'; } }}
                            onMouseOut={e => { if (canSetup) { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.02)'; } }}
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
                            title={canSetup ? `Super Admin & Admin: Click to edit ${periodNumberLabel} (${day})` : `${periodNumberLabel} Lecture`}
                          >
                            <div>
                              <div className="card-top-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
                                <span className="card-period-tag" style={{ fontSize: '0.68rem', fontWeight: 800, color: '#64748b' }}>
                                  {periodNumberLabel}
                                </span>
                                <span className="card-type-tag" style={{
                                  fontSize: '0.55rem', fontWeight: 800, padding: '1px 5px', borderRadius: '4px',
                                  background: isLab ? '#dcfce7' : isTutorial ? '#dbeafe' : isActivity ? '#fef9c3' : isAssess ? '#fee2e2' : '#f1f5f9',
                                  color: isLab ? '#15803d' : isTutorial ? '#1d4ed8' : isActivity ? '#a16207' : isAssess ? '#b91c1c' : '#475569',
                                  textTransform: 'uppercase'
                                }}>
                                  {p.type || 'Lecture'}
                                </span>
                              </div>

                              <div className="card-subject-name" style={{ fontWeight: 800, color: subjectColor, fontSize: '0.78rem', lineHeight: 1.2, marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {p.subject}
                              </div>
                            </div>

                            <div className="card-footer-meta" style={{ fontSize: '0.64rem', color: '#64748b', display: 'flex', flexDirection: 'column', gap: '2px', borderTop: '1px solid #f1f5f9', paddingTop: '4px' }}>
                              <div className="card-teacher-name" style={{ display: 'flex', alignItems: 'center', gap: '3px', fontWeight: 600, color: '#334155', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                <Users size={10} color="#6366f1" style={{ flexShrink: 0 }} />
                                <span>{p.teacher || 'Unassigned'}</span>
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#94a3b8' }}>
                                <span className="card-room-name" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '60px' }}>
                                  📍 {p.room || 'Room 201'}
                                </span>
                                <span className="card-time-span" style={{ whiteSpace: 'nowrap', fontWeight: 600, color: '#64748b' }}>
                                  {p.startTime}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* EDIT / ASSIGN PERIOD MODAL */}
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
                  <span>{editPeriodModal.data.isRecess ? 'Configure Recess / Break Slot' : 'Assign Period Allocation'}</span>
                </h3>
                <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '2px' }}>
                  Target Class: <strong>{selectedTimetableClass}</strong> • {editPeriodModal.day} ({editPeriodModal.data.periodName})
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
              
              {/* Recess Banner */}
              {editPeriodModal.data.isRecess ? (
                <div 
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px',
                    background: '#fffbeb',
                    padding: '14px 16px',
                    borderRadius: '12px',
                    border: '1.5px solid #f59e0b'
                  }}
                >
                  <Coffee size={22} color="#d97706" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#92400e', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span>Appointed as Dedicated Institutional Recess</span>
                      <span style={{ fontSize: '0.62rem', background: '#f59e0b', color: 'white', padding: '1px 6px', borderRadius: '4px', textTransform: 'uppercase' }}>Recess Only</span>
                    </div>
                    <div style={{ fontSize: '0.74rem', color: '#78350f', marginTop: '3px', lineHeight: 1.4 }}>
                      This slot is appointed strictly as Recess/Break. It does NOT consume or replace any academic period.
                    </div>
                  </div>
                </div>
              ) : null}

              {/* Period Code & Slot Type */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Period Code / Label
                  </label>
                  <input
                    type="text"
                    value={editPeriodModal.data.isRecess ? 'Recess' : (editPeriodModal.data.periodName || '')}
                    disabled={editPeriodModal.data.isRecess}
                    onChange={(e) => setEditPeriodModal(prev => ({
                      ...prev,
                      data: { ...prev.data, periodName: e.target.value }
                    }))}
                    style={{ 
                      width: '100%', padding: '10px 14px', borderRadius: '10px', 
                      border: '1.5px solid #cbd5e1', fontSize: '0.9rem', fontWeight: 600,
                      background: editPeriodModal.data.isRecess ? '#f1f5f9' : 'white',
                      color: editPeriodModal.data.isRecess ? '#92400e' : '#1e293b'
                    }}
                    placeholder={editPeriodModal.data.isRecess ? "Recess" : "e.g. P1, P2"}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Slot Type
                  </label>
                  {editPeriodModal.data.isRecess ? (
                    <select
                      value={editPeriodModal.data.type === 'Break' ? 'Break' : 'Recess'}
                      onChange={(e) => {
                        const val = e.target.value;
                        setEditPeriodModal(prev => ({
                          ...prev,
                          data: { ...prev.data, type: val, isRecess: true }
                        }));
                      }}
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1.5px solid #f59e0b', fontSize: '0.9rem', fontWeight: 700, background: '#fffbeb', color: '#92400e' }}
                    >
                      <option value="Recess">Recess / Lunch (Break)</option>
                      <option value="Break">Short Refreshment Break</option>
                    </select>
                  ) : (
                    <select
                      value={editPeriodModal.data.type || 'Lecture'}
                      onChange={(e) => {
                        const val = e.target.value;
                        setEditPeriodModal(prev => ({
                          ...prev,
                          data: { ...prev.data, type: val }
                        }));
                      }}
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontSize: '0.9rem', fontWeight: 600, background: 'white' }}
                    >
                      <option value="Lecture">Lecture</option>
                      <option value="Lab">Lab (Practical)</option>
                      <option value="Tutorial">Tutorial / Problem Solving</option>
                      <option value="Activity">Activity / Sports / Arts</option>
                      <option value="Assessment">Assessment / Remedial</option>
                      <option value="Self Study">Self Study / Library</option>
                      <option value="Zero Period">Zero Period / Extra Class</option>
                    </select>
                  )}
                </div>
              </div>

              {/* Subject */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155' }}>
                    {editPeriodModal.data.isRecess ? 'Recess Title' : 'Subject Name'}
                  </label>
                  {!editPeriodModal.data.isRecess && (
                    <span style={{ fontSize: '0.72rem', color: '#6366f1', fontWeight: 600 }}>Type or click curriculum below</span>
                  )}
                </div>
                <input
                  type="text"
                  value={editPeriodModal.data.subject || ''}
                  onChange={(e) => setEditPeriodModal(prev => ({
                    ...prev,
                    data: { ...prev.data, subject: e.target.value }
                  }))}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontSize: '0.9rem', fontWeight: 600 }}
                  placeholder={editPeriodModal.data.isRecess ? "e.g. Lunch & Nutrition Break" : "e.g. Mathematics, Physics, English"}
                />

                {/* Class Curriculum Subjects Quick Chips */}
                {!editPeriodModal.data.isRecess && (
                  <div style={{ marginTop: '8px' }}>
                    {(() => {
                      const curCls = classesList.find(c => `${c.className} - ${c.section}`.toLowerCase() === selectedTimetableClass.toLowerCase());
                      const subs = (curCls?.subjects && curCls.subjects.length > 0)
                        ? curCls.subjects
                        : ['Mathematics', 'Science', 'English', 'Hindi', 'Social Science', 'Physics', 'Chemistry', 'Computer Science', 'Physical Education'];
                      return (
                        <>
                          <div style={{ fontSize: '0.72rem', color: '#4338ca', fontWeight: 700, marginBottom: '5px' }}>
                            Curriculum Subjects for {selectedTimetableClass}:
                          </div>
                          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                            {subs.map(s => (
                              <button
                                key={s}
                                type="button"
                                onClick={() => setEditPeriodModal(prev => ({ ...prev, data: { ...prev.data, subject: s } }))}
                                style={{
                                  background: editPeriodModal.data.subject === s ? '#e0e7ff' : '#f8fafc',
                                  border: `1.5px solid ${editPeriodModal.data.subject === s ? '#4f46e5' : '#cbd5e1'}`,
                                  color: editPeriodModal.data.subject === s ? '#3730a3' : '#334155',
                                  padding: '4px 10px', borderRadius: '6px', fontSize: '0.74rem', fontWeight: 700, cursor: 'pointer',
                                  transition: 'all 0.1s'
                                }}
                              >
                                {s}
                              </button>
                            ))}
                          </div>
                        </>
                      );
                    })()}
                  </div>
                )}
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
                    <option value="">-- Select Faculty / Teacher --</option>
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
                  {editPeriodModal.data.isRecess ? 'Recess Area' : 'Classroom / Lab Location'}
                </label>
                <input
                  type="text"
                  value={editPeriodModal.data.room || ''}
                  onChange={(e) => setEditPeriodModal(prev => ({
                    ...prev,
                    data: { ...prev.data, room: e.target.value }
                  }))}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontSize: '0.9rem', fontWeight: 600 }}
                  placeholder={editPeriodModal.data.isRecess ? "Campus / Cafeteria" : "e.g. Room 201, Physics Lab"}
                />
              </div>

              {/* Start & End Times */}
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
                  Sync this allocation across all weekdays (Monday – Friday)
                </label>
              </div>

            </div>

            {/* Modal Actions */}
            <div style={{
              padding: '16px 24px', borderTop: '1px solid #e2e8f0', background: '#f8fafc',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px'
            }}>
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
                  <span>Delete Slot</span>
                </button>
              </div>

              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                {!editPeriodModal.data.isRecess && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditPeriodModal(prev => ({
                        ...prev,
                        data: {
                          ...prev.data,
                          subject: '',
                          teacher: '',
                          type: 'Lecture'
                        }
                      }));
                    }}
                    style={{
                      padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1',
                      background: '#f8fafc', color: '#64748b', fontWeight: 700, fontSize: '0.78rem',
                      cursor: 'pointer'
                    }}
                    title="Clear subject and teacher to leave as Blank Slot"
                  >
                    Clear to Blank
                  </button>
                )}
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

      {/* MASTER TIMETABLE & BELL SCHEDULE STRUCTURE MODAL (APPLY TO ALL CLASSES AT ONCE) */}
      {isMasterStructureModalOpen && createPortal(
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 10000, padding: '20px'
        }}>
          <div style={{
            background: 'white', borderRadius: '20px', width: '100%', maxWidth: '640px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', overflow: 'hidden',
            maxHeight: '90vh', display: 'flex', flexDirection: 'column'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '20px 26px', borderBottom: '1px solid #e2e8f0',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 45%, #1e3a8a 100%)',
              color: 'white'
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Sparkles size={20} color="#a5b4fc" />
                  <span>Master Timetable Structure (All Classes)</span>
                </h3>
                <div style={{ fontSize: '0.8rem', color: '#c7d2fe', marginTop: '3px' }}>
                  Define the universal period slots & recess once, then assign subjects separately per class.
                </div>
              </div>
              <button
                onClick={() => setIsMasterStructureModalOpen(false)}
                style={{ background: 'rgba(255, 255, 255, 0.15)', border: '1px solid rgba(255, 255, 255, 0.3)', borderRadius: '8px', padding: '6px', cursor: 'pointer', display: 'flex', color: 'white' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '24px 26px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* Step 1: Periods per Day */}
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, color: '#1e3a8a', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.3px' }}>
                  1. Academic Periods Per Day
                </label>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {[6, 7, 8, 9, 10].map(num => {
                    const isSel = masterStructureConfig.periodsPerDay === num;
                    return (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setMasterStructureConfig(prev => ({ ...prev, periodsPerDay: num }))}
                        style={{
                          flex: '1 1 80px',
                          padding: '10px 12px',
                          borderRadius: '10px',
                          border: `2px solid ${isSel ? '#4f46e5' : '#cbd5e1'}`,
                          background: isSel ? '#eef2ff' : 'white',
                          color: isSel ? '#4338ca' : '#475569',
                          fontWeight: 800,
                          fontSize: '0.88rem',
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '2px',
                          boxShadow: isSel ? '0 2px 8px rgba(79, 70, 229, 0.2)' : 'none'
                        }}
                      >
                        <span>{num} Periods</span>
                        {num === 8 && (
                          <span style={{ fontSize: '0.6rem', color: isSel ? '#4f46e5' : '#059669', fontWeight: 800 }}>
                            ⭐ Recommended
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Step 2: Start Time & Period Duration */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    School Day Starts At
                  </label>
                  <input
                    type="time"
                    value={masterStructureConfig.startTime}
                    onChange={(e) => setMasterStructureConfig(prev => ({ ...prev, startTime: e.target.value }))}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontSize: '0.9rem', fontWeight: 700, color: '#1e3a8a' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Period Duration (Minutes)
                  </label>
                  <select
                    value={masterStructureConfig.periodDurationMinutes}
                    onChange={(e) => setMasterStructureConfig(prev => ({ ...prev, periodDurationMinutes: Number(e.target.value) }))}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontSize: '0.9rem', fontWeight: 700, background: 'white' }}
                  >
                    <option value={40}>40 Minutes</option>
                    <option value={45}>45 Minutes</option>
                    <option value={50}>50 Minutes (Standard)</option>
                    <option value={55}>55 Minutes</option>
                    <option value={60}>60 Minutes (1 Hour)</option>
                  </select>
                </div>
              </div>

              {/* Step 3: Dedicated Institutional Recess */}
              <div style={{ background: '#fffbeb', border: '1.5px solid #fde68a', borderRadius: '12px', padding: '14px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: masterStructureConfig.includeRecess ? '12px' : 0 }}>
                  <input
                    type="checkbox"
                    id="masterRecessCheckbox"
                    checked={masterStructureConfig.includeRecess}
                    onChange={(e) => setMasterStructureConfig(prev => ({ ...prev, includeRecess: e.target.checked }))}
                    style={{ width: '18px', height: '18px', accentColor: '#d97706', cursor: 'pointer' }}
                  />
                  <label htmlFor="masterRecessCheckbox" style={{ fontSize: '0.88rem', fontWeight: 800, color: '#92400e', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Coffee size={16} color="#d97706" />
                    <span>Include Dedicated Institutional Recess / Lunch Break</span>
                  </label>
                </div>

                {masterStructureConfig.includeRecess && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginTop: '10px', paddingTop: '10px', borderTop: '1px dashed #fcd34d' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#78350f', marginBottom: '5px' }}>
                        Recess Placement (After Period)
                      </label>
                      <select
                        value={masterStructureConfig.recessAfterPeriod}
                        onChange={(e) => setMasterStructureConfig(prev => ({ ...prev, recessAfterPeriod: Number(e.target.value) }))}
                        style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1.5px solid #f59e0b', fontSize: '0.85rem', fontWeight: 700, background: 'white', color: '#92400e' }}
                      >
                        <option value={3}>After Period 3</option>
                        <option value={4}>After Period 4 (Mid-Day Break ⭐ Recommended)</option>
                        <option value={5}>After Period 5</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#78350f', marginBottom: '5px' }}>
                        Recess Duration
                      </label>
                      <select
                        value={masterStructureConfig.recessDurationMinutes}
                        onChange={(e) => setMasterStructureConfig(prev => ({ ...prev, recessDurationMinutes: Number(e.target.value) }))}
                        style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1.5px solid #f59e0b', fontSize: '0.85rem', fontWeight: 700, background: 'white', color: '#92400e' }}
                      >
                        <option value={15}>15 Minutes</option>
                        <option value={20}>20 Minutes (Standard)</option>
                        <option value={25}>25 Minutes</option>
                        <option value={30}>30 Minutes</option>
                        <option value={40}>40 Minutes (Lunch)</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {/* Step 4: Live Calculated Slot Schedule Preview */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#1e3a8a', textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                    Calculated Bell Schedule Matrix Preview:
                  </span>
                  <span style={{ fontSize: '0.72rem', color: '#059669', fontWeight: 800 }}>
                    ✓ 100% Full-Width Scaled
                  </span>
                </div>
                <div style={{
                  background: '#f8fafc',
                  border: '1.5px solid #e2e8f0',
                  borderRadius: '10px',
                  padding: '10px 12px',
                  display: 'flex',
                  gap: '6px',
                  overflowX: 'auto',
                  alignItems: 'center'
                }}>
                  {calculateMasterSlotsPreview(masterStructureConfig).map((slot, idx) => (
                    <div
                      key={idx}
                      style={{
                        flex: '1 1 auto',
                        minWidth: '55px',
                        background: slot.isRecess ? '#fef3c7' : 'white',
                        border: `1.5px ${slot.isRecess ? 'dashed #d97706' : 'solid #cbd5e1'}`,
                        borderRadius: '6px',
                        padding: '6px 4px',
                        textAlign: 'center'
                      }}
                    >
                      <div style={{ fontSize: '0.74rem', fontWeight: 800, color: slot.isRecess ? '#b45309' : '#1e3a8a' }}>
                        {slot.name}
                      </div>
                      <div style={{ fontSize: '0.62rem', fontWeight: 600, color: slot.isRecess ? '#92400e' : '#64748b', marginTop: '1px', whiteSpace: 'nowrap' }}>
                        {slot.start} - {slot.end}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Step 5: Target Classes Selection */}
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, color: '#1e3a8a', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.3px' }}>
                  2. Apply Structure to Classes
                </label>
                <div style={{ display: 'flex', gap: '12px', marginBottom: '10px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 700, color: '#334155', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="masterTargetRadio"
                      checked={masterStructureConfig.targetClasses === 'all'}
                      onChange={() => setMasterStructureConfig(prev => ({ ...prev, targetClasses: 'all' }))}
                      style={{ accentColor: '#4f46e5' }}
                    />
                    <span>All School Classes ({classesList.length > 0 ? classesList.length : 4} Classes)</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 700, color: '#334155', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="masterTargetRadio"
                      checked={masterStructureConfig.targetClasses === 'custom'}
                      onChange={() => setMasterStructureConfig(prev => ({
                        ...prev,
                        targetClasses: 'custom',
                        selectedClassesList: classesList.map(c => `${c.className} - ${c.section}`)
                      }))}
                      style={{ accentColor: '#4f46e5' }}
                    />
                    <span>Select Specific Classes</span>
                  </label>
                </div>

                {masterStructureConfig.targetClasses === 'custom' && (
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', background: '#f8fafc', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    {(classesList.length > 0 ? classesList : [
                      { className: 'Class 10', section: 'A' },
                      { className: 'Class 11', section: 'SCIENCE' },
                      { className: 'Class 9', section: 'B' },
                      { className: 'Class 8', section: 'A' }
                    ]).map(c => {
                      const key = `${c.className} - ${c.section}`;
                      const isChecked = masterStructureConfig.selectedClassesList.includes(key);
                      return (
                        <label
                          key={key}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            background: isChecked ? '#e0e7ff' : 'white',
                            border: `1px solid ${isChecked ? '#6366f1' : '#cbd5e1'}`,
                            padding: '4px 10px',
                            borderRadius: '6px',
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            color: isChecked ? '#4338ca' : '#475569',
                            cursor: 'pointer'
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setMasterStructureConfig(prev => ({
                                  ...prev,
                                  selectedClassesList: [...prev.selectedClassesList, key]
                                }));
                              } else {
                                setMasterStructureConfig(prev => ({
                                  ...prev,
                                  selectedClassesList: prev.selectedClassesList.filter(k => k !== key)
                                }));
                              }
                            }}
                            style={{ accentColor: '#4f46e5' }}
                          />
                          <span>{key}</span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Step 6: Application Mode */}
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, color: '#1e3a8a', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.3px' }}>
                  3. Application Mode
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  
                  {/* Mode 1: Clean Blank Slots (Recommended) */}
                  <div
                    onClick={() => setMasterStructureConfig(prev => ({ ...prev, applyMode: 'blank' }))}
                    style={{
                      padding: '12px 14px', borderRadius: '10px', cursor: 'pointer',
                      border: `1.5px solid ${masterStructureConfig.applyMode === 'blank' ? '#059669' : '#e2e8f0'}`,
                      background: masterStructureConfig.applyMode === 'blank' ? '#ecfdf5' : 'white',
                      display: 'flex', alignItems: 'flex-start', gap: '10px',
                      transition: 'all 0.15s'
                    }}
                  >
                    <input
                      type="radio"
                      name="masterApplyMode"
                      checked={masterStructureConfig.applyMode === 'blank'}
                      onChange={() => {}}
                      style={{ marginTop: '3px', accentColor: '#059669' }}
                    />
                    <div>
                      <div style={{ fontSize: '0.86rem', fontWeight: 800, color: '#065f46' }}>
                        Initialize Clean Structured Slots (P1..P{masterStructureConfig.periodsPerDay} + Recess) — ⭐ Recommended
                      </div>
                      <div style={{ fontSize: '0.74rem', color: '#047857', marginTop: '2px' }}>
                        Sets up standardized period timings and recess for all classes with blank slots, allowing you to assign subjects and teachers separately per class.
                      </div>
                    </div>
                  </div>

                  {/* Mode 2: Synchronize Timings Only */}
                  <div
                    onClick={() => setMasterStructureConfig(prev => ({ ...prev, applyMode: 'sync_times' }))}
                    style={{
                      padding: '12px 14px', borderRadius: '10px', cursor: 'pointer',
                      border: `1.5px solid ${masterStructureConfig.applyMode === 'sync_times' ? '#4f46e5' : '#e2e8f0'}`,
                      background: masterStructureConfig.applyMode === 'sync_times' ? '#eef2ff' : 'white',
                      display: 'flex', alignItems: 'flex-start', gap: '10px',
                      transition: 'all 0.15s'
                    }}
                  >
                    <input
                      type="radio"
                      name="masterApplyMode"
                      checked={masterStructureConfig.applyMode === 'sync_times'}
                      onChange={() => {}}
                      style={{ marginTop: '3px', accentColor: '#4f46e5' }}
                    />
                    <div>
                      <div style={{ fontSize: '0.86rem', fontWeight: 800, color: '#3730a3' }}>
                        Synchronize Period Timings & Recess Only
                      </div>
                      <div style={{ fontSize: '0.74rem', color: '#4338ca', marginTop: '2px' }}>
                        Applies new period timings across all classes while keeping any existing subject & teacher allocations intact.
                      </div>
                    </div>
                  </div>

                  {/* Mode 3: AI Auto-Generate Curriculum */}
                  <div
                    onClick={() => setMasterStructureConfig(prev => ({ ...prev, applyMode: 'auto' }))}
                    style={{
                      padding: '12px 14px', borderRadius: '10px', cursor: 'pointer',
                      border: `1.5px solid ${masterStructureConfig.applyMode === 'auto' ? '#0891b2' : '#e2e8f0'}`,
                      background: masterStructureConfig.applyMode === 'auto' ? '#ecfeff' : 'white',
                      display: 'flex', alignItems: 'flex-start', gap: '10px',
                      transition: 'all 0.15s'
                    }}
                  >
                    <input
                      type="radio"
                      name="masterApplyMode"
                      checked={masterStructureConfig.applyMode === 'auto'}
                      onChange={() => {}}
                      style={{ marginTop: '3px', accentColor: '#0891b2' }}
                    />
                    <div>
                      <div style={{ fontSize: '0.86rem', fontWeight: 800, color: '#155e75' }}>
                        Auto-Populate Curriculum with AI for All Classes
                      </div>
                      <div style={{ fontSize: '0.74rem', color: '#0e7490', marginTop: '2px' }}>
                        Automatically fills subjects and teachers for each class based on registered curriculum, preventing teacher clashes.
                      </div>
                    </div>
                  </div>

                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div style={{
              padding: '16px 26px', borderTop: '1px solid #e2e8f0',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              background: '#f8fafc'
            }}>
              <button
                type="button"
                onClick={() => setIsMasterStructureModalOpen(false)}
                style={{
                  padding: '9px 18px', borderRadius: '10px', border: '1px solid #cbd5e1',
                  background: 'white', color: '#475569', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer'
                }}
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleApplyMasterStructure}
                disabled={isApplyingMasterStructure}
                style={{
                  padding: '10px 24px', borderRadius: '10px', border: 'none',
                  background: 'linear-gradient(135deg, #1e1b4b 0%, #3730a3 50%, #4338ca 100%)',
                  color: 'white', fontWeight: 800, fontSize: '0.88rem',
                  cursor: isApplyingMasterStructure ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', gap: '8px',
                  boxShadow: '0 4px 14px rgba(55, 48, 163, 0.35)'
                }}
              >
                {isApplyingMasterStructure ? (
                  <>
                    <RefreshCw size={15} className="spin" />
                    <span>Structuring All Classes...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={16} />
                    <span>Apply Structure to All Classes</span>
                  </>
                )}
              </button>
            </div>

          </div>
        </div>,
        document.body
      )}

      {/* SETUP NEW CLASS SCHEDULE MODAL (CREATE FROM SCRATCH OR AI) */}
      {isSetupClassModalOpen && createPortal(
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 10000, padding: '20px'
        }}>
          <div style={{
            background: 'white', borderRadius: '20px', width: '100%', maxWidth: '580px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', overflow: 'hidden'
          }}>
            <div style={{
              padding: '20px 24px', borderBottom: '1px solid #e2e8f0',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              background: 'linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%)'
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#1e3a8a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Plus size={20} color="#4F46E5" /> Setup Class Schedule Matrix
                </h3>
                <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '2px' }}>
                  Target Campus: <strong>{effectiveSchoolSlug}</strong>
                </div>
              </div>
              <button
                onClick={() => setIsSetupClassModalOpen(false)}
                style={{ background: 'white', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '6px', cursor: 'pointer', display: 'flex' }}
              >
                <X size={18} color="#64748b" />
              </button>
            </div>

            <form onSubmit={handleCreateNewClassTimetable} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '75vh', overflowY: 'auto' }}>
              
              {/* Mode Selector Tabs */}
              <div style={{ display: 'flex', borderBottom: '1.5px solid #e2e8f0', marginBottom: '4px' }}>
                <button
                  type="button"
                  onClick={() => setNewClassSetup(prev => ({ ...prev, mode: 'scratch' }))}
                  style={{
                    flex: 1, padding: '10px 12px', background: 'none', border: 'none',
                    borderBottom: newClassSetup.mode === 'scratch' ? '2.5px solid #059669' : '2.5px solid transparent',
                    fontWeight: 800, fontSize: '0.88rem',
                    color: newClassSetup.mode === 'scratch' ? '#065f46' : '#64748b',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                  }}
                >
                  <Sparkles size={16} color={newClassSetup.mode === 'scratch' ? '#059669' : '#94a3b8'} />
                  <span>Build from Scratch</span>
                </button>
                <button
                  type="button"
                  onClick={() => setNewClassSetup(prev => ({ ...prev, mode: 'auto' }))}
                  style={{
                    flex: 1, padding: '10px 12px', background: 'none', border: 'none',
                    borderBottom: newClassSetup.mode === 'auto' ? '2.5px solid #4F46E5' : '2.5px solid transparent',
                    fontWeight: 800, fontSize: '0.88rem',
                    color: newClassSetup.mode === 'auto' ? '#4338ca' : '#64748b',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                  }}
                >
                  <RefreshCw size={15} color={newClassSetup.mode === 'auto' ? '#4F46E5' : '#94a3b8'} />
                  <span>AI Auto-Generate</span>
                </button>
              </div>

              {/* Class & Section Inputs */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Class Grade
                  </label>
                  <input
                    type="text"
                    required
                    value={newClassSetup.className}
                    onChange={(e) => setNewClassSetup(prev => ({ ...prev, className: e.target.value }))}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontSize: '0.9rem', fontWeight: 600 }}
                    placeholder="e.g. Class 6, Class 10"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Section
                  </label>
                  <input
                    type="text"
                    required
                    value={newClassSetup.section}
                    onChange={(e) => setNewClassSetup(prev => ({ ...prev, section: e.target.value }))}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontSize: '0.9rem', fontWeight: 600 }}
                    placeholder="e.g. A, B, SCIENCE"
                  />
                </div>
              </div>

              {/* Advanced Parameters for Scratch Mode */}
              {newClassSetup.mode === 'scratch' && (
                <>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                      Periods Per Day
                    </label>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      {[6, 7, 8, 9, 10].map(num => (
                        <button
                          key={num}
                          type="button"
                          onClick={() => setNewClassSetup(prev => ({ ...prev, periodsPerDay: num }))}
                          style={{
                            flex: 1, padding: '7px 4px', borderRadius: '8px',
                            border: `1.5px solid ${newClassSetup.periodsPerDay === num ? '#059669' : '#cbd5e1'}`,
                            background: newClassSetup.periodsPerDay === num ? '#ecfdf5' : 'white',
                            color: newClassSetup.periodsPerDay === num ? '#065f46' : '#475569',
                            fontWeight: 800, fontSize: '0.82rem', cursor: 'pointer'
                          }}
                        >
                          {num}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                        Day Start Time
                      </label>
                      <input
                        type="time"
                        value={newClassSetup.startTime}
                        onChange={(e) => setNewClassSetup(prev => ({ ...prev, startTime: e.target.value }))}
                        style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '0.88rem', fontWeight: 600 }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                        Period Duration (Mins)
                      </label>
                      <input
                        type="number"
                        min="20"
                        max="120"
                        value={newClassSetup.periodDurationMinutes}
                        onChange={(e) => setNewClassSetup(prev => ({ ...prev, periodDurationMinutes: Number(e.target.value) }))}
                        style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '0.88rem', fontWeight: 600 }}
                      />
                    </div>
                  </div>
                </>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setIsSetupClassModalOpen(false)}
                  style={{ padding: '9px 16px', borderRadius: '10px', border: '1px solid #cbd5e1', background: 'white', color: '#64748b', fontWeight: 700, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAutoGenerating}
                  style={{
                    padding: '9px 20px', borderRadius: '10px', border: 'none',
                    background: newClassSetup.mode === 'scratch' ? 'linear-gradient(135deg, #059669 0%, #10b981 100%)' : '#4F46E5',
                    color: 'white', fontWeight: 700, cursor: isAutoGenerating ? 'not-allowed' : 'pointer'
                  }}
                >
                  {isAutoGenerating ? 'Initializing...' : 'Initialize Timetable'}
                </button>
              </div>

            </form>
          </div>
        </div>,
        document.body
      )}

      {/* RESET TIMETABLE TO SCRATCH MODAL */}
      {isResetModalOpen && createPortal(
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 10000, padding: '20px'
        }}>
          <div style={{
            background: 'white', borderRadius: '20px', width: '100%', maxWidth: '520px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', overflow: 'hidden'
          }}>
            <div style={{
              padding: '20px 24px', borderBottom: '1px solid #fecaca',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              background: 'linear-gradient(135deg, #fff1f2 0%, #ffe4e6 100%)'
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#9f1239', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <RotateCcw size={18} color="#e11d48" /> Reset Timetable to Scratch
                </h3>
                <div style={{ fontSize: '0.8rem', color: '#be123c', marginTop: '2px' }}>
                  Target: <strong>{selectedTimetableClass}</strong>
                </div>
              </div>
              <button
                onClick={() => setIsResetModalOpen(false)}
                style={{ background: 'white', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '6px', cursor: 'pointer', display: 'flex' }}
              >
                <X size={18} color="#64748b" />
              </button>
            </div>

            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div 
                onClick={() => setResetOptions(prev => ({ ...prev, resetType: 'blank_slots' }))}
                style={{
                  padding: '14px', borderRadius: '12px', cursor: 'pointer',
                  border: `2px solid ${resetOptions.resetType === 'blank_slots' ? '#059669' : '#e2e8f0'}`,
                  background: resetOptions.resetType === 'blank_slots' ? '#ecfdf5' : 'white'
                }}
              >
                <div style={{ fontWeight: 800, color: '#065f46' }}>
                  Initialize Clean Blank Slots (P1 to P{resetOptions.periodsPerDay})
                </div>
                <div style={{ fontSize: '0.78rem', color: '#047857', marginTop: '2px' }}>
                  Creates 8 blank slots ready to assign subjects individually.
                </div>
              </div>

              <div 
                onClick={() => setResetOptions(prev => ({ ...prev, resetType: 'clear_all' }))}
                style={{
                  padding: '14px', borderRadius: '12px', cursor: 'pointer',
                  border: `2px solid ${resetOptions.resetType === 'clear_all' ? '#dc2626' : '#e2e8f0'}`,
                  background: resetOptions.resetType === 'clear_all' ? '#fef2f2' : 'white'
                }}
              >
                <div style={{ fontWeight: 800, color: '#991b1b' }}>
                  Wipe to 0 Periods Completely
                </div>
                <div style={{ fontSize: '0.78rem', color: '#b91c1c', marginTop: '2px' }}>
                  Clears all periods for this class.
                </div>
              </div>
            </div>

            <div style={{ padding: '16px 24px', borderTop: '1px solid #e2e8f0', background: '#f8fafc', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setIsResetModalOpen(false)}
                style={{ padding: '9px 16px', borderRadius: '10px', border: '1px solid #cbd5e1', background: 'white', color: '#64748b', fontWeight: 700, cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleResetTimetable}
                disabled={isResetting}
                style={{
                  padding: '9px 20px', borderRadius: '10px', border: 'none',
                  background: resetOptions.resetType === 'clear_all' ? '#dc2626' : '#059669',
                  color: 'white', fontWeight: 700, cursor: isResetting ? 'not-allowed' : 'pointer'
                }}
              >
                {isResetting ? 'Resetting...' : 'Confirm Reset'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* WORKING DAYS & OFF DAYS MODAL */}
      {isWorkingDaysModalOpen && createPortal(
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
              padding: '20px 24px', borderBottom: '1px solid #fed7aa',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              background: 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)'
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#9a3412', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CalendarDays size={18} color="#ea580c" /> Working Days & Holidays
                </h3>
                <div style={{ fontSize: '0.8rem', color: '#c2410c', marginTop: '2px' }}>
                  Target: <strong>{selectedTimetableClass}</strong>
                </div>
              </div>
              <button
                onClick={() => setIsWorkingDaysModalOpen(false)}
                style={{ background: 'white', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '6px', cursor: 'pointer', display: 'flex' }}
              >
                <X size={18} color="#64748b" />
              </button>
            </div>

            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => {
                const isOff = workingDaysDraftOffDays.includes(day);
                return (
                  <div
                    key={day}
                    onClick={() => {
                      if (isOff) {
                        setWorkingDaysDraftOffDays(prev => prev.filter(d => d !== day));
                      } else {
                        setWorkingDaysDraftOffDays(prev => [...prev, day]);
                      }
                    }}
                    style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '12px 16px', borderRadius: '10px', cursor: 'pointer',
                      border: `1.5px solid ${isOff ? '#fca5a5' : '#86efac'}`,
                      background: isOff ? '#fef2f2' : '#f0fdf4'
                    }}
                  >
                    <span style={{ fontWeight: 800, color: isOff ? '#991b1b' : '#166534' }}>{day}</span>
                    <span style={{
                      fontSize: '0.74rem', fontWeight: 800, padding: '3px 8px', borderRadius: '6px',
                      background: isOff ? '#fee2e2' : '#dcfce7', color: isOff ? '#dc2626' : '#15803d'
                    }}>
                      {isOff ? '🏖️ OFF DAY' : '✅ WORKING DAY'}
                    </span>
                  </div>
                );
              })}
            </div>

            <div style={{ padding: '16px 24px', borderTop: '1px solid #e2e8f0', background: '#f8fafc', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setIsWorkingDaysModalOpen(false)}
                style={{ padding: '9px 16px', borderRadius: '10px', border: '1px solid #cbd5e1', background: 'white', color: '#64748b', fontWeight: 700, cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveWorkingDays}
                disabled={isSavingWorkingDays}
                style={{
                  padding: '9px 20px', borderRadius: '10px', border: 'none',
                  background: '#ea580c', color: 'white', fontWeight: 700, cursor: isSavingWorkingDays ? 'not-allowed' : 'pointer'
                }}
              >
                {isSavingWorkingDays ? 'Saving...' : 'Save Days Configuration'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ADD PERIOD MODAL */}
      {isAddPeriodModalOpen && createPortal(
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 10000, padding: '20px'
        }}>
          <div style={{
            background: 'white', borderRadius: '20px', width: '100%', maxWidth: '520px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', overflow: 'hidden'
          }}>
            <div style={{
              padding: '20px 24px', borderBottom: '1px solid #e2e8f0',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)'
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#065f46', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Plus size={20} color="#059669" /> Add Period Slot
                </h3>
                <div style={{ fontSize: '0.8rem', color: '#047857', marginTop: '2px' }}>
                  Target Class: <strong>{selectedTimetableClass}</strong>
                </div>
              </div>
              <button
                onClick={() => setIsAddPeriodModalOpen(false)}
                style={{ background: 'white', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '6px', cursor: 'pointer', display: 'flex' }}
              >
                <X size={18} color="#64748b" />
              </button>
            </div>

            <form onSubmit={handleAddPeriodSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Period Label
                  </label>
                  <input
                    type="text"
                    required
                    value={newPeriodData.periodName}
                    onChange={(e) => setNewPeriodData(prev => ({ ...prev, periodName: e.target.value }))}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '0.88rem', fontWeight: 600 }}
                    placeholder="e.g. P1, P8"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Type
                  </label>
                  <select
                    value={newPeriodData.type}
                    onChange={(e) => setNewPeriodData(prev => ({ ...prev, type: e.target.value, isRecess: e.target.value === 'Recess' }))}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '0.88rem', fontWeight: 600, background: 'white' }}
                  >
                    <option value="Lecture">Lecture</option>
                    <option value="Lab">Lab (Practical)</option>
                    <option value="Tutorial">Tutorial</option>
                    <option value="Activity">Activity / Sports</option>
                    <option value="Assessment">Assessment</option>
                    <option value="Recess">Recess Break</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={newPeriodData.startTime}
                    onChange={(e) => setNewPeriodData(prev => ({ ...prev, startTime: e.target.value }))}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '0.88rem', fontWeight: 600 }}
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
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '0.88rem', fontWeight: 600 }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#f8fafc', padding: '10px 14px', borderRadius: '8px' }}>
                <input
                  type="checkbox"
                  id="addPeriodApplyAllCheck"
                  checked={newPeriodData.applyToAllDays}
                  onChange={(e) => setNewPeriodData(prev => ({ ...prev, applyToAllDays: e.target.checked }))}
                  style={{ width: '16px', height: '16px', accentColor: '#059669', cursor: 'pointer' }}
                />
                <label htmlFor="addPeriodApplyAllCheck" style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155', cursor: 'pointer' }}>
                  Apply to all active weekdays (Monday – Friday)
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setIsAddPeriodModalOpen(false)}
                  style={{ padding: '9px 16px', borderRadius: '10px', border: '1px solid #cbd5e1', background: 'white', color: '#64748b', fontWeight: 700, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAddingPeriod}
                  style={{
                    padding: '9px 20px', borderRadius: '10px', border: 'none',
                    background: '#059669', color: 'white', fontWeight: 700, cursor: isAddingPeriod ? 'not-allowed' : 'pointer'
                  }}
                >
                  {isAddingPeriod ? 'Adding...' : 'Add Period'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* BELL SCHEDULE MODAL */}
      {isBellScheduleModalOpen && createPortal(
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 10000, padding: '20px'
        }}>
          <div style={{
            background: 'white', borderRadius: '20px', width: '100%', maxWidth: '600px',
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
                  Target Class: <strong>{selectedTimetableClass}</strong>
                </div>
              </div>
              <button
                onClick={() => setIsBellScheduleModalOpen(false)}
                style={{ background: 'white', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '6px', cursor: 'pointer', display: 'flex' }}
              >
                <X size={18} color="#64748b" />
              </button>
            </div>

            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '60vh', overflowY: 'auto' }}>
              {bellScheduleList.map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '10px 14px', borderRadius: '10px',
                    border: `1.5px solid ${item.isRecess ? '#f59e0b' : '#e2e8f0'}`,
                    background: item.isRecess ? '#fffbeb' : '#f8fafc'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '90px' }}>
                    {item.isRecess ? <Coffee size={14} color="#d97706" /> : <Clock size={14} color="#4f46e5" />}
                    <span style={{ fontWeight: 800, fontSize: '0.85rem', color: item.isRecess ? '#b45309' : '#1e3a8a' }}>
                      {item.periodName}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      type="time"
                      value={item.startTime}
                      onChange={(e) => {
                        const val = e.target.value;
                        setBellScheduleList(prev => prev.map((p, i) => i === idx ? { ...p, startTime: val } : p));
                      }}
                      style={{ padding: '6px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.82rem', fontWeight: 600 }}
                    />
                    <span>-</span>
                    <input
                      type="time"
                      value={item.endTime}
                      onChange={(e) => {
                        const val = e.target.value;
                        setBellScheduleList(prev => prev.map((p, i) => i === idx ? { ...p, endTime: val } : p));
                      }}
                      style={{ padding: '6px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.82rem', fontWeight: 600 }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div style={{ padding: '16px 24px', borderTop: '1px solid #e2e8f0', background: '#f8fafc', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setIsBellScheduleModalOpen(false)}
                style={{ padding: '9px 16px', borderRadius: '10px', border: '1px solid #cbd5e1', background: 'white', color: '#64748b', fontWeight: 700, cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveBellSchedule}
                disabled={isSavingBellSchedule}
                style={{
                  padding: '9px 20px', borderRadius: '10px', border: 'none',
                  background: '#ea580c', color: 'white', fontWeight: 700, cursor: isSavingBellSchedule ? 'not-allowed' : 'pointer'
                }}
              >
                {isSavingBellSchedule ? 'Saving...' : 'Save Bell Schedule'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* CLASS-WISE SUBJECTS & ACTIVITY CLASSES MODAL (AI MATRIX RESTRICTION) */}
      {isClassCurriculumModalOpen && createPortal(
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 10000, padding: '20px'
        }}>
          <div
            id="class-curriculum-modal"
            style={{
              background: 'white',
              borderRadius: '24px',
              width: '100%',
              maxWidth: '880px',
              height: '90vh',
              maxHeight: '880px',
              boxShadow: '0 25px 60px -15px rgba(15, 23, 42, 0.4), 0 0 0 1px rgba(226, 232, 240, 0.8)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <style>{`
              #class-curriculum-modal *::-webkit-scrollbar {
                width: 6px;
                height: 6px;
              }
              #class-curriculum-modal *::-webkit-scrollbar-track {
                background: #f1f5f9;
                border-radius: 4px;
              }
              #class-curriculum-modal *::-webkit-scrollbar-thumb {
                background: #cbd5e1;
                border-radius: 4px;
              }
              #class-curriculum-modal *::-webkit-scrollbar-thumb:hover {
                background: #94a3b8;
              }
            `}</style>

            {/* Modal Header */}
            <div style={{
              padding: '20px 28px',
              borderBottom: '1px solid #e2e8f0',
              background: 'linear-gradient(to right, #f8fafc, #ffffff)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexShrink: 0
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '14px',
                  background: 'linear-gradient(135deg, #4F46E5, #3730A3)',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 6px 16px rgba(79, 70, 229, 0.3)'
                }}>
                  <BookOpen size={22} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{
                      fontSize: '0.68rem',
                      fontWeight: 800,
                      color: '#4F46E5',
                      background: '#e0e7ff',
                      padding: '2px 8px',
                      borderRadius: '6px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em'
                    }}>
                      AI Matrix Curriculum Control
                    </span>
                    <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>
                      Class-Wise Subjects & Activity Classes
                    </span>
                  </div>
                  <h3 style={{ margin: '4px 0 0 0', fontSize: '1.22rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span>Curriculum for:</span>
                    <select
                      value={`${curriculumClassTarget.className} - ${curriculumClassTarget.section}`}
                      onChange={(e) => {
                        const parts = e.target.value.split(' - ');
                        const nextC = parts[0];
                        const nextS = parts[1] || 'A';
                        setCurriculumClassTarget({ className: nextC, section: nextS });
                        fetchClassCurriculum(nextC, nextS);
                      }}
                      style={{
                        padding: '4px 10px',
                        borderRadius: '8px',
                        border: '1.5px solid #4f46e5',
                        background: '#eff6ff',
                        color: '#1e3a8a',
                        fontWeight: 800,
                        fontSize: '0.92rem',
                        cursor: 'pointer'
                      }}
                    >
                      {effectiveClassesList.map(c => (
                        <option key={`${c.className}-${c.section}`} value={`${c.className} - ${c.section}`}>
                          🏫 {c.className} - Section {c.section}
                        </option>
                      ))}
                    </select>
                  </h3>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsClassCurriculumModalOpen(false)}
                style={{
                  background: '#f8fafc',
                  border: '1px solid #cbd5e1',
                  borderRadius: '10px',
                  padding: '8px',
                  cursor: 'pointer',
                  color: '#64748b',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                onMouseOver={e => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.color = '#0f172a'; }}
                onMouseOut={e => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.color = '#64748b'; }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{
              padding: '20px 28px',
              overflowY: 'auto',
              flex: 1,
              minHeight: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: '18px'
            }}>
              
              {/* Summary Counters Strip */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                gap: '12px',
                flexShrink: 0
              }}>
                <div style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <div>
                    <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Total Configured</div>
                    <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a', marginTop: '2px' }}>
                      {classAcademicSubjects.length + classActivityClasses.length} Items
                    </div>
                  </div>
                  <Layers size={22} color="#64748b" />
                </div>

                <div style={{
                  background: '#eff6ff',
                  border: '1px solid #bfdbfe',
                  borderRadius: '12px',
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <div>
                    <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#2563eb', textTransform: 'uppercase' }}>Academic Subjects</div>
                    <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#1e40af', marginTop: '2px' }}>
                      {classAcademicSubjects.length} Subjects
                    </div>
                  </div>
                  <BookOpen size={22} color="#2563eb" />
                </div>

                <div style={{
                  background: '#fef3c7',
                  border: '1px solid #fde68a',
                  borderRadius: '12px',
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <div>
                    <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#b45309', textTransform: 'uppercase' }}>Activity Classes</div>
                    <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#92400e', marginTop: '2px' }}>
                      {classActivityClasses.length} Activities
                    </div>
                  </div>
                  <Activity size={22} color="#d97706" />
                </div>
              </div>

              {/* Quick Presets Bar */}
              <div style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                flexWrap: 'wrap',
                flexShrink: 0
              }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase' }}>
                  ⚡ Quick Presets:
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const subs = ['Mathematics', 'General Science', 'English Literature', 'Social Studies', 'Hindi', 'Computer Applications'];
                    const acts = ['Physical Education / Sports', 'Art & Craft', 'Library & Reading', 'Yoga & Wellness'];
                    setClassAcademicSubjects(subs);
                    setClassActivityClasses(acts);
                  }}
                  style={{
                    background: 'white', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '5px 12px',
                    fontSize: '0.75rem', fontWeight: 700, color: '#334155', cursor: 'pointer'
                  }}
                >
                  Secondary (Class 6 - 10)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const subs = ['Physics', 'Chemistry', 'Mathematics', 'Biology', 'English Core', 'Computer Science'];
                    const acts = ['Physical Education', 'Library & Research', 'STEM Lab Practical'];
                    setClassAcademicSubjects(subs);
                    setClassActivityClasses(acts);
                  }}
                  style={{
                    background: 'white', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '5px 12px',
                    fontSize: '0.75rem', fontWeight: 700, color: '#334155', cursor: 'pointer'
                  }}
                >
                  Senior Science (11 & 12)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const subs = ['Accountancy', 'Business Studies', 'Economics', 'English Core', 'Applied Mathematics'];
                    const acts = ['Physical Education', 'Library & Research', 'Debate & Case Studies'];
                    setClassAcademicSubjects(subs);
                    setClassActivityClasses(acts);
                  }}
                  style={{
                    background: 'white', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '5px 12px',
                    fontSize: '0.75rem', fontWeight: 700, color: '#334155', cursor: 'pointer'
                  }}
                >
                  Senior Commerce (11 & 12)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const subs = ['English Language', 'Mathematics', 'Environmental Studies (EVS)', 'Hindi', 'General Knowledge'];
                    const acts = ['Art & Craft', 'Physical Education / Sports', 'Storytelling & Library', 'Music & Rhymes'];
                    setClassAcademicSubjects(subs);
                    setClassActivityClasses(acts);
                  }}
                  style={{
                    background: 'white', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '5px 12px',
                    fontSize: '0.75rem', fontWeight: 700, color: '#334155', cursor: 'pointer'
                  }}
                >
                  Primary (Class 1 - 5)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setClassAcademicSubjects([]);
                    setClassActivityClasses([]);
                    setClassCurriculumItems([]);
                  }}
                  style={{
                    background: '#fff1f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '5px 12px',
                    fontSize: '0.75rem', fontWeight: 700, color: '#e11d48', cursor: 'pointer', marginLeft: 'auto'
                  }}
                >
                  Clear All
                </button>
              </div>

              {/* Add New Subject / Activity Class Input Box */}
              <div style={{
                background: 'white',
                border: '1.5px solid #c7d2fe',
                borderRadius: '16px',
                padding: '16px',
                boxShadow: '0 2px 8px rgba(79, 70, 229, 0.05)',
                flexShrink: 0
              }}>
                <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#1e3a8a', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Plus size={16} color="#4f46e5" />
                  <span>Add Subject or Activity Class to this Class:</span>
                </div>
                <form
                  onSubmit={handleAddCurriculumItem}
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '10px',
                    alignItems: 'center'
                  }}
                >
                  <div style={{ flex: '2 1 200px', minWidth: '180px' }}>
                    <input
                      id="curriculum-subject-input"
                      type="text"
                      placeholder="e.g. Mathematics, Robotics, Karate"
                      value={newCurriculumInput.name}
                      onChange={(e) => {
                        setNewCurriculumInput({ ...newCurriculumInput, name: e.target.value });
                        if (curriculumFeedback.message) setCurriculumFeedback({ type: '', message: '' });
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddCurriculumItem(e);
                        }
                      }}
                      style={{
                        width: '100%',
                        boxSizing: 'border-box',
                        padding: '10px 14px',
                        borderRadius: '10px',
                        border: curriculumFeedback.type === 'error' ? '1.5px solid #ef4444' : '1px solid #cbd5e1',
                        fontSize: '0.85rem',
                        outline: 'none',
                        transition: 'all 0.2s',
                        background: curriculumFeedback.type === 'error' ? '#fff5f5' : 'white'
                      }}
                    />
                  </div>

                  <div style={{ flex: '1 1 150px', minWidth: '140px' }}>
                    <select
                      value={newCurriculumInput.type}
                      onChange={(e) => setNewCurriculumInput({ ...newCurriculumInput, type: e.target.value })}
                      style={{
                        width: '100%',
                        boxSizing: 'border-box',
                        padding: '10px 12px',
                        borderRadius: '10px',
                        border: '1px solid #cbd5e1',
                        fontSize: '0.85rem',
                        background: 'white',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      <option value="Academic">📚 Academic Subject</option>
                      <option value="Activity">🎨 Activity Class</option>
                      <option value="Lab">🔬 Practical / Lab</option>
                    </select>
                  </div>

                  <div style={{ flex: '1 1 160px', minWidth: '150px' }}>
                    <select
                      value={newCurriculumInput.teacher}
                      onChange={(e) => setNewCurriculumInput({ ...newCurriculumInput, teacher: e.target.value })}
                      style={{
                        width: '100%',
                        boxSizing: 'border-box',
                        padding: '10px 12px',
                        borderRadius: '10px',
                        border: '1px solid #cbd5e1',
                        fontSize: '0.85rem',
                        background: 'white',
                        cursor: 'pointer'
                      }}
                    >
                      <option value="">Default Faculty (Optional)</option>
                      {curriculumStaffList.map(st => {
                        const tName = st.name || `${st.firstName || ''} ${st.lastName || ''}`.trim();
                        return (
                          <option key={st._id} value={tName}>
                            👤 {tName} ({st.department || st.role || 'Faculty'})
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  <div style={{ flex: '1 1 130px', minWidth: '120px' }}>
                    <input
                      type="text"
                      placeholder="Venue (Room 101...)"
                      value={newCurriculumInput.room}
                      onChange={(e) => setNewCurriculumInput({ ...newCurriculumInput, room: e.target.value })}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddCurriculumItem(e);
                        }
                      }}
                      style={{
                        width: '100%',
                        boxSizing: 'border-box',
                        padding: '10px 12px',
                        borderRadius: '10px',
                        border: '1px solid #cbd5e1',
                        fontSize: '0.85rem'
                      }}
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleAddCurriculumItem}
                    style={{
                      flex: '0 0 auto',
                      padding: '10px 22px',
                      borderRadius: '10px',
                      border: 'none',
                      background: '#4f46e5',
                      color: 'white',
                      fontWeight: 700,
                      fontSize: '0.86rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      boxShadow: '0 2px 6px rgba(79, 70, 229, 0.25)',
                      transition: 'all 0.15s ease'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#4338ca'}
                    onMouseLeave={(e) => e.currentTarget.style.background = '#4f46e5'}
                  >
                    <Plus size={16} strokeWidth={2.5} /> Add
                  </button>
                </form>

                {/* Validation and Success Notification Banner */}
                {curriculumFeedback.message && (
                  <div style={{
                    marginTop: '12px',
                    padding: '9px 14px',
                    borderRadius: '8px',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    background: curriculumFeedback.type === 'error' ? '#fef2f2' : curriculumFeedback.type === 'warning' ? '#fffbeb' : '#f0fdf4',
                    border: `1px solid ${curriculumFeedback.type === 'error' ? '#fecaca' : curriculumFeedback.type === 'warning' ? '#fde68a' : '#bbf7d0'}`,
                    color: curriculumFeedback.type === 'error' ? '#b91c1c' : curriculumFeedback.type === 'warning' ? '#b45309' : '#15803d'
                  }}>
                    <span>{curriculumFeedback.type === 'error' || curriculumFeedback.type === 'warning' ? '⚠️' : '✓'}</span>
                    <span>{curriculumFeedback.message}</span>
                  </div>
                )}

              {/* Quick-Pick Suggestions */}
                <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#2563eb' }}>Suggested Academic:</span>
                    {['Mathematics', 'Physics', 'Chemistry', 'Biology', 'General Science', 'English', 'Social Studies', 'Hindi', 'Computer Science', 'Economics'].map(sub => (
                      <button
                        key={sub}
                        type="button"
                        onClick={() => handleQuickAddSubject(sub, 'Academic', 'Room 101')}
                        style={{
                          background: classAcademicSubjects.includes(sub) ? '#dbeafe' : '#f8fafc',
                          color: classAcademicSubjects.includes(sub) ? '#1d4ed8' : '#475569',
                          border: `1px solid ${classAcademicSubjects.includes(sub) ? '#93c5fd' : '#e2e8f0'}`,
                          borderRadius: '6px',
                          padding: '2px 8px',
                          fontSize: '0.72rem',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        {classAcademicSubjects.includes(sub) ? '✓ ' : '+ '}
                        {sub}
                      </button>
                    ))}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#d97706' }}>Suggested Activities:</span>
                    {['Physical Education / Sports', 'Art & Craft', 'Library & Reading', 'Music & Dance', 'Yoga & Wellness', 'Robotics & STEM', 'Debate & Public Speaking', 'Martial Arts'].map(act => (
                      <button
                        key={act}
                        type="button"
                        onClick={() => handleQuickAddSubject(act, 'Activity', act.includes('Sports') ? 'Sports Ground' : act.includes('Art') ? 'Art Studio' : act.includes('Library') ? 'Central Library' : 'Activity Hall')}
                        style={{
                          background: classActivityClasses.includes(act) ? '#fef3c7' : '#f8fafc',
                          color: classActivityClasses.includes(act) ? '#92400e' : '#475569',
                          border: `1px solid ${classActivityClasses.includes(act) ? '#fde68a' : '#e2e8f0'}`,
                          borderRadius: '6px',
                          padding: '2px 8px',
                          fontSize: '0.72rem',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        {classActivityClasses.includes(act) ? '✓ ' : '+ '}
                        {act}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Filter Tabs */}
              <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px', flexShrink: 0 }}>
                {[
                  { id: 'ALL', label: `All Listed (${classAcademicSubjects.length + classActivityClasses.length})` },
                  { id: 'ACADEMIC', label: `Academic Subjects (${classAcademicSubjects.length})` },
                  { id: 'ACTIVITY', label: `Activity Classes (${classActivityClasses.length})` }
                ].map(tab => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setCurriculumActiveTab(tab.id)}
                    style={{
                      background: curriculumActiveTab === tab.id ? '#4f46e5' : '#f8fafc',
                      color: curriculumActiveTab === tab.id ? 'white' : '#475569',
                      border: '1px solid',
                      borderColor: curriculumActiveTab === tab.id ? '#4f46e5' : '#e2e8f0',
                      borderRadius: '8px',
                      padding: '6px 14px',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Items Rendered */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                
                {/* Academic Subjects Block */}
                {(curriculumActiveTab === 'ALL' || curriculumActiveTab === 'ACADEMIC') && (
                  <div>
                    <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#1e3a8a', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <BookOpen size={16} color="#2563eb" />
                      <span>Academic Subjects ({classAcademicSubjects.length})</span>
                    </div>

                    {classAcademicSubjects.length === 0 ? (
                      <div style={{ padding: '16px', border: '1px dashed #cbd5e1', borderRadius: '10px', textAlign: 'center', color: '#94a3b8', fontSize: '0.82rem' }}>
                        No academic subjects listed. Add above or click a quick preset.
                      </div>
                    ) : (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '10px' }}>
                        {classAcademicSubjects.map((sub) => {
                          const currItem = classCurriculumItems.find(i => i.name.toLowerCase() === sub.toLowerCase());
                          return (
                            <div
                              key={sub}
                              style={{
                                border: '1px solid #bfdbfe',
                                background: '#f0f9ff',
                                borderRadius: '12px',
                                padding: '12px 14px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '8px'
                              }}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ fontWeight: 800, color: '#0369a1', fontSize: '0.88rem' }}>
                                  {sub}
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveAcademicSubject(sub)}
                                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: '2px' }}
                                  title="Remove subject from class"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>

                              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                                <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#0284c7', background: '#e0f2fe', padding: '2px 6px', borderRadius: '4px' }}>
                                  Academic
                                </span>
                                <input
                                  type="text"
                                  placeholder="Room (e.g. 101)"
                                  value={currItem?.room || ''}
                                  onChange={(e) => handleCurriculumItemRoomChange(sub, e.target.value)}
                                  style={{
                                    fontSize: '0.72rem',
                                    padding: '3px 6px',
                                    borderRadius: '4px',
                                    border: '1px solid #cbd5e1',
                                    width: '90px'
                                  }}
                                />
                              </div>

                              <select
                                value={currItem?.teacher || ''}
                                onChange={(e) => handleCurriculumItemTeacherChange(sub, e.target.value)}
                                style={{
                                  fontSize: '0.72rem',
                                  padding: '4px 6px',
                                  borderRadius: '6px',
                                  border: '1px solid #cbd5e1',
                                  background: 'white'
                                }}
                              >
                                <option value="">Auto-Assign Certified Teacher</option>
                                {curriculumStaffList.map(st => {
                                  const tName = st.name || `${st.firstName || ''} ${st.lastName || ''}`.trim();
                                  return (
                                    <option key={st._id} value={tName}>
                                      👤 {tName} ({st.department || 'Faculty'})
                                    </option>
                                  );
                                })}
                              </select>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* Activity Classes Block */}
                {(curriculumActiveTab === 'ALL' || curriculumActiveTab === 'ACTIVITY') && (
                  <div>
                    <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#92400e', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Activity size={16} color="#d97706" />
                      <span>Activity & Co-Curricular Classes ({classActivityClasses.length})</span>
                    </div>

                    {classActivityClasses.length === 0 ? (
                      <div style={{ padding: '16px', border: '1px dashed #fde68a', borderRadius: '10px', textAlign: 'center', color: '#b45309', fontSize: '0.82rem', background: '#fffbeb' }}>
                        No activity classes listed. Add activities (PE, Art, Library, Music) above to give students a balanced schedule!
                      </div>
                    ) : (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '10px' }}>
                        {classActivityClasses.map((act) => {
                          const currItem = classCurriculumItems.find(i => i.name.toLowerCase() === act.toLowerCase());
                          return (
                            <div
                              key={act}
                              style={{
                                border: '1px solid #fde68a',
                                background: '#fffbeb',
                                borderRadius: '12px',
                                padding: '12px 14px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '8px'
                              }}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ fontWeight: 800, color: '#92400e', fontSize: '0.88rem' }}>
                                  {act}
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveActivityClass(act)}
                                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: '2px' }}
                                  title="Remove activity class"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>

                              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                                <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#d97706', background: '#fef3c7', padding: '2px 6px', borderRadius: '4px' }}>
                                  Co-Curricular
                                </span>
                                <input
                                  type="text"
                                  placeholder="Venue (Field, Studio)"
                                  value={currItem?.room || ''}
                                  onChange={(e) => handleCurriculumItemRoomChange(act, e.target.value)}
                                  style={{
                                    fontSize: '0.72rem',
                                    padding: '3px 6px',
                                    borderRadius: '4px',
                                    border: '1px solid #cbd5e1',
                                    width: '120px'
                                  }}
                                />
                              </div>

                              <select
                                value={currItem?.teacher || ''}
                                onChange={(e) => handleCurriculumItemTeacherChange(act, e.target.value)}
                                style={{
                                  fontSize: '0.72rem',
                                  padding: '4px 6px',
                                  borderRadius: '6px',
                                  border: '1px solid #cbd5e1',
                                  background: 'white'
                                }}
                              >
                                <option value="">Auto-Assign Activity Instructor</option>
                                {curriculumStaffList.map(st => {
                                  const tName = st.name || `${st.firstName || ''} ${st.lastName || ''}`.trim();
                                  return (
                                    <option key={st._id} value={tName}>
                                      👤 {tName} ({st.department || 'Staff'})
                                    </option>
                                  );
                                })}
                              </select>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

              </div>
            </div>

            {/* Modal Footer */}
            <div style={{
              padding: '16px 28px',
              borderTop: '1px solid #e2e8f0',
              background: '#f8fafc',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '12px',
              flexShrink: 0
            }}>
              <div style={{ fontSize: '0.8rem', color: '#475569', fontWeight: 600 }}>
                Configuring <strong>{classAcademicSubjects.length}</strong> academic subjects & <strong>{classActivityClasses.length}</strong> activity classes for <strong>{curriculumClassTarget.className} - {curriculumClassTarget.section}</strong>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setIsClassCurriculumModalOpen(false)}
                  style={{
                    padding: '9px 18px',
                    borderRadius: '10px',
                    border: '1px solid #cbd5e1',
                    background: 'white',
                    color: '#475569',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={() => handleSaveClassCurriculum(false)}
                  disabled={curriculumSaving}
                  style={{
                    padding: '9px 18px',
                    borderRadius: '10px',
                    border: '1.5px solid #c7d2fe',
                    background: '#eef2ff',
                    color: '#3730a3',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    cursor: curriculumSaving ? 'not-allowed' : 'pointer'
                  }}
                >
                  {curriculumSaving ? 'Saving...' : 'Save Curriculum'}
                </button>

                <button
                  type="button"
                  onClick={() => handleSaveClassCurriculum(true)}
                  disabled={curriculumSaving || isAutoGenerating}
                  style={{
                    padding: '9px 20px',
                    borderRadius: '10px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #4F46E5 0%, #3730A3 100%)',
                    color: 'white',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    cursor: (curriculumSaving || isAutoGenerating) ? 'not-allowed' : 'pointer',
                    boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <Sparkles size={16} />
                  <span>{(curriculumSaving || isAutoGenerating) ? 'Generating...' : 'Save & Auto-Generate AI Timetable Now'}</span>
                </button>
              </div>
            </div>

          </div>
        </div>,
        document.body
      )}

    </div>
  );
};

export default Timetable;
