import React, { useState, useMemo } from 'react';
import { Search, MoreVertical, User, ChevronLeft, ChevronRight, Plus } from 'lucide-react';

const mockStaff = Array.from({ length: 25 }).map((_, i) => ({
  id: i + 1,
  name: `Staff Member ${i + 1}`,
  role: ['Teacher', 'Administrator', 'Support Staff', 'Librarian'][Math.floor(Math.random() * 4)],
  department: ['Science', 'Mathematics', 'Languages', 'Administration', 'Sports'][Math.floor(Math.random() * 5)],
  status: Math.random() > 0.2 ? 'Active' : 'On Leave',
  color: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'][Math.floor(Math.random() * 5)]
}));

const Staff = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const filtered = useMemo(() => {
    return mockStaff.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()) || s.role.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [searchQuery]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%', height: '100%' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px' }}>
        {[
          { label: 'Total Staff', value: '142', color: 'var(--color-text-main)' },
          { label: 'Teaching Staff', value: '98', color: 'var(--color-text-main)' },
          { label: 'Admin & Support', value: '44', color: 'var(--color-text-main)' },
          { label: 'On Leave', value: '5', color: 'var(--color-yellow)' }
        ].map((kpi, i) => (
          <div key={i} className="card">
            <div className="metric-label">{kpi.label}</div>
            <div className="metric-value" style={{ color: kpi.color, marginBottom: 0 }}>{kpi.value}</div>
          </div>
        ))}
      </div>

      <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <div className="card-header">
          <div className="card-title">Staff Directory</div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <div className="table-search" style={{ margin: 0 }}>
              <Search size={16} style={{ position: 'absolute', left: '10px', top: '9px', color: '#6B7280' }} />
              <input 
                type="text" 
                placeholder="Search staff or role..." 
                value={searchQuery}
                onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                style={{ outline: 'none' }}
              />
            </div>
            <button className="btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'var(--color-text-main)', color: 'white' }}>
              <Plus size={16} /> Add Staff
            </button>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th>Staff Name</th>
                <th>Role</th>
                <th>Department</th>
                <th>Status</th>
                <th style={{ width: '40px' }}></th>
              </tr>
            </thead>
            <tbody>
              {paginated.map(s => (
                <tr key={s.id}>
                  <td>
                    <div className="company-cell">
                      <div className="company-icon" style={{ backgroundColor: s.color + '15', color: s.color }}><User size={14} /></div>
                      {s.name}
                    </div>
                  </td>
                  <td>{s.role}</td>
                  <td className="text-muted">{s.department}</td>
                  <td>
                    <span style={{ padding: '4px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600, backgroundColor: s.status === 'Active' ? '#dcfce7' : '#fef08a', color: s.status === 'Active' ? '#166534' : '#854d0e' }}>
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

export default Staff;
