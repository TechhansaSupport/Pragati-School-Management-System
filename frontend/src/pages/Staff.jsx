import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { 
  Search, MoreVertical, User, ChevronLeft, ChevronRight, Plus, X, 
  Mail, Phone, Calendar, Briefcase, BookOpen, Clock, ShieldCheck, 
  Key, Lock, Check, Copy, Trash2, Edit, AlertCircle, RefreshCw, 
  UserPlus, CheckCircle2, Eye, EyeOff, Award, Building2, UserCheck, ExternalLink
} from 'lucide-react';
import AppointPrincipalModal from '../components/AppointPrincipalModal';

const API_BASE = 'http://localhost:5000/api';

const Staff = () => {
  // Current user & authentication context
  const userInfo = JSON.parse(sessionStorage.getItem('userInfo') || '{}');
  const token = userInfo.token || '';
  const userRole = (sessionStorage.getItem('userRole') || userInfo.role || 'admin').toLowerCase();
  const tenantSlug = sessionStorage.getItem('tenantSlug') || userInfo.slug || userInfo.tenantSlug || '';

  const isAdmin = ['admin', 'superadmin', 'principal', 'frontdesk'].includes(userRole);

  // Data states
  const [staffList, setStaffList] = useState([]);
  const [stats, setStats] = useState({ totalStaff: 0, teachingStaff: 0, adminSupport: 0, onLeave: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Current School & Appointed Principal
  const [currentSchool, setCurrentSchool] = useState(null);
  const [isAppointModalOpen, setIsAppointModalOpen] = useState(false);

  // Filters & search
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [deptFilter, setDeptFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Drawer & modal states
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [staffToDelete, setStaffToDelete] = useState(null);
  const [isDeleteAllModalOpen, setIsDeleteAllModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Success credentials modal
  const [newCredentials, setNewCredentials] = useState(null);
  const [copiedKey, setCopiedKey] = useState(false);

  // Form state for creating staff
  const initialForm = {
    name: '',
    role: 'Teacher',
    department: 'Science',
    qualification: '',
    email: '',
    phone: '',
    salary: 50000,
    workload: 'Medium',
    status: 'Active',
    joiningDate: new Date().toISOString().split('T')[0],
    subjects: '',
    classes: '',
    createPortalAccess: true,
    portalUsername: '',
    portalPassword: '',
  };
  const [formData, setFormData] = useState(initialForm);
  const [showPassword, setShowPassword] = useState(false);

  // Departments & roles configuration
  const departments = [
    'Science', 'Mathematics', 'Languages', 'Social Studies', 
    'Commerce', 'Arts & Music', 'Administration', 'Finance', 
    'Library', 'Transport & Facilities', 'Sports & Physical Ed'
  ];

  const roles = [
    'Teacher', 'Principal', 'Administrator', 'Librarian', 
    'Accountant', 'Transport Incharge', 'Support Staff', 'Lab Assistant'
  ];

  // Request headers helper
  const getAuthHeaders = () => {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (tenantSlug) headers['x-tenant-slug'] = tenantSlug;
    return headers;
  };

  // Fetch staff list & stats from backend
  const fetchStaffData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [listRes, statsRes] = await Promise.all([
        fetch(`${API_BASE}/staff?all=true`, { headers: getAuthHeaders() }),
        fetch(`${API_BASE}/staff/stats`, { headers: getAuthHeaders() })
      ]);

      if (!listRes.ok) throw new Error('Failed to load staff directory');
      const listData = await listRes.json();
      setStaffList(listData.staff || []);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }
    } catch (err) {
      console.error('Error loading staff:', err);
      setError(err.message || 'Error connecting to server');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSchoolDetails = async () => {
    try {
      const res = await fetch(`${API_BASE}/school`, { headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        if (data.school) setCurrentSchool(data.school);
      }
    } catch (err) {
      console.warn('Failed to load current school info:', err);
    }
  };

  useEffect(() => {
    fetchStaffData();
    fetchSchoolDetails();
    const handlePrincipalUpdate = () => {
      fetchSchoolDetails();
      fetchStaffData();
    };
    window.addEventListener('principalUpdated', handlePrincipalUpdate);
    window.addEventListener('schoolListUpdated', handlePrincipalUpdate);
    return () => {
      window.removeEventListener('principalUpdated', handlePrincipalUpdate);
      window.removeEventListener('schoolListUpdated', handlePrincipalUpdate);
    };
  }, [tenantSlug]);

  // Generate random password helper
  const generatePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$';
    let pwd = '';
    for (let i = 0; i < 10; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData(prev => ({
      ...prev,
      portalPassword: pwd,
      portalUsername: prev.portalUsername || prev.email || `${prev.name.toLowerCase().replace(/\s+/g, '.')}`
    }));
  };

  // Filter staff list
  const filteredStaff = useMemo(() => {
    return staffList.filter(s => {
      const matchSearch = 
        (s.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.employeeId || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.role || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.department || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.subjects || []).some(sub => sub.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchRole = roleFilter === 'All' || s.role === roleFilter;
      const matchDept = deptFilter === 'All' || s.department === deptFilter;
      const matchStatus = statusFilter === 'All' || s.status === statusFilter;

      return matchSearch && matchRole && matchDept && matchStatus;
    });
  }, [staffList, searchQuery, roleFilter, deptFilter, statusFilter]);

  const totalPages = Math.ceil(filteredStaff.length / itemsPerPage);
  const paginated = filteredStaff.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Handle Create Staff (Admin Authority)
  const handleCreateStaff = async (e) => {
    e.preventDefault();
    if (!isAdmin) {
      alert('Authority required: Only School Administrators can create staff.');
      return;
    }

    setActionLoading(true);
    try {
      const res = await fetch(`${API_BASE}/staff`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || data.error || 'Failed to create staff');
      }

      setIsAddModalOpen(false);

      // If portal access was provisioned, show credentials card
      if (formData.createPortalAccess && formData.portalPassword) {
        setNewCredentials({
          name: data.staff.name,
          employeeId: data.staff.employeeId,
          role: data.staff.role,
          username: data.portalUsername || formData.portalUsername || formData.email,
          password: formData.portalPassword,
        });
      }

      setFormData(initialForm);
      await fetchStaffData();
    } catch (err) {
      alert(`Error creating staff: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Delete Staff
  const handleDeleteStaff = async () => {
    if (!staffToDelete) return;
    setActionLoading(true);
    try {
      const res = await fetch(`${API_BASE}/staff/${staffToDelete._id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.message || 'Failed to delete staff member');
      }
      setStaffToDelete(null);
      if (selectedStaff?._id === staffToDelete._id) setSelectedStaff(null);
      await fetchStaffData();
    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Delete All Staff
  const handleDeleteAllStaff = async () => {
    setActionLoading(true);
    try {
      const res = await fetch(`${API_BASE}/staff`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.message || 'Failed to delete all staff records');
      }
      setIsDeleteAllModalOpen(false);
      setSelectedStaff(null);
      await fetchStaffData();
    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Seed Default Staff on Demand
  const handleSeedDefaultStaff = async () => {
    setActionLoading(true);
    try {
      const res = await fetch(`${API_BASE}/staff/seed`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to generate starter staff');
      }
      await fetchStaffData();
    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  // Copy credentials helper
  const copyCredentials = () => {
    if (!newCredentials) return;
    const text = `School Portal Login Credentials\nStaff Name: ${newCredentials.name}\nEmployee ID: ${newCredentials.employeeId}\nRole: ${newCredentials.role}\nUsername: ${newCredentials.username}\nTemporary Password: ${newCredentials.password}\nLogin URL: ${window.location.origin}/${tenantSlug}/login`;
    navigator.clipboard.writeText(text);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  // Profile Drawer
  const renderProfileDrawer = () => {
    if (!selectedStaff) return null;
    const s = selectedStaff;

    return createPortal(
      <>
        <div 
          style={{ 
            position: 'fixed', 
            top: 0, left: 0, right: 0, bottom: 0, 
            backgroundColor: 'rgba(15, 23, 42, 0.5)', 
            zIndex: 999998, 
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)'
          }} 
          onClick={() => setSelectedStaff(null)} 
        />
        <div style={{ 
          position: 'fixed', 
          top: 0, right: 0, bottom: 0, 
          width: '500px', 
          maxWidth: '92vw', 
          backgroundColor: '#ffffff', 
          zIndex: 999999, 
          boxShadow: '-8px 0 35px rgba(0,0,0,0.2)', 
          display: 'flex', 
          flexDirection: 'column' 
        }}>
          
          <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}>
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0, color: '#1e3a8a' }}>Staff Profile Details</h2>
              <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Admin Verification Verified</span>
            </div>
            <button 
              onClick={() => setSelectedStaff(null)} 
              style={{ background: '#e2e8f0', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#475569' }}
            >
              <X size={18}/>
            </button>
          </div>

          <div style={{ padding: '24px', flex: 1, overflowY: 'auto' }}>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '24px' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '16px', backgroundColor: '#e0e7ff', color: '#4338ca', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.75rem', fontWeight: 800 }}>
                {s.name.charAt(0)}
              </div>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 4px 0', color: '#1e3a8a' }}>{s.name}</h3>
                <div style={{ display: 'flex', gap: '8px', fontSize: '0.85rem', color: '#64748b', fontWeight: 500, flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: 600, color: '#4338ca' }}>{s.employeeId}</span>
                  <span>•</span>
                  <span>{s.role}</span>
                  <span>•</span>
                  <span style={{ 
                    color: s.status === 'Active' ? '#16a34a' : '#d97706',
                    background: s.status === 'Active' ? '#dcfce7' : '#fef3c7',
                    padding: '2px 8px',
                    borderRadius: '10px',
                    fontSize: '0.75rem',
                    fontWeight: 700
                  }}>
                    {s.status}
                  </span>
                </div>
              </div>
            </div>

            {/* Tab navigation */}
            <div style={{ display: 'flex', gap: '20px', borderBottom: '1px solid #e2e8f0', marginBottom: '20px' }}>
              {['overview', 'workload & classes'].map(tab => (
                <div 
                  key={tab} 
                  onClick={() => setActiveTab(tab)}
                  style={{ 
                    paddingBottom: '10px', 
                    fontSize: '0.9rem', 
                    fontWeight: 600, 
                    cursor: 'pointer',
                    textTransform: 'capitalize',
                    color: activeTab === tab ? '#4338ca' : '#64748b',
                    borderBottom: activeTab === tab ? '2px solid #4338ca' : '2px solid transparent'
                  }}>
                  {tab}
                </div>
              ))}
            </div>

            {activeTab === 'overview' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div style={{ padding: '14px', borderRadius: '12px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>
                      <Mail size={13}/> Official Email
                    </div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#1e293b', marginTop: '4px', wordBreak: 'break-all' }}>
                      {s.email || 'Not Provided'}
                    </div>
                  </div>

                  <div style={{ padding: '14px', borderRadius: '12px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>
                      <Phone size={13}/> Contact Phone
                    </div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#1e293b', marginTop: '4px' }}>
                      {s.phone || 'Not Provided'}
                    </div>
                  </div>

                  <div style={{ padding: '14px', borderRadius: '12px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>
                      <Briefcase size={13}/> Department
                    </div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#1e293b', marginTop: '4px' }}>
                      {s.department}
                    </div>
                  </div>

                  <div style={{ padding: '14px', borderRadius: '12px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>
                      <Award size={13}/> Qualification
                    </div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#1e293b', marginTop: '4px' }}>
                      {s.qualification || 'Standard'}
                    </div>
                  </div>
                </div>

                {/* Compensation & joining */}
                <div style={{ padding: '16px', borderRadius: '12px', background: '#f1f5f9', border: '1px solid #cbd5e1' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Monthly Salary</div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f766e' }}>
                        ₹{Number(s.salary || 0).toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Joining Date</div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#1e293b' }}>
                        {new Date(s.joiningDate || s.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Portal account info */}
                <div style={{ padding: '16px', borderRadius: '12px', background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#15803d', fontWeight: 700, fontSize: '0.85rem' }}>
                    <Key size={16}/> School Portal Status
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#166534', marginTop: '4px' }}>
                    {s.portalUsername ? (
                      <span>Active Account Username: <strong>{s.portalUsername}</strong></span>
                    ) : (
                      <span>Portal login mapped via Employee ID ({s.employeeId}) or email.</span>
                    )}
                  </div>
                </div>

                {/* Admin Actions */}
                {isAdmin && (
                  <div style={{ marginTop: '16px', display: 'flex', gap: '12px' }}>
                    <button 
                      onClick={() => setStaffToDelete(s)}
                      style={{
                        flex: 1,
                        padding: '10px',
                        borderRadius: '8px',
                        background: '#fee2e2',
                        color: '#b91c1c',
                        border: '1px solid #fecaca',
                        fontWeight: 600,
                        fontSize: '0.85rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        cursor: 'pointer'
                      }}
                    >
                      <Trash2 size={16}/> Remove Staff Member
                    </button>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'workload & classes' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ padding: '16px', borderRadius: '12px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600, marginBottom: '6px' }}>Workload Intensity</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: s.workload === 'High' ? '#dc2626' : '#2563eb' }}>
                    {s.workload || 'Medium'}
                  </div>
                </div>

                <div>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#1e3a8a', marginBottom: '8px' }}>Assigned Subjects</h4>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {(s.subjects && s.subjects.length > 0) ? s.subjects.map((sub, i) => (
                      <span key={i} style={{ padding: '4px 10px', borderRadius: '12px', background: '#eff6ff', color: '#1d4ed8', fontSize: '0.75rem', fontWeight: 600 }}>
                        {sub}
                      </span>
                    )) : (
                      <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>None assigned</span>
                    )}
                  </div>
                </div>

                <div>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#1e3a8a', marginBottom: '8px' }}>Assigned Classes</h4>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {(s.classes && s.classes.length > 0) ? s.classes.map((cls, i) => (
                      <span key={i} style={{ padding: '4px 10px', borderRadius: '12px', background: '#f0fdf4', color: '#15803d', fontSize: '0.75rem', fontWeight: 600 }}>
                        {cls}
                      </span>
                    )) : (
                      <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>None assigned</span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </>,
      document.body
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%', minHeight: '100%', fontFamily: "'Outfit', sans-serif" }}>
      {renderProfileDrawer()}

      {/* Top Banner with Admin Authority indicator */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        flexWrap: 'wrap', 
        gap: '16px',
        background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
        padding: '24px 28px',
        borderRadius: '20px',
        color: 'white',
        boxShadow: '0 10px 25px -5px rgba(30, 58, 138, 0.25)'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span style={{ 
              background: 'rgba(255, 255, 255, 0.2)', 
              backdropFilter: 'blur(10px)',
              padding: '4px 10px', 
              borderRadius: '20px', 
              fontSize: '0.75rem', 
              fontWeight: 700, 
              display: 'flex', 
              alignItems: 'center', 
              gap: '6px' 
            }}>
              <ShieldCheck size={14} color="#93c5fd" /> Admin Authority Enforced
            </span>
            <span style={{ fontSize: '0.8rem', color: '#bfdbfe' }}>• Workspace: {tenantSlug}</span>
          </div>
          <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
            School Staff & Faculty Management
          </h1>
          <p style={{ margin: '4px 0 0 0', fontSize: '0.9rem', color: '#e0e7ff', opacity: 0.9 }}>
            Administrative console to recruit, provision credentials, and supervise teaching & administrative personnel.
          </p>
        </div>

        {isAdmin ? (
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            {staffList.length > 0 && (
              <button
                onClick={() => setIsDeleteAllModalOpen(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  backgroundColor: 'rgba(239, 68, 68, 0.15)',
                  color: '#fca5a5',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  padding: '12px 18px',
                  borderRadius: '12px',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseOver={e => { e.currentTarget.style.backgroundColor = '#ef4444'; e.currentTarget.style.color = '#ffffff'; }}
                onMouseOut={e => { e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.15)'; e.currentTarget.style.color = '#fca5a5'; }}
              >
                <Trash2 size={16} /> Delete All Staff
              </button>
            )}
            <button 
              onClick={() => {
                setFormData(initialForm);
                setIsAddModalOpen(true);
              }}
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '10px', 
                backgroundColor: '#ffffff', 
                color: '#1e3a8a', 
                border: 'none',
                padding: '12px 24px',
                borderRadius: '12px',
                fontWeight: 700,
                fontSize: '0.95rem',
                cursor: 'pointer',
                boxShadow: '0 8px 16px rgba(0,0,0,0.15)',
                transition: 'transform 0.2s',
              }}
              onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <UserPlus size={18} color="#2563eb" /> Create New Staff
            </button>
          </div>
        ) : (
          <div style={{ background: 'rgba(255,255,255,0.15)', padding: '8px 16px', borderRadius: '10px', fontSize: '0.8rem' }}>
            View-Only Access (Administrator permissions required to create staff)
          </div>
        )}
      </div>

      {/* Campus Leadership & Appointed Principal Banner */}
      <div className="card" style={{
        background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
        border: '1.5px solid #e0e7ff',
        borderRadius: '16px',
        padding: '20px 24px',
        boxShadow: '0 4px 18px rgba(79, 70, 229, 0.06)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '20px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, #1e3a8a 0%, #4F46E5 100%)',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 6px 16px rgba(79, 70, 229, 0.25)',
            flexShrink: 0
          }}>
            <Award size={28} />
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                color: '#4F46E5',
                background: 'rgba(79, 70, 229, 0.08)',
                padding: '2px 8px',
                borderRadius: '6px',
                textTransform: 'uppercase',
                letterSpacing: '0.04em'
              }}>
                🏫 {currentSchool?.name || sessionStorage.getItem('schoolName') || 'Current Campus'} • Leadership
              </span>
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                Dedicated Principal Appointed for this Campus
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginTop: '4px' }}>
              <h2 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800, color: '#1e3a8a' }}>
                {currentSchool?.principal?.name ? currentSchool.principal.name : 'No Principal Appointed Yet'}
              </h2>
              {currentSchool?.principal?.qualification && (
                <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 500 }}>
                  ({currentSchool.principal.qualification})
                </span>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginTop: '6px', fontSize: '0.8rem', color: '#475569', flexWrap: 'wrap' }}>
              {currentSchool?.principal?.email && (
                <span>✉ {currentSchool.principal.email}</span>
              )}
              {currentSchool?.principal?.portalUsername && (
                <span style={{
                  background: '#e0e7ff',
                  color: '#4338ca',
                  padding: '2px 8px',
                  borderRadius: '6px',
                  fontWeight: 600,
                  fontSize: '0.75rem'
                }}>
                  🔑 Portal Username: {currentSchool.principal.portalUsername}
                </span>
              )}
              <span style={{ color: '#0f766e', fontWeight: 600, background: '#ccfbf1', padding: '2px 8px', borderRadius: '6px', fontSize: '0.72rem' }}>
                ● Isolated Campus Staff Roster ({tenantSlug})
              </span>
            </div>
          </div>
        </div>

        {isAdmin && (
          <button
            onClick={() => setIsAppointModalOpen(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 18px',
              borderRadius: '10px',
              border: '1.5px solid #4F46E5',
              background: 'white',
              color: '#4F46E5',
              fontWeight: 700,
              fontSize: '0.88rem',
              cursor: 'pointer',
              transition: 'all 0.2s',
              boxShadow: '0 2px 8px rgba(79, 70, 229, 0.1)'
            }}
            onMouseOver={e => { e.currentTarget.style.background = '#4F46E5'; e.currentTarget.style.color = 'white'; }}
            onMouseOut={e => { e.currentTarget.style.background = 'white'; e.currentTarget.style.color = '#4F46E5'; }}
          >
            <UserCheck size={16} /> {currentSchool?.principal?.name ? 'Change Appointed Principal' : 'Appoint Principal for this School'}
          </button>
        )}
      </div>

      {/* KPI Cards Row */}
      <div className="kpi-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '16px' }}>
        {[
          { label: 'Total Faculty & Staff', value: stats.totalStaff, color: '#1e3a8a', bg: '#eff6ff', icon: User },
          { label: 'Teaching Faculty', value: stats.teachingStaff, color: '#2563eb', bg: '#dbeafe', icon: BookOpen },
          { label: 'Administrative & Support', value: stats.adminSupport, color: '#0f766e', bg: '#ccfbf1', icon: Briefcase },
          { label: 'On Leave / Away', value: stats.onLeave, color: '#d97706', bg: '#fef3c7', icon: Clock }
        ].map((kpi, i) => (
          <div key={i} className="card" style={{ padding: '18px 22px', borderRadius: '16px', border: '1px solid #e2e8f0', background: 'white', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
            <div className="flex-between" style={{ marginBottom: '8px' }}>
              <span className="metric-label" style={{ fontWeight: 600 }}>{kpi.label}</span>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: kpi.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: kpi.color }}>
                <kpi.icon size={18} />
              </div>
            </div>
            <div style={{ fontSize: '1.85rem', fontWeight: 800, color: kpi.color, margin: '4px 0 0 0' }}>
              {isLoading ? '...' : kpi.value}
            </div>
          </div>
        ))}
      </div>

      {/* Main Staff Directory Card */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', padding: '24px', borderRadius: '20px', border: '1px solid #e2e8f0', background: '#ffffff', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
        
        {/* Controls Bar: Search, Filters, Refresh */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', flex: 1 }}>
            
            {/* Search Box */}
            <div style={{ position: 'relative', width: '280px' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748B' }} />
              <input 
                type="text" 
                placeholder="Search name, ID, role, subject..." 
                value={searchQuery}
                onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                style={{ 
                  width: '100%', 
                  padding: '9px 12px 9px 36px', 
                  borderRadius: '10px', 
                  border: '1px solid #cbd5e1', 
                  outline: 'none', 
                  fontSize: '0.85rem' 
                }}
              />
            </div>

            {/* Role Filter */}
            <select 
              value={roleFilter} 
              onChange={e => { setRoleFilter(e.target.value); setCurrentPage(1); }}
              style={{ padding: '9px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.85rem', color: '#334155', background: 'white' }}
            >
              <option value="All">All Roles</option>
              {roles.map(r => <option key={r} value={r}>{r}</option>)}
            </select>

            {/* Department Filter */}
            <select 
              value={deptFilter} 
              onChange={e => { setDeptFilter(e.target.value); setCurrentPage(1); }}
              style={{ padding: '9px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.85rem', color: '#334155', background: 'white' }}
            >
              <option value="All">All Departments</option>
              {departments.map(d => <option key={d} value={d}>{d}</option>)}
            </select>

            {/* Status Filter */}
            <select 
              value={statusFilter} 
              onChange={e => { setStatusFilter(e.target.value); setCurrentPage(1); }}
              style={{ padding: '9px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.85rem', color: '#334155', background: 'white' }}
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active</option>
              <option value="On Leave">On Leave</option>
              <option value="Probation">Probation</option>
            </select>
          </div>

          <button 
            onClick={fetchStaffData}
            title="Refresh Directory"
            style={{ 
              background: '#f1f5f9', 
              border: '1px solid #cbd5e1', 
              borderRadius: '10px', 
              padding: '8px 14px', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '6px', 
              fontSize: '0.85rem', 
              color: '#475569', 
              cursor: 'pointer' 
            }}
          >
            <RefreshCw size={14} /> Refresh
          </button>
        </div>

        {/* Staff Table */}
        <div style={{ width: '100%', overflowX: 'auto', minHeight: '160px', marginTop: '8px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e2e8f0', color: '#64748b', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                <th style={{ padding: '12px 14px' }}>Emp ID</th>
                <th style={{ padding: '12px 14px' }}>Staff Name</th>
                <th style={{ padding: '12px 14px' }}>Designation / Role</th>
                <th style={{ padding: '12px 14px' }}>Department</th>
                <th style={{ padding: '12px 14px' }}>Subjects / Assignment</th>
                <th style={{ padding: '12px 14px' }}>Status</th>
                <th style={{ padding: '12px 14px', textAlign: 'center' }}>Portal Access</th>
                <th style={{ padding: '12px 14px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                    Loading staff directory from database...
                  </td>
                </tr>
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '50px 20px', color: '#64748b' }}>
                    <div style={{ maxWidth: '420px', margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: '#eff6ff', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <User size={26} />
                      </div>
                      <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#1e293b' }}>
                        {staffList.length === 0 ? 'No Staff Members Registered' : 'No Matching Staff Records'}
                      </h4>
                      <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b', lineHeight: 1.5 }}>
                        {staffList.length === 0 
                          ? 'Your staff roster is empty. You can register new staff members individually or generate standard starter faculty.' 
                          : 'No staff members matched your current filter criteria. Try resetting your search or filter options.'}
                      </p>
                      {staffList.length === 0 && isAdmin && (
                        <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                          <button
                            onClick={() => {
                              setFormData(initialForm);
                              setIsAddModalOpen(true);
                            }}
                            style={{
                              padding: '8px 16px',
                              borderRadius: '8px',
                              background: '#2563eb',
                              color: 'white',
                              border: 'none',
                              fontWeight: 600,
                              fontSize: '0.85rem',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px'
                            }}
                          >
                            <UserPlus size={15} /> Create Staff
                          </button>
                          <button
                            onClick={handleSeedDefaultStaff}
                            disabled={actionLoading}
                            style={{
                              padding: '8px 16px',
                              borderRadius: '8px',
                              background: '#f1f5f9',
                              color: '#334155',
                              border: '1px solid #cbd5e1',
                              fontWeight: 600,
                              fontSize: '0.85rem',
                              cursor: actionLoading ? 'wait' : 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px'
                            }}
                          >
                            <RefreshCw size={14} /> {actionLoading ? 'Generating...' : 'Generate Starter Staff'}
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                paginated.map(s => (
                  <tr 
                    key={s._id} 
                    style={{ borderBottom: '1px solid #f1f5f9', cursor: 'pointer', transition: 'background-color 0.15s' }}
                    onMouseOver={e => e.currentTarget.style.backgroundColor = '#f8fafc'}
                    onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <td style={{ padding: '14px', fontWeight: 700, color: '#4338ca', fontSize: '0.85rem' }} onClick={() => setSelectedStaff(s)}>
                      {s.employeeId}
                    </td>
                    <td style={{ padding: '14px' }} onClick={() => setSelectedStaff(s)}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '34px', height: '34px', borderRadius: '50%', backgroundColor: '#e0e7ff', color: '#3730a3', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.85rem' }}>
                          {s.name.charAt(0)}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: '#1e3a8a', fontSize: '0.9rem' }}>{s.name}</div>
                          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{s.email || s.phone || 'No direct contact'}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '14px', fontSize: '0.85rem', fontWeight: 600, color: '#334155' }} onClick={() => setSelectedStaff(s)}>
                      {s.role}
                    </td>
                    <td style={{ padding: '14px', fontSize: '0.85rem', color: '#64748b' }} onClick={() => setSelectedStaff(s)}>
                      {s.department}
                    </td>
                    <td style={{ padding: '14px', fontSize: '0.8rem', color: '#475569' }} onClick={() => setSelectedStaff(s)}>
                      {s.subjects && s.subjects.length > 0 ? (
                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                          {s.subjects.slice(0, 2).map((sub, i) => (
                            <span key={i} style={{ background: '#eff6ff', padding: '2px 6px', borderRadius: '4px', color: '#2563eb' }}>
                              {sub}
                            </span>
                          ))}
                          {s.subjects.length > 2 && <span style={{ color: '#94a3b8' }}>+{s.subjects.length - 2}</span>}
                        </div>
                      ) : (
                        <span style={{ color: '#94a3b8' }}>General Duty</span>
                      )}
                    </td>
                    <td style={{ padding: '14px' }} onClick={() => setSelectedStaff(s)}>
                      <span style={{ 
                        padding: '4px 10px', 
                        borderRadius: '12px', 
                        fontSize: '0.75rem', 
                        fontWeight: 700, 
                        backgroundColor: s.status === 'Active' ? '#DCFCE7' : s.status === 'On Leave' ? '#FEF08A' : '#f1f5f9', 
                        color: s.status === 'Active' ? '#166534' : s.status === 'On Leave' ? '#854d0e' : '#475569' 
                      }}>
                        {s.status}
                      </span>
                    </td>
                    <td style={{ padding: '14px', textAlign: 'center' }} onClick={() => setSelectedStaff(s)}>
                      {s.portalUsername ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#16a34a', fontSize: '0.75rem', fontWeight: 700 }}>
                          <CheckCircle2 size={14} /> Active
                        </span>
                      ) : (
                        <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>Default</span>
                      )}
                    </td>
                    <td style={{ padding: '14px', textAlign: 'right' }} onClick={e => e.stopPropagation()}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedStaff(s);
                          }}
                          title="View Details"
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#475569', padding: '4px', borderRadius: '4px' }}
                        >
                          <User size={16} />
                        </button>
                        {isAdmin && (
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setStaffToDelete(s);
                            }}
                            title="Delete Staff"
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: '4px', borderRadius: '4px' }}
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination footer */}
        <div className="flex-between" style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #e2e8f0', color: '#64748b', fontSize: '0.85rem' }}>
          <div>Showing {paginated.length} of {filteredStaff.length} staff records</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button 
              disabled={currentPage === 1} 
              onClick={() => setCurrentPage(p => p - 1)} 
              style={{ background: 'none', border: 'none', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', color: currentPage === 1 ? '#cbd5e1' : '#334155' }}
            >
              <ChevronLeft size={18} />
            </button>
            <span style={{ fontWeight: 600 }}>{currentPage} / {totalPages || 1}</span>
            <button 
              disabled={currentPage >= totalPages} 
              onClick={() => setCurrentPage(p => p + 1)} 
              style={{ background: 'none', border: 'none', cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer', color: currentPage >= totalPages ? '#cbd5e1' : '#334155' }}
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* CREATE STAFF MODAL (ADMIN AUTHORITY) - RENDERED VIA PORTAL TO BODY */}
      {isAddModalOpen && createPortal(
        <div style={{ 
          position: 'fixed', 
          top: 0, left: 0, right: 0, bottom: 0, 
          backgroundColor: 'rgba(15, 23, 42, 0.75)', 
          zIndex: 999999, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          backdropFilter: 'blur(6px)',
          WebkitBackdropFilter: 'blur(6px)',
          padding: '20px',
          overflowY: 'auto'
        }}>
          <div style={{ 
            backgroundColor: '#ffffff', 
            borderRadius: '20px', 
            width: '100%', 
            maxWidth: '680px', 
            maxHeight: 'calc(100vh - 40px)',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 25px 60px -15px rgba(0,0,0,0.5)',
            border: '1px solid #e2e8f0',
            overflow: 'hidden',
            position: 'relative'
          }}>
            
            {/* PINNED MODAL HEADER - ALWAYS VISIBLE */}
            <div style={{ 
              padding: '16px 24px', 
              borderBottom: '1px solid #e2e8f0', 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              background: 'linear-gradient(90deg, #f8fafc 0%, #eff6ff 100%)',
              flexShrink: 0
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ShieldCheck size={18} color="#2563eb" />
                  <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#2563eb', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Administrator Authority
                  </span>
                </div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '2px 0 0 0', color: '#1e3a8a' }}>
                  Create New Staff Member
                </h2>
              </div>
              <button 
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                style={{ 
                  background: '#f1f5f9', 
                  border: 'none', 
                  borderRadius: '50%', 
                  width: '32px', 
                  height: '32px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  cursor: 'pointer', 
                  color: '#64748b' 
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* MODAL FORM WRAPPER WITH SCROLLABLE BODY & PINNED FOOTER */}
            <form 
              onSubmit={handleCreateStaff} 
              style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                flex: 1, 
                overflow: 'hidden',
                margin: 0
              }}
            >
              
              {/* SCROLLABLE FORM BODY */}
              <div style={{ padding: '24px', flex: 1, overflowY: 'auto' }}>
                
                {/* Section 1: Basic Information */}
                <div style={{ marginBottom: '20px' }}>
                  <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#1e3a8a', marginBottom: '12px', borderBottom: '1px solid #f1f5f9', paddingBottom: '6px' }}>
                    1. Identity & Official Role
                  </h3>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                        Full Name *
                      </label>
                      <input 
                        type="text" 
                        required
                        placeholder="e.g. Dr. Rajesh Khanna" 
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                        style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                        Designation / Role *
                      </label>
                      <select
                        value={formData.role}
                        onChange={e => setFormData({ ...formData, role: e.target.value })}
                        style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', background: 'white' }}
                      >
                        {roles.map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                        Department *
                      </label>
                      <select
                        value={formData.department}
                        onChange={e => setFormData({ ...formData, department: e.target.value })}
                        style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', background: 'white' }}
                      >
                        {departments.map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                        Highest Qualification
                      </label>
                      <input 
                        type="text" 
                        placeholder="e.g. M.Sc Physics, B.Ed" 
                        value={formData.qualification}
                        onChange={e => setFormData({ ...formData, qualification: e.target.value })}
                        style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                      />
                    </div>
                  </div>
                </div>

                {/* Section 2: Teaching assignments (conditional) */}
                {formData.role === 'Teacher' && (
                  <div style={{ marginBottom: '20px' }}>
                    <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#1e3a8a', marginBottom: '12px', borderBottom: '1px solid #f1f5f9', paddingBottom: '6px' }}>
                      2. Academic Assignment
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                          Assigned Subjects (comma-separated)
                        </label>
                        <input 
                          type="text" 
                          placeholder="e.g. Physics, General Science" 
                          value={formData.subjects}
                          onChange={e => setFormData({ ...formData, subjects: e.target.value })}
                          style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                          Assigned Classes (comma-separated)
                        </label>
                        <input 
                          type="text" 
                          placeholder="e.g. 10th - A, 11th - Sci" 
                          value={formData.classes}
                          onChange={e => setFormData({ ...formData, classes: e.target.value })}
                          style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Section 3: Contact & Compensation */}
                <div style={{ marginBottom: '20px' }}>
                  <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#1e3a8a', marginBottom: '12px', borderBottom: '1px solid #f1f5f9', paddingBottom: '6px' }}>
                    {formData.role === 'Teacher' ? '3.' : '2.'} Contact & Employment Records
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                        Official Email Address
                      </label>
                      <input 
                        type="email" 
                        placeholder="e.g. teacher@school.edu" 
                        value={formData.email}
                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                        style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                        Phone / Mobile
                      </label>
                      <input 
                        type="tel" 
                        placeholder="+91 98765 43210" 
                        value={formData.phone}
                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                        style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                        Monthly Salary (₹)
                      </label>
                      <input 
                        type="number" 
                        min="0"
                        value={formData.salary}
                        onChange={e => setFormData({ ...formData, salary: e.target.value })}
                        style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                        Joining Date
                      </label>
                      <input 
                        type="date" 
                        value={formData.joiningDate}
                        onChange={e => setFormData({ ...formData, joiningDate: e.target.value })}
                        style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                      />
                    </div>
                  </div>
                </div>

                {/* Section 4: Portal Credentials Creation (Exclusive Admin Authority) */}
                <div style={{ 
                  padding: '16px', 
                  borderRadius: '12px', 
                  backgroundColor: '#f8fafc', 
                  border: '1.5px solid #bfdbfe' 
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Key size={18} color="#2563eb" />
                      <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#1e3a8a' }}>
                        Provision Portal Login Credentials
                      </span>
                    </div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, color: '#2563eb' }}>
                      <input 
                        type="checkbox" 
                        checked={formData.createPortalAccess}
                        onChange={e => setFormData({ ...formData, createPortalAccess: e.target.checked })}
                        style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                      />
                      Enable Login Access
                    </label>
                  </div>

                  {formData.createPortalAccess && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                            Portal Username / ID (Optional override)
                          </label>
                          <input 
                            type="text" 
                            placeholder="Defaults to email or employee ID" 
                            value={formData.portalUsername}
                            onChange={e => setFormData({ ...formData, portalUsername: e.target.value })}
                            style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                          />
                        </div>

                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569' }}>
                              Initial Password *
                            </label>
                            <button 
                              type="button" 
                              onClick={generatePassword}
                              style={{ background: 'none', border: 'none', color: '#2563eb', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
                            >
                              Auto-Generate
                            </button>
                          </div>
                          <div style={{ position: 'relative' }}>
                            <input 
                              type={showPassword ? 'text' : 'password'} 
                              required={formData.createPortalAccess}
                              placeholder="Enter secure initial password" 
                              value={formData.portalPassword}
                              onChange={e => setFormData({ ...formData, portalPassword: e.target.value })}
                              style={{ width: '100%', padding: '9px 36px 9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                            />
                            <div 
                              onClick={() => setShowPassword(!showPassword)}
                              style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', color: '#94a3b8' }}
                            >
                              {showPassword ? <EyeOff size={16}/> : <Eye size={16}/>}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                        💡 The staff member can sign into this school's portal ({tenantSlug}) immediately upon creation.
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* PINNED MODAL FOOTER - ALWAYS VISIBLE */}
              <div style={{ 
                padding: '16px 24px', 
                borderTop: '1px solid #e2e8f0', 
                background: '#f8fafc', 
                display: 'flex', 
                justifyContent: 'flex-end', 
                gap: '12px',
                flexShrink: 0
              }}>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  style={{
                    padding: '10px 18px',
                    borderRadius: '8px',
                    background: 'white',
                    border: '1px solid #cbd5e1',
                    color: '#475569',
                    fontWeight: 600,
                    fontSize: '0.9rem',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={actionLoading}
                  style={{
                    padding: '10px 24px',
                    borderRadius: '8px',
                    background: '#2563eb',
                    border: 'none',
                    color: 'white',
                    fontWeight: 700,
                    fontSize: '0.9rem',
                    cursor: actionLoading ? 'wait' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)'
                  }}
                >
                  {actionLoading ? 'Creating Staff...' : 'Confirm & Create Staff'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* SUCCESS CREDENTIALS MODAL - RENDERED VIA PORTAL */}
      {newCredentials && createPortal(
        <div style={{ 
          position: 'fixed', 
          top: 0, left: 0, right: 0, bottom: 0, 
          backgroundColor: 'rgba(15, 23, 42, 0.75)', 
          zIndex: 999999, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          backdropFilter: 'blur(6px)',
          WebkitBackdropFilter: 'blur(6px)',
          padding: '20px'
        }}>
          <div style={{ 
            backgroundColor: 'white', 
            borderRadius: '20px', 
            width: '100%', 
            maxWidth: '520px', 
            padding: '28px',
            boxShadow: '0 25px 60px -15px rgba(0,0,0,0.4)',
            border: '1px solid #bbf7d0',
            textAlign: 'center'
          }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#dcfce7', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <CheckCircle2 size={32} />
            </div>

            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#166534', margin: '0 0 6px 0' }}>
              Staff Created & Provisioned!
            </h2>
            <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0 0 20px 0' }}>
              Staff member <strong>{newCredentials.name}</strong> was created with portal login authority.
            </p>

            {/* Credentials Card */}
            <div style={{ 
              background: '#f8fafc', 
              borderRadius: '12px', 
              padding: '16px', 
              border: '1px solid #e2e8f0', 
              textAlign: 'left',
              marginBottom: '20px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Employee ID:</span>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1e3a8a' }}>{newCredentials.employeeId}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Role / Designation:</span>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#2563eb' }}>{newCredentials.role}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Login Username:</span>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f766e' }}>{newCredentials.username}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Temporary Password:</span>
                <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#b91c1c', letterSpacing: '0.05em' }}>{newCredentials.password}</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={copyCredentials}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '10px',
                  background: copiedKey ? '#16a34a' : '#2563eb',
                  border: 'none',
                  color: 'white',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  cursor: 'pointer'
                }}
              >
                {copiedKey ? <Check size={18}/> : <Copy size={18}/>}
                {copiedKey ? 'Credentials Copied!' : 'Copy Login Details'}
              </button>

              <button
                onClick={() => setNewCredentials(null)}
                style={{
                  padding: '12px 20px',
                  borderRadius: '10px',
                  background: '#f1f5f9',
                  border: '1px solid #cbd5e1',
                  color: '#475569',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  cursor: 'pointer'
                }}
              >
                Done
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* DELETE CONFIRMATION MODAL - RENDERED VIA PORTAL */}
      {staffToDelete && createPortal(
        <div style={{ 
          position: 'fixed', 
          top: 0, left: 0, right: 0, bottom: 0, 
          backgroundColor: 'rgba(15, 23, 42, 0.75)', 
          zIndex: 999999, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          backdropFilter: 'blur(5px)',
          WebkitBackdropFilter: 'blur(5px)',
          padding: '20px'
        }}>
          <div style={{ backgroundColor: 'white', borderRadius: '16px', maxWidth: '440px', padding: '24px', textAlign: 'center', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.3)' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#fee2e2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
              <Trash2 size={24}/>
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#1e293b', margin: '0 0 6px 0' }}>Confirm Staff Removal</h3>
            <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0 0 20px 0' }}>
              Are you sure you want to remove <strong>{staffToDelete.name}</strong> ({staffToDelete.employeeId})? This will revoke their school records and portal access.
            </p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                onClick={() => setStaffToDelete(null)}
                style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f8fafc', fontWeight: 600, cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button 
                onClick={handleDeleteStaff}
                disabled={actionLoading}
                style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', background: '#dc2626', color: 'white', fontWeight: 700, cursor: actionLoading ? 'wait' : 'pointer' }}
              >
                {actionLoading ? 'Removing...' : 'Delete Staff'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* DELETE ALL CONFIRMATION MODAL - RENDERED VIA PORTAL */}
      {isDeleteAllModalOpen && createPortal(
        <div style={{ 
          position: 'fixed', 
          top: 0, left: 0, right: 0, bottom: 0, 
          backgroundColor: 'rgba(15, 23, 42, 0.75)', 
          zIndex: 999999, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          backdropFilter: 'blur(5px)',
          WebkitBackdropFilter: 'blur(5px)',
          padding: '20px'
        }}>
          <div style={{ backgroundColor: 'white', borderRadius: '16px', maxWidth: '440px', padding: '24px', textAlign: 'center', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.3)' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#fee2e2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
              <Trash2 size={24}/>
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#1e293b', margin: '0 0 6px 0' }}>Delete All Staff Records?</h3>
            <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0 0 20px 0' }}>
              Are you sure you want to delete all <strong>{staffList.length}</strong> staff members? This action is permanent and will remove their profiles and login access.
            </p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                onClick={() => setIsDeleteAllModalOpen(false)}
                style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f8fafc', fontWeight: 600, cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button 
                onClick={handleDeleteAllStaff}
                disabled={actionLoading}
                style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', background: '#dc2626', color: 'white', fontWeight: 700, cursor: actionLoading ? 'wait' : 'pointer' }}
              >
                {actionLoading ? 'Deleting...' : 'Delete All Staff'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Appoint Principal Modal for this School */}
      <AppointPrincipalModal
        isOpen={isAppointModalOpen}
        targetSchool={currentSchool || { name: sessionStorage.getItem('schoolName') || 'Current Campus', slug: tenantSlug }}
        onClose={() => setIsAppointModalOpen(false)}
        onPrincipalAppointed={(updatedSchool) => {
          fetchSchoolDetails();
          fetchStaffData();
          window.dispatchEvent(new CustomEvent('schoolListUpdated'));
        }}
      />

    </div>
  );
};

export default Staff;
