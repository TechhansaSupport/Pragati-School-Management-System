import React, { useState, useEffect } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import {
  Search, Plus, Download, DollarSign, Star, TrendingUp, Activity,
  BookOpen, CreditCard, Users, CheckCircle2, FileText, Calendar, Filter, X
} from 'lucide-react';

const API_BASE = 'http://localhost:5000/api';

const ReportsView = () => {
  const tenantSlug = sessionStorage.getItem('tenantSlug') || '';
  const userInfo = JSON.parse(sessionStorage.getItem('userInfo') || '{}');
  const token = userInfo.token || sessionStorage.getItem('token') || '';

  // Filter States
  const [timeFilter, setTimeFilter] = useState('This Month');
  const [searchQuery, setSearchQuery] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);

  // Live Data States
  const [summaryData, setSummaryData] = useState({
    totalStudents: 241,
    totalStaff: 28,
    totalClasses: 12,
    totalRevenue: 485000,
    totalPending: 72000,
    avgAttendance: 94.2,
    winRate: 94.2,
    avgDealSize: 18500,
    totalActivities: 1248,
    serviceRevenue: [
      { name: 'Tuition Fees', value: 281300, color: '#8b5cf6' },
      { name: 'Transport Fleet', value: 87300, color: '#3b82f6' },
      { name: 'Laboratory & Practical', value: 48500, color: '#06b6d4' },
      { name: 'Examination & Certs', value: 38800, color: '#f59e0b' },
      { name: 'Sports & Activities', value: 29100, color: '#10b981' }
    ],
    pipelineBreakdown: [
      { name: 'Lead', value: 241, color: '#a855f7' },
      { name: 'Qualified', value: 45, color: '#3b82f6' },
      { name: 'Opportunity', value: 18, color: '#f97316' },
      { name: 'Enrolled / Closed', value: 88, color: '#10b981' }
    ],
    monthlyTrends: [
      { month: 'Jun', Tuition: 180000, Transport: 55000, Labs: 32000, Total: 267000 },
      { month: 'Jul', Tuition: 215000, Transport: 68000, Labs: 38000, Total: 321000 },
      { month: 'Aug', Tuition: 240000, Transport: 74000, Labs: 42000, Total: 356000 },
      { month: 'Sep', Tuition: 195000, Transport: 62000, Labs: 35000, Total: 292000 },
      { month: 'Oct', Tuition: 265000, Transport: 80000, Labs: 45000, Total: 390000 },
      { month: 'Nov', Tuition: 285000, Transport: 88000, Labs: 49000, Total: 422000 }
    ]
  });

  const getHeaders = () => {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (tenantSlug) {
      headers['x-tenant-slug'] = tenantSlug;
      headers['x-school-slug'] = tenantSlug;
    }
    return headers;
  };

  useEffect(() => {
    fetch(`${API_BASE}/reports/summary`, { headers: getHeaders() })
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data) {
          setSummaryData(prev => ({
            ...prev,
            ...data,
            pipelineBreakdown: data.pipelineBreakdown || prev.pipelineBreakdown,
            monthlyTrends: data.monthlyTrends || prev.monthlyTrends,
            serviceRevenue: data.serviceRevenue || prev.serviceRevenue
          }));
        }
      })
      .catch(err => console.warn('Reports summary fetch error:', err));
  }, [tenantSlug]);

  const handleExportCsv = async (reportType = 'academic') => {
    setIsExporting(true);
    setExportSuccess(false);
    try {
      const res = await fetch(`${API_BASE}/reports/export?type=${reportType}`, {
        headers: getHeaders()
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const dateTag = new Date().toISOString().split('T')[0];
        a.download = `${tenantSlug || 'school'}_${reportType}_report_${dateTag}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        setExportSuccess(true);
        setTimeout(() => setExportSuccess(false), 3500);
      }
    } catch (err) {
      console.error('Download error:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const currentDateFormatted = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const filteredPipeline = summaryData.pipelineBreakdown.filter(item =>
    !searchQuery || item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', minHeight: '100%', paddingBottom: '32px' }}>

      {/* ─── 1. HEADER SECTION (MATCHING SCREENSHOT) ─── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '22px' }}>
        <div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: '#0f172a', margin: '0 0 4px 0', letterSpacing: '-0.02em' }}>
            Reports
          </h1>
          <div style={{ fontSize: '0.86rem', color: '#64748b', fontWeight: 500 }}>
            {currentDateFormatted}
          </div>
        </div>

        {/* Right Controls: Search bar + Quick Add */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', width: '220px' }}>
            <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 12px 9px 34px',
                borderRadius: '20px',
                border: '1px solid #e2e8f0',
                background: 'white',
                fontSize: '0.84rem',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <button
            type="button"
            onClick={() => setIsCustomModalOpen(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '9px 20px',
              borderRadius: '20px',
              border: 'none',
              background: '#10b981',
              color: 'white',
              fontWeight: 700,
              fontSize: '0.84rem',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(16, 185, 129, 0.25)',
              transition: 'all 0.15s ease'
            }}
          >
            <Plus size={16} strokeWidth={2.5} /> Quick Add
          </button>
        </div>
      </div>

      {/* ─── 2. FILTER & ACTION ROW (MATCHING SCREENSHOT) ─── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px', marginBottom: '22px' }}>
        {/* Time Period Filter Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {['This Month', 'This Quarter', 'This Year', 'Custom'].map((period) => {
            const isActive = timeFilter === period;
            return (
              <button
                key={period}
                type="button"
                onClick={() => setTimeFilter(period)}
                style={{
                  padding: '8px 22px',
                  borderRadius: '20px',
                  border: isActive ? 'none' : '1px solid #e2e8f0',
                  background: isActive ? '#0f172a' : 'white',
                  color: isActive ? 'white' : '#475569',
                  fontWeight: 700,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  boxShadow: isActive ? '0 2px 8px rgba(15, 23, 42, 0.2)' : 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                {period}
              </button>
            );
          })}
        </div>

        {/* Export Report Pill Button */}
        <button
          type="button"
          onClick={() => handleExportCsv('finance')}
          disabled={isExporting}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '9px 20px',
            borderRadius: '20px',
            border: 'none',
            background: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
            color: 'white',
            fontWeight: 700,
            fontSize: '0.84rem',
            cursor: isExporting ? 'not-allowed' : 'pointer',
            boxShadow: '0 4px 12px rgba(6, 182, 212, 0.3)',
            transition: 'all 0.15s ease'
          }}
        >
          <Download size={16} />
          <span>{isExporting ? 'Exporting...' : 'Export Report'}</span>
        </button>
      </div>

      {/* ─── 3. 4-KPI SUMMARY CARDS ROW (MATCHING SCREENSHOT) ─── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>

        {/* Card 1: Total Revenue */}
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '18px 20px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
          display: 'flex',
          alignItems: 'center',
          gap: '14px'
        }}>
          <div style={{
            width: '46px',
            height: '46px',
            borderRadius: '12px',
            background: '#ecfeff',
            color: '#06b6d4',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <DollarSign size={22} strokeWidth={2.5} />
          </div>
          <div>
            <div style={{ fontSize: '0.76rem', fontWeight: 700, color: '#64748b' }}>
              Total Revenue
            </div>
            <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0f172a', margin: '2px 0' }}>
              ₹{(summaryData?.totalRevenue || 0).toLocaleString()}
            </div>
            <div style={{ fontSize: '0.74rem', fontWeight: 600, color: '#06b6d4' }}>
              {timeFilter}
            </div>
          </div>
        </div>

        {/* Card 2: Win Rate */}
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '18px 20px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
          display: 'flex',
          alignItems: 'center',
          gap: '14px'
        }}>
          <div style={{
            width: '46px',
            height: '46px',
            borderRadius: '12px',
            background: '#fff7ed',
            color: '#f97316',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <Star size={22} strokeWidth={2.2} />
          </div>
          <div>
            <div style={{ fontSize: '0.76rem', fontWeight: 700, color: '#64748b' }}>
              Win Rate
            </div>
            <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0f172a', margin: '2px 0' }}>
              {(summaryData?.winRate || 0).toFixed(1)}%
            </div>
            <div style={{ fontSize: '0.74rem', fontWeight: 500, color: '#64748b' }}>
              Across {summaryData?.totalStudents || 241} deals
            </div>
          </div>
        </div>

        {/* Card 3: Avg. Deal Size */}
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '18px 20px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
          display: 'flex',
          alignItems: 'center',
          gap: '14px'
        }}>
          <div style={{
            width: '46px',
            height: '46px',
            borderRadius: '12px',
            background: '#f5f3ff',
            color: '#8b5cf6',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <TrendingUp size={22} strokeWidth={2.2} />
          </div>
          <div>
            <div style={{ fontSize: '0.76rem', fontWeight: 700, color: '#64748b' }}>
              Avg. Deal Size
            </div>
            <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0f172a', margin: '2px 0' }}>
              ₹{(summaryData?.avgDealSize || 0).toLocaleString()}
            </div>
            <div style={{ fontSize: '0.74rem', fontWeight: 500, color: '#64748b' }}>
              Per closed account
            </div>
          </div>
        </div>

        {/* Card 4: Total Activities */}
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '18px 20px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
          display: 'flex',
          alignItems: 'center',
          gap: '14px'
        }}>
          <div style={{
            width: '46px',
            height: '46px',
            borderRadius: '12px',
            background: '#ecfdf5',
            color: '#10b981',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <Activity size={22} strokeWidth={2.2} />
          </div>
          <div>
            <div style={{ fontSize: '0.76rem', fontWeight: 700, color: '#64748b' }}>
              Total Activities
            </div>
            <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0f172a', margin: '2px 0' }}>
              {(summaryData?.totalActivities || 0).toLocaleString()}
            </div>
            <div style={{ fontSize: '0.74rem', fontWeight: 500, color: '#10b981' }}>
              Logged interactions
            </div>
          </div>
        </div>

      </div>

      {/* ─── 4. MAIN ANALYTICS GRID (LEFT: REVENUE BY SERVICE + RIGHT: PIPELINE BREAKDOWN) ─── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.8fr) minmax(300px, 1fr)', gap: '20px', marginBottom: '24px' }}>

        {/* Left: Revenue by Service */}
        <div style={{
          background: 'white',
          borderRadius: '18px',
          padding: '24px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
            <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>
              Revenue by Service
            </h3>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#8b5cf6', background: '#f5f3ff', padding: '3px 10px', borderRadius: '10px' }}>
              FY 2026-2027 Active
            </span>
          </div>

          <div style={{ width: '100%', height: '280px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={summaryData.monthlyTrends} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.45} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorTuition" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={{ stroke: '#e2e8f0' }} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(val) => `₹${(val / 1000)}k`} />
                <Tooltip
                  formatter={(val) => [`₹${Number(val).toLocaleString()}`, '']}
                  contentStyle={{ borderRadius: '10px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                />
                <Area type="monotone" dataKey="Total" stroke="#8b5cf6" strokeWidth={2.5} fillOpacity={1} fill="url(#colorTotal)" name="Total Revenue" />
                <Area type="monotone" dataKey="Tuition" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorTuition)" name="Tuition Fees" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right: Pipeline Breakdown (Donut Chart exactly matching screenshot) */}
        <div style={{
          background: 'white',
          borderRadius: '18px',
          padding: '24px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>
            Pipeline Breakdown
          </h3>

          <div style={{ width: '100%', height: '200px', position: 'relative' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={filteredPipeline}
                  innerRadius={58}
                  outerRadius={84}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {filteredPipeline.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(val) => [val, 'Volume']} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Legend with colored circular dots & counts */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '14px', borderTop: '1px solid #f8fafc', paddingTop: '12px' }}>
            {filteredPipeline.map((item, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.84rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: item.color, display: 'inline-block' }} />
                  <span style={{ color: '#475569', fontWeight: 600 }}>{item.name}</span>
                </div>
                <span style={{ fontWeight: 800, color: '#0f172a' }}>{item.value}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* ─── 5. INSTITUTIONAL DATASETS & ONE-CLICK EXPORTS ─── */}
      <div style={{
        background: 'white',
        borderRadius: '18px',
        padding: '24px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 2px 10px rgba(0,0,0,0.02)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <h3 style={{ margin: '0 0 4px 0', fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>
              Institutional Data Export Sets
            </h3>
            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
              Download official institutional CSV data files directly verified from MongoDB database
            </span>
          </div>
          {exportSuccess && (
            <div style={{ padding: '6px 14px', background: '#dcfce7', color: '#16a34a', borderRadius: '10px', fontSize: '0.82rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CheckCircle2 size={16} /> Dataset exported and downloaded successfully!
            </div>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px' }}>
          {[
            { id: 'academic', title: 'Academic Performance & Rosters', icon: BookOpen, color: '#4F46E5', desc: 'Class-wise student directory, grades, GPA standing' },
            { id: 'attendance', title: 'Attendance Summary & Risk Analysis', icon: Activity, color: '#16A34A', desc: 'Registry records, absenteeism, risk thresholds' },
            { id: 'finance', title: 'Fee Collection & Defaulters Ledger', icon: CreditCard, color: '#f59e0b', desc: 'Collections, pending balances, parent contacts' },
            { id: 'demographics', title: 'Faculty & Staff Workload', icon: Users, color: '#8b5cf6', desc: 'Teacher assignments, department rosters' }
          ].map(ds => (
            <div
              key={ds.id}
              style={{
                padding: '16px',
                borderRadius: '14px',
                border: '1px solid #e2e8f0',
                background: '#f8fafc',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '12px'
              }}
            >
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: `${ds.color}15`, color: ds.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <ds.icon size={20} />
                </div>
                <div>
                  <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.88rem' }}>{ds.title}</div>
                  <div style={{ fontSize: '0.76rem', color: '#64748b', marginTop: '2px' }}>{ds.desc}</div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleExportCsv(ds.id)}
                style={{
                  width: '100%',
                  padding: '8px 14px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  background: 'white',
                  color: '#1e293b',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <Download size={14} /> Download CSV
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Add / Custom Report Modal */}
      {isCustomModalOpen && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) setIsCustomModalOpen(false); }}
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999999, padding: '20px' }}
        >
          <div style={{ background: 'white', borderRadius: '24px', padding: '28px', width: '480px', maxWidth: '95vw', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', border: '1px solid rgba(226, 232, 240, 0.8)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', paddingBottom: '14px', borderBottom: '1px solid #f1f5f9' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}>
                  <Plus size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>Quick Export Custom Report</h3>
                  <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Configure parameters for live dataset export</span>
                </div>
              </div>
              <button onClick={() => setIsCustomModalOpen(false)} style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748b' }}><X size={16} /></button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>Report Category</label>
                <select id="modal-report-type" defaultValue="academic" style={{ width: '100%', padding: '11px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', outline: 'none', boxSizing: 'border-box' }}>
                  <option value="academic">Academic & Grade Registers</option>
                  <option value="attendance">Student Attendance Risk Register</option>
                  <option value="finance">Finance Ledger & Fee Dues</option>
                  <option value="demographics">Faculty & Staff Workload</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>Academic Cohort</label>
                <select defaultValue="All Classes" style={{ width: '100%', padding: '11px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', outline: 'none', boxSizing: 'border-box' }}>
                  <option value="All Classes">All Campus Classes</option>
                  <option value="Primary (1-5)">Primary (Classes 1 - 5)</option>
                  <option value="Secondary (6-10)">Secondary (Classes 6 - 10)</option>
                  <option value="Senior (11-12)">Senior Secondary (Classes 11 - 12)</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setIsCustomModalOpen(false)} style={{ padding: '10px 18px', background: '#f1f5f9', border: 'none', borderRadius: '10px', fontWeight: 600, cursor: 'pointer', color: '#475569' }}>Cancel</button>
                <button
                  type="button"
                  onClick={() => {
                    const sel = document.getElementById('modal-report-type');
                    handleExportCsv(sel ? sel.value : 'academic');
                    setIsCustomModalOpen(false);
                  }}
                  style={{ padding: '10px 22px', background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 12px rgba(16,185,129,0.3)' }}
                >
                  Generate & Download CSV
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ReportsView;
