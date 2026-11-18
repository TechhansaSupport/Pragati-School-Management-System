import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, 
  ShieldCheck, 
  Building2, 
  Key, 
  CheckCircle2, 
  AlertCircle, 
  Lock, 
  Check, 
  Layers, 
  UserCheck, 
  BookOpen, 
  CreditCard, 
  Library, 
  Bus, 
  Clock, 
  GraduationCap, 
  Mail, 
  Settings,
  Sparkles,
  RefreshCw,
  Eye,
  EyeOff
} from 'lucide-react';

const MODULE_PERMISSIONS_LIST = [
  { id: 'academics', label: 'Academics & Exams', desc: 'Curriculum, classes, grading, timetable', icon: BookOpen, color: '#4F46E5' },
  { id: 'finance', label: 'Finance & Fee Accounts', desc: 'Fees collection, dues ledger, expenses', icon: CreditCard, color: '#059669' },
  { id: 'library', label: 'Library & Media Center', desc: 'Catalog, book issues, return alerts', icon: Library, color: '#D97706' },
  { id: 'transport', label: 'Fleet & Transport Hub', desc: 'Routes, stops, fleet tracking, passes', icon: Bus, color: '#2563EB' },
  { id: 'attendance', label: 'Staff Attendance & Time Clock', desc: 'Campus GPS clock-in, punch logs', icon: Clock, color: '#7C3AED' },
  { id: 'students', label: 'Student Directory & Admissions', desc: '360° student profiles, admissions', icon: GraduationCap, color: '#0D9488' },
  { id: 'communication', label: 'Notices & Announcements', desc: 'Emergency broadcast, parent alerts', icon: Mail, color: '#EA580C' },
  { id: 'settings', label: 'Branch Settings & Governance', desc: 'Branch configuration, audit protocols', icon: Settings, color: '#475569' }
];

const ROLE_DEFAULT_PERMISSIONS = {
  'Principal': ['academics', 'finance', 'library', 'transport', 'attendance', 'students', 'communication', 'settings'],
  'Administrator': ['academics', 'finance', 'library', 'transport', 'attendance', 'students', 'communication', 'settings'],
  'Teacher': ['academics', 'attendance', 'students', 'communication'],
  'Accountant': ['finance', 'attendance', 'students'],
  'Librarian': ['library', 'attendance', 'students', 'communication'],
  'Transport Incharge': ['transport', 'attendance', 'students', 'communication'],
  'Lab Assistant': ['academics', 'attendance'],
  'Frontdesk': ['students', 'attendance', 'communication'],
  'Support Staff': ['attendance']
};

const ManageStaffRoleModal = ({
  isOpen,
  onClose,
  staffMember,
  schoolsList = [],
  onStaffUpdated
}) => {
  if (!isOpen || !staffMember) return null;

  const [role, setRole] = useState(staffMember.role || 'Teacher');
  const [department, setDepartment] = useState(staffMember.department || 'General');
  const [schoolSlug, setSchoolSlug] = useState(staffMember.schoolSlug || '');
  const [status, setStatus] = useState(staffMember.status || 'Active');
  const [accessStatus, setAccessStatus] = useState(staffMember.accessStatus || 'Granted');
  const [permissions, setPermissions] = useState(staffMember.permissions || []);
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (staffMember) {
      setRole(staffMember.role || 'Teacher');
      setDepartment(staffMember.department || 'General');
      setSchoolSlug(staffMember.schoolSlug || (schoolsList[0]?.slug || ''));
      setStatus(staffMember.status || 'Active');
      setAccessStatus(staffMember.accessStatus || 'Granted');
      
      const initialPerms = Array.isArray(staffMember.permissions) && staffMember.permissions.length > 0 
        ? staffMember.permissions 
        : (ROLE_DEFAULT_PERMISSIONS[staffMember.role] || ['academics', 'attendance']);
      setPermissions(initialPerms);
      setNewPassword('');
      setErrorMsg('');
      setSuccessMsg('');
    }
  }, [staffMember, schoolsList]);

  const handleRoleChange = (newRole) => {
    setRole(newRole);
    // Suggest default department
    if (newRole === 'Principal' || newRole === 'Administrator') {
      setDepartment('Administration');
    } else if (newRole === 'Accountant') {
      setDepartment('Finance');
    } else if (newRole === 'Librarian') {
      setDepartment('Library');
    } else if (newRole === 'Transport Incharge') {
      setDepartment('Transport & Facilities');
    } else if (newRole === 'Lab Assistant') {
      setDepartment('Science Laboratories');
    }

    // Apply role default permissions
    if (ROLE_DEFAULT_PERMISSIONS[newRole]) {
      setPermissions(ROLE_DEFAULT_PERMISSIONS[newRole]);
    }
  };

  const handleTogglePermission = (permId) => {
    setPermissions(prev => {
      if (prev.includes(permId)) {
        return prev.filter(p => p !== permId);
      } else {
        return [...prev, permId];
      }
    });
  };

  const handleApplyPreset = (presetType) => {
    if (presetType === 'all') {
      setPermissions(MODULE_PERMISSIONS_LIST.map(m => m.id));
      setAccessStatus('Granted');
    } else if (presetType === 'default') {
      setPermissions(ROLE_DEFAULT_PERMISSIONS[role] || ['academics', 'attendance']);
      setAccessStatus('Granted');
    } else if (presetType === 'minimal') {
      setPermissions(['attendance']);
      setAccessStatus('Limited');
    }
  };

  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const userInfo = JSON.parse(sessionStorage.getItem('userInfo') || '{}');
      const token = userInfo.token || sessionStorage.getItem('token') || '';

      const payload = {
        role,
        department,
        schoolSlug,
        status,
        accessStatus,
        permissions,
        portalPassword: newPassword.trim() || undefined
      };

      const res = await fetch(`http://localhost:5000/api/school/staff/${staffMember._id}/role-permissions`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg(`Role & permissions for ${staffMember.name} updated successfully!`);
        if (onStaffUpdated) onStaffUpdated(data.staff);
        setTimeout(() => {
          onClose();
        }, 1200);
      } else {
        setErrorMsg(data.error || data.message || 'Failed to update staff permissions.');
      }
    } catch (err) {
      setErrorMsg('Network error: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return createPortal(
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(15, 23, 42, 0.65)',
      backdropFilter: 'blur(5px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999999,
      padding: '16px'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '20px',
        width: '100%',
        maxWidth: '680px',
        maxHeight: '92vh',
        overflowY: 'auto',
        padding: '26px 28px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        animation: 'fadeIn 0.2s ease-out'
      }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              background: '#e0e7ff',
              color: '#4338ca',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '1.1rem'
            }}>
              {staffMember.name?.charAt(0) || 'S'}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#1e293b' }}>
                  {staffMember.name}
                </h3>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, background: '#f1f5f9', color: '#475569', padding: '2px 6px', borderRadius: '4px' }}>
                  {staffMember.employeeId || 'EMP-STAFF'}
                </span>
              </div>
              <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '2px' }}>
                Grant, limit or transfer staff role authority and module permissions across branches
              </div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '4px' }}>
            <X size={20} />
          </button>
        </div>

        {/* Feedback Alerts */}
        {errorMsg && (
          <div style={{ padding: '12px 14px', background: '#fee2e2', border: '1px solid #fecdd3', borderRadius: '10px', color: '#b91c1c', fontSize: '0.82rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={16} /> {errorMsg}
          </div>
        )}
        {successMsg && (
          <div style={{ padding: '12px 14px', background: '#dcfce7', border: '1px solid #bbf7d0', borderRadius: '10px', color: '#15803d', fontSize: '0.82rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle2 size={16} /> {successMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          
          {/* SECTION 1: ROLE & BRANCH ASSIGNMENT */}
          <div style={{ background: '#f8fafc', padding: '16px 18px', borderRadius: '14px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#1e3a8a', textTransform: 'uppercase', letterSpacing: '0.4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ShieldCheck size={15} color="#4F46E5" /> 1. Role Designation & Branch Assignment
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
              {/* Role Select */}
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '5px' }}>
                  Assign Role Authority *
                </label>
                <select
                  value={role}
                  onChange={e => handleRoleChange(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', fontWeight: 700, background: 'white' }}
                >
                  <option value="Principal">Principal (Campus Head)</option>
                  <option value="Administrator">Administrator (Branch Admin)</option>
                  <option value="Teacher">Teacher (Faculty)</option>
                  <option value="Accountant">Accountant (Finance & Fee Desk)</option>
                  <option value="Librarian">Librarian (Media & Library)</option>
                  <option value="Transport Incharge">Transport Incharge (Fleet & Transit)</option>
                  <option value="Lab Assistant">Lab Assistant (Laboratories)</option>
                  <option value="Frontdesk">Frontdesk / Reception</option>
                  <option value="Support Staff">Support Staff / Operations</option>
                </select>
              </div>

              {/* Branch Select */}
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '5px' }}>
                  Assigned School Branch *
                </label>
                <select
                  value={schoolSlug}
                  onChange={e => setSchoolSlug(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', fontWeight: 600, background: 'white' }}
                >
                  {schoolsList.map(s => (
                    <option key={s.slug} value={s.slug}>
                      {s.name} ({s.slug})
                    </option>
                  ))}
                </select>
              </div>

              {/* Department */}
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '5px' }}>
                  Department
                </label>
                <input
                  type="text"
                  value={department}
                  onChange={e => setDepartment(e.target.value)}
                  placeholder="e.g. Science, Mathematics..."
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', boxSizing: 'border-box' }}
                />
              </div>

              {/* Operational Status */}
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '5px' }}>
                  Employment Status
                </label>
                <select
                  value={status}
                  onChange={e => setStatus(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', fontWeight: 600, background: 'white' }}
                >
                  <option value="Active">Active Duty</option>
                  <option value="Probation">On Probation</option>
                  <option value="On Leave">On Leave</option>
                  <option value="Suspended">Suspended</option>
                  <option value="Resigned">Resigned</option>
                </select>
              </div>
            </div>
          </div>

          {/* SECTION 2: ACCESS STATUS & MODULE PERMISSION MATRIX */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
              <div>
                <div style={{ fontSize: '0.84rem', fontWeight: 800, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Key size={16} color="#6366f1" /> 2. Granular Module Permissions & Access Limits
                </div>
                <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '2px' }}>
                  Super Admin has authority to grant or limit permissions to specific operational modules
                </div>
              </div>

              {/* Quick Presets */}
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('all')}
                  style={{ padding: '4px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#f8fafc', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer' }}
                >
                  Grant All
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('default')}
                  style={{ padding: '4px 10px', borderRadius: '6px', border: '1px solid #c7d2fe', background: '#eef2ff', color: '#4338ca', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer' }}
                >
                  Role Default
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('minimal')}
                  style={{ padding: '4px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#f8fafc', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer' }}
                >
                  Restrict
                </button>
              </div>
            </div>

            {/* Access Status Radio Buttons */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
              {[
                { id: 'Granted', label: 'Access Granted', desc: 'Full duty access', color: '#15803d', bg: '#f0fdf4', border: '#bbf7d0' },
                { id: 'Limited', label: 'Access Limited', desc: 'Checked modules only', color: '#b45309', bg: '#fffbeb', border: '#fde68a' },
                { id: 'Suspended', label: 'Access Suspended', desc: 'Login locked / frozen', color: '#dc2626', bg: '#fef2f2', border: '#fecdd3' },
              ].map(opt => (
                <div
                  key={opt.id}
                  onClick={() => setAccessStatus(opt.id)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: accessStatus === opt.id ? `2px solid ${opt.color}` : '1px solid #e2e8f0',
                    background: accessStatus === opt.id ? opt.bg : '#ffffff',
                    cursor: 'pointer',
                    transition: 'all 0.15s'
                  }}
                >
                  <div style={{ fontWeight: 800, fontSize: '0.8rem', color: accessStatus === opt.id ? opt.color : '#1e293b' }}>
                    {opt.label}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '1px' }}>
                    {opt.desc}
                  </div>
                </div>
              ))}
            </div>

            {/* Permissions Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '10px' }}>
              {MODULE_PERMISSIONS_LIST.map((mod) => {
                const isChecked = permissions.includes(mod.id);
                const IconComponent = mod.icon;
                return (
                  <label
                    key={mod.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      border: isChecked ? '1px solid #a5b4fc' : '1px solid #e2e8f0',
                      background: isChecked ? '#f5f3ff' : '#f8fafc',
                      cursor: accessStatus === 'Suspended' ? 'not-allowed' : 'pointer',
                      opacity: accessStatus === 'Suspended' ? 0.6 : 1,
                      transition: 'all 0.15s'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: isChecked ? '#ede9fe' : '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <IconComponent size={16} color={isChecked ? mod.color : '#64748b'} />
                      </div>
                      <div>
                        <div style={{ fontSize: '0.82rem', fontWeight: 700, color: isChecked ? '#1e293b' : '#475569' }}>
                          {mod.label}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
                          {mod.desc}
                        </div>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={isChecked}
                      disabled={accessStatus === 'Suspended'}
                      onChange={() => handleTogglePermission(mod.id)}
                      style={{ width: '17px', height: '17px', accentColor: '#4F46E5', cursor: 'pointer' }}
                    />
                  </label>
                );
              })}
            </div>
          </div>

          {/* SECTION 3: PORTAL LOGIN CREDENTIALS */}
          <div style={{ background: '#f8fafc', padding: '14px 18px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569' }}>Portal Username</div>
              <code style={{ fontSize: '0.84rem', color: '#1e293b', fontWeight: 800, background: '#ffffff', padding: '2px 8px', borderRadius: '4px', border: '1px solid #cbd5e1' }}>
                {staffMember.portalUsername || 'No linked user'}
              </code>
            </div>

            <div style={{ minWidth: '220px', flex: 1, maxWidth: '280px' }}>
              <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: '#475569', marginBottom: '3px' }}>
                Reset Password (Optional)
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter new password to reset"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  style={{ width: '100%', padding: '7px 32px 7px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.8rem', boxSizing: 'border-box' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: '8px', top: '7px', background: 'transparent', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', borderTop: '1px solid #f1f5f9', paddingTop: '16px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '9px 18px',
                borderRadius: '10px',
                border: '1px solid #cbd5e1',
                background: 'white',
                color: '#475569',
                fontWeight: 700,
                fontSize: '0.84rem',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                padding: '9px 22px',
                borderRadius: '10px',
                border: 'none',
                background: 'linear-gradient(135deg, #4F46E5 0%, #4338ca 100%)',
                color: 'white',
                fontWeight: 800,
                fontSize: '0.85rem',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)',
                opacity: isSubmitting ? 0.7 : 1
              }}
            >
              <Check size={16} />
              {isSubmitting ? 'Saving Changes...' : 'Save Role & Permission Updates'}
            </button>
          </div>

        </form>
      </div>
    </div>,
    document.body
  );
};

export default ManageStaffRoleModal;
