import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Activity, Users, Settings, BookOpen } from 'lucide-react';

const Sidebar = () => {
  const location = useLocation();
  
  // Dynamic sidebar content based on route
  const getSidebarConfig = () => {
    const path = location.pathname;
    
    if (path.startsWith('/students')) {
      return {
        title: "Student Management",
        icon: <Users size={20} color="var(--color-primary)" />,
        items: [
          { label: "All Students", path: "/students" },
          { label: "Admissions", path: "/students/admissions" },
          { label: "At-Risk Students", path: "/students/at-risk" },
          { label: "Growth Profiles", path: "/students/growth" },
        ]
      };
    }
    
    if (path.startsWith('/teachers')) {
      return {
        title: "Staff Management",
        icon: <Settings size={20} color="var(--color-primary)" />,
        items: [
          { label: "All Teachers", path: "/teachers" },
          { label: "Workload Analytics", path: "/teachers/workload" },
          { label: "Leave Requests", path: "/teachers/leave" },
        ]
      };
    }
    
    if (path.startsWith('/academics')) {
      return {
        title: "Academics",
        icon: <BookOpen size={20} color="var(--color-primary)" />,
        items: [
          { label: "Classes & Sections", path: "/academics" },
          { label: "Subjects", path: "/academics/subjects" },
          { label: "Examinations", path: "/academics/exams" },
          { label: "Assignments", path: "/academics/assignments" },
        ]
      };
    }

    // Default (Dashboard / Reports)
    return {
      title: "Reports & Insights",
      icon: <Activity size={20} color="var(--color-primary)" />,
      items: [
        { label: "School Snapshot", path: "/" },
        { label: "Academic Risk Report", path: "/reports/academic-risk" },
        { label: "Fee Collection Summary", path: "/reports/fees" },
        { label: "Attendance Lookup", path: "/reports/attendance" },
        { label: "Teacher Workload", path: "/reports/teacher-workload" },
      ]
    };
  };

  const config = getSidebarConfig();

  return (
    <div className="inner-sidebar">
      <div className="sidebar-title">
        {config.icon}
        {config.title}
      </div>
      {config.items.map((item, i) => {
        const isActive = location.pathname === item.path;
        return (
          <Link key={i} to={item.path} style={{ textDecoration: 'none' }}>
            <div className={`sidebar-item ${isActive ? 'active' : ''}`}>
              {item.label}
              {isActive && <div className="active-icon">&gt;</div>}
            </div>
          </Link>
        );
      })}
    </div>
  );
};

export default Sidebar;
