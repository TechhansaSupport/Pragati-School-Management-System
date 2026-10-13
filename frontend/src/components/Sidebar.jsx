import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Activity, Users, UserCheck, BookOpen, CreditCard, 
  Bus, Mail, Settings, Server, Key, ShieldCheck, Building2 
} from 'lucide-react';

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const tenantSlug = sessionStorage.getItem('tenantSlug') || '';

  const modules = [
    { id: 'Overview', label: 'Overview', icon: Activity },
    { id: 'Students & IDs', label: 'Students', icon: Users },
    { id: 'Teachers', label: 'Teachers', icon: UserCheck },
    { id: 'Academics & Exams', label: 'Academics', icon: BookOpen },
    { id: 'Finance & Fees', label: 'Finance', icon: CreditCard },
    { id: 'Facilities', label: 'Facilities', icon: Bus },
    { id: 'Communication & Reports', label: 'Communication', icon: Mail },
    { id: 'My Schools & Campuses', label: 'My Schools', icon: Building2 },
    { id: 'System Configuration', label: 'Configuration', icon: Settings },
    { id: 'System Health & Infra', label: 'System Health', icon: Server },
    { id: 'RBAC (Access Control)', label: 'Access Control', icon: Key },
    { id: 'Security & Compliance', label: 'Security', icon: ShieldCheck },
  ];

  const isModuleActive = (modId) => {
    const path = location.pathname;
    const search = location.search;

    switch (modId) {
      case 'Overview':
        return (path.endsWith('/dashboard') || path === `/${tenantSlug}` || path === `/${tenantSlug}/`) && !search.includes('tab=');
      case 'Students & IDs':
        return path.includes('/students');
      case 'Teachers':
        return path.includes('/staff') || path.includes('/teachers');
      case 'Academics & Exams':
        return path.includes('/academics');
      case 'Finance & Fees':
        return path.includes('/finance');
      case 'Facilities':
        return path.includes('/transport') || path.includes('/routes');
      case 'Communication & Reports':
        return path.includes('/communication') || path.includes('/reports');
      case 'My Schools & Campuses':
        return (path.endsWith('/dashboard') && search.includes('tab=schools')) || path.includes('/schools');
      case 'System Configuration':
        return path.endsWith('/dashboard') && search.includes('tab=config');
      case 'System Health & Infra':
        return path.endsWith('/dashboard') && search.includes('tab=health');
      case 'RBAC (Access Control)':
        return path.endsWith('/dashboard') && search.includes('tab=rbac');
      case 'Security & Compliance':
        return path.endsWith('/dashboard') && search.includes('tab=security');
      default:
        return false;
    }
  };

  const handleNav = (modId) => {
    const base = tenantSlug ? `/${tenantSlug}` : '';
    switch (modId) {
      case 'Overview':
        navigate(`${base}/dashboard`);
        break;
      case 'Students & IDs':
        navigate(`${base}/students`);
        break;
      case 'Teachers':
        navigate(`${base}/staff`);
        break;
      case 'Academics & Exams':
        navigate(`${base}/academics`);
        break;
      case 'Finance & Fees':
        navigate(`${base}/finance`);
        break;
      case 'Facilities':
        navigate(`${base}/transport-dashboard`);
        break;
      case 'Communication & Reports':
        navigate(`${base}/communication`);
        break;
      case 'My Schools & Campuses':
        navigate(`${base}/dashboard?tab=schools`);
        break;
      case 'System Configuration':
        navigate(`${base}/dashboard?tab=config`);
        break;
      case 'System Health & Infra':
        navigate(`${base}/dashboard?tab=health`);
        break;
      case 'RBAC (Access Control)':
        navigate(`${base}/dashboard?tab=rbac`);
        break;
      case 'Security & Compliance':
        navigate(`${base}/dashboard?tab=security`);
        break;
      default:
        navigate(`${base}/dashboard`);
    }
  };

  return (
    <aside 
      className="dashboard-sidebar hide-scrollbar"
      style={{
        width: '205px',
        height: '100%',
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        padding: '14px 8px',
        background: 'rgba(255, 255, 255, 0.88)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderRight: '1px solid rgba(226, 232, 240, 0.8)',
        boxShadow: '4px 0 24px rgba(0, 0, 0, 0.05)',
        overflowY: 'auto',
        borderRadius: 0,
        zIndex: 20
      }}
    >
      {/* Operational Modules Section */}
      <div 
        className="dashboard-sidebar-section" 
        style={{ fontSize: '0.7rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '4px 8px 2px 8px' }}
      >
        School Operations
      </div>

      {modules.slice(0, 7).map(mod => {
        const isActive = isModuleActive(mod.id);
        return (
          <button
            key={mod.id}
            className="dashboard-sidebar-item"
            data-tooltip={mod.label || mod.id}
            title={mod.label || mod.id}
            onClick={() => handleNav(mod.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 9px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.81rem',
              transition: 'all 0.2s',
              textAlign: 'left',
              width: '100%',
              background: isActive ? 'linear-gradient(135deg, #4F46E5 0%, #4338CA 100%)' : 'transparent',
              color: isActive ? 'white' : '#475569',
              boxShadow: isActive ? '0 4px 14px rgba(79, 70, 229, 0.35)' : 'none',
              transform: isActive ? 'translateX(4px)' : 'none'
            }}
            onMouseOver={e => {
              if (!isActive) {
                e.currentTarget.style.background = 'rgba(79, 70, 229, 0.08)';
                e.currentTarget.style.color = '#4F46E5';
              }
            }}
            onMouseOut={e => {
              if (!isActive) {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = '#475569';
              }
            }}
          >
            <mod.icon size={15} color={isActive ? 'white' : '#64748b'} />
            <span className="dashboard-sidebar-label" style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {mod.label || mod.id}
            </span>
          </button>
        );
      })}

      {/* Governance & System Section */}
      <div 
        className="dashboard-sidebar-section" 
        style={{ fontSize: '0.7rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '10px 8px 2px 8px' }}
      >
        System Governance
      </div>

      {modules.slice(7).map(mod => {
        const isActive = isModuleActive(mod.id);
        return (
          <button
            key={mod.id}
            className="dashboard-sidebar-item"
            data-tooltip={mod.label || mod.id}
            title={mod.label || mod.id}
            onClick={() => handleNav(mod.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 9px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.81rem',
              transition: 'all 0.2s',
              textAlign: 'left',
              width: '100%',
              background: isActive ? 'linear-gradient(135deg, #4F46E5 0%, #4338CA 100%)' : 'transparent',
              color: isActive ? 'white' : '#475569',
              boxShadow: isActive ? '0 4px 14px rgba(79, 70, 229, 0.35)' : 'none',
              transform: isActive ? 'translateX(4px)' : 'none'
            }}
            onMouseOver={e => {
              if (!isActive) {
                e.currentTarget.style.background = 'rgba(79, 70, 229, 0.08)';
                e.currentTarget.style.color = '#4F46E5';
              }
            }}
            onMouseOut={e => {
              if (!isActive) {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = '#475569';
              }
            }}
          >
            <mod.icon size={15} color={isActive ? 'white' : '#64748b'} />
            <span className="dashboard-sidebar-label" style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {mod.label || mod.id}
            </span>
          </button>
        );
      })}
    </aside>
  );
};

export default Sidebar;
