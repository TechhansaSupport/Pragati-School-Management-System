import React, { useState, useMemo } from 'react';
import { Search, MoreVertical, CreditCard, ChevronLeft, ChevronRight, Download, X, DollarSign, User, AlertCircle, FileText, CheckCircle, Briefcase, TrendingUp } from 'lucide-react';

const generateMockTransactions = () => {
  return Array.from({ length: 45 }).map((_, i) => ({
    id: i + 1,
    refId: `TXN-2023-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`,
    type: Math.random() > 0.4 ? 'Fee Collection' : 'Expense',
    category: ['Tuition', 'Transport', 'Salary', 'Maintenance', 'Library'][Math.floor(Math.random() * 5)],
    amount: Math.floor(Math.random() * 50000 + 1000),
    date: `08/${String(Math.floor(Math.random() * 30 + 1)).padStart(2, '0')}/23`,
    status: Math.random() > 0.1 ? 'Completed' : 'Pending',
    student: `Student ${Math.floor(Math.random() * 40) + 1}`,
    paymentMethod: ['Bank Transfer', 'UPI', 'Cash', 'Credit Card'][Math.floor(Math.random() * 4)]
  }));
};

const mockTransactions = generateMockTransactions();
const pendingFees = mockTransactions.filter(t => t.type === 'Fee Collection' && t.status === 'Pending');

const Finance = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedTxn, setSelectedTxn] = useState(null);
  const [activeTab, setActiveTab] = useState('ledger'); // 'ledger', 'pending', 'payroll'
  const itemsPerPage = 10;

  const getDataSource = () => {
    if (activeTab === 'pending') return pendingFees;
    if (activeTab === 'payroll') return mockTransactions.filter(t => t.category === 'Salary');
    return mockTransactions;
  };

  const filtered = useMemo(() => {
    return getDataSource().filter(s => 
      s.refId.toLowerCase().includes(searchQuery.toLowerCase()) || 
      s.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.student && s.student.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [searchQuery, activeTab]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const formatCurrency = (val) => `₹${val.toLocaleString()}`;

  const renderTransactionDrawer = () => {
    if (!selectedTxn) return null;
    const t = selectedTxn;

    return (
      <>
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)', zIndex: 40 }} onClick={() => setSelectedTxn(null)} />
        <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: '450px', backgroundColor: 'var(--color-surface)', zIndex: 50, boxShadow: '-10px 0 30px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column', animation: 'slideInRight 0.3s ease' }}>
          
          <div style={{ padding: '24px', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(248,250,252,0.5)' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1e293b' }}>Transaction Details</h2>
            <button onClick={() => setSelectedTxn(null)} style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--color-text-muted)', transition: 'all 0.2s' }} className="hover-lift"><X size={18}/></button>
          </div>

          <div style={{ padding: '32px 24px', flex: 1, overflowY: 'auto' }}>
            {/* Header Icon */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '32px' }}>
              <div style={{ width: '80px', height: '80px', borderRadius: '24px', background: t.status === 'Completed' ? 'linear-gradient(135deg, #4F46E5, #6366f1)' : 'linear-gradient(135deg, #F59E0B, #f97316)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px', boxShadow: t.status === 'Completed' ? '0 10px 20px -5px rgba(79,70,229,0.4)' : '0 10px 20px -5px rgba(245,158,11,0.4)' }}>
                {t.type === 'Fee Collection' ? <DollarSign size={40} /> : <CreditCard size={40} />}
              </div>
              <h3 style={{ fontSize: '2.5rem', fontWeight: 800, margin: '0 0 12px 0', color: 'var(--color-text-main)' }}>{formatCurrency(t.amount)}</h3>
              <div style={{ padding: '6px 16px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 700, backgroundColor: t.status === 'Completed' ? 'rgba(79,70,229,0.1)' : 'rgba(245,158,11,0.1)', color: t.status === 'Completed' ? '#4F46E5' : '#d97706' }}>
                {t.status}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', background: 'rgba(248,250,252,0.8)', padding: '24px', borderRadius: '16px', border: '1px solid rgba(226,232,240,0.8)' }}>
              <div className="flex-between">
                <span className="text-muted" style={{ fontSize: '0.9rem' }}>Reference ID</span>
                <span style={{ fontWeight: 700, color: '#1e293b' }}>{t.refId}</span>
              </div>
              <div className="flex-between">
                <span className="text-muted" style={{ fontSize: '0.9rem' }}>Date</span>
                <span style={{ fontWeight: 600, color: '#1e293b' }}>{t.date}</span>
              </div>
              <div className="flex-between">
                <span className="text-muted" style={{ fontSize: '0.9rem' }}>Type</span>
                <span style={{ fontWeight: 700, color: t.type === 'Fee Collection' ? '#4F46E5' : '#0F766E' }}>{t.type}</span>
              </div>
              <div className="flex-between">
                <span className="text-muted" style={{ fontSize: '0.9rem' }}>Category</span>
                <span style={{ fontWeight: 600, color: '#1e293b' }}>{t.category}</span>
              </div>
              <div className="flex-between">
                <span className="text-muted" style={{ fontSize: '0.9rem' }}>Payment Method</span>
                <span style={{ fontWeight: 600, color: '#1e293b' }}>{t.paymentMethod}</span>
              </div>
              
              {t.type === 'Fee Collection' && (
                <div className="flex-between" style={{ borderTop: '1px dashed var(--color-border)', paddingTop: '20px', marginTop: '4px' }}>
                  <span className="text-muted" style={{ fontSize: '0.9rem' }}>Student</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, color: '#1e293b' }}>
                    <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><User size={12} className="text-muted" /></div>
                    {t.student}
                  </div>
                </div>
              )}
            </div>

            <div style={{ marginTop: '32px', display: 'flex', gap: '16px' }}>
              {t.status === 'Pending' && t.type === 'Fee Collection' ? (
                <>
                  <button className="hover-lift" style={{ flex: 1, padding: '16px', background: 'white', color: '#0F766E', borderRadius: '12px', border: '1px solid rgba(15, 118, 110,0.3)', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'all 0.2s' }}>
                    <AlertCircle size={18} /> Send Reminder
                  </button>
                  <button className="hover-lift" style={{ flex: 1, padding: '16px', background: 'linear-gradient(135deg, #4F46E5, #6366f1)', color: 'white', borderRadius: '12px', border: 'none', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 10px 20px -5px rgba(79,70,229,0.4)', transition: 'all 0.2s' }}>
                    <CheckCircle size={18} /> Mark Paid
                  </button>
                </>
              ) : (
                <button className="hover-lift" style={{ width: '100%', padding: '16px', background: 'linear-gradient(135deg, #60A5FA, #d946ef)', color: 'white', borderRadius: '12px', border: 'none', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 10px 20px -5px rgba(96,165,250,0.4)', transition: 'all 0.2s' }}>
                  <FileText size={18} /> Download Receipt
                </button>
              )}
            </div>
          </div>
        </div>
      </>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%', height: '100%' }}>
      {renderTransactionDrawer()}

      {/* Top Banner - Glassmorphism */}
      <div style={{
        background: 'linear-gradient(135deg, #0ea5e9 0%, #4F46E5 100%)',
        borderRadius: '16px',
        padding: '24px 32px',
        color: 'white',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 10px 25px -5px rgba(79, 70, 229, 0.4)'
      }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, margin: '0 0 8px 0' }}>Finance Center 💼</h2>
          <p style={{ opacity: 0.9, fontSize: '0.95rem', margin: 0 }}>Manage ledgers, track pending fees, and process payroll efficiently.</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '1rem', fontWeight: 600, opacity: 0.9 }}>Pending Collections</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 700 }}>₹12.5L</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        {[
          { label: 'Total Collections (YTD)', value: '₹1.4Cr', icon: TrendingUp, color: '#4F46E5', bg: 'rgba(79,70,229,0.1)' },
          { label: 'Total Expenses (YTD)', value: '₹85L', icon: CreditCard, color: '#0F766E', bg: 'rgba(15, 118, 110,0.1)' },
          { label: 'Pending Fees', value: '₹12.5L', icon: AlertCircle, color: '#F59E0B', bg: 'rgba(245,158,11,0.1)' },
          { label: 'Available Balance', value: '₹55L', icon: Briefcase, color: '#60A5FA', bg: 'rgba(96,165,250,0.1)' }
        ].map((kpi, i) => (
          <div key={i} className="card hover-lift" style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '16px', transition: 'all 0.3s' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: kpi.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <kpi.icon size={20} color={kpi.color} />
              </div>
            </div>
            <div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-primary)' }}>{kpi.value}</div>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>{kpi.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, padding: 0, overflow: 'hidden' }}>
        
        {/* Main Tabs */}
        <div style={{ display: 'flex', gap: '32px', borderBottom: '1px solid var(--color-border)', padding: '0 24px', background: 'transparent' }}>
          {[
            { id: 'ledger', label: 'Master Ledger' },
            { id: 'pending', label: 'Pending Fees' },
            { id: 'payroll', label: 'Payroll & Salaries' }
          ].map(tab => (
            <div 
              key={tab.id} 
              onClick={() => { setActiveTab(tab.id); setCurrentPage(1); }}
              style={{ 
                padding: '20px 0', 
                fontSize: '0.95rem', 
                fontWeight: 700, 
                cursor: 'pointer',
                color: activeTab === tab.id ? '#4F46E5' : 'var(--color-text-muted)',
                borderBottom: activeTab === tab.id ? '3px solid #4F46E5' : '3px solid transparent',
                transition: 'all 0.2s'
              }}>
              {tab.label}
            </div>
          ))}
        </div>

        <div style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '12px' }}>
            <div className="table-search" style={{ margin: 0, background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: '12px', position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '10px', color: 'var(--color-text-muted)' }} />
              <input 
                type="text" 
                placeholder="Search Ref ID or Category..." 
                value={searchQuery}
                onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                style={{ outline: 'none', width: '280px', padding: '10px 10px 10px 36px', background: 'transparent', border: 'none', fontSize: '0.9rem', color: 'var(--color-text-main)' }}
              />
            </div>
          </div>
          <button className="hover-lift" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: '12px', fontWeight: 600, color: 'var(--color-text-main)', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
            <Download size={16} color="#4F46E5" /> Export CSV
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '0 24px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--color-border)' }}>
                <th style={{ textAlign: 'left', padding: '12px 16px', color: 'var(--color-text-muted)', fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase' }}>Reference ID</th>
                <th style={{ textAlign: 'left', padding: '12px 16px', color: 'var(--color-text-muted)', fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase' }}>Date</th>
                <th style={{ textAlign: 'left', padding: '12px 16px', color: 'var(--color-text-muted)', fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase' }}>Type</th>
                <th style={{ textAlign: 'left', padding: '12px 16px', color: 'var(--color-text-muted)', fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase' }}>Category</th>
                <th style={{ textAlign: 'left', padding: '12px 16px', color: 'var(--color-text-muted)', fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase' }}>Recipient / Student</th>
                <th style={{ textAlign: 'right', padding: '12px 16px', color: 'var(--color-text-muted)', fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase' }}>Amount</th>
                <th style={{ textAlign: 'center', padding: '12px 16px', color: 'var(--color-text-muted)', fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map(s => (
                <tr key={s.id} onClick={() => setSelectedTxn(s)} style={{ cursor: 'pointer', transition: 'all 0.2s', borderBottom: '1px solid var(--color-border)' }} onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(248,250,252,0.6)'} onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                  <td style={{ padding: '16px', fontWeight: 700, color: '#1e293b' }}>{s.refId}</td>
                  <td style={{ padding: '16px', color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>{s.date}</td>
                  <td style={{ padding: '16px' }}>
                    <span style={{ color: s.type === 'Fee Collection' ? '#4F46E5' : '#0F766E', fontWeight: 700, fontSize: '0.9rem' }}>
                      {s.type}
                    </span>
                  </td>
                  <td style={{ padding: '16px', color: '#475569', fontWeight: 500, fontSize: '0.9rem' }}>{s.category}</td>
                  <td style={{ padding: '16px', color: '#475569', fontSize: '0.9rem' }}>{s.type === 'Fee Collection' ? s.student : 'Staff/Vendor'}</td>
                  <td style={{ padding: '16px', fontWeight: 800, textAlign: 'right', color: '#1e293b' }}>{formatCurrency(s.amount)}</td>
                  <td style={{ padding: '16px', textAlign: 'center' }}>
                    <span style={{ padding: '6px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700, backgroundColor: s.status === 'Completed' ? 'rgba(79,70,229,0.1)' : 'rgba(245,158,11,0.1)', color: s.status === 'Completed' ? '#4F46E5' : '#d97706' }}>
                      {s.status}
                    </span>
                  </td>
                </tr>
              ))}
              {paginated.length === 0 && (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '60px', color: 'var(--color-text-muted)', fontSize: '1rem' }}>
                    No transactions found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex-between" style={{ padding: '16px 24px', borderTop: '1px solid var(--color-border)', background: 'rgba(248,250,252,0.3)', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
          <div style={{ fontWeight: 500 }}>Showing {paginated.length} of {filtered.length} results</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '6px', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', color: '#1e293b' }} className={currentPage === 1 ? '' : 'hover-lift'}><ChevronLeft size={16} /></button>
            <span style={{ fontWeight: 600, color: '#1e293b' }}>Page {currentPage} of {totalPages || 1}</span>
            <button disabled={currentPage >= totalPages} onClick={() => setCurrentPage(p => p + 1)} style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '6px', cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer', color: '#1e293b' }} className={currentPage >= totalPages ? '' : 'hover-lift'}><ChevronRight size={16} /></button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Finance;
