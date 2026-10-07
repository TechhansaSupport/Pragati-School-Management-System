import React, { useState } from 'react';
import { Search, Filter, MoreHorizontal, Mail } from 'lucide-react';

const MOCK_TEACHERS = [
  { id: 'TCH-001', name: 'R. K. Sharma', subjects: 'Mathematics', classes: '9, 10', workload: 'High', status: 'Present' },
  { id: 'TCH-002', name: 'Dr. Anita Desai', subjects: 'Physics', classes: '11, 12', workload: 'Medium', status: 'Present' },
  { id: 'TCH-003', name: 'Sunil Verma', subjects: 'English', classes: '8, 9', workload: 'Low', status: 'On Leave' },
  { id: 'TCH-004', name: 'Pooja Iyer', subjects: 'Chemistry', classes: '10, 11', workload: 'High', status: 'Present' },
  { id: 'TCH-005', name: 'Kavita Singh', subjects: 'History, Civics', classes: '7, 8', workload: 'Medium', status: 'Present' },
];

const Teachers = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredTeachers = MOCK_TEACHERS.filter(t => 
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    t.subjects.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="dashboard-content">
      <div className="chart-card" style={{ flex: 1 }}>
        <div className="chart-header">
          <div className="chart-title">Staff Directory</div>
          <div className="header-actions">
            <div className="search-bar" style={{ width: '250px' }}>
              <Search size={16} />
              <input 
                type="text" 
                placeholder="Search teachers..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ padding: '8px 16px 8px 36px' }}
              />
            </div>
            <button className="header-action-btn">
              <Filter size={16} /> Filter
            </button>
            <button className="nav-pill active" style={{ borderRadius: '8px' }}>
              + Add Staff
            </button>
          </div>
        </div>

        <div className="table-container" style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Employee ID</th>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Name</th>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Subjects</th>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Classes</th>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Workload</th>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Status</th>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTeachers.map((teacher) => (
                <tr key={teacher.id} style={{ borderBottom: '1px solid var(--color-border)', fontSize: '0.85rem' }}>
                  <td style={{ padding: '16px', fontWeight: 600 }}>{teacher.id}</td>
                  <td style={{ padding: '16px', color: 'var(--color-primary)', fontWeight: 500 }}>{teacher.name}</td>
                  <td style={{ padding: '16px' }}>{teacher.subjects}</td>
                  <td style={{ padding: '16px' }}>{teacher.classes}</td>
                  <td style={{ padding: '16px' }}>
                    <span style={{
                      padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600,
                      backgroundColor: teacher.workload === 'High' ? 'var(--color-warning)' : teacher.workload === 'Medium' ? 'var(--color-primary)' : 'var(--color-success)',
                      color: 'white'
                    }}>
                      {teacher.workload}
                    </span>
                  </td>
                  <td style={{ padding: '16px' }}>
                    <span style={{
                      color: teacher.status === 'On Leave' ? 'var(--color-danger)' : 'var(--color-success)',
                      fontWeight: 500
                    }}>
                      {teacher.status}
                    </span>
                  </td>
                  <td style={{ padding: '16px', display: 'flex', gap: '8px' }}>
                    <Mail size={16} style={{ cursor: 'pointer', color: 'var(--color-primary)' }}/>
                    <MoreHorizontal size={16} style={{ cursor: 'pointer', color: 'var(--color-text-muted)' }}/>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredTeachers.length === 0 && (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
              No staff found matching "{searchTerm}"
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Teachers;
