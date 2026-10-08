import React from 'react';
import { BookOpen, Calendar, Clock, Award, CheckCircle, AlertCircle, ChevronRight, Target, Activity } from 'lucide-react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, AreaChart, Area, XAxis, Tooltip, CartesianGrid } from 'recharts';

const skillData = [
  { subject: 'Math', A: 90, fullMark: 100 },
  { subject: 'Science', A: 85, fullMark: 100 },
  { subject: 'Language', A: 78, fullMark: 100 },
  { subject: 'Arts', A: 95, fullMark: 100 },
  { subject: 'Sports', A: 70, fullMark: 100 },
  { subject: 'Coding', A: 88, fullMark: 100 },
];

const gradeTrend = [
  { month: 'Jul', score: 75 },
  { month: 'Aug', score: 78 },
  { month: 'Sep', score: 82 },
  { month: 'Oct', score: 80 },
  { month: 'Nov', score: 85 },
];

const StudentDashboard = () => {
  return (
    <div className="dashboard-grid">
      {/* Top Banner - Glassmorphism */}
      <div style={{
        gridColumn: '1 / -1',
        background: 'linear-gradient(135deg, rgba(15, 118, 110,0.9) 0%, rgba(96,165,250,0.9) 100%)',
        borderRadius: '16px',
        padding: '24px 32px',
        color: 'white',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 10px 25px -5px rgba(15, 118, 110, 0.4)'
      }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, margin: '0 0 8px 0' }}>Hi, Rohan! 🎓</h2>
          <p style={{ opacity: 0.9, fontSize: '0.95rem', margin: 0 }}>You have 2 pending assignments and your next class starts in 15 mins.</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '1rem', fontWeight: 600, opacity: 0.9 }}>10th Grade - Sec B</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 700 }}>Rank: 4th</div>
        </div>
      </div>

      {/* LEFT COLUMN */}
      <div className="left-column">
        {/* KPI Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          {[
            { label: 'Attendance', value: '92%', icon: Clock, color: '#4F46E5', bg: 'rgba(79,70,229,0.1)' },
            { label: 'Avg Grade', value: 'A-', icon: Award, color: '#60A5FA', bg: 'rgba(96,165,250,0.1)' },
            { label: 'Pending Tasks', value: '2', icon: BookOpen, color: '#0F766E', bg: 'rgba(15, 118, 110,0.1)' },
            { label: 'Next Exam', value: 'Oct 15', icon: Calendar, color: '#F59E0B', bg: 'rgba(245,158,11,0.1)' }
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

        {/* Timetable */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">Today's Timetable</div>
            <div style={{ fontSize: '0.85rem', color: '#0F766E', fontWeight: 600, cursor: 'pointer' }}>Full Schedule</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {[
              { time: '08:00 AM - 09:00 AM', subject: 'Mathematics', teacher: 'Mrs. Sharma', status: 'Completed', color: '#16A34A' },
              { time: '09:00 AM - 10:00 AM', subject: 'Physics', teacher: 'Dr. Desai', status: 'In Progress', color: '#0F766E' },
              { time: '10:15 AM - 11:15 AM', subject: 'English', teacher: 'Mr. Kumar', status: 'Upcoming', color: '#60A5FA' },
              { time: '11:15 AM - 12:15 PM', subject: 'Computer Science', teacher: 'Ms. Gupta', status: 'Upcoming', color: '#4F46E5' }
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
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>{cls.teacher}</div>
                  </div>
                </div>
                <div style={{ 
                  padding: '6px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700,
                  background: cls.status === 'Completed' ? 'rgba(22, 163, 74,0.1)' : cls.status === 'In Progress' ? 'rgba(15, 118, 110,0.1)' : 'rgba(226,232,240,0.5)',
                  color: cls.status === 'Completed' ? '#16A34A' : cls.status === 'In Progress' ? '#0F766E' : 'var(--color-text-muted)'
                }}>
                  {cls.status}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* RIGHT COLUMN */}
      <div className="right-column" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* AI Performance Insights */}
        <div className="card">
          <div className="card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Target size={20} color="#60A5FA" />
              <div className="card-title">360° Growth Profile</div>
            </div>
          </div>
          <div style={{ height: '240px', marginTop: '8px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="70%" data={skillData}>
                <PolarGrid stroke="#E2E8F0" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748B', fontSize: 12, fontWeight: 600 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                <Radar name="Student" dataKey="A" stroke="#0F766E" strokeWidth={2} fill="#0F766E" fillOpacity={0.4} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', textAlign: 'center', marginTop: '8px' }}>
            <strong>AI Insight:</strong> Strong performance in Arts & Math. Recommended to increase participation in Sports.
          </div>
        </div>

        {/* Pending Tasks */}
        <div className="card" style={{ flex: 1 }}>
          <div className="card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertCircle size={20} color="#F59E0B" />
              <div className="card-title">Pending Tasks</div>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            
            <div className="hover-lift" style={{ padding: '16px', background: 'rgba(15, 118, 110,0.05)', border: '1px solid rgba(15, 118, 110,0.2)', borderRadius: '12px', cursor: 'pointer' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontWeight: 600, color: '#1e293b' }}>Math Assignment 4</div>
                <div style={{ background: '#0F766E', color: 'white', padding: '2px 8px', borderRadius: '12px', fontSize: '0.7rem', fontWeight: 700 }}>Due Tom.</div>
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '8px' }}>Topic: Quadratic Equations</div>
            </div>
            
            <div className="hover-lift" style={{ padding: '16px', background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: '12px', cursor: 'pointer' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontWeight: 600, color: '#1e293b' }}>Physics Lab Report</div>
                <div style={{ color: '#F59E0B', fontSize: '0.75rem', fontWeight: 700 }}>Oct 10th</div>
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '8px' }}>Experiment: Light Refraction</div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};

export default StudentDashboard;
