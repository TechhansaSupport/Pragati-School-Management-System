import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Trash2, AlertTriangle, Building2, AlertCircle, ShieldAlert } from 'lucide-react';

const DeleteSchoolModal = ({ isOpen, onClose, targetSchool, onSchoolDeleted }) => {
  const [confirmationInput, setConfirmationInput] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (isOpen) {
      setConfirmationInput('');
      setErrorMsg('');
      setIsDeleting(false);
    }
  }, [isOpen, targetSchool]);

  if (!isOpen || !targetSchool) return null;

  const targetSlug = targetSchool.slug || '';
  const isConfirmed = confirmationInput.trim().toLowerCase() === targetSlug.toLowerCase();

  const handleDelete = async (e) => {
    e.preventDefault();
    if (!isConfirmed) {
      setErrorMsg(`Please type "${targetSlug}" to confirm deletion.`);
      return;
    }

    setIsDeleting(true);
    setErrorMsg('');

    try {
      const userInfo = JSON.parse(sessionStorage.getItem('userInfo') || '{}');
      const token = userInfo.token || sessionStorage.getItem('token') || '';
      const currentSlug = sessionStorage.getItem('tenantSlug') || '';

      const res = await fetch(`http://localhost:5000/api/school/${targetSlug}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'x-tenant-slug': currentSlug
        }
      });

      const data = await res.json();

      if (res.ok && data.success) {
        window.dispatchEvent(new CustomEvent('schoolListUpdated'));
        window.dispatchEvent(new CustomEvent('schoolListChanged'));

        if (onSchoolDeleted) {
          onSchoolDeleted(targetSchool, data);
        }

        // If user deleted the active school they are currently viewing, switch to fallback
        if (targetSchool.slug === currentSlug) {
          const fallbackSlug = data.fallbackSlug || 'central';
          sessionStorage.setItem('tenantSlug', fallbackSlug);
          if (data.fallbackName) {
            sessionStorage.setItem('schoolName', data.fallbackName);
          }
          const userRole = sessionStorage.getItem('userRole') || '';
          if (userRole === 'superadmin' || fallbackSlug === 'central' || fallbackSlug === 'superadmin') {
            window.location.href = `/${fallbackSlug}/superadmin`;
          } else {
            window.location.href = `/${fallbackSlug}/dashboard`;
          }
        } else {
          onClose();
        }
      } else {
        setErrorMsg(data.error || 'Failed to delete school campus.');
      }
    } catch (err) {
      setErrorMsg('Network error: ' + err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  return createPortal(
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(15, 23, 42, 0.7)',
      backdropFilter: 'blur(8px)',
      zIndex: 9999999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '24px',
        width: '520px',
        maxWidth: '95vw',
        maxHeight: '92vh',
        overflowY: 'auto',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
        border: '1px solid rgba(239, 68, 68, 0.2)',
        animation: 'slide-up 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        padding: '30px'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: '48px', height: '48px', borderRadius: '14px',
              background: '#fef2f2',
              border: '1px solid #fee2e2',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Trash2 size={24} color="#dc2626" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.28rem', fontWeight: 800, color: '#991b1b', margin: 0 }}>
                Delete School Campus
              </h3>
              <p style={{ margin: '3px 0 0 0', fontSize: '0.84rem', color: '#64748b' }}>
                Permanently decommission and delete this campus
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            disabled={isDeleting}
            style={{
              background: '#f1f5f9', border: 'none', width: '32px', height: '32px',
              borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#64748b'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Warning Card */}
        <div style={{
          background: '#fff1f2',
          border: '1px solid #fecdd3',
          borderRadius: '16px',
          padding: '16px',
          marginBottom: '20px'
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
            <AlertTriangle size={20} color="#e11d48" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#9f1239', marginBottom: '4px' }}>
                Permanent Action Warning
              </div>
              <div style={{ fontSize: '0.82rem', color: '#881337', lineHeight: 1.5 }}>
                You are about to delete <strong>{targetSchool.name}</strong> (<code>/{targetSlug}</code>). All associated staff accounts, student records, fee ledgers, and academic branches under this campus will be removed.
              </div>
            </div>
          </div>

          {/* Quick Stats pill */}
          <div style={{
            display: 'flex',
            gap: '12px',
            marginTop: '12px',
            paddingTop: '12px',
            borderTop: '1px dashed #fecdd3',
            fontSize: '0.78rem',
            color: '#9f1239',
            fontWeight: 600
          }}>
            <span>👥 {targetSchool.staffCount || 0} Staff</span>
            <span>•</span>
            <span>🎓 {targetSchool.studentCount || 0} Students</span>
            <span>•</span>
            <span>Principal: {targetSchool.principal?.name || 'None'}</span>
          </div>
        </div>

        <form onSubmit={handleDelete}>
          {/* Confirmation Input */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
              To confirm, type <strong style={{ color: '#dc2626' }}>{targetSlug}</strong> below:
            </label>
            <input 
              type="text"
              autoFocus
              required
              value={confirmationInput}
              onChange={e => setConfirmationInput(e.target.value)}
              placeholder={targetSlug}
              style={{
                width: '100%',
                padding: '11px 14px',
                borderRadius: '10px',
                border: isConfirmed ? '1.5px solid #dc2626' : '1px solid #cbd5e1',
                fontSize: '0.9rem',
                outline: 'none',
                boxSizing: 'border-box',
                background: isConfirmed ? '#fef2f2' : 'white'
              }}
            />
          </div>

          {errorMsg && (
            <div style={{
              padding: '10px 14px',
              borderRadius: '10px',
              background: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#b91c1c',
              fontSize: '0.84rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '18px'
            }}>
              <AlertCircle size={16} />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <button
              type="button"
              onClick={onClose}
              disabled={isDeleting}
              style={{
                padding: '10px 18px',
                background: 'white',
                border: '1px solid #cbd5e1',
                borderRadius: '10px',
                color: '#475569',
                fontWeight: 600,
                fontSize: '0.88rem',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!isConfirmed || isDeleting}
              style={{
                padding: '10px 22px',
                background: (!isConfirmed || isDeleting) 
                  ? '#fca5a5' 
                  : 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                fontWeight: 700,
                fontSize: '0.88rem',
                cursor: (!isConfirmed || isDeleting) ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: isConfirmed ? '0 4px 14px rgba(220, 38, 38, 0.35)' : 'none',
                transition: 'all 0.2s'
              }}
            >
              <Trash2 size={16} />
              {isDeleting ? 'Deleting Campus...' : 'Delete School Campus'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

export default DeleteSchoolModal;
