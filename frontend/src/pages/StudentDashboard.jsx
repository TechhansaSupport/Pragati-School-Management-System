import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  BookOpen, Calendar, Clock, Award, AlertCircle, Target, FileText, 
  CheckCircle2, Paperclip, X, Download, Send, CreditCard, Printer, 
  Receipt, ShieldCheck, Eye, ChevronRight, Filter, Sparkles, Building2,
  CalendarDays, CheckCircle, RefreshCw
} from 'lucide-react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';

const skillData = [
  { subject: 'Math', A: 90, fullMark: 100 },
  { subject: 'Science', A: 85, fullMark: 100 },
  { subject: 'Language', A: 78, fullMark: 100 },
  { subject: 'Arts', A: 95, fullMark: 100 },
  { subject: 'Sports', A: 70, fullMark: 100 },
  { subject: 'Coding', A: 88, fullMark: 100 },
];

const StudentDashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const tenantSlug = sessionStorage.getItem('tenantSlug') || '';
  const userInfo = JSON.parse(sessionStorage.getItem('userInfo') || '{}');
  const token = userInfo.token || sessionStorage.getItem('token') || '';

  const [studentSummary, setStudentSummary] = useState({
    studentName: userInfo.name || 'Student',
    grade: 'Class 10',
    section: 'A',
    rollNumber: 'STU-1001',
    attendance: '95%',
    avgGrade: 'A',
    pendingTasks: 2,
    nextExam: 'Oct 22, 2026',
    timetable: []
  });

  const [classMaterials, setClassMaterials] = useState([]);
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [activeMaterialTab, setActiveMaterialTab] = useState('all'); // 'all', 'notes', 'assignments'

  // Fee state
  const [feeData, setFeeData] = useState(null);
  const [isFeeLoading, setIsFeeLoading] = useState(false);

  // Smooth scroll to fees section if requested
  useEffect(() => {
    if (location.hash === '#fees-section' || location.search.includes('tab=fees')) {
      const el = document.getElementById('fees-section');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }, [location.hash, location.search]);

  const fetchFeeHistory = () => {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (tenantSlug) headers['x-tenant-slug'] = tenantSlug;

    setIsFeeLoading(true);
    fetch('http://localhost:5000/api/dashboard/student-fees', { headers })
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data && data.success) {
          setFeeData(data);
        }
      })
      .catch(err => console.warn('Student fees fetch error:', err))
      .finally(() => setIsFeeLoading(false));
  };

  useEffect(() => {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (tenantSlug) headers['x-tenant-slug'] = tenantSlug;

    // Fetch Student Summary
    fetch('http://localhost:5000/api/dashboard/student-summary', { headers })
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data) {
          setStudentSummary(prev => ({ ...prev, ...data }));
          const targetClass = `${data.grade || 'Class 10'} - ${data.section || 'A'}`;
          // Fetch live class materials for student's class
          fetch(`http://localhost:5000/api/communication/class-materials?classSection=${encodeURIComponent(targetClass)}`, { headers })
            .then(mRes => mRes.ok ? mRes.json() : null)
            .then(mData => {
              if (mData && Array.isArray(mData.materials)) {
                setClassMaterials(mData.materials);
              }
            })
            .catch(e => console.warn('Class materials fetch error:', e));
        }
      })
      .catch(err => console.warn('Student summary error:', err));

    fetchFeeHistory();
  }, [tenantSlug]);

  const timetableList = studentSummary.timetable.length > 0 ? studentSummary.timetable : [
    { time: '08:00 AM - 09:00 AM', subject: 'Mathematics', teacher: 'Mrs. Sharma', status: 'Completed', color: '#16A34A' },
    { time: '09:00 AM - 10:00 AM', subject: 'Physics', teacher: 'Dr. Desai', status: 'In Progress', color: '#0F766E' },
    { time: '10:15 AM - 11:15 AM', subject: 'English', teacher: 'Mr. Kumar', status: 'Upcoming', color: '#60A5FA' },
    { time: '11:15 AM - 12:15 PM', subject: 'Computer Science', teacher: 'Ms. Gupta', status: 'Upcoming', color: '#4F46E5' }
  ];

  const filteredMaterials = classMaterials.filter(m => {
    if (activeMaterialTab === 'notes') return m.type !== 'Assignment';
    if (activeMaterialTab === 'assignments') return m.type === 'Assignment';
    return true;
  });

  return (
    <div className="dashboard-grid">
      {/* Top Banner - Glassmorphism */}
      <div style={{
        gridColumn: '1 / -1',
        background: 'linear-gradient(135deg, rgba(15, 118, 110,0.92) 0%, rgba(37, 99, 235, 0.88) 100%)',
        borderRadius: '20px',
        padding: '24px 32px',
        color: 'white',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px',
        boxShadow: '0 10px 25px -5px rgba(15, 118, 110, 0.4)'
      }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, margin: '0 0 8px 0' }}>Hi, {studentSummary.studentName}! 🎓</h2>
          <p style={{ opacity: 0.92, fontSize: '0.95rem', margin: 0 }}>
            {studentSummary.grade} - Section {studentSummary.section} • Session 2026-2027 • Fee Status: <strong style={{ color: '#a7f3d0' }}>Cleared Up-to-Date</strong>
          </p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '0.95rem', fontWeight: 600, opacity: 0.9 }}>{studentSummary.grade} - Section {studentSummary.section}</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, letterSpacing: '0.5px' }}>Student ID: {studentSummary.rollNumber}</div>
        </div>
      </div>

      {/* LEFT COLUMN */}
      <div className="left-column">
        {/* KPI Row */}
        <div className="kpi-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
          {[
            { label: 'Attendance', value: studentSummary.attendance, icon: Clock, color: '#4F46E5', bg: 'rgba(79,70,229,0.1)' },
            { label: 'Avg Grade', value: studentSummary.avgGrade, icon: Award, color: '#60A5FA', bg: 'rgba(96,165,250,0.1)' },
            { 
              label: 'Fees Paid', 
              value: feeData ? `₹${(feeData.summary?.totalSubmitted / 1000).toFixed(1)}k` : '₹47.0k', 
              icon: CreditCard, 
              color: '#059669', 
              bg: 'rgba(5,150,105,0.1)', 
              badge: 'View Page →',
              onClick: () => navigate(`/${tenantSlug}/student-fees`)
            },
            { label: 'Class Notes', value: classMaterials.filter(m => m.type !== 'Assignment').length, icon: BookOpen, color: '#0F766E', bg: 'rgba(15, 118, 110,0.1)' },
            { label: 'Assignments', value: classMaterials.filter(m => m.type === 'Assignment').length, icon: Calendar, color: '#F59E0B', bg: 'rgba(245,158,11,0.1)' }
          ].map((kpi, i) => (
            <div 
              key={i} 
              onClick={kpi.onClick}
              className="card hover-lift" 
              style={{ 
                display: 'flex', flexDirection: 'column', gap: '12px', padding: '18px 20px', 
                borderRadius: '16px', background: 'white', border: '1px solid #e2e8f0', 
                boxShadow: '0 2px 10px rgba(0,0,0,0.02)', cursor: kpi.onClick ? 'pointer' : 'default',
                transition: 'all 0.3s' 
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: kpi.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <kpi.icon size={20} color={kpi.color} />
                </div>
                {kpi.onClick && (
                  <span style={{ fontSize: '0.68rem', background: '#dcfce7', color: '#15803d', fontWeight: 800, padding: '2px 6px', borderRadius: '4px' }}>
                    View Ledger ↓
                  </span>
                )}
              </div>
              <div>
                <div style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--color-primary)' }}>{kpi.value}</div>
                <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>{kpi.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* ======================================================== */}
        {/* SECTION: FEE ACCOUNTS SUMMARY & QUICK ACCESS            */}
        {/* ======================================================== */}
        <div id="fees-section" className="card" style={{ marginTop: '16px', padding: '22px 26px', background: 'white', borderRadius: '18px', border: '1px solid #e2e8f0', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '46px', height: '46px', borderRadius: '14px', background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)', color: '#1d4ed8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CreditCard size={24} />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#1e3a8a' }}>
                    My Fees & Receipts
                  </h3>
                  <span style={{ fontSize: '0.72rem', background: '#dcfce7', color: '#15803d', fontWeight: 800, padding: '2px 8px', borderRadius: '12px' }}>
                    Cleared Up-to-Date
                  </span>
                </div>
                <p style={{ margin: '2px 0 0', fontSize: '0.82rem', color: '#64748b' }}>
                  Session 2026-2027 • Official fee schedule, month-by-month payments & printable receipts.
                </p>
              </div>
            </div>

            <button
              onClick={() => navigate(`/${tenantSlug}/student-fees`)}
              style={{
                background: 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                padding: '10px 18px',
                fontSize: '0.86rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 14px rgba(37, 99, 235, 0.25)',
                transition: 'all 0.2s'
              }}
            >
              <Receipt size={16} />
              <span>Open Monthly Fee Ledger & Receipts</span>
              <ChevronRight size={16} />
            </button>
          </div>

          {/* 4 Summary KPI Tiles */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
            gap: '12px'
          }}>
            <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '12px 16px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Total Submitted</div>
              <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#059669', marginTop: '2px' }}>
                ₹{feeData?.summary?.totalSubmitted ? feeData.summary.totalSubmitted.toLocaleString() : '47,000'}
              </div>
              <div style={{ fontSize: '0.72rem', color: '#15803d', fontWeight: 600, marginTop: '2px' }}>Session 2026-2027</div>
            </div>
            <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '12px 16px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Cleared Months</div>
              <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#1e3a8a', marginTop: '2px' }}>
                {feeData?.summary?.submittedMonthsCount || 7} / {feeData?.summary?.totalMonthsCount || 12}
              </div>
              <div style={{ fontSize: '0.72rem', color: '#2563eb', fontWeight: 600, marginTop: '2px' }}>April – October Paid</div>
            </div>
            <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '12px 16px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Latest Counter Receipt</div>
              <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#1e293b', marginTop: '6px', fontFamily: 'monospace' }}>
                {feeData?.summary?.latestReceiptNo || 'REC-202610-1001'}
              </div>
              <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '2px' }}>Verified & Downloadable</div>
            </div>
            <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '12px 16px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Account Standing</div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#15803d', fontSize: '0.88rem', fontWeight: 800, marginTop: '4px' }}>
                <CheckCircle2 size={15} /> All Dues Cleared
              </div>
              <div style={{ fontSize: '0.72rem', color: '#15803d', marginTop: '2px' }}>No Overdue Penalties</div>
            </div>
          </div>
        </div>

        {/* Class Notes & Learning Materials Feed for This Student */}
        <div className="card" style={{ marginTop: '16px' }}>
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BookOpen size={20} color="#0F766E" />
              <div className="card-title">Class Notes & Learning Materials ({studentSummary.grade} - {studentSummary.section})</div>
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                onClick={() => setActiveMaterialTab('all')}
                style={{
                  padding: '4px 12px',
                  borderRadius: '12px',
                  border: 'none',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  background: activeMaterialTab === 'all' ? '#0F766E' : '#f1f5f9',
                  color: activeMaterialTab === 'all' ? 'white' : '#64748b'
                }}
              >
                All ({classMaterials.length})
              </button>
              <button
                onClick={() => setActiveMaterialTab('notes')}
                style={{
                  padding: '4px 12px',
                  borderRadius: '12px',
                  border: 'none',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  background: activeMaterialTab === 'notes' ? '#10B981' : '#f1f5f9',
                  color: activeMaterialTab === 'notes' ? 'white' : '#64748b'
                }}
              >
                Notes ({classMaterials.filter(m => m.type !== 'Assignment').length})
              </button>
              <button
                onClick={() => setActiveMaterialTab('assignments')}
                style={{
                  padding: '4px 12px',
                  borderRadius: '12px',
                  border: 'none',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  background: activeMaterialTab === 'assignments' ? '#4F46E5' : '#f1f5f9',
                  color: activeMaterialTab === 'assignments' ? 'white' : '#64748b'
                }}
              >
                Assignments ({classMaterials.filter(m => m.type === 'Assignment').length})
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '10px' }}>
            {filteredMaterials.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px', color: '#64748b', fontSize: '0.88rem' }}>
                No materials broadcast to your class yet. Check back soon!
              </div>
            ) : (
              filteredMaterials.map((mat) => {
                const isAsg = mat.type === 'Assignment';
                return (
                  <div 
                    key={mat._id || mat.id}
                    onClick={() => setSelectedMaterial(mat)}
                    className="hover-lift"
                    style={{
                      padding: '16px 20px',
                      background: 'var(--color-bg, #f8fafc)',
                      borderRadius: '14px',
                      borderLeft: `4px solid ${isAsg ? '#4F46E5' : '#10B981'}`,
                      border: '1px solid var(--color-border, #e2e8f0)',
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '14px',
                      transition: 'all 0.2s'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <span style={{ 
                          fontSize: '0.72rem', 
                          fontWeight: 800, 
                          padding: '2px 8px', 
                          borderRadius: '10px',
                          background: isAsg ? 'rgba(79,70,229,0.1)' : 'rgba(16,185,129,0.12)',
                          color: isAsg ? '#4F46E5' : '#10B981'
                        }}>
                          {isAsg ? 'Assignment' : 'Study Notes'}
                        </span>
                        <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569' }}>
                          {mat.subject}
                        </span>
                        {mat.chapter && (
                          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>• {mat.chapter}</span>
                        )}
                      </div>
                      <h4 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 800, color: '#0f172a' }}>
                        {mat.title}
                      </h4>
                      <p style={{ margin: '4px 0 0 0', fontSize: '0.82rem', color: '#64748b', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {mat.content}
                      </p>
                    </div>

                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      {isAsg ? (
                        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#DC2626' }}>
                          Due: {mat.dueDate ? new Date(mat.dueDate).toLocaleDateString([], { month: 'short', day: 'numeric' }) : 'Soon'}
                        </div>
                      ) : (
                        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0F766E' }}>
                          {mat.attachments?.length > 0 ? `${mat.attachments.length} Attachment` : 'Read Notes'}
                        </div>
                      )}
                      <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '2px' }}>
                        {mat.teacherName}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Timetable */}
        <div className="card" style={{ marginTop: '16px' }}>
          <div className="card-header">
            <div className="card-title">Today's Class Schedule (Live DB)</div>
            <div style={{ fontSize: '0.85rem', color: '#0F766E', fontWeight: 600, cursor: 'pointer' }}>Enrolled Subjects</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {timetableList.map((cls, i) => (
              <div key={i} style={{ 
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                padding: '16px', background: 'var(--color-bg, #f8fafc)', 
                borderRadius: '12px', borderLeft: `4px solid ${cls.color}`,
                border: '1px solid var(--color-border, #e2e8f0)',
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
      <div className="right-column">
        {/* Growth Profile */}
        <div className="card">
          <div className="card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Target size={20} color="#60A5FA" />
              <div className="card-title">Subject Growth Profile</div>
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
            Attendance standing: <strong>{studentSummary.attendance}</strong> across all curriculum terms.
          </div>
        </div>

        {/* Active Homework & Tasks */}
        <div className="card" style={{ flex: 1 }}>
          <div className="card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertCircle size={20} color="#F59E0B" />
              <div className="card-title">Class Assignments Queue</div>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {classMaterials.filter(m => m.type === 'Assignment').length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', color: '#64748b', fontSize: '0.85rem' }}>
                No pending assignments for your class!
              </div>
            ) : (
              classMaterials.filter(m => m.type === 'Assignment').map((asg) => (
                <div 
                  key={asg._id || asg.id} 
                  onClick={() => setSelectedMaterial(asg)}
                  className="hover-lift" 
                  style={{ padding: '16px', background: 'rgba(79, 70, 229, 0.05)', border: '1px solid rgba(79, 70, 229, 0.2)', borderRadius: '12px', cursor: 'pointer' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontWeight: 700, color: '#1e293b', fontSize: '0.92rem' }}>{asg.title}</div>
                    <div style={{ background: '#4F46E5', color: 'white', padding: '2px 8px', borderRadius: '12px', fontSize: '0.7rem', fontWeight: 700 }}>
                      Max {asg.maxMarks || 50}
                    </div>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '6px' }}>
                    {asg.subject} • Due {asg.dueDate ? new Date(asg.dueDate).toLocaleDateString([], { month: 'short', day: 'numeric' }) : 'Soon'}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* STUDENT MATERIAL DETAIL MODAL */}
      {selectedMaterial && createPortal(
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 99999, padding: '20px'
        }}>
          <div style={{
            background: 'white', borderRadius: '20px', width: '100%', maxWidth: '640px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', overflow: 'hidden',
            border: '1px solid #e2e8f0', maxHeight: '85vh', display: 'flex', flexDirection: 'column'
          }}>
            <div style={{
              padding: '20px 24px', borderBottom: '1px solid #e2e8f0',
              display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
              background: '#f8fafc', flexShrink: 0
            }}>
              <div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 800, background: selectedMaterial.type === 'Assignment' ? 'rgba(79, 70, 229, 0.1)' : 'rgba(16, 185, 129, 0.12)', color: selectedMaterial.type === 'Assignment' ? '#4F46E5' : '#10B981', padding: '3px 9px', borderRadius: '12px' }}>
                    {selectedMaterial.type === 'Assignment' ? 'Homework Assignment' : 'Class Study Notes'}
                  </span>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, background: '#e2e8f0', color: '#334155', padding: '3px 9px', borderRadius: '12px' }}>
                    {selectedMaterial.subject}
                  </span>
                </div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
                  {selectedMaterial.title}
                </h3>
                {selectedMaterial.chapter && (
                  <div style={{ fontSize: '0.82rem', color: '#64748B', marginTop: '4px' }}>
                    {selectedMaterial.chapter}
                  </div>
                )}
              </div>
              <button
                onClick={() => setSelectedMaterial(null)}
                style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '10px', width: '34px', height: '34px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              >
                <X size={16} style={{ color: '#64748b' }} />
              </button>
            </div>

            <div style={{ padding: '24px', overflowY: 'auto', flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {selectedMaterial.type === 'Assignment' && (
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', background: 'rgba(79, 70, 229, 0.05)', borderRadius: '12px', border: '1px solid rgba(79, 70, 229, 0.15)', fontSize: '0.85rem' }}>
                  <div style={{ fontWeight: 700, color: '#4F46E5' }}>
                    📅 Due: {selectedMaterial.dueDate ? new Date(selectedMaterial.dueDate).toLocaleDateString() : 'N/A'}
                  </div>
                  <div style={{ fontWeight: 800, color: '#0f172a' }}>
                    ⭐ Max Score: {selectedMaterial.maxMarks || 50} Marks
                  </div>
                </div>
              )}

              <div>
                <h5 style={{ margin: '0 0 8px 0', fontSize: '0.82rem', fontWeight: 700, textTransform: 'uppercase', color: '#64748B' }}>
                  {selectedMaterial.type === 'Assignment' ? 'Assignment Questions & Instructions:' : 'Lecture Notes Content:'}
                </h5>
                <div style={{ 
                  background: '#f8fafc', 
                  padding: '16px 20px', 
                  borderRadius: '12px', 
                  border: '1px solid #e2e8f0',
                  fontSize: '0.92rem', 
                  lineHeight: 1.6, 
                  color: '#1e293b', 
                  whiteSpace: 'pre-wrap'
                }}>
                  {selectedMaterial.content}
                </div>
              </div>

              {selectedMaterial.attachments && selectedMaterial.attachments.length > 0 && (
                <div>
                  <h5 style={{ margin: '0 0 8px 0', fontSize: '0.82rem', fontWeight: 700, textTransform: 'uppercase', color: '#64748B' }}>Attached Reference Materials:</h5>
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    {selectedMaterial.attachments.map((att, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 14px', background: 'white', border: '1.5px solid #cbd5e1', borderRadius: '10px', fontSize: '0.85rem' }}>
                        <Paperclip size={16} color="#0F766E" />
                        <span style={{ fontWeight: 600, color: '#0f172a' }}>{att.title}</span>
                        <span style={{ fontSize: '0.75rem', color: '#64748b' }}>({att.fileSize || '1.5 MB'})</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '12px', fontSize: '0.82rem', color: '#64748B', display: 'flex', justifyContent: 'space-between' }}>
                <span>Teacher: <strong>{selectedMaterial.teacherName || 'Class Faculty'}</strong></span>
                <span>Target: <strong>{selectedMaterial.classSection}</strong></span>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
};

export default StudentDashboard;
