import React, { useState, useEffect, useMemo } from 'react';
import { 
  Clock, LogIn, LogOut, CheckCircle2, AlertCircle, History, 
  MapPin, Calendar, Sparkles, RefreshCw, X, ChevronRight, User,
  Compass, ShieldCheck, Crosshair, Navigation
} from 'lucide-react';
import { createPortal } from 'react-dom';

const API_BASE = 'http://localhost:5000/api';

// Helper to calculate great-circle distance in meters between two GPS coordinates
const calculateDistanceInMeters = (lat1, lon1, lat2, lon2) => {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return null;
  const R = 6371e3; // Earth radius in meters
  const toRad = (angle) => (angle * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
};

const StaffPunchClock = ({ onPunchSuccess, customStaffId = null, compact = false }) => {
  const userInfo = JSON.parse(sessionStorage.getItem('userInfo') || '{}');
  const token = userInfo.token || sessionStorage.getItem('token') || '';
  const tenantSlug = sessionStorage.getItem('tenantSlug') || '';
  const userRole = (userInfo.role || '').toLowerCase();
  const isAdmin = ['admin', 'superadmin', 'principal', 'school', 'school_admin'].includes(userRole);

  // Current live time ticker
  const [currentTime, setCurrentTime] = useState(new Date());

  // Punch clock states
  const [punchStatus, setPunchStatus] = useState({
    hasStaffProfile: true,
    isPunchedIn: false,
    firstPunchIn: null,
    lastPunchOut: null,
    totalDurationMinutes: 0,
    status: 'Not Punched In',
    punches: [],
    staff: null,
    recentHistory: []
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isPunching, setIsPunching] = useState(false);
  const [punchNote, setPunchNote] = useState('');
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isGeofenceModalOpen, setIsGeofenceModalOpen] = useState(false);
  const [message, setMessage] = useState({ show: false, text: '', type: 'success' });

  // Geofence states
  const [geofenceConfig, setGeofenceConfig] = useState({
    campusLatitude: 28.6139,
    campusLongitude: 77.2090,
    campusRadiusMeters: 300,
    geofenceEnabled: true,
    campusName: 'Campus Premises',
    isConfigured: false
  });

  const [geoState, setGeoState] = useState({
    loading: true,
    coords: null, // { latitude, longitude, accuracy }
    distance: null,
    isWithinCampus: true,
    error: null,
    denied: false
  });

  // Admin calibration form states
  const [customLat, setCustomLat] = useState('');
  const [customLng, setCustomLng] = useState('');
  const [customRadius, setCustomRadius] = useState(300);
  const [customEnabled, setCustomEnabled] = useState(true);
  const [calibrationLoading, setCalibrationLoading] = useState(false);

  // Update live clock every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const getAuthHeaders = () => {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (tenantSlug) headers['x-tenant-slug'] = tenantSlug;
    return headers;
  };

  const showNotification = (text, type = 'success') => {
    setMessage({ show: true, text, type });
    setTimeout(() => setMessage({ show: false, text: '', type: 'success' }), 5000);
  };

  // Request browser geolocation and check against campus center
  const refreshLocation = (targetConfig = geofenceConfig) => {
    if (!navigator.geolocation) {
      setGeoState(prev => ({
        ...prev,
        loading: false,
        error: 'Geolocation is not supported by your browser.',
        isWithinCampus: !targetConfig?.geofenceEnabled
      }));
      return;
    }

    setGeoState(prev => ({ ...prev, loading: true, error: null, denied: false }));

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        let dist = null;
        let within = true;

        if (targetConfig && targetConfig.campusLatitude != null && targetConfig.campusLongitude != null) {
          dist = calculateDistanceInMeters(latitude, longitude, targetConfig.campusLatitude, targetConfig.campusLongitude);
          const radius = targetConfig.campusRadiusMeters || 300;
          if (targetConfig.geofenceEnabled && targetConfig.isConfigured) {
            within = dist <= radius;
          } else {
            within = true;
          }
        }

        setGeoState({
          loading: false,
          coords: { latitude, longitude, accuracy },
          distance: dist,
          isWithinCampus: within,
          error: within ? null : `Outside Campus: You are ${dist}m away from the campus center (Limit: ${targetConfig?.campusRadiusMeters || 300}m).`,
          denied: false
        });
      },
      (err) => {
        let msg = 'Unable to acquire location.';
        let denied = false;
        if (err.code === 1) {
          msg = 'Location permission blocked. Please allow browser location access in order to punch attendance.';
          denied = true;
        } else if (err.code === 2) {
          msg = 'Location unavailable. Ensure GPS is enabled on your device.';
        } else if (err.code === 3) {
          msg = 'GPS acquisition timed out. Please retry.';
        }

        setGeoState({
          loading: false,
          coords: null,
          distance: null,
          isWithinCampus: !targetConfig?.geofenceEnabled || !targetConfig?.isConfigured,
          error: msg,
          denied
        });
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    );
  };

  // Fetch current user punch status & geofence configuration from backend
  const fetchPunchStatus = async () => {
    try {
      const res = await fetch(`${API_BASE}/staff-attendance/my-status`, {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        setPunchStatus(data);
        if (data.geofenceConfig) {
          setGeofenceConfig(data.geofenceConfig);
          setCustomLat(data.geofenceConfig.campusLatitude != null ? data.geofenceConfig.campusLatitude : '');
          setCustomLng(data.geofenceConfig.campusLongitude != null ? data.geofenceConfig.campusLongitude : '');
          setCustomRadius(data.geofenceConfig.campusRadiusMeters || 300);
          setCustomEnabled(data.geofenceConfig.geofenceEnabled !== false);
          refreshLocation(data.geofenceConfig);
        }
      }
    } catch (err) {
      console.warn('Failed to load punch status:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPunchStatus();
    const handleUpdate = () => fetchPunchStatus();
    window.addEventListener('staffPunchUpdated', handleUpdate);
    return () => window.removeEventListener('staffPunchUpdated', handleUpdate);
  }, [tenantSlug, token]);

  // Handle Punch In or Out action with Geolocation verification
  const handlePunch = async (requestedType) => {
    // If geofence is strictly enabled and user is outside boundary
    if (geofenceConfig.geofenceEnabled && geofenceConfig.isConfigured && !geoState.isWithinCampus) {
      showNotification(geoState.error || 'Attendance punch is locked: You are outside the designated school campus area.', 'error');
      return;
    }

    setIsPunching(true);
    try {
      const payload = {
        type: requestedType,
        note: punchNote.trim(),
        location: geoState.distance != null ? `Campus (${geoState.distance}m from center)` : 'Campus Portal',
        latitude: geoState.coords?.latitude,
        longitude: geoState.coords?.longitude,
        accuracy: geoState.coords?.accuracy
      };
      if (customStaffId) payload.staffId = customStaffId;

      const res = await fetch(`${API_BASE}/staff-attendance/punch`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Punch action failed');
      }

      showNotification(data.message, requestedType === 'IN' ? 'success' : 'info');
      setPunchNote('');
      setShowNoteInput(false);
      await fetchPunchStatus();

      // Trigger global event for real-time dashboard and staff sheet sync
      window.dispatchEvent(new CustomEvent('staffPunchUpdated', { detail: data }));
      if (onPunchSuccess) onPunchSuccess(data);

    } catch (err) {
      showNotification(err.message, 'error');
    } finally {
      setIsPunching(false);
    }
  };

  // Admin: Save campus geofence coordinates & radius
  const handleSaveGeofence = async () => {
    setCalibrationLoading(true);
    try {
      const lat = Number(customLat);
      const lng = Number(customLng);
      const radius = Number(customRadius) || 300;
      const enabled = Boolean(customEnabled);

      if (isNaN(lat) || isNaN(lng)) {
        throw new Error('Please enter valid Latitude and Longitude values, or click "Capture Current GPS".');
      }

      const res = await fetch(`${API_BASE}/staff-attendance/geofence-config`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          campusLatitude: lat,
          campusLongitude: lng,
          campusRadiusMeters: radius,
          geofenceEnabled: enabled
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to update campus geofence configuration');

      setGeofenceConfig(data.config);
      setCustomLat(data.config.campusLatitude);
      setCustomLng(data.config.campusLongitude);
      setCustomRadius(data.config.campusRadiusMeters);
      setCustomEnabled(data.config.geofenceEnabled);
      showNotification('Campus geofence boundary updated successfully!', 'success');
      setIsGeofenceModalOpen(false);
      refreshLocation(data.config);
    } catch (err) {
      showNotification(err.message, 'error');
    } finally {
      setCalibrationLoading(false);
    }
  };

  // Admin: Capture current device location into form
  const handleCaptureCurrentLocation = () => {
    if (!navigator.geolocation) {
      showNotification('Geolocation is not supported by your browser.', 'error');
      return;
    }
    setCalibrationLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setCustomLat(latitude.toFixed(6));
        setCustomLng(longitude.toFixed(6));
        setCalibrationLoading(false);
        showNotification(`Captured GPS coordinates (${latitude.toFixed(5)}, ${longitude.toFixed(5)})! Click "Save Geofence" to apply.`, 'info');
      },
      (err) => {
        setCalibrationLoading(false);
        showNotification('Unable to capture location: ' + err.message, 'error');
      },
      { enableHighAccuracy: true, timeout: 12000 }
    );
  };

  // Calculate live elapsed seconds if punched in
  const liveWorkingTime = useMemo(() => {
    if (!punchStatus.isPunchedIn || !punchStatus.punches || punchStatus.punches.length === 0) {
      return null;
    }
    const lastInPunch = [...punchStatus.punches].reverse().find(p => p.type === 'IN');
    if (!lastInPunch) return null;

    const inTime = new Date(lastInPunch.time);
    const diffSec = Math.max(0, Math.floor((currentTime - inTime) / 1000));
    const priorSec = (punchStatus.totalDurationMinutes || 0) * 60;
    const totalSec = Math.max(diffSec, priorSec);

    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;

    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }, [currentTime, punchStatus]);

  const formattedTime = currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const formattedDate = currentTime.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });

  // Determine if punching should be disabled due to geofencing
  const isGeofenceLocked = Boolean(
    geofenceConfig.geofenceEnabled &&
    geofenceConfig.isConfigured &&
    (!geoState.isWithinCampus || geoState.loading)
  );

  return (
    <div style={{
      background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
      borderRadius: '20px',
      border: '1px solid #e2e8f0',
      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.04), 0 8px 10px -6px rgba(0, 0, 0, 0.02)',
      padding: compact ? '16px' : '22px',
      position: 'relative',
      overflow: 'hidden',
      width: '100%',
      maxWidth: '100%',
      boxSizing: 'border-box'
    }}>
      {/* Decorative top accent line */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '4px',
        background: punchStatus.isPunchedIn 
          ? 'linear-gradient(90deg, #10B981, #059669)' 
          : punchStatus.lastPunchOut 
            ? 'linear-gradient(90deg, #6366F1, #8B5CF6)' 
            : 'linear-gradient(90deg, #F59E0B, #D97706)'
      }} />

      {/* Header with Live Status Indicator & Admin Setup */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '34px',
            height: '34px',
            borderRadius: '10px',
            background: punchStatus.isPunchedIn ? 'rgba(16, 185, 129, 0.12)' : 'rgba(99, 102, 241, 0.12)',
            color: punchStatus.isPunchedIn ? '#10B981' : '#6366F1',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Clock size={18} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#1e3a8a' }}>
              Staff Attendance & Time Clock
            </h3>
            <span style={{ fontSize: '0.74rem', color: '#64748b' }}>
              {punchStatus.staff?.name ? `${punchStatus.staff.name} (${punchStatus.staff.employeeId || 'Faculty'})` : 'Daily Shift Recording'}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {isAdmin && (
            <button
              onClick={() => setIsGeofenceModalOpen(true)}
              style={{
                background: '#eff6ff',
                border: '1px solid #bfdbfe',
                borderRadius: '8px',
                padding: '5px 10px',
                fontSize: '0.74rem',
                fontWeight: 700,
                color: '#1d4ed8',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                cursor: 'pointer'
              }}
              title="Configure Campus Geofence Boundary"
            >
              <Compass size={13} /> Campus Geofence
            </button>
          )}

          <button
            onClick={() => setIsHistoryOpen(true)}
            style={{
              background: '#f1f5f9',
              border: '1px solid #cbd5e1',
              borderRadius: '8px',
              padding: '5px 10px',
              fontSize: '0.74rem',
              fontWeight: 700,
              color: '#475569',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              cursor: 'pointer'
            }}
            title="View recent punch history"
          >
            <History size={13} /> Punch Log
          </button>
        </div>
      </div>

      {/* Live Digital Clock & Shift Status Display */}
      <div style={{
        background: punchStatus.isPunchedIn 
          ? 'linear-gradient(135deg, rgba(240, 253, 244, 0.95), rgba(220, 252, 231, 0.6))'
          : 'linear-gradient(135deg, rgba(248, 250, 252, 0.95), rgba(241, 245, 249, 0.8))',
        border: punchStatus.isPunchedIn ? '1px solid #bbf7d0' : '1px solid #e2e8f0',
        borderRadius: '16px',
        padding: '16px 20px',
        marginBottom: '14px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Current Campus Time
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 900, color: '#0f172a', fontFamily: 'monospace', letterSpacing: '-0.02em', marginTop: '2px' }}>
            {formattedTime}
          </div>
          <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
            <Calendar size={13} /> {formattedDate}
          </div>
        </div>

        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
            Shift Status
          </div>
          
          <div style={{ marginTop: '4px' }}>
            {punchStatus.isPunchedIn ? (
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 12px',
                borderRadius: '20px',
                background: '#10B981',
                color: 'white',
                fontSize: '0.8rem',
                fontWeight: 800,
                boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)'
              }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'white', display: 'inline-block', animation: 'pulse 1.5s infinite' }} />
                Punched In (Active)
              </span>
            ) : punchStatus.lastPunchOut ? (
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '4px 12px',
                borderRadius: '20px',
                background: '#EEF2FF',
                color: '#4F46E5',
                border: '1px solid #C7D2FE',
                fontSize: '0.8rem',
                fontWeight: 700
              }}>
                <CheckCircle2 size={14} /> Shift Completed
              </span>
            ) : (
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '4px 12px',
                borderRadius: '20px',
                background: '#FEF3C7',
                color: '#92400E',
                border: '1px solid #FDE68A',
                fontSize: '0.8rem',
                fontWeight: 700
              }}>
                <AlertCircle size={14} /> Not Punched In
              </span>
            )}
          </div>

          {punchStatus.isPunchedIn && liveWorkingTime && (
            <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#059669', marginTop: '4px', fontFamily: 'monospace' }}>
              ⏱ Working: {liveWorkingTime}
            </div>
          )}
        </div>
      </div>

      {/* CAMPUS GEOFENCE LIVE RADAR / STATUS BADGE */}
      <div style={{
        marginBottom: '14px',
        padding: '11px 15px',
        borderRadius: '12px',
        border: geoState.loading
          ? '1px solid #e0e7ff'
          : geoState.isWithinCampus
            ? '1px solid #bbf7d0'
            : '1px solid #fecaca',
        background: geoState.loading
          ? '#f8fafc'
          : geoState.isWithinCampus
            ? 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)'
            : 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '8px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '10px',
            background: geoState.loading ? '#e2e8f0' : geoState.isWithinCampus ? '#dcfce7' : '#fee2e2',
            color: geoState.loading ? '#64748b' : geoState.isWithinCampus ? '#15803d' : '#b91c1c',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {geoState.loading ? <RefreshCw size={15} style={{ animation: 'spin 1.5s linear infinite' }} /> : <MapPin size={16} />}
          </div>

          <div>
            <div style={{ fontSize: '0.82rem', fontWeight: 800, color: geoState.isWithinCampus ? '#166534' : '#991b1b', display: 'flex', alignItems: 'center', gap: '6px' }}>
              {geoState.loading ? (
                'Verifying Campus Geofence GPS...'
              ) : !geofenceConfig.isConfigured ? (
                <>🟢 Inside Campus Area • GPS Active</>
              ) : geoState.isWithinCampus ? (
                <>🟢 Inside Campus Area {geoState.distance !== null ? `(${geoState.distance}m from center)` : '• GPS Active'}</>
              ) : (
                <>🔴 Outside Campus Area {geoState.distance !== null ? `(${geoState.distance}m away)` : '• Locked'}</>
              )}
            </div>
            <div style={{ fontSize: '0.74rem', color: '#475569', marginTop: '2px' }}>
              {geoState.loading ? (
                'Acquiring live location coordinates...'
              ) : !geofenceConfig.geofenceEnabled ? (
                'Geofence requirement is currently disabled in school settings.'
              ) : !geofenceConfig.isConfigured ? (
                'Campus GPS coordinates have not yet been calibrated by Administrator.'
              ) : geoState.isWithinCampus ? (
                `Campus center verified (allowed radius: ${geofenceConfig.campusRadiusMeters}m). Attendance unlocked.`
              ) : (
                geoState.error || `Attendance can only be recorded within ${geofenceConfig.campusRadiusMeters}m of campus.`
              )}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => refreshLocation()}
          disabled={geoState.loading}
          style={{
            background: 'white',
            border: '1px solid #cbd5e1',
            borderRadius: '8px',
            padding: '5px 10px',
            fontSize: '0.73rem',
            fontWeight: 700,
            color: '#334155',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            cursor: geoState.loading ? 'not-allowed' : 'pointer',
            boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
          }}
          title="Re-check live device GPS location"
        >
          <RefreshCw size={12} style={{ animation: geoState.loading ? 'spin 1.5s linear infinite' : 'none' }} />
          {geoState.loading ? 'Detecting...' : 'Re-check GPS'}
        </button>
      </div>

      {/* Optional Note / Purpose Input */}
      {showNoteInput && (
        <div style={{ marginBottom: '14px' }}>
          <input
            type="text"
            placeholder="Add note (e.g. Lab duty, Library period, Half-day, Field visit)..."
            value={punchNote}
            onChange={(e) => setPunchNote(e.target.value)}
            style={{
              width: '100%',
              padding: '9px 12px',
              borderRadius: '10px',
              border: '1px solid #cbd5e1',
              fontSize: '0.84rem',
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />
        </div>
      )}

      {/* Big Tactile Punch Action Buttons */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <button
          onClick={() => handlePunch('IN')}
          disabled={isPunching || punchStatus.isPunchedIn || isGeofenceLocked}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            padding: '13px 18px',
            borderRadius: '14px',
            border: 'none',
            background: punchStatus.isPunchedIn || isGeofenceLocked
              ? '#f1f5f9' 
              : 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
            color: punchStatus.isPunchedIn || isGeofenceLocked ? '#94a3b8' : 'white',
            fontWeight: 800,
            fontSize: '0.92rem',
            cursor: punchStatus.isPunchedIn || isPunching || isGeofenceLocked ? 'not-allowed' : 'pointer',
            boxShadow: punchStatus.isPunchedIn || isGeofenceLocked ? 'none' : '0 4px 14px rgba(16, 185, 129, 0.35)',
            transition: 'all 0.2s',
            opacity: punchStatus.isPunchedIn || isGeofenceLocked ? 0.65 : 1
          }}
        >
          <LogIn size={18} />
          <span>{isPunching && !punchStatus.isPunchedIn ? 'Recording...' : 'Punch In'}</span>
        </button>

        <button
          onClick={() => handlePunch('OUT')}
          disabled={isPunching || !punchStatus.isPunchedIn || isGeofenceLocked}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            padding: '13px 18px',
            borderRadius: '14px',
            border: 'none',
            background: !punchStatus.isPunchedIn || isGeofenceLocked
              ? '#f1f5f9' 
              : 'linear-gradient(135deg, #F43F5E 0%, #E11D48 100%)',
            color: !punchStatus.isPunchedIn || isGeofenceLocked ? '#94a3b8' : 'white',
            fontWeight: 800,
            fontSize: '0.92rem',
            cursor: !punchStatus.isPunchedIn || isPunching || isGeofenceLocked ? 'not-allowed' : 'pointer',
            boxShadow: !punchStatus.isPunchedIn || isGeofenceLocked ? 'none' : '0 4px 14px rgba(244, 63, 94, 0.35)',
            transition: 'all 0.2s',
            opacity: !punchStatus.isPunchedIn || isGeofenceLocked ? 0.65 : 1
          }}
        >
          <LogOut size={18} />
          <span>{isPunching && punchStatus.isPunchedIn ? 'Recording...' : 'Punch Out'}</span>
        </button>
      </div>

      {/* Geofence Lock Warning Banner under buttons */}
      {isGeofenceLocked && (
        <div style={{
          marginTop: '10px',
          padding: '8px 12px',
          borderRadius: '8px',
          background: '#FFF1F2',
          border: '1px solid #FFE4E6',
          color: '#BE123C',
          fontSize: '0.76rem',
          fontWeight: 700,
          textAlign: 'center',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px'
        }}>
          <AlertCircle size={14} />
          <span>Punch locked: You must be inside the campus area ({geofenceConfig.campusRadiusMeters}m radius) to record attendance.</span>
        </div>
      )}

      {/* Note toggle & Quick summary row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', fontSize: '0.78rem' }}>
        <button
          onClick={() => setShowNoteInput(!showNoteInput)}
          style={{
            background: 'none',
            border: 'none',
            color: '#4F46E5',
            fontWeight: 700,
            cursor: 'pointer',
            padding: 0,
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}
        >
          {showNoteInput ? '− Hide Note' : '+ Add Punch Note'}
        </button>

        {punchStatus.firstPunchIn && (
          <span style={{ color: '#64748b', fontWeight: 600 }}>
            First In: <strong style={{ color: '#1e3a8a' }}>{new Date(punchStatus.firstPunchIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong>
            {punchStatus.lastPunchOut && (
              <> • Last Out: <strong style={{ color: '#1e3a8a' }}>{new Date(punchStatus.lastPunchOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong></>
            )}
          </span>
        )}
      </div>

      {/* Live Toast alert within widget */}
      {message.show && (
        <div style={{
          marginTop: '12px',
          padding: '10px 14px',
          borderRadius: '10px',
          fontSize: '0.82rem',
          fontWeight: 700,
          background: message.type === 'error' ? '#FEF2F2' : '#F0FDF4',
          color: message.type === 'error' ? '#DC2626' : '#16A34A',
          border: message.type === 'error' ? '1px solid #FECACA' : '1px solid #BBF7D0',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          {message.type === 'error' ? <AlertCircle size={15} /> : <CheckCircle2 size={15} />}
          <span>{message.text}</span>
        </div>
      )}

      {/* ADMIN GEOFENCE SETUP MODAL */}
      {isGeofenceModalOpen && createPortal(
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(6px)',
          zIndex: 999999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '20px',
            width: '100%',
            maxWidth: '520px',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 25px 60px -15px rgba(0,0,0,0.3)'
          }}>
            <div style={{
              padding: '18px 24px',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: '#f8fafc'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#dbeafe', color: '#1d4ed8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Compass size={18} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#1e3a8a' }}>
                    Campus Geofence Configuration
                  </h3>
                  <span style={{ fontSize: '0.74rem', color: '#64748b' }}>
                    Define the boundary where staff can mark attendance
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsGeofenceModalOpen(false)}
                style={{ background: '#e2e8f0', border: 'none', borderRadius: '50%', width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              >
                <X size={16} />
              </button>
            </div>

            <div style={{ padding: '22px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Geofence Status overview */}
              <div style={{
                padding: '12px 16px',
                borderRadius: '12px',
                background: geofenceConfig.isConfigured ? '#F0FDF4' : '#FEF3C7',
                border: geofenceConfig.isConfigured ? '1px solid #BBF7D0' : '1px solid #FDE68A',
                fontSize: '0.82rem'
              }}>
                <div style={{ fontWeight: 800, color: geofenceConfig.isConfigured ? '#15803D' : '#92400E', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <ShieldCheck size={16} />
                  {geofenceConfig.isConfigured ? 'Geofence Active & Calibrated' : 'Campus Center Not Yet Calibrated'}
                </div>
                <div style={{ color: '#475569', marginTop: '4px', fontSize: '0.76rem' }}>
                  {geofenceConfig.isConfigured
                    ? `Campus Center: (${geofenceConfig.campusLatitude?.toFixed(5)}, ${geofenceConfig.campusLongitude?.toFixed(5)}) • Radius: ${geofenceConfig.campusRadiusMeters} meters`
                    : 'Click "Capture Current GPS Location" below while standing on school grounds to calibrate the campus center point.'}
                </div>
              </div>

              {/* Quick Calibration Button */}
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  onClick={handleCaptureCurrentLocation}
                  disabled={calibrationLoading}
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    background: '#2563EB',
                    color: 'white',
                    border: 'none',
                    fontWeight: 700,
                    fontSize: '0.82rem',
                    cursor: calibrationLoading ? 'not-allowed' : 'pointer'
                  }}
                >
                  <Crosshair size={16} />
                  <span>{calibrationLoading ? 'Acquiring GPS...' : 'Capture Current GPS Location'}</span>
                </button>
              </div>

              {/* Coordinates Inputs */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    Latitude
                  </label>
                  <input
                    type="number"
                    step="0.000001"
                    placeholder="e.g. 28.613939"
                    value={customLat}
                    onChange={(e) => setCustomLat(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    Longitude
                  </label>
                  <input
                    type="number"
                    step="0.000001"
                    placeholder="e.g. 77.209021"
                    value={customLng}
                    onChange={(e) => setCustomLng(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              {/* Allowed Radius Selector */}
              <div>
                <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                  Allowed Campus Radius (Meters)
                </label>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {[100, 200, 300, 500, 1000].map(r => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setCustomRadius(r)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '8px',
                        border: Number(customRadius) === r ? '2px solid #2563EB' : '1px solid #cbd5e1',
                        background: Number(customRadius) === r ? '#EFF6FF' : 'white',
                        color: Number(customRadius) === r ? '#1D4ED8' : '#475569',
                        fontWeight: 700,
                        fontSize: '0.78rem',
                        cursor: 'pointer'
                      }}
                    >
                      {r}m {r === 300 ? '(Recommended)' : ''}
                    </button>
                  ))}
                </div>
              </div>

              {/* Enforcement Toggle */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 14px',
                borderRadius: '10px',
                background: '#f8fafc',
                border: '1px solid #e2e8f0'
              }}>
                <div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#1e293b' }}>
                    Enforce Geofence Attendance Lock
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                    Staff outside the boundary will be prevented from punching.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={customEnabled}
                  onChange={(e) => setCustomEnabled(e.target.checked)}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
              </div>
            </div>

            <div style={{ padding: '14px 24px', borderTop: '1px solid #e2e8f0', background: '#f8fafc', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setIsGeofenceModalOpen(false)}
                style={{ padding: '8px 16px', borderRadius: '8px', background: '#f1f5f9', border: '1px solid #cbd5e1', color: '#475569', fontWeight: 700, fontSize: '0.84rem', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveGeofence}
                disabled={calibrationLoading}
                style={{ padding: '8px 20px', borderRadius: '8px', background: '#10B981', border: 'none', color: 'white', fontWeight: 800, fontSize: '0.84rem', cursor: calibrationLoading ? 'not-allowed' : 'pointer' }}
              >
                {calibrationLoading ? 'Saving...' : 'Save Geofence'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* PUNCH HISTORY MODAL */}
      {isHistoryOpen && createPortal(
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(6px)',
          zIndex: 999999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '20px',
            width: '100%',
            maxWidth: '560px',
            maxHeight: '85vh',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 25px 60px -15px rgba(0,0,0,0.3)'
          }}>
            <div style={{
              padding: '20px 24px',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: '#f8fafc'
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#1e3a8a' }}>
                  My Punch Attendance History
                </h3>
                <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                  Recent 7-Day punch records and geofence verification
                </span>
              </div>
              <button
                onClick={() => setIsHistoryOpen(false)}
                style={{ background: '#e2e8f0', border: 'none', borderRadius: '50%', width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              >
                <X size={16} />
              </button>
            </div>

            <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
              {/* Today's Punches breakdown */}
              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ margin: '0 0 10px 0', fontSize: '0.85rem', fontWeight: 800, color: '#4F46E5', textTransform: 'uppercase' }}>
                  Today's Timestamp Activity
                </h4>
                {(!punchStatus.punches || punchStatus.punches.length === 0) ? (
                  <div style={{ padding: '16px', borderRadius: '10px', background: '#f8fafc', color: '#64748b', fontSize: '0.82rem', textAlign: 'center' }}>
                    No punch activity recorded for today yet.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {punchStatus.punches.map((p, idx) => (
                      <div key={idx} style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '10px 14px',
                        borderRadius: '10px',
                        border: '1px solid #e2e8f0',
                        background: p.type === 'IN' ? '#F0FDF4' : '#FFF1F2'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{
                            padding: '3px 8px',
                            borderRadius: '6px',
                            fontSize: '0.75rem',
                            fontWeight: 800,
                            background: p.type === 'IN' ? '#10B981' : '#F43F5E',
                            color: 'white'
                          }}>
                            {p.type}
                          </span>
                          <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#1e293b' }}>
                            {new Date(p.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </span>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                            {p.note || p.location || 'Campus Portal'}
                          </div>
                          {p.distanceMeters != null && (
                            <div style={{ fontSize: '0.72rem', color: '#059669', fontWeight: 700 }}>
                              📍 {p.distanceMeters}m from center {p.isWithinGeofence ? '✓' : ''}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Past 7 days attendance summary */}
              <div>
                <h4 style={{ margin: '0 0 10px 0', fontSize: '0.85rem', fontWeight: 800, color: '#1e3a8a', textTransform: 'uppercase' }}>
                  Past Attendance Logs
                </h4>
                {(!punchStatus.recentHistory || punchStatus.recentHistory.length === 0) ? (
                  <div style={{ padding: '16px', borderRadius: '10px', background: '#f8fafc', color: '#64748b', fontSize: '0.82rem', textAlign: 'center' }}>
                    No historical logs found.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {punchStatus.recentHistory.map((rec) => {
                      const hours = Math.floor((rec.workDurationMinutes || 0) / 60);
                      const mins = (rec.workDurationMinutes || 0) % 60;
                      return (
                        <div key={rec._id} style={{
                          padding: '12px 14px',
                          borderRadius: '12px',
                          border: '1px solid #e2e8f0',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          background: 'white'
                        }}>
                          <div>
                            <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#1e3a8a' }}>
                              {new Date(rec.date).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>
                              In: {rec.punchIn ? new Date(rec.punchIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'} • Out: {rec.punchOut ? new Date(rec.punchOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                            </div>
                          </div>

                          <div style={{ textAlign: 'right' }}>
                            <span style={{
                              padding: '2px 8px',
                              borderRadius: '6px',
                              fontSize: '0.72rem',
                              fontWeight: 800,
                              background: rec.status === 'Present' ? '#DCFCE7' : rec.status === 'Late' ? '#FEF08A' : '#EFF6FF',
                              color: rec.status === 'Present' ? '#15803D' : rec.status === 'Late' ? '#854D0E' : '#1D4ED8'
                            }}>
                              {rec.status}
                            </span>
                            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', marginTop: '3px' }}>
                              {hours}h {mins}m
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div style={{ padding: '14px 24px', borderTop: '1px solid #e2e8f0', background: '#f8fafc', textAlign: 'right' }}>
              <button
                onClick={() => setIsHistoryOpen(false)}
                style={{
                  padding: '8px 18px',
                  borderRadius: '8px',
                  background: '#2563eb',
                  border: 'none',
                  color: 'white',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  cursor: 'pointer'
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default StaffPunchClock;
