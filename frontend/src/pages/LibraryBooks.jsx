import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { 
  Book, Search, Plus, Filter, BookOpen, AlertTriangle, CheckCircle, Tag, X,
  Barcode, Printer, Download, UploadCloud, Layers, Sparkles, RefreshCw, 
  ArrowRight, Check, BookMarked, FileSpreadsheet, Eye, FileText, Trash2, AlertCircle
} from 'lucide-react';

const LibraryBooks = () => {
  const navigate = useNavigate();
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

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  // New Book Form
  const [newBookForm, setNewBookForm] = useState({
    title: '',
    author: '',
    category: 'Science',
    totalCopies: 5,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Bulk Import state
  const [bulkTab, setBulkTab] = useState('upload'); // 'upload' | 'paste'
  const [bulkData, setBulkData] = useState('');
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isBulkSubmitting, setIsBulkSubmitting] = useState(false);

  // Barcode / Shelf Scanner
  const [barcodeInput, setBarcodeInput] = useState('');
  const [scanResult, setScanResult] = useState(null);

  // Toast Notification
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3500);
  };

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

  // Create Single Book
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
        showToast(`Book "${newBookForm.title}" added to catalog shelf!`, 'success');
        fetchBooksAndStats();
      } else {
        showToast('Failed to add book title', 'error');
      }
    } catch (err) {
      console.error('Error adding book:', err);
      showToast('Server error while saving book', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Process Parsed Rows from CSV / Text
  const parsedRows = bulkData
    .split('\n')
    .map(line => line.trim())
    .filter(line => line && !line.toLowerCase().startsWith('title,') && !line.toLowerCase().startsWith('book title,'))
    .map((line, idx) => {
      const parts = line.split(',').map(p => p.trim());
      const title = parts[0] || '';
      const author = parts[1] || '';
      const category = parts[2] || 'General';
      const copies = parseInt(parts[3], 10) || 5;
      const isValid = Boolean(title.length >= 2 && author.length >= 2);
      return { id: idx, title, author, category, copies, isValid };
    });

  // Handle CSV File Upload
  const processCsvFile = (file) => {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.csv') && file.type !== 'text/csv') {
      showToast('Please upload a valid .csv file', 'error');
      return;
    }
    setUploadedFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result;
      if (typeof content === 'string') {
        setBulkData(content);
        showToast(`Loaded "${file.name}" with data preview!`, 'success');
      }
    };
    reader.readAsText(file);
  };

  // Download Sample Template CSV
  const handleDownloadSampleTemplate = () => {
    const sampleCsv = 
`Title, Author, Category, Copies
Organic Chemistry Reactions, Paula Bruice, Science, 8
Discrete Mathematics & Applications, Kenneth Rosen, Mathematics, 12
Clean Code: Agile Software Craftsmanship, Robert C. Martin, Technology, 6
Gitanjali & Selected Poems, Rabindranath Tagore, Literature, 15
India After Gandhi: History of the World's Largest Democracy, Ramachandra Guha, History, 10
The 7 Habits of Highly Effective People, Stephen R. Covey, Self Help, 7`;

    const blob = new Blob([sampleCsv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'pragati_catalog_import_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('Sample template downloaded!', 'success');
  };

  // Insert Sample Demo Template in Textarea
  const handleInsertSampleTemplate = () => {
    const sampleText = 
`Organic Chemistry Reactions, Paula Bruice, Science, 8
Discrete Mathematics & Applications, Kenneth Rosen, Mathematics, 12
Clean Code: Agile Software Craftsmanship, Robert C. Martin, Technology, 6
Gitanjali & Selected Poems, Rabindranath Tagore, Literature, 15
India After Gandhi, Ramachandra Guha, History, 10`;
    setBulkData(sampleText);
    setUploadedFileName('sample_demo_template.csv');
    showToast('Sample records loaded into preview!', 'success');
  };

  // Bulk Import Submit
  const handleBulkImport = async (e) => {
    if (e) e.preventDefault();
    const validRows = parsedRows.filter(r => r.isValid);
    if (!validRows.length) {
      showToast('No valid book records to import. Please check your data.', 'error');
      return;
    }

    setIsBulkSubmitting(true);
    try {
      let count = 0;
      for (const row of validRows) {
        const res = await fetch('http://localhost:5000/api/library/books', {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify({
            title: row.title,
            author: row.author,
            category: row.category,
            totalCopies: row.copies
          })
        });
        if (res.ok) count++;
      }

      showToast(`Successfully added ${count} new book titles into catalog!`, 'success');
      setIsBulkModalOpen(false);
      setBulkData('');
      setUploadedFileName('');
      fetchBooksAndStats();
    } catch (err) {
      console.error('Bulk import error:', err);
      showToast('Error during bulk catalog import', 'error');
    } finally {
      setIsBulkSubmitting(false);
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    if (!books.length) {
      showToast('No books in catalog to export', 'error');
      return;
    }
    const headers = ['Book ID', 'Title', 'Author', 'Category', 'Total Copies', 'Available Copies', 'Shelf Location', 'Status'];
    const rows = books.map((b, idx) => [
      `"${b.bookId || `BK-${1001 + idx}`}"`,
      `"${(b.title || '').replace(/"/g, '""')}"`,
      `"${(b.author || '').replace(/"/g, '""')}"`,
      `"${b.category || 'General'}"`,
      b.totalCopies || 5,
      b.availableCopies || 0,
      `"${getShelfLocation(b, idx)}"`,
      `"${b.status || 'Available'}"`
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `library_catalog_${tenantSlug || 'school'}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Catalog exported as CSV file!', 'success');
  };

  // Barcode / ISBN Scan
  const handleBarcodeSearch = (e) => {
    if (e) e.preventDefault();
    if (!barcodeInput.trim()) return;
    const q = barcodeInput.trim().toLowerCase();
    const match = books.find((b, idx) => 
      (b.bookId && b.bookId.toLowerCase() === q) ||
      b.title.toLowerCase().includes(q) ||
      b.author.toLowerCase().includes(q)
    );
    if (match) {
      setScanResult(match);
      setSearchQuery(match.title);
      showToast(`Book verified: ${match.title}`, 'success');
    } else {
      setScanResult({ notFound: true, query: barcodeInput });
      showToast('No matching book found in shelf inventory', 'error');
    }
  };

  // Compute Shelf Location
  const getShelfLocation = (book, index = 0) => {
    const cat = book.category || 'General';
    const prefixMap = {
      Science: 'SCI-A',
      Mathematics: 'MTH-B',
      Literature: 'LIT-C',
      History: 'HIS-D',
      Technology: 'TECH-E',
      'Self Help': 'SELF-F',
      General: 'GEN-G'
    };
    const prefix = prefixMap[cat] || 'GEN-G';
    const num = (book.bookId ? parseInt(book.bookId.replace(/\D/g, ''), 10) : (1001 + index)) % 4 + 1;
    return `Rack ${prefix}, Shelf ${num}`;
  };

  // Categories config
  const categoriesList = [
    { name: 'Science', color: '#0EA5E9' },
    { name: 'Mathematics', color: '#6366F1' },
    { name: 'Literature', color: '#EC4899' },
    { name: 'Technology', color: '#10B981' },
    { name: 'History', color: '#F59E0B' },
    { name: 'Self Help', color: '#8B5CF6' },
  ];

  const categoryCounts = books.reduce((acc, book) => {
    const cat = book.category || 'General';
    acc[cat] = (acc[cat] || 0) + (book.totalCopies || 1);
    return acc;
  }, {});

  const totalVolumeCopies = stats.totalCopies || books.reduce((acc, b) => acc + (b.totalCopies || 0), 0) || 120;
  const shelfCapacity = 250;
  const shelfUsagePercent = Math.min(100, Math.round((totalVolumeCopies / shelfCapacity) * 100));

  const filteredBooks = books.filter(book => 
    book.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    book.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (book.bookId && book.bookId.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="dashboard-grid">
      {/* Toast Notification (Portaled directly to document.body) */}
      {toast.show && createPortal(
        <div style={{
          position: 'fixed',
          top: '24px',
          right: '24px',
          zIndex: 99999999,
          padding: '12px 20px',
          borderRadius: '12px',
          background: toast.type === 'error' ? '#EF4444' : '#10B981',
          color: 'white',
          fontWeight: 700,
          fontSize: '0.9rem',
          boxShadow: '0 10px 25px rgba(0,0,0,0.25)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          animation: 'fadeIn 0.2s ease-out'
        }}>
          {toast.type === 'error' ? <AlertTriangle size={18} /> : <CheckCircle size={18} />}
          <span>{toast.message}</span>
        </div>,
        document.body
      )}

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
        flexWrap: 'wrap',
        gap: '16px',
        boxShadow: '0 10px 25px -5px rgba(14, 165, 233, 0.4)'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0 }}>Books Catalogue & Inventory 📖</h2>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, background: 'rgba(255,255,255,0.2)', padding: '4px 10px', borderRadius: '12px' }}>
              LIVE REPOSITORY
            </span>
          </div>
          <p style={{ margin: '6px 0 0 0', opacity: 0.9, fontSize: '0.9rem' }}>
            Central campus library database for circulation, cataloging, barcode tracking & shelf storage.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <select 
            value={categoryFilter} 
            onChange={e => setCategoryFilter(e.target.value)}
            style={{ 
              padding: '10px 16px', 
              borderRadius: '12px', 
              border: '1px solid rgba(255,255,255,0.4)', 
              background: 'rgba(255,255,255,0.2)', 
              color: 'white', 
              fontWeight: 600, 
              outline: 'none', 
              cursor: 'pointer' 
            }}
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
            onClick={handleExportCSV}
            className="hover-lift" 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px', 
              padding: '12px 18px', 
              background: 'rgba(255,255,255,0.15)', 
              border: '1px solid rgba(255,255,255,0.3)', 
              borderRadius: '12px', 
              color: 'white', 
              fontWeight: 700, 
              cursor: 'pointer' 
            }}
          >
            <Download size={18} /> Export
          </button>

          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="hover-lift" 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px', 
              padding: '12px 22px', 
              background: 'white', 
              border: 'none', 
              borderRadius: '12px', 
              color: '#0369A1', 
              fontWeight: 700, 
              cursor: 'pointer', 
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)' 
            }}
          >
            <Plus size={20} /> Add New Title
          </button>
        </div>
      </div>

      {/* LEFT COLUMN - INVENTORY & METRICS */}
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
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a' }}>{kpi.value}</div>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>{kpi.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Books List Table */}
        <div className="card" style={{ flex: 1, padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div className="card-header" style={{ padding: '24px 24px 16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <div className="card-title">Live Inventory List ({filteredBooks.length} records)</div>
              <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '2px' }}>
                {categoryFilter !== 'All' ? `Filtered by category: ${categoryFilter}` : 'Showing all classified catalogue records'}
              </div>
            </div>
            <div className="table-search" style={{ margin: 0, position: 'relative', background: 'rgba(248,250,252,0.8)', border: '1px solid rgba(226,232,240,0.8)', borderRadius: '12px' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: '#64748B' }} />
              <input 
                type="text" 
                placeholder="Search title, author, or ID..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ outline: 'none', width: '280px', padding: '10px 10px 10px 36px', background: 'transparent', border: 'none', fontSize: '0.9rem' }}
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} style={{ position: 'absolute', right: '10px', top: '10px', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
                  <X size={14} />
                </button>
              )}
            </div>
          </div>
          
          <div style={{ overflowX: 'auto', flex: 1 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '0.75rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Book Details</th>
                  <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '0.75rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Category & Location</th>
                  <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '0.75rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Availability</th>
                  <th style={{ padding: '12px 24px', textAlign: 'right', fontSize: '0.75rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredBooks.length > 0 ? (
                  filteredBooks.map((book, i) => (
                    <tr key={book._id || i} className="table-row-hover" style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '16px 24px' }}>
                        <div style={{ fontWeight: 700, color: '#1e293b' }}>{book.title}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                          <span style={{ fontSize: '0.8rem', color: '#4F46E5', fontWeight: 700, background: '#EEF2FF', padding: '2px 8px', borderRadius: '6px' }}>
                            {book.bookId || `BK-${1001 + i}`}
                          </span>
                          <span style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>•</span>
                          <span style={{ fontSize: '0.8rem', color: '#64748b' }}>By {book.author}</span>
                        </div>
                      </td>
                      <td style={{ padding: '16px 24px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Tag size={13} color="#0EA5E9" />
                            <span style={{ fontSize: '0.85rem', color: '#334155', fontWeight: 600 }}>{book.category || 'General'}</span>
                          </div>
                          <span style={{ fontSize: '0.75rem', color: '#64748b', background: '#f8fafc', padding: '2px 6px', borderRadius: '4px', width: 'fit-content' }}>
                            📍 {getShelfLocation(book, i)}
                          </span>
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
                          <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#334155' }}>
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
                          background: (book.availableCopies || 0) > 2 ? '#dcfce7' : (book.availableCopies || 0) > 0 ? '#fef3c7' : '#fee2e2',
                          color: (book.availableCopies || 0) > 2 ? '#16a34a' : (book.availableCopies || 0) > 0 ? '#d97706' : '#ef4444'
                        }}>
                          {(book.availableCopies || 0) > 2 ? 'Available' : (book.availableCopies || 0) > 0 ? 'Low Stock' : 'Issued Out'}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'center', padding: '48px 24px', color: '#94a3b8' }}>
                      <BookOpen size={40} color="#cbd5e1" style={{ margin: '0 auto 12px auto', display: 'block' }} />
                      <div style={{ fontWeight: 600, color: '#475569', fontSize: '1rem' }}>No book titles found matching your criteria.</div>
                      <div style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: '4px' }}>Try adjusting your search terms or clearing the category filter.</div>
                      {categoryFilter !== 'All' && (
                        <button 
                          onClick={() => setCategoryFilter('All')}
                          style={{ marginTop: '12px', padding: '6px 16px', background: '#e0f2fe', color: '#0284c7', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}
                        >
                          Clear Category Filter
                        </button>
                      )}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
      {/* RIGHT COLUMN - CATALOG OPERATIONS CONTROL SUITE */}
      <div className="right-column" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* Main Catalog Operations Panel */}
        <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(14, 165, 233, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Sparkles size={20} color="#0EA5E9" />
              </div>
              <div>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>Catalog Operations</div>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Provisioning & inventory controls</div>
              </div>
            </div>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, background: '#e0f2fe', color: '#0369a1', padding: '4px 10px', borderRadius: '12px' }}>
              Control Suite
            </span>
          </div>

          {/* Primary Action Button */}
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="hover-lift"
            style={{ 
              width: '100%', 
              padding: '14px 20px', 
              background: 'linear-gradient(135deg, #0EA5E9 0%, #0284C7 100%)', 
              color: 'white', 
              border: 'none', 
              borderRadius: '12px', 
              fontWeight: 700, 
              fontSize: '0.95rem',
              cursor: 'pointer', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              gap: '10px',
              boxShadow: '0 4px 14px rgba(14, 165, 233, 0.35)',
              transition: 'all 0.2s'
            }}
          >
            <Plus size={20} /> Add New Book Title
          </button>

          {/* Operational Tools Grid */}
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>
              Management Tools
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <button
                onClick={() => setIsBulkModalOpen(true)}
                className="hover-lift"
                style={{
                  padding: '12px',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  color: '#334155',
                  transition: 'all 0.2s'
                }}
              >
                <UploadCloud size={16} color="#0EA5E9" /> Bulk Import
              </button>

              <button
                onClick={handleExportCSV}
                className="hover-lift"
                style={{
                  padding: '12px',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  color: '#334155',
                  transition: 'all 0.2s'
                }}
              >
                <Download size={16} color="#10B981" /> Export CSV
              </button>

              <button
                onClick={() => setIsPrintModalOpen(true)}
                className="hover-lift"
                style={{
                  padding: '12px',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  color: '#334155',
                  transition: 'all 0.2s'
                }}
              >
                <Printer size={16} color="#6366F1" /> Print Labels
              </button>

              <button
                onClick={() => {
                  fetchBooksAndStats();
                  showToast('Catalog refreshed from MongoDB!', 'success');
                }}
                className="hover-lift"
                style={{
                  padding: '12px',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  color: '#334155',
                  transition: 'all 0.2s'
                }}
              >
                <RefreshCw size={16} color="#F59E0B" /> Sync DB
              </button>
            </div>
          </div>

          {/* Quick Barcode / ISBN Shelf Scanner */}
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', fontWeight: 700, color: '#334155' }}>
                <Barcode size={16} color="#4F46E5" /> Barcode & Shelf Scanner
              </div>
              <span style={{ fontSize: '0.7rem', color: '#64748b' }}>Instant Lookup</span>
            </div>
            
            <form onSubmit={handleBarcodeSearch} style={{ display: 'flex', gap: '8px' }}>
              <input 
                type="text"
                placeholder="Scan / Type Book ID (e.g. BK-1001)..."
                value={barcodeInput}
                onChange={e => setBarcodeInput(e.target.value)}
                style={{
                  flex: 1,
                  padding: '9px 12px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.82rem',
                  outline: 'none',
                  background: 'white'
                }}
              />
              <button
                type="submit"
                style={{
                  padding: '9px 14px',
                  background: '#4F46E5',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Verify
              </button>
            </form>

            {/* Scan Result Box */}
            {scanResult && (
              <div style={{ marginTop: '12px', padding: '12px', background: 'white', border: '1px solid #e2e8f0', borderRadius: '10px' }}>
                {scanResult.notFound ? (
                  <div style={{ fontSize: '0.8rem', color: '#ef4444', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>No record found for "{scanResult.query}".</span>
                    <button onClick={() => setScanResult(null)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontWeight: 700 }}>×</button>
                  </div>
                ) : (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#0f172a' }}>{scanResult.title}</div>
                      <button onClick={() => setScanResult(null)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '1.1rem', lineHeight: '1' }}>×</button>
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '2px' }}>By {scanResult.author} • <strong style={{ color: '#4F46E5' }}>{scanResult.bookId}</strong></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px', paddingTop: '8px', borderTop: '1px dashed #f1f5f9' }}>
                      <span style={{ fontSize: '0.75rem', color: '#0284c7', background: '#e0f2fe', padding: '2px 8px', borderRadius: '6px', fontWeight: 600 }}>
                        📍 {getShelfLocation(scanResult)}
                      </span>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: (scanResult.availableCopies || 0) > 0 ? '#16a34a' : '#ef4444' }}>
                        {scanResult.availableCopies || 0} Avail / {scanResult.totalCopies || 5}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Collection by Category Card */}
        <div className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px', background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Layers size={18} color="#0EA5E9" />
              <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#0f172a' }}>Category Distribution</div>
            </div>
            {categoryFilter !== 'All' ? (
              <button 
                onClick={() => setCategoryFilter('All')}
                style={{ background: 'none', border: 'none', color: '#0EA5E9', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', textDecoration: 'underline' }}
              >
                Reset Filter
              </button>
            ) : (
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Click to Filter</span>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {categoriesList.map((cat) => {
              const count = categoryCounts[cat.name] || 0;
              const percent = totalVolumeCopies > 0 ? Math.round((count / totalVolumeCopies) * 100) : 0;
              const isSelected = categoryFilter === cat.name;

              return (
                <div 
                  key={cat.name} 
                  onClick={() => setCategoryFilter(isSelected ? 'All' : cat.name)}
                  className="hover-lift"
                  style={{
                    cursor: 'pointer',
                    padding: '8px 10px',
                    borderRadius: '8px',
                    background: isSelected ? 'rgba(14, 165, 233, 0.08)' : '#fafafa',
                    border: isSelected ? '1px solid #0EA5E9' : '1px solid #f1f5f9',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: cat.color }} />
                      <span style={{ fontSize: '0.82rem', fontWeight: isSelected ? 700 : 600, color: '#334155' }}>{cat.name}</span>
                    </div>
                    <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748b' }}>
                      {count} copies ({percent}%)
                    </span>
                  </div>
                  <div style={{ width: '100%', height: '5px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${Math.max(4, percent)}%`, height: '100%', background: cat.color, borderRadius: '4px', transition: 'width 0.4s ease' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Shelf Capacity & Circulation Facility Card */}
        <div className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px', background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BookOpen size={18} color="#10B981" />
              <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#0f172a' }}>Shelf Space & Capacity</div>
            </div>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#10B981', background: '#dcfce7', padding: '2px 8px', borderRadius: '6px' }}>
              Optimal
            </span>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '6px' }}>
              <span style={{ color: '#64748b', fontWeight: 600 }}>Physical Storage Utilization</span>
              <span style={{ fontWeight: 800, color: '#0f172a' }}>{totalVolumeCopies} / {shelfCapacity} Volumes ({shelfUsagePercent}%)</span>
            </div>
            <div style={{ width: '100%', height: '8px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ width: `${shelfUsagePercent}%`, height: '100%', background: 'linear-gradient(90deg, #10B981, #0EA5E9)', borderRadius: '4px' }} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '4px' }}>
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '10px', textAlign: 'center' }}>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0EA5E9' }}>{stats.availableCopies || 102}</div>
              <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>On Campus Shelf</div>
            </div>
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '10px', textAlign: 'center' }}>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#F43F5E' }}>{stats.issuedCopies || 18}</div>
              <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>In Circulation</div>
            </div>
          </div>

          <button
            onClick={() => navigate(`/${tenantSlug}/library-dashboard`)}
            className="hover-lift"
            style={{
              marginTop: '4px',
              padding: '10px 14px',
              background: '#f1f5f9',
              border: '1px solid #cbd5e1',
              borderRadius: '10px',
              fontSize: '0.82rem',
              fontWeight: 700,
              color: '#334155',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            Open Circulation Desk <ArrowRight size={14} />
          </button>
        </div>

      </div>

      {/* Add New Book Modal (Portaled directly to document.body) */}
      {isAddModalOpen && createPortal(
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999999, padding: '24px', boxSizing: 'border-box'
        }}>
          <div style={{
            background: 'white', borderRadius: '20px', padding: '28px',
            width: '100%', maxWidth: '480px', maxHeight: 'calc(100vh - 48px)', overflowY: 'auto',
            boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.35)',
            boxSizing: 'border-box'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '1px solid #f1f5f9', paddingBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Plus size={22} color="#0284c7" />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#0f172a', fontWeight: 800 }}>Add New Book Title</h3>
                  <div style={{ fontSize: '0.78rem', color: '#64748b' }}>Register title into school central catalogue</div>
                </div>
              </div>
              <button onClick={() => setIsAddModalOpen(false)} style={{ background: '#f1f5f9', border: 'none', borderRadius: '8px', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748b' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateBook} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>Book Title *</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Modern Physics Vol 2"
                  value={newBookForm.title}
                  onChange={e => setNewBookForm({ ...newBookForm, title: e.target.value })}
                  style={{ width: '100%', padding: '11px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', outline: 'none', boxSizing: 'border-box', fontSize: '0.9rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>Author / Publisher *</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. H.C. Verma / Bharti Bhawan"
                  value={newBookForm.author}
                  onChange={e => setNewBookForm({ ...newBookForm, author: e.target.value })}
                  style={{ width: '100%', padding: '11px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', outline: 'none', boxSizing: 'border-box', fontSize: '0.9rem' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>Category</label>
                  <select 
                    value={newBookForm.category}
                    onChange={e => setNewBookForm({ ...newBookForm, category: e.target.value })}
                    style={{ width: '100%', padding: '11px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', outline: 'none', boxSizing: 'border-box', fontSize: '0.9rem' }}
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
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>Copies to Add</label>
                  <input 
                    type="number" 
                    min="1"
                    max="100"
                    value={newBookForm.totalCopies}
                    onChange={e => setNewBookForm({ ...newBookForm, totalCopies: Number(e.target.value) })}
                    style={{ width: '100%', padding: '11px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', outline: 'none', boxSizing: 'border-box', fontSize: '0.9rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                <button 
                  type="button" 
                  onClick={() => setIsAddModalOpen(false)}
                  style={{ flex: 1, padding: '12px', background: '#f1f5f9', border: 'none', borderRadius: '10px', fontWeight: 600, color: '#475569', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  style={{ flex: 1, padding: '12px', background: 'linear-gradient(135deg, #0EA5E9 0%, #0284C7 100%)', border: 'none', borderRadius: '10px', fontWeight: 700, color: 'white', cursor: 'pointer', boxShadow: '0 4px 12px rgba(14, 165, 233, 0.3)' }}
                >
                  {isSubmitting ? 'Saving...' : 'Add to Catalog'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Bulk Import Modal (Portaled directly to document.body with max zIndex) */}
      {isBulkModalOpen && createPortal(
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999999, padding: '24px', boxSizing: 'border-box'
        }}>
          <div style={{
            background: 'white', borderRadius: '20px', padding: '28px',
            width: '100%', maxWidth: '680px', maxHeight: 'calc(100vh - 48px)', overflowY: 'auto',
            boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.35)',
            display: 'flex', flexDirection: 'column', gap: '20px',
            boxSizing: 'border-box'
          }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #f1f5f9', paddingBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(14, 165, 233, 0.15)' }}>
                  <UploadCloud size={22} color="#0284c7" />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#0f172a', fontWeight: 800 }}>Bulk Catalog CSV Import</h3>
                  <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '2px' }}>
                    Upload a .csv file or paste raw rows to provision multiple books at once
                  </div>
                </div>
              </div>
              <button 
                onClick={() => {
                  setIsBulkModalOpen(false);
                  setBulkData('');
                  setUploadedFileName('');
                }} 
                style={{ background: '#f1f5f9', border: 'none', borderRadius: '8px', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748b' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Mode Switch Tabs */}
            <div style={{ display: 'flex', background: '#f8fafc', padding: '4px', borderRadius: '10px', border: '1px solid #e2e8f0', gap: '4px' }}>
              <button
                type="button"
                onClick={() => setBulkTab('upload')}
                style={{
                  flex: 1,
                  padding: '9px 14px',
                  borderRadius: '8px',
                  border: 'none',
                  background: bulkTab === 'upload' ? 'white' : 'transparent',
                  color: bulkTab === 'upload' ? '#0369a1' : '#64748b',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  boxShadow: bulkTab === 'upload' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
                  transition: 'all 0.2s'
                }}
              >
                <FileSpreadsheet size={16} /> Upload CSV File
              </button>
              <button
                type="button"
                onClick={() => setBulkTab('paste')}
                style={{
                  flex: 1,
                  padding: '9px 14px',
                  borderRadius: '8px',
                  border: 'none',
                  background: bulkTab === 'paste' ? 'white' : 'transparent',
                  color: bulkTab === 'paste' ? '#0369a1' : '#64748b',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  boxShadow: bulkTab === 'paste' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
                  transition: 'all 0.2s'
                }}
              >
                <FileText size={16} /> Paste Raw Text / CSV
              </button>
            </div>

            {/* TAB 1: FILE DRAG & DROP */}
            {bulkTab === 'upload' ? (
              <div>
                <div
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                    const file = e.dataTransfer.files?.[0];
                    if (file) processCsvFile(file);
                  }}
                  style={{
                    border: `2px dashed ${isDragging ? '#0EA5E9' : '#cbd5e1'}`,
                    background: isDragging ? '#f0f9ff' : '#f8fafc',
                    borderRadius: '14px',
                    padding: '30px 20px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    position: 'relative'
                  }}
                >
                  <input
                    type="file"
                    accept=".csv,text/csv"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) processCsvFile(file);
                    }}
                    style={{
                      position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                      opacity: 0, cursor: 'pointer'
                    }}
                  />
                  <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px auto', boxShadow: '0 2px 10px rgba(0,0,0,0.06)' }}>
                    <UploadCloud size={28} color="#0EA5E9" />
                  </div>
                  <div style={{ fontWeight: 700, color: '#1e293b', fontSize: '0.95rem' }}>
                    {uploadedFileName ? uploadedFileName : 'Click to browse or drag & drop your .csv file here'}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '4px' }}>
                    Standard Comma Separated Values (.csv) up to 5MB
                  </div>
                </div>

                {uploadedFileName && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', padding: '10px 14px', background: '#ecfdf5', borderRadius: '10px', border: '1px solid #a7f3d0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: '#065f46', fontWeight: 600 }}>
                      <CheckCircle size={18} color="#10B981" />
                      <span>Loaded: <strong>{uploadedFileName}</strong> ({parsedRows.length} titles parsed)</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => { setBulkData(''); setUploadedFileName(''); }}
                      style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      <Trash2 size={14} /> Remove
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* TAB 2: PASTE RAW TEXT */
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155' }}>
                    Paste CSV Data (One book per row):
                  </label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={handleInsertSampleTemplate}
                      style={{ padding: '4px 10px', background: '#e0f2fe', color: '#0284c7', border: 'none', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
                    >
                      Load Sample Demo
                    </button>
                    {bulkData && (
                      <button
                        type="button"
                        onClick={() => { setBulkData(''); setUploadedFileName(''); }}
                        style={{ padding: '4px 10px', background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
                      >
                        Clear Text
                      </button>
                    )}
                  </div>
                </div>
                <textarea
                  rows="6"
                  required
                  placeholder="Title, Author, Category, Copies&#10;e.g. Modern Physics Vol 2, H.C. Verma, Science, 10&#10;Advanced Calculus, S.L. Loney, Mathematics, 8"
                  value={bulkData}
                  onChange={e => setBulkData(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: '10px',
                    border: '1px solid #cbd5e1',
                    outline: 'none',
                    fontFamily: 'monospace',
                    fontSize: '0.85rem',
                    boxSizing: 'border-box',
                    background: '#fcfcfc',
                    lineHeight: '1.5'
                  }}
                />
              </div>
            )}

            {/* Helper Info & Template Download */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', background: '#f8fafc', padding: '12px 16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '0.8rem', color: '#475569' }}>
                <span style={{ fontWeight: 700, color: '#1e293b' }}>Expected Format:</span>{' '}
                <code style={{ background: '#e2e8f0', padding: '2px 8px', borderRadius: '6px', fontSize: '0.78rem', color: '#0f172a', fontWeight: 600 }}>Title, Author, Category, Copies</code>
              </div>
              <button
                type="button"
                onClick={handleDownloadSampleTemplate}
                className="hover-lift"
                style={{
                  background: 'white',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  padding: '6px 12px',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  color: '#0369a1',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                }}
              >
                <Download size={14} color="#0EA5E9" /> Download Template (.csv)
              </button>
            </div>

            {/* LIVE DATA PREVIEW */}
            {parsedRows.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0f172a' }}>
                    Live Preview ({parsedRows.length} titles parsed)
                  </span>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#16a34a', background: '#dcfce7', padding: '3px 10px', borderRadius: '12px' }}>
                    ✓ {parsedRows.filter(r => r.isValid).length} ready to provision
                  </span>
                </div>

                <div style={{ maxHeight: '180px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '12px', background: 'white' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                    <thead>
                      <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', position: 'sticky', top: 0, zIndex: 1 }}>
                        <th style={{ padding: '10px 14px', textAlign: 'left', color: '#475569', fontWeight: 700 }}>Title</th>
                        <th style={{ padding: '10px 14px', textAlign: 'left', color: '#475569', fontWeight: 700 }}>Author</th>
                        <th style={{ padding: '10px 14px', textAlign: 'left', color: '#475569', fontWeight: 700 }}>Category</th>
                        <th style={{ padding: '10px 14px', textAlign: 'center', color: '#475569', fontWeight: 700 }}>Copies</th>
                        <th style={{ padding: '10px 14px', textAlign: 'right', color: '#475569', fontWeight: 700 }}>Validation</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parsedRows.map((row, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9', background: row.isValid ? 'white' : '#fff1f2' }}>
                          <td style={{ padding: '10px 14px', fontWeight: 700, color: '#0f172a' }}>{row.title || '—'}</td>
                          <td style={{ padding: '10px 14px', color: '#475569' }}>{row.author || '—'}</td>
                          <td style={{ padding: '10px 14px' }}>
                            <span style={{ fontSize: '0.72rem', background: '#e0f2fe', color: '#0369a1', padding: '2px 8px', borderRadius: '6px', fontWeight: 700 }}>
                              {row.category}
                            </span>
                          </td>
                          <td style={{ padding: '10px 14px', textAlign: 'center', fontWeight: 800, color: '#334155' }}>{row.copies}</td>
                          <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                            {row.isValid ? (
                              <span style={{ color: '#16a34a', fontWeight: 700, fontSize: '0.75rem', background: '#dcfce7', padding: '2px 8px', borderRadius: '6px' }}>✓ Ready</span>
                            ) : (
                              <span style={{ color: '#ef4444', fontWeight: 700, fontSize: '0.75rem', background: '#fee2e2', padding: '2px 8px', borderRadius: '6px' }}>⚠️ Missing Data</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Bottom Actions */}
            <div style={{ display: 'flex', gap: '12px', paddingTop: '8px' }}>
              <button
                type="button"
                onClick={() => {
                  setIsBulkModalOpen(false);
                  setBulkData('');
                  setUploadedFileName('');
                }}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: '#f1f5f9',
                  border: 'none',
                  borderRadius: '10px',
                  fontWeight: 600,
                  color: '#475569',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isBulkSubmitting || parsedRows.filter(r => r.isValid).length === 0}
                onClick={handleBulkImport}
                style={{
                  flex: 2,
                  padding: '12px',
                  background: parsedRows.filter(r => r.isValid).length === 0 ? '#cbd5e1' : 'linear-gradient(135deg, #0EA5E9 0%, #0284C7 100%)',
                  border: 'none',
                  borderRadius: '10px',
                  fontWeight: 700,
                  color: 'white',
                  cursor: parsedRows.filter(r => r.isValid).length === 0 ? 'not-allowed' : 'pointer',
                  boxShadow: parsedRows.filter(r => r.isValid).length === 0 ? 'none' : '0 4px 14px rgba(14, 165, 233, 0.35)',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                {isBulkSubmitting ? (
                  <span>Importing Batch into Catalog...</span>
                ) : (
                  <span>
                    Import {parsedRows.filter(r => r.isValid).length > 0 ? `${parsedRows.filter(r => r.isValid).length} Books` : 'Data'} to Catalog
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Print Shelf & Barcode Labels Modal (Portaled directly to document.body) */}
      {isPrintModalOpen && createPortal(
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999999, padding: '24px', boxSizing: 'border-box'
        }}>
          <div style={{
            background: 'white', borderRadius: '20px', padding: '28px',
            width: '100%', maxWidth: '720px', maxHeight: 'calc(100vh - 48px)', overflowY: 'auto',
            boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.35)',
            boxSizing: 'border-box'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #f1f5f9', paddingBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Printer size={22} color="#0284c7" />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#0f172a', fontWeight: 800 }}>Print Shelf & Spine Barcodes</h3>
                  <div style={{ fontSize: '0.78rem', color: '#64748b' }}>Standard A4 adhesive label sheets for library book circulation</div>
                </div>
              </div>
              <button onClick={() => setIsPrintModalOpen(false)} style={{ background: '#f1f5f9', border: 'none', borderRadius: '8px', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748b' }}>
                <X size={18} />
              </button>
            </div>

            {/* Simulated Printable Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px', marginBottom: '24px' }}>
              {(books.length > 0 ? books.slice(0, 6) : [
                { bookId: 'BK-1001', title: 'Concepts of Physics (Vol 1)', author: 'H.C. Verma', category: 'Science' },
                { bookId: 'BK-1002', title: 'Advanced Mathematics', author: 'R.D. Sharma', category: 'Mathematics' },
                { bookId: 'BK-1003', title: 'Atomic Habits', author: 'James Clear', category: 'Self Help' },
                { bookId: 'BK-1004', title: 'History of Modern India', author: 'Bipan Chandra', category: 'History' },
              ]).map((b, idx) => (
                <div key={idx} style={{
                  border: '1px solid #cbd5e1',
                  borderRadius: '10px',
                  padding: '12px',
                  background: '#fcfcfc',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#0369a1' }}>PRAGATI CENTRAL LIBRARY</span>
                    <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#64748b' }}>{b.category || 'General'}</span>
                  </div>

                  <div style={{ fontWeight: 800, fontSize: '0.85rem', color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {b.title}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b' }}>By {b.author}</div>

                  {/* Barcode Graphic */}
                  <div style={{ margin: '6px 0', background: 'white', padding: '6px', borderRadius: '6px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '2px', height: '24px', alignItems: 'flex-end', marginBottom: '2px' }}>
                      {[3,1,2,4,1,3,2,1,4,2,3,1,2,3,4,1,2,1,3].map((w, i) => (
                        <div key={i} style={{ width: `${w}px`, height: '100%', background: '#0f172a' }} />
                      ))}
                    </div>
                    <span style={{ fontFamily: 'monospace', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em' }}>
                      {b.bookId || `BK-${1001 + idx}`}
                    </span>
                  </div>

                  <div style={{ fontSize: '0.68rem', color: '#0369a1', background: '#f0f9ff', padding: '3px 6px', borderRadius: '6px', textAlign: 'center', fontWeight: 700 }}>
                    {getShelfLocation(b, idx)}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button 
                type="button" 
                onClick={() => setIsPrintModalOpen(false)}
                style={{ padding: '10px 20px', background: '#f1f5f9', border: 'none', borderRadius: '10px', fontWeight: 600, color: '#475569', cursor: 'pointer' }}
              >
                Close
              </button>
              <button 
                type="button" 
                onClick={() => window.print()}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 24px', background: '#4F46E5', border: 'none', borderRadius: '10px', fontWeight: 700, color: 'white', cursor: 'pointer', boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)' }}
              >
                <Printer size={16} /> Print Sheet (A4)
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default LibraryBooks;
