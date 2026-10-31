import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { 
  Users, BookOpen, Clock, FileText, CheckCircle, Calendar, 
  ChevronRight, Award, Bell, Check, Plus, Trash2, X, Search, 
  CheckSquare, Square, AlertCircle, Sparkles, Send, UserCheck, 
  ArrowUpRight, Edit3, ClipboardList, BookMarked, User, RefreshCw
} from 'lucide-react';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, CartesianGrid, YAxis, Legend } from 'recharts';
import StaffPunchClock from '../components/StaffPunchClock';
import LabDashboard from './LabDashboard';

const API_BASE = 'http://localhost:5000/api';

// Helper to parse slot time (e.g. "08:00 AM - 09:00 AM") into start and end minutes
export const parseTimeRangeMinutes = (timeStr) => {
  if (!timeStr) return { startMinutes: null, endMinutes: null, startLabel: '', endLabel: '' };
  const raw = timeStr.includes('|') ? timeStr.split('|')[1].trim() : timeStr;
  const parts = raw.split(' - ');
  if (parts.length < 2) return { startMinutes: null, endMinutes: null, startLabel: '', endLabel: '' };

  const parseSingle = (s) => {
    if (!s) return null;
    const match12 = s.trim().match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
    if (match12) {
      let [_, h, m, meridiem] = match12;
      let hours = parseInt(h, 10);
      const minutes = parseInt(m, 10);
      if (meridiem.toUpperCase() === 'PM' && hours !== 12) hours += 12;
      if (meridiem.toUpperCase() === 'AM' && hours === 12) hours = 0;
      return hours * 60 + minutes;
    }
    const match24 = s.trim().match(/(\d{1,2}):(\d{2})/);
    if (match24) {
      let [_, h, m] = match24;
      return parseInt(h, 10) * 60 + parseInt(m, 10);
    }
    return null;
  };

  return {
    startMinutes: parseSingle(parts[0]),
    endMinutes: parseSingle(parts[1]),
    startLabel: parts[0].trim(),
    endLabel: parts[1].trim()
  };
};

const TeacherDashboard = () => {
  const navigate = useNavigate();
  const tenantSlug = sessionStorage.getItem('tenantSlug') || '';
  const userInfo = JSON.parse(sessionStorage.getItem('userInfo') || '{}');
  const token = userInfo.token || sessionStorage.getItem('token') || '';
  const userRole = (sessionStorage.getItem('userRole') || userInfo.role || '').toLowerCase();
  const staffRole = (userInfo.staffRole || '').toLowerCase();
  const isLabAssistant = userRole === 'lab_assistant' || staffRole === 'lab assistant' || userInfo.uniqueId === 'assistant';

  if (isLabAssistant) {
    return <LabDashboard />;
  }

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
    totalStudents: 0,
    classesCount: 0,
    pendingGrading: 0,
    attendanceRate: '0%',
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

  // Real-time wall-clock ticker for live schedule and attendance locks
  const [currentClock, setCurrentClock] = useState(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setCurrentClock(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  const isClassTimeStarted = (timeStr) => {
    const { startMinutes } = parseTimeRangeMinutes(timeStr);
    if (startMinutes === null) return true;
    const currentMinutes = currentClock.getHours() * 60 + currentClock.getMinutes();
    return currentMinutes >= startMinutes;
  };

  const isClassLiveNow = (timeStr) => {
    const { startMinutes, endMinutes } = parseTimeRangeMinutes(timeStr);
    if (startMinutes === null || endMinutes === null) return false;
    const currentMinutes = currentClock.getHours() * 60 + currentClock.getMinutes();
    return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
  };

  // Schedule State (with live overrides for marked attendance)
  const [localSchedule, setLocalSchedule] = useState([]);

  // Tasks / Action Required State (From MongoDB)
  const [tasks, setTasks] = useState([]);
  const [newTaskText, setNewTaskText] = useState('');
  const [newTaskDue, setNewTaskDue] = useState('Due Tomorrow');
  const [isAddingTask, setIsAddingTask] = useState(false);

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
  const [facultyTimetable, setFacultyTimetable] = useState(null);
  const [isTimetableLoading, setIsTimetableLoading] = useState(false);

  const fetchTeacherTimetable = async () => {
    setIsTimetableLoading(true);
    try {
      const teacherName = userInfo.name || teacherSummary.teacherName || '';
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      if (tenantSlug) headers['x-tenant-slug'] = tenantSlug;

      const res = await fetch(`${API_BASE}/timetable/teacher?name=${encodeURIComponent(teacherName)}`, { headers });
      if (res.ok) {
        const data = await res.json();
        setFacultyTimetable(data);
      }
    } catch (e) {
      console.warn('Error loading teacher timetable:', e);
    } finally {
      setIsTimetableLoading(false);
    }
  };

  const handleOpenTimetableModal = () => {
    setIsTimetableModalOpen(true);
    fetchTeacherTimetable();
  };

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

  // Student submissions awaiting grading from live MongoDB
  const [submissions, setSubmissions] = useState([]);

  // Metrics Chart View Mode
  const [metricsMode, setMetricsMode] = useState('submissions'); // 'submissions' | 'attendance'

  // Fetch Teacher Summary from backend (Live DB)
  const fetchDashboardData = async () => {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (tenantSlug) headers['x-tenant-slug'] = tenantSlug;

    try {
      const res = await fetch(`${API_BASE}/dashboard/teacher-summary`, { headers });
      if (res.ok) {
        const data = await res.json();
        if (data) {
          setTeacherSummary(prev => ({
            ...prev,
            ...data,
            teacherName: userInfo.name || data.teacherName || 'Mr. Ramesh Singh',
          }));
          if (data.schedule && data.schedule.length > 0) {
            setLocalSchedule(data.schedule);
          }
          if (Array.isArray(data.submissions)) {
            setSubmissions(data.submissions);
          }
          if (Array.isArray(data.tasks)) {
            setTasks(data.tasks);
          }
        }
      }
    } catch (err) {
      console.warn('Teacher summary fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [tenantSlug, token]);

  // Effective Schedule (defaults if backend schedule is empty)
  const effectiveSchedule = useMemo(() => {
    if (localSchedule.length > 0) return localSchedule;
    if (teacherSummary.schedule && teacherSummary.schedule.length > 0) return teacherSummary.schedule;
    return [];
  }, [localSchedule, teacherSummary.schedule]);

  const performanceList = useMemo(() => {
    if (teacherSummary.performanceData && teacherSummary.performanceData.length > 0) return teacherSummary.performanceData;
    return [];
  }, [teacherSummary.performanceData]);

  // Smart Quick Attendance action
  const handleQuickAttendance = () => {
    if (!effectiveSchedule || effectiveSchedule.length === 0) {
      showToast('No classes scheduled for today.', 'error');
      return;
    }
    // 1. Priority 1: Currently live class that is not yet completed
    const liveClass = effectiveSchedule.find(c => c.cls !== 'Staff Room' && c.status !== 'Completed' && isClassLiveNow(c.time));
    if (liveClass) {
      handleOpenAttendance(liveClass);
      return;
    }
    // 2. Priority 2: Any started class today pending attendance
    const pendingClass = effectiveSchedule.find(c => c.cls !== 'Staff Room' && c.status !== 'Completed' && isClassTimeStarted(c.time));
    if (pendingClass) {
      handleOpenAttendance(pendingClass);
      return;
    }
    // 3. Priority 3: If all started classes are completed
    const hasStarted = effectiveSchedule.some(c => isClassTimeStarted(c.time));
    if (hasStarted) {
      showToast('✅ Attendance already recorded for all started classes today!', 'success');
      return;
    }
    // 4. No class has started yet today
    const firstClass = effectiveSchedule[0];
    const { startLabel } = parseTimeRangeMinutes(firstClass?.time);
    showToast(`⚠️ Attendance opens when the first class starts at ${startLabel || firstClass?.time?.split(' - ')[0] || 'scheduled time'}.`, 'error');
  };

  // Open Attendance Modal for a Class (Live DB)
  const handleOpenAttendance = async (cls) => {
    if (!cls) return;

    // Strict guard: Teacher cannot mark attendance before the scheduled class start time
    const { startMinutes, startLabel } = parseTimeRangeMinutes(cls.time);
    if (startMinutes !== null) {
      const currentMinutes = currentClock.getHours() * 60 + currentClock.getMinutes();
      if (currentMinutes < startMinutes) {
        showToast(`⚠️ Attendance cannot be marked before the class scheduled time (${startLabel || cls.time.split(' - ')[0]}).`, 'error');
        return;
      }
    }

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
        setAttendanceRoster([]);
      }
    } catch (err) {
      console.warn('Error fetching roster:', err);
      setAttendanceRoster([]);
    } finally {
      setAttendanceLoading(false);
    }
  };

  // Toggle single student attendance status
  const handleToggleStudentStatus = (studentId, newStatus) => {
    setAttendanceRoster(prev => prev.map(s => (s.id === studentId || s._id === studentId) ? { ...s, status: newStatus } : s));
  };

  // Bulk mark all present / absent
  const handleBulkAttendance = (status) => {
    setAttendanceRoster(prev => prev.map(s => ({ ...s, status })));
  };

  // Submit Attendance (Live DB)
  const handleSaveAttendance = async () => {
    if (!selectedClassForAttendance) return;
    const classNameClean = selectedClassForAttendance.className || (selectedClassForAttendance.cls ? selectedClassForAttendance.cls.split(' - ')[0] : 'Class 10');
    const sectionClean = selectedClassForAttendance.section || (selectedClassForAttendance.cls ? selectedClassForAttendance.cls.split(' - ')[1] : 'A');

    // Strict guard against early marking
    const todayStr = new Date().toISOString().split('T')[0];
    if (attendanceDate === todayStr) {
      const { startMinutes, startLabel } = parseTimeRangeMinutes(selectedClassForAttendance.time);
      if (startMinutes !== null) {
        const currentMinutes = currentClock.getHours() * 60 + currentClock.getMinutes();
        if (currentMinutes < startMinutes) {
          showToast(`⚠️ Cannot submit attendance before the class starts at ${startLabel || selectedClassForAttendance.time.split(' - ')[0]}.`, 'error');
          return;
        }
      }
    }

    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (tenantSlug) headers['x-tenant-slug'] = tenantSlug;

    try {
      const res = await fetch(`${API_BASE}/dashboard/teacher/attendance`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          className: classNameClean,
          section: sectionClean,
          records: attendanceRoster.map(s => ({ studentId: s.id || s._id, status: s.status }))
        })
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.message || 'Error submitting attendance', 'error');
        return;
      }
    } catch (err) {
      console.warn('Attendance sync error:', err);
      showToast('Error syncing attendance. Please try again.', 'error');
      return;
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
    fetchDashboardData();
  };

  // Open Class Roster Modal (Live DB)
  const handleOpenRoster = async (cls) => {
    if (!cls) return;
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
        setRosterStudents([]);
      }
    } catch (err) {
      console.warn('Error fetching roster:', err);
      setRosterStudents([]);
    } finally {
      setRosterLoading(false);
    }
  };

  // Toggle To-Do Task Completion (Live DB)
  const handleToggleTask = async (taskId) => {
    setTasks(prev => prev.map(t => (t.id === taskId || t._id === taskId) ? { ...t, completed: !t.completed } : t));

    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (tenantSlug) headers['x-tenant-slug'] = tenantSlug;

    try {
      await fetch(`${API_BASE}/dashboard/teacher/tasks/${taskId}/toggle`, {
        method: 'PUT',
        headers
      });
    } catch (err) {
      console.warn('Error toggling task:', err);
    }
  };

  // Add New To-Do Task (Live DB)
  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!newTaskText.trim()) return;

    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (tenantSlug) headers['x-tenant-slug'] = tenantSlug;

    const taskPayload = {
      text: newTaskText.trim(),
      due: newTaskDue,
      priority: newTaskDue.includes('Today') ? 'Urgent' : 'Normal',
    };

    try {
      const res = await fetch(`${API_BASE}/dashboard/teacher/tasks`, {
        method: 'POST',
        headers,
        body: JSON.stringify(taskPayload)
      });
      const data = await res.json();
      if (res.ok && data.task) {
        setTasks(prev => [data.task, ...prev]);
        setNewTaskText('');
        setIsAddingTask(false);
        showToast('Task added to your Action Required list!');
      } else {
        const fallback = { id: Date.now(), ...taskPayload, completed: false };
        setTasks(prev => [fallback, ...prev]);
        setNewTaskText('');
        setIsAddingTask(false);
        showToast('Task added to your Action Required list!');
      }
    } catch (err) {
      const fallback = { id: Date.now(), ...taskPayload, completed: false };
      setTasks(prev => [fallback, ...prev]);
      setNewTaskText('');
      setIsAddingTask(false);
      showToast('Task added to your Action Required list!');
    }
  };

  // Delete Task (Live DB)
  const handleDeleteTask = async (taskId, e) => {
    e.stopPropagation();
    setTasks(prev => prev.filter(t => (t.id !== taskId && t._id !== taskId)));

    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (tenantSlug) headers['x-tenant-slug'] = tenantSlug;

    try {
      await fetch(`${API_BASE}/dashboard/teacher/tasks/${taskId}`, {
        method: 'DELETE',
        headers
      });
      showToast('Task removed from list', 'info');
    } catch (err) {
      showToast('Task removed from list', 'info');
    }
  };

  // Create Assignment (Live DB)
  const handleCreateAssignment = async (e) => {
    e.preventDefault();
    if (!assignmentForm.title.trim()) return;

    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (tenantSlug) headers['x-tenant-slug'] = tenantSlug;

    try {
      const res = await fetch(`${API_BASE}/dashboard/teacher/assignment`, {
        method: 'POST',
        headers,
        body: JSON.stringify(assignmentForm)
      });
      const data = await res.json();
      if (res.ok) {
        setIsNewAssignmentModalOpen(false);
        showToast(`📚 Assignment "${assignmentForm.title}" published for ${assignmentForm.classSection}!`);
        setAssignmentForm({
          title: '',
          classSection: 'Class 10 - A',
          subject: 'Mathematics',
          dueDate: '2026-10-24',
          maxMarks: '50',
          instructions: ''
        });
        fetchDashboardData();
      } else {
        alert(data.message || 'Failed to create assignment');
      }
    } catch (err) {
      alert('Network error: ' + err.message);
    }
  };

  // Open Grading Modal
  const handleOpenGrading = (sub) => {
    setSelectedSubmission(sub);
    setGradeInput('');
    setFeedbackInput('Good conceptual clarity and organized step-by-step working.');
    setIsGradingModalOpen(true);
  };

  // Submit Grade (Live DB)
  const handleSubmitGrade = async (e) => {
    e.preventDefault();
    if (!gradeInput || !selectedSubmission) return;

    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (tenantSlug) headers['x-tenant-slug'] = tenantSlug;

    try {
      const res = await fetch(`${API_BASE}/dashboard/teacher/grade`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          assignmentId: selectedSubmission.assignmentId,
          submissionId: selectedSubmission.id || selectedSubmission._id,
          marksObtained: Number(gradeInput),
          feedback: feedbackInput
        })
      });

      if (res.ok) {
        setSubmissions(prev => prev.filter(s => (s.id !== selectedSubmission.id && s._id !== selectedSubmission.id)));
        setTeacherSummary(prev => ({
          ...prev,
          pendingGrading: Math.max(0, (prev.pendingGrading || 1) - 1)
        }));
        setIsGradingModalOpen(false);
        showToast(`⭐ Grade saved: ${gradeInput}/${selectedSubmission.maxMarks} for ${selectedSubmission.studentName}!`);
        fetchDashboardData();
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.message || 'Failed to save grade');
      }
    } catch (err) {
      alert('Network error: ' + err.message);
    }
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
            You have {teacherSummary.classesCount || 0} lecture periods scheduled and {teacherSummary.pendingGrading || 0} student assignments awaiting review today in this campus.
          </p>

          {/* Quick Action Pills inside Banner */}
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button 
              onClick={handleQuickAttendance}
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
              onClick={() => navigate(`/${tenantSlug || 'neel-public-school'}/communication?tab=classMaterials`)}
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
              <BookOpen size={14} /> Send Notes & Materials
            </button>
            <button 
              onClick={handleOpenTimetableModal}
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
            { label: 'Total Students', value: teacherSummary.totalStudents !== undefined ? teacherSummary.totalStudents : 0, icon: Users, color: '#4F46E5', bg: 'rgba(79,70,229,0.1)', sub: (teacherSummary.totalStudents > 0 ? 'Across active batches' : 'No students enrolled') },
            { label: 'Active Classes', value: teacherSummary.classesCount ?? 0, icon: BookOpen, color: '#60A5FA', bg: 'rgba(96,165,250,0.1)', sub: `${teacherSummary.classesCount || 0} batches configured` },
            { label: 'Pending Grading', value: teacherSummary.pendingGrading ?? 0, icon: FileText, color: '#0F766E', bg: 'rgba(15, 118, 110,0.1)', sub: `${teacherSummary.pendingGrading || 0} assignments awaiting review` },
            { label: 'Attendance Rate', value: teacherSummary.attendanceRate || '0%', icon: CheckCircle, color: '#16A34A', bg: 'rgba(22, 163, 74,0.1)', sub: (parseFloat(teacherSummary.attendanceRate) > 0 ? 'Above target (95%)' : 'No attendance recorded') }
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
              onClick={handleOpenTimetableModal}
              style={{ fontSize: '0.85rem', color: '#4F46E5', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
              className="hover-lift"
            >
              View Timetable <ArrowUpRight size={15} />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '12px' }}>
            {effectiveSchedule.map((cls, i) => {
              const isStarted = isClassTimeStarted(cls.time);
              const isLive = isClassLiveNow(cls.time);
              const isCompleted = cls.status === 'Completed';
              const { startLabel } = parseTimeRangeMinutes(cls.time);
              const cardBorderColor = isCompleted ? '#16A34A' : isLive ? '#4F46E5' : isStarted ? '#F59E0B' : '#94A3B8';

              return (
                <div key={i} className="teacher-schedule-card" style={{ 
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                  padding: '16px 20px', 
                  borderRadius: '14px', 
                  borderLeft: `5px solid ${cardBorderColor}`,
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
                        {(cls.status === 'In Progress' || (isLive && !isCompleted)) && (
                          <span style={{ 
                            fontSize: '0.7rem', fontWeight: 700, background: '#4F46E5', color: 'white', 
                            padding: '2px 8px', borderRadius: '10px', textTransform: 'uppercase', letterSpacing: '0.4px',
                            display: 'inline-flex', alignItems: 'center', gap: '4px'
                          }}>
                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#4ADE80', display: 'inline-block' }}></span> Live Now
                          </span>
                        )}
                        {!isStarted && !isCompleted && (
                          <span style={{ 
                            fontSize: '0.68rem', fontWeight: 600, background: 'rgba(241, 245, 249, 0.8)', color: '#64748B', 
                            padding: '2px 8px', borderRadius: '10px', display: 'inline-flex', alignItems: 'center', gap: '4px',
                            border: '1px solid #E2E8F0'
                          }}>
                            <Clock size={11} /> Starts {startLabel || cls.time.split(' - ')[0]}
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
                    {isCompleted ? (
                      <button 
                        disabled
                        className="teacher-status-action-pill completed"
                        style={{ 
                          padding: '8px 18px', borderRadius: '20px', 
                          fontSize: '0.8rem', fontWeight: 700, 
                          cursor: 'default',
                          display: 'flex', alignItems: 'center', gap: '6px'
                        }} 
                      >
                        <Check size={14} /> Attendance Done
                      </button>
                    ) : !isStarted ? (
                      <button 
                        disabled
                        className="teacher-status-action-pill upcoming disabled"
                        title={`Attendance locked until class start time (${startLabel || cls.time.split(' - ')[0]})`}
                        style={{ 
                          padding: '8px 18px', borderRadius: '20px', 
                          fontSize: '0.8rem', fontWeight: 700, 
                          cursor: 'not-allowed',
                          opacity: 0.7,
                          display: 'flex', alignItems: 'center', gap: '6px'
                        }} 
                      >
                        <Clock size={14} /> Upcoming
                      </button>
                    ) : (
                      <button 
                        onClick={() => {
                          if (cls.cls !== 'Staff Room') handleOpenAttendance(cls);
                        }}
                        className="teacher-status-action-pill in-progress hover-lift"
                        style={{ 
                          padding: '8px 18px', borderRadius: '20px', 
                          fontSize: '0.8rem', fontWeight: 700, 
                          cursor: cls.cls === 'Staff Room' ? 'default' : 'pointer', 
                          transition: 'all 0.2s',
                          display: 'flex', alignItems: 'center', gap: '6px'
                        }} 
                      >
                        <UserCheck size={14} /> Mark Attendance
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
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
            {submissions.length === 0 ? (
              <div style={{
                textAlign: 'center', padding: '28px 16px', background: 'var(--color-bg, #f8fafc)',
                borderRadius: '12px', border: '1px solid var(--color-border, #e2e8f0)', color: '#64748B'
              }}>
                <CheckCircle size={32} color="#16A34A" style={{ margin: '0 auto 8px auto', opacity: 0.8 }} />
                <div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#1e293b' }}>All student submissions reviewed!</div>
                <div style={{ fontSize: '0.8rem', marginTop: '4px', color: '#64748B' }}>
                  No pending assignments awaiting review. Create an assignment to assign student work.
                </div>
                <button
                  onClick={() => setIsNewAssignmentModalOpen(true)}
                  style={{
                    marginTop: '12px', background: '#4F46E5', color: 'white', border: 'none',
                    padding: '6px 14px', borderRadius: '8px', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer'
                  }}
                >
                  Create Assignment
                </button>
              </div>
            ) : (
              submissions.map((sub) => (
                <div key={sub.id || sub._id} style={{
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
              ))
            )}
          </div>
        </div>

      </div>

      {/* RIGHT COLUMN */}
      <div className="right-column" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Real-time Faculty Punch In / Punch Out Time Clock */}
        <StaffPunchClock onPunchSuccess={(data) => showToast(data.message)} />

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
            {tasks.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px 16px', color: '#64748B', fontSize: '0.85rem' }}>
                <CheckSquare size={26} color="#10B981" style={{ margin: '0 auto 6px auto', opacity: 0.8 }} />
                <div style={{ fontWeight: 600, color: '#334155' }}>No pending tasks</div>
                <div style={{ fontSize: '0.78rem', marginTop: '2px' }}>Click "+ Add Task" to create a new action item.</div>
              </div>
            ) : (
              tasks.map((task) => (
                <div 
                  key={task.id || task._id} 
                  onClick={() => handleToggleTask(task.id || task._id)}
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
                    onClick={(e) => handleDeleteTask(task.id || task._id, e)}
                    title="Remove task"
                    className="teacher-todo-delete-btn"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))
            )}
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
                  placeholder="Filter student name or Student ID..." 
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
              ) : attendanceRoster.length === 0 ? (
                <div style={{ padding: '36px 20px', textAlign: 'center', color: '#64748B' }}>
                  <Users size={36} color="#94A3B8" style={{ margin: '0 auto 8px auto', opacity: 0.6 }} />
                  <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#1e293b' }}>No students currently enrolled in this class</div>
                  <div style={{ fontSize: '0.82rem', marginTop: '4px' }}>Admit students to this class in Student Directory to record attendance.</div>
                </div>
              ) : attendanceRoster.filter(s => !attendanceSearch || s.name.toLowerCase().includes(attendanceSearch.toLowerCase()) || s.rollNo.toLowerCase().includes(attendanceSearch.toLowerCase())).length === 0 ? (
                <div style={{ padding: '20px', textAlign: 'center', color: '#64748B' }}>No students found matching filter.</div>
              ) : (
                attendanceRoster
                  .filter(s => !attendanceSearch || s.name.toLowerCase().includes(attendanceSearch.toLowerCase()) || s.rollNo.toLowerCase().includes(attendanceSearch.toLowerCase()))
                  .map((student) => (
                    <div key={student.id || student._id} style={{
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
                            Student ID: {student.rollNo} • Standing: {student.attendance}%
                          </div>
                        </div>
                      </div>

                      {/* 3-State Toggle: Present, Absent, Late */}
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button 
                          type="button"
                          onClick={() => handleToggleStudentStatus(student.id || student._id, 'Present')}
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
                          onClick={() => handleToggleStudentStatus(student.id || student._id, 'Absent')}
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
                          onClick={() => handleToggleStudentStatus(student.id || student._id, 'Late')}
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

            {/* Early attendance warning if opened for future slot today */}
            {selectedClassForAttendance && attendanceDate === new Date().toISOString().split('T')[0] && !isClassTimeStarted(selectedClassForAttendance.time) && (
              <div style={{ padding: '10px 24px', background: '#FEF2F2', borderTop: '1px solid #FECACA', color: '#991B1B', fontSize: '0.82rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Clock size={15} color="#DC2626" />
                <span>Attendance is locked: The scheduled start time ({selectedClassForAttendance.time.split(' - ')[0]}) has not arrived yet.</span>
              </div>
            )}

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
                  disabled={selectedClassForAttendance && attendanceDate === new Date().toISOString().split('T')[0] && !isClassTimeStarted(selectedClassForAttendance.time)}
                  onClick={handleSaveAttendance}
                  style={{ 
                    background: selectedClassForAttendance && attendanceDate === new Date().toISOString().split('T')[0] && !isClassTimeStarted(selectedClassForAttendance.time)
                      ? '#94A3B8'
                      : 'linear-gradient(135deg, #16A34A, #15803D)', 
                    border: 'none', padding: '8px 20px', borderRadius: '10px', fontSize: '0.85rem', fontWeight: 700, 
                    color: 'white', 
                    cursor: selectedClassForAttendance && attendanceDate === new Date().toISOString().split('T')[0] && !isClassTimeStarted(selectedClassForAttendance.time)
                      ? 'not-allowed'
                      : 'pointer', 
                    boxShadow: '0 4px 10px rgba(22, 163, 74, 0.3)' 
                  }}
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
              ) : rosterStudents.length === 0 ? (
                <div style={{ padding: '40px 20px', textAlign: 'center', color: '#64748B' }}>
                  <Users size={36} color="#94A3B8" style={{ margin: '0 auto 10px auto', opacity: 0.7 }} />
                  <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#1e293b' }}>No students currently enrolled in this class</div>
                  <div style={{ fontSize: '0.82rem', marginTop: '6px' }}>Admit students to this class in the Student Directory to populate this roster.</div>
                </div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #e2e8f0', fontSize: '0.78rem', color: '#64748B', textTransform: 'uppercase' }}>
                      <th style={{ padding: '8px 12px' }}>Student ID</th>
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
                        <tr key={st.id || st._id} style={{ borderBottom: '1px solid #f1f5f9', fontSize: '0.85rem' }}>
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
              {isTimetableLoading ? (
                <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                  <RefreshCw size={24} className="spin" style={{ margin: '0 auto 8px' }} />
                  <div>Loading live weekly faculty schedule from database...</div>
                </div>
              ) : facultyTimetable?.weeklySchedule ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px', minWidth: '680px' }}>
                  {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map(day => {
                    const lectures = facultyTimetable.weeklySchedule[day] || [];
                    return (
                      <div key={day} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div style={{
                          textAlign: 'center', fontWeight: 800, padding: '8px',
                          background: '#1e3a8a', color: 'white', borderRadius: '8px',
                          fontSize: '0.85rem'
                        }}>
                          {day}
                          <div style={{ fontSize: '0.68rem', opacity: 0.85, fontWeight: 500 }}>
                            {lectures.length} Lectures
                          </div>
                        </div>

                        {lectures.length === 0 ? (
                          <div style={{ padding: '16px 8px', textAlign: 'center', background: '#f8fafc', borderRadius: '8px', color: '#94a3b8', fontSize: '0.72rem', border: '1px dashed #cbd5e1' }}>
                            Free / Prep
                          </div>
                        ) : (
                          lectures.map((lec, idx) => (
                            <div key={idx} style={{
                              padding: '10px 10px',
                              borderRadius: '10px',
                              background: lec.type === 'Lab' ? '#ecfdf5' : lec.type === 'Tutorial' ? '#eff6ff' : '#f8fafc',
                              border: `1px solid ${lec.type === 'Lab' ? '#a7f3d0' : lec.type === 'Tutorial' ? '#bfdbfe' : '#e2e8f0'}`,
                              display: 'flex', flexDirection: 'column', gap: '2px'
                            }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#64748b' }}>
                                  {lec.periodName || `P${lec.periodNumber || idx + 1}`}
                                </span>
                                <span style={{ fontSize: '0.65rem', fontWeight: 700, padding: '1px 5px', borderRadius: '4px', background: 'white', color: '#4F46E5', border: '1px solid #e2e8f0' }}>
                                  {lec.startTime}-{lec.endTime}
                                </span>
                              </div>
                              <div style={{ fontWeight: 800, color: '#1e3a8a', fontSize: '0.82rem', marginTop: '2px' }}>
                                {lec.subject}
                              </div>
                              <div style={{ color: '#4F46E5', fontWeight: 700, fontSize: '0.75rem' }}>
                                🎓 {lec.className}
                              </div>
                              <div style={{ color: '#64748b', fontSize: '0.7rem' }}>
                                📍 {lec.room || 'Room 101'}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '10px', minWidth: '600px' }}>
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} style={{ textAlign: 'center', fontWeight: 800, padding: '8px', background: '#f1f5f9', borderRadius: '8px', fontSize: '0.85rem', color: '#334155' }}>
                      {day}
                    </div>
                  ))}

                  {[
                    { time: 'Period 1 (08:30 - 09:20)', sub: 'Mathematics', cls: 'Class 10 - A', room: 'Room 201' },
                    { time: 'Period 2 (09:20 - 10:10)', sub: 'Mathematics', cls: 'Class 9 - B', room: 'Room 105' },
                    { time: 'Period 3 (10:25 - 11:15)', sub: 'Mathematics', cls: 'Class 10 - A', room: 'Room 201' },
                    { time: 'Period 4 (11:15 - 12:05)', sub: 'Physics Lab', cls: 'Class 11 - Sci', room: 'Physics Lab 2' },
                    { time: 'Period 5 (12:45 - 01:35)', sub: 'Mathematics', cls: 'Class 8 - A', room: 'Room 102' },
                    { time: 'Period 6 (01:35 - 02:25)', sub: 'Remedial Prep', cls: 'Class 10 - A', room: 'Room 201' },
                  ].map((slot, idx) => (
                    <React.Fragment key={idx}>
                      {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d, dIdx) => (
                        <div key={dIdx} style={{
                          padding: '10px 8px', borderRadius: '10px',
                          background: (idx === 0 || idx === 2) ? 'rgba(79, 70, 229, 0.05)' : 'white',
                          border: '1px solid #e2e8f0',
                          fontSize: '0.75rem',
                          display: 'flex', flexDirection: 'column', gap: '2px'
                        }}>
                          <div style={{ fontWeight: 700, color: '#1e293b' }}>
                            {slot.sub}
                          </div>
                          <div style={{ color: '#4F46E5', fontWeight: 600 }}>{slot.cls}</div>
                          <div style={{ color: '#94a3b8', fontSize: '0.7rem' }}>{slot.room}</div>
                        </div>
                      ))}
                    </React.Fragment>
                  ))}
                </div>
              )}
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
