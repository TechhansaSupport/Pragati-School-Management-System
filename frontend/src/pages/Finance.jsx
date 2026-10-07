import React, { useState, useMemo } from 'react';
import { Search, MoreVertical, CreditCard, ChevronLeft, ChevronRight, Download } from 'lucide-react';

const mockTransactions = Array.from({ length: 45 }).map((_, i) => ({
  id: i + 1,
  refId: `TXN-2023-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`,
  type: Math.random() > 0.4 ? 'Fee Collection' : 'Expense',
  category: ['Tuition', 'Transport', 'Salary', 'Maintenance', 'Library'][Math.floor(Math.random() * 5)],
  amount: Math.floor(Math.random() * 50000 + 1000),
  date: `08/${String(Math.floor(Math.random() * 30 + 1)).padStart(2, '0')}/23`,
  status: Math.random() > 0.1 ? 'Completed' : 'Pending',
}));

const Finance = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const filtered = useMemo(() => {
    return mockTransactions.filter(s => s.refId.toLowerCase().includes(searchQuery.toLowerCase()) || s.category.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [searchQuery]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const formatCurrency = (val) => `₹${val.toLocaleString()}`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%', height: '100%' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px' }}>
        {[
          { label: 'Total Collections (YTD)', value: '₹1.4Cr', color: 'var(--color-green)' },
          { label: 'Total Expenses (YTD)', value: '₹85L', color: 'var(--color-red)' },
          { label: 'Pending Fees', value: '₹12.5L', color: 'var(--color-yellow)' },
          { label: 'Available Balance', value: '₹55L', color: 'var(--color-text-main)' }
        ].map((kpi, i) => (
          <div key={i} className="card">
            <div className="metric-label">{kpi.label}</div>
            <div className="metric-value" style={{ color: kpi.color, marginBottom: 0 }}>{kpi.value}</div>
          </div>
        ))}
      </div>

      <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <div className="card-header">
          <div className="card-title">Transaction Ledger</div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <div className="table-search" style={{ margin: 0 }}>
              <Search size={16} style={{ position: 'absolute', left: '10px', top: '9px', color: '#6B7280' }} />
              <input 
                type="text" 
                placeholder="Search Ref ID or Category..." 
                value={searchQuery}
                onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                style={{ outline: 'none', width: '250px' }}
              />
            </div>
            <button className="btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Download size={16} /> Export CSV
            </button>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th>Reference ID</th>
                <th>Date</th>
                <th>Type</th>
                <th>Category</th>
                <th>Amount</th>
                <th>Status</th>
                <th style={{ width: '40px' }}></th>
              </tr>
            </thead>
            <tbody>
              {paginated.map(s => (
                <tr key={s.id}>
                  <td style={{ fontWeight: 500 }}>{s.refId}</td>
                  <td className="text-muted">{s.date}</td>
                  <td>
                    <span style={{ color: s.type === 'Fee Collection' ? 'var(--color-green)' : 'var(--color-red)' }}>
                      {s.type}
                    </span>
                  </td>
                  <td className="text-muted">{s.category}</td>
                  <td style={{ fontWeight: 600 }}>{formatCurrency(s.amount)}</td>
                  <td>
                    <span style={{ padding: '4px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600, backgroundColor: s.status === 'Completed' ? '#dcfce7' : '#fef08a', color: s.status === 'Completed' ? '#166534' : '#854d0e' }}>
                      {s.status}
                    </span>
                  </td>
                  <td className="text-muted"><MoreVertical size={16} style={{ cursor: 'pointer' }} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex-between text-muted" style={{ marginTop: '16px', fontSize: '0.85rem' }}>
          <div>Showing {paginated.length} of {filtered.length} results</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} style={{ background: 'none', border: 'none', cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}><ChevronLeft size={16} /></button>
            <span>{currentPage} / {totalPages || 1}</span>
            <button disabled={currentPage >= totalPages} onClick={() => setCurrentPage(p => p + 1)} style={{ background: 'none', border: 'none', cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer' }}><ChevronRight size={16} /></button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Finance;
