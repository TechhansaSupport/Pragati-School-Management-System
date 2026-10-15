import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, Building2, MapPin, Phone, Mail, Award, Calendar, 
  CheckCircle2, AlertCircle, Save, Globe
} from 'lucide-react';

const EditSchoolModal = ({ isOpen, onClose, school, onSchoolUpdated }) => {
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [board, setBoard] = useState('CBSE');
  const [academicYear, setAcademicYear] = useState('2026-2027');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (school) {
      setName(school.name || school.schoolName || '');
      setAddress(school.address || '');
      setCity(school.city || '');
      setState(school.state || '');
      setPhone(school.phone || '');
      setEmail(school.email || '');
      setBoard(school.board || 'CBSE');
      setAcademicYear(school.academicYear || '2026-2027');
      setErrorMsg('');
      setSuccessMsg('');
    }
  }, [school, isOpen]);

  if (!isOpen || !school) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('School name is required');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const userInfo = JSON.parse(sessionStorage.getItem('userInfo') || '{}');
      const token = userInfo.token || sessionStorage.getItem('token') || '';
      const currentTenantSlug = sessionStorage.getItem('tenantSlug') || school.slug;

      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      headers['x-tenant-slug'] = school.slug || currentTenantSlug;

      const res = await fetch(`http://localhost:5000/api/school/${school.slug}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          name: name.trim(),
          address: address.trim(),
          city: city.trim(),
          state: state.trim(),
          phone: phone.trim(),
          email: email.trim(),
          board,
          academicYear
        })
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok && data.success) {
        setSuccessMsg(`School "${name.trim()}" updated successfully!`);
        
        // If the edited school is the currently active school, update session and header
        if (currentTenantSlug === school.slug) {
          sessionStorage.setItem('schoolName', name.trim());
          if (address.trim()) sessionStorage.setItem('schoolAddress', address.trim());
          window.dispatchEvent(new CustomEvent('schoolNameChanged', { detail: name.trim() }));
          document.title = `${name.trim()} | Pragati SMS`;
        }

        // Notify parent components to refresh list
        if (typeof onSchoolUpdated === 'function') {
          onSchoolUpdated(data.school || { ...school, name: name.trim(), address: address.trim() });
        }
        window.dispatchEvent(new CustomEvent('schoolListUpdated'));

        setTimeout(() => {
          onClose();
        }, 900);
      } else {
        setErrorMsg(data.error || data.message || 'Failed to update school details.');
      }
    } catch (err) {
      setErrorMsg('Network error occurred: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return createPortal(
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.65)',
      backdropFilter: 'blur(6px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 99999,
      padding: '16px',
      animation: 'fadeIn 0.2s ease-out'
    }}>
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '20px',
        width: '100%',
        maxWidth: '560px',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        border: '1px solid #e2e8f0',
        overflow: 'hidden'
      }}>
        {/* Modal Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.05) 0%, rgba(15, 118, 110, 0.05) 100%)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              backgroundColor: '#e0e7ff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#4F46E5'
            }}>
              <Building2 size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#1e3a8a', margin: 0 }}>
                Edit School Details
              </h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '3px' }}>
                <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                  Workspace Handle:
                </span>
                <code style={{ fontSize: '0.74rem', background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', color: '#4F46E5', fontWeight: 700 }}>
                  /{school.slug}
                </code>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            style={{
              border: 'none',
              background: '#f1f5f9',
              cursor: 'pointer',
              color: '#64748b',
              padding: '6px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s'
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#e2e8f0'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Form Body */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {/* Feedback Messages */}
            {errorMsg && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '12px 14px',
                borderRadius: '10px',
                backgroundColor: '#fef2f2',
                border: '1px solid #fee2e2',
                color: '#dc2626',
                fontSize: '0.85rem'
              }}>
                <AlertCircle size={18} style={{ flexShrink: 0 }} />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '12px 14px',
                borderRadius: '10px',
                backgroundColor: '#f0fdf4',
                border: '1px solid #bbf7d0',
                color: '#16a34a',
                fontSize: '0.85rem',
                fontWeight: 600
              }}>
                <CheckCircle2 size={18} style={{ flexShrink: 0 }} />
                <span>{successMsg}</span>
              </div>
            )}

            {/* School Name */}
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                Official School / Campus Name *
              </label>
              <div style={{ position: 'relative' }}>
                <Building2 size={17} style={{ position: 'absolute', left: '12px', top: '12px', color: '#94a3b8' }} />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Neel Public School"
                  style={{
                    width: '100%',
                    padding: '10px 14px 10px 38px',
                    borderRadius: '10px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '0.92rem',
                    fontWeight: 600,
                    color: '#0f172a',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#4F46E5'}
                  onBlur={(e) => e.target.style.borderColor = '#cbd5e1'}
                />
              </div>
            </div>

            {/* Campus Address */}
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                Campus Address *
              </label>
              <div style={{ position: 'relative' }}>
                <MapPin size={17} style={{ position: 'absolute', left: '12px', top: '12px', color: '#94a3b8' }} />
                <textarea
                  rows={3}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Complete campus address, street, landmark..."
                  style={{
                    width: '100%',
                    padding: '10px 14px 10px 38px',
                    borderRadius: '10px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '0.9rem',
                    color: '#0f172a',
                    outline: 'none',
                    resize: 'vertical',
                    boxSizing: 'border-box',
                    fontFamily: 'inherit'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#4F46E5'}
                  onBlur={(e) => e.target.style.borderColor = '#cbd5e1'}
                />
              </div>
            </div>

            {/* City & State (2 columns) */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  City / Region
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. Varanasi, Mumbai"
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '9px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '0.88rem',
                    color: '#0f172a',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  State / Province
                </label>
                <input
                  type="text"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  placeholder="e.g. Uttar Pradesh, Maharashtra"
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '9px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '0.88rem',
                    color: '#0f172a',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>

            {/* Phone & Email (2 columns) */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  Contact Phone
                </label>
                <div style={{ position: 'relative' }}>
                  <Phone size={15} style={{ position: 'absolute', left: '10px', top: '11px', color: '#94a3b8' }} />
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    style={{
                      width: '100%',
                      padding: '9px 12px 9px 32px',
                      borderRadius: '9px',
                      border: '1.5px solid #cbd5e1',
                      fontSize: '0.88rem',
                      color: '#0f172a',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  Official Email
                </label>
                <div style={{ position: 'relative' }}>
                  <Mail size={15} style={{ position: 'absolute', left: '10px', top: '11px', color: '#94a3b8' }} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="contact@school.edu"
                    style={{
                      width: '100%',
                      padding: '9px 12px 9px 32px',
                      borderRadius: '9px',
                      border: '1.5px solid #cbd5e1',
                      fontSize: '0.88rem',
                      color: '#0f172a',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Board & Academic Year (2 columns) */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  Curriculum / Board
                </label>
                <select
                  value={board}
                  onChange={(e) => setBoard(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '9px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '0.88rem',
                    color: '#0f172a',
                    outline: 'none',
                    boxSizing: 'border-box',
                    backgroundColor: 'white'
                  }}
                >
                  <option value="CBSE">CBSE (Central Board)</option>
                  <option value="ICSE">ICSE / ISC</option>
                  <option value="State Board">State Board</option>
                  <option value="Cambridge / IGCSE">Cambridge / IGCSE</option>
                  <option value="IB (International Baccalaureate)">IB (International Baccalaureate)</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  Academic Session
                </label>
                <select
                  value={academicYear}
                  onChange={(e) => setAcademicYear(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '9px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '0.88rem',
                    color: '#0f172a',
                    outline: 'none',
                    boxSizing: 'border-box',
                    backgroundColor: 'white'
                  }}
                >
                  <option value="2026-2027">2026-2027</option>
                  <option value="2025-2026">2025-2026</option>
                  <option value="2027-2028">2027-2028</option>
                </select>
              </div>
            </div>
          </div>

          {/* Modal Footer Actions */}
          <div style={{
            padding: '16px 24px',
            borderTop: '1px solid #e2e8f0',
            backgroundColor: '#f8fafc',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '12px'
          }}>
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              style={{
                padding: '9px 16px',
                borderRadius: '9px',
                border: '1px solid #cbd5e1',
                backgroundColor: '#ffffff',
                color: '#475569',
                fontSize: '0.86rem',
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
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '9px 20px',
                borderRadius: '9px',
                border: 'none',
                background: 'linear-gradient(135deg, #1e3a8a 0%, #4F46E5 100%)',
                color: '#ffffff',
                fontSize: '0.86rem',
                fontWeight: 700,
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 12px rgba(79, 70, 229, 0.25)',
                opacity: isSubmitting ? 0.7 : 1
              }}
            >
              <Save size={15} />
              {isSubmitting ? 'Saving Changes...' : 'Save School Details'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

export default EditSchoolModal;
