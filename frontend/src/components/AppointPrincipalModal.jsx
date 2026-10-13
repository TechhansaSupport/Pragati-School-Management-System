import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, UserCheck, Eye, EyeOff, CheckCircle2, AlertCircle, Building2, Lock, Mail, Phone, Award } from 'lucide-react';

const AppointPrincipalModal = ({ isOpen, onClose, targetSchool, onPrincipalAppointed }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [qualification, setQualification] = useState('');
  const [portalUsername, setPortalUsername] = useState('');
  const [portalPassword, setPortalPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (isOpen && targetSchool) {
      if (targetSchool.principal) {
        setName(targetSchool.principal.name || '');
        setEmail(targetSchool.principal.email || '');
        setPhone(targetSchool.principal.phone || '');
        setQualification(targetSchool.principal.qualification || '');
        setPortalUsername(targetSchool.principal.portalUsername || '');
      } else {
        setName('');
        setEmail(`${targetSchool.slug}.principal@pragati.edu`);
        setPhone('');
        setQualification('Ph.D / M.Ed in Educational Leadership');
        setPortalUsername(`${targetSchool.slug}_principal`);
      }
      setPortalPassword('Principal@123');
      setErrorMsg('');
      setSuccessMsg('');
    }
  }, [isOpen, targetSchool]);

  if (!isOpen || !targetSchool) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Principal name is required');
      return;
    }
    setIsSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const userInfo = JSON.parse(sessionStorage.getItem('userInfo') || '{}');
      const token = userInfo.token || sessionStorage.getItem('token') || '';

      const res = await fetch(`http://localhost:5000/api/school/${targetSchool.slug}/appoint-principal`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'x-tenant-slug': targetSchool.slug
        },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          qualification: qualification.trim(),
          portalUsername: portalUsername.trim(),
          portalPassword: portalPassword.trim()
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg(`✓ Principal "${name}" successfully appointed for ${targetSchool.name}!`);
        window.dispatchEvent(new CustomEvent('schoolListChanged'));
        if (onPrincipalAppointed) onPrincipalAppointed(data.principal);
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        setErrorMsg(data.error || 'Failed to appoint principal.');
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
        width: '600px',
        maxWidth: '95vw',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        border: '1px solid rgba(226, 232, 240, 0.8)',
        animation: 'slide-up 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        padding: '32px'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: '48px', height: '48px', borderRadius: '14px',
              background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.1) 0%, rgba(15, 118, 110, 0.1) 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <UserCheck size={26} color="#4F46E5" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#1e3a8a', margin: 0 }}>
                Appoint School Principal
              </h3>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: '#64748b' }}>
                Appoint the executive leadership and administrator for this school campus.
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            style={{
              background: '#f1f5f9', border: 'none', width: '32px', height: '32px',
              borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#64748b'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Target School Badge */}
        <div style={{
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          marginBottom: '20px'
        }}>
          <Building2 size={18} color="#4F46E5" />
          <div style={{ fontSize: '0.88rem', color: '#334155' }}>
            Appointing for: <strong style={{ color: '#1e3a8a' }}>{targetSchool.name}</strong> 
            <span style={{ marginLeft: '8px', padding: '2px 8px', borderRadius: '6px', background: '#e0e7ff', color: '#4338ca', fontSize: '0.75rem', fontWeight: 600 }}>
              /{targetSchool.slug}
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Principal Name */}
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
                Principal Full Name *
              </label>
              <input 
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Dr. Rajiv Menon or Dr. Sunita Rao"
                style={{ width: '100%', padding: '11px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>

            {/* Qualification */}
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
                Educational Qualifications
              </label>
              <input 
                type="text"
                value={qualification}
                onChange={e => setQualification(e.target.value)}
                placeholder="e.g. Ph.D in Educational Leadership, M.Sc Physics, B.Ed"
                style={{ width: '100%', padding: '11px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>

            {/* Email & Phone Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
                  Official Email Address
                </label>
                <input 
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="principal@school.edu"
                  style={{ width: '100%', padding: '11px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
                  Phone / Mobile Number
                </label>
                <input 
                  type="text"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  style={{ width: '100%', padding: '11px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
            </div>

            {/* Portal Login Credentials Section */}
            <div style={{
              background: '#f8fafc',
              border: '1.5px solid #e2e8f0',
              borderRadius: '16px',
              padding: '16px',
              marginTop: '4px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <Lock size={16} color="#059669" />
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1e293b' }}>
                  Principal Login Credentials for this School
                </span>
              </div>
              <p style={{ margin: '0 0 12px 0', fontSize: '0.78rem', color: '#64748b' }}>
                These credentials will allow the appointed Principal to sign in at <strong>/{targetSchool.slug}/login</strong> and access their dedicated Principal dashboard.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
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
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
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
              <div style={{ padding: '10px 14px', borderRadius: '10px', background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertCircle size={16} />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div style={{ padding: '10px 14px', borderRadius: '10px', background: '#ecfdf5', border: '1px solid #a7f3d0', color: '#047857', fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 size={16} />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Action Buttons */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
              <button
                type="button"
                onClick={onClose}
                style={{ padding: '10px 18px', background: 'white', border: '1px solid #cbd5e1', borderRadius: '10px', color: '#475569', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                style={{ padding: '10px 22px', background: isSubmitting ? '#94a3b8' : 'linear-gradient(135deg, #4F46E5 0%, #1e40af 100%)', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 700, fontSize: '0.9rem', cursor: isSubmitting ? 'not-allowed' : 'pointer', boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)' }}
              >
                {isSubmitting ? 'Appointing Principal...' : 'Confirm Appointment'}
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
