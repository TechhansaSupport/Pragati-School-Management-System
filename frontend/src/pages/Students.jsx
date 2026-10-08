import React, { useState, useMemo } from 'react';
import { Search, MoreVertical, User, ChevronLeft, ChevronRight, Plus, X, Mail, Phone, MapPin, Calendar, Activity, BookOpen, CreditCard } from 'lucide-react';

const generateMockData = () => {
  const indianFirstNames = ['Rahul', 'Priya', 'Amit', 'Neha', 'Vikram', 'Anjali', 'Karan', 'Sneha', 'Rohan', 'Pooja'];
  const indianLastNames = ['Sharma', 'Singh', 'Kumar', 'Gupta', 'Patel', 'Desai', 'Malhotra', 'Reddy'];
  const grades = ['5th - A', '6th - B', '7th - A', '8th - C', '9th - A', '10th - B', '11th - Sci', '12th - Com'];
  const colors = ['var(--color-primary)', 'var(--color-secondary)', 'var(--color-accent)', 'var(--color-green)', 'var(--color-yellow)'];
  
  return Array.from({ length: 45 }).map((_, i) => {
    const fName = indianFirstNames[Math.floor(Math.random() * indianFirstNames.length)];
    const lName = indianLastNames[Math.floor(Math.random() * indianLastNames.length)];
    return {
      id: i + 1,
      name: `${fName} ${lName}`,
      grade: grades[Math.floor(Math.random() * grades.length)],
      rollNo: `2023${String(i + 1).padStart(3, '0')}`,
      attendance: Math.floor(Math.random() * 20 + 80),
      status: Math.random() > 0.1 ? 'Active' : 'Inactive',
      color: colors[Math.floor(Math.random() * colors.length)],
      email: `${fName.toLowerCase()}.${lName.toLowerCase()}@example.com`,
      parentName: `Mr. ${indianFirstNames[Math.floor(Math.random() * indianFirstNames.length)]} ${lName}`,
      parentContact: `+91 98${Math.floor(Math.random() * 10000000 + 10000000)}`,
      dob: `12/05/20${Math.floor(Math.random() * 5 + 10)}`,
      bloodGroup: ['A+', 'O+', 'B+', 'AB+'][Math.floor(Math.random() * 4)],
      address: '123, Rose Villa, Sector 4, New Delhi',
      fees: { total: 45000, paid: Math.floor(Math.random() * 45000) }
    };
  });
};

const mockStudents = generateMockData();

const Students = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const itemsPerPage = 10;

  const filtered = useMemo(() => {
    return mockStudents.filter(s => 
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      s.rollNo.includes(searchQuery)
    );
  }, [searchQuery]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const renderProfileDrawer = () => {
    if (!selectedStudent) return null;
    const s = selectedStudent;
    const feeDue = s.fees.total - s.fees.paid;

    return (
      <>
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.4)', zIndex: 40 }} onClick={() => setSelectedStudent(null)} />
        <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: '500px', backgroundColor: 'var(--color-surface)', zIndex: 50, boxShadow: '-4px 0 15px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column' }}>
          
          <div style={{ padding: '24px', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Student Profile</h2>
            <button onClick={() => setSelectedStudent(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}><X size={20}/></button>
          </div>

          <div style={{ padding: '24px', flex: 1, overflowY: 'auto' }}>
            {/* Header Info */}
            <div style={{ display: 'flex', gap: '20px', alignItems: 'center', marginBottom: '32px' }}>
              <div style={{ width: '80px', height: '80px', borderRadius: '16px', backgroundColor: s.color + '15', color: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', fontWeight: 700 }}>
                {s.name.charAt(0)}
              </div>
              <div>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0 0 4px 0', color: 'var(--color-text-main)' }}>{s.name}</h3>
                <div style={{ display: 'flex', gap: '12px', fontSize: '0.85rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>
                  <span>{s.rollNo}</span>
                  <span>•</span>
                  <span>{s.grade}</span>
                  <span>•</span>
                  <span style={{ color: s.status === 'Active' ? 'var(--color-green)' : 'var(--color-red)' }}>{s.status}</span>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '24px', borderBottom: '1px solid var(--color-border)', marginBottom: '24px' }}>
              {['overview', 'academic', 'fees'].map(tab => (
                <div 
                  key={tab} 
                  onClick={() => setActiveTab(tab)}
                  style={{ 
                    paddingBottom: '12px', 
                    fontSize: '0.9rem', 
                    fontWeight: 600, 
                    cursor: 'pointer',
                    textTransform: 'capitalize',
                    color: activeTab === tab ? 'var(--color-primary)' : 'var(--color-text-muted)',
                    borderBottom: activeTab === tab ? '2px solid var(--color-primary)' : '2px solid transparent'
                  }}>
                  {tab}
                </div>
              ))}
            </div>

            {/* Tab Content */}
            {activeTab === 'overview' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="card" style={{ padding: '16px', boxShadow: 'none', border: '1px solid var(--color-border)' }}>
                    <div className="metric-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Mail size={14}/> Email Address</div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 500 }}>{s.email}</div>
                  </div>
                  <div className="card" style={{ padding: '16px', boxShadow: 'none', border: '1px solid var(--color-border)' }}>
                    <div className="metric-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Phone size={14}/> Parent Contact</div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 500 }}>{s.parentContact}</div>
                  </div>
                  <div className="card" style={{ padding: '16px', boxShadow: 'none', border: '1px solid var(--color-border)' }}>
                    <div className="metric-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Calendar size={14}/> Date of Birth</div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 500 }}>{s.dob}</div>
                  </div>
                  <div className="card" style={{ padding: '16px', boxShadow: 'none', border: '1px solid var(--color-border)' }}>
                    <div className="metric-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Activity size={14}/> Blood Group</div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 500 }}>{s.bloodGroup}</div>
                  </div>
                </div>
                <div className="card" style={{ padding: '16px', boxShadow: 'none', border: '1px solid var(--color-border)' }}>
                  <div className="metric-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><User size={14}/> Parent/Guardian Name</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 500 }}>{s.parentName}</div>
                </div>
                <div className="card" style={{ padding: '16px', boxShadow: 'none', border: '1px solid var(--color-border)' }}>
                  <div className="metric-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><MapPin size={14}/> Residential Address</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 500 }}>{s.address}</div>
                </div>
              </div>
            )}

            {activeTab === 'academic' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="card" style={{ padding: '20px', backgroundColor: 'var(--color-primary)', color: 'white' }}>
                  <div style={{ fontSize: '0.85rem', opacity: 0.8, marginBottom: '8px' }}>Overall Attendance</div>
                  <div style={{ fontSize: '2rem', fontWeight: 700 }}>{s.attendance}%</div>
                </div>
                <h4 style={{ fontSize: '1rem', fontWeight: 600, marginTop: '8px' }}>Recent Performance</h4>
                {['Mathematics', 'Science', 'English'].map((sub, i) => (
                  <div key={i} className="flex-between" style={{ padding: '12px 0', borderBottom: '1px solid var(--color-border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <BookOpen size={16} className="text-muted" />
                      <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>{sub}</span>
                    </div>
                    <div style={{ fontWeight: 600 }}>{Math.floor(Math.random() * 30 + 70)}/100</div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'fees' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', gap: '16px' }}>
                  <div className="card" style={{ flex: 1, padding: '16px', border: '1px solid var(--color-border)', boxShadow: 'none' }}>
                    <div className="metric-label">Total Fee</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>₹{s.fees.total.toLocaleString()}</div>
                  </div>
                  <div className="card" style={{ flex: 1, padding: '16px', border: '1px solid var(--color-border)', boxShadow: 'none' }}>
                    <div className="metric-label">Paid</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-green)' }}>₹{s.fees.paid.toLocaleString()}</div>
                  </div>
                </div>
                <div className="card" style={{ padding: '20px', backgroundColor: feeDue > 0 ? '#FEF3C7' : '#DCFCE7', border: 'none' }}>
                  <div style={{ fontSize: '0.85rem', color: feeDue > 0 ? 'var(--color-yellow)' : 'var(--color-green)', fontWeight: 600, marginBottom: '4px' }}>
                    {feeDue > 0 ? 'AMOUNT DUE' : 'FULLY PAID'}
                  </div>
                  <div style={{ fontSize: '2rem', fontWeight: 700, color: feeDue > 0 ? '#92400E' : '#166534' }}>
                    ₹{feeDue.toLocaleString()}
                  </div>
                  {feeDue > 0 && (
                    <button style={{ marginTop: '16px', width: '100%', padding: '10px', backgroundColor: 'var(--color-primary)', color: 'white', borderRadius: '8px', border: 'none', fontWeight: 600, cursor: 'pointer' }}>
                      Send Reminder
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%', height: '100%' }}>
      {renderProfileDrawer()}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '24px' }}>
        {[
          { label: 'Total Students', value: '3,452', color: 'var(--color-text-main)' },
          { label: 'Present Today', value: '3,210', color: 'var(--color-green)' },
          { label: 'Absent Today', value: '185', color: 'var(--color-red)' },
          { label: 'Late Arrivals', value: '57', color: 'var(--color-yellow)' }
        ].map((kpi, i) => (
          <div key={i} className="card">
            <div className="metric-label">{kpi.label}</div>
            <div className="metric-value" style={{ color: kpi.color, marginBottom: 0 }}>{kpi.value}</div>
          </div>
        ))}
      </div>

      <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <div className="card-header">
          <div className="card-title">Student Directory</div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <div className="table-search" style={{ margin: 0 }}>
              <Search size={16} style={{ position: 'absolute', left: '10px', top: '9px', color: '#64748B' }} />
              <input 
                type="text" 
                placeholder="Search name or roll no..." 
                value={searchQuery}
                onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                style={{ outline: 'none' }}
              />
            </div>
            <button className="btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'var(--color-primary)', color: 'white', border: 'none' }}>
              <Plus size={16} /> Add Student
            </button>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th>Roll No</th>
                <th>Student Name</th>
                <th>Class/Sec</th>
                <th>Attendance</th>
                <th>Status</th>
                <th style={{ width: '40px' }}></th>
              </tr>
            </thead>
            <tbody>
              {paginated.map(s => (
                <tr key={s.id} onClick={() => setSelectedStudent(s)} style={{ cursor: 'pointer', transition: 'background-color 0.2s' }} onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--color-bg)'} onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                  <td className="text-muted">{s.rollNo}</td>
                  <td>
                    <div className="company-cell">
                      <div className="company-icon" style={{ backgroundColor: s.color + '15', color: s.color, fontWeight: 700 }}><User size={14} /></div>
                      {s.name}
                    </div>
                  </td>
                  <td>{s.grade}</td>
                  <td style={{ color: parseInt(s.attendance) < 85 ? 'var(--color-red)' : 'var(--color-green)', fontWeight: 500 }}>{s.attendance}%</td>
                  <td>
                    <span style={{ padding: '4px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600, backgroundColor: s.status === 'Active' ? '#DCFCE7' : '#FEE2E2', color: s.status === 'Active' ? '#166534' : '#991b1b' }}>
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

export default Students;
