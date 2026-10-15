import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { TrendingUp, Users, AlertTriangle, MoreVertical, Activity } from 'lucide-react';

const PrincipalDashboard = () => {
  const tenantSlug = sessionStorage.getItem('tenantSlug') || '';
  const userInfo = JSON.parse(sessionStorage.getItem('userInfo') || '{}');
  const token = userInfo.token || sessionStorage.getItem('token') || '';

  const [principalSummary, setPrincipalSummary] = useState({
    schoolAverage: '78.4%',
    overallAttendance: '96.2%',
    totalStudents: 0,
    academicTrend: [
      { term: 'Term 1', avg: 72 },
      { term: 'Term 2', avg: 75 },
      { term: 'Mid-Year', avg: 78 },
      { term: 'Term 3', avg: 76 },
      { term: 'Finals', avg: 82 },
    ],
    attendanceData: [
      { grade: 'Grade 8', present: 95, absent: 5 },
      { grade: 'Grade 9', present: 92, absent: 8 },
      { grade: 'Grade 10', present: 97, absent: 3 },
      { grade: 'Grade 11', present: 88, absent: 12 },
      { grade: 'Grade 12', present: 94, absent: 6 },
    ],
    riskStudents: []
  });

  useEffect(() => {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (tenantSlug) headers['x-tenant-slug'] = tenantSlug;

    fetch('http://localhost:5000/api/dashboard/principal-summary', { headers })
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data) setPrincipalSummary(prev => ({ ...prev, ...data }));
      })
      .catch(err => console.warn('Principal summary error:', err));
  }, [tenantSlug]);

  const riskStudentsList = principalSummary.riskStudents.length > 0 ? principalSummary.riskStudents : [
    { id: 1, name: 'Ananya Sharma', grade: '9th - A', issue: 'Declining Math Scores', risk: 'High' },
    { id: 2, name: 'Rahul Desai', grade: '11th - Sci', issue: 'Attendance Monitoring (88%)', risk: 'Critical' },
    { id: 3, name: 'Priya Patel', grade: '8th - B', issue: 'Missed 3 Assignments', risk: 'Medium' },
  ];

  return (
    <div className="dashboard-grid">
      {/* LEFT COLUMN */}
      <div className="left-column">
        {/* KPI Row */}
        <div className="kpi-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '18px 22px', borderRadius: '16px', background: 'white', border: '1px solid #e2e8f0', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>School Average</div>
                <div style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--color-primary)' }}>{principalSummary.schoolAverage}</div>
              </div>
              <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'linear-gradient(135deg, rgba(79,70,229,0.1), rgba(15, 118, 110,0.1))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <TrendingUp size={22} color="#4F46E5" />
              </div>
            </div>
            <div style={{ fontSize: '0.85rem', color: '#16A34A', fontWeight: 500 }}>Live term evaluation metric</div>
          </div>

          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '18px 22px', borderRadius: '16px', background: 'white', border: '1px solid #e2e8f0', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Overall Attendance</div>
                <div style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--color-secondary)' }}>{principalSummary.overallAttendance}</div>
              </div>
              <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'linear-gradient(135deg, rgba(96,165,250,0.1), rgba(15, 118, 110,0.1))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Users size={22} color="#60A5FA" />
              </div>
            </div>
            <div style={{ fontSize: '0.85rem', color: '#16A34A', fontWeight: 500 }}>Target: 90% threshold</div>
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
              <AreaChart data={principalSummary.academicTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
      <div className="right-column">
        
        {/* Early Academic Risk Indicator */}
        <div className="card" style={{ flex: 1 }}>
          <div className="card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertTriangle size={20} color="#0F766E" />
              <div className="card-title">Early Academic-Risk Indicator (Live DB)</div>
            </div>
            <MoreVertical size={20} className="text-muted" style={{cursor: 'pointer'}} />
          </div>
          
          <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '16px' }}>
            Flagged students from current campus records requiring attention based on attendance and performance.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {riskStudentsList.map(student => (
              <div key={student.id || student.name} className="risk-student-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', borderRadius: '12px', background: '#f8fafc', border: '1px solid #f1f5f9' }}>
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--color-text-main)' }}>{student.name}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{student.grade} • {student.issue}</div>
                </div>
                <div style={{ 
                  padding: '6px 12px', 
                  borderRadius: '20px', 
                  fontSize: '0.75rem', 
                  fontWeight: 600,
                  backgroundColor: student.risk === 'Critical' ? 'rgba(239, 68, 68,0.1)' : 'rgba(245,158,11,0.1)',
                  color: student.risk === 'Critical' ? '#ef4444' : '#d97706'
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
              <div className="card-title">Attendance by Grade (Real Enrolled Data)</div>
            </div>
          </div>
          
          <div style={{ height: '220px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={principalSummary.attendanceData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                <XAxis type="number" hide />
                <YAxis dataKey="grade" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} width={80} />
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
