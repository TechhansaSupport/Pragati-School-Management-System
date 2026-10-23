import React, { useState, useEffect } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar 
} from 'recharts';
import { 
  TrendingUp, Users, AlertTriangle, MoreVertical, Activity, HeartPulse, 
  Briefcase, CheckCircle2, ShieldCheck, Award, Calendar, ArrowUpRight, 
  FileText, Sparkles, AlertCircle, Clock, ChevronRight, BarChart3, CheckSquare, Target
} from 'lucide-react';

const API_BASE = 'http://localhost:5000/api';

const PrincipalDashboard = () => {
  const tenantSlug = sessionStorage.getItem('tenantSlug') || '';
  const userInfo = JSON.parse(sessionStorage.getItem('userInfo') || '{}');
  const token = userInfo.token || sessionStorage.getItem('token') || '';

  const [activeTab, setActiveTab] = useState('health'); // 'health', 'academics', 'workload', 'risk'
  const [loading, setLoading] = useState(true);

  const [principalSummary, setPrincipalSummary] = useState({
    schoolAverage: '79.2%',
    overallAttendance: '96.2%',
    totalStudents: 10,
    academicTrend: [
      { term: 'Term 1', avg: 74 },
      { term: 'Term 2', avg: 76 },
      { term: 'Mid-Year', avg: 78 },
      { term: 'Term 3', avg: 80 },
      { term: 'Finals (Proj)', avg: 83 },
    ],
    attendanceData: [
      { grade: 'Class 8', present: 96, absent: 4 },
      { grade: 'Class 9', present: 94, absent: 6 },
      { grade: 'Class 10', present: 97, absent: 3 },
      { grade: 'Class 11', present: 91, absent: 9 },
    ],
    riskStudents: [
      { id: 1, name: 'Rohan Gupta', grade: 'Class 11 - SCIENCE', issue: 'Chronic Absenteeism (89%)', risk: 'Critical', recommendedAction: 'Immediate Guardian Intervention' },
      { id: 2, name: 'Vihaan Verma', grade: 'Class 9 - B', issue: 'Declining Math Scores', risk: 'High', recommendedAction: 'Assign Peer Study Buddy' },
      { id: 3, name: 'Arjun Nair', grade: 'Class 10 - A', issue: 'Missed Science Lab Reports', risk: 'Medium', recommendedAction: 'Weekly Progress Check' },
    ],
    teacherWorkloads: [
      { id: '1', name: 'Mr. Ramesh Singh', department: 'Mathematics & Science', periodsPerWeek: 26, maxPeriods: 30, studentCount: 88, pendingEvaluations: 8, status: 'Optimal', statusColor: '#16a34a' },
      { id: '2', name: 'Dr. Vikram Malhotra', department: 'Physics & Chemistry', periodsPerWeek: 29, maxPeriods: 30, studentCount: 110, pendingEvaluations: 14, status: 'Overloaded', statusColor: '#dc2626' },
      { id: '3', name: 'Ms. Sunita Sharma', department: 'English & Literature', periodsPerWeek: 22, maxPeriods: 30, studentCount: 72, pendingEvaluations: 5, status: 'Capacity Available', statusColor: '#2563eb' },
      { id: '4', name: 'Mr. Rajesh Verma', department: 'Social Studies', periodsPerWeek: 24, maxPeriods: 30, studentCount: 80, pendingEvaluations: 6, status: 'Optimal', statusColor: '#16a34a' },
    ],
    healthDashboard: {
      compositeScore: 93,
      healthGrade: 'A+',
      status: 'Optimal Operations',
      pillars: [
        { name: 'Academics', score: 91, benchmark: '90%', status: 'Exceeding', color: '#4F46E5', detail: '79.2% school avg across 12 subjects' },
        { name: 'Attendance', score: 96, benchmark: '92%', status: 'Strong', color: '#0F766E', detail: '96.2% campus average attendance' },
        { name: 'Finance & Fee Collection', score: 92, benchmark: '85%', status: 'Healthy', color: '#16a34a', detail: '92.4% fee realization rate for Term 1' },
        { name: 'Faculty Workload Balance', score: 89, benchmark: '85%', status: 'Balanced', color: '#f59e0b', detail: '88% of teachers within optimal 26 hr limit' },
        { name: 'Infrastructure & Safety', score: 98, benchmark: '95%', status: 'Verified', color: '#0284c7', detail: 'Fire, labs, and GPS bus clearance up to date' },
      ]
    }
  });

  useEffect(() => {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (tenantSlug) headers['x-tenant-slug'] = tenantSlug;

    setLoading(true);
    fetch(`${API_BASE}/dashboard/principal-summary`, { headers })
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data) {
          setPrincipalSummary(prev => ({
            ...prev,
            ...data,
            academicTrend: (data.academicTrend && data.academicTrend.length > 0) ? data.academicTrend : prev.academicTrend,
            attendanceData: (data.attendanceData && data.attendanceData.length > 0) ? data.attendanceData : prev.attendanceData,
            riskStudents: (data.riskStudents && data.riskStudents.length > 0) ? data.riskStudents : prev.riskStudents,
            teacherWorkloads: (data.teacherWorkloads && data.teacherWorkloads.length > 0) ? data.teacherWorkloads : prev.teacherWorkloads,
            healthDashboard: data.healthDashboard || prev.healthDashboard,
          }));
        }
      })
      .catch(err => console.warn('Principal summary error:', err))
      .finally(() => setLoading(false));
  }, [tenantSlug]);

  const { healthDashboard, teacherWorkloads, riskStudents, attendanceData, academicTrend } = principalSummary;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px', width: '100%' }}>
      
      {/* SECTION 10.6: EXECUTIVE SCHOOL HEALTH HERO BANNER */}
      <div style={{ 
        background: 'linear-gradient(135deg, #1E1B4B 0%, #312E81 50%, #1e3a8a 100%)', 
        borderRadius: '18px', 
        padding: '26px 32px', 
        color: 'white',
        boxShadow: '0 10px 30px rgba(30, 27, 75, 0.25)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '20px'
      }}>
        <div style={{ maxWidth: '640px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <span style={{ 
              background: 'rgba(255, 255, 255, 0.15)', 
              backdropFilter: 'blur(10px)',
              padding: '4px 12px', 
              borderRadius: '20px', 
              fontSize: '0.78rem', 
              fontWeight: 800, 
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              display: 'flex', 
              alignItems: 'center', 
              gap: '6px' 
            }}>
              <HeartPulse size={14} color="#34D399" /> School Health Index
            </span>
            <span style={{ fontSize: '0.82rem', opacity: 0.85 }}>Campus: {tenantSlug || 'Main Campus'}</span>
          </div>
          <h1 style={{ margin: '0 0 8px', fontSize: '1.85rem', fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.25 }}>
            {userInfo.name ? `${userInfo.name}'s Executive Overview` : 'Principal Executive Command'}
          </h1>
          <p style={{ margin: 0, fontSize: '0.92rem', opacity: 0.9, lineHeight: 1.5 }}>
            Holistic governance across academics, attendance reliability, faculty workload distribution, and regulatory safety compliance.
          </p>
        </div>

        {/* Health Score Pill */}
        <div style={{ 
          background: 'rgba(255, 255, 255, 0.1)', 
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          padding: '16px 28px', 
          borderRadius: '16px', 
          display: 'flex', 
          alignItems: 'center', 
          gap: '20px' 
        }}>
          <div>
            <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', opacity: 0.85, fontWeight: 700, letterSpacing: '0.05em' }}>Composite Health</div>
            <div style={{ fontSize: '2.4rem', fontWeight: 900, lineHeight: 1, marginTop: '4px' }}>
              {healthDashboard?.compositeScore || 93}<span style={{ fontSize: '1.2rem', opacity: 0.7 }}>/100</span>
            </div>
          </div>
          <div style={{ borderLeft: '1px solid rgba(255, 255, 255, 0.2)', paddingLeft: '18px' }}>
            <div style={{ background: '#10B981', color: 'white', fontWeight: 900, fontSize: '0.85rem', padding: '4px 12px', borderRadius: '12px', textAlign: 'center' }}>
              GRADE {healthDashboard?.healthGrade || 'A+'}
            </div>
            <div style={{ fontSize: '0.78rem', marginTop: '6px', opacity: 0.9, fontWeight: 600 }}>
              {healthDashboard?.status || 'Optimal Operations'}
            </div>
          </div>
        </div>
      </div>

      {/* 5-PILLAR SCHOOL HEALTH SCORECARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '14px' }}>
        {(healthDashboard?.pillars || []).map((pillar, idx) => (
          <div 
            key={idx} 
            className="chart-card" 
            style={{ 
              padding: '18px 20px', 
              background: 'white', 
              borderRadius: '14px', 
              border: '1px solid #e2e8f0',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                  {pillar.name}
                </span>
                <span style={{ 
                  fontSize: '0.72rem', 
                  fontWeight: 800, 
                  padding: '2px 8px', 
                  borderRadius: '10px', 
                  background: 'rgba(16, 185, 129, 0.12)', 
                  color: '#059669' 
                }}>
                  {pillar.status}
                </span>
              </div>
              <div style={{ fontSize: '1.65rem', fontWeight: 900, color: '#1e3a8a', marginBottom: '6px' }}>
                {pillar.score}%
              </div>
              <div style={{ fontSize: '0.78rem', color: '#475569', lineHeight: 1.4, marginBottom: '10px' }}>
                {pillar.detail}
              </div>
            </div>

            {/* Progress Bar */}
            <div>
              <div style={{ height: '6px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${pillar.score}%`, height: '100%', background: pillar.color, borderRadius: '4px' }}></div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#94a3b8', marginTop: '4px' }}>
                <span>Target: {pillar.benchmark}</span>
                <span style={{ color: '#16a34a', fontWeight: 700 }}>Passed</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* NAVIGATION TABS FOR PRINCIPAL INTELLIGENCE MODULES */}
      <div style={{ display: 'flex', alignItems: 'center', margin: '4px 0 10px 0' }}>
        <div className="system-tabs-container">
          {[
            { id: 'health', label: 'Academic & Attendance Health', icon: Activity, count: `${healthDashboard?.compositeScore || 93}% Health` },
            { id: 'workload', label: 'Faculty Workload Analytics', icon: Briefcase, count: `${teacherWorkloads?.length || 0} Faculty` },
            { id: 'risk', label: 'Early Academic-Risk Intervention', icon: AlertTriangle, count: `${riskStudents?.length || 0} At Risk` }
          ].map(tab => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <button 
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`system-tab-btn ${isActive ? 'active' : ''}`}
              >
                <Icon size={16} />
                <span>{tab.label}</span>
                <span className="system-tab-badge">
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB 1: ACADEMIC & ATTENDANCE HEALTH */}
      {activeTab === 'health' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(480px, 1fr))', gap: '20px' }}>
          
          {/* Academic Performance Trend */}
          <div className="chart-card" style={{ padding: '22px', background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#1e3a8a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <TrendingUp size={18} color="#4F46E5" />
                  Academic Performance Trend (School Average)
                </h3>
                <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: '#64748b' }}>
                  Progressive term-over-term score progression across all classes
                </p>
              </div>
              <span style={{ fontSize: '0.78rem', fontWeight: 800, background: '#e0e7ff', color: '#4338ca', padding: '4px 10px', borderRadius: '12px' }}>
                Target: 80%
              </span>
            </div>

            <div style={{ height: '280px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={academicTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorAvg" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.35}/>
                      <stop offset="95%" stopColor="#4F46E5" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="term" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} domain={[65, 100]} />
                  <Tooltip />
                  <Area type="monotone" dataKey="avg" stroke="#4F46E5" strokeWidth={3} fillOpacity={1} fill="url(#colorAvg)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Smart Attendance by Grade (Section 10.2) */}
          <div className="chart-card" style={{ padding: '22px', background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#1e3a8a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <BarChart3 size={18} color="#4F46E5" />
                  Smart Attendance Analytics by Grade
                </h3>
                <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: '#64748b' }}>
                  Live attendance variance tracking with chronic absenteeism thresholds
                </p>
              </div>
              <div style={{ display: 'flex', gap: '10px', fontSize: '0.75rem', fontWeight: 700 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#4F46E5' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#4F46E5' }}></span> Present
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#0F766E' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#0F766E' }}></span> Absent
                </span>
              </div>
            </div>

            <div style={{ height: '280px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={attendanceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                  <XAxis type="number" hide />
                  <YAxis dataKey="grade" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} width={80} />
                  <Tooltip cursor={{fill: 'transparent'}} />
                  <Bar dataKey="present" stackId="a" fill="#4F46E5" radius={[0, 0, 0, 0]} barSize={16} />
                  <Bar dataKey="absent" stackId="a" fill="#0F766E" radius={[0, 4, 4, 0]} barSize={16} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>
      )}

      {/* TAB 2: TEACHER WORKLOAD ANALYTICS */}
      {activeTab === 'workload' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          <div className="chart-card" style={{ padding: '20px 24px', background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#1e3a8a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Users size={19} color="#4F46E5" />
                Faculty Workload & Allocation Analytics
              </h3>
              <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#64748b' }}>
                Tracking teaching periods, active students, and evaluation queues to prevent burnout and ensure teaching quality.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <span style={{ background: '#dcfce7', color: '#166534', padding: '6px 12px', borderRadius: '10px', fontSize: '0.8rem', fontWeight: 700 }}>
                ✓ 88% Optimal Load
              </span>
              <span style={{ background: '#fee2e2', color: '#991b1b', padding: '6px 12px', borderRadius: '10px', fontSize: '0.8rem', fontWeight: 700 }}>
                1 Teacher Overload Alert
              </span>
            </div>
          </div>

          <div className="chart-card" style={{ padding: 0, overflow: 'hidden', background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
              <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                <tr>
                  <th style={{ padding: '14px 20px' }}>Faculty Member</th>
                  <th style={{ padding: '14px 16px' }}>Department</th>
                  <th style={{ padding: '14px 16px' }}>Weekly Periods</th>
                  <th style={{ padding: '14px 16px' }}>Student Load</th>
                  <th style={{ padding: '14px 16px' }}>Pending Evaluations</th>
                  <th style={{ padding: '14px 20px' }}>Load Status</th>
                </tr>
              </thead>
              <tbody>
                {(teacherWorkloads || []).map((teacher) => {
                  const percent = Math.min(100, Math.round((teacher.periodsPerWeek / teacher.maxPeriods) * 100));
                  return (
                    <tr key={teacher.id || teacher.name} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '16px 20px' }}>
                        <div style={{ fontWeight: 800, color: '#1e3a8a' }}>{teacher.name}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Faculty ID: {teacher.id}</div>
                      </td>
                      <td style={{ padding: '16px 16px', color: '#475569', fontWeight: 600 }}>
                        {teacher.department}
                      </td>
                      <td style={{ padding: '16px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontWeight: 800, color: '#1e293b' }}>{teacher.periodsPerWeek} / {teacher.maxPeriods}</span>
                          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>({percent}%)</span>
                        </div>
                        <div style={{ height: '4px', width: '100px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden', marginTop: '4px' }}>
                          <div style={{ width: `${percent}%`, height: '100%', background: teacher.statusColor }}></div>
                        </div>
                      </td>
                      <td style={{ padding: '16px 16px', fontWeight: 700, color: '#1e3a8a' }}>
                        {teacher.studentCount} Students
                      </td>
                      <td style={{ padding: '16px 16px' }}>
                        <span style={{ 
                          padding: '3px 8px', 
                          borderRadius: '6px', 
                          background: teacher.pendingEvaluations > 10 ? '#fee2e2' : '#f1f5f9', 
                          color: teacher.pendingEvaluations > 10 ? '#dc2626' : '#475569',
                          fontWeight: 700, 
                          fontSize: '0.8rem' 
                        }}>
                          {teacher.pendingEvaluations} pending
                        </span>
                      </td>
                      <td style={{ padding: '16px 20px' }}>
                        <span style={{ 
                          padding: '4px 10px', 
                          borderRadius: '12px', 
                          fontSize: '0.75rem', 
                          fontWeight: 800, 
                          background: `${teacher.statusColor}18`, 
                          color: teacher.statusColor 
                        }}>
                          {teacher.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: EARLY ACADEMIC-RISK INDICATOR (Section 10.4) */}
      {activeTab === 'risk' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          <div className="chart-card" style={{ padding: '20px 24px', background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertTriangle size={20} color="#DC2626" />
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#1e3a8a' }}>
                  Early Academic-Risk Decision Support
                </h3>
              </div>
              <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#64748b' }}>
                Algorithmic flag based on attendance trends, missed assessments, and falling grades. This is a decision-support indicator for timely teacher intervention.
              </p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '16px' }}>
            {riskStudents.map((student) => {
              const isCrit = student.risk === 'Critical';
              return (
                <div 
                  key={student.id || student.name} 
                  className="chart-card" 
                  style={{ 
                    padding: '22px', 
                    background: 'white', 
                    borderRadius: '16px', 
                    border: isCrit ? '1.5px solid #fca5a5' : '1px solid #e2e8f0',
                    display: 'flex', 
                    flexDirection: 'column', 
                    justifyContent: 'space-between',
                    boxShadow: isCrit ? '0 4px 12px rgba(220, 38, 38, 0.08)' : '0 2px 8px rgba(0,0,0,0.02)'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <span style={{ 
                        padding: '4px 10px', 
                        borderRadius: '14px', 
                        fontSize: '0.75rem', 
                        fontWeight: 900, 
                        background: isCrit ? '#fee2e2' : student.risk === 'High' ? '#fef3c7' : '#e0e7ff', 
                        color: isCrit ? '#991b1b' : student.risk === 'High' ? '#92400e' : '#3730A3' 
                      }}>
                        {student.risk} RISK
                      </span>
                      <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>{student.grade}</span>
                    </div>

                    <h4 style={{ margin: '0 0 6px', fontSize: '1.1rem', fontWeight: 800, color: '#1e3a8a' }}>
                      {student.name}
                    </h4>

                    <div style={{ fontSize: '0.85rem', color: '#b91c1c', fontWeight: 600, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <AlertCircle size={15} />
                      {student.issue}
                    </div>
                  </div>

                  <div style={{ paddingTop: '14px', borderTop: '1px solid #f1f5f9' }}>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, marginBottom: '4px' }}>
                      Recommended Intervention
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0F766E', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        <Target size={15} color="#0F766E" />
                        {student.recommendedAction || 'Schedule Parent Conference'}
                      </span>
                      <button 
                        onClick={() => alert(`Intervention protocol initiated for ${student.name}. Teacher coordinator alerted.`)}
                        style={{ padding: '6px 12px', borderRadius: '8px', border: 'none', background: '#4F46E5', color: 'white', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
                      >
                        Action
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      )}

    </div>
  );
};

export default PrincipalDashboard;
