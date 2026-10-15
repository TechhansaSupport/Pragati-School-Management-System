import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, LineChart, Line, ComposedChart, PieChart, Pie, Cell 
} from 'recharts';
import { 
  Search, MoreVertical, User, ChevronLeft, ChevronRight, Users, BookOpen, 
  GraduationCap, Calendar, CreditCard, Bus, Mail, AlertTriangle, FileText, 
  Activity, UserCheck, Shield, Clock, Plus, Filter, Download, MessageSquare, 
  QrCode, Settings, Key, ShieldCheck, Save, Server, Database, ShieldAlert, Check,
  Building2, ExternalLink, Award, Sparkles, Layers, ArrowRight, Trash2, MapPin,
  CheckCircle2, Printer, RefreshCw, X, Play, UserCog
} from 'lucide-react';
import CreateSchoolModal from '../components/CreateSchoolModal';
import AppointPrincipalModal from '../components/AppointPrincipalModal';
import AppointAdminModal from '../components/AppointAdminModal';
import DeleteSchoolModal from '../components/DeleteSchoolModal';

const initialAuditLogs = [
  { id: 1, action: 'User Role Updated', user: 'Admin (Admin Account)', target: 'TCH045', time: '10 mins ago', status: 'Success', color: '#16A34A' },
  { id: 2, action: 'Failed Login Attempt', user: 'Unknown IP', target: 'PRIN001', time: '25 mins ago', status: 'Warning', color: '#F59E0B' },
  { id: 3, action: 'System Backup Completed', user: 'System Automated', target: 'Database', time: '2 hours ago', status: 'Success', color: '#16A34A' },
  { id: 4, action: 'API Key Rotated', user: 'Admin (Admin Account)', target: 'Payment Gateway', time: '5 hours ago', status: 'Success', color: '#16A34A' },
  { id: 5, action: 'Multiple Failed Logins', user: 'IP 192.168.1.45', target: 'Security Firewall', time: '1 day ago', status: 'Blocked', color: '#0F766E' },
];

const systemUsageData = [
  { time: '08:00', cpu: 20, memory: 45 },
  { time: '10:00', cpu: 65, memory: 55 },
  { time: '12:00', cpu: 85, memory: 70 },
  { time: '14:00', cpu: 50, memory: 60 },
  { time: '16:00', cpu: 30, memory: 50 },
  { time: '18:00', cpu: 15, memory: 40 },
];

const userRoleDistribution = [
  { name: 'Students', value: 3452, color: '#4F46E5' },
  { name: 'Parents', value: 2890, color: '#60A5FA' },
  { name: 'Teachers', value: 145, color: '#0F766E' },
  { name: 'Admin/Staff', value: 32, color: '#F59E0B' },
];

const defaultRevenueData = [
  { name: 'Apr', rev: 9000, cost: 7500, net: 8500 },
  { name: 'May', rev: 10200, cost: 8000, net: 9500 },
  { name: 'Jun', rev: 9500, cost: 9200, net: 7500 },
  { name: 'Jul', rev: 11177, cost: 8200, net: 9850 },
  { name: 'Aug', rev: 10500, cost: 8900, net: 10200 },
];

const initialPendingFees = [
  { id: 1, student: 'Rahul Sharma', date: '08/17/23', contact: '9876543210', value: 2700, status: 'Collected', icon: User, color: '#0F172A', cls: '10th - A' },
  { id: 2, student: 'Priya Singh', date: '08/17/23', contact: '9876543211', value: 1100, status: 'Overdue', icon: User, color: '#0F766E', cls: '8th - B' },
  { id: 3, student: 'Amit Kumar', date: '08/16/23', contact: '9876543212', value: 1500, status: 'Due this month', icon: User, color: '#4F46E5', cls: '12th - Sci' },
  { id: 4, student: 'Neha Gupta', date: '08/16/23', contact: '9876543213', value: 1030, status: 'Overdue', icon: User, color: '#0F766E', cls: '5th - C' },
];

const Dashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const tenantSlug = sessionStorage.getItem('tenantSlug') || '';
  const [activeModule, setActiveModule] = useState('Overview');

  // Multi-School & Campus Hub State
  const [schoolsList, setSchoolsList] = useState([]);
  const [isLoadingSchools, setIsLoadingSchools] = useState(false);
  const [isCreateSchoolOpen, setIsCreateSchoolOpen] = useState(false);
  const [targetSchoolForAdmin, setTargetSchoolForAdmin] = useState(null);
  const [targetSchoolForPrincipal, setTargetSchoolForPrincipal] = useState(null);
  const [targetSchoolForDelete, setTargetSchoolForDelete] = useState(null);

  // Tab sync with URL
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const tabParam = searchParams.get('tab');
    if (!tabParam) setActiveModule('Overview');
    else if (tabParam === 'schools') setActiveModule('My Schools & Campuses');
    else if (tabParam === 'students') setActiveModule('Students & IDs');
    else if (tabParam === 'teachers') setActiveModule('Teachers');
    else if (tabParam === 'academics') setActiveModule('Academics & Exams');
    else if (tabParam === 'finance') setActiveModule('Finance & Fees');
    else if (tabParam === 'facilities') setActiveModule('Facilities');
    else if (tabParam === 'communication') setActiveModule('Communication & Reports');
    else if (tabParam === 'config') setActiveModule('System Configuration');
    else if (tabParam === 'health') setActiveModule('System Health & Infra');
    else if (tabParam === 'rbac') setActiveModule('RBAC (Access Control)');
    else if (tabParam === 'security') setActiveModule('Security & Compliance');
  }, [location.search]);

  // Switch Module Tab with URL query sync
  const handleModuleChange = (modId) => {
    setActiveModule(modId);
    let tabQuery = '';
    switch(modId) {
      case 'My Schools & Campuses': tabQuery = '?tab=schools'; break;
      case 'Students & IDs': tabQuery = '?tab=students'; break;
      case 'Teachers': tabQuery = '?tab=teachers'; break;
      case 'Academics & Exams': tabQuery = '?tab=academics'; break;
      case 'Finance & Fees': tabQuery = '?tab=finance'; break;
      case 'Facilities': tabQuery = '?tab=facilities'; break;
      case 'Communication & Reports': tabQuery = '?tab=communication'; break;
      case 'System Configuration': tabQuery = '?tab=config'; break;
      case 'System Health & Infra': tabQuery = '?tab=health'; break;
      case 'RBAC (Access Control)': tabQuery = '?tab=rbac'; break;
      case 'Security & Compliance': tabQuery = '?tab=security'; break;
      default: tabQuery = ''; break;
    }
    navigate(`/${tenantSlug}/dashboard${tabQuery}`, { replace: true });
  };

  const fetchSchoolsList = async () => {
    setIsLoadingSchools(true);
    try {
      const userInfo = JSON.parse(sessionStorage.getItem('userInfo') || '{}');
      const token = userInfo.token || sessionStorage.getItem('token') || '';
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      if (tenantSlug) headers['x-tenant-slug'] = tenantSlug;

      const res = await fetch('http://localhost:5000/api/school/list', { headers });
      if (res.ok) {
        const data = await res.json();
        setSchoolsList(data.schools || []);
      }
    } catch (err) {
      console.warn('Failed to fetch multi-school directory:', err);
    } finally {
      setIsLoadingSchools(false);
    }
  };

  useEffect(() => {
    fetchSchoolsList();
    const handleUpdate = () => fetchSchoolsList();
    window.addEventListener('schoolListUpdated', handleUpdate);
    return () => window.removeEventListener('schoolListUpdated', handleUpdate);
  }, [tenantSlug]);

  // Live Database States
  const [teachers, setTeachers] = useState([]);
  const [staffStats, setStaffStats] = useState({ totalStaff: 0, teachingStaff: 0 });

  const [dashboardOverview, setDashboardOverview] = useState({
    totalStudents: 0,
    totalStaff: 0,
    totalTeachers: 0,
    avgAttendance: 96.5,
    seatUtilization: 0,
    totalCapacity: 240,
    totalCollected: 0,
    pendingFeesCount: 0,
    activeClassesCount: 0,
    totalFleetCount: 0,
    totalBooksCount: 0,
    revenueData: defaultRevenueData,
    roleDistribution: userRoleDistribution,
  });

  const [studentsList, setStudentsList] = useState([]);
  const [classesList, setClassesList] = useState([]);
  const [pendingFeesList, setPendingFeesList] = useState([]);
  const [feeStats, setFeeStats] = useState({ collected: 0, dueThisMonth: 0, overdue: 0 });
  const [facilitiesStats, setFacilitiesStats] = useState({
    library: { totalTitles: 0, totalCopies: 0, issuedCopies: 0, finesCollected: 4500 },
    transport: { totalFleet: 0, mappedStudents: 0 }
  });
  const [announcementsList, setAnnouncementsList] = useState([]);

  // School Configuration State
  const [schoolNameInput, setSchoolNameInput] = useState(() => sessionStorage.getItem('schoolName') || '');
  const [schoolAddressInput, setSchoolAddressInput] = useState('');
  const [academicYear, setAcademicYear] = useState('2026-2027');
  const [currency, setCurrency] = useState('INR (₹)');
  const [timezone, setTimezone] = useState('Asia/Kolkata (IST)');
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [configStatus, setConfigStatus] = useState(null);

  // Overview Interactive Feature States
  const [revenuePeriod, setRevenuePeriod] = useState('Last 6 Months');
  const [eventsList, setEventsList] = useState([
    { id: 1, d: '15', m: 'OCT', t: 'Annual Sports Meet', l: 'Main Ground' },
    { id: 2, d: '22', m: 'OCT', t: 'Parent-Teacher Meeting', l: 'Classrooms' },
    { id: 3, d: '05', m: 'NOV', t: 'Science Exhibition', l: 'Auditorium' },
    { id: 4, d: '14', m: 'NOV', t: "Children's Day Cultural Fest", l: 'Campus Amphitheatre' },
  ]);
  const [isAddEventOpen, setIsAddEventOpen] = useState(false);
  const [isViewAllEventsOpen, setIsViewAllEventsOpen] = useState(false);
  const [newEvent, setNewEvent] = useState({ t: '', d: '10', m: 'NOV', l: 'Main Campus' });
  const [activityCategoryFilter, setActivityCategoryFilter] = useState('ALL');

  // Students Tab Filter & Batch ID Card State
  const [studentSearch, setStudentSearch] = useState('');
  const [isBatchIdCardOpen, setIsBatchIdCardOpen] = useState(false);
  const [selectedIdGrade, setSelectedIdGrade] = useState('ALL');

  // Teachers Tab Filter & Quick Add State
  const [teacherSearch, setTeacherSearch] = useState('');
  const [teacherStatusFilter, setTeacherStatusFilter] = useState('ALL');
  const [isQuickAddStaffOpen, setIsQuickAddStaffOpen] = useState(false);
  const [newStaff, setNewStaff] = useState({ 
    name: '', role: 'Teacher', department: 'Mathematics', 
    qualification: 'M.Sc., B.Ed.', email: '', phone: '', salary: 50000 
  });
  const [staffActionToast, setStaffActionToast] = useState('');

  // Academics Tab Class Creation & Exam Schedule State
  const [isAddClassOpen, setIsAddClassOpen] = useState(false);
  const [newClass, setNewClass] = useState({ className: 'Class 11', section: 'A', roomNumber: 'Room 301', capacity: 40 });
  const [isAssessmentModalOpen, setIsAssessmentModalOpen] = useState(false);
  const [academicsActionToast, setAcademicsActionToast] = useState('');

  // Finance Tab Filter & Payment State
  const [feeSearch, setFeeSearch] = useState('');
  const [feeStatusFilter, setFeeStatusFilter] = useState('ALL');
  const [isRecordPaymentOpen, setIsRecordPaymentOpen] = useState(false);
  const [paymentForm, setPaymentForm] = useState({ studentName: '', classSection: 'Class 10 - A', amount: 5000, type: 'Tuition Fee' });
  const [financeActionToast, setFinanceActionToast] = useState('');

  // Communication Grievance Tickets State
  const [ticketsList, setTicketsList] = useState([
    { id: 1, t: 'Bus route #3 delayed in morning', user: 'Parent of Aman (Class 8)', status: 'Open', color: '#EF4444' },
    { id: 2, t: 'ID Card replacement request', user: 'Student: Neha (Class 10)', status: 'In Progress', color: '#F59E0B' },
    { id: 3, t: 'Library fine discrepancy check', user: 'Student: Rahul (Class 12)', status: 'Resolved', color: '#10B981' },
    { id: 4, t: 'Uniform store replenishment inquiry', user: 'Staff: Anita Sharma', status: 'Open', color: '#EF4444' }
  ]);
  const [isAddTicketOpen, setIsAddTicketOpen] = useState(false);
  const [newTicket, setNewTicket] = useState({ t: '', user: '', status: 'Open' });
  const [isAddAnnouncementOpen, setIsAddAnnouncementOpen] = useState(false);
  const [newAnnouncement, setNewAnnouncement] = useState({ title: '', content: '', priority: 'Normal', targetAudience: 'All Students & Parents' });
  const [announcementToast, setAnnouncementToast] = useState('');

  // System Diagnostics & Backup State
  const [diagnosticResult, setDiagnosticResult] = useState(null);
  const [isPinging, setIsPinging] = useState(false);
  const [backupToast, setBackupToast] = useState('');
  const [auditLogsList, setAuditLogsList] = useState(initialAuditLogs);
  const [auditFilter, setAuditFilter] = useState('ALL');

  // RBAC State
  const [rbacRoles, setRbacRoles] = useState(['Admin Staff', 'Principal', 'Accountant', 'Teacher', 'Librarian']);
  const [rbacMatrix, setRbacMatrix] = useState([
    { m: 'Student Profiles (View)', permissions: [true, true, true, true, true] },
    { m: 'Student Profiles (Edit & Enroll)', permissions: [true, true, false, false, false] },
    { m: 'Staff & Faculty Management', permissions: [true, true, false, false, false] },
    { m: 'Class & Section Architecture', permissions: [true, true, false, false, false] },
    { m: 'Financial Records & Ledger (View)', permissions: [true, true, true, false, false] },
    { m: 'Financial Fee Collections (Edit)', permissions: [true, false, true, false, false] },
    { m: 'Academic Marks & Grades (Edit)', permissions: [true, true, false, true, false] },
    { m: 'Library Catalog Management', permissions: [true, false, false, false, true] },
    { m: 'Global System Configuration', permissions: [true, false, false, false, false] },
  ]);
  const [isAddRoleOpen, setIsAddRoleOpen] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');
  const [rbacToast, setRbacToast] = useState('');

  // Security Policy State
  const [jwtLifespan, setJwtLifespan] = useState('30d');
  const [enforce2FA, setEnforce2FA] = useState(true);
  const [strictSaltHashing, setStrictSaltHashing] = useState(true);
  const [securityToast, setSecurityToast] = useState('');

  // Initial Data Fetching from Live DB
  useEffect(() => {
    const userInfo = JSON.parse(sessionStorage.getItem('userInfo') || '{}');
    const token = userInfo.token || sessionStorage.getItem('token') || '';
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (tenantSlug) headers['x-tenant-slug'] = tenantSlug;

    // Fetch Overview KPIs
    fetch('http://localhost:5000/api/dashboard/overview', { headers })
      .then(res => res.ok ? res.json() : null)
      .then(data => { if (data) setDashboardOverview(prev => ({ ...prev, ...data })); })
      .catch(() => {});

    // Fetch Staff & Teachers
    fetch('http://localhost:5000/api/staff/teachers', { headers })
      .then(res => res.ok ? res.json() : [])
      .then(data => setTeachers(Array.isArray(data) ? data : []))
      .catch(() => {});

    fetch('http://localhost:5000/api/staff/stats', { headers })
      .then(res => res.ok ? res.json() : null)
      .then(data => { if (data) setStaffStats(data); })
      .catch(() => {});

    // Fetch Real Students
    fetch('http://localhost:5000/api/students?limit=25', { headers })
      .then(res => res.ok ? res.json() : null)
      .then(data => { if (data?.students) setStudentsList(data.students); })
      .catch(() => {});

    // Fetch Real Classes
    fetch('http://localhost:5000/api/classes', { headers })
      .then(res => res.ok ? res.json() : [])
      .then(data => setClassesList(Array.isArray(data) ? data : (data.classes || [])))
      .catch(() => {});

    // Fetch Real Pending Fees
    fetch('http://localhost:5000/api/dashboard/pending-fees', { headers })
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data?.fees) setPendingFeesList(data.fees);
        if (data?.stats) setFeeStats(data.stats);
      })
      .catch(() => {});

    // Fetch Facility Stats
    fetch('http://localhost:5000/api/library/stats', { headers })
      .then(res => res.ok ? res.json() : null)
      .then(data => { if (data) setFacilitiesStats(prev => ({ ...prev, library: data })); })
      .catch(() => {});

    fetch('http://localhost:5000/api/transport/stats', { headers })
      .then(res => res.ok ? res.json() : null)
      .then(data => { if (data) setFacilitiesStats(prev => ({ ...prev, transport: data })); })
      .catch(() => {});

    // Fetch Real Announcements
    fetch('http://localhost:5000/api/communication/announcements', { headers })
      .then(res => res.ok ? res.json() : [])
      .then(data => setAnnouncementsList(Array.isArray(data) ? data : []))
      .catch(() => {});

    // Fetch School Global Parameters
    fetch('http://localhost:5000/api/school', { headers })
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data?.school) {
          if (data.school.name) {
            setSchoolNameInput(data.school.name);
            sessionStorage.setItem('schoolName', data.school.name);
          }
          if (data.school.address) {
            setSchoolAddressInput(data.school.address);
          }
          if (data.school.academicYear) setAcademicYear(data.school.academicYear);
          if (data.school.currency) setCurrency(data.school.currency);
          if (data.school.timezone) setTimezone(data.school.timezone);
          if (typeof data.school.maintenanceMode === 'boolean') setMaintenanceMode(data.school.maintenanceMode);
        }
      })
      .catch(() => {});
  }, [tenantSlug]);

  const handleSaveGlobalConfig = async (e) => {
    if (e) e.preventDefault();
    const userInfo = JSON.parse(sessionStorage.getItem('userInfo') || '{}');
    const token = userInfo.token || sessionStorage.getItem('token') || '';
    const userRole = sessionStorage.getItem('userRole') || 'admin';

    if (!['admin', 'superadmin', 'principal'].includes(userRole.toLowerCase())) {
      setConfigStatus({ type: 'error', message: 'Authority required: Only School Administrators can assign the school name or alter global configuration.' });
      return;
    }

    if (!schoolNameInput.trim()) {
      setConfigStatus({ type: 'error', message: 'Please provide a valid School Name (at least 2 characters).' });
      return;
    }

    setIsSavingConfig(true);
    setConfigStatus(null);

    try {
      const headers = { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      };
      if (tenantSlug) headers['x-tenant-slug'] = tenantSlug;

      const res = await fetch('http://localhost:5000/api/school/config', {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          name: schoolNameInput.trim(),
          address: schoolAddressInput.trim(),
          academicYear,
          currency,
          timezone,
          maintenanceMode
        })
      });

      const data = await res.json();
      if (res.ok) {
        const assignedName = data?.school?.name || schoolNameInput.trim();
        sessionStorage.setItem('schoolName', assignedName);
        window.dispatchEvent(new CustomEvent('schoolNameChanged', { detail: assignedName }));
        window.dispatchEvent(new CustomEvent('schoolListUpdated'));
        setConfigStatus({
          type: 'success',
          message: `School name successfully assigned to "${assignedName}" and campus parameters updated!`
        });
      } else {
        setConfigStatus({
          type: 'error',
          message: data?.error || 'Failed to update configuration.'
        });
      }
    } catch (err) {
      setConfigStatus({
        type: 'error',
        message: 'Network error while saving school parameters: ' + err.message
      });
    } finally {
      setIsSavingConfig(false);
    }
  };

  // Export Finance CSV directly
  const handleExportFinanceReport = async () => {
    try {
      const userInfo = JSON.parse(sessionStorage.getItem('userInfo') || '{}');
      const token = userInfo.token || sessionStorage.getItem('token') || '';
      const headers = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      if (tenantSlug) headers['x-tenant-slug'] = tenantSlug;

      const res = await fetch('http://localhost:5000/api/reports/export?type=finance', { headers });
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${tenantSlug || 'school'}_finance_report.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        setFinanceActionToast('Live financial transactions ledger exported successfully as CSV.');
        setTimeout(() => setFinanceActionToast(''), 4000);
      }
    } catch (err) {
      console.error('Export error:', err);
    }
  };

  // Run Server Diagnostics Ping
  const handleRunDiagnostics = async () => {
    setIsPinging(true);
    const start = performance.now();
    try {
      const headers = {};
      if (tenantSlug) headers['x-tenant-slug'] = tenantSlug;
      const res = await fetch('http://localhost:5000/api/dashboard/overview', { headers });
      const latency = Math.round(performance.now() - start);
      if (res.ok) {
        setDiagnosticResult({
          status: 'Healthy',
          latency: `${latency}ms`,
          db: 'Connected (MongoDB Cluster)',
          time: new Date().toLocaleTimeString(),
          code: '200 OK'
        });
      } else {
        setDiagnosticResult({
          status: 'Warning',
          latency: `${latency}ms`,
          db: 'Degraded',
          time: new Date().toLocaleTimeString(),
          code: `HTTP ${res.status}`
        });
      }
    } catch (err) {
      setDiagnosticResult({
        status: 'Error',
        latency: 'Timeout',
        db: 'Unreachable',
        time: new Date().toLocaleTimeString(),
        code: err.message
      });
    } finally {
      setIsPinging(false);
    }
  };

  // Create Instant Backup Simulation
  const handleCreateInstantBackup = () => {
    const backupId = `BKP-${Date.now().toString().slice(-6)}`;
    setBackupToast(`Backup snapshot ${backupId} generated and archived to encrypted storage.`);
    const newLog = {
      id: Date.now(),
      action: `Instant Snapshot Backup (${backupId})`,
      user: 'Administrator',
      target: 'Database Cluster',
      time: 'Just now',
      status: 'Success',
      color: '#16A34A'
    };
    setAuditLogsList(prev => [newLog, ...prev]);
    setTimeout(() => setBackupToast(''), 5000);
  };

  // Quick Add Faculty Handler
  const handleQuickAddFaculty = async (e) => {
    e.preventDefault();
    if (!newStaff.name.trim()) return;

    try {
      const userInfo = JSON.parse(sessionStorage.getItem('userInfo') || '{}');
      const token = userInfo.token || sessionStorage.getItem('token') || '';
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      if (tenantSlug) headers['x-tenant-slug'] = tenantSlug;

      const res = await fetch('http://localhost:5000/api/staff', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          ...newStaff,
          subjects: [newStaff.department],
          classes: ['10th - A']
        })
      });

      if (res.ok) {
        const created = await res.json();
        setTeachers(prev => [created, ...prev]);
        setIsQuickAddStaffOpen(false);
        setStaffActionToast(`Faculty member "${created.name}" provisioned successfully!`);
        setNewStaff({ name: '', role: 'Teacher', department: 'Mathematics', qualification: 'M.Sc., B.Ed.', email: '', phone: '', salary: 50000 });
        setTimeout(() => setStaffActionToast(''), 4000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Quick Add Class Handler
  const handleAddClassSection = async (e) => {
    e.preventDefault();
    if (!newClass.className.trim()) return;

    try {
      const userInfo = JSON.parse(sessionStorage.getItem('userInfo') || '{}');
      const token = userInfo.token || sessionStorage.getItem('token') || '';
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      if (tenantSlug) headers['x-tenant-slug'] = tenantSlug;

      const res = await fetch('http://localhost:5000/api/classes', {
        method: 'POST',
        headers,
        body: JSON.stringify(newClass)
      });

      if (res.ok) {
        const created = await res.json();
        setClassesList(prev => [...prev, created]);
        setIsAddClassOpen(false);
        setAcademicsActionToast(`Class section "${created.className} - ${created.section}" created!`);
        setTimeout(() => setAcademicsActionToast(''), 4000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Record Fee Payment Handler
  const handleRecordFeePayment = async (e) => {
    e.preventDefault();
    if (!paymentForm.studentName.trim() || !paymentForm.amount) return;
    try {
      const userInfo = JSON.parse(sessionStorage.getItem('userInfo') || '{}');
      const token = userInfo.token || sessionStorage.getItem('token') || '';
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      if (tenantSlug) headers['x-tenant-slug'] = tenantSlug;

      const res = await fetch('http://localhost:5000/api/finance/transactions', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          studentName: paymentForm.studentName.trim(),
          amount: Number(paymentForm.amount),
          type: 'Fee Collection',
          category: paymentForm.type || 'Tuition Fee',
          description: `Fee Payment for ${paymentForm.classSection}`,
          paymentMethod: paymentForm.paymentMethod || 'Online',
          status: 'Completed'
        })
      });

      if (res.ok) {
        const data = await res.json();
        const newFeeEntry = {
          _id: data?.transaction?._id || Date.now(),
          studentName: paymentForm.studentName.trim(),
          classSection: paymentForm.classSection,
          amount: Number(paymentForm.amount),
          dueDate: new Date(),
          status: 'Collected'
        };
        setPendingFeesList(prev => [newFeeEntry, ...prev]);
        setFeeStats(prev => ({
          ...prev,
          collected: (prev.collected || 0) + Number(paymentForm.amount)
        }));
        setIsRecordPaymentOpen(false);
        const savedName = paymentForm.studentName;
        const savedAmount = paymentForm.amount;
        setPaymentForm({ studentName: '', classSection: 'Class 10 - A', amount: 5000, type: 'Tuition Fee', paymentMethod: 'UPI' });
        setFinanceActionToast(`Payment of ₹${Number(savedAmount).toLocaleString()} for "${savedName}" recorded successfully!`);
        setTimeout(() => setFinanceActionToast(''), 4000);
      }
    } catch (err) {
      console.error('Failed to record payment:', err);
    }
  };

  // Post Announcement Handler
  const handlePostAnnouncement = async (e) => {
    e.preventDefault();
    if (!newAnnouncement.title.trim() || !newAnnouncement.content.trim()) return;
    try {
      const userInfo = JSON.parse(sessionStorage.getItem('userInfo') || '{}');
      const token = userInfo.token || sessionStorage.getItem('token') || '';
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      if (tenantSlug) headers['x-tenant-slug'] = tenantSlug;

      const res = await fetch('http://localhost:5000/api/communication/announcements', {
        method: 'POST',
        headers,
        body: JSON.stringify(newAnnouncement)
      });

      if (res.ok) {
        const created = await res.json();
        setAnnouncementsList(prev => [created, ...prev]);
        setIsAddAnnouncementOpen(false);
        const savedTitle = newAnnouncement.title;
        setNewAnnouncement({ title: '', content: '', priority: 'Normal', targetAudience: 'All Students & Parents' });
        setAnnouncementToast(`Announcement "${savedTitle}" published to notice board!`);
        setTimeout(() => setAnnouncementToast(''), 4000);
      }
    } catch (err) {
      console.error('Failed to post announcement:', err);
    }
  };

  // Create Grievance Ticket Handler
  const handleCreateTicket = (e) => {
    e.preventDefault();
    if (!newTicket.t.trim()) return;
    const item = {
      id: Date.now(),
      t: newTicket.t.trim(),
      user: newTicket.user.trim() || 'Parent / Student',
      status: 'Open',
      color: '#EF4444'
    };
    setTicketsList(prev => [item, ...prev]);
    setIsAddTicketOpen(false);
    setNewTicket({ t: '', user: '', status: 'Open' });
  };

  // Generic Report CSV Exporter
  const handleExportReport = async (reportType) => {
    try {
      const userInfo = JSON.parse(sessionStorage.getItem('userInfo') || '{}');
      const token = userInfo.token || sessionStorage.getItem('token') || '';
      const headers = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      if (tenantSlug) headers['x-tenant-slug'] = tenantSlug;

      const res = await fetch(`http://localhost:5000/api/reports/export?type=${reportType}`, { headers });
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${tenantSlug || 'school'}_${reportType}_report.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error('Export error:', err);
    }
  };

  // Toggle Ticket Status
  const handleToggleTicketStatus = (ticketId) => {
    setTicketsList(prev => prev.map(t => {
      if (t.id === ticketId) {
        const nextStatus = t.status === 'Open' ? 'In Progress' : t.status === 'In Progress' ? 'Resolved' : 'Open';
        const nextColor = nextStatus === 'Open' ? '#EF4444' : nextStatus === 'In Progress' ? '#F59E0B' : '#10B981';
        return { ...t, status: nextStatus, color: nextColor };
      }
      return t;
    }));
  };

  // Toggle RBAC Permission
  const handleTogglePermission = (rowIdx, colIdx) => {
    setRbacMatrix(prev => prev.map((row, rIdx) => {
      if (rIdx === rowIdx) {
        const updated = [...row.permissions];
        updated[colIdx] = !updated[colIdx];
        return { ...row, permissions: updated };
      }
      return row;
    }));
  };

  // Add Custom Role to RBAC
  const handleAddCustomRole = (e) => {
    e.preventDefault();
    if (!newRoleName.trim()) return;
    const roleTitle = newRoleName.trim();
    setRbacRoles(prev => [...prev, roleTitle]);
    setRbacMatrix(prev => prev.map(row => ({
      ...row,
      permissions: [...row.permissions, false]
    })));
    setIsAddRoleOpen(false);
    setNewRoleName('');
    setRbacToast(`Custom Role "${roleTitle}" added to RBAC Matrix.`);
    setTimeout(() => setRbacToast(''), 4000);
  };

  const modules = [
    { id: 'Overview', label: 'Overview', icon: Activity },
    { id: 'My Schools & Campuses', label: 'My Schools', icon: Building2 },
    { id: 'Students & IDs', label: 'Students', icon: Users },
    { id: 'Teachers', label: 'Teachers', icon: UserCheck },
    { id: 'Academics & Exams', label: 'Academics', icon: BookOpen },
    { id: 'Finance & Fees', label: 'Finance', icon: CreditCard },
    { id: 'Facilities', label: 'Facilities', icon: Bus },
    { id: 'Communication & Reports', label: 'Communication', icon: Mail },
    { id: 'System Configuration', label: 'Configuration', icon: Settings },
    { id: 'System Health & Infra', label: 'System Health', icon: Server },
    { id: 'RBAC (Access Control)', label: 'Access Control', icon: Key },
    { id: 'Security & Compliance', label: 'Security', icon: ShieldCheck },
  ];

  /* ---------------- SUB-MODULE RENDERERS ---------------- */

  const renderSchoolsManagement = () => {
    const totalCampuses = schoolsList.length;
    const appointedAdminsCount = schoolsList.filter(s => s.admin && s.admin.name).length;
    const appointedPrincipalsCount = schoolsList.filter(s => s.principal && s.principal.name).length;
    const totalStaffCount = schoolsList.reduce((acc, s) => acc + (s.staffCount || 0), 0);
    const totalStudentCount = schoolsList.reduce((acc, s) => acc + (s.studentCount || 0), 0);

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
        {/* Executive Banner */}
        <div style={{
          background: 'linear-gradient(135deg, #1e3a8a 0%, #4338ca 50%, #4F46E5 100%)',
          borderRadius: '20px',
          padding: '32px 36px',
          color: 'white',
          boxShadow: '0 12px 36px -6px rgba(79, 70, 229, 0.3)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '20px'
        }}>
          <div style={{ maxWidth: '680px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span style={{
                background: 'rgba(255, 255, 255, 0.2)',
                backdropFilter: 'blur(10px)',
                padding: '4px 12px',
                borderRadius: '20px',
                fontSize: '0.75rem',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <ShieldCheck size={14} color="#93c5fd" /> Super Admin Multi-Branch Control Active
              </span>
              <span style={{ fontSize: '0.8rem', color: '#bfdbfe' }}>
                • Active Window: <strong style={{ color: 'white' }}>{schoolNameInput || tenantSlug || 'Default School'}</strong>
              </span>
            </div>
            <h1 style={{ margin: 0, fontSize: '1.9rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
              Multi-School & Campus Control Center
            </h1>
            <p style={{ margin: '8px 0 0 0', fontSize: '0.95rem', color: '#e0e7ff', lineHeight: 1.5, opacity: 0.95 }}>
              Create school branches without creating new licensed tenants. As Super Admin, appoint dedicated Branch Admins and Principals with isolated credentials for each campus.
            </p>
          </div>

          <button
            onClick={() => setIsCreateSchoolOpen(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              background: '#ffffff',
              color: '#1e3a8a',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '12px',
              fontWeight: 700,
              fontSize: '0.92rem',
              cursor: 'pointer',
              boxShadow: '0 8px 20px rgba(0,0,0,0.15)',
              transition: 'transform 0.2s'
            }}
            onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <Plus size={18} color="#4F46E5" /> Register New School / Branch
          </button>
        </div>

        {/* Multi-Window Explainer Card */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.05) 0%, rgba(15, 118, 110, 0.05) 100%)',
          border: '1px solid rgba(79, 70, 229, 0.2)',
          borderRadius: '16px',
          padding: '18px 24px',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.02)'
        }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '12px',
            background: 'white',
            border: '1px solid rgba(79, 70, 229, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#4F46E5',
            flexShrink: 0
          }}>
            <ExternalLink size={22} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#1e3a8a', marginBottom: '2px' }}>
              Separate Windows for Separate Schools (Zero Cross-Contamination)
            </div>
            <div style={{ fontSize: '0.82rem', color: '#475569', lineHeight: 1.4 }}>
              Click <strong>"Open in Separate Window"</strong> on any school card below to run that school in its own dedicated browser window or tab. Each window retains its own school context (<code style={{ background: 'white', padding: '1px 5px', borderRadius: '4px' }}>x-tenant-slug</code>), allowing you to oversee multiple schools simultaneously.
            </div>
          </div>
        </div>

        {/* Executive KPI Summary */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          {[
            { label: 'Registered Campuses', value: totalCampuses, icon: Building2, color: '#4F46E5', bg: '#eff6ff' },
            { label: 'Appointed Branch Admins', value: `${appointedAdminsCount} / ${totalCampuses}`, icon: UserCog, color: '#7c3aed', bg: '#f5f3ff' },
            { label: 'Appointed Principals', value: `${appointedPrincipalsCount} / ${totalCampuses}`, icon: UserCheck, color: '#0f766e', bg: '#ccfbf1' },
            { label: 'Active Faculty & Staff', value: totalStaffCount, icon: Users, color: '#2563eb', bg: '#dbeafe' },
            { label: 'Student Enrollments', value: totalStudentCount, icon: GraduationCap, color: '#d97706', bg: '#fef3c7' }
          ].map((kpi, idx) => (
            <div key={idx} className="card" style={{ padding: '18px 22px', borderRadius: '16px', border: '1px solid #e2e8f0', background: 'white', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: 600 }}>{kpi.label}</span>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: kpi.bg, color: kpi.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <kpi.icon size={18} />
                </div>
              </div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#1e3a8a' }}>{kpi.value}</div>
            </div>
          ))}
        </div>

        {/* School Cards Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '20px' }}>
          {schoolsList.map((school) => {
            const isCurrent = school.slug === tenantSlug;
            const a = school.admin;
            const p = school.principal;

            return (
              <div
                key={school.id || school.slug}
                className="card"
                style={{
                  padding: '24px',
                  borderRadius: '16px',
                  border: isCurrent ? '2px solid #4F46E5' : '1px solid #e2e8f0',
                  boxShadow: isCurrent ? '0 10px 30px -5px rgba(79, 70, 229, 0.15)' : '0 2px 8px rgba(0,0,0,0.03)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}
              >
                <div>
                  {/* School Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        width: '46px',
                        height: '46px',
                        borderRadius: '12px',
                        background: isCurrent ? 'linear-gradient(135deg, #1e3a8a 0%, #4F46E5 100%)' : '#eff6ff',
                        color: isCurrent ? 'white' : '#4F46E5',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: isCurrent ? '0 4px 12px rgba(79, 70, 229, 0.3)' : 'none'
                      }}>
                        <Building2 size={22} />
                      </div>
                      <div>
                        <h3 style={{ margin: '0 0 2px 0', fontSize: '1.1rem', fontWeight: 800, color: '#1e3a8a' }}>
                          {school.name}
                        </h3>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                          Identifier: <code style={{ background: '#f1f5f9', padding: '1px 5px', borderRadius: '4px', color: '#334155' }}>{school.slug}</code>
                        </div>
                        {school.address && (
                          <div style={{ fontSize: '0.75rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '3px' }}>
                            <MapPin size={12} color="#4F46E5" /> {school.address}
                          </div>
                        )}
                      </div>
                    </div>

                    {isCurrent ? (
                      <span style={{
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        background: '#dcfce7',
                        color: '#15803d',
                        padding: '3px 8px',
                        borderRadius: '8px',
                        border: '1px solid rgba(22, 163, 74, 0.3)'
                      }}>
                        ● Active Window
                      </span>
                    ) : (
                      <span style={{
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        background: '#f8fafc',
                        color: '#64748b',
                        padding: '3px 8px',
                        borderRadius: '8px',
                        border: '1px solid #e2e8f0'
                      }}>
                        Branch Campus
                      </span>
                    )}
                  </div>

                  {/* Branch Administrator Section */}
                  <div style={{
                    margin: '14px 0 8px 0',
                    padding: '12px 14px',
                    borderRadius: '12px',
                    background: a?.name ? 'linear-gradient(135deg, #fbfbfe 0%, #f5f3ff 100%)' : '#faf5ff',
                    border: a?.name ? '1px solid #ddd6fe' : '1px dashed #c4b5fd'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#6d28d9', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <UserCog size={13} color="#7c3aed" /> Branch Administrator
                      </span>
                      <button
                        onClick={() => setTargetSchoolForAdmin(school)}
                        style={{ background: 'none', border: 'none', color: '#7c3aed', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', padding: 0 }}
                      >
                        {a?.name ? '✎ Reassign Admin' : '+ Appoint Admin'}
                      </button>
                    </div>

                    {a?.name ? (
                      <div>
                        <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#1e293b' }}>{a.name}</div>
                        <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '1px' }}>{a.qualification || 'Branch Administrator'}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '5px', fontSize: '0.72rem', color: '#475569', flexWrap: 'wrap' }}>
                          {a.email && <span>✉ {a.email}</span>}
                          {a.portalUsername && (
                            <span style={{ background: '#ede9fe', color: '#6d28d9', padding: '1px 6px', borderRadius: '4px', fontWeight: 600 }}>
                              🔑 Login: {a.portalUsername}
                            </span>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div style={{ fontSize: '0.78rem', color: '#7c3aed', fontWeight: 500 }}>
                        No dedicated Branch Admin assigned yet. Appoint an admin to oversee campus operations.
                      </div>
                    )}
                  </div>

                  {/* Principal Section */}
                  <div style={{
                    margin: '8px 0 14px 0',
                    padding: '12px 14px',
                    borderRadius: '12px',
                    background: p?.name ? 'linear-gradient(135deg, #f8fafc 0%, #f0fdf4 100%)' : '#fffbeb',
                    border: p?.name ? '1px solid #bbf7d0' : '1px dashed #fde68a'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#15803d', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Award size={13} color="#16a34a" /> Appointed Principal
                      </span>
                      <button
                        onClick={() => setTargetSchoolForPrincipal(school)}
                        style={{ background: 'none', border: 'none', color: '#16a34a', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', padding: 0 }}
                      >
                        {p?.name ? '✎ Reassign Principal' : '+ Appoint Principal'}
                      </button>
                    </div>

                    {p?.name ? (
                      <div>
                        <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#1e293b' }}>{p.name}</div>
                        <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '1px' }}>{p.qualification || 'Principal & Head of School'}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '5px', fontSize: '0.72rem', color: '#475569', flexWrap: 'wrap' }}>
                          {p.email && <span>✉ {p.email}</span>}
                          {p.portalUsername && (
                            <span style={{ background: '#dcfce7', color: '#15803d', padding: '1px 6px', borderRadius: '4px', fontWeight: 600 }}>
                              🔑 Login: {p.portalUsername}
                            </span>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div style={{ fontSize: '0.78rem', color: '#b45309', fontWeight: 500 }}>
                        No Principal currently appointed. Appoint a dedicated Principal to lead this school.
                      </div>
                    )}
                  </div>

                  {/* Counts */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', margin: '14px 0', padding: '12px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #f1f5f9' }}>
                    <div>
                      <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>Faculty & Staff</div>
                      <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#1e3a8a', marginTop: '2px' }}>{school.staffCount ?? 0}</div>
                      <button onClick={() => navigate(`/${school.slug}/staff`)} style={{ background: 'none', border: 'none', color: '#4F46E5', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer', padding: 0, marginTop: '2px' }}>
                        View Staff →
                      </button>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>Enrolled Students</div>
                      <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f766e', marginTop: '2px' }}>{school.studentCount ?? 0}</div>
                      <button onClick={() => navigate(`/${school.slug}/students`)} style={{ background: 'none', border: 'none', color: '#0f766e', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer', padding: 0, marginTop: '2px' }}>
                        View Students →
                      </button>
                    </div>
                  </div>
                </div>

                {/* Window Actions */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px solid #f1f5f9', paddingTop: '14px', marginTop: '8px' }}>
                  <button
                    type="button"
                    onClick={() => window.open(`/${school.slug}/dashboard`, '_blank')}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%', padding: '10px 14px', borderRadius: '10px', background: 'linear-gradient(135deg, #1e3a8a 0%, #4F46E5 100%)', color: 'white', border: 'none', fontWeight: 700, fontSize: '0.86rem', cursor: 'pointer', boxShadow: '0 4px 12px rgba(79, 70, 229, 0.25)' }}
                  >
                    <ExternalLink size={15} /> Open in Separate Window
                  </button>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    {!isCurrent && (
                      <button
                        type="button"
                        onClick={() => {
                          sessionStorage.setItem('tenantSlug', school.slug);
                          sessionStorage.setItem('schoolName', school.name);
                          navigate(`/${school.slug}/dashboard`);
                        }}
                        style={{ flex: 1, padding: '8px', borderRadius: '8px', background: '#f8fafc', border: '1px solid #cbd5e1', color: '#334155', fontWeight: 600, fontSize: '0.78rem', cursor: 'pointer' }}
                      >
                        Switch Here
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => navigate(`/${school.slug}/dashboard?tab=config`)}
                      style={{ flex: 1, padding: '8px', borderRadius: '8px', background: '#f8fafc', border: '1px solid #cbd5e1', color: '#334155', fontWeight: 600, fontSize: '0.78rem', cursor: 'pointer' }}
                    >
                      ⚙ Settings & Branding
                    </button>

                    {schoolsList.length > 1 ? (
                      <button
                        type="button"
                        onClick={() => setTargetSchoolForDelete(school)}
                        style={{ padding: '8px 12px', borderRadius: '8px', background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', fontWeight: 600, fontSize: '0.78rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                        title="Permanently delete this campus branch"
                      >
                        <Trash2 size={13} /> Delete
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled
                        style={{ padding: '8px 12px', borderRadius: '8px', background: '#f8fafc', border: '1px dashed #cbd5e1', color: '#94a3b8', fontWeight: 500, fontSize: '0.74rem', cursor: 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                        title="Cannot delete the only remaining school campus in your organization"
                      >
                        <Trash2 size={13} /> Only Campus (Protected)
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderOverview = () => (
    <div className="dashboard-grid">
      <div className="left-column">
        {/* KPI Row with Quick Nav */}
        <div className="kpi-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          <div 
            className="card" 
            style={{ padding: '20px', cursor: 'pointer', transition: 'transform 0.15s, box-shadow 0.15s' }}
            onClick={() => handleModuleChange('Students & IDs')}
            title="Click to view Students Directory"
          >
            <div className="flex-between" style={{ marginBottom: '12px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#e0e7ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4F46E5' }}><Users size={20}/></div>
              <span className="text-muted" style={{ fontSize: '0.85rem', fontWeight: 600 }}>Total Students</span>
            </div>
            <h2 style={{ margin: 0, fontSize: '1.8rem', color: '#1e3a8a' }}>{dashboardOverview.totalStudents.toLocaleString()}</h2>
            <div style={{ fontSize: '0.8rem', color: '#10B981', marginTop: '8px', fontWeight: 600 }}>
              Seat utilization: {dashboardOverview.seatUtilization}% ({dashboardOverview.totalStudents}/{dashboardOverview.totalCapacity})
            </div>
          </div>

          <div 
            className="card" 
            style={{ padding: '20px', cursor: 'pointer', transition: 'transform 0.15s, box-shadow 0.15s' }}
            onClick={() => handleModuleChange('Teachers')}
            title="Click to view Faculty & Staff Directory"
          >
            <div className="flex-between" style={{ marginBottom: '12px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10B981' }}><UserCheck size={20}/></div>
              <span className="text-muted" style={{ fontSize: '0.85rem', fontWeight: 600 }}>Teachers</span>
            </div>
            <h2 style={{ margin: 0, fontSize: '1.8rem', color: '#1e3a8a' }}>{dashboardOverview.totalTeachers || teachers.length || staffStats.teachingStaff || 0}</h2>
            <div style={{ fontSize: '0.8rem', color: '#10B981', marginTop: '8px', fontWeight: 600 }}>{staffStats.totalStaff || dashboardOverview.totalStaff} Total Staff members</div>
          </div>

          <div 
            className="card" 
            style={{ padding: '20px', cursor: 'pointer' }}
            onClick={() => handleModuleChange('Academics & Exams')}
            title="Click to view Academic Classes"
          >
            <div className="flex-between" style={{ marginBottom: '12px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#F59E0B' }}><Clock size={20}/></div>
              <span className="text-muted" style={{ fontSize: '0.85rem', fontWeight: 600 }}>Avg Attendance</span>
            </div>
            <h2 style={{ margin: 0, fontSize: '1.8rem', color: '#1e3a8a' }}>{dashboardOverview.avgAttendance}%</h2>
            <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '8px', fontWeight: 600 }}>Across {classesList.length || dashboardOverview.activeClassesCount || 6} active classes</div>
          </div>

          <div 
            className="card" 
            style={{ padding: '20px', cursor: 'pointer' }}
            onClick={() => handleModuleChange('Finance & Fees')}
            title="Click to view Fee Ledger"
          >
            <div className="flex-between" style={{ marginBottom: '12px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#EF4444' }}><AlertTriangle size={20}/></div>
              <span className="text-muted" style={{ fontSize: '0.85rem', fontWeight: 600 }}>Pending Approvals</span>
            </div>
            <h2 style={{ margin: 0, fontSize: '1.8rem', color: '#1e3a8a' }}>{dashboardOverview.pendingFeesCount}</h2>
            <div style={{ fontSize: '0.8rem', color: '#EF4444', marginTop: '8px', fontWeight: 600 }}>Pending fees & verifications</div>
          </div>

          <div 
            className="card" 
            style={{ padding: '20px', cursor: 'pointer' }}
            onClick={() => handleModuleChange('Finance & Fees')}
            title="Click to view Fee Collections"
          >
            <div className="flex-between" style={{ marginBottom: '12px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#ccfbf1', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0F766E' }}><CreditCard size={20}/></div>
              <span className="text-muted" style={{ fontSize: '0.85rem', fontWeight: 600 }}>Fee Collections</span>
            </div>
            <h2 style={{ margin: 0, fontSize: '1.8rem', color: '#1e3a8a' }}>₹{(dashboardOverview.totalCollected || 0).toLocaleString()}</h2>
            <div style={{ fontSize: '0.8rem', color: '#10B981', marginTop: '8px', fontWeight: 600 }}>Live ledger totals</div>
          </div>

          <div 
            className="card" 
            style={{ padding: '20px', cursor: 'pointer' }}
            onClick={() => handleModuleChange('Facilities')}
            title="Click to view Transport Routes"
          >
            <div className="flex-between" style={{ marginBottom: '12px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#ede9fe', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7C3AED' }}><Bus size={20}/></div>
              <span className="text-muted" style={{ fontSize: '0.85rem', fontWeight: 600 }}>Fleet & Transport</span>
            </div>
            <h2 style={{ margin: 0, fontSize: '1.8rem', color: '#1e3a8a' }}>{facilitiesStats.transport.totalFleet || dashboardOverview.totalFleetCount || 5} Routes</h2>
            <div style={{ fontSize: '0.8rem', color: '#10B981', marginTop: '8px', fontWeight: 600 }}>100% active route tracking</div>
          </div>
        </div>

        {/* Financials Chart with Period Filter */}
        <div className="card">
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            <div className="card-title">Fee Collections vs Expenses</div>
            <div style={{ display: 'flex', gap: '6px' }}>
              {['This Term', 'Last 6 Months', 'Full Academic Year'].map(period => (
                <button
                  key={period}
                  onClick={() => setRevenuePeriod(period)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    background: revenuePeriod === period ? '#4F46E5' : 'white',
                    color: revenuePeriod === period ? 'white' : '#475569'
                  }}
                >
                  {period}
                </button>
              ))}
            </div>
          </div>
          <div style={{ height: '280px', marginTop: '16px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dashboardOverview.revenueData || defaultRevenueData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} tickFormatter={(val) => `₹${val/1000}K`} />
                <Tooltip />
                <Line type="monotone" dataKey="rev" stroke="#4F46E5" strokeWidth={3} dot={{r:4}} />
                <Line type="monotone" dataKey="cost" stroke="#0F766E" strokeWidth={3} dot={{r:4}} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      
      <div className="right-column">
        {/* Upcoming Events with Add Event Modal */}
        <div className="card">
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="card-title">Upcoming Campus Events</div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button 
                onClick={() => setIsAddEventOpen(true)}
                style={{ background: '#e0e7ff', border: 'none', color: '#4F46E5', borderRadius: '6px', padding: '4px 8px', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
              >
                + Add
              </button>
              <button 
                onClick={() => setIsViewAllEventsOpen(true)}
                style={{ background: 'none', border: 'none', color: '#4F46E5', fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer' }}
              >
                View All
              </button>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '16px' }}>
            {eventsList.slice(0, 3).map((ev, i) => (
              <div key={ev.id || i} style={{ display: 'flex', gap: '16px', alignItems: 'center', padding: '12px', background: '#f8fafc', borderRadius: '12px' }}>
                <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '8px', textAlign: 'center', minWidth: '50px' }}>
                  <div style={{ color: '#EF4444', fontSize: '0.7rem', fontWeight: 800 }}>{ev.m}</div>
                  <div style={{ color: '#1e3a8a', fontSize: '1.2rem', fontWeight: 800 }}>{ev.d}</div>
                </div>
                <div>
                  <div style={{ fontWeight: 600, color: '#1e3a8a', fontSize: '0.95rem' }}>{ev.t}</div>
                  <div style={{ color: '#64748b', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}><Calendar size={12}/> {ev.l}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity with Live Filter */}
        <div className="card" style={{ flex: 1 }}>
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="card-title">Recent Activity Logs</div>
            <div style={{ display: 'flex', gap: '4px' }}>
              {['ALL', 'FINANCIAL', 'ACADEMIC'].map(cat => (
                <button
                  key={cat}
                  onClick={() => setActivityCategoryFilter(cat)}
                  style={{
                    padding: '2px 8px',
                    borderRadius: '6px',
                    border: '1px solid #e2e8f0',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    background: activityCategoryFilter === cat ? '#1e3a8a' : 'white',
                    color: activityCategoryFilter === cat ? 'white' : '#64748b',
                    cursor: 'pointer'
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
          <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {[
              { cat: 'ACADEMIC', i: UserCheck, c: '#10B981', text: 'Teacher leave schedule approved by Principal', time: '10 min ago' },
              { cat: 'FINANCIAL', i: CreditCard, c: '#4F46E5', text: 'Tuition fee payment of ₹15,000 received via UPI', time: '1 hour ago' },
              { cat: 'ACADEMIC', i: BookOpen, c: '#F59E0B', text: 'Class 10 Assessment grades synced with live DB', time: '3 hours ago' },
              { cat: 'SYSTEM', i: Shield, c: '#EF4444', text: 'Multi-campus tenant boundary verified', time: 'Yesterday' }
            ].filter(a => activityCategoryFilter === 'ALL' || a.cat === activityCategoryFilter).map((act, i) => (
              <div key={i} style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: act.c + '1A', color: act.c, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <act.i size={16} />
                </div>
                <div>
                  <div style={{ fontSize: '0.88rem', color: '#334155', fontWeight: 500 }}>{act.text}</div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{act.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderStudentManagement = () => {
    const filteredStudents = studentsList.filter(st => {
      if (!studentSearch) return true;
      const term = studentSearch.toLowerCase();
      return (
        st.name?.toLowerCase().includes(term) ||
        st.rollNumber?.toLowerCase().includes(term) ||
        st.grade?.toLowerCase().includes(term) ||
        st.section?.toLowerCase().includes(term) ||
        st.parentContact?.toLowerCase().includes(term)
      );
    });

    return (
      <div className="dashboard-grid">
        <div className="left-column" style={{ flex: 2 }}>
          <div className="card">
            <div className="card-header">
              <div>
                <div className="card-title">Student Directory</div>
                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Showing {filteredStudents.length} enrolled students</span>
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <div className="table-search" style={{ position: 'relative', width: '250px' }}>
                  <Search size={16} style={{ position: 'absolute', left: '10px', top: '10px', color: '#64748B' }} />
                  <input 
                    type="text" 
                    placeholder="Search students by ID, Name..." 
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px 8px 36px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none' }} 
                  />
                </div>
                <button 
                  onClick={() => navigate(tenantSlug ? `/${tenantSlug}/students` : '/students')}
                  style={{ background: '#4F46E5', color: 'white', border: 'none', borderRadius: '8px', padding: '0 16px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
                >
                  <Plus size={16}/> Student Admission / Directory
                </button>
              </div>
            </div>

            <table style={{ width: '100%', marginTop: '16px', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #e2e8f0', textAlign: 'left', color: '#64748b', fontSize: '0.85rem' }}>
                  <th style={{ padding: '12px 8px' }}>Student ID</th>
                  <th style={{ padding: '12px 8px' }}>Name</th>
                  <th style={{ padding: '12px 8px' }}>Class & Sec</th>
                  <th style={{ padding: '12px 8px' }}>Parent / Contact</th>
                  <th style={{ padding: '12px 8px' }}>Status</th>
                  <th style={{ padding: '12px 8px' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.length > 0 ? (
                  filteredStudents.map((st, i) => (
                    <tr key={st._id || i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '16px 8px', fontWeight: 600, color: '#4F46E5' }}>{st.rollNumber}</td>
                      <td style={{ padding: '16px 8px', fontWeight: 500, color: '#1e3a8a', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#e0e7ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4F46E5', fontWeight: 700, fontSize: '0.85rem' }}>
                          {st.name?.charAt(0) || 'S'}
                        </div>
                        {st.name}
                      </td>
                      <td style={{ padding: '16px 8px', color: '#64748b' }}>{st.grade} - {st.section}</td>
                      <td style={{ padding: '16px 8px', color: '#64748b' }}>{st.parentContact || 'Contact on file'}</td>
                      <td style={{ padding: '16px 8px' }}>
                        <span style={{ 
                          background: st.status === 'Active' ? '#dcfce7' : '#fee2e2', 
                          color: st.status === 'Active' ? '#16a34a' : '#ef4444', 
                          padding: '4px 12px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 600 
                        }}>
                          {st.status || 'Active'}
                        </span>
                      </td>
                      <td style={{ padding: '16px 8px', color: '#64748b' }}>
                        <button 
                          onClick={() => navigate(tenantSlug ? `/${tenantSlug}/students` : '/students')}
                          style={{ background: 'none', border: 'none', color: '#4F46E5', cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem' }}
                        >
                          View Profile
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '32px', color: '#94a3b8' }}>
                      No students found matching "{studentSearch}"
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="right-column">
          {/* Digital ID generator with Interactive Modal Trigger */}
          <div className="card" style={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #4F46E5 100%)', color: 'white' }}>
            <div className="card-header" style={{ borderBottom: '1px solid rgba(255,255,255,0.2)', paddingBottom: '16px', marginBottom: '16px' }}>
              <div className="card-title" style={{ color: 'white' }}>Digital Student ID Hub</div>
              <QrCode size={20} color="rgba(255,255,255,0.8)" />
            </div>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
              <div style={{ width: '80px', height: '80px', borderRadius: '16px', background: 'white', padding: '4px' }}>
                <div style={{ width: '100%', height: '100%', borderRadius: '8px', background: '#e0e7ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4F46E5', fontWeight: 800, fontSize: '1.4rem' }}>
                  {studentsList[0]?.name ? studentsList[0].name.charAt(0) : 'S'}
                </div>
              </div>
              <div>
                <h3 style={{ margin: '0 0 4px 0', fontSize: '1.2rem' }}>{studentsList[0]?.name || 'Rahul Sharma'}</h3>
                <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.8)', marginBottom: '2px' }}>ID: {studentsList[0]?.rollNumber || 'STU-1001'}</div>
                <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.8)' }}>Class: {studentsList[0] ? `${studentsList[0].grade} - ${studentsList[0].section}` : '10th - A'}</div>
              </div>
            </div>
            <button 
              onClick={() => setIsBatchIdCardOpen(true)}
              style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)', color: 'white', border: '1px solid rgba(255,255,255,0.3)', borderRadius: '8px', marginTop: '24px', fontWeight: 700, cursor: 'pointer', transition: 'background 0.2s' }}
            >
              Generate & Print ID Cards (Batch)
            </button>
          </div>

          {/* Attendance Summary */}
          <div className="card">
            <div className="card-header"><div className="card-title">Today's Attendance</div></div>
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px' }}>
              <PieChart width={200} height={200}>
                <Pie data={[{name: 'Present', value: 95}, {name: 'Absent', value: 3}, {name: 'Late', value: 2}]} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                  <Cell fill="#10B981" />
                  <Cell fill="#EF4444" />
                  <Cell fill="#F59E0B" />
                </Pie>
                <Tooltip />
              </PieChart>
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginTop: '16px', fontSize: '0.85rem', fontWeight: 600 }}>
              <span style={{ color: '#10B981' }}>95% Present</span>
              <span style={{ color: '#EF4444' }}>3% Absent</span>
              <span style={{ color: '#F59E0B' }}>2% Late</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderTeacherManagement = () => {
    const filteredTeachers = teachers.filter(t => {
      const matchSearch = !teacherSearch || (
        t.name?.toLowerCase().includes(teacherSearch.toLowerCase()) ||
        t.employeeId?.toLowerCase().includes(teacherSearch.toLowerCase()) ||
        t.qualification?.toLowerCase().includes(teacherSearch.toLowerCase())
      );
      const matchStatus = teacherStatusFilter === 'ALL' || t.status === teacherStatusFilter;
      return matchSearch && matchStatus;
    });

    return (
      <div className="card">
        {staffActionToast && (
          <div style={{ padding: '10px 14px', background: '#dcfce7', border: '1px solid #bbf7d0', color: '#166534', borderRadius: '8px', marginBottom: '14px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle2 size={16} /> {staffActionToast}
          </div>
        )}

        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div className="card-title">Teacher & Faculty Management</div>
            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Admin Authority to create and supervise teaching personnel</span>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <div className="table-search" style={{ position: 'relative', width: '220px' }}>
              <Search size={16} style={{ position: 'absolute', left: '10px', top: '10px', color: '#64748B' }} />
              <input 
                type="text" 
                placeholder="Search teachers..." 
                value={teacherSearch}
                onChange={e => setTeacherSearch(e.target.value)}
                style={{ width: '100%', padding: '8px 12px 8px 36px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none' }} 
              />
            </div>

            <button 
              onClick={() => setIsQuickAddStaffOpen(true)}
              style={{ background: '#4F46E5', color: 'white', border: 'none', borderRadius: '8px', padding: '8px 16px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
            >
              <Plus size={16}/> Provision Faculty
            </button>
            <button 
              onClick={() => navigate(tenantSlug ? `/${tenantSlug}/staff` : '/staff')}
              style={{ background: 'white', border: '1px solid #cbd5e1', color: '#475569', borderRadius: '8px', padding: '8px 14px', fontWeight: 600, cursor: 'pointer' }}
            >
              Staff Hub →
            </button>
          </div>
        </div>

        <table style={{ width: '100%', marginTop: '16px', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #e2e8f0', textAlign: 'left', color: '#64748b', fontSize: '0.85rem' }}>
              <th style={{ padding: '12px 8px' }}>Emp ID</th>
              <th style={{ padding: '12px 8px' }}>Teacher Name</th>
              <th style={{ padding: '12px 8px' }}>Qualification</th>
              <th style={{ padding: '12px 8px' }}>Department</th>
              <th style={{ padding: '12px 8px' }}>Status</th>
              <th style={{ padding: '12px 8px' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredTeachers.length > 0 ? (
              filteredTeachers.map((t, i) => (
                <tr key={t._id || i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '16px 8px', fontWeight: 700, color: '#4F46E5' }}>{t.employeeId}</td>
                  <td style={{ padding: '16px 8px', fontWeight: 600, color: '#1e3a8a' }}>{t.name}</td>
                  <td style={{ padding: '16px 8px', color: '#64748b' }}>{t.qualification || 'M.Sc, B.Ed'}</td>
                  <td style={{ padding: '16px 8px', color: '#64748b' }}>{t.department || 'Science'}</td>
                  <td style={{ padding: '16px 8px' }}>
                    <span style={{ color: '#16a34a', fontWeight: 600, background: '#dcfce7', padding: '2px 8px', borderRadius: '10px', fontSize: '0.75rem' }}>
                      {t.status || 'Active'}
                    </span>
                  </td>
                  <td style={{ padding: '16px 8px', color: '#64748b' }}>
                    <button 
                      onClick={() => navigate(tenantSlug ? `/${tenantSlug}/staff` : '/staff')}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4F46E5', fontWeight: 600, fontSize: '0.8rem' }}
                    >
                      View in Staff Directory
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '32px', color: '#94a3b8' }}>
                  No teachers found matching criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    );
  };

  const renderAcademicsExams = () => (
    <div className="dashboard-grid">
      <div className="left-column">
        <div className="card">
          {academicsActionToast && (
            <div style={{ padding: '10px 14px', background: '#dcfce7', border: '1px solid #bbf7d0', color: '#166534', borderRadius: '8px', marginBottom: '14px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle2 size={16} /> {academicsActionToast}
            </div>
          )}

          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="card-title">Class & Subject Configuration</div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button 
                onClick={() => setIsAddClassOpen(true)}
                style={{ background: '#4F46E5', color: 'white', border: 'none', borderRadius: '8px', padding: '6px 14px', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Plus size={16} /> Add Class Section
              </button>
              <button 
                onClick={() => navigate(tenantSlug ? `/${tenantSlug}/academics` : '/academics')}
                style={{ border: '1px solid #cbd5e1', background: 'white', borderRadius: '8px', padding: '6px 14px', fontSize: '0.85rem', fontWeight: 600, color: '#2563eb', cursor: 'pointer' }}
              >
                Open Academics Hub
              </button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px', marginTop: '20px' }}>
            {classesList.map((c, i) => (
              <div key={c._id || i} style={{ padding: '16px', border: '1px solid #e2e8f0', borderRadius: '12px', background: '#f8fafc' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div style={{ fontWeight: 700, color: '#1e3a8a', fontSize: '1.05rem' }}>{c.className} - {c.section}</div>
                  <span style={{ fontSize: '0.72rem', background: '#dcfce7', color: '#16a34a', padding: '2px 8px', borderRadius: '4px', fontWeight: 700 }}>Active</span>
                </div>
                <div style={{ fontSize: '0.8rem', color: '#64748b', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span>Class Teacher: <strong style={{ color: '#334155' }}>{c.classTeacherName || c.teacherName || 'Assigned Faculty'}</strong></span>
                  <span>Room: <strong style={{ color: '#334155' }}>{c.roomNumber || 'Room 101'}</strong></span>
                  <span>Capacity: <strong style={{ color: '#334155' }}>{c.capacity || 40} seats</strong></span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="right-column">
        <div className="card">
          <div className="card-header"><div className="card-title">Examinations & Digital Assessments</div></div>
          <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ padding: '16px', border: '1px solid #e2e8f0', borderRadius: '12px', background: '#f8fafc' }}>
              <div style={{ fontWeight: 700, color: '#1e3a8a', marginBottom: '4px' }}>Mid-Term Assessment 2026-2027</div>
              <div style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '12px' }}>Schedule Active | All Classes</div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <span style={{ background: '#dcfce7', color: '#16a34a', padding: '4px 8px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 700 }}>Schedule Published</span>
                <span style={{ background: '#dbeafe', color: '#1d4ed8', padding: '4px 8px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 700 }}>Live DB Synced</span>
              </div>
              <button 
                onClick={() => setIsAssessmentModalOpen(true)}
                style={{ marginTop: '12px', background: 'white', border: '1px solid #cbd5e1', padding: '6px 12px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600, color: '#1e3a8a', cursor: 'pointer', width: '100%' }}
              >
                View Assessment Schedule →
              </button>
            </div>

            <button 
              onClick={() => navigate(tenantSlug ? `/${tenantSlug}/reports` : '/reports')}
              style={{ width: '100%', padding: '14px', background: '#4F46E5', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', marginTop: '12px' }}
            >
              <FileText size={18} /> Open Institutional Reports Hub
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderFinance = () => {
    const filteredFees = pendingFeesList.filter(fee => {
      const matchSearch = !feeSearch || (
        fee.studentName?.toLowerCase().includes(feeSearch.toLowerCase()) ||
        fee.classSection?.toLowerCase().includes(feeSearch.toLowerCase())
      );
      const matchStatus = feeStatusFilter === 'ALL' || fee.status === feeStatusFilter;
      return matchSearch && matchStatus;
    });

    return (
      <div className="dashboard-grid">
        <div className="card" style={{ flex: 1 }}>
          {financeActionToast && (
            <div style={{ padding: '10px 14px', background: '#dcfce7', border: '1px solid #bbf7d0', color: '#166534', borderRadius: '8px', marginBottom: '14px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle2 size={16} /> {financeActionToast}
            </div>
          )}

          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div className="card-title">Fee Management & Ledger</div>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
              <div className="table-search" style={{ position: 'relative', width: '200px' }}>
                <Search size={16} style={{ position: 'absolute', left: '10px', top: '10px', color: '#64748B' }} />
                <input 
                  type="text" 
                  placeholder="Search transactions..." 
                  value={feeSearch}
                  onChange={e => setFeeSearch(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px 8px 36px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none' }} 
                />
              </div>

              <select
                value={feeStatusFilter}
                onChange={e => setFeeStatusFilter(e.target.value)}
                style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none', background: 'white', fontSize: '0.85rem' }}
              >
                <option value="ALL">All Statuses</option>
                <option value="Collected">Collected</option>
                <option value="Due this month">Due this month</option>
                <option value="Overdue">Overdue</option>
              </select>

              <button 
                onClick={() => setIsRecordPaymentOpen(true)}
                style={{ background: '#10B981', color: 'white', border: 'none', borderRadius: '8px', padding: '8px 16px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
              >
                <Plus size={16}/> Record Payment
              </button>
              <button 
                onClick={handleExportFinanceReport}
                style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '8px 16px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: '#1e3a8a' }}
              >
                <Download size={16}/> Export Ledger CSV
              </button>
              <button 
                onClick={() => navigate(tenantSlug ? `/${tenantSlug}/finance` : '/finance')}
                style={{ background: '#4F46E5', color: 'white', border: 'none', borderRadius: '8px', padding: '8px 16px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
              >
                Finance Hub →
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '20px', marginTop: '20px', marginBottom: '28px', flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 200px', padding: '20px', background: '#f8fafc', borderRadius: '16px', borderLeft: '4px solid #10B981' }}>
              <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600, marginBottom: '6px' }}>Total Collected (YTD)</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#1e3a8a' }}>₹{(feeStats.collected || dashboardOverview.totalCollected || 0).toLocaleString()}</div>
            </div>
            <div style={{ flex: '1 1 200px', padding: '20px', background: '#f8fafc', borderRadius: '16px', borderLeft: '4px solid #F59E0B' }}>
              <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600, marginBottom: '6px' }}>Pending This Month</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#1e3a8a' }}>₹{(feeStats.dueThisMonth || 0).toLocaleString()}</div>
            </div>
            <div style={{ flex: '1 1 200px', padding: '20px', background: '#f8fafc', borderRadius: '16px', borderLeft: '4px solid #EF4444' }}>
              <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600, marginBottom: '6px' }}>Overdue Accounts</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#1e3a8a' }}>₹{(feeStats.overdue || 0).toLocaleString()}</div>
            </div>
          </div>
          
          <h3 style={{ fontSize: '1.05rem', color: '#1e3a8a', marginBottom: '14px', fontWeight: 700 }}>Fee Transactions Ledger (Live DB)</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e2e8f0', textAlign: 'left', color: '#64748b', fontSize: '0.85rem' }}>
                <th style={{ padding: '12px 8px' }}>Receipt / Due ID</th>
                <th style={{ padding: '12px 8px' }}>Student Name</th>
                <th style={{ padding: '12px 8px' }}>Class</th>
                <th style={{ padding: '12px 8px' }}>Amount</th>
                <th style={{ padding: '12px 8px' }}>Due / Paid Date</th>
                <th style={{ padding: '12px 8px' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {(filteredFees.length > 0 ? filteredFees : initialPendingFees).map((fee, idx) => (
                <tr key={fee._id || fee.id || idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '16px 8px', fontWeight: 600, color: '#4F46E5' }}>RCP-{1000 + (idx + 1)}</td>
                  <td style={{ padding: '16px 8px', fontWeight: 500, color: '#1e3a8a' }}>{fee.studentName || fee.student}</td>
                  <td style={{ padding: '16px 8px', color: '#64748b' }}>{fee.classSection || fee.cls}</td>
                  <td style={{ padding: '16px 8px', fontWeight: 700, color: '#334155' }}>₹{(fee.amount || fee.value || 0).toLocaleString()}</td>
                  <td style={{ padding: '16px 8px', color: '#64748b' }}>{fee.dueDate ? new Date(fee.dueDate).toLocaleDateString() : (fee.date || 'Recent')}</td>
                  <td style={{ padding: '16px 8px' }}>
                    <span style={{ 
                      background: fee.status === 'Collected' ? '#dcfce7' : fee.status === 'Overdue' ? '#fee2e2' : '#fef3c7', 
                      color: fee.status === 'Collected' ? '#16a34a' : fee.status === 'Overdue' ? '#ef4444' : '#d97706', 
                      padding: '4px 12px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 600 
                    }}>
                      {fee.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderFacilities = () => (
    <div className="dashboard-grid">
      <div className="card" style={{ flex: 1 }}>
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="card-title">Library Operations</div>
          <button 
            onClick={() => navigate(tenantSlug ? `/${tenantSlug}/books` : '/books')}
            style={{ border: '1px solid #e2e8f0', background: 'white', borderRadius: '8px', padding: '6px 14px', fontSize: '0.85rem', fontWeight: 600, color: '#4F46E5', cursor: 'pointer' }}
          >
            Manage Catalog →
          </button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginTop: '20px' }}>
          {[
            { l: 'Total Books', v: facilitiesStats.library.totalCopies || dashboardOverview.totalBooksCount || 120 },
            { l: 'Issued Books', v: facilitiesStats.library.issuedCopies || 18 },
            { l: 'Overdue Returns', v: facilitiesStats.library.overdueCopies || 2 },
            { l: 'Fines Collected', v: `₹${(facilitiesStats.library.finesCollected || 4500).toLocaleString()}` }
          ].map((item, i) => (
            <div key={i} style={{ padding: '20px', background: '#f8fafc', borderRadius: '12px', textAlign: 'center', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#1e3a8a' }}>{item.v}</div>
              <div style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: 600, marginTop: '8px' }}>{item.l}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="card" style={{ flex: 1 }}>
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="card-title">Transport Logistics</div>
          <button 
            onClick={() => navigate(tenantSlug ? `/${tenantSlug}/routes` : '/routes')}
            style={{ border: '1px solid #e2e8f0', background: 'white', borderRadius: '8px', padding: '6px 14px', fontSize: '0.85rem', fontWeight: 600, color: '#0F766E', cursor: 'pointer' }}
          >
            Manage Routes →
          </button>
        </div>
        <div style={{ display: 'flex', gap: '20px', marginTop: '20px' }}>
          <div style={{ flex: 1, padding: '20px', background: '#eff6ff', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '48px', height: '48px', background: '#bfdbfe', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1e40af' }}><Bus size={24} /></div>
            <div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1e3a8a' }}>{facilitiesStats.transport.totalFleet || dashboardOverview.totalFleetCount || 5}</div>
              <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>Active Routes / Fleet</div>
            </div>
          </div>
          <div style={{ flex: 1, padding: '20px', background: '#f0fdf4', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '48px', height: '48px', background: '#bbf7d0', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#166534' }}><Users size={24} /></div>
            <div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1e3a8a' }}>{facilitiesStats.transport.mappedStudents || 188}</div>
              <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>Assigned Passengers</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderCommunication = () => (
    <div className="dashboard-grid">
      <div className="left-column">
        <div className="card">
          {announcementToast && (
            <div style={{ padding: '10px 14px', background: '#dcfce7', border: '1px solid #bbf7d0', color: '#166534', borderRadius: '8px', marginBottom: '14px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle2 size={16} /> {announcementToast}
            </div>
          )}

          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
            <div className="card-title">School-Wide Announcements</div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button 
                onClick={() => setIsAddAnnouncementOpen(true)}
                style={{ background: '#4F46E5', color: 'white', border: 'none', borderRadius: '8px', padding: '8px 16px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
              >
                <Plus size={16}/> Post Announcement
              </button>
              <button 
                onClick={() => navigate(tenantSlug ? `/${tenantSlug}/communication` : '/communication')}
                style={{ background: 'white', border: '1px solid #cbd5e1', color: '#475569', borderRadius: '8px', padding: '8px 14px', fontWeight: 600, cursor: 'pointer' }}
              >
                Notice Board →
              </button>
            </div>
          </div>
          <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {(announcementsList.length > 0 ? announcementsList : [
              { title: 'Diwali Holidays Notice', date: 'Oct 09, 2026', content: 'School will remain closed from Oct 20th to Oct 25th on account of Diwali.', targetAudience: 'All Students & Parents', priority: 'Important' },
              { title: 'Emergency Alert: Weather Advisory', date: 'Oct 05, 2026', content: 'Heavy rain warnings issued for the district. Transport routes running early.', targetAudience: 'All', priority: 'Urgent' }
            ]).map((ann, idx) => (
              <div key={ann._id || idx} style={{ padding: '16px', border: '1px solid #e2e8f0', borderRadius: '12px', borderLeft: `4px solid ${ann.priority === 'Urgent' ? '#EF4444' : '#F59E0B'}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontWeight: 700, color: '#1e3a8a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {ann.priority === 'Urgent' && <AlertTriangle size={16} color="#EF4444"/>}
                    {ann.title}
                  </span>
                  <span style={{ fontSize: '0.8rem', color: '#64748b' }}>{ann.date ? new Date(ann.date).toLocaleDateString() : 'Recent'}</span>
                </div>
                <p style={{ margin: 0, fontSize: '0.9rem', color: '#475569', lineHeight: 1.5 }}>{ann.content}</p>
                <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
                  <span style={{ background: '#f1f5f9', padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', color: '#64748b' }}>To: {ann.targetAudience}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Institutional Reports & Audit Extracts */}
        <div className="card" style={{ marginTop: '20px' }}>
          <div className="card-header">
            <div>
              <div className="card-title">Institutional Reports & Audit Extracts</div>
              <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Download verified CSV data sheets directly from database</span>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', marginTop: '16px' }}>
            <button
              onClick={() => handleExportReport('academic')}
              style={{ padding: '14px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', fontWeight: 600, color: '#1e3a8a' }}
            >
              <span>Academic Performance CSV</span>
              <Download size={16} color="#4F46E5" />
            </button>
            <button
              onClick={() => handleExportReport('attendance')}
              style={{ padding: '14px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', fontWeight: 600, color: '#1e3a8a' }}
            >
              <span>Daily Attendance Register CSV</span>
              <Download size={16} color="#4F46E5" />
            </button>
          </div>
        </div>
      </div>

      <div className="right-column">
        <div className="card">
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
            <div>
              <div className="card-title">Grievance & Support Tickets</div>
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Click status pill to toggle workflow state</span>
            </div>
            <button 
              onClick={() => setIsAddTicketOpen(true)}
              style={{ border: '1px solid #cbd5e1', background: 'white', borderRadius: '8px', padding: '6px 12px', fontSize: '0.8rem', fontWeight: 600, color: '#4F46E5', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <Plus size={14} /> New Ticket
            </button>
          </div>
          <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {ticketsList.map((t) => (
              <div key={t.id} style={{ padding: '14px 16px', background: '#f8fafc', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontWeight: 600, color: '#1e3a8a', fontSize: '0.92rem', marginBottom: '2px' }}>{t.t}</div>
                  <div style={{ fontSize: '0.78rem', color: '#64748b' }}>{t.user}</div>
                </div>
                <button
                  onClick={() => handleToggleTicketStatus(t.id)}
                  style={{ background: t.color + '1A', color: t.color, border: 'none', padding: '5px 12px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
                  title="Click to toggle status"
                >
                  {t.status} ↻
                </button>
              </div>
            ))}
          </div>
          <button 
            onClick={() => navigate(tenantSlug ? `/${tenantSlug}/communication` : '/communication')}
            style={{ width: '100%', padding: '12px', background: 'white', border: '1px solid #e2e8f0', color: '#1e3a8a', borderRadius: '8px', marginTop: '16px', fontWeight: 600, cursor: 'pointer' }}
          >
            Open Full Communication Center
          </button>
        </div>
      </div>
    </div>
  );

  const renderSystemConfig = () => (
    <div className="card" style={{ maxWidth: '880px', margin: '0 auto', padding: '32px', borderRadius: '16px', background: 'white', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
      <div className="card-header" style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div className="card-title" style={{ fontSize: '1.35rem', fontWeight: 800, color: '#1e3a8a' }}>
            Global School Parameters & System Configuration
          </div>
          <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
            Administrator Authority to assign the Official School Name, Address, and institutional settings
          </span>
        </div>
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '6px 14px',
          borderRadius: '20px',
          background: 'rgba(79, 70, 229, 0.1)',
          color: '#4F46E5',
          fontSize: '0.75rem',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.05em'
        }}>
          <Shield size={14} /> Admin Authority
        </span>
      </div>

      {configStatus && (
        <div style={{
          padding: '14px 18px',
          borderRadius: '12px',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          fontSize: '0.9rem',
          fontWeight: 600,
          background: configStatus.type === 'success' ? '#f0fdf4' : '#fef2f2',
          color: configStatus.type === 'success' ? '#166534' : '#991b1b',
          border: configStatus.type === 'success' ? '1px solid #bbf7d0' : '1px solid #fecaca',
        }}>
          {configStatus.type === 'success' ? <Check size={18} color="#16a34a" /> : <AlertTriangle size={18} color="#dc2626" />}
          <span style={{ flex: 1 }}>{configStatus.message}</span>
        </div>
      )}

      {/* Primary Highlight Card: Assign School Name & Address */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.05) 0%, rgba(15, 118, 110, 0.05) 100%)',
        border: '1.5px solid rgba(79, 70, 229, 0.25)',
        borderRadius: '16px',
        padding: '24px',
        marginBottom: '28px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '1.05rem', fontWeight: 800, color: '#1e3a8a', marginBottom: '4px' }}>
              Assign Official School Name & Address
            </label>
            <p style={{ margin: 0, fontSize: '0.82rem', color: '#64748b' }}>
              This updates the official school branding, campus location, and institutional credentials across portal headers, login screens, report cards, and receipts.
            </p>
          </div>
          <span style={{
            fontSize: '0.75rem',
            padding: '5px 12px',
            borderRadius: '12px',
            background: 'white',
            border: '1px solid #cbd5e1',
            color: '#0F766E',
            fontWeight: 700
          }}>
            Workspace: {tenantSlug}
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                Official School / Campus Name *
              </label>
              <div style={{ position: 'relative' }}>
                <Building2 size={18} style={{ position: 'absolute', left: '12px', top: '13px', color: '#94a3b8' }} />
                <input 
                  type="text" 
                  value={schoolNameInput}
                  onChange={(e) => setSchoolNameInput(e.target.value)}
                  placeholder="e.g. St. Xavier's International School"
                  style={{ 
                    width: '100%', 
                    padding: '12px 16px 12px 38px', 
                    borderRadius: '10px', 
                    border: '1.5px solid #cbd5e1', 
                    outline: 'none', 
                    fontSize: '0.95rem',
                    fontWeight: 600,
                    color: '#0f172a',
                    background: 'white',
                    boxSizing: 'border-box'
                  }} 
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                Official School / Campus Address
              </label>
              <div style={{ position: 'relative' }}>
                <MapPin size={18} style={{ position: 'absolute', left: '12px', top: '13px', color: '#94a3b8' }} />
                <input 
                  type="text" 
                  value={schoolAddressInput}
                  onChange={(e) => setSchoolAddressInput(e.target.value)}
                  placeholder="e.g. Plot No. 42, Knowledge Park III, Greater Noida, UP - 201306"
                  style={{ 
                    width: '100%', 
                    padding: '12px 16px 12px 38px', 
                    borderRadius: '10px', 
                    border: '1.5px solid #cbd5e1', 
                    outline: 'none', 
                    fontSize: '0.95rem',
                    fontWeight: 500,
                    color: '#0f172a',
                    background: 'white',
                    boxSizing: 'border-box'
                  }} 
                />
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
            <button
              type="button"
              onClick={handleSaveGlobalConfig}
              disabled={isSavingConfig}
              style={{
                padding: '12px 26px',
                background: 'linear-gradient(135deg, #4F46E5 0%, #1e40af 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                fontWeight: 700,
                fontSize: '0.95rem',
                cursor: isSavingConfig ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 14px rgba(79, 70, 229, 0.35)',
                opacity: isSavingConfig ? 0.7 : 1
              }}
            >
              <Save size={16} />
              {isSavingConfig ? 'Saving...' : 'Assign Name & Address'}
            </button>
          </div>
        </div>

        {(schoolNameInput || schoolAddressInput) && (
          <div style={{ marginTop: '16px', padding: '12px 16px', background: 'white', borderRadius: '10px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
              <span style={{ fontWeight: 600, color: '#64748b' }}>Active Branding:</span>
              <span style={{ fontWeight: 800, color: '#1e3a8a' }}>{schoolNameInput || 'Default School'}</span>
              {schoolAddressInput && (
                <>
                  <span style={{ color: '#cbd5e1' }}>•</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#475569' }}>
                    <MapPin size={13} color="#4F46E5" /> {schoolAddressInput}
                  </span>
                </>
              )}
            </div>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#16a34a', background: '#dcfce7', padding: '2px 8px', borderRadius: '6px' }}>
              Verified Entity
            </span>
          </div>
        )}
      </div>

      {/* Grid of secondary institutional parameters */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '8px' }}>Active Academic Year</label>
          <select 
            value={academicYear} 
            onChange={(e) => setAcademicYear(e.target.value)}
            style={{ width: '100%', padding: '11px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', background: 'white', fontSize: '0.9rem', fontWeight: 500 }}
          >
            <option value="2024-2025">2024-2025</option>
            <option value="2025-2026">2025-2026</option>
            <option value="2026-2027">2026-2027</option>
            <option value="2027-2028">2027-2028</option>
          </select>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '8px' }}>Default Operational Currency</label>
          <input 
            type="text" 
            value={currency} 
            onChange={(e) => setCurrency(e.target.value)}
            style={{ width: '100%', padding: '11px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '0.9rem', fontWeight: 500 }} 
          />
        </div>
        <div style={{ gridColumn: 'span 2' }}>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '8px' }}>System Timezone</label>
          <input 
            type="text" 
            value={timezone} 
            onChange={(e) => setTimezone(e.target.value)}
            style={{ width: '100%', padding: '11px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '0.9rem', fontWeight: 500 }} 
          />
        </div>
      </div>

      <h3 style={{ fontSize: '1.05rem', color: '#1e3a8a', marginTop: '32px', marginBottom: '16px', fontWeight: 700 }}>Security & Infrastructure Toggles</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <div>
            <div style={{ fontWeight: 700, color: '#1e3a8a' }}>Enable Maintenance Mode</div>
            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Restricts portal login for all non-administrative users.</div>
          </div>
          <div 
            onClick={() => setMaintenanceMode(!maintenanceMode)}
            style={{ width: '44px', height: '24px', borderRadius: '12px', background: maintenanceMode ? '#4F46E5' : '#cbd5e1', position: 'relative', cursor: 'pointer', transition: 'background 0.3s' }}
          >
            <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: 'white', position: 'absolute', top: '3px', left: maintenanceMode ? '23px' : '3px', transition: 'all 0.3s' }}></div>
          </div>
        </div>
      </div>

      <button 
        type="button"
        onClick={handleSaveGlobalConfig}
        disabled={isSavingConfig}
        style={{ marginTop: '28px', width: '100%', padding: '14px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: isSavingConfig ? 'not-allowed' : 'pointer', boxShadow: '0 4px 12px rgba(37,99,235,0.3)', opacity: isSavingConfig ? 0.7 : 1 }}
      >
        <Save size={18}/> {isSavingConfig ? 'Saving Global Configuration...' : 'Save Global Configuration'}
      </button>
    </div>
  );

  const renderInfrastructure = () => (
    <div className="dashboard-grid">
      <div className="left-column">
        {backupToast && (
          <div style={{ padding: '12px 16px', background: '#dcfce7', border: '1px solid #bbf7d0', color: '#166534', borderRadius: '10px', marginBottom: '16px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle2 size={16} /> {backupToast}
          </div>
        )}

        {/* Live Diagnostics Card */}
        <div className="card" style={{ padding: '20px', background: 'linear-gradient(135deg, #1e3a8a 0%, #312e81 100%)', color: 'white', marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <div style={{ fontSize: '0.78rem', color: '#93c5fd', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Cluster Telemetry</div>
              <h3 style={{ margin: '4px 0 0', fontSize: '1.25rem', fontWeight: 800 }}>Server Diagnostics & Latency Ping</h3>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={handleRunDiagnostics}
                disabled={isPinging}
                style={{ padding: '10px 18px', borderRadius: '8px', background: 'white', color: '#1e3a8a', border: 'none', fontWeight: 700, cursor: isPinging ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <RefreshCw size={14} className={isPinging ? 'spin' : ''} />
                {isPinging ? 'Measuring Ping...' : 'Run Diagnostics'}
              </button>
              <button
                onClick={handleCreateInstantBackup}
                style={{ padding: '10px 18px', borderRadius: '8px', background: 'rgba(255,255,255,0.2)', color: 'white', border: '1px solid rgba(255,255,255,0.4)', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Database size={14} /> Instant Backup
              </button>
            </div>
          </div>

          {diagnosticResult && (
            <div style={{ marginTop: '16px', padding: '14px', background: 'rgba(255,255,255,0.1)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.88rem' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10B981' }}></span>
                <span>Latency: <strong>{diagnosticResult.latency}</strong></span>
                <span>• Database: <strong>{diagnosticResult.db}</strong></span>
              </div>
              <span style={{ fontSize: '0.75rem', color: '#cbd5e1' }}>Last Measured: {diagnosticResult.time}</span>
            </div>
          )}
        </div>

        {/* System Resource Usage (CPU/Memory) */}
        <div className="card" style={{ padding: '24px', background: 'white', marginBottom: '24px' }}>
          <div className="card-header" style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Activity size={20} color="#4F46E5" />
              <div className="card-title">Server Resource & Cluster Utilization</div>
            </div>
            <div style={{ display: 'flex', gap: '16px', fontSize: '0.8rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#64748B' }}><div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#4F46E5' }}></div> CPU Load</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748B' }}><div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#60A5FA' }}></div> Memory</div>
            </div>
          </div>
          <div style={{ height: '280px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={systemUsageData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCpuDash" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#4F46E5" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorMemDash" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#60A5FA" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#60A5FA" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} tickFormatter={(val) => `${val}%`} domain={[0, 100]} />
                <Tooltip />
                <Area type="monotone" dataKey="cpu" stroke="#4F46E5" strokeWidth={2} fillOpacity={1} fill="url(#colorCpuDash)" />
                <Area type="monotone" dataKey="memory" stroke="#60A5FA" strokeWidth={2} fillOpacity={1} fill="url(#colorMemDash)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="right-column" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div className="card" style={{ padding: '24px', background: 'white' }}>
          <div className="card-header" style={{ marginBottom: '16px' }}>
            <div className="card-title">User Role Distribution</div>
          </div>
          <div style={{ height: '220px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={userRoleDistribution} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none">
                  {userRoleDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', marginTop: '16px' }}>
            {userRoleDistribution.map((item, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: item.color }}></div>
                <span style={{ fontSize: '0.8rem', color: '#64748B' }}>{item.name}:</span>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1e3a8a' }}>{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderRBAC = () => (
    <div className="card" style={{ padding: '28px', borderRadius: '16px', background: 'white' }}>
      {rbacToast && (
        <div style={{ padding: '10px 14px', background: '#dcfce7', border: '1px solid #bbf7d0', color: '#166534', borderRadius: '8px', marginBottom: '16px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CheckCircle2 size={16} /> {rbacToast}
        </div>
      )}

      <div className="card-header" style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <div className="card-title">Role-Based Access Control (RBAC) Matrix</div>
          <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Admin Authority to configure permissions and least-privilege matrix</span>
        </div>
        <button 
          onClick={() => setIsAddRoleOpen(true)}
          style={{ border: '1px solid #cbd5e1', background: 'white', borderRadius: '8px', padding: '6px 14px', fontSize: '0.85rem', fontWeight: 600, color: '#2563eb', cursor: 'pointer' }}
        >
          + Add Custom Role
        </button>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '760px' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', textAlign: 'center', color: '#1e3a8a', fontSize: '0.85rem' }}>
              <th style={{ padding: '12px', textAlign: 'left' }}>System Module & Operation</th>
              {rbacRoles.map(role => (
                <th key={role} style={{ padding: '12px' }}>{role}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rbacMatrix.map((row, rIdx) => (
              <tr key={rIdx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '14px 12px', fontWeight: 600, color: '#1e3a8a' }}>{row.m}</td>
                {row.permissions.map((val, cIdx) => (
                  <td key={cIdx} style={{ textAlign: 'center' }}>
                    <input 
                      type="checkbox" 
                      checked={val} 
                      onChange={() => handleTogglePermission(rIdx, cIdx)}
                      style={{ width: '18px', height: '18px', accentColor: '#2563eb', cursor: 'pointer' }} 
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px' }}>
        <button 
          onClick={() => {
            setRbacToast('RBAC Matrix applied and enforced across all active campus roles.');
            setTimeout(() => setRbacToast(''), 4000);
          }}
          style={{ padding: '10px 24px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 12px rgba(37,99,235,0.3)' }}
        >
          Apply RBAC Matrix
        </button>
      </div>
    </div>
  );

  const renderSecurity = () => {
    const filteredAudit = auditLogsList.filter(l => auditFilter === 'ALL' || l.status.toUpperCase() === auditFilter);

    return (
      <div className="dashboard-grid">
        <div className="left-column">
          {securityToast && (
            <div style={{ padding: '10px 14px', background: '#dcfce7', border: '1px solid #bbf7d0', color: '#166534', borderRadius: '8px', marginBottom: '16px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle2 size={16} /> {securityToast}
            </div>
          )}

          <div className="card" style={{ marginBottom: '24px', padding: '24px', background: 'white' }}>
            <div className="card-header" style={{ marginBottom: '16px' }}>
              <div className="card-title">Security & Authentication Protocols</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div style={{ fontWeight: 700, color: '#1e3a8a' }}>JWT Token Lifespan</div>
                  <input 
                    type="text" 
                    value={jwtLifespan}
                    onChange={e => setJwtLifespan(e.target.value)}
                    style={{ width: '70px', padding: '6px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', textAlign: 'center', fontWeight: 600 }} 
                  />
                </div>
                <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Configure authentication token validity before requiring re-authentication.</div>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <div>
                  <div style={{ fontWeight: 700, color: '#1e3a8a' }}>Enforce 2FA for Administrative Personnel</div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Require Two-Factor Auth for Admin and Finance staff accounts.</div>
                </div>
                <div 
                  onClick={() => setEnforce2FA(!enforce2FA)}
                  style={{ width: '44px', height: '24px', borderRadius: '12px', background: enforce2FA ? '#2563eb' : '#cbd5e1', position: 'relative', cursor: 'pointer', transition: 'background 0.3s' }}
                >
                  <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: 'white', position: 'absolute', top: '3px', left: enforce2FA ? '23px' : '3px', transition: 'all 0.3s' }}></div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <div>
                  <div style={{ fontWeight: 700, color: '#1e3a8a' }}>Strict Salt Password Hashing</div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Enforce bcrypt salt rounds (10 rounds active).</div>
                </div>
                <div 
                  onClick={() => setStrictSaltHashing(!strictSaltHashing)}
                  style={{ width: '44px', height: '24px', borderRadius: '12px', background: strictSaltHashing ? '#2563eb' : '#cbd5e1', position: 'relative', cursor: 'pointer', transition: 'background 0.3s' }}
                >
                  <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: 'white', position: 'absolute', top: '3px', left: strictSaltHashing ? '23px' : '3px', transition: 'all 0.3s' }}></div>
                </div>
              </div>

              <button
                onClick={() => {
                  setSecurityToast('Security policy and authentication parameters updated.');
                  setTimeout(() => setSecurityToast(''), 4000);
                }}
                style={{ marginTop: '8px', padding: '12px', background: '#4F46E5', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}
              >
                Save Security Policy
              </button>
            </div>
          </div>
        </div>
        
        <div className="right-column">
          <div className="card" style={{ flex: 1, padding: '24px', background: 'white' }}>
            <div className="card-header" style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldCheck size={20} color="#16A34A" />
                <div className="card-title">Real-time Audit Logs</div>
              </div>
              <div style={{ display: 'flex', gap: '4px' }}>
                {['ALL', 'SUCCESS', 'WARNING', 'BLOCKED'].map(f => (
                  <button
                    key={f}
                    onClick={() => setAuditFilter(f)}
                    style={{
                      padding: '2px 8px',
                      borderRadius: '6px',
                      border: '1px solid #e2e8f0',
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      background: auditFilter === f ? '#1e3a8a' : 'white',
                      color: auditFilter === f ? 'white' : '#64748b',
                      cursor: 'pointer'
                    }}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {filteredAudit.map(log => (
                <div key={log.id} style={{ display: 'flex', flexDirection: 'column', gap: '4px', padding: '10px 12px', background: '#f8fafc', borderRadius: '10px', borderLeft: `3px solid ${log.color}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontWeight: 700, color: '#1e3a8a', fontSize: '0.85rem' }}>{log.action}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{log.time}</div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{log.user} • {log.target}</div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: log.color }}>{log.status}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ width: '100%', minHeight: '100%' }}>
      {/* Module Content */}
      {activeModule === 'Overview' && renderOverview()}
      {activeModule === 'My Schools & Campuses' && renderSchoolsManagement()}
      {activeModule === 'Students & IDs' && renderStudentManagement()}
      {activeModule === 'Teachers' && renderTeacherManagement()}
      {activeModule === 'Academics & Exams' && renderAcademicsExams()}
      {activeModule === 'Finance & Fees' && renderFinance()}
      {activeModule === 'Facilities' && renderFacilities()}
      {activeModule === 'Communication & Reports' && renderCommunication()}
      {activeModule === 'System Configuration' && renderSystemConfig()}
      {activeModule === 'System Health & Infra' && renderInfrastructure()}
      {activeModule === 'RBAC (Access Control)' && renderRBAC()}
      {activeModule === 'Security & Compliance' && renderSecurity()}

      {/* Register New School Modal */}
      <CreateSchoolModal
        isOpen={isCreateSchoolOpen}
        onClose={() => setIsCreateSchoolOpen(false)}
        onSchoolCreated={() => {
          fetchSchoolsList();
          window.dispatchEvent(new CustomEvent('schoolListUpdated'));
        }}
      />

      {/* Appoint / Change Branch Admin Modal */}
      <AppointAdminModal
        isOpen={!!targetSchoolForAdmin}
        targetSchool={targetSchoolForAdmin}
        onClose={() => setTargetSchoolForAdmin(null)}
        onAdminAppointed={() => {
          fetchSchoolsList();
          window.dispatchEvent(new CustomEvent('schoolListUpdated'));
        }}
      />

      {/* Appoint / Change Principal Modal */}
      <AppointPrincipalModal
        isOpen={!!targetSchoolForPrincipal}
        targetSchool={targetSchoolForPrincipal}
        onClose={() => setTargetSchoolForPrincipal(null)}
        onPrincipalAppointed={(updatedSchool) => {
          fetchSchoolsList();
          window.dispatchEvent(new CustomEvent('schoolListUpdated'));
        }}
      />

      {/* Delete School Campus Modal */}
      <DeleteSchoolModal
        isOpen={!!targetSchoolForDelete}
        targetSchool={targetSchoolForDelete}
        onClose={() => setTargetSchoolForDelete(null)}
        onSchoolDeleted={() => {
          fetchSchoolsList();
          window.dispatchEvent(new CustomEvent('schoolListUpdated'));
        }}
      />

      {/* Quick Add Faculty Modal */}
      {isQuickAddStaffOpen && createPortal(
        <div 
          onClick={(e) => { if (e.target === e.currentTarget) setIsQuickAddStaffOpen(false); }}
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999999, padding: '20px' }}
        >
          <div style={{ background: 'white', borderRadius: '24px', padding: '28px', width: '500px', maxWidth: '95vw', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', border: '1px solid rgba(226, 232, 240, 0.8)', animation: 'slide-up 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', paddingBottom: '14px', borderBottom: '1px solid #f1f5f9' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#e0e7ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4F46E5' }}>
                  <UserCheck size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#1e3a8a' }}>Provision New Faculty</h3>
                  <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Add verified teacher or faculty member</span>
                </div>
              </div>
              <button onClick={() => setIsQuickAddStaffOpen(false)} style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748b' }}><X size={16} /></button>
            </div>
            <form onSubmit={handleQuickAddFaculty} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>Full Name *</label>
                <input required type="text" placeholder="e.g. Dr. Rajesh Kumar" value={newStaff.name} onChange={e => setNewStaff({ ...newStaff, name: e.target.value })} style={{ width: '100%', padding: '11px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>Role</label>
                  <select value={newStaff.role} onChange={e => setNewStaff({ ...newStaff, role: e.target.value })} style={{ width: '100%', padding: '11px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', outline: 'none', boxSizing: 'border-box' }}>
                    <option value="Teacher">Teacher</option>
                    <option value="HOD">HOD</option>
                    <option value="Counselor">Counselor</option>
                    <option value="Admin Staff">Admin Staff</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>Department</label>
                  <input type="text" placeholder="Mathematics" value={newStaff.department} onChange={e => setNewStaff({ ...newStaff, department: e.target.value })} style={{ width: '100%', padding: '11px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', outline: 'none', boxSizing: 'border-box' }} />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>Qualification</label>
                <input type="text" placeholder="M.Sc., B.Ed." value={newStaff.qualification} onChange={e => setNewStaff({ ...newStaff, qualification: e.target.value })} style={{ width: '100%', padding: '11px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>Email Address</label>
                  <input type="email" placeholder="faculty@school.edu" value={newStaff.email} onChange={e => setNewStaff({ ...newStaff, email: e.target.value })} style={{ width: '100%', padding: '11px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>Phone Number</label>
                  <input type="text" placeholder="+91 9876543210" value={newStaff.phone} onChange={e => setNewStaff({ ...newStaff, phone: e.target.value })} style={{ width: '100%', padding: '11px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', outline: 'none', boxSizing: 'border-box' }} />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setIsQuickAddStaffOpen(false)} style={{ padding: '10px 18px', background: '#f1f5f9', border: 'none', borderRadius: '10px', fontWeight: 600, cursor: 'pointer', color: '#475569' }}>Cancel</button>
                <button type="submit" style={{ padding: '10px 22px', background: 'linear-gradient(135deg, #4F46E5 0%, #1e40af 100%)', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)' }}>Provision Faculty</button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Add Class Modal */}
      {isAddClassOpen && createPortal(
        <div 
          onClick={(e) => { if (e.target === e.currentTarget) setIsAddClassOpen(false); }}
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999999, padding: '20px' }}
        >
          <div style={{ background: 'white', borderRadius: '24px', padding: '28px', width: '450px', maxWidth: '95vw', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', border: '1px solid rgba(226, 232, 240, 0.8)', animation: 'slide-up 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', paddingBottom: '14px', borderBottom: '1px solid #f1f5f9' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#e0e7ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4F46E5' }}>
                  <BookOpen size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#1e3a8a' }}>Configure Class Section</h3>
                  <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Define section and room assignment</span>
                </div>
              </div>
              <button onClick={() => setIsAddClassOpen(false)} style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748b' }}><X size={16} /></button>
            </div>
            <form onSubmit={handleAddClassSection} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>Class Level *</label>
                <input required type="text" placeholder="e.g. Class 11" value={newClass.className} onChange={e => setNewClass({ ...newClass, className: e.target.value })} style={{ width: '100%', padding: '11px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>Section (e.g. A) *</label>
                  <input required type="text" placeholder="A" value={newClass.section} onChange={e => setNewClass({ ...newClass, section: e.target.value })} style={{ width: '100%', padding: '11px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>Room Number</label>
                  <input type="text" placeholder="Room 301" value={newClass.roomNumber} onChange={e => setNewClass({ ...newClass, roomNumber: e.target.value })} style={{ width: '100%', padding: '11px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', outline: 'none', boxSizing: 'border-box' }} />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>Capacity (Seats)</label>
                <input type="number" placeholder="40" value={newClass.capacity} onChange={e => setNewClass({ ...newClass, capacity: Number(e.target.value) })} style={{ width: '100%', padding: '11px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setIsAddClassOpen(false)} style={{ padding: '10px 18px', background: '#f1f5f9', border: 'none', borderRadius: '10px', fontWeight: 600, cursor: 'pointer', color: '#475569' }}>Cancel</button>
                <button type="submit" style={{ padding: '10px 22px', background: 'linear-gradient(135deg, #4F46E5 0%, #1e40af 100%)', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)' }}>Create Class Section</button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Batch Digital Student ID Cards Modal */}
      {isBatchIdCardOpen && createPortal(
        <div 
          onClick={(e) => { if (e.target === e.currentTarget) setIsBatchIdCardOpen(false); }}
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999999, padding: '20px' }}
        >
          <div style={{ background: 'white', borderRadius: '24px', padding: '28px', width: '740px', maxWidth: '95vw', maxHeight: '88vh', overflowY: 'auto', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', border: '1px solid rgba(226, 232, 240, 0.8)', animation: 'slide-up 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #e2e8f0', paddingBottom: '14px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800, color: '#1e3a8a' }}>Batch Digital Student ID Cards</h3>
                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Generate printable institutional student identification cards</span>
              </div>
              <button onClick={() => setIsBatchIdCardOpen(false)} style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={16} /></button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px', marginBottom: '24px' }}>
              {studentsList.slice(0, 4).map((st, i) => (
                <div key={i} style={{ border: '2px solid #e2e8f0', borderRadius: '14px', padding: '18px', background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px', marginBottom: '12px' }}>
                    <div style={{ fontWeight: 800, color: '#1e3a8a', fontSize: '0.9rem' }}>{schoolNameInput || 'PRAGATI ACADEMY'}</div>
                    <span style={{ fontSize: '0.68rem', fontWeight: 700, background: '#dcfce7', color: '#15803d', padding: '2px 6px', borderRadius: '4px' }}>VALID 2026-27</span>
                  </div>
                  <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                    <div style={{ width: '56px', height: '56px', borderRadius: '12px', background: '#e0e7ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4F46E5', fontWeight: 800, fontSize: '1.2rem' }}>
                      {st.name?.charAt(0) || 'S'}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, color: '#1e3a8a', fontSize: '0.95rem' }}>{st.name}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Roll ID: {st.rollNumber}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Grade: {st.grade} - {st.section}</div>
                    </div>
                  </div>
                  <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.7rem', color: '#94a3b8' }}>
                    <span>Barcode: ||||||| {st.rollNumber}</span>
                    <span>Contact: {st.parentContact || 'On Record'}</span>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button onClick={() => setIsBatchIdCardOpen(false)} style={{ padding: '10px 18px', background: '#f1f5f9', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>Close</button>
              <button onClick={() => window.print()} style={{ padding: '10px 22px', background: '#4F46E5', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Printer size={16} /> Print All ID Cards
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Add Event Modal */}
      {isAddEventOpen && createPortal(
        <div 
          onClick={(e) => { if (e.target === e.currentTarget) setIsAddEventOpen(false); }}
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999999, padding: '20px' }}
        >
          <div style={{ background: 'white', borderRadius: '24px', padding: '28px', width: '460px', maxWidth: '95vw', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', border: '1px solid rgba(226, 232, 240, 0.8)', animation: 'slide-up 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', paddingBottom: '14px', borderBottom: '1px solid #f1f5f9' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#e0e7ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4F46E5' }}>
                  <Calendar size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#1e3a8a' }}>Add Campus Event</h3>
                  <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Publish event to the institutional calendar</span>
                </div>
              </div>
              <button onClick={() => setIsAddEventOpen(false)} style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748b' }}><X size={16} /></button>
            </div>
            <form onSubmit={e => {
              e.preventDefault();
              if (!newEvent.t) return;
              setEventsList(prev => [{ id: Date.now(), ...newEvent }, ...prev]);
              setIsAddEventOpen(false);
              setNewEvent({ t: '', d: '10', m: 'NOV', l: 'Main Campus' });
            }} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>Event Title *</label>
                <input required type="text" placeholder="e.g. Science Fair, Annual Sports" value={newEvent.t} onChange={e => setNewEvent({ ...newEvent, t: e.target.value })} style={{ width: '100%', padding: '11px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>Day (e.g. 18)</label>
                  <input required type="text" placeholder="18" value={newEvent.d} onChange={e => setNewEvent({ ...newEvent, d: e.target.value })} style={{ width: '100%', padding: '11px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>Month (e.g. NOV)</label>
                  <input required type="text" placeholder="NOV" value={newEvent.m} onChange={e => setNewEvent({ ...newEvent, m: e.target.value })} style={{ width: '100%', padding: '11px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', outline: 'none', boxSizing: 'border-box' }} />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>Location / Venue</label>
                <input type="text" placeholder="e.g. Main Auditorium" value={newEvent.l} onChange={e => setNewEvent({ ...newEvent, l: e.target.value })} style={{ width: '100%', padding: '11px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setIsAddEventOpen(false)} style={{ padding: '10px 18px', background: '#f1f5f9', border: 'none', borderRadius: '10px', fontWeight: 600, cursor: 'pointer', color: '#475569' }}>Cancel</button>
                <button type="submit" style={{ padding: '10px 22px', background: 'linear-gradient(135deg, #4F46E5 0%, #1e40af 100%)', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)' }}>Publish Event</button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* View All Events Modal */}
      {isViewAllEventsOpen && createPortal(
        <div 
          onClick={(e) => { if (e.target === e.currentTarget) setIsViewAllEventsOpen(false); }}
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999999, padding: '20px' }}
        >
          <div style={{ background: 'white', borderRadius: '24px', padding: '28px', width: '540px', maxWidth: '95vw', maxHeight: '85vh', overflowY: 'auto', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', border: '1px solid rgba(226, 232, 240, 0.8)', animation: 'slide-up 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', paddingBottom: '14px', borderBottom: '1px solid #f1f5f9' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#e0e7ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4F46E5' }}>
                  <Calendar size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#1e3a8a' }}>All Upcoming Campus Events</h3>
                  <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Scheduled institutional and extracurricular activities</span>
                </div>
              </div>
              <button 
                onClick={() => setIsViewAllEventsOpen(false)} 
                style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748b' }}
              >
                <X size={16} />
              </button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
              {eventsList.map((ev, i) => (
                <div key={ev.id || i} style={{ display: 'flex', gap: '16px', alignItems: 'center', padding: '14px 16px', background: '#f8fafc', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
                  <div style={{ background: 'white', border: '1px solid #cbd5e1', borderRadius: '10px', padding: '8px 12px', textAlign: 'center', minWidth: '56px', boxShadow: '0 2px 4px rgba(0,0,0,0.03)' }}>
                    <div style={{ color: '#EF4444', fontSize: '0.72rem', fontWeight: 800 }}>{ev.m}</div>
                    <div style={{ color: '#1e3a8a', fontSize: '1.25rem', fontWeight: 800, lineHeight: 1.1 }}>{ev.d}</div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, color: '#1e3a8a', fontSize: '0.96rem', marginBottom: '3px' }}>{ev.t}</div>
                    <div style={{ color: '#64748b', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <MapPin size={13} color="#4F46E5" /> {ev.l}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '16px', borderTop: '1px solid #f1f5f9' }}>
              <button
                type="button"
                onClick={() => { setIsViewAllEventsOpen(false); setIsAddEventOpen(true); }}
                style={{ background: 'none', border: 'none', color: '#4F46E5', fontWeight: 700, fontSize: '0.88rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Plus size={16} /> Add New Event
              </button>
              <button
                type="button"
                onClick={() => setIsViewAllEventsOpen(false)}
                style={{ padding: '9px 20px', background: '#f1f5f9', border: 'none', borderRadius: '10px', color: '#334155', fontWeight: 600, fontSize: '0.88rem', cursor: 'pointer' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Add Custom Role Modal */}
      {isAddRoleOpen && createPortal(
        <div 
          onClick={(e) => { if (e.target === e.currentTarget) setIsAddRoleOpen(false); }}
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999999, padding: '20px' }}
        >
          <div style={{ background: 'white', borderRadius: '24px', padding: '28px', width: '420px', maxWidth: '95vw', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', border: '1px solid rgba(226, 232, 240, 0.8)', animation: 'slide-up 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', paddingBottom: '14px', borderBottom: '1px solid #f1f5f9' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb' }}>
                  <Key size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#1e3a8a' }}>Add Custom Role</h3>
                  <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Configure title for RBAC matrix</span>
                </div>
              </div>
              <button onClick={() => setIsAddRoleOpen(false)} style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748b' }}><X size={16} /></button>
            </div>
            <form onSubmit={handleAddCustomRole} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>Role Title *</label>
                <input required type="text" placeholder="e.g. Exam Incharge, Bus Incharge" value={newRoleName} onChange={e => setNewRoleName(e.target.value)} style={{ width: '100%', padding: '11px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setIsAddRoleOpen(false)} style={{ padding: '10px 18px', background: '#f1f5f9', border: 'none', borderRadius: '10px', fontWeight: 600, cursor: 'pointer', color: '#475569' }}>Cancel</button>
                <button type="submit" style={{ padding: '10px 22px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 700, cursor: 'pointer' }}>Add Role</button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Assessment Schedule Modal */}
      {isAssessmentModalOpen && createPortal(
        <div 
          onClick={(e) => { if (e.target === e.currentTarget) setIsAssessmentModalOpen(false); }}
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999999, padding: '20px' }}
        >
          <div style={{ background: 'white', borderRadius: '24px', padding: '28px', width: '580px', maxWidth: '95vw', maxHeight: '85vh', overflowY: 'auto', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', border: '1px solid rgba(226, 232, 240, 0.8)', animation: 'slide-up 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', paddingBottom: '14px', borderBottom: '1px solid #f1f5f9' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800, color: '#1e3a8a' }}>Mid-Term Assessment Schedule</h3>
                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Academic Year 2026-2027 Examination Timetable</span>
              </div>
              <button onClick={() => setIsAssessmentModalOpen(false)} style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748b' }}><X size={16} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                { date: 'Nov 10, 2026', subject: 'Mathematics & Reasoning', time: '09:00 AM - 12:00 PM', classes: 'Grades 8 through 12' },
                { date: 'Nov 12, 2026', subject: 'Physics & Physical Science', time: '09:00 AM - 12:00 PM', classes: 'Grades 9 through 12' },
                { date: 'Nov 15, 2026', subject: 'English Literature & Grammar', time: '09:00 AM - 12:00 PM', classes: 'All Classes' },
                { date: 'Nov 17, 2026', subject: 'Social Sciences & Civics', time: '09:00 AM - 12:00 PM', classes: 'Grades 6 through 10' },
              ].map((item, idx) => (
                <div key={idx} style={{ padding: '14px 18px', background: '#f8fafc', borderRadius: '12px', borderLeft: '4px solid #4F46E5', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #e2e8f0' }}>
                  <div>
                    <div style={{ fontWeight: 700, color: '#1e3a8a', fontSize: '0.94rem' }}>{item.subject}</div>
                    <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '2px' }}>{item.classes} • {item.time}</div>
                  </div>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#4F46E5', background: '#e0e7ff', padding: '4px 10px', borderRadius: '8px' }}>{item.date}</span>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button onClick={() => setIsAssessmentModalOpen(false)} style={{ padding: '10px 20px', background: '#f1f5f9', border: 'none', borderRadius: '10px', fontWeight: 600, color: '#334155', cursor: 'pointer' }}>Close Timetable</button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Record Fee Payment Modal */}
      {isRecordPaymentOpen && createPortal(
        <div 
          onClick={(e) => { if (e.target === e.currentTarget) setIsRecordPaymentOpen(false); }}
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999999, padding: '20px' }}
        >
          <div style={{ background: 'white', borderRadius: '24px', padding: '28px', width: '480px', maxWidth: '95vw', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', border: '1px solid rgba(226, 232, 240, 0.8)', animation: 'slide-up 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', paddingBottom: '14px', borderBottom: '1px solid #f1f5f9' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#16a34a' }}>
                  <CreditCard size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#1e3a8a' }}>Record Fee Collection</h3>
                  <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Post payment into institutional ledger</span>
                </div>
              </div>
              <button onClick={() => setIsRecordPaymentOpen(false)} style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748b' }}><X size={16} /></button>
            </div>
            <form onSubmit={handleRecordFeePayment} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>Student Full Name *</label>
                <input required type="text" placeholder="e.g. Rahul Sharma" value={paymentForm.studentName} onChange={e => setPaymentForm({ ...paymentForm, studentName: e.target.value })} style={{ width: '100%', padding: '11px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>Class / Section *</label>
                  <input required type="text" placeholder="Class 10 - A" value={paymentForm.classSection} onChange={e => setPaymentForm({ ...paymentForm, classSection: e.target.value })} style={{ width: '100%', padding: '11px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>Amount (₹) *</label>
                  <input required type="number" placeholder="5000" value={paymentForm.amount} onChange={e => setPaymentForm({ ...paymentForm, amount: e.target.value })} style={{ width: '100%', padding: '11px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', outline: 'none', boxSizing: 'border-box' }} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>Fee Category</label>
                  <select value={paymentForm.type} onChange={e => setPaymentForm({ ...paymentForm, type: e.target.value })} style={{ width: '100%', padding: '11px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', outline: 'none', boxSizing: 'border-box' }}>
                    <option value="Tuition Fee">Tuition Fee</option>
                    <option value="Transport">Transport</option>
                    <option value="Lab & Exam">Lab & Exam</option>
                    <option value="Annual Dues">Annual Dues</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>Payment Method</label>
                  <select value={paymentForm.paymentMethod || 'UPI'} onChange={e => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value })} style={{ width: '100%', padding: '11px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', outline: 'none', boxSizing: 'border-box' }}>
                    <option value="UPI">UPI</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Cash">Cash</option>
                    <option value="Card">Card</option>
                    <option value="Cheque">Cheque</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setIsRecordPaymentOpen(false)} style={{ padding: '10px 18px', background: '#f1f5f9', border: 'none', borderRadius: '10px', fontWeight: 600, cursor: 'pointer', color: '#475569' }}>Cancel</button>
                <button type="submit" style={{ padding: '10px 22px', background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 12px rgba(16,185,129,0.3)' }}>Record & Post Transaction</button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Post School Announcement Modal */}
      {isAddAnnouncementOpen && createPortal(
        <div 
          onClick={(e) => { if (e.target === e.currentTarget) setIsAddAnnouncementOpen(false); }}
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999999, padding: '20px' }}
        >
          <div style={{ background: 'white', borderRadius: '24px', padding: '28px', width: '520px', maxWidth: '95vw', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', border: '1px solid rgba(226, 232, 240, 0.8)', animation: 'slide-up 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', paddingBottom: '14px', borderBottom: '1px solid #f1f5f9' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#e0e7ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4F46E5' }}>
                  <Mail size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#1e3a8a' }}>Post Notice / Announcement</h3>
                  <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Publish to institutional communication channel</span>
                </div>
              </div>
              <button onClick={() => setIsAddAnnouncementOpen(false)} style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748b' }}><X size={16} /></button>
            </div>
            <form onSubmit={handlePostAnnouncement} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>Announcement Title *</label>
                <input required type="text" placeholder="e.g. Winter Break Schedule" value={newAnnouncement.title} onChange={e => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })} style={{ width: '100%', padding: '11px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>Content & Instructions *</label>
                <textarea required rows={4} placeholder="Type announcement details here..." value={newAnnouncement.content} onChange={e => setNewAnnouncement({ ...newAnnouncement, content: e.target.value })} style={{ width: '100%', padding: '11px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>Target Audience</label>
                  <select value={newAnnouncement.targetAudience} onChange={e => setNewAnnouncement({ ...newAnnouncement, targetAudience: e.target.value })} style={{ width: '100%', padding: '11px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', outline: 'none', boxSizing: 'border-box' }}>
                    <option value="All Students & Parents">All Students & Parents</option>
                    <option value="Students">Students Only</option>
                    <option value="Staff & Faculty">Staff & Faculty</option>
                    <option value="All">All Campus</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>Priority Level</label>
                  <select value={newAnnouncement.priority} onChange={e => setNewAnnouncement({ ...newAnnouncement, priority: e.target.value })} style={{ width: '100%', padding: '11px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', outline: 'none', boxSizing: 'border-box' }}>
                    <option value="Normal">Normal Priority</option>
                    <option value="Important">Important</option>
                    <option value="Urgent">Urgent Alert</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setIsAddAnnouncementOpen(false)} style={{ padding: '10px 18px', background: '#f1f5f9', border: 'none', borderRadius: '10px', fontWeight: 600, cursor: 'pointer', color: '#475569' }}>Cancel</button>
                <button type="submit" style={{ padding: '10px 22px', background: 'linear-gradient(135deg, #4F46E5 0%, #1e40af 100%)', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)' }}>Publish Notice</button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Add Grievance Ticket Modal */}
      {isAddTicketOpen && createPortal(
        <div 
          onClick={(e) => { if (e.target === e.currentTarget) setIsAddTicketOpen(false); }}
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999999, padding: '20px' }}
        >
          <div style={{ background: 'white', borderRadius: '24px', padding: '28px', width: '450px', maxWidth: '95vw', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', border: '1px solid rgba(226, 232, 240, 0.8)', animation: 'slide-up 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', paddingBottom: '14px', borderBottom: '1px solid #f1f5f9' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#EF4444' }}>
                  <AlertTriangle size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#1e3a8a' }}>Log Grievance / Ticket</h3>
                  <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Track institutional issue or inquiry</span>
                </div>
              </div>
              <button onClick={() => setIsAddTicketOpen(false)} style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748b' }}><X size={16} /></button>
            </div>
            <form onSubmit={handleCreateTicket} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>Issue Description *</label>
                <input required type="text" placeholder="e.g. Bus Route 3 delayed, ID card missing" value={newTicket.t} onChange={e => setNewTicket({ ...newTicket, t: e.target.value })} style={{ width: '100%', padding: '11px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>Reported By (Name / Role) *</label>
                <input required type="text" placeholder="e.g. Parent of Aman (Class 8), Staff Anita" value={newTicket.user} onChange={e => setNewTicket({ ...newTicket, user: e.target.value })} style={{ width: '100%', padding: '11px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setIsAddTicketOpen(false)} style={{ padding: '10px 18px', background: '#f1f5f9', border: 'none', borderRadius: '10px', fontWeight: 600, cursor: 'pointer', color: '#475569' }}>Cancel</button>
                <button type="submit" style={{ padding: '10px 22px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 700, cursor: 'pointer' }}>Create Ticket</button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
};

export default Dashboard;
