import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, LineChart, Line } from 'recharts';
import { TrendingUp, Users, AlertTriangle, BookOpen, MoreVertical, Activity } from 'lucide-react';

const academicTrend = [
  { term: 'Term 1', avg: 72 },
  { term: 'Term 2', avg: 75 },
  { term: 'Mid-Year', avg: 78 },
  { term: 'Term 3', avg: 76 },
  { term: 'Finals', avg: 82 },
];

const attendanceData = [
  { grade: 'Grade 8', present: 95, absent: 5 },
  { grade: 'Grade 9', present: 92, absent: 8 },
  { grade: 'Grade 10', present: 97, absent: 3 },
  { grade: 'Grade 11', present: 88, absent: 12 },
  { grade: 'Grade 12', present: 94, absent: 6 },
];

const riskStudents = [
  { id: 1, name: 'Ananya Sharma', grade: '9th - A', issue: 'Declining Math Scores', risk: 'High' },
  { id: 2, name: 'Rahul Desai', grade: '11th - Sci', issue: 'Chronic Absenteeism (15%)', risk: 'Critical' },
  { id: 3, name: 'Priya Patel', grade: '8th - B', issue: 'Missed 3 Assignments', risk: 'Medium' },
  { id: 4, name: 'Kevin Dsouza', grade: '10th - C', issue: 'Falling overall average', risk: 'Medium' },
];

const PrincipalDashboard = () => {
  return (
    <div className="dashboard-grid">
      {/* LEFT COLUMN */}
      <div className="left-column">
        {/* KPI Row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>School Average</div>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-primary)' }}>78.4%</div>
              </div>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'linear-gradient(135deg, rgba(79,70,229,0.1), rgba(15, 118, 110,0.1))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <TrendingUp size={24} color="#4F46E5" />
              </div>
            </div>
            <div style={{ fontSize: '0.85rem', color: '#16A34A', fontWeight: 500 }}>+2.1% from last term</div>
          </div>

          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Overall Attendance</div>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-secondary)' }}>94.2%</div>
              </div>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'linear-gradient(135deg, rgba(96,165,250,0.1), rgba(15, 118, 110,0.1))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Users size={24} color="#60A5FA" />
              </div>
            </div>
            <div style={{ fontSize: '0.85rem', color: '#16A34A', fontWeight: 500 }}>Above target (90%)</div>
          </div>

        </div>

        {/* Academic Performance Trend */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">Academic Performance Trend</div>
            <MoreVertical size={20} className="text-muted" style={{cursor: 'pointer'}} />
          </div>
          <div style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={academicTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorAvg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#4F46E5" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="term" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} domain={[60, 100]} />
                <Tooltip />
                <Area type="monotone" dataKey="avg" stroke="#4F46E5" strokeWidth={3} fillOpacity={1} fill="url(#colorAvg)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* RIGHT COLUMN */}
      <div className="right-column" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* Early Academic Risk Indicator */}
        <div className="card" style={{ flex: 1 }}>
          <div className="card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertTriangle size={20} color="#0F766E" />
              <div className="card-title">Early Academic-Risk Indicator</div>
            </div>
            <MoreVertical size={20} className="text-muted" style={{cursor: 'pointer'}} />
          </div>
          
          <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '16px' }}>
            AI-flagged students requiring intervention based on recent performance and attendance drops.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {riskStudents.map(student => (
              <div key={student.id} className="risk-student-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', borderRadius: '12px' }}>
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--color-text-main)' }}>{student.name}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{student.grade} • {student.issue}</div>
                </div>
                <div style={{ 
                  padding: '6px 12px', 
                  borderRadius: '20px', 
                  fontSize: '0.75rem', 
                  fontWeight: 600,
                  backgroundColor: student.risk === 'Critical' ? 'rgba(15, 118, 110,0.1)' : 'rgba(245,158,11,0.1)',
                  color: student.risk === 'Critical' ? '#0F766E' : '#d97706'
                }}>
                  {student.risk}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Smart Attendance Analytics */}
        <div className="card">
          <div className="card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Activity size={20} color="#60A5FA" />
              <div className="card-title">Attendance by Grade</div>
            </div>
          </div>
          
          <div style={{ height: '220px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={attendanceData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                <XAxis type="number" hide />
                <YAxis dataKey="grade" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} width={70} />
                <Tooltip cursor={{fill: 'transparent'}} />
                <Bar dataKey="present" stackId="a" fill="#4F46E5" radius={[0, 0, 0, 0]} barSize={12} />
                <Bar dataKey="absent" stackId="a" fill="#0F766E" radius={[0, 4, 4, 0]} barSize={12} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginTop: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#4F46E5' }}></div> Present
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#0F766E' }}></div> Absent
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default PrincipalDashboard;
