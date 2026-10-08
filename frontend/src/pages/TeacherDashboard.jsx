import React from 'react';
import { Users, BookOpen, Clock, FileText, CheckCircle, Calendar, ChevronRight, Award, Bell } from 'lucide-react';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, CartesianGrid, YAxis } from 'recharts';

const classPerformanceData = [
  { name: '10th A', submitted: 42, pending: 3 },
  { name: '9th B', submitted: 35, pending: 5 },
  { name: '11th Sci', submitted: 28, pending: 2 },
  { name: '8th C', submitted: 38, pending: 4 },
];

const TeacherDashboard = () => {
  return (
    <div className="dashboard-grid">
      {/* Top Banner - Glassmorphism */}
      <div style={{
        gridColumn: '1 / -1',
        background: 'linear-gradient(135deg, rgba(79,70,229,0.9) 0%, rgba(96,165,250,0.9) 100%)',
        borderRadius: '16px',
        padding: '24px 32px',
        color: 'white',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 10px 25px -5px rgba(99, 102, 241, 0.4)'
      }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, margin: '0 0 8px 0' }}>Good Morning, Teacher! 👋</h2>
          <p style={{ opacity: 0.9, fontSize: '0.95rem', margin: 0 }}>You have 4 classes and 28 pending assignments to grade today.</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '1rem', fontWeight: 600, opacity: 0.9 }}>Today</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 700 }}>August 17, 2023</div>
        </div>
      </div>

      {/* LEFT COLUMN */}
      <div className="left-column">
        {/* KPI Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          
          {[
            { label: 'Total Students', value: '142', icon: Users, color: '#4F46E5', bg: 'rgba(79,70,229,0.1)' },
            { label: 'Classes Today', value: '4', icon: BookOpen, color: '#60A5FA', bg: 'rgba(96,165,250,0.1)' },
            { label: 'Pending Grading', value: '28', icon: FileText, color: '#0F766E', bg: 'rgba(15, 118, 110,0.1)' },
            { label: 'Attendance', value: '100%', icon: CheckCircle, color: '#16A34A', bg: 'rgba(22, 163, 74,0.1)' }
          ].map((kpi, i) => (
            <div key={i} className="card hover-lift" style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '16px', transition: 'all 0.3s' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: kpi.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <kpi.icon size={20} color={kpi.color} />
                </div>
              </div>
              <div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-primary)' }}>{kpi.value}</div>
                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>{kpi.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Schedule */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">Today's Teaching Schedule</div>
            <div style={{ fontSize: '0.85rem', color: '#4F46E5', fontWeight: 600, cursor: 'pointer' }}>View Timetable</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {[
              { time: '08:00 AM - 09:00 AM', subject: 'Mathematics', cls: '10th - A', students: '42/45 Present', status: 'Completed', color: '#16A34A' },
              { time: '09:00 AM - 10:00 AM', subject: 'Mathematics', cls: '9th - B', students: '38/40 Present', status: 'Completed', color: '#16A34A' },
              { time: '10:15 AM - 11:15 AM', subject: 'Free Period / Grading', cls: 'Staff Room', students: '-', status: 'In Progress', color: '#4F46E5' },
              { time: '11:15 AM - 12:15 PM', subject: 'Physics', cls: '11th - Sci', students: '30 Enrolled', status: 'Upcoming', color: '#60A5FA' }
            ].map((cls, i) => (
              <div key={i} style={{ 
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                padding: '16px', background: 'rgba(255,255,255,0.6)', 
                borderRadius: '12px', borderLeft: `4px solid ${cls.color}`,
                boxShadow: '0 2px 10px rgba(0,0,0,0.02)'
              }}>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                  <div style={{ textAlign: 'right', minWidth: '130px' }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-main)' }}>{cls.time.split(' - ')[0]}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{cls.time.split(' - ')[1]}</div>
                  </div>
                  <div style={{ width: '1px', height: '30px', background: 'var(--color-border)' }}></div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--color-text-main)' }}>{cls.subject}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>{cls.cls} • {cls.students}</div>
                  </div>
                </div>
                <button style={{ 
                  background: cls.status === 'Completed' ? 'rgba(22, 163, 74,0.1)' : cls.status === 'In Progress' ? 'linear-gradient(135deg, #4F46E5, #60A5FA)' : 'rgba(226,232,240,0.5)',
                  color: cls.status === 'Completed' ? '#16A34A' : cls.status === 'In Progress' ? 'white' : 'var(--color-text-muted)',
                  border: 'none', padding: '8px 16px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', transition: 'transform 0.2s'
                }} className={cls.status === 'In Progress' ? 'hover-lift' : ''}>
                  {cls.status === 'Completed' ? 'View Details' : cls.status === 'In Progress' ? 'Mark Attendance' : 'Waiting'}
                </button>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* RIGHT COLUMN */}
      <div className="right-column" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* Action Required / To-Do */}
        <div className="card">
          <div className="card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Bell size={20} color="#0F766E" />
              <div className="card-title">Action Required</div>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ padding: '12px 16px', background: 'rgba(15, 118, 110,0.05)', borderRadius: '12px', border: '1px solid rgba(15, 118, 110,0.1)', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <input type="checkbox" style={{ marginTop: '4px', accentColor: '#0F766E' }} />
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#1e293b' }}>Grade Mid-Term Papers (10th A)</div>
                <div style={{ fontSize: '0.75rem', color: '#0F766E', marginTop: '4px', fontWeight: 600 }}>Due Today • 28 Pending</div>
              </div>
            </div>
            
            <div style={{ padding: '12px 16px', background: 'rgba(248,250,252,0.8)', borderRadius: '12px', border: '1px solid rgba(226,232,240,0.8)', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <input type="checkbox" style={{ marginTop: '4px' }} />
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#1e293b' }}>Prepare Lesson Plan for Ch. 4</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>By Friday</div>
              </div>
            </div>

            <div style={{ padding: '12px 16px', background: 'rgba(248,250,252,0.8)', borderRadius: '12px', border: '1px solid rgba(226,232,240,0.8)', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <input type="checkbox" style={{ marginTop: '4px' }} />
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#1e293b' }}>Review Student Portfolios</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>By Next Week</div>
              </div>
            </div>
          </div>
        </div>

        {/* Assignment Submission Rates */}
        <div className="card" style={{ flex: 1 }}>
          <div className="card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Award size={20} color="#4F46E5" />
              <div className="card-title">Latest Assignment Submissions</div>
            </div>
          </div>
          <div style={{ height: '220px', marginTop: '16px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={classPerformanceData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} />
                <Tooltip cursor={{fill: 'rgba(226,232,240,0.4)'}} />
                <Bar dataKey="submitted" name="Submitted" stackId="a" fill="#4F46E5" radius={[0, 0, 4, 4]} barSize={30} />
                <Bar dataKey="pending" name="Pending" stackId="a" fill="#0F766E" radius={[4, 4, 0, 0]} barSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginTop: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#4F46E5' }}></div> Submitted
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#0F766E' }}></div> Pending
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default TeacherDashboard;
