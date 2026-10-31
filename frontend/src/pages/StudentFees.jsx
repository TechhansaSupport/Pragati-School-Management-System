import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  CreditCard, Calendar, Clock, CheckCircle2, ShieldCheck, Printer, 
  Receipt, X, RefreshCw, Sparkles, Building2, CalendarDays, CheckCircle,
  Search, ArrowLeft, Download, AlertCircle, FileText, ArrowUpDown
} from 'lucide-react';

const numberToWords = (num) => {
  if (!num) return 'Zero';
  const a = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  
  const inWords = (n) => {
    if (n < 20) return a[n];
    if (n < 100) return b[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + a[n % 10] : '');
    if (n < 1000) return a[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' and ' + inWords(n % 100) : '');
    if (n < 100000) return inWords(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 !== 0 ? ' ' + inWords(n % 1000) : '');
    if (n < 10000000) return inWords(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 !== 0 ? ' ' + inWords(n % 100000) : '');
    return n.toString();
  };
  return inWords(num);
};

const StudentFees = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const tenantSlug = sessionStorage.getItem('tenantSlug') || '';
  const userInfo = JSON.parse(sessionStorage.getItem('userInfo') || '{}');
  const token = userInfo.token || sessionStorage.getItem('token') || '';

  const [feeData, setFeeData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMonthFilter, setSelectedMonthFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState('recent'); // 'recent' (newest months at top) or 'chronological' (oldest first)
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  const fetchFeeHistory = async () => {
    setIsLoading(true);
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      if (tenantSlug) headers['x-tenant-slug'] = tenantSlug;

      const res = await fetch('http://localhost:5000/api/dashboard/student-fees', { headers });
      if (res.ok) {
        const data = await res.json();
        if (data && data.success) {
          setFeeData(data);
        }
      }
    } catch (err) {
      console.warn('Error fetching student fee data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFeeHistory();
  }, [tenantSlug]);

  const student = feeData?.student || {
    name: userInfo.name || 'Aarav Sharma',
    rollNo: 'STU-1001',
    grade: 'Class 10',
    section: 'A',
    parentName: 'Mr. Rajesh Sharma',
    parentContact: '+91 98201 12345'
  };

  const summary = feeData?.summary || {
    totalSubmitted: 47000,
    submittedMonthsCount: 7,
    totalMonthsCount: 12,
    totalUpcoming: 25500,
    academicSession: '2026-2027',
    currentMonthStatus: 'Paid & Cleared',
    latestReceiptNo: 'REC-2026-266422-1001',
    latestPaymentDate: '2026-10-27T10:51:06.483Z'
  };

  const monthsList = feeData?.months || [];

  const filteredMonths = monthsList.filter(m => {
    if (selectedMonthFilter === 'SUBMITTED' && m.status !== 'Submitted & Cleared') return false;
    if (selectedMonthFilter === 'UPCOMING' && m.status === 'Submitted & Cleared') return false;
    if (selectedMonthFilter !== 'ALL' && selectedMonthFilter !== 'SUBMITTED' && selectedMonthFilter !== 'UPCOMING') {
      if (m.monthKey !== selectedMonthFilter) return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchMonth = m.monthName.toLowerCase().includes(q);
      const matchTxn = m.transactions?.some(t => 
        (t.category && t.category.toLowerCase().includes(q)) ||
        (t.refId && t.refId.toLowerCase().includes(q)) ||
        (t.paymentMethod && t.paymentMethod.toLowerCase().includes(q))
      );
      return matchMonth || matchTxn;
    }
    return true;
  });

  // Sort with recent months at the top by default:
  // Submitted months (most recent to oldest: Oct down to Apr), followed by Upcoming months (Nov to Mar)
  const sortedMonths = [...filteredMonths].sort((a, b) => {
    if (sortOrder === 'recent') {
      const aIsSubmitted = a.status === 'Submitted & Cleared';
      const bIsSubmitted = b.status === 'Submitted & Cleared';
      if (aIsSubmitted && bIsSubmitted) {
        return (b.order || 0) - (a.order || 0); // Reverse chronological (most recent at top)
      }
      if (aIsSubmitted && !bIsSubmitted) return -1;
      if (!aIsSubmitted && bIsSubmitted) return 1;
      return (a.order || 0) - (b.order || 0); // Upcoming in calendar schedule (Nov to Mar)
    }
    // Chronological (April to March)
    return (a.order || 0) - (b.order || 0);
  });

  // Dropdown options also ordered with recent months at top
  const sortedDropdownMonths = [...monthsList].sort((a, b) => {
    if (sortOrder === 'recent') {
      const aIsSubmitted = a.status === 'Submitted & Cleared';
      const bIsSubmitted = b.status === 'Submitted & Cleared';
      if (aIsSubmitted && bIsSubmitted) {
        return (b.order || 0) - (a.order || 0);
      }
      if (aIsSubmitted && !bIsSubmitted) return -1;
      if (!aIsSubmitted && bIsSubmitted) return 1;
      return (a.order || 0) - (b.order || 0);
    }
    return (a.order || 0) - (b.order || 0);
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%', boxSizing: 'border-box' }}>
      
      {/* Top Banner - Hero Header */}
      <div style={{
        background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 50%, #0284c7 100%)',
        borderRadius: '20px',
        padding: '26px 32px',
        color: 'white',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px',
        boxShadow: '0 10px 25px -5px rgba(37, 99, 235, 0.35)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button
            type="button"
            onClick={() => navigate(`/${tenantSlug}/student-dashboard`)}
            style={{
              background: 'rgba(255, 255, 255, 0.18)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '12px',
              padding: '10px',
              color: 'white',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s'
            }}
            title="Back to Student Dashboard"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
              <span style={{
                background: 'rgba(255, 255, 255, 0.2)',
                color: 'white',
                padding: '3px 12px',
                borderRadius: '14px',
                fontSize: '0.74rem',
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                Student Portal • Fee Accounts
              </span>
              <span style={{
                background: '#dcfce7',
                color: '#15803d',
                padding: '3px 10px',
                borderRadius: '14px',
                fontSize: '0.74rem',
                fontWeight: 800
              }}>
                ✓ Cleared Up-to-Date
              </span>
            </div>
            <h1 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 900, letterSpacing: '-0.02em' }}>
              My Fees & Receipts
            </h1>
            <p style={{ margin: '4px 0 0', opacity: 0.9, fontSize: '0.92rem' }}>
              Official month-wise fee payment schedule, submitted receipts, and transaction history for Session 2026-2027.
            </p>
          </div>
        </div>

        <div style={{ textAlign: 'right', background: 'rgba(255, 255, 255, 0.12)', padding: '12px 18px', borderRadius: '14px', border: '1px solid rgba(255, 255, 255, 0.2)' }}>
          <div style={{ fontSize: '0.92rem', fontWeight: 700 }}>{student.name}</div>
          <div style={{ fontSize: '0.8rem', opacity: 0.9 }}>{student.grade} - Section {student.section}</div>
          <div style={{ fontSize: '1.15rem', fontWeight: 800, marginTop: '2px', color: '#fef08a' }}>
            ID: {student.rollNo}
          </div>
        </div>
      </div>

      {/* Summary KPI Tiles */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '16px'
      }}>
        <div style={{ background: 'white', padding: '20px 24px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 2px 10px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.76rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Total Submitted</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#dcfce7', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShieldCheck size={20} />
            </div>
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 900, color: '#0f172a' }}>
            ₹{summary.totalSubmitted.toLocaleString()}
          </div>
          <div style={{ fontSize: '0.78rem', color: '#15803d', fontWeight: 700 }}>
            Session 2026-2027 (Cleared)
          </div>
        </div>

        <div style={{ background: 'white', padding: '20px 24px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 2px 10px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.76rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Months Cleared</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CalendarDays size={20} />
            </div>
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 900, color: '#1e3a8a' }}>
            {summary.submittedMonthsCount} <span style={{ fontSize: '1.1rem', fontWeight: 600, color: '#64748b' }}>/ {summary.totalMonthsCount} Months</span>
          </div>
          <div style={{ fontSize: '0.78rem', color: '#2563eb', fontWeight: 700 }}>
            April through October Verified
          </div>
        </div>

        <div style={{ background: 'white', padding: '20px 24px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 2px 10px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.76rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Latest Counter Receipt</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#f5f3ff', color: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Receipt size={20} />
            </div>
          </div>
          <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#1e293b', fontFamily: 'monospace' }}>
            {summary.latestReceiptNo}
          </div>
          <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
            Paid: {summary.latestPaymentDate ? new Date(summary.latestPaymentDate).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) : 'Verified'}
          </div>
        </div>

        <div style={{ background: 'white', padding: '20px 24px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 2px 10px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.76rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Standing Status</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#fef3c7', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Sparkles size={20} />
            </div>
          </div>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: '#dcfce7',
            color: '#15803d',
            padding: '5px 12px',
            borderRadius: '20px',
            fontSize: '0.9rem',
            fontWeight: 800,
            width: 'fit-content'
          }}>
            <CheckCircle2 size={16} /> All Dues Paid
          </div>
          <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
            No overdue penalties or late fines
          </div>
        </div>
      </div>

      {/* Main Month-Wise Fee Records Card */}
      <div style={{
        background: 'white',
        borderRadius: '18px',
        padding: '24px 28px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px'
      }}>
        
        {/* Controls Toolbar: Month Filter, Search, Sync */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '14px',
          paddingBottom: '16px',
          borderBottom: '1px solid #f1f5f9'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#eff6ff', color: '#1d4ed8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Calendar size={22} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#1e3a8a' }}>
                Academic Session Monthly Submissions (2026-2027)
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: '0.82rem', color: '#64748b' }}>
                View itemized breakdowns, counter receipts, and payment modes month by month.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Search Input */}
            <div style={{ position: 'relative' }}>
              <Search size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input
                type="text"
                placeholder="Search receipt, month, category..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  padding: '8px 12px 8px 32px',
                  borderRadius: '10px',
                  border: '1.5px solid #cbd5e1',
                  fontSize: '0.84rem',
                  outline: 'none',
                  minWidth: '220px'
                }}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
                >
                  <X size={13} />
                </button>
              )}
            </div>

            {/* Month Filter */}
            <select
              aria-label="Filter Fees Month Wise"
              value={selectedMonthFilter}
              onChange={(e) => setSelectedMonthFilter(e.target.value)}
              style={{
                padding: '8px 14px',
                borderRadius: '10px',
                border: '1.5px solid #2563eb',
                fontSize: '0.84rem',
                fontWeight: 700,
                color: '#1e40af',
                background: 'white',
                cursor: 'pointer',
                outline: 'none',
                boxShadow: '0 2px 6px rgba(37, 99, 235, 0.1)'
              }}
            >
              <option value="ALL">🗓️ All Academic Months (12)</option>
              <option value="SUBMITTED">✅ Submitted & Cleared Months Only</option>
              <option value="UPCOMING">⏳ Upcoming Due Months Only</option>
              <optgroup label="Select Specific Month">
                {sortedDropdownMonths.map(m => (
                  <option key={m.monthKey} value={m.monthKey}>
                    {m.monthName} ({m.status === 'Submitted & Cleared' ? 'Paid' : 'Upcoming'})
                  </option>
                ))}
              </optgroup>
            </select>

            {/* Sort Toggle Button */}
            <button
              type="button"
              onClick={() => setSortOrder(prev => prev === 'recent' ? 'chronological' : 'recent')}
              style={{
                background: sortOrder === 'recent' ? '#eff6ff' : '#ffffff',
                border: sortOrder === 'recent' ? '1.5px solid #2563eb' : '1.5px solid #cbd5e1',
                color: sortOrder === 'recent' ? '#1d4ed8' : '#475569',
                borderRadius: '10px',
                padding: '8px 12px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.82rem',
                fontWeight: 700,
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
              }}
              title="Click to toggle month sorting order"
            >
              <ArrowUpDown size={14} />
              <span>{sortOrder === 'recent' ? 'Recent Months First' : 'Oldest First (Apr)'}</span>
            </button>

            <button
              onClick={fetchFeeHistory}
              disabled={isLoading}
              style={{
                background: '#f8fafc',
                border: '1px solid #cbd5e1',
                borderRadius: '10px',
                padding: '8px 14px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.82rem',
                fontWeight: 700,
                color: '#334155'
              }}
              title="Sync live fee transactions from database"
            >
              <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Monthly Breakdown Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {sortedMonths.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '50px 20px', color: '#64748b', background: '#f8fafc', borderRadius: '16px', border: '2px dashed #cbd5e1' }}>
              <AlertCircle size={32} color="#94a3b8" style={{ marginBottom: '8px' }} />
              <div style={{ fontWeight: 800, fontSize: '1rem', color: '#1e293b' }}>No fee records match your filter criteria</div>
              <p style={{ margin: '4px 0 0', fontSize: '0.85rem' }}>Try clearing the search input or switching the month filter.</p>
            </div>
          ) : (
            sortedMonths.map((month, idx) => {
              const isSubmitted = month.status === 'Submitted & Cleared';
              const showUpcomingDivider = idx > 0 && 
                sortedMonths[idx - 1].status === 'Submitted & Cleared' && 
                month.status !== 'Submitted & Cleared';

              return (
                <React.Fragment key={month.monthKey}>
                  {showUpcomingDivider && (
                    <div style={{
                      margin: '10px 0 2px',
                      padding: '12px 18px',
                      background: '#f8fafc',
                      borderRadius: '12px',
                      border: '1.5px dashed #cbd5e1',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '8px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Clock size={16} color="#2563eb" />
                        <span style={{ fontWeight: 800, fontSize: '0.86rem', color: '#1e3a8a' }}>
                          Upcoming Academic Term Invoices (Session 2026-2027 Scheduled Terms)
                        </span>
                      </div>
                      <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#1d4ed8', background: '#eff6ff', padding: '3px 10px', borderRadius: '12px' }}>
                        Payment links activate 5 days prior to due dates
                      </span>
                    </div>
                  )}

                  <div
                    style={{
                      borderRadius: '16px',
                      border: isSubmitted ? '1.5px solid #e2e8f0' : '1.5px dashed #cbd5e1',
                      background: isSubmitted ? 'white' : '#f8fafc',
                      boxShadow: isSubmitted ? '0 3px 12px rgba(0,0,0,0.02)' : 'none',
                      overflow: 'hidden'
                    }}
                  >
                  {/* Month Card Header Banner */}
                  <div style={{
                    padding: '16px 22px',
                    background: isSubmitted ? 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)' : '#f1f5f9',
                    borderBottom: '1px solid #e2e8f0',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '12px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        width: '38px', height: '38px', borderRadius: '10px',
                        background: isSubmitted ? '#dcfce7' : '#dbeafe',
                        color: isSubmitted ? '#15803d' : '#1d4ed8',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}>
                        <Calendar size={18} />
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <h4 style={{ margin: 0, fontSize: '1.08rem', fontWeight: 800, color: '#0f172a' }}>
                            {month.monthName}
                          </h4>
                          {month.isCurrent && (
                            <span style={{ fontSize: '0.68rem', fontWeight: 800, background: '#e0e7ff', color: '#4338ca', padding: '2px 8px', borderRadius: '6px', textTransform: 'uppercase' }}>
                              Current Month
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '2px' }}>
                          {isSubmitted ? (
                            <>Submitted on: <strong>{new Date(month.submittedDate).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</strong> • Via <strong>{month.paymentMethod}</strong></>
                          ) : (
                            <>Scheduled Due Date: <strong>{new Date(month.dueDate).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</strong></>
                          )}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
                      <span style={{
                        fontSize: '0.78rem',
                        fontWeight: 800,
                        padding: '5px 12px',
                        borderRadius: '20px',
                        background: isSubmitted ? '#dcfce7' : '#e0f2fe',
                        color: isSubmitted ? '#15803d' : '#0369a1',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px'
                      }}>
                        {isSubmitted ? <CheckCircle2 size={14} /> : <Clock size={14} />}
                        {month.status}
                      </span>

                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
                          {isSubmitted ? 'Total Paid' : 'Amount Due'}
                        </div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 900, color: isSubmitted ? '#0f172a' : '#1e40af' }}>
                          ₹{month.totalAmount.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Itemized Table of Particulars */}
                  <div style={{ padding: '16px 22px' }}>
                    {month.transactions && month.transactions.length > 0 ? (
                      <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
                          <thead>
                            <tr style={{ borderBottom: '1.5px solid #e2e8f0', color: '#64748b', textAlign: 'left', fontSize: '0.74rem', textTransform: 'uppercase' }}>
                              <th style={{ padding: '8px 10px', fontWeight: 700 }}>Fee Particulars / Category</th>
                              <th style={{ padding: '8px 10px', fontWeight: 700 }}>Receipt #</th>
                              <th style={{ padding: '8px 10px', fontWeight: 700 }}>Payment Mode</th>
                              <th style={{ padding: '8px 10px', fontWeight: 700 }}>Status</th>
                              <th style={{ padding: '8px 10px', fontWeight: 700, textAlign: 'right' }}>Amount Paid</th>
                              <th style={{ padding: '8px 10px', fontWeight: 700, textAlign: 'center' }}>Official Receipt</th>
                            </tr>
                          </thead>
                          <tbody>
                            {month.transactions.map((t, idx) => (
                              <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                <td style={{ padding: '12px 10px', fontWeight: 700, color: '#1e293b' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#2563eb' }}></div>
                                    <span>{t.category || t.description}</span>
                                  </div>
                                </td>
                                <td style={{ padding: '12px 10px', color: '#475569', fontFamily: 'monospace', fontWeight: 600 }}>
                                  {t.refId || t.receiptNo}
                                </td>
                                <td style={{ padding: '12px 10px', color: '#334155' }}>
                                  <span style={{ background: '#f1f5f9', padding: '3px 8px', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 600 }}>
                                    {t.paymentMethod || 'Online'}
                                  </span>
                                </td>
                                <td style={{ padding: '12px 10px' }}>
                                  <span style={{ background: '#dcfce7', color: '#166534', padding: '3px 8px', borderRadius: '6px', fontSize: '0.76rem', fontWeight: 700 }}>
                                    ✓ Cleared
                                  </span>
                                </td>
                                <td style={{ padding: '12px 10px', fontWeight: 800, color: '#0f172a', textAlign: 'right' }}>
                                  ₹{t.amount?.toLocaleString()}
                                </td>
                                <td style={{ padding: '12px 10px', textAlign: 'center' }}>
                                  <button
                                    type="button"
                                    onClick={() => setSelectedReceipt({
                                      ...t,
                                      monthName: month.monthName,
                                      submittedDate: month.submittedDate,
                                      studentName: student.name,
                                      rollNo: student.rollNo,
                                      grade: student.grade,
                                      section: student.section,
                                      parentName: student.parentName
                                    })}
                                    style={{
                                      padding: '6px 14px',
                                      background: 'white',
                                      border: '1.5px solid #2563eb',
                                      borderRadius: '8px',
                                      color: '#1d4ed8',
                                      fontSize: '0.78rem',
                                      fontWeight: 700,
                                      cursor: 'pointer',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '5px',
                                      boxShadow: '0 1px 3px rgba(37, 99, 235, 0.1)'
                                    }}
                                  >
                                    <Printer size={13} />
                                    <span>View Receipt</span>
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', padding: '8px 0' }}>
                        <div style={{ fontSize: '0.82rem', color: '#64748b' }}>
                          Upcoming tuition fee invoice for <strong>{month.monthName}</strong>. Online fee payment link opens 5 days prior to due date.
                        </div>
                        <span style={{ fontSize: '0.78rem', color: '#2563eb', fontWeight: 700, background: '#eff6ff', padding: '4px 10px', borderRadius: '6px' }}>
                          Due Date: {new Date(month.dueDate).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </React.Fragment>
            );
          })
          )}
        </div>

      </div>

      {/* OFFICIAL FEE RECEIPT MODAL */}
      {selectedReceipt && createPortal(
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 99999, padding: '20px'
        }}>
          <div style={{
            background: 'white', borderRadius: '20px', width: '100%', maxWidth: '620px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.3)', overflow: 'hidden',
            border: '1px solid #cbd5e1', maxHeight: '90vh', display: 'flex', flexDirection: 'column'
          }}>
            
            {/* Modal Actions Header */}
            <div className="no-print" style={{
              padding: '12px 20px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', fontWeight: 700, color: '#1e3a8a' }}>
                <Receipt size={16} color="#2563eb" />
                <span>Official School Fee Receipt</span>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => window.print()}
                  style={{
                    background: '#2563eb', color: 'white', border: 'none',
                    borderRadius: '8px', padding: '6px 14px', fontSize: '0.78rem',
                    fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px'
                  }}
                >
                  <Printer size={14} /> Print Receipt
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedReceipt(null)}
                  style={{
                    background: 'white', border: '1px solid #cbd5e1',
                    borderRadius: '8px', padding: '6px 10px', fontSize: '0.78rem',
                    cursor: 'pointer', color: '#64748b'
                  }}
                >
                  <X size={15} />
                </button>
              </div>
            </div>

            {/* Receipt Printable Canvas */}
            <div style={{ padding: '28px 32px', overflowY: 'auto', flex: 1, background: '#ffffff', color: '#0f172a' }}>
              
              {/* Receipt Header */}
              <div style={{ textAlign: 'center', borderBottom: '2px dashed #cbd5e1', paddingBottom: '18px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '4px' }}>
                  <Building2 size={24} color="#1e40af" />
                  <h2 style={{ margin: 0, fontSize: '1.45rem', fontWeight: 900, color: '#1e3a8a', letterSpacing: '-0.02em', textTransform: 'uppercase' }}>
                    Neel Public School
                  </h2>
                </div>
                <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>
                  Main Campus • Affiliated to CBSE • Institutional Code: NPS-CBSE-4021
                </div>
                <div style={{
                  display: 'inline-block',
                  marginTop: '10px',
                  background: '#dbeafe',
                  color: '#1e40af',
                  fontWeight: 900,
                  fontSize: '0.78rem',
                  padding: '3px 14px',
                  borderRadius: '20px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  Fee Collection Receipt & Payment Acknowledgment
                </div>
              </div>

              {/* Receipt Meta Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '0.82rem', marginBottom: '20px', background: '#f8fafc', padding: '14px 18px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <div>
                  <div style={{ color: '#64748b', fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 700 }}>Student Full Name</div>
                  <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.95rem' }}>{selectedReceipt.studentName}</div>
                </div>
                <div>
                  <div style={{ color: '#64748b', fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 700 }}>Student ID (Roll No)</div>
                  <div style={{ fontWeight: 800, color: '#1e40af', fontSize: '0.95rem' }}>{selectedReceipt.rollNo}</div>
                </div>
                <div>
                  <div style={{ color: '#64748b', fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 700 }}>Class & Section</div>
                  <div style={{ fontWeight: 700, color: '#334155' }}>{selectedReceipt.grade} - Section {selectedReceipt.section}</div>
                </div>
                <div>
                  <div style={{ color: '#64748b', fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 700 }}>Receipt / Ref Number</div>
                  <div style={{ fontWeight: 800, color: '#0f172a', fontFamily: 'monospace' }}>{selectedReceipt.refId || selectedReceipt.receiptNo}</div>
                </div>
                <div>
                  <div style={{ color: '#64748b', fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 700 }}>Month / Academic Term</div>
                  <div style={{ fontWeight: 700, color: '#0f172a' }}>{selectedReceipt.monthName} • Session 2026-2027</div>
                </div>
                <div>
                  <div style={{ color: '#64748b', fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 700 }}>Date of Payment</div>
                  <div style={{ fontWeight: 700, color: '#0f172a' }}>
                    {selectedReceipt.date ? new Date(selectedReceipt.date).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) : 'Verified'}
                  </div>
                </div>
              </div>

              {/* Itemized Fee Breakdown Table */}
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem', marginBottom: '20px' }}>
                <thead>
                  <tr style={{ background: '#f1f5f9', borderTop: '1px solid #cbd5e1', borderBottom: '1px solid #cbd5e1', textTransform: 'uppercase', fontSize: '0.72rem', color: '#475569' }}>
                    <th style={{ padding: '8px 12px', textAlign: 'left' }}>S.No</th>
                    <th style={{ padding: '8px 12px', textAlign: 'left' }}>Particulars / Description</th>
                    <th style={{ padding: '8px 12px', textAlign: 'left' }}>Category</th>
                    <th style={{ padding: '8px 12px', textAlign: 'right' }}>Amount (INR)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '10px 12px', fontWeight: 700, color: '#64748b' }}>1</td>
                    <td style={{ padding: '10px 12px', fontWeight: 700, color: '#0f172a' }}>
                      {selectedReceipt.description || `${selectedReceipt.monthName} Monthly Instructional Fee`}
                    </td>
                    <td style={{ padding: '10px 12px', color: '#475569' }}>{selectedReceipt.category || 'Tuition Fee'}</td>
                    <td style={{ padding: '10px 12px', fontWeight: 800, textAlign: 'right', color: '#0f172a' }}>
                      ₹{selectedReceipt.amount?.toLocaleString()}
                    </td>
                  </tr>
                  <tr style={{ borderTop: '2px solid #cbd5e1', background: '#f8fafc' }}>
                    <td colSpan="3" style={{ padding: '10px 12px', fontWeight: 800, textAlign: 'right', color: '#1e3a8a' }}>
                      NET TOTAL PAID:
                    </td>
                    <td style={{ padding: '10px 12px', fontWeight: 900, textAlign: 'right', color: '#059669', fontSize: '1.05rem' }}>
                      ₹{selectedReceipt.amount?.toLocaleString()}
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Amount in Words */}
              <div style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: '8px', border: '1px dashed #cbd5e1', fontSize: '0.8rem', color: '#334155', marginBottom: '20px' }}>
                <strong>Amount in Words:</strong> Indian Rupees {numberToWords(selectedReceipt.amount)} Only.
              </div>

              {/* Verification & Stamp Area */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', paddingTop: '16px', borderTop: '1px solid #e2e8f0' }}>
                <div style={{
                  border: '2px solid #059669',
                  borderRadius: '10px',
                  padding: '6px 14px',
                  color: '#059669',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontWeight: 900,
                  fontSize: '0.78rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  <CheckCircle size={16} />
                  <span>PAID & VERIFIED ELECTRONICALLY</span>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ width: '130px', borderBottom: '1px solid #0f172a', marginBottom: '4px', marginLeft: 'auto' }}></div>
                  <div style={{ fontSize: '0.74rem', fontWeight: 700, color: '#334155' }}>Accounts Department</div>
                  <div style={{ fontSize: '0.68rem', color: '#64748b' }}>Neel Public School</div>
                </div>
              </div>

              <div style={{ fontSize: '0.68rem', color: '#94a3b8', textAlign: 'center', marginTop: '18px' }}>
                Computer generated receipt • No physical signature required • Pragati School ERP
              </div>
            </div>

          </div>
        </div>,
        document.body
      )}

    </div>
  );
};

export default StudentFees;

