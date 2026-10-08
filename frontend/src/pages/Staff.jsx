import React, { useState, useMemo } from 'react';
import { Search, MoreVertical, User, ChevronLeft, ChevronRight, Plus, X, Mail, Phone, Calendar, Briefcase, BookOpen, Clock } from 'lucide-react';

const generateMockStaff = () => {
  const firstNames = ['R. K.', 'Dr. Anita', 'Sunil', 'Pooja', 'Kavita', 'Ramesh', 'Sunita', 'Alok', 'Meera', 'Deepa'];
  const lastNames = ['Sharma', 'Desai', 'Verma', 'Iyer', 'Singh', 'Tiwari', 'Rao', 'Pandey', 'Nair', 'Pillai'];
  const colors = ['var(--color-primary)', 'var(--color-secondary)', 'var(--color-accent)', 'var(--color-green)', 'var(--color-yellow)'];
  const departments = ['Science', 'Mathematics', 'Languages', 'Administration', 'Sports'];
  
  return Array.from({ length: 25 }).map((_, i) => {
    const isTeacher = i < 18;
    const fName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const role = isTeacher ? 'Teacher' : ['Administrator', 'Support Staff', 'Librarian', 'Accountant'][Math.floor(Math.random() * 4)];
    
    return {
      id: i + 1,
      name: `${fName} ${lName}`,
      role: role,
      employeeId: `EMP-${String(i + 1).padStart(3, '0')}`,
      department: departments[Math.floor(Math.random() * departments.length)],
      status: Math.random() > 0.15 ? 'Active' : 'On Leave',
      color: colors[Math.floor(Math.random() * colors.length)],
      email: `${fName.replace(/[^a-zA-Z]/g, '').toLowerCase()}.${lName.toLowerCase()}@pragati.edu`,
      phone: `+91 98${Math.floor(Math.random() * 10000000 + 10000000)}`,
      joiningDate: `14/06/20${Math.floor(Math.random() * 5 + 15)}`,
      classes: isTeacher ? ['10th - A', '9th - B'] : [],
      subjects: isTeacher ? ['Physics', 'Mathematics'] : [],
      attendance: Math.floor(Math.random() * 10 + 90),
      workload: isTeacher ? ['Low', 'Medium', 'High'][Math.floor(Math.random() * 3)] : 'N/A'
    };
  });
};

const mockStaff = generateMockStaff();

const Staff = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const itemsPerPage = 10;

  const filtered = useMemo(() => {
    return mockStaff.filter(s => 
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      s.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.employeeId.includes(searchQuery)
    );
  }, [searchQuery]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const renderProfileDrawer = () => {
    if (!selectedStaff) return null;
    const s = selectedStaff;

    return (
      <>
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.4)', zIndex: 40 }} onClick={() => setSelectedStaff(null)} />
        <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: '500px', backgroundColor: 'var(--color-surface)', zIndex: 50, boxShadow: '-4px 0 15px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column' }}>
          
          <div style={{ padding: '24px', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Staff Profile</h2>
            <button onClick={() => setSelectedStaff(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}><X size={20}/></button>
          </div>

          <div style={{ padding: '24px', flex: 1, overflowY: 'auto' }}>
            <div style={{ display: 'flex', gap: '20px', alignItems: 'center', marginBottom: '32px' }}>
              <div style={{ width: '80px', height: '80px', borderRadius: '16px', backgroundColor: s.color + '15', color: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', fontWeight: 700 }}>
                {s.name.charAt(0)}
              </div>
              <div>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0 0 4px 0', color: 'var(--color-text-main)' }}>{s.name}</h3>
                <div style={{ display: 'flex', gap: '12px', fontSize: '0.85rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>
                  <span>{s.employeeId}</span>
                  <span>•</span>
                  <span>{s.role}</span>
                  <span>•</span>
                  <span style={{ color: s.status === 'Active' ? 'var(--color-green)' : 'var(--color-yellow)' }}>{s.status}</span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '24px', borderBottom: '1px solid var(--color-border)', marginBottom: '24px' }}>
              {['overview', 'workload', 'attendance'].map(tab => (
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

            {activeTab === 'overview' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="card" style={{ padding: '16px', boxShadow: 'none', border: '1px solid var(--color-border)' }}>
                    <div className="metric-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Mail size={14}/> Email Address</div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 500 }}>{s.email}</div>
                  </div>
                  <div className="card" style={{ padding: '16px', boxShadow: 'none', border: '1px solid var(--color-border)' }}>
                    <div className="metric-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Phone size={14}/> Phone Number</div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 500 }}>{s.phone}</div>
                  </div>
                  <div className="card" style={{ padding: '16px', boxShadow: 'none', border: '1px solid var(--color-border)' }}>
                    <div className="metric-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Briefcase size={14}/> Department</div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 500 }}>{s.department}</div>
                  </div>
                  <div className="card" style={{ padding: '16px', boxShadow: 'none', border: '1px solid var(--color-border)' }}>
                    <div className="metric-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Calendar size={14}/> Joining Date</div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 500 }}>{s.joiningDate}</div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'workload' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {s.role === 'Teacher' ? (
                  <>
                    <div className="card" style={{ padding: '20px', backgroundColor: s.workload === 'High' ? '#FEF2F2' : 'var(--color-bg)', border: 'none' }}>
                      <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', fontWeight: 600, marginBottom: '4px' }}>CURRENT WORKLOAD</div>
                      <div style={{ fontSize: '1.5rem', fontWeight: 700, color: s.workload === 'High' ? 'var(--color-red)' : 'var(--color-text-main)' }}>
                        {s.workload}
                      </div>
                    </div>
                    
                    <h4 style={{ fontSize: '1rem', fontWeight: 600, marginTop: '8px' }}>Assigned Classes</h4>
                    {s.classes.map((cls, i) => (
                      <div key={i} className="flex-between" style={{ padding: '12px 0', borderBottom: '1px solid var(--color-border)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <BookOpen size={16} className="text-muted" />
                          <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>{cls}</span>
                        </div>
                        <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Class Teacher</div>
                      </div>
                    ))}
                  </>
                ) : (
                  <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--color-text-muted)' }}>
                    Workload analytics are only available for teaching staff.
                  </div>
                )}
              </div>
            )}

            {activeTab === 'attendance' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', gap: '16px' }}>
                  <div className="card" style={{ flex: 1, padding: '16px', border: '1px solid var(--color-border)', boxShadow: 'none' }}>
                    <div className="metric-label">Yearly Attendance</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-green)' }}>{s.attendance}%</div>
                  </div>
                  <div className="card" style={{ flex: 1, padding: '16px', border: '1px solid var(--color-border)', boxShadow: 'none' }}>
                    <div className="metric-label">Leaves Taken</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-yellow)' }}>{Math.floor(Math.random() * 5)} Days</div>
                  </div>
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
              <Search size={16} style={{ position: 'absolute', left: '10px', top: '9px', color: '#64748B' }} />
              <input 
                type="text" 
                placeholder="Search staff, role or ID..." 
                value={searchQuery}
                onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                style={{ outline: 'none' }}
              />
            </div>
            <button className="btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'var(--color-primary)', color: 'white', border: 'none' }}>
              <Plus size={16} /> Add Staff
            </button>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th>Emp ID</th>
                <th>Staff Name</th>
                <th>Role</th>
                <th>Department</th>
                <th>Status</th>
                <th style={{ width: '40px' }}></th>
              </tr>
            </thead>
            <tbody>
              {paginated.map(s => (
                <tr key={s.id} onClick={() => setSelectedStaff(s)} style={{ cursor: 'pointer', transition: 'background-color 0.2s' }} onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--color-bg)'} onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                  <td className="text-muted">{s.employeeId}</td>
                  <td>
                    <div className="company-cell">
                      <div className="company-icon" style={{ backgroundColor: s.color + '15', color: s.color, fontWeight: 700 }}><User size={14} /></div>
                      {s.name}
                    </div>
                  </td>
                  <td>{s.role}</td>
                  <td className="text-muted">{s.department}</td>
                  <td>
                    <span style={{ padding: '4px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600, backgroundColor: s.status === 'Active' ? '#DCFCE7' : '#FEF08A', color: s.status === 'Active' ? '#166534' : '#854d0e' }}>
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
