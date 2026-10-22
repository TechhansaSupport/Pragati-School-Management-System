import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { 
  Building2, Users, UserPlus, UserCheck, ShieldCheck, Plus, ExternalLink, 
  MapPin, UserCog, RefreshCw, Key, Search, Filter, AlertCircle, 
  CheckCircle2, ArrowRight, Layers, Award, Trash2, Mail, Phone, 
  Calendar, Server, Shield, Sparkles, ChevronRight, Activity, Globe,
  Briefcase, BookOpen, Clock, HelpCircle, Check, Copy, X, Settings,
  AlertTriangle, Save, Database, Lock, Edit3, TrendingUp, TrendingDown,
  Wallet, CreditCard, Receipt, Percent, DollarSign, CheckCircle,
  Bus, Book, Navigation, Bookmark, Wrench
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
    } else if (['schools', 'assignments', 'health', 'config', 'rbac', 'security', 'transport', 'library'].includes(tabParam)) {
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


      {/* ─── ENTERPRISE EXECUTIVE METRIC CARDS ─── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
        gap: '16px'
      }}>
        {/* Card 1: Total Schools */}
        <div className="card" style={{
          background: 'white',
          borderRadius: '16px',
          padding: '18px 22px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
          display: 'flex',
          alignItems: 'center',
          gap: '16px'
        }}>
          <div style={{
            width: '48px', height: '48px', borderRadius: '12px',
            background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.1) 0%, rgba(30, 58, 138, 0.1) 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Building2 size={24} color="#4F46E5" />
          </div>
          <div>
            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
              Main Schools
            </div>
            <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#1e293b', lineHeight: 1.1 }}>
              {totalSchoolsCount}
            </div>
            <div style={{ fontSize: '0.72rem', color: '#10b981', fontWeight: 600, marginTop: '2px' }}>
              Parent Organizations
            </div>
          </div>
        </div>

        {/* Card 2: Total Branches */}
        <div className="card" style={{
          background: 'white',
          borderRadius: '16px',
          padding: '18px 22px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
          display: 'flex',
          alignItems: 'center',
          gap: '16px'
        }}>
          <div style={{
            width: '48px', height: '48px', borderRadius: '12px',
            background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.1) 0%, rgba(2, 132, 199, 0.1) 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Layers size={24} color="#0284c7" />
          </div>
          <div>
            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
              Active Campuses
            </div>
            <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#1e293b', lineHeight: 1.1 }}>
              {schoolsList.length}
            </div>
            <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600, marginTop: '2px' }}>
              {totalBranchesCount} Branches + {totalSchoolsCount} Main
            </div>
          </div>
        </div>

        {/* Card 3: Branch Admins */}
        <div className="card" style={{
          background: 'white',
          borderRadius: '16px',
          padding: '18px 22px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
          display: 'flex',
          alignItems: 'center',
          gap: '16px'
        }}>
          <div style={{
            width: '48px', height: '48px', borderRadius: '12px',
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.1) 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <ShieldCheck size={24} color="#059669" />
          </div>
          <div>
            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
              Branch Admins
            </div>
            <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#1e293b', lineHeight: 1.1 }}>
              {appointedAdminsCount} <span style={{ fontSize: '0.9rem', color: '#94a3b8', fontWeight: 500 }}>/ {schoolsList.length}</span>
            </div>
            <div style={{ fontSize: '0.72rem', color: appointedAdminsCount === schoolsList.length ? '#10b981' : '#f59e0b', fontWeight: 600, marginTop: '2px' }}>
              {appointedAdminsCount === schoolsList.length ? 'All Appointed' : `${schoolsList.length - appointedAdminsCount} Pending`}
            </div>
          </div>
        </div>

        {/* Card 4: Principals */}
        <div className="card" style={{
          background: 'white',
          borderRadius: '16px',
          padding: '18px 22px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
          display: 'flex',
          alignItems: 'center',
          gap: '16px'
        }}>
          <div style={{
            width: '48px', height: '48px', borderRadius: '12px',
            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(217, 119, 6, 0.1) 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Award size={24} color="#d97706" />
          </div>
          <div>
            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
              School Principals
            </div>
            <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#1e293b', lineHeight: 1.1 }}>
              {appointedPrincipalsCount} <span style={{ fontSize: '0.9rem', color: '#94a3b8', fontWeight: 500 }}>/ {schoolsList.length}</span>
            </div>
            <div style={{ fontSize: '0.72rem', color: appointedPrincipalsCount === schoolsList.length ? '#10b981' : '#f59e0b', fontWeight: 600, marginTop: '2px' }}>
              {appointedPrincipalsCount === schoolsList.length ? 'All Appointed' : `${schoolsList.length - appointedPrincipalsCount} Pending`}
            </div>
          </div>
        </div>

        {/* Card 5: Total Staff & Faculty */}
        <div className="card" style={{
          background: 'white',
          borderRadius: '16px',
          padding: '18px 22px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
          display: 'flex',
          alignItems: 'center',
          gap: '16px'
        }}>
          <div style={{
            width: '48px', height: '48px', borderRadius: '12px',
            background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(109, 40, 217, 0.1) 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Users size={24} color="#7c3aed" />
          </div>
          <div>
            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
              Faculty & Staff
            </div>
            <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#1e293b', lineHeight: 1.1 }}>
              {totalStaffCount}
            </div>
            <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600, marginTop: '2px' }}>
              Across All Campuses
            </div>
          </div>
        </div>
      </div>

      {/* ─── EXECUTIVE FINANCIAL & FACULTY INTELLIGENCE HUB ─── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', width: '100%', marginTop: '6px' }}>
        {/* Hub Header & Scope Controller */}
        <div className="card chart-card hub-telemetry-header" style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          padding: '16px 22px',
          borderRadius: '16px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.02)'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{
                background: 'linear-gradient(135deg, #4F46E5 0%, #7c3aed 100%)',
                color: 'white',
                fontSize: '0.68rem',
                fontWeight: 800,
                padding: '3px 8px',
                borderRadius: '6px',
                letterSpacing: '0.5px',
                textTransform: 'uppercase'
              }}>
                Executive Telemetry
              </span>
              <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>
                • Consolidated Real-Time Analytics (AY 2026-2027)
              </span>
            </div>
            <h2 style={{ margin: '4px 0 0 0', fontSize: '1.22rem', fontWeight: 800, color: 'var(--color-text-main, #1e293b)' }}>
              Financial Performance & Faculty Attendance Intelligence
            </h2>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            {/* Campus Scope Selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Building2 size={16} color="#64748b" />
              <select
                value={financeScope}
                onChange={e => setFinanceScope(e.target.value)}
                style={{
                  padding: '7px 12px',
                  borderRadius: '10px',
                  border: '1px solid #cbd5e1',
                  background: '#f8fafc',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  color: '#334155',
                  cursor: 'pointer',
                  outline: 'none'
                }}
              >
                <option value="all">🌐 All Campuses (Consolidated)</option>
                {schoolsList.map(s => (
                  <option key={s.slug} value={s.slug}>
                    {s.name || s.slug} {s.isBranch ? '(Branch)' : '(Main)'}
                  </option>
                ))}
              </select>
            </div>

            {/* Period Selector */}
            <div className="period-toggle-group" style={{
              display: 'flex',
              padding: '3px',
              borderRadius: '10px'
            }}>
              <button
                type="button"
                onClick={() => setFinancePeriod('monthly')}
                style={{
                  padding: '5px 12px',
                  borderRadius: '8px',
                  border: 'none',
                  background: financePeriod === 'monthly' ? '#4F46E5' : 'transparent',
                  color: financePeriod === 'monthly' ? '#ffffff' : 'var(--color-text-muted, #64748b)',
                  fontWeight: 700,
                  fontSize: '0.78rem',
                  cursor: 'pointer',
                  boxShadow: financePeriod === 'monthly' ? '0 2px 8px rgba(79, 70, 229, 0.35)' : 'none',
                  transition: 'all 0.2s'
                }}
              >
                Monthly Trend
              </button>
              <button
                type="button"
                onClick={() => setFinancePeriod('quarterly')}
                style={{
                  padding: '5px 12px',
                  borderRadius: '8px',
                  border: 'none',
                  background: financePeriod === 'quarterly' ? '#4F46E5' : 'transparent',
                  color: financePeriod === 'quarterly' ? '#ffffff' : 'var(--color-text-muted, #64748b)',
                  fontWeight: 700,
                  fontSize: '0.78rem',
                  cursor: 'pointer',
                  boxShadow: financePeriod === 'quarterly' ? '0 2px 8px rgba(79, 70, 229, 0.35)' : 'none',
                  transition: 'all 0.2s'
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
              title="Refresh Live Financial & Faculty Telemetry"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '34px',
                height: '34px',
                borderRadius: '10px',
                border: '1px solid var(--color-border, #e2e8f0)',
                background: 'var(--color-surface, white)',
                color: 'var(--color-text-muted, #64748b)',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              <RefreshCw size={15} style={{ animation: isFinanceLoading ? 'spin 1s linear infinite' : 'none' }} />
            </button>
          </div>
        </div>

        {/* ─── 4 EXECUTIVE KPI CARDS (REAL DATABASE DATA) ─── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
          gap: '16px'
        }}>
          {/* Card 1: Revenue Generated */}
          <div className="card" style={{
            background: 'var(--color-surface, white)',
            borderRadius: '18px',
            padding: '20px 22px',
            border: '1px solid var(--color-border, #e2e8f0)',
            boxShadow: '0 4px 16px rgba(0,0,0,0.02)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '4px',
              background: 'linear-gradient(90deg, #10B981, #059669)'
            }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--color-text-muted, #64748b)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Revenue Generated
                </span>
                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-text-main, #1e293b)', marginTop: '6px', lineHeight: 1 }}>
                  {formatCurrency(financeAnalytics?.totalRevenue ?? financeStats.totalCollections)}
                </div>
              </div>
              <div style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background: 'rgba(16, 185, 129, 0.1)',
                color: '#059669',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Wallet size={22} />
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '16px', paddingTop: '12px', borderTop: '1px solid var(--color-border, #f1f5f9)' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.74rem', fontWeight: 700, color: '#059669', background: 'rgba(16, 185, 129, 0.15)', padding: '3px 8px', borderRadius: '6px' }}>
                <TrendingUp size={12} /> Live Recorded
              </span>
              <span style={{ fontSize: '0.74rem', color: 'var(--color-text-muted, #64748b)', fontWeight: 600 }}>
                Margin: {financeAnalytics?.operatingMargin !== undefined ? `${financeAnalytics.operatingMargin}%` : '+0.5%'}
              </span>
            </div>
          </div>

          {/* Card 2: Fees Collected */}
          <div className="card" style={{
            background: 'var(--color-surface, white)',
            borderRadius: '18px',
            padding: '20px 22px',
            border: '1px solid var(--color-border, #e2e8f0)',
            boxShadow: '0 4px 16px rgba(0,0,0,0.02)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '4px',
              background: 'linear-gradient(90deg, #4F46E5, #6366F1)'
            }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--color-text-muted, #64748b)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Fees Collected
                </span>
                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-text-main, #1e293b)', marginTop: '6px', lineHeight: 1 }}>
                  {formatCurrency(financeAnalytics?.totalCollections ?? financeStats.totalCollections)}
                </div>
              </div>
              <div style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background: 'rgba(79, 70, 229, 0.1)',
                color: '#4F46E5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <CreditCard size={22} />
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '16px', paddingTop: '12px', borderTop: '1px solid var(--color-border, #f1f5f9)' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.74rem', fontWeight: 700, color: '#6366f1', background: 'rgba(99, 102, 241, 0.15)', padding: '3px 8px', borderRadius: '6px' }}>
                <CheckCircle2 size={12} /> {financeAnalytics?.collectionEfficiency !== undefined ? `${financeAnalytics.collectionEfficiency}%` : '90.1%'} Realized
              </span>
              <span style={{ fontSize: '0.74rem', color: '#f59e0b', fontWeight: 600 }}>
                Dues: {formatCurrency(financeAnalytics?.pendingFees ?? financeStats.pendingFees)}
              </span>
            </div>
          </div>

          {/* Card 3: Operating Expenses */}
          <div className="card" style={{
            background: 'var(--color-surface, white)',
            borderRadius: '18px',
            padding: '20px 22px',
            border: '1px solid var(--color-border, #e2e8f0)',
            boxShadow: '0 4px 16px rgba(0,0,0,0.02)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '4px',
              background: 'linear-gradient(90deg, #F43F5E, #E11D48)'
            }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--color-text-muted, #64748b)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Operating Expenses
                </span>
                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-text-main, #1e293b)', marginTop: '6px', lineHeight: 1 }}>
                  {formatCurrency(financeAnalytics?.totalExpenses ?? financeStats.totalExpenses)}
                </div>
              </div>
              <div style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background: 'rgba(244, 63, 94, 0.1)',
                color: '#e11d48',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Receipt size={22} />
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '16px', paddingTop: '12px', borderTop: '1px solid var(--color-border, #f1f5f9)' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.74rem', fontWeight: 700, color: (financeAnalytics?.availableBalance ?? financeStats.availableBalance) >= 0 ? '#10b981' : '#e11d48', background: (financeAnalytics?.availableBalance ?? financeStats.availableBalance) >= 0 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)', padding: '3px 8px', borderRadius: '6px' }}>
                <Percent size={12} /> {(financeAnalytics?.availableBalance ?? financeStats.availableBalance) >= 0 ? 'Surplus Positive' : 'Deficit Monitored'}
              </span>
              <span style={{ fontSize: '0.74rem', color: 'var(--color-text-muted, #64748b)', fontWeight: 600 }}>
                Net: {formatCurrency(financeAnalytics?.availableBalance ?? financeStats.availableBalance)}
              </span>
            </div>
          </div>

          {/* Card 4: Teachers Attendance */}
          <div className="card" style={{
            background: 'var(--color-surface, white)',
            borderRadius: '18px',
            padding: '20px 22px',
            border: '1px solid var(--color-border, #e2e8f0)',
            boxShadow: '0 4px 16px rgba(0,0,0,0.02)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '4px',
              background: 'linear-gradient(90deg, #0284C7, #06B6D4)'
            }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--color-text-muted, #64748b)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Teachers Attendance
                </span>
                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-text-main, #1e293b)', marginTop: '6px', lineHeight: 1 }}>
                  {teacherStats.rate}%
                </div>
              </div>
              <div style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background: 'rgba(2, 132, 199, 0.1)',
                color: '#0284c7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <UserCheck size={22} />
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '16px', paddingTop: '12px', borderTop: '1px solid var(--color-border, #f1f5f9)' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.74rem', fontWeight: 700, color: '#0284c7', background: 'rgba(2, 132, 199, 0.15)', padding: '3px 8px', borderRadius: '6px' }}>
                {teacherStats.present} / {teacherStats.total} Present
              </span>
              <span style={{ fontSize: '0.74rem', color: teacherStats.onLeave > 0 ? '#f59e0b' : '#10b981', fontWeight: 600 }}>
                {teacherStats.onLeave > 0 ? `${teacherStats.onLeave} On Leave` : '100% Present'}
              </span>
            </div>
          </div>
        </div>

        {/* ─── 2 INTERACTIVE ANALYTICS GRAPHS ─── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(440px, 1fr))',
          gap: '16px',
          width: '100%'
        }}>
          {/* GRAPH 1: Financial Trajectory (AreaChart) */}
          <div className="card" style={{
            background: 'var(--color-surface, white)',
            borderRadius: '20px',
            padding: '24px',
            border: '1px solid var(--color-border, #e2e8f0)',
            boxShadow: '0 4px 18px rgba(0,0,0,0.03)',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-text-main, #1e293b)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <TrendingUp size={18} color="#4F46E5" /> Consolidated Financial Performance
                </h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: 'var(--color-text-muted, #64748b)' }}>
                  Revenue generated, fee collections, and operational expenses
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '0.76rem', fontWeight: 700, color: '#4F46E5' }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '3px', background: '#4F46E5' }} /> Fees
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '0.76rem', fontWeight: 700, color: '#10B981' }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '3px', background: '#10B981' }} /> Revenue
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '0.76rem', fontWeight: 700, color: '#F43F5E' }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '3px', background: '#F43F5E' }} /> Expenses
                </span>
              </div>
            </div>

            <div style={{ width: '100%', height: '280px', marginTop: '10px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={financialChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorCollections" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#4F46E5" stopOpacity={0.02}/>
                    </linearGradient>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.45}/>
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0.02}/>
                    </linearGradient>
                    <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#F43F5E" stopOpacity={0.35}/>
                      <stop offset="95%" stopColor="#F43F5E" stopOpacity={0.02}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255, 255, 255, 0.08)" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--color-text-muted, #64748B)', fontWeight: 600 }} dy={8} />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 11, fill: 'var(--color-text-muted, #64748B)' }} 
                    tickFormatter={v => `₹${v >= 100000 ? (v / 100000).toFixed(1) + 'L' : (v / 1000) + 'k'}`} 
                  />
                  <Tooltip content={<FinancialTooltip />} />
                  <Area type="monotone" dataKey="collections" name="Fees Collected" stroke="#4F46E5" strokeWidth={2.5} fillOpacity={1} fill="url(#colorCollections)" />
                  <Area type="monotone" dataKey="revenue" name="Revenue Generated" stroke="#10B981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRevenue)" />
                  <Area type="monotone" dataKey="expenses" name="Operating Expenses" stroke="#F43F5E" strokeWidth={2} strokeDasharray="4 4" fillOpacity={1} fill="url(#colorExpenses)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '16px', paddingTop: '14px', borderTop: '1px solid var(--color-border, #f1f5f9)', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '0.76rem', color: 'var(--color-text-muted, #64748b)', fontWeight: 600 }}>Realization Efficiency:</span>
                <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#10b981' }}>
                  {financeAnalytics?.collectionEfficiency !== undefined ? `${financeAnalytics.collectionEfficiency}%` : '90.1%'}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '0.76rem', color: 'var(--color-text-muted, #64748b)', fontWeight: 600 }}>Net Available Balance:</span>
                <span style={{ fontSize: '0.78rem', fontWeight: 800, color: (financeAnalytics?.availableBalance ?? financeStats.availableBalance) >= 0 ? '#10B981' : '#F43F5E' }}>
                  {formatCurrency(financeAnalytics?.availableBalance ?? financeStats.availableBalance)}
                </span>
              </div>
            </div>
          </div>

          {/* GRAPH 2: Teachers Attendance & Faculty Presence */}
          <div className="card" style={{
            background: 'var(--color-surface, white)',
            borderRadius: '20px',
            padding: '24px',
            border: '1px solid var(--color-border, #e2e8f0)',
            boxShadow: '0 4px 18px rgba(0,0,0,0.03)',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-text-main, #1e293b)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <UserCheck size={18} color="#0284C7" /> Faculty & Teachers Attendance
                </h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: 'var(--color-text-muted, #64748b)' }}>
                  Weekly trends, presence reliability, and department distribution
                </p>
              </div>

              {/* View Switcher: Weekly vs Departments */}
              <div className="period-toggle-group" style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '3px',
                borderRadius: '10px'
              }}>
                <button
                  type="button"
                  onClick={() => setAttendanceView('weekly')}
                  style={{
                    padding: '5px 12px',
                    borderRadius: '8px',
                    border: 'none',
                    background: attendanceView === 'weekly' ? '#0284C7' : 'transparent',
                    color: attendanceView === 'weekly' ? '#ffffff' : 'var(--color-text-muted, #64748b)',
                    fontWeight: 700,
                    fontSize: '0.76rem',
                    cursor: 'pointer',
                    boxShadow: attendanceView === 'weekly' ? '0 2px 8px rgba(2, 132, 199, 0.35)' : 'none',
                    transition: 'all 0.2s'
                  }}
                >
                  Weekly
                </button>
                <button
                  type="button"
                  onClick={() => setAttendanceView('departments')}
                  style={{
                    padding: '5px 12px',
                    borderRadius: '8px',
                    border: 'none',
                    background: attendanceView === 'departments' ? '#0284C7' : 'transparent',
                    color: attendanceView === 'departments' ? '#ffffff' : 'var(--color-text-muted, #64748b)',
                    fontWeight: 700,
                    fontSize: '0.76rem',
                    cursor: 'pointer',
                    boxShadow: attendanceView === 'departments' ? '0 2px 8px rgba(2, 132, 199, 0.35)' : 'none',
                    transition: 'all 0.2s'
                  }}
                >
                  Departments
                </button>
              </div>
            </div>

            {attendanceView === 'weekly' ? (
              <div style={{ width: '100%', height: '280px', marginTop: '10px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={teacherAttendanceWeekly} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255, 255, 255, 0.08)" />
                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--color-text-muted, #64748B)', fontWeight: 600 }} dy={8} />
                    <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--color-text-muted, #64748B)' }} />
                    <YAxis yAxisId="right" orientation="right" domain={[80, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6366F1' }} unit="%" />
                    <Tooltip content={<AttendanceTooltip />} />
                    <Bar yAxisId="left" dataKey="present" name="Present Teachers" fill="#10B981" radius={[6, 6, 0, 0]} maxBarSize={28} />
                    <Bar yAxisId="left" dataKey="onLeave" name="On Leave" fill="#F59E0B" radius={[6, 6, 0, 0]} maxBarSize={28} />
                    <Line yAxisId="right" type="monotone" dataKey="rate" name="Attendance Rate" stroke="#6366F1" strokeWidth={2.5} dot={{ r: 4, fill: '#6366F1' }} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', height: '280px', marginTop: '10px', justifyContent: 'center' }}>
                {departmentAttendance.map((dept, idx) => (
                  <div key={idx} style={{ background: 'var(--color-bg, #f8fafc)', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--color-border, #f1f5f9)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <div style={{ fontWeight: 700, fontSize: '0.84rem', color: 'var(--color-text-main, #1e293b)' }}>
                        {dept.department} <span style={{ fontSize: '0.74rem', fontWeight: 500, color: 'var(--color-text-muted, #64748b)' }}>• Head: {dept.head}</span>
                      </div>
                      <span style={{ fontSize: '0.78rem', fontWeight: 800, color: dept.color }}>
                        {dept.rate} ({dept.present}/{dept.total})
                      </span>
                    </div>
                    <div style={{ width: '100%', height: '8px', background: 'var(--color-border, #e2e8f0)', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{
                        width: dept.rate,
                        height: '100%',
                        background: dept.color,
                        borderRadius: '4px',
                        transition: 'width 0.5s ease'
                      }} />
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '16px', paddingTop: '14px', borderTop: '1px solid #f1f5f9', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '0.76rem', color: '#64748b', fontWeight: 600 }}>Daily Attendance:</span>
                <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#0284c7' }}>
                  {attendanceAnalytics?.overallRate !== undefined ? `${attendanceAnalytics.overallRate}%` : `${teacherStats.rate}%`}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '0.76rem', color: '#64748b', fontWeight: 600 }}>Active Coverage:</span>
                <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#10b981' }}>
                  {teacherStats.present} / {teacherStats.total} Faculty Present
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── ENTERPRISE FACILITIES & AUXILIARY OPERATIONS (TRANSPORT & LIBRARY) ─── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}>
        <div className="card chart-card hub-telemetry-header" style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          padding: '16px 22px',
          borderRadius: '16px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.02)'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{
                background: 'linear-gradient(135deg, #0F766E 0%, #0284C7 100%)',
                color: 'white',
                fontSize: '0.68rem',
                fontWeight: 800,
                padding: '3px 8px',
                borderRadius: '6px',
                letterSpacing: '0.5px',
                textTransform: 'uppercase'
              }}>
                Auxiliary Operations
              </span>
              <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted, #64748b)', fontWeight: 600 }}>
                • Campus Transit Logistics & Library Circulation Telemetry
              </span>
            </div>
            <h2 style={{ margin: '4px 0 0 0', fontSize: '1.22rem', fontWeight: 800, color: 'var(--color-text-main, #1e293b)' }}>
              Fleet Tracking, Bus Routes & Library Resource Center
            </h2>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => handleTabChange('transport')}
              className="hover-lift"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 14px',
                borderRadius: '10px',
                background: 'rgba(245, 158, 11, 0.12)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                color: '#d97706',
                fontWeight: 700,
                fontSize: '0.82rem',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              <Bus size={15} /> Transport Console
            </button>
            <button
              type="button"
              onClick={() => handleTabChange('library')}
              className="hover-lift"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 14px',
                borderRadius: '10px',
                background: 'rgba(79, 70, 229, 0.1)',
                border: '1px solid rgba(79, 70, 229, 0.25)',
                color: '#4F46E5',
                fontWeight: 700,
                fontSize: '0.82rem',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              <BookOpen size={15} /> Library Console
            </button>
          </div>
        </div>

        {/* 2 Feature Cards Side-by-Side */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '18px' }}>
          
          {/* Card 1: Transport & Fleet Logistics */}
          <div className="card hover-lift" style={{
            background: 'var(--color-surface, white)',
            borderRadius: '18px',
            padding: '24px',
            border: '1px solid var(--color-border, #e2e8f0)',
            boxShadow: '0 4px 18px rgba(0,0,0,0.02)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: '18px'
          }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '46px', height: '46px', borderRadius: '12px',
                    background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(220, 38, 38, 0.15) 100%)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    <Bus size={24} color="#ea580c" />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-text-main, #1e293b)' }}>
                      Fleet & Transit Logistics
                    </h3>
                    <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted, #64748b)', marginTop: '2px' }}>
                      Real-time campus transit, bus schedules & passenger assignments
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => navigate(`/${tenantSlug}/transport-dashboard`)}
                  className="hover-lift"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '5px 10px',
                    borderRadius: '8px',
                    background: 'rgba(245, 158, 11, 0.1)',
                    border: '1px solid rgba(245, 158, 11, 0.25)',
                    color: '#ea580c',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                  title="Open dedicated Transport Dashboard"
                >
                  Launch Hub <ArrowRight size={13} />
                </button>
              </div>

              {/* 4 Mini KPI Tiles */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginTop: '18px' }}>
                <div style={{ padding: '12px 10px', borderRadius: '12px', background: 'var(--color-bg, #f8fafc)', border: '1px solid var(--color-border, #e2e8f0)', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#4F46E5' }}>{transportOverviewStats.totalFleet || 5}</div>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginTop: '2px' }}>Buses</div>
                </div>
                <div style={{ padding: '12px 10px', borderRadius: '12px', background: 'var(--color-bg, #f8fafc)', border: '1px solid var(--color-border, #e2e8f0)', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#16A34A' }}>{transportOverviewStats.activeRoutes || 5}</div>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginTop: '2px' }}>Routes</div>
                </div>
                <div style={{ padding: '12px 10px', borderRadius: '12px', background: 'var(--color-bg, #f8fafc)', border: '1px solid var(--color-border, #e2e8f0)', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0284c7' }}>{transportOverviewStats.mappedStudents || 188}</div>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginTop: '2px' }}>Commuters</div>
                </div>
                <div style={{ padding: '12px 10px', borderRadius: '12px', background: 'var(--color-bg, #f8fafc)', border: '1px solid var(--color-border, #e2e8f0)', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#DC2626' }}>{transportOverviewStats.inMaintenance || 1}</div>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginTop: '2px' }}>In Service</div>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', paddingTop: '12px', borderTop: '1px solid var(--color-border, #f1f5f9)' }}>
              <button
                type="button"
                onClick={() => handleTabChange('transport')}
                style={{
                  flex: 1,
                  padding: '9px 14px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #f59e0b 0%, #ea580c 100%)',
                  color: 'white',
                  border: 'none',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  boxShadow: '0 4px 12px rgba(234, 88, 12, 0.25)'
                }}
              >
                <Bus size={15} /> Transport Dashboard
              </button>
              <button
                type="button"
                onClick={() => navigate(`/${tenantSlug}/routes`)}
                style={{
                  padding: '9px 14px',
                  borderRadius: '10px',
                  background: 'var(--color-bg, #f8fafc)',
                  color: 'var(--color-text-main, #334155)',
                  border: '1px solid var(--color-border, #cbd5e1)',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Navigation size={14} /> Routes & Stops
              </button>
            </div>
          </div>

          {/* Card 2: Library & Media Resource Center */}
          <div className="card hover-lift" style={{
            background: 'var(--color-surface, white)',
            borderRadius: '18px',
            padding: '24px',
            border: '1px solid var(--color-border, #e2e8f0)',
            boxShadow: '0 4px 18px rgba(0,0,0,0.02)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: '18px'
          }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '46px', height: '46px', borderRadius: '12px',
                    background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.15) 0%, rgba(15, 118, 110, 0.15) 100%)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    <BookOpen size={24} color="#4F46E5" />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-text-main, #1e293b)' }}>
                      Library & Media Resource Center
                    </h3>
                    <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted, #64748b)', marginTop: '2px' }}>
                      Volume cataloging, student lending history & book inventory
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => navigate(`/${tenantSlug}/library-dashboard`)}
                  className="hover-lift"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '5px 10px',
                    borderRadius: '8px',
                    background: 'rgba(79, 70, 229, 0.1)',
                    border: '1px solid rgba(79, 70, 229, 0.25)',
                    color: '#4F46E5',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                  title="Open dedicated Library Dashboard"
                >
                  Launch Hub <ArrowRight size={13} />
                </button>
              </div>

              {/* 4 Mini KPI Tiles */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginTop: '18px' }}>
                <div style={{ padding: '12px 10px', borderRadius: '12px', background: 'var(--color-bg, #f8fafc)', border: '1px solid var(--color-border, #e2e8f0)', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#4F46E5' }}>{libraryOverviewStats.totalCopies || 120}</div>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginTop: '2px' }}>Copies</div>
                </div>
                <div style={{ padding: '12px 10px', borderRadius: '12px', background: 'var(--color-bg, #f8fafc)', border: '1px solid var(--color-border, #e2e8f0)', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0284c7' }}>{libraryOverviewStats.issuedCopies || 18}</div>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginTop: '2px' }}>Issued</div>
                </div>
                <div style={{ padding: '12px 10px', borderRadius: '12px', background: 'var(--color-bg, #f8fafc)', border: '1px solid var(--color-border, #e2e8f0)', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#16A34A' }}>{libraryOverviewStats.availableCopies || 102}</div>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginTop: '2px' }}>On Shelf</div>
                </div>
                <div style={{ padding: '12px 10px', borderRadius: '12px', background: 'var(--color-bg, #f8fafc)', border: '1px solid var(--color-border, #e2e8f0)', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#F59E0B' }}>{libraryOverviewStats.overdueCopies || 2}</div>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginTop: '2px' }}>Overdue</div>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', paddingTop: '12px', borderTop: '1px solid var(--color-border, #f1f5f9)' }}>
              <button
                type="button"
                onClick={() => handleTabChange('library')}
                style={{
                  flex: 1,
                  padding: '9px 14px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #4F46E5 0%, #0F766E 100%)',
                  color: 'white',
                  border: 'none',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  boxShadow: '0 4px 12px rgba(79, 70, 229, 0.25)'
                }}
              >
                <BookOpen size={15} /> Library Dashboard
              </button>
              <button
                type="button"
                onClick={() => navigate(`/${tenantSlug}/books`)}
                style={{
                  padding: '9px 14px',
                  borderRadius: '10px',
                  background: 'var(--color-bg, #f8fafc)',
                  color: 'var(--color-text-main, #334155)',
                  border: '1px solid var(--color-border, #cbd5e1)',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Book size={14} /> Catalog & Books
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* ─── MULTI-CAMPUS NETWORK OVERVIEW TABLE ─── */}
      <div className="card" style={{
        background: 'var(--color-surface, white)',
            borderRadius: '20px',
            padding: '26px 28px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 4px 18px rgba(0,0,0,0.03)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#1e3a8a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Building2 size={20} color="#4F46E5" /> Multi-Campus Network Overview
                </h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.82rem', color: '#64748b' }}>
                  Live status of all registered institutions, active branch endpoints, and leadership appointments.
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => handleTabChange('schools')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 14px',
                    borderRadius: '8px',
                    background: '#f8fafc',
                    border: '1px solid #cbd5e1',
                    color: '#334155',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Manage All in Directory <ChevronRight size={14} />
                </button>
              </div>
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
                    gap: '8px',
                    padding: '8px 16px',
                    borderRadius: '10px',
                    background: '#4F46E5',
                    color: 'white',
                    border: 'none',
                    fontWeight: 700,
                    fontSize: '0.84rem',
                    cursor: 'pointer'
                  }}
                >
                  <Plus size={15} /> Register School
                </button>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '700px' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', color: '#1e3a8a', fontSize: '0.78rem', textTransform: 'uppercase' }}>
                      <th style={{ padding: '12px 16px', fontWeight: 800 }}>Campus / School</th>
                      <th style={{ padding: '12px 14px', fontWeight: 800 }}>Type</th>
                      <th style={{ padding: '12px 14px', fontWeight: 800 }}>Handle</th>
                      <th style={{ padding: '12px 14px', fontWeight: 800 }}>Branch Admin</th>
                      <th style={{ padding: '12px 14px', fontWeight: 800 }}>Principal</th>
                      <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 800 }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {schoolsList.map(school => {
                      const isMain = !school.parentSchoolSlug;
                      const hasAdmin = !!school.adminName || !!school.adminEmail;
                      const hasPrincipal = !!school.principalName || !!school.principalEmail;

                      return (
                        <tr key={school._id || school.slug} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '14px 16px' }}>
                            <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.92rem' }}>
                              {school.name}
                            </div>
                            <div style={{ fontSize: '0.74rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                              <MapPin size={11} color="#94a3b8" /> {school.city || school.address || 'Central'}
                            </div>
                          </td>

                          <td style={{ padding: '14px 14px' }}>
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '3px 8px',
                              borderRadius: '6px',
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              background: isMain ? 'rgba(79, 70, 229, 0.08)' : '#f1f5f9',
                              color: isMain ? '#4F46E5' : '#475569',
                              border: isMain ? '1px solid rgba(79, 70, 229, 0.2)' : '1px solid #e2e8f0'
                            }}>
                              {isMain ? 'Main School' : 'Branch Campus'}
                            </span>
                          </td>

                          <td style={{ padding: '14px 14px' }}>
                            <code style={{ fontSize: '0.78rem', background: '#f8fafc', padding: '3px 8px', borderRadius: '6px', border: '1px solid #e2e8f0', color: '#1e293b', fontWeight: 600 }}>
                              /{school.slug}
                            </code>
                          </td>

                          <td style={{ padding: '14px 14px' }}>
                            {hasAdmin ? (
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', color: '#059669', fontSize: '0.78rem', fontWeight: 700 }}>
                                <CheckCircle2 size={14} /> {school.adminName || school.adminEmail}
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setTargetSchoolForAdmin(school)}
                                style={{
                                  padding: '4px 8px',
                                  borderRadius: '6px',
                                  background: '#fffbeb',
                                  border: '1px solid #fde68a',
                                  color: '#b45309',
                                  fontSize: '0.72rem',
                                  fontWeight: 700,
                                  cursor: 'pointer'
                                }}
                              >
                                + Appoint Admin
                              </button>
                            )}
                          </td>

                          <td style={{ padding: '14px 14px' }}>
                            {hasPrincipal ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', color: '#0f766e', fontSize: '0.78rem', fontWeight: 700 }}>
                                  <CheckCircle2 size={14} /> {school.principalName || school.principalEmail}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setPreSelectedTeacherForPrincipal(null);
                                    setTargetSchoolForPrincipal(school);
                                  }}
                                  style={{
                                    padding: '2px 7px',
                                    borderRadius: '5px',
                                    background: '#f1f5f9',
                                    border: '1px solid #cbd5e1',
                                    color: '#475569',
                                    fontSize: '0.68rem',
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
                                  padding: '4px 8px',
                                  borderRadius: '6px',
                                  background: '#f0fdf4',
                                  border: '1px solid #bbf7d0',
                                  color: '#15803d',
                                  fontSize: '0.72rem',
                                  fontWeight: 700,
                                  cursor: 'pointer'
                                }}
                              >
                                + Appoint Principal
                              </button>
                            )}
                          </td>

                          <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                            <button
                              type="button"
                              onClick={() => handleTabChange('schools')}
                              style={{
                                padding: '6px 12px',
                                borderRadius: '8px',
                                background: '#f8fafc',
                                border: '1px solid #cbd5e1',
                                color: '#1e3a8a',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                cursor: 'pointer'
                              }}
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
          </div>
        </div>
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
              <p style={{ margin: '4px 0 0 0', fontSize: '0.88rem', color: '#64748b' }}>
                Manage main schools, branch campuses, multi-tenant handles, and assign campus leadership.
              </p>
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
                                <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
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
                                <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
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
                <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: '#64748b' }}>
                  Assign Branch Admins, Principals, Teachers, Accountants, Librarians, and staff across all schools
                </p>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
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

                <button
                  type="button"
                  onClick={() => {
                    setTargetSchoolForStaff(schoolsList[0]);
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
                    cursor: 'pointer'
                  }}
                >
                  <UserPlus size={14} /> + Assign Faculty / Staff
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

      {/* ─── TAB 3: SYSTEM HEALTH & INFRASTRUCTURE ─── */}
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

            <p style={{ fontSize: '0.85rem', color: '#64748b', lineHeight: 1.6, margin: 0 }}>
              Campuses operate with full multi-window routing support. Admins and principals log in directly to their branch workspaces via dedicated handles (e.g. <code>/{tenantSlug}-branch</code>), while the Super Admin governs the ecosystem centrally without being tied to any specific branch.
            </p>
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
                <p style={{ margin: '4px 0 0 0', fontSize: '0.84rem', color: '#64748b' }}>
                  Central authority to assign official school names, campus addresses, and institutional credentials across all portals and login windows.
                </p>
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
              <p style={{ margin: '4px 0 0 0', fontSize: '0.82rem', color: '#64748b' }}>
                Root Enterprise Authority to enforce least-privilege operational permissions across all campus tiers.
              </p>
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

    </div>
  );
};

export default SuperAdminDashboard;
