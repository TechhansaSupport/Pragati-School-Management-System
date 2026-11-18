import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { 
  Map, MapPin, Search, Plus, Navigation, Users, Clock, AlertCircle, X, 
  Bus, Phone, User, Building2, Gauge, CheckCircle2, ShieldCheck, ArrowRight, Trash2, UserCheck
} from 'lucide-react';

const TransportRoutes = () => {
  const navigate = useNavigate();
  const tenantSlug = sessionStorage.getItem('tenantSlug') || '';
  const userInfo = JSON.parse(sessionStorage.getItem('userInfo') || '{}');
  const token = userInfo.token || sessionStorage.getItem('token') || '';

  const [searchQuery, setSearchQuery] = useState('');
  const [routes, setRoutes] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [selectedDriverId, setSelectedDriverId] = useState('');
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [stats, setStats] = useState({
    totalFleet: 5,
    activeRoutes: 5,
    totalStops: 38,
    mappedStudents: 188,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [newRouteForm, setNewRouteForm] = useState({
    name: '',
    start: '',
    end: 'School Main Campus',
    stops: 5,
    stopNames: [],
    distance: '12 km',
    busNumber: '',
    capacity: 40,
    driverName: '',
    driverContact: '',
    timing: '06:45 AM - 07:30 AM',
  });
  const [currentStopInput, setCurrentStopInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getHeaders = () => {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (tenantSlug) headers['x-tenant-slug'] = tenantSlug;
    return headers;
  };

  const fetchRoutesData = async () => {
    setIsLoading(true);
    try {
      const [routesRes, statsRes, driversRes, vehiclesRes] = await Promise.all([
        fetch('http://localhost:5000/api/transport/routes', { headers: getHeaders() }),
        fetch('http://localhost:5000/api/transport/stats', { headers: getHeaders() }),
        fetch('http://localhost:5000/api/transport/drivers', { headers: getHeaders() }),
        fetch('http://localhost:5000/api/transport/vehicles', { headers: getHeaders() })
      ]);
      if (routesRes.ok) {
        const data = await routesRes.json();
        setRoutes(Array.isArray(data) ? data : []);
      }
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }
      if (driversRes && driversRes.ok) {
        const driversData = await driversRes.json();
        setDrivers(Array.isArray(driversData) ? driversData : []);
      }
      if (vehiclesRes && vehiclesRes.ok) {
        const vehiclesData = await vehiclesRes.json();
        setVehicles(Array.isArray(vehiclesData) ? vehiclesData : []);
      }
    } catch (err) {
      console.warn('Failed to load transport data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRoutesData();
  }, [tenantSlug]);

  const handleDriverSelect = (driverId) => {
    setSelectedDriverId(driverId);
    if (!driverId) {
      setNewRouteForm(prev => ({
        ...prev,
        driverName: '',
        driverContact: '',
      }));
      return;
    }
    const found = drivers.find(d => d._id === driverId);
    if (found) {
      setNewRouteForm(prev => {
        const update = {
          ...prev,
          driverName: found.name,
          driverContact: found.contact || '',
        };
        if (!selectedVehicleId && found.assignedBus) {
          const matchVeh = vehicles.find(v => v.vehicleNumber.toLowerCase() === found.assignedBus.toLowerCase());
          if (matchVeh) {
            setSelectedVehicleId(matchVeh._id);
            update.busNumber = matchVeh.vehicleNumber;
            update.capacity = matchVeh.capacity || prev.capacity;
          } else {
            update.busNumber = found.assignedBus;
          }
        }
        return update;
      });
    }
  };

  const handleVehicleSelect = (vehicleId) => {
    setSelectedVehicleId(vehicleId);
    if (!vehicleId) {
      setNewRouteForm(prev => ({
        ...prev,
        busNumber: '',
        capacity: 40,
      }));
      return;
    }
    const found = vehicles.find(v => v._id === vehicleId);
    if (found) {
      setNewRouteForm(prev => {
        const update = {
          ...prev,
          busNumber: found.vehicleNumber,
          capacity: found.capacity || 40,
        };
        if (!selectedDriverId && found.assignedDriver) {
          const matchDriver = drivers.find(d => d.name.toLowerCase() === found.assignedDriver.toLowerCase());
          if (matchDriver) {
            setSelectedDriverId(matchDriver._id);
            update.driverName = matchDriver.name;
            update.driverContact = matchDriver.contact || '';
          } else {
            update.driverName = found.assignedDriver;
          }
        }
        return update;
      });
    }
  };

  const handleAddStop = () => {
    const trimmed = currentStopInput.trim();
    if (!trimmed) return;
    if (newRouteForm.stopNames.includes(trimmed)) {
      setCurrentStopInput('');
      return;
    }
    const updated = [...newRouteForm.stopNames, trimmed];
    setNewRouteForm(prev => ({
      ...prev,
      stopNames: updated,
      stops: updated.length
    }));
    setCurrentStopInput('');
  };

  const handleRemoveStop = (indexToRemove) => {
    const updated = newRouteForm.stopNames.filter((_, idx) => idx !== indexToRemove);
    setNewRouteForm(prev => ({
      ...prev,
      stopNames: updated,
      stops: updated.length > 0 ? updated.length : 1
    }));
  };

  const handleStopInputKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      handleAddStop();
    }
  };

  const handleDeleteRoute = async (routeId, routeName) => {
    if (!window.confirm(`Are you sure you want to delete route "${routeName}"?`)) return;
    try {
      const res = await fetch(`http://localhost:5000/api/transport/routes/${routeId}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });
      if (res.ok) {
        fetchRoutesData();
      }
    } catch (err) {
      console.error('Failed to delete route:', err);
    }
  };

  const handleCreateRoute = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!newRouteForm.name.trim() || !newRouteForm.start.trim() || !newRouteForm.busNumber.trim() || !newRouteForm.driverName.trim()) {
      setErrorMsg('Please complete all required fields (*).');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('http://localhost:5000/api/transport/routes', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(newRouteForm),
      });
      if (res.ok) {
        setIsAddModalOpen(false);
        setSelectedDriverId('');
        setSelectedVehicleId('');
        setNewRouteForm({
          name: '',
          start: '',
          end: 'School Main Campus',
          stops: 5,
          stopNames: [],
          distance: '12 km',
          busNumber: '',
          capacity: 40,
          driverName: '',
          driverContact: '',
          timing: '06:45 AM - 07:30 AM',
        });
        setCurrentStopInput('');
        fetchRoutesData();
      } else {
        const errData = await res.json().catch(() => ({}));
        setErrorMsg(errData.message || 'Failed to create transport route. Please verify fields.');
      }
    } catch (err) {
      console.error('Error adding route:', err);
      setErrorMsg('Network error while saving transport route.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredRoutes = routes.filter(route => 
    route.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (route.routeId && route.routeId.toLowerCase().includes(searchQuery.toLowerCase())) ||
    route.start?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    route.busNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    route.driverName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="dashboard-grid">
      
      {/* ─── Modern Clean Executive Header Card ─── */}
      <div className="card" style={{
        gridColumn: '1 / -1',
        background: 'white',
        borderRadius: '16px',
        padding: '18px 24px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '46px',
            height: '46px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(5, 150, 105, 0.18) 100%)',
            color: '#059669',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <Navigation size={22} strokeWidth={2.2} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h1 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>
                Route Management
              </h1>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, background: '#ecfdf5', color: '#059669', padding: '3px 10px', borderRadius: '12px', border: '1px solid #a7f3d0' }}>
                Active Fleet Tracking
              </span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button 
            type="button"
            onClick={() => navigate(tenantSlug ? `/${tenantSlug}/transport` : '/transport')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '9px 16px',
              background: '#f8fafc',
              border: '1px solid #cbd5e1',
              borderRadius: '10px',
              color: '#475569',
              fontWeight: 700,
              fontSize: '0.82rem',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <Bus size={15} /> Transport Hub →
          </button>

          <button 
            type="button"
            onClick={() => {
              setErrorMsg('');
              setSelectedDriverId('');
              setSelectedVehicleId('');
              setIsAddModalOpen(true);
            }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '9px 20px',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              border: 'none',
              borderRadius: '10px',
              color: 'white',
              fontWeight: 700,
              fontSize: '0.84rem',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)',
              transition: 'all 0.15s ease'
            }}
          >
            <Plus size={16} strokeWidth={2.5} /> Create New Route
          </button>
        </div>
      </div>

      <div className="left-column" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Active Route Metrics */}
        <div className="kpi-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '16px' }}>
          {[
            { label: 'Active Routes', value: `${stats.activeRoutes || routes.length}`, icon: Navigation, color: '#4F46E5', bg: 'rgba(79,70,229,0.1)' },
            { label: 'Total Pick-up Stops', value: `${stats.totalStops || 38}`, icon: MapPin, color: '#16A34A', bg: 'rgba(22, 163, 74,0.1)' },
            { label: 'Students Commuting', value: `${stats.mappedStudents || 188}`, icon: Users, color: '#60A5FA', bg: 'rgba(96,165,250,0.1)' },
            { label: 'Fleet Optimization', value: '100% OK', icon: AlertCircle, color: '#F59E0B', bg: 'rgba(245, 158, 11,0.1)' }
          ].map((kpi, i) => (
            <div key={i} className="card hover-lift" style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '18px 22px', borderRadius: '16px', background: 'white', border: '1px solid #e2e8f0', boxShadow: '0 2px 10px rgba(0,0,0,0.02)', transition: 'all 0.3s' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: kpi.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <kpi.icon size={20} color={kpi.color} />
                </div>
              </div>
              <div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a' }}>{kpi.value}</div>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>{kpi.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Routes List */}
        <div className="card" style={{ flex: 1, padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div className="card-header" style={{ padding: '24px 24px 16px 24px' }}>
            <div className="card-title">Live Configured Routes ({filteredRoutes.length} records)</div>
            <div className="table-search" style={{ margin: 0, background: 'rgba(248,250,252,0.8)', border: '1px solid rgba(226,232,240,0.8)', borderRadius: '12px' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '10px', color: '#64748B' }} />
              <input 
                type="text" 
                placeholder="Search route name, ID, bus, driver..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ outline: 'none', width: '220px', padding: '10px 10px 10px 36px', background: 'transparent', border: 'none', fontSize: '0.9rem' }}
              />
            </div>
          </div>
          
          <div style={{ overflowX: 'auto', flex: 1 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--color-bg)', borderBottom: '1px solid var(--color-border)' }}>
                  <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '0.75rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Route Info</th>
                  <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '0.75rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Path Details & Stops</th>
                  <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '0.75rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Logistics</th>
                  <th style={{ padding: '12px 24px', textAlign: 'right', fontSize: '0.75rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status & Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredRoutes.length > 0 ? (
                  filteredRoutes.map((route, i) => (
                    <tr key={route._id || i} className="table-row-hover" style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <td style={{ padding: '16px 24px' }}>
                        <div style={{ fontWeight: 700, color: '#1e293b' }}>{route.routeId}</div>
                        <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '2px', fontWeight: 500 }}>{route.name}</div>
                      </td>
                      <td style={{ padding: '16px 24px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10B981', flexShrink: 0 }}></div>
                          <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#334155' }}>{route.start}</span>
                        </div>
                        <div style={{ borderLeft: '2px dashed #cbd5e1', height: '12px', marginLeft: '3px', marginY: '2px' }}></div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#EF4444', flexShrink: 0 }}></div>
                          <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#334155' }}>{route.end}</span>
                        </div>

                        {/* Stop Names Waypoints */}
                        {route.stopNames && route.stopNames.length > 0 && (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '8px' }}>
                            {route.stopNames.slice(0, 3).map((stName, sIdx) => (
                              <span key={sIdx} style={{
                                fontSize: '0.72rem',
                                background: '#f8fafc',
                                border: '1px solid #e2e8f0',
                                color: '#475569',
                                padding: '2px 8px',
                                borderRadius: '6px',
                                fontWeight: 600,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}>
                                <span style={{ color: '#059669', fontSize: '0.66rem', fontWeight: 800 }}>#{sIdx + 1}</span>
                                {stName}
                              </span>
                            ))}
                            {route.stopNames.length > 3 && (
                              <span style={{
                                fontSize: '0.72rem',
                                color: '#6366f1',
                                fontWeight: 700,
                                background: 'rgba(99, 102, 241, 0.08)',
                                padding: '2px 6px',
                                borderRadius: '6px'
                              }}>
                                +{route.stopNames.length - 3} more
                              </span>
                            )}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '16px 24px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: '#475569' }}>
                            <Clock size={14} color="#6366f1" /> {route.timing}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: '#475569' }}>
                            <MapPin size={14} color="#10b981" /> {route.stops} Stops ({route.distance})
                          </div>
                        </div>
                        <div style={{ marginTop: '8px', fontSize: '0.8rem', color: '#64748b' }}>
                          Bus: <strong style={{ color: '#1e293b' }}>{route.busNumber}</strong> • Driver: {route.driverName} {route.driverContact ? `(${route.driverContact})` : ''}
                        </div>
                      </td>
                      <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '10px' }}>
                          <span style={{
                            padding: '4px 10px',
                            borderRadius: '8px',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            background: route.status === 'On Time' ? '#dcfce7' : route.status === 'Completed' ? '#f1f5f9' : '#fee2e2',
                            color: route.status === 'On Time' ? '#16a34a' : route.status === 'Completed' ? '#64748b' : '#ef4444'
                          }}>
                            {route.status || 'On Time'}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleDeleteRoute(route._id, route.name)}
                            title="Delete Route"
                            style={{
                              background: '#f8fafc',
                              border: '1px solid #e2e8f0',
                              borderRadius: '8px',
                              padding: '5px 7px',
                              cursor: 'pointer',
                              color: '#94a3b8',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              transition: 'all 0.15s ease'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.color = '#ef4444';
                              e.currentTarget.style.borderColor = '#fecaca';
                              e.currentTarget.style.background = '#fef2f2';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.color = '#94a3b8';
                              e.currentTarget.style.borderColor = '#e2e8f0';
                              e.currentTarget.style.background = '#f8fafc';
                            }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                      No routes found. Click "+ Create New Route" to add one.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
      {/* RIGHT COLUMN - MAP VISUALIZATION */}
      <div className="right-column">
        <div className="card" style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>
          <div className="card-header" style={{ padding: '24px 24px 16px 24px', borderBottom: '1px solid var(--color-border)' }}>
            <div className="card-title">Live Map Vector</div>
            <div className="badge" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10B981' }}>Active Fleet Tracking</div>
          </div>
          <div style={{ flex: 1, background: '#f1f5f9', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ position: 'absolute', inset: 0, opacity: 0.5, backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
            
            <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}>
                <Map size={32} color="#059669" />
              </div>
              <div style={{ fontWeight: 600, color: '#334155' }}>Live GPS Fleet View</div>
              <div style={{ fontSize: '0.85rem', color: '#64748b', textAlign: 'center', maxWidth: '250px' }}>
                All {routes.length} vehicle paths coordinated with live student pick-up points.
              </div>
            </div>

            <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
              <path d="M 50 150 Q 150 50 250 150 T 400 150" fill="none" stroke="#10B981" strokeWidth="4" strokeDasharray="8 8" opacity="0.4" />
              <circle cx="50" cy="150" r="6" fill="#10B981" />
              <circle cx="250" cy="150" r="6" fill="#10B981" />
              <circle cx="400" cy="150" r="8" fill="#EF4444" />
            </svg>
          </div>
        </div>
      </div>

      {/* ─── PORTAL-RENDERED MODAL (NEVER CLIPPED OR COVERED BY TOPBAR) ─── */}
      {isAddModalOpen && createPortal(
        <div 
          onClick={(e) => { if (e.target === e.currentTarget) setIsAddModalOpen(false); }}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.7)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99999999,
            padding: '24px 16px',
            boxSizing: 'border-box'
          }}
        >
          <div style={{
            background: 'white',
            borderRadius: '24px',
            width: '620px',
            maxWidth: '100%',
            maxHeight: 'calc(100vh - 48px)',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.4)',
            border: '1px solid rgba(226, 232, 240, 0.9)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            
            {/* 1. Modal Header (Pinned at Top) */}
            <div style={{
              padding: '20px 26px',
              borderBottom: '1px solid #f1f5f9',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexShrink: 0
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '12px',
                  background: '#ecfdf5',
                  color: '#059669',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <Bus size={22} strokeWidth={2.2} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#0f172a', fontWeight: 800 }}>
                    Create New Transport Route
                  </h3>
                  <p style={{ margin: '2px 0 0 0', fontSize: '0.78rem', color: '#64748b' }}>
                    Configure transit corridor, stop schedule, bus vehicle, and driver details
                  </p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setIsAddModalOpen(false)} 
                style={{
                  background: '#f1f5f9',
                  border: 'none',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: '#64748b',
                  transition: 'all 0.15s ease'
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Error Message if any */}
            {errorMsg && (
              <div style={{
                margin: '14px 26px 0',
                padding: '10px 14px',
                borderRadius: '10px',
                background: '#fef2f2',
                border: '1px solid #fecaca',
                color: '#dc2626',
                fontSize: '0.82rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <AlertCircle size={16} /> {errorMsg}
              </div>
            )}

            {/* 2. Scrollable Form Content */}
            <form onSubmit={handleCreateRoute} style={{
              display: 'flex',
              flexDirection: 'column',
              flex: 1,
              minHeight: 0,
              overflow: 'hidden'
            }}>
              <div style={{
                padding: '20px 26px',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px',
                overflowY: 'auto',
                flex: 1
              }}>
                
                {/* Row 1: Route Name & Label */}
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '5px' }}>
                    <Navigation size={13} color="#059669" /> Route Name & Label <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. Route 6 - Andheri West Express"
                    value={newRouteForm.name}
                    onChange={e => setNewRouteForm({ ...newRouteForm, name: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '0.86rem', boxSizing: 'border-box' }}
                  />
                </div>

                {/* Row 2: Starting Point & Destination Point */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '5px' }}>
                      <MapPin size={13} color="#10b981" /> Starting Point <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. Lokhandwala Complex"
                      value={newRouteForm.start}
                      onChange={e => setNewRouteForm({ ...newRouteForm, start: e.target.value })}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '0.86rem', boxSizing: 'border-box' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '5px' }}>
                      <Building2 size={13} color="#ef4444" /> Destination / Campus <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. School Main Campus"
                      value={newRouteForm.end}
                      onChange={e => setNewRouteForm({ ...newRouteForm, end: e.target.value })}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '0.86rem', boxSizing: 'border-box' }}
                    />
                  </div>
                </div>

                {/* Section: Corridor Stops & Waypoints Name Entry */}
                <div style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '14px',
                  padding: '14px 16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', fontWeight: 700, color: '#334155', margin: 0 }}>
                      <MapPin size={14} color="#059669" /> Route Stops & Waypoints (Optional)
                    </label>
                    <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#059669', background: '#ecfdf5', padding: '2px 8px', borderRadius: '12px' }}>
                      {newRouteForm.stopNames.length} stop{newRouteForm.stopNames.length === 1 ? '' : 's'} added
                    </span>
                  </div>
                  
                  <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b' }}>
                    Add pickup & drop stop names in order along this transit route (e.g. Lokhandwala Circle, Infinity Mall).
                  </p>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input 
                      type="text" 
                      placeholder="Type stop name & press Enter..."
                      value={currentStopInput}
                      onChange={e => setCurrentStopInput(e.target.value)}
                      onKeyDown={handleStopInputKeyDown}
                      style={{ 
                        flex: 1, 
                        padding: '9px 12px', 
                        borderRadius: '10px', 
                        border: '1px solid #cbd5e1', 
                        outline: 'none', 
                        fontSize: '0.84rem', 
                        background: 'white',
                        boxSizing: 'border-box' 
                      }}
                    />
                    <button 
                      type="button"
                      onClick={handleAddStop}
                      style={{
                        padding: '9px 16px',
                        borderRadius: '10px',
                        background: '#059669',
                        color: 'white',
                        border: 'none',
                        fontWeight: 700,
                        fontSize: '0.82rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                        transition: 'all 0.15s ease',
                        boxShadow: '0 2px 6px rgba(5, 150, 105, 0.2)'
                      }}
                    >
                      <Plus size={15} strokeWidth={2.5} /> Add Stop
                    </button>
                  </div>

                  {/* Added Stops Badges */}
                  {newRouteForm.stopNames.length > 0 ? (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '4px' }}>
                      {newRouteForm.stopNames.map((stopName, idx) => (
                        <span 
                          key={idx} 
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '4px 10px',
                            background: 'white',
                            border: '1px solid #cbd5e1',
                            borderRadius: '20px',
                            fontSize: '0.78rem',
                            fontWeight: 600,
                            color: '#1e293b',
                            boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
                          }}
                        >
                          <span style={{ 
                            width: '18px', 
                            height: '18px', 
                            borderRadius: '50%', 
                            background: '#ecfdf5', 
                            color: '#059669', 
                            display: 'inline-flex', 
                            alignItems: 'center', 
                            justifyContent: 'center', 
                            fontSize: '0.68rem', 
                            fontWeight: 800 
                          }}>
                            {idx + 1}
                          </span>
                          {stopName}
                          <button 
                            type="button"
                            onClick={() => handleRemoveStop(idx)}
                            title="Remove Stop"
                            style={{
                              background: 'transparent',
                              border: 'none',
                              padding: '0 2px',
                              cursor: 'pointer',
                              color: '#94a3b8',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.color = '#ef4444'}
                            onMouseLeave={(e) => e.currentTarget.style.color = '#94a3b8'}
                          >
                            <X size={13} strokeWidth={2.5} />
                          </button>
                        </span>
                      ))}
                    </div>
                  ) : (
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontStyle: 'italic', padding: '2px 0' }}>
                      No intermediate stop names added yet. You can type and add stop names above.
                    </div>
                  )}
                </div>

                {/* Row 3: Stops Count & Distance */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '5px' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Map size={13} color="#6366f1" /> Number of Stops
                      </span>
                      {newRouteForm.stopNames.length > 0 && (
                        <span style={{ fontSize: '0.7rem', color: '#059669', fontWeight: 600 }}>
                          (Synced)
                        </span>
                      )}
                    </label>
                    <input 
                      type="number" 
                      min="1"
                      max="50"
                      placeholder="e.g. 6"
                      value={newRouteForm.stops}
                      onChange={e => setNewRouteForm({ ...newRouteForm, stops: Number(e.target.value) })}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '0.86rem', boxSizing: 'border-box' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '5px' }}>
                      <Gauge size={13} color="#8b5cf6" /> Route Distance
                    </label>
                    <input 
                      type="text" 
                      placeholder="e.g. 12 km"
                      value={newRouteForm.distance}
                      onChange={e => setNewRouteForm({ ...newRouteForm, distance: e.target.value })}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '0.86rem', boxSizing: 'border-box' }}
                    />
                  </div>
                </div>

                {/* Row 4: Bus Vehicle & Driver Selection */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '5px' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Bus size={13} color="#f59e0b" /> Bus / Vehicle <span style={{ color: '#ef4444' }}>*</span>
                      </span>
                      {selectedVehicleId && newRouteForm.capacity && (
                        <span style={{ fontSize: '0.7rem', color: '#059669', fontWeight: 600 }}>
                          {newRouteForm.capacity} Seats
                        </span>
                      )}
                    </label>
                    <select
                      required
                      value={selectedVehicleId}
                      onChange={(e) => handleVehicleSelect(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        borderRadius: '10px',
                        border: '1px solid #cbd5e1',
                        outline: 'none',
                        fontSize: '0.86rem',
                        background: 'white',
                        color: selectedVehicleId ? '#0f172a' : '#64748b',
                        boxSizing: 'border-box',
                        cursor: 'pointer'
                      }}
                    >
                      <option value="">-- Select Bus / Vehicle --</option>
                      {vehicles.map(v => (
                        <option key={v._id} value={v._id}>
                          {v.vehicleNumber} • {v.model} ({v.capacity} Seats)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '5px' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <User size={13} color="#06b6d4" /> Assigned Driver <span style={{ color: '#ef4444' }}>*</span>
                      </span>
                      {selectedDriverId && newRouteForm.driverContact && (
                        <span style={{ fontSize: '0.7rem', color: '#059669', fontWeight: 600 }}>
                          {newRouteForm.driverContact}
                        </span>
                      )}
                    </label>
                    <select
                      required
                      value={selectedDriverId}
                      onChange={(e) => handleDriverSelect(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        borderRadius: '10px',
                        border: '1px solid #cbd5e1',
                        outline: 'none',
                        fontSize: '0.86rem',
                        background: 'white',
                        color: selectedDriverId ? '#0f172a' : '#64748b',
                        boxSizing: 'border-box',
                        cursor: 'pointer'
                      }}
                    >
                      <option value="">-- Select Driver --</option>
                      {drivers.map(d => (
                        <option key={d._id} value={d._id}>
                          {d.name} {d.contact ? `• ${d.contact}` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Row 6: Shift & Timing */}
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '5px' }}>
                    <Clock size={13} color="#6366f1" /> Daily Shift / Pickup Timing
                  </label>
                  <input 
                    type="text" 
                    placeholder="e.g. 06:45 AM - 07:30 AM"
                    value={newRouteForm.timing}
                    onChange={e => setNewRouteForm({ ...newRouteForm, timing: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '0.86rem', boxSizing: 'border-box' }}
                  />
                </div>

              </div>

              {/* 3. Modal Footer (Pinned at Bottom) */}
              <div style={{
                padding: '14px 26px 18px',
                borderTop: '1px solid #f1f5f9',
                background: '#f8fafc',
                display: 'flex',
                gap: '12px',
                flexShrink: 0
              }}>
                <button 
                  type="button" 
                  onClick={() => setIsAddModalOpen(false)}
                  style={{
                    flex: 1,
                    padding: '10px 16px',
                    background: 'white',
                    border: '1px solid #cbd5e1',
                    borderRadius: '12px',
                    fontWeight: 700,
                    color: '#475569',
                    cursor: 'pointer',
                    fontSize: '0.86rem',
                    transition: 'all 0.15s ease'
                  }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  style={{
                    flex: 1.5,
                    padding: '10px 16px',
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    border: 'none',
                    borderRadius: '12px',
                    fontWeight: 800,
                    color: 'white',
                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
                    fontSize: '0.86rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <Plus size={16} strokeWidth={2.5} />
                  <span>{isSubmitting ? 'Saving Route...' : 'Create Transport Route'}</span>
                </button>
              </div>

            </form>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
};

export default TransportRoutes;
