import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  LogOut, User, Settings, HelpCircle, ChevronDown, Search, X, 
  ArrowRight, Key, Building2, ExternalLink, Plus, UserCheck, Layers, Trash2, MapPin
} from 'lucide-react';
import SettingsModal from './SettingsModal';
import CreateSchoolModal from './CreateSchoolModal';
import AppointPrincipalModal from './AppointPrincipalModal';
import DeleteSchoolModal from './DeleteSchoolModal';

const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const role = sessionStorage.getItem('userRole') || 'admin';
  const [userInfo, setUserInfo] = useState(() => JSON.parse(sessionStorage.getItem('userInfo') || '{}'));
  const tenantSlug = sessionStorage.getItem('tenantSlug') || '';
  
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState('profile');

  // Multi-School Management & Window Routing State
  const [schoolsList, setSchoolsList] = useState([]);
  const [isSchoolDropdownOpen, setIsSchoolDropdownOpen] = useState(false);
  const [isCreateSchoolOpen, setIsCreateSchoolOpen] = useState(false);
  const [targetSchoolForPrincipal, setTargetSchoolForPrincipal] = useState(null);
  const [targetSchoolForDelete, setTargetSchoolForDelete] = useState(null);
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
        setSchoolsList(data.schools || []);
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
  const searchableModules = [
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

  const filteredSearchItems = useMemo(() => {
    if (!searchQuery.trim()) return searchableModules.slice(0, 5);
    const q = searchQuery.toLowerCase().trim();
    return searchableModules.filter(item => 
      item.title.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q) ||
      item.keywords.toLowerCase().includes(q)
    );
  }, [searchQuery]);

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
        onClick={() => navigate(tenantSlug ? `/${tenantSlug}/dashboard` : '/dashboard')}
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
                title="Click to switch school or open separate window"
              >
                <span>🏫</span>
                <span style={{ maxWidth: '170px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {schoolName || 'Main Campus'}
                </span>
                {schoolsList.length > 1 && (
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
                <ChevronDown size={13} style={{ transform: isSchoolDropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
              </button>

              {/* Multi-School Selector & Window Launcher Dropdown */}
              {isSchoolDropdownOpen && (
                <div 
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 8px)',
                    left: 0,
                    width: '380px',
                    maxWidth: '90vw',
                    background: 'rgba(255, 255, 255, 0.98)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    border: '1px solid rgba(226, 232, 240, 0.9)',
                    borderRadius: '14px',
                    boxShadow: '0 16px 40px -8px rgba(0, 0, 0, 0.2)',
                    zIndex: 99999,
                    overflow: 'hidden',
                    animation: 'fade-in-down 0.15s ease-out'
                  }}
                >
                  {/* Header */}
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
                    {(role === 'admin' || role === 'superadmin') && (
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
                    )}
                  </div>

                  {/* School Items List */}
                  <div style={{ maxHeight: '310px', overflowY: 'auto', padding: '6px' }}>
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

                            {/* Principal & Staff Info */}
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

                              {/* Appoint Principal Trigger */}
                              {(role === 'admin' || role === 'superadmin') && (
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
                              )}

                              {/* Delete School Trigger */}
                              {(role === 'admin' || role === 'superadmin') && schoolsList.length > 1 && (
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
                </div>
              )}
            </div>

            {(role === 'admin' || role === 'superadmin' || role === 'principal') && (
              <span 
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(tenantSlug ? `/${tenantSlug}/dashboard?tab=schools` : '/dashboard?tab=schools');
                }}
                title="Admin Authority: Open Multi-School & Campus Hub"
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
          maxWidth: '520px',
          margin: '0 auto'
        }}
      >
        <div style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center'
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
            placeholder="Search students, faculty, records, modules... (Press ↵ to jump)"
            style={{
              width: '100%',
              padding: '9px 40px 9px 38px',
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
              right: '10px',
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
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '12px', 
            cursor: 'pointer',
            padding: '6px 12px',
            borderRadius: '12px',
            background: isProfileOpen ? 'rgba(79, 70, 229, 0.05)' : 'transparent',
            border: isProfileOpen ? '1px solid rgba(79, 70, 229, 0.2)' : '1px solid transparent',
            transition: 'all 0.2s'
          }}
          onMouseOver={e => { if(!isProfileOpen) e.currentTarget.style.background = 'rgba(241, 245, 249, 0.8)' }}
          onMouseOut={e => { if(!isProfileOpen) e.currentTarget.style.background = 'transparent' }}
        >
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-text-main)', textTransform: 'capitalize' }}>
              {userInfo.uniqueId || role}
            </div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: role === 'superadmin' ? '#7c3aed' : (role === 'admin' ? '#4f46e5' : 'var(--color-text-muted)'), marginTop: '-2px' }}>
              {role === 'superadmin' ? '👑 Super Admin' : (role === 'admin' ? 'Branch Admin' : (role === 'principal' ? 'Principal' : `${role} Account`))}
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
              src={userInfo.profileImage || `https://ui-avatars.com/api/?name=${userInfo.uniqueId || role}&background=e0e7ff&color=3730a3&bold=true`} 
              alt="User Avatar" 
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>

          <ChevronDown size={16} color="var(--color-text-muted)" style={{ transform: isProfileOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
        </div>

        {/* Profile Dropdown Menu */}
        {isProfileOpen && (
          <div style={{
            position: 'absolute',
            top: '100%',
            right: '0',
            marginTop: '8px',
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(226, 232, 240, 0.8)',
            borderRadius: '16px',
            boxShadow: '0 10px 40px -10px rgba(0, 0, 0, 0.15)',
            zIndex: 99999,
            width: '240px',
            overflow: 'hidden',
            animation: 'fade-in-down 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
          }}>
            <div style={{ padding: '16px', borderBottom: '1px solid rgba(226, 232, 240, 0.8)', background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.05) 0%, rgba(15, 118, 110, 0.05) 100%)', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '50%', overflow: 'hidden', border: '2px solid white', boxShadow: '0 2px 6px rgba(0,0,0,0.08)', flexShrink: 0, background: '#e0e7ff' }}>
                <img 
                  src={userInfo.profileImage || `https://ui-avatars.com/api/?name=${userInfo.uniqueId || role}&background=e0e7ff&color=3730a3&bold=true`} 
                  alt="Avatar" 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                />
              </div>
              <div style={{ overflow: 'hidden' }}>
                <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#1e3a8a', textTransform: 'capitalize', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{userInfo.name || userInfo.uniqueId || 'User Profile'}</div>
                <div style={{ fontSize: '0.78rem', color: '#64748b' }}>@{userInfo.uniqueId || role}</div>
              </div>
            </div>
            
            <div style={{ padding: '8px' }}>
              {[
                { id: 'profile', icon: User, label: 'My Profile', color: '#4F46E5' },
                { id: 'security', icon: Key, label: 'Change Password & Username', color: '#0F766E' },
                { id: 'account', icon: Settings, label: 'Account Settings', color: '#64748b' },
                { id: 'help', icon: HelpCircle, label: 'Help & Support', color: '#64748b' }
              ].map((item, i) => (
                <div 
                  key={i}
                  onClick={() => {
                    setIsProfileOpen(false);
                    setSettingsTab(item.id);
                    setIsSettingsOpen(true);
                  }}
                  style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', cursor: 'pointer', borderRadius: '8px', transition: 'all 0.2s' }}
                  onMouseOver={e => { e.currentTarget.style.background = 'rgba(79, 70, 229, 0.05)'; e.currentTarget.style.color = '#4F46E5'; }}
                  onMouseOut={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--color-text-main)'; }}
                >
                  <item.icon size={16} color={item.color} />
                  <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--color-text-main)' }}>{item.label}</span>
                </div>
              ))}
            </div>

            <div style={{ borderTop: '1px solid rgba(226, 232, 240, 0.8)', padding: '8px' }}>
              <div 
                onClick={handleLogout}
                style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', cursor: 'pointer', borderRadius: '8px', transition: 'all 0.2s' }}
                onMouseOver={e => { e.currentTarget.style.background = 'rgba(220, 38, 38, 0.05)'; e.currentTarget.querySelector('span').style.color = '#DC2626'; e.currentTarget.querySelector('svg').style.stroke = '#DC2626'; }}
                onMouseOut={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.querySelector('span').style.color = '#64748b'; e.currentTarget.querySelector('svg').style.stroke = '#64748b'; }}
              >
                <LogOut size={16} color="#64748b" style={{ transition: 'all 0.2s' }} />
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b', transition: 'all 0.2s' }}>Log out</span>
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
        onClose={() => setTargetSchoolForPrincipal(null)}
        onPrincipalAppointed={(updatedSchool) => {
          fetchSchoolsList();
          window.dispatchEvent(new CustomEvent('schoolListUpdated'));
          if (updatedSchool?.slug === tenantSlug) {
            window.dispatchEvent(new CustomEvent('principalUpdated', { detail: updatedSchool.principal }));
          }
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
    </div>
  );
};

export default Header;
