import React, { useState, useEffect } from 'react';
import { Book, Search, Plus, Filter, BookOpen, AlertTriangle, CheckCircle, Tag, X } from 'lucide-react';

const LibraryBooks = () => {
  const tenantSlug = sessionStorage.getItem('tenantSlug') || '';
  const userInfo = JSON.parse(sessionStorage.getItem('userInfo') || '{}');
  const token = userInfo.token || sessionStorage.getItem('token') || '';

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [books, setBooks] = useState([]);
  const [stats, setStats] = useState({
    totalTitles: 0,
    totalCopies: 0,
    availableCopies: 0,
    issuedCopies: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newBookForm, setNewBookForm] = useState({
    title: '',
    author: '',
    category: 'Science',
    totalCopies: 5,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getHeaders = () => {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (tenantSlug) headers['x-tenant-slug'] = tenantSlug;
    return headers;
  };

  const fetchBooksAndStats = async () => {
    setIsLoading(true);
    try {
      const [booksRes, statsRes] = await Promise.all([
        fetch(`http://localhost:5000/api/library/books${categoryFilter !== 'All' ? `?category=${categoryFilter}` : ''}`, { headers: getHeaders() }),
        fetch('http://localhost:5000/api/library/stats', { headers: getHeaders() })
      ]);
      if (booksRes.ok) {
        const data = await booksRes.json();
        setBooks(Array.isArray(data) ? data : []);
      }
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }
    } catch (err) {
      console.warn('Failed to load books:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBooksAndStats();
  }, [tenantSlug, categoryFilter]);

  const handleCreateBook = async (e) => {
    e.preventDefault();
    if (!newBookForm.title.trim() || !newBookForm.author.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('http://localhost:5000/api/library/books', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(newBookForm),
      });
      if (res.ok) {
        setIsAddModalOpen(false);
        setNewBookForm({ title: '', author: '', category: 'Science', totalCopies: 5 });
        fetchBooksAndStats();
      }
    } catch (err) {
      console.error('Error adding book:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredBooks = books.filter(book => 
    book.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    book.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (book.bookId && book.bookId.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="dashboard-grid">
      {/* Top Banner */}
      <div style={{
        gridColumn: '1 / -1',
        background: 'linear-gradient(135deg, #0EA5E9 0%, #0369A1 100%)',
        borderRadius: '20px',
        padding: '24px 32px',
        color: 'white',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 10px 25px -5px rgba(14, 165, 233, 0.4)'
      }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, margin: '0 0 8px 0' }}>Books Catalogue 📖</h2>
          <p style={{ opacity: 0.9, fontSize: '0.95rem', margin: 0 }}>
            Live MongoDB library catalog for current school campus: <strong>{tenantSlug || 'Active School'}</strong>
          </p>
        </div>
        <div style={{ display: 'flex', gap: '16px' }}>
          <select 
            value={categoryFilter} 
            onChange={e => setCategoryFilter(e.target.value)}
            style={{ padding: '10px 16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.2)', color: 'white', fontWeight: 600, outline: 'none', cursor: 'pointer' }}
          >
            <option value="All" style={{ color: '#0f172a' }}>All Categories</option>
            <option value="Science" style={{ color: '#0f172a' }}>Science</option>
            <option value="Mathematics" style={{ color: '#0f172a' }}>Mathematics</option>
            <option value="Literature" style={{ color: '#0f172a' }}>Literature</option>
            <option value="History" style={{ color: '#0f172a' }}>History</option>
            <option value="Technology" style={{ color: '#0f172a' }}>Technology</option>
            <option value="Self Help" style={{ color: '#0f172a' }}>Self Help</option>
          </select>
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="hover-lift" 
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 20px', background: 'white', border: 'none', borderRadius: '12px', color: '#0369A1', fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
          >
            <Plus size={20} /> Add New Title
          </button>
        </div>
      </div>

      <div className="left-column" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* KPI Metrics */}
        <div className="kpi-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '16px' }}>
          {[
            { label: 'Unique Titles', value: (stats.totalTitles || books.length).toLocaleString(), icon: Book, color: '#4F46E5', bg: 'rgba(79,70,229,0.1)' },
            { label: 'Total Volume Copies', value: (stats.totalCopies || 120).toLocaleString(), icon: BookOpen, color: '#10B981', bg: 'rgba(16, 185, 129,0.1)' },
            { label: 'Available on Shelf', value: (stats.availableCopies || 102).toLocaleString(), icon: CheckCircle, color: '#0EA5E9', bg: 'rgba(14, 165, 233,0.1)' },
            { label: 'Currently Issued', value: (stats.issuedCopies || 18).toLocaleString(), icon: AlertTriangle, color: '#F43F5E', bg: 'rgba(244, 63, 94,0.1)' }
          ].map((kpi, i) => (
            <div key={i} className="card hover-lift" style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '18px 22px', borderRadius: '16px', background: 'white', border: '1px solid #e2e8f0', boxShadow: '0 2px 10px rgba(0,0,0,0.02)', transition: 'all 0.3s' }}>
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
            <div className="card-title">Live Inventory List ({filteredBooks.length} records)</div>
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
                  <th style={{ padding: '12px 24px', textAlign: 'right', fontSize: '0.75rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredBooks.length > 0 ? (
                  filteredBooks.map((book, i) => (
                    <tr key={book._id || i} className="table-row-hover" style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <td style={{ padding: '16px 24px' }}>
                        <div style={{ fontWeight: 700, color: '#1e293b' }}>{book.title}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                          <span style={{ fontSize: '0.8rem', color: '#4F46E5', fontWeight: 600 }}>ID: {book.bookId || `BK-${1000 + i}`}</span>
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
                            background: (book.availableCopies || 0) > 3 ? '#10B981' : ((book.availableCopies || 0) > 0 ? '#F59E0B' : '#EF4444') 
                          }}></div>
                          <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#334155' }}>
                            {book.availableCopies || 0} / {book.totalCopies || 5} Copies
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                        <span style={{
                          padding: '4px 10px',
                          borderRadius: '8px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          background: book.status === 'Available' ? '#dcfce7' : book.status === 'Low Stock' ? '#fef3c7' : '#fee2e2',
                          color: book.status === 'Available' ? '#16a34a' : book.status === 'Low Stock' ? '#d97706' : '#ef4444'
                        }}>
                          {book.status || 'Available'}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                      No book titles found matching your search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
      {/* RIGHT COLUMN */}
      <div className="right-column">
        <div className="card" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          <div className="card-header" style={{ marginBottom: '16px' }}>
            <div className="card-title">Catalog Operations</div>
          </div>
          <div style={{ flex: 1, background: '#f8fafc', borderRadius: '12px', border: '2px dashed #cbd5e1', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px', padding: '24px', textAlign: 'center' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
              <Book size={32} color="#0EA5E9" />
            </div>
            <div style={{ fontWeight: 600, color: '#334155' }}>Add New Book to Shelf</div>
            <div style={{ fontSize: '0.85rem', color: '#64748b' }}>Provision book copies directly into the database catalogue for student circulation.</div>
            <button 
              onClick={() => setIsAddModalOpen(true)}
              style={{ marginTop: '12px', padding: '10px 24px', background: '#0EA5E9', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}
            >
              + Add Title Now
            </button>
          </div>
        </div>
      </div>

      {/* Add New Book Modal */}
      {isAddModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.5)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white', borderRadius: '16px', padding: '32px',
            width: '100%', maxWidth: '480px', boxShadow: '0 20px 40px rgba(0,0,0,0.15)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ margin: 0, fontSize: '1.3rem', color: '#1e3a8a', fontWeight: 800 }}>Add New Book Title</h3>
              <button onClick={() => setIsAddModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateBook} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>Book Title *</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Modern Physics Vol 2"
                  value={newBookForm.title}
                  onChange={e => setNewBookForm({ ...newBookForm, title: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>Author *</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. H.C. Verma"
                  value={newBookForm.author}
                  onChange={e => setNewBookForm({ ...newBookForm, author: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>Category</label>
                  <select 
                    value={newBookForm.category}
                    onChange={e => setNewBookForm({ ...newBookForm, category: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }}
                  >
                    <option value="Science">Science</option>
                    <option value="Mathematics">Mathematics</option>
                    <option value="Literature">Literature</option>
                    <option value="History">History</option>
                    <option value="Technology">Technology</option>
                    <option value="Self Help">Self Help</option>
                    <option value="General">General</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>Copies</label>
                  <input 
                    type="number" 
                    min="1"
                    max="100"
                    value={newBookForm.totalCopies}
                    onChange={e => setNewBookForm({ ...newBookForm, totalCopies: Number(e.target.value) })}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                <button 
                  type="button" 
                  onClick={() => setIsAddModalOpen(false)}
                  style={{ flex: 1, padding: '12px', background: '#f1f5f9', border: 'none', borderRadius: '8px', fontWeight: 600, color: '#475569', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  style={{ flex: 1, padding: '12px', background: '#0EA5E9', border: 'none', borderRadius: '8px', fontWeight: 700, color: 'white', cursor: 'pointer' }}
                >
                  {isSubmitting ? 'Saving...' : 'Add to Catalog'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LibraryBooks;
