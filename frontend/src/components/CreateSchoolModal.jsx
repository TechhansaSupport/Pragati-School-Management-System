import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Building2, CheckCircle2, AlertCircle, ExternalLink, MapPin, UserCog, UserCheck, ChevronDown, ChevronUp, Lock } from 'lucide-react';

const CreateSchoolModal = ({ isOpen, onClose, onSchoolCreated }) => {
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [slug, setSlug] = useState('');
  const [academicYear, setAcademicYear] = useState('2026-2027');

  // Optional Branch Admin
  const [showAdminSection, setShowAdminSection] = useState(false);
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('Admin@123');

  // Optional Principal
  const [showPrincipalSection, setShowPrincipalSection] = useState(false);
  const [principalName, setPrincipalName] = useState('');
  const [principalEmail, setPrincipalEmail] = useState('');
  const [principalUsername, setPrincipalUsername] = useState('');
  const [principalPassword, setPrincipalPassword] = useState('Principal@123');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [createdSchool, setCreatedSchool] = useState(null);

  const handleNameChange = (val) => {
    setName(val);
    const derived = val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    setSlug(derived);
    if (!adminUsername || adminUsername.endsWith('_admin')) {
      setAdminUsername(`${derived}_admin`);
    }
    if (!adminEmail || adminEmail.endsWith('.admin@pragati.edu')) {
      setAdminEmail(`${derived}.admin@pragati.edu`);
    }
    if (!principalUsername || principalUsername.endsWith('_principal')) {
      setPrincipalUsername(`${derived}_principal`);
    }
    if (!principalEmail || principalEmail.endsWith('.principal@pragati.edu')) {
      setPrincipalEmail(`${derived}.principal@pragati.edu`);
    }
  };

  const resetForm = () => {
    setName('');
    setAddress('');
    setSlug('');
    setShowAdminSection(false);
    setAdminName('');
    setAdminEmail('');
    setAdminUsername('');
    setAdminPassword('Admin@123');
    setShowPrincipalSection(false);
    setPrincipalName('');
    setPrincipalEmail('');
    setPrincipalUsername('');
    setPrincipalPassword('Principal@123');
    setErrorMsg('');
    setCreatedSchool(null);
  };

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('School name is required');
      return;
    }
    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const userInfo = JSON.parse(sessionStorage.getItem('userInfo') || '{}');
      const token = userInfo.token || sessionStorage.getItem('token') || '';
      const currentSlug = sessionStorage.getItem('tenantSlug') || '';

      const payload = {
        name: name.trim(),
        address: address.trim(),
        slug: slug.trim(),
        academicYear
      };

      if (adminName.trim()) {
        payload.admin = {
          name: adminName.trim(),
          email: adminEmail.trim(),
          portalUsername: adminUsername.trim(),
          portalPassword: adminPassword.trim() || 'Admin@123'
        };
      }

      if (principalName.trim()) {
        payload.principal = {
          name: principalName.trim(),
          email: principalEmail.trim(),
          portalUsername: principalUsername.trim(),
          portalPassword: principalPassword.trim() || 'Principal@123'
        };
      }

      const res = await fetch('http://localhost:5000/api/school/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'x-tenant-slug': currentSlug
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setCreatedSchool(data.school);
        window.dispatchEvent(new CustomEvent('schoolListChanged'));
        window.dispatchEvent(new CustomEvent('schoolListUpdated'));
        if (onSchoolCreated) onSchoolCreated(data.school);
      } else {
        setErrorMsg(data.error || data.message || 'Failed to register school.');
      }
    } catch (err) {
      setErrorMsg('Network error: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenInSeparateWindow = () => {
    if (createdSchool) {
      window.open(`/${createdSchool.slug}/dashboard`, '_blank');
      onClose();
      resetForm();
    }
  };

  return createPortal(
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(15, 23, 42, 0.65)',
      backdropFilter: 'blur(8px)',
      zIndex: 999999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '24px',
        width: '640px',
        maxWidth: '95vw',
        maxHeight: '92vh',
        overflowY: 'auto',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        border: '1px solid rgba(226, 232, 240, 0.8)',
        animation: 'slide-up 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        padding: '32px'
      }}>
        {/* Modal Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.1) 0%, rgba(30, 64, 175, 0.1) 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Building2 size={26} color="#4F46E5" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#1e3a8a', margin: 0 }}>
                Register New School Branch
              </h3>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: '#64748b' }}>
                Create a branch campus under your licensed organization. Appoint dedicated Branch Admin and Principal.
              </p>
            </div>
          </div>
          <button 
            onClick={() => { onClose(); resetForm(); }}
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

        {createdSchool ? (
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
            <h4 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#1e3a8a', margin: '0 0 8px 0' }}>
              School Branch Created Successfully!
            </h4>
            <p style={{ color: '#64748b', fontSize: '0.92rem', maxWidth: '480px', margin: '0 auto 16px auto' }}>
              <strong>{createdSchool.name}</strong> is now live with its dedicated workspace at <strong>/{createdSchool.slug}</strong>.
            </p>

            {/* Appointed Roles Summary */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', margin: '0 0 20px 0', textAlign: 'left' }}>
              <div style={{ padding: '14px', borderRadius: '12px', background: '#f5f3ff', border: '1px solid #ddd6fe' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#6d28d9', textTransform: 'uppercase' }}>
                  Branch Administrator
                </div>
                {createdSchool.admin ? (
                  <div style={{ marginTop: '6px' }}>
                    <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#1e293b' }}>{createdSchool.admin.name}</div>
                    <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Username: <code>{createdSchool.admin.portalUsername}</code></div>
                  </div>
                ) : (
                  <div style={{ fontSize: '0.78rem', color: '#6b7280', marginTop: '6px' }}>
                    Not appointed yet. You can appoint anytime from the school card.
                  </div>
                )}
              </div>

              <div style={{ padding: '14px', borderRadius: '12px', background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#15803d', textTransform: 'uppercase' }}>
                  School Principal
                </div>
                {createdSchool.principal ? (
                  <div style={{ marginTop: '6px' }}>
                    <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#1e293b' }}>{createdSchool.principal.name}</div>
                    <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Username: <code>{createdSchool.principal.portalUsername}</code></div>
                  </div>
                ) : (
                  <div style={{ fontSize: '0.78rem', color: '#6b7280', marginTop: '6px' }}>
                    Not appointed yet. You can appoint anytime from the school card.
                  </div>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '14px' }}>
              <button
                type="button"
                onClick={() => { onClose(); resetForm(); }}
                style={{ padding: '12px 24px', background: 'white', border: '1px solid #cbd5e1', borderRadius: '12px', color: '#475569', fontWeight: 600, cursor: 'pointer' }}
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleOpenInSeparateWindow}
                style={{
                  padding: '12px 26px',
                  background: 'linear-gradient(135deg, #4F46E5 0%, #1e40af 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 15px rgba(79, 70, 229, 0.4)'
                }}
              >
                <ExternalLink size={18} /> Open in Separate Window
              </button>
            </div>
          </div>
        ) : (
          /* FORM VIEW */
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* School Name */}
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
                  Branch Campus Name *
                </label>
                <input 
                  type="text"
                  required
                  value={name}
                  onChange={e => handleNameChange(e.target.value)}
                  placeholder="e.g. North Delhi Campus or Gurugram Branch"
                  style={{ width: '100%', padding: '11px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              {/* Campus Address */}
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
                  Campus Address & Location
                </label>
                <div style={{ position: 'relative' }}>
                  <MapPin size={16} style={{ position: 'absolute', left: '12px', top: '13px', color: '#94a3b8' }} />
                  <input 
                    type="text"
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                    placeholder="e.g. Sector 14, Ring Road, New Delhi - 110001"
                    style={{ width: '100%', padding: '11px 14px 11px 36px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              {/* Slug & Academic Year Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
                    URL Handle / Slug *
                  </label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: '0.85rem' }}>/</span>
                    <input 
                      type="text"
                      required
                      value={slug}
                      onChange={e => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                      placeholder="north-delhi-branch"
                      style={{ width: '100%', padding: '11px 14px 11px 24px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.88rem', outline: 'none', boxSizing: 'border-box' }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
                    Academic Year
                  </label>
                  <select 
                    value={academicYear} 
                    onChange={e => setAcademicYear(e.target.value)}
                    style={{ width: '100%', padding: '11px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.9rem', outline: 'none', background: 'white', boxSizing: 'border-box' }}
                  >
                    <option value="2026-2027">2026-2027</option>
                    <option value="2025-2026">2025-2026</option>
                    <option value="2027-2028">2027-2028</option>
                  </select>
                </div>
              </div>

              {/* Collapsible: Appoint Branch Admin (Optional) */}
              <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
                <button
                  type="button"
                  onClick={() => setShowAdminSection(!showAdminSection)}
                  style={{
                    width: '100%', padding: '12px 16px', background: showAdminSection ? '#f5f3ff' : '#f8fafc',
                    border: 'none', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', fontWeight: 700, color: '#6d28d9' }}>
                    <UserCog size={16} color="#7c3aed" /> Appoint Branch Administrator (Optional)
                  </span>
                  {showAdminSection ? <ChevronUp size={16} color="#6d28d9" /> : <ChevronDown size={16} color="#64748b" />}
                </button>

                {showAdminSection && (
                  <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', background: 'white' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                        Admin Full Name
                      </label>
                      <input 
                        type="text" 
                        value={adminName} 
                        onChange={e => setAdminName(e.target.value)} 
                        placeholder="e.g. Rohan Sharma" 
                        style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', boxSizing: 'border-box' }} 
                      />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                          Email
                        </label>
                        <input 
                          type="email" 
                          value={adminEmail} 
                          onChange={e => setAdminEmail(e.target.value)} 
                          style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', boxSizing: 'border-box' }} 
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                          Portal Username
                        </label>
                        <input 
                          type="text" 
                          value={adminUsername} 
                          onChange={e => setAdminUsername(e.target.value)} 
                          style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', boxSizing: 'border-box' }} 
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Collapsible: Appoint Principal (Optional) */}
              <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
                <button
                  type="button"
                  onClick={() => setShowPrincipalSection(!showPrincipalSection)}
                  style={{
                    width: '100%', padding: '12px 16px', background: showPrincipalSection ? '#f0fdf4' : '#f8fafc',
                    border: 'none', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', fontWeight: 700, color: '#15803d' }}>
                    <UserCheck size={16} color="#16a34a" /> Appoint School Principal (Optional)
                  </span>
                  {showPrincipalSection ? <ChevronUp size={16} color="#15803d" /> : <ChevronDown size={16} color="#64748b" />}
                </button>

                {showPrincipalSection && (
                  <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', background: 'white' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                        Principal Full Name
                      </label>
                      <input 
                        type="text" 
                        value={principalName} 
                        onChange={e => setPrincipalName(e.target.value)} 
                        placeholder="e.g. Dr. Sunita Rao" 
                        style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', boxSizing: 'border-box' }} 
                      />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                          Email
                        </label>
                        <input 
                          type="email" 
                          value={principalEmail} 
                          onChange={e => setPrincipalEmail(e.target.value)} 
                          style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', boxSizing: 'border-box' }} 
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                          Portal Username
                        </label>
                        <input 
                          type="text" 
                          value={principalUsername} 
                          onChange={e => setPrincipalUsername(e.target.value)} 
                          style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', boxSizing: 'border-box' }} 
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {errorMsg && (
                <div style={{ padding: '10px 14px', borderRadius: '10px', background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <AlertCircle size={16} />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => { onClose(); resetForm(); }}
                  style={{ padding: '10px 18px', background: 'white', border: '1px solid #cbd5e1', borderRadius: '10px', color: '#475569', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{ padding: '10px 22px', background: isSubmitting ? '#94a3b8' : 'linear-gradient(135deg, #4F46E5 0%, #1e40af 100%)', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 700, fontSize: '0.9rem', cursor: isSubmitting ? 'not-allowed' : 'pointer', boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)' }}
                >
                  {isSubmitting ? 'Registering School...' : 'Create School Branch'}
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

export default CreateSchoolModal;
