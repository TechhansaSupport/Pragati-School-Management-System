import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, ShieldCheck, Eye, EyeOff, CheckCircle2, AlertCircle, Building2, Lock, Mail, Phone, UserCog } from 'lucide-react';

const AppointAdminModal = ({ isOpen, onClose, targetSchool, onAdminAppointed }) => {
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
      if (targetSchool.admin) {
        setName(targetSchool.admin.name || '');
        setEmail(targetSchool.admin.email || '');
        setPhone(targetSchool.admin.phone || '');
        setQualification(targetSchool.admin.qualification || 'Campus Administrator');
        setPortalUsername(targetSchool.admin.portalUsername || '');
      } else {
        setName('');
        setEmail(`${targetSchool.slug}.admin@pragati.edu`);
        setPhone('');
        setQualification('Campus Operations & Administrative Head');
        setPortalUsername(`${targetSchool.slug}_admin`);
      }
      setPortalPassword('Admin@123');
      setErrorMsg('');
      setSuccessMsg('');
    }
  }, [isOpen, targetSchool]);

  if (!isOpen || !targetSchool) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Admin full name is required');
      return;
    }
    setIsSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const userInfo = JSON.parse(sessionStorage.getItem('userInfo') || '{}');
      const token = userInfo.token || sessionStorage.getItem('token') || '';

      const res = await fetch(`http://localhost:5000/api/school/${targetSchool.slug}/appoint-admin`, {
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
        setSuccessMsg(`✓ Branch Admin "${name}" successfully appointed for ${targetSchool.name}!`);
        window.dispatchEvent(new CustomEvent('schoolListChanged'));
        window.dispatchEvent(new CustomEvent('schoolListUpdated'));
        if (onAdminAppointed) onAdminAppointed(data.admin);
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        setErrorMsg(data.error || data.message || 'Failed to appoint branch administrator.');
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
              background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.15) 0%, rgba(147, 51, 234, 0.15) 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <UserCog size={26} color="#7c3aed" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#1e3a8a', margin: 0 }}>
                Appoint Branch Administrator
              </h3>
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
          background: 'linear-gradient(135deg, #f8fafc 0%, #f5f3ff 100%)',
          border: '1px solid #ddd6fe',
          borderRadius: '12px',
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          marginBottom: '20px'
        }}>
          <Building2 size={18} color="#7c3aed" />
          <div style={{ fontSize: '0.88rem', color: '#334155' }}>
            Branch School: <strong style={{ color: '#5b21b6' }}>{targetSchool.name}</strong> 
            <span style={{ marginLeft: '8px', padding: '2px 8px', borderRadius: '6px', background: '#ede9fe', color: '#6d28d9', fontSize: '0.75rem', fontWeight: 600 }}>
              /{targetSchool.slug}
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Admin Name */}
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
                Branch Admin Full Name *
              </label>
              <input 
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Rohan Sharma or Priya Gupta"
                style={{ width: '100%', padding: '11px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>

            {/* Role / Designation */}
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
                Designation / Title
              </label>
              <input 
                type="text"
                value={qualification}
                onChange={e => setQualification(e.target.value)}
                placeholder="e.g. Branch Director / Senior Administrator"
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
                  placeholder="admin@school.edu"
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

            {/* Security Notice */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.05) 0%, rgba(79, 70, 229, 0.05) 100%)',
              border: '1px solid rgba(124, 58, 237, 0.2)',
              borderRadius: '12px',
              padding: '14px',
              marginTop: '4px'
            }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#5b21b6', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Lock size={14} color="#7c3aed" /> Dedicated Branch Portal Login Credentials
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#64748b', marginBottom: '4px' }}>
                    Username / Login ID
                  </label>
                  <input 
                    type="text"
                    required
                    value={portalUsername}
                    onChange={e => setPortalUsername(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box', background: 'white' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#64748b', marginBottom: '4px' }}>
                    Access Password
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input 
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={portalPassword}
                      onChange={e => setPortalPassword(e.target.value)}
                      style={{ width: '100%', padding: '9px 34px 9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box', background: 'white' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: 0 }}
                    >
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>
              </div>
              <div style={{ fontSize: '0.72rem', color: '#6b7280', marginTop: '8px' }}>
                This user will login with <strong>Role: Admin</strong> specifically scoped to branch <strong>{targetSchool.name}</strong>.
              </div>
            </div>

            {errorMsg && (
              <div style={{
                background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px',
                padding: '10px 14px', color: '#b91c1c', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px'
              }}>
                <AlertCircle size={16} /> {errorMsg}
              </div>
            )}

            {successMsg && (
              <div style={{
                background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px',
                padding: '10px 14px', color: '#15803d', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px'
              }}>
                <CheckCircle2 size={16} /> {successMsg}
              </div>
            )}

            {/* Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                style={{
                  padding: '10px 18px', borderRadius: '10px', border: '1px solid #cbd5e1',
                  background: 'white', color: '#475569', fontSize: '0.88rem', fontWeight: 600, cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  padding: '10px 24px', borderRadius: '10px', border: 'none',
                  background: 'linear-gradient(135deg, #6d28d9 0%, #4f46e5 100%)',
                  color: 'white', fontSize: '0.88rem', fontWeight: 700, cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  boxShadow: '0 4px 14px rgba(109, 40, 217, 0.35)',
                  display: 'flex', alignItems: 'center', gap: '8px'
                }}
              >
                {isSubmitting ? 'Appointing...' : (targetSchool.admin ? 'Update Branch Admin' : 'Appoint Branch Admin')}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

export default AppointAdminModal;
