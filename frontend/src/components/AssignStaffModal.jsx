import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, UserPlus, CheckCircle2, AlertCircle, Building2, Lock, Mail, 
  Phone, Briefcase, BookOpen, Key, Copy, Check, Eye, EyeOff, ArrowRight, RefreshCw, UserCheck
} from 'lucide-react';

const AssignStaffModal = ({ isOpen, onClose, targetSchool, schoolsList = [], onStaffAssigned }) => {
  const [selectedSchoolSlug, setSelectedSchoolSlug] = useState('');
  const [mode, setMode] = useState('new'); // 'new' | 'reassign'

  // Form Fields
  const [name, setName] = useState('');
  const [role, setRole] = useState('Teacher');
  const [department, setDepartment] = useState('Science');
  const [qualification, setQualification] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [salary, setSalary] = useState(55000);
  const [subjects, setSubjects] = useState('');
  const [classes, setClasses] = useState('');
  const [portalUsername, setPortalUsername] = useState('');
  const [portalPassword, setPortalPassword] = useState('Staff@123');
  const [showPassword, setShowPassword] = useState(false);
  const [createPortalAccess, setCreatePortalAccess] = useState(true);

  // Reassignment mode fields
  const [allExistingStaff, setAllExistingStaff] = useState([]);
  const [selectedExistingStaffId, setSelectedExistingStaffId] = useState('');
  const [isLoadingExistingStaff, setIsLoadingExistingStaff] = useState(false);

  // Feedback states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successData, setSuccessData] = useState(null);
  const [copiedKey, setCopiedKey] = useState(false);

  // Departments & Roles
  const departments = [
    'Science', 'Mathematics', 'Languages', 'Social Studies', 
    'Commerce', 'Arts & Music', 'Administration', 'Finance', 
    'Library', 'Transport & Facilities', 'Sports & Physical Ed'
  ];

  const roles = [
    'Teacher', 'Administrator', 'Principal', 'Accountant', 
    'Librarian', 'Transport Incharge', 'Frontdesk', 'Support Staff', 'Lab Assistant'
  ];

  useEffect(() => {
    if (isOpen) {
      const initialSlug = targetSchool?.slug || (schoolsList.length > 0 ? schoolsList[0].slug : '');
      setSelectedSchoolSlug(initialSlug);
      resetForm(initialSlug);
      if (mode === 'reassign') {
        fetchExistingStaff();
      }
    }
  }, [isOpen, targetSchool, schoolsList]);

  const resetForm = (schoolSlug) => {
    setName('');
    setRole('Teacher');
    setDepartment('Science');
    setQualification('');
    setEmail('');
    setPhone('');
    setSalary(55000);
    setSubjects('');
    setClasses('');
    setPortalUsername('');
    setPortalPassword('Staff@123');
    setCreatePortalAccess(true);
    setErrorMsg('');
    setSuccessData(null);
    setCopiedKey(false);
    setSelectedExistingStaffId('');
  };

  const handleRoleChange = (newRole) => {
    setRole(newRole);
    if (newRole === 'Administrator') {
      setDepartment('Administration');
      setSalary(85000);
    } else if (newRole === 'Principal') {
      setDepartment('Administration');
      setSalary(95000);
    } else if (newRole === 'Accountant') {
      setDepartment('Finance');
      setSalary(50000);
    } else if (newRole === 'Librarian') {
      setDepartment('Library');
      setSalary(42000);
    } else if (newRole === 'Transport Incharge') {
      setDepartment('Transport & Facilities');
      setSalary(40000);
    }
  };

  const fetchExistingStaff = async () => {
    setIsLoadingExistingStaff(true);
    try {
      const userInfo = JSON.parse(sessionStorage.getItem('userInfo') || '{}');
      const token = userInfo.token || sessionStorage.getItem('token') || '';
      const res = await fetch('http://localhost:5000/api/staff?all=true', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (res.ok) {
        const data = await res.json();
        setAllExistingStaff(data.staff || []);
      }
    } catch (e) {
      console.warn('Failed to load existing staff for reassign:', e);
    } finally {
      setIsLoadingExistingStaff(false);
    }
  };

  if (!isOpen) return null;

  const currentSchoolObj = schoolsList.find(s => s.slug === selectedSchoolSlug) || targetSchool;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedSchoolSlug) {
      setErrorMsg('Please select a target school campus.');
      return;
    }

    if (mode === 'new' && !name.trim()) {
      setErrorMsg('Staff full name is required.');
      return;
    }

    if (mode === 'reassign' && !selectedExistingStaffId) {
      setErrorMsg('Please select a staff member to reassign.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const userInfo = JSON.parse(sessionStorage.getItem('userInfo') || '{}');
      const token = userInfo.token || sessionStorage.getItem('token') || '';

      const payload = mode === 'reassign' 
        ? { existingStaffId: selectedExistingStaffId }
        : {
            name: name.trim(),
            role,
            department,
            qualification: qualification.trim(),
            email: email.trim() || undefined,
            phone: phone.trim() || undefined,
            salary: Number(salary) || 0,
            subjects,
            classes,
            portalUsername: portalUsername.trim() || undefined,
            portalPassword: portalPassword.trim() || 'Staff@123',
            createPortalAccess
          };

      const res = await fetch(`http://localhost:5000/api/school/${selectedSchoolSlug}/assign-staff`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'x-tenant-slug': selectedSchoolSlug
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessData({
          staff: data.staff,
          portalUser: data.portalUser,
          schoolName: currentSchoolObj?.name || selectedSchoolSlug,
          schoolSlug: selectedSchoolSlug,
          role: mode === 'reassign' ? data.staff?.role : role,
          password: portalPassword
        });
        window.dispatchEvent(new CustomEvent('schoolListChanged'));
        window.dispatchEvent(new CustomEvent('schoolListUpdated'));
        if (onStaffAssigned) onStaffAssigned(data.staff);
      } else {
        setErrorMsg(data.error || data.message || 'Failed to assign staff member.');
      }
    } catch (err) {
      setErrorMsg('Network error: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyCredentials = () => {
    if (!successData?.portalUser) return;
    const credText = `Campus: ${successData.schoolName}\nRole: ${successData.role}\nUsername: ${successData.portalUser.username}\nPassword: ${successData.password || 'Staff@123'}\nPortal URL: ${window.location.origin}/${successData.schoolSlug}/login`;
    navigator.clipboard.writeText(credText);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2500);
  };

  return createPortal(
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(15, 23, 42, 0.7)',
      backdropFilter: 'blur(8px)',
      WebkitBackdropFilter: 'blur(8px)',
      zIndex: 999999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        background: '#ffffff',
        borderRadius: '24px',
        width: '680px',
        maxWidth: '96vw',
        maxHeight: '92vh',
        overflowY: 'auto',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
        border: '1px solid rgba(226, 232, 240, 0.9)',
        padding: '32px',
        position: 'relative'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.12) 0%, rgba(15, 118, 110, 0.12) 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid rgba(79, 70, 229, 0.2)'
            }}>
              <UserPlus size={26} color="#4F46E5" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#1e3a8a', margin: 0 }}>
                Assign Leadership & Staff
              </h3>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: '#64748b' }}>
                Appoint Admins, Principals, Teachers, Accountants, or staff to any school branch
              </p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose}
            style={{
              background: '#f1f5f9',
              border: 'none',
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#64748b'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Mode Selector */}
        <div style={{ 
          display: 'flex', 
          background: '#f1f5f9', 
          padding: '4px', 
          borderRadius: '12px', 
          marginBottom: '20px' 
        }}>
          <button
            type="button"
            onClick={() => setMode('new')}
            style={{
              flex: 1,
              padding: '8px 12px',
              borderRadius: '9px',
              border: 'none',
              fontWeight: 700,
              fontSize: '0.82rem',
              cursor: 'pointer',
              background: mode === 'new' ? '#ffffff' : 'transparent',
              color: mode === 'new' ? '#4F46E5' : '#64748b',
              boxShadow: mode === 'new' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
              transition: 'all 0.2s'
            }}
          >
            + Create & Appoint New Staff / Leader
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('reassign');
              fetchExistingStaff();
            }}
            style={{
              flex: 1,
              padding: '8px 12px',
              borderRadius: '9px',
              border: 'none',
              fontWeight: 700,
              fontSize: '0.82rem',
              cursor: 'pointer',
              background: mode === 'reassign' ? '#ffffff' : 'transparent',
              color: mode === 'reassign' ? '#4F46E5' : '#64748b',
              boxShadow: mode === 'reassign' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
              transition: 'all 0.2s'
            }}
          >
            Transfer Existing Staff Between Campuses
          </button>
        </div>

        {successData ? (
          /* SUCCESS VIEW */
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: '#dcfce7',
              color: '#15803d',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px auto'
            }}>
              <CheckCircle2 size={36} />
            </div>
            <h4 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#1e3a8a', margin: '0 0 6px 0' }}>
              Staff Appointed Successfully!
            </h4>
            <p style={{ color: '#64748b', fontSize: '0.9rem', maxWidth: '480px', margin: '0 auto 18px auto' }}>
              <strong>{successData.staff?.name}</strong> has been assigned to <strong>{successData.schoolName}</strong> as <strong>{successData.role}</strong>.
            </p>

            {successData.portalUser && (
              <div style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '14px',
                padding: '16px',
                maxWidth: '460px',
                margin: '0 auto 20px auto',
                textAlign: 'left'
              }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>
                  🔑 Generated Login Credentials
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontSize: '0.85rem', color: '#475569' }}>Username:</span>
                  <code style={{ fontSize: '0.9rem', fontWeight: 700, background: '#ffffff', padding: '2px 8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                    {successData.portalUser.username}
                  </code>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <span style={{ fontSize: '0.85rem', color: '#475569' }}>Password:</span>
                  <code style={{ fontSize: '0.9rem', fontWeight: 700, background: '#ffffff', padding: '2px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', color: '#0f766e' }}>
                    {successData.password || 'Staff@123'}
                  </code>
                </div>
                <button
                  type="button"
                  onClick={handleCopyCredentials}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    padding: '8px',
                    borderRadius: '8px',
                    background: copiedKey ? '#dcfce7' : '#ffffff',
                    border: '1px solid #cbd5e1',
                    color: copiedKey ? '#15803d' : '#475569',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  {copiedKey ? <Check size={14} /> : <Copy size={14} />}
                  {copiedKey ? 'Credentials Copied to Clipboard!' : 'Copy Credentials for Staff Member'}
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={() => {
                onClose();
                resetForm();
              }}
              style={{
                padding: '12px 32px',
                background: 'linear-gradient(135deg, #4F46E5 0%, #1e40af 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                fontWeight: 700,
                fontSize: '0.95rem',
                cursor: 'pointer',
                boxShadow: '0 4px 15px rgba(79, 70, 229, 0.4)'
              }}
            >
              Done
            </button>
          </div>
        ) : (
          /* FORM VIEW */
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

              {/* Target School Selector */}
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
                  Target School Campus *
                </label>
                <select
                  value={selectedSchoolSlug}
                  onChange={(e) => setSelectedSchoolSlug(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '0.92rem',
                    fontWeight: 600,
                    color: '#1e293b',
                    outline: 'none',
                    background: '#f8fafc'
                  }}
                  required
                >
                  {schoolsList.map((s) => (
                    <option key={s.slug} value={s.slug}>
                      {s.name} ({s.slug}) {s.isBranch ? '— Branch' : '— Main School'}
                    </option>
                  ))}
                </select>
              </div>

              {mode === 'reassign' ? (
                /* REASSIGNMENT FORM */
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
                    Select Staff Member to Transfer *
                  </label>
                  {isLoadingExistingStaff ? (
                    <div style={{ padding: '12px', fontSize: '0.85rem', color: '#64748b' }}>
                      <RefreshCw size={14} className="spin" style={{ marginRight: '6px' }} /> Loading staff list...
                    </div>
                  ) : (
                    <select
                      value={selectedExistingStaffId}
                      onChange={(e) => setSelectedExistingStaffId(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: '10px',
                        border: '1.5px solid #cbd5e1',
                        fontSize: '0.92rem',
                        fontWeight: 600,
                        color: '#1e293b',
                        outline: 'none',
                        background: '#f8fafc'
                      }}
                      required
                    >
                      <option value="">-- Choose Staff Member --</option>
                      {allExistingStaff.map((st) => (
                        <option key={st._id} value={st._id}>
                          {st.name} — {st.role} ({st.department}) [Currently: {st.schoolSlug || 'Main'}]
                        </option>
                      ))}
                    </select>
                  )}
                  <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '6px' }}>
                    This staff member and their portal login will be transferred to {currentSchoolObj?.name || selectedSchoolSlug}.
                  </p>
                </div>
              ) : (
                /* NEW STAFF FORM */
                <>
                  {/* Role & Department */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
                        Role to Appoint *
                      </label>
                      <select
                        value={role}
                        onChange={(e) => handleRoleChange(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '10px 14px',
                          borderRadius: '10px',
                          border: '1.5px solid #cbd5e1',
                          fontSize: '0.92rem',
                          fontWeight: 700,
                          color: '#4F46E5',
                          outline: 'none',
                          background: '#f5f3ff'
                        }}
                      >
                        {roles.map(r => (
                          <option key={r} value={r}>{r}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
                        Department *
                      </label>
                      <select
                        value={department}
                        onChange={(e) => setDepartment(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '10px 14px',
                          borderRadius: '10px',
                          border: '1.5px solid #cbd5e1',
                          fontSize: '0.92rem',
                          fontWeight: 600,
                          color: '#1e293b',
                          outline: 'none',
                          background: '#f8fafc'
                        }}
                      >
                        {departments.map(d => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Name & Qualification */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '14px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
                        Full Name *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Dr. Rajesh Sharma"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '10px 14px',
                          borderRadius: '10px',
                          border: '1.5px solid #cbd5e1',
                          fontSize: '0.92rem',
                          outline: 'none'
                        }}
                        required
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
                        Qualification
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. M.Sc, B.Ed / MBA"
                        value={qualification}
                        onChange={(e) => setQualification(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '10px 14px',
                          borderRadius: '10px',
                          border: '1.5px solid #cbd5e1',
                          fontSize: '0.92rem',
                          outline: 'none'
                        }}
                      />
                    </div>
                  </div>

                  {/* Contact Info: Email & Phone */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '14px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
                        Email Address
                      </label>
                      <input
                        type="email"
                        placeholder="e.g. r.sharma@pragati.edu"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '10px 14px',
                          borderRadius: '10px',
                          border: '1.5px solid #cbd5e1',
                          fontSize: '0.92rem',
                          outline: 'none'
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
                        Contact Phone
                      </label>
                      <input
                        type="tel"
                        placeholder="e.g. +91 98765 43210"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '10px 14px',
                          borderRadius: '10px',
                          border: '1.5px solid #cbd5e1',
                          fontSize: '0.92rem',
                          outline: 'none'
                        }}
                      />
                    </div>
                  </div>

                  {/* Subjects / Classes (if Teacher) */}
                  {role === 'Teacher' && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
                          Subjects Taught
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Physics, General Science"
                          value={subjects}
                          onChange={(e) => setSubjects(e.target.value)}
                          style={{
                            width: '100%',
                            padding: '10px 14px',
                            borderRadius: '10px',
                            border: '1.5px solid #cbd5e1',
                            fontSize: '0.92rem',
                            outline: 'none'
                          }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
                          Assigned Classes
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. 9th - A, 10th - B"
                          value={classes}
                          onChange={(e) => setClasses(e.target.value)}
                          style={{
                            width: '100%',
                            padding: '10px 14px',
                            borderRadius: '10px',
                            border: '1.5px solid #cbd5e1',
                            fontSize: '0.92rem',
                            outline: 'none'
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Portal Credentials Section */}
                  <div style={{
                    padding: '14px',
                    borderRadius: '12px',
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px'
                  }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={createPortalAccess}
                        onChange={(e) => setCreatePortalAccess(e.target.checked)}
                        style={{ accentColor: '#4F46E5', width: '16px', height: '16px' }}
                      />
                      <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1e3a8a' }}>
                        Provision Portal Login Access for this School
                      </span>
                    </label>

                    {createPortalAccess && (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#64748b', marginBottom: '4px' }}>
                            Username (Optional - auto generated if empty)
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. delhi_sharma"
                            value={portalUsername}
                            onChange={(e) => setPortalUsername(e.target.value)}
                            style={{
                              width: '100%',
                              padding: '8px 12px',
                              borderRadius: '8px',
                              border: '1px solid #cbd5e1',
                              fontSize: '0.85rem',
                              outline: 'none'
                            }}
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#64748b', marginBottom: '4px' }}>
                            Initial Password
                          </label>
                          <div style={{ position: 'relative' }}>
                            <input
                              type={showPassword ? 'text' : 'password'}
                              value={portalPassword}
                              onChange={(e) => setPortalPassword(e.target.value)}
                              style={{
                                width: '100%',
                                padding: '8px 34px 8px 12px',
                                borderRadius: '8px',
                                border: '1px solid #cbd5e1',
                                fontSize: '0.85rem',
                                outline: 'none'
                              }}
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              style={{
                                position: 'absolute',
                                right: '8px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                color: '#94a3b8'
                              }}
                            >
                              {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}

              {errorMsg && (
                <div style={{
                  padding: '10px 14px',
                  borderRadius: '10px',
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  color: '#b91c1c',
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <AlertCircle size={16} /> {errorMsg}
                </div>
              )}

              {/* Submit Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={onClose}
                  style={{
                    padding: '10px 20px',
                    borderRadius: '10px',
                    background: 'white',
                    border: '1px solid #cbd5e1',
                    color: '#475569',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{
                    padding: '10px 24px',
                    borderRadius: '10px',
                    background: 'linear-gradient(135deg, #4F46E5 0%, #1e40af 100%)',
                    color: 'white',
                    border: 'none',
                    fontWeight: 700,
                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
                    boxShadow: '0 4px 15px rgba(79, 70, 229, 0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw size={15} className="spin" /> Assigning...
                    </>
                  ) : (
                    mode === 'reassign' ? 'Transfer Staff to Campus' : `Appoint ${role} to School`
                  )}
                </button>
              </div>

            </div>
          </form>
        )}
      </div>
    </div>,
    document.body
  );
};

export default AssignStaffModal;
