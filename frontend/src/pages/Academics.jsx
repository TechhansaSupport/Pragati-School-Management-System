import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { 
  Search, BookOpen, ChevronLeft, ChevronRight, Plus, X, 
  Calendar, FileText, Award, Clock, Users, User, ShieldCheck, 
  Edit, Trash2, RefreshCw, LayoutGrid, List, CheckCircle2, 
  GraduationCap, Building, AlertCircle, ArrowRight
} from 'lucide-react';
import CreateSchoolModal from '../components/CreateSchoolModal';

const API_BASE = 'http://localhost:5000/api';

const standardGrades = [
  'Nursery', 'LKG', 'UKG', 
  'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5', 
  'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10', 
  'Class 11', 'Class 12'
];

const standardSections = ['A', 'B', 'C', 'D', 'Science', 'Commerce', 'Arts'];

const institutionalSubjects = [
  { name: 'Mathematics', code: 'MATH-101', dept: 'Science & Math', grades: 'All Grades', icon: Award, color: '#2563eb' },
  { name: 'General Science', code: 'SCI-102', dept: 'Science', grades: 'Class 1 to 10', icon: BookOpen, color: '#059669' },
  { name: 'Physics', code: 'PHY-201', dept: 'Science', grades: 'Class 11 & 12', icon: Award, color: '#7c3aed' },
  { name: 'Chemistry', code: 'CHEM-202', dept: 'Science', grades: 'Class 11 & 12', icon: Award, color: '#d97706' },
  { name: 'English Literature', code: 'ENG-101', dept: 'Languages', grades: 'All Grades', icon: BookOpen, color: '#2563eb' },
  { name: 'Social Studies', code: 'SST-103', dept: 'Humanities', grades: 'Class 1 to 10', icon: BookOpen, color: '#dc2626' },
  { name: 'Computer Science', code: 'CS-301', dept: 'Technology', grades: 'Class 6 to 12', icon: Award, color: '#0284c7' },
  { name: 'Accountancy & Commerce', code: 'COMM-401', dept: 'Commerce', grades: 'Class 11 & 12', icon: Award, color: '#16a34a' },
];

const standardAssessmentSchedules = [
  { title: 'Mid-Term Examinations 2026', date: 'October 25 - November 5, 2026', status: 'Published', grades: 'Class 6th to 12th' },
  { title: 'Unit Assessment 3 (Primary)', date: 'November 12 - November 18, 2026', status: 'Scheduled', grades: 'Class 1st to 5th' },
  { title: 'Pre-Board Mock Examinations', date: 'December 10 - December 22, 2026', status: 'Draft', grades: 'Class 10th & 12th' },
];

const Academics = () => {
  // Authentication & Session Context
  const userInfo = JSON.parse(sessionStorage.getItem('userInfo') || '{}');
  const token = userInfo.token || '';
  const userRole = (sessionStorage.getItem('userRole') || userInfo.role || 'admin').toLowerCase();
  const tenantSlug = sessionStorage.getItem('tenantSlug') || userInfo.slug || userInfo.tenantSlug || '';

  const isAdmin = ['admin', 'superadmin', 'principal', 'frontdesk'].includes(userRole);

  // Data States
  const [classesList, setClassesList] = useState([]);
  const [schoolsList, setSchoolsList] = useState([]);
  const [isCreateSchoolOpen, setIsCreateSchoolOpen] = useState(false);
  const [distinctGrades, setDistinctGrades] = useState([]);
  const [teachersList, setTeachersList] = useState([]);
  const [stats, setStats] = useState({
    totalClasses: 0,
    totalSections: 0,
    assignedTeachers: 0,
    totalCapacity: 0,
    totalStudents: 0,
    overallOccupancy: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);

  // Tabs & Views
  const [mainTab, setMainTab] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('tab') || 'classes';
  });
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'

  // Smart Timetable Generator State (Sections 9.11 & 10.5) - MongoDB Connected
  const [selectedTimetableClass, setSelectedTimetableClass] = useState('Class 10 - A');
  const [timetableSchedule, setTimetableSchedule] = useState({});
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
  const [editPeriodModal, setEditPeriodModal] = useState({
    open: false,
    day: '',
    periodIndex: 0,
    data: {
      periodNumber: 1,
      periodName: 'P1',
      startTime: '08:30',
      endTime: '09:20',
      subject: 'Mathematics',
      teacher: '',
      room: 'Room 201',
      type: 'Lecture'
    }
  });
  const [isPeriodSaving, setIsPeriodSaving] = useState(false);

  // Sync tab with URL search params
  useEffect(() => {
    const handleUrlChange = () => {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get('tab');
      if (tab) setMainTab(tab);
    };
    window.addEventListener('popstate', handleUrlChange);
    return () => window.removeEventListener('popstate', handleUrlChange);
  }, []);

  // Fetch live timetable from MongoDB for selected class
  const fetchLiveTimetable = async (className, section) => {
    if (!className || !section) return;
    setTimetableLoading(true);
    try {
      const res = await fetch(
        `${API_BASE}/timetable?className=${encodeURIComponent(className)}&section=${encodeURIComponent(section)}`,
        { headers: getAuthHeaders() }
      );
      if (res.ok) {
        const data = await res.json();
        if (data.timetable && data.timetable.schedule) {
          setTimetableSchedule(data.timetable.schedule);
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
      const c = parts[0] || selectedTimetableClass;
      const s = parts[1] || 'A';
      fetchLiveTimetable(c, s);
    }
  }, [selectedTimetableClass]);

  const handleValidateConflicts = async () => {
    setIsValidatingConflicts(true);
    try {
      const res = await fetch(`${API_BASE}/timetable/conflicts`, { headers: getAuthHeaders() });
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
    setIsAutoGenerating(true);
    try {
      const parts = selectedTimetableClass.split(' - ');
      const className = parts[0] || selectedTimetableClass;
      const section = parts[1] || 'A';

      const res = await fetch(`${API_BASE}/timetable/auto-generate`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ className, section })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.timetable?.schedule) {
          setTimetableSchedule(data.timetable.schedule);
        }
        setTimetableNotification(`✅ Collision-free timetable auto-generated and saved to DB for ${selectedTimetableClass}!`);
      } else {
        setTimetableNotification('⚠️ Failed to auto-generate timetable');
      }
    } catch (err) {
      setTimetableNotification('⚠️ Connection error generating timetable');
    } finally {
      setIsAutoGenerating(false);
      setTimeout(() => setTimetableNotification(''), 4500);
    }
  };

  const handleSaveEditedPeriod = async () => {
    if (!editPeriodModal.data) return;
    setIsPeriodSaving(true);
    try {
      const parts = selectedTimetableClass.split(' - ');
      const className = parts[0] || selectedTimetableClass;
      const section = parts[1] || 'A';

      const res = await fetch(`${API_BASE}/timetable/period`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          className,
          section,
          day: editPeriodModal.day,
          periodIndex: editPeriodModal.periodIndex,
          periodData: editPeriodModal.data
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.timetable?.schedule) {
          setTimetableSchedule(data.timetable.schedule);
        }
        setEditPeriodModal({ open: false, day: '', periodIndex: 0, data: {} });
        setTimetableNotification(`✅ Period updated in database for ${editPeriodModal.day}!`);
        setTimeout(() => setTimetableNotification(''), 3500);
      }
    } catch (err) {
      console.error('Error saving period:', err);
    } finally {
      setIsPeriodSaving(false);
    }
  };

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [gradeFilter, setGradeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Modals & Drawers
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  const [classToDelete, setClassToDelete] = useState(null);
  const [isDeleteAllModalOpen, setIsDeleteAllModalOpen] = useState(false);
  const [selectedClassForRoster, setSelectedClassForRoster] = useState(null);
  const [rosterLoading, setRosterLoading] = useState(false);
  const [rosterDetails, setRosterDetails] = useState(null);

  // Quick enroll state for class roster
  const [isEnrollStudentOpen, setIsEnrollStudentOpen] = useState(false);
  const [enrollName, setEnrollName] = useState('');
  const [enrollRollNo, setEnrollRollNo] = useState('');
  const [enrollGender, setEnrollGender] = useState('Male');
  const [enrollParent, setEnrollParent] = useState('');
  const [enrollContact, setEnrollContact] = useState('');
  const [enrollError, setEnrollError] = useState('');
  const [enrollLoading, setEnrollLoading] = useState(false);

  // Form State for Creating / Editing
  const initialForm = {
    className: 'Class 10',
    section: 'A',
    classTeacher: '',
    roomNumber: 'Room 101',
    capacity: 40,
    academicSession: '2026-2027',
    subjects: 'Mathematics, Science, English, Social Studies',
    schedule: 'Mon - Fri | 08:30 AM - 02:30 PM',
    status: 'Active',
    schoolSlug: '',
  };
  const [formData, setFormData] = useState(initialForm);

  // Request Headers
  const getAuthHeaders = () => {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (tenantSlug) headers['x-tenant-slug'] = tenantSlug;
    return headers;
  };

  // Fetch Classes, Stats and Registered Schools from Backend
  const fetchClassesData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [classesRes, statsRes, teachersRes, schoolsRes] = await Promise.all([
        fetch(`${API_BASE}/classes`, { headers: getAuthHeaders() }),
        fetch(`${API_BASE}/classes/stats`, { headers: getAuthHeaders() }),
        fetch(`${API_BASE}/staff/teachers`, { headers: getAuthHeaders() }),
        fetch(`${API_BASE}/school/list`, { headers: getAuthHeaders() })
      ]);

      if (schoolsRes.ok) {
        const schoolsData = await schoolsRes.json();
        setSchoolsList(schoolsData.schools || []);
      }

      if (!classesRes.ok) throw new Error('Failed to load classes and sections');
      const classesData = await classesRes.json();
      setClassesList(classesData.classes || []);
      setDistinctGrades(classesData.distinctGrades || []);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }

      if (teachersRes.ok) {
        const teachersData = await teachersRes.json();
        setTeachersList(Array.isArray(teachersData) ? teachersData : []);
      }
    } catch (err) {
      console.error('Error fetching academic data:', err);
      setError(err.message || 'Error connecting to server');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchClassesData();
    const handleSchoolUpdate = () => fetchClassesData();
    window.addEventListener('schoolListUpdated', handleSchoolUpdate);
    return () => window.removeEventListener('schoolListUpdated', handleSchoolUpdate);
  }, [tenantSlug]);

  // Open Roster Drawer
  const handleOpenRoster = async (cls) => {
    setSelectedClassForRoster(cls);
    setRosterLoading(true);
    try {
      const res = await fetch(`${API_BASE}/classes/${cls._id}`, { headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        setRosterDetails(data);
      }
    } catch (err) {
      console.error('Failed to load class roster:', err);
    } finally {
      setRosterLoading(false);
    }
  };

  // Quick Enroll Student in Class
  const handleEnrollStudentInClass = async (e) => {
    e.preventDefault();
    if (!enrollName.trim()) {
      setEnrollError('Student full name is required');
      return;
    }
    setEnrollLoading(true);
    setEnrollError('');
    try {
      const res = await fetch(`${API_BASE}/students`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          name: enrollName.trim(),
          rollNo: enrollRollNo.trim() || undefined,
          grade: selectedClassForRoster.className,
          section: selectedClassForRoster.section,
          gender: enrollGender,
          parentName: enrollParent.trim(),
          parentContact: enrollContact.trim(),
          status: 'Active'
        })
      });
      const data = await res.json();
      if (res.ok) {
        setIsEnrollStudentOpen(false);
        setEnrollName('');
        setEnrollRollNo('');
        setEnrollParent('');
        setEnrollContact('');
        await handleOpenRoster(selectedClassForRoster);
        await fetchClassesData();
        window.dispatchEvent(new CustomEvent('schoolListUpdated'));
      } else {
        setEnrollError(data.message || 'Failed to enroll student');
      }
    } catch (err) {
      setEnrollError('Network error: ' + err.message);
    } finally {
      setEnrollLoading(false);
    }
  };

  // Create Class & Section
  const handleCreateClass = async (e) => {
    e.preventDefault();
    if (!isAdmin) {
      alert('Authority required: Only School Administrators can create classes.');
      return;
    }

    if (schoolsList.length === 0) {
      alert('Cannot create class: No school campus registered. Please create a school campus first.');
      setIsCreateSchoolOpen(true);
      return;
    }

    const targetSchoolSlug = formData.schoolSlug || (schoolsList.find(s => s.slug === tenantSlug)?.slug) || schoolsList[0]?.slug;
    if (!targetSchoolSlug) {
      alert('Please select a school campus for this class.');
      return;
    }

    setActionLoading(true);
    try {
      const res = await fetch(`${API_BASE}/classes`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          ...formData,
          schoolSlug: targetSchoolSlug
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || data.error || 'Failed to create class section');
      }

      setIsCreateModalOpen(false);
      setFormData(initialForm);
      await fetchClassesData();
    } catch (err) {
      alert(`Error creating class: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  // Edit Class & Section
  const handleUpdateClass = async (e) => {
    e.preventDefault();
    if (!editingClass) return;

    setActionLoading(true);
    try {
      const res = await fetch(`${API_BASE}/classes/${editingClass._id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || data.error || 'Failed to update class section');
      }

      setEditingClass(null);
      await fetchClassesData();
    } catch (err) {
      alert(`Error updating class: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  // Delete Class Section
  const handleDeleteClass = async () => {
    if (!classToDelete) return;

    setActionLoading(true);
    try {
      const res = await fetch(`${API_BASE}/classes/${classToDelete._id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.message || 'Failed to delete class section');
      }

      setClassToDelete(null);
      if (selectedClassForRoster?._id === classToDelete._id) setSelectedClassForRoster(null);
      await fetchClassesData();
    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  // Delete ALL Classes & Sections
  const handleDeleteAllClasses = async () => {
    setActionLoading(true);
    try {
      const res = await fetch(`${API_BASE}/classes`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.message || 'Failed to delete all classes');
      }

      setIsDeleteAllModalOpen(false);
      setSelectedClassForRoster(null);
      await fetchClassesData();
    } catch (err) {
      alert(`Error deleting all classes: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  // Generate Default Starter Classes on Demand
  const handleSeedDefaultClasses = async () => {
    setActionLoading(true);
    try {
      const res = await fetch(`${API_BASE}/classes/seed`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.message || 'Failed to generate default starter classes');
      }

      await fetchClassesData();
    } catch (err) {
      alert(`Error generating classes: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  // Filter Classes
  const filteredClasses = useMemo(() => {
    return classesList.filter(c => {
      const matchSearch =
        (c.className || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.section || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.classTeacherName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.roomNumber || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.subjects || []).some(sub => sub.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchGrade = gradeFilter === 'All' || c.className === gradeFilter;
      const matchStatus = statusFilter === 'All' || c.status === statusFilter;

      return matchSearch && matchGrade && matchStatus;
    });
  }, [classesList, searchQuery, gradeFilter, statusFilter]);

  const totalPages = Math.ceil(filteredClasses.length / itemsPerPage);
  const paginatedClasses = filteredClasses.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%', minHeight: '100%', fontFamily: "'Outfit', sans-serif" }}>
      
      {/* TOP BANNER WITH ADMIN AUTHORITY */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        flexWrap: 'wrap', 
        gap: '16px',
        background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)',
        padding: '24px 28px',
        borderRadius: '20px',
        color: 'white',
        boxShadow: '0 10px 25px -5px rgba(30, 58, 138, 0.25)'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span style={{ 
              background: 'rgba(255, 255, 255, 0.2)', 
              backdropFilter: 'blur(10px)',
              padding: '4px 10px', 
              borderRadius: '20px', 
              fontSize: '0.75rem', 
              fontWeight: 700, 
              display: 'flex', 
              alignItems: 'center', 
              gap: '6px' 
            }}>
              <ShieldCheck size={14} color="#93c5fd" /> Admin Authority Enforced
            </span>
            <span style={{ fontSize: '0.8rem', color: '#bfdbfe' }}>• Workspace: {tenantSlug}</span>
          </div>
          <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
            School Curriculum & Class Architecture
          </h1>
          <p style={{ margin: '4px 0 0 0', fontSize: '0.9rem', color: '#e0e7ff', opacity: 0.9 }}>
            Administrative console to configure classes, divide sections, assign class teachers, and supervise capacity.
          </p>
        </div>

        {isAdmin ? (
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            {schoolsList.length === 0 ? (
              <button 
                onClick={() => setIsCreateSchoolOpen(true)}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px', 
                  backgroundColor: '#f59e0b', 
                  color: '#ffffff', 
                  border: 'none',
                  padding: '11px 20px',
                  borderRadius: '12px',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  boxShadow: '0 8px 16px rgba(245, 158, 11, 0.3)',
                  transition: 'transform 0.2s',
                }}
                onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
                title="School Campus Required: Create a school first before creating classes"
              >
                <Building size={18} color="#ffffff" /> Create School Campus First
              </button>
            ) : (
              <button 
                onClick={() => {
                  setFormData({
                    ...initialForm,
                    schoolSlug: tenantSlug && schoolsList.some(s => s.slug === tenantSlug) ? tenantSlug : (schoolsList[0]?.slug || '')
                  });
                  setIsCreateModalOpen(true);
                }}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px', 
                  backgroundColor: '#ffffff', 
                  color: '#1e3a8a', 
                  border: 'none',
                  padding: '11px 20px',
                  borderRadius: '12px',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  boxShadow: '0 8px 16px rgba(0,0,0,0.15)',
                  transition: 'transform 0.2s',
                }}
                onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <Plus size={18} color="#2563eb" /> Create Class & Section
              </button>
            )}

            {classesList.length > 0 && (
              <button
                onClick={() => setIsDeleteAllModalOpen(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  backgroundColor: 'rgba(239, 68, 68, 0.2)',
                  color: '#fee2e2',
                  border: '1px solid rgba(254, 202, 202, 0.4)',
                  padding: '11px 18px',
                  borderRadius: '12px',
                  fontWeight: 700,
                  fontSize: '0.86rem',
                  cursor: 'pointer',
                  backdropFilter: 'blur(10px)',
                  transition: 'all 0.2s',
                }}
                onMouseOver={e => { e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.35)'; }}
                onMouseOut={e => { e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.2)'; }}
                title="Delete all classes and sections at once"
              >
                <Trash2 size={16} color="#fca5a5" /> Delete All Classes
              </button>
            )}
          </div>
        ) : (
          <div style={{ background: 'rgba(255,255,255,0.15)', padding: '8px 16px', borderRadius: '10px', fontSize: '0.8rem' }}>
            View-Only Access (Administrator permissions required to create classes)
          </div>
        )}
      </div>

      {/* WARNING BANNER: NO SCHOOL CAMPUS REGISTERED */}
      {schoolsList.length === 0 && (
        <div style={{
          background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
          border: '1.5px solid #fde68a',
          borderRadius: '16px',
          padding: '16px 22px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          boxShadow: '0 4px 12px rgba(217, 119, 6, 0.08)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: '#f59e0b', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Building size={22} />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#92400e' }}>
                No School Campus Registered
              </div>
              <div style={{ fontSize: '0.82rem', color: '#b45309', marginTop: '2px' }}>
                Classes cannot be created or configured without an active School Campus. Please create a School Campus first.
              </div>
            </div>
          </div>
          <button
            onClick={() => setIsCreateSchoolOpen(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              background: '#d97706',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              padding: '10px 18px',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(217, 119, 6, 0.3)',
              whiteSpace: 'nowrap'
            }}
          >
            <Plus size={16} /> Create School Campus
          </button>
        </div>
      )}

      {/* KPI METRIC CARDS */}
      <div className="kpi-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '16px' }}>
        {[
          { label: 'Total Grade Levels', value: stats.totalClasses, color: '#1e3a8a', bg: '#eff6ff', icon: GraduationCap },
          { label: 'Active Class Sections', value: stats.totalSections, color: '#2563eb', bg: '#dbeafe', icon: BookOpen },
          { label: 'Assigned Class Teachers', value: stats.assignedTeachers, color: '#0f766e', bg: '#ccfbf1', icon: User },
          { label: 'Total Student Capacity', value: stats.totalCapacity, color: '#d97706', bg: '#fef3c7', icon: Users, sub: `${stats.overallOccupancy}% Enrolled` }
        ].map((kpi, i) => (
          <div key={i} className="card" style={{ padding: '18px 22px', borderRadius: '16px', border: '1px solid #e2e8f0', background: 'white', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
            <div className="flex-between" style={{ marginBottom: '8px' }}>
              <span className="metric-label" style={{ fontWeight: 600 }}>{kpi.label}</span>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: kpi.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: kpi.color }}>
                <kpi.icon size={18} />
              </div>
            </div>
            <div style={{ fontSize: '1.85rem', fontWeight: 800, color: kpi.color, margin: '4px 0 0 0' }}>
              {isLoading ? '...' : kpi.value}
            </div>
            {kpi.sub && (
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', marginTop: '4px' }}>
                {kpi.sub}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* NAVIGATION TABS */}
      <div style={{ display: 'flex', alignItems: 'center', margin: '4px 0 14px 0' }}>
        <div className="system-tabs-container">
          {[
            { id: 'classes', label: 'Classes & Sections Directory', count: classesList.length, icon: LayoutGrid },
            { id: 'timetable', label: 'Smart Timetable Generator (10.5)', count: 'Conflict-Free', icon: Clock },
            { id: 'subjects', label: 'Subjects Catalog', count: institutionalSubjects.length, icon: BookOpen },
            { id: 'examinations', label: 'Assessment Schedules', count: standardAssessmentSchedules.length, icon: Calendar }
          ].map(tab => {
            const isActive = mainTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setMainTab(tab.id)}
                className={`system-tab-btn ${isActive ? 'active' : ''}`}
              >
                <Icon size={16} />
                <span>{tab.label}</span>
                <span className="system-tab-badge">
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      {mainTab === 'classes' && (
        <div className="card" style={{ display: 'flex', flexDirection: 'column', padding: '24px', borderRadius: '16px', border: '1px solid var(--color-border, #e2e8f0)', background: 'var(--color-surface, #ffffff)', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
          
          {/* Controls Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', flex: 1 }}>
              
              {/* Search */}
              <div style={{ position: 'relative', width: '280px' }}>
                <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted, #64748B)' }} />
                <input 
                  type="text" 
                  placeholder="Search class, section, teacher, room..." 
                  value={searchQuery}
                  onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                  style={{ 
                    width: '100%', 
                    padding: '9px 12px 9px 36px', 
                    borderRadius: '10px', 
                    border: '1px solid var(--color-border, #cbd5e1)', 
                    outline: 'none', 
                    fontSize: '0.85rem',
                    background: 'var(--color-bg, #f8fafc)',
                    color: 'var(--color-text-main, #0F172A)'
                  }}
                />
              </div>

              {/* Grade Filter */}
              <select 
                value={gradeFilter} 
                onChange={e => { setGradeFilter(e.target.value); setCurrentPage(1); }}
                style={{ padding: '9px 12px', borderRadius: '10px', border: '1px solid var(--color-border, #cbd5e1)', fontSize: '0.85rem', color: 'var(--color-text-main, #334155)', background: 'var(--color-surface, white)' }}
              >
                <option value="All">All Grades</option>
                {distinctGrades.map(g => <option key={g} value={g}>{g}</option>)}
              </select>

              {/* Status Filter */}
              <select 
                value={statusFilter} 
                onChange={e => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                style={{ padding: '9px 12px', borderRadius: '10px', border: '1px solid var(--color-border, #cbd5e1)', fontSize: '0.85rem', color: 'var(--color-text-main, #334155)', background: 'var(--color-surface, white)' }}
              >
                <option value="All">All Statuses</option>
                <option value="Active">Active</option>
                <option value="Archived">Archived</option>
              </select>

              {/* View Toggle */}
              <div style={{ display: 'flex', border: '1px solid var(--color-border, #cbd5e1)', borderRadius: '10px', overflow: 'hidden' }}>
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  style={{
                    padding: '8px 12px',
                    border: 'none',
                    background: viewMode === 'grid' ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                    color: viewMode === 'grid' ? 'var(--color-primary, #6366F1)' : 'var(--color-text-muted, #64748b)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                  title="Grid View"
                >
                  <LayoutGrid size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('table')}
                  style={{
                    padding: '8px 12px',
                    border: 'none',
                    background: viewMode === 'table' ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                    color: viewMode === 'table' ? 'var(--color-primary, #6366F1)' : 'var(--color-text-muted, #64748b)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                  title="Table View"
                >
                  <List size={16} />
                </button>
              </div>
            </div>

            <button 
              onClick={fetchClassesData}
              title="Refresh Directory"
              style={{ 
                background: 'var(--color-surface, #f1f5f9)', 
                border: '1px solid var(--color-border, #cbd5e1)', 
                borderRadius: '10px', 
                padding: '8px 14px', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '6px', 
                fontSize: '0.85rem', 
                color: 'var(--color-text-muted, #475569)', 
                cursor: 'pointer' 
              }}
            >
              <RefreshCw size={14} /> Refresh
            </button>
          </div>

          {/* LISTING CONTENT */}
          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748b' }}>
              <RefreshCw size={32} className="spin" style={{ margin: '0 auto 12px', color: '#2563eb' }} />
              <div>Loading school classes and sections from database...</div>
            </div>
          ) : filteredClasses.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748b' }}>
              {schoolsList.length === 0 ? (
                <>
                  <Building size={52} style={{ margin: '0 auto 14px', color: '#f59e0b' }} />
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#92400e', marginBottom: '8px' }}>
                    No School Campus Registered
                  </h3>
                  <p style={{ fontSize: '0.88rem', margin: '0 0 20px 0', maxWidth: '460px', marginLeft: 'auto', marginRight: 'auto', color: '#78350f', lineHeight: 1.5 }}>
                    You cannot create or configure classes because no school campus has been registered yet. Please create a school campus first to establish grade levels and sections.
                  </p>
                  {isAdmin && (
                    <button
                      onClick={() => setIsCreateSchoolOpen(true)}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: '8px',
                        padding: '11px 22px', background: '#d97706', color: 'white',
                        border: 'none', borderRadius: '12px', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer',
                        boxShadow: '0 4px 14px rgba(217, 119, 6, 0.3)'
                      }}
                    >
                      <Plus size={18} /> Create School Campus
                    </button>
                  )}
                </>
              ) : (
                <>
                  <BookOpen size={48} style={{ margin: '0 auto 12px', color: '#cbd5e1' }} />
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#1e3a8a', marginBottom: '6px' }}>
                    {classesList.length === 0 ? 'All Classes Deleted / None Configured' : 'No Classes Found'}
                  </h3>
                  <p style={{ fontSize: '0.85rem', margin: '0 0 18px 0', maxWidth: '420px', marginLeft: 'auto', marginRight: 'auto' }}>
                    {classesList.length === 0 
                      ? 'Your campus currently has 0 class sections configured. You can create a new class or generate starter default classes.'
                      : 'No classes match your current search or grade filter.'}
                  </p>
                  {classesList.length === 0 && isAdmin && (
                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
                      <button
                        onClick={() => {
                          setFormData({
                            ...initialForm,
                            schoolSlug: tenantSlug && schoolsList.some(s => s.slug === tenantSlug) ? tenantSlug : (schoolsList[0]?.slug || '')
                          });
                          setIsCreateModalOpen(true);
                        }}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: '6px',
                          padding: '9px 18px', background: '#2563eb', color: 'white',
                          border: 'none', borderRadius: '10px', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer'
                        }}
                      >
                        <Plus size={16} /> Create Class & Section
                      </button>
                      <button
                        onClick={handleSeedDefaultClasses}
                        disabled={actionLoading}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: '6px',
                          padding: '9px 18px', background: '#f8fafc', color: '#334155',
                          border: '1px solid #cbd5e1', borderRadius: '10px', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer'
                        }}
                      >
                        <RefreshCw size={14} className={actionLoading ? 'spin' : ''} /> Generate Starter Classes
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          ) : viewMode === 'grid' ? (
            
            /* GRID VIEW */
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px', margin: '8px 0 20px 0' }}>
              {paginatedClasses.map(cls => (
                <div 
                  key={cls._id}
                  className="card academic-class-card"
                  style={{
                    borderRadius: '16px',
                    padding: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '14px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
                    transition: 'all 0.2s',
                    position: 'relative'
                  }}
                  onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.borderColor = 'var(--color-primary, #6366F1)'; }}
                  onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'var(--color-border, #e2e8f0)'; }}
                >
                  {/* Card Header: Class & Section */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ 
                          fontSize: '1.25rem', 
                          fontWeight: 800, 
                          color: 'var(--color-text-main, #1e3a8a)' 
                        }}>
                          {cls.className}
                        </span>
                        <span className="academic-section-badge" style={{ 
                          fontSize: '0.85rem', 
                          fontWeight: 800, 
                          padding: '3px 10px', 
                          borderRadius: '8px' 
                        }}>
                          Section {cls.section}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted, #64748b)', marginTop: '2px' }}>
                        Academic Session: {cls.academicSession}
                      </div>
                    </div>

                    <span className={`academic-status-pill ${cls.status === 'Active' ? 'active' : 'archived'}`}>
                      {cls.status}
                    </span>
                  </div>

                  {/* Room & Teacher */}
                  <div className="academic-meta-box" style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '12px', borderRadius: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted, #64748b)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <User size={14} color="#6366f1" /> Class Teacher:
                      </span>
                      {cls.classTeacher && cls.classTeacherName && cls.classTeacherName !== 'Unassigned' ? (
                        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-text-main, #1e3a8a)' }}>
                          {cls.classTeacherName}
                        </span>
                      ) : (
                        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8', fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          Unassigned
                          {isAdmin && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingClass(cls);
                                setFormData({
                                  className: cls.className,
                                  section: cls.section,
                                  classTeacher: '',
                                  roomNumber: cls.roomNumber || '',
                                  capacity: cls.capacity || 40,
                                  academicSession: cls.academicSession || '2026-2027',
                                  subjects: (cls.subjects || []).join(', '),
                                  schedule: cls.schedule || '',
                                  status: cls.status || 'Active',
                                });
                              }}
                              style={{
                                background: '#eef2ff',
                                border: '1px solid #c7d2fe',
                                color: '#4f46e5',
                                borderRadius: '4px',
                                padding: '1px 6px',
                                fontSize: '0.72rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                fontStyle: 'normal'
                              }}
                            >
                              Assign
                            </button>
                          )}
                        </span>
                      )}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted, #64748b)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Building size={14} color="var(--color-text-muted, #64748b)" /> Classroom:
                      </span>
                      <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-main, #334155)' }}>
                        {cls.roomNumber || 'TBD'}
                      </span>
                    </div>
                  </div>

                  {/* Student Capacity & Occupancy Bar */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 600, marginBottom: '6px' }}>
                      <span style={{ color: 'var(--color-text-muted, #475569)' }}>
                        Capacity: {cls.enrolledStudents || 0} / {cls.capacity} Students
                      </span>
                      <span style={{ color: (cls.occupancyPercent || 0) > 90 ? '#ef4444' : '#6366f1' }}>
                        {cls.occupancyPercent || 0}% Occupied
                      </span>
                    </div>
                    <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--color-border, #e2e8f0)', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ 
                        width: `${Math.min(cls.occupancyPercent || 0, 100)}%`, 
                        height: '100%', 
                        backgroundColor: (cls.occupancyPercent || 0) > 90 ? '#ef4444' : '#6366f1',
                        borderRadius: '4px',
                        transition: 'width 0.3s'
                      }} />
                    </div>
                  </div>

                  {/* Subjects Tags */}
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {(cls.subjects || []).slice(0, 3).map((sub, i) => (
                      <span key={i} className="academic-subject-tag">
                        {sub}
                      </span>
                    ))}
                    {(cls.subjects || []).length > 3 && (
                      <span className="academic-subject-tag-more">
                        +{(cls.subjects || []).length - 3} more
                      </span>
                    )}
                  </div>

                  {/* Actions Footer */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '10px', borderTop: '1px solid var(--color-border, #f1f5f9)', marginTop: 'auto' }}>
                    <button
                      onClick={() => handleOpenRoster(cls)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--color-primary, #6366f1)',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      View Student Roster <ArrowRight size={14} />
                    </button>

                    {isAdmin && (
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => {
                            setEditingClass(cls);
                            setFormData({
                              className: cls.className,
                              section: cls.section,
                              classTeacher: cls.classTeacher || '',
                              roomNumber: cls.roomNumber || '',
                              capacity: cls.capacity || 40,
                              academicSession: cls.academicSession || '2026-2027',
                              subjects: (cls.subjects || []).join(', '),
                              schedule: cls.schedule || '',
                              status: cls.status || 'Active',
                            });
                          }}
                          title="Edit Class Section"
                          className="academic-icon-btn"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          onClick={() => setClassToDelete(cls)}
                          title="Delete Section"
                          className="academic-icon-btn academic-btn-danger"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            
            /* TABLE VIEW */
            <div style={{ width: '100%', overflowX: 'auto', minHeight: '160px', marginTop: '8px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #e2e8f0', color: '#64748b', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    <th style={{ padding: '12px 14px' }}>Class & Grade</th>
                    <th style={{ padding: '12px 14px' }}>Section</th>
                    <th style={{ padding: '12px 14px' }}>Class Teacher</th>
                    <th style={{ padding: '12px 14px' }}>Room</th>
                    <th style={{ padding: '12px 14px' }}>Enrollment / Capacity</th>
                    <th style={{ padding: '12px 14px' }}>Subjects</th>
                    <th style={{ padding: '12px 14px' }}>Status</th>
                    <th style={{ padding: '12px 14px', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedClasses.map(cls => (
                    <tr 
                      key={cls._id}
                      style={{ borderBottom: '1px solid #f1f5f9', cursor: 'pointer', transition: 'background-color 0.15s' }}
                      onMouseOver={e => e.currentTarget.style.backgroundColor = '#f8fafc'}
                      onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <td style={{ padding: '14px', fontWeight: 800, color: '#1e3a8a', fontSize: '0.9rem' }} onClick={() => handleOpenRoster(cls)}>
                        {cls.className}
                      </td>
                      <td style={{ padding: '14px' }} onClick={() => handleOpenRoster(cls)}>
                        <span style={{ background: '#dbeafe', color: '#1d4ed8', padding: '2px 8px', borderRadius: '6px', fontWeight: 700, fontSize: '0.8rem' }}>
                          Sec {cls.section}
                        </span>
                      </td>
                      <td style={{ padding: '14px', fontSize: '0.85rem', fontWeight: 600, color: (cls.classTeacher && cls.classTeacherName !== 'Unassigned') ? '#334155' : '#94a3b8', fontStyle: (cls.classTeacher && cls.classTeacherName !== 'Unassigned') ? 'normal' : 'italic' }} onClick={() => handleOpenRoster(cls)}>
                        {(cls.classTeacher && cls.classTeacherName && cls.classTeacherName !== 'Unassigned') ? cls.classTeacherName : 'Unassigned'}
                      </td>
                      <td style={{ padding: '14px', fontSize: '0.85rem', color: '#64748b' }} onClick={() => handleOpenRoster(cls)}>
                        {cls.roomNumber || 'TBD'}
                      </td>
                      <td style={{ padding: '14px', fontSize: '0.85rem' }} onClick={() => handleOpenRoster(cls)}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontWeight: 700, color: '#1e3a8a' }}>{cls.enrolledStudents || 0}/{cls.capacity}</span>
                          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>({cls.occupancyPercent || 0}%)</span>
                        </div>
                      </td>
                      <td style={{ padding: '14px', fontSize: '0.8rem', color: '#475569' }} onClick={() => handleOpenRoster(cls)}>
                        {(cls.subjects || []).slice(0, 2).join(', ')}
                        {(cls.subjects || []).length > 2 && ` +${(cls.subjects || []).length - 2}`}
                      </td>
                      <td style={{ padding: '14px' }} onClick={() => handleOpenRoster(cls)}>
                        <span style={{ 
                          padding: '4px 10px', 
                          borderRadius: '12px', 
                          fontSize: '0.75rem', 
                          fontWeight: 700, 
                          backgroundColor: cls.status === 'Active' ? '#DCFCE7' : '#F1F5F9', 
                          color: cls.status === 'Active' ? '#166534' : '#475569' 
                        }}>
                          {cls.status}
                        </span>
                      </td>
                      <td style={{ padding: '14px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                          <button 
                            onClick={() => handleOpenRoster(cls)}
                            title="View Roster"
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#2563eb' }}
                          >
                            <Users size={16} />
                          </button>
                          {isAdmin && (
                            <>
                              <button 
                                onClick={() => {
                                  setEditingClass(cls);
                                  setFormData({
                                    className: cls.className,
                                    section: cls.section,
                                    classTeacher: cls.classTeacher || '',
                                    roomNumber: cls.roomNumber || '',
                                    capacity: cls.capacity || 40,
                                    academicSession: cls.academicSession || '2026-2027',
                                    subjects: (cls.subjects || []).join(', '),
                                    schedule: cls.schedule || '',
                                    status: cls.status || 'Active',
                                  });
                                }}
                                title="Edit Class"
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#475569' }}
                              >
                                <Edit size={16} />
                              </button>
                              <button 
                                onClick={() => setClassToDelete(cls)}
                                title="Delete Section"
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}
                              >
                                <Trash2 size={16} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          <div className="flex-between" style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #e2e8f0', color: '#64748b', fontSize: '0.85rem' }}>
            <div>Showing {paginatedClasses.length} of {filteredClasses.length} class sections</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button 
                disabled={currentPage === 1} 
                onClick={() => setCurrentPage(p => p - 1)} 
                style={{ background: 'none', border: 'none', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', color: currentPage === 1 ? '#cbd5e1' : '#334155' }}
              >
                <ChevronLeft size={18} />
              </button>
              <span style={{ fontWeight: 600 }}>{currentPage} / {totalPages || 1}</span>
              <button 
                disabled={currentPage >= totalPages} 
                onClick={() => setCurrentPage(p => p + 1)} 
                style={{ background: 'none', border: 'none', cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer', color: currentPage >= totalPages ? '#cbd5e1' : '#334155' }}
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SMART TIMETABLE GENERATOR TAB (Sections 9.11 & 10.5) */}
      {mainTab === 'timetable' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Notification Alert */}
          {timetableNotification && (
            <div style={{ 
              padding: '12px 18px', 
              background: 'rgba(22, 163, 74, 0.1)', 
              border: '1px solid rgba(22, 163, 74, 0.25)', 
              borderRadius: '12px', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '10px', 
              color: '#16a34a',
              fontWeight: 700,
              fontSize: '0.9rem'
            }}>
              <CheckCircle2 size={18} />
              <span>{timetableNotification}</span>
            </div>
          )}

          {/* Control & Constraint Bar */}
          <div className="chart-card" style={{ padding: '22px 26px', background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                <span style={{ background: '#e0e7ff', color: '#4338ca', padding: '3px 10px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 800 }}>
                  SECTION 10.5 CONFLICT ENGINE
                </span>
                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Live Constraint Validation</span>
              </div>
              <h2 style={{ margin: '0 0 4px', fontSize: '1.3rem', fontWeight: 800, color: '#1e3a8a' }}>
                Smart Timetable Matrix & Constraint Validator
              </h2>
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>
                Automated multi-constraint schedule engine resolving faculty availability, room allocations, and period quotas.
              </p>
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
              >
                <RefreshCw size={15} className={isAutoGenerating ? 'spin' : ''} />
                <span>Auto-Optimize Matrix</span>
              </button>

              <button
                onClick={() => window.print()}
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
              >
                <FileText size={15} />
                <span>Print Schedule</span>
              </button>
            </div>
          </div>

          {/* Timetable Feedback Notification */}
          {timetableNotification && (
            <div style={{
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

          {/* Validation Scorecard Status Pills */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
            <div className="chart-card" style={{ padding: '14px 18px', background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: conflictReport.teacherConflicts > 0 ? '#fef2f2' : '#dcfce7', color: conflictReport.teacherConflicts > 0 ? '#dc2626' : '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CheckCircle2 size={20} />
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Teacher Clashes</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: conflictReport.teacherConflicts > 0 ? '#dc2626' : '#166534' }}>
                  {conflictReport.teacherConflicts} Collisions Detected
                </div>
              </div>
            </div>

            <div className="chart-card" style={{ padding: '14px 18px', background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: conflictReport.roomCollisions > 0 ? '#fef2f2' : '#dcfce7', color: conflictReport.roomCollisions > 0 ? '#dc2626' : '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Building size={20} />
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Room Collisions</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: conflictReport.roomCollisions > 0 ? '#dc2626' : '#166534' }}>
                  {conflictReport.roomCollisions} Overlaps
                </div>
              </div>
            </div>

            <div className="chart-card" style={{ padding: '14px 18px', background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#e0e7ff', color: '#4338ca', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Award size={20} />
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Weekly Quota Coverage</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#1e3a8a' }}>30 / 30 Periods (100%)</div>
              </div>
            </div>

            <div className="chart-card" style={{ padding: '14px 18px', background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#fef3c7', color: '#b45309', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Clock size={20} />
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Engine Status</div>
                <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#92400e' }}>{conflictReport.lastChecked}</div>
              </div>
            </div>
          </div>

          {/* 5-DAY INTERACTIVE TIMETABLE MATRIX */}
          <div className="chart-card" style={{ padding: '24px', background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', overflowX: 'auto' }}>
            <div style={{ minWidth: '920px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
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
                /* Day Rows */
                Object.entries(timetableSchedule).filter(([day]) => day !== 'Saturday' || (timetableSchedule[day] && timetableSchedule[day].length > 0)).map(([day, periods]) => (
                  <div key={day} style={{ display: 'grid', gridTemplateColumns: '120px repeat(6, 1fr)', gap: '10px', alignItems: 'stretch' }}>
                    
                    {/* Day Label Header */}
                    <div style={{ 
                      background: '#1e3a8a', 
                      color: 'white', 
                      borderRadius: '12px', 
                      display: 'flex', 
                      flexDirection: 'column', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      padding: '12px 8px',
                      fontWeight: 800,
                      fontSize: '0.95rem'
                    }}>
                      <span>{day}</span>
                      <span style={{ fontSize: '0.72rem', opacity: 0.8, fontWeight: 500, marginTop: '2px' }}>
                        {periods?.length || 0} Periods
                      </span>
                    </div>

                    {/* Period Cards */}
                    {(periods || []).map((p, pIdx) => {
                      const isLab = p.type === 'Lab';
                      const isTutorial = p.type === 'Tutorial';
                      const isActivity = p.type === 'Activity';
                      const isAssess = p.type === 'Assessment';

                      const cardBg = isLab ? '#f0fdf4' : isTutorial ? '#eff6ff' : isActivity ? '#fefce8' : isAssess ? '#fef2f2' : '#f8fafc';
                      const cardBorder = isLab ? '#bbf7d0' : isTutorial ? '#bfdbfe' : isActivity ? '#fef08a' : isAssess ? '#fecaca' : '#e2e8f0';
                      const subjectColor = isLab ? '#166534' : isTutorial ? '#1e40af' : isActivity ? '#854d0e' : isAssess ? '#991b1b' : '#1e3a8a';
                      const periodLabel = p.periodName || (p.period ? p.period.split(' ')[0] : `P${pIdx + 1}`);

                      return (
                        <div 
                          key={pIdx}
                          style={{
                            background: cardBg,
                            border: `1px solid ${cardBorder}`,
                            borderRadius: '12px',
                            padding: '12px',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            boxShadow: '0 1px 4px rgba(0,0,0,0.02)',
                            transition: 'transform 0.15s, box-shadow 0.15s',
                            cursor: 'pointer',
                            position: 'relative'
                          }}
                          onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 10px rgba(0,0,0,0.08)'; }}
                          onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.02)'; }}
                          onClick={() => setEditPeriodModal({
                            open: true,
                            day,
                            periodIndex: pIdx,
                            data: {
                              periodNumber: p.periodNumber || pIdx + 1,
                              periodName: periodLabel,
                              startTime: p.startTime || '08:30',
                              endTime: p.endTime || '09:20',
                              subject: p.subject || '',
                              teacher: p.teacher || '',
                              room: p.room || 'Room 201',
                              type: p.type || 'Lecture'
                            }
                          })}
                          title="Click to edit subject, faculty or room in MongoDB"
                        >
                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                              <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#64748b' }}>
                                {periodLabel}
                              </span>
                              <span style={{ fontSize: '0.65rem', fontWeight: 700, padding: '1px 6px', borderRadius: '4px', background: 'white', color: subjectColor, border: `1px solid ${cardBorder}` }}>
                                {p.type}
                              </span>
                            </div>
                            <div style={{ fontSize: '0.85rem', fontWeight: 800, color: subjectColor, lineHeight: 1.25, marginBottom: '6px' }}>
                              {p.subject}
                            </div>
                          </div>

                          <div style={{ fontSize: '0.72rem', color: '#64748b', display: 'flex', flexDirection: 'column', gap: '2px', borderTop: '1px solid rgba(0,0,0,0.05)', paddingTop: '4px' }}>
                            <span style={{ fontWeight: 600, color: '#334155', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              👤 {p.teacher}
                            </span>
                            <span style={{ color: '#94a3b8' }}>
                              📍 {p.room}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))
              )}

            </div>
          </div>

          {/* EDIT PERIOD MODAL (CONNECTED TO MONGODB) */}
          {editPeriodModal.open && createPortal(
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
                  background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)'
                }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#1e3a8a' }}>
                      Edit Period Schedule
                    </h3>
                    <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '2px' }}>
                      {selectedTimetableClass} • {editPeriodModal.day} ({editPeriodModal.data.periodName})
                    </div>
                  </div>
                  <button
                    onClick={() => setEditPeriodModal({ open: false, day: '', periodIndex: 0, data: {} })}
                    style={{ background: 'white', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '6px', cursor: 'pointer', display: 'flex' }}
                  >
                    <X size={18} color="#64748b" />
                  </button>
                </div>

                <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  
                  {/* Subject */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                      Subject Name
                    </label>
                    <input
                      type="text"
                      value={editPeriodModal.data.subject || ''}
                      onChange={(e) => setEditPeriodModal(prev => ({
                        ...prev,
                        data: { ...prev.data, subject: e.target.value }
                      }))}
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontSize: '0.9rem', fontWeight: 600 }}
                      placeholder="e.g. Mathematics, Chemistry Lab, English"
                    />
                  </div>

                  {/* Teacher Assignment */}
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

                  {/* Room & Period Type */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                        Classroom / Lab
                      </label>
                      <input
                        type="text"
                        value={editPeriodModal.data.room || ''}
                        onChange={(e) => setEditPeriodModal(prev => ({
                          ...prev,
                          data: { ...prev.data, room: e.target.value }
                        }))}
                        style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontSize: '0.9rem', fontWeight: 600 }}
                        placeholder="e.g. Room 201, IT Lab 2"
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                        Period Type
                      </label>
                      <select
                        value={editPeriodModal.data.type || 'Lecture'}
                        onChange={(e) => setEditPeriodModal(prev => ({
                          ...prev,
                          data: { ...prev.data, type: e.target.value }
                        }))}
                        style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontSize: '0.9rem', fontWeight: 600, background: 'white' }}
                      >
                        <option value="Lecture">Lecture</option>
                        <option value="Lab">Lab (Practical)</option>
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

                </div>

                <div style={{
                  padding: '16px 24px', borderTop: '1px solid #e2e8f0', background: '#f8fafc',
                  display: 'flex', justifyContent: 'flex-end', gap: '12px'
                }}>
                  <button
                    onClick={() => setEditPeriodModal({ open: false, day: '', periodIndex: 0, data: {} })}
                    style={{
                      padding: '10px 18px', borderRadius: '10px', border: '1px solid #cbd5e1',
                      background: 'white', color: '#64748b', fontWeight: 700, cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>

                  <button
                    onClick={handleSaveEditedPeriod}
                    disabled={isPeriodSaving}
                    style={{
                      padding: '10px 22px', borderRadius: '10px', border: 'none',
                      background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)',
                      color: 'white', fontWeight: 800, cursor: isPeriodSaving ? 'not-allowed' : 'pointer',
                      display: 'flex', alignItems: 'center', gap: '8px',
                      boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)'
                    }}
                  >
                    {isPeriodSaving ? <RefreshCw size={16} className="spin" /> : <Save size={16} />}
                    <span>{isPeriodSaving ? 'Saving...' : 'Save to MongoDB'}</span>
                  </button>
                </div>
              </div>
            </div>,
            document.body
          )}
        </div>
      )}

      {/* SUBJECTS CATALOG TAB */}
      {mainTab === 'subjects' && (
        <div className="card" style={{ padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0', background: 'white' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1e3a8a', margin: '0 0 4px 0' }}>Institutional Subjects Catalog</h2>
              <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0 }}>Standard subjects taught across primary, middle, and senior secondary grades.</p>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px' }}>
            {institutionalSubjects.map((sub, i) => (
              <div key={i} style={{ padding: '16px', border: '1px solid #e2e8f0', borderRadius: '12px', background: '#f8fafc', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: sub.color, background: 'white', padding: '2px 8px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>{sub.code}</span>
                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{sub.grades}</span>
                </div>
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#1e3a8a' }}>{sub.name}</h3>
                <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Department: {sub.dept}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* EXAMINATIONS TAB */}
      {mainTab === 'examinations' && (
        <div className="card" style={{ padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0', background: 'white' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1e3a8a', margin: '0 0 4px 0' }}>Academic Assessment Schedules</h2>
              <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0 }}>Mid-term assessments, term-end evaluations, and report card timelines.</p>
            </div>
            {isAdmin && (
              <button style={{ padding: '8px 16px', background: '#2563eb', color: 'white', borderRadius: '8px', border: 'none', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }}>
                + Publish Exam Schedule
              </button>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {standardAssessmentSchedules.map((ex, i) => (
              <div key={i} style={{ padding: '16px 20px', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ margin: '0 0 4px 0', fontSize: '1.05rem', fontWeight: 700, color: '#1e3a8a' }}>{ex.title}</h3>
                  <div style={{ fontSize: '0.85rem', color: '#64748b', display: 'flex', gap: '12px' }}>
                    <span><Calendar size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }} />{ex.date}</span>
                    <span>•</span>
                    <span>Applies to: {ex.grades}</span>
                  </div>
                </div>
                <span style={{ padding: '4px 12px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 700, background: ex.status === 'Published' ? '#dcfce7' : '#eff6ff', color: ex.status === 'Published' ? '#166534' : '#1d4ed8' }}>
                  {ex.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL 1: CREATE CLASS & SECTION (ADMIN ONLY) — PORTAL TO BODY */}
      {isCreateModalOpen && createPortal(
        <div style={{ 
          position: 'fixed', 
          top: 0, left: 0, right: 0, bottom: 0, 
          backgroundColor: 'rgba(15, 23, 42, 0.75)', 
          zIndex: 999999, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          backdropFilter: 'blur(6px)',
          WebkitBackdropFilter: 'blur(6px)',
          padding: '20px',
        }}>
          <div style={{ 
            backgroundColor: '#ffffff', 
            borderRadius: '20px', 
            width: '100%', 
            maxWidth: '680px', 
            maxHeight: 'calc(100vh - 40px)',
            display: 'flex', 
            flexDirection: 'column', 
            boxShadow: '0 25px 60px -15px rgba(0,0,0,0.5)', 
            border: '1px solid #e2e8f0', 
            overflow: 'hidden', 
            position: 'relative' 
          }}>
            
            {/* PINNED HEADER */}
            <div style={{ 
              padding: '16px 24px', 
              borderBottom: '1px solid #e2e8f0', 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              background: 'linear-gradient(90deg, #f8fafc 0%, #eff6ff 100%)', 
              flexShrink: 0 
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ShieldCheck size={18} color="#2563eb" />
                  <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#2563eb', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Administrator Authority
                  </span>
                </div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '2px 0 0 0', color: '#1e3a8a' }}>
                  Create New Class & Section
                </h2>
              </div>
              <button 
                type="button" 
                onClick={() => setIsCreateModalOpen(false)}
                style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748b' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* FORM WRAPPER */}
            <form onSubmit={handleCreateClass} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden', margin: 0 }}>
              
              {/* SCROLLABLE FORM BODY */}
              <div style={{ padding: '24px', flex: 1, overflowY: 'auto' }}>
                
                {/* School Campus Status Check */}
                {schoolsList.length === 0 ? (
                  <div style={{
                    background: '#fef2f2',
                    border: '1.5px solid #fecaca',
                    borderRadius: '12px',
                    padding: '16px',
                    marginBottom: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px'
                  }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#fee2e2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <AlertCircle size={22} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 800, color: '#991b1b', fontSize: '0.9rem' }}>
                        School Campus Required
                      </div>
                      <div style={{ fontSize: '0.82rem', color: '#b91c1c', marginTop: '2px' }}>
                        No registered school campus exists. Classes cannot be created without creating a school first.
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setIsCreateModalOpen(false);
                        setIsCreateSchoolOpen(true);
                      }}
                      style={{
                        padding: '8px 14px',
                        borderRadius: '8px',
                        background: '#dc2626',
                        color: 'white',
                        border: 'none',
                        fontWeight: 700,
                        fontSize: '0.82rem',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      + Create School Campus
                    </button>
                  </div>
                ) : (
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#1e3a8a', marginBottom: '8px' }}>
                      1. School Campus *
                    </label>
                    <select
                      required
                      value={formData.schoolSlug}
                      onChange={e => setFormData({ ...formData, schoolSlug: e.target.value })}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '0.85rem', background: 'white' }}
                    >
                      {schoolsList.map(s => (
                        <option key={s.slug} value={s.slug}>
                          {s.name} ({s.slug}){s.isBranch ? ' - Branch Campus' : ' - Main Campus'}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Class / Grade Selection */}
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#1e3a8a', marginBottom: '8px' }}>
                    {schoolsList.length > 0 ? '2. Class / Grade Level *' : 'Class / Grade Level *'}
                  </label>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' }}>
                    {standardGrades.map(g => (
                      <button
                        type="button"
                        key={g}
                        onClick={() => setFormData({ ...formData, className: g })}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '8px',
                          border: formData.className === g ? '2px solid #2563eb' : '1px solid #cbd5e1',
                          background: formData.className === g ? '#eff6ff' : 'white',
                          color: formData.className === g ? '#1d4ed8' : '#334155',
                          fontWeight: formData.className === g ? 700 : 500,
                          fontSize: '0.8rem',
                          cursor: 'pointer'
                        }}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                  <input 
                    type="text" 
                    required 
                    placeholder="Or type custom class name (e.g. Class 11 - Science)" 
                    value={formData.className}
                    onChange={e => setFormData({ ...formData, className: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                  />
                </div>

                {/* Section Selection */}
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#1e3a8a', marginBottom: '8px' }}>
                    {schoolsList.length > 0 ? '3. Section Identifier *' : 'Section Identifier *'}
                  </label>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' }}>
                    {standardSections.map(s => (
                      <button
                        type="button"
                        key={s}
                        onClick={() => setFormData({ ...formData, section: s })}
                        style={{
                          padding: '6px 14px',
                          borderRadius: '8px',
                          border: formData.section === s ? '2px solid #2563eb' : '1px solid #cbd5e1',
                          background: formData.section === s ? '#eff6ff' : 'white',
                          color: formData.section === s ? '#1d4ed8' : '#334155',
                          fontWeight: formData.section === s ? 700 : 500,
                          fontSize: '0.85rem',
                          cursor: 'pointer'
                        }}
                      >
                        Section {s}
                      </button>
                    ))}
                  </div>
                  <input 
                    type="text" 
                    required 
                    placeholder="Or custom section code (e.g. A, B, Rose, Lotus)" 
                    value={formData.section}
                    onChange={e => setFormData({ ...formData, section: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                  />
                </div>

                {/* 3. Teacher & Room Configuration */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '20px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                      Assign Class Teacher
                    </label>
                    <select
                      value={formData.classTeacher}
                      onChange={e => setFormData({ ...formData, classTeacher: e.target.value })}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', background: 'white' }}
                    >
                      <option value="">-- Unassigned (Assign Later) --</option>
                      {teachersList.map(t => (
                        <option key={t._id} value={t._id}>
                          {t.name} ({t.employeeId} - {t.department})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                      Classroom / Room Number
                    </label>
                    <input 
                      type="text" 
                      placeholder="e.g. Room 204 or Science Wing B-1" 
                      value={formData.roomNumber}
                      onChange={e => setFormData({ ...formData, roomNumber: e.target.value })}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                      Maximum Student Capacity
                    </label>
                    <input 
                      type="number" 
                      min="1" 
                      max="100" 
                      value={formData.capacity}
                      onChange={e => setFormData({ ...formData, capacity: e.target.value })}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                      Academic Session
                    </label>
                    <input 
                      type="text" 
                      value={formData.academicSession}
                      onChange={e => setFormData({ ...formData, academicSession: e.target.value })}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                    />
                  </div>
                </div>

                {/* 4. Subjects & Schedule */}
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                    Subjects Taught (comma-separated)
                  </label>
                  <input 
                    type="text" 
                    placeholder="e.g. Mathematics, Physics, Chemistry, English" 
                    value={formData.subjects}
                    onChange={e => setFormData({ ...formData, subjects: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                    Class Daily Schedule / Timings
                  </label>
                  <input 
                    type="text" 
                    placeholder="e.g. Mon - Fri | 08:30 AM - 02:30 PM" 
                    value={formData.schedule}
                    onChange={e => setFormData({ ...formData, schedule: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                  />
                </div>
              </div>

              {/* PINNED FOOTER */}
              <div style={{ 
                padding: '16px 24px', 
                borderTop: '1px solid #e2e8f0', 
                background: '#f8fafc', 
                display: 'flex', 
                justifyContent: 'flex-end', 
                gap: '12px', 
                flexShrink: 0 
              }}>
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  style={{ padding: '10px 18px', borderRadius: '8px', background: 'white', border: '1px solid #cbd5e1', color: '#475569', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading || schoolsList.length === 0}
                  style={{ 
                    padding: '10px 24px', 
                    borderRadius: '8px', 
                    background: schoolsList.length === 0 ? '#94a3b8' : '#2563eb', 
                    border: 'none', 
                    color: 'white', 
                    fontWeight: 700, 
                    fontSize: '0.9rem', 
                    cursor: (schoolsList.length === 0 || actionLoading) ? 'not-allowed' : 'pointer', 
                    boxShadow: schoolsList.length === 0 ? 'none' : '0 4px 12px rgba(37, 99, 235, 0.3)' 
                  }}
                >
                  {actionLoading ? 'Creating Class...' : (schoolsList.length === 0 ? 'School Required (Create School First)' : 'Confirm & Create Class')}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* MODAL 2: EDIT CLASS & SECTION (ADMIN ONLY) — PORTAL TO BODY */}
      {editingClass && createPortal(
        <div style={{ 
          position: 'fixed', 
          top: 0, left: 0, right: 0, bottom: 0, 
          backgroundColor: 'rgba(15, 23, 42, 0.75)', 
          zIndex: 999999, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          backdropFilter: 'blur(6px)',
          WebkitBackdropFilter: 'blur(6px)',
          padding: '20px',
        }}>
          <div style={{ 
            backgroundColor: '#ffffff', 
            borderRadius: '20px', 
            width: '100%', 
            maxWidth: '680px', 
            maxHeight: 'calc(100vh - 40px)',
            display: 'flex', 
            flexDirection: 'column', 
            boxShadow: '0 25px 60px -15px rgba(0,0,0,0.5)', 
            border: '1px solid #e2e8f0', 
            overflow: 'hidden' 
          }}>
            <div style={{ padding: '16px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'linear-gradient(90deg, #f8fafc 0%, #eff6ff 100%)', flexShrink: 0 }}>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '2px 0 0 0', color: '#1e3a8a' }}>
                  Edit {editingClass.className} - Section {editingClass.section}
                </h2>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Update class teacher, classroom, or capacity.</div>
              </div>
              <button 
                type="button" 
                onClick={() => setEditingClass(null)}
                style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748b' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleUpdateClass} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden', margin: 0 }}>
              <div style={{ padding: '24px', flex: 1, overflowY: 'auto' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Class Name</label>
                    <input 
                      type="text" 
                      required 
                      value={formData.className} 
                      onChange={e => setFormData({ ...formData, className: e.target.value })} 
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }} 
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Section</label>
                    <input 
                      type="text" 
                      required 
                      value={formData.section} 
                      onChange={e => setFormData({ ...formData, section: e.target.value })} 
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }} 
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Class Teacher</label>
                    <select
                      value={formData.classTeacher}
                      onChange={e => setFormData({ ...formData, classTeacher: e.target.value })}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', background: 'white' }}
                    >
                      <option value="">-- Unassigned --</option>
                      {teachersList.map(t => (
                        <option key={t._id} value={t._id}>
                          {t.name} ({t.employeeId} - {t.department})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Classroom Number</label>
                    <input 
                      type="text" 
                      value={formData.roomNumber} 
                      onChange={e => setFormData({ ...formData, roomNumber: e.target.value })} 
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }} 
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Maximum Capacity</label>
                    <input 
                      type="number" 
                      min="1" 
                      value={formData.capacity} 
                      onChange={e => setFormData({ ...formData, capacity: e.target.value })} 
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }} 
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Status</label>
                    <select
                      value={formData.status}
                      onChange={e => setFormData({ ...formData, status: e.target.value })}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', background: 'white' }}
                    >
                      <option value="Active">Active</option>
                      <option value="Archived">Archived</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Subjects Taught</label>
                  <input 
                    type="text" 
                    value={formData.subjects} 
                    onChange={e => setFormData({ ...formData, subjects: e.target.value })} 
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }} 
                  />
                </div>
              </div>

              <div style={{ padding: '16px 24px', borderTop: '1px solid #e2e8f0', background: '#f8fafc', display: 'flex', justifyContent: 'flex-end', gap: '12px', flexShrink: 0 }}>
                <button
                  type="button"
                  onClick={() => setEditingClass(null)}
                  style={{ padding: '10px 18px', borderRadius: '8px', background: 'white', border: '1px solid #cbd5e1', color: '#475569', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  style={{ padding: '10px 24px', borderRadius: '8px', background: '#2563eb', border: 'none', color: 'white', fontWeight: 700, fontSize: '0.9rem', cursor: actionLoading ? 'wait' : 'pointer' }}
                >
                  {actionLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* MODAL 3: DELETE CONFIRMATION — PORTAL TO BODY */}
      {classToDelete && createPortal(
        <div style={{ 
          position: 'fixed', 
          top: 0, left: 0, right: 0, bottom: 0, 
          backgroundColor: 'rgba(15, 23, 42, 0.75)', 
          zIndex: 999999, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          backdropFilter: 'blur(6px)',
          padding: '20px'
        }}>
          <div style={{ backgroundColor: 'white', borderRadius: '20px', width: '100%', maxWidth: '440px', padding: '24px', boxShadow: '0 25px 60px -15px rgba(0,0,0,0.4)', textAlign: 'center' }}>
            <div style={{ width: '50px', height: '50px', borderRadius: '50%', background: '#fee2e2', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <AlertCircle size={28} />
            </div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#991b1b', margin: '0 0 8px 0' }}>Delete Class Section?</h2>
            <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0 0 20px 0' }}>
              Are you sure you want to delete <strong>{classToDelete.className} - Section {classToDelete.section}</strong>?
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button 
                onClick={() => setClassToDelete(null)}
                style={{ padding: '10px 18px', borderRadius: '8px', background: 'white', border: '1px solid #cbd5e1', color: '#475569', fontWeight: 600, cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button 
                onClick={handleDeleteClass}
                disabled={actionLoading}
                style={{ padding: '10px 20px', borderRadius: '8px', background: '#dc2626', border: 'none', color: 'white', fontWeight: 700, cursor: actionLoading ? 'wait' : 'pointer' }}
              >
                {actionLoading ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* MODAL: DELETE ALL CLASSES CONFIRMATION */}
      {isDeleteAllModalOpen && createPortal(
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', zIndex: 999999, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(6px)' }}>
          <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '20px', maxWidth: '440px', width: '90%', textAlign: 'center', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', border: '1px solid #fee2e2' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <Trash2 size={28} color="#dc2626" />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#991b1b', margin: '0 0 8px 0' }}>Delete All Classes?</h3>
            <p style={{ fontSize: '0.86rem', color: '#64748b', margin: '0 0 20px 0', lineHeight: 1.5 }}>
              Are you sure you want to permanently delete <strong>all {classesList.length} classes and sections</strong>? This will remove all class schedules and section architectures.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button 
                onClick={() => setIsDeleteAllModalOpen(false)}
                style={{ padding: '10px 18px', borderRadius: '10px', background: 'white', border: '1px solid #cbd5e1', color: '#475569', fontWeight: 600, cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button 
                onClick={handleDeleteAllClasses}
                disabled={actionLoading}
                style={{ padding: '10px 20px', borderRadius: '10px', background: '#dc2626', border: 'none', color: 'white', fontWeight: 700, cursor: actionLoading ? 'wait' : 'pointer' }}
              >
                {actionLoading ? 'Deleting...' : 'Yes, Delete All Classes'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* DRAWER: CLASS SECTION STUDENT ROSTER — PORTAL TO BODY */}
      {selectedClassForRoster && createPortal(
        <>
          <div 
            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.5)', zIndex: 999998, backdropFilter: 'blur(4px)' }} 
            onClick={() => setSelectedClassForRoster(null)} 
          />
          <div style={{ 
            position: 'fixed', top: 0, right: 0, bottom: 0, 
            width: '540px', maxWidth: '92vw', 
            backgroundColor: '#ffffff', 
            zIndex: 999999, 
            boxShadow: '-10px 0 30px rgba(0,0,0,0.15)', 
            display: 'flex', flexDirection: 'column' 
          }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#2563eb', textTransform: 'uppercase' }}>Student Roster</span>
                <h2 style={{ fontSize: '1.3rem', fontWeight: 800, margin: '2px 0 0 0', color: '#1e3a8a' }}>
                  {selectedClassForRoster.className} - Section {selectedClassForRoster.section}
                </h2>
              </div>
              <button 
                onClick={() => setSelectedClassForRoster(null)} 
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: '24px', flex: 1, overflowY: 'auto' }}>
              {/* Summary Box */}
              <div style={{ padding: '16px', background: '#eff6ff', borderRadius: '12px', border: '1px solid #bfdbfe', marginBottom: '20px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Class Teacher</div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 700, color: (selectedClassForRoster.classTeacher && selectedClassForRoster.classTeacherName !== 'Unassigned') ? '#1e3a8a' : '#94a3b8', fontStyle: (selectedClassForRoster.classTeacher && selectedClassForRoster.classTeacherName !== 'Unassigned') ? 'normal' : 'italic' }}>
                      {(selectedClassForRoster.classTeacher && selectedClassForRoster.classTeacherName && selectedClassForRoster.classTeacherName !== 'Unassigned') ? selectedClassForRoster.classTeacherName : 'Unassigned'}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Room & Capacity</div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#1e3a8a' }}>{selectedClassForRoster.roomNumber || 'TBD'} • Max {selectedClassForRoster.capacity}</div>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#1e3a8a', margin: 0 }}>
                  Enrolled Students ({rosterDetails?.students?.length || 0})
                </h3>
                {isAdmin && (
                  <button
                    onClick={() => {
                      setIsEnrollStudentOpen(!isEnrollStudentOpen);
                      setEnrollError('');
                    }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '5px',
                      padding: '6px 12px', background: isEnrollStudentOpen ? '#f1f5f9' : '#4F46E5',
                      color: isEnrollStudentOpen ? '#475569' : 'white',
                      border: 'none', borderRadius: '8px', fontSize: '0.78rem',
                      fontWeight: 700, cursor: 'pointer'
                    }}
                  >
                    {isEnrollStudentOpen ? <X size={13} /> : <Plus size={13} />}
                    {isEnrollStudentOpen ? 'Cancel' : 'Enroll Student'}
                  </button>
                )}
              </div>

              {/* Quick Enroll Form Inside Drawer */}
              {isEnrollStudentOpen && (
                <form onSubmit={handleEnrollStudentInClass} style={{
                  padding: '16px', background: '#f8fafc', border: '1.5px solid #c7d2fe',
                  borderRadius: '14px', marginBottom: '18px', display: 'flex', flexDirection: 'column', gap: '10px'
                }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#4F46E5', textTransform: 'uppercase' }}>
                    Quick Enroll Student into {selectedClassForRoster.className} - Section {selectedClassForRoster.section}
                  </div>

                  {enrollError && (
                    <div style={{ fontSize: '0.8rem', color: '#b91c1c', fontWeight: 600 }}>
                      ⚠️ {enrollError}
                    </div>
                  )}

                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '3px' }}>
                      Student Full Name *
                    </label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. Aarav Sharma"
                      value={enrollName}
                      onChange={e => setEnrollName(e.target.value)}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: '7px', border: '1px solid #cbd5e1', fontSize: '0.84rem', outline: 'none', boxSizing: 'border-box' }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '3px' }}>
                        Roll No (Optional)
                      </label>
                      <input 
                        type="text" 
                        placeholder="Auto-assigned if empty"
                        value={enrollRollNo}
                        onChange={e => setEnrollRollNo(e.target.value)}
                        style={{ width: '100%', padding: '8px 10px', borderRadius: '7px', border: '1px solid #cbd5e1', fontSize: '0.84rem', outline: 'none', boxSizing: 'border-box' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '3px' }}>
                        Gender
                      </label>
                      <select
                        value={enrollGender}
                        onChange={e => setEnrollGender(e.target.value)}
                        style={{ width: '100%', padding: '8px 10px', borderRadius: '7px', border: '1px solid #cbd5e1', fontSize: '0.84rem', outline: 'none', background: 'white', boxSizing: 'border-box' }}
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '3px' }}>
                        Parent / Guardian
                      </label>
                      <input 
                        type="text" 
                        placeholder="Parent Name"
                        value={enrollParent}
                        onChange={e => setEnrollParent(e.target.value)}
                        style={{ width: '100%', padding: '8px 10px', borderRadius: '7px', border: '1px solid #cbd5e1', fontSize: '0.84rem', outline: 'none', boxSizing: 'border-box' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '3px' }}>
                        Parent Contact
                      </label>
                      <input 
                        type="text" 
                        placeholder="+91 Phone"
                        value={enrollContact}
                        onChange={e => setEnrollContact(e.target.value)}
                        style={{ width: '100%', padding: '8px 10px', borderRadius: '7px', border: '1px solid #cbd5e1', fontSize: '0.84rem', outline: 'none', boxSizing: 'border-box' }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '6px' }}>
                    <button
                      type="button"
                      onClick={() => setIsEnrollStudentOpen(false)}
                      style={{ padding: '6px 12px', background: 'white', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={enrollLoading}
                      style={{ padding: '6px 14px', background: '#4F46E5', color: 'white', border: 'none', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' }}
                    >
                      {enrollLoading ? 'Enrolling...' : 'Confirm Enrollment'}
                    </button>
                  </div>
                </form>
              )}

              {rosterLoading ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>Loading student list...</div>
              ) : !rosterDetails?.students || rosterDetails.students.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', background: '#f8fafc', borderRadius: '12px', color: '#64748b' }}>
                  <Users size={32} style={{ margin: '0 auto 8px', color: '#cbd5e1' }} />
                  <p style={{ margin: 0, fontSize: '0.85rem' }}>No students currently enrolled in this specific grade and section.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {rosterDetails.students.map((st, i) => (
                    <div key={st._id || i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', border: '1px solid #f1f5f9', borderRadius: '10px', background: '#ffffff' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#e0e7ff', color: '#3730a3', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.8rem' }}>
                          {st.name?.charAt(0) || 'S'}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: '#1e3a8a', fontSize: '0.85rem' }}>{st.name}</div>
                          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Roll No: {st.rollNo}</div>
                        </div>
                      </div>
                      <span style={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: 700, background: '#dcfce7', padding: '2px 8px', borderRadius: '8px' }}>
                        {st.status || 'Active'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>,
        document.body
      )}

      {/* MODAL 5: CREATE SCHOOL MODAL */}
      <CreateSchoolModal
        isOpen={isCreateSchoolOpen}
        onClose={() => setIsCreateSchoolOpen(false)}
        onSchoolCreated={async (newSchool) => {
          setIsCreateSchoolOpen(false);
          await fetchClassesData();
          window.dispatchEvent(new CustomEvent('schoolListUpdated'));
        }}
        schoolsList={schoolsList}
      />

    </div>
  );
};

export default Academics;
