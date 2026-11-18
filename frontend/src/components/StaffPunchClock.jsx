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
  const userRole = (userInfo.role || sessionStorage.getItem('userRole') || '').toLowerCase();
  const isSuperAdmin = userRole === 'superadmin' || userInfo.isSuperAdmin || (sessionStorage.getItem('userRole') || '').toLowerCase() === 'superadmin';

  // Super Admin is platform governance and is never subject to campus punch clocks
  if (isSuperAdmin) {
    return null;
  }

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
    if (userInfo.name) headers['x-user-name'] = userInfo.name;
    if (userInfo.role) headers['x-user-role'] = userInfo.role;
    if (userInfo.username) headers['x-user-username'] = userInfo.username;
    if (userInfo.email) headers['x-user-email'] = userInfo.email;
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

  // Intelligently resolve the staff display name, ensuring logged in user identity is prioritized
  const safeUserName = typeof userInfo?.name === 'string' ? userInfo.name.trim() : (typeof userInfo?.fullName === 'string' ? userInfo.fullName.trim() : '');
  const safeStaffName = typeof punchStatus?.staff?.name === 'string' ? punchStatus.staff.name.trim() : '';
  const safeStaffRole = typeof punchStatus?.staff?.role === 'string' ? punchStatus.staff.role.trim() : '';
  const safeStaffEmpId = typeof punchStatus?.staff?.employeeId === 'string' ? punchStatus.staff.employeeId.trim() : '';

  const isFallbackRecord = Boolean(
    safeStaffName && 
    safeUserName && 
    safeStaffName.toLowerCase() !== safeUserName.toLowerCase() &&
    punchStatus?.staff?.portalUsername !== userInfo?.username && 
    punchStatus?.staff?.email !== userInfo?.email
  );
  const displayName = (!isFallbackRecord && safeStaffName) || safeUserName || userInfo?.username || 'Staff Member';
  const displayRole = (!isFallbackRecord && safeStaffRole) || (userInfo?.role ? String(userInfo.role).charAt(0).toUpperCase() + String(userInfo.role).slice(1) : 'Staff');
  const displayEmpId = (!isFallbackRecord && safeStaffEmpId) || userInfo?.uniqueId || 'EMP';

  return (
    <div style={{
      background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
      borderRadius: '18px',
      border: '1px solid #e2e8f0',
      boxShadow: '0 4px 20px -4px rgba(0, 0, 0, 0.05)',
      padding: compact ? '14px 18px' : '18px 22px',
      position: 'relative',
      overflow: 'visible',
      width: '100%',
      maxWidth: '100%',
      minHeight: 'fit-content',
      flexShrink: 0,
      display: 'block',
      boxSizing: 'border-box'
    }}>
      {/* Header with Live Status Indicator & Admin Setup */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '14px',
        paddingBottom: '12px',
        borderBottom: '1px solid #f1f5f9',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            background: punchStatus.isPunchedIn ? 'rgba(16, 185, 129, 0.12)' : 'rgba(99, 102, 241, 0.12)',
            color: punchStatus.isPunchedIn ? '#10B981' : '#6366F1',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
          }}>
            <Clock size={19} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#1e293b', letterSpacing: '-0.01em' }}>
                Staff Attendance & Time Clock
              </h3>
              {punchStatus.isPunchedIn ? (
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '2px 9px',
                  borderRadius: '20px',
                  background: '#dcfce7',
                  color: '#15803d',
                  fontSize: '0.74rem',
                  fontWeight: 800,
                  border: '1px solid #bbf7d0'
                }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#16a34a', display: 'inline-block' }} />
                  Active Shift {liveWorkingTime ? `• ⏱ ${liveWorkingTime}` : ''}
                </span>
              ) : punchStatus.lastPunchOut ? (
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '2px 9px',
                  borderRadius: '20px',
                  background: '#eef2ff',
                  color: '#4338ca',
                  fontSize: '0.74rem',
                  fontWeight: 800,
                  border: '1px solid #c7d2fe'
                }}>
                  <CheckCircle2 size={12} /> Shift Completed
                </span>
              ) : (
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '2px 9px',
                  borderRadius: '20px',
                  background: '#fef3c7',
                  color: '#92400e',
                  fontSize: '0.74rem',
                  fontWeight: 800,
                  border: '1px solid #fde68a'
                }}>
                  <AlertCircle size={12} /> Not Punched In
                </span>
              )}
            </div>

            <div style={{ fontSize: '0.76rem', color: '#64748b', marginTop: '3px', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
              <span style={{ fontWeight: 700, color: '#334155' }}>{displayName}</span>
              <span>•</span>
              <span style={{ background: '#f1f5f9', color: '#475569', padding: '1px 6px', borderRadius: '5px', fontWeight: 700, fontSize: '0.72rem' }}>
                {displayRole}
              </span>
              <span style={{ color: '#94a3b8' }}>({displayEmpId})</span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {isAdmin && (
            <button
              onClick={() => setIsGeofenceModalOpen(true)}
              className="hover-lift"
              style={{
                background: '#eff6ff',
                border: '1px solid #bfdbfe',
                borderRadius: '9px',
                padding: '6px 12px',
                fontSize: '0.76rem',
                fontWeight: 700,
                color: '#1d4ed8',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              title="Configure Campus Geofence Boundary"
            >
              <Compass size={14} /> Campus Geofence
            </button>
          )}

          <button
            onClick={() => setIsHistoryOpen(true)}
            className="hover-lift"
            style={{
              background: '#f8fafc',
              border: '1px solid #cbd5e1',
              borderRadius: '9px',
              padding: '6px 12px',
              fontSize: '0.76rem',
              fontWeight: 700,
              color: '#475569',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            title="View recent punch history"
          >
            <History size={14} /> Punch Log
          </button>
        </div>
      </div>

      {/* Balanced 2-Card Cockpit Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '14px',
        alignItems: 'stretch',
        width: '100%',
        boxSizing: 'border-box'
      }}>
        {/* Card 1: Time, Date & Campus Geofence Radar */}
        <div style={{
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '14px',
          padding: '16px 18px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          gap: '14px',
          minHeight: '135px',
          boxSizing: 'border-box'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Campus Time & Date
              </div>
              <div style={{ fontSize: '1.65rem', fontWeight: 900, color: '#0f172a', fontFamily: 'monospace', letterSpacing: '-0.02em', marginTop: '2px' }}>
                {formattedTime}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '5px', marginTop: '3px' }}>
                <Calendar size={13} /> {formattedDate}
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Today's Total
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 900, color: punchStatus.isPunchedIn ? '#10B981' : '#334155', fontFamily: 'monospace', marginTop: '2px' }}>
                {punchStatus.isPunchedIn && liveWorkingTime ? (
                  liveWorkingTime
                ) : punchStatus.totalDurationMinutes > 0 ? (
                  `${Math.floor(punchStatus.totalDurationMinutes / 60)}h ${punchStatus.totalDurationMinutes % 60}m`
                ) : (
                  '0h 0m'
                )}
              </div>
              <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 600, marginTop: '2px' }}>
                {punchStatus.punches ? `${punchStatus.punches.length} punches recorded` : '0 punches'}
              </div>
            </div>
          </div>

          {/* Geofence Radar Box */}
          <div style={{
            background: 'white',
            borderRadius: '10px',
            border: geoState.loading
              ? '1px solid #e2e8f0'
              : geoState.isWithinCampus
                ? '1px solid #bbf7d0'
                : '1px solid #fecaca',
            padding: '10px 14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '10px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                flexShrink: 0,
                background: geoState.loading ? '#e2e8f0' : geoState.isWithinCampus ? '#dcfce7' : '#fee2e2',
                color: geoState.loading ? '#64748b' : geoState.isWithinCampus ? '#15803d' : '#b91c1c',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {geoState.loading ? <RefreshCw size={14} style={{ animation: 'spin 1.5s linear infinite' }} /> : <MapPin size={15} />}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 800, color: geoState.isWithinCampus ? '#166534' : '#991b1b', lineHeight: 1.2 }}>
                  {geoState.loading ? (
                    'Verifying Geofence GPS...'
                  ) : !geofenceConfig.isConfigured ? (
                    '🟢 Inside Campus Area • GPS Active'
                  ) : geoState.isWithinCampus ? (
                    `🟢 Inside Campus Area ${geoState.distance !== null ? `(${geoState.distance}m)` : ''}`
                  ) : (
                    `🔴 Outside Campus (${geoState.distance !== null ? `${geoState.distance}m` : 'Locked'})`
                  )}
                </div>
                <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '2px', lineHeight: 1.2 }}>
                  {geoState.loading ? (
                    'Acquiring coordinates...'
                  ) : !geofenceConfig.geofenceEnabled || !geofenceConfig.isConfigured ? (
                    'Attendance unlocked on campus network.'
                  ) : geoState.isWithinCampus ? (
                    `Allowed campus radius: ${geofenceConfig.campusRadiusMeters}m.`
                  ) : (
                    geoState.error || `Locked outside ${geofenceConfig.campusRadiusMeters}m limit.`
                  )}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => refreshLocation()}
              disabled={geoState.loading}
              className="hover-lift"
              style={{
                background: '#f8fafc',
                border: '1px solid #cbd5e1',
                borderRadius: '7px',
                padding: '6px 10px',
                fontSize: '0.72rem',
                fontWeight: 700,
                color: '#334155',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                cursor: geoState.loading ? 'not-allowed' : 'pointer',
                flexShrink: 0,
                transition: 'all 0.15s'
              }}
              title="Re-check live device GPS location"
            >
              <RefreshCw size={11} style={{ animation: geoState.loading ? 'spin 1.5s linear infinite' : 'none' }} />
              Re-check GPS
            </button>
          </div>
        </div>

        {/* Card 2: Big Tactile Action Buttons & Punch Controls */}
        <div style={{
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '14px',
          padding: '16px 18px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          gap: '12px',
          minHeight: '135px',
          boxSizing: 'border-box'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Attendance Actions
            </div>
            <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>
              {punchStatus.firstPunchIn ? (
                <span>
                  First In: <strong style={{ color: '#0f172a' }}>{new Date(punchStatus.firstPunchIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong>
                  {punchStatus.lastPunchOut && (
                    <> • Last Out: <strong style={{ color: '#0f172a' }}>{new Date(punchStatus.lastPunchOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong></>
                  )}
                </span>
              ) : (
                <span style={{ color: '#94a3b8' }}>No punches recorded yet</span>
              )}
            </div>
          </div>

          {/* Big Action Buttons */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <button
              onClick={() => handlePunch('IN')}
              disabled={isPunching || punchStatus.isPunchedIn || isGeofenceLocked}
              className={punchStatus.isPunchedIn || isGeofenceLocked ? '' : 'hover-lift'}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '13px 18px',
                borderRadius: '12px',
                border: 'none',
                background: punchStatus.isPunchedIn || isGeofenceLocked
                  ? '#e2e8f0' 
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
              className={!punchStatus.isPunchedIn || isGeofenceLocked ? '' : 'hover-lift'}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '13px 18px',
                borderRadius: '12px',
                border: 'none',
                background: !punchStatus.isPunchedIn || isGeofenceLocked
                  ? '#e2e8f0' 
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

          {/* Note Toggle & Subtext */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.76rem' }}>
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
              {showNoteInput ? '− Hide Shift Note' : '+ Add Punch Note'}
            </button>

            <span style={{ color: '#94a3b8', fontSize: '0.72rem' }}>
              {punchStatus.isPunchedIn ? 'Click Punch Out when ending shift' : 'Click Punch In when starting duty'}
            </span>
          </div>
        </div>
      </div>

      {/* Optional Note / Purpose Input */}
      {showNoteInput && (
        <div style={{ marginTop: '12px' }}>
          <input
            type="text"
            placeholder="Add note (e.g. Lab duty, Library period, Half-day, Field visit)..."
            value={punchNote}
            onChange={(e) => setPunchNote(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 14px',
              borderRadius: '10px',
              border: '1px solid #cbd5e1',
              fontSize: '0.84rem',
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />
        </div>
      )}

      {/* Geofence Lock Warning Banner under buttons */}
      {isGeofenceLocked && (
        <div style={{
          marginTop: '8px',
          padding: '7px 12px',
          borderRadius: '8px',
          background: '#FFF1F2',
          border: '1px solid #FFE4E6',
          color: '#BE123C',
          fontSize: '0.75rem',
          fontWeight: 700,
          textAlign: 'center',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px'
        }}>
          <AlertCircle size={13} />
          <span>Punch locked: You must be inside the campus area ({geofenceConfig.campusRadiusMeters}m radius) to record attendance.</span>
        </div>
      )}

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
