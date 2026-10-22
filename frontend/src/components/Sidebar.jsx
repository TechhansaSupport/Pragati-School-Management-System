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
  const role = (sessionStorage.getItem('userRole') || 'admin').toLowerCase();
  const isSuperAdmin = role === 'superadmin' || location.pathname.includes('/superadmin');

  // Multi-role sectioned navigation model
  const getSidebarSections = () => {
    if (isSuperAdmin) {
      return [
        {
          title: 'Central Operations',
          items: [
            { id: 'SuperAdmin Hub', label: 'Command Center', icon: Activity },
            { id: 'My Schools & Campuses', label: 'Schools & Campuses', icon: Building2 },
            { id: 'Staff Assignments', label: 'Role Assignments', icon: UserCheck },
            { id: 'Teachers', label: 'All Faculty & Staff', icon: Users },
            { id: 'Students & IDs', label: 'All Students', icon: Users },
            { id: 'Academics & Exams', label: 'Curriculum & Plans', icon: BookOpen },
            { id: 'Finance & Fees', label: 'Central Financials', icon: CreditCard },
            { id: 'Transport Dashboard', label: 'Fleet & Transport', icon: Bus },
            { id: 'Library Dashboard', label: 'Library & Media', icon: BookOpen },
          ]
        },
        {
          title: 'System Governance',
          items: [
            { id: 'System Configuration', label: 'Configuration', icon: Settings },
            { id: 'System Health & Infra', label: 'Infra & Licensing', icon: Server },
            { id: 'RBAC (Access Control)', label: 'Access Control', icon: Key },
            { id: 'Security & Compliance', label: 'Security & Audit', icon: ShieldCheck },
          ]
        }
      ];
    }

    if (role === 'teacher') {
      return [
        {
          title: 'Faculty Portal',
          items: [
            { id: 'Teacher Dashboard', label: 'Dashboard', icon: Activity },
            { id: 'Academics & Exams', label: 'Classes & Grading', icon: BookOpen },
            { id: 'Students & IDs', label: 'My Students', icon: Users },
            { id: 'Communication & Reports', label: 'Messages & Notices', icon: Mail },
          ]
        }
      ];
    }

    if (role === 'student') {
      return [
        {
          title: 'Student Portal',
          items: [
            { id: 'Student Dashboard', label: 'My Dashboard', icon: Activity },
            { id: 'Academics & Exams', label: 'My Academics', icon: BookOpen },
            { id: 'Communication & Reports', label: 'Announcements', icon: Mail },
          ]
        }
      ];
    }

    if (role === 'parent') {
      return [
        {
          title: 'Parent Portal',
          items: [
            { id: 'Parent Dashboard', label: 'Parent Portal', icon: Activity },
            { id: 'Academics & Exams', label: 'Student Progress', icon: BookOpen },
            { id: 'Finance & Fees', label: 'Fee Payments', icon: CreditCard },
            { id: 'Communication & Reports', label: 'School Notices', icon: Mail },
          ]
        }
      ];
    }

    if (role === 'librarian') {
      return [
        {
          title: 'Library Portal',
          items: [
            { id: 'Library Dashboard', label: 'Library Overview', icon: Activity },
            { id: 'Book Catalog', label: 'Books & Inventory', icon: BookOpen },
            { id: 'Communication & Reports', label: 'Announcements', icon: Mail },
          ]
        }
      ];
    }

    if (role === 'transport') {
      return [
        {
          title: 'Fleet & Transit',
          items: [
            { id: 'Transport Dashboard', label: 'Transport Hub', icon: Bus },
            { id: 'Routes', label: 'Routes & Stops', icon: Activity },
            { id: 'Communication & Reports', label: 'Parent Alerts', icon: Mail },
          ]
        }
      ];
    }

    // Default: School Admin / Principal
    return [
      {
        title: 'School Operations',
        items: [
          { id: 'Overview', label: 'Overview', icon: Activity },
          { id: 'Attendance Register', label: 'Attendance', icon: Activity },
          { id: 'Timetable Matrix', label: 'Timetable', icon: BookOpen },
          { id: 'Students & IDs', label: 'Students', icon: Users },
          { id: 'Teachers', label: 'Teachers & Staff', icon: UserCheck },
          { id: 'Academics & Exams', label: 'Academics', icon: BookOpen },
          { id: 'Finance & Fees', label: 'Finance', icon: CreditCard },
          { id: 'Facilities', label: 'Facilities & Fleet', icon: Bus },
          { id: 'Communication & Reports', label: 'Communication', icon: Mail },
        ]
      },
      {
        title: 'System Governance',
        items: [
          { id: 'My Schools & Campuses', label: 'My Campuses', icon: Building2 },
          { id: 'System Configuration', label: 'Configuration', icon: Settings },
          { id: 'System Health & Infra', label: 'System Health', icon: Server },
          { id: 'RBAC (Access Control)', label: 'Access Control', icon: Key },
          { id: 'Security & Compliance', label: 'Security', icon: ShieldCheck },
        ]
      }
    ];
  };

  const isModuleActive = (modId) => {
    const path = location.pathname;
    const search = location.search;

    switch (modId) {
      case 'SuperAdmin Hub':
        return path.includes('/superadmin') && (!search.includes('tab=') || search.includes('tab=overview'));
      case 'Staff Assignments':
        return path.includes('/superadmin') && search.includes('tab=assignments');
      case 'Teacher Dashboard':
        return path.includes('/teacher-dashboard');
      case 'Student Dashboard':
        return path.includes('/student-dashboard');
      case 'Parent Dashboard':
        return path.includes('/parent-dashboard');
      case 'Library Dashboard':
        return path.includes('/library-dashboard') || path.includes('/books') || (path.includes('/superadmin') && search.includes('tab=library'));
      case 'Book Catalog':
        return path.includes('/books');
      case 'Transport Dashboard':
        return path.includes('/transport-dashboard') || path.includes('/routes') || (path.includes('/superadmin') && search.includes('tab=transport'));
      case 'Routes':
        return path.includes('/routes');
      case 'Reports':
        return path.includes('/reports');
      case 'Overview':
        return (path.endsWith('/dashboard') || path === `/${tenantSlug}` || path === `/${tenantSlug}/`) && !search.includes('tab=');
      case 'Attendance Register':
        return path.includes('/attendance');
      case 'Timetable Matrix':
        return path.includes('/academics') && search.includes('tab=timetable');
      case 'Students & IDs':
        return path.includes('/students') || (path.includes('/dashboard') && search.includes('tab=students'));
      case 'Teachers':
        return path.includes('/staff') || path.includes('/teachers') || (path.includes('/dashboard') && search.includes('tab=teachers'));
      case 'Academics & Exams':
        return path.includes('/academics') || (path.includes('/dashboard') && search.includes('tab=academics'));
      case 'Finance & Fees':
        return path.includes('/finance') || (path.includes('/dashboard') && search.includes('tab=finance'));
      case 'Facilities':
        return path.includes('/transport') || path.includes('/routes') || (path.includes('/dashboard') && search.includes('tab=facilities'));
      case 'Communication & Reports':
        return path.includes('/communication') || path.includes('/reports') || (path.includes('/dashboard') && search.includes('tab=communication'));
      case 'My Schools & Campuses':
        return (path.includes('/superadmin') && search.includes('tab=schools')) || 
               (path.includes('/dashboard') && search.includes('tab=schools')) || 
               path.endsWith('/schools');
      case 'System Configuration':
        return search.includes('tab=config');
      case 'System Health & Infra':
        return search.includes('tab=health');
      case 'RBAC (Access Control)':
        return search.includes('tab=rbac');
      case 'Security & Compliance':
        return search.includes('tab=security');
      default:
        return false;
    }
  };

  const handleNav = (modId) => {
    const base = tenantSlug ? `/${tenantSlug}` : '';
    switch (modId) {
      case 'SuperAdmin Hub':
        navigate(`${base}/superadmin`);
        break;
      case 'Staff Assignments':
        navigate(`${base}/superadmin?tab=assignments`);
        break;
      case 'Teacher Dashboard':
        navigate(`${base}/teacher-dashboard`);
        break;
      case 'Student Dashboard':
        navigate(`${base}/student-dashboard`);
        break;
      case 'Parent Dashboard':
        navigate(`${base}/parent-dashboard`);
        break;
      case 'Library Dashboard':
        navigate(`${base}/library-dashboard`);
        break;
      case 'Book Catalog':
        navigate(`${base}/books`);
        break;
      case 'Transport Dashboard':
        navigate(`${base}/transport-dashboard`);
        break;
      case 'Routes':
        navigate(`${base}/routes`);
        break;
      case 'Reports':
        navigate(`${base}/reports`);
        break;
      case 'Overview':
        navigate(isSuperAdmin ? `${base}/superadmin` : `${base}/dashboard`);
        break;
      case 'Attendance Register':
        navigate(`${base}/attendance`);
        break;
      case 'Timetable Matrix':
        navigate(`${base}/academics?tab=timetable`);
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
        navigate(isSuperAdmin ? `${base}/superadmin?tab=schools` : `${base}/dashboard?tab=schools`);
        break;
      case 'System Configuration':
        navigate(isSuperAdmin ? `${base}/superadmin?tab=config` : `${base}/dashboard?tab=config`);
        break;
      case 'System Health & Infra':
        navigate(isSuperAdmin ? `${base}/superadmin?tab=health` : `${base}/dashboard?tab=health`);
        break;
      case 'RBAC (Access Control)':
        navigate(isSuperAdmin ? `${base}/superadmin?tab=rbac` : `${base}/dashboard?tab=rbac`);
        break;
      case 'Security & Compliance':
        navigate(isSuperAdmin ? `${base}/superadmin?tab=security` : `${base}/dashboard?tab=security`);
        break;
      default:
        navigate(isSuperAdmin ? `${base}/superadmin` : `${base}/dashboard`);
    }
  };

  const sections = getSidebarSections();

  return (
    <aside 
      className="dashboard-sidebar hide-scrollbar"
      style={{
        width: '215px',
        height: '100%',
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        padding: '14px 8px',
        background: 'rgba(255, 255, 255, 0.92)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderRight: '1px solid rgba(226, 232, 240, 0.8)',
        boxShadow: '4px 0 24px rgba(0, 0, 0, 0.04)',
        overflowY: 'auto',
        borderRadius: 0,
        zIndex: 20
      }}
    >
      {sections.map((sec, sIdx) => (
        <React.Fragment key={sec.title || sIdx}>
          <div 
            className="dashboard-sidebar-section" 
            style={{ 
              fontSize: '0.68rem', 
              fontWeight: 800, 
              color: '#94a3b8', 
              textTransform: 'uppercase', 
              letterSpacing: '0.08em', 
              padding: sIdx === 0 ? '4px 8px 2px 8px' : '10px 8px 2px 8px' 
            }}
          >
            {sec.title}
          </div>

          {sec.items.map(mod => {
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
                  padding: '7px 10px',
                  borderRadius: '9px',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: 650,
                  fontSize: '0.82rem',
                  transition: 'all 0.18s ease-in-out',
                  textAlign: 'left',
                  width: '100%',
                  background: isActive ? 'linear-gradient(135deg, #4F46E5 0%, #4338CA 100%)' : 'transparent',
                  color: isActive ? 'white' : '#475569',
                  boxShadow: isActive ? '0 4px 14px rgba(79, 70, 229, 0.32)' : 'none',
                  transform: isActive ? 'translateX(3px)' : 'none'
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
                <mod.icon size={16} color={isActive ? 'white' : '#64748b'} />
                <span className="dashboard-sidebar-label" style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {mod.label || mod.id}
                </span>
              </button>
            );
          })}
        </React.Fragment>
      ))}
    </aside>
  );
};

export default Sidebar;
