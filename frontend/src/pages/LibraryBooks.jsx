import React, { useState } from 'react';
import { Book, Search, Plus, Filter, BookOpen, AlertTriangle, CheckCircle, Tag } from 'lucide-react';

const mockBooks = [
  { id: 'BK-1001', title: 'Harry Potter and the Sorcerer\'s Stone', author: 'J.K. Rowling', category: 'Fiction', total: 12, available: 3, status: 'Low Stock' },
  { id: 'BK-1002', title: 'Concepts of Physics Vol 1', author: 'H.C. Verma', category: 'Science', total: 25, available: 15, status: 'Available' },
  { id: 'BK-1003', title: 'Atomic Habits', author: 'James Clear', category: 'Self Help', total: 8, available: 0, status: 'Issued Out' },
  { id: 'BK-1004', title: 'History of Modern India', author: 'Bipan Chandra', category: 'History', total: 10, available: 8, status: 'Available' },
  { id: 'BK-1005', title: 'To Kill a Mockingbird', author: 'Harper Lee', category: 'Literature', total: 15, available: 5, status: 'Available' },
  { id: 'BK-1006', title: 'Advanced Engineering Mathematics', author: 'Erwin Kreyszig', category: 'Mathematics', total: 5, available: 1, status: 'Low Stock' },
];

const LibraryBooks = () => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredBooks = mockBooks.filter(book => 
    book.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    book.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
    book.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="dashboard-grid">
      {/* Top Banner */}
      <div style={{
        gridColumn: '1 / -1',
        background: 'linear-gradient(135deg, #0EA5E9 0%, #0369A1 100%)',
        borderRadius: '16px',
        padding: '24px 32px',
        color: 'white',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 10px 25px -5px rgba(14, 165, 233, 0.4)'
      }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, margin: '0 0 8px 0' }}>Books Catalogue 📖</h2>
          <p style={{ opacity: 0.9, fontSize: '0.95rem', margin: 0 }}>Manage the entire library inventory, track book availability, and categorize titles.</p>
        </div>
        <div style={{ display: 'flex', gap: '16px' }}>
          <button className="hover-lift" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 20px', background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.4)', borderRadius: '12px', color: 'white', fontWeight: 700, cursor: 'pointer', backdropFilter: 'blur(10px)' }}>
            <Filter size={20} /> Filter Categories
          </button>
          <button className="hover-lift" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 20px', background: 'white', border: 'none', borderRadius: '12px', color: '#0369A1', fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
            <Plus size={20} /> Add New Title
          </button>
        </div>
      </div>

      <div className="left-column" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* KPI Metrics */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          {[
            { label: 'Unique Titles', value: '4,280', icon: Book, color: '#4F46E5', bg: 'rgba(79,70,229,0.1)' },
            { label: 'Total Copies', value: '12,450', icon: BookOpen, color: '#10B981', bg: 'rgba(16, 185, 129,0.1)' },
            { label: 'Currently Available', value: '11,022', icon: CheckCircle, color: '#0EA5E9', bg: 'rgba(14, 165, 233,0.1)' },
            { label: 'Lost / Damaged', value: '18', icon: AlertTriangle, color: '#F43F5E', bg: 'rgba(244, 63, 94,0.1)' }
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

        {/* Books List */}
        <div className="card" style={{ flex: 1, padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div className="card-header" style={{ padding: '24px 24px 16px 24px' }}>
            <div className="card-title">Inventory List</div>
            <div className="table-search" style={{ margin: 0, background: 'rgba(248,250,252,0.8)', border: '1px solid rgba(226,232,240,0.8)', borderRadius: '12px' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '10px', color: '#64748B' }} />
              <input 
                type="text" 
                placeholder="Search book title, author, or ID..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ outline: 'none', width: '280px', padding: '10px 10px 10px 36px', background: 'transparent', border: 'none', fontSize: '0.9rem' }}
              />
            </div>
          </div>
          
          <div style={{ overflowX: 'auto', flex: 1 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--color-bg)', borderBottom: '1px solid var(--color-border)' }}>
                  <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '0.75rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Book Details</th>
                  <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '0.75rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Category</th>
                  <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '0.75rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Availability</th>
                  <th style={{ padding: '12px 24px', textAlign: 'right', fontSize: '0.75rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredBooks.map((book, i) => (
                  <tr key={i} className="table-row-hover" style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td style={{ padding: '16px 24px' }}>
                      <div style={{ fontWeight: 700, color: '#1e293b' }}>{book.title}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                        <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 500 }}>ID: {book.id}</span>
                        <span style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>•</span>
                        <span style={{ fontSize: '0.8rem', color: '#64748b' }}>By {book.author}</span>
                      </div>
                    </td>
                    <td style={{ padding: '16px 24px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Tag size={14} color="#0EA5E9" />
                        <span style={{ fontSize: '0.9rem', color: '#334155', fontWeight: 500 }}>{book.category}</span>
                      </div>
                    </td>
                    <td style={{ padding: '16px 24px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ 
                          width: '8px', 
                          height: '8px', 
                          borderRadius: '50%', 
                          background: book.available > 5 ? '#10B981' : (book.available > 0 ? '#F59E0B' : '#EF4444') 
                        }}></div>
                        <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#334155' }}>
                          {book.available} / {book.total} Copies
                        </span>
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '4px' }}>{book.status}</div>
                    </td>
                    <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                      <button className="btn-outline" style={{ fontSize: '0.75rem', padding: '6px 12px' }}>Manage Copies</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
      {/* RIGHT COLUMN - QUICK ACTIONS & SYNC */}
      <div className="right-column">
        <div className="card" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          <div className="card-header" style={{ marginBottom: '16px' }}>
            <div className="card-title">Library Barcode Scanner</div>
          </div>
          <div style={{ flex: 1, background: '#f8fafc', borderRadius: '12px', border: '2px dashed #cbd5e1', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px', padding: '24px', textAlign: 'center' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
              <Search size={32} color="#0EA5E9" />
            </div>
            <div style={{ fontWeight: 600, color: '#334155' }}>Scan Book Barcode</div>
            <div style={{ fontSize: '0.85rem', color: '#64748b' }}>Connect a barcode scanner or use the camera to quickly issue, return, or check inventory details.</div>
            <button style={{ marginTop: '12px', padding: '8px 24px', background: '#0EA5E9', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}>
              Activate Camera
            </button>
          </div>

          <div style={{ marginTop: '24px' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '12px' }}>Categories Distribution</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                { name: 'Science & Tech', percent: '35%', color: '#3b82f6' },
                { name: 'Fiction & Literature', percent: '25%', color: '#8b5cf6' },
                { name: 'History & Arts', percent: '20%', color: '#f59e0b' },
                { name: 'Reference Materials', percent: '20%', color: '#10b981' },
              ].map((cat, i) => (
                <div key={i}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '4px', fontWeight: 500, color: '#334155' }}>
                    <span>{cat.name}</span>
                    <span>{cat.percent}</span>
                  </div>
                  <div style={{ width: '100%', height: '6px', background: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ width: cat.percent, height: '100%', background: cat.color, borderRadius: '3px' }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LibraryBooks;
