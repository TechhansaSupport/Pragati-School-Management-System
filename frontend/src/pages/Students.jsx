import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { 
  Search, MoreVertical, User, ChevronLeft, ChevronRight, Plus, X, 
  Mail, Phone, MapPin, Calendar, Activity, BookOpen, CreditCard, 
  Edit, Trash2, CheckCircle2, AlertCircle, RefreshCw, GraduationCap, 
  Building2, Layers, Filter, Check, ArrowRight, QrCode, Award, 
  Shield, Printer, Download, Sparkles, BookMarked, Star
} from 'lucide-react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';

const API_BASE = 'http://localhost:5000/api';

const standardGrades = [
  'Nursery', 'LKG', 'UKG',
  'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5',
  'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10',
  'Class 11', 'Class 12'
];

const standardSections = ['A', 'B', 'C', 'D', 'Science', 'Commerce', 'Arts'];

const Students = () => {
  // Authentication & Session Context
  const userInfo = JSON.parse(sessionStorage.getItem('userInfo') || '{}');
  const token = userInfo.token || sessionStorage.getItem('token') || '';
  const tenantSlug = sessionStorage.getItem('tenantSlug') || userInfo.slug || '';
  const userRole = (sessionStorage.getItem('userRole') || userInfo.role || 'admin').toLowerCase();
  const isAdmin = ['admin', 'superadmin', 'principal', 'frontdesk', 'school', 'school_admin'].includes(userRole);

  // Data States
  const [studentsList, setStudentsList] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [stats, setStats] = useState({
    totalStudents: 0,
    activeStudents: 0,
    inactiveStudents: 0,
    avgAttendance: 95
  });
  const [classesList, setClassesList] = useState([]);
  const [distinctGrades, setDistinctGrades] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Filter & Search States
  const [searchQuery, setSearchQuery] = useState('');
  const [gradeFilter, setGradeFilter] = useState('All');
  const [sectionFilter, setSectionFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Drawer & Modal States
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [studentToDelete, setStudentToDelete] = useState(null);
  const [isDeleteAllModalOpen, setIsDeleteAllModalOpen] = useState(false);

  // Form State
  const initialForm = {
    name: '',
    rollNo: '',
    grade: 'Class 10',
    section: 'A',
    gender: 'Male',
    dateOfBirth: '',
    parentName: '',
    parentContact: '',
    email: '',
    address: '',
    attendance: 100,
    status: 'Active'
  };
  const [formData, setFormData] = useState(initialForm);
  const [formError, setFormError] = useState('');

  const getAuthHeaders = () => {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (tenantSlug) {
      headers['x-tenant-slug'] = tenantSlug;
      headers['x-school-slug'] = tenantSlug;
    }
    return headers;
  };

  // Fetch Students from live API
  const fetchStudents = async () => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      const params = new URLSearchParams({
        page: currentPage,
        limit: itemsPerPage,
        ...(tenantSlug && tenantSlug !== 'all' && tenantSlug !== 'central' ? { schoolSlug: tenantSlug } : {}),
        ...(searchQuery.trim() ? { search: searchQuery.trim() } : {}),
        ...(gradeFilter !== 'All' ? { grade: gradeFilter } : {}),
        ...(sectionFilter !== 'All' ? { section: sectionFilter } : {}),
        ...(statusFilter !== 'All' ? { status: statusFilter } : {})
      });

      const res = await fetch(`${API_BASE}/students?${params.toString()}`, {
        headers: getAuthHeaders()
      });

      if (res.ok) {
        const data = await res.json();
        setStudentsList(data.students || []);
        setTotalCount(data.total || 0);
      } else {
        const err = await res.json();
        setErrorMsg(err.message || 'Failed to load students');
      }
    } catch (err) {
      setErrorMsg('Network error: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch Stats & Configured Classes
  const fetchMetadata = async () => {
    try {
      const [statsRes, classesRes] = await Promise.all([
        fetch(`${API_BASE}/students/stats`, { headers: getAuthHeaders() }),
        fetch(`${API_BASE}/classes`, { headers: getAuthHeaders() })
      ]);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }

      if (classesRes.ok) {
        const classesData = await classesRes.json();
        setClassesList(classesData.classes || []);
        if (classesData.distinctGrades?.length) {
          setDistinctGrades(classesData.distinctGrades);
        }
      }
    } catch (err) {
      console.warn('Failed to load students metadata:', err);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [tenantSlug, currentPage, gradeFilter, sectionFilter, statusFilter]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchStudents();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    fetchMetadata();
  }, [tenantSlug]);

  // Available grade options: merge configured classes with standard grades
  const availableGrades = useMemo(() => {
    const fromConfig = classesList.map(c => c.className);
    const combined = Array.from(new Set([...fromConfig, ...standardGrades]));
    return combined;
  }, [classesList]);

  // Available sections for the selected grade in the form
  const availableSectionsForGrade = useMemo(() => {
    const configuredForGrade = classesList
      .filter(c => c.className.toLowerCase() === formData.grade.toLowerCase())
      .map(c => c.section);
    if (configuredForGrade.length > 0) {
      return Array.from(new Set([...configuredForGrade, 'A', 'B', 'C']));
    }
    return standardSections;
  }, [classesList, formData.grade]);

  // Open Add Student Modal
  const handleOpenAddModal = () => {
    const defaultGrade = classesList[0]?.className || 'Class 10';
    const defaultSection = classesList[0]?.section || 'A';
    const nextRollNo = `STU-${1000 + totalCount + 1}`;

    setFormData({
      ...initialForm,
      grade: defaultGrade,
      section: defaultSection,
      rollNo: nextRollNo
    });
    setFormError('');
    setEditingStudent(null);
    setIsAddModalOpen(true);
  };

  // Open Edit / Reassign Modal
  const handleOpenEditModal = (student, e) => {
    if (e) e.stopPropagation();
    setEditingStudent(student);
    setFormData({
      name: student.name || '',
      rollNo: student.rollNo || '',
      grade: student.grade || 'Class 10',
      section: student.section || 'A',
      gender: student.gender || 'Male',
      dateOfBirth: student.dateOfBirth ? student.dateOfBirth.substring(0, 10) : '',
      parentName: student.parentName || '',
      parentContact: student.parentContact || '',
      email: student.email || '',
      address: student.address || '',
      attendance: student.attendance !== undefined ? student.attendance : 100,
      status: student.status || 'Active'
    });
    setFormError('');
    setIsAddModalOpen(true);
  };

  // Submit Add / Edit Student Form
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setFormError('Student full name is required');
      return;
    }
    if (!formData.grade.trim()) {
      setFormError('Assigned class/grade is required');
      return;
    }

    setActionLoading(true);
    setFormError('');

    try {
      const url = editingStudent 
        ? `${API_BASE}/students/${editingStudent._id}` 
        : `${API_BASE}/students`;
      const method = editingStudent ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(formData)
      });

      const data = await res.json();
      if (res.ok) {
        setIsAddModalOpen(false);
        setEditingStudent(null);
        fetchStudents();
        fetchMetadata();
        window.dispatchEvent(new CustomEvent('schoolListUpdated'));
        if (selectedStudent && editingStudent && selectedStudent._id === editingStudent._id) {
          setSelectedStudent({ ...selectedStudent, ...formData });
        }
      } else {
        setFormError(data.message || 'Operation failed');
      }
    } catch (err) {
      setFormError('Network error: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Delete Student
  const handleDeleteStudent = async () => {
    if (!studentToDelete) return;
    setActionLoading(true);
    try {
      const res = await fetch(`${API_BASE}/students/${studentToDelete._id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });

      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setSelectedIds(prev => prev.filter(id => id !== studentToDelete._id));
        setStudentToDelete(null);
        if (selectedStudent?._id === studentToDelete._id) {
          setSelectedStudent(null);
        }
        await Promise.all([fetchStudents(), fetchMetadata()]);
        window.dispatchEvent(new CustomEvent('schoolListUpdated'));
      } else {
        alert(data.message || data.error || 'Failed to delete student');
      }
    } catch (err) {
      alert('Network error: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Delete All Students (Campus-Scoped or Global)
  const handleDeleteAllStudents = async () => {
    setActionLoading(true);
    try {
      const deleteUrl = tenantSlug && tenantSlug !== 'all' && tenantSlug !== 'central'
        ? `${API_BASE}/students?schoolSlug=${encodeURIComponent(tenantSlug)}`
        : `${API_BASE}/students`;

      const res = await fetch(deleteUrl, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });

      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setIsDeleteAllModalOpen(false);
        setSelectedStudent(null);
        setSelectedIds([]);
        setStudentsList([]);
        setTotalCount(0);
        await Promise.all([fetchStudents(), fetchMetadata()]);
        window.dispatchEvent(new CustomEvent('schoolListUpdated'));
      } else {
        alert(data.message || data.error || 'Failed to delete all students');
      }
    } catch (err) {
      alert('Network error: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Delete Selected Students
  const handleDeleteSelectedStudents = async () => {
    if (selectedIds.length === 0) return;
    if (!window.confirm(`Are you sure you want to permanently delete the ${selectedIds.length} selected student record(s)?`)) return;

    setActionLoading(true);
    try {
      const res = await fetch(`${API_BASE}/students`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
        body: JSON.stringify({ ids: selectedIds })
      });

      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setSelectedIds([]);
        setSelectedStudent(null);
        await Promise.all([fetchStudents(), fetchMetadata()]);
        window.dispatchEvent(new CustomEvent('schoolListUpdated'));
      } else {
        alert(data.message || data.error || 'Failed to delete selected students');
      }
    } catch (err) {
      alert('Network error: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Selection handlers
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(studentsList.map(st => st._id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleSelect = (id) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // Generate Starter Students on Demand
  const handleSeedDefaultStudents = async () => {
    setActionLoading(true);
    try {
      const res = await fetch(`${API_BASE}/students/seed`, {
        method: 'POST',
        headers: getAuthHeaders()
      });
      const data = await res.json();
      if (res.ok) {
        fetchStudents();
        fetchMetadata();
        window.dispatchEvent(new CustomEvent('schoolListUpdated'));
      } else {
        alert(data.message || 'Failed to generate starter students');
      }
    } catch (err) {
      alert('Network error: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const totalPages = Math.ceil(totalCount / itemsPerPage) || 1;

  // Student Profile Drawer
  const renderProfileDrawer = () => {
    if (!selectedStudent) return null;
    const s = selectedStudent;

    return (
      <>
        <div 
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.45)', backdropFilter: 'blur(4px)', zIndex: 99990 }} 
          onClick={() => setSelectedStudent(null)} 
        />
        <div style={{
          position: 'fixed',
          top: 0, right: 0, bottom: 0,
          width: '520px',
          maxWidth: '92vw',
          backgroundColor: '#ffffff',
          zIndex: 99995,
          boxShadow: '-8px 0 25px rgba(0,0,0,0.15)',
          display: 'flex',
          flexDirection: 'column',
          animation: 'slide-left 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
        }}>
          {/* Drawer Header */}
          <div style={{ padding: '24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1e3a8a', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <GraduationCap size={22} color="#4F46E5" /> Student Profile
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {isAdmin && (
                <button
                  onClick={(e) => handleOpenEditModal(s, e)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    padding: '6px 12px', background: '#eff6ff', color: '#1d4ed8',
                    border: '1px solid #bfdbfe', borderRadius: '8px', fontSize: '0.8rem',
                    fontWeight: 700, cursor: 'pointer'
                  }}
                >
                  <Edit size={14} /> Edit / Reassign
                </button>
              )}
              <button 
                onClick={() => setSelectedStudent(null)} 
                style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748b' }}
              >
                <X size={18} />
              </button>
            </div>
          </div>

          <div style={{ padding: '24px', flex: 1, overflowY: 'auto' }}>
            {/* Header Badge */}
            <div style={{ display: 'flex', gap: '18px', alignItems: 'center', marginBottom: '28px' }}>
              <div style={{
                width: '74px', height: '74px', borderRadius: '20px',
                background: 'linear-gradient(135deg, #4F46E5 0%, #1e3a8a 100%)',
                color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.8rem', fontWeight: 800, boxShadow: '0 8px 16px rgba(79, 70, 229, 0.25)'
              }}>
                {s.name ? s.name.charAt(0).toUpperCase() : 'S'}
              </div>
              <div>
                <h3 style={{ fontSize: '1.35rem', fontWeight: 800, margin: '0 0 6px 0', color: '#1e293b' }}>
                  {s.name}
                </h3>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <code style={{ background: '#f1f5f9', padding: '2px 8px', borderRadius: '6px', color: '#334155', fontWeight: 700, fontSize: '0.8rem' }}>
                    {s.rollNo}
                  </code>
                  <span style={{ background: '#e0e7ff', color: '#4338ca', padding: '2px 8px', borderRadius: '6px', fontWeight: 700, fontSize: '0.78rem' }}>
                    {s.grade} - Section {s.section || 'A'}
                  </span>
                  <span style={{
                    fontSize: '0.75rem', fontWeight: 700, padding: '2px 8px', borderRadius: '6px',
                    background: s.status === 'Active' ? '#dcfce7' : '#fee2e2',
                    color: s.status === 'Active' ? '#15803d' : '#b91c1c'
                  }}>
                    ● {s.status || 'Active'}
                  </span>
                </div>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div style={{ display: 'flex', gap: '14px', borderBottom: '1px solid #e2e8f0', marginBottom: '20px', overflowX: 'auto', paddingBottom: '4px' }}>
              {[
                { id: 'overview', label: 'Overview' },
                { id: 'academic', label: 'Academic & Class' },
                { id: 'idcard', label: 'Digital ID (QR)' },
                { id: 'growth', label: '360° Growth' },
                { id: 'portfolio', label: 'Portfolio' },
                { id: 'reportcard', label: 'Report Card' },
                { id: 'guardian', label: 'Guardian & Contact' }
              ].map(tab => (
                <div 
                  key={tab.id} 
                  onClick={() => setActiveTab(tab.id)}
                  style={{ 
                    paddingBottom: '10px', 
                    fontSize: '0.82rem', 
                    fontWeight: 700, 
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    color: activeTab === tab.id ? '#4F46E5' : '#64748b',
                    borderBottom: activeTab === tab.id ? '2.5px solid #4F46E5' : '2.5px solid transparent',
                    transition: 'all 0.15s'
                  }}>
                  {tab.label}
                </div>
              ))}
            </div>

            {/* Tab 1: Overview */}
            {activeTab === 'overview' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div style={{ padding: '14px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Calendar size={14} color="#4F46E5" /> Date of Birth
                    </div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#1e293b', marginTop: '4px' }}>
                      {s.dateOfBirth ? new Date(s.dateOfBirth).toLocaleDateString() : 'Not Specified'}
                    </div>
                  </div>
                  <div style={{ padding: '14px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <User size={14} color="#4F46E5" /> Gender
                    </div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#1e293b', marginTop: '4px' }}>
                      {s.gender || 'Not Specified'}
                    </div>
                  </div>
                </div>

                <div style={{ padding: '14px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Mail size={14} color="#4F46E5" /> Student Email Address
                  </div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#1e293b', marginTop: '4px' }}>
                    {s.email || `${s.rollNo?.toLowerCase()}@pragati.edu`}
                  </div>
                </div>

                <div style={{ padding: '14px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <MapPin size={14} color="#4F46E5" /> Residential Address
                  </div>
                  <div style={{ fontSize: '0.9rem', color: '#1e293b', marginTop: '4px', lineHeight: 1.4 }}>
                    {s.address || 'No residential address recorded on file.'}
                  </div>
                </div>

                {isAdmin && (
                  <div style={{ marginTop: '8px' }}>
                    <button 
                      onClick={() => setStudentToDelete(s)}
                      style={{
                        width: '100%',
                        padding: '11px',
                        borderRadius: '10px',
                        background: '#fee2e2',
                        color: '#b91c1c',
                        border: '1px solid #fecaca',
                        fontWeight: 700,
                        fontSize: '0.85rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        cursor: 'pointer'
                      }}
                    >
                      <Trash2 size={16}/> Remove Student Record
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Tab 2: Academic & Class */}
            {activeTab === 'academic' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{
                  padding: '20px', borderRadius: '16px',
                  background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.08) 0%, rgba(15, 118, 110, 0.08) 100%)',
                  border: '1.5px solid #c7d2fe'
                }}>
                  <div style={{ fontSize: '0.78rem', color: '#4F46E5', fontWeight: 700, textTransform: 'uppercase' }}>
                    Assigned Class Roster
                  </div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#1e3a8a', marginTop: '4px' }}>
                    {s.grade} - Section {s.section || 'A'}
                  </div>
                  <p style={{ fontSize: '0.82rem', color: '#64748b', margin: '4px 0 14px 0' }}>
                    Enrolled under this campus branch workspace.
                  </p>
                  {isAdmin && (
                    <button
                      onClick={(e) => handleOpenEditModal(s, e)}
                      style={{
                        padding: '8px 16px', background: '#4F46E5', color: 'white',
                        border: 'none', borderRadius: '8px', fontWeight: 700, fontSize: '0.82rem',
                        cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px'
                      }}
                    >
                      <Layers size={14} /> Reassign to Different Class
                    </button>
                  )}
                </div>

                <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>Overall Attendance Rate</div>
                      <div style={{ fontSize: '1.6rem', fontWeight: 800, color: (s.attendance || 100) >= 85 ? '#16a34a' : '#d97706', marginTop: '2px' }}>
                        {s.attendance !== undefined ? s.attendance : 100}%
                      </div>
                    </div>
                    <span style={{
                      padding: '4px 10px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 700,
                      background: (s.attendance || 100) >= 85 ? '#dcfce7' : '#fef3c7',
                      color: (s.attendance || 100) >= 85 ? '#15803d' : '#b45309'
                    }}>
                      {(s.attendance || 100) >= 85 ? 'Excellent Standing' : 'Needs Monitoring'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Tab: Digital Student ID (Section 9.3 & 10.11) */}
            {activeTab === 'idcard' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center' }}>
                <div style={{
                  width: '100%', maxWidth: '380px', borderRadius: '20px',
                  background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
                  color: 'white', padding: '24px', boxShadow: '0 15px 35px -5px rgba(15, 23, 42, 0.4)',
                  border: '1px solid rgba(255,255,255,0.1)', position: 'relative', overflow: 'hidden'
                }}>
                  <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '140px', height: '140px', borderRadius: '50%', background: 'rgba(79, 70, 229, 0.3)', filter: 'blur(30px)' }}></div>
                  
                  {/* School Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid rgba(255,255,255,0.15)', paddingBottom: '12px' }}>
                    <div>
                      <div style={{ fontSize: '0.72rem', letterSpacing: '1px', textTransform: 'uppercase', color: '#94a3b8' }}>PRAGATI SMS</div>
                      <div style={{ fontWeight: 800, fontSize: '1rem', color: '#f8fafc' }}>STUDENT IDENTITY CARD</div>
                    </div>
                    <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: '#4F46E5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 800 }}>P</div>
                  </div>

                  {/* Student Details with QR */}
                  <div style={{ display: 'flex', gap: '16px', marginTop: '16px', alignItems: 'center' }}>
                    <div style={{
                      width: '74px', height: '84px', borderRadius: '12px',
                      background: 'linear-gradient(135deg, #4F46E5, #0F766E)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '2rem', fontWeight: 800, color: 'white', flexShrink: 0,
                      border: '2px solid rgba(255,255,255,0.3)'
                    }}>
                      {s.name.charAt(0)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.name}</div>
                      <div style={{ fontSize: '0.78rem', color: '#38bdf8', fontWeight: 700, marginTop: '2px' }}>
                        Roll No: {s.rollNo}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#cbd5e1', marginTop: '2px' }}>
                        Class: {s.grade} - {s.section || 'A'}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '2px' }}>
                        Blood Group: O+ • Emergency: {s.parentContact || 'N/A'}
                      </div>
                    </div>
                  </div>

                  {/* QR Code Bar */}
                  <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px dashed rgba(255,255,255,0.15)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>Session 2026-2027</div>
                      <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#4ADE80' }}>● Verified Digital Pass</div>
                    </div>
                    <div style={{ width: '48px', height: '48px', background: 'white', padding: '4px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#0F172A" strokeWidth="2.5">
                        <rect x="2" y="2" width="7" height="7"></rect>
                        <rect x="15" y="2" width="7" height="7"></rect>
                        <rect x="2" y="15" width="7" height="7"></rect>
                        <rect x="6" y="6" width="1" height="1"></rect>
                        <rect x="17" y="6" width="1" height="1"></rect>
                        <rect x="6" y="17" width="1" height="1"></rect>
                        <path d="M15 15h2v2h-2zM19 15h2v2h-2zM15 19h2v2h-2zM19 19h2v2h-2z"></path>
                      </svg>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px', width: '100%', maxWidth: '380px' }}>
                  <button 
                    onClick={() => window.print()}
                    style={{ flex: 1, padding: '10px', borderRadius: '10px', background: '#4F46E5', color: 'white', border: 'none', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                  >
                    <Printer size={15} /> Print ID Card
                  </button>
                  <button 
                    onClick={() => alert(`Digital ID verified for ${s.name} in Pragati QR Ecosystem.`)}
                    style={{ flex: 1, padding: '10px', borderRadius: '10px', background: '#f1f5f9', color: '#334155', border: '1px solid #cbd5e1', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                  >
                    <QrCode size={15} /> QR Workflow
                  </button>
                </div>
              </div>
            )}

            {/* Tab: 360° Growth Profile (Section 10.3) */}
            {activeTab === 'growth' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1e293b', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Sparkles size={16} color="#4F46E5" /> 360° Holistic Growth Profile (Sec. 10.3)
                  </div>
                  <div style={{ height: '220px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart cx="50%" cy="50%" outerRadius="75%" data={[
                        { subject: 'Math', A: 92, fullMark: 100 },
                        { subject: 'Science', A: 88, fullMark: 100 },
                        { subject: 'Languages', A: 85, fullMark: 100 },
                        { subject: 'Arts', A: 90, fullMark: 100 },
                        { subject: 'Sports', A: 76, fullMark: 100 },
                        { subject: 'Coding', A: 89, fullMark: 100 },
                      ]}>
                        <PolarGrid stroke="#E2E8F0" />
                        <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748B', fontSize: 11, fontWeight: 600 }} />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                        <Radar name="Student" dataKey="A" stroke="#4F46E5" strokeWidth={2} fill="#4F46E5" fillOpacity={0.35} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* AI Performance Insights (Section 10.1) */}
                <div style={{ padding: '14px', background: 'rgba(79, 70, 229, 0.05)', borderRadius: '12px', border: '1px solid rgba(79, 70, 229, 0.2)' }}>
                  <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#4F46E5', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                    🤖 AI Performance Insights (Sec. 10.1)
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#1e293b', marginTop: '6px', lineHeight: 1.5 }}>
                    {s.name} demonstrates exemplary analytical aptitude in Mathematics and Science with an overall attendance standing of <strong>{s.attendance || 98}%</strong>.
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#0F766E', marginTop: '6px', fontWeight: 600 }}>
                    Recommended Focus: Encourage enrollment in Advanced Regional Science Olympiad.
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div style={{ padding: '12px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 600 }}>Behavior & Conduct</div>
                    <div style={{ fontSize: '1rem', fontWeight: 800, color: '#16a34a', marginTop: '2px' }}>Exemplary (5/5)</div>
                  </div>
                  <div style={{ padding: '12px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 600 }}>Co-curricular Rating</div>
                    <div style={{ fontSize: '1rem', fontWeight: 800, color: '#4F46E5', marginTop: '2px' }}>Grade A+</div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab: Digital Portfolio (Section 10.10) */}
            {activeTab === 'portfolio' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Award size={16} color="#F59E0B" /> Verified Certificates & Achievements (Sec. 10.10)
                </div>

                {[
                  { title: 'Inter-School Mathematics Olympiad', date: 'Sept 2026', badge: 'Gold Medalist', color: '#F59E0B' },
                  { title: 'Annual Science Exhibition Best Project', date: 'Aug 2026', badge: '1st Runner-Up', color: '#4F46E5' },
                  { title: '100% Term Attendance Award', date: 'Term 1, 2026', badge: 'Excellence Citation', color: '#16A34A' },
                  { title: 'Junior Coding Championship - Python', date: 'July 2026', badge: 'Top 5 Finalist', color: '#0F766E' }
                ].map((cert, idx) => (
                  <div key={idx} style={{ padding: '12px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#0f172a' }}>{cert.title}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '2px' }}>Issued: {cert.date}</div>
                    </div>
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, color: cert.color, background: 'white', padding: '3px 8px', borderRadius: '8px', border: `1px solid ${cert.color}` }}>
                      {cert.badge}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Tab: Digital Report Card (Section 9.9) */}
            {activeTab === 'reportcard' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: '#64748B', textTransform: 'uppercase' }}>Academic Session 2026-2027</div>
                      <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#1e293b' }}>Term 1 Comprehensive Report Card</div>
                    </div>
                    <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#16A34A', background: '#dcfce7', padding: '4px 10px', borderRadius: '10px' }}>
                      Passed with Distinction
                    </span>
                  </div>

                  <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px', fontSize: '0.82rem' }}>
                    <thead>
                      <tr style={{ color: '#64748B', borderBottom: '1px solid #cbd5e1', textAlign: 'left' }}>
                        <th style={{ padding: '6px 0' }}>Subject</th>
                        <th style={{ padding: '6px 0' }}>Max</th>
                        <th style={{ padding: '6px 0' }}>Obtained</th>
                        <th style={{ padding: '6px 0' }}>Grade</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { sub: 'Mathematics', max: 100, obt: 95, gr: 'A+' },
                        { sub: 'Physics & Chemistry', max: 100, obt: 88, gr: 'A' },
                        { sub: 'English Literature', max: 100, obt: 91, gr: 'A+' },
                        { sub: 'Social Studies', max: 100, obt: 86, gr: 'A' },
                        { sub: 'Computer Science', max: 100, obt: 96, gr: 'A+' },
                      ].map((r, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '6px 0', fontWeight: 600 }}>{r.sub}</td>
                          <td style={{ padding: '6px 0', color: '#64748B' }}>{r.max}</td>
                          <td style={{ padding: '6px 0', fontWeight: 700, color: '#4F46E5' }}>{r.obt}</td>
                          <td style={{ padding: '6px 0', fontWeight: 700, color: '#16A34A' }}>{r.gr}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <div style={{ marginTop: '12px', paddingTop: '8px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 700 }}>
                    <span>Aggregate Score: 456 / 500</span>
                    <span style={{ color: '#4F46E5' }}>Percentage: 91.2% (GPA 3.9)</span>
                  </div>
                </div>

                <div style={{ padding: '12px', background: 'white', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '0.8rem', color: '#475569', fontStyle: 'italic' }}>
                  Principal Remarks: "Consistent analytical performance, demonstrates leadership in co-curricular projects."
                </div>

                <button 
                  onClick={() => window.print()}
                  style={{ width: '100%', padding: '10px', borderRadius: '10px', background: '#0F766E', color: 'white', border: 'none', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                >
                  <Download size={15} /> Download & Print Official Report
                </button>
              </div>
            )}

            {/* Tab 3: Guardian & Contact */}
            {activeTab === 'guardian' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <User size={14} color="#4F46E5" /> Parent / Guardian Full Name
                  </div>
                  <div style={{ fontSize: '1rem', fontWeight: 700, color: '#1e293b', marginTop: '4px' }}>
                    {s.parentName || 'Guardian not listed'}
                  </div>
                </div>

                <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Phone size={14} color="#4F46E5" /> Primary Emergency Contact Phone
                  </div>
                  <div style={{ fontSize: '1rem', fontWeight: 700, color: '#1e293b', marginTop: '4px' }}>
                    {s.parentContact || 'Contact not on file'}
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%', height: '100%' }}>
      {renderProfileDrawer()}

      {/* KPI Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '16px' }}>
        <div className="card" style={{ padding: '18px 22px', borderRadius: '16px', background: 'white', border: '1px solid #e2e8f0', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Total Enrolled Students
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#1e3a8a', marginTop: '4px' }}>
            {stats.totalStudents ?? totalCount ?? 0}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 600, marginTop: '2px' }}>
            ● Active campus roster
          </div>
        </div>

        <div className="card" style={{ padding: '18px 22px', borderRadius: '16px', background: 'white', border: '1px solid #e2e8f0', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Active Attendance
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#16a34a', marginTop: '4px' }}>
            {stats.activeStudents ?? totalCount ?? 0}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 500, marginTop: '2px' }}>
            Students in regular session
          </div>
        </div>

        <div className="card" style={{ padding: '18px 22px', borderRadius: '16px', background: 'white', border: '1px solid #e2e8f0', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Configured Classes
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#4F46E5', marginTop: '4px' }}>
            {classesList.length}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#4F46E5', fontWeight: 600, marginTop: '2px' }}>
            Grade & section groups
          </div>
        </div>

        <div className="card" style={{ padding: '18px 22px', borderRadius: '16px', background: 'white', border: '1px solid #e2e8f0', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Avg Attendance Rate
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#0f766e', marginTop: '4px' }}>
            {stats.avgAttendance !== undefined && stats.avgAttendance !== null ? stats.avgAttendance : 0}%
          </div>
          <div style={{ fontSize: '0.75rem', color: '#0f766e', fontWeight: 600, marginTop: '2px' }}>
            Campus wide average
          </div>
        </div>
      </div>

      {/* Main Student Directory Table Card */}
      <div className="card" style={{
        flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0,
        background: 'white', borderRadius: '20px', border: '1px solid #e2e8f0',
        padding: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)'
      }}>
        {/* Table Header & Controls */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '14px' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1e3a8a', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <GraduationCap size={22} color="#4F46E5" /> Student Directory & Enrollment
            </h2>
            <p style={{ margin: '3px 0 0 0', fontSize: '0.82rem', color: '#64748b' }}>
              Manage student admissions and class/section allocations
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            {/* Search Input */}
            <div style={{ position: 'relative' }}>
              <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input 
                type="text" 
                placeholder="Search student or roll no..." 
                value={searchQuery}
                onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                style={{
                  padding: '9px 12px 9px 34px',
                  borderRadius: '10px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.85rem',
                  outline: 'none',
                  width: '210px'
                }}
              />
            </div>

            {/* Filter by Grade / Class */}
            <select
              value={gradeFilter}
              onChange={e => { setGradeFilter(e.target.value); setCurrentPage(1); }}
              style={{
                padding: '9px 12px',
                borderRadius: '10px',
                border: '1px solid #cbd5e1',
                fontSize: '0.85rem',
                outline: 'none',
                background: 'white',
                color: '#334155',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <option value="All">All Classes</option>
              {availableGrades.map(g => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>

            {/* Filter by Section */}
            <select
              value={sectionFilter}
              onChange={e => { setSectionFilter(e.target.value); setCurrentPage(1); }}
              style={{
                padding: '9px 12px',
                borderRadius: '10px',
                border: '1px solid #cbd5e1',
                fontSize: '0.85rem',
                outline: 'none',
                background: 'white',
                color: '#334155',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <option value="All">All Sections</option>
              {standardSections.map(s => (
                <option key={s} value={s}>Section {s}</option>
              ))}
            </select>

            {/* Refresh Button */}
            <button
              onClick={() => { fetchStudents(); fetchMetadata(); }}
              style={{
                background: '#f8fafc', border: '1px solid #cbd5e1', width: '38px', height: '38px',
                borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#475569', cursor: 'pointer'
              }}
              title="Refresh students"
            >
              <RefreshCw size={15} />
            </button>

            {/* Delete All Students Button */}
            {isAdmin && studentsList.length > 0 && (
              <button
                onClick={() => setIsDeleteAllModalOpen(true)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca',
                  padding: '9px 16px', borderRadius: '10px', fontSize: '0.86rem',
                  fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s'
                }}
                onMouseOver={e => { e.currentTarget.style.background = '#dc2626'; e.currentTarget.style.color = 'white'; }}
                onMouseOut={e => { e.currentTarget.style.background = '#fef2f2'; e.currentTarget.style.color = '#dc2626'; }}
              >
                <Trash2 size={15} /> Delete All Students
              </button>
            )}

            {/* Add Student Button */}
            {isAdmin && (
              <button
                onClick={handleOpenAddModal}
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  background: 'linear-gradient(135deg, #4F46E5 0%, #1e40af 100%)',
                  color: 'white', border: 'none', padding: '9px 18px',
                  borderRadius: '10px', fontSize: '0.86rem', fontWeight: 700,
                  cursor: 'pointer', boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)'
                }}
              >
                <Plus size={16} /> Admit Student
              </button>
            )}
          </div>
        </div>

        {errorMsg && (
          <div style={{ padding: '12px 16px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '12px', color: '#b91c1c', fontSize: '0.85rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={16} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Bulk Selection Actions Toolbar */}
        {isAdmin && selectedIds.length > 0 && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '12px',
            padding: '10px 18px', marginBottom: '14px', animation: 'fade-in 0.2s'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#1e40af', fontWeight: 700, fontSize: '0.88rem' }}>
              <CheckCircle2 size={18} color="#2563eb" />
              <span>{selectedIds.length} student{selectedIds.length > 1 ? 's' : ''} selected</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setSelectedIds([])}
                style={{
                  background: 'white', border: '1px solid #cbd5e1', color: '#475569',
                  padding: '6px 14px', borderRadius: '8px', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer'
                }}
              >
                Clear Selection
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleDeleteSelectedStudents}
                style={{
                  background: '#dc2626', color: 'white', border: 'none',
                  padding: '6px 16px', borderRadius: '8px', fontSize: '0.82rem', fontWeight: 700,
                  cursor: actionLoading ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', gap: '6px'
                }}
              >
                <Trash2 size={14} /> {actionLoading ? 'Deleting...' : `Delete Selected (${selectedIds.length})`}
              </button>
            </div>
          </div>
        )}

        {/* Table Content */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: '#64748b' }}>
              <RefreshCw size={28} className="animate-spin" style={{ margin: '0 auto 10px', color: '#4F46E5' }} />
              <p style={{ margin: 0, fontWeight: 600 }}>Loading campus student directory...</p>
            </div>
          ) : studentsList.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: '#64748b', background: '#f8fafc', borderRadius: '16px' }}>
              <GraduationCap size={44} style={{ margin: '0 auto 12px', color: '#cbd5e1' }} />
              <h4 style={{ margin: '0 0 6px', color: '#1e3a8a', fontSize: '1.1rem', fontWeight: 700 }}>
                {searchQuery || gradeFilter !== 'All' ? 'No Matching Students' : 'No Students Registered'}
              </h4>
              <p style={{ margin: '0 0 16px', fontSize: '0.85rem', color: '#64748b' }}>
                {searchQuery || gradeFilter !== 'All' 
                  ? 'Try adjusting your filters or search terms.' 
                  : 'Your student directory is currently empty. You can admit students individually or generate starter students.'}
              </p>
              {isAdmin && (
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                  <button
                    onClick={handleOpenAddModal}
                    style={{ padding: '8px 18px', background: '#4F46E5', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 700, fontSize: '0.84rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <Plus size={14} /> Admit Student
                  </button>
                  <button
                    onClick={handleSeedDefaultStudents}
                    disabled={actionLoading}
                    style={{ padding: '8px 18px', background: '#f1f5f9', color: '#334155', border: '1px solid #cbd5e1', borderRadius: '8px', fontWeight: 700, fontSize: '0.84rem', cursor: actionLoading ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <RefreshCw size={14} /> {actionLoading ? 'Enrolling...' : 'Generate Starter Students'}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1.5px solid #e2e8f0', background: '#f8fafc' }}>
                  {isAdmin && (
                    <th style={{ padding: '12px 14px', width: '38px', textAlign: 'center' }}>
                      <input
                        type="checkbox"
                        checked={studentsList.length > 0 && selectedIds.length === studentsList.length}
                        onChange={handleSelectAll}
                        style={{ cursor: 'pointer', width: '16px', height: '16px', accentColor: '#4F46E5' }}
                        title="Select all on this page"
                      />
                    </th>
                  )}
                  <th style={{ padding: '12px 14px', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Roll No</th>
                  <th style={{ padding: '12px 14px', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Student Name</th>
                  <th style={{ padding: '12px 14px', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Assigned Class</th>
                  <th style={{ padding: '12px 14px', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Attendance</th>
                  <th style={{ padding: '12px 14px', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Parent / Contact</th>
                  <th style={{ padding: '12px 14px', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Status</th>
                  <th style={{ padding: '12px 14px', textAlign: 'right', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {studentsList.map((st) => (
                  <tr 
                    key={st._id} 
                    onClick={() => setSelectedStudent(st)} 
                    style={{
                      borderBottom: '1px solid #f1f5f9', cursor: 'pointer', transition: 'background-color 0.15s',
                      backgroundColor: selectedIds.includes(st._id) ? 'rgba(79, 70, 229, 0.06)' : 'transparent'
                    }}
                    onMouseOver={(e) => {
                      if (!selectedIds.includes(st._id)) e.currentTarget.style.backgroundColor = 'rgba(79, 70, 229, 0.03)';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.backgroundColor = selectedIds.includes(st._id) ? 'rgba(79, 70, 229, 0.06)' : 'transparent';
                    }}
                  >
                    {isAdmin && (
                      <td style={{ padding: '12px 14px', textAlign: 'center' }} onClick={e => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(st._id)}
                          onChange={() => handleToggleSelect(st._id)}
                          style={{ cursor: 'pointer', width: '16px', height: '16px', accentColor: '#4F46E5' }}
                        />
                      </td>
                    )}
                    <td style={{ padding: '12px 14px' }}>
                      <code style={{ background: '#f8fafc', padding: '2px 6px', borderRadius: '5px', fontSize: '0.8rem', fontWeight: 700, color: '#334155' }}>
                        {st.rollNo}
                      </code>
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          width: '32px', height: '32px', borderRadius: '50%',
                          background: '#eff6ff', color: '#3b82f6', display: 'flex',
                          alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.82rem'
                        }}>
                          {st.name?.charAt(0) || 'S'}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, color: '#1e293b', fontSize: '0.88rem' }}>{st.name}</div>
                          <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{st.gender || 'Student'}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: '5px',
                        background: '#e0e7ff', color: '#4338ca', padding: '3px 9px',
                        borderRadius: '6px', fontSize: '0.78rem', fontWeight: 700
                      }}>
                        <Layers size={11} /> {st.grade} - Section {st.section || 'A'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ fontWeight: 700, fontSize: '0.85rem', color: (st.attendance || 100) >= 85 ? '#16a34a' : '#d97706' }}>
                        {st.attendance !== undefined ? st.attendance : 100}%
                      </div>
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ fontSize: '0.84rem', color: '#1e293b', fontWeight: 600 }}>{st.parentName || '—'}</div>
                      <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{st.parentContact || st.email || ''}</div>
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{
                        padding: '3px 8px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 700,
                        background: st.status === 'Active' ? '#dcfce7' : '#fee2e2',
                        color: st.status === 'Active' ? '#15803d' : '#b91c1c'
                      }}>
                        ● {st.status || 'Active'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px', textAlign: 'right' }} onClick={e => e.stopPropagation()}>
                      <div style={{ display: 'inline-flex', gap: '6px' }}>
                        {isAdmin && (
                          <button
                            onClick={(e) => handleOpenEditModal(st, e)}
                            style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '6px', padding: '4px 8px', color: '#1d4ed8', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 }}
                            title="Reassign Class / Edit Details"
                          >
                            <Edit size={12} style={{ display: 'inline', marginRight: '3px' }} /> Edit
                          </button>
                        )}
                        {isAdmin && (
                          <button
                            onClick={() => setStudentToDelete(st)}
                            style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', padding: '4px 8px', color: '#dc2626', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 }}
                            title="Delete Student Record"
                          >
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination Footer */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #f1f5f9' }}>
          <div style={{ fontSize: '0.82rem', color: '#64748b' }}>
            Showing <strong>{studentsList.length}</strong> of <strong>{totalCount}</strong> enrolled students
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button 
              disabled={currentPage === 1} 
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
              style={{ background: 'white', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '5px 10px', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', color: '#475569', opacity: currentPage === 1 ? 0.5 : 1 }}
            >
              <ChevronLeft size={16} />
            </button>
            <span style={{ fontSize: '0.84rem', fontWeight: 700, color: '#334155' }}>
              Page {currentPage} of {totalPages}
            </span>
            <button 
              disabled={currentPage >= totalPages} 
              onClick={() => setCurrentPage(p => p + 1)} 
              style={{ background: 'white', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '5px 10px', cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer', color: '#475569', opacity: currentPage >= totalPages ? 0.5 : 1 }}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Add / Edit Student Modal */}
      {isAddModalOpen && createPortal(
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(8px)',
          zIndex: 999999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
        }}>
          <div style={{
            background: 'white', borderRadius: '24px', width: '600px', maxWidth: '95vw',
            maxHeight: '92vh', overflowY: 'auto', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            border: '1px solid rgba(226, 232, 240, 0.8)', padding: '32px'
          }}>
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '22px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '46px', height: '46px', borderRadius: '14px',
                  background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.1) 0%, rgba(15, 118, 110, 0.1) 100%)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <GraduationCap size={24} color="#4F46E5" />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#1e3a8a', margin: 0 }}>
                    {editingStudent ? 'Edit Student & Class Assignment' : 'Student Admission & Class Enrollment'}
                  </h3>
                  <p style={{ margin: '3px 0 0 0', fontSize: '0.82rem', color: '#64748b' }}>
                    {editingStudent ? 'Update details or reassign to another class section' : 'Admit a new student and allocate their class & section'}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsAddModalOpen(false)}
                style={{ background: '#f1f5f9', border: 'none', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}
              >
                <X size={18} />
              </button>
            </div>

            {formError && (
              <div style={{ padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', color: '#b91c1c', fontSize: '0.85rem', marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertCircle size={16} />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleFormSubmit}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Name & Roll No */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: '5px' }}>
                      Student Full Name *
                    </label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. Aarav Sharma"
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.88rem', outline: 'none', boxSizing: 'border-box' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: '5px' }}>
                      Roll / Admission No *
                    </label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. STU-1001"
                      value={formData.rollNo}
                      onChange={e => setFormData({ ...formData, rollNo: e.target.value })}
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.88rem', outline: 'none', boxSizing: 'border-box' }}
                    />
                  </div>
                </div>

                {/* Class Assignment Section Box (Highlighted) */}
                <div style={{
                  padding: '16px', background: '#f8fafc',
                  borderRadius: '16px', border: '1.5px solid #e2e8f0'
                }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#4F46E5', textTransform: 'uppercase', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Layers size={15} /> Class & Section Allocation
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '14px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                        Assign Class / Grade *
                      </label>
                      <select
                        value={formData.grade}
                        onChange={e => setFormData({ ...formData, grade: e.target.value })}
                        style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem', outline: 'none', background: 'white', boxSizing: 'border-box' }}
                      >
                        {availableGrades.map(g => (
                          <option key={g} value={g}>{g}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                        Assign Section *
                      </label>
                      <select
                        value={formData.section}
                        onChange={e => setFormData({ ...formData, section: e.target.value })}
                        style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem', outline: 'none', background: 'white', boxSizing: 'border-box' }}
                      >
                        {availableSectionsForGrade.map(s => (
                          <option key={s} value={s}>Section {s}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Gender, DOB & Status */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                      Gender
                    </label>
                    <select
                      value={formData.gender}
                      onChange={e => setFormData({ ...formData, gender: e.target.value })}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem', outline: 'none', background: 'white', boxSizing: 'border-box' }}
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                      Date of Birth
                    </label>
                    <input 
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={e => setFormData({ ...formData, dateOfBirth: e.target.value })}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                      Enrollment Status
                    </label>
                    <select
                      value={formData.status}
                      onChange={e => setFormData({ ...formData, status: e.target.value })}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem', outline: 'none', background: 'white', boxSizing: 'border-box' }}
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                      <option value="Graduated">Graduated</option>
                      <option value="Transferred">Transferred</option>
                    </select>
                  </div>
                </div>

                {/* Parent Information */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                      Parent / Guardian Name
                    </label>
                    <input 
                      type="text"
                      placeholder="e.g. Rajesh Sharma"
                      value={formData.parentName}
                      onChange={e => setFormData({ ...formData, parentName: e.target.value })}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem', outline: 'none', boxSizing: 'border-box' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                      Emergency Contact Phone
                    </label>
                    <input 
                      type="text"
                      placeholder="+91 98201 12345"
                      value={formData.parentContact}
                      onChange={e => setFormData({ ...formData, parentContact: e.target.value })}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem', outline: 'none', boxSizing: 'border-box' }}
                    />
                  </div>
                </div>

                {/* Email & Address */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                    Student Email Address
                  </label>
                  <input 
                    type="email"
                    placeholder="student@pragati.edu"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                    Residential Address
                  </label>
                  <textarea 
                    rows={2}
                    placeholder="House / Street, City, State"
                    value={formData.address}
                    onChange={e => setFormData({ ...formData, address: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }}
                  />
                </div>

                {/* Action Buttons */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    style={{ padding: '10px 18px', background: 'white', border: '1px solid #cbd5e1', borderRadius: '10px', color: '#475569', fontWeight: 600, fontSize: '0.88rem', cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    style={{
                      padding: '10px 22px',
                      background: actionLoading ? '#94a3b8' : 'linear-gradient(135deg, #4F46E5 0%, #1e40af 100%)',
                      color: 'white', border: 'none', borderRadius: '10px',
                      fontWeight: 700, fontSize: '0.88rem', cursor: actionLoading ? 'not-allowed' : 'pointer',
                      boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)'
                    }}
                  >
                    {actionLoading ? 'Saving Student...' : editingStudent ? 'Update & Reassign' : 'Admit & Enroll Student'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Delete Confirmation Modal */}
      {studentToDelete && createPortal(
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(8px)',
          zIndex: 999999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
        }}>
          <div style={{
            background: 'white', borderRadius: '20px', width: '460px', maxWidth: '92vw',
            padding: '28px', border: '1px solid #fecaca', boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Trash2 size={22} color="#dc2626" />
              </div>
              <div>
                <h4 style={{ margin: 0, color: '#991b1b', fontSize: '1.2rem', fontWeight: 800 }}>Delete Student Record</h4>
                <p style={{ margin: '2px 0 0', fontSize: '0.82rem', color: '#64748b' }}>Permanently remove student from campus</p>
              </div>
            </div>

            <p style={{ fontSize: '0.9rem', color: '#334155', lineHeight: 1.5, margin: '0 0 20px' }}>
              Are you sure you want to delete <strong>{studentToDelete.name}</strong> ({studentToDelete.rollNo}) from <strong>{studentToDelete.grade} - Section {studentToDelete.section}</strong>?
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setStudentToDelete(null)}
                style={{ padding: '8px 16px', background: 'white', border: '1px solid #cbd5e1', borderRadius: '8px', color: '#475569', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleDeleteStudent}
                style={{ padding: '8px 18px', background: '#dc2626', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}
              >
                {actionLoading ? 'Deleting...' : 'Delete Student'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Delete All Students Confirmation Modal */}
      {isDeleteAllModalOpen && createPortal(
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(8px)',
          zIndex: 999999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
        }}>
          <div style={{
            background: 'white', borderRadius: '20px', width: '460px', maxWidth: '92vw',
            padding: '28px', border: '1px solid #fecaca', boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Trash2 size={22} color="#dc2626" />
              </div>
              <div>
                <h4 style={{ margin: 0, color: '#991b1b', fontSize: '1.2rem', fontWeight: 800 }}>Delete All Student Records?</h4>
                <p style={{ margin: '2px 0 0', fontSize: '0.82rem', color: '#64748b' }}>Permanently remove all students from campus</p>
              </div>
            </div>

            <p style={{ fontSize: '0.9rem', color: '#334155', lineHeight: 1.5, margin: '0 0 20px' }}>
              Are you sure you want to delete all <strong>{totalCount || studentsList.length}</strong> student records? This action is permanent and cannot be undone.
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setIsDeleteAllModalOpen(false)}
                style={{ padding: '8px 16px', background: 'white', border: '1px solid #cbd5e1', borderRadius: '8px', color: '#475569', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleDeleteAllStudents}
                style={{ padding: '8px 18px', background: '#dc2626', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}
              >
                {actionLoading ? 'Deleting...' : 'Delete All Students'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default Students;
