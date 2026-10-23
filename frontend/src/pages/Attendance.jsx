import React, { useState, useEffect, useMemo } from 'react';
import { 
  Calendar, CheckCircle2, XCircle, Clock, AlertCircle, 
  Search, Users, Save, RefreshCw, ChevronLeft, ChevronRight, 
  Filter, FileText, Check, ShieldCheck, UserCheck, ArrowRight,
  TrendingUp, Award, AlertTriangle, Building, BookOpen,
  ClipboardCheck, FileSpreadsheet, BarChart3
} from 'lucide-react';

const API_BASE = 'http://localhost:5000/api';

const Attendance = () => {
  const userInfo = JSON.parse(sessionStorage.getItem('userInfo') || '{}');
  const token = sessionStorage.getItem('token') || userInfo.token || '';
  const tenantSlug = sessionStorage.getItem('tenantSlug') || userInfo.slug || '';
  const userRole = (sessionStorage.getItem('userRole') || userInfo.role || 'admin').toLowerCase();

  const getTodayString = (d = new Date()) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // State
  const [selectedDate, setSelectedDate] = useState(getTodayString());
  const [classesList, setClassesList] = useState([]);
  const [selectedClass, setSelectedClass] = useState(''); // e.g. "Class 10 - A"
  const [roster, setRoster] = useState([]);
  const [summary, setSummary] = useState({ total: 0, present: 0, absent: 0, late: 0, excused: 0, attendanceRate: 100 });
  const [isMarked, setIsMarked] = useState(false);
  const [notes, setNotes] = useState('');
  const [markedByName, setMarkedByName] = useState('');

  // Daily School Stats
  const [dailyStats, setDailyStats] = useState({
    totalStudents: 0,
    totalClasses: 0,
    markedClasses: 0,
    pendingClasses: 0,
    overallPresent: 0,
    overallAbsent: 0,
    averageRate: 0,
    classBreakdown: []
  });

  const [activeTab, setActiveTab] = useState('mark'); // 'mark' | 'school-sheet' | 'analytics'
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [notification, setNotification] = useState({ show: false, text: '', type: 'success' });

  const getAuthHeaders = () => {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (tenantSlug) headers['x-tenant-slug'] = tenantSlug;
    return headers;
  };

  const showToast = (text, type = 'success') => {
    setNotification({ show: true, text, type });
    setTimeout(() => setNotification({ show: false, text: '', type: 'success' }), 4000);
  };

  // 1. Fetch Classes List and Daily Stats on load
  const loadInitialData = async () => {
    try {
      const [classesRes, statsRes] = await Promise.all([
        fetch(`${API_BASE}/classes`, { headers: getAuthHeaders() }),
        fetch(`${API_BASE}/attendance/stats?date=${selectedDate}`, { headers: getAuthHeaders() })
      ]);

      if (classesRes.ok) {
        const cData = await classesRes.json();
        const classes = cData.classes || [];
        setClassesList(classes);
        if (classes.length > 0 && !selectedClass) {
          setSelectedClass(`${classes[0].className} - ${classes[0].section}`);
        }
      }

      if (statsRes.ok) {
        const sData = await statsRes.json();
        setDailyStats(sData);
      }
    } catch (err) {
      console.error('Failed to load classes or attendance stats:', err);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, [tenantSlug]);

  // 2. Fetch Attendance for Selected Class & Date
  const fetchClassAttendance = async (className, section, date) => {
    if (!className || !section) return;
    setIsLoading(true);
    try {
      const res = await fetch(
        `${API_BASE}/attendance?className=${encodeURIComponent(className)}&section=${encodeURIComponent(section)}&date=${date}`,
        { headers: getAuthHeaders() }
      );
      if (res.ok) {
        const data = await res.json();
        setRoster(data.roster || []);
        setSummary(data.summary || { total: 0, present: 0, absent: 0, late: 0, excused: 0, attendanceRate: 100 });
        setIsMarked(data.isMarked);
        setNotes(data.notes || '');
        setMarkedByName(data.markedByName || '');
      }
    } catch (err) {
      console.error('Error loading class attendance:', err);
      showToast('Error loading attendance for this class', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Re-fetch when selectedClass or selectedDate changes
  useEffect(() => {
    if (selectedClass) {
      const parts = selectedClass.split(' - ');
      const cName = parts[0] || selectedClass;
      const cSec = parts[1] || 'A';
      fetchClassAttendance(cName, cSec, selectedDate);
    }
  }, [selectedClass, selectedDate]);

  // Re-fetch daily school stats when date changes
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch(`${API_BASE}/attendance/stats?date=${selectedDate}`, { headers: getAuthHeaders() });
        if (res.ok) {
          const data = await res.json();
          setDailyStats(data);
        }
      } catch (e) {}
    };
    fetchStats();
  }, [selectedDate]);

  // Toggle single student status
  const handleStatusChange = (studentId, newStatus) => {
    setRoster(prev => {
      const updated = prev.map(s => s.studentId === studentId ? { ...s, status: newStatus } : s);
      recalcSummary(updated);
      return updated;
    });
  };

  // Update remarks
  const handleRemarkChange = (studentId, remarks) => {
    setRoster(prev => prev.map(s => s.studentId === studentId ? { ...s, remarks } : s));
  };

  // Recalculate summary in memory
  const recalcSummary = (rosterList) => {
    let p = 0, a = 0, l = 0, e = 0;
    for (const s of rosterList) {
      if (s.status === 'Absent') a++;
      else if (s.status === 'Late') l++;
      else if (s.status === 'Excused') e++;
      else p++;
    }
    const tot = rosterList.length;
    const rate = tot > 0 ? Math.round(((p + l) / tot) * 100) : 100;
    setSummary({ total: tot, present: p, absent: a, late: l, excused: e, attendanceRate: rate });
  };

  // Bulk set status
  const handleBulkStatus = (status) => {
    setRoster(prev => {
      const updated = prev.map(s => ({ ...s, status }));
      recalcSummary(updated);
      return updated;
    });
  };

  // Save Attendance to DB
  const handleSaveAttendance = async () => {
    if (!selectedClass) return;
    const parts = selectedClass.split(' - ');
    const className = parts[0] || selectedClass;
    const section = parts[1] || 'A';

    setIsSaving(true);
    try {
      const payload = {
        className,
        section,
        date: selectedDate,
        records: roster.map(s => ({
          studentId: s.studentId,
          studentName: s.studentName,
          rollNo: s.rollNo,
          status: s.status,
          remarks: s.remarks || '',
        })),
        notes,
        markedByName: userInfo.name || 'School Administrator',
      };

      const res = await fetch(`${API_BASE}/attendance`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        setIsMarked(true);
        showToast(`✅ Attendance successfully saved to MongoDB for ${selectedClass}! (${summary.present}/${summary.total} present)`);
        
        // Refresh school stats
        const statsRes = await fetch(`${API_BASE}/attendance/stats?date=${selectedDate}`, { headers: getAuthHeaders() });
        if (statsRes.ok) setDailyStats(await statsRes.json());
      } else {
        const err = await res.json();
        showToast(err.message || 'Failed to save attendance', 'error');
      }
    } catch (err) {
      console.error('Error saving attendance:', err);
      showToast('Connection error while saving attendance', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Date controls
  const handleShiftDate = (days) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + days);
    setSelectedDate(getTodayString(d));
  };

  // Filtered roster for search
  const filteredRoster = useMemo(() => {
    return roster.filter(s => {
      const matchesSearch = !searchQuery || 
        s.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.rollNo && s.rollNo.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesFilter = filterStatus === 'All' || s.status === filterStatus;
      return matchesSearch && matchesFilter;
    });
  }, [roster, searchQuery, filterStatus]);

  const currentClassObj = classesList.find(c => `${c.className} - ${c.section}` === selectedClass);

  return (
    <div className="attendance-page" style={{ padding: '24px 32px', maxWidth: '1600px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '22px' }}>
      
      {/* Toast Notification */}
      {notification.show && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '24px',
          zIndex: 9999,
          background: notification.type === 'error' ? '#991b1b' : '#065f46',
          color: 'white',
          padding: '12px 20px',
          borderRadius: '12px',
          fontWeight: 700,
          boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          animation: 'fade-in 0.2s ease',
        }}>
          {notification.type === 'error' ? <AlertCircle size={20} /> : <CheckCircle2 size={20} />}
          <span>{notification.text}</span>
        </div>
      )}

      {/* HEADER BANNER */}
      <div style={{
        background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
        color: 'white',
        borderRadius: '20px',
        padding: '28px 32px',
        boxShadow: '0 10px 30px rgba(30, 58, 138, 0.25)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '20px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span style={{
              background: 'rgba(255, 255, 255, 0.2)',
              backdropFilter: 'blur(8px)',
              padding: '4px 12px',
              borderRadius: '20px',
              fontSize: '0.75rem',
              fontWeight: 800,
              letterSpacing: '0.04em',
              textTransform: 'uppercase'
            }}>
              LIVE MONGODB ATTENDANCE REGISTER
            </span>
            <span style={{ fontSize: '0.8rem', opacity: 0.9 }}>• Campus: {tenantSlug}</span>
          </div>
          <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
            Student Attendance Management & Roll Call
          </h1>
          <p style={{ margin: '6px 0 0', fontSize: '0.9rem', color: '#e0e7ff', opacity: 0.95 }}>
            Mark daily roll call, inspect school-wide presence rates, and store verified attendance records directly in the database.
          </p>
        </div>

        {/* Date Selector Quick Bar */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.15)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          borderRadius: '16px',
          padding: '10px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <button
            onClick={() => handleShiftDate(-1)}
            style={{ background: 'white', color: '#1e3a8a', border: 'none', borderRadius: '8px', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontWeight: 800 }}
            title="Previous Day"
          >
            <ChevronLeft size={18} />
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Calendar size={18} color="white" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              style={{
                background: 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '6px 12px',
                fontSize: '0.9rem',
                fontWeight: 700,
                color: '#1e3a8a',
                cursor: 'pointer'
              }}
            />
          </div>

          <button
            onClick={() => handleShiftDate(1)}
            style={{ background: 'white', color: '#1e3a8a', border: 'none', borderRadius: '8px', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontWeight: 800 }}
            title="Next Day"
          >
            <ChevronRight size={18} />
          </button>

          <button
            onClick={() => setSelectedDate(getTodayString())}
            style={{
              background: '#0F766E',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '6px 12px',
              fontSize: '0.8rem',
              fontWeight: 800,
              cursor: 'pointer'
            }}
          >
            Today
          </button>
        </div>
      </div>

      {/* KPI METRICS OVERVIEW */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '16px' }}>
        <div className="card" style={{ padding: '18px 22px', borderRadius: '16px', border: '1px solid #e2e8f0', background: 'white', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>Enrolled Students</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#eff6ff', color: '#1e3a8a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Users size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#1e3a8a' }}>{dailyStats.totalStudents}</div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>Across {dailyStats.totalClasses} Active Classes</div>
        </div>

        <div className="card" style={{ padding: '18px 22px', borderRadius: '16px', border: '1px solid #e2e8f0', background: 'white', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>Attendance Rate</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#dcfce7', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <TrendingUp size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: dailyStats.averageRate >= 85 ? '#16a34a' : '#d97706' }}>
            {dailyStats.averageRate}%
          </div>
          <div style={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: 600, marginTop: '4px' }}>Target: 95% Minimum</div>
        </div>

        <div className="card" style={{ padding: '18px 22px', borderRadius: '16px', border: '1px solid #e2e8f0', background: 'white', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>Present Today</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#ecfdf5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#059669' }}>{dailyStats.overallPresent}</div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>Recorded in campus</div>
        </div>

        <div className="card" style={{ padding: '18px 22px', borderRadius: '16px', border: '1px solid #e2e8f0', background: 'white', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>Absent Today</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#fef2f2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <XCircle size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#dc2626' }}>{dailyStats.overallAbsent}</div>
          <div style={{ fontSize: '0.75rem', color: '#dc2626', fontWeight: 600, marginTop: '4px' }}>Unexcused absences</div>
        </div>

        <div className="card" style={{ padding: '18px 22px', borderRadius: '16px', border: '1px solid #e2e8f0', background: 'white', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>Marked Classes</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#fef3c7', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Award size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#d97706' }}>
            {dailyStats.markedClasses} / {dailyStats.totalClasses}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>
            {dailyStats.pendingClasses} pending classes
          </div>
        </div>
      </div>

      {/* SYSTEM NAVIGATION TABS TEMPLATE */}
      <div style={{ display: 'flex', alignItems: 'center', margin: '2px 0 6px 0' }}>
        <div className="system-tabs-container">
          {[
            { id: 'mark', label: 'Mark Class Attendance', icon: ClipboardCheck, count: roster.length },
            { id: 'school-sheet', label: 'School-Wide Daily Sheet', icon: FileSpreadsheet, count: dailyStats.totalClasses },
            { id: 'analytics', label: 'Absence Alerts & Analytics', icon: BarChart3, count: dailyStats.overallAbsent }
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

      {/* TAB 1: MARK CLASS ATTENDANCE */}
      {activeTab === 'mark' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Class Selector & Roll Call Controls Header */}
          <div className="card" style={{ padding: '22px 26px', background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>
                  Select Grade & Section
                </label>
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  style={{
                    padding: '10px 16px',
                    borderRadius: '10px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '0.95rem',
                    fontWeight: 700,
                    color: '#1e3a8a',
                    background: '#f8fafc',
                    cursor: 'pointer',
                    minWidth: '220px'
                  }}
                >
                  {classesList.map(c => (
                    <option key={c._id} value={`${c.className} - ${c.section}`}>
                      {c.className} - Section {c.section} ({c.enrolledStudents || 0} students)
                    </option>
                  ))}
                </select>
              </div>

              {currentClassObj && (
                <div style={{ display: 'flex', gap: '16px', paddingLeft: '16px', borderLeft: '1px solid #e2e8f0' }}>
                  <div>
                    <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>Class Teacher</div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#334155', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <UserCheck size={14} color="#4F46E5" />
                      <span>{currentClassObj.classTeacherName || 'Unassigned'}</span>
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>Room</div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#334155', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <Building size={14} color="#64748b" />
                      <span>{currentClassObj.roomNumber || 'Room 101'}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Bulk Actions */}
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={() => handleBulkStatus('Present')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '9px 16px',
                  borderRadius: '10px',
                  border: 'none',
                  background: '#10b981',
                  color: 'white',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(16, 185, 129, 0.25)'
                }}
              >
                <Check size={16} /> Mark All Present
              </button>

              <button
                onClick={() => handleBulkStatus('Absent')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '9px 16px',
                  borderRadius: '10px',
                  border: '1px solid #fecaca',
                  background: '#fff1f2',
                  color: '#e11d48',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  cursor: 'pointer'
                }}
              >
                <XCircle size={16} /> Mark All Absent
              </button>

              <button
                onClick={handleSaveAttendance}
                disabled={isSaving}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 22px',
                  borderRadius: '10px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)',
                  color: 'white',
                  fontWeight: 800,
                  fontSize: '0.9rem',
                  cursor: isSaving ? 'not-allowed' : 'pointer',
                  boxShadow: '0 4px 14px rgba(37, 99, 235, 0.35)',
                  transition: 'transform 0.15s',
                }}
                onMouseOver={e => !isSaving && (e.currentTarget.style.transform = 'translateY(-1px)')}
                onMouseOut={e => (e.currentTarget.style.transform = 'translateY(0)')}
              >
                {isSaving ? <RefreshCw size={17} className="spin" /> : <Save size={17} />}
                <span>{isSaving ? 'Saving to Database...' : 'Save Attendance to DB'}</span>
              </button>
            </div>
          </div>

          {/* Roster Search & Filter Strip */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: '280px' }}>
              <div style={{ position: 'relative', width: '320px' }}>
                <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                <input
                  type="text"
                  placeholder="Search student by name or roll no..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '9px 12px 9px 36px',
                    borderRadius: '10px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.88rem',
                    background: 'white'
                  }}
                />
              </div>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                style={{
                  padding: '9px 14px',
                  borderRadius: '10px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.88rem',
                  fontWeight: 600,
                  color: '#334155',
                  background: 'white',
                  cursor: 'pointer'
                }}
              >
                <option value="All">All Statuses</option>
                <option value="Present">Present Only</option>
                <option value="Absent">Absent Only</option>
                <option value="Late">Late Only</option>
                <option value="Excused">Excused Only</option>
              </select>
            </div>

            {/* Attendance Status Pill */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>Status:</span>
              <span style={{
                padding: '4px 12px',
                borderRadius: '20px',
                fontSize: '0.8rem',
                fontWeight: 800,
                background: isMarked ? '#dcfce7' : '#fef3c7',
                color: isMarked ? '#166534' : '#b45309',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                {isMarked ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
                {isMarked ? `Marked on ${selectedDate}` : 'Not yet saved today'}
              </span>
              {markedByName && (
                <span style={{ fontSize: '0.78rem', color: '#64748b' }}>by {markedByName}</span>
              )}
            </div>
          </div>

          {/* STUDENT ROSTER TABLE */}
          <div className="card" style={{ padding: '0', background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 16px rgba(0,0,0,0.03)' }}>
            {isLoading ? (
              <div style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>
                <RefreshCw size={28} className="spin" style={{ margin: '0 auto 12px' }} />
                <div>Loading student roster and attendance from database...</div>
              </div>
            ) : filteredRoster.length === 0 ? (
              <div style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>
                <Users size={40} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
                <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#334155' }}>No students found</div>
                <div style={{ fontSize: '0.85rem', marginTop: '4px' }}>
                  {searchQuery ? 'No students match your search criteria.' : `No students currently enrolled in ${selectedClass}.`}
                </div>
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                    <th style={{ padding: '14px 20px', fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', width: '80px' }}>Roll No</th>
                    <th style={{ padding: '14px 20px', fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Student Name</th>
                    <th style={{ padding: '14px 20px', fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', width: '380px' }}>Attendance Status</th>
                    <th style={{ padding: '14px 20px', fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Remarks / Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRoster.map((student, idx) => {
                    const isPresent = student.status === 'Present';
                    const isAbsent = student.status === 'Absent';
                    const isLate = student.status === 'Late';
                    const isExcused = student.status === 'Excused';

                    return (
                      <tr key={student.studentId || idx} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.15s' }} onMouseOver={e => e.currentTarget.style.background = '#fbfcfe'} onMouseOut={e => e.currentTarget.style.background = 'white'}>
                        
                        {/* Roll Number */}
                        <td style={{ padding: '14px 20px' }}>
                          <span style={{ background: '#eff6ff', color: '#1e3a8a', padding: '4px 10px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 800 }}>
                            {student.rollNo || (idx + 1)}
                          </span>
                        </td>

                        {/* Student Name & Avatar */}
                        <td style={{ padding: '14px 20px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{
                              width: '38px',
                              height: '38px',
                              borderRadius: '50%',
                              background: '#e0e7ff',
                              color: '#3730a3',
                              fontWeight: 800,
                              fontSize: '0.9rem',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              textTransform: 'uppercase'
                            }}>
                              {student.studentName ? student.studentName.charAt(0) : 'S'}
                            </div>
                            <div>
                              <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#1e3a8a' }}>
                                {student.studentName}
                              </div>
                              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                                ID: {student.studentId?.slice(-6) || 'N/A'} • {student.gender || 'Student'}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Status Selectors */}
                        <td style={{ padding: '14px 20px' }}>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                              type="button"
                              onClick={() => handleStatusChange(student.studentId, 'Present')}
                              style={{
                                flex: 1,
                                padding: '8px 12px',
                                borderRadius: '8px',
                                border: isPresent ? '2px solid #059669' : '1px solid #e2e8f0',
                                background: isPresent ? '#ecfdf5' : '#f8fafc',
                                color: isPresent ? '#065f46' : '#64748b',
                                fontWeight: isPresent ? 800 : 600,
                                fontSize: '0.8rem',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '4px',
                                transition: 'all 0.15s'
                              }}
                            >
                              <CheckCircle2 size={14} color={isPresent ? '#059669' : '#94a3b8'} />
                              <span>Present</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleStatusChange(student.studentId, 'Absent')}
                              style={{
                                flex: 1,
                                padding: '8px 12px',
                                borderRadius: '8px',
                                border: isAbsent ? '2px solid #dc2626' : '1px solid #e2e8f0',
                                background: isAbsent ? '#fef2f2' : '#f8fafc',
                                color: isAbsent ? '#991b1b' : '#64748b',
                                fontWeight: isAbsent ? 800 : 600,
                                fontSize: '0.8rem',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '4px',
                                transition: 'all 0.15s'
                              }}
                            >
                              <XCircle size={14} color={isAbsent ? '#dc2626' : '#94a3b8'} />
                              <span>Absent</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleStatusChange(student.studentId, 'Late')}
                              style={{
                                flex: 1,
                                padding: '8px 12px',
                                borderRadius: '8px',
                                border: isLate ? '2px solid #d97706' : '1px solid #e2e8f0',
                                background: isLate ? '#fffbeb' : '#f8fafc',
                                color: isLate ? '#92400e' : '#64748b',
                                fontWeight: isLate ? 800 : 600,
                                fontSize: '0.8rem',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '4px',
                                transition: 'all 0.15s'
                              }}
                            >
                              <Clock size={14} color={isLate ? '#d97706' : '#94a3b8'} />
                              <span>Late</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleStatusChange(student.studentId, 'Excused')}
                              style={{
                                flex: 1,
                                padding: '8px 12px',
                                borderRadius: '8px',
                                border: isExcused ? '2px solid #0284c7' : '1px solid #e2e8f0',
                                background: isExcused ? '#f0f9ff' : '#f8fafc',
                                color: isExcused ? '#0369a1' : '#64748b',
                                fontWeight: isExcused ? 800 : 600,
                                fontSize: '0.8rem',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '4px',
                                transition: 'all 0.15s'
                              }}
                            >
                              <AlertCircle size={14} color={isExcused ? '#0284c7' : '#94a3b8'} />
                              <span>Excused</span>
                            </button>
                          </div>
                        </td>

                        {/* Remarks Input */}
                        <td style={{ padding: '14px 20px' }}>
                          <input
                            type="text"
                            placeholder="Add reason/note..."
                            value={student.remarks || ''}
                            onChange={(e) => handleRemarkChange(student.studentId, e.target.value)}
                            style={{
                              width: '100%',
                              padding: '7px 12px',
                              borderRadius: '8px',
                              border: '1px solid #cbd5e1',
                              fontSize: '0.82rem',
                              background: '#f8fafc'
                            }}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}

            {/* Bottom Summary & Save Footer */}
            <div style={{
              padding: '18px 24px',
              background: '#f8fafc',
              borderTop: '1px solid #e2e8f0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '16px'
            }}>
              <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                <span style={{ fontSize: '0.9rem', color: '#334155', fontWeight: 700 }}>
                  Class Summary:
                </span>
                <span style={{ fontSize: '0.85rem', color: '#16a34a', fontWeight: 800 }}>
                  ✔ {summary.present} Present
                </span>
                <span style={{ fontSize: '0.85rem', color: '#dc2626', fontWeight: 800 }}>
                  ✖ {summary.absent} Absent
                </span>
                <span style={{ fontSize: '0.85rem', color: '#d97706', fontWeight: 800 }}>
                  ⏱ {summary.late} Late
                </span>
                <span style={{ fontSize: '0.85rem', color: '#0284c7', fontWeight: 800 }}>
                  ℹ {summary.excused} Excused
                </span>
                <span style={{ background: '#e0e7ff', color: '#3730a3', padding: '3px 10px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 800 }}>
                  {summary.attendanceRate}% Attendance Rate
                </span>
              </div>

              <button
                onClick={handleSaveAttendance}
                disabled={isSaving}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '11px 26px',
                  borderRadius: '10px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)',
                  color: 'white',
                  fontWeight: 800,
                  fontSize: '0.95rem',
                  cursor: isSaving ? 'not-allowed' : 'pointer',
                  boxShadow: '0 4px 15px rgba(37, 99, 235, 0.4)',
                }}
              >
                {isSaving ? <RefreshCw size={18} className="spin" /> : <Save size={18} />}
                <span>{isSaving ? 'Saving...' : 'Save & Submit Attendance'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SCHOOL-WIDE DAILY SHEET */}
      {activeTab === 'school-sheet' && (
        <div className="card" style={{ padding: '24px', background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 16px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1e3a8a', margin: '0 0 4px 0' }}>
                Daily School-Wide Attendance Breakdown
              </h2>
              <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0 }}>
                Status of attendance recorded across all classes for {selectedDate}.
              </p>
            </div>
            <button
              onClick={() => window.print()}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '9px 16px',
                borderRadius: '10px',
                border: '1px solid #cbd5e1',
                background: 'white',
                color: '#334155',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: 'pointer'
              }}
            >
              <FileText size={16} /> Print Attendance Sheet
            </button>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ padding: '14px 18px', fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Class & Section</th>
                <th style={{ padding: '14px 18px', fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Class Teacher</th>
                <th style={{ padding: '14px 18px', fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Room</th>
                <th style={{ padding: '14px 18px', fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Status</th>
                <th style={{ padding: '14px 18px', fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Present / Total</th>
                <th style={{ padding: '14px 18px', fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Attendance Rate</th>
                <th style={{ padding: '14px 18px', fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {dailyStats.classBreakdown.map((cls, idx) => (
                <tr key={cls.id || idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '14px 18px', fontWeight: 800, color: '#1e3a8a' }}>
                    {cls.className} - Section {cls.section}
                  </td>
                  <td style={{ padding: '14px 18px', color: '#475569', fontSize: '0.9rem' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                      <UserCheck size={14} color="#4F46E5" />
                      {cls.classTeacher}
                    </span>
                  </td>
                  <td style={{ padding: '14px 18px', color: '#64748b', fontSize: '0.85rem' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                      <Building size={14} color="#64748b" />
                      {cls.room || 'TBD'}
                    </span>
                  </td>
                  <td style={{ padding: '14px 18px' }}>
                    <span style={{
                      padding: '4px 10px',
                      borderRadius: '12px',
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      background: cls.isMarked ? '#dcfce7' : '#fef3c7',
                      color: cls.isMarked ? '#15803d' : '#b45309',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      {cls.isMarked ? <CheckCircle2 size={13} /> : <AlertCircle size={13} />}
                      {cls.isMarked ? 'Marked' : 'Pending'}
                    </span>
                  </td>
                  <td style={{ padding: '14px 18px', fontWeight: 700, color: '#334155' }}>
                    {cls.isMarked ? `${cls.present} / ${cls.total}` : `- / ${cls.total}`}
                  </td>
                  <td style={{ padding: '14px 18px' }}>
                    {cls.isMarked && cls.rate !== null ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '60px', height: '6px', background: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{ width: `${cls.rate}%`, height: '100%', background: cls.rate >= 85 ? '#16a34a' : '#d97706' }} />
                        </div>
                        <span style={{ fontSize: '0.85rem', fontWeight: 800, color: cls.rate >= 85 ? '#16a34a' : '#d97706' }}>
                          {cls.rate}%
                        </span>
                      </div>
                    ) : (
                      <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Pending</span>
                    )}
                  </td>
                  <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                    <button
                      onClick={() => {
                        setSelectedClass(`${cls.className} - ${cls.section}`);
                        setActiveTab('mark');
                      }}
                      style={{
                        padding: '6px 14px',
                        borderRadius: '8px',
                        border: 'none',
                        background: '#eff6ff',
                        color: '#1e3a8a',
                        fontWeight: 700,
                        fontSize: '0.82rem',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <span>{cls.isMarked ? 'Review / Edit' : 'Mark Now'}</span>
                      <ArrowRight size={13} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 3: ANALYTICS & ABSENCE ALERTS */}
      {activeTab === 'analytics' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px' }}>
          
          {/* Absence Watchlist */}
          <div className="card" style={{ padding: '24px', background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#fef2f2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <AlertTriangle size={20} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#1e3a8a' }}>Absence Watchlist</h3>
                <p style={{ margin: 0, fontSize: '0.78rem', color: '#64748b' }}>Students requiring attendance intervention</p>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {roster.filter(s => s.status === 'Absent').length === 0 ? (
                <div style={{ padding: '30px', textAlign: 'center', color: '#16a34a', fontWeight: 700, fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <CheckCircle2 size={18} color="#16a34a" />
                  <span>No absent students in {selectedClass} on {selectedDate}!</span>
                </div>
              ) : (
                roster.filter(s => s.status === 'Absent').map((s, i) => (
                  <div key={i} style={{ padding: '12px 14px', borderRadius: '10px', background: '#fef2f2', border: '1px solid #fecaca', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#991b1b' }}>{s.studentName}</div>
                      <div style={{ fontSize: '0.75rem', color: '#b91c1c' }}>Roll No: {s.rollNo || (i + 1)} • {s.remarks || 'No reason provided'}</div>
                    </div>
                    <span style={{ background: '#dc2626', color: 'white', padding: '2px 8px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 800 }}>
                      ABSENT
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Attendance Standing Guidelines */}
          <div className="card" style={{ padding: '24px', background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <BookOpen size={20} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#1e3a8a' }}>Institutional Attendance Policy</h3>
                <p style={{ margin: 0, fontSize: '0.78rem', color: '#64748b' }}>Board & academic compliance standards</p>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.85rem', color: '#334155' }}>
              <div style={{ padding: '10px 14px', borderRadius: '8px', background: '#f8fafc', borderLeft: '4px solid #16a34a' }}>
                <strong>95% - 100% (Excellence):</strong> Eligible for academic awards, perfect attendance citations, and board examination roll eligibility.
              </div>
              <div style={{ padding: '10px 14px', borderRadius: '8px', background: '#f8fafc', borderLeft: '4px solid #f59e0b' }}>
                <strong>85% - 94% (Good Standing):</strong> Standard acceptable attendance requirement.
              </div>
              <div style={{ padding: '10px 14px', borderRadius: '8px', background: '#f8fafc', borderLeft: '4px solid #dc2626' }}>
                <strong>Below 75% (Critical Warning):</strong> Mandatory parental conference and board eligibility warning notice.
              </div>
            </div>
          </div>

        </div>
      )}

    </div>
  );
};

export default Attendance;
