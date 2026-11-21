import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { 
  Book, 
  Bookmark, 
  Clock, 
  AlertTriangle, 
  Search, 
  Plus, 
  RotateCcw, 
  CheckCircle2, 
  BookOpen, 
  Layers, 
  ArrowUpRight, 
  X, 
  Calendar, 
  UserCheck, 
  TrendingUp, 
  DollarSign, 
  Check, 
  Send,
  Sparkles,
  Bell,
  Smartphone,
  MessageSquare,
  Mail,
  CheckCheck,
  AlertCircle,
  Filter,
  Radio,
  Volume2,
  ExternalLink,
  ShieldAlert,
  ChevronRight
} from 'lucide-react';
import StaffPunchClock from '../components/StaffPunchClock';

const LibraryDashboard = () => {
  const navigate = useNavigate();
  const tenantSlug = sessionStorage.getItem('tenantSlug') || '';
  const userInfo = JSON.parse(sessionStorage.getItem('userInfo') || '{}');
  const token = userInfo.token || sessionStorage.getItem('token') || '';

  // Data States
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'issued', 'returned', 'overdue'
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');

  // Modals
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
  const [isAddBookModalOpen, setIsAddBookModalOpen] = useState(false);
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [selectedTransactionForReturn, setSelectedTransactionForReturn] = useState(null);

  // Forms
  const [issueForm, setIssueForm] = useState({
    student: '',
    classSection: 'Class 10 - A',
    bookId: '',
    dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  });

  const [addBookForm, setAddBookForm] = useState({
    title: '',
    author: '',
    category: 'Science',
    totalCopies: 5
  });

  const [libraryStats, setLibraryStats] = useState({
    totalTitles: 0,
    totalCopies: 0,
    availableCopies: 0,
    issuedCopies: 0,
    overdueCopies: 0,
    finesCollected: 0,
    circulationDemand: [],
  });

  const [transactions, setTransactions] = useState([]);
  const [overdueList, setOverdueList] = useState([]);
  const [booksList, setBooksList] = useState([]);

  const showToast = (msg, type = 'success') => {
    setToastMessage(msg);
    setToastType(type);
    setTimeout(() => {
      setToastMessage('');
    }, 3500);
  };

  const getHeaders = () => {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (tenantSlug) headers['x-tenant-slug'] = tenantSlug;
    return headers;
  };

  const fetchLibraryData = async () => {
    try {
      const headers = getHeaders();
      const [statsRes, booksRes, txRes, overdueRes] = await Promise.all([
        fetch('http://localhost:5000/api/library/stats', { headers }),
        fetch('http://localhost:5000/api/library/books', { headers }),
        fetch('http://localhost:5000/api/library/transactions', { headers }),
        fetch('http://localhost:5000/api/library/overdue', { headers }),
      ]);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setLibraryStats(statsData);
      }
      if (booksRes.ok) {
        const booksData = await booksRes.json();
        setBooksList(Array.isArray(booksData) ? booksData : []);
      }
      if (txRes.ok) {
        const txData = await txRes.json();
        setTransactions(Array.isArray(txData) ? txData : []);
      }
      if (overdueRes.ok) {
        const overdueData = await overdueRes.json();
        setOverdueList(Array.isArray(overdueData) ? overdueData : []);
      }
    } catch (err) {
      console.warn('Failed to load library data:', err);
    }
  };

  useEffect(() => {
    fetchLibraryData();
  }, [tenantSlug]);

  // Filtered Transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const studentName = t.student || '';
      const bookTitle = t.book || '';
      const txId = t.id || t.transactionId || '';
      const section = t.classSection || '';

      const matchSearch = 
        studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        bookTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        txId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        section.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchSearch) return false;
      if (activeTab === 'all') return true;
      if (activeTab === 'issued') return t.action === 'Issued' && t.status === 'Active';
      if (activeTab === 'returned') return t.status === 'Completed';
      if (activeTab === 'overdue') return t.status === 'Overdue' || overdueList.some(o => (o.student || '').includes(studentName));
      return true;
    });
  }, [transactions, searchQuery, activeTab, overdueList]);

  // Handle Book Issue
  const handleIssueBookSubmit = async (e) => {
    e.preventDefault();
    if (!issueForm.student || !issueForm.bookId) {
      showToast('Please specify student name and select a book', 'error');
      return;
    }

    try {
      const res = await fetch('http://localhost:5000/api/library/issue', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(issueForm),
      });

      const data = await res.json();
      if (!res.ok) {
        showToast(data.message || 'Failed to issue book', 'error');
        return;
      }

      setIsIssueModalOpen(false);
      setIssueForm({
        student: '',
        classSection: 'Class 10 - A',
        bookId: '',
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      });
      showToast(data.message || 'Book successfully issued!');
      fetchLibraryData();
    } catch (err) {
      showToast('Network error while issuing book', 'error');
    }
  };

  // Handle Book Return
  const handleConfirmReturn = async (trx) => {
    try {
      const res = await fetch('http://localhost:5000/api/library/return', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ id: trx.id || trx._id, transactionId: trx.transactionId || trx.id }),
      });

      const data = await res.json();
      if (!res.ok) {
        showToast(data.message || 'Failed to return book', 'error');
        return;
      }

      setIsReturnModalOpen(false);
      showToast(data.message || `Book "${trx.book}" returned successfully!`);
      fetchLibraryData();
    } catch (err) {
      showToast('Network error while returning book', 'error');
    }
  };

  // Handle Overdue Settlement
  const handleSettleOverdue = async (overdueItem) => {
    try {
      const res = await fetch('http://localhost:5000/api/library/settle-overdue', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ id: overdueItem.id || overdueItem._id, transactionId: overdueItem.transactionId || overdueItem.id }),
      });

      const data = await res.json();
      if (!res.ok) {
        showToast(data.message || 'Failed to settle overdue', 'error');
        return;
      }

      showToast(data.message || `Overdue settled for ${overdueItem.student}!`);
      fetchLibraryData();
    } catch (err) {
      showToast('Network error while settling overdue', 'error');
    }
  };

  // Handle Add New Book
  const handleAddBookSubmit = async (e) => {
    e.preventDefault();
    if (!addBookForm.title.trim() || !addBookForm.author.trim()) {
      showToast('Title and author are required', 'error');
      return;
    }

    try {
      const res = await fetch('http://localhost:5000/api/library/books', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(addBookForm),
      });

      const data = await res.json();
      if (!res.ok) {
        showToast(data.message || 'Failed to create book', 'error');
        return;
      }

      setIsAddBookModalOpen(false);
      setAddBookForm({ title: '', author: '', category: 'Science', totalCopies: 5 });
      showToast(`New title "${data.title}" added to library inventory!`);
      fetchLibraryData();
    } catch (err) {
      showToast('Network error while saving book', 'error');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%', minHeight: '100%', boxSizing: 'border-box' }}>
      
      {/* Toast Notification */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          top: '24px',
          right: '24px',
          zIndex: 10000,
          background: toastType === 'error' ? '#ef4444' : '#10b981',
          color: 'white',
          padding: '12px 20px',
          borderRadius: '12px',
          fontWeight: 700,
          fontSize: '0.9rem',
          boxShadow: '0 10px 25px -5px rgba(0,0,0,0.2)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          animation: 'fadeIn 0.2s ease-in-out'
        }}>
          {toastType === 'error' ? <AlertTriangle size={18} /> : <CheckCircle2 size={18} />}
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage('')} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', marginLeft: '6px' }}>
            <X size={15} />
          </button>
        </div>
      )}

      {/* ─── TOP COMMAND HEADER (MODERN WHITE SURFACE) ─── */}
      <div className="card no-print" style={{
        background: 'var(--color-surface, white)',
        borderRadius: '16px',
        padding: '20px 24px',
        border: '1px solid var(--color-border, #e2e8f0)',
        boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px',
        flexShrink: 0
      }}>
        <div style={{ maxWidth: '750px' }}>
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
              <BookOpen size={13} color="#4338ca" /> Library & Resource Command
            </span>
            <span style={{
              background: '#dcfce7',
              color: '#15803d',
              padding: '3px 10px',
              borderRadius: '8px',
              fontSize: '0.74rem',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              <CheckCircle2 size={12} color="#15803d" /> Live Catalog Sync
            </span>
          </div>

          <h1 style={{ margin: '0 0 12px 0', fontSize: '1.45rem', fontWeight: 800, color: 'var(--color-text-main, #1e293b)', letterSpacing: '-0.01em' }}>
            Hi, {userInfo.name || 'Mr. Ganesh Kumar'}! 📚
          </h1>

          {/* Quick Action Pills */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button 
              onClick={() => setIsIssueModalOpen(true)}
              style={{
                background: '#4F46E5',
                border: 'none',
                color: 'white',
                padding: '7px 15px',
                borderRadius: '10px',
                fontSize: '0.82rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(79, 70, 229, 0.25)',
                transition: 'all 0.2s'
              }}
              className="hover-lift"
            >
              <Plus size={14} /> Issue Book
            </button>

            <button 
              onClick={() => setIsAddBookModalOpen(true)}
              style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                color: '#1e293b',
                padding: '7px 14px',
                borderRadius: '10px',
                fontSize: '0.82rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              className="hover-lift"
            >
              <Book size={14} color="#059669" /> Add New Title
            </button>

            <button 
              onClick={() => navigate(tenantSlug ? `/${tenantSlug}/books` : '/books')}
              style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                color: '#1e293b',
                padding: '7px 14px',
                borderRadius: '10px',
                fontSize: '0.82rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              className="hover-lift"
            >
              <Layers size={14} color="#2563EB" /> Catalog Inventory ({booksList.length})
            </button>

            <button 
              onClick={() => navigate(tenantSlug ? `/${tenantSlug}/library-alerts` : '/library-alerts')}
              style={{
                background: overdueList.length > 0 ? '#fff1f2' : '#f8fafc',
                border: overdueList.length > 0 ? '1px solid #fecdd3' : '1px solid #e2e8f0',
                color: overdueList.length > 0 ? '#e11d48' : '#1e293b',
                padding: '7px 14px',
                borderRadius: '10px',
                fontSize: '0.82rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              className="hover-lift"
            >
              <Bell size={14} color={overdueList.length > 0 ? '#e11d48' : '#D97706'} /> Overdue Alerts ({overdueList.length})
            </button>
          </div>
        </div>

        {/* Right Info Box */}
        <div style={{
          background: '#f8fafc',
          borderRadius: '12px',
          padding: '14px 18px',
          border: '1px solid #e2e8f0',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          gap: '4px'
        }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
            Library Repository Status
          </div>
          <div style={{ fontSize: '1.08rem', fontWeight: 800, color: '#1e293b' }}>
            {booksList.length} Titles • {libraryStats.totalCopies || 0} Total Copies
          </div>
          <div style={{ fontSize: '0.78rem', color: '#16a34a', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#16a34a' }} />
            {libraryStats.issuedCopies || 0} Books in Circulation
          </div>
        </div>
      </div>

      {/* ─── STAFF ATTENDANCE PUNCH IN / PUNCH OUT MODULE ─── */}
      <div style={{ width: '100%', minHeight: 'fit-content', flexShrink: 0 }}>
        <StaffPunchClock />
      </div>

      {/* FULL-WIDTH BALANCED 5-KPI METRIC STRIP */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        {[
          { 
            label: 'Total Volume Copies', 
            value: libraryStats.totalCopies ?? booksList.reduce((acc, b) => acc + (b.totalCopies || 0), 0), 
            icon: Book, 
            color: '#4F46E5', 
            bg: 'rgba(79,70,229,0.1)',
            badge: 'Registered',
            badgeBg: 'rgba(79,70,229,0.08)',
            badgeColor: '#4F46E5'
          },
          { 
            label: 'Books Issued', 
            value: libraryStats.issuedCopies ?? 0, 
            icon: Bookmark, 
            color: '#2563EB', 
            bg: 'rgba(37,99,235,0.1)',
            badge: 'Circulating',
            badgeBg: 'rgba(37,99,235,0.08)',
            badgeColor: '#2563EB'
          },
          { 
            label: 'Available on Shelf', 
            value: libraryStats.availableCopies ?? booksList.reduce((acc, b) => acc + (b.availableCopies || 0), 0), 
            icon: Clock, 
            color: '#059669', 
            bg: 'rgba(5, 150, 105, 0.1)',
            badge: 'In Stock',
            badgeBg: 'rgba(5, 150, 105, 0.08)',
            badgeColor: '#059669'
          },
          { 
            label: 'Overdue Returns', 
            value: overdueList.length || libraryStats.overdueCopies || 0, 
            icon: AlertTriangle, 
            color: '#DC2626', 
            bg: 'rgba(220, 38, 38, 0.1)',
            badge: 'Attention',
            badgeBg: 'rgba(220, 38, 38, 0.08)',
            badgeColor: '#DC2626'
          },
          { 
            label: 'Catalog Titles', 
            value: booksList.length || libraryStats.totalTitles || 0, 
            icon: Layers, 
            color: '#D97706', 
            bg: 'rgba(217, 119, 6, 0.1)',
            badge: 'Active Catalog',
            badgeBg: 'rgba(217, 119, 6, 0.08)',
            badgeColor: '#D97706'
          }
        ].map((kpi, idx) => (
          <div 
            key={idx} 
            className="card hover-lift" 
            style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '10px', 
              padding: '18px 20px', 
              borderRadius: '16px', 
              background: 'var(--color-surface, white)', 
              border: '1px solid var(--color-border, #e2e8f0)', 
              boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
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

      {/* MAIN CONTENT GRID: LEFT LOGS (68%) + RIGHT ANALYTICS & OVERDUE (32%) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 360px', gap: '20px', alignItems: 'start' }}>
        
        {/* LEFT COLUMN: Recent Borrow & Return Logs */}
        <div className="card" style={{ 
          background: 'white', 
          borderRadius: '16px', 
          border: '1px solid #e2e8f0', 
          padding: '22px 24px', 
          boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
          display: 'flex', 
          flexDirection: 'column',
          gap: '16px'
        }}>
          
          {/* Top Bar with Title, Search, and Tabs */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#1e293b' }}>
                Recent Borrow & Return Logs
              </h3>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, background: '#e0e7ff', color: '#4338ca', padding: '2px 8px', borderRadius: '12px' }}>
                {filteredTransactions.length} Records
              </span>
            </div>

            {/* Search Box */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <button
                onClick={() => setIsIssueModalOpen(true)}
                className="hover-lift"
                style={{
                  background: '#4F46E5',
                  border: 'none',
                  color: 'white',
                  padding: '7px 14px',
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
                <Plus size={14} /> Issue Book
              </button>

              <button
                onClick={() => setIsAddBookModalOpen(true)}
                className="hover-lift"
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  color: '#1e293b',
                  padding: '7px 14px',
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
                <Plus size={14} color="#059669" /> Add New Book
              </button>

              <button
                onClick={() => navigate(tenantSlug ? `/${tenantSlug}/books` : '/books')}
                className="hover-lift"
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  color: '#1e293b',
                  padding: '7px 14px',
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
                <Book size={14} color="#0284c7" /> View All Books
              </button>

              <button
                onClick={() => navigate(tenantSlug ? `/${tenantSlug}/library-alerts` : '/library-alerts')}
                className="hover-lift"
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  color: '#4338ca',
                  padding: '7px 14px',
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
                <Bell size={14} color="#4338ca" /> Borrower Alerts
              </button>
            </div>

            <div style={{ position: 'relative', minWidth: '240px' }}>
              <Search size={15} style={{ position: 'absolute', left: '12px', top: '10px', color: '#94a3b8' }} />
              <input 
                type="text" 
                placeholder="Search Book, Student, or ID..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px 8px 36px',
                  borderRadius: '10px',
                  border: '1px solid #e2e8f0',
                  fontSize: '0.85rem',
                  outline: 'none',
                  background: '#f8fafc',
                  boxSizing: 'border-box'
                }}
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  style={{ position: 'absolute', right: '10px', top: '9px', background: 'transparent', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Filter Pills */}
          <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px', flexWrap: 'wrap' }}>
            {[
              { id: 'all', label: 'All Logs' },
              { id: 'issued', label: 'Active Issued' },
              { id: 'returned', label: 'Completed Returns' },
              { id: 'overdue', label: 'Overdue Holds' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: '6px 14px',
                  borderRadius: '8px',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  border: 'none',
                  background: activeTab === tab.id ? '#4F46E5' : '#f1f5f9',
                  color: activeTab === tab.id ? 'white' : '#64748b',
                  transition: 'all 0.15s'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Table */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.86rem' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  <th style={{ padding: '12px 16px', fontWeight: 800, color: '#475569', borderRadius: '8px 0 0 8px' }}>Log ID</th>
                  <th style={{ padding: '12px 14px', fontWeight: 800, color: '#475569' }}>Student & Batch</th>
                  <th style={{ padding: '12px 14px', fontWeight: 800, color: '#475569' }}>Book Title</th>
                  <th style={{ padding: '12px 14px', fontWeight: 800, color: '#475569' }}>Action & Date</th>
                  <th style={{ padding: '12px 14px', fontWeight: 800, color: '#475569' }}>Status</th>
                  <th style={{ padding: '12px 16px', fontWeight: 800, color: '#475569', textAlign: 'right', borderRadius: '0 8px 8px 0' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: '36px', textAlign: 'center', color: '#94a3b8' }}>
                      <BookOpen size={36} color="#cbd5e1" style={{ margin: '0 auto 8px auto', display: 'block' }} />
                      <div style={{ fontWeight: 700, color: '#475569' }}>No library records found</div>
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.map(t => {
                    const isOverdue = overdueList.some(o => o.student === t.student && t.action === 'Issued');
                    return (
                      <tr key={t.id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background-color 0.15s' }} className="table-row-hover">
                        <td style={{ padding: '14px 16px', fontWeight: 800, color: '#4F46E5' }}>
                          {t.id}
                        </td>
                        <td style={{ padding: '14px 14px' }}>
                          <div style={{ fontWeight: 700, color: '#1e293b' }}>{t.student}</div>
                          <div style={{ fontSize: '0.74rem', color: '#64748b', display: 'inline-block', background: '#f1f5f9', padding: '1px 6px', borderRadius: '4px', marginTop: '3px' }}>
                            {t.classSection || 'Class 10 - A'}
                          </div>
                        </td>
                        <td style={{ padding: '14px 14px' }}>
                          <div style={{ fontWeight: 700, color: '#1e293b' }}>{t.book}</div>
                          <div style={{ fontSize: '0.74rem', color: '#059669', fontWeight: 600 }}>
                            {t.category || 'General'}
                          </div>
                        </td>
                        <td style={{ padding: '14px 14px' }}>
                          <div style={{ fontWeight: 700, color: t.action === 'Issued' ? '#2563EB' : '#16A34A', fontSize: '0.82rem' }}>
                            {t.action}
                          </div>
                          <div style={{ fontSize: '0.74rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                            <Calendar size={12} /> {t.date}
                          </div>
                        </td>
                        <td style={{ padding: '14px 14px' }}>
                          <span style={{
                            padding: '4px 10px',
                            borderRadius: '12px',
                            fontSize: '0.74rem',
                            fontWeight: 800,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            background: isOverdue ? '#fee2e2' : t.status === 'Completed' ? '#dcfce7' : '#e0e7ff',
                            color: isOverdue ? '#dc2626' : t.status === 'Completed' ? '#15803d' : '#4338ca'
                          }}>
                            <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: isOverdue ? '#dc2626' : t.status === 'Completed' ? '#16a34a' : '#4F46E5' }} />
                            {isOverdue ? 'Overdue' : t.status}
                          </span>
                        </td>
                        <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                          {t.status === 'Overdue' ? (
                            <div style={{ display: 'inline-flex', gap: '6px', alignItems: 'center' }}>
                              <button
                                onClick={() => navigate(tenantSlug ? `/${tenantSlug}/library-alerts` : '/library-alerts')}
                                title="Open Borrower Alerts Dispatcher"
                                className="hover-lift"
                                style={{
                                  padding: '6px 9px',
                                  borderRadius: '8px',
                                  border: '1px solid #fecdd3',
                                  background: '#fff1f2',
                                  color: '#e11d48',
                                  fontWeight: 700,
                                  fontSize: '0.76rem',
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px'
                                }}
                              >
                                <Bell size={13} /> Alert
                              </button>
                              <button
                                onClick={() => handleSettleOverdue(t)}
                                className="hover-lift"
                                style={{
                                  padding: '6px 12px',
                                  borderRadius: '8px',
                                  border: 'none',
                                  background: '#dc2626',
                                  color: 'white',
                                  fontWeight: 700,
                                  fontSize: '0.76rem',
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px'
                                }}
                              >
                                Settle & Return
                              </button>
                            </div>
                          ) : t.status === 'Active' ? (
                            <div style={{ display: 'inline-flex', gap: '6px', alignItems: 'center' }}>
                              <button
                                onClick={() => navigate(tenantSlug ? `/${tenantSlug}/library-alerts` : '/library-alerts')}
                                title="Open Borrower Alerts Dispatcher"
                                className="hover-lift"
                                style={{
                                  padding: '6px 9px',
                                  borderRadius: '8px',
                                  border: '1px solid #fed7aa',
                                  background: '#fff7ed',
                                  color: '#c2410c',
                                  fontWeight: 700,
                                  fontSize: '0.76rem',
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px'
                                }}
                              >
                                <Bell size={13} /> Alert
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedTransactionForReturn(t);
                                  setIsReturnModalOpen(true);
                                }}
                                className="hover-lift"
                                style={{
                                  padding: '6px 12px',
                                  borderRadius: '8px',
                                  border: '1px solid #c7d2fe',
                                  background: '#eef2ff',
                                  color: '#4338ca',
                                  fontWeight: 700,
                                  fontSize: '0.76rem',
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px'
                                }}
                              >
                                <RotateCcw size={13} /> Return Book
                              </button>
                            </div>
                          ) : (
                            <span style={{ fontSize: '0.78rem', color: '#16a34a', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <Check size={14} /> Completed
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* RIGHT COLUMN: CIRCULATION DEMAND + OVERDUE ALERTS */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Card 1: Circulation Demand Progress Bars */}
          <div className="card" style={{
            background: 'white',
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            padding: '22px 24px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.02)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <TrendingUp size={16} color="#2563eb" />
                </div>
                <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#1e293b' }}>
                  Circulation Demand
                </h4>
              </div>
              <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#2563eb', background: '#eff6ff', padding: '2px 8px', borderRadius: '6px' }}>
                Top Titles
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {(libraryStats.circulationDemand && libraryStats.circulationDemand.length > 0 ? libraryStats.circulationDemand.slice(0, 5) : booksList.slice(0, 5)).length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px 12px', color: '#94a3b8', fontSize: '0.85rem' }}>
                  No circulation demand data yet.
                </div>
              ) : (
                (libraryStats.circulationDemand && libraryStats.circulationDemand.length > 0 ? libraryStats.circulationDemand.slice(0, 5) : booksList.slice(0, 5)).map((book, idx) => {
                  const maxIssues = Math.max(...(libraryStats.circulationDemand || []).map(b => b.issuesCount || 1), 10);
                  const issues = book.issuesCount || 0;
                  const percentage = Math.min(100, Math.max(12, Math.round((issues / maxIssues) * 100)));
                  return (
                    <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.84rem', fontWeight: 700, color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '210px' }}>
                          {book.title}
                        </span>
                        <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#4F46E5', background: '#eef2ff', padding: '1px 6px', borderRadius: '4px' }}>
                          {issues} Loans
                        </span>
                      </div>
                      <div style={{ width: '100%', height: '7px', background: '#f1f5f9', borderRadius: '999px', overflow: 'hidden' }}>
                        <div 
                          style={{ 
                            width: `${percentage}%`, 
                            height: '100%', 
                            background: idx === 0 ? '#4F46E5' : idx === 1 ? '#2563EB' : idx === 2 ? '#0284c7' : '#059669', 
                            borderRadius: '999px',
                            transition: 'width 0.6s ease'
                          }} 
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Card 2: Action Required - Overdue Returns */}
          <div className="card" style={{
            background: 'white',
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            padding: '22px 24px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.02)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <AlertTriangle size={16} color="#dc2626" />
                </div>
                <h4 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 800, color: '#1e293b' }}>
                  Overdue Returns
                </h4>
              </div>
              <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#dc2626', background: '#fef2f2', padding: '2px 8px', borderRadius: '6px' }}>
                {overdueList.length} Action Needed
              </span>
            </div>

            {overdueList.length === 0 ? (
              <div style={{ padding: '16px', background: '#f0fdf4', borderRadius: '12px', border: '1px solid #dcfce7', textAlign: 'center' }}>
                <CheckCircle2 size={24} color="#16a34a" style={{ margin: '0 auto 6px auto' }} />
                <div style={{ fontWeight: 700, color: '#166534', fontSize: '0.85rem' }}>All Returns Up to Date</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {overdueList.map((item) => (
                  <div 
                    key={item.id} 
                    style={{ 
                      padding: '12px 14px', 
                      background: '#fff7ed', 
                      border: '1px solid #fed7aa', 
                      borderRadius: '12px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '10px'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 800, color: '#9a3412', fontSize: '0.86rem' }}>
                        {item.student} <span style={{ fontWeight: 600, fontSize: '0.74rem', color: '#c2410c' }}>({item.classSection})</span>
                      </div>
                      <div style={{ fontSize: '0.78rem', color: '#7c2d12', marginTop: '2px' }}>
                        {item.book}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                      <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#dc2626', background: '#fef2f2', padding: '1px 6px', borderRadius: '4px' }}>
                        {item.days} days late
                      </span>
                      <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#b45309' }}>
                        Fine: ₹{item.fine}
                      </span>
                      <div style={{ display: 'flex', gap: '4px', marginTop: '4px' }}>
                        <button
                          onClick={() => navigate(tenantSlug ? `/${tenantSlug}/library-alerts` : '/library-alerts')}
                          className="hover-lift"
                          style={{
                            padding: '3px 7px',
                            borderRadius: '6px',
                            border: '1px solid #fecdd3',
                            background: '#fff1f2',
                            color: '#e11d48',
                            fontWeight: 700,
                            fontSize: '0.72rem',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '3px'
                          }}
                        >
                          <Bell size={11} /> Alert
                        </button>
                        <button
                          onClick={() => handleSettleOverdue(item)}
                          className="hover-lift"
                          style={{
                            padding: '3px 8px',
                            borderRadius: '6px',
                            border: 'none',
                            background: '#059669',
                            color: 'white',
                            fontWeight: 700,
                            fontSize: '0.72rem',
                            cursor: 'pointer'
                          }}
                        >
                          Settle & Return
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <button 
              onClick={() => navigate(tenantSlug ? `/${tenantSlug}/books` : '/books')}
              className="hover-lift" 
              style={{ 
                width: '100%', 
                marginTop: '14px', 
                padding: '9px 12px', 
                background: '#f8fafc', 
                border: '1px solid #e2e8f0', 
                borderRadius: '10px', 
                fontWeight: 700, 
                fontSize: '0.82rem',
                color: '#475569', 
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
            >
              Manage Library Inventory <ChevronRightIcon size={14} />
            </button>
          </div>

        </div>
      </div>

      {/* MODAL 1: ISSUE BOOK (PORTAL) */}
      {isIssueModalOpen && createPortal(
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999999,
          padding: '16px'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '18px',
            width: '100%',
            maxWidth: '460px',
            padding: '24px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <BookOpen size={20} color="#4F46E5" />
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#1e293b' }}>Issue Book to Student</h3>
              </div>
              <button onClick={() => setIsIssueModalOpen(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleIssueBookSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>Student Name *</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Aarav Sharma"
                  value={issueForm.student}
                  onChange={e => setIssueForm({ ...issueForm, student: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.88rem', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>Class / Section *</label>
                <select 
                  value={issueForm.classSection}
                  onChange={e => setIssueForm({ ...issueForm, classSection: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.88rem', background: 'white', boxSizing: 'border-box' }}
                >
                  <option value="Class 10 - A">Class 10 - A</option>
                  <option value="Class 10 - B">Class 10 - B</option>
                  <option value="Class 9 - A">Class 9 - A</option>
                  <option value="Class 9 - B">Class 9 - B</option>
                  <option value="Class 11 - Science">Class 11 - Science</option>
                  <option value="Class 12 - Science">Class 12 - Science</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>Select Book from Catalog *</label>
                <select 
                  required
                  value={issueForm.bookId}
                  onChange={e => setIssueForm({ ...issueForm, bookId: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.88rem', background: 'white', boxSizing: 'border-box' }}
                >
                  <option value="">-- Choose a Title --</option>
                  {booksList.map(b => (
                    <option key={b.bookId} value={b.bookId} disabled={b.availableCopies <= 0}>
                      {b.title} ({b.availableCopies} available on shelf)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>Return Due Date</label>
                <input 
                  type="date"
                  value={issueForm.dueDate}
                  onChange={e => setIssueForm({ ...issueForm, dueDate: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.88rem', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={() => setIsIssueModalOpen(false)}
                  style={{ padding: '9px 16px', borderRadius: '10px', border: '1px solid #cbd5e1', background: 'white', color: '#475569', fontWeight: 700, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '9px 20px', borderRadius: '10px', border: 'none', background: '#4F46E5', color: 'white', fontWeight: 800, cursor: 'pointer', boxShadow: '0 2px 8px rgba(79, 70, 229, 0.3)' }}
                >
                  Confirm Issue
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* MODAL 2: ADD NEW BOOK (PORTAL) */}
      {isAddBookModalOpen && createPortal(
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999999,
          padding: '16px'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '18px',
            width: '100%',
            maxWidth: '460px',
            padding: '24px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Plus size={20} color="#059669" />
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#1e293b' }}>Add Book to Catalog</h3>
              </div>
              <button onClick={() => setIsAddBookModalOpen(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddBookSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>Book Title *</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. S.L. Loney Plane Trigonometry"
                  value={addBookForm.title}
                  onChange={e => setAddBookForm({ ...addBookForm, title: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.88rem', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>Author Name *</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. S.L. Loney"
                  value={addBookForm.author}
                  onChange={e => setAddBookForm({ ...addBookForm, author: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.88rem', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>Category</label>
                  <select 
                    value={addBookForm.category}
                    onChange={e => setAddBookForm({ ...addBookForm, category: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.88rem', background: 'white', boxSizing: 'border-box' }}
                  >
                    <option value="Science">Science</option>
                    <option value="Mathematics">Mathematics</option>
                    <option value="Technology">Technology</option>
                    <option value="History">History</option>
                    <option value="Literature">Literature</option>
                    <option value="Self Help">Self Help</option>
                    <option value="General">General</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>Total Copies</label>
                  <input 
                    type="number"
                    min="1"
                    max="200"
                    value={addBookForm.totalCopies}
                    onChange={e => setAddBookForm({ ...addBookForm, totalCopies: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.88rem', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={() => setIsAddBookModalOpen(false)}
                  style={{ padding: '9px 16px', borderRadius: '10px', border: '1px solid #cbd5e1', background: 'white', color: '#475569', fontWeight: 700, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '9px 20px', borderRadius: '10px', border: 'none', background: '#059669', color: 'white', fontWeight: 800, cursor: 'pointer', boxShadow: '0 2px 8px rgba(5, 150, 105, 0.3)' }}
                >
                  Add Title
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* MODAL 3: RETURN CONFIRMATION (PORTAL) */}
      {isReturnModalOpen && selectedTransactionForReturn && createPortal(
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999999,
          padding: '16px'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '18px',
            width: '100%',
            maxWidth: '440px',
            padding: '24px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <RotateCcw size={20} color="#4F46E5" />
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#1e293b' }}>Confirm Book Return</h3>
              </div>
              <button onClick={() => setIsReturnModalOpen(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: '14px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.86rem' }}>
              <div><strong>Transaction:</strong> {selectedTransactionForReturn.id}</div>
              <div><strong>Student:</strong> {selectedTransactionForReturn.student} ({selectedTransactionForReturn.classSection})</div>
              <div><strong>Book:</strong> {selectedTransactionForReturn.book}</div>
              <div><strong>Issued Date:</strong> {selectedTransactionForReturn.date}</div>
              <div style={{ color: '#059669', fontWeight: 700 }}>Return Condition: Good • No Damage</div>
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '8px' }}>
              <button
                type="button"
                onClick={() => setIsReturnModalOpen(false)}
                style={{ padding: '9px 16px', borderRadius: '10px', border: '1px solid #cbd5e1', background: 'white', color: '#475569', fontWeight: 700, cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleConfirmReturn(selectedTransactionForReturn)}
                style={{ padding: '9px 20px', borderRadius: '10px', border: 'none', background: '#4F46E5', color: 'white', fontWeight: 800, cursor: 'pointer', boxShadow: '0 2px 8px rgba(79, 70, 229, 0.3)' }}
              >
                Confirm Return
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
};

// Simple ChevronRight icon helper to ensure 100% compatibility
const ChevronRightIcon = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

export default LibraryDashboard;
