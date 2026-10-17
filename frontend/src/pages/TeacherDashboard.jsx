import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { 
  Users, BookOpen, Clock, FileText, CheckCircle, Calendar, 
  ChevronRight, Award, Bell, Check, Plus, Trash2, X, Search, 
  CheckSquare, Square, AlertCircle, Sparkles, Send, UserCheck, 
  ArrowUpRight, Edit3, ClipboardList, BookMarked, User
} from 'lucide-react';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, CartesianGrid, YAxis, Legend } from 'recharts';

const API_BASE = 'http://localhost:5000/api';

const TeacherDashboard = () => {
  const tenantSlug = sessionStorage.getItem('tenantSlug') || '';
  const userInfo = JSON.parse(sessionStorage.getItem('userInfo') || '{}');
  const token = userInfo.token || sessionStorage.getItem('token') || '';

  // Calculate dynamic greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  // Main Dashboard State
  const [teacherSummary, setTeacherSummary] = useState({
    teacherName: userInfo.name || 'Mr. Ramesh Singh',
    totalStudents: 142,
    classesCount: 4,
    pendingGrading: 14,
    attendanceRate: '98.5%',
    schedule: [],
    performanceData: [],
  });
  const [isLoading, setIsLoading] = useState(true);

  // Toast Notification State
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: '', type: 'success' });
    }, 3500);
  };

  // Schedule State (with live overrides for marked attendance)
  const [localSchedule, setLocalSchedule] = useState([]);

  // Tasks / Action Required State (Persisted in localStorage)
  const taskStorageKey = `pragati_teacher_tasks_${tenantSlug || 'default'}`;
  const defaultTasks = [
    { id: 1, text: 'Grade Mid-Term Unit Assessments', due: 'Due Today • 14 Pending', priority: 'Urgent', completed: false },
    { id: 2, text: 'Prepare Lesson Plan for Term 2', due: 'By Friday', priority: 'Normal', completed: false },
    { id: 3, text: 'Review Student Attendance Defaulters', due: 'By Next Week', priority: 'Important', completed: false },
  ];

  const [tasks, setTasks] = useState(() => {
    try {
      const saved = localStorage.getItem(taskStorageKey);
      return saved ? JSON.parse(saved) : defaultTasks;
    } catch (e) {
      return defaultTasks;
    }
  });

  const [newTaskText, setNewTaskText] = useState('');
  const [newTaskDue, setNewTaskDue] = useState('Due Tomorrow');
  const [isAddingTask, setIsAddingTask] = useState(false);

  // Sync tasks to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(taskStorageKey, JSON.stringify(tasks));
    } catch (e) {
      console.warn('Failed to save tasks to localStorage');
    }
  }, [tasks, taskStorageKey]);

  // Modals State
  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
  const [selectedClassForAttendance, setSelectedClassForAttendance] = useState(null);
  const [attendanceRoster, setAttendanceRoster] = useState([]);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceNotes, setAttendanceNotes] = useState('');
  const [attendanceSearch, setAttendanceSearch] = useState('');

  const [isRosterModalOpen, setIsRosterModalOpen] = useState(false);
  const [selectedClassForRoster, setSelectedClassForRoster] = useState(null);
  const [rosterStudents, setRosterStudents] = useState([]);
  const [rosterLoading, setRosterLoading] = useState(false);
  const [rosterSearch, setRosterSearch] = useState('');

  const [isTimetableModalOpen, setIsTimetableModalOpen] = useState(false);

  const [isNewAssignmentModalOpen, setIsNewAssignmentModalOpen] = useState(false);
  const [assignmentForm, setAssignmentForm] = useState({
    title: '',
    classSection: 'Class 10 - A',
    subject: 'Mathematics',
    dueDate: '2026-10-24',
    maxMarks: '50',
    instructions: ''
  });

  const [isGradingModalOpen, setIsGradingModalOpen] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [gradeInput, setGradeInput] = useState('');
  const [feedbackInput, setFeedbackInput] = useState('');

  // Sample student submissions awaiting grading
  const [submissions, setSubmissions] = useState([
    { id: 101, studentName: 'Aarav Sharma', rollNo: 'STU-1001', cls: 'Class 10 - A', assignment: 'Calculus & Quadratic Equations', submittedAt: 'Today, 10:45 AM', maxMarks: 50 },
    { id: 102, studentName: 'Diya Patel', rollNo: 'STU-1002', cls: 'Class 10 - A', assignment: 'Calculus & Quadratic Equations', submittedAt: 'Today, 11:20 AM', maxMarks: 50 },
    { id: 103, studentName: 'Vihaan Verma', rollNo: 'STU-1006', cls: 'Class 9 - B', assignment: 'Algebra Homework Set #3', submittedAt: 'Yesterday, 04:15 PM', maxMarks: 25 },
    { id: 104, studentName: 'Sneha Reddy', rollNo: 'STU-1003', cls: 'Class 10 - A', assignment: 'Trigonometry Applications', submittedAt: 'Oct 14, 02:30 PM', maxMarks: 50 },
  ]);

  // Metrics Chart View Mode
  const [metricsMode, setMetricsMode] = useState('submissions'); // 'submissions' | 'attendance'

  // Fetch Teacher Summary from backend
  useEffect(() => {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (tenantSlug) headers['x-tenant-slug'] = tenantSlug;

    fetch(`${API_BASE}/dashboard/teacher-summary`, { headers })
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data) {
          setTeacherSummary(prev => ({
            ...prev,
            ...data,
            teacherName: userInfo.name || data.teacherName || 'Faculty Member',
          }));
          if (data.schedule && data.schedule.length > 0) {
            setLocalSchedule(data.schedule);
          }
        }
      })
      .catch(err => console.warn('Teacher summary fetch error:', err))
      .finally(() => setIsLoading(false));
  }, [tenantSlug, token]);

  // Effective Schedule (defaults if backend schedule is empty)
  const effectiveSchedule = useMemo(() => {
    if (localSchedule.length > 0) return localSchedule;
    if (teacherSummary.schedule.length > 0) return teacherSummary.schedule;
    return [
      { id: 'c1', time: '08:00 AM - 09:00 AM', subject: 'Mathematics', cls: 'Class 10 - A', className: 'Class 10', section: 'A', roomNumber: 'Room 201', students: '40 Capacity', status: 'Completed', color: '#16A34A' },
      { id: 'c2', time: '09:00 AM - 10:00 AM', subject: 'Mathematics', cls: 'Class 9 - B', className: 'Class 9', section: 'B', roomNumber: 'Room 105', students: '40 Capacity', status: 'In Progress', color: '#4F46E5' },
      { id: 'c3', time: '10:15 AM - 11:15 AM', subject: 'Free Period / Grading', cls: 'Staff Room', className: 'Staff Room', section: '-', roomNumber: 'Faculty Lounge', students: '-', status: 'Upcoming', color: '#60A5FA' },
      { id: 'c4', time: '11:15 AM - 12:15 PM', subject: 'Physics & Chemistry', cls: 'Class 11 - SCIENCE', className: 'Class 11', section: 'SCIENCE', roomNumber: 'Lab 2', students: '35 Capacity', status: 'Upcoming', color: '#60A5FA' }
    ];
  }, [localSchedule, teacherSummary.schedule]);

  const performanceList = useMemo(() => {
    if (teacherSummary.performanceData.length > 0) return teacherSummary.performanceData;
    return [
      { name: 'Class 10 A', submitted: 38, pending: 2, attendance: 97 },
      { name: 'Class 9 B', submitted: 35, pending: 5, attendance: 94 },
      { name: 'Class 11 Sci', submitted: 28, pending: 2, attendance: 92 },
      { name: 'Class 8 A', submitted: 32, pending: 3, attendance: 96 }
    ];
  }, [teacherSummary.performanceData]);

  // Open Attendance Modal for a Class
  const handleOpenAttendance = async (cls) => {
    setSelectedClassForAttendance(cls);
    setIsAttendanceModalOpen(true);
    setAttendanceLoading(true);
    setAttendanceNotes('');
    setAttendanceSearch('');

    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (tenantSlug) headers['x-tenant-slug'] = tenantSlug;

    const classNameClean = cls.className || (cls.cls ? cls.cls.split(' - ')[0] : 'Class 10');
    const sectionClean = cls.section || (cls.cls ? cls.cls.split(' - ')[1] : 'A');

    try {
      const res = await fetch(`${API_BASE}/dashboard/teacher/roster/${encodeURIComponent(classNameClean)}/${encodeURIComponent(sectionClean)}`, { headers });
      const data = await res.json();
      if (data && data.students && data.students.length > 0) {
        setAttendanceRoster(data.students.map(s => ({
          ...s,
          status: 'Present' // Default to present
        })));
      } else {
        // Fallback realistic students
        setAttendanceRoster([
          { id: 's1', name: 'Aarav Sharma', rollNo: 'STU-1001', gender: 'Male', attendance: 98, status: 'Present' },
          { id: 's2', name: 'Diya Patel', rollNo: 'STU-1002', gender: 'Female', attendance: 95, status: 'Present' },
          { id: 's3', name: 'Sneha Reddy', rollNo: 'STU-1003', gender: 'Female', attendance: 96, status: 'Present' },
          { id: 's4', name: 'Arjun Nair', rollNo: 'STU-1004', gender: 'Male', attendance: 92, status: 'Present' },
          { id: 's5', name: 'Priya Joshi', rollNo: 'STU-1005', gender: 'Female', attendance: 99, status: 'Present' },
          { id: 's6', name: 'Rohan Gupta', rollNo: 'STU-1006', gender: 'Male', attendance: 88, status: 'Present' }
        ]);
      }
    } catch (err) {
      console.warn('Error fetching roster:', err);
      setAttendanceRoster([
        { id: 's1', name: 'Aarav Sharma', rollNo: 'STU-1001', gender: 'Male', attendance: 98, status: 'Present' },
        { id: 's2', name: 'Diya Patel', rollNo: 'STU-1002', gender: 'Female', attendance: 95, status: 'Present' },
        { id: 's3', name: 'Sneha Reddy', rollNo: 'STU-1003', gender: 'Female', attendance: 96, status: 'Present' },
      ]);
    } finally {
      setAttendanceLoading(false);
    }
  };

  // Toggle single student attendance status
  const handleToggleStudentStatus = (studentId, newStatus) => {
    setAttendanceRoster(prev => prev.map(s => s.id === studentId ? { ...s, status: newStatus } : s));
  };

  // Bulk mark all present / absent
  const handleBulkAttendance = (status) => {
    setAttendanceRoster(prev => prev.map(s => ({ ...s, status })));
  };

  // Submit Attendance
  const handleSaveAttendance = async () => {
    if (!selectedClassForAttendance) return;
    const classNameClean = selectedClassForAttendance.className || (selectedClassForAttendance.cls ? selectedClassForAttendance.cls.split(' - ')[0] : 'Class 10');
    const sectionClean = selectedClassForAttendance.section || (selectedClassForAttendance.cls ? selectedClassForAttendance.cls.split(' - ')[1] : 'A');

    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (tenantSlug) headers['x-tenant-slug'] = tenantSlug;

    try {
      await fetch(`${API_BASE}/dashboard/teacher/attendance`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          className: classNameClean,
          section: sectionClean,
          records: attendanceRoster.map(s => ({ studentId: s.id, status: s.status }))
        })
      });
    } catch (err) {
      console.warn('Attendance sync error:', err);
    }

    // Update local schedule to reflect 'Completed'
    setLocalSchedule(prev => {
      const targetList = prev.length > 0 ? prev : effectiveSchedule;
      return targetList.map(item => {
        if (item.cls === selectedClassForAttendance.cls || (item.className === classNameClean && item.section === sectionClean)) {
          return { ...item, status: 'Completed', color: '#16A34A' };
        }
        return item;
      });
    });

    setIsAttendanceModalOpen(false);
    const presentCount = attendanceRoster.filter(s => s.status === 'Present').length;
    showToast(`✅ Attendance recorded for ${selectedClassForAttendance.cls}! (${presentCount}/${attendanceRoster.length} Present)`);
  };

  // Open Class Roster Modal
  const handleOpenRoster = async (cls) => {
    setSelectedClassForRoster(cls);
    setIsRosterModalOpen(true);
    setRosterLoading(true);
    setRosterSearch('');

    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (tenantSlug) headers['x-tenant-slug'] = tenantSlug;

    const classNameClean = cls.className || (cls.cls ? cls.cls.split(' - ')[0] : 'Class 10');
    const sectionClean = cls.section || (cls.cls ? cls.cls.split(' - ')[1] : 'A');

    try {
      const res = await fetch(`${API_BASE}/dashboard/teacher/roster/${encodeURIComponent(classNameClean)}/${encodeURIComponent(sectionClean)}`, { headers });
      const data = await res.json();
      if (data && data.students && data.students.length > 0) {
        setRosterStudents(data.students);
      } else {
        setRosterStudents([
          { id: 's1', name: 'Aarav Sharma', rollNo: 'STU-1001', gender: 'Male', attendance: 98, parentContact: '+91 98201 12345', email: 'aarav.sharma@pragati.edu' },
          { id: 's2', name: 'Diya Patel', rollNo: 'STU-1002', gender: 'Female', attendance: 95, parentContact: '+91 98201 12346', email: 'diya.patel@pragati.edu' },
          { id: 's3', name: 'Sneha Reddy', rollNo: 'STU-1003', gender: 'Female', attendance: 96, parentContact: '+91 98201 12352', email: 'sneha.reddy@pragati.edu' },
          { id: 's4', name: 'Arjun Nair', rollNo: 'STU-1004', gender: 'Male', attendance: 92, parentContact: '+91 98201 12353', email: 'arjun.nair@pragati.edu' },
          { id: 's5', name: 'Priya Joshi', rollNo: 'STU-1005', gender: 'Female', attendance: 99, parentContact: '+91 98201 12354', email: 'priya.joshi@pragati.edu' }
        ]);
      }
    } catch (err) {
      setRosterStudents([
        { id: 's1', name: 'Aarav Sharma', rollNo: 'STU-1001', gender: 'Male', attendance: 98, parentContact: '+91 98201 12345', email: 'aarav.sharma@pragati.edu' },
        { id: 's2', name: 'Diya Patel', rollNo: 'STU-1002', gender: 'Female', attendance: 95, parentContact: '+91 98201 12346', email: 'diya.patel@pragati.edu' }
      ]);
    } finally {
      setRosterLoading(false);
    }
  };

  // Toggle To-Do Task Completion
  const handleToggleTask = (taskId) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, completed: !t.completed } : t));
  };

  // Add New To-Do Task
  const handleAddTask = (e) => {
    e.preventDefault();
    if (!newTaskText.trim()) return;
    const newTask = {
      id: Date.now(),
      text: newTaskText.trim(),
      due: newTaskDue,
      priority: newTaskDue.includes('Today') ? 'Urgent' : 'Normal',
      completed: false
    };
    setTasks(prev => [newTask, ...prev]);
    setNewTaskText('');
    setIsAddingTask(false);
    showToast('Task added to your Action Required list!');
  };

  // Delete Task
  const handleDeleteTask = (taskId, e) => {
    e.stopPropagation();
    setTasks(prev => prev.filter(t => t.id !== taskId));
    showToast('Task removed from list', 'info');
  };

  // Create Assignment
  const handleCreateAssignment = (e) => {
    e.preventDefault();
    if (!assignmentForm.title.trim()) return;
    setIsNewAssignmentModalOpen(false);
    setTeacherSummary(prev => ({
      ...prev,
      pendingGrading: (prev.pendingGrading || 14) + 1
    }));
    showToast(`📚 Assignment "${assignmentForm.title}" published for ${assignmentForm.classSection}!`);
    setAssignmentForm({
      title: '',
      classSection: 'Class 10 - A',
      subject: 'Mathematics',
      dueDate: '2026-10-24',
      maxMarks: '50',
      instructions: ''
    });
  };

  // Open Grading Modal
  const handleOpenGrading = (sub) => {
    setSelectedSubmission(sub);
    setGradeInput('');
    setFeedbackInput('Good conceptual clarity and organized step-by-step working.');
    setIsGradingModalOpen(true);
  };

  // Submit Grade
  const handleSubmitGrade = (e) => {
    e.preventDefault();
    if (!gradeInput) return;
    setSubmissions(prev => prev.filter(s => s.id !== selectedSubmission.id));
    setTeacherSummary(prev => ({
      ...prev,
      pendingGrading: Math.max(0, (prev.pendingGrading || 14) - 1)
    }));
    setIsGradingModalOpen(false);
    showToast(`⭐ Grade saved: ${gradeInput}/${selectedSubmission.maxMarks} for ${selectedSubmission.studentName}!`);
  };

  return (
    <div className="dashboard-grid">
      {/* Toast Notification */}
      {toast.show && (
        <div style={{
          position: 'fixed',
          top: '24px',
          right: '24px',
          background: toast.type === 'info' ? '#0F766E' : '#16A34A',
          color: 'white',
          padding: '12px 24px',
          borderRadius: '12px',
          boxShadow: '0 10px 25px -5px rgba(0,0,0,0.2)',
          zIndex: 9999,
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          animation: 'fadeIn 0.3s ease-out'
        }}>
          <Sparkles size={18} />
          <span>{toast.message}</span>
        </div>
      )}

      {/* Top Banner - Glassmorphism */}
      <div style={{
        gridColumn: '1 / -1',
        background: 'linear-gradient(135deg, rgba(79,70,229,0.92) 0%, rgba(96,165,250,0.92) 100%)',
        borderRadius: '20px',
        padding: '24px 32px',
        color: 'white',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 10px 25px -5px rgba(99, 102, 241, 0.4)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Subtle decorative circles */}
        <div style={{ position: 'absolute', right: '-40px', top: '-40px', width: '200px', height: '200px', borderRadius: '50%', background: 'rgba(255,255,255,0.08)', pointerEvents: 'none' }}></div>
        <div style={{ position: 'absolute', right: '180px', bottom: '-60px', width: '160px', height: '160px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', pointerEvents: 'none' }}></div>

        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
            {getGreeting()}, {teacherSummary.teacherName}! 👋
          </h2>
          <p style={{ opacity: 0.92, fontSize: '0.95rem', margin: '0 0 16px 0', maxWidth: '650px', lineHeight: 1.5 }}>
            You have {teacherSummary.classesCount || 4} lecture periods scheduled and {teacherSummary.pendingGrading || 14} student assignments awaiting review today in this campus.
          </p>

          {/* Quick Action Pills inside Banner */}
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button 
              onClick={() => handleOpenAttendance(effectiveSchedule[0])}
              style={{
                background: 'rgba(255, 255, 255, 0.2)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                color: 'white',
                padding: '6px 14px',
                borderRadius: '20px',
                fontSize: '0.82rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              className="hover-lift"
            >
              <ClipboardList size={14} /> Quick Attendance
            </button>
            <button 
              onClick={() => setIsNewAssignmentModalOpen(true)}
              style={{
                background: 'rgba(255, 255, 255, 0.2)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                color: 'white',
                padding: '6px 14px',
                borderRadius: '20px',
                fontSize: '0.82rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              className="hover-lift"
            >
              <BookMarked size={14} /> Create Assignment
            </button>
            <button 
              onClick={() => setIsTimetableModalOpen(true)}
              style={{
                background: 'rgba(255, 255, 255, 0.2)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                color: 'white',
                padding: '6px 14px',
                borderRadius: '20px',
                fontSize: '0.82rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              className="hover-lift"
            >
              <Calendar size={14} /> Weekly Timetable
            </button>
          </div>
        </div>

        <div style={{ textAlign: 'right', minWidth: '180px' }}>
          <div style={{ fontSize: '0.9rem', fontWeight: 600, opacity: 0.9, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Live Campus Session</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, marginTop: '2px' }}>
            {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </div>
          <div style={{ fontSize: '0.82rem', opacity: 0.85, marginTop: '4px' }}>
            Campus Term 2026-2027
          </div>
        </div>
      </div>

      {/* LEFT COLUMN */}
      <div className="left-column">
        {/* KPI Row */}
        <div className="kpi-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '16px' }}>
          {[
            { label: 'Total Students', value: teacherSummary.totalStudents || '142', icon: Users, color: '#4F46E5', bg: 'rgba(79,70,229,0.1)', sub: 'Across active batches' },
            { label: 'Active Classes', value: teacherSummary.classesCount || '4', icon: BookOpen, color: '#60A5FA', bg: 'rgba(96,165,250,0.1)', sub: 'Daily Lecture Schedule' },
            { label: 'Pending Grading', value: teacherSummary.pendingGrading || '14', icon: FileText, color: '#0F766E', bg: 'rgba(15, 118, 110,0.1)', sub: 'Assignments & tests' },
            { label: 'Attendance Rate', value: teacherSummary.attendanceRate || '98.5%', icon: CheckCircle, color: '#16A34A', bg: 'rgba(22, 163, 74,0.1)', sub: 'Above target (95%)' }
          ].map((kpi, i) => (
            <div key={i} className="card hover-lift" style={{ 
              display: 'flex', flexDirection: 'column', gap: '10px', 
              padding: '18px 20px', borderRadius: '16px', background: 'var(--color-surface, white)', 
              border: '1px solid var(--color-border, #e2e8f0)', boxShadow: '0 2px 10px rgba(0,0,0,0.02)', 
              transition: 'all 0.3s' 
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: kpi.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <kpi.icon size={22} color={kpi.color} />
                </div>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#16A34A', background: 'rgba(22, 163, 74, 0.08)', padding: '3px 8px', borderRadius: '12px' }}>
                  Active
                </span>
              </div>
              <div>
                <div style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--color-primary)' }}>{kpi.value}</div>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px', marginTop: '2px' }}>
                  {kpi.label}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                  {kpi.sub}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Schedule */}
        <div className="card">
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div className="card-title" style={{ fontSize: '1.1rem', fontWeight: 700 }}>Today's Teaching Schedule (Live DB)</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                Real-time lectures, room allocations, and attendance controls
              </div>
            </div>
            <div 
              onClick={() => setIsTimetableModalOpen(true)}
              style={{ fontSize: '0.85rem', color: '#4F46E5', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
              className="hover-lift"
            >
              View Timetable <ArrowUpRight size={15} />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '12px' }}>
            {effectiveSchedule.map((cls, i) => (
              <div key={i} className="teacher-schedule-card" style={{ 
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                padding: '16px 20px', 
                borderRadius: '14px', 
                borderLeft: `5px solid ${cls.color}`,
                boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
                transition: 'all 0.2s'
              }}>
                <div style={{ display: 'flex', gap: '18px', alignItems: 'center' }}>
                  <div style={{ textAlign: 'right', minWidth: '135px' }}>
                    <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--color-text-main)' }}>{cls.time.split(' - ')[0]}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>{cls.time.split(' - ')[1]}</div>
                  </div>
                  <div style={{ width: '1px', height: '36px', background: 'var(--color-border)' }}></div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: 800, fontSize: '1.02rem', color: 'var(--color-text-main)' }}>{cls.subject}</span>
                      {cls.status === 'In Progress' && (
                        <span style={{ 
                          fontSize: '0.7rem', fontWeight: 700, background: '#4F46E5', color: 'white', 
                          padding: '2px 8px', borderRadius: '10px', textTransform: 'uppercase', letterSpacing: '0.4px',
                          display: 'inline-flex', alignItems: 'center', gap: '4px'
                        }}>
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#4ADE80', display: 'inline-block' }}></span> Live Now
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', marginTop: '3px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: 600, color: 'var(--color-text-main, #334155)' }}>{cls.cls}</span>
                      <span>•</span>
                      <span>{cls.roomNumber || 'Room 201'}</span>
                      <span>•</span>
                      <span>{cls.students}</span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  {/* View Details / Roster Button */}
                  {cls.cls !== 'Staff Room' && (
                    <button 
                      onClick={() => handleOpenRoster(cls)}
                      className="teacher-roster-pill hover-lift"
                      style={{ 
                        padding: '7px 14px', borderRadius: '18px', 
                        fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      Class Roster
                    </button>
                  )}

                  {/* Attendance / Status Button */}
                  <button 
                    onClick={() => {
                      if (cls.cls !== 'Staff Room') handleOpenAttendance(cls);
                    }}
                    className={`teacher-status-action-pill ${cls.status === 'In Progress' ? 'in-progress' : cls.status === 'Completed' ? 'completed' : 'upcoming'} ${cls.status === 'In Progress' ? 'hover-lift' : ''}`}
                    style={{ 
                      padding: '8px 18px', borderRadius: '20px', 
                      fontSize: '0.8rem', fontWeight: 700, 
                      cursor: cls.cls === 'Staff Room' ? 'default' : 'pointer', 
                      transition: 'all 0.2s',
                      display: 'flex', alignItems: 'center', gap: '6px'
                    }} 
                  >
                    {cls.status === 'Completed' ? (
                      <>
                        <Check size={14} /> Attendance Done
                      </>
                    ) : cls.status === 'In Progress' ? (
                      <>
                        <UserCheck size={14} /> Mark Attendance
                      </>
                    ) : (
                      'Upcoming'
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Student Submissions for Grading */}
        <div className="card" style={{ marginTop: '16px' }}>
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Edit3 size={18} color="#4F46E5" />
              <div className="card-title" style={{ fontSize: '1.05rem', fontWeight: 700 }}>Recent Submissions Awaiting Review</div>
            </div>
            <div style={{ fontSize: '0.8rem', color: '#0F766E', fontWeight: 700, background: 'rgba(15, 118, 110, 0.1)', padding: '3px 10px', borderRadius: '12px' }}>
              {submissions.length} Pending
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
            {submissions.map((sub) => (
              <div key={sub.id} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '12px 16px', background: 'var(--color-bg, #f8fafc)', borderRadius: '12px',
                border: '1px solid var(--color-border, #e2e8f0)', transition: 'all 0.2s'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ 
                    width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg, #4F46E5, #60A5FA)', 
                    color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.85rem' 
                  }}>
                    {sub.studentName.charAt(0)}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--color-text-main, #0f172a)' }}>{sub.studentName}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
                      {sub.cls} • {sub.assignment} • <span style={{ color: '#0F766E', fontWeight: 600 }}>{sub.submittedAt}</span>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={() => handleOpenGrading(sub)}
                  style={{
                    background: '#4F46E5', color: 'white', border: 'none',
                    padding: '6px 14px', borderRadius: '16px', fontSize: '0.78rem',
                    fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s'
                  }}
                  className="hover-lift"
                >
                  Grade / Review
                </button>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* RIGHT COLUMN */}
      <div className="right-column">
        {/* Action Required / To-Do */}
        <div className="card">
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Bell size={20} color="#0F766E" />
              <div className="card-title" style={{ fontSize: '1.05rem', fontWeight: 700 }}>Action Required & To-Do</div>
            </div>
            <button 
              onClick={() => setIsAddingTask(prev => !prev)}
              style={{
                background: 'rgba(15, 118, 110, 0.12)', color: '#0F766E',
                border: 'none', padding: '5px 10px', borderRadius: '12px',
                fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '4px'
              }}
              className="hover-lift"
            >
              <Plus size={14} /> Add Task
            </button>
          </div>

          {/* Quick Add Task Form */}
          {isAddingTask && (
            <form onSubmit={handleAddTask} style={{ 
              marginBottom: '14px', padding: '12px', background: 'var(--color-bg, #f8fafc)', 
              borderRadius: '12px', border: '1px solid var(--color-border, #cbd5e1)', display: 'flex', flexDirection: 'column', gap: '8px' 
            }}>
              <input 
                type="text" 
                placeholder="What needs to be done?" 
                value={newTaskText} 
                onChange={(e) => setNewTaskText(e.target.value)} 
                autoFocus
                style={{
                  width: '100%', padding: '8px 12px', borderRadius: '8px', 
                  border: '1px solid var(--color-border, #cbd5e1)', fontSize: '0.85rem', outline: 'none',
                  background: 'var(--color-surface, white)', color: 'var(--color-text-main)'
                }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <select 
                  value={newTaskDue} 
                  onChange={(e) => setNewTaskDue(e.target.value)}
                  style={{
                    padding: '6px 8px', borderRadius: '8px', border: '1px solid var(--color-border, #cbd5e1)', 
                    fontSize: '0.75rem', background: 'var(--color-surface, white)', color: 'var(--color-text-main)'
                  }}
                >
                  <option value="Due Today">Due Today</option>
                  <option value="Due Tomorrow">Due Tomorrow</option>
                  <option value="By Friday">By Friday</option>
                  <option value="By Next Week">By Next Week</option>
                </select>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button 
                    type="button" 
                    onClick={() => setIsAddingTask(false)}
                    style={{ background: 'transparent', border: 'none', color: 'var(--color-text-muted, #64748B)', fontSize: '0.75rem', cursor: 'pointer', padding: '6px 10px' }}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    style={{ background: '#0F766E', color: 'white', border: 'none', borderRadius: '8px', padding: '6px 12px', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}
                  >
                    Save
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* Task List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {tasks.map((task) => (
              <div 
                key={task.id} 
                onClick={() => handleToggleTask(task.id)}
                className={`teacher-todo-item hover-lift ${task.completed ? 'completed' : ''} ${task.priority === 'Urgent' ? 'urgent' : ''}`}
                style={{ 
                  opacity: task.completed ? 0.65 : 1
                }}
              >
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <div style={{ color: task.completed ? '#16A34A' : 'var(--color-text-muted, #64748B)' }}>
                    {task.completed ? <CheckSquare size={18} color="#16A34A" /> : <Square size={18} />}
                  </div>
                  <div>
                    <div style={{ 
                      fontWeight: 600, fontSize: '0.88rem', 
                      color: task.completed ? 'var(--color-text-muted, #64748B)' : 'var(--color-text-main, #1e293b)',
                      textDecoration: task.completed ? 'line-through' : 'none' 
                    }}>
                      {task.text}
                    </div>
                    <div 
                      className={task.priority === 'Urgent' ? 'urgent-text' : ''}
                      style={{ fontSize: '0.74rem', color: task.priority === 'Urgent' ? '#0F766E' : 'var(--color-text-muted)', marginTop: '2px', fontWeight: 600 }}
                    >
                      {task.due}
                    </div>
                  </div>
                </div>

                <button 
                  onClick={(e) => handleDeleteTask(task.id, e)}
                  title="Remove task"
                  className="teacher-todo-delete-btn"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Assignment Submission Rates & Performance Chart */}
        <div className="card" style={{ flex: 1, marginTop: '16px' }}>
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Award size={20} color="#4F46E5" />
              <div className="card-title" style={{ fontSize: '1.05rem', fontWeight: 700 }}>Class Performance Metrics</div>
            </div>
            
            {/* View Switcher */}
            <div style={{ display: 'flex', background: 'var(--color-bg, #f1f5f9)', padding: '2px', borderRadius: '8px', border: '1px solid var(--color-border, transparent)' }}>
              <button 
                onClick={() => setMetricsMode('submissions')}
                style={{
                  background: metricsMode === 'submissions' ? 'var(--color-surface, white)' : 'transparent',
                  color: metricsMode === 'submissions' ? 'var(--color-primary, #4F46E5)' : 'var(--color-text-muted, #64748B)',
                  border: metricsMode === 'submissions' ? '1px solid var(--color-border, transparent)' : 'none',
                  boxShadow: metricsMode === 'submissions' ? '0 1px 4px rgba(0,0,0,0.06)' : 'none',
                  padding: '4px 10px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                Submissions
              </button>
              <button 
                onClick={() => setMetricsMode('attendance')}
                style={{
                  background: metricsMode === 'attendance' ? 'var(--color-surface, white)' : 'transparent',
                  color: metricsMode === 'attendance' ? 'var(--color-primary, #4F46E5)' : 'var(--color-text-muted, #64748B)',
                  border: metricsMode === 'attendance' ? '1px solid var(--color-border, transparent)' : 'none',
                  boxShadow: metricsMode === 'attendance' ? '0 1px 4px rgba(0,0,0,0.06)' : 'none',
                  padding: '4px 10px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                Attendance
              </button>
            </div>
          </div>

          <div style={{ height: '220px', marginTop: '16px' }}>
            <ResponsiveContainer width="100%" height="100%">
              {metricsMode === 'submissions' ? (
                <BarChart data={performanceList} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} dy={8} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} />
                  <Tooltip cursor={{ fill: 'rgba(226,232,240,0.4)' }} />
                  <Bar dataKey="submitted" name="Submitted" stackId="a" fill="#4F46E5" radius={[0, 0, 4, 4]} barSize={28} />
                  <Bar dataKey="pending" name="Pending" stackId="a" fill="#0F766E" radius={[4, 4, 0, 0]} barSize={28} />
                </BarChart>
              ) : (
                <BarChart data={performanceList} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} dy={8} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} domain={[80, 100]} />
                  <Tooltip cursor={{ fill: 'rgba(226,232,240,0.4)' }} formatter={(val) => `${val}%`} />
                  <Bar dataKey="attendance" name="Attendance %" fill="#16A34A" radius={[4, 4, 0, 0]} barSize={28} />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginTop: '16px' }}>
            {metricsMode === 'submissions' ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#4F46E5' }}></div> Submitted
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#0F766E' }}></div> Pending
                </div>
              </>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#16A34A' }}></div> Class Avg Attendance (%)
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: MARK ATTENDANCE MODAL */}
      {/* ========================================================================= */}
      {isAttendanceModalOpen && selectedClassForAttendance && createPortal(
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 10000, padding: '20px'
        }}>
          <div style={{
            background: 'white', borderRadius: '20px', width: '100%', maxWidth: '640px',
            maxHeight: '90vh', display: 'flex', flexDirection: 'column',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', overflow: 'hidden'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '20px 24px', borderBottom: '1px solid #e2e8f0',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              background: 'linear-gradient(135deg, rgba(79,70,229,0.05), rgba(96,165,250,0.05))'
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
                  Mark Class Attendance
                </h3>
                <div style={{ fontSize: '0.82rem', color: '#64748B', marginTop: '2px' }}>
                  {selectedClassForAttendance.cls} • {selectedClassForAttendance.subject} • {selectedClassForAttendance.roomNumber || 'Room 201'}
                </div>
              </div>
              <button 
                onClick={() => setIsAttendanceModalOpen(false)}
                style={{ background: 'transparent', border: 'none', color: '#64748B', cursor: 'pointer', padding: '4px' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Attendance Controls Bar */}
            <div style={{ padding: '14px 24px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#475569' }}>Date:</span>
                <input 
                  type="date" 
                  value={attendanceDate}
                  onChange={(e) => setAttendanceDate(e.target.value)}
                  style={{ padding: '4px 8px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.8rem', background: 'white' }}
                />
              </div>

              {/* Summary Badges & Bulk Actions */}
              <div style={{ display: 'flex', gap: '8px' }}>
                <button 
                  onClick={() => handleBulkAttendance('Present')}
                  style={{ background: 'rgba(22, 163, 74, 0.1)', color: '#16A34A', border: '1px solid rgba(22, 163, 74, 0.3)', padding: '5px 12px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
                >
                  All Present
                </button>
                <button 
                  onClick={() => handleBulkAttendance('Absent')}
                  style={{ background: 'rgba(220, 38, 38, 0.1)', color: '#DC2626', border: '1px solid rgba(220, 38, 38, 0.3)', padding: '5px 12px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
                >
                  All Absent
                </button>
              </div>
            </div>

            {/* Search Filter inside modal */}
            <div style={{ padding: '12px 24px', borderBottom: '1px solid #f1f5f9' }}>
              <div style={{ position: 'relative' }}>
                <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '10px' }} />
                <input 
                  type="text" 
                  placeholder="Filter student name or roll..." 
                  value={attendanceSearch}
                  onChange={(e) => setAttendanceSearch(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px 8px 36px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '0.85rem', outline: 'none' }}
                />
              </div>
            </div>

            {/* Students List */}
            <div style={{ padding: '16px 24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {attendanceLoading ? (
                <div style={{ padding: '30px', textAlign: 'center', color: '#64748B' }}>Loading enrolled students...</div>
              ) : attendanceRoster.filter(s => !attendanceSearch || s.name.toLowerCase().includes(attendanceSearch.toLowerCase()) || s.rollNo.toLowerCase().includes(attendanceSearch.toLowerCase())).length === 0 ? (
                <div style={{ padding: '20px', textAlign: 'center', color: '#64748B' }}>No students found matching filter.</div>
              ) : (
                attendanceRoster
                  .filter(s => !attendanceSearch || s.name.toLowerCase().includes(attendanceSearch.toLowerCase()) || s.rollNo.toLowerCase().includes(attendanceSearch.toLowerCase()))
                  .map((student) => (
                    <div key={student.id} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '10px 14px', borderRadius: '12px', border: '1px solid #e2e8f0',
                      background: student.status === 'Absent' ? 'rgba(239, 68, 68, 0.04)' : student.status === 'Late' ? 'rgba(245, 158, 11, 0.04)' : 'white'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ 
                          width: '32px', height: '32px', borderRadius: '50%', 
                          background: '#f1f5f9', color: '#475569', display: 'flex', 
                          alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 700 
                        }}>
                          {student.name.charAt(0)}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#0f172a' }}>{student.name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                            Roll: {student.rollNo} • Standing: {student.attendance}%
                          </div>
                        </div>
                      </div>

                      {/* 3-State Toggle: Present, Absent, Late */}
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button 
                          type="button"
                          onClick={() => handleToggleStudentStatus(student.id, 'Present')}
                          style={{
                            background: student.status === 'Present' ? '#16A34A' : '#f1f5f9',
                            color: student.status === 'Present' ? 'white' : '#64748B',
                            border: 'none', padding: '6px 12px', borderRadius: '8px',
                            fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer'
                          }}
                        >
                          Present
                        </button>
                        <button 
                          type="button"
                          onClick={() => handleToggleStudentStatus(student.id, 'Absent')}
                          style={{
                            background: student.status === 'Absent' ? '#DC2626' : '#f1f5f9',
                            color: student.status === 'Absent' ? 'white' : '#64748B',
                            border: 'none', padding: '6px 12px', borderRadius: '8px',
                            fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer'
                          }}
                        >
                          Absent
                        </button>
                        <button 
                          type="button"
                          onClick={() => handleToggleStudentStatus(student.id, 'Late')}
                          style={{
                            background: student.status === 'Late' ? '#D97706' : '#f1f5f9',
                            color: student.status === 'Late' ? 'white' : '#64748B',
                            border: 'none', padding: '6px 12px', borderRadius: '8px',
                            fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer'
                          }}
                        >
                          Late
                        </button>
                      </div>
                    </div>
                  ))
              )}
            </div>

            {/* Modal Footer */}
            <div style={{
              padding: '16px 24px', borderTop: '1px solid #e2e8f0',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc'
            }}>
              <div style={{ fontSize: '0.82rem', color: '#64748B' }}>
                <strong>{attendanceRoster.filter(s => s.status === 'Present').length}</strong> Present •{' '}
                <strong>{attendanceRoster.filter(s => s.status === 'Absent').length}</strong> Absent •{' '}
                <strong>{attendanceRoster.filter(s => s.status === 'Late').length}</strong> Late
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button 
                  onClick={() => setIsAttendanceModalOpen(false)}
                  style={{ background: 'transparent', border: '1px solid #cbd5e1', padding: '8px 16px', borderRadius: '10px', fontSize: '0.85rem', fontWeight: 600, color: '#475569', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSaveAttendance}
                  style={{ background: 'linear-gradient(135deg, #16A34A, #15803D)', border: 'none', padding: '8px 20px', borderRadius: '10px', fontSize: '0.85rem', fontWeight: 700, color: 'white', cursor: 'pointer', boxShadow: '0 4px 10px rgba(22, 163, 74, 0.3)' }}
                >
                  Save Attendance
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: CLASS ROSTER MODAL */}
      {/* ========================================================================= */}
      {isRosterModalOpen && selectedClassForRoster && createPortal(
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 10000, padding: '20px'
        }}>
          <div style={{
            background: 'white', borderRadius: '20px', width: '100%', maxWidth: '680px',
            maxHeight: '85vh', display: 'flex', flexDirection: 'column',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', overflow: 'hidden'
          }}>
            {/* Header */}
            <div style={{
              padding: '20px 24px', borderBottom: '1px solid #e2e8f0',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              background: 'linear-gradient(135deg, rgba(79,70,229,0.06), rgba(96,165,250,0.06))'
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
                  {selectedClassForRoster.cls} Roster
                </h3>
                <div style={{ fontSize: '0.82rem', color: '#64748B', marginTop: '2px' }}>
                  {rosterStudents.length} Students Enrolled • {selectedClassForRoster.roomNumber || 'Room 201'}
                </div>
              </div>
              <button 
                onClick={() => setIsRosterModalOpen(false)}
                style={{ background: 'transparent', border: 'none', color: '#64748B', cursor: 'pointer', padding: '4px' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Search */}
            <div style={{ padding: '12px 24px', borderBottom: '1px solid #f1f5f9' }}>
              <div style={{ position: 'relative' }}>
                <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '10px' }} />
                <input 
                  type="text" 
                  placeholder="Search students in class..." 
                  value={rosterSearch}
                  onChange={(e) => setRosterSearch(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px 8px 36px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '0.85rem', outline: 'none' }}
                />
              </div>
            </div>

            {/* Student Table */}
            <div style={{ padding: '16px 24px', overflowY: 'auto', flex: 1 }}>
              {rosterLoading ? (
                <div style={{ padding: '30px', textAlign: 'center', color: '#64748B' }}>Loading roster data...</div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #e2e8f0', fontSize: '0.78rem', color: '#64748B', textTransform: 'uppercase' }}>
                      <th style={{ padding: '8px 12px' }}>Roll No</th>
                      <th style={{ padding: '8px 12px' }}>Student Name</th>
                      <th style={{ padding: '8px 12px' }}>Gender</th>
                      <th style={{ padding: '8px 12px' }}>Attendance</th>
                      <th style={{ padding: '8px 12px' }}>Parent Contact</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rosterStudents
                      .filter(s => !rosterSearch || s.name.toLowerCase().includes(rosterSearch.toLowerCase()) || s.rollNo.toLowerCase().includes(rosterSearch.toLowerCase()))
                      .map((st) => (
                        <tr key={st.id} style={{ borderBottom: '1px solid #f1f5f9', fontSize: '0.85rem' }}>
                          <td style={{ padding: '10px 12px', fontWeight: 700, color: '#4F46E5' }}>{st.rollNo}</td>
                          <td style={{ padding: '10px 12px', fontWeight: 600, color: '#1e293b' }}>{st.name}</td>
                          <td style={{ padding: '10px 12px', color: '#64748B' }}>{st.gender}</td>
                          <td style={{ padding: '10px 12px' }}>
                            <span style={{ 
                              padding: '2px 8px', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 700,
                              background: st.attendance >= 90 ? 'rgba(22, 163, 74, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                              color: st.attendance >= 90 ? '#16A34A' : '#D97706'
                            }}>
                              {st.attendance}%
                            </span>
                          </td>
                          <td style={{ padding: '10px 12px', color: '#64748B' }}>{st.parentContact || 'N/A'}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Footer */}
            <div style={{ padding: '14px 24px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', background: '#f8fafc' }}>
              <button 
                onClick={() => setIsRosterModalOpen(false)}
                style={{ background: '#4F46E5', color: 'white', border: 'none', padding: '8px 18px', borderRadius: '10px', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: WEEKLY TIMETABLE MODAL */}
      {/* ========================================================================= */}
      {isTimetableModalOpen && createPortal(
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 10000, padding: '20px'
        }}>
          <div style={{
            background: 'white', borderRadius: '20px', width: '100%', maxWidth: '820px',
            maxHeight: '90vh', display: 'flex', flexDirection: 'column',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', overflow: 'hidden'
          }}>
            <div style={{
              padding: '20px 24px', borderBottom: '1px solid #e2e8f0',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              background: 'linear-gradient(135deg, rgba(79,70,229,0.06), rgba(96,165,250,0.06))'
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
                  Weekly Faculty Timetable
                </h3>
                <div style={{ fontSize: '0.82rem', color: '#64748B', marginTop: '2px' }}>
                  {teacherSummary.teacherName} • Department of Mathematics & Science
                </div>
              </div>
              <button 
                onClick={() => setIsTimetableModalOpen(false)}
                style={{ background: 'transparent', border: 'none', color: '#64748B', cursor: 'pointer', padding: '4px' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '10px', minWidth: '600px' }}>
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} style={{ textAlign: 'center', fontWeight: 800, padding: '8px', background: '#f1f5f9', borderRadius: '8px', fontSize: '0.85rem', color: '#334155' }}>
                    {day}
                  </div>
                ))}

                {/* Timetable Period Grid Slots */}
                {[
                  { time: 'Period 1 (08:00 - 09:00)', sub: 'Mathematics', cls: '10th - A', room: 'Room 201' },
                  { time: 'Period 2 (09:00 - 10:00)', sub: 'Mathematics', cls: '9th - B', room: 'Room 105' },
                  { time: 'Break (10:00 - 10:15)', sub: 'Morning Recess', cls: 'Staff Room', room: 'Staff Room' },
                  { time: 'Period 3 (10:15 - 11:15)', sub: 'Grading / Prep', cls: 'Library', room: 'Staff Lounge' },
                  { time: 'Period 4 (11:15 - 12:15)', sub: 'Physics Lab', cls: '11th - Sci', room: 'Physics Lab 2' },
                  { time: 'Period 5 (12:45 - 01:45)', sub: 'Mathematics', cls: '8th - A', room: 'Room 102' },
                ].map((slot, idx) => (
                  <React.Fragment key={idx}>
                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d, dIdx) => (
                      <div key={dIdx} style={{
                        padding: '10px 8px', borderRadius: '10px',
                        background: slot.sub.includes('Recess') ? '#f8fafc' : (idx === 0 || idx === 1) ? 'rgba(79, 70, 229, 0.05)' : 'white',
                        border: '1px solid #e2e8f0',
                        fontSize: '0.75rem',
                        display: 'flex', flexDirection: 'column', gap: '2px'
                      }}>
                        <div style={{ fontWeight: 700, color: slot.sub.includes('Recess') ? '#94a3b8' : '#1e293b' }}>
                          {slot.sub}
                        </div>
                        <div style={{ color: '#4F46E5', fontWeight: 600 }}>{slot.cls}</div>
                        <div style={{ color: '#94a3b8', fontSize: '0.7rem' }}>{slot.room}</div>
                      </div>
                    ))}
                  </React.Fragment>
                ))}
              </div>
            </div>

            <div style={{ padding: '14px 24px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', background: '#f8fafc' }}>
              <button 
                onClick={() => setIsTimetableModalOpen(false)}
                style={{ background: '#4F46E5', color: 'white', border: 'none', padding: '8px 18px', borderRadius: '10px', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}
              >
                Close Timetable
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: CREATE ASSIGNMENT MODAL */}
      {/* ========================================================================= */}
      {isNewAssignmentModalOpen && createPortal(
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
              background: 'linear-gradient(135deg, rgba(79,70,229,0.06), rgba(96,165,250,0.06))'
            }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>
                Create New Student Assignment
              </h3>
              <button 
                onClick={() => setIsNewAssignmentModalOpen(false)}
                style={{ background: 'transparent', border: 'none', color: '#64748B', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateAssignment} style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>Assignment Title</label>
                <input 
                  type="text" 
                  placeholder="e.g. Chapter 4 Trigonometry Problem Set" 
                  required
                  value={assignmentForm.title}
                  onChange={(e) => setAssignmentForm(prev => ({ ...prev, title: e.target.value }))}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.88rem', outline: 'none' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>Target Class</label>
                  <select 
                    value={assignmentForm.classSection}
                    onChange={(e) => setAssignmentForm(prev => ({ ...prev, classSection: e.target.value }))}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.85rem', background: 'white' }}
                  >
                    <option value="Class 10 - A">Class 10 - A</option>
                    <option value="Class 9 - B">Class 9 - B</option>
                    <option value="Class 11 - SCIENCE">Class 11 - SCIENCE</option>
                    <option value="Class 8 - A">Class 8 - A</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>Due Date</label>
                  <input 
                    type="date" 
                    value={assignmentForm.dueDate}
                    onChange={(e) => setAssignmentForm(prev => ({ ...prev, dueDate: e.target.value }))}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>Total Marks</label>
                <input 
                  type="number" 
                  value={assignmentForm.maxMarks}
                  onChange={(e) => setAssignmentForm(prev => ({ ...prev, maxMarks: e.target.value }))}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>Instructions & Notes</label>
                <textarea 
                  rows={3}
                  placeholder="Provide guidance, required questions, and submission instructions..."
                  value={assignmentForm.instructions}
                  onChange={(e) => setAssignmentForm(prev => ({ ...prev, instructions: e.target.value }))}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.85rem', outline: 'none', resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button 
                  type="button" 
                  onClick={() => setIsNewAssignmentModalOpen(false)}
                  style={{ background: 'transparent', border: '1px solid #cbd5e1', padding: '8px 16px', borderRadius: '10px', fontSize: '0.85rem', fontWeight: 600, color: '#475569', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  style={{ background: '#4F46E5', color: 'white', border: 'none', padding: '8px 20px', borderRadius: '10px', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer' }}
                >
                  Publish Assignment
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* ========================================================================= */}
      {/* MODAL 5: QUICK GRADING MODAL */}
      {/* ========================================================================= */}
      {isGradingModalOpen && selectedSubmission && createPortal(
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 10000, padding: '20px'
        }}>
          <div style={{
            background: 'white', borderRadius: '20px', width: '100%', maxWidth: '500px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', overflow: 'hidden'
          }}>
            <div style={{
              padding: '20px 24px', borderBottom: '1px solid #e2e8f0',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              background: 'linear-gradient(135deg, rgba(79,70,229,0.06), rgba(96,165,250,0.06))'
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>
                  Review & Grade Submission
                </h3>
                <div style={{ fontSize: '0.82rem', color: '#64748B', marginTop: '2px' }}>
                  {selectedSubmission.studentName} ({selectedSubmission.rollNo}) • {selectedSubmission.cls}
                </div>
              </div>
              <button 
                onClick={() => setIsGradingModalOpen(false)}
                style={{ background: 'transparent', border: 'none', color: '#64748B', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmitGrade} style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ padding: '12px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.8rem', color: '#64748B' }}>Assignment Title</div>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#1e293b', marginTop: '2px' }}>
                  {selectedSubmission.assignment}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#0F766E', marginTop: '4px', fontWeight: 600 }}>
                  Turned in {selectedSubmission.submittedAt}
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  Score (Out of {selectedSubmission.maxMarks})
                </label>
                <input 
                  type="number" 
                  min="0"
                  max={selectedSubmission.maxMarks}
                  placeholder={`e.g. 45`}
                  required
                  value={gradeInput}
                  onChange={(e) => setGradeInput(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.95rem', fontWeight: 700 }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  Faculty Feedback & Remarks
                </label>
                <textarea 
                  rows={3}
                  value={feedbackInput}
                  onChange={(e) => setFeedbackInput(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.85rem', outline: 'none', resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
                <button 
                  type="button" 
                  onClick={() => setIsGradingModalOpen(false)}
                  style={{ background: 'transparent', border: '1px solid #cbd5e1', padding: '8px 16px', borderRadius: '10px', fontSize: '0.85rem', fontWeight: 600, color: '#475569', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  style={{ background: '#4F46E5', color: 'white', border: 'none', padding: '8px 20px', borderRadius: '10px', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer' }}
                >
                  Submit Grade
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

export default TeacherDashboard;
