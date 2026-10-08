import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LogOut, User, Settings, HelpCircle, ChevronDown } from 'lucide-react';
import SettingsModal from './SettingsModal';

const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const role = sessionStorage.getItem('userRole') || 'admin';
  const userInfo = JSON.parse(sessionStorage.getItem('userInfo') || '{}');
  
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState('profile');
  
  const profileRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  // Navigation based on Role
  let navItems = [];
  
  if (['superadmin', 'principal', 'admin'].includes(role)) {
    navItems = [
      { name: 'Dashboard', path: '/dashboard' },
      { name: 'Students', path: '/students' },
      { name: 'Staff', path: '/staff' },
      { name: 'Academics', path: '/academics' },
      { name: 'Finance', path: '/finance' },
      { name: 'Reports', path: '/reports' },
      { name: 'Communication', path: '/communication' }
    ];
  } else if (role === 'teacher') {
    navItems = [
      { name: 'Dashboard', path: '/teacher-dashboard' },
      { name: 'Academics', path: '/academics' },
      { name: 'Students', path: '/students' },
      { name: 'Communication', path: '/communication' }
    ];
  } else if (role === 'student') {
    navItems = [
      { name: 'Dashboard', path: '/student-dashboard' },
      { name: 'Communication', path: '/communication' }
    ];
  } else if (role === 'parent') {
    navItems = [
      { name: 'Dashboard', path: '/parent-dashboard' },
      { name: 'Communication', path: '/communication' }
    ];
  } else if (role === 'accountant') {
    navItems = [
      { name: 'Dashboard', path: '/finance' },
      { name: 'Reports', path: '/reports' },
      { name: 'Communication', path: '/communication' }
    ];
  } else if (role === 'librarian') {
    navItems = [
      { name: 'Dashboard', path: '/library-dashboard' },
      { name: 'Books', path: '/books' },
      { name: 'Communication', path: '/communication' }
    ];
  } else if (role === 'transport') {
    navItems = [
      { name: 'Dashboard', path: '/transport-dashboard' },
      { name: 'Routes', path: '/routes' },
      { name: 'Communication', path: '/communication' }
    ];
  } else {
    // Default fallback
    navItems = [
      { name: 'Dashboard', path: '/dashboard' },
      { name: 'Communication', path: '/communication' }
    ];
  }

  const handleLogout = () => {
    sessionStorage.removeItem('userRole');
    sessionStorage.removeItem('userInfo');
    navigate('/login');
  };

  return (
    <div className="top-header">
      <div className="brand" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <img src="/logo.png" alt="Pragati Logo" style={{ width: '36px', height: '36px', objectFit: 'contain', background: 'white', borderRadius: '50%', padding: '2px' }} />
        <span className="gradient-text" style={{ fontSize: '1.25rem', fontWeight: 800 }}>Pragati</span>
      </div>
      
      <div className="top-nav">
        {navItems.map(item => {
          const isActive = location.pathname === item.path || 
                           (item.path !== '/' && item.path !== '/dashboard' && location.pathname.startsWith(item.path));
          
          return (
            <Link 
              key={item.name} 
              to={item.path}
              className={`nav-item ${isActive ? 'active' : ''}`}
            >
              {item.name}
            </Link>
          );
        })}
      </div>

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
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'capitalize', marginTop: '-2px' }}>
              {role} Account
            </div>
          </div>
          
          <div className="user-avatar" style={{ border: '2px solid #fff', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            <img src={`https://ui-avatars.com/api/?name=${userInfo.uniqueId || role}&background=e0e7ff&color=3730a3&bold=true`} alt="User Avatar" />
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
            zIndex: 99999, // Super high z-index to avoid overlap
            width: '240px',
            overflow: 'hidden',
            animation: 'fade-in-down 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
          }}>
            <div style={{ padding: '16px', borderBottom: '1px solid rgba(226, 232, 240, 0.8)', background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.05) 0%, rgba(15, 118, 110, 0.05) 100%)' }}>
              <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#1e3a8a', textTransform: 'uppercase' }}>{userInfo.uniqueId || 'User Profile'}</div>
              <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Manage your account</div>
            </div>
            
            <div style={{ padding: '8px' }}>
              {[
                { id: 'profile', icon: User, label: 'My Profile', color: '#4F46E5' },
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
    </div>
  );
};

export default Header;
