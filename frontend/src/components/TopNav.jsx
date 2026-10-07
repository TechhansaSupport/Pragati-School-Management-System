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

const TopNav = () => (
  <div className="top-nav">
    <NavItem icon={<LayoutDashboard size={16} />} label="Dashboard" path="/" />
    <NavItem icon={<Users size={16} />} label="Students" path="/students" />
    <NavItem icon={<UserCheck size={16} />} label="Teachers" path="/teachers" />
    <NavItem icon={<BookOpen size={16} />} label="Academics" path="/academics" />
    <NavItem icon={<CreditCard size={16} />} label="Fees" path="/fees" />
    <NavItem icon={<Calendar size={16} />} label="Timetable" path="/timetable" />
    <NavItem icon={<Activity size={16} />} label="Attendance" path="/attendance" />
    <NavItem icon={<MessageSquare size={16} />} label="Communication" path="/communication" />
    <NavItem icon={<FileText size={16} />} label="Reports" path="/reports" />
  </div>
);

export default TopNav;
