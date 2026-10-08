import React, { useState } from 'react';
import { Book, Bookmark, Clock, AlertTriangle, Search, Scan, MoreVertical, CheckCircle, XCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, CartesianGrid, YAxis } from 'recharts';

const popularBooksData = [
  { name: 'Harry Potter', issues: 45 },
  { name: 'Physics XII', issues: 38 },
  { name: 'Atomic Habits', issues: 32 },
  { name: 'History of India', issues: 28 },
  { name: 'To Kill a Mockingbird', issues: 22 },
];

const recentTransactions = [
  { id: 'TRX-101', student: 'Rahul Sharma (10th A)', book: 'Physics XII Vol 1', action: 'Issued', date: 'Oct 08, 2023', status: 'Active' },
  { id: 'TRX-102', student: 'Anjali Desai (9th B)', book: 'Harry Potter and the Sorcerer\'s Stone', action: 'Returned', date: 'Oct 08, 2023', status: 'Completed' },
  { id: 'TRX-103', student: 'Kevin Dsouza (11th Sci)', book: 'Advanced Calculus', action: 'Issued', date: 'Oct 07, 2023', status: 'Active' },
  { id: 'TRX-104', student: 'Priya Patel (8th A)', book: 'Atomic Habits', action: 'Returned', date: 'Oct 07, 2023', status: 'Completed' },
  { id: 'TRX-105', student: 'Rohan Mehta (12th Arts)', book: 'History of India', action: 'Issued', date: 'Oct 06, 2023', status: 'Active' },
];

const overdueList = [
  { student: 'Amit Kumar', book: 'Biology XI', days: 5, fine: '₹50' },
  { student: 'Neha Gupta', book: 'To Kill a Mockingbird', days: 3, fine: '₹30' },
  { student: 'Vikram Patel', book: 'Chemistry XII', days: 12, fine: '₹120' },
];

const LibraryDashboard = () => {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="dashboard-grid">
      {/* Top Banner - Glassmorphism */}
      <div style={{
        gridColumn: '1 / -1',
        background: 'linear-gradient(135deg, rgba(96,165,250,0.9) 0%, rgba(15, 118, 110,0.9) 100%)',
        borderRadius: '16px',
        padding: '24px 32px',
        color: 'white',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 10px 25px -5px rgba(96, 165, 250, 0.4)'
      }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, margin: '0 0 8px 0' }}>Library Management 📚</h2>
          <p style={{ opacity: 0.9, fontSize: '0.95rem', margin: 0 }}>Manage book inventory, track issues/returns, and monitor overdue fines.</p>
        </div>
        <div style={{ display: 'flex', gap: '16px' }}>
          <button className="hover-lift" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 20px', background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.4)', borderRadius: '12px', color: 'white', fontWeight: 700, cursor: 'pointer', backdropFilter: 'blur(10px)' }}>
            <Scan size={20} /> Scan QR Code
          </button>
          <button className="hover-lift" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 20px', background: 'white', border: 'none', borderRadius: '12px', color: '#60A5FA', fontWeight: 700, cursor: 'pointer' }}>
            <Book size={20} /> Add New Book
          </button>
        </div>
      </div>

      {/* LEFT COLUMN */}
      <div className="left-column">
        {/* KPI Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          {[
            { label: 'Total Books', value: '12,450', icon: Book, color: '#4F46E5', bg: 'rgba(79,70,229,0.1)' },
            { label: 'Books Issued', value: '428', icon: Bookmark, color: '#60A5FA', bg: 'rgba(96,165,250,0.1)' },
            { label: 'Overdue Books', value: '34', icon: Clock, color: '#0F766E', bg: 'rgba(15, 118, 110,0.1)' },
            { label: 'Pending Fines', value: '₹1,450', icon: AlertTriangle, color: '#F59E0B', bg: 'rgba(245,158,11,0.1)' }
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

        {/* Recent Transactions */}
        <div className="card" style={{ flex: 1, padding: 0, overflow: 'hidden' }}>
          <div className="card-header" style={{ padding: '24px 24px 16px 24px' }}>
            <div className="card-title">Recent Transactions</div>
            <div className="table-search" style={{ margin: 0, background: 'rgba(248,250,252,0.8)', border: '1px solid rgba(226,232,240,0.8)', borderRadius: '12px' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '10px', color: '#64748B' }} />
              <input 
                type="text" 
                placeholder="Search Book or Student..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ outline: 'none', width: '250px', padding: '10px 10px 10px 36px', background: 'transparent', border: 'none', fontSize: '0.9rem' }}
              />
            </div>
          </div>
          
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--color-border)', background: 'rgba(248,250,252,0.4)' }}>
                  <th style={{ textAlign: 'left', padding: '12px 24px', color: 'var(--color-text-muted)', fontWeight: 600, fontSize: '0.85rem' }}>ID</th>
                  <th style={{ textAlign: 'left', padding: '12px 24px', color: 'var(--color-text-muted)', fontWeight: 600, fontSize: '0.85rem' }}>Student</th>
                  <th style={{ textAlign: 'left', padding: '12px 24px', color: 'var(--color-text-muted)', fontWeight: 600, fontSize: '0.85rem' }}>Book Title</th>
                  <th style={{ textAlign: 'left', padding: '12px 24px', color: 'var(--color-text-muted)', fontWeight: 600, fontSize: '0.85rem' }}>Action</th>
                  <th style={{ textAlign: 'center', padding: '12px 24px', color: 'var(--color-text-muted)', fontWeight: 600, fontSize: '0.85rem' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentTransactions.map((t, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--color-border)', transition: 'background-color 0.2s', cursor: 'pointer' }} onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(248,250,252,0.6)'} onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                    <td style={{ padding: '16px 24px', fontWeight: 600, color: '#1e293b', fontSize: '0.9rem' }}>{t.id}</td>
                    <td style={{ padding: '16px 24px', color: 'var(--color-text-main)', fontSize: '0.9rem', fontWeight: 500 }}>{t.student}</td>
                    <td style={{ padding: '16px 24px', color: 'var(--color-text-main)', fontSize: '0.9rem' }}>{t.book}</td>
                    <td style={{ padding: '16px 24px' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.9rem', color: t.action === 'Issued' ? '#60A5FA' : '#16A34A' }}>{t.action}</span>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{t.date}</div>
                    </td>
                    <td style={{ padding: '16px 24px', textAlign: 'center' }}>
                      <span style={{ padding: '6px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700, backgroundColor: t.status === 'Completed' ? 'rgba(22, 163, 74,0.1)' : 'rgba(96,165,250,0.1)', color: t.status === 'Completed' ? '#16A34A' : '#60A5FA' }}>
                        {t.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* RIGHT COLUMN */}
      <div className="right-column" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* Most Popular Books */}
        <div className="card">
          <div className="card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Bookmark size={20} color="#60A5FA" />
              <div className="card-title">Most Popular Books</div>
            </div>
            <MoreVertical size={20} className="text-muted" style={{cursor: 'pointer'}} />
          </div>
          <div style={{ height: '220px', marginTop: '16px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={popularBooksData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748B' }} width={110} />
                <Tooltip cursor={{fill: 'rgba(226,232,240,0.4)'}} />
                <Bar dataKey="issues" fill="#60A5FA" radius={[0, 4, 4, 0]} barSize={16} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Overdue List */}
        <div className="card" style={{ flex: 1 }}>
          <div className="card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Clock size={20} color="#0F766E" />
              <div className="card-title">Action Required: Overdue</div>
            </div>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '8px' }}>
            {overdueList.map((item, i) => (
              <div key={i} className="hover-lift" style={{ 
                padding: '16px', 
                background: 'rgba(15, 118, 110,0.05)', 
                border: '1px solid rgba(15, 118, 110,0.2)', 
                borderRadius: '12px', 
                display: 'flex', 
                justifyContent: 'space-between',
                alignItems: 'center',
                cursor: 'pointer'
              }}>
                <div>
                  <div style={{ fontWeight: 600, color: '#1e293b', fontSize: '0.95rem', marginBottom: '4px' }}>{item.student}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{item.book}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ color: '#0F766E', fontSize: '0.85rem', fontWeight: 700, marginBottom: '4px' }}>{item.days} days late</div>
                  <div style={{ color: '#F59E0B', fontSize: '0.8rem', fontWeight: 600 }}>Fine: {item.fine}</div>
                </div>
              </div>
            ))}
          </div>
          
          <button className="hover-lift" style={{ width: '100%', marginTop: '16px', padding: '12px', background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', fontWeight: 600, color: '#0F766E', cursor: 'pointer' }}>
            Send All Reminders
          </button>
        </div>

      </div>
    </div>
  );
};

export default LibraryDashboard;
