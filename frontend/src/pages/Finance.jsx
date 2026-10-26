import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useSearchParams } from 'react-router-dom';
import { 
  Search, MoreVertical, CreditCard, ChevronLeft, ChevronRight, Download, X, 
  DollarSign, User, AlertCircle, FileText, CheckCircle, Briefcase, TrendingUp, 
  Plus, RefreshCw, Layers, ArrowUpRight, ArrowDownLeft, Calendar, Filter,
  Users, Check, Wallet, Send, Receipt, Clock
} from 'lucide-react';

const API_BASE = 'http://localhost:5000/api';

const Finance = () => {
  // Authentication & Tenant Context
  const userInfo = JSON.parse(sessionStorage.getItem('userInfo') || '{}');
  const token = userInfo.token || sessionStorage.getItem('token') || '';
  const tenantSlug = sessionStorage.getItem('tenantSlug') || userInfo.slug || '';
  const userRole = (sessionStorage.getItem('userRole') || userInfo.role || 'admin').toLowerCase();
  const isPrincipal = userRole === 'principal';
  const isAdmin = ['admin', 'superadmin', 'accountant', 'accounts'].includes(userRole);

  // Tabs & URL synchronization
  const [searchParams, setSearchParams] = useSearchParams();
  const urlTab = searchParams.get('tab');
  const validTabs = ['ledger', 'collections', 'pending', 'expenses', 'salaries'];
  const [activeTab, setActiveTab] = useState(validTabs.includes(urlTab) ? urlTab : 'ledger');

  useEffect(() => {
    if (urlTab && validTabs.includes(urlTab) && urlTab !== activeTab) {
      setActiveTab(urlTab);
    }
  }, [urlTab]);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setSearchParams({ tab: tabId });
    setCurrentPage(1);
  };

  // Data States
  const [transactions, setTransactions] = useState([]);
  const [totalTxns, setTotalTxns] = useState(0);
  const [pendingFeesList, setPendingFeesList] = useState([]);
  const [totalPendingFees, setTotalPendingFees] = useState(0);
  const [salariesData, setSalariesData] = useState({
    currentMonth: '',
    totalPayroll: 0,
    disbursedTotal: 0,
    dueTotal: 0,
    paidCount: 0,
    dueCount: 0,
    staff: []
  });
  const [stats, setStats] = useState({
    totalCollections: 0,
    totalExpenses: 0,
    pendingFees: 0,
    dueSalaries: 0,
    totalStaffPayroll: 0,
    availableBalance: 0
  });

  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // UI States
  const [searchQuery, setSearchQuery] = useState('');
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

  // Salary Disbursement Modal State
  const [disburseModalStaff, setDisburseModalStaff] = useState(null);
  const [disburseAmount, setDisburseAmount] = useState('');
  const [disbursePaymentMethod, setDisbursePaymentMethod] = useState('Bank Transfer');
  const [disburseMonth, setDisburseMonth] = useState('');
  const [disburseNotes, setDisburseNotes] = useState('');
  const [disburseError, setDisburseError] = useState('');

  // Collect Due Fee Modal State
  const [collectFeeTarget, setCollectFeeTarget] = useState(null);
  const [collectFeeAmount, setCollectFeeAmount] = useState('');
  const [collectFeeMethod, setCollectFeeMethod] = useState('UPI');
  const [collectFeeNotes, setCollectFeeNotes] = useState('');
  const [collectFeeError, setCollectFeeError] = useState('');

  const getAuthHeaders = () => {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (tenantSlug) headers['x-tenant-slug'] = tenantSlug;
    return headers;
  };

  // Fetch Financial Transactions, Stats, Pending Fees, & Salaries
  const fetchFinanceData = async () => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      let typeParam = '';
      if (activeTab === 'collections') typeParam = 'Fee Collection';
      if (activeTab === 'expenses') typeParam = 'Expense';

      const params = new URLSearchParams({
        page: currentPage,
        limit: itemsPerPage,
        ...(searchQuery.trim() ? { search: searchQuery.trim() } : {}),
        ...(typeParam ? { type: typeParam } : {})
      });

      const [txnsRes, statsRes, pendingRes, salariesRes] = await Promise.all([
        fetch(`${API_BASE}/finance/transactions?${params.toString()}`, { headers: getAuthHeaders() }),
        fetch(`${API_BASE}/finance/stats`, { headers: getAuthHeaders() }),
        fetch(`${API_BASE}/dashboard/pending-fees?limit=100`, { headers: getAuthHeaders() }),
        fetch(`${API_BASE}/finance/salaries`, { headers: getAuthHeaders() })
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
        const rawFees = pendingData.fees || [];
        const filteredPending = rawFees.filter(f => f.status !== 'Collected');
        setPendingFeesList(filteredPending);
        setTotalPendingFees(filteredPending.length);
      }

      if (salariesRes.ok) {
        const salObj = await salariesRes.json();
        setSalariesData(salObj);
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
        setSuccessMsg(`Transaction recorded successfully (${formData.refId || 'Ref generated'})`);
        setTimeout(() => setSuccessMsg(''), 5000);
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

  // Submit Salary Disbursement
  const handleDisburseSalary = async (e) => {
    e.preventDefault();
    if (!disburseModalStaff) return;
    if (!disburseAmount || Number(disburseAmount) <= 0) {
      setDisburseError('Please enter a valid salary amount');
      return;
    }

    setActionLoading(true);
    setDisburseError('');

    try {
      const res = await fetch(`${API_BASE}/finance/disburse-salary`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          staffId: disburseModalStaff._id,
          amount: Number(disburseAmount),
          paymentMethod: disbursePaymentMethod,
          month: disburseMonth || salariesData.currentMonth,
          notes: disburseNotes
        })
      });

      const data = await res.json();
      if (res.ok) {
        setDisburseModalStaff(null);
        setSuccessMsg(data.message || `Salary successfully disbursed to ${disburseModalStaff.name}`);
        setTimeout(() => setSuccessMsg(''), 5000);
        fetchFinanceData();
      } else {
        setDisburseError(data.message || 'Failed to disburse salary');
      }
    } catch (err) {
      setDisburseError('Network error: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Submit Fee Collection
  const handleCollectFee = async (e) => {
    e.preventDefault();
    if (!collectFeeTarget) return;
    if (!collectFeeAmount || Number(collectFeeAmount) <= 0) {
      setCollectFeeError('Please enter a valid collection amount');
      return;
    }

    setActionLoading(true);
    setCollectFeeError('');

    try {
      const res = await fetch(`${API_BASE}/finance/collect-due-fee`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          feeId: collectFeeTarget._id,
          studentName: collectFeeTarget.studentName,
          classSection: collectFeeTarget.classSection,
          amount: Number(collectFeeAmount),
          paymentMethod: collectFeeMethod,
          notes: collectFeeNotes
        })
      });

      const data = await res.json();
      if (res.ok) {
        setCollectFeeTarget(null);
        setSuccessMsg(data.message || `Fee collected successfully for ${collectFeeTarget.studentName}`);
        setTimeout(() => setSuccessMsg(''), 5000);
        fetchFinanceData();
      } else {
        setCollectFeeError(data.message || 'Failed to collect due fee');
      }
    } catch (err) {
      setCollectFeeError('Network error: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const formatCurrency = (val) => `₹${Number(val || 0).toLocaleString()}`;
  const totalPages = Math.ceil(totalTxns / itemsPerPage) || 1;

  // Filtered staff list for search in salaries tab
  const filteredStaffList = useMemo(() => {
    if (!salariesData.staff) return [];
    if (!searchQuery.trim()) return salariesData.staff;
    const q = searchQuery.toLowerCase().trim();
    return salariesData.staff.filter(s => 
      s.name.toLowerCase().includes(q) ||
      (s.employeeId && s.employeeId.toLowerCase().includes(q)) ||
      (s.role && s.role.toLowerCase().includes(q)) ||
      (s.department && s.department.toLowerCase().includes(q))
    );
  }, [salariesData.staff, searchQuery]);

  // Filtered pending fees for search
  const filteredPendingFees = useMemo(() => {
    if (!pendingFeesList) return [];
    if (!searchQuery.trim()) return pendingFeesList;
    const q = searchQuery.toLowerCase().trim();
    return pendingFeesList.filter(f => 
      f.studentName.toLowerCase().includes(q) ||
      (f.classSection && f.classSection.toLowerCase().includes(q)) ||
      (f.parentContact && f.parentContact.includes(q))
    );
  }, [pendingFeesList, searchQuery]);

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
                  <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Student / Payee / Faculty</div>
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

  if (isPrincipal) {
    return (
      <div style={{ padding: '40px 20px', maxWidth: '650px', margin: '40px auto', textAlign: 'center' }}>
        <div style={{
          background: 'white',
          borderRadius: '20px',
          padding: '36px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.05)',
          border: '1px solid #e2e8f0'
        }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: 'rgba(79, 70, 229, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px'
          }}>
            <CreditCard size={32} color="#4F46E5" />
          </div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#1e3a8a', marginBottom: '10px' }}>
            Academic Scope Governance
          </h2>
          <p style={{ fontSize: '0.92rem', color: '#64748b', lineHeight: 1.6, marginBottom: '24px' }}>
            As <strong>Campus Principal</strong>, you have dedicated executive access to all <strong>Academic Duties</strong> (Curriculum, Examinations, Report Cards, Timetables, Student Growth Profiles, and Teacher Workload). Financial and fee operations are managed by Accounts Personnel and School Administrators.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <button
              onClick={() => window.location.href = `/${tenantSlug}/dashboard`}
              style={{
                padding: '10px 20px',
                background: '#4F46E5',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: 'pointer'
              }}
            >
              Go to Academic Command Hub
            </button>
            <button
              onClick={() => window.location.href = `/${tenantSlug}/academics`}
              style={{
                padding: '10px 20px',
                background: '#f8fafc',
                color: '#334155',
                border: '1px solid #cbd5e1',
                borderRadius: '10px',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: 'pointer'
              }}
            >
              View Academics & Exams
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%', height: '100%' }}>
      {renderTransactionDrawer()}

      {/* Financial KPI Cards — Collections, Expenses, Due Fees, Due Salaries, Balance */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
        {/* Total Collections */}
        <div className="card" style={{ padding: '18px 20px', borderRadius: '16px', background: 'white', border: '1px solid #e2e8f0', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.76rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Total Collections</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ArrowDownLeft size={16} color="#16a34a" />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#1e3a8a', marginTop: '6px' }}>
            {formatCurrency(stats.totalCollections)}
          </div>
          <div style={{ fontSize: '0.74rem', color: '#16a34a', fontWeight: 600, marginTop: '4px' }}>
            ● Recorded fee receipts
          </div>
        </div>

        {/* Total Expenses */}
        <div className="card" style={{ padding: '18px 20px', borderRadius: '16px', background: 'white', border: '1px solid #e2e8f0', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.76rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Total Expenses</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ArrowUpRight size={16} color="#dc2626" />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#991b1b', marginTop: '6px' }}>
            {formatCurrency(stats.totalExpenses)}
          </div>
          <div style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: 500, marginTop: '4px' }}>
            Payroll, utilities & facilities
          </div>
        </div>

        {/* Pending / Overdue Fees */}
        <div className="card" style={{ padding: '18px 20px', borderRadius: '16px', background: 'white', border: '1px solid #e2e8f0', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.76rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Due / Overdue Fees</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <AlertCircle size={16} color="#d97706" />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#d97706', marginTop: '6px' }}>
            {formatCurrency(stats.pendingFees)}
          </div>
          <div style={{ fontSize: '0.74rem', color: '#d97706', fontWeight: 600, marginTop: '4px' }}>
            {totalPendingFees} student accounts pending
          </div>
        </div>

        {/* Due Salaries */}
        <div className="card" style={{ padding: '18px 20px', borderRadius: '16px', background: 'white', border: '1px solid #e2e8f0', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.76rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Due Salaries</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#ede9fe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Users size={16} color="#7c3aed" />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#7c3aed', marginTop: '6px' }}>
            {formatCurrency(stats.dueSalaries !== undefined ? stats.dueSalaries : (salariesData.dueTotal || 0))}
          </div>
          <div style={{ fontSize: '0.74rem', color: '#7c3aed', fontWeight: 600, marginTop: '4px' }}>
            {salariesData.dueCount || 0} staff awaiting disbursement
          </div>
        </div>

        {/* Net Operating Balance */}
        <div className="card" style={{ padding: '18px 20px', borderRadius: '16px', background: 'white', border: '1px solid #e2e8f0', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.76rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Net Operating Balance</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#e0e7ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CreditCard size={16} color="#4F46E5" />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#4F46E5', marginTop: '6px' }}>
            {formatCurrency(stats.availableBalance)}
          </div>
          <div style={{ fontSize: '0.74rem', color: '#4F46E5', fontWeight: 600, marginTop: '4px' }}>
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
          <div style={{ display: 'flex', gap: '6px', background: '#f1f5f9', padding: '4px', borderRadius: '10px', flexWrap: 'wrap' }}>
            {[
              { id: 'ledger', label: 'All Transactions', icon: Layers },
              { id: 'collections', label: 'Fees Collection', icon: CreditCard },
              { id: 'pending', label: 'Due / Overdue Fees', icon: AlertCircle },
              { id: 'expenses', label: 'School Expenses', icon: TrendingUp },
              { id: 'salaries', label: 'Due Salaries & Payroll', icon: Users }
            ].map(tab => {
              const TabIcon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '6px',
                    padding: '7px 14px', borderRadius: '8px', border: 'none',
                    fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer',
                    background: activeTab === tab.id ? 'white' : 'transparent',
                    color: activeTab === tab.id ? '#1e3a8a' : '#64748b',
                    boxShadow: activeTab === tab.id ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
                    transition: 'all 0.15s'
                  }}
                >
                  <TabIcon size={14} color={activeTab === tab.id ? '#4F46E5' : '#94a3b8'} />
                  {tab.label}
                  {tab.id === 'pending' && totalPendingFees > 0 && (
                    <span style={{ fontSize: '0.68rem', background: '#fef3c7', color: '#b45309', padding: '1px 6px', borderRadius: '8px', fontWeight: 800 }}>
                      {totalPendingFees}
                    </span>
                  )}
                  {tab.id === 'salaries' && (salariesData.dueCount || 0) > 0 && (
                    <span style={{ fontSize: '0.68rem', background: '#ede9fe', color: '#6d28d9', padding: '1px 6px', borderRadius: '8px', fontWeight: 800 }}>
                      {salariesData.dueCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Action Bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            {/* Search */}
            <div style={{ position: 'relative' }}>
              <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input 
                type="text" 
                placeholder={
                  activeTab === 'salaries' ? "Search staff name, ID, role..." :
                  activeTab === 'pending' ? "Search student, class..." :
                  "Search voucher, name, category..."
                }
                value={searchQuery}
                onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                style={{
                  padding: '9px 12px 9px 34px',
                  borderRadius: '10px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.84rem',
                  outline: 'none',
                  width: '230px'
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

            {/* Contextual Action Button */}
            {isAdmin && (
              <button
                onClick={() => {
                  setFormError('');
                  const initialType = activeTab === 'expenses' ? 'Expense' : 'Fee Collection';
                  const initialCat = activeTab === 'expenses' ? 'Campus Maintenance' : 'Tuition Fee';
                  setFormData({ ...initialForm, type: initialType, category: initialCat });
                  setIsAddModalOpen(true);
                }}
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  background: 'linear-gradient(135deg, #4F46E5 0%, #1e40af 100%)',
                  color: 'white', border: 'none', padding: '9px 18px',
                  borderRadius: '10px', fontSize: '0.84rem', fontWeight: 700,
                  cursor: 'pointer', boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)'
                }}
              >
                <Plus size={16} />
                {activeTab === 'collections' ? 'Record Fee Receipt' :
                 activeTab === 'expenses' ? 'Record School Expense' :
                 'Record Transaction'}
              </button>
            )}
          </div>
        </div>

        {/* Global Notifications */}
        {errorMsg && (
          <div style={{ padding: '12px 16px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '12px', color: '#b91c1c', fontSize: '0.85rem', marginBottom: '16px' }}>
            {errorMsg}
          </div>
        )}
        {successMsg && (
          <div style={{ padding: '12px 16px', background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '12px', color: '#047857', fontSize: '0.85rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle size={16} /> {successMsg}
          </div>
        )}

        {/* Table View */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: '#64748b' }}>
              <RefreshCw size={28} className="animate-spin" style={{ margin: '0 auto 10px', color: '#4F46E5' }} />
              <p style={{ margin: 0, fontWeight: 600 }}>Loading financial records...</p>
            </div>
          ) : activeTab === 'salaries' ? (
            /* ================= DUE SALARIES & STAFF PAYROLL VIEW ================= */
            <div>
              {/* Payroll Month Summary Bar */}
              <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px',
                padding: '14px 18px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0',
                marginBottom: '18px'
              }}>
                <div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Payroll Cycle</div>
                  <div style={{ fontSize: '0.98rem', fontWeight: 800, color: '#1e3a8a', marginTop: '2px' }}>
                    📅 {salariesData.currentMonth || 'Current Month'}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Total Staff Commitment</div>
                  <div style={{ fontSize: '0.98rem', fontWeight: 800, color: '#1e293b', marginTop: '2px' }}>
                    {formatCurrency(salariesData.totalPayroll)}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.72rem', color: '#059669', fontWeight: 600, textTransform: 'uppercase' }}>Disbursed So Far</div>
                  <div style={{ fontSize: '0.98rem', fontWeight: 800, color: '#16a34a', marginTop: '2px' }}>
                    {formatCurrency(salariesData.disbursedTotal)} <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#64748b' }}>({salariesData.paidCount} staff)</span>
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.72rem', color: '#b45309', fontWeight: 600, textTransform: 'uppercase' }}>Due Salaries Pending</div>
                  <div style={{ fontSize: '0.98rem', fontWeight: 800, color: '#d97706', marginTop: '2px' }}>
                    {formatCurrency(salariesData.dueTotal)} <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#64748b' }}>({salariesData.dueCount} staff)</span>
                  </div>
                </div>
              </div>

              {filteredStaffList.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '50px 0', color: '#64748b', background: '#f8fafc', borderRadius: '16px' }}>
                  <Users size={38} style={{ margin: '0 auto 10px', color: '#94a3b8' }} />
                  <h4 style={{ margin: '0 0 4px', color: '#1e3a8a', fontSize: '1.05rem', fontWeight: 700 }}>No Staff Records Found</h4>
                  <p style={{ margin: 0, fontSize: '0.84rem' }}>No active faculty or employees matched the current filters.</p>
                </div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1.5px solid #e2e8f0' }}>
                      <th style={{ padding: '12px 14px', fontSize: '0.74rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Staff Member</th>
                      <th style={{ padding: '12px 14px', fontSize: '0.74rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Role / Designation</th>
                      <th style={{ padding: '12px 14px', fontSize: '0.74rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Department</th>
                      <th style={{ padding: '12px 14px', fontSize: '0.74rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Monthly Salary</th>
                      <th style={{ padding: '12px 14px', fontSize: '0.74rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Status ({salariesData.currentMonth})</th>
                      <th style={{ padding: '12px 14px', fontSize: '0.74rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Disbursement Details</th>
                      <th style={{ padding: '12px 14px', textAlign: 'right', fontSize: '0.74rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStaffList.map((staff) => (
                      <tr key={staff._id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background-color 0.15s' }}>
                        <td style={{ padding: '12px 14px' }}>
                          <div style={{ fontWeight: 700, color: '#1e293b', fontSize: '0.88rem' }}>{staff.name}</div>
                          <div style={{ fontSize: '0.74rem', color: '#64748b' }}>ID: <code>{staff.employeeId || '—'}</code></div>
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <span style={{
                            padding: '3px 8px', borderRadius: '6px', fontSize: '0.74rem', fontWeight: 700,
                            background: '#e0e7ff', color: '#3730a3'
                          }}>
                            {staff.role}
                          </span>
                        </td>
                        <td style={{ padding: '12px 14px', color: '#475569', fontSize: '0.84rem' }}>
                          {staff.department || 'General'}
                        </td>
                        <td style={{ padding: '12px 14px', fontWeight: 800, color: '#1e293b', fontSize: '0.9rem' }}>
                          {formatCurrency(staff.salary)}
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <span style={{
                            padding: '3px 9px', borderRadius: '6px', fontSize: '0.74rem', fontWeight: 700,
                            display: 'inline-flex', alignItems: 'center', gap: '4px',
                            background: staff.status === 'Paid' ? '#dcfce7' : '#fef3c7',
                            color: staff.status === 'Paid' ? '#15803d' : '#b45309'
                          }}>
                            {staff.status === 'Paid' ? <Check size={12} /> : <Clock size={12} />}
                            {staff.status === 'Paid' ? 'Paid' : 'Due this month'}
                          </span>
                        </td>
                        <td style={{ padding: '12px 14px', fontSize: '0.8rem', color: '#64748b' }}>
                          {staff.status === 'Paid' ? (
                            <div>
                              <div>Ref: <code style={{ color: '#334155', fontWeight: 700 }}>{staff.refId}</code></div>
                              <div style={{ fontSize: '0.72rem' }}>Via {staff.paymentMethod || 'Bank Transfer'} • {staff.disbursedAt ? new Date(staff.disbursedAt).toLocaleDateString() : ''}</div>
                            </div>
                          ) : (
                            <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Awaiting disbursement</span>
                          )}
                        </td>
                        <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                          {staff.status === 'Due' ? (
                            <button
                              onClick={() => {
                                setDisburseError('');
                                setDisburseModalStaff(staff);
                                setDisburseAmount(staff.salary || '');
                                setDisburseMonth(salariesData.currentMonth);
                                setDisbursePaymentMethod('Bank Transfer');
                                setDisburseNotes(`Salary disbursement for ${salariesData.currentMonth}`);
                              }}
                              style={{
                                display: 'inline-flex', alignItems: 'center', gap: '6px',
                                background: 'linear-gradient(135deg, #4F46E5 0%, #1e40af 100%)',
                                color: 'white', border: 'none', padding: '6px 14px',
                                borderRadius: '8px', fontSize: '0.78rem', fontWeight: 700,
                                cursor: 'pointer', boxShadow: '0 2px 6px rgba(79, 70, 229, 0.3)'
                              }}
                            >
                              <Wallet size={13} /> Disburse Salary
                            </button>
                          ) : (
                            <span style={{ fontSize: '0.78rem', color: '#16a34a', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                              <CheckCircle size={14} /> Completed
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          ) : activeTab === 'pending' ? (
            /* ================= DUE / OVERDUE FEES VIEW ================= */
            filteredPendingFees.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 0', color: '#64748b', background: '#f8fafc', borderRadius: '16px' }}>
                <CheckCircle size={40} style={{ margin: '0 auto 10px', color: '#16a34a' }} />
                <h4 style={{ margin: '0 0 4px', color: '#1e3a8a', fontSize: '1.1rem', fontWeight: 700 }}>No Pending Fee Accounts</h4>
                <p style={{ margin: 0, fontSize: '0.85rem' }}>All active student dues have been reconciled and cleared.</p>
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1.5px solid #e2e8f0' }}>
                    <th style={{ padding: '12px 14px', fontSize: '0.74rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Student Name</th>
                    <th style={{ padding: '12px 14px', fontSize: '0.74rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Class & Section</th>
                    <th style={{ padding: '12px 14px', fontSize: '0.74rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Guardian Contact</th>
                    <th style={{ padding: '12px 14px', fontSize: '0.74rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Due Date</th>
                    <th style={{ padding: '12px 14px', fontSize: '0.74rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Status</th>
                    <th style={{ padding: '12px 14px', textAlign: 'right', fontSize: '0.74rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Amount Due</th>
                    <th style={{ padding: '12px 14px', textAlign: 'right', fontSize: '0.74rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPendingFees.map((f, i) => (
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
                      <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                        <button
                          onClick={() => {
                            setCollectFeeError('');
                            setCollectFeeTarget(f);
                            setCollectFeeAmount(f.amount || '');
                            setCollectFeeMethod('UPI');
                            setCollectFeeNotes(`Fee payment for ${f.studentName} (${f.classSection})`);
                          }}
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: '5px',
                            background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
                            color: 'white', border: 'none', padding: '6px 14px',
                            borderRadius: '8px', fontSize: '0.78rem', fontWeight: 700,
                            cursor: 'pointer', boxShadow: '0 2px 6px rgba(22, 163, 74, 0.3)'
                          }}
                        >
                          <CreditCard size={13} /> Collect Fee
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          ) : (
            /* ================= GENERAL TRANSACTIONS LEDGER / COLLECTIONS / EXPENSES ================= */
            transactions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 0', color: '#64748b', background: '#f8fafc', borderRadius: '16px' }}>
                <CreditCard size={40} style={{ margin: '0 auto 10px', color: '#cbd5e1' }} />
                <h4 style={{ margin: '0 0 4px', color: '#1e3a8a', fontSize: '1.1rem', fontWeight: 700 }}>
                  {activeTab === 'collections' ? 'No Fee Receipts Recorded' :
                   activeTab === 'expenses' ? 'No School Expenses Recorded' :
                   'No Transactions Recorded'}
                </h4>
                <p style={{ margin: 0, fontSize: '0.85rem' }}>Record the first transaction using the button above.</p>
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1.5px solid #e2e8f0' }}>
                    <th style={{ padding: '12px 14px', fontSize: '0.74rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Ref ID</th>
                    <th style={{ padding: '12px 14px', fontSize: '0.74rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Type</th>
                    <th style={{ padding: '12px 14px', fontSize: '0.74rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Category / Memo</th>
                    <th style={{ padding: '12px 14px', fontSize: '0.74rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Party / Student / Payee</th>
                    <th style={{ padding: '12px 14px', fontSize: '0.74rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Date</th>
                    <th style={{ padding: '12px 14px', fontSize: '0.74rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Status</th>
                    <th style={{ padding: '12px 14px', textAlign: 'right', fontSize: '0.74rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Amount</th>
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
                          padding: '3px 8px', borderRadius: '6px', fontSize: '0.74rem', fontWeight: 700,
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
            Showing <strong>
              {activeTab === 'salaries' ? filteredStaffList.length :
               activeTab === 'pending' ? filteredPendingFees.length :
               transactions.length}
            </strong> entries
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
              Page {currentPage} of {activeTab === 'salaries' || activeTab === 'pending' ? 1 : totalPages}
            </span>
            <button 
              disabled={currentPage >= (activeTab === 'salaries' || activeTab === 'pending' ? 1 : totalPages)} 
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

      {/* Disburse Staff Salary Modal */}
      {disburseModalStaff && createPortal(
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(8px)',
          zIndex: 999999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
        }}>
          <div style={{
            background: 'white', borderRadius: '24px', width: '500px', maxWidth: '95vw',
            maxHeight: '92vh', overflowY: 'auto', padding: '30px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', border: '1px solid rgba(226, 232, 240, 0.8)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '44px', height: '44px', borderRadius: '14px',
                  background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.1) 0%, rgba(124, 58, 237, 0.1) 100%)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <Wallet size={22} color="#7c3aed" />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#1e3a8a', margin: 0 }}>
                    Disburse Staff Salary
                  </h3>
                  <p style={{ margin: 0, fontSize: '0.78rem', color: '#64748b' }}>
                    Record monthly payroll compensation in the school ledger
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setDisburseModalStaff(null)}
                style={{ background: '#f1f5f9', border: 'none', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Staff Summary Pill */}
            <div style={{ padding: '14px 18px', background: '#f8fafc', borderRadius: '14px', border: '1px solid #e2e8f0', marginBottom: '18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '1rem', color: '#1e293b' }}>{disburseModalStaff.name}</div>
                  <div style={{ fontSize: '0.76rem', color: '#64748b' }}>
                    {disburseModalStaff.role} • Dept: {disburseModalStaff.department || 'General'} • ID: {disburseModalStaff.employeeId || '—'}
                  </div>
                </div>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '3px 8px', borderRadius: '6px', background: '#fef3c7', color: '#b45309' }}>
                  Due for {disburseMonth || salariesData.currentMonth}
                </span>
              </div>
            </div>

            {disburseError && (
              <div style={{ padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', color: '#b91c1c', fontSize: '0.84rem', marginBottom: '16px' }}>
                {disburseError}
              </div>
            )}

            <form onSubmit={handleDisburseSalary}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                      Disbursement Amount (₹) *
                    </label>
                    <input 
                      type="number"
                      required
                      min="1"
                      value={disburseAmount}
                      onChange={e => setDisburseAmount(e.target.value)}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem', outline: 'none', boxSizing: 'border-box' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                      Payment Method *
                    </label>
                    <select
                      value={disbursePaymentMethod}
                      onChange={e => setDisbursePaymentMethod(e.target.value)}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem', outline: 'none', background: 'white', boxSizing: 'border-box' }}
                    >
                      <option value="Bank Transfer">Bank Transfer (NEFT/IMPS)</option>
                      <option value="Cheque">Bank Cheque</option>
                      <option value="UPI">UPI Transfer</option>
                      <option value="Cash">Cash Voucher</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                    Payroll Month
                  </label>
                  <input 
                    type="text"
                    value={disburseMonth}
                    onChange={e => setDisburseMonth(e.target.value)}
                    placeholder="e.g. October 2026"
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                    Disbursement Notes / Reference
                  </label>
                  <textarea 
                    rows={2}
                    value={disburseNotes}
                    onChange={e => setDisburseNotes(e.target.value)}
                    placeholder="e.g. Standard monthly salary compensation via corporate bank transfer"
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setDisburseModalStaff(null)}
                    style={{ padding: '9px 16px', background: 'white', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.86rem', fontWeight: 600, cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    style={{
                      padding: '9px 20px',
                      background: 'linear-gradient(135deg, #4F46E5 0%, #1e40af 100%)',
                      color: 'white', border: 'none', borderRadius: '8px',
                      fontSize: '0.86rem', fontWeight: 700, cursor: 'pointer'
                    }}
                  >
                    {actionLoading ? 'Disbursing...' : 'Confirm & Disburse'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Collect Due Fee Modal */}
      {collectFeeTarget && createPortal(
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(8px)',
          zIndex: 999999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
        }}>
          <div style={{
            background: 'white', borderRadius: '24px', width: '500px', maxWidth: '95vw',
            maxHeight: '92vh', overflowY: 'auto', padding: '30px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', border: '1px solid rgba(226, 232, 240, 0.8)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '44px', height: '44px', borderRadius: '14px',
                  background: 'linear-gradient(135deg, rgba(22, 163, 74, 0.1) 0%, rgba(15, 118, 110, 0.1) 100%)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <CreditCard size={22} color="#16a34a" />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#1e3a8a', margin: 0 }}>
                    Collect Due Student Fee
                  </h3>
                  <p style={{ margin: 0, fontSize: '0.78rem', color: '#64748b' }}>
                    Reconcile student fee balance and generate official receipt
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setCollectFeeTarget(null)}
                style={{ background: '#f1f5f9', border: 'none', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Student Summary Pill */}
            <div style={{ padding: '14px 18px', background: '#f8fafc', borderRadius: '14px', border: '1px solid #e2e8f0', marginBottom: '18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '1rem', color: '#1e293b' }}>{collectFeeTarget.studentName}</div>
                  <div style={{ fontSize: '0.76rem', color: '#64748b' }}>
                    Class: {collectFeeTarget.classSection || 'General'} • Guardian: {collectFeeTarget.parentContact || '—'}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Total Due</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#b91c1c' }}>
                    {formatCurrency(collectFeeTarget.amount)}
                  </div>
                </div>
              </div>
            </div>

            {collectFeeError && (
              <div style={{ padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', color: '#b91c1c', fontSize: '0.84rem', marginBottom: '16px' }}>
                {collectFeeError}
              </div>
            )}

            <form onSubmit={handleCollectFee}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                      Collection Amount (₹) *
                    </label>
                    <input 
                      type="number"
                      required
                      min="1"
                      value={collectFeeAmount}
                      onChange={e => setCollectFeeAmount(e.target.value)}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem', outline: 'none', boxSizing: 'border-box' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                      Payment Method *
                    </label>
                    <select
                      value={collectFeeMethod}
                      onChange={e => setCollectFeeMethod(e.target.value)}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem', outline: 'none', background: 'white', boxSizing: 'border-box' }}
                    >
                      <option value="UPI">UPI / QR</option>
                      <option value="Cash">Cash</option>
                      <option value="Bank Transfer">Bank Transfer / NEFT</option>
                      <option value="Cheque">Cheque</option>
                      <option value="Online">Online Gateway</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                    Receipt Notes / Reference
                  </label>
                  <textarea 
                    rows={2}
                    value={collectFeeNotes}
                    onChange={e => setCollectFeeNotes(e.target.value)}
                    placeholder="e.g. Term 1 Tuition Fee installment received via UPI"
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setCollectFeeTarget(null)}
                    style={{ padding: '9px 16px', background: 'white', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.86rem', fontWeight: 600, cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    style={{
                      padding: '9px 20px',
                      background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
                      color: 'white', border: 'none', borderRadius: '8px',
                      fontSize: '0.86rem', fontWeight: 700, cursor: 'pointer'
                    }}
                  >
                    {actionLoading ? 'Collecting...' : 'Collect & Issue Receipt'}
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
