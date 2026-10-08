import React, { useState, useMemo } from 'react';
import { Search, MoreVertical, BookOpen, ChevronLeft, ChevronRight, Plus, X, Calendar, FileText, Award, Clock } from 'lucide-react';

const generateMockAcademics = () => {
  const subjects = ['Mathematics', 'Science', 'English', 'History', 'Geography', 'Computer Science'];
  const grades = ['10th Grade', '9th Grade', '12th Grade', '8th Grade', '11th Grade'];
  const colors = ['var(--color-primary)', 'var(--color-secondary)', 'var(--color-accent)', 'var(--color-green)', 'var(--color-yellow)'];
  
  return Array.from({ length: 25 }).map((_, i) => {
    return {
      id: i + 1,
      subject: subjects[Math.floor(Math.random() * subjects.length)],
      gradeLevel: grades[Math.floor(Math.random() * grades.length)],
      teacher: `Teacher ${Math.floor(Math.random() * 10) + 1}`,
      students: Math.floor(Math.random() * 20 + 20),
      status: Math.random() > 0.1 ? 'Active' : 'Archived',
      color: colors[Math.floor(Math.random() * colors.length)],
      upcomingExam: Math.random() > 0.5 ? 'Mid-Term Test' : null,
      examDate: `15/10/20${Math.floor(Math.random() * 5 + 20)}`,
      assignments: Math.floor(Math.random() * 5 + 1),
      avgScore: Math.floor(Math.random() * 20 + 70)
    };
  });
};

const mockAcademics = generateMockAcademics();

const Academics = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [mainTab, setMainTab] = useState('classes'); // 'classes', 'examinations', 'assignments'
  const itemsPerPage = 10;

  const filtered = useMemo(() => {
    return mockAcademics.filter(s => 
      s.subject.toLowerCase().includes(searchQuery.toLowerCase()) || 
      s.gradeLevel.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const renderSubjectDrawer = () => {
    if (!selectedSubject) return null;
    const s = selectedSubject;

    return (
      <>
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.4)', zIndex: 40 }} onClick={() => setSelectedSubject(null)} />
        <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: '500px', backgroundColor: 'var(--color-surface)', zIndex: 50, boxShadow: '-4px 0 15px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column' }}>
          
          <div style={{ padding: '24px', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Subject Details</h2>
            <button onClick={() => setSelectedSubject(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}><X size={20}/></button>
          </div>

          <div style={{ padding: '24px', flex: 1, overflowY: 'auto' }}>
            <div style={{ display: 'flex', gap: '20px', alignItems: 'center', marginBottom: '32px' }}>
              <div style={{ width: '80px', height: '80px', borderRadius: '16px', backgroundColor: s.color + '15', color: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <BookOpen size={32} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0 0 4px 0', color: 'var(--color-text-main)' }}>{s.subject}</h3>
                <div style={{ display: 'flex', gap: '12px', fontSize: '0.85rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>
                  <span>{s.gradeLevel}</span>
                  <span>•</span>
                  <span>{s.students} Students</span>
                  <span>•</span>
                  <span style={{ color: s.status === 'Active' ? 'var(--color-green)' : 'var(--color-text-muted)' }}>{s.status}</span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* Quick Stats */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="card" style={{ padding: '16px', border: '1px solid var(--color-border)', boxShadow: 'none' }}>
                  <div className="metric-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Award size={14}/> Class Average</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-primary)' }}>{s.avgScore}%</div>
                </div>
                <div className="card" style={{ padding: '16px', border: '1px solid var(--color-border)', boxShadow: 'none' }}>
                  <div className="metric-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><User size={14}/> Primary Teacher</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 600, marginTop: '4px' }}>{s.teacher}</div>
                </div>
              </div>

              {/* Upcoming Exam */}
              {s.upcomingExam && (
                <div className="card" style={{ padding: '20px', backgroundColor: '#FEF3C7', border: 'none' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--color-yellow)', fontWeight: 600, marginBottom: '4px' }}>UPCOMING EXAMINATION</div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#92400E' }}>{s.upcomingExam}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem', color: '#B45309', marginTop: '8px', fontWeight: 500 }}>
                        <Calendar size={14} /> {s.examDate}
                      </div>
                    </div>
                    <button style={{ padding: '8px 16px', backgroundColor: 'var(--color-yellow)', color: 'white', borderRadius: '8px', border: 'none', fontWeight: 600, cursor: 'pointer' }}>
                      View Syllabus
                    </button>
                  </div>
                </div>
              )}

              {/* Assignments */}
              <div>
                <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '12px' }}>Active Assignments ({s.assignments})</h4>
                {Array.from({ length: s.assignments }).map((_, i) => (
                  <div key={i} className="flex-between" style={{ padding: '16px', border: '1px solid var(--color-border)', borderRadius: '12px', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ padding: '10px', backgroundColor: 'var(--color-bg)', borderRadius: '8px' }}>
                        <FileText size={18} className="text-muted" />
                      </div>
                      <div>
                        <div style={{ fontSize: '0.95rem', fontWeight: 600 }}>Chapter {i + 1} Worksheet</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                          <Clock size={12} /> Due in {Math.floor(Math.random() * 5 + 1)} days
                        </div>
                      </div>
                    </div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-primary)' }}>
                      {Math.floor(Math.random() * 10 + 20)}/{s.students} Submitted
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%', height: '100%' }}>
      {renderSubjectDrawer()}

      {/* Main Tabs */}
      <div style={{ display: 'flex', gap: '24px', borderBottom: '1px solid var(--color-border)' }}>
        {[
          { id: 'classes', label: 'Classes & Subjects' },
          { id: 'examinations', label: 'Examinations' },
          { id: 'assignments', label: 'Assignments' }
        ].map(tab => (
          <div 
            key={tab.id} 
            onClick={() => setMainTab(tab.id)}
            style={{ 
              paddingBottom: '16px', 
              fontSize: '0.95rem', 
              fontWeight: 600, 
              cursor: 'pointer',
              color: mainTab === tab.id ? 'var(--color-primary)' : 'var(--color-text-muted)',
              borderBottom: mainTab === tab.id ? '2px solid var(--color-primary)' : '2px solid transparent'
            }}>
            {tab.label}
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '24px' }}>
        {[
          { label: 'Total Classes', value: '45', color: 'var(--color-text-main)' },
          { label: 'Active Subjects', value: '18', color: 'var(--color-text-main)' },
          { label: 'Avg Class Size', value: '32', color: 'var(--color-text-main)' },
          { label: 'Upcoming Exams', value: '4', color: 'var(--color-yellow)' }
        ].map((kpi, i) => (
          <div key={i} className="card">
            <div className="metric-label">{kpi.label}</div>
            <div className="metric-value" style={{ color: kpi.color, marginBottom: 0 }}>{kpi.value}</div>
          </div>
        ))}
      </div>

      <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <div className="card-header">
          <div className="card-title">
            {mainTab === 'classes' && 'Subject Directory'}
            {mainTab === 'examinations' && 'Exam Schedule'}
            {mainTab === 'assignments' && 'School-wide Assignments'}
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <div className="table-search" style={{ margin: 0 }}>
              <Search size={16} style={{ position: 'absolute', left: '10px', top: '9px', color: '#64748B' }} />
              <input 
                type="text" 
                placeholder={`Search ${mainTab}...`} 
                value={searchQuery}
                onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                style={{ outline: 'none' }}
              />
            </div>
            <button className="btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'var(--color-primary)', color: 'white', border: 'none' }}>
              <Plus size={16} /> Add New
            </button>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {mainTab === 'classes' ? (
            <table>
              <thead>
                <tr>
                  <th>Subject</th>
                  <th>Grade Level</th>
                  <th>Primary Teacher</th>
                  <th>Students Enrolled</th>
                  <th>Status</th>
                  <th style={{ width: '40px' }}></th>
                </tr>
              </thead>
              <tbody>
                {paginated.map(s => (
                  <tr key={s.id} onClick={() => setSelectedSubject(s)} style={{ cursor: 'pointer', transition: 'background-color 0.2s' }} onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--color-bg)'} onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                    <td>
                      <div className="company-cell">
                        <div className="company-icon" style={{ backgroundColor: s.color + '15', color: s.color }}><BookOpen size={14} /></div>
                        <span style={{ fontWeight: 600 }}>{s.subject}</span>
                      </div>
                    </td>
                    <td>{s.gradeLevel}</td>
                    <td className="text-muted">{s.teacher}</td>
                    <td className="text-muted">{s.students}</td>
                    <td>
                      <span style={{ padding: '4px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600, backgroundColor: s.status === 'Active' ? '#DCFCE7' : '#F1F5F9', color: s.status === 'Active' ? '#166534' : '#475569' }}>
                        {s.status}
                      </span>
                    </td>
                    <td className="text-muted"><MoreVertical size={16} style={{ cursor: 'pointer' }} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--color-text-muted)' }}>
              <div style={{ textAlign: 'center' }}>
                <BookOpen size={48} style={{ margin: '0 auto 16px', opacity: 0.2 }} />
                <p>Select a subject from the "Classes & Subjects" tab to view specific {mainTab}.</p>
              </div>
            </div>
          )}
        </div>

        {mainTab === 'classes' && (
          <div className="flex-between text-muted" style={{ marginTop: '16px', fontSize: '0.85rem' }}>
            <div>Showing {paginated.length} of {filtered.length} results</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} style={{ background: 'none', border: 'none', cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}><ChevronLeft size={16} /></button>
              <span>{currentPage} / {totalPages || 1}</span>
              <button disabled={currentPage >= totalPages} onClick={() => setCurrentPage(p => p + 1)} style={{ background: 'none', border: 'none', cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer' }}><ChevronRight size={16} /></button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Academics;
