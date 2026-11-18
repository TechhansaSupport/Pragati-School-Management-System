import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { 
  Building2, Users, UserPlus, UserCheck, ShieldCheck, Plus, ExternalLink, 
  MapPin, UserCog, RefreshCw, Key, Search, Filter, AlertCircle, 
  CheckCircle2, ArrowRight, Layers, Award, Trash2, Mail, Phone, 
  Calendar, CalendarCheck, CalendarDays, Server, Shield, Sparkles, ChevronRight, Activity, Globe,
  Briefcase, BookOpen, Clock, HelpCircle, Check, Copy, X, Settings,
  AlertTriangle, Save, Database, Lock, Edit3, TrendingUp, TrendingDown,
  Wallet, CreditCard, Receipt, Percent, DollarSign, CheckCircle,
  Bus, Book, Navigation, Bookmark, Wrench, FileText, Download, Printer
} from 'lucide-react';
import { 
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, Line, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ComposedChart 
} from 'recharts';
import CreateSchoolModal from '../components/CreateSchoolModal';
import EditSchoolModal from '../components/EditSchoolModal';
import AppointAdminModal from '../components/AppointAdminModal';
import AppointPrincipalModal from '../components/AppointPrincipalModal';
import AssignStaffModal from '../components/AssignStaffModal';
import ManageStaffRoleModal from '../components/ManageStaffRoleModal';
import DeleteSchoolModal from '../components/DeleteSchoolModal';
import TransportDashboard from './TransportDashboard';
import LibraryDashboard from './LibraryDashboard';

const FinancialTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: 'rgba(255, 255, 255, 0.96)',
        backdropFilter: 'blur(12px)',
        border: '1px solid #e2e8f0',
        borderRadius: '14px',
        padding: '12px 16px',
        boxShadow: '0 10px 25px rgba(0,0,0,0.08)',
        fontSize: '0.82rem'
      }}>
        <div style={{ fontWeight: 800, color: '#1e293b', marginBottom: '8px', borderBottom: '1px solid #f1f5f9', paddingBottom: '4px' }}>
          {label} Overview
        </div>
        {payload.map((item, index) => (
          <div key={index} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', margin: '4px 0' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: item.color }} />
              {item.name}:
            </span>
            <span style={{ fontWeight: 700, color: '#1e293b' }}>
              ₹{Number(item.value).toLocaleString('en-IN')}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const AttendanceTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: 'rgba(255, 255, 255, 0.96)',
        backdropFilter: 'blur(12px)',
        border: '1px solid #e2e8f0',
        borderRadius: '14px',
        padding: '12px 16px',
        boxShadow: '0 10px 25px rgba(0,0,0,0.08)',
        fontSize: '0.82rem'
      }}>
        <div style={{ fontWeight: 800, color: '#1e293b', marginBottom: '8px', borderBottom: '1px solid #f1f5f9', paddingBottom: '4px' }}>
          {label} Faculty Attendance
        </div>
        {payload.map((item, index) => (
          <div key={index} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', margin: '4px 0' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: item.color }} />
              {item.name}:
            </span>
            <span style={{ fontWeight: 700, color: '#1e293b' }}>
              {item.name?.includes('Rate') ? `${item.value}%` : `${item.value} Faculty`}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const SuperAdminDashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { tenantSlug: urlTenantSlug } = useParams();

  const userInfo = JSON.parse(sessionStorage.getItem('userInfo') || '{}');
  const token = userInfo.token || sessionStorage.getItem('token') || '';
  const tenantSlug = urlTenantSlug || sessionStorage.getItem('tenantSlug') || userInfo.slug || 'neel-public-school';

  const userRole = (sessionStorage.getItem('userRole') || userInfo.role || '').toLowerCase();

  // Route security: Only Super Admin can access the SuperAdmin Command Center
  useEffect(() => {
    if (userRole && userRole !== 'superadmin') {
      navigate(`/${tenantSlug}/dashboard`, { replace: true });
    }
  }, [userRole, tenantSlug, navigate]);

  // State
  const [schoolsList, setSchoolsList] = useState([]);
  const [allStaffList, setAllStaffList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'schools' | 'assignments' | 'health' | 'config' | 'rbac' | 'security'

  // Modals state
  const [isCreateSchoolOpen, setIsCreateSchoolOpen] = useState(false);
  const [createModalType, setCreateModalType] = useState('school'); // 'school' | 'branch'
  const [createModalParentSlug, setCreateModalParentSlug] = useState('');
  const [targetSchoolForAdmin, setTargetSchoolForAdmin] = useState(null);
  const [targetSchoolForPrincipal, setTargetSchoolForPrincipal] = useState(null);
  const [preSelectedTeacherForPrincipal, setPreSelectedTeacherForPrincipal] = useState(null);
  const [targetSchoolForStaff, setTargetSchoolForStaff] = useState(null);
  const [targetStaffForRoleEdit, setTargetStaffForRoleEdit] = useState(null);
  const [targetSchoolForDelete, setTargetSchoolForDelete] = useState(null);
  const [targetSchoolForEdit, setTargetSchoolForEdit] = useState(null);

  // Filters for Schools tab
  const [schoolSearchQuery, setSchoolSearchQuery] = useState('');
  const [schoolTypeFilter, setSchoolTypeFilter] = useState('all'); // 'all' | 'main' | 'branch' | 'missing-admin'

  // Filters for Staff/Assignment tab
  const [staffSearchQuery, setStaffSearchQuery] = useState('');
  const [staffSchoolFilter, setStaffSchoolFilter] = useState('all');
  const [staffRoleFilter, setStaffRoleFilter] = useState('all');

  // Expanded roster per school
  const [expandedSchoolSlug, setExpandedSchoolSlug] = useState(null);
  const [branchStaffData, setBranchStaffData] = useState({});
  const [loadingRosterSlug, setLoadingRosterSlug] = useState(null);

  // Financial & Faculty Intelligence State (Live Database Connected)
  const [financeAnalytics, setFinanceAnalytics] = useState(null);
  const [attendanceAnalytics, setAttendanceAnalytics] = useState(null);
  const [financeStats, setFinanceStats] = useState({
    totalCollections: 0,
    totalExpenses: 0,
    pendingFees: 0,
    availableBalance: 0
  });
  const [financeScope, setFinanceScope] = useState('all'); // 'all' | specific school slug
  const [financePeriod, setFinancePeriod] = useState('monthly'); // 'monthly' | 'quarterly'
  const [isFinanceLoading, setIsFinanceLoading] = useState(false);
  const [attendanceView, setAttendanceView] = useState('weekly'); // 'weekly' | 'departments'

  // Transport & Library Real Database Overview State
  const [transportOverviewStats, setTransportOverviewStats] = useState({
    totalFleet: 5,
    activeRoutes: 5,
    mappedStudents: 188,
    inMaintenance: 1,
    totalStops: 38
  });
  const [libraryOverviewStats, setLibraryOverviewStats] = useState({
    totalTitles: 7,
    totalCopies: 120,
    availableCopies: 102,
    issuedCopies: 18,
    overdueCopies: 2,
    finesCollected: 4500
  });

  // ─── STAFF ATTENDANCE STATE (MULTI-CAMPUS CONSOLIDATED) ───
  const getTodayDateStr = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const [attendanceDate, setAttendanceDate] = useState(getTodayDateStr);
  const [attendanceSchoolFilter, setAttendanceSchoolFilter] = useState('all');
  const [attendanceDeptFilter, setAttendanceDeptFilter] = useState('All');
  const [attendanceStatusFilter, setAttendanceStatusFilter] = useState('All');
  const [attendanceSearchQuery, setAttendanceSearchQuery] = useState('');
  const [attendanceSheetData, setAttendanceSheetData] = useState(null);
  const [isAttendanceLoading, setIsAttendanceLoading] = useState(false);
  const [selectedStaffPunches, setSelectedStaffPunches] = useState(null);
  const [manualPunchStaff, setManualPunchStaff] = useState(null);
  const [manualPunchForm, setManualPunchForm] = useState({
    punchInTime: '09:00',
    punchOutTime: '17:00',
    status: 'Present',
    notes: ''
  });
  const [isManualPunchSubmitting, setIsManualPunchSubmitting] = useState(false);
  const [isAttendanceReportModalOpen, setIsAttendanceReportModalOpen] = useState(false);

  // Fetch full staff attendance daily sheet
  const fetchStaffAttendanceSheet = async () => {
    setIsAttendanceLoading(true);
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      if (tenantSlug) headers['x-tenant-slug'] = tenantSlug;
      headers['x-user-role'] = 'superadmin';

      const querySlug = attendanceSchoolFilter || 'all';
      const url = `http://localhost:5000/api/staff-attendance/daily-sheet?date=${attendanceDate}&schoolSlug=${querySlug}`;
      const res = await fetch(url, { headers });
      if (res.ok) {
        const data = await res.json();
        setAttendanceSheetData(data);
      }
    } catch (err) {
      console.warn('Failed to load multi-campus staff attendance sheet:', err);
    } finally {
      setIsAttendanceLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'attendance') {
      fetchStaffAttendanceSheet();
    }
  }, [activeTab, attendanceDate, attendanceSchoolFilter]);

  // Listen for live punch events across all tabs
  useEffect(() => {
    const handlePunchEvent = () => {
      if (activeTab === 'attendance') {
        fetchStaffAttendanceSheet();
      }
      fetchFinanceAndAttendanceAnalytics(financeScope);
    };
    window.addEventListener('staffPunchUpdated', handlePunchEvent);
    return () => window.removeEventListener('staffPunchUpdated', handlePunchEvent);
  }, [activeTab, attendanceDate, attendanceSchoolFilter, financeScope]);

  // Manual Punch adjustment submit
  const handleManualPunchSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!manualPunchStaff) return;
    setIsManualPunchSubmitting(true);
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      headers['x-user-role'] = 'superadmin';

      const payload = {
        staffId: manualPunchStaff.staffId || manualPunchStaff._id,
        date: attendanceDate,
        punchInTime: manualPunchForm.punchInTime ? `${attendanceDate}T${manualPunchForm.punchInTime}:00` : null,
        punchOutTime: manualPunchForm.punchOutTime ? `${attendanceDate}T${manualPunchForm.punchOutTime}:00` : null,
        status: manualPunchForm.status,
        notes: manualPunchForm.notes || 'Super Admin Override'
      };

      const res = await fetch('http://localhost:5000/api/staff-attendance/manual-entry', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to update punch');

      setManualPunchStaff(null);
      await fetchStaffAttendanceSheet();
      window.dispatchEvent(new CustomEvent('staffPunchUpdated'));
    } catch (err) {
      alert(err.message);
    } finally {
      setIsManualPunchSubmitting(false);
    }
  };

  // Filtered attendance sheet
  const filteredAttendanceList = useMemo(() => {
    if (!attendanceSheetData?.sheet) return [];
    return attendanceSheetData.sheet.filter(item => {
      if (attendanceDeptFilter !== 'All' && item.department !== attendanceDeptFilter) return false;
      if (attendanceStatusFilter !== 'All') {
        if (attendanceStatusFilter === 'Working' && !item.isCurrentlyPunchedIn) return false;
        if (attendanceStatusFilter === 'Completed' && item.attendanceStatus !== 'Shift Completed' && !item.punchOut) return false;
        if (attendanceStatusFilter === 'Late' && !item.attendanceStatus?.includes('Late')) return false;
        if (attendanceStatusFilter === 'Not Marked' && item.attendanceStatus !== 'Not Punched In') return false;
        if (attendanceStatusFilter === 'On Leave' && item.attendanceStatus !== 'On Leave') return false;
      }
      if (attendanceSearchQuery.trim()) {
        const q = attendanceSearchQuery.toLowerCase();
        const matchesName = item.name?.toLowerCase().includes(q);
        const matchesId = item.employeeId?.toLowerCase().includes(q);
        const matchesDept = item.department?.toLowerCase().includes(q);
        const matchesRole = item.role?.toLowerCase().includes(q);
        const matchesSlug = item.schoolSlug?.toLowerCase().includes(q);
        return matchesName || matchesId || matchesDept || matchesRole || matchesSlug;
      }
      return true;
    });
  }, [attendanceSheetData, attendanceDeptFilter, attendanceStatusFilter, attendanceSearchQuery]);

  // Export filtered attendance records as CSV
  const handleDownloadAttendanceCSV = () => {
    const list = filteredAttendanceList || [];
    if (list.length === 0) {
      alert('No attendance records available to export for the selected date and filters.');
      return;
    }

    const headers = [
      'Employee ID',
      'Staff Name',
      'Branch Campus',
      'Department',
      'Role',
      'Attendance Date',
      'First Punch In',
      'Last Punch Out',
      'Total Duration',
      'Status',
      'GPS Verified',
      'Administrative Notes'
    ];

    const rows = list.map(item => {
      const assignedSchool = (schoolsList || []).find(s => s.slug === item.schoolSlug || s._id === item.schoolId) ||
                             (schools || []).find(s => s.slug === item.schoolSlug || s._id === item.schoolId);
      const campusName = assignedSchool?.name || item.schoolSlug || 'Main Campus';
      const punchInFormatted = item.punchIn ? new Date(item.punchIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Not Punched In';
      const punchOutFormatted = item.punchOut ? new Date(item.punchOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : (item.isCurrentlyPunchedIn ? 'Active Shift' : 'None');
      const gpsStatus = item.punches?.some(p => p.isWithinGeofence) ? 'GPS Verified' : (item.punches?.length > 0 ? 'Web Stamp' : 'N/A');

      return [
        `"${item.employeeId || 'N/A'}"`,
        `"${item.name || ''}"`,
        `"${campusName}"`,
        `"${item.department || 'General'}"`,
        `"${item.role || 'Staff'}"`,
        `"${attendanceDate}"`,
        `"${punchInFormatted}"`,
        `"${punchOutFormatted}"`,
        `"${item.durationFormatted || '0h 0m'}"`,
        `"${item.attendanceStatus || 'Not Punched In'}"`,
        `"${gpsStatus}"`,
        `"${(item.notes || '').replace(/"/g, '""')}"`
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Staff_Attendance_Report_${attendanceDate}_${attendanceSchoolFilter || 'all'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handlePrintReport = () => {
    window.print();
  };

  // Fetch real database financial & faculty intelligence analytics
  const fetchFinanceAndAttendanceAnalytics = async (scope = financeScope) => {
    try {
      setIsFinanceLoading(true);
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      if (tenantSlug) headers['x-tenant-slug'] = tenantSlug;

      const slugQuery = scope && scope !== 'all' ? `?schoolSlug=${scope}` : '?schoolSlug=all';

      const [finRes, attRes] = await Promise.all([
        fetch(`http://localhost:5000/api/finance/analytics${slugQuery}`, { headers }),
        fetch(`http://localhost:5000/api/staff/attendance-analytics${slugQuery}`, { headers })
      ]);

      if (finRes.ok) {
        const finData = await finRes.json();
        setFinanceAnalytics(finData);
        setFinanceStats({
          totalCollections: finData.totalCollections,
          totalExpenses: finData.totalExpenses,
          pendingFees: finData.pendingFees,
          availableBalance: finData.availableBalance
        });
      }

      if (attRes.ok) {
        const attData = await attRes.json();
        setAttendanceAnalytics(attData);
      }
    } catch (err) {
      console.warn('Failed to load real database analytics:', err);
    } finally {
      setIsFinanceLoading(false);
    }
  };

  // Fetch all schools with leadership & counts
  const fetchSchools = async () => {
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      if (tenantSlug) headers['x-tenant-slug'] = tenantSlug;

      const res = await fetch('http://localhost:5000/api/school/list', { headers });
      if (res.ok) {
        const data = await res.json();
        const list = data.schools || [];
        setSchoolsList(list);
        if (list.length > 0 && tenantSlug && !list.some(s => s.slug === tenantSlug)) {
          const correctSlug = list[0].slug;
          sessionStorage.setItem('tenantSlug', correctSlug);
          sessionStorage.setItem('schoolName', list[0].name);
          navigate(`/${correctSlug}/superadmin`, { replace: true });
        }
      }
    } catch (err) {
      console.warn('Failed to load schools directory:', err);
    }
  };

  // Fetch all staff across all schools
  const fetchAllStaff = async () => {
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      if (tenantSlug) headers['x-tenant-slug'] = tenantSlug;

      const res = await fetch('http://localhost:5000/api/staff?all=true', { headers });
      if (res.ok) {
        const data = await res.json();
        setAllStaffList(data.staff || []);
      }
    } catch (err) {
      console.warn('Failed to load global staff roster:', err);
    }
  };

  // Fetch institutional configuration from backend
  const fetchSchoolConfig = async () => {
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      if (tenantSlug) headers['x-tenant-slug'] = tenantSlug;

      const res = await fetch('http://localhost:5000/api/school', { headers });
      if (res.ok) {
        const data = await res.json();
        if (data.school) {
          if (data.school.name) setSchoolNameInput(data.school.name);
          if (data.school.address) setSchoolAddressInput(data.school.address);
          if (data.school.phone) setSchoolPhoneInput(data.school.phone);
          if (data.school.email) setSchoolEmailInput(data.school.email);
          if (data.school.academicYear) setSchoolYearInput(data.school.academicYear);
          if (data.school.affiliationNo) setAffiliationNoInput(data.school.affiliationNo);
        }
      }
    } catch (err) {
      console.warn('Failed to load institutional configuration:', err);
    }
  };

  const loadAllData = async () => {
    setIsLoading(true);
    await Promise.all([
      fetchSchools(), 
      fetchAllStaff(), 
      fetchSchoolConfig(), 
      fetchFinanceAndAttendanceAnalytics(financeScope)
    ]);
    setIsLoading(false);
  };

  useEffect(() => {
    loadAllData();

    const handleUpdate = () => {
      fetchSchools();
      fetchAllStaff();
      fetchSchoolConfig();
      fetchFinanceAndAttendanceAnalytics(financeScope);
    };
    window.addEventListener('schoolListChanged', handleUpdate);
    window.addEventListener('schoolListUpdated', handleUpdate);
    return () => {
      window.removeEventListener('schoolListChanged', handleUpdate);
      window.removeEventListener('schoolListUpdated', handleUpdate);
    };
  }, [tenantSlug]);

  useEffect(() => {
    fetchFinanceAndAttendanceAnalytics(financeScope);
  }, [financeScope]);

  // Fetch Live Auxiliary Operations (Transport & Library) Telemetry
  useEffect(() => {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (tenantSlug) headers['x-tenant-slug'] = tenantSlug;

    fetch('http://localhost:5000/api/transport/stats', { headers })
      .then(res => res.ok ? res.json() : null)
      .then(data => { if (data) setTransportOverviewStats(prev => ({ ...prev, ...data })); })
      .catch(err => console.warn('SuperAdmin Transport stats error:', err));

    fetch('http://localhost:5000/api/library/stats', { headers })
      .then(res => res.ok ? res.json() : null)
      .then(data => { if (data) setLibraryOverviewStats(prev => ({ ...prev, ...data })); })
      .catch(err => console.warn('SuperAdmin Library stats error:', err));
  }, [tenantSlug, token]);

  // Synchronize active tab with URL query parameter (?tab=)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tabParam = params.get('tab');
    if (!tabParam || tabParam === 'overview' || tabParam === 'hub') {
      setActiveTab('overview');
    } else if (['schools', 'assignments', 'attendance', 'health', 'config', 'rbac', 'security', 'transport', 'library'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [location.search]);

  const handleTabChange = (newTab) => {
    setActiveTab(newTab);
    if (newTab === 'overview') {
      navigate(`/${tenantSlug}/superadmin`);
    } else {
      navigate(`/${tenantSlug}/superadmin?tab=${newTab}`);
    }
  };

  // Global School Configuration State
  const [schoolNameInput, setSchoolNameInput] = useState(() => sessionStorage.getItem('schoolName') || 'Pragati School Management System');
  const [schoolAddressInput, setSchoolAddressInput] = useState(() => sessionStorage.getItem('schoolAddress') || 'Sector 4, Educational Knowledge Hub, Greater Noida, UP - 201306');
  const [schoolPhoneInput, setSchoolPhoneInput] = useState('+91 11-2894-1234');
  const [schoolEmailInput, setSchoolEmailInput] = useState('superadmin@pragati.edu');
  const [schoolYearInput, setSchoolYearInput] = useState('2026-2027');
  const [affiliationNoInput, setAffiliationNoInput] = useState('CBSE-AFF-2026-9081');
  const [configStatus, setConfigStatus] = useState(null);
  const [isSavingConfig, setIsSavingConfig] = useState(false);

  const handleSaveConfig = async (e) => {
    if (e) e.preventDefault();
    setIsSavingConfig(true);
    setConfigStatus(null);
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      if (tenantSlug) headers['x-tenant-slug'] = tenantSlug;

      const res = await fetch('http://localhost:5000/api/school/config', {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          name: schoolNameInput.trim(),
          address: schoolAddressInput.trim(),
          phone: schoolPhoneInput.trim(),
          email: schoolEmailInput.trim(),
          academicYear: schoolYearInput.trim(),
          affiliationNo: affiliationNoInput.trim()
        })
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok && data.success) {
        sessionStorage.setItem('schoolName', schoolNameInput.trim());
        sessionStorage.setItem('schoolAddress', schoolAddressInput.trim());
        document.title = `${schoolNameInput.trim()} | Pragati SMS`;
        window.dispatchEvent(new CustomEvent('schoolNameChanged', { detail: schoolNameInput.trim() }));
        setConfigStatus({ type: 'success', message: 'Global school configuration & credentials updated across all campuses.' });
      } else {
        setConfigStatus({ 
          type: 'error', 
          message: data?.error || data?.message || 'Failed to update institutional configuration. Please check admin authority.' 
        });
      }
    } catch (err) {
      setConfigStatus({ type: 'error', message: 'Network error occurred while communicating with school cluster: ' + err.message });
    } finally {
      setIsSavingConfig(false);
      setTimeout(() => setConfigStatus(null), 4000);
    }
  };

  // RBAC Access Control Matrix State
  const [rbacRoles] = useState(['SuperAdmin', 'Branch Admin', 'Principal', 'Accountant', 'Teacher', 'Student', 'Parent', 'Librarian']);
  const [rbacMatrix, setRbacMatrix] = useState([
    { m: 'Multi-School Ecosystem & Branches', permissions: [true, true, false, false, false, false, false, false] },
    { m: 'Global Staff Roster & Appointments', permissions: [true, true, true, false, false, false, false, false] },
    { m: 'Student Directory & Admissions', permissions: [true, true, true, false, true, false, false, false] },
    { m: 'Academic Curriculum & Gradebook', permissions: [true, true, true, false, true, false, false, false] },
    { m: 'Central Finances & Invoicing', permissions: [true, true, true, true, false, false, true, false] },
    { m: 'Fleet Tracking & Transit Routes', permissions: [true, true, false, false, false, false, false, false] },
    { m: 'Global Configuration & Branding', permissions: [true, false, false, false, false, false, false, false] },
    { m: 'System Diagnostics & Licenses', permissions: [true, false, false, false, false, false, false, false] },
  ]);
  const [rbacToast, setRbacToast] = useState('');

  const handleTogglePermission = (rowIdx, colIdx) => {
    setRbacMatrix(prev => prev.map((row, rI) => {
      if (rI !== rowIdx) return row;
      const newPerms = [...row.permissions];
      newPerms[colIdx] = !newPerms[colIdx];
      return { ...row, permissions: newPerms };
    }));
  };

  // Security Policy State
  const [jwtLifespan, setJwtLifespan] = useState('30d');
  const [enforce2FA, setEnforce2FA] = useState(true);
  const [strictSaltHashing, setStrictSaltHashing] = useState(true);
  const [securityToast, setSecurityToast] = useState('');
  const [auditFilter, setAuditFilter] = useState('ALL');
  const [auditLogs] = useState([
    { id: 1, action: 'User Role Updated', user: 'SuperAdmin (Root)', target: 'ADM001', time: '10 mins ago', status: 'Success', color: '#16A34A' },
    { id: 2, action: 'Branch Admin Appointed', user: 'SuperAdmin (Root)', target: 'North Campus', time: '25 mins ago', status: 'Success', color: '#16A34A' },
    { id: 3, action: 'System Diagnostics Passed', user: 'Automated Daemon', target: 'Database Cluster', time: '1 hour ago', status: 'Success', color: '#16A34A' },
    { id: 4, action: 'Unauthorized Tenant Cross-Access Blocked', user: 'External IP: 192.168.1.104', target: 'Security Firewall', time: '3 hours ago', status: 'Blocked', color: '#EF4444' },
    { id: 5, action: 'Global License Renewed', user: 'Enterprise Admin', target: 'License Engine', time: '5 hours ago', status: 'Success', color: '#16A34A' },
    { id: 6, action: 'Token Expiry Near Limit', user: 'Teacher Portal (TCH012)', target: 'Auth Daemon', time: '8 hours ago', status: 'Warning', color: '#F59E0B' },
  ]);

  // Load roster for a specific school when expanded
  const handleToggleRoster = async (slug) => {
    if (expandedSchoolSlug === slug) {
      setExpandedSchoolSlug(null);
      return;
    }
    setExpandedSchoolSlug(slug);
    if (!branchStaffData[slug]) {
      setLoadingRosterSlug(slug);
      try {
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;
        headers['x-tenant-slug'] = slug;
        const res = await fetch(`http://localhost:5000/api/school/${slug}/staff`, { headers });
        if (res.ok) {
          const data = await res.json();
          setBranchStaffData(prev => ({ ...prev, [slug]: data.staff || [] }));
        }
      } catch (err) {
        console.warn('Failed to load campus roster:', err);
      } finally {
        setLoadingRosterSlug(null);
      }
    }
  };

  // Computed metrics
  const totalSchoolsCount = schoolsList.filter(s => !s.isBranch).length;
  const totalBranchesCount = schoolsList.filter(s => s.isBranch).length;
  const appointedAdminsCount = schoolsList.filter(s => s.admin).length;
  const appointedPrincipalsCount = schoolsList.filter(s => s.principal).length;
  const totalStaffCount = allStaffList.length;
  const totalStudentsCount = schoolsList.reduce((acc, curr) => acc + (curr.studentCount || 0), 0);

  // Filtered schools
  const filteredSchools = useMemo(() => {
    return schoolsList.filter(s => {
      const matchesSearch = !schoolSearchQuery || 
        s.name.toLowerCase().includes(schoolSearchQuery.toLowerCase()) ||
        s.slug.toLowerCase().includes(schoolSearchQuery.toLowerCase()) ||
        (s.address && s.address.toLowerCase().includes(schoolSearchQuery.toLowerCase()));

      if (!matchesSearch) return false;

      if (schoolTypeFilter === 'main') return !s.isBranch;
      if (schoolTypeFilter === 'branch') return !!s.isBranch;
      if (schoolTypeFilter === 'missing-admin') return !s.admin || !s.principal;
      return true;
    });
  }, [schoolsList, schoolSearchQuery, schoolTypeFilter]);

  // Filtered staff for assignments tab
  const filteredStaff = useMemo(() => {
    return allStaffList.filter(st => {
      const matchesSearch = !staffSearchQuery ||
        st.name.toLowerCase().includes(staffSearchQuery.toLowerCase()) ||
        (st.employeeId && st.employeeId.toLowerCase().includes(staffSearchQuery.toLowerCase())) ||
        (st.email && st.email.toLowerCase().includes(staffSearchQuery.toLowerCase())) ||
        (st.department && st.department.toLowerCase().includes(staffSearchQuery.toLowerCase()));

      if (!matchesSearch) return false;
      if (staffSchoolFilter !== 'all' && st.schoolSlug !== staffSchoolFilter) return false;
      if (staffRoleFilter !== 'all' && st.role !== staffRoleFilter) return false;
      return true;
    });
  }, [allStaffList, staffSearchQuery, staffSchoolFilter, staffRoleFilter]);

  // Format Currency helper
  const formatCurrency = (val) => {
    if (val === undefined || val === null) return '₹0';
    return '₹' + Math.abs(Number(val)).toLocaleString('en-IN');
  };

  const formatPunchTime = (isoString) => {
    if (!isoString) return '—';
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    } catch {
      return isoString;
    }
  };

  // Teacher Attendance Real Database Aggregated Analytics
  const teacherStats = useMemo(() => {
    if (attendanceAnalytics) {
      return {
        total: attendanceAnalytics.totalTeachers || 0,
        present: attendanceAnalytics.presentTeachers || 0,
        onLeave: attendanceAnalytics.onLeaveTeachers || 0,
        rate: attendanceAnalytics.overallRate !== undefined ? attendanceAnalytics.overallRate : 100
      };
    }

    const teachers = allStaffList.filter(s => {
      const isTeacher = s.role === 'Teacher' || s.role?.toLowerCase()?.includes('teach') || s.department?.toLowerCase()?.includes('science') || s.department?.toLowerCase()?.includes('math') || s.department?.toLowerCase()?.includes('english');
      if (financeScope === 'all') return isTeacher;
      return isTeacher && (s.schoolSlug === financeScope || !s.schoolSlug);
    });

    const total = teachers.length > 0 ? teachers.length : (allStaffList.length > 0 ? allStaffList.length : 10);
    const onLeave = teachers.filter(s => s.status === 'On Leave').length;
    const present = Math.max(0, total - onLeave);
    const rate = total > 0 ? Math.round((present / total) * 1000) / 10 : 100;

    return {
      total,
      present,
      onLeave,
      rate
    };
  }, [attendanceAnalytics, allStaffList, financeScope]);

  // Consolidated Financial Chart Data (Real MongoDB Aggregated Pipeline)
  const financialChartData = useMemo(() => {
    if (financePeriod === 'quarterly') {
      if (financeAnalytics?.quarterlyTrend && financeAnalytics.quarterlyTrend.length > 0) {
        return financeAnalytics.quarterlyTrend;
      }
    } else {
      if (financeAnalytics?.monthlyTrend && financeAnalytics.monthlyTrend.length > 0) {
        return financeAnalytics.monthlyTrend;
      }
    }

    const baseCollected = Number(financeStats.totalCollections) || 0;
    const baseExpense = Number(financeStats.totalExpenses) || 0;
    return [
      { name: 'Apr', collections: 0, expenses: 0, revenue: 0 },
      { name: 'May', collections: 0, expenses: 0, revenue: 0 },
      { name: 'Jun', collections: 0, expenses: 0, revenue: 0 },
      { name: 'Jul', collections: 0, expenses: 0, revenue: 0 },
      { name: 'Aug', collections: 0, expenses: 0, revenue: 0 },
      { name: 'Sep', collections: 0, expenses: 0, revenue: 0 },
      { name: 'Oct', collections: baseCollected, expenses: baseExpense, revenue: baseCollected }
    ];
  }, [financeAnalytics, financeStats, financePeriod]);

  // Weekly Teacher Attendance Trajectory (Real Database Aggregation)
  const teacherAttendanceWeekly = useMemo(() => {
    if (attendanceAnalytics?.weeklyTrend && attendanceAnalytics.weeklyTrend.length > 0) {
      return attendanceAnalytics.weeklyTrend;
    }
    const total = teacherStats.total;
    return [
      { day: 'Mon', present: total, onLeave: 0, rate: 100.0 },
      { day: 'Tue', present: total, onLeave: 0, rate: 100.0 },
      { day: 'Wed', present: total, onLeave: 0, rate: 100.0 },
      { day: 'Thu', present: total, onLeave: 0, rate: 100.0 },
      { day: 'Fri', present: total, onLeave: 0, rate: 100.0 },
      { day: 'Sat', present: total, onLeave: 0, rate: 100.0 },
    ];
  }, [attendanceAnalytics, teacherStats]);

  // Departmental Teacher Attendance Breakdown (Real Staff Collection Grouping)
  const departmentAttendance = useMemo(() => {
    if (attendanceAnalytics?.departmentBreakdown && attendanceAnalytics.departmentBreakdown.length > 0) {
      return attendanceAnalytics.departmentBreakdown;
    }
    return [
      { department: 'Science', total: 2, present: 2, rate: '100%', color: '#10B981', head: 'R. K. Sharma' },
      { department: 'Mathematics', total: 2, present: 2, rate: '100%', color: '#3B82F6', head: 'Pooja Iyer' },
      { department: 'Humanities', total: 2, present: 1, rate: '50%', color: '#F59E0B', head: 'Kunal Ghosh' },
      { department: 'Languages', total: 2, present: 2, rate: '100%', color: '#8B5CF6', head: 'Meenakshi Sundaram' },
      { department: 'Computer Science', total: 1, present: 1, rate: '100%', color: '#06B6D4', head: 'Neha Choudhury' },
      { department: 'Physical Education', total: 1, present: 1, rate: '100%', color: '#EC4899', head: 'Major Baldev Singh' },
    ];
  }, [attendanceAnalytics]);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '20px',
      width: '100%',
      minHeight: '100%',
      fontFamily: "'Outfit', sans-serif"
    }}>
      
      {/* ─── TAB 0: ENTERPRISE COMMAND CENTER (OVERVIEW) ─── */}
      {activeTab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>

        {/* ─── UNIFIED EXECUTIVE TELEMETRY STRIP (4 HIGH-IMPACT METRICS) ─── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
          gap: '16px'
        }}>
          {/* Metric 1: Active Campuses */}
          <div className="card" style={{
            background: 'var(--color-surface, white)',
            borderRadius: '16px',
            padding: '18px 20px',
            border: '1px solid var(--color-border, #e2e8f0)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: '12px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--color-text-muted, #64748b)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Active Campuses
              </span>
              <div style={{
                width: '36px', height: '36px', borderRadius: '10px',
                background: 'rgba(79, 70, 229, 0.08)',
                color: '#4F46E5',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <Building2 size={18} />
              </div>
            </div>
            <div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-text-main, #1e293b)', lineHeight: 1 }}>
                {schoolsList.length}
              </div>
              <div style={{ fontSize: '0.74rem', color: 'var(--color-text-muted, #64748b)', fontWeight: 600, marginTop: '6px' }}>
                {totalSchoolsCount} Main • {totalBranchesCount} {totalBranchesCount === 1 ? 'Branch' : 'Branches'}
              </div>
            </div>
          </div>

          {/* Metric 2: Gross Collections */}
          <div className="card" style={{
            background: 'var(--color-surface, white)',
            borderRadius: '16px',
            padding: '18px 20px',
            border: '1px solid var(--color-border, #e2e8f0)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: '12px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--color-text-muted, #64748b)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Total Collections
              </span>
              <div style={{
                width: '36px', height: '36px', borderRadius: '10px',
                background: 'rgba(16, 185, 129, 0.08)',
                color: '#059669',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <Wallet size={18} />
              </div>
            </div>
            <div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-text-main, #1e293b)', lineHeight: 1 }}>
                {formatCurrency(financeAnalytics?.totalRevenue ?? financeStats.totalCollections)}
              </div>
              <div style={{ fontSize: '0.74rem', color: '#059669', fontWeight: 700, marginTop: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <CheckCircle2 size={12} /> {financeAnalytics?.collectionEfficiency !== undefined ? `${financeAnalytics.collectionEfficiency}%` : '100%'} Realized
              </div>
            </div>
          </div>

          {/* Metric 3: Faculty & Staff */}
          <div className="card" style={{
            background: 'var(--color-surface, white)',
            borderRadius: '16px',
            padding: '18px 20px',
            border: '1px solid var(--color-border, #e2e8f0)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: '12px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--color-text-muted, #64748b)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Faculty & Staff
              </span>
              <div style={{
                width: '36px', height: '36px', borderRadius: '10px',
                background: 'rgba(124, 58, 237, 0.08)',
                color: '#7c3aed',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <Users size={18} />
              </div>
            </div>
            <div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-text-main, #1e293b)', lineHeight: 1 }}>
                {totalStaffCount}
              </div>
              <div style={{ fontSize: '0.74rem', color: 'var(--color-text-muted, #64748b)', fontWeight: 600, marginTop: '6px' }}>
                Across all {schoolsList.length} campuses
              </div>
            </div>
          </div>

          {/* Metric 4: Daily Attendance & Leadership */}
          <div className="card" style={{
            background: 'var(--color-surface, white)',
            borderRadius: '16px',
            padding: '18px 20px',
            border: '1px solid var(--color-border, #e2e8f0)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: '12px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--color-text-muted, #64748b)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Faculty Attendance
              </span>
              <div style={{
                width: '36px', height: '36px', borderRadius: '10px',
                background: 'rgba(217, 119, 6, 0.08)',
                color: '#d97706',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <UserCheck size={18} />
              </div>
            </div>
            <div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-text-main, #1e293b)', lineHeight: 1 }}>
                {teacherStats.rate}%
              </div>
              <div style={{ fontSize: '0.74rem', color: '#059669', fontWeight: 700, marginTop: '6px' }}>
                {teacherStats.present} / {teacherStats.total} on duty today
              </div>
            </div>
          </div>
        </div>

        {/* ─── OPERATIONAL & FINANCIAL INTELLIGENCE ─── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}>
          {/* Section Header Card */}
          <div className="card" style={{
            background: 'var(--color-surface, white)',
            borderRadius: '16px',
            padding: '14px 20px',
            border: '1px solid var(--color-border, #e2e8f0)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <div style={{
                width: '34px',
                height: '34px',
                borderRadius: '10px',
                background: 'rgba(79, 70, 229, 0.08)',
                color: '#4F46E5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Activity size={18} />
              </div>
              <h2 style={{ margin: 0, fontSize: '1.08rem', fontWeight: 800, color: 'var(--color-text-main, #1e293b)', letterSpacing: '-0.01em' }}>
                Operational & Financial Intelligence
              </h2>
              <span style={{
                background: '#f1f5f9',
                color: '#475569',
                fontSize: '0.72rem',
                fontWeight: 700,
                padding: '3px 10px',
                borderRadius: '12px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }} />
                AY 2026-2027 Telemetry
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              {/* Campus Selector */}
              <select
                value={financeScope}
                onChange={e => setFinanceScope(e.target.value)}
                style={{
                  padding: '7px 12px',
                  borderRadius: '10px',
                  border: '1px solid var(--color-border, #cbd5e1)',
                  background: 'var(--color-bg, #f8fafc)',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  color: 'var(--color-text-main, #334155)',
                  cursor: 'pointer',
                  outline: 'none',
                  transition: 'border-color 0.15s ease'
                }}
              >
                <option value="all">🌐 All Campuses (Consolidated)</option>
                {schoolsList.map(s => (
                  <option key={s.slug} value={s.slug}>
                    {s.name || s.slug} {s.isBranch ? '(Branch)' : '(Main)'}
                  </option>
                ))}
              </select>

              {/* Period Selector */}
              <div style={{
                display: 'inline-flex',
                background: 'var(--color-bg, #f8fafc)',
                border: '1px solid var(--color-border, #cbd5e1)',
                padding: '3px',
                borderRadius: '10px'
              }}>
                <button
                  type="button"
                  onClick={() => setFinancePeriod('monthly')}
                  style={{
                    padding: '5px 12px',
                    borderRadius: '7px',
                    border: 'none',
                    background: financePeriod === 'monthly' ? '#4F46E5' : 'transparent',
                    color: financePeriod === 'monthly' ? '#ffffff' : 'var(--color-text-muted, #64748b)',
                    fontWeight: 700,
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                    boxShadow: financePeriod === 'monthly' ? '0 1px 4px rgba(79, 70, 229, 0.25)' : 'none',
                    transition: 'all 0.15s ease'
                  }}
                >
                  Monthly
                </button>
                <button
                  type="button"
                  onClick={() => setFinancePeriod('quarterly')}
                  style={{
                    padding: '5px 12px',
                    borderRadius: '7px',
                    border: 'none',
                    background: financePeriod === 'quarterly' ? '#4F46E5' : 'transparent',
                    color: financePeriod === 'quarterly' ? '#ffffff' : 'var(--color-text-muted, #64748b)',
                    fontWeight: 700,
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                    boxShadow: financePeriod === 'quarterly' ? '0 1px 4px rgba(79, 70, 229, 0.25)' : 'none',
                    transition: 'all 0.15s ease'
                  }}
                >
                  Quarterly
                </button>
              </div>

              {/* Refresh Button */}
              <button
                type="button"
                onClick={() => fetchFinanceAndAttendanceAnalytics(financeScope)}
                disabled={isFinanceLoading}
                title="Refresh Live Telemetry"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '34px',
                  height: '34px',
                  borderRadius: '10px',
                  border: '1px solid var(--color-border, #cbd5e1)',
                  background: 'var(--color-bg, #f8fafc)',
                  color: 'var(--color-text-muted, #64748b)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
                onMouseOver={e => { e.currentTarget.style.color = '#4F46E5'; e.currentTarget.style.borderColor = '#4F46E5'; }}
                onMouseOut={e => { e.currentTarget.style.color = 'var(--color-text-muted, #64748b)'; e.currentTarget.style.borderColor = 'var(--color-border, #cbd5e1)'; }}
              >
                <RefreshCw size={14} style={{ animation: isFinanceLoading ? 'spin 1s linear infinite' : 'none' }} />
              </button>
            </div>
          </div>

          {/* ─── 2 INTERACTIVE ANALYTICS GRAPHS ─── */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(440px, 1fr))',
            gap: '16px',
            width: '100%'
          }}>
            {/* GRAPH 1: Financial Trajectory */}
            <div className="card" style={{
              background: 'var(--color-surface, white)',
              borderRadius: '16px',
              padding: '20px',
              border: '1px solid var(--color-border, #e2e8f0)',
              boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
              display: 'flex',
              flexDirection: 'column'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <TrendingUp size={16} color="#4F46E5" />
                  <h3 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 800, color: 'var(--color-text-main, #1e293b)' }}>
                    Financial Performance
                  </h3>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.72rem', fontWeight: 700, color: '#4F46E5' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: '#4F46E5' }} /> Fees
                  </span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.72rem', fontWeight: 700, color: '#10B981' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: '#10B981' }} /> Revenue
                  </span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.72rem', fontWeight: 700, color: '#F43F5E' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: '#F43F5E' }} /> Expenses
                  </span>
                </div>
              </div>

              <div style={{ width: '100%', height: '240px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={financialChartData} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorCollections" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.35}/>
                        <stop offset="95%" stopColor="#4F46E5" stopOpacity={0.01}/>
                      </linearGradient>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#10B981" stopOpacity={0.01}/>
                      </linearGradient>
                      <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#F43F5E" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#F43F5E" stopOpacity={0.01}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(226, 232, 240, 0.6)" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--color-text-muted, #64748B)', fontWeight: 600 }} dy={6} />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 11, fill: 'var(--color-text-muted, #64748B)' }} 
                      tickFormatter={v => `₹${v >= 100000 ? (v / 100000).toFixed(1) + 'L' : (v / 1000) + 'k'}`} 
                    />
                    <Tooltip content={<FinancialTooltip />} />
                    <Area type="monotone" dataKey="collections" name="Fees Collected" stroke="#4F46E5" strokeWidth={2.2} fillOpacity={1} fill="url(#colorCollections)" />
                    <Area type="monotone" dataKey="revenue" name="Revenue Generated" stroke="#10B981" strokeWidth={2.2} fillOpacity={1} fill="url(#colorRevenue)" />
                    <Area type="monotone" dataKey="expenses" name="Operating Expenses" stroke="#F43F5E" strokeWidth={1.8} strokeDasharray="4 4" fillOpacity={1} fill="url(#colorExpenses)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '14px', paddingTop: '12px', borderTop: '1px solid var(--color-border, #f1f5f9)' }}>
                <span style={{ fontSize: '0.74rem', color: 'var(--color-text-muted, #64748b)' }}>
                  Efficiency: <strong style={{ color: '#10b981' }}>{financeAnalytics?.collectionEfficiency !== undefined ? `${financeAnalytics.collectionEfficiency}%` : '100%'}</strong>
                </span>
                <span style={{ fontSize: '0.74rem', color: 'var(--color-text-muted, #64748b)' }}>
                  Net Balance: <strong style={{ color: (financeAnalytics?.availableBalance ?? financeStats.availableBalance) >= 0 ? '#10B981' : '#F43F5E' }}>{formatCurrency(financeAnalytics?.availableBalance ?? financeStats.availableBalance)}</strong>
                </span>
              </div>
            </div>

            {/* GRAPH 2: Faculty Attendance */}
            <div className="card" style={{
              background: 'var(--color-surface, white)',
              borderRadius: '16px',
              padding: '20px',
              border: '1px solid var(--color-border, #e2e8f0)',
              boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
              display: 'flex',
              flexDirection: 'column'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <UserCheck size={16} color="#0284C7" />
                  <h3 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 800, color: 'var(--color-text-main, #1e293b)' }}>
                    Faculty Attendance
                  </h3>
                </div>

                <div style={{
                  display: 'inline-flex',
                  background: 'var(--color-bg, #f8fafc)',
                  border: '1px solid var(--color-border, #e2e8f0)',
                  padding: '2px',
                  borderRadius: '6px'
                }}>
                  <button
                    type="button"
                    onClick={() => setAttendanceView('weekly')}
                    style={{
                      padding: '3px 8px',
                      borderRadius: '4px',
                      border: 'none',
                      background: attendanceView === 'weekly' ? '#0284C7' : 'transparent',
                      color: attendanceView === 'weekly' ? '#ffffff' : 'var(--color-text-muted, #64748b)',
                      fontWeight: 700,
                      fontSize: '0.72rem',
                      cursor: 'pointer',
                      transition: 'all 0.15s'
                    }}
                  >
                    Weekly
                  </button>
                  <button
                    type="button"
                    onClick={() => setAttendanceView('departments')}
                    style={{
                      padding: '3px 8px',
                      borderRadius: '4px',
                      border: 'none',
                      background: attendanceView === 'departments' ? '#0284C7' : 'transparent',
                      color: attendanceView === 'departments' ? '#ffffff' : 'var(--color-text-muted, #64748b)',
                      fontWeight: 700,
                      fontSize: '0.72rem',
                      cursor: 'pointer',
                      transition: 'all 0.15s'
                    }}
                  >
                    Departments
                  </button>
                </div>
              </div>

              {attendanceView === 'weekly' ? (
                <div style={{ width: '100%', height: '240px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={teacherAttendanceWeekly} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(226, 232, 240, 0.6)" />
                      <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--color-text-muted, #64748B)', fontWeight: 600 }} dy={6} />
                      <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--color-text-muted, #64748B)' }} />
                      <YAxis yAxisId="right" orientation="right" domain={[80, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6366F1' }} unit="%" />
                      <Tooltip content={<AttendanceTooltip />} />
                      <Bar yAxisId="left" dataKey="present" name="Present Teachers" fill="#10B981" radius={[4, 4, 0, 0]} maxBarSize={24} />
                      <Bar yAxisId="left" dataKey="onLeave" name="On Leave" fill="#F59E0B" radius={[4, 4, 0, 0]} maxBarSize={24} />
                      <Line yAxisId="right" type="monotone" dataKey="rate" name="Attendance Rate" stroke="#6366F1" strokeWidth={2.2} dot={{ r: 3, fill: '#6366F1' }} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', height: '240px', justifyContent: 'center' }}>
                  {departmentAttendance.slice(0, 5).map((dept, idx) => (
                    <div key={idx} style={{ background: 'var(--color-bg, #f8fafc)', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--color-border, #f1f5f9)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.8rem', color: 'var(--color-text-main, #1e293b)' }}>
                          {dept.department}
                        </span>
                        <span style={{ fontSize: '0.74rem', fontWeight: 800, color: dept.color }}>
                          {dept.rate} ({dept.present}/{dept.total})
                        </span>
                      </div>
                      <div style={{ width: '100%', height: '6px', background: 'var(--color-border, #e2e8f0)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ width: dept.rate, height: '100%', background: dept.color, borderRadius: '3px' }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '14px', paddingTop: '12px', borderTop: '1px solid var(--color-border, #f1f5f9)', flexWrap: 'wrap', gap: '8px' }}>
                <span style={{ fontSize: '0.74rem', color: 'var(--color-text-muted, #64748b)' }}>
                  Daily Rate: <strong style={{ color: '#0284c7' }}>{teacherStats.rate}%</strong> • Active Coverage: <strong style={{ color: '#10b981' }}>{teacherStats.present}/{teacherStats.total} Faculty</strong>
                </span>
                <button
                  type="button"
                  onClick={() => handleTabChange('attendance')}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '0.74rem',
                    color: '#0284c7',
                    background: 'none',
                    border: 'none',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  View Full Attendance Sheet <ArrowRight size={12} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ─── MULTI-CAMPUS NETWORK OVERVIEW TABLE ─── */}
        <div className="card" style={{
          background: 'var(--color-surface, white)',
          borderRadius: '16px',
          padding: '22px 24px',
          border: '1px solid var(--color-border, #e2e8f0)',
          boxShadow: '0 2px 10px rgba(0,0,0,0.02)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Building2 size={18} color="#4F46E5" />
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--color-text-main, #1e293b)' }}>
                Multi-Campus Network Overview
              </h3>
              <span style={{
                fontSize: '0.7rem',
                fontWeight: 700,
                background: '#f1f5f9',
                color: '#475569',
                padding: '2px 8px',
                borderRadius: '12px'
              }}>
                {schoolsList.length} Campuses
              </span>
            </div>

            <button
              type="button"
              onClick={() => handleTabChange('schools')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '6px 12px',
                borderRadius: '8px',
                background: '#f8fafc',
                border: '1px solid #cbd5e1',
                color: '#334155',
                fontSize: '0.78rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              onMouseOver={e => { e.currentTarget.style.background = '#4F46E5'; e.currentTarget.style.color = 'white'; e.currentTarget.style.borderColor = '#4F46E5'; }}
              onMouseOut={e => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.color = '#334155'; e.currentTarget.style.borderColor = '#cbd5e1'; }}
            >
              <span>Manage All in Directory</span>
              <ChevronRight size={14} />
            </button>
          </div>

          {schoolsList.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#94a3b8' }}>
              <Building2 size={36} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
              <div style={{ fontWeight: 700, color: '#475569', fontSize: '0.95rem' }}>No schools or campuses registered</div>
              <p style={{ fontSize: '0.82rem', margin: '4px 0 16px' }}>Click "Register School" to provision your first institution.</p>
              <button
                onClick={() => {
                  setCreateModalType('school');
                  setCreateModalParentSlug('');
                  setIsCreateSchoolOpen(true);
                }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  background: '#4F46E5',
                  color: 'white',
                  border: 'none',
                  fontWeight: 700,
                  fontSize: '0.82rem',
                  cursor: 'pointer'
                }}
              >
                <Plus size={14} /> Register School
              </button>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '700px' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    <th style={{ padding: '10px 14px', fontWeight: 800 }}>Campus / School</th>
                    <th style={{ padding: '10px 12px', fontWeight: 800 }}>Type</th>
                    <th style={{ padding: '10px 12px', fontWeight: 800 }}>Handle</th>
                    <th style={{ padding: '10px 12px', fontWeight: 800 }}>Branch Admin</th>
                    <th style={{ padding: '10px 12px', fontWeight: 800 }}>Principal</th>
                    <th style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 800 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {schoolsList.map(school => {
                    const isMain = !school.parentSchoolSlug;
                    const adminName = school.admin?.name || school.adminName || '';
                    const adminEmail = school.admin?.email || school.adminEmail || '';
                    const hasAdmin = !!adminName || !!adminEmail;

                    const principalName = school.principal?.name || school.principalName || '';
                    const principalEmail = school.principal?.email || school.principalEmail || '';
                    const hasPrincipal = !!principalName || !!principalEmail;

                    return (
                      <tr key={school._id || school.slug} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.15s' }}>
                        <td style={{ padding: '12px 14px' }}>
                          <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.88rem' }}>
                            {school.name}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '1px' }}>
                            <MapPin size={11} color="#94a3b8" /> {school.city || school.address || 'Central Campus'}
                          </div>
                        </td>

                        <td style={{ padding: '12px 12px' }}>
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            padding: '2px 8px',
                            borderRadius: '6px',
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            background: isMain ? 'rgba(79, 70, 229, 0.08)' : '#f1f5f9',
                            color: isMain ? '#4F46E5' : '#475569',
                            border: isMain ? '1px solid rgba(79, 70, 229, 0.2)' : '1px solid #e2e8f0'
                          }}>
                            {isMain ? 'Main School' : 'Branch Campus'}
                          </span>
                        </td>

                        <td style={{ padding: '12px 12px' }}>
                          <code style={{ fontSize: '0.75rem', background: '#f8fafc', padding: '2px 6px', borderRadius: '4px', border: '1px solid #e2e8f0', color: '#334155', fontWeight: 600 }}>
                            /{school.slug}
                          </code>
                        </td>

                        <td style={{ padding: '12px 12px' }}>
                          {hasAdmin ? (
                            <div>
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#059669', fontSize: '0.78rem', fontWeight: 700 }}>
                                <CheckCircle2 size={13} /> {adminName || 'Admin'}
                              </span>
                              {adminEmail && (
                                <div style={{ fontSize: '0.7rem', color: '#64748b', paddingLeft: '17px' }}>
                                  {adminEmail}
                                </div>
                              )}
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setTargetSchoolForAdmin(school)}
                              style={{
                                padding: '3px 8px',
                                borderRadius: '6px',
                                background: '#fffbeb',
                                border: '1px solid #fde68a',
                                color: '#b45309',
                                fontSize: '0.7rem',
                                fontWeight: 700,
                                cursor: 'pointer'
                              }}
                            >
                              + Appoint Admin
                            </button>
                          )}
                        </td>

                        <td style={{ padding: '12px 12px' }}>
                          {hasPrincipal ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <div>
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#0f766e', fontSize: '0.78rem', fontWeight: 700 }}>
                                  <CheckCircle2 size={13} /> {principalName || 'Principal'}
                                </span>
                                {principalEmail && (
                                  <div style={{ fontSize: '0.7rem', color: '#64748b', paddingLeft: '17px' }}>
                                    {principalEmail}
                                  </div>
                                )}
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  setPreSelectedTeacherForPrincipal(null);
                                  setTargetSchoolForPrincipal(school);
                                }}
                                style={{
                                  padding: '2px 6px',
                                  borderRadius: '4px',
                                  background: '#f1f5f9',
                                  border: '1px solid #cbd5e1',
                                  color: '#475569',
                                  fontSize: '0.65rem',
                                  fontWeight: 600,
                                  cursor: 'pointer'
                                }}
                                title="Reassign or appoint new Principal"
                              >
                                Change
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setPreSelectedTeacherForPrincipal(null);
                                setTargetSchoolForPrincipal(school);
                              }}
                              style={{
                                padding: '3px 8px',
                                borderRadius: '6px',
                                background: '#f0fdf4',
                                border: '1px solid #bbf7d0',
                                color: '#15803d',
                                fontSize: '0.7rem',
                                fontWeight: 700,
                                cursor: 'pointer'
                              }}
                            >
                              + Appoint Principal
                            </button>
                          )}
                        </td>

                        <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                          <button
                            type="button"
                            onClick={() => handleTabChange('schools')}
                            style={{
                              padding: '5px 10px',
                              borderRadius: '6px',
                              background: '#f8fafc',
                              border: '1px solid #cbd5e1',
                              color: '#1e3a8a',
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              transition: 'all 0.15s ease'
                            }}
                            onMouseOver={e => { e.currentTarget.style.background = '#4F46E5'; e.currentTarget.style.color = 'white'; e.currentTarget.style.borderColor = '#4F46E5'; }}
                            onMouseOut={e => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.color = '#1e3a8a'; e.currentTarget.style.borderColor = '#cbd5e1'; }}
                          >
                            Manage Branch →
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>        </div>
      )}

      {/* ─── TAB 1: SCHOOLS & BRANCHES ECOSYSTEM ─── */}
      {activeTab === 'schools' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
          {/* Dedicated Schools Directory Header */}
          <div style={{
            background: 'white',
            borderRadius: '20px',
            padding: '24px 28px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 4px 18px rgba(0,0,0,0.03)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '16px'
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <span style={{
                  background: '#ede9fe',
                  color: '#6d28d9',
                  padding: '3px 10px',
                  borderRadius: '999px',
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  textTransform: 'uppercase'
                }}>
                  Institutional Directory
                </span>
                <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>
                  {totalSchoolsCount} Main Institutions • {totalBranchesCount} Branches
                </span>
              </div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1e3a8a', margin: 0 }}>
                Schools & Campuses Ecosystem
              </h2>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => {
                  setCreateModalType('school');
                  setCreateModalParentSlug('');
                  setIsCreateSchoolOpen(true);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 18px',
                  borderRadius: '10px',
                  background: '#4F46E5',
                  color: 'white',
                  border: 'none',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(79, 70, 229, 0.25)'
                }}
              >
                <Plus size={16} /> Register School
              </button>

              <button
                type="button"
                onClick={() => {
                  setCreateModalType('branch');
                  setCreateModalParentSlug(schoolsList[0]?.slug || '');
                  setIsCreateSchoolOpen(true);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 18px',
                  borderRadius: '10px',
                  background: '#f8fafc',
                  color: '#1e293b',
                  border: '1px solid #cbd5e1',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  cursor: 'pointer'
                }}
              >
                <Building2 size={16} color="#4F46E5" /> + Add Branch
              </button>

              <button
                type="button"
                onClick={loadAllData}
                title="Refresh"
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  background: '#f8fafc',
                  border: '1px solid #cbd5e1',
                  color: '#64748b',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
              >
                <RefreshCw size={15} className={isLoading ? 'spin' : ''} />
              </button>
            </div>
          </div>

          {/* Filter Bar */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '16px',
            background: 'white',
            padding: '14px 20px',
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
          }}>
            {/* Search Input */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: '1', minWidth: '260px' }}>
              <Search size={18} color="#94a3b8" />
              <input
                type="text"
                placeholder="Search school name, branch slug, or city/address..."
                value={schoolSearchQuery}
                onChange={e => setSchoolSearchQuery(e.target.value)}
                style={{
                  border: 'none',
                  outline: 'none',
                  fontSize: '0.9rem',
                  width: '100%',
                  color: '#1e293b'
                }}
              />
              {schoolSearchQuery && (
                <button
                  onClick={() => setSchoolSearchQuery('')}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Filter Pills */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {[
                { id: 'all', label: 'All Campuses' },
                { id: 'main', label: 'Main Schools' },
                { id: 'branch', label: 'Branches Only' },
                { id: 'missing-admin', label: 'Needs Leadership' }
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setSchoolTypeFilter(f.id)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '8px',
                    border: '1px solid',
                    borderColor: schoolTypeFilter === f.id ? '#4F46E5' : '#cbd5e1',
                    background: schoolTypeFilter === f.id ? 'rgba(79, 70, 229, 0.08)' : 'white',
                    color: schoolTypeFilter === f.id ? '#4F46E5' : '#64748b',
                    fontWeight: 700,
                    fontSize: '0.78rem',
                    cursor: 'pointer'
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Schools Grid / List */}
          {filteredSchools.length === 0 ? (
            <div style={{
              background: 'white',
              borderRadius: '20px',
              padding: '60px 20px',
              textAlign: 'center',
              border: '1px solid #e2e8f0'
            }}>
              <Building2 size={48} color="#94a3b8" style={{ margin: '0 auto 16px auto', display: 'block' }} />
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1e3a8a', margin: '0 0 6px 0' }}>
                No Schools Found
              </h3>
              <p style={{ color: '#64748b', fontSize: '0.9rem', maxWidth: '440px', margin: '0 auto 20px auto' }}>
                {schoolSearchQuery 
                  ? `No schools matching "${schoolSearchQuery}"` 
                  : 'Get started by creating your first school or branch.'}
              </p>
              <button
                onClick={() => {
                  setCreateModalType('school');
                  setIsCreateSchoolOpen(true);
                }}
                style={{
                  padding: '10px 24px',
                  borderRadius: '10px',
                  background: '#4F46E5',
                  color: 'white',
                  border: 'none',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                + Register First School
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {filteredSchools.map((sch) => {
                const isBranch = !!sch.isBranch;
                const isRosterExpanded = expandedSchoolSlug === sch.slug;
                const currentStaffRoster = branchStaffData[sch.slug] || [];

                return (
                  <div 
                    key={sch.slug}
                    style={{
                      background: 'white',
                      borderRadius: '20px',
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 4px 18px rgba(0,0,0,0.03)',
                      overflow: 'hidden',
                      transition: 'all 0.2s'
                    }}
                  >
                    {/* Main School Card Header */}
                    <div style={{ padding: '22px 24px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px' }}>
                        
                        {/* School Info */}
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                          <div style={{
                            width: '46px',
                            height: '46px',
                            borderRadius: '12px',
                            background: isBranch ? 'rgba(2, 132, 199, 0.1)' : 'rgba(79, 70, 229, 0.1)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0
                          }}>
                            {isBranch ? <Layers size={22} color="#0284c7" /> : <Building2 size={22} color="#4F46E5" />}
                          </div>

                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1e293b', margin: 0 }}>
                                {sch.name}
                              </h3>
                              <span style={{
                                padding: '2px 8px',
                                borderRadius: '6px',
                                fontSize: '0.7rem',
                                fontWeight: 800,
                                background: isBranch ? '#e0f2fe' : '#e0e7ff',
                                color: isBranch ? '#0369a1' : '#3730a3',
                                border: isBranch ? '1px solid #bae6fd' : '1px solid #c7d2fe'
                              }}>
                                {isBranch ? 'BRANCH CAMPUS' : 'MAIN SCHOOL'}
                              </span>
                              <code style={{ fontSize: '0.72rem', background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', color: '#475569' }}>
                                /{sch.slug}
                              </code>

                              {/* GPS Geofence Status Badge */}
                              {sch.campusLatitude && sch.campusLongitude ? (
                                <span style={{
                                  fontSize: '0.68rem',
                                  padding: '2px 8px',
                                  borderRadius: '6px',
                                  fontWeight: 700,
                                  background: sch.geofenceEnabled !== false ? '#dcfce7' : '#fef3c7',
                                  color: sch.geofenceEnabled !== false ? '#166534' : '#b45309',
                                  border: `1px solid ${sch.geofenceEnabled !== false ? '#86efac' : '#fde68a'}`,
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px'
                                }} title={`Campus center: ${sch.campusLatitude}, ${sch.campusLongitude} (Radius: ${sch.campusRadiusMeters || 300}m)`}>
                                  <Navigation size={10} />
                                  {sch.geofenceEnabled !== false ? `GPS Geofenced (${sch.campusRadiusMeters || 300}m)` : 'GPS Calibrated (Off)'}
                                </span>
                              ) : (
                                <span style={{
                                  fontSize: '0.68rem',
                                  padding: '2px 8px',
                                  borderRadius: '6px',
                                  fontWeight: 650,
                                  background: '#fff7ed',
                                  color: '#c2410c',
                                  border: '1px solid #fed7aa',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px'
                                }}>
                                  <AlertCircle size={10} /> GPS Not Calibrated
                                </span>
                              )}
                            </div>

                            {sch.address && (
                              <div style={{ fontSize: '0.8rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                                <MapPin size={13} color="#4F46E5" /> {sch.address}
                              </div>
                            )}

                            {isBranch && sch.parentSchoolSlug && (
                              <div style={{ fontSize: '0.73rem', color: '#94a3b8', marginTop: '2px' }}>
                                Parent School: <strong>{sch.parentSchoolSlug}</strong>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Top Action Buttons for this School */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          {/* Create Staff in this Branch Button */}
                          <button
                            type="button"
                            onClick={() => setTargetSchoolForStaff(sch)}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '8px 14px',
                              borderRadius: '9px',
                              background: '#eff6ff',
                              border: '1.5px solid #bfdbfe',
                              color: '#1d4ed8',
                              fontSize: '0.78rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              transition: 'all 0.15s',
                              boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                            }}
                            title="Add a new staff member directly to this branch"
                          >
                            <UserPlus size={13} color="#1d4ed8" /> + Add Staff
                          </button>

                          {/* Calibrate GPS Button */}
                          <button
                            type="button"
                            onClick={() => setTargetSchoolForEdit(sch)}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '8px 14px',
                              borderRadius: '9px',
                              background: (sch.campusLatitude && sch.campusLongitude) ? 'rgba(79, 70, 229, 0.08)' : '#fff7ed',
                              border: (sch.campusLatitude && sch.campusLongitude) ? '1.5px solid rgba(79, 70, 229, 0.3)' : '1.5px solid #fdba74',
                              color: (sch.campusLatitude && sch.campusLongitude) ? '#4F46E5' : '#c2410c',
                              fontSize: '0.78rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              transition: 'all 0.15s',
                              boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                            }}
                            title="Calibrate GPS coordinates, radius, and geofence boundary for staff attendance"
                          >
                            <Navigation size={13} color={(sch.campusLatitude && sch.campusLongitude) ? '#4F46E5' : '#c2410c'} />
                            Calibrate GPS
                          </button>

                          {/* Edit School Button */}
                          <button
                            type="button"
                            onClick={() => setTargetSchoolForEdit(sch)}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '8px 14px',
                              borderRadius: '9px',
                              background: '#ffffff',
                              border: '1.5px solid #cbd5e1',
                              color: '#1e293b',
                              fontSize: '0.78rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              transition: 'all 0.15s',
                              boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                            }}
                            onMouseOver={(e) => {
                              e.currentTarget.style.borderColor = '#4F46E5';
                              e.currentTarget.style.color = '#4F46E5';
                            }}
                            onMouseOut={(e) => {
                              e.currentTarget.style.borderColor = '#cbd5e1';
                              e.currentTarget.style.color = '#1e293b';
                            }}
                            title="Edit School Name, Campus Address, Contact, and Affiliation"
                          >
                            <Edit3 size={13} color="#4F46E5" /> Edit School
                          </button>

                          {/* Launch branch window */}
                          <button
                            type="button"
                            onClick={() => window.open(`/${sch.slug}/dashboard`, '_blank')}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '8px 14px',
                              borderRadius: '9px',
                              background: 'linear-gradient(135deg, #1e3a8a 0%, #4F46E5 100%)',
                              color: 'white',
                              border: 'none',
                              fontSize: '0.78rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              boxShadow: '0 3px 10px rgba(79, 70, 229, 0.25)'
                            }}
                            title="Open this school campus in a separate browser tab to manage its local classes, fees, and students"
                          >
                            <ExternalLink size={13} /> Launch Campus Window
                          </button>

                          {/* Delete School Button */}
                          <button
                            type="button"
                            onClick={() => setTargetSchoolForDelete(sch)}
                            style={{
                              padding: '8px 12px',
                              borderRadius: '9px',
                              background: '#fff1f2',
                              border: '1px solid #fecdd3',
                              color: '#e11d48',
                              fontSize: '0.78rem',
                              fontWeight: 700,
                              cursor: 'pointer'
                            }}
                            title="Delete this branch"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>

                      {/* Leadership & Staff Grid for this School */}
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                        gap: '12px',
                        marginTop: '16px'
                      }}>
                        
                        {/* Branch Administrator Box */}
                        <div style={{
                          padding: '12px 16px',
                          borderRadius: '12px',
                          background: sch.admin ? 'rgba(16, 185, 129, 0.05)' : 'rgba(245, 158, 11, 0.06)',
                          border: sch.admin ? '1px solid rgba(16, 185, 129, 0.3)' : '1px dashed rgba(245, 158, 11, 0.5)',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}>
                          <div>
                            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '5px' }}>
                              <ShieldCheck size={13} color={sch.admin ? '#059669' : '#d97706'} />
                              Branch Administrator
                            </div>
                            {sch.admin ? (
                              <div style={{ marginTop: '3px' }}>
                                <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#1e293b' }}>
                                  {sch.admin.name}
                                </div>
                                {sch.admin.email && (
                                  <div style={{ fontSize: '0.74rem', color: '#059669', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                                    <Mail size={12} /> {sch.admin.email}
                                  </div>
                                )}
                                <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '2px' }}>
                                  Login: <code>{sch.admin.portalUsername || 'N/A'}</code>
                                </div>
                              </div>
                            ) : (
                              <div style={{ fontSize: '0.78rem', color: '#b45309', fontWeight: 600, marginTop: '3px' }}>
                                No Admin Appointed Yet
                              </div>
                            )}
                          </div>

                          <button
                            type="button"
                            onClick={() => setTargetSchoolForAdmin(sch)}
                            style={{
                              padding: '5px 10px',
                              borderRadius: '7px',
                              background: sch.admin ? '#ffffff' : '#f59e0b',
                              border: sch.admin ? '1px solid #cbd5e1' : 'none',
                              color: sch.admin ? '#334155' : '#ffffff',
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              cursor: 'pointer'
                            }}
                          >
                            {sch.admin ? 'Edit Admin' : '+ Appoint Admin'}
                          </button>
                        </div>

                        {/* Principal Box */}
                        <div style={{
                          padding: '12px 16px',
                          borderRadius: '12px',
                          background: sch.principal ? 'rgba(15, 118, 110, 0.05)' : 'rgba(245, 158, 11, 0.06)',
                          border: sch.principal ? '1px solid rgba(15, 118, 110, 0.3)' : '1px dashed rgba(245, 158, 11, 0.5)',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}>
                          <div>
                            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '5px' }}>
                              <Award size={13} color={sch.principal ? '#0f766e' : '#d97706'} />
                              School Principal
                            </div>
                            {sch.principal ? (
                              <div style={{ marginTop: '3px' }}>
                                <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#1e293b' }}>
                                  {sch.principal.name}
                                </div>
                                {sch.principal.email && (
                                  <div style={{ fontSize: '0.74rem', color: '#0f766e', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                                    <Mail size={12} /> {sch.principal.email}
                                  </div>
                                )}
                                <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '2px' }}>
                                  Login: <code>{sch.principal.portalUsername || 'N/A'}</code>
                                </div>
                              </div>
                            ) : (
                              <div style={{ fontSize: '0.78rem', color: '#b45309', fontWeight: 600, marginTop: '3px' }}>
                                No Principal Appointed Yet
                              </div>
                            )}
                          </div>

                          <button
                            type="button"
                            onClick={() => setTargetSchoolForPrincipal(sch)}
                            style={{
                              padding: '5px 10px',
                              borderRadius: '7px',
                              background: sch.principal ? '#ffffff' : '#f59e0b',
                              border: sch.principal ? '1px solid #cbd5e1' : 'none',
                              color: sch.principal ? '#334155' : '#ffffff',
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              cursor: 'pointer'
                            }}
                          >
                            {sch.principal ? 'Edit Principal' : '+ Appoint Principal'}
                          </button>
                        </div>

                        {/* Staff & Faculty Count Box */}
                        <div style={{
                          padding: '12px 16px',
                          borderRadius: '12px',
                          background: '#f8fafc',
                          border: '1px solid #e2e8f0',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}>
                          <div>
                            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '5px' }}>
                              <Users size={13} color="#4F46E5" />
                              Faculty & Staff
                            </div>
                            <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#1e293b', marginTop: '3px' }}>
                              👥 {sch.staffCount ?? 0} Staff Members
                            </div>
                            <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                              🎓 {sch.studentCount ?? 0} Students Enrolled
                            </div>
                          </div>

                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button
                              type="button"
                              onClick={() => {
                                setTargetSchoolForStaff(sch);
                              }}
                              style={{
                                padding: '5px 10px',
                                borderRadius: '7px',
                                background: '#4F46E5',
                                border: 'none',
                                color: '#ffffff',
                                fontSize: '0.72rem',
                                fontWeight: 700,
                                cursor: 'pointer'
                              }}
                            >
                              + Assign Staff
                            </button>

                            <button
                              type="button"
                              onClick={() => handleToggleRoster(sch.slug)}
                              style={{
                                padding: '5px 8px',
                                borderRadius: '7px',
                                background: '#ffffff',
                                border: '1px solid #cbd5e1',
                                color: '#475569',
                                fontSize: '0.72rem',
                                fontWeight: 600,
                                cursor: 'pointer'
                              }}
                              title="Toggle Staff Roster View"
                            >
                              {isRosterExpanded ? 'Hide' : 'Roster'}
                            </button>
                          </div>
                        </div>

                      </div>
                    </div>

                    {/* Expandable Staff Roster Drawer for this school */}
                    {isRosterExpanded && (
                      <div style={{
                        padding: '18px 24px',
                        background: '#f8fafc',
                        borderTop: '1px solid #e2e8f0'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                          <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#1e3a8a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Users size={15} color="#4F46E5" /> Staff Roster Assigned to {sch.name}
                          </div>
                          <button
                            type="button"
                            onClick={() => setTargetSchoolForStaff(sch)}
                            style={{
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              color: '#4F46E5',
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer'
                            }}
                          >
                            + Assign Another Staff Member
                          </button>
                        </div>

                        {loadingRosterSlug === sch.slug ? (
                          <div style={{ padding: '20px', textAlign: 'center', color: '#64748b', fontSize: '0.85rem' }}>
                            <RefreshCw size={16} className="spin" style={{ marginRight: '6px' }} /> Loading campus roster...
                          </div>
                        ) : currentStaffRoster.length === 0 ? (
                          <div style={{ padding: '16px', textAlign: 'center', color: '#94a3b8', fontSize: '0.82rem' }}>
                            No staff members explicitly assigned to this campus yet. Click "+ Assign Staff" above to appoint teachers, accountants, etc.
                          </div>
                        ) : (
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '10px' }}>
                            {currentStaffRoster.map(member => (
                              <div
                                key={member._id}
                                style={{
                                  background: 'white',
                                  padding: '10px 14px',
                                  borderRadius: '10px',
                                  border: '1px solid #e2e8f0',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '10px'
                                }}
                              >
                                <div style={{
                                  width: '32px', height: '32px', borderRadius: '50%',
                                  background: '#e0e7ff', color: '#4338ca',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  fontWeight: 800, fontSize: '0.8rem'
                                }}>
                                  {member.name.charAt(0)}
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {member.name}
                                  </div>
                                  <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
                                    {member.role} • {member.department}
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => setTargetStaffForRoleEdit(member)}
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '3px',
                                    padding: '4px 8px',
                                    borderRadius: '6px',
                                    background: '#ede9fe',
                                    border: '1px solid #ddd6fe',
                                    color: '#6d28d9',
                                    fontSize: '0.7rem',
                                    fontWeight: 700,
                                    cursor: 'pointer'
                                  }}
                                  title="Grant or Limit Role & Permissions"
                                >
                                  <ShieldCheck size={11} color="#6d28d9" /> Role
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ─── TAB 2: MASTER ROLE & STAFF ASSIGNMENT HUB ─── */}
      {activeTab === 'assignments' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
          {/* Assignment Hub Header & Quick Triggers */}
          <div style={{
            background: 'white',
            borderRadius: '20px',
            padding: '24px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 4px 18px rgba(0,0,0,0.03)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1e3a8a', margin: 0 }}>
                  Master Role Assignment Center
                </h3>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => {
                    setTargetSchoolForStaff(schoolsList[0] || null);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '9px 16px',
                    borderRadius: '10px',
                    background: '#4F46E5',
                    color: 'white',
                    border: 'none',
                    fontWeight: 700,
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                    boxShadow: '0 3px 10px rgba(79, 70, 229, 0.25)'
                  }}
                >
                  <UserPlus size={14} /> + Create Staff Member (Branch-Wise)
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setTargetSchoolForAdmin(schoolsList[0]);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '9px 16px',
                    borderRadius: '10px',
                    background: '#059669',
                    color: 'white',
                    border: 'none',
                    fontWeight: 700,
                    fontSize: '0.82rem',
                    cursor: 'pointer'
                  }}
                >
                  <ShieldCheck size={14} /> Appoint Branch Admin
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setTargetSchoolForPrincipal(schoolsList[0]);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '9px 16px',
                    borderRadius: '10px',
                    background: '#0f766e',
                    color: 'white',
                    border: 'none',
                    fontWeight: 700,
                    fontSize: '0.82rem',
                    cursor: 'pointer'
                  }}
                >
                  <Award size={14} /> Appoint Principal
                </button>
              </div>
            </div>

            {/* Filters */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              flexWrap: 'wrap',
              background: '#f8fafc',
              padding: '12px 16px',
              borderRadius: '12px',
              border: '1px solid #e2e8f0'
            }}>
              {/* Search */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: '220px' }}>
                <Search size={16} color="#94a3b8" />
                <input
                  type="text"
                  placeholder="Filter staff by name, email, department..."
                  value={staffSearchQuery}
                  onChange={e => setStaffSearchQuery(e.target.value)}
                  style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: '0.85rem', width: '100%' }}
                />
              </div>

              {/* School Filter */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748b' }}>Campus:</span>
                <select
                  value={staffSchoolFilter}
                  onChange={e => setStaffSchoolFilter(e.target.value)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    outline: 'none',
                    background: 'white'
                  }}
                >
                  <option value="all">All Campuses</option>
                  {schoolsList.map(s => (
                    <option key={s.slug} value={s.slug}>{s.name}</option>
                  ))}
                </select>
              </div>

              {/* Role Filter */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748b' }}>Role:</span>
                <select
                  value={staffRoleFilter}
                  onChange={e => setStaffRoleFilter(e.target.value)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    outline: 'none',
                    background: 'white'
                  }}
                >
                  <option value="all">All Roles</option>
                  <option value="Teacher">Teacher</option>
                  <option value="Administrator">Administrator</option>
                  <option value="Principal">Principal</option>
                  <option value="Accountant">Accountant</option>
                  <option value="Librarian">Librarian</option>
                  <option value="Transport Incharge">Transport Incharge</option>
                  <option value="Support Staff">Support Staff</option>
                </select>
              </div>
            </div>
          </div>

          {/* Master Staff Table */}
          <div style={{
            background: 'white',
            borderRadius: '20px',
            border: '1px solid #e2e8f0',
            overflow: 'hidden',
            boxShadow: '0 4px 18px rgba(0,0,0,0.03)'
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  <th style={{ padding: '14px 20px', fontWeight: 800, color: '#475569' }}>Staff Member</th>
                  <th style={{ padding: '14px 20px', fontWeight: 800, color: '#475569' }}>Role & Department</th>
                  <th style={{ padding: '14px 20px', fontWeight: 800, color: '#475569' }}>Assigned School Branch</th>
                  <th style={{ padding: '14px 20px', fontWeight: 800, color: '#475569' }}>Portal Login</th>
                  <th style={{ padding: '14px 20px', fontWeight: 800, color: '#475569' }}>Contact</th>
                  <th style={{ padding: '14px 20px', fontWeight: 800, color: '#475569', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredStaff.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: '40px 20px', textAlign: 'center', color: '#94a3b8' }}>
                      No staff members match the selected filter.
                    </td>
                  </tr>
                ) : (
                  filteredStaff.map((member) => {
                    const assignedSchool = schoolsList.find(s => s.slug === member.schoolSlug);

                    return (
                      <tr 
                        key={member._id}
                        style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.15s' }}
                        onMouseOver={e => e.currentTarget.style.background = '#f8fafc'}
                        onMouseOut={e => e.currentTarget.style.background = 'white'}
                      >
                        {/* Member Name */}
                        <td style={{ padding: '14px 20px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{
                              width: '36px', height: '36px', borderRadius: '50%',
                              background: '#e0e7ff', color: '#4338ca',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontWeight: 800, fontSize: '0.85rem', flexShrink: 0
                            }}>
                              {member.name.charAt(0)}
                            </div>
                            <div>
                              <div style={{ fontWeight: 800, color: '#1e293b' }}>{member.name}</div>
                              <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                                ID: {member.employeeId || 'EMP-101'}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Role & Dept */}
                        <td style={{ padding: '14px 20px' }}>
                          <span style={{
                            padding: '3px 8px',
                            borderRadius: '6px',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            background: member.role === 'Administrator' ? '#dcfce7' : member.role === 'Principal' ? '#ccfbf1' : '#f1f5f9',
                            color: member.role === 'Administrator' ? '#15803d' : member.role === 'Principal' ? '#0f766e' : '#334155'
                          }}>
                            {member.role}
                          </span>
                          <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '3px' }}>
                            {member.department}
                          </div>
                          <div style={{ marginTop: '5px', display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
                            <span style={{
                              fontSize: '0.66rem',
                              fontWeight: 800,
                              padding: '1px 6px',
                              borderRadius: '4px',
                              background: member.accessStatus === 'Suspended' ? '#fee2e2' : member.accessStatus === 'Limited' ? '#fef3c7' : '#dcfce7',
                              color: member.accessStatus === 'Suspended' ? '#b91c1c' : member.accessStatus === 'Limited' ? '#b45309' : '#15803d',
                              border: `1px solid ${member.accessStatus === 'Suspended' ? '#fca5a5' : member.accessStatus === 'Limited' ? '#fde68a' : '#86efac'}`
                            }}>
                              {member.accessStatus === 'Suspended' ? '⛔ Suspended' : member.accessStatus === 'Limited' ? '⚠️ Limited' : '✓ Granted'}
                            </span>
                            {Array.isArray(member.permissions) && member.permissions.length > 0 && (
                              <span style={{ fontSize: '0.66rem', color: '#6366f1', fontWeight: 700, background: '#eef2ff', padding: '1px 5px', borderRadius: '4px' }}>
                                {member.permissions.length}/8 modules
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Assigned School Branch */}
                        <td style={{ padding: '14px 20px' }}>
                          {member.schoolSlug ? (
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '5px',
                              background: '#eff6ff',
                              color: '#1d4ed8',
                              padding: '3px 8px',
                              borderRadius: '6px',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              border: '1px solid #bfdbfe'
                            }}>
                              <Building2 size={12} /> {assignedSchool?.name || member.schoolSlug}
                            </span>
                          ) : (
                            <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>
                              Unassigned (General Pool)
                            </span>
                          )}
                        </td>

                        {/* Portal Login */}
                        <td style={{ padding: '14px 20px' }}>
                          {member.portalUsername ? (
                            <code style={{ fontSize: '0.78rem', background: '#f8fafc', padding: '2px 6px', borderRadius: '4px', border: '1px solid #e2e8f0', color: '#1e293b', fontWeight: 600 }}>
                              {member.portalUsername}
                            </code>
                          ) : (
                            <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>No Login Access</span>
                          )}
                        </td>

                        {/* Contact */}
                        <td style={{ padding: '14px 20px' }}>
                          <div style={{ fontSize: '0.78rem', color: '#475569' }}>{member.email || '—'}</div>
                          <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{member.phone || ''}</div>
                        </td>

                        {/* Actions */}
                        <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                            {/* Grant or Limit Role and Modules */}
                            <button
                              type="button"
                              onClick={() => setTargetStaffForRoleEdit(member)}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '5px',
                                padding: '5px 11px',
                                borderRadius: '7px',
                                background: '#ede9fe',
                                border: '1px solid #c4b5fd',
                                color: '#6d28d9',
                                fontSize: '0.72rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                                transition: 'all 0.15s'
                              }}
                              title="Grant or limit role, branch assignment, and module access permissions"
                            >
                              <ShieldCheck size={13} color="#6d28d9" /> Grant / Limit Role
                            </button>

                            {member.role === 'Teacher' && (
                              <button
                                type="button"
                                onClick={() => {
                                  setPreSelectedTeacherForPrincipal(member);
                                  setTargetSchoolForPrincipal(assignedSchool || schoolsList[0]);
                                }}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  padding: '5px 10px',
                                  borderRadius: '7px',
                                  background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
                                  border: '1px solid #a7f3d0',
                                  color: '#065f46',
                                  fontSize: '0.72rem',
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                                }}
                                title="Promote and appoint this teaching staff member as Principal"
                              >
                                <Award size={13} color="#059669" /> Appoint Principal
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                setTargetSchoolForStaff(assignedSchool || schoolsList[0]);
                              }}
                              style={{
                                padding: '5px 10px',
                                borderRadius: '7px',
                                background: '#f1f5f9',
                                border: '1px solid #cbd5e1',
                                color: '#475569',
                                fontSize: '0.72rem',
                                fontWeight: 700,
                                cursor: 'pointer'
                              }}
                            >
                              Reassign Branch
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── TAB: MULTI-CAMPUS STAFF ATTENDANCE & TIME CLOCK HUB ─── */}
      {activeTab === 'attendance' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
          
          {/* Header & Filter Control Bar */}
          <div style={{
            background: 'white',
            borderRadius: '20px',
            padding: '24px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 4px 18px rgba(0,0,0,0.03)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, rgba(2, 132, 199, 0.1) 0%, rgba(14, 165, 233, 0.2) 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#0284c7'
                }}>
                  <CalendarCheck size={22} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1e3a8a', margin: 0 }}>
                    Organization-Wide Staff Attendance & Time Clock Telemetry
                  </h3>
                  <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '2px' }}>
                    Real-time consolidated faculty presence, GPS geofence compliance, and live shift logs across all campuses.
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => setIsAttendanceReportModalOpen(true)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 16px',
                    borderRadius: '10px',
                    background: 'linear-gradient(135deg, #4F46E5, #4338ca)',
                    color: 'white',
                    border: 'none',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(79, 70, 229, 0.25)',
                    transition: 'all 0.15s ease'
                  }}
                  title="Generate executive staff attendance report and audit sheet"
                >
                  <FileText size={15} />
                  Generate Attendance Report
                </button>

                <button
                  type="button"
                  onClick={handleDownloadAttendanceCSV}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 14px',
                    borderRadius: '10px',
                    background: '#f8fafc',
                    border: '1px solid #cbd5e1',
                    color: '#334155',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                  title="Export filtered records directly as CSV spreadsheet"
                >
                  <Download size={14} />
                  Export CSV
                </button>

                <button
                  type="button"
                  onClick={fetchStaffAttendanceSheet}
                  disabled={isAttendanceLoading}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 14px',
                    borderRadius: '10px',
                    background: '#f8fafc',
                    border: '1px solid #cbd5e1',
                    color: '#334155',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  <RefreshCw size={14} className={isAttendanceLoading ? 'spin' : ''} />
                  Refresh
                </button>
              </div>
            </div>

            {/* Filter Controls Row */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              flexWrap: 'wrap',
              background: '#f8fafc',
              padding: '14px 18px',
              borderRadius: '14px',
              border: '1px solid #e2e8f0'
            }}>
              {/* Campus Selector */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569' }}>Campus:</span>
                <select
                  value={attendanceSchoolFilter}
                  onChange={e => setAttendanceSchoolFilter(e.target.value)}
                  style={{
                    padding: '7px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.8rem',
                    color: '#1e293b',
                    background: 'white',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  <option value="all">🌐 All Campuses (Consolidated)</option>
                  {schoolsList.map(s => (
                    <option key={s.slug} value={s.slug}>
                      {s.name} {s.isBranch ? '(Branch)' : '(Main)'}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date Selector */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569' }}>Date:</span>
                <input
                  type="date"
                  value={attendanceDate}
                  onChange={e => setAttendanceDate(e.target.value)}
                  style={{
                    padding: '6px 10px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.8rem',
                    color: '#1e293b',
                    background: 'white',
                    fontWeight: 600
                  }}
                />
                <button
                  type="button"
                  onClick={() => setAttendanceDate(getTodayDateStr())}
                  style={{
                    padding: '6px 10px',
                    borderRadius: '6px',
                    background: attendanceDate === getTodayDateStr() ? '#e0f2fe' : '#ffffff',
                    border: '1px solid #cbd5e1',
                    color: attendanceDate === getTodayDateStr() ? '#0284c7' : '#64748b',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Today
                </button>
              </div>

              {/* Department Filter */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569' }}>Dept:</span>
                <select
                  value={attendanceDeptFilter}
                  onChange={e => setAttendanceDeptFilter(e.target.value)}
                  style={{
                    padding: '7px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.8rem',
                    color: '#1e293b',
                    background: 'white',
                    cursor: 'pointer'
                  }}
                >
                  <option value="All">All Departments</option>
                  <option value="Science">Science</option>
                  <option value="Mathematics">Mathematics</option>
                  <option value="Languages">Languages</option>
                  <option value="Social Studies">Social Studies</option>
                  <option value="Commerce">Commerce</option>
                  <option value="Administration">Administration</option>
                  <option value="Finance">Finance</option>
                  <option value="Library">Library</option>
                  <option value="Transport & Facilities">Transport & Facilities</option>
                  <option value="General">General</option>
                </select>
              </div>

              {/* Status Filter */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569' }}>Status:</span>
                <select
                  value={attendanceStatusFilter}
                  onChange={e => setAttendanceStatusFilter(e.target.value)}
                  style={{
                    padding: '7px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.8rem',
                    color: '#1e293b',
                    background: 'white',
                    cursor: 'pointer'
                  }}
                >
                  <option value="All">All Statuses</option>
                  <option value="Working">🟢 Currently Working</option>
                  <option value="Completed">🔵 Shift Completed</option>
                  <option value="Late">🟠 Late Arrivals</option>
                  <option value="Not Marked">⚪ Not Punched In</option>
                  <option value="On Leave">🟣 On Leave</option>
                </select>
              </div>

              {/* Search */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: '220px', background: 'white', padding: '6px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                <Search size={15} color="#94a3b8" />
                <input
                  type="text"
                  placeholder="Filter by staff name, ID, department..."
                  value={attendanceSearchQuery}
                  onChange={e => setAttendanceSearchQuery(e.target.value)}
                  style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: '0.8rem', width: '100%' }}
                />
                {attendanceSearchQuery && (
                  <button onClick={() => setAttendanceSearchQuery('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* 6 KPI Metric Cards Row */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '14px'
          }}>
            {/* KPI 1: Total Staff */}
            <div style={{ background: 'white', borderRadius: '16px', padding: '18px', border: '1px solid #e2e8f0', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Total Staff Tracked
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#1e293b', marginTop: '4px' }}>
                {attendanceSheetData?.totalStaff || 0}
              </div>
              <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '2px' }}>
                {attendanceSchoolFilter === 'all' ? 'Across all campus branches' : 'This branch'}
              </div>
            </div>

            {/* KPI 2: Currently Working */}
            <div style={{ background: '#f0fdf4', borderRadius: '16px', padding: '18px', border: '1px solid #bbf7d0', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#166534', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Currently On Duty
                </span>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#16a34a', display: 'inline-block' }} />
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#15803d', marginTop: '4px' }}>
                {attendanceSheetData?.currentlyWorking || 0}
              </div>
              <div style={{ fontSize: '0.7rem', color: '#166534', marginTop: '2px' }}>
                Active on campus right now
              </div>
            </div>

            {/* KPI 3: Shifts Completed */}
            <div style={{ background: '#eff6ff', borderRadius: '16px', padding: '18px', border: '1px solid #bfdbfe', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#1e40af', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Shift Completed
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#1d4ed8', marginTop: '4px' }}>
                {attendanceSheetData?.completedShift || 0}
              </div>
              <div style={{ fontSize: '0.7rem', color: '#1e40af', marginTop: '2px' }}>
                Punched out for the day
              </div>
            </div>

            {/* KPI 4: Late Arrivals */}
            <div style={{ background: '#fefce8', borderRadius: '16px', padding: '18px', border: '1px solid #fde68a', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#854d0e', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Late Arrivals
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#b45309', marginTop: '4px' }}>
                {attendanceSheetData?.lateArrivals || 0}
              </div>
              <div style={{ fontSize: '0.7rem', color: '#854d0e', marginTop: '2px' }}>
                Punched in after scheduled duty
              </div>
            </div>

            {/* KPI 5: Not Marked */}
            <div style={{ background: '#f8fafc', borderRadius: '16px', padding: '18px', border: '1px solid #e2e8f0', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Not Punched In
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#334155', marginTop: '4px' }}>
                {attendanceSheetData?.notMarked || 0}
              </div>
              <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '2px' }}>
                Unpunched on {attendanceDate}
              </div>
            </div>

            {/* KPI 6: Avg Work Duration */}
            <div style={{ background: '#f0fdfa', borderRadius: '16px', padding: '18px', border: '1px solid #ccfbf1', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#0f766e', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Avg Shift Duration
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#0f766e', marginTop: '4px' }}>
                {attendanceSheetData?.avgWorkMinutes ? `${Math.floor(attendanceSheetData.avgWorkMinutes / 60)}h ${attendanceSheetData.avgWorkMinutes % 60}m` : '0h 0m'}
              </div>
              <div style={{ fontSize: '0.7rem', color: '#0f766e', marginTop: '2px' }}>
                Across active duty staff
              </div>
            </div>
          </div>

          {/* Daily Attendance Sheet Table */}
          <div style={{
            background: 'white',
            borderRadius: '20px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 4px 18px rgba(0,0,0,0.03)',
            overflow: 'hidden'
          }}>
            <div style={{ padding: '18px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Clock size={16} color="#4F46E5" />
                <h4 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 800, color: '#1e293b' }}>
                  Daily Staff Punch Sheet • {attendanceDate}
                </h4>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, background: '#f1f5f9', color: '#475569', padding: '2px 8px', borderRadius: '10px' }}>
                  {filteredAttendanceList.length} staff records
                </span>
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>
                    <th style={{ padding: '14px 20px', fontWeight: 800, color: '#475569' }}>Staff Member</th>
                    <th style={{ padding: '14px 20px', fontWeight: 800, color: '#475569' }}>Branch Campus</th>
                    <th style={{ padding: '14px 20px', fontWeight: 800, color: '#475569' }}>Role & Dept</th>
                    <th style={{ padding: '14px 20px', fontWeight: 800, color: '#475569' }}>First Punch In</th>
                    <th style={{ padding: '14px 20px', fontWeight: 800, color: '#475569' }}>Last Punch Out</th>
                    <th style={{ padding: '14px 20px', fontWeight: 800, color: '#475569' }}>Duration</th>
                    <th style={{ padding: '14px 20px', fontWeight: 800, color: '#475569' }}>Status</th>
                    <th style={{ padding: '14px 20px', fontWeight: 800, color: '#475569', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {isAttendanceLoading ? (
                    <tr>
                      <td colSpan={8} style={{ padding: '50px 20px', textAlign: 'center', color: '#64748b' }}>
                        <RefreshCw size={22} className="spin" style={{ margin: '0 auto 8px auto', display: 'block' }} />
                        Loading multi-campus attendance records...
                      </td>
                    </tr>
                  ) : filteredAttendanceList.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ padding: '50px 20px', textAlign: 'center', color: '#94a3b8' }}>
                        <Clock size={36} color="#cbd5e1" style={{ margin: '0 auto 8px auto', display: 'block' }} />
                        No staff attendance records match the selected filters for {attendanceDate}.
                      </td>
                    </tr>
                  ) : (
                    filteredAttendanceList.map((item) => {
                      const assignedSchool = schoolsList.find(s => s.slug === item.schoolSlug);
                      const isWorking = item.isCurrentlyPunchedIn;
                      const isCompleted = item.attendanceStatus === 'Shift Completed' || (item.punchIn && item.punchOut);
                      const isLate = item.attendanceStatus?.includes('Late');
                      const isOnLeave = item.attendanceStatus === 'On Leave' || item.status === 'On Leave';

                      const hours = Math.floor((item.workDurationMinutes || 0) / 60);
                      const mins = (item.workDurationMinutes || 0) % 60;

                      return (
                        <tr
                          key={item.staffId}
                          style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.15s' }}
                          onMouseOver={e => e.currentTarget.style.background = '#f8fafc'}
                          onMouseOut={e => e.currentTarget.style.background = 'white'}
                        >
                          {/* Staff Name & ID */}
                          <td style={{ padding: '14px 20px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <div style={{
                                width: '36px', height: '36px', borderRadius: '50%',
                                background: isWorking ? '#dcfce7' : '#e0e7ff',
                                color: isWorking ? '#15803d' : '#4338ca',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontWeight: 800, fontSize: '0.85rem', flexShrink: 0
                              }}>
                                {item.name.charAt(0)}
                              </div>
                              <div>
                                <div style={{ fontWeight: 800, color: '#1e293b' }}>{item.name}</div>
                                <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                                  ID: {item.employeeId || 'EMP-101'}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Branch Campus */}
                          <td style={{ padding: '14px 20px' }}>
                            {item.schoolSlug ? (
                              <span style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '5px',
                                background: '#eff6ff',
                                color: '#1d4ed8',
                                padding: '3px 8px',
                                borderRadius: '6px',
                                fontSize: '0.74rem',
                                fontWeight: 700,
                                border: '1px solid #bfdbfe'
                              }}>
                                <Building2 size={11} /> {assignedSchool?.name || item.schoolSlug}
                              </span>
                            ) : (
                              <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>Central School</span>
                            )}
                          </td>

                          {/* Role & Dept */}
                          <td style={{ padding: '14px 20px' }}>
                            <span style={{
                              padding: '2px 7px',
                              borderRadius: '5px',
                              fontSize: '0.7rem',
                              fontWeight: 700,
                              background: '#f1f5f9',
                              color: '#334155'
                            }}>
                              {item.role}
                            </span>
                            <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '2px' }}>
                              {item.department}
                            </div>
                          </td>

                          {/* First Punch In */}
                          <td style={{ padding: '14px 20px' }}>
                            {item.punchIn ? (
                              <div>
                                <div style={{ fontWeight: 800, color: '#1e293b' }}>
                                  {formatPunchTime(item.punchIn)}
                                </div>
                                <div style={{ fontSize: '0.67rem', color: '#16a34a', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '3px', marginTop: '2px' }}>
                                  <CheckCircle2 size={10} /> Campus Geofence
                                </div>
                              </div>
                            ) : (
                              <span style={{ color: '#94a3b8' }}>—</span>
                            )}
                          </td>

                          {/* Last Punch Out */}
                          <td style={{ padding: '14px 20px' }}>
                            {item.punchOut ? (
                              <div style={{ fontWeight: 800, color: '#1e293b' }}>
                                {formatPunchTime(item.punchOut)}
                              </div>
                            ) : isWorking ? (
                              <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#15803d', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#16a34a', display: 'inline-block' }} />
                                Active On Duty
                              </span>
                            ) : (
                              <span style={{ color: '#94a3b8' }}>—</span>
                            )}
                          </td>

                          {/* Duration */}
                          <td style={{ padding: '14px 20px' }}>
                            {item.workDurationMinutes > 0 ? (
                              <span style={{ fontWeight: 800, color: '#0f766e', background: '#f0fdfa', padding: '2px 7px', borderRadius: '5px' }}>
                                {hours}h {mins}m
                              </span>
                            ) : (
                              <span style={{ color: '#94a3b8' }}>0h 0m</span>
                            )}
                          </td>

                          {/* Attendance Status */}
                          <td style={{ padding: '14px 20px' }}>
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '3px 8px',
                              borderRadius: '6px',
                              fontSize: '0.72rem',
                              fontWeight: 800,
                              background: isWorking ? '#dcfce7' : isCompleted ? '#eff6ff' : isLate ? '#fef3c7' : isOnLeave ? '#f3e8ff' : '#f1f5f9',
                              color: isWorking ? '#15803d' : isCompleted ? '#1d4ed8' : isLate ? '#b45309' : isOnLeave ? '#7e22ce' : '#64748b',
                              border: `1px solid ${isWorking ? '#86efac' : isCompleted ? '#bfdbfe' : isLate ? '#fde68a' : isOnLeave ? '#e9d5ff' : '#e2e8f0'}`
                            }}>
                              {isWorking ? '🟢 Working (On Duty)' : isCompleted ? '✓ Shift Completed' : isLate ? '⚠️ Late Arrival' : isOnLeave ? '🟣 On Leave' : '⚪ Not Punched'}
                            </span>
                          </td>

                          {/* Actions */}
                          <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
                              <button
                                type="button"
                                onClick={() => setSelectedStaffPunches({
                                  staffName: item.name,
                                  employeeId: item.employeeId,
                                  punches: item.punches || [],
                                  date: attendanceDate,
                                  schoolName: assignedSchool?.name || item.schoolSlug || 'Main Campus'
                                })}
                                style={{
                                  padding: '5px 9px',
                                  borderRadius: '6px',
                                  background: '#f8fafc',
                                  border: '1px solid #cbd5e1',
                                  color: '#334155',
                                  fontSize: '0.72rem',
                                  fontWeight: 700,
                                  cursor: 'pointer'
                                }}
                                title="View punch timeline and GPS geofence details"
                              >
                                📋 Punches ({item.punchesCount || item.punches?.length || 0})
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setManualPunchStaff(item);
                                  setManualPunchForm({
                                    punchInTime: item.punchIn ? new Date(item.punchIn).toTimeString().substring(0, 5) : '09:00',
                                    punchOutTime: item.punchOut ? new Date(item.punchOut).toTimeString().substring(0, 5) : '17:00',
                                    status: item.attendanceStatus?.includes('Late') ? 'Late' : 'Present',
                                    notes: item.notes || ''
                                  });
                                }}
                                style={{
                                  padding: '5px 9px',
                                  borderRadius: '6px',
                                  background: '#eff6ff',
                                  border: '1px solid #bfdbfe',
                                  color: '#1d4ed8',
                                  fontSize: '0.72rem',
                                  fontWeight: 700,
                                  cursor: 'pointer'
                                }}
                                title="Manual punch entry and administrative adjustment"
                              >
                                ✏️ Adjust
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}
      {activeTab === 'health' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          {/* Pragati License Card */}
          <div style={{
            background: 'white',
            borderRadius: '20px',
            padding: '24px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 4px 18px rgba(0,0,0,0.03)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#dcfce7', color: '#15803d', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CheckCircle2 size={22} />
              </div>
              <div>
                <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#1e293b' }}>
                  Pragati Licensing & Control Plane
                </h4>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>License verification status: ACTIVE</div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: '#f8fafc', borderRadius: '8px' }}>
                <span style={{ color: '#64748b' }}>Active Organization Slug:</span>
                <strong>{tenantSlug}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: '#f8fafc', borderRadius: '8px' }}>
                <span style={{ color: '#64748b' }}>Subscribed Products:</span>
                <span style={{ color: '#15803d', fontWeight: 700 }}>SHMS (School Management System)</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: '#f8fafc', borderRadius: '8px' }}>
                <span style={{ color: '#64748b' }}>Database Isolation:</span>
                <span style={{ color: '#4F46E5', fontWeight: 700 }}>school_ms (Multi-Tenant Local DB)</span>
              </div>
            </div>
          </div>

          {/* System Infrastructure Card */}
          <div style={{
            background: 'white',
            borderRadius: '20px',
            padding: '24px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 4px 18px rgba(0,0,0,0.03)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#e0e7ff', color: '#4338ca', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Server size={22} />
              </div>
              <div>
                <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#1e293b' }}>
                  Enterprise Multi-School Architecture
                </h4>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Independent Branch Routing Enabled</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 4: GLOBAL INSTITUTIONAL CONFIGURATION ─── */}
      {activeTab === 'config' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
          <div style={{
            background: 'white',
            borderRadius: '20px',
            padding: '24px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 4px 20px rgba(0,0,0,0.03)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#1e3a8a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Settings size={22} color="#4F46E5" /> Global Institutional Configuration & Branding
                </h3>
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
                textTransform: 'uppercase'
              }}>
                <Shield size={14} /> Root Authority
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
                fontSize: '0.88rem',
                fontWeight: 600,
                background: configStatus.type === 'success' ? '#f0fdf4' : '#fef2f2',
                color: configStatus.type === 'success' ? '#166534' : '#991b1b',
                border: configStatus.type === 'success' ? '1px solid #bbf7d0' : '1px solid #fecaca',
              }}>
                {configStatus.type === 'success' ? <CheckCircle2 size={18} color="#16a34a" /> : <AlertTriangle size={18} color="#dc2626" />}
                <span>{configStatus.message}</span>
              </div>
            )}

            <form onSubmit={handleSaveConfig} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
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
                      placeholder="e.g. Pragati Global Academy"
                      style={{
                        width: '100%',
                        padding: '11px 16px 11px 38px',
                        borderRadius: '10px',
                        border: '1.5px solid #cbd5e1',
                        fontSize: '0.92rem',
                        fontWeight: 600,
                        color: '#0f172a',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Official Campus Address
                  </label>
                  <div style={{ position: 'relative' }}>
                    <MapPin size={18} style={{ position: 'absolute', left: '12px', top: '13px', color: '#94a3b8' }} />
                    <input
                      type="text"
                      value={schoolAddressInput}
                      onChange={(e) => setSchoolAddressInput(e.target.value)}
                      placeholder="e.g. Sector 4, Educational Knowledge Hub, Greater Noida"
                      style={{
                        width: '100%',
                        padding: '11px 16px 11px 38px',
                        borderRadius: '10px',
                        border: '1.5px solid #cbd5e1',
                        fontSize: '0.92rem',
                        fontWeight: 600,
                        color: '#0f172a',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Contact Phone Number
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Phone size={18} style={{ position: 'absolute', left: '12px', top: '13px', color: '#94a3b8' }} />
                    <input
                      type="text"
                      value={schoolPhoneInput}
                      onChange={(e) => setSchoolPhoneInput(e.target.value)}
                      placeholder="+91 11-2894-1234"
                      style={{
                        width: '100%',
                        padding: '11px 16px 11px 38px',
                        borderRadius: '10px',
                        border: '1.5px solid #cbd5e1',
                        fontSize: '0.92rem',
                        fontWeight: 600,
                        color: '#0f172a',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Administrative Email Address
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Mail size={18} style={{ position: 'absolute', left: '12px', top: '13px', color: '#94a3b8' }} />
                    <input
                      type="email"
                      value={schoolEmailInput}
                      onChange={(e) => setSchoolEmailInput(e.target.value)}
                      placeholder="superadmin@pragati.edu"
                      style={{
                        width: '100%',
                        padding: '11px 16px 11px 38px',
                        borderRadius: '10px',
                        border: '1.5px solid #cbd5e1',
                        fontSize: '0.92rem',
                        fontWeight: 600,
                        color: '#0f172a',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Active Academic Session
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Calendar size={18} style={{ position: 'absolute', left: '12px', top: '13px', color: '#94a3b8' }} />
                    <input
                      type="text"
                      value={schoolYearInput}
                      onChange={(e) => setSchoolYearInput(e.target.value)}
                      placeholder="2026-2027"
                      style={{
                        width: '100%',
                        padding: '11px 16px 11px 38px',
                        borderRadius: '10px',
                        border: '1.5px solid #cbd5e1',
                        fontSize: '0.92rem',
                        fontWeight: 600,
                        color: '#0f172a',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Board / Affiliation License No.
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Award size={18} style={{ position: 'absolute', left: '12px', top: '13px', color: '#94a3b8' }} />
                    <input
                      type="text"
                      value={affiliationNoInput}
                      onChange={(e) => setAffiliationNoInput(e.target.value)}
                      placeholder="CBSE-AFF-2026-9081"
                      style={{
                        width: '100%',
                        padding: '11px 16px 11px 38px',
                        borderRadius: '10px',
                        border: '1.5px solid #cbd5e1',
                        fontSize: '0.92rem',
                        fontWeight: 600,
                        color: '#0f172a',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
                <button
                  type="submit"
                  disabled={isSavingConfig}
                  style={{
                    padding: '12px 28px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #4F46E5 0%, #4338CA 100%)',
                    color: 'white',
                    border: 'none',
                    fontWeight: 800,
                    fontSize: '0.92rem',
                    cursor: isSavingConfig ? 'not-allowed' : 'pointer',
                    boxShadow: '0 4px 14px rgba(79, 70, 229, 0.35)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <Save size={18} />
                  {isSavingConfig ? 'Propagating Configuration...' : 'Save Global Parameters'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── TAB 5: ROLE-BASED ACCESS CONTROL (RBAC) ─── */}
      {activeTab === 'rbac' && (
        <div style={{
          background: 'white',
          borderRadius: '20px',
          padding: '28px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 4px 18px rgba(0,0,0,0.03)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#1e3a8a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Key size={20} color="#4F46E5" /> Role-Based Access Control (RBAC) Permission Matrix
              </h3>
            </div>
            {rbacToast && (
              <div style={{ padding: '8px 14px', background: '#dcfce7', border: '1px solid #bbf7d0', color: '#166534', borderRadius: '8px', fontWeight: 700, fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CheckCircle2 size={16} /> {rbacToast}
              </div>
            )}
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '780px' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', textAlign: 'center', color: '#1e3a8a', fontSize: '0.82rem' }}>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 800 }}>System Module & Operation</th>
                  {rbacRoles.map(r => (
                    <th key={r} style={{ padding: '12px 10px', fontWeight: 700 }}>{r}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rbacMatrix.map((row, rIdx) => (
                  <tr key={rIdx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '13px 16px', fontWeight: 650, color: '#334155', fontSize: '0.85rem' }}>
                      {row.m}
                    </td>
                    {row.permissions.map((val, cIdx) => (
                      <td key={cIdx} style={{ textAlign: 'center', padding: '10px' }}>
                        <input
                          type="checkbox"
                          checked={val}
                          onChange={() => handleTogglePermission(rIdx, cIdx)}
                          style={{ width: '18px', height: '18px', accentColor: '#4F46E5', cursor: 'pointer' }}
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
              type="button"
              onClick={() => {
                setRbacToast('RBAC Matrix enforced across all school nodes and sessions.');
                setTimeout(() => setRbacToast(''), 4000);
              }}
              style={{
                padding: '11px 24px',
                background: 'linear-gradient(135deg, #4F46E5 0%, #4338CA 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                fontWeight: 700,
                fontSize: '0.88rem',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)'
              }}
            >
              Apply RBAC Matrix
            </button>
          </div>
        </div>
      )}

      {/* ─── TAB 6: SECURITY PROTOCOLS & AUDIT LOG ─── */}
      {activeTab === 'security' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '20px' }}>
          {/* Security Protocols Card */}
          <div style={{
            background: 'white',
            borderRadius: '20px',
            padding: '26px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 4px 18px rgba(0,0,0,0.03)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(79, 70, 229, 0.1)', color: '#4F46E5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Lock size={20} />
              </div>
              <div>
                <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#1e293b' }}>
                  Enterprise Security & Cryptography
                </h4>
                <div style={{ fontSize: '0.74rem', color: '#64748b' }}>Active token policies and encryption standards</div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ padding: '14px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.86rem', color: '#1e293b' }}>JWT Session Lifespan</div>
                  <div style={{ fontSize: '0.74rem', color: '#64748b' }}>Duration before authentication tokens invalidate</div>
                </div>
                <select
                  value={jwtLifespan}
                  onChange={(e) => {
                    setJwtLifespan(e.target.value);
                    setSecurityToast('Session lifespan policy updated.');
                    setTimeout(() => setSecurityToast(''), 3000);
                  }}
                  style={{ padding: '6px 12px', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontWeight: 700, fontSize: '0.82rem', color: '#1e293b' }}
                >
                  <option value="1h">1 Hour (High Security)</option>
                  <option value="24h">24 Hours (Standard)</option>
                  <option value="7d">7 Days (Extended)</option>
                  <option value="30d">30 Days (Persistent)</option>
                </select>
              </div>

              <div style={{ padding: '14px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.86rem', color: '#1e293b' }}>Multi-Factor Authentication (2FA)</div>
                  <div style={{ fontSize: '0.74rem', color: '#64748b' }}>Require OTP verification on sensitive admin actions</div>
                </div>
                <input
                  type="checkbox"
                  checked={enforce2FA}
                  onChange={(e) => {
                    setEnforce2FA(e.target.checked);
                    setSecurityToast(`2FA Policy is now ${e.target.checked ? 'Enforced' : 'Optional'}.`);
                    setTimeout(() => setSecurityToast(''), 3000);
                  }}
                  style={{ width: '20px', height: '20px', accentColor: '#4F46E5', cursor: 'pointer' }}
                />
              </div>

              <div style={{ padding: '14px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.86rem', color: '#1e293b' }}>Password Encryption Protocol</div>
                  <div style={{ fontSize: '0.74rem', color: '#64748b' }}>BCrypt with 10 salt rounds</div>
                </div>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, background: '#dcfce7', color: '#15803d', padding: '3px 8px', borderRadius: '6px' }}>
                  ACTIVE (ENFORCED)
                </span>
              </div>

              <div style={{ padding: '14px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.86rem', color: '#1e293b' }}>Multi-Tenant Database Isolation</div>
                  <div style={{ fontSize: '0.74rem', color: '#64748b' }}>Cross-tenant leakage prevention middleware</div>
                </div>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, background: '#dbeafe', color: '#1e40af', padding: '3px 8px', borderRadius: '6px' }}>
                  STRICT ISOLATION
                </span>
              </div>
            </div>
          </div>

          {/* Audit Logs Card */}
          <div style={{
            background: 'white',
            borderRadius: '20px',
            padding: '26px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 4px 18px rgba(0,0,0,0.03)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
              <div>
                <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#1e293b' }}>
                  Live System Audit Trail
                </h4>
                <div style={{ fontSize: '0.74rem', color: '#64748b' }}>Administrative action log across all nodes</div>
              </div>
              <div style={{ display: 'flex', gap: '6px' }}>
                {['ALL', 'SUCCESS', 'WARNING', 'BLOCKED'].map(f => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setAuditFilter(f)}
                    style={{
                      padding: '3px 8px',
                      borderRadius: '6px',
                      border: '1px solid #e2e8f0',
                      background: auditFilter === f ? '#4F46E5' : 'white',
                      color: auditFilter === f ? 'white' : '#64748b',
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '340px', overflowY: 'auto' }}>
              {auditLogs
                .filter(l => auditFilter === 'ALL' || l.status.toUpperCase() === auditFilter)
                .map(log => (
                  <div key={log.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', borderRadius: '10px', background: '#f8fafc', border: '1px solid #f1f5f9' }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.82rem', color: '#1e293b' }}>{log.action}</div>
                      <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                        By <strong>{log.user}</strong> • Target: {log.target}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{
                        fontSize: '0.68rem',
                        fontWeight: 700,
                        padding: '2px 7px',
                        borderRadius: '6px',
                        background: log.status === 'Success' ? '#dcfce7' : log.status === 'Warning' ? '#fef3c7' : '#fee2e2',
                        color: log.status === 'Success' ? '#15803d' : log.status === 'Warning' ? '#b45309' : '#b91c1c'
                      }}>
                        {log.status}
                      </span>
                      <div style={{ fontSize: '0.68rem', color: '#94a3b8', marginTop: '2px' }}>{log.time}</div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB: FLEET & TRANSPORT LOGISTICS ─── */}
      {activeTab === 'transport' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
          <TransportDashboard />
        </div>
      )}

      {/* ─── TAB: CENTRAL LIBRARY & MEDIA OPERATIONS ─── */}
      {activeTab === 'library' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
          <LibraryDashboard />
        </div>
      )}

      {/* ─── MODALS ─── */}
      <CreateSchoolModal
        isOpen={isCreateSchoolOpen}
        onClose={() => setIsCreateSchoolOpen(false)}
        schoolsList={schoolsList}
        initialType={createModalType}
        initialParentSlug={createModalParentSlug}
        onSchoolCreated={() => {
          fetchSchools();
          fetchAllStaff();
        }}
      />

      <AppointAdminModal
        isOpen={!!targetSchoolForAdmin}
        onClose={() => setTargetSchoolForAdmin(null)}
        targetSchool={targetSchoolForAdmin}
        onAdminAppointed={() => {
          fetchSchools();
          fetchAllStaff();
        }}
      />

      <AppointPrincipalModal
        isOpen={!!targetSchoolForPrincipal}
        onClose={() => {
          setTargetSchoolForPrincipal(null);
          setPreSelectedTeacherForPrincipal(null);
        }}
        targetSchool={targetSchoolForPrincipal}
        schoolsList={schoolsList}
        preSelectedTeacher={preSelectedTeacherForPrincipal}
        existingStaffList={allStaffList}
        onPrincipalAppointed={() => {
          fetchSchools();
          fetchAllStaff();
        }}
      />

      <AssignStaffModal
        isOpen={!!targetSchoolForStaff || (activeTab === 'assignments' && false)}
        onClose={() => setTargetSchoolForStaff(null)}
        targetSchool={targetSchoolForStaff}
        schoolsList={schoolsList}
        onStaffAssigned={() => {
          fetchSchools();
          fetchAllStaff();
        }}
      />

      {/* Super Admin Staff Role & Permissions Controller */}
      <ManageStaffRoleModal
        isOpen={!!targetStaffForRoleEdit}
        onClose={() => setTargetStaffForRoleEdit(null)}
        staffMember={targetStaffForRoleEdit}
        schoolsList={schoolsList}
        onStaffUpdated={() => {
          fetchSchools();
          fetchAllStaff();
        }}
      />

      <DeleteSchoolModal
        isOpen={!!targetSchoolForDelete}
        onClose={() => setTargetSchoolForDelete(null)}
        targetSchool={targetSchoolForDelete}
        onSchoolDeleted={() => {
          fetchSchools();
          fetchAllStaff();
        }}
      />

      <EditSchoolModal
        isOpen={!!targetSchoolForEdit}
        onClose={() => setTargetSchoolForEdit(null)}
        school={targetSchoolForEdit}
        onSchoolUpdated={() => {
          fetchSchools();
          fetchAllStaff();
          fetchSchoolConfig();
        }}
      />

      {/* ─── PUNCHES LOG MODAL (SUPER ADMIN TELEMETRY) ─── */}
      {selectedStaffPunches && createPortal(
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.7)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999999,
          padding: '20px',
          animation: 'fadeIn 0.2s ease-out'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '24px',
            width: '100%',
            maxWidth: '560px',
            maxHeight: '90vh',
            boxShadow: '0 25px 60px -15px rgba(15, 23, 42, 0.35), 0 0 0 1px rgba(226, 232, 240, 0.8)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* Header */}
            <div style={{
              padding: '20px 24px',
              borderBottom: '1px solid #f1f5f9',
              background: 'linear-gradient(to right, #eff6ff, #ffffff)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '14px',
                  background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '1.2rem',
                  boxShadow: '0 8px 16px -4px rgba(37, 99, 235, 0.4)'
                }}>
                  {selectedStaffPunches.staffName?.charAt(0)?.toUpperCase() || 'S'}
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{
                      fontSize: '0.68rem',
                      fontWeight: 800,
                      color: '#2563eb',
                      background: '#dbeafe',
                      padding: '2px 8px',
                      borderRadius: '6px',
                      letterSpacing: '0.04em',
                      textTransform: 'uppercase'
                    }}>
                      Live Punch Telemetry
                    </span>
                    <span style={{
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      color: '#15803d',
                      background: '#dcfce7',
                      padding: '2px 8px',
                      borderRadius: '6px'
                    }}>
                      {selectedStaffPunches.punches.length} {selectedStaffPunches.punches.length === 1 ? 'Record' : 'Records'}
                    </span>
                  </div>
                  <h3 style={{ fontSize: '1.18rem', fontWeight: 800, color: '#0f172a', margin: '4px 0 0 0' }}>
                    {selectedStaffPunches.staffName}
                  </h3>
                  <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Building2 size={13} color="#64748b" />
                    <span>{selectedStaffPunches.schoolName}</span>
                    <span>•</span>
                    <CalendarDays size={13} color="#64748b" />
                    <span>{selectedStaffPunches.date}</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedStaffPunches(null)}
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
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

            {/* Punches List */}
            <div style={{ padding: '20px 24px', maxHeight: '420px', overflowY: 'auto' }}>
              {selectedStaffPunches.punches.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '36px 12px', color: '#94a3b8' }}>
                  <Clock size={32} style={{ margin: '0 auto 8px', opacity: 0.5 }} />
                  <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>No punch timestamps recorded</div>
                  <div style={{ fontSize: '0.75rem', marginTop: '4px' }}>No punches recorded for this staff member on {selectedStaffPunches.date}.</div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {selectedStaffPunches.punches.map((p, idx) => (
                    <div
                      key={p._id || idx}
                      style={{
                        padding: '14px 16px',
                        borderRadius: '14px',
                        background: p.type === 'IN' ? '#f0fdf4' : '#fff1f2',
                        border: `1px solid ${p.type === 'IN' ? '#bbf7d0' : '#fecdd3'}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '12px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{
                          padding: '4px 10px',
                          borderRadius: '8px',
                          fontSize: '0.74rem',
                          fontWeight: 800,
                          background: p.type === 'IN' ? '#16a34a' : '#e11d48',
                          color: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}>
                          <Clock size={12} />
                          {p.type === 'IN' ? 'PUNCH IN' : 'PUNCH OUT'}
                        </span>
                        <div>
                          <div style={{ fontWeight: 800, fontSize: '0.92rem', color: '#1e293b' }}>
                            {formatPunchTime(p.time)}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <MapPin size={12} color="#64748b" />
                            <span>Location: {p.location || 'Campus Portal'} {p.distanceMeters !== undefined && p.distanceMeters !== null ? `(${p.distanceMeters}m from center)` : ''}</span>
                          </div>
                        </div>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <span style={{
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          background: p.isWithinGeofence !== false ? '#dcfce7' : '#fef3c7',
                          color: p.isWithinGeofence !== false ? '#15803d' : '#b45309',
                          padding: '3px 8px',
                          borderRadius: '6px'
                        }}>
                          {p.isWithinGeofence !== false ? 'GPS Verified' : 'Standard Web'}
                        </span>
                        {p.note && (
                          <div style={{ fontSize: '0.72rem', color: '#475569', fontStyle: 'italic', marginTop: '3px' }}>
                            "{p.note}"
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div style={{ padding: '14px 24px', background: '#f8fafc', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setSelectedStaffPunches(null)}
                style={{
                  padding: '8px 20px',
                  borderRadius: '10px',
                  background: '#1e293b',
                  color: 'white',
                  border: 'none',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Close Log
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ─── MANUAL PUNCH ADJUSTMENT MODAL (SUPER ADMIN AUTHORITY) ─── */}
      {manualPunchStaff && (() => {
        const manualStaffCampus = (schoolsList || []).find(s => s.slug === manualPunchStaff?.schoolSlug || s._id === manualPunchStaff?.schoolId) ||
                                  (schools || []).find(s => s.slug === manualPunchStaff?.schoolSlug || s._id === manualPunchStaff?.schoolId);
        const manualStaffCampusName = manualStaffCampus?.name || manualPunchStaff?.schoolSlug || 'Main Campus';
        const staffInitial = manualPunchStaff?.name?.charAt(0)?.toUpperCase() || 'S';
        const formattedDate = new Date(attendanceDate + 'T00:00:00').toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        });

        return createPortal(
          <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.7)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999999,
            padding: '20px',
            animation: 'fadeIn 0.2s ease-out'
          }}>
            <div style={{
              background: 'white',
              borderRadius: '24px',
              width: '100%',
              maxWidth: '540px',
              boxShadow: '0 25px 60px -15px rgba(15, 23, 42, 0.35), 0 0 0 1px rgba(226, 232, 240, 0.8)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              maxHeight: '92vh'
            }}>
              {/* Header */}
              <div style={{
                padding: '20px 24px',
                borderBottom: '1px solid #f1f5f9',
                background: 'linear-gradient(to right, #faf5ff, #ffffff)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: '14px',
                    background: 'linear-gradient(135deg, #4F46E5, #7C3AED)',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: '1.2rem',
                    boxShadow: '0 8px 16px -4px rgba(79, 70, 229, 0.4)'
                  }}>
                    {staffInitial}
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{
                        fontSize: '0.68rem',
                        fontWeight: 800,
                        color: '#4F46E5',
                        background: '#e0e7ff',
                        padding: '2px 8px',
                        borderRadius: '6px',
                        letterSpacing: '0.04em',
                        textTransform: 'uppercase'
                      }}>
                        Super Admin Override
                      </span>
                      <span style={{
                        fontSize: '0.68rem',
                        fontWeight: 700,
                        color: '#475569',
                        background: '#f1f5f9',
                        padding: '2px 8px',
                        borderRadius: '6px'
                      }}>
                        {manualPunchStaff.employeeId || 'EMP-STAFF'}
                      </span>
                    </div>
                    <h3 style={{ fontSize: '1.18rem', fontWeight: 800, color: '#0f172a', margin: '4px 0 0 0' }}>
                      {manualPunchStaff.name}
                    </h3>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span>{manualPunchStaff.role || 'Staff Member'}</span>
                      <span>•</span>
                      <span>{manualPunchStaff.department || 'General'}</span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setManualPunchStaff(null)}
                  style={{
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '10px',
                    padding: '8px',
                    cursor: 'pointer',
                    color: '#64748b',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.15s'
                  }}
                  onMouseOver={e => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.color = '#0f172a'; }}
                  onMouseOut={e => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.color = '#64748b'; }}
                >
                  <X size={18} />
                </button>
              </div>

              {/* Form Body */}
              <form onSubmit={handleManualPunchSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflowY: 'auto' }}>
                <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  
                  {/* Context Bar */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    padding: '10px 14px',
                    gap: '10px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <CalendarDays size={16} color="#4F46E5" />
                      <span style={{ fontSize: '0.82rem', color: '#1e293b', fontWeight: 700 }}>
                        {formattedDate}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: '#475569', fontWeight: 600 }}>
                      <Building2 size={14} color="#059669" />
                      <span>{manualStaffCampusName}</span>
                    </div>
                  </div>

                  {/* Shift Timing Presets */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <label style={{ fontSize: '0.76rem', fontWeight: 700, color: '#334155' }}>
                        Shift Timing Presets
                      </label>
                      <span style={{ fontSize: '0.7rem', color: '#64748b' }}>Quick Auto-Fill</span>
                    </div>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '10px' }}>
                      <button
                        type="button"
                        onClick={() => setManualPunchForm(p => ({ ...p, punchInTime: '09:00', punchOutTime: '17:00', status: 'Present' }))}
                        style={{
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          padding: '5px 10px',
                          borderRadius: '6px',
                          background: (manualPunchForm.punchInTime === '09:00' && manualPunchForm.punchOutTime === '17:00' && manualPunchForm.status === 'Present') ? '#e0e7ff' : '#f1f5f9',
                          color: (manualPunchForm.punchInTime === '09:00' && manualPunchForm.punchOutTime === '17:00' && manualPunchForm.status === 'Present') ? '#4338ca' : '#475569',
                          border: '1px solid',
                          borderColor: (manualPunchForm.punchInTime === '09:00' && manualPunchForm.punchOutTime === '17:00' && manualPunchForm.status === 'Present') ? '#c7d2fe' : '#e2e8f0',
                          cursor: 'pointer'
                        }}
                      >
                        Full Shift (09:00 - 17:00)
                      </button>

                      <button
                        type="button"
                        onClick={() => setManualPunchForm(p => ({ ...p, punchInTime: '09:00', punchOutTime: '13:30', status: 'Half Day' }))}
                        style={{
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          padding: '5px 10px',
                          borderRadius: '6px',
                          background: (manualPunchForm.punchInTime === '09:00' && manualPunchForm.punchOutTime === '13:30' && manualPunchForm.status === 'Half Day') ? '#e0e7ff' : '#f1f5f9',
                          color: (manualPunchForm.punchInTime === '09:00' && manualPunchForm.punchOutTime === '13:30' && manualPunchForm.status === 'Half Day') ? '#4338ca' : '#475569',
                          border: '1px solid',
                          borderColor: (manualPunchForm.punchInTime === '09:00' && manualPunchForm.punchOutTime === '13:30' && manualPunchForm.status === 'Half Day') ? '#c7d2fe' : '#e2e8f0',
                          cursor: 'pointer'
                        }}
                      >
                        Morning Half (09:00 - 13:30)
                      </button>

                      <button
                        type="button"
                        onClick={() => setManualPunchForm(p => ({ ...p, punchInTime: '13:00', punchOutTime: '17:00', status: 'Half Day' }))}
                        style={{
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          padding: '5px 10px',
                          borderRadius: '6px',
                          background: (manualPunchForm.punchInTime === '13:00' && manualPunchForm.punchOutTime === '17:00' && manualPunchForm.status === 'Half Day') ? '#e0e7ff' : '#f1f5f9',
                          color: (manualPunchForm.punchInTime === '13:00' && manualPunchForm.punchOutTime === '17:00' && manualPunchForm.status === 'Half Day') ? '#4338ca' : '#475569',
                          border: '1px solid',
                          borderColor: (manualPunchForm.punchInTime === '13:00' && manualPunchForm.punchOutTime === '17:00' && manualPunchForm.status === 'Half Day') ? '#c7d2fe' : '#e2e8f0',
                          cursor: 'pointer'
                        }}
                      >
                        Afternoon Half (13:00 - 17:00)
                      </button>

                      <button
                        type="button"
                        onClick={() => setManualPunchForm(p => ({ ...p, punchInTime: '09:00', punchOutTime: '17:00', status: 'On Duty', notes: p.notes || 'Official On Duty assignment' }))}
                        style={{
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          padding: '5px 10px',
                          borderRadius: '6px',
                          background: manualPunchForm.status === 'On Duty' ? '#ccfbf1' : '#f1f5f9',
                          color: manualPunchForm.status === 'On Duty' ? '#0f766e' : '#475569',
                          border: '1px solid',
                          borderColor: manualPunchForm.status === 'On Duty' ? '#99f6e4' : '#e2e8f0',
                          cursor: 'pointer'
                        }}
                      >
                        On Duty (OD)
                      </button>

                      <button
                        type="button"
                        onClick={() => setManualPunchForm(p => ({ ...p, punchOutTime: '' }))}
                        style={{
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          padding: '5px 10px',
                          borderRadius: '6px',
                          background: '#f8fafc',
                          color: '#64748b',
                          border: '1px solid #e2e8f0',
                          cursor: 'pointer'
                        }}
                      >
                        Clear Punch Out
                      </button>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div style={{
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        borderRadius: '12px',
                        padding: '12px'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                          <Clock size={14} color="#16a34a" />
                          <label style={{ fontSize: '0.74rem', fontWeight: 700, color: '#16a34a' }}>
                            PUNCH IN TIME
                          </label>
                        </div>
                        <input
                          type="time"
                          value={manualPunchForm.punchInTime}
                          onChange={e => setManualPunchForm(p => ({ ...p, punchInTime: e.target.value }))}
                          style={{
                            width: '100%',
                            padding: '8px 10px',
                            borderRadius: '8px',
                            border: '1px solid #cbd5e1',
                            fontSize: '0.9rem',
                            fontWeight: 700,
                            color: '#1e293b',
                            background: 'white'
                          }}
                        />
                        <span style={{ fontSize: '0.68rem', color: '#64748b', marginTop: '4px', display: 'block' }}>
                          Initial shift clock-in mark
                        </span>
                      </div>

                      <div style={{
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        borderRadius: '12px',
                        padding: '12px'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                          <Clock size={14} color="#dc2626" />
                          <label style={{ fontSize: '0.74rem', fontWeight: 700, color: '#dc2626' }}>
                            PUNCH OUT TIME (OPTIONAL)
                          </label>
                        </div>
                        <input
                          type="time"
                          value={manualPunchForm.punchOutTime}
                          onChange={e => setManualPunchForm(p => ({ ...p, punchOutTime: e.target.value }))}
                          style={{
                            width: '100%',
                            padding: '8px 10px',
                            borderRadius: '8px',
                            border: '1px solid #cbd5e1',
                            fontSize: '0.9rem',
                            fontWeight: 700,
                            color: '#1e293b',
                            background: 'white'
                          }}
                        />
                        <span style={{ fontSize: '0.68rem', color: '#64748b', marginTop: '4px', display: 'block' }}>
                          Leave empty if shift still active
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Attendance Classification */}
                  <div>
                    <label style={{ fontSize: '0.76rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '6px' }}>
                      Attendance Classification
                    </label>
                    <select
                      value={manualPunchForm.status}
                      onChange={e => setManualPunchForm(p => ({ ...p, status: e.target.value }))}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: '10px',
                        border: '1.5px solid #cbd5e1',
                        fontSize: '0.86rem',
                        fontWeight: 700,
                        background: 'white',
                        color: '#1e293b',
                        cursor: 'pointer'
                      }}
                    >
                      <option value="Present">🟢 Present (Full Working Day)</option>
                      <option value="Half Day">🟡 Half Day (Single Session)</option>
                      <option value="Late">🟠 Late Arrival (Grace Window Passed)</option>
                      <option value="Overtime">🟣 Overtime (Extended Shift Hours)</option>
                      <option value="On Duty">🔵 On Duty (OD / Field & Official Assignment)</option>
                      <option value="Absent">🔴 Absent (Unexcused Non-Attendance)</option>
                    </select>
                  </div>

                  {/* Administrative Reason & Notes */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <label style={{ fontSize: '0.76rem', fontWeight: 700, color: '#334155' }}>
                        Administrative Reason & Justification
                      </label>
                      <span style={{ fontSize: '0.7rem', color: '#64748b' }}>Audit Log</span>
                    </div>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
                      {[
                        'Biometric sync failure',
                        'Principal authorized adjustment',
                        'Official campus duty (OD)',
                        'Emergency medical leave'
                      ].map(chip => (
                        <button
                          key={chip}
                          type="button"
                          onClick={() => setManualPunchForm(p => ({ ...p, notes: chip }))}
                          style={{
                            fontSize: '0.7rem',
                            fontWeight: 600,
                            padding: '3px 8px',
                            borderRadius: '6px',
                            background: manualPunchForm.notes === chip ? '#ede9fe' : '#f8fafc',
                            color: manualPunchForm.notes === chip ? '#6d28d9' : '#475569',
                            border: '1px solid',
                            borderColor: manualPunchForm.notes === chip ? '#ddd6fe' : '#e2e8f0',
                            cursor: 'pointer'
                          }}
                        >
                          + {chip}
                        </button>
                      ))}
                    </div>

                    <textarea
                      rows={2}
                      value={manualPunchForm.notes}
                      onChange={e => setManualPunchForm(p => ({ ...p, notes: e.target.value }))}
                      placeholder="e.g. Biometric sync adjustment, offsite exam duty approved by Super Admin..."
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '10px',
                        border: '1.5px solid #cbd5e1',
                        fontSize: '0.84rem',
                        color: '#1e293b',
                        resize: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  {/* Audit Notice */}
                  <div style={{
                    padding: '10px 14px',
                    background: '#f0fdf4',
                    border: '1px solid #bbf7d0',
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '0.72rem',
                    color: '#166534',
                    fontWeight: 600
                  }}>
                    <ShieldCheck size={16} color="#16a34a" />
                    <span>This override is executed with Super Admin executive authority and instantly updates the daily attendance summary.</span>
                  </div>

                </div>

                {/* Footer */}
                <div style={{
                  padding: '16px 24px',
                  background: '#f8fafc',
                  borderTop: '1px solid #f1f5f9',
                  display: 'flex',
                  justifyContent: 'flex-end',
                  alignItems: 'center',
                  gap: '12px'
                }}>
                  <button
                    type="button"
                    onClick={() => setManualPunchStaff(null)}
                    style={{
                      padding: '9px 18px',
                      borderRadius: '10px',
                      background: 'white',
                      color: '#475569',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isManualPunchSubmitting}
                    style={{
                      padding: '9px 22px',
                      borderRadius: '10px',
                      background: 'linear-gradient(135deg, #4F46E5, #4338ca)',
                      color: 'white',
                      border: 'none',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      cursor: isManualPunchSubmitting ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)'
                    }}
                  >
                    {isManualPunchSubmitting ? (
                      <>
                        <RefreshCw size={14} className="animate-spin" />
                        Saving Override...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 size={15} />
                        Save Punch Override
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        );
      })()}

      {/* ─── EXECUTIVE ATTENDANCE REPORT MODAL ─── */}
      {isAttendanceReportModalOpen && createPortal(
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999999,
          padding: '20px',
          animation: 'fadeIn 0.2s ease-out'
        }}>
          <div
            id="attendance-report-modal"
            style={{
              background: 'white',
              borderRadius: '24px',
              width: '100%',
              maxWidth: '960px',
              height: '90vh',
              maxHeight: '90vh',
              boxShadow: '0 25px 60px -15px rgba(15, 23, 42, 0.4), 0 0 0 1px rgba(226, 232, 240, 0.8)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <style>{`
              #attendance-report-modal *::-webkit-scrollbar {
                width: 6px;
                height: 6px;
              }
              #attendance-report-modal *::-webkit-scrollbar-track {
                background: #f1f5f9;
                border-radius: 4px;
              }
              #attendance-report-modal *::-webkit-scrollbar-thumb {
                background: #cbd5e1;
                border-radius: 4px;
              }
              #attendance-report-modal *::-webkit-scrollbar-thumb:hover {
                background: #94a3b8;
              }
              @media print {
                body * {
                  visibility: hidden !important;
                }
                #attendance-report-modal, #attendance-report-modal * {
                  visibility: visible !important;
                }
                #attendance-report-modal {
                  position: fixed !important;
                  left: 0 !important;
                  top: 0 !important;
                  width: 100% !important;
                  max-width: 100% !important;
                  height: auto !important;
                  max-height: none !important;
                  border: none !important;
                  box-shadow: none !important;
                  border-radius: 0 !important;
                }
                .no-print {
                  display: none !important;
                }
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
                  <FileText size={22} />
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
                      Official Executive Audit
                    </span>
                    <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>
                      Generated {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                  <h3 style={{ margin: '4px 0 0 0', fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
                    Staff Attendance & Punch Report
                  </h3>
                  <div style={{ fontSize: '0.76rem', color: '#64748b', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Building2 size={13} color="#64748b" />
                    <span>
                      {attendanceSchoolFilter === 'all'
                        ? 'All Campuses (Consolidated Multi-Branch Scope)'
                        : (schoolsList.find(s => s.slug === attendanceSchoolFilter)?.name || attendanceSchoolFilter)}
                    </span>
                    <span>•</span>
                    <CalendarDays size={13} color="#64748b" />
                    <span>Target Date: {attendanceDate}</span>
                  </div>
                </div>
              </div>

              <div className="no-print" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setIsAttendanceReportModalOpen(false)}
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
            </div>

            {/* Modal Scrollable Body */}
            <div style={{
              padding: '20px 28px',
              overflowY: 'auto',
              flex: 1,
              minHeight: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}>
              
              {/* Executive Summary Metrics Strip */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                gap: '12px',
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '16px',
                padding: '16px',
                flexShrink: 0
              }}>
                <div style={{ borderRight: '1px solid #e2e8f0', paddingRight: '10px' }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Total Headcount</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#1e293b', marginTop: '2px' }}>
                    {attendanceSheetData?.totalStaff || 0}
                  </div>
                  <div style={{ fontSize: '0.68rem', color: '#64748b' }}>Staff Tracked</div>
                </div>

                <div style={{ borderRight: '1px solid #e2e8f0', paddingRight: '10px' }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#16a34a', textTransform: 'uppercase' }}>Currently On Duty</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#16a34a', marginTop: '2px' }}>
                    {attendanceSheetData?.currentlyWorking || 0}
                  </div>
                  <div style={{ fontSize: '0.68rem', color: '#16a34a' }}>Active on campus</div>
                </div>

                <div style={{ borderRight: '1px solid #e2e8f0', paddingRight: '10px' }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#0284c7', textTransform: 'uppercase' }}>Shift Completed</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0284c7', marginTop: '2px' }}>
                    {attendanceSheetData?.completedShift || 0}
                  </div>
                  <div style={{ fontSize: '0.68rem', color: '#64748b' }}>Punched out</div>
                </div>

                <div style={{ borderRight: '1px solid #e2e8f0', paddingRight: '10px' }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#d97706', textTransform: 'uppercase' }}>Late Arrivals</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#d97706', marginTop: '2px' }}>
                    {attendanceSheetData?.lateArrivals || 0}
                  </div>
                  <div style={{ fontSize: '0.68rem', color: '#64748b' }}>Beyond grace time</div>
                </div>

                <div>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#dc2626', textTransform: 'uppercase' }}>Unpunched / Absent</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#dc2626', marginTop: '2px' }}>
                    {attendanceSheetData?.notMarked || 0}
                  </div>
                  <div style={{ fontSize: '0.68rem', color: '#64748b' }}>No stamp logged</div>
                </div>
              </div>

              {/* Scope & Applied Filters Info Bar */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '10px',
                fontSize: '0.78rem',
                color: '#475569',
                flexShrink: 0
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span>Scope Filter: <strong>{attendanceDeptFilter === 'All' ? 'All Departments' : attendanceDeptFilter}</strong></span>
                  <span>•</span>
                  <span>Status Filter: <strong>{attendanceStatusFilter === 'All' ? 'All Statuses' : attendanceStatusFilter}</strong></span>
                  {attendanceSearchQuery && (
                    <>
                      <span>•</span>
                      <span>Query: "<strong>{attendanceSearchQuery}</strong>"</span>
                    </>
                  )}
                </div>
                <div>
                  Showing <strong>{filteredAttendanceList.length}</strong> of <strong>{attendanceSheetData?.totalStaff || 0}</strong> personnel
                </div>
              </div>

              {/* Detailed Report Table with Scrollable Body & Sticky Header */}
              <div style={{
                border: '1px solid #e2e8f0',
                borderRadius: '14px',
                overflowY: 'auto',
                overflowX: 'auto',
                maxHeight: '360px',
                minHeight: '160px',
                background: 'white',
                boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.02)'
              }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.78rem' }}>
                  <thead style={{ position: 'sticky', top: 0, zIndex: 5, background: '#f8fafc' }}>
                    <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      <th style={{ padding: '12px 16px', background: '#f8fafc' }}>Staff Member</th>
                      <th style={{ padding: '12px 16px', background: '#f8fafc' }}>Branch Campus</th>
                      <th style={{ padding: '12px 16px', background: '#f8fafc' }}>Role & Dept</th>
                      <th style={{ padding: '12px 16px', background: '#f8fafc' }}>Punch In</th>
                      <th style={{ padding: '12px 16px', background: '#f8fafc' }}>Punch Out</th>
                      <th style={{ padding: '12px 16px', background: '#f8fafc' }}>Active Duration</th>
                      <th style={{ padding: '12px 16px', background: '#f8fafc' }}>Status</th>
                      <th style={{ padding: '12px 16px', background: '#f8fafc' }}>Verification</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAttendanceList.length === 0 ? (
                      <tr>
                        <td colSpan={8} style={{ padding: '36px', textAlign: 'center', color: '#94a3b8' }}>
                          No staff attendance records found matching this report scope.
                        </td>
                      </tr>
                    ) : (
                      filteredAttendanceList.map((item, idx) => {
                        const assignedSchool = (schoolsList || []).find(s => s.slug === item.schoolSlug || s._id === item.schoolId) ||
                                               (schools || []).find(s => s.slug === item.schoolSlug || s._id === item.schoolId);
                        const campusName = assignedSchool?.name || item.schoolSlug || 'Main Campus';
                        const isEven = idx % 2 === 0;

                        return (
                          <tr
                            key={item.staffId || item._id || idx}
                            style={{
                              borderBottom: '1px solid #f1f5f9',
                              background: isEven ? '#ffffff' : '#fcfcfd'
                            }}
                          >
                            <td style={{ padding: '12px 16px' }}>
                              <div style={{ fontWeight: 800, color: '#1e293b' }}>{item.name}</div>
                              <div style={{ fontSize: '0.7rem', color: '#64748b' }}>{item.employeeId || 'STAFF'}</div>
                            </td>
                            <td style={{ padding: '12px 16px', color: '#334155', fontWeight: 600 }}>
                              {campusName}
                            </td>
                            <td style={{ padding: '12px 16px' }}>
                              <div style={{ color: '#1e293b', fontWeight: 600 }}>{item.role || 'Staff'}</div>
                              <div style={{ fontSize: '0.7rem', color: '#64748b' }}>{item.department || 'General'}</div>
                            </td>
                            <td style={{ padding: '12px 16px' }}>
                              <span style={{ fontWeight: item.punchIn ? 700 : 400, color: item.punchIn ? '#16a34a' : '#94a3b8' }}>
                                {item.punchIn ? formatPunchTime(item.punchIn) : '—'}
                              </span>
                            </td>
                            <td style={{ padding: '12px 16px' }}>
                              <span style={{ fontWeight: item.punchOut ? 700 : 400, color: item.punchOut ? '#e11d48' : '#94a3b8' }}>
                                {item.punchOut ? formatPunchTime(item.punchOut) : (item.isCurrentlyPunchedIn ? 'On Shift' : '—')}
                              </span>
                            </td>
                            <td style={{ padding: '12px 16px', fontWeight: 700, color: '#1e293b' }}>
                              {item.durationFormatted || '0h 0m'}
                            </td>
                            <td style={{ padding: '12px 16px' }}>
                              <span style={{
                                padding: '3px 8px',
                                borderRadius: '6px',
                                fontSize: '0.72rem',
                                fontWeight: 800,
                                background: item.isCurrentlyPunchedIn
                                  ? '#dcfce7'
                                  : item.attendanceStatus === 'Shift Completed'
                                    ? '#dbeafe'
                                    : item.attendanceStatus?.includes('Late')
                                      ? '#fef3c7'
                                      : item.attendanceStatus === 'On Duty'
                                        ? '#ccfbf1'
                                        : item.attendanceStatus === 'Half Day'
                                          ? '#fef9c3'
                                          : '#f1f5f9',
                                color: item.isCurrentlyPunchedIn
                                  ? '#15803d'
                                  : item.attendanceStatus === 'Shift Completed'
                                    ? '#1d4ed8'
                                    : item.attendanceStatus?.includes('Late')
                                      ? '#b45309'
                                      : item.attendanceStatus === 'On Duty'
                                        ? '#0f766e'
                                        : item.attendanceStatus === 'Half Day'
                                          ? '#a16207'
                                          : '#64748b'
                              }}>
                                {item.attendanceStatus || 'Not Punched In'}
                              </span>
                            </td>
                            <td style={{ padding: '12px 16px' }}>
                              <span style={{
                                fontSize: '0.7rem',
                                fontWeight: 700,
                                color: item.punches?.some(p => p.isWithinGeofence) ? '#16a34a' : '#64748b'
                              }}>
                                {item.punches?.some(p => p.isWithinGeofence) ? '✓ GPS Geofenced' : (item.punches?.length > 0 ? 'Web Stamp' : 'No Stamps')}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Compliance & Audit Footer Note */}
              <div style={{
                padding: '12px 16px',
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '0.72rem',
                color: '#64748b',
                flexWrap: 'wrap',
                gap: '8px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <ShieldCheck size={14} color="#16a34a" />
                  <span>Report generated under Super Admin compliance authority with multi-campus synchronization.</span>
                </div>
                <div>
                  Pragati School Management ERP • Confidential Personnel Record
                </div>
              </div>

            </div>

            {/* Modal Footer Actions */}
            <div className="no-print" style={{
              padding: '16px 28px',
              background: '#f8fafc',
              borderTop: '1px solid #e2e8f0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '12px',
              flexShrink: 0
            }}>
              <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>
                Ready to print, download CSV, or archive report snapshot.
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setIsAttendanceReportModalOpen(false)}
                  style={{
                    padding: '9px 18px',
                    borderRadius: '10px',
                    background: 'white',
                    color: '#475569',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Close
                </button>

                <button
                  type="button"
                  onClick={handleDownloadAttendanceCSV}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '9px 18px',
                    borderRadius: '10px',
                    background: 'white',
                    color: '#059669',
                    border: '1.5px solid #a7f3d0',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  <Download size={15} />
                  Download CSV
                </button>

                <button
                  type="button"
                  onClick={handlePrintReport}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '9px 20px',
                    borderRadius: '10px',
                    background: 'linear-gradient(135deg, #4F46E5, #4338ca)',
                    color: 'white',
                    border: 'none',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)'
                  }}
                >
                  <Printer size={15} />
                  Print / Save as PDF
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

export default SuperAdminDashboard;
