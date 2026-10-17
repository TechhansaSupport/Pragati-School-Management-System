import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, UserCheck, Eye, EyeOff, CheckCircle2, AlertCircle, Building2, 
  Lock, Mail, Phone, Award, Users, UserPlus, Search, GraduationCap, 
  Sparkles, Check, ArrowRight, ShieldCheck, ChevronRight
} from 'lucide-react';

const AppointPrincipalModal = ({ 
  isOpen, 
  onClose, 
  targetSchool, 
  schoolsList = [], 
  onPrincipalAppointed, 
  preSelectedTeacher = null,
  existingStaffList = null
}) => {
  // Mode: 'existing_teaching' | 'new_external'
  const [appointmentMode, setAppointmentMode] = useState('existing_teaching');
  
  // Selected school slug (in case user switches branch inside modal)
  const [activeSchoolSlug, setActiveSchoolSlug] = useState('');

  // Selected teaching staff
  const [teachers, setTeachers] = useState([]);
  const [isLoadingTeachers, setIsLoadingTeachers] = useState(false);
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [teacherSearch, setTeacherSearch] = useState('');
  const [campusFilter, setCampusFilter] = useState('all');

  // Form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [qualification, setQualification] = useState('');
  const [salary, setSalary] = useState(95000);
  const [portalUsername, setPortalUsername] = useState('');
  const [portalPassword, setPortalPassword] = useState('Principal@123');
  const [showPassword, setShowPassword] = useState(false);

  // Status states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Determine current active target school object
  const currentSchool = useMemo(() => {
    if (!activeSchoolSlug && targetSchool) return targetSchool;
    if (activeSchoolSlug && schoolsList.length > 0) {
      const found = schoolsList.find(s => s.slug === activeSchoolSlug);
      if (found) return found;
    }
    return targetSchool || (schoolsList.length > 0 ? schoolsList[0] : null);
  }, [activeSchoolSlug, targetSchool, schoolsList]);

  // Load teachers list
  const fetchTeachers = async () => {
    setIsLoadingTeachers(true);
    try {
      const userInfo = JSON.parse(sessionStorage.getItem('userInfo') || '{}');
      const token = userInfo.token || sessionStorage.getItem('token') || '';
      
      const res = await fetch('http://localhost:5000/api/staff/teachers', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (res.ok) {
        const data = await res.json();
        setTeachers(Array.isArray(data) ? data : []);
      } else if (existingStaffList && Array.isArray(existingStaffList)) {
        setTeachers(existingStaffList.filter(s => s.role === 'Teacher'));
      }
    } catch (e) {
      console.warn('Failed to fetch teaching staff:', e);
      if (existingStaffList && Array.isArray(existingStaffList)) {
        setTeachers(existingStaffList.filter(s => s.role === 'Teacher'));
      }
    } finally {
      setIsLoadingTeachers(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      const initialSlug = targetSchool?.slug || (schoolsList.length > 0 ? schoolsList[0].slug : '');
      setActiveSchoolSlug(initialSlug);
      setCampusFilter('all');
      setErrorMsg('');
      setSuccessMsg('');
      setTeacherSearch('');

      fetchTeachers();

      if (preSelectedTeacher) {
        setAppointmentMode('existing_teaching');
        handleSelectTeacher(preSelectedTeacher, initialSlug);
      } else if (targetSchool?.principal?.name) {
        // If school already has a principal, prefill new_external or let them select existing
        setName(targetSchool.principal.name || '');
        setEmail(targetSchool.principal.email || '');
        setPhone(targetSchool.principal.phone || '');
        setQualification(targetSchool.principal.qualification || '');
        setPortalUsername(targetSchool.principal.portalUsername || '');
        setPortalPassword('Principal@123');
        setSalary(95000);
        setSelectedTeacherId('');
        setAppointmentMode('existing_teaching');
      } else {
        // Default new state
        setSelectedTeacherId('');
        setAppointmentMode('existing_teaching');
        resetFormToDefault(initialSlug);
      }
    }
  }, [isOpen, targetSchool, preSelectedTeacher]);

  const resetFormToDefault = (slug) => {
    const s = slug || targetSchool?.slug || 'school';
    setName('');
    setEmail(`${s}.principal@pragati.edu`);
    setPhone('');
    setQualification('Ph.D / M.Ed in Educational Leadership');
    setSalary(95000);
    setPortalUsername(`${s}_principal`);
    setPortalPassword('Principal@123');
  };

  // When a teacher is selected
  const handleSelectTeacher = (teacher, slugOverride) => {
    if (!teacher) return;
    const s = slugOverride || currentSchool?.slug || targetSchool?.slug || 'school';
    setSelectedTeacherId(teacher._id);
    setName(teacher.name || '');
    setEmail(teacher.email || `${s}.principal@pragati.edu`);
    setPhone(teacher.phone || '');
    setQualification(teacher.qualification || 'M.Ed / B.Ed in Educational Leadership');
    setSalary(Math.max(Number(teacher.salary) || 0, 95000));
    
    // Suggest or retain username
    if (teacher.portalUsername) {
      setPortalUsername(teacher.portalUsername);
    } else {
      const sanitizedName = (teacher.name || 'principal').toLowerCase().replace(/[^a-z0-9]/g, '_');
      setPortalUsername(`${sanitizedName}_prin`);
    }
    setPortalPassword('Principal@123');
    setErrorMsg('');
  };

  // Filter teachers list
  const filteredTeachers = useMemo(() => {
    return teachers.filter(t => {
      // Exclude resigned or retired
      if (t.status === 'Resigned' || t.status === 'Retired') return false;

      // Filter by campus
      if (campusFilter !== 'all') {
        if (t.schoolSlug !== campusFilter) return false;
      }

      // Filter by search query
      if (teacherSearch.trim()) {
        const q = teacherSearch.toLowerCase();
        const matchesName = (t.name || '').toLowerCase().includes(q);
        const matchesEmpId = (t.employeeId || '').toLowerCase().includes(q);
        const matchesDept = (t.department || '').toLowerCase().includes(q);
        const matchesSubjects = Array.isArray(t.subjects) && t.subjects.some(s => (s || '').toLowerCase().includes(q));
        const matchesQual = (t.qualification || '').toLowerCase().includes(q);
        return matchesName || matchesEmpId || matchesDept || matchesSubjects || matchesQual;
      }
      return true;
    });
  }, [teachers, campusFilter, teacherSearch]);

  const selectedTeacherObj = useMemo(() => {
    return teachers.find(t => t._id === selectedTeacherId);
  }, [teachers, selectedTeacherId]);

  if (!isOpen || !currentSchool) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (appointmentMode === 'existing_teaching' && !selectedTeacherId) {
      setErrorMsg('Please select a teaching staff member from the list below to appoint as Principal.');
      return;
    }

    if (!name.trim()) {
      setErrorMsg('Principal name is required');
      return;
    }

    if (!portalUsername.trim()) {
      setErrorMsg('Portal username is required');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const userInfo = JSON.parse(sessionStorage.getItem('userInfo') || '{}');
      const token = userInfo.token || sessionStorage.getItem('token') || '';
      const effectiveSlug = currentSchool.slug;

      const payload = {
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        qualification: qualification.trim(),
        portalUsername: portalUsername.trim(),
        portalPassword: portalPassword.trim(),
        salary: Number(salary) || 95000,
        existingStaffId: appointmentMode === 'existing_teaching' ? selectedTeacherId : null
      };

      const res = await fetch(`http://localhost:5000/api/school/${effectiveSlug}/appoint-principal`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'x-tenant-slug': effectiveSlug
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (res.ok && data.success) {
        const modeLabel = appointmentMode === 'existing_teaching' 
          ? `✓ Promoted "${name}" from Teaching Staff to Principal of ${currentSchool.name}!`
          : `✓ Appointed "${name}" as Principal of ${currentSchool.name}!`;

        setSuccessMsg(modeLabel);
        window.dispatchEvent(new CustomEvent('schoolListChanged'));
        window.dispatchEvent(new CustomEvent('schoolListUpdated'));
        window.dispatchEvent(new CustomEvent('principalUpdated'));
        
        if (onPrincipalAppointed) onPrincipalAppointed(data.principal);
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        setErrorMsg(data.error || data.message || 'Failed to appoint principal.');
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
      top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(15, 23, 42, 0.72)',
      backdropFilter: 'blur(8px)',
      zIndex: 999999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        background: '#ffffff',
        borderRadius: '24px',
        width: '740px',
        maxWidth: '96vw',
        maxHeight: '92vh',
        overflowY: 'auto',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
        border: '1px solid rgba(226, 232, 240, 0.9)',
        animation: 'slide-up 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        padding: '30px'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: '50px', height: '50px', borderRadius: '16px',
              background: 'linear-gradient(135deg, #4F46E5 0%, #0d9488 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 8px 16px -4px rgba(79, 70, 229, 0.35)',
              color: 'white', flexShrink: 0
            }}>
              <Award size={28} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#1e293b', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                Appoint School Principal
                <span style={{ fontSize: '0.72rem', background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0', padding: '2px 8px', borderRadius: '10px', fontWeight: 700 }}>
                  Super Admin Authority
                </span>
              </h3>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.84rem', color: '#64748b' }}>
                Promote an existing teaching faculty member to Principal or register a new executive leader.
              </p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose}
            style={{
              background: '#f1f5f9', border: 'none', width: '34px', height: '34px',
              borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#64748b', transition: 'all 0.15s'
            }}
            onMouseOver={e => e.currentTarget.style.background = '#e2e8f0'}
            onMouseOut={e => e.currentTarget.style.background = '#f1f5f9'}
          >
            <X size={18} />
          </button>
        </div>

        {/* Target School Badge / Selector */}
        <div style={{
          background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
          border: '1.5px solid #e2e8f0',
          borderRadius: '14px',
          padding: '12px 18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '10px',
          marginBottom: '20px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Building2 size={20} color="#4F46E5" />
            <div>
              <div style={{ fontSize: '0.74rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Target Campus
              </div>
              <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#1e293b' }}>
                {currentSchool.name} 
                <span style={{ marginLeft: '8px', padding: '2px 8px', borderRadius: '6px', background: '#e0e7ff', color: '#4338ca', fontSize: '0.74rem', fontWeight: 700 }}>
                  /{currentSchool.slug}
                </span>
              </div>
            </div>
          </div>

          {/* If there are multiple schools, let Super Admin switch target campus right here */}
          {schoolsList.length > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>Switch Campus:</span>
              <select
                value={currentSchool.slug}
                onChange={e => {
                  const newSlug = e.target.value;
                  setActiveSchoolSlug(newSlug);
                  if (appointmentMode === 'new_external') {
                    resetFormToDefault(newSlug);
                  }
                }}
                style={{
                  padding: '5px 10px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  background: 'white',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  color: '#1e293b',
                  outline: 'none'
                }}
              >
                {schoolsList.map(s => (
                  <option key={s.slug} value={s.slug}>{s.name} ({s.slug})</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Appointment Mode Tabs */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '10px',
          background: '#f1f5f9',
          padding: '6px',
          borderRadius: '14px',
          marginBottom: '22px'
        }}>
          <button
            type="button"
            onClick={() => {
              setAppointmentMode('existing_teaching');
              setErrorMsg('');
            }}
            style={{
              padding: '10px 14px',
              borderRadius: '10px',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              fontWeight: 700,
              fontSize: '0.85rem',
              transition: 'all 0.2s',
              background: appointmentMode === 'existing_teaching' ? '#ffffff' : 'transparent',
              color: appointmentMode === 'existing_teaching' ? '#0f766e' : '#64748b',
              boxShadow: appointmentMode === 'existing_teaching' ? '0 4px 12px rgba(15, 118, 110, 0.15)' : 'none'
            }}
          >
            <Users size={17} color={appointmentMode === 'existing_teaching' ? '#0f766e' : '#64748b'} />
            <span>Appoint from Existing Teaching Staff</span>
            <span style={{
              background: appointmentMode === 'existing_teaching' ? '#ccfbf1' : '#e2e8f0',
              color: appointmentMode === 'existing_teaching' ? '#0f766e' : '#64748b',
              padding: '1px 7px',
              borderRadius: '12px',
              fontSize: '0.72rem',
              fontWeight: 800
            }}>
              {teachers.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setAppointmentMode('new_external');
              setSelectedTeacherId('');
              resetFormToDefault(currentSchool.slug);
              setErrorMsg('');
            }}
            style={{
              padding: '10px 14px',
              borderRadius: '10px',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              fontWeight: 700,
              fontSize: '0.85rem',
              transition: 'all 0.2s',
              background: appointmentMode === 'new_external' ? '#ffffff' : 'transparent',
              color: appointmentMode === 'new_external' ? '#4F46E5' : '#64748b',
              boxShadow: appointmentMode === 'new_external' ? '0 4px 12px rgba(79, 70, 229, 0.15)' : 'none'
            }}
          >
            <UserPlus size={17} color={appointmentMode === 'new_external' ? '#4F46E5' : '#64748b'} />
            <span>Register New External Principal</span>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* ────────── SECTION A: TEACHING STAFF ROSTER SELECTOR ────────── */}
          {appointmentMode === 'existing_teaching' && (
            <div style={{
              background: '#f8fafc',
              border: '1.5px solid #e2e8f0',
              borderRadius: '18px',
              padding: '18px',
              marginBottom: '22px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <GraduationCap size={18} color="#0f766e" />
                    Select Faculty / Teacher to Promote
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                    Click a teacher below to promote them as the appointed executive Principal.
                  </div>
                </div>

                {/* Campus filter for teachers */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Filter Campus:</span>
                  <select
                    value={campusFilter}
                    onChange={e => setCampusFilter(e.target.value)}
                    style={{
                      padding: '4px 8px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      background: 'white',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      outline: 'none'
                    }}
                  >
                    <option value="all">All Campuses ({teachers.length})</option>
                    <option value={currentSchool.slug}>This Campus ({currentSchool.name})</option>
                    {schoolsList.filter(s => s.slug !== currentSchool.slug).map(s => (
                      <option key={s.slug} value={s.slug}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Search Bar for Teachers */}
              <div style={{
                position: 'relative',
                marginBottom: '12px'
              }}>
                <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                <input 
                  type="text"
                  value={teacherSearch}
                  onChange={e => setTeacherSearch(e.target.value)}
                  placeholder="Search teachers by name, subject (e.g. Physics), department, or ID..."
                  style={{
                    width: '100%',
                    padding: '9px 12px 9px 36px',
                    borderRadius: '10px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.84rem',
                    outline: 'none',
                    background: 'white',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Teachers List Scroll Area */}
              <div style={{
                maxHeight: '210px',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                paddingRight: '4px'
              }}>
                {isLoadingTeachers ? (
                  <div style={{ padding: '24px', textAlign: 'center', color: '#64748b', fontSize: '0.84rem' }}>
                    Loading teaching staff roster...
                  </div>
                ) : filteredTeachers.length === 0 ? (
                  <div style={{ padding: '24px', textAlign: 'center', color: '#94a3b8', fontSize: '0.84rem', background: 'white', borderRadius: '10px', border: '1px dashed #cbd5e1' }}>
                    No teaching staff found matching your search. You can also switch to "Register New External Principal".
                  </div>
                ) : (
                  filteredTeachers.map(teacher => {
                    const isSelected = selectedTeacherId === teacher._id;
                    const teacherSchool = schoolsList.find(s => s.slug === teacher.schoolSlug);

                    return (
                      <div
                        key={teacher._id}
                        onClick={() => handleSelectTeacher(teacher)}
                        style={{
                          background: isSelected ? 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)' : '#ffffff',
                          border: isSelected ? '2px solid #10b981' : '1px solid #e2e8f0',
                          borderRadius: '12px',
                          padding: '10px 14px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                          boxShadow: isSelected ? '0 4px 12px rgba(16, 185, 129, 0.15)' : 'none'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          {/* Avatar */}
                          <div style={{
                            width: '38px', height: '38px', borderRadius: '10px',
                            background: isSelected ? '#10b981' : '#e0e7ff',
                            color: isSelected ? '#ffffff' : '#4338ca',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontWeight: 800, fontSize: '0.9rem', flexShrink: 0
                          }}>
                            {teacher.name.charAt(0)}
                          </div>

                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ fontWeight: 800, color: '#1e293b', fontSize: '0.88rem' }}>
                                {teacher.name}
                              </span>
                              <span style={{ fontSize: '0.7rem', color: '#64748b', background: '#f1f5f9', padding: '1px 6px', borderRadius: '4px', fontWeight: 600 }}>
                                {teacher.employeeId}
                              </span>
                              {teacher.schoolSlug && (
                                <span style={{ fontSize: '0.68rem', color: '#1e40af', background: '#eff6ff', padding: '1px 6px', borderRadius: '4px', fontWeight: 600 }}>
                                  Campus: {teacherSchool?.name || teacher.schoolSlug}
                                </span>
                              )}
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '3px', flexWrap: 'wrap' }}>
                              <span style={{ fontSize: '0.72rem', color: '#0f766e', fontWeight: 700, background: '#ccfbf1', padding: '1px 6px', borderRadius: '4px' }}>
                                {teacher.department || 'Academic'}
                              </span>
                              {Array.isArray(teacher.subjects) && teacher.subjects.length > 0 && (
                                <span style={{ fontSize: '0.72rem', color: '#475569' }}>
                                  Subjects: {teacher.subjects.join(', ')}
                                </span>
                              )}
                              {teacher.qualification && (
                                <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                                  • {teacher.qualification}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Radio indicator */}
                        <div style={{
                          width: '24px', height: '24px', borderRadius: '50%',
                          border: isSelected ? '2px solid #10b981' : '2px solid #cbd5e1',
                          background: isSelected ? '#10b981' : 'white',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: 'white', flexShrink: 0
                        }}>
                          {isSelected && <Check size={14} strokeWidth={3} />}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Selected Highlight Banner */}
              {selectedTeacherObj && (
                <div style={{
                  marginTop: '12px',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  background: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  fontSize: '0.8rem',
                  color: '#166534'
                }}>
                  <Sparkles size={16} color="#16a34a" />
                  <div>
                    Selected for Promotion: <strong>{selectedTeacherObj.name}</strong> ({selectedTeacherObj.employeeId}) will be appointed as <strong>Principal & Head of School</strong> for <strong>{currentSchool.name}</strong>.
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ────────── SECTION B: APPOINTMENT DETAILS & PORTAL CREDENTIALS ────────── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              {/* Principal Name */}
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  Principal Full Name *
                </label>
                <input 
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Dr. Rajiv Menon or Prof. Anita Desai"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.88rem', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              {/* Qualification */}
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  Educational Qualifications
                </label>
                <input 
                  type="text"
                  value={qualification}
                  onChange={e => setQualification(e.target.value)}
                  placeholder="e.g. Ph.D / M.Sc Physics, B.Ed, M.Ed"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.88rem', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
            </div>

            {/* Email & Phone Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  Official Email Address
                </label>
                <input 
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="principal@school.edu"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.88rem', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  Phone / Mobile Number
                </label>
                <input 
                  type="text"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.88rem', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
            </div>

            {/* Salary / Compensation */}
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                Executive Principal Salary (₹ / month)
              </label>
              <input 
                type="number"
                value={salary}
                onChange={e => setSalary(e.target.value)}
                placeholder="95000"
                style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.88rem', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>

            {/* Portal Login Credentials Section */}
            <div style={{
              background: '#f8fafc',
              border: '1.5px solid #e2e8f0',
              borderRadius: '16px',
              padding: '16px',
              marginTop: '4px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Lock size={16} color="#059669" />
                  <span style={{ fontSize: '0.86rem', fontWeight: 800, color: '#1e293b' }}>
                    Principal Portal Login Credentials
                  </span>
                </div>
                <span style={{ fontSize: '0.72rem', background: '#ecfdf5', color: '#047857', padding: '2px 8px', borderRadius: '6px', fontWeight: 700 }}>
                  Role: Principal
                </span>
              </div>
              <p style={{ margin: '0 0 12px 0', fontSize: '0.78rem', color: '#64748b' }}>
                These credentials will enable sign-in at <strong>/{currentSchool.slug}/login</strong> to access the Principal Leadership command console.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                    Sign-In Username *
                  </label>
                  <input 
                    type="text"
                    required
                    value={portalUsername}
                    onChange={e => setPortalUsername(e.target.value)}
                    placeholder="e.g. principal_menon"
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', outline: 'none', background: 'white', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                    Sign-In Password *
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input 
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={portalPassword}
                      onChange={e => setPortalPassword(e.target.value)}
                      placeholder="Password"
                      style={{ width: '100%', padding: '9px 34px 9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', outline: 'none', background: 'white', boxSizing: 'border-box' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 0, display: 'flex' }}
                    >
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Error & Success Alerts */}
            {errorMsg && (
              <div style={{ padding: '11px 14px', borderRadius: '10px', background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertCircle size={16} />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div style={{ padding: '11px 14px', borderRadius: '10px', background: '#ecfdf5', border: '1px solid #a7f3d0', color: '#047857', fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 size={16} />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Action Buttons */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
              <button
                type="button"
                onClick={onClose}
                style={{ padding: '10px 20px', background: 'white', border: '1px solid #cbd5e1', borderRadius: '10px', color: '#475569', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                style={{ 
                  padding: '10px 24px', 
                  background: isSubmitting 
                    ? '#94a3b8' 
                    : appointmentMode === 'existing_teaching' 
                      ? 'linear-gradient(135deg, #0f766e 0%, #0d9488 100%)' 
                      : 'linear-gradient(135deg, #4F46E5 0%, #1e40af 100%)', 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: '10px', 
                  fontWeight: 700, 
                  fontSize: '0.9rem', 
                  cursor: isSubmitting ? 'not-allowed' : 'pointer', 
                  boxShadow: '0 4px 14px rgba(15, 118, 110, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                {isSubmitting ? (
                  'Appointing Principal...'
                ) : appointmentMode === 'existing_teaching' ? (
                  <>
                    <Award size={16} /> Promote & Appoint Principal
                  </>
                ) : (
                  <>
                    <UserCheck size={16} /> Confirm Appointment
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

export default AppointPrincipalModal;
