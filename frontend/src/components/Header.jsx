import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  LogOut, User, Settings, HelpCircle, ChevronDown, Search, X, 
  ArrowRight, Key, Building2, ExternalLink, Plus, UserCheck, Layers, Trash2, MapPin,
  ShieldCheck, Edit3, BookOpen, Calendar, Users, CreditCard
} from 'lucide-react';
import SettingsModal from './SettingsModal';
import CreateSchoolModal from './CreateSchoolModal';
import EditSchoolModal from './EditSchoolModal';
import AppointPrincipalModal from './AppointPrincipalModal';
import AppointAdminModal from './AppointAdminModal';
import DeleteSchoolModal from './DeleteSchoolModal';

const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const role = (sessionStorage.getItem('userRole') || 'admin').toLowerCase();
  const [userInfo, setUserInfo] = useState(() => JSON.parse(sessionStorage.getItem('userInfo') || '{}'));
  const tenantSlug = sessionStorage.getItem('tenantSlug') || '';
  
  const isLabAssistant = role === 'lab_assistant' || 
    (userInfo.role || '').toLowerCase() === 'lab_assistant' || 
    (userInfo.staffRole || '').toLowerCase() === 'lab assistant' || 
    (userInfo.designation || '').toLowerCase() === 'lab assistant' || 
    userInfo.uniqueId === 'assistant';

  const isSupportStaff = role === 'support_staff' || 
    role === 'support' || 
    role === 'frontdesk' ||
    (userInfo.role || '').toLowerCase() === 'support_staff' || 
    (userInfo.staffRole || '').toLowerCase() === 'support staff' || 
    (userInfo.designation || '').toLowerCase() === 'support staff' || 
    userInfo.uniqueId === 'support';
  
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState('profile');

  // Multi-School Management & Window Routing State
  const [schoolsList, setSchoolsList] = useState([]);
  const [isSchoolDropdownOpen, setIsSchoolDropdownOpen] = useState(false);
  const [isCreateSchoolOpen, setIsCreateSchoolOpen] = useState(false);
  const [targetSchoolForPrincipal, setTargetSchoolForPrincipal] = useState(null);
  const [targetSchoolForAdmin, setTargetSchoolForAdmin] = useState(null);
  const [targetSchoolForDelete, setTargetSchoolForDelete] = useState(null);
  const [targetSchoolForEdit, setTargetSchoolForEdit] = useState(null);
  const schoolDropdownRef = useRef(null);

  // Reactively track credential and user profile updates
  useEffect(() => {
    const handleProfileUpdate = (e) => {
      const updated = e.detail || JSON.parse(sessionStorage.getItem('userInfo') || '{}');
      setUserInfo(updated);
    };
    window.addEventListener('userProfileUpdated', handleProfileUpdate);
    return () => window.removeEventListener('userProfileUpdated', handleProfileUpdate);
  }, []);

  // Fetch full user profile to ensure Display Name is populated
  useEffect(() => {
    const token = userInfo.token || sessionStorage.getItem('token') || '';
    if (!token) return;
    const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };
    if (tenantSlug) headers['x-tenant-slug'] = tenantSlug;

    fetch('http://localhost:5000/api/auth/me', { headers })
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data?.user) {
          setUserInfo(prev => {
            const updated = { ...prev, ...data.user };
            sessionStorage.setItem('userInfo', JSON.stringify(updated));
            return updated;
          });
        }
      })
      .catch(() => {});
  }, [tenantSlug]);

  // Computed Display Name
  const userDisplayName = userInfo.name || userInfo.displayName || (role === 'superadmin' ? 'Super Admin' : (userInfo.uniqueId || role));

  // Fetch list of all managed schools for Admin
  const fetchSchoolsList = async () => {
    try {
      const token = userInfo.token || sessionStorage.getItem('token') || '';
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      if (tenantSlug) headers['x-tenant-slug'] = tenantSlug;

      const res = await fetch('http://localhost:5000/api/school/list', { headers });
      if (res.ok) {
        const data = await res.json();
        const list = data.schools || [];
        setSchoolsList(list);

        // If current tenantSlug is not in this user's authorized schools list, switch to primary school
        if (list.length > 0 && tenantSlug && !list.some(s => s.slug === tenantSlug)) {
          const target = list[0];
          sessionStorage.setItem('tenantSlug', target.slug);
          sessionStorage.setItem('schoolName', target.name);
          navigate(`/${target.slug}/dashboard`, { replace: true });
        }
      }
    } catch (err) {
      console.warn('Failed to fetch multi-school directory:', err);
    }
  };

  useEffect(() => {
    if (['admin', 'superadmin', 'principal'].includes(role.toLowerCase())) {
      fetchSchoolsList();
    }
    const handleSchoolUpdate = () => fetchSchoolsList();
    window.addEventListener('schoolListUpdated', handleSchoolUpdate);
    return () => window.removeEventListener('schoolListUpdated', handleSchoolUpdate);
  }, [tenantSlug, role]);

  // Dynamic School Name
  const [schoolName, setSchoolName] = useState(() => {
    return sessionStorage.getItem('schoolName') || 'Pragati School Management System';
  });

  useEffect(() => {
    const token = userInfo.token || sessionStorage.getItem('token') || '';
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (tenantSlug) headers['x-tenant-slug'] = tenantSlug;

    fetch('http://localhost:5000/api/school', { headers })
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data?.school?.name) {
          setSchoolName(data.school.name);
          sessionStorage.setItem('schoolName', data.school.name);
          document.title = `${data.school.name} | Pragati SMS`;
        }
      })
      .catch(() => {});

    const handleNameChange = (e) => {
      const newName = e.detail || sessionStorage.getItem('schoolName');
      if (newName) {
        setSchoolName(newName);
        document.title = `${newName} | Pragati SMS`;
      }
    };

    window.addEventListener('schoolNameChanged', handleNameChange);
    return () => window.removeEventListener('schoolNameChanged', handleNameChange);
  }, [tenantSlug]);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  
  const profileRef = useRef(null);
  const searchRef = useRef(null);
  const searchInputRef = useRef(null);

  // Keyboard shortcut (Cmd+K / Ctrl+K) to focus search
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
        setIsSearchOpen(true);
      } else if (e.key === 'Escape') {
        setIsSearchOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsSearchOpen(false);
      }
      if (schoolDropdownRef.current && !schoolDropdownRef.current.contains(event.target)) {
        setIsSchoolDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Quick modules database for search
  const searchableModules = useMemo(() => {
    if (role === 'accountant' || role === 'accounts') {
      return [
        { title: 'Financial Overview Ledger', category: 'Finance', icon: '⚡', path: '/finance?tab=ledger', keywords: 'finance overview ledger transactions balance records' },
        { title: 'Fees Collection & Receipts', category: 'Finance', icon: '💳', path: '/finance?tab=collections', keywords: 'fees collection receipts student fee payments tuition bus' },
        { title: 'Due & Overdue Student Fees', category: 'Finance', icon: '⚠️', path: '/finance?tab=pending', keywords: 'due fees overdue fees pending dues student arrears unpaid' },
        { title: 'School & Campus Expenses', category: 'Finance', icon: '📈', path: '/finance?tab=expenses', keywords: 'expenses campus bills utilities purchases maintenance facilities' },
        { title: 'Due Salaries & Staff Payroll', category: 'Finance', icon: '👥', path: '/finance?tab=salaries', keywords: 'due salaries salary payroll staff compensation faculty disburse' },
        { title: 'Change Password & Username', category: 'Security', icon: '🔑', path: '__security_modal__', keywords: 'password username credentials change login security reset credentials' },
      ];
    }
    if (isSupportStaff) {
      return [
        { title: 'Support Desk Command Center', category: 'Support', icon: '🏢', path: '/support-dashboard?tab=overview', keywords: 'support overview desk reception front sonu' },
        { title: 'Reception & Visitor Check-In', category: 'Reception', icon: '🎫', path: '/support-dashboard?tab=reception', keywords: 'visitor reception checkin pass badge guest parent entry' },
        { title: 'Fee Submission Counter Window', category: 'Accounts Window', icon: '💳', path: '/support-dashboard?tab=fees', keywords: 'fee fees submission collect payment receipt window dues student' },
        { title: 'Admissions & Inquiries Helpdesk', category: 'Helpdesk', icon: '📝', path: '/support-dashboard?tab=inquiries', keywords: 'inquiry admissions prospective parent call walkin follow' },
        { title: 'Student Movement & Gate Passes', category: 'Gate Pass', icon: '🚪', path: '/support-dashboard?tab=gatepasses', keywords: 'gate pass student departure exit leave late permission' },
        { title: 'Couriers & Dispatch Registry', category: 'Dispatch', icon: '📦', path: '/support-dashboard?tab=parcels', keywords: 'parcel courier post dispatch delivery speedpost' },
        { title: 'Change Password & Username', category: 'Security', icon: '🔑', path: '__security_modal__', keywords: 'password username credentials change login security reset credentials' },
      ];
    }
    if (isLabAssistant) {
      return [
        { title: 'Lab Command Center', category: 'Laboratories', icon: '🔬', path: '/teacher-dashboard?tab=overview', keywords: 'lab dashboard overview science assistant sujal' },
        { title: 'Scheduled Practical Classes', category: 'Laboratories', icon: '📅', path: '/teacher-dashboard?tab=schedule', keywords: 'classes scheduled practicals students batch timetable lab schedule' },
        { title: 'Equipments & Apparatus Registry', category: 'Laboratories', icon: '🔬', path: '/teacher-dashboard?tab=equipments', keywords: 'equipments apparatus microscope glassware instruments physics optics' },
        { title: 'Chemicals & Reagents Catalog', category: 'Laboratories', icon: '🧪', path: '/teacher-dashboard?tab=chemicals', keywords: 'chemicals reagents acid base solutions bottles inventory stock' },
        { title: 'Lab Safety & Inspection Protocol', category: 'Laboratories', icon: '🛡️', path: '/teacher-dashboard?tab=safety', keywords: 'safety audit checklist inspection eyewash fume hood hazard' },
        { title: 'Change Password & Username', category: 'Security', icon: '🔑', path: '__security_modal__', keywords: 'password username credentials change login security reset credentials' },
      ];
    }
    return [
      { title: 'Student Directory & Profiles', category: 'Students', icon: '🎓', path: '/students', keywords: 'student students admission rolls directory roll' },
      { title: 'Faculty & Staff Roster', category: 'Staff', icon: '👨‍🏫', path: '/staff', keywords: 'staff teachers faculty employee teachers provision' },
      { title: 'Curriculum & Class Architecture', category: 'Academics', icon: '📚', path: '/academics', keywords: 'academics curriculum class classes exams subject section' },
      { title: 'Fee Ledgers & Financials', category: 'Finance', icon: '💳', path: '/finance', keywords: 'finance fee fees ledger collections balance payment transactions' },
      { title: 'Analytics & Generated Reports', category: 'Reports', icon: '📊', path: '/reports', keywords: 'reports export analytics attendance results pdf csv' },
      { title: 'Notices & Messaging', category: 'Communication', icon: '💬', path: '/communication', keywords: 'communication notice messages announce chat inbox' },
      { title: 'Fleet & Bus Route Tracking', category: 'Facilities', icon: '🚌', path: '/transport-dashboard', keywords: 'transport bus routes fleet facilities vehicle tracking' },
      { title: 'Library Catalog & Books', category: 'Library', icon: '📖', path: '/library-dashboard', keywords: 'library book books circulation titles' },
      { title: 'Executive Overview Dashboard', category: 'Dashboard', icon: '⚡', path: '/dashboard', keywords: 'dashboard overview home analytics kpi' },
      { title: 'System Configuration', category: 'Settings', icon: '⚙️', path: '/dashboard?tab=config', keywords: 'configuration settings system tenant school' },
      { title: 'System Health & Infrastructure', category: 'Governance', icon: '🖥️', path: '/dashboard?tab=health', keywords: 'health infrastructure server uptime logs' },
      { title: 'Access Control & RBAC', category: 'Governance', icon: '🔑', path: '/dashboard?tab=rbac', keywords: 'rbac permissions access roles security' },
      { title: 'Security & Compliance', category: 'Governance', icon: '🛡️', path: '/dashboard?tab=security', keywords: 'security audit logs compliance ssl firewall' },
      { title: 'Change Password & Username', category: 'Security', icon: '🔑', path: '__security_modal__', keywords: 'password username credentials change login security reset credentials' },
    ];
  }, [role, isLabAssistant, isSupportStaff]);

  const filteredSearchItems = useMemo(() => {
    if (!searchQuery.trim()) return searchableModules.slice(0, 5);
    const q = searchQuery.toLowerCase().trim();
    return searchableModules.filter(item => 
      item.title.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q) ||
      item.keywords.toLowerCase().includes(q)
    );
  }, [searchQuery, searchableModules]);

  const handleSearchSelect = (targetPath) => {
    if (targetPath === '__security_modal__') {
      setSettingsTab('security');
      setIsSettingsOpen(true);
      setIsSearchOpen(false);
      setSearchQuery('');
      return;
    }
    const fullPath = tenantSlug ? `/${tenantSlug}${targetPath}` : targetPath;
    navigate(fullPath);
    setIsSearchOpen(false);
    setSearchQuery('');
  };

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter' && filteredSearchItems.length > 0) {
      handleSearchSelect(filteredSearchItems[0].path);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('userRole');
    sessionStorage.removeItem('userInfo');
    navigate(tenantSlug ? `/${tenantSlug}/login` : '/login');
  };

  return (
    <div className="top-header">
      {/* Product Branding with Full Name */}
      <div 
        className="brand" 
        onClick={() => navigate(tenantSlug ? ((role === 'accountant' || role === 'accounts') ? `/${tenantSlug}/finance` : `/${tenantSlug}/dashboard`) : '/dashboard')}
        style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0, cursor: 'pointer' }}
      >
        <img 
          src="/logo.png" 
          alt="Pragati Logo" 
          style={{ width: '36px', height: '36px', objectFit: 'contain', background: 'white', borderRadius: '50%', padding: '2px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }} 
        />
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span 
            className="gradient-text" 
            style={{ fontSize: '1.18rem', fontWeight: 800, whiteSpace: 'nowrap', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center' }}
          >
            Pragati School Management System
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px', position: 'relative' }}>
            {/* Multi-School Switcher & Window Launcher Pill */}
            <div ref={schoolDropdownRef} style={{ position: 'relative' }}>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsSchoolDropdownOpen(!isSchoolDropdownOpen);
                  if (!isSchoolDropdownOpen) fetchSchoolsList();
                }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '0.74rem',
                  fontWeight: 700,
                  color: 'var(--color-primary, #4F46E5)',
                  background: isSchoolDropdownOpen ? 'rgba(79, 70, 229, 0.15)' : 'rgba(79, 70, 229, 0.08)',
                  border: isSchoolDropdownOpen ? '1px solid #4F46E5' : '1px solid rgba(79, 70, 229, 0.25)',
                  padding: '2px 8px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  letterSpacing: '0.01em',
                  transition: 'all 0.2s',
                  boxShadow: isSchoolDropdownOpen ? '0 0 0 2px rgba(79, 70, 229, 0.15)' : 'none'
                }}
                title={role === 'superadmin' ? "Click to switch school or open separate window" : `${role === 'principal' ? 'Campus Principal' : (role === 'accountant' || role === 'accounts') ? 'Accounts Officer' : 'Branch Administrator'} for ${schoolName || 'Main Campus'}`}
              >
                <span>{role === 'superadmin' && location.pathname.includes('/superadmin') ? '🛡️' : '🏫'}</span>
                <span style={{ maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {role === 'superadmin' && location.pathname.includes('/superadmin') ? 'Super Admin Console' : (schoolName || 'Main Campus')}
                </span>
                {role === 'superadmin' && schoolsList.length > 1 && (
                  <span style={{ 
                    fontSize: '0.66rem', 
                    background: '#4F46E5', 
                    color: 'white', 
                    borderRadius: '10px', 
                    padding: '1px 5px', 
                    fontWeight: 800 
                  }}>
                    {schoolsList.length}
                  </span>
                )}
                {isSupportStaff ? (
                  <span style={{ 
                    fontSize: '0.64rem', 
                    background: 'rgba(234, 88, 12, 0.15)', 
                    color: '#c2410c', 
                    borderRadius: '5px', 
                    padding: '1px 6px', 
                    fontWeight: 800,
                    border: '1px solid rgba(234, 88, 12, 0.3)' 
                  }}>
                    Support Staff
                  </span>
                ) : role === 'admin' ? (
                  <span style={{ 
                    fontSize: '0.64rem', 
                    background: 'rgba(124, 58, 237, 0.15)', 
                    color: '#6d28d9', 
                    borderRadius: '5px', 
                    padding: '1px 6px', 
                    fontWeight: 800,
                    border: '1px solid rgba(124, 58, 237, 0.3)' 
                  }}>
                    Branch Admin
                  </span>
                ) : null}
                {role === 'principal' && (
                  <span style={{ 
                    fontSize: '0.64rem', 
                    background: 'rgba(14, 165, 233, 0.15)', 
                    color: '#0369a1', 
                    borderRadius: '5px', 
                    padding: '1px 6px', 
                    fontWeight: 800,
                    border: '1px solid rgba(14, 165, 233, 0.3)' 
                  }}>
                    Campus Principal
                  </span>
                )}
                {(role === 'accountant' || role === 'accounts') && (
                  <span style={{ 
                    fontSize: '0.64rem', 
                    background: 'rgba(16, 185, 129, 0.15)', 
                    color: '#059669', 
                    borderRadius: '5px', 
                    padding: '1px 6px', 
                    fontWeight: 800,
                    border: '1px solid rgba(16, 185, 129, 0.3)' 
                  }}>
                    Accounts Officer
                  </span>
                )}
                <ChevronDown size={13} style={{ transform: isSchoolDropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
              </button>

              {/* School Dropdown: Branch Admin Dedicated Hub OR Super Admin Multi-School Launcher */}
              {isSchoolDropdownOpen && (
                <div 
                  className="school-selector-dropdown"
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 8px)',
                    left: 0,
                    width: '380px',
                    maxWidth: '90vw',
                    background: 'var(--color-surface, #ffffff)',
                    border: '1px solid var(--color-border, rgba(226, 232, 240, 0.9))',
                    borderRadius: '14px',
                    boxShadow: '0 20px 45px -8px rgba(0, 0, 0, 0.35)',
                    zIndex: 999999,
                    overflow: 'hidden',
                    animation: 'fade-in-down 0.15s ease-out'
                  }}
                >
                  {role === 'principal' ? (
                    <div style={{ padding: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                        <span style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#0369a1', background: '#e0f2fe', padding: '2px 8px', borderRadius: '6px' }}>
                          🎓 Principal • Academic Authority Active
                        </span>
                        <span style={{ fontSize: '0.68rem', color: '#15803d', fontWeight: 700, background: '#dcfce7', padding: '2px 6px', borderRadius: '6px' }}>
                          ● Active Campus
                        </span>
                      </div>

                      <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#1e3a8a', marginBottom: '2px' }}>
                        {schoolName || 'Main Campus'}
                      </div>
                      <div style={{ fontSize: '0.73rem', color: '#64748b', marginBottom: '12px' }}>
                        Branch handle: <code style={{ background: '#f1f5f9', padding: '1px 5px', borderRadius: '4px', color: '#334155' }}>/{tenantSlug}</code>
                      </div>

                      <div style={{
                        background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
                        border: '1px solid #bae6fd',
                        borderRadius: '10px',
                        padding: '12px 14px',
                        fontSize: '0.78rem',
                        color: '#475569',
                        lineHeight: 1.5,
                        marginBottom: '14px'
                      }}>
                        <strong style={{ color: '#0284c7', display: 'block', marginBottom: '3px' }}>
                          Academic Leadership & Telemetry
                        </strong>
                        You have executive authority over all <strong>Academic Duties</strong> for <strong>{schoolName || tenantSlug}</strong>. You oversee curriculum, classes & sections, examinations, report cards, timetables, student growth, and teacher workload telemetry.
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <button
                          type="button"
                          onClick={() => {
                            setIsSchoolDropdownOpen(false);
                            navigate(`/${tenantSlug}/academics`);
                          }}
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            borderRadius: '8px',
                            background: '#4F46E5',
                            color: 'white',
                            border: 'none',
                            fontWeight: 700,
                            fontSize: '0.78rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '5px'
                          }}
                        >
                          <BookOpen size={13} /> Academics, Classes & Exams
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setIsSchoolDropdownOpen(false);
                            navigate(`/${tenantSlug}/timetable`);
                          }}
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            borderRadius: '8px',
                            background: '#0F766E',
                            color: 'white',
                            border: 'none',
                            fontWeight: 700,
                            fontSize: '0.78rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '5px'
                          }}
                        >
                          <Calendar size={13} /> Timetable & Period Matrix
                        </button>
                      </div>
                    </div>
                  ) : isSupportStaff ? (
                    <div style={{ padding: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                        <span style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#c2410c', background: '#ffedd5', padding: '2px 8px', borderRadius: '6px' }}>
                          🏢 Campus Support & Front Desk Active
                        </span>
                        <span style={{ fontSize: '0.68rem', color: '#15803d', fontWeight: 700, background: '#dcfce7', padding: '2px 6px', borderRadius: '6px' }}>
                          ● Shift Active
                        </span>
                      </div>

                      <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#1e3a8a', marginBottom: '2px' }}>
                        {schoolName || 'Main Campus'}
                      </div>
                      <div style={{ fontSize: '0.73rem', color: '#64748b', marginBottom: '12px' }}>
                        Front Desk Operator: <strong>{userDisplayName}</strong> (Support Staff)
                      </div>

                      <div style={{
                        background: 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)',
                        border: '1px solid #fed7aa',
                        borderRadius: '10px',
                        padding: '12px 14px',
                        fontSize: '0.78rem',
                        color: '#9a3412',
                        lineHeight: 1.5,
                        marginBottom: '14px'
                      }}>
                        <strong style={{ color: '#c2410c', display: 'block', marginBottom: '3px' }}>
                          Support & Front Desk Operations
                        </strong>
                        Assigned to Reception & Visitor Logs, Accounts Counter for Student Fee Submissions, Admission Inquiries, and Gate Pass authorizations. Administrative settings are managed by School Administrators.
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <button
                          type="button"
                          onClick={() => {
                            setIsSchoolDropdownOpen(false);
                            navigate(`/${tenantSlug}/support-dashboard?tab=reception`);
                          }}
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            borderRadius: '8px',
                            background: '#2563eb',
                            color: 'white',
                            border: 'none',
                            fontWeight: 700,
                            fontSize: '0.78rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '5px'
                          }}
                        >
                          <Users size={13} /> Reception & Visitor Gate Passes
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setIsSchoolDropdownOpen(false);
                            navigate(`/${tenantSlug}/support-dashboard?tab=fees`);
                          }}
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            borderRadius: '8px',
                            background: '#059669',
                            color: 'white',
                            border: 'none',
                            fontWeight: 700,
                            fontSize: '0.78rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '5px'
                          }}
                        >
                          <CreditCard size={13} /> Open Fee Submission Window
                        </button>
                      </div>
                    </div>
                  ) : role === 'admin' ? (
                    <div style={{ padding: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                        <span style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#6d28d9', background: '#ede9fe', padding: '2px 8px', borderRadius: '6px' }}>
                          🏛️ Branch Administrator Authority Active
                        </span>
                        <span style={{ fontSize: '0.68rem', color: '#15803d', fontWeight: 700, background: '#dcfce7', padding: '2px 6px', borderRadius: '6px' }}>
                          ● Active Campus
                        </span>
                      </div>

                      <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#1e3a8a', marginBottom: '2px' }}>
                        {schoolName || 'Main Campus'}
                      </div>
                      <div style={{ fontSize: '0.73rem', color: '#64748b', marginBottom: '12px' }}>
                        Branch handle: <code style={{ background: '#f1f5f9', padding: '1px 5px', borderRadius: '4px', color: '#334155' }}>/{tenantSlug}</code>
                      </div>

                      <div style={{
                        background: 'linear-gradient(135deg, #faf5ff 0%, #f5f3ff 100%)',
                        border: '1px solid #ddd6fe',
                        borderRadius: '10px',
                        padding: '12px 14px',
                        fontSize: '0.78rem',
                        color: '#475569',
                        lineHeight: 1.5,
                        marginBottom: '14px'
                      }}>
                        <strong style={{ color: '#6d28d9', display: 'block', marginBottom: '3px' }}>
                          Branch Administration Authority
                        </strong>
                        You are appointed to manage all operational duties for <strong>{schoolName || tenantSlug}</strong> (Students, Staff, Academics, Finance, Facilities, Timetables, and Reports). Cross-branch infrastructure is managed centrally by the Super Administrator.
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <button
                          type="button"
                          onClick={() => {
                            setIsSchoolDropdownOpen(false);
                            const currentSchool = schoolsList.find(s => s.slug === tenantSlug) || { slug: tenantSlug, name: schoolName };
                            setTargetSchoolForPrincipal(currentSchool);
                          }}
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            borderRadius: '8px',
                            background: '#0F766E',
                            color: 'white',
                            border: 'none',
                            fontWeight: 700,
                            fontSize: '0.78rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '5px'
                          }}
                        >
                          <UserCheck size={13} /> Appoint / Manage Principal
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setIsSchoolDropdownOpen(false);
                            navigate(`/${tenantSlug}/dashboard?tab=config`);
                          }}
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            borderRadius: '8px',
                            background: '#4F46E5',
                            color: 'white',
                            border: 'none',
                            fontWeight: 700,
                            fontSize: '0.78rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '5px'
                          }}
                        >
                          <Settings size={13} /> Campus Settings & Geofence
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Super Admin Multi-School Header */}
                      <div style={{ 
                        padding: '12px 14px', 
                        background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.08) 0%, rgba(15, 118, 110, 0.08) 100%)', 
                        borderBottom: '1px solid #e2e8f0',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <div>
                          <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#1e3a8a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Building2 size={15} color="#4F46E5" /> My Schools & Campuses
                          </div>
                          <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                            Open in separate windows or switch context
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            setIsSchoolDropdownOpen(false);
                            setIsCreateSchoolOpen(true);
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            background: '#4F46E5',
                            color: 'white',
                            border: 'none',
                            padding: '4px 8px',
                            borderRadius: '6px',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            cursor: 'pointer'
                          }}
                        >
                          <Plus size={12} /> New School
                        </button>
                      </div>

                  {/* School Items List */}
                  <div style={{ maxHeight: '310px', overflowY: 'auto', padding: '6px' }}>
                    {role === 'superadmin' && (
                      <div 
                        onClick={() => {
                          navigate(`/${tenantSlug}/superadmin`);
                          setIsSchoolDropdownOpen(false);
                        }}
                        style={{
                          padding: '10px 12px',
                          borderRadius: '10px',
                          marginBottom: '8px',
                          background: location.pathname.includes('/superadmin') ? 'rgba(79, 70, 229, 0.1)' : '#f8fafc',
                          border: location.pathname.includes('/superadmin') ? '1.5px solid #4F46E5' : '1px solid #e2e8f0',
                          cursor: 'pointer',
                          transition: 'all 0.15s'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <ShieldCheck size={16} color="#4F46E5" />
                            <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#1e3a8a' }}>
                              Central Super Admin Console
                            </span>
                          </div>
                          {location.pathname.includes('/superadmin') && (
                            <span style={{ fontSize: '0.65rem', fontWeight: 700, background: '#dcfce7', color: '#15803d', padding: '2px 6px', borderRadius: '6px' }}>
                              ● Active
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '3px', marginLeft: '24px' }}>
                          Organization overview • Not tied to any single branch
                        </div>
                      </div>
                    )}

                    {schoolsList.length === 0 ? (
                      <div style={{ padding: '16px', textAlign: 'center', color: '#64748b', fontSize: '0.8rem' }}>
                        No schools found. Register a new school below.
                      </div>
                    ) : (
                      schoolsList.map((s) => {
                        const isCurrent = s.slug === tenantSlug || (!tenantSlug && s.isCurrent);
                        return (
                          <div 
                            key={s.slug}
                            style={{
                              padding: '10px 12px',
                              borderRadius: '10px',
                              marginBottom: '6px',
                              background: isCurrent ? 'rgba(79, 70, 229, 0.05)' : '#ffffff',
                              border: isCurrent ? '1.5px solid #4F46E5' : '1px solid #f1f5f9',
                              transition: 'all 0.15s'
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                              <div>
                                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  {s.name}
                                </div>
                                <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
                                  slug: <code style={{ background: '#f1f5f9', padding: '1px 4px', borderRadius: '4px' }}>{s.slug}</code>
                                </div>
                              </div>
                              {isCurrent && (
                                <span style={{
                                  fontSize: '0.65rem',
                                  fontWeight: 700,
                                  background: '#dcfce7',
                                  color: '#15803d',
                                  padding: '2px 6px',
                                  borderRadius: '6px',
                                  border: '1px solid rgba(22, 163, 74, 0.3)'
                                }}>
                                  ● Active Window
                                </span>
                              )}
                            </div>

                            {s.address && (
                              <div style={{ fontSize: '0.72rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px', margin: '2px 0 4px 0' }}>
                                <MapPin size={11} color="#4F46E5" /> {s.address}
                              </div>
                            )}

                            {/* Admin, Principal & Staff Info */}
                            <div style={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: '8px', 
                              fontSize: '0.73rem', 
                              color: '#475569', 
                              margin: '6px 0',
                              flexWrap: 'wrap'
                            }}>
                              <span style={{ 
                                display: 'inline-flex', 
                                alignItems: 'center', 
                                gap: '4px',
                                background: s.admin ? 'rgba(109, 40, 217, 0.08)' : 'rgba(245, 158, 11, 0.1)',
                                color: s.admin ? '#6d28d9' : '#b45309',
                                padding: '2px 6px',
                                borderRadius: '5px',
                                fontWeight: 600
                              }}>
                                <ShieldCheck size={11} /> 
                                {s.admin?.name ? `Admin: ${s.admin.name}` : 'Admin: Not appointed'}
                              </span>
                              <span style={{ 
                                display: 'inline-flex', 
                                alignItems: 'center', 
                                gap: '4px',
                                background: s.principal ? 'rgba(15, 118, 110, 0.08)' : 'rgba(245, 158, 11, 0.1)',
                                color: s.principal ? '#0f766e' : '#b45309',
                                padding: '2px 6px',
                                borderRadius: '5px',
                                fontWeight: 600
                              }}>
                                <UserCheck size={11} /> 
                                {s.principal?.name ? `Principal: ${s.principal.name}` : 'Principal: Not appointed'}
                              </span>
                              <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>•</span>
                              <span style={{ fontSize: '0.7rem', color: '#64748b' }}>
                                👥 {s.staffCount ?? 0} Staff
                              </span>
                              <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>•</span>
                              <span style={{ fontSize: '0.7rem', color: '#64748b' }}>
                                🎓 {s.studentCount ?? 0} Students
                              </span>
                            </div>

                            {/* Action Buttons for this School */}
                            <div style={{ display: 'flex', gap: '6px', marginTop: '8px', flexWrap: 'wrap' }}>
                              {/* Open in Separate Window (Key Feature) */}
                              <button
                                type="button"
                                onClick={() => {
                                  window.open(`/${s.slug}/dashboard`, '_blank');
                                }}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  fontSize: '0.72rem',
                                  fontWeight: 700,
                                  background: 'linear-gradient(135deg, #1e3a8a 0%, #4F46E5 100%)',
                                  color: 'white',
                                  border: 'none',
                                  padding: '4px 8px',
                                  borderRadius: '6px',
                                  cursor: 'pointer',
                                  boxShadow: '0 2px 6px rgba(79, 70, 229, 0.25)'
                                }}
                                title="Open this school in a separate browser window/tab"
                              >
                                <ExternalLink size={11} /> Separate Window
                              </button>

                              {/* Switch in Current Window */}
                              {!isCurrent && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    sessionStorage.setItem('tenantSlug', s.slug);
                                    sessionStorage.setItem('schoolName', s.name);
                                    navigate(`/${s.slug}/dashboard`);
                                    setIsSchoolDropdownOpen(false);
                                  }}
                                  style={{
                                    fontSize: '0.72rem',
                                    fontWeight: 600,
                                    background: '#f8fafc',
                                    color: '#334155',
                                    border: '1px solid #cbd5e1',
                                    padding: '4px 8px',
                                    borderRadius: '6px',
                                    cursor: 'pointer'
                                  }}
                                >
                                  Switch Here
                                </button>
                              )}

                              {/* Appoint Branch Admin Trigger (Super Admin Authority) */}
                              {role === 'superadmin' && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setTargetSchoolForAdmin(s);
                                    setIsSchoolDropdownOpen(false);
                                  }}
                                  style={{
                                    fontSize: '0.72rem',
                                    fontWeight: 600,
                                    background: 'rgba(109, 40, 217, 0.08)',
                                    color: '#6d28d9',
                                    border: '1px solid rgba(109, 40, 217, 0.25)',
                                    padding: '4px 8px',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '3px'
                                  }}
                                  title="Appoint or change Branch Administrator for this school"
                                >
                                  🛡️ {s.admin ? 'Edit Branch Admin' : 'Appoint Admin'}
                                </button>
                              )}

                              {/* Appoint Principal Trigger */}
                              <button
                                type="button"
                                onClick={() => {
                                  setTargetSchoolForPrincipal(s);
                                  setIsSchoolDropdownOpen(false);
                                }}
                                style={{
                                  fontSize: '0.72rem',
                                  fontWeight: 600,
                                  background: 'rgba(15, 118, 110, 0.08)',
                                  color: '#0f766e',
                                  border: '1px solid rgba(15, 118, 110, 0.2)',
                                  padding: '4px 8px',
                                  borderRadius: '6px',
                                  cursor: 'pointer'
                                }}
                                title="Appoint or change Principal for this school"
                              >
                                👤 {s.principal ? 'Edit Principal' : 'Appoint Principal'}
                              </button>

                              {/* Edit School Details Trigger */}
                              <button
                                type="button"
                                onClick={() => {
                                  setTargetSchoolForEdit(s);
                                  setIsSchoolDropdownOpen(false);
                                }}
                                style={{
                                  fontSize: '0.72rem',
                                  fontWeight: 600,
                                  background: 'rgba(79, 70, 229, 0.08)',
                                  color: '#4F46E5',
                                  border: '1px solid rgba(79, 70, 229, 0.25)',
                                  padding: '4px 8px',
                                  borderRadius: '6px',
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '3px'
                                }}
                                title="Edit school name, address, and info"
                              >
                                <Edit3 size={11} /> Edit Info
                              </button>

                              {/* Delete School Trigger (Strictly Super Admin Only) */}
                              {role === 'superadmin' && (
                                schoolsList.length > 1 ? (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setTargetSchoolForDelete(s);
                                      setIsSchoolDropdownOpen(false);
                                    }}
                                    style={{
                                      fontSize: '0.72rem',
                                      fontWeight: 600,
                                      background: '#fef2f2',
                                      color: '#dc2626',
                                      border: '1px solid #fecaca',
                                      padding: '4px 8px',
                                      borderRadius: '6px',
                                      cursor: 'pointer',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '4px'
                                    }}
                                    title="Permanently delete this campus branch"
                                  >
                                    <Trash2 size={11} /> Delete
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    disabled
                                    style={{
                                      fontSize: '0.72rem',
                                      fontWeight: 500,
                                      background: '#f8fafc',
                                      color: '#94a3b8',
                                      border: '1px dashed #cbd5e1',
                                      padding: '4px 8px',
                                      borderRadius: '6px',
                                      cursor: 'not-allowed',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '4px'
                                    }}
                                    title="Cannot delete the only remaining school campus in your organization"
                                  >
                                    <Trash2 size={11} /> Only Campus (Protected)
                                  </button>
                                )
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Dropdown Footer */}
                  <div style={{
                    padding: '8px 12px',
                    borderTop: '1px solid #f1f5f9',
                    background: '#f8fafc',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '0.73rem'
                  }}>
                    <button
                      type="button"
                      onClick={() => {
                        setIsSchoolDropdownOpen(false);
                        navigate(tenantSlug ? `/${tenantSlug}/dashboard?tab=schools` : '/dashboard?tab=schools');
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#4F46E5',
                        fontWeight: 700,
                        cursor: 'pointer',
                        padding: 0,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <Layers size={12} /> Manage All Campuses Hub
                    </button>
                    <span style={{ color: '#94a3b8' }}>
                      {schoolsList.length} Active {schoolsList.length === 1 ? 'School' : 'Schools'}
                    </span>
                  </div>
                  </>
                  )}
                </div>
              )}
            </div>

            {role === 'superadmin' && (
              <span 
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(tenantSlug ? `/${tenantSlug}/superadmin?tab=schools` : '/superadmin?tab=schools');
                }}
                title="Super Admin Authority: Open Multi-School & Campus Hub"
                style={{
                  fontSize: '0.67rem',
                  fontWeight: 600,
                  padding: '2px 7px',
                  borderRadius: '5px',
                  background: 'rgba(15, 118, 110, 0.1)',
                  color: '#0F766E',
                  border: '1px solid rgba(15, 118, 110, 0.2)',
                  cursor: 'pointer',
                  letterSpacing: '0.02em',
                  transition: 'all 0.2s',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '3px'
                }}
                onMouseOver={(ev) => ev.currentTarget.style.background = 'rgba(15, 118, 110, 0.2)'}
                onMouseOut={(ev) => ev.currentTarget.style.background = 'rgba(15, 118, 110, 0.1)'}
              >
                🏢 All Schools
              </span>
            )}
          </div>
        </div>
      </div>
      
      {/* Global Interactive Search Bar */}
      <div 
        ref={searchRef}
        style={{
          position: 'relative',
          flex: 1,
          maxWidth: '560px',
          minWidth: '240px',
          margin: '0 24px'
        }}
      >
        <div style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          width: '100%'
        }}>
          <Search 
            size={16} 
            color="#64748b" 
            style={{ position: 'absolute', left: '14px', pointerEvents: 'none', zIndex: 2 }} 
          />
          <input 
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setIsSearchOpen(true);
            }}
            onFocus={() => setIsSearchOpen(true)}
            onKeyDown={handleSearchKeyDown}
            placeholder={
              isSupportStaff
                ? "Search visitors, fee submission receipts, inquiries, passes... (Press ↵)"
                : isLabAssistant 
                ? "Search lab apparatus, chemicals, classes, safety... (Press ↵)"
                : role === 'accountant' || role === 'accounts'
                ? "Search ledgers, fees, expenses, payroll... (Press ↵)"
                : "Search students, faculty, records, modules... (Press ↵ to jump)"
            }
            style={{
              width: '100%',
              boxSizing: 'border-box',
              padding: '9px 44px 9px 38px',
              borderRadius: '12px',
              border: isSearchOpen ? '1px solid #4F46E5' : '1px solid rgba(226, 232, 240, 0.9)',
              background: 'rgba(255, 255, 255, 0.85)',
              backdropFilter: 'blur(10px)',
              fontSize: '0.86rem',
              color: '#1e293b',
              outline: 'none',
              boxShadow: isSearchOpen ? '0 0 0 3px rgba(79, 70, 229, 0.15)' : '0 2px 8px rgba(0, 0, 0, 0.03)',
              transition: 'all 0.2s'
            }}
          />
          {searchQuery ? (
            <X 
              size={15} 
              color="#94a3b8" 
              onClick={() => {
                setSearchQuery('');
                searchInputRef.current?.focus();
              }}
              style={{ position: 'absolute', right: '12px', cursor: 'pointer', zIndex: 2 }} 
            />
          ) : (
            <div style={{
              position: 'absolute',
              right: '12px',
              fontSize: '0.7rem',
              padding: '2px 6px',
              borderRadius: '6px',
              background: '#f1f5f9',
              border: '1px solid #e2e8f0',
              color: '#64748b',
              fontWeight: 600,
              pointerEvents: 'none',
              zIndex: 2
            }}>
              ⌘K
            </div>
          )}
        </div>

        {/* Quick Search Dropdown / Command Palette */}
        {isSearchOpen && (
          <div style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            left: 0,
            right: 0,
            background: 'rgba(255, 255, 255, 0.98)',
            backdropFilter: 'blur(25px)',
            WebkitBackdropFilter: 'blur(25px)',
            borderRadius: '14px',
            border: '1px solid rgba(226, 232, 240, 0.9)',
            boxShadow: '0 12px 36px -4px rgba(0, 0, 0, 0.15)',
            zIndex: 99999,
            overflow: 'hidden',
            padding: '6px'
          }}>
            <div style={{ padding: '6px 10px', fontSize: '0.7rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #f1f5f9', marginBottom: '4px' }}>
              {searchQuery ? 'Matching Modules & Tools' : 'Quick Navigation Shortcuts'}
            </div>
            
            {filteredSearchItems.length > 0 ? (
              filteredSearchItems.map((item, idx) => (
                <div 
                  key={idx}
                  onClick={() => handleSearchSelect(item.path)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    color: '#1e293b',
                    fontWeight: 500,
                    transition: 'background 0.15s'
                  }}
                  onMouseOver={e => e.currentTarget.style.background = 'rgba(79, 70, 229, 0.08)'}
                  onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '1.1rem' }}>{item.icon}</span>
                    <div>
                      <div style={{ fontWeight: 600, color: '#1e3a8a' }}>{item.title}</div>
                      <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{item.category}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: '#4F46E5', fontWeight: 600 }}>
                    Jump <ArrowRight size={13} />
                  </div>
                </div>
              ))
            ) : (
              <div style={{ padding: '16px', textAlign: 'center', color: '#64748b', fontSize: '0.85rem' }}>
                No modules found matching "{searchQuery}"
              </div>
            )}
          </div>
        )}
      </div>

      {/* User Profile on the Right */}
      <div className="header-right" ref={profileRef} style={{ position: 'relative', zIndex: 9999 }}>
        <div 
          onClick={() => setIsProfileOpen(!isProfileOpen)}
          className="header-profile-btn"
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '12px', 
            cursor: 'pointer',
            padding: '6px 12px',
            borderRadius: '12px',
            background: isProfileOpen ? 'rgba(79, 70, 229, 0.1)' : 'transparent',
            border: isProfileOpen ? '1px solid rgba(79, 70, 229, 0.25)' : '1px solid transparent',
            transition: 'all 0.2s'
          }}
        >
          <div style={{ textAlign: 'right' }}>
            <div style={{ 
              fontSize: '0.88rem', 
              fontWeight: 700, 
              color: 'var(--color-text-main)',
              letterSpacing: '-0.01em',
              whiteSpace: 'nowrap',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              {role === 'superadmin' && <span style={{ fontSize: '0.92rem' }} role="img" aria-label="crown">👑</span>}
              <span>{userDisplayName}</span>
            </div>
          </div>
          
          <div className="user-avatar" style={{ 
            width: '38px',
            height: '38px',
            borderRadius: '50%',
            overflow: 'hidden',
            border: '2px solid #fff', 
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#e0e7ff',
            flexShrink: 0
          }}>
            <img 
              src={userInfo.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(userDisplayName)}&background=e0e7ff&color=3730a3&bold=true`} 
              alt="User Avatar" 
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>

          <ChevronDown size={16} color="var(--color-text-muted)" style={{ transform: isProfileOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
        </div>

        {/* Profile Dropdown Menu */}
        {isProfileOpen && (
          <div 
            className="user-profile-dropdown"
            style={{
              position: 'absolute',
              top: '100%',
              right: '0',
              marginTop: '8px',
              background: 'var(--color-surface, #FFFFFF)',
              border: '1px solid var(--color-border, #E2E8F0)',
              borderRadius: '16px',
              boxShadow: '0 20px 45px -10px rgba(0, 0, 0, 0.35), 0 0 0 1px var(--color-border, #E2E8F0)',
              zIndex: 999999,
              width: '260px',
              overflow: 'hidden',
              animation: 'fade-in-down 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
          >
            <div 
              className="user-profile-dropdown-header"
              style={{ 
                padding: '16px', 
                borderBottom: '1px solid var(--color-border, rgba(226, 232, 240, 0.8))', 
                background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.08) 0%, rgba(15, 118, 110, 0.08) 100%)', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '12px' 
              }}
            >
              <div style={{ width: '42px', height: '42px', borderRadius: '50%', overflow: 'hidden', border: '2px solid var(--color-surface, white)', boxShadow: '0 2px 6px rgba(0,0,0,0.12)', flexShrink: 0, background: '#e0e7ff' }}>
                <img 
                  src={userInfo.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(userDisplayName)}&background=e0e7ff&color=3730a3&bold=true`} 
                  alt="Avatar" 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                />
              </div>
              <div style={{ overflow: 'hidden' }}>
                <div 
                  className="user-profile-dropdown-name"
                  style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--color-text-main, #1e3a8a)', textTransform: 'capitalize', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'flex', alignItems: 'center', gap: '5px' }}
                >
                  {role === 'superadmin' && <span>👑</span>}
                  <span>{userDisplayName}</span>
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted, #64748b)' }}>@{userInfo.uniqueId || role}</div>
              </div>
            </div>
            
            <div style={{ padding: '8px' }}>
              {[
                { id: 'profile', icon: User, label: 'My Profile', color: '#6366F1' },
                { id: 'security', icon: Key, label: 'Change Password & Username', color: '#0F766E' },
                { id: 'account', icon: Settings, label: 'Account Settings', color: 'var(--color-text-muted, #64748b)' },
                { id: 'help', icon: HelpCircle, label: 'Help & Support', color: 'var(--color-text-muted, #64748b)' }
              ].map((item, i) => (
                <div 
                  key={i}
                  className="profile-menu-item"
                  onClick={() => {
                    setIsProfileOpen(false);
                    setSettingsTab(item.id);
                    setIsSettingsOpen(true);
                  }}
                  style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', cursor: 'pointer', borderRadius: '8px', transition: 'all 0.2s' }}
                >
                  <item.icon size={16} color={item.color} />
                  <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--color-text-main)' }}>{item.label}</span>
                </div>
              ))}
            </div>

            <div style={{ borderTop: '1px solid var(--color-border, rgba(226, 232, 240, 0.8))', padding: '8px' }}>
              <div 
                className="profile-menu-logout"
                onClick={handleLogout}
                style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', cursor: 'pointer', borderRadius: '8px', transition: 'all 0.2s' }}
              >
                <LogOut size={16} color="#DC2626" style={{ transition: 'all 0.2s' }} />
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#DC2626', transition: 'all 0.2s' }}>Log out</span>
              </div>
            </div>
          </div>
        )}
        <style>{`
          @keyframes fade-in-down {
            0% { opacity: 0; transform: translateY(-10px) scale(0.95); }
            100% { opacity: 1; transform: translateY(0) scale(1); }
          }
        `}</style>
      </div>
      
      {/* Universal Settings Modal */}
      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        initialTab={settingsTab} 
        userInfo={userInfo} 
        role={role} 
      />

      {/* Register New School Modal */}
      <CreateSchoolModal
        isOpen={isCreateSchoolOpen}
        onClose={() => setIsCreateSchoolOpen(false)}
        onSchoolCreated={(newSchool) => {
          fetchSchoolsList();
          window.dispatchEvent(new CustomEvent('schoolListUpdated'));
        }}
      />

      {/* Appoint / Change Principal Modal */}
      <AppointPrincipalModal
        isOpen={!!targetSchoolForPrincipal}
        targetSchool={targetSchoolForPrincipal}
        schoolsList={schoolsList}
        onClose={() => setTargetSchoolForPrincipal(null)}
        onPrincipalAppointed={(updatedSchool) => {
          fetchSchoolsList();
          window.dispatchEvent(new CustomEvent('schoolListUpdated'));
          if (updatedSchool?.slug === tenantSlug) {
            window.dispatchEvent(new CustomEvent('principalUpdated', { detail: updatedSchool.principal }));
          }
        }}
      />

      {/* Appoint Branch Admin Modal (Super Admin Authority) */}
      <AppointAdminModal
        isOpen={!!targetSchoolForAdmin}
        targetSchool={targetSchoolForAdmin}
        onClose={() => setTargetSchoolForAdmin(null)}
        onAdminAppointed={() => {
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

      {/* Edit School Details Modal */}
      <EditSchoolModal
        isOpen={!!targetSchoolForEdit}
        school={targetSchoolForEdit}
        onClose={() => setTargetSchoolForEdit(null)}
        onSchoolUpdated={(updated) => {
          fetchSchoolsList();
          window.dispatchEvent(new CustomEvent('schoolListUpdated'));
          if (updated?.slug === tenantSlug) {
            setSchoolName(updated.name);
            sessionStorage.setItem('schoolName', updated.name);
            document.title = `${updated.name} | Pragati SMS`;
          }
        }}
      />
    </div>
  );
};

export default Header;
