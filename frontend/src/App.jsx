import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import PrincipalDashboard from './pages/PrincipalDashboard';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import LibraryDashboard from './pages/LibraryDashboard';
import LibraryBooks from './pages/LibraryBooks';
import TransportDashboard from './pages/TransportDashboard';
import Students from './pages/Students';
import Staff from './pages/Staff';
import Academics from './pages/Academics';
import Finance from './pages/Finance';
import Communication from './pages/Communication';
import Reports from './pages/Reports';
import TeacherDashboard from './pages/TeacherDashboard';
import StudentDashboard from './pages/StudentDashboard';
import ParentDashboard from './pages/ParentDashboard';
import Login from './pages/Login';
import TransportRoutes from './pages/TransportRoutes';
import './index.css';

const MainLayout = ({ children }) => {
  const [dateRange, setDateRange] = useState('Last month');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLayoutManagerOpen, setIsLayoutManagerOpen] = useState(false);
  
  // Theme preferences
  const [isCompactMode, setIsCompactMode] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (isDarkMode) document.body.classList.add('dark-mode');
    else document.body.classList.remove('dark-mode');
  }, [isDarkMode]);

  useEffect(() => {
    if (isCompactMode) document.body.classList.add('compact-view');
    else document.body.classList.remove('compact-view');
  }, [isCompactMode]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const dateOptions = [
    { id: 'today', label: 'Today', suffix: '(Just now)' },
    { id: 'week', label: 'This week', suffix: '(Last 7 days)' },
    { id: 'month', label: 'Last month', suffix: '(Previous 30 days)' },
    { id: 'year', label: 'This year', suffix: '(Year to date)' }
  ];

  const selectedOption = dateOptions.find(opt => opt.label === dateRange);

  return (
    <div className="app-shell">
      <div className="ambient-background" style={{ filter: 'blur(4px)' }}></div>
      <Header />
      
      <div className="sub-header">
        <div className="sub-header-left">
          <div 
            className="sub-header-item" 
            style={{ position: 'relative', cursor: 'pointer', userSelect: 'none' }}
            ref={dropdownRef}
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20V10"/><path d="M18 20V4"/><path d="M6 20v-4"/></svg>
            <span className="text-muted">Changes:</span> 
            <span style={{ fontWeight: 600, color: 'var(--color-text-main)' }}>{dateRange}</span> 
            <span className="text-muted" style={{ fontSize: '0.8rem' }}>{selectedOption?.suffix}</span>
            <span style={{ fontSize: '10px', transition: 'transform 0.2s', transform: isDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)', marginLeft: '4px' }}>▼</span>
            
            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: '0',
                marginTop: '8px',
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(16px)',
                border: '1px solid rgba(226, 232, 240, 0.8)',
                borderRadius: '12px',
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
                zIndex: 100,
                minWidth: '220px',
                overflow: 'hidden'
              }}>
                {dateOptions.map((opt) => (
                  <div 
                    key={opt.id}
                    style={{
                      padding: '12px 16px',
                      display: 'flex',
                      flexDirection: 'column',
                      cursor: 'pointer',
                      background: dateRange === opt.label ? 'rgba(79, 70, 229, 0.05)' : 'transparent',
                      borderLeft: dateRange === opt.label ? '3px solid #4F46E5' : '3px solid transparent',
                      transition: 'all 0.2s'
                    }}
                    onMouseOver={(e) => {
                      if (dateRange !== opt.label) e.currentTarget.style.background = 'rgba(241, 245, 249, 0.8)';
                    }}
                    onMouseOut={(e) => {
                      if (dateRange !== opt.label) e.currentTarget.style.background = 'transparent';
                    }}
                    onClick={() => {
                      setDateRange(opt.label);
                      setIsDropdownOpen(false);
                    }}
                  >
                    <span style={{ fontWeight: dateRange === opt.label ? 600 : 500, color: dateRange === opt.label ? '#4F46E5' : 'var(--color-text-main)', fontSize: '0.9rem' }}>
                      {opt.label}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{opt.suffix}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="sub-header-item" style={{marginLeft: '16px'}}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            <span className="text-muted">Last update:</span> 3 min ago
          </div>
        </div>
        <div className="sub-header-right">
          <div 
            className="sub-header-item" 
            style={{cursor: 'pointer', fontWeight: 500, color: 'var(--color-text-main)', transition: 'color 0.2s'}}
            onMouseOver={(e) => e.currentTarget.style.color = '#4F46E5'}
            onMouseOut={(e) => e.currentTarget.style.color = 'var(--color-text-main)'}
            onClick={() => setIsLayoutManagerOpen(true)}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
            Manage layout
          </div>
        </div>
      </div>

      <div className="main-wrapper">
        <div className="content-layer">
          {children}
        </div>
      </div>

      {/* Dark Overlay when Drawer is Open */}
      {isLayoutManagerOpen && (
        <div 
          onClick={() => setIsLayoutManagerOpen(false)}
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(15, 23, 42, 0.4)',
            backdropFilter: 'blur(4px)',
            zIndex: 999,
            animation: 'fade-in 0.3s ease'
          }}
        />
      )}

      {/* Layout Manager Drawer */}
      <div style={{
        position: 'fixed',
        top: 0,
        right: 0,
        bottom: 0,
        width: '360px',
        background: 'rgba(255, 255, 255, 0.85)',
        backdropFilter: 'blur(25px)',
        boxShadow: '-10px 0 40px rgba(0,0,0,0.1)',
        zIndex: 1000,
        transform: isLayoutManagerOpen ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        borderLeft: '1px solid rgba(226, 232, 240, 0.8)',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Drawer Header */}
        <div style={{ padding: '24px', borderBottom: '1px solid rgba(226, 232, 240, 0.8)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255, 255, 255, 0.5)' }}>
          <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#1e3a8a', fontWeight: 800 }}>Manage Layout</h3>
          <div 
            onClick={() => setIsLayoutManagerOpen(false)} 
            style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: '1px solid #e2e8f0', transition: 'all 0.2s' }}
            onMouseOver={e => e.currentTarget.style.background = '#f8fafc'}
            onMouseOut={e => e.currentTarget.style.background = 'white'}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </div>
        </div>

        {/* Drawer Body */}
        <div style={{ padding: '32px 24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '32px' }}>
          
          {/* Section: Appearance */}
          <div>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '16px' }}>Appearance</div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.95rem', color: '#1e3a8a' }}>Compact Mode</div>
                <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '2px' }}>Reduce spacing between widgets</div>
              </div>
              <div 
                onClick={() => setIsCompactMode(!isCompactMode)}
                style={{ width: '44px', height: '24px', borderRadius: '12px', background: isCompactMode ? '#4F46E5' : '#e2e8f0', position: 'relative', cursor: 'pointer', transition: 'background 0.3s' }}
              >
                <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: 'white', position: 'absolute', top: '3px', left: isCompactMode ? '23px' : '3px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', transition: 'all 0.3s' }}></div>
              </div>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.95rem', color: '#1e3a8a' }}>Dark Mode</div>
                <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '2px' }}>Switch to a dark theme</div>
              </div>
              <div 
                onClick={() => setIsDarkMode(!isDarkMode)}
                style={{ width: '44px', height: '24px', borderRadius: '12px', background: isDarkMode ? '#4F46E5' : '#e2e8f0', position: 'relative', cursor: 'pointer', transition: 'background 0.3s' }}
              >
                <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: 'white', position: 'absolute', top: '3px', left: isDarkMode ? '23px' : '3px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', transition: 'all 0.3s' }}></div>
              </div>
            </div>
          </div>

          <div style={{ height: '1px', background: 'rgba(226, 232, 240, 0.8)' }}></div>

          {/* Section: Widgets */}
          <div>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '16px' }}>Visible Widgets</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {['KPI Overview Cards', 'Revenue Chart', 'Recent Activities', 'Pending Task List', 'Attendance Overview'].map((widget, i) => (
                <label key={widget} style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', padding: '12px', background: 'rgba(255,255,255,0.6)', borderRadius: '12px', border: '1px solid rgba(226,232,240,0.6)', transition: 'all 0.2s' }} onMouseOver={e => e.currentTarget.style.borderColor = '#4F46E5'} onMouseOut={e => e.currentTarget.style.borderColor = 'rgba(226,232,240,0.6)'}>
                  <input type="checkbox" defaultChecked={i !== 4} style={{ width: '18px', height: '18px', accentColor: '#4F46E5', cursor: 'pointer' }} />
                  <span style={{ fontSize: '0.95rem', color: '#334155', fontWeight: 500 }}>{widget}</span>
                </label>
              ))}
            </div>
          </div>

        </div>

        {/* Drawer Footer */}
        <div style={{ padding: '24px', borderTop: '1px solid rgba(226, 232, 240, 0.8)', background: 'rgba(255, 255, 255, 0.5)' }}>
          <button style={{ width: '100%', padding: '14px', background: 'linear-gradient(135deg, #4F46E5 0%, #1e40af 100%)', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 700, fontSize: '1rem', cursor: 'pointer', boxShadow: '0 4px 15px -3px rgba(79, 70, 229, 0.4)', transition: 'all 0.2s' }} onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}>
            Save Layout Preferences
          </button>
        </div>
      </div>
      <style>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
};

const AppRoutes = () => {
  const location = useLocation();
  const isLoginPage = location.pathname === '/login';

  const role = sessionStorage.getItem('userRole');

  if (isLoginPage) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
      </Routes>
    );
  }

  // Auth Guard: If no role is set, redirect to login page
  if (!role) {
    return <Navigate to="/login" replace />;
  }

  // Dynamically serve the correct dashboard based on the user's role
  const getDashboardForRole = () => {
    switch(role) {
      case 'superadmin': return <SuperAdminDashboard />;
      case 'principal': return <PrincipalDashboard />;
      case 'teacher': return <TeacherDashboard />;
      case 'student': return <StudentDashboard />;
      case 'parent': return <ParentDashboard />;
      case 'librarian': return <LibraryDashboard />;
      case 'transport': return <TransportDashboard />;
      case 'accountant': return <Finance />;
      case 'admin':
      default: return <Dashboard />;
    }
  };

  return (
    <MainLayout>
      <Routes>
        <Route path="/" element={getDashboardForRole()} />
        <Route path="/dashboard" element={getDashboardForRole()} />
        <Route path="/library-dashboard" element={<LibraryDashboard />} />
        <Route path="/books" element={<LibraryBooks />} />
        <Route path="/transport-dashboard" element={<TransportDashboard />} />
        <Route path="/routes" element={<TransportRoutes />} />
        <Route path="/teacher-dashboard" element={<TeacherDashboard />} />
        <Route path="/student-dashboard" element={<StudentDashboard />} />
        <Route path="/parent-dashboard" element={<ParentDashboard />} />
        <Route path="/students" element={<Students />} />
        <Route path="/staff" element={<Staff />} />
        <Route path="/academics" element={<Academics />} />
        <Route path="/finance" element={<Finance />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/communication" element={<Communication />} />
        <Route path="*" element={getDashboardForRole()} />
      </Routes>
    </MainLayout>
  );
};

const App = () => {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
};

export default App;
