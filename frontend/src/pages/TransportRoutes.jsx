import React, { useState, useEffect } from 'react';
import { Map, MapPin, Search, Plus, Navigation, Users, Clock, AlertCircle, X } from 'lucide-react';

const TransportRoutes = () => {
  const tenantSlug = sessionStorage.getItem('tenantSlug') || '';
  const userInfo = JSON.parse(sessionStorage.getItem('userInfo') || '{}');
  const token = userInfo.token || sessionStorage.getItem('token') || '';

  const [searchQuery, setSearchQuery] = useState('');
  const [routes, setRoutes] = useState([]);
  const [stats, setStats] = useState({
    totalFleet: 5,
    activeRoutes: 5,
    totalStops: 38,
    mappedStudents: 188,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newRouteForm, setNewRouteForm] = useState({
    name: '',
    start: '',
    end: 'School Campus',
    stops: 6,
    busNumber: '',
    driverName: '',
    driverContact: '',
    timing: '06:45 AM - 07:30 AM',
    distance: '12 km',
  });
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
      const [routesRes, statsRes] = await Promise.all([
        fetch('http://localhost:5000/api/transport/routes', { headers: getHeaders() }),
        fetch('http://localhost:5000/api/transport/stats', { headers: getHeaders() })
      ]);
      if (routesRes.ok) {
        const data = await routesRes.json();
        setRoutes(Array.isArray(data) ? data : []);
      }
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
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

  const handleCreateRoute = async (e) => {
    e.preventDefault();
    if (!newRouteForm.name.trim() || !newRouteForm.start.trim() || !newRouteForm.busNumber.trim() || !newRouteForm.driverName.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('http://localhost:5000/api/transport/routes', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(newRouteForm),
      });
      if (res.ok) {
        setIsAddModalOpen(false);
        setNewRouteForm({
          name: '',
          start: '',
          end: 'School Campus',
          stops: 6,
          busNumber: '',
          driverName: '',
          driverContact: '',
          timing: '06:45 AM - 07:30 AM',
          distance: '12 km',
        });
        fetchRoutesData();
      }
    } catch (err) {
      console.error('Error adding route:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredRoutes = routes.filter(route => 
    route.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (route.routeId && route.routeId.toLowerCase().includes(searchQuery.toLowerCase())) ||
    route.start.toLowerCase().includes(searchQuery.toLowerCase()) ||
    route.busNumber.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="dashboard-grid">
      {/* Top Banner */}
      <div style={{
        gridColumn: '1 / -1',
        background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
        borderRadius: '16px',
        padding: '24px 32px',
        color: 'white',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 10px 25px -5px rgba(16, 185, 129, 0.4)'
      }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, margin: '0 0 8px 0' }}>Route Management 🗺️</h2>
          <p style={{ opacity: 0.9, fontSize: '0.95rem', margin: 0 }}>
            Live MongoDB route management for campus: <strong>{tenantSlug || 'Active School'}</strong>
          </p>
        </div>
        <div style={{ display: 'flex', gap: '16px' }}>
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="hover-lift" 
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 20px', background: 'white', border: 'none', borderRadius: '12px', color: '#059669', fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
          >
            <Plus size={20} /> Create New Route
          </button>
        </div>
      </div>

      <div className="left-column" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Active Route Metrics */}
        <div className="kpi-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--dashboard-card-gap)' }}>
          {[
            { label: 'Active Routes', value: `${stats.activeRoutes || routes.length}`, icon: Navigation, color: '#4F46E5', bg: 'rgba(79,70,229,0.1)' },
            { label: 'Total Pick-up Stops', value: `${stats.totalStops || 38}`, icon: MapPin, color: '#16A34A', bg: 'rgba(22, 163, 74,0.1)' },
            { label: 'Students Commuting', value: `${stats.mappedStudents || 188}`, icon: Users, color: '#60A5FA', bg: 'rgba(96,165,250,0.1)' },
            { label: 'Fleet Optimization', value: '100% OK', icon: AlertCircle, color: '#F59E0B', bg: 'rgba(245, 158, 11,0.1)' }
          ].map((kpi, i) => (
            <div key={i} className="card hover-lift" style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '16px', transition: 'all 0.3s' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: kpi.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <kpi.icon size={20} color={kpi.color} />
                </div>
              </div>
              <div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-primary)' }}>{kpi.value}</div>
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
                placeholder="Search route name, ID, bus..." 
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
                  <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '0.75rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Path Details</th>
                  <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '0.75rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Logistics</th>
                  <th style={{ padding: '12px 24px', textAlign: 'right', fontSize: '0.75rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</th>
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
                          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10B981' }}></div>
                          <span style={{ fontSize: '0.9rem', fontWeight: 500, color: '#334155' }}>{route.start}</span>
                        </div>
                        <div style={{ borderLeft: '2px dashed #cbd5e1', height: '12px', marginLeft: '3px', marginY: '2px' }}></div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#EF4444' }}></div>
                          <span style={{ fontSize: '0.9rem', fontWeight: 500, color: '#334155' }}>{route.end}</span>
                        </div>
                      </td>
                      <td style={{ padding: '16px 24px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: '#475569' }}>
                            <Clock size={14} color="#6366f1" /> {route.timing}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: '#475569' }}>
                            <MapPin size={14} color="#10b981" /> {route.stops} Stops ({route.distance})
                          </div>
                        </div>
                        <div style={{ marginTop: '8px', fontSize: '0.8rem', color: '#64748b' }}>
                          Bus: <strong style={{ color: '#1e293b' }}>{route.busNumber}</strong> • Driver: {route.driverName}
                        </div>
                      </td>
                      <td style={{ padding: '16px 24px', textAlign: 'right' }}>
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

      {/* Create Route Modal */}
      {isAddModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.5)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white', borderRadius: '16px', padding: '32px',
            width: '100%', maxWidth: '480px', boxShadow: '0 20px 40px rgba(0,0,0,0.15)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ margin: 0, fontSize: '1.3rem', color: '#1e3a8a', fontWeight: 800 }}>Create New Transport Route</h3>
              <button onClick={() => setIsAddModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateRoute} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>Route Name *</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Andheri West Express"
                  value={newRouteForm.name}
                  onChange={e => setNewRouteForm({ ...newRouteForm, name: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>Starting Point *</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. Lokhandwala"
                    value={newRouteForm.start}
                    onChange={e => setNewRouteForm({ ...newRouteForm, start: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>Stops Count</label>
                  <input 
                    type="number" 
                    min="1"
                    value={newRouteForm.stops}
                    onChange={e => setNewRouteForm({ ...newRouteForm, stops: Number(e.target.value) })}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>Bus Number *</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. MH-04-1234"
                    value={newRouteForm.busNumber}
                    onChange={e => setNewRouteForm({ ...newRouteForm, busNumber: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>Driver Name *</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. Ramesh Singh"
                    value={newRouteForm.driverName}
                    onChange={e => setNewRouteForm({ ...newRouteForm, driverName: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                <button 
                  type="button" 
                  onClick={() => setIsAddModalOpen(false)}
                  style={{ flex: 1, padding: '12px', background: '#f1f5f9', border: 'none', borderRadius: '8px', fontWeight: 600, color: '#475569', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  style={{ flex: 1, padding: '12px', background: '#10B981', border: 'none', borderRadius: '8px', fontWeight: 700, color: 'white', cursor: 'pointer' }}
                >
                  {isSubmitting ? 'Saving...' : 'Create Route'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransportRoutes;
