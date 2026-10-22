import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, UserCheck, BookOpen, Calendar, Activity, MessageSquare, FileText, CreditCard } from 'lucide-react';

const NavItem = ({ icon, label, path }) => {
  const location = useLocation();
  const isActive = location.pathname.startsWith(path) && (path !== '/' || location.pathname === '/');
  
  return (
    <Link to={path} style={{ textDecoration: 'none' }}>
      <button className={`nav-pill ${isActive ? 'active' : ''}`}>
        {icon}
        {label}
      </button>
    </Link>
  );
};

const TopNav = () => {
  const tenantSlug = sessionStorage.getItem('tenantSlug') || '';
  const getPath = (p) => tenantSlug ? `/${tenantSlug}${p === '/' ? '' : p}` : p;

  return (
    <div className="top-nav">
      <NavItem icon={<LayoutDashboard size={16} />} label="Dashboard" path={getPath('/')} />
      <NavItem icon={<Users size={16} />} label="Students" path={getPath('/students')} />
      <NavItem icon={<UserCheck size={16} />} label="Teachers" path={getPath('/staff')} />
      <NavItem icon={<BookOpen size={16} />} label="Academics" path={getPath('/academics')} />
      <NavItem icon={<Calendar size={16} />} label="Timetable" path={getPath('/academics?tab=timetable')} />
      <NavItem icon={<Activity size={16} />} label="Attendance" path={getPath('/attendance')} />
      <NavItem icon={<CreditCard size={16} />} label="Fees" path={getPath('/finance')} />
      <NavItem icon={<MessageSquare size={16} />} label="Communication" path={getPath('/communication')} />
      <NavItem icon={<FileText size={16} />} label="Reports" path={getPath('/reports')} />
    </div>
  );
};

export default TopNav;
