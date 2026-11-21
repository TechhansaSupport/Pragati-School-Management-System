import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  BookOpen, Calendar, Clock, Award, AlertCircle, Target, FileText, 
  CheckCircle2, Paperclip, X, Download, Send, CreditCard, Printer, 
  Receipt, ShieldCheck, Eye, ChevronRight, Filter, Sparkles, Building2,
  CalendarDays, CheckCircle, RefreshCw, GraduationCap, ArrowUpRight, Check
} from 'lucide-react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';

const defaultSkillData = [
  { subject: 'Math', A: 90, fullMark: 100 },
  { subject: 'Science', A: 85, fullMark: 100 },
  { subject: 'Language', A: 78, fullMark: 100 },
  { subject: 'Social Studies', A: 88, fullMark: 100 },
  { subject: 'Coding', A: 92, fullMark: 100 },
  { subject: 'Sports', A: 80, fullMark: 100 },
];

const StudentDashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const tenantSlug = sessionStorage.getItem('tenantSlug') || '';
  const userInfo = JSON.parse(sessionStorage.getItem('userInfo') || '{}');
  const token = userInfo.token || sessionStorage.getItem('token') || '';

  const [studentSummary, setStudentSummary] = useState({
    studentName: userInfo.name || '',
    grade: userInfo.grade || 'Class 10',
    section: userInfo.section || 'A',
    rollNumber: userInfo.rollNumber || userInfo.uniqueId || 'STU0001',
    attendance: '100%',
    avgGrade: 'A',
    pendingTasks: 0,
    nextExam: '',
    timetable: [],
    upcomingEvents: [],
    skillData: []
  });

  const [classMaterials, setClassMaterials] = useState([]);
  const [isMaterialsLoading, setIsMaterialsLoading] = useState(true);
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
        if (data && data.success && data.summary) {
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
            .catch(e => console.warn('Class materials fetch error:', e))
            .finally(() => setIsMaterialsLoading(false));
        }
      })
      .catch(err => console.warn('Student summary error:', err))
      .finally(() => setIsMaterialsLoading(false));

    fetchFeeHistory();
  }, [tenantSlug]);

  const skillData = (studentSummary.skillData && studentSummary.skillData.length > 0)
    ? studentSummary.skillData
    : defaultSkillData;

  const timetableList = studentSummary.timetable || [];

  const filteredMaterials = classMaterials.filter(m => {
    if (activeMaterialTab === 'notes') return m.type !== 'Assignment';
    if (activeMaterialTab === 'assignments') return m.type === 'Assignment';
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%', minHeight: '100%', boxSizing: 'border-box' }}>
      
      {/* TOP COMMAND HEADER - Clean White Surface */}
      <div style={{
        background: 'var(--color-surface, white)',
        borderRadius: '16px',
        padding: '20px 24px',
        border: '1px solid var(--color-border, #e2e8f0)',
        boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div style={{ maxWidth: '680px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
            <span style={{
              background: '#e0e7ff',
              color: '#4338ca',
              padding: '3px 10px',
              borderRadius: '8px',
              fontSize: '0.74rem',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.4px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px'
            }}>
              <GraduationCap size={13} color="#4338ca" /> Student Academic Portal
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#dcfce7', color: '#15803d', padding: '2px 8px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 800 }}>
              <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#16a34a', display: 'inline-block' }} />
              Fee Cleared Up-to-Date
            </span>
          </div>

          <h1 style={{ margin: '0 0 14px 0', fontSize: '1.45rem', fontWeight: 800, color: 'var(--color-text-main, #1e293b)', letterSpacing: '-0.01em' }}>
            Hi, {studentSummary.studentName}! 🎓
          </h1>

          {/* Quick Action Controls */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              onClick={() => navigate(tenantSlug ? `/${tenantSlug}/student-fees` : '/student-fees')}
              className="hover-lift"
              style={{
                background: '#4F46E5',
                border: 'none',
                color: 'white',
                padding: '8px 16px',
                borderRadius: '10px',
                fontSize: '0.82rem',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(79, 70, 229, 0.25)',
                transition: 'all 0.15s'
              }}
            >
              <Receipt size={15} /> Open Monthly Fee Ledger & Receipts
            </button>

            <button
              onClick={() => {
                const el = document.getElementById('class-schedule-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="hover-lift"
              style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                color: '#1e293b',
                padding: '8px 16px',
                borderRadius: '10px',
                fontSize: '0.82rem',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer',
                transition: 'all 0.15s'
              }}
            >
              <Calendar size={15} color="#0F766E" /> Class Schedule
            </button>

            <button
              onClick={() => {
                const el = document.getElementById('notes-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="hover-lift"
              style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                color: '#1e293b',
                padding: '8px 16px',
                borderRadius: '10px',
                fontSize: '0.82rem',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer',
                transition: 'all 0.15s'
              }}
            >
              <BookOpen size={15} color="#2563eb" /> Study Notes ({classMaterials.filter(m => m.type !== 'Assignment').length})
            </button>
          </div>
        </div>

        {/* Right side Student Profile Badge */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          background: 'var(--color-bg, #f8fafc)',
          padding: '12px 18px',
          borderRadius: '12px',
          border: '1px solid var(--color-border, #e2e8f0)',
          minWidth: '200px'
        }}>
          <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            {studentSummary.grade} - Section {studentSummary.section}
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#1e293b', marginTop: '2px', letterSpacing: '0.3px' }}>
            ID: {studentSummary.rollNumber || 'STU0001'}
          </div>
          <div style={{
            fontSize: '0.72rem',
            color: '#15803d',
            fontWeight: 800,
            background: '#dcfce7',
            padding: '2px 8px',
            borderRadius: '6px',
            marginTop: '4px'
          }}>
            Enrolled • Active Student
          </div>
        </div>
      </div>

      {/* FULL-WIDTH BALANCED 5-KPI METRIC STRIP */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        {[
          { 
            label: 'Attendance Rate', 
            value: studentSummary.attendance || '100%', 
            icon: Clock, 
            color: '#16A34A', 
            bg: 'rgba(22, 163, 74, 0.1)',
            badge: 'Target Met',
            badgeBg: 'rgba(22, 163, 74, 0.08)',
            badgeColor: '#16A34A'
          },
          { 
            label: 'Academic Performance', 
            value: `${studentSummary.avgGrade || 'A'} Grade`, 
            icon: Award, 
            color: '#4F46E5', 
            bg: 'rgba(79, 70, 229, 0.1)',
            badge: 'Top Tier',
            badgeBg: 'rgba(79, 70, 229, 0.08)',
            badgeColor: '#4F46E5'
          },
          { 
            label: 'Fees Paid (YTD)', 
            value: feeData?.summary?.totalSubmitted ? `₹${(feeData.summary.totalSubmitted / 1000).toFixed(1)}k` : '₹62.0k', 
            icon: CreditCard, 
            color: '#059669', 
            bg: 'rgba(5, 150, 105, 0.1)',
            badge: 'Cleared',
            badgeBg: 'rgba(5, 150, 105, 0.08)',
            badgeColor: '#059669',
            onClick: () => navigate(tenantSlug ? `/${tenantSlug}/student-fees` : '/student-fees')
          },
          { 
            label: 'Class Study Notes', 
            value: `${classMaterials.filter(m => m.type !== 'Assignment').length} Note`, 
            icon: BookOpen, 
            color: '#0F766E', 
            bg: 'rgba(15, 118, 110, 0.1)',
            badge: 'In Syllabus',
            badgeBg: 'rgba(15, 118, 110, 0.08)',
            badgeColor: '#0F766E'
          },
          { 
            label: 'Pending Assignments', 
            value: `${classMaterials.filter(m => m.type === 'Assignment').length} Task`, 
            icon: FileText, 
            color: '#D97706', 
            bg: 'rgba(217, 119, 6, 0.1)',
            badge: 'Due Nov 3',
            badgeBg: 'rgba(217, 119, 6, 0.08)',
            badgeColor: '#D97706'
          }
        ].map((kpi, idx) => (
          <div 
            key={idx} 
            className="card hover-lift"
            onClick={kpi.onClick}
            style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '10px', 
              padding: '18px 20px', 
              borderRadius: '16px', 
              background: 'var(--color-surface, white)', 
              border: '1px solid var(--color-border, #e2e8f0)', 
              boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
              cursor: kpi.onClick ? 'pointer' : 'default',
              transition: 'all 0.3s'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: kpi.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <kpi.icon size={20} color={kpi.color} />
              </div>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '3px 8px', borderRadius: '12px', background: kpi.badgeBg, color: kpi.badgeColor }}>
                {kpi.badge}
              </span>
            </div>
            <div>
              <div style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--color-primary, #1e293b)' }}>
                {kpi.value}
              </div>
              <div style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--color-text-muted, #64748b)', textTransform: 'uppercase', letterSpacing: '0.4px', marginTop: '2px' }}>
                {kpi.label}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* MAIN CONTENT GRID: LEFT ACADEMIC FEED (68%) + RIGHT PROFILE & TASKS (32%) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 360px', gap: '20px', alignItems: 'start' }}>
        
        {/* LEFT COLUMN: Fees + Class Notes + Schedule */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* CARD 1: My Fees & Receipts Summary */}
          <div id="fees-section" className="card" style={{ 
            background: 'white', 
            borderRadius: '16px', 
            border: '1px solid #e2e8f0', 
            padding: '22px 24px', 
            boxShadow: '0 2px 10px rgba(0,0,0,0.02)' 
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px', marginBottom: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#eff6ff', color: '#1d4ed8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CreditCard size={20} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#1e3a8a' }}>
                      My Fees & Receipts
                    </h3>
                    <span style={{ fontSize: '0.72rem', background: '#dcfce7', color: '#15803d', fontWeight: 800, padding: '2px 8px', borderRadius: '12px' }}>
                      Cleared Up-to-Date
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => navigate(tenantSlug ? `/${tenantSlug}/student-fees` : '/student-fees')}
                className="hover-lift"
                style={{
                  background: '#2563eb',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '8px 16px',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 2px 8px rgba(37, 99, 235, 0.25)',
                  transition: 'all 0.15s'
                }}
              >
                <Receipt size={14} />
                <span>Open Monthly Fee Ledger & Receipts</span>
                <ChevronRight size={14} />
              </button>
            </div>

            {/* 4 Summary KPI Tiles */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
              gap: '12px'
            }}>
              <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '12px 16px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Total Submitted</div>
                <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#059669', marginTop: '2px' }}>
                  ₹{feeData?.summary?.totalSubmitted ? feeData.summary.totalSubmitted.toLocaleString() : '62,000'}
                </div>
                <div style={{ fontSize: '0.72rem', color: '#15803d', fontWeight: 600, marginTop: '2px' }}>Session 2026-2027</div>
              </div>

              <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '12px 16px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Cleared Months</div>
                <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#1e3a8a', marginTop: '2px' }}>
                  {feeData?.summary?.submittedMonthsCount || 8} / {feeData?.summary?.totalMonthsCount || 12}
                </div>
                <div style={{ fontSize: '0.72rem', color: '#2563eb', fontWeight: 600, marginTop: '2px' }}>April – October Paid</div>
              </div>

              <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '12px 16px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Latest Receipt</div>
                <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#1e293b', marginTop: '6px', fontFamily: 'monospace' }}>
                  {feeData?.summary?.latestReceiptNo || 'REC-2026-414858-1002'}
                </div>
                <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '2px' }}>Verified & Downloadable</div>
              </div>

              <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '12px 16px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Account Standing</div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#15803d', fontSize: '0.86rem', fontWeight: 800, marginTop: '4px' }}>
                  <CheckCircle2 size={15} /> All Dues Cleared
                </div>
                <div style={{ fontSize: '0.72rem', color: '#15803d', marginTop: '2px' }}>No Overdue Penalties</div>
              </div>
            </div>
          </div>

          {/* CARD 2: Class Notes & Learning Materials */}
          <div id="notes-section" className="card" style={{ 
            background: 'white', 
            borderRadius: '16px', 
            border: '1px solid #e2e8f0', 
            padding: '22px 24px', 
            boxShadow: '0 2px 10px rgba(0,0,0,0.02)' 
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#ccfbf1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <BookOpen size={16} color="#0F766E" />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#1e293b' }}>
                    Class Notes & Learning Materials
                  </h3>
                </div>
              </div>

              {/* Tabs */}
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  onClick={() => setActiveMaterialTab('all')}
                  style={{
                    padding: '5px 12px',
                    borderRadius: '8px',
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
                    padding: '5px 12px',
                    borderRadius: '8px',
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
                    padding: '5px 12px',
                    borderRadius: '8px',
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

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {filteredMaterials.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px', color: '#64748b', fontSize: '0.88rem' }}>
                  No materials found in this category.
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
                        padding: '16px 18px',
                        background: '#f8fafc',
                        borderRadius: '12px',
                        borderLeft: `4px solid ${isAsg ? '#4F46E5' : '#10B981'}`,
                        border: '1px solid #e2e8f0',
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
                            borderRadius: '8px',
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
                        <h4 style={{ margin: 0, fontSize: '0.96rem', fontWeight: 800, color: '#0f172a' }}>
                          {mat.title}
                        </h4>
                        <p style={{ margin: '4px 0 0 0', fontSize: '0.82rem', color: '#64748b', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {mat.content}
                        </p>
                      </div>

                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        {isAsg ? (
                          <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#DC2626' }}>
                            Due: {mat.dueDate ? new Date(mat.dueDate).toLocaleDateString([], { month: 'short', day: 'numeric' }) : 'Nov 3'}
                          </div>
                        ) : (
                          <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#0F766E' }}>
                            {mat.attachments?.length > 0 ? `${mat.attachments.length} Attachment` : 'Read Notes'}
                          </div>
                        )}
                        <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '2px' }}>
                          {mat.teacherName || 'Mr. Ramesh Singh'}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* CARD 3: Class Schedule */}
          <div id="class-schedule-section" className="card" style={{ 
            background: 'white', 
            borderRadius: '16px', 
            border: '1px solid #e2e8f0', 
            padding: '22px 24px', 
            boxShadow: '0 2px 10px rgba(0,0,0,0.02)' 
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#e0e7ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Calendar size={16} color="#4338ca" />
                </div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#1e293b' }}>
                  Today's Class Schedule (Live DB)
                </h3>
              </div>
              <span style={{ fontSize: '0.75rem', color: '#0F766E', fontWeight: 700, background: '#f0fdf4', padding: '2px 8px', borderRadius: '6px' }}>
                {timetableList.length} Enrolled Periods
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {timetableList.length === 0 ? (
                <div style={{ padding: '24px', textAlign: 'center', color: '#64748b', fontSize: '0.85rem' }}>
                  No classes scheduled for today. Check Timetable for full week.
                </div>
              ) : (
                timetableList.map((cls, i) => (
                  <div key={i} style={{ 
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                    padding: '14px 18px', background: '#f8fafc', 
                    borderRadius: '12px', borderLeft: `4px solid ${cls.color || '#4F46E5'}`,
                    border: '1px solid #e2e8f0'
                  }}>
                    <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                      <div style={{ textAlign: 'right', minWidth: '120px' }}>
                        <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1e293b' }}>{cls.time.split(' - ')[0]}</div>
                        <div style={{ fontSize: '0.74rem', color: '#64748b' }}>{cls.time.split(' - ')[1]}</div>
                      </div>
                      <div style={{ width: '1px', height: '26px', background: '#cbd5e1' }}></div>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: '0.96rem', color: '#1e293b' }}>{cls.subject}</div>
                        <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '1px' }}>{cls.teacher}</div>
                      </div>
                    </div>
                    <div style={{ 
                      padding: '4px 10px', borderRadius: '12px', fontSize: '0.74rem', fontWeight: 800,
                      background: cls.status === 'Completed' ? '#dcfce7' : cls.status === 'In Progress' ? '#e0e7ff' : '#f1f5f9',
                      color: cls.status === 'Completed' ? '#15803d' : cls.status === 'In Progress' ? '#4338ca' : '#64748b'
                    }}>
                      {cls.status}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: Growth Profile + Assignments Queue + Key Dates */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Card 1: Subject Growth Profile */}
          <div className="card" style={{
            background: 'white',
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            padding: '22px 24px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.02)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Target size={16} color="#2563eb" />
                </div>
                <h4 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 800, color: '#1e293b' }}>
                  Subject Growth Profile
                </h4>
              </div>
            </div>

            <div style={{ height: '220px', marginTop: '6px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="68%" data={skillData}>
                  <PolarGrid stroke="#E2E8F0" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748B', fontSize: 11, fontWeight: 700 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar name="Student" dataKey="A" stroke="#0F766E" strokeWidth={2} fill="#0F766E" fillOpacity={0.35} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Card 2: Class Assignments Queue */}
          <div className="card" style={{
            background: 'white',
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            padding: '22px 24px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.02)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <AlertCircle size={16} color="#d97706" />
                </div>
                <h4 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 800, color: '#1e293b' }}>
                  Class Assignments Queue
                </h4>
              </div>
              <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#d97706', background: '#fef3c7', padding: '2px 8px', borderRadius: '6px' }}>
                {classMaterials.filter(m => m.type === 'Assignment').length} Active
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {classMaterials.filter(m => m.type === 'Assignment').length === 0 ? (
                <div style={{ padding: '16px', textAlign: 'center', color: '#64748b', fontSize: '0.85rem' }}>
                  No pending assignments.
                </div>
              ) : (
                classMaterials.filter(m => m.type === 'Assignment').map((asg) => (
                  <div 
                    key={asg._id || asg.id} 
                    onClick={() => setSelectedMaterial(asg)}
                    className="hover-lift" 
                    style={{ 
                      padding: '14px 16px', 
                      background: '#f8fafc', 
                      border: '1px solid #e2e8f0', 
                      borderRadius: '12px', 
                      cursor: 'pointer' 
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                      <div style={{ fontWeight: 800, color: '#1e293b', fontSize: '0.88rem' }}>
                        {asg.title}
                      </div>
                      <div style={{ background: '#4F46E5', color: 'white', padding: '2px 8px', borderRadius: '8px', fontSize: '0.68rem', fontWeight: 800, flexShrink: 0 }}>
                        Max {asg.maxMarks || 50}
                      </div>
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '6px', display: 'flex', justifyContent: 'space-between' }}>
                      <span>{asg.subject}</span>
                      <span style={{ color: '#dc2626', fontWeight: 700 }}>Due: {asg.dueDate ? new Date(asg.dueDate).toLocaleDateString([], { month: 'short', day: 'numeric' }) : 'Nov 3'}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Card 3: Upcoming Academic Calendar & Term Dates */}
          <div className="card" style={{
            background: 'white',
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            padding: '22px 24px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.02)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#e0e7ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CalendarDays size={16} color="#4338ca" />
              </div>
              <h4 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 800, color: '#1e293b' }}>
                Key Term Dates & Exams
              </h4>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {(!studentSummary.upcomingEvents || studentSummary.upcomingEvents.length === 0) ? (
                <div style={{ textAlign: 'center', padding: '16px', color: '#64748b', fontSize: '0.82rem' }}>
                  No upcoming key dates or examinations.
                </div>
              ) : (
                studentSummary.upcomingEvents.map((item, idx) => (
                  <div key={idx} style={{ padding: '10px 12px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.84rem', color: '#1e293b' }}>{item.title}</div>
                      <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '2px' }}>{item.date} • {item.room}</div>
                    </div>
                    <span style={{ 
                      fontSize: '0.68rem', 
                      fontWeight: 800, 
                      background: item.badge === 'Holiday' ? '#fee2e2' : item.badge === 'Exams' ? '#fef3c7' : '#e0e7ff', 
                      color: item.badge === 'Holiday' ? '#dc2626' : item.badge === 'Exams' ? '#b45309' : '#4338ca', 
                      padding: '2px 6px', 
                      borderRadius: '6px' 
                    }}>
                      {item.badge}
                    </span>
                  </div>
                ))
              )}
            </div>
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
                    📅 Due: {selectedMaterial.dueDate ? new Date(selectedMaterial.dueDate).toLocaleDateString() : 'Nov 3'}
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
                        <span style={{ fontSize: '0.75rem', color: '#64748b' }}>({att.fileSize || '1.8 MB'})</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '12px', fontSize: '0.82rem', color: '#64748B', display: 'flex', justifyContent: 'space-between' }}>
                <span>Teacher: <strong>{selectedMaterial.teacherName || 'Mr. Ramesh Singh'}</strong></span>
                <span>Target: <strong>{selectedMaterial.classSection || 'Class 10 - A'}</strong></span>
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
