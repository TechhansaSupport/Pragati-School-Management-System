import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { Calendar, Clock } from 'lucide-react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import PrincipalDashboard from './pages/PrincipalDashboard';
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
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import './index.css';

const MainLayout = ({ children }) => {
  const [isLayoutManagerOpen, setIsLayoutManagerOpen] = useState(false);
  
  // Theme preferences - Compact Mode enabled by default
  const [isCompactMode, setIsCompactMode] = useState(() => {
    const saved = localStorage.getItem('compactMode');
    return saved !== null ? saved === 'true' : true;
  });
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved !== null ? saved === 'true' : false;
  });

  useEffect(() => {
    if (isDarkMode) document.body.classList.add('dark-mode');
    else document.body.classList.remove('dark-mode');
    localStorage.setItem('darkMode', isDarkMode);
  }, [isDarkMode]);

  useEffect(() => {
    if (isCompactMode) document.body.classList.add('compact-view');
    else document.body.classList.remove('compact-view');
    localStorage.setItem('compactMode', isCompactMode);
  }, [isCompactMode]);

  // Live date & time
  const [currentDateTime, setCurrentDateTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedDate = currentDateTime.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  const formattedTime = currentDateTime.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });

  return (
    <div className="app-shell">
      <div className="ambient-background" style={{ filter: 'blur(4px)' }}></div>
      <Header />
      
      <div className="sub-header">
        <div className="sub-header-left">
          <div className="sub-header-item" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Calendar size={15} style={{ color: '#4F46E5' }} />
            <span style={{ fontWeight: 600, color: 'var(--color-text-main)' }}>
              {formattedDate}
            </span>
          </div>
          <span style={{ color: 'var(--color-border)', margin: '0 4px', userSelect: 'none' }}>•</span>
          <div className="sub-header-item" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Clock size={15} style={{ color: '#0F766E' }} />
            <span style={{ 
              fontWeight: 600, 
              color: 'var(--color-text-main)', 
              fontVariantNumeric: 'tabular-nums',
              letterSpacing: '0.4px'
            }}>
              {formattedTime}
            </span>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              marginLeft: '4px',
              padding: '2px 8px',
              borderRadius: '999px',
              background: 'rgba(22, 163, 74, 0.1)',
              border: '1px solid rgba(22, 163, 74, 0.2)',
              color: '#16a34a',
              fontSize: '0.7rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.04em'
            }}>
              <span style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: '#16a34a',
                boxShadow: '0 0 6px #16a34a',
                animation: 'pulse-dot 2s infinite ease-in-out'
              }} />
              LIVE
            </span>
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
        <Sidebar />
        <div className="content-layer hide-scrollbar">
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
      <div 
        className="layout-drawer"
        style={{
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
        }}
      >
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
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.85); }
        }
      `}</style>
    </div>
  );
};

const AppRoutes = () => {
  const location = useLocation();

  // Multi-window session synchronization:
  const pathParts = location.pathname.split('/').filter(Boolean);
  const pathSlug = pathParts[0];

  // If this window does not have active sessionStorage (e.g. opened in a new window/tab),
  // recover the admin session from localStorage
  if (!sessionStorage.getItem('userInfo')) {
    const cached = localStorage.getItem('authSession');
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (parsed.userInfo) sessionStorage.setItem('userInfo', JSON.stringify(parsed.userInfo));
        if (parsed.userRole) sessionStorage.setItem('userRole', parsed.userRole);
        if (parsed.token) sessionStorage.setItem('token', parsed.token);
      } catch (e) {}
    }
  }

  // Ensure this window operates strictly in the URL's school context
  if (pathSlug && pathSlug !== 'login') {
    sessionStorage.setItem('tenantSlug', pathSlug);
  }

  const role = sessionStorage.getItem('userRole');
  const tenantSlug = sessionStorage.getItem('tenantSlug') || (pathSlug && pathSlug !== 'login' ? pathSlug : '');

  // Handle root /
  if (location.pathname === '/') {
    if (role && tenantSlug) {
      return <Navigate to={`/${tenantSlug}/dashboard`} replace />;
    }
    return <Navigate to="/login" replace />;
  }

  // Handle global /login -> universal login page
  if (location.pathname === '/login') {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
      </Routes>
    );
  }

  // Handle specific school login
  if (location.pathname.endsWith('/login')) {
    return (
      <Routes>
        <Route path="/:tenantSlug/login" element={<Login />} />
      </Routes>
    );
  }

  // Auth Guard: If no role or tenant is set, redirect to login
  if (!role || !tenantSlug) {
    if (pathSlug && pathSlug !== 'login') {
      return <Navigate to={`/${pathSlug}/login`} replace />;
    }
    return <Navigate to="/login" replace />;
  }

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
        <Route path="/:tenantSlug" element={getDashboardForRole()} />
        <Route path="/:tenantSlug/dashboard" element={getDashboardForRole()} />
        <Route path="/:tenantSlug/superadmin" element={<SuperAdminDashboard />} />
        <Route path="/:tenantSlug/schools" element={role === 'superadmin' ? <SuperAdminDashboard /> : <Dashboard />} />
        <Route path="/:tenantSlug/library-dashboard" element={<LibraryDashboard />} />
        <Route path="/:tenantSlug/books" element={<LibraryBooks />} />
        <Route path="/:tenantSlug/transport-dashboard" element={<TransportDashboard />} />


        <Route path="/:tenantSlug/routes" element={<TransportRoutes />} />
        <Route path="/:tenantSlug/teacher-dashboard" element={<TeacherDashboard />} />
        <Route path="/:tenantSlug/student-dashboard" element={<StudentDashboard />} />
        <Route path="/:tenantSlug/parent-dashboard" element={<ParentDashboard />} />
        <Route path="/:tenantSlug/students" element={<Students />} />
        <Route path="/:tenantSlug/staff" element={<Staff />} />
        <Route path="/:tenantSlug/teachers" element={<Staff />} />
        <Route path="/:tenantSlug/academics" element={<Academics />} />
        <Route path="/:tenantSlug/finance" element={<Finance />} />
        <Route path="/:tenantSlug/reports" element={<Reports />} />
        <Route path="/:tenantSlug/communication" element={<Communication />} />
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
