import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, Users, UserCheck, BookOpen, CreditCard, 
  Bus, Mail, Settings, Server, Key, ShieldCheck, Building2,
  CalendarCheck, CalendarDays, GraduationCap, Library, Navigation,
  AlertCircle, TrendingUp, FlaskConical, Microscope, TestTube, Package
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
            { id: 'SuperAdmin Hub', label: 'Command Center', icon: LayoutDashboard },
            { id: 'My Schools & Campuses', label: 'Schools & Campuses', icon: Building2 },
            { id: 'Staff Assignments', label: 'Role Assignments', icon: UserCheck },
            { id: 'Teachers', label: 'All Faculty & Staff', icon: Users },
            { id: 'Students & IDs', label: 'All Students', icon: GraduationCap },
            { id: 'Academics & Exams', label: 'Curriculum & Plans', icon: BookOpen },
            { id: 'Timetable Matrix', label: 'Master Timetable', icon: CalendarDays },
            { id: 'Finance & Fees', label: 'Central Financials', icon: CreditCard },
            { id: 'Transport Dashboard', label: 'Fleet & Transport', icon: Bus },
            { id: 'Library Dashboard', label: 'Library & Media', icon: Library },
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

    if (role === 'lab_assistant') {
      return [
        {
          title: 'Science Laboratories',
          items: [
            { id: 'Lab Dashboard', label: 'Lab Command Center', icon: LayoutDashboard },
            { id: 'Lab Schedule', label: 'Scheduled Classes', icon: CalendarDays },
            { id: 'Lab Equipments', label: 'Equipments & Apparatus', icon: Microscope },
            { id: 'Lab Chemicals', label: 'Chemicals & Reagents', icon: TestTube },
            { id: 'Lab Safety', label: 'Safety & Audit', icon: ShieldCheck },
            { id: 'Communication & Reports', label: 'Messages & Notices', icon: Mail },
          ]
        }
      ];
    }

    if (role === 'support_staff' || role === 'support' || role === 'frontdesk') {
      return [
        {
          title: 'Front Desk & Support',
          items: [
            { id: 'Support Overview', label: 'Support Command Center', icon: LayoutDashboard },
            { id: 'Reception Desk', label: 'Reception & Visitors', icon: Users },
            { id: 'Fee Window', label: 'Fee Accounts Window', icon: CreditCard },
            { id: 'Admission Desk', label: 'Admissions & Inquiries', icon: GraduationCap },
            { id: 'Gate Movement', label: 'Student Gate Passes', icon: ShieldCheck },
            { id: 'Courier Log', label: 'Couriers & Dispatch', icon: Package },
            { id: 'Communication & Reports', label: 'Notices & Messages', icon: Mail },
          ]
        }
      ];
    }

    if (role === 'teacher') {
      return [
        {
          title: 'Faculty Portal',
          items: [
            { id: 'Teacher Dashboard', label: 'Dashboard', icon: LayoutDashboard },
            { id: 'Academics & Exams', label: 'Classes & Grading', icon: BookOpen },
            { id: 'Students & IDs', label: 'My Students', icon: GraduationCap },
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
            { id: 'Student Dashboard', label: 'My Dashboard', icon: LayoutDashboard },
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
            { id: 'Parent Dashboard', label: 'Parent Portal', icon: LayoutDashboard },
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
            { id: 'Library Dashboard', label: 'Library Overview', icon: Library },
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
            { id: 'Routes', label: 'Routes & Stops', icon: Navigation },
            { id: 'Communication & Reports', label: 'Parent Alerts', icon: Mail },
          ]
        }
      ];
    }

    if (role === 'principal') {
      return [
        {
          title: 'Academic Leadership',
          items: [
            { id: 'Principal Command', label: 'Executive Health', icon: LayoutDashboard },
            { id: 'Academics & Exams', label: 'Curriculum & Classes', icon: BookOpen },
            { id: 'Timetable Matrix', label: 'Timetable Matrix', icon: CalendarDays },
            { id: 'Attendance Register', label: 'Attendance Telemetry', icon: CalendarCheck },
            { id: 'Students & IDs', label: 'Student 360° Profiles', icon: GraduationCap },
            { id: 'Teachers', label: 'Faculty & Workload', icon: Users },
            { id: 'Communication & Reports', label: 'Academic Notices', icon: Mail },
            { id: 'Reports', label: 'Academic Reports', icon: BookOpen },
          ]
        }
      ];
    }

    if (role === 'accountant' || role === 'accounts') {
      return [
        {
          title: 'Accounts & Finance',
          items: [
            { id: 'Finance Overview', label: 'Financial Overview', icon: LayoutDashboard },
            { id: 'Fees Collection', label: 'Fees Collection', icon: CreditCard },
            { id: 'Due Fees', label: 'Due / Overdue Fees', icon: AlertCircle },
            { id: 'School Expenses', label: 'School Expenses', icon: TrendingUp },
            { id: 'Due Salaries', label: 'Due Salaries & Payroll', icon: Users },
          ]
        }
      ];
    }

    if (role === 'admin') {
      return [
        {
          title: 'Branch Operations',
          items: [
            { id: 'Overview', label: 'Branch Dashboard', icon: LayoutDashboard },
            { id: 'Attendance Register', label: 'Attendance', icon: CalendarCheck },
            { id: 'Timetable Matrix', label: 'Timetable Matrix', icon: CalendarDays },
            { id: 'Students & IDs', label: 'Students & IDs', icon: GraduationCap },
            { id: 'Teachers', label: 'Faculty & Staff', icon: Users },
            { id: 'Academics & Exams', label: 'Academics & Classes', icon: BookOpen },
            { id: 'Finance & Fees', label: 'Branch Financials', icon: CreditCard },
            { id: 'Facilities', label: 'Facilities & Transit', icon: Bus },
            { id: 'Library Dashboard', label: 'Library & Media', icon: Library },
            { id: 'Communication & Reports', label: 'Communication', icon: Mail },
            { id: 'Reports', label: 'Branch Reports', icon: BookOpen },
          ]
        },
        {
          title: 'Branch Administration',
          items: [
            { id: 'Campus Profile', label: 'Branch Profile', icon: Building2 },
            { id: 'System Configuration', label: 'Branch Settings', icon: Settings },
          ]
        }
      ];
    }

    // Default Fallback
    return [
      {
        title: 'School Operations',
        items: [
          { id: 'Overview', label: 'Overview', icon: LayoutDashboard },
          { id: 'Attendance Register', label: 'Attendance', icon: CalendarCheck },
          { id: 'Timetable Matrix', label: 'Timetable', icon: CalendarDays },
          { id: 'Students & IDs', label: 'Students', icon: GraduationCap },
          { id: 'Teachers', label: 'Teachers & Staff', icon: Users },
          { id: 'Academics & Exams', label: 'Academics', icon: BookOpen },
          { id: 'Finance & Fees', label: 'Finance', icon: CreditCard },
          { id: 'Facilities', label: 'Facilities & Fleet', icon: Bus },
          { id: 'Communication & Reports', label: 'Communication', icon: Mail },
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
      case 'Lab Dashboard':
        return path.includes('/lab-dashboard') && (!search.includes('tab=') || search.includes('tab=overview'));
      case 'Lab Schedule':
      case 'Practical Sessions':
        return path.includes('/lab-dashboard') && search.includes('tab=schedule');
      case 'Lab Equipments':
      case 'Lab Inventory':
        return path.includes('/lab-dashboard') && search.includes('tab=equipments');
      case 'Lab Chemicals':
        return path.includes('/lab-dashboard') && search.includes('tab=chemicals');
      case 'Lab Safety':
        return path.includes('/lab-dashboard') && search.includes('tab=safety');
      case 'Support Overview':
        return (path.includes('/support-dashboard') || path.includes('/dashboard')) && (!search.includes('tab=') || search.includes('tab=overview'));
      case 'Reception Desk':
        return (path.includes('/support-dashboard') || path.includes('/dashboard')) && search.includes('tab=reception');
      case 'Fee Window':
        return (path.includes('/support-dashboard') || path.includes('/dashboard')) && search.includes('tab=fees');
      case 'Admission Desk':
        return (path.includes('/support-dashboard') || path.includes('/dashboard')) && search.includes('tab=inquiries');
      case 'Gate Movement':
        return (path.includes('/support-dashboard') || path.includes('/dashboard')) && search.includes('tab=gatepasses');
      case 'Courier Log':
        return (path.includes('/support-dashboard') || path.includes('/dashboard')) && search.includes('tab=parcels');
      case 'Student Dashboard':
        return path.includes('/student-dashboard');
      case 'Parent Dashboard':
        return path.includes('/parent-dashboard');
      case 'Library Dashboard':
        return (path.includes('/library-dashboard') && !path.includes('/books')) || (path.includes('/superadmin') && search.includes('tab=library'));
      case 'Book Catalog':
        return path.includes('/books');
      case 'Transport Dashboard':
        return (path.includes('/transport-dashboard') && !path.includes('/routes')) || (path.includes('/superadmin') && search.includes('tab=transport'));
      case 'Routes':
        return path.includes('/routes');
      case 'Reports':
        return path.includes('/reports');
      case 'Principal Command':
        return (path.endsWith('/dashboard') || path.includes('/principal-dashboard') || path === `/${tenantSlug}` || path === `/${tenantSlug}/`) && !search.includes('tab=');
      case 'Overview':
        return (path.endsWith('/dashboard') || path === `/${tenantSlug}` || path === `/${tenantSlug}/`) && !search.includes('tab=');
      case 'Attendance Register':
        return path.includes('/attendance');
      case 'Timetable Matrix':
        return path.includes('/timetable') || (path.includes('/academics') && search.includes('tab=timetable'));
      case 'Students & IDs':
        return (path.includes('/students') && !path.includes('/student-dashboard')) || (path.includes('/dashboard') && search.includes('tab=students'));
      case 'Teachers':
        return (path.includes('/staff') || (path.includes('/teachers') && !path.includes('/teacher-dashboard'))) || (path.includes('/dashboard') && search.includes('tab=teachers'));
      case 'Academics & Exams':
        return (path.includes('/academics') && !search.includes('tab=timetable') && !path.includes('/timetable')) || (path.includes('/dashboard') && search.includes('tab=academics'));
      case 'Finance Overview':
        return (path.includes('/finance') || path.endsWith('/dashboard')) && (!search.includes('tab=') || search.includes('tab=ledger'));
      case 'Fees Collection':
        return (path.includes('/finance') || path.includes('/dashboard')) && search.includes('tab=collections');
      case 'Due Fees':
        return (path.includes('/finance') || path.includes('/dashboard')) && search.includes('tab=pending');
      case 'School Expenses':
        return (path.includes('/finance') || path.includes('/dashboard')) && search.includes('tab=expenses');
      case 'Due Salaries':
        return (path.includes('/finance') || path.includes('/dashboard')) && search.includes('tab=salaries');
      case 'Finance & Fees':
        return path.includes('/finance') || (path.includes('/dashboard') && search.includes('tab=finance'));
      case 'Facilities':
        return (path.includes('/transport') || path.includes('/routes')) || (path.includes('/dashboard') && search.includes('tab=facilities'));
      case 'Communication & Reports':
        return path.includes('/communication') || path.includes('/reports') || (path.includes('/dashboard') && search.includes('tab=communication'));
      case 'My Schools & Campuses':
        return (path.includes('/superadmin') && search.includes('tab=schools')) || 
               (path.includes('/dashboard') && search.includes('tab=schools') && isSuperAdmin) || 
               path.endsWith('/schools');
      case 'Campus Profile':
        return path.includes('/dashboard') && search.includes('tab=schools') && !isSuperAdmin;
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
      case 'Lab Dashboard':
        navigate(`${base}/lab-dashboard?tab=overview`);
        break;
      case 'Lab Schedule':
      case 'Practical Sessions':
        navigate(`${base}/lab-dashboard?tab=schedule`);
        break;
      case 'Lab Equipments':
      case 'Lab Inventory':
        navigate(`${base}/lab-dashboard?tab=equipments`);
        break;
      case 'Lab Chemicals':
        navigate(`${base}/lab-dashboard?tab=chemicals`);
        break;
      case 'Lab Safety':
        navigate(`${base}/lab-dashboard?tab=safety`);
        break;
      case 'Support Overview':
        navigate(`${base}/support-dashboard?tab=overview`);
        break;
      case 'Reception Desk':
        navigate(`${base}/support-dashboard?tab=reception`);
        break;
      case 'Fee Window':
        navigate(`${base}/support-dashboard?tab=fees`);
        break;
      case 'Admission Desk':
        navigate(`${base}/support-dashboard?tab=inquiries`);
        break;
      case 'Gate Movement':
        navigate(`${base}/support-dashboard?tab=gatepasses`);
        break;
      case 'Courier Log':
        navigate(`${base}/support-dashboard?tab=parcels`);
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
      case 'Principal Command':
        navigate(`${base}/dashboard`);
        break;
      case 'Overview':
        navigate(isSuperAdmin ? `${base}/superadmin` : `${base}/dashboard`);
        break;
      case 'Attendance Register':
        navigate(`${base}/attendance`);
        break;
      case 'Timetable Matrix':
        navigate(`${base}/timetable`);
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
      case 'Finance Overview':
        navigate(`${base}/finance?tab=ledger`);
        break;
      case 'Fees Collection':
        navigate(`${base}/finance?tab=collections`);
        break;
      case 'Due Fees':
        navigate(`${base}/finance?tab=pending`);
        break;
      case 'School Expenses':
        navigate(`${base}/finance?tab=expenses`);
        break;
      case 'Due Salaries':
        navigate(`${base}/finance?tab=salaries`);
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
      case 'Campus Profile':
        navigate(`${base}/dashboard?tab=schools`);
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
