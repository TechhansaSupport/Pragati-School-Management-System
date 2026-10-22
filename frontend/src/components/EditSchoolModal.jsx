import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, Building2, MapPin, Phone, Mail, Award, Calendar, 
  CheckCircle2, AlertCircle, Save, Globe, Navigation, Crosshair, ExternalLink
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

  // Campus Geofence & GPS state
  const [campusLatitude, setCampusLatitude] = useState('');
  const [campusLongitude, setCampusLongitude] = useState('');
  const [campusRadiusMeters, setCampusRadiusMeters] = useState(300);
  const [geofenceEnabled, setGeofenceEnabled] = useState(true);
  const [isLocating, setIsLocating] = useState(false);
  const [locateSuccessMsg, setLocateSuccessMsg] = useState('');
  const [locateErrorMsg, setLocateErrorMsg] = useState('');

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
      setCampusLatitude(school.campusLatitude != null ? school.campusLatitude : '');
      setCampusLongitude(school.campusLongitude != null ? school.campusLongitude : '');
      setCampusRadiusMeters(school.campusRadiusMeters != null ? school.campusRadiusMeters : 300);
      setGeofenceEnabled(school.geofenceEnabled !== false);
      setLocateSuccessMsg('');
      setLocateErrorMsg('');
      setErrorMsg('');
      setSuccessMsg('');
    }
  }, [school, isOpen]);

  if (!isOpen || !school) return null;

  const handleCaptureGPS = () => {
    if (!navigator.geolocation) {
      setLocateErrorMsg('Geolocation is not supported by your current browser.');
      return;
    }
    setIsLocating(true);
    setLocateErrorMsg('');
    setLocateSuccessMsg('');

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = Number(pos.coords.latitude.toFixed(6));
        const lng = Number(pos.coords.longitude.toFixed(6));
        const acc = Math.round(pos.coords.accuracy || 0);
        setCampusLatitude(lat);
        setCampusLongitude(lng);
        setIsLocating(false);
        setLocateSuccessMsg(`Current GPS calibrated! Lat: ${lat}, Lng: ${lng} (±${acc}m accuracy)`);
      },
      (err) => {
        setIsLocating(false);
        if (err.code === 1) {
          setLocateErrorMsg('Location access was denied. Please allow browser location permission or type coordinates manually.');
        } else if (err.code === 2) {
          setLocateErrorMsg('Position unavailable. Please ensure device location/GPS is toggled ON.');
        } else {
          setLocateErrorMsg(`GPS Detection Error: ${err.message}`);
        }
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    );
  };

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
          academicYear,
          campusLatitude: campusLatitude !== '' ? Number(campusLatitude) : null,
          campusLongitude: campusLongitude !== '' ? Number(campusLongitude) : null,
          campusRadiusMeters: Number(campusRadiusMeters) || 300,
          geofenceEnabled: Boolean(geofenceEnabled)
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
          onSchoolUpdated(data.school || { 
            ...school, 
            name: name.trim(), 
            address: address.trim(),
            campusLatitude: campusLatitude !== '' ? Number(campusLatitude) : null,
            campusLongitude: campusLongitude !== '' ? Number(campusLongitude) : null,
            campusRadiusMeters: Number(campusRadiusMeters) || 300,
            geofenceEnabled: Boolean(geofenceEnabled)
          });
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
        maxWidth: '620px',
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

            {/* CAMPUS GEOFENCE & GPS CALIBRATION */}
            <div style={{
              marginTop: '4px',
              padding: '18px 20px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.05) 0%, rgba(14, 165, 233, 0.05) 100%)',
              border: '1.5px solid rgba(79, 70, 229, 0.22)',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}>
              {/* Header with Status Pill */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    background: '#e0e7ff',
                    color: '#4F46E5',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Navigation size={19} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 800, color: '#1e3a8a' }}>
                      Campus GPS Geofence Calibration
                    </h3>
                    <p style={{ margin: '2px 0 0 0', fontSize: '0.75rem', color: '#64748b' }}>
                      Pinpoint this campus boundary to verify staff attendance punch-in.
                    </p>
                  </div>
                </div>

                {/* Status badge */}
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '5px 12px',
                  borderRadius: '20px',
                  fontSize: '0.74rem',
                  fontWeight: 700,
                  background: (campusLatitude && campusLongitude && geofenceEnabled) ? '#dcfce7' : (campusLatitude && campusLongitude) ? '#fef3c7' : '#f1f5f9',
                  color: (campusLatitude && campusLongitude && geofenceEnabled) ? '#166534' : (campusLatitude && campusLongitude) ? '#b45309' : '#64748b',
                  border: `1px solid ${(campusLatitude && campusLongitude && geofenceEnabled) ? '#86efac' : (campusLatitude && campusLongitude) ? '#fde68a' : '#cbd5e1'}`
                }}>
                  <span style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: (campusLatitude && campusLongitude && geofenceEnabled) ? '#16a34a' : (campusLatitude && campusLongitude) ? '#f59e0b' : '#94a3b8'
                  }} />
                  {(campusLatitude && campusLongitude && geofenceEnabled)
                    ? `🟢 Calibrated (${campusRadiusMeters}m Geofence Active)`
                    : (campusLatitude && campusLongitude)
                    ? '🟡 Coordinates Saved (Enforcement Off)'
                    : '⚪ Not Calibrated Yet'}
                </span>
              </div>

              {/* 1-Click Auto-Detect Button & Actions */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={handleCaptureGPS}
                  disabled={isLocating}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '9px 16px',
                    borderRadius: '10px',
                    background: isLocating ? '#94a3b8' : 'linear-gradient(135deg, #4F46E5 0%, #0284c7 100%)',
                    color: '#ffffff',
                    border: 'none',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    cursor: isLocating ? 'wait' : 'pointer',
                    boxShadow: '0 3px 10px rgba(79, 70, 229, 0.25)',
                    transition: 'all 0.15s'
                  }}
                  title="Detect GPS coordinates directly from your device location"
                >
                  <Crosshair size={16} />
                  {isLocating ? 'Capturing High-Accuracy GPS...' : 'Auto-Detect Current GPS Location'}
                </button>

                {campusLatitude && campusLongitude && (
                  <a
                    href={`https://www.google.com/maps?q=${campusLatitude},${campusLongitude}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '8px 14px',
                      borderRadius: '9px',
                      background: '#ffffff',
                      border: '1.5px solid #cbd5e1',
                      color: '#1e3a8a',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      textDecoration: 'none'
                    }}
                    title="Open pinned location in Google Maps to verify accuracy"
                  >
                    <ExternalLink size={13} color="#4F46E5" />
                    Verify Pin on Map
                  </a>
                )}

                {(campusLatitude || campusLongitude) && (
                  <button
                    type="button"
                    onClick={() => {
                      setCampusLatitude('');
                      setCampusLongitude('');
                      setLocateSuccessMsg('');
                      setLocateErrorMsg('');
                    }}
                    style={{
                      border: 'none',
                      background: 'transparent',
                      color: '#94a3b8',
                      fontSize: '0.76rem',
                      textDecoration: 'underline',
                      cursor: 'pointer',
                      padding: '4px'
                    }}
                  >
                    Clear Coordinates
                  </button>
                )}
              </div>

              {/* Geolocation feedback alerts */}
              {locateSuccessMsg && (
                <div style={{
                  padding: '9px 12px',
                  borderRadius: '9px',
                  background: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  color: '#166534',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <CheckCircle2 size={16} color="#16a34a" style={{ flexShrink: 0 }} />
                  <span>{locateSuccessMsg}</span>
                </div>
              )}

              {locateErrorMsg && (
                <div style={{
                  padding: '9px 12px',
                  borderRadius: '9px',
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  color: '#dc2626',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <AlertCircle size={16} color="#dc2626" style={{ flexShrink: 0 }} />
                  <span>{locateErrorMsg}</span>
                </div>
              )}

              {/* Latitude & Longitude manual inputs */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '5px' }}>
                    Campus Center Latitude (°N/S)
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={campusLatitude}
                    onChange={(e) => setCampusLatitude(e.target.value)}
                    placeholder="e.g. 28.613939"
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '9px',
                      border: '1.5px solid #cbd5e1',
                      fontSize: '0.88rem',
                      fontWeight: 600,
                      color: '#0f172a',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '5px' }}>
                    Campus Center Longitude (°E/W)
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={campusLongitude}
                    onChange={(e) => setCampusLongitude(e.target.value)}
                    placeholder="e.g. 77.209021"
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '9px',
                      border: '1.5px solid #cbd5e1',
                      fontSize: '0.88rem',
                      fontWeight: 600,
                      color: '#0f172a',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              {/* Radius Presets and Custom Input */}
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  Allowed Campus Boundary Radius: <strong>{campusRadiusMeters} meters</strong>
                </label>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                  {[
                    { label: '100m (Compact)', val: 100 },
                    { label: '200m (Medium)', val: 200 },
                    { label: '300m (Standard)', val: 300 },
                    { label: '500m (Large)', val: 500 },
                    { label: '1000m (1 km)', val: 1000 }
                  ].map((preset) => {
                    const isSelected = Number(campusRadiusMeters) === preset.val;
                    return (
                      <button
                        key={preset.val}
                        type="button"
                        onClick={() => setCampusRadiusMeters(preset.val)}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '8px',
                          fontSize: '0.74rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          border: isSelected ? '1.5px solid #4F46E5' : '1px solid #cbd5e1',
                          background: isSelected ? 'rgba(79, 70, 229, 0.12)' : '#ffffff',
                          color: isSelected ? '#4F46E5' : '#475569',
                          transition: 'all 0.15s'
                        }}
                      >
                        {preset.label}
                      </button>
                    );
                  })}
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', marginLeft: 'auto' }}>
                    <input
                      type="number"
                      min="50"
                      max="10000"
                      value={campusRadiusMeters}
                      onChange={(e) => setCampusRadiusMeters(e.target.value)}
                      style={{
                        width: '74px',
                        padding: '5px 8px',
                        borderRadius: '7px',
                        border: '1.5px solid #cbd5e1',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        textAlign: 'center'
                      }}
                    />
                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>meters</span>
                  </div>
                </div>
              </div>

              {/* Geofence Enforcement Toggle */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 14px',
                borderRadius: '11px',
                background: '#ffffff',
                border: '1px solid #e2e8f0'
              }}>
                <div>
                  <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#1e293b' }}>
                    Enforce Strict Geofence Attendance
                  </div>
                  <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '2px' }}>
                    Staff cannot clock in or out if their mobile/laptop device is outside the {campusRadiusMeters}m radius perimeter.
                  </div>
                </div>
                <label style={{ position: 'relative', display: 'inline-block', width: '46px', height: '24px', cursor: 'pointer', flexShrink: 0 }}>
                  <input
                    type="checkbox"
                    checked={geofenceEnabled}
                    onChange={(e) => setGeofenceEnabled(e.target.checked)}
                    style={{ opacity: 0, width: 0, height: 0 }}
                  />
                  <span style={{
                    position: 'absolute',
                    top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: geofenceEnabled ? '#4F46E5' : '#cbd5e1',
                    borderRadius: '24px',
                    transition: '0.2s'
                  }}>
                    <span style={{
                      position: 'absolute',
                      left: geofenceEnabled ? '24px' : '3px',
                      top: '3px',
                      width: '18px',
                      height: '18px',
                      backgroundColor: '#ffffff',
                      borderRadius: '50%',
                      transition: '0.2s',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                    }} />
                  </span>
                </label>
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
