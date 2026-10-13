import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { 
  Search, MoreVertical, CreditCard, ChevronLeft, ChevronRight, Download, X, 
  DollarSign, User, AlertCircle, FileText, CheckCircle, Briefcase, TrendingUp, 
  Plus, RefreshCw, Layers, ArrowUpRight, ArrowDownLeft, Calendar, Filter
} from 'lucide-react';

const API_BASE = 'http://localhost:5000/api';

const Finance = () => {
  // Authentication & Tenant Context
  const userInfo = JSON.parse(sessionStorage.getItem('userInfo') || '{}');
  const token = userInfo.token || sessionStorage.getItem('token') || '';
  const tenantSlug = sessionStorage.getItem('tenantSlug') || userInfo.slug || '';
  const userRole = (sessionStorage.getItem('userRole') || userInfo.role || 'admin').toLowerCase();
  const isAdmin = ['admin', 'superadmin', 'principal', 'accountant'].includes(userRole);

  // Data States
  const [transactions, setTransactions] = useState([]);
  const [totalTxns, setTotalTxns] = useState(0);
  const [pendingFeesList, setPendingFeesList] = useState([]);
  const [totalPendingFees, setTotalPendingFees] = useState(0);
  const [stats, setStats] = useState({
    totalCollections: 0,
    totalExpenses: 0,
    pendingFees: 0,
    availableBalance: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // UI States
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('ledger'); // 'ledger', 'pending', 'payroll'
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedTxn, setSelectedTxn] = useState(null);
  const itemsPerPage = 10;

  // Add Transaction Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const initialForm = {
    type: 'Fee Collection',
    category: 'Tuition Fee',
    amount: '',
    studentName: '',
    description: '',
    paymentMethod: 'UPI',
    status: 'Completed'
  };
  const [formData, setFormData] = useState(initialForm);
  const [formError, setFormError] = useState('');

  const getAuthHeaders = () => {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (tenantSlug) headers['x-tenant-slug'] = tenantSlug;
    return headers;
  };

  // Fetch Financial Transactions & Stats
  const fetchFinanceData = async () => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      const typeParam = activeTab === 'payroll' ? 'Expense' : '';
      const params = new URLSearchParams({
        page: currentPage,
        limit: itemsPerPage,
        ...(searchQuery.trim() ? { search: searchQuery.trim() } : {}),
        ...(typeParam ? { type: typeParam } : {})
      });

      const [txnsRes, statsRes, pendingRes] = await Promise.all([
        fetch(`${API_BASE}/finance/transactions?${params.toString()}`, { headers: getAuthHeaders() }),
        fetch(`${API_BASE}/finance/stats`, { headers: getAuthHeaders() }),
        fetch(`${API_BASE}/dashboard/pending-fees?limit=50`, { headers: getAuthHeaders() })
      ]);

      if (txnsRes.ok) {
        const txnsData = await txnsRes.json();
        setTransactions(txnsData.transactions || []);
        setTotalTxns(txnsData.total || 0);
      }

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }

      if (pendingRes.ok) {
        const pendingData = await pendingRes.json();
        setPendingFeesList(pendingData.fees || []);
        setTotalPendingFees(pendingData.total || 0);
      }
    } catch (err) {
      setErrorMsg('Failed to connect to financial ledgers: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFinanceData();
  }, [tenantSlug, activeTab, currentPage]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchFinanceData();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Submit New Transaction
  const handleAddTransaction = async (e) => {
    e.preventDefault();
    if (!formData.amount || Number(formData.amount) <= 0) {
      setFormError('Please enter a valid amount');
      return;
    }

    setActionLoading(true);
    setFormError('');

    try {
      const res = await fetch(`${API_BASE}/finance/transactions`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(formData)
      });

      const data = await res.json();
      if (res.ok) {
        setIsAddModalOpen(false);
        setFormData(initialForm);
        fetchFinanceData();
      } else {
        setFormError(data.message || 'Failed to record transaction');
      }
    } catch (err) {
      setFormError('Network error: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const formatCurrency = (val) => `₹${Number(val || 0).toLocaleString()}`;
  const totalPages = Math.ceil(totalTxns / itemsPerPage) || 1;

  // Transaction Receipt / Details Drawer
  const renderTransactionDrawer = () => {
    if (!selectedTxn) return null;
    const t = selectedTxn;

    return (
      <>
        <div 
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.45)', backdropFilter: 'blur(4px)', zIndex: 99990 }} 
          onClick={() => setSelectedTxn(null)} 
        />
        <div style={{
          position: 'fixed', top: 0, right: 0, bottom: 0, width: '480px', maxWidth: '92vw',
          backgroundColor: '#ffffff', zIndex: 99995, boxShadow: '-8px 0 25px rgba(0,0,0,0.15)',
          display: 'flex', flexDirection: 'column', animation: 'slide-left 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
        }}>
          <div style={{ padding: '24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#1e3a8a', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CreditCard size={20} color="#4F46E5" /> Transaction Voucher
            </h2>
            <button 
              onClick={() => setSelectedTxn(null)} 
              style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748b' }}
            >
              <X size={18} />
            </button>
          </div>

          <div style={{ padding: '24px', flex: 1, overflowY: 'auto' }}>
            {/* Amount Banner */}
            <div style={{
              padding: '24px', borderRadius: '18px', textAlign: 'center', marginBottom: '24px',
              background: t.type === 'Fee Collection' ? 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)' : 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
              border: t.type === 'Fee Collection' ? '1px solid #a7f3d0' : '1px solid #fecaca'
            }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: t.type === 'Fee Collection' ? '#047857' : '#b91c1c', textTransform: 'uppercase' }}>
                {t.type}
              </div>
              <div style={{ fontSize: '2.2rem', fontWeight: 800, color: t.type === 'Fee Collection' ? '#065f46' : '#991b1b', margin: '4px 0' }}>
                {t.type === 'Fee Collection' ? '+' : '-'}{formatCurrency(t.amount)}
              </div>
              <div style={{ fontSize: '0.85rem', color: '#475569' }}>
                Ref: <code>{t.refId}</code>
              </div>
            </div>

            {/* Details Fields */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ padding: '14px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Category</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#1e293b', marginTop: '2px' }}>{t.category}</div>
              </div>

              {t.studentName && (
                <div style={{ padding: '14px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Student / Payee</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#1e293b', marginTop: '2px' }}>{t.studentName}</div>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ padding: '14px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Payment Method</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#1e293b', marginTop: '2px' }}>{t.paymentMethod || 'Online'}</div>
                </div>
                <div style={{ padding: '14px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Status</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 700, color: t.status === 'Completed' ? '#16a34a' : '#d97706', marginTop: '2px' }}>
                    {t.status || 'Completed'}
                  </div>
                </div>
              </div>

              <div style={{ padding: '14px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Date Recorded</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#1e293b', marginTop: '2px' }}>
                  {t.date ? new Date(t.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
                </div>
              </div>

              {t.description && (
                <div style={{ padding: '14px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Description & Memo</div>
                  <div style={{ fontSize: '0.9rem', color: '#334155', marginTop: '2px', lineHeight: 1.4 }}>{t.description}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%', height: '100%' }}>
      {renderTransactionDrawer()}

      {/* Financial KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <div className="card" style={{ padding: '20px', borderRadius: '16px', background: 'white', border: '1px solid #e2e8f0', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Total Collections</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ArrowDownLeft size={16} color="#16a34a" />
            </div>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#1e3a8a', marginTop: '8px' }}>
            {formatCurrency(stats.totalCollections)}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: 600, marginTop: '4px' }}>
            ● Recorded fee receipts
          </div>
        </div>

        <div className="card" style={{ padding: '20px', borderRadius: '16px', background: 'white', border: '1px solid #e2e8f0', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Total Expenses</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ArrowUpRight size={16} color="#dc2626" />
            </div>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#991b1b', marginTop: '8px' }}>
            {formatCurrency(stats.totalExpenses)}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 500, marginTop: '4px' }}>
            Payroll, utilities & facilities
          </div>
        </div>

        <div className="card" style={{ padding: '20px', borderRadius: '16px', background: 'white', border: '1px solid #e2e8f0', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Pending / Overdue Fees</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <AlertCircle size={16} color="#d97706" />
            </div>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#d97706', marginTop: '8px' }}>
            {formatCurrency(stats.pendingFees)}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#d97706', fontWeight: 600, marginTop: '4px' }}>
            {totalPendingFees} student accounts pending
          </div>
        </div>

        <div className="card" style={{ padding: '20px', borderRadius: '16px', background: 'white', border: '1px solid #e2e8f0', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Net Operating Balance</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#e0e7ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CreditCard size={16} color="#4F46E5" />
            </div>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#4F46E5', marginTop: '8px' }}>
            {formatCurrency(stats.availableBalance)}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#4F46E5', fontWeight: 600, marginTop: '4px' }}>
            Live cash balance
          </div>
        </div>
      </div>

      {/* Main Ledger Table Card */}
      <div className="card" style={{
        flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0,
        background: 'white', borderRadius: '20px', border: '1px solid #e2e8f0',
        padding: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)'
      }}>
        {/* Table Top Controls & Tabs */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '14px' }}>
          {/* Tabs */}
          <div style={{ display: 'flex', gap: '8px', background: '#f1f5f9', padding: '4px', borderRadius: '10px' }}>
            {[
              { id: 'ledger', label: 'All Transactions' },
              { id: 'pending', label: 'Pending Dues' },
              { id: 'payroll', label: 'Expenses & Payroll' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); setCurrentPage(1); }}
                style={{
                  padding: '7px 16px', borderRadius: '8px', border: 'none',
                  fontSize: '0.84rem', fontWeight: 700, cursor: 'pointer',
                  background: activeTab === tab.id ? 'white' : 'transparent',
                  color: activeTab === tab.id ? '#1e3a8a' : '#64748b',
                  boxShadow: activeTab === tab.id ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
                  transition: 'all 0.15s'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Action Bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            {/* Search */}
            <div style={{ position: 'relative' }}>
              <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input 
                type="text" 
                placeholder="Search voucher or name..." 
                value={searchQuery}
                onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                style={{
                  padding: '9px 12px 9px 34px',
                  borderRadius: '10px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.85rem',
                  outline: 'none',
                  width: '210px'
                }}
              />
            </div>

            {/* Refresh */}
            <button
              onClick={fetchFinanceData}
              style={{
                background: '#f8fafc', border: '1px solid #cbd5e1', width: '38px', height: '38px',
                borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#475569', cursor: 'pointer'
              }}
              title="Refresh ledger"
            >
              <RefreshCw size={15} />
            </button>

            {/* Record Transaction Button */}
            {isAdmin && (
              <button
                onClick={() => { setFormError(''); setFormData(initialForm); setIsAddModalOpen(true); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  background: 'linear-gradient(135deg, #4F46E5 0%, #1e40af 100%)',
                  color: 'white', border: 'none', padding: '9px 18px',
                  borderRadius: '10px', fontSize: '0.86rem', fontWeight: 700,
                  cursor: 'pointer', boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)'
                }}
              >
                <Plus size={16} /> Record Transaction
              </button>
            )}
          </div>
        </div>

        {errorMsg && (
          <div style={{ padding: '12px 16px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '12px', color: '#b91c1c', fontSize: '0.85rem', marginBottom: '16px' }}>
            {errorMsg}
          </div>
        )}

        {/* Table View */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: '#64748b' }}>
              <RefreshCw size={28} className="animate-spin" style={{ margin: '0 auto 10px', color: '#4F46E5' }} />
              <p style={{ margin: 0, fontWeight: 600 }}>Loading ledger records...</p>
            </div>
          ) : activeTab === 'pending' ? (
            /* PENDING FEES TABLE VIEW */
            pendingFeesList.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 0', color: '#64748b', background: '#f8fafc', borderRadius: '16px' }}>
                <CheckCircle size={40} style={{ margin: '0 auto 10px', color: '#16a34a' }} />
                <h4 style={{ margin: '0 0 4px', color: '#1e3a8a', fontSize: '1.1rem', fontWeight: 700 }}>No Pending Fee Accounts</h4>
                <p style={{ margin: 0, fontSize: '0.85rem' }}>All active student dues have been reconciled.</p>
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1.5px solid #e2e8f0' }}>
                    <th style={{ padding: '12px 14px', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Student Name</th>
                    <th style={{ padding: '12px 14px', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Class & Section</th>
                    <th style={{ padding: '12px 14px', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Guardian Contact</th>
                    <th style={{ padding: '12px 14px', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Due Date</th>
                    <th style={{ padding: '12px 14px', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Status</th>
                    <th style={{ padding: '12px 14px', textAlign: 'right', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Amount Due</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingFeesList.map((f, i) => (
                    <tr key={f._id || i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '12px 14px', fontWeight: 700, color: '#1e293b' }}>{f.studentName}</td>
                      <td style={{ padding: '12px 14px', color: '#475569', fontSize: '0.84rem' }}>{f.classSection || 'General'}</td>
                      <td style={{ padding: '12px 14px', color: '#64748b', fontSize: '0.82rem' }}>{f.parentContact || '—'}</td>
                      <td style={{ padding: '12px 14px', color: '#64748b', fontSize: '0.82rem' }}>
                        {f.dueDate ? new Date(f.dueDate).toLocaleDateString() : '—'}
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <span style={{
                          padding: '3px 8px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 700,
                          background: f.status === 'Overdue' ? '#fee2e2' : '#fef3c7',
                          color: f.status === 'Overdue' ? '#b91c1c' : '#b45309'
                        }}>
                          ● {f.status}
                        </span>
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 800, color: '#b91c1c' }}>
                        {formatCurrency(f.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          ) : (
            /* GENERAL TRANSACTIONS LEDGER TABLE VIEW */
            transactions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 0', color: '#64748b', background: '#f8fafc', borderRadius: '16px' }}>
                <CreditCard size={40} style={{ margin: '0 auto 10px', color: '#cbd5e1' }} />
                <h4 style={{ margin: '0 0 4px', color: '#1e3a8a', fontSize: '1.1rem', fontWeight: 700 }}>No Transactions Recorded</h4>
                <p style={{ margin: 0, fontSize: '0.85rem' }}>Record the first transaction using the button above.</p>
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1.5px solid #e2e8f0' }}>
                    <th style={{ padding: '12px 14px', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Ref ID</th>
                    <th style={{ padding: '12px 14px', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Type</th>
                    <th style={{ padding: '12px 14px', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Category / Memo</th>
                    <th style={{ padding: '12px 14px', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Party / Student</th>
                    <th style={{ padding: '12px 14px', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Date</th>
                    <th style={{ padding: '12px 14px', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Status</th>
                    <th style={{ padding: '12px 14px', textAlign: 'right', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((t) => (
                    <tr 
                      key={t._id}
                      onClick={() => setSelectedTxn(t)}
                      style={{ borderBottom: '1px solid #f1f5f9', cursor: 'pointer', transition: 'background-color 0.15s' }}
                      onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(79, 70, 229, 0.03)'}
                      onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <td style={{ padding: '12px 14px' }}>
                        <code style={{ background: '#f8fafc', padding: '2px 6px', borderRadius: '5px', fontSize: '0.8rem', fontWeight: 700, color: '#334155' }}>
                          {t.refId}
                        </code>
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: '4px',
                          padding: '3px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700,
                          background: t.type === 'Fee Collection' ? '#dcfce7' : '#fee2e2',
                          color: t.type === 'Fee Collection' ? '#15803d' : '#b91c1c'
                        }}>
                          {t.type === 'Fee Collection' ? <ArrowDownLeft size={11} /> : <ArrowUpRight size={11} />}
                          {t.type}
                        </span>
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ fontWeight: 700, color: '#1e293b', fontSize: '0.86rem' }}>{t.category}</div>
                        {t.description && <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{t.description}</div>}
                      </td>
                      <td style={{ padding: '12px 14px', color: '#334155', fontSize: '0.84rem', fontWeight: 600 }}>
                        {t.studentName || '—'}
                      </td>
                      <td style={{ padding: '12px 14px', color: '#64748b', fontSize: '0.8rem' }}>
                        {t.date ? new Date(t.date).toLocaleDateString() : '—'}
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <span style={{
                          padding: '2px 7px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 700,
                          background: t.status === 'Completed' ? '#ecfdf5' : '#fffbeb',
                          color: t.status === 'Completed' ? '#047857' : '#b45309'
                        }}>
                          ● {t.status}
                        </span>
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 800, fontSize: '0.9rem', color: t.type === 'Fee Collection' ? '#16a34a' : '#b91c1c' }}>
                        {t.type === 'Fee Collection' ? '+' : '-'}{formatCurrency(t.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          )}
        </div>

        {/* Pagination */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #f1f5f9' }}>
          <div style={{ fontSize: '0.82rem', color: '#64748b' }}>
            Showing <strong>{activeTab === 'pending' ? pendingFeesList.length : transactions.length}</strong> entries
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button 
              disabled={currentPage === 1} 
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
              style={{ background: 'white', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '5px 10px', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', color: '#475569', opacity: currentPage === 1 ? 0.5 : 1 }}
            >
              <ChevronLeft size={16} />
            </button>
            <span style={{ fontSize: '0.84rem', fontWeight: 700, color: '#334155' }}>
              Page {currentPage} of {totalPages}
            </span>
            <button 
              disabled={currentPage >= totalPages} 
              onClick={() => setCurrentPage(p => p + 1)} 
              style={{ background: 'white', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '5px 10px', cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer', color: '#475569', opacity: currentPage >= totalPages ? 0.5 : 1 }}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Record Transaction Modal */}
      {isAddModalOpen && createPortal(
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(8px)',
          zIndex: 999999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
        }}>
          <div style={{
            background: 'white', borderRadius: '24px', width: '540px', maxWidth: '95vw',
            maxHeight: '92vh', overflowY: 'auto', padding: '32px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', border: '1px solid rgba(226, 232, 240, 0.8)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '44px', height: '44px', borderRadius: '14px',
                  background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.1) 0%, rgba(15, 118, 110, 0.1) 100%)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <CreditCard size={22} color="#4F46E5" />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1e3a8a', margin: 0 }}>
                    Record Financial Transaction
                  </h3>
                  <p style={{ margin: '2px 0 0', fontSize: '0.82rem', color: '#64748b' }}>
                    Post payment receipts or campus expenditures into database
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsAddModalOpen(false)}
                style={{ background: '#f1f5f9', border: 'none', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}
              >
                <X size={18} />
              </button>
            </div>

            {formError && (
              <div style={{ padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', color: '#b91c1c', fontSize: '0.84rem', marginBottom: '16px' }}>
                {formError}
              </div>
            )}

            <form onSubmit={handleAddTransaction}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                      Transaction Type *
                    </label>
                    <select
                      value={formData.type}
                      onChange={e => setFormData({ ...formData, type: e.target.value })}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem', outline: 'none', background: 'white', boxSizing: 'border-box' }}
                    >
                      <option value="Fee Collection">Fee Collection (Receipt)</option>
                      <option value="Expense">Campus Expense (Disbursement)</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                      Category *
                    </label>
                    <select
                      value={formData.category}
                      onChange={e => setFormData({ ...formData, category: e.target.value })}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem', outline: 'none', background: 'white', boxSizing: 'border-box' }}
                    >
                      <option value="Tuition Fee">Tuition Fee</option>
                      <option value="Transport">Transport Fee</option>
                      <option value="Faculty Payroll">Faculty Payroll</option>
                      <option value="Campus Maintenance">Campus Maintenance</option>
                      <option value="Library & Learning">Library & Learning</option>
                      <option value="Miscellaneous">Miscellaneous</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                      Amount (INR ₹) *
                    </label>
                    <input 
                      type="number"
                      required
                      min="1"
                      placeholder="e.g. 45000"
                      value={formData.amount}
                      onChange={e => setFormData({ ...formData, amount: e.target.value })}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem', outline: 'none', boxSizing: 'border-box' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                      Payment Method
                    </label>
                    <select
                      value={formData.paymentMethod}
                      onChange={e => setFormData({ ...formData, paymentMethod: e.target.value })}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem', outline: 'none', background: 'white', boxSizing: 'border-box' }}
                    >
                      <option value="UPI">UPI</option>
                      <option value="Bank Transfer">Bank Transfer</option>
                      <option value="Cash">Cash</option>
                      <option value="Cheque">Cheque</option>
                      <option value="Online">Online Gateway</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                    Student / Beneficiary Name
                  </label>
                  <input 
                    type="text"
                    placeholder="e.g. Aarav Sharma or Vendor Name"
                    value={formData.studentName}
                    onChange={e => setFormData({ ...formData, studentName: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                    Description / Note
                  </label>
                  <textarea 
                    rows={2}
                    placeholder="e.g. Term 1 Tuition Fee Installment"
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    style={{ padding: '9px 16px', background: 'white', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.86rem', fontWeight: 600, cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    style={{ padding: '9px 20px', background: '#4F46E5', color: 'white', border: 'none', borderRadius: '8px', fontSize: '0.86rem', fontWeight: 700, cursor: 'pointer' }}
                  >
                    {actionLoading ? 'Recording...' : 'Save to Ledger'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default Finance;
