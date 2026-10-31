import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bus, Map, Users, AlertCircle, Wrench, Search, Navigation, Calendar } from 'lucide-react';
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer, CartesianGrid, YAxis } from 'recharts';

const fleetStatusData = [
  { time: '06:00', active: 2 },
  { time: '07:00', active: 5 },
  { time: '08:00', active: 5 },
  { time: '09:00', active: 1 },
  { time: '13:00', active: 1 },
  { time: '14:00', active: 4 },
  { time: '15:00', active: 5 },
  { time: '16:00', active: 2 },
];

const TransportDashboard = () => {
  const navigate = useNavigate();
  const tenantSlug = sessionStorage.getItem('tenantSlug') || '';
  const userInfo = JSON.parse(sessionStorage.getItem('userInfo') || '{}');
  const token = userInfo.token || sessionStorage.getItem('token') || '';

  const [searchQuery, setSearchQuery] = useState('');
  const [transportStats, setTransportStats] = useState({
    totalFleet: 5,
    activeRoutes: 5,
    totalStops: 38,
    mappedStudents: 188,
    inMaintenance: 1,
  });
  const [routes, setRoutes] = useState([]);

  useEffect(() => {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (tenantSlug) headers['x-tenant-slug'] = tenantSlug;

    fetch('http://localhost:5000/api/transport/stats', { headers })
      .then(res => res.ok ? res.json() : null)
      .then(data => { if (data) setTransportStats(data); })
      .catch(err => console.warn('Transport stats error:', err));

    fetch('http://localhost:5000/api/transport/routes', { headers })
      .then(res => res.ok ? res.json() : [])
      .then(data => setRoutes(Array.isArray(data) ? data : []))
      .catch(err => console.warn('Transport routes error:', err));
  }, [tenantSlug]);

  const filteredRoutes = routes.filter(route =>
    route.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    route.busNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    route.driverName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    route.routeId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="dashboard-grid">
      {/* Top Banner - Glassmorphism */}
      <div style={{
        gridColumn: '1 / -1',
        background: 'linear-gradient(135deg, rgba(245,158,11,0.9) 0%, rgba(220, 38, 38,0.9) 100%)',
        borderRadius: '20px',
        padding: '24px 32px',
        color: 'white',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 10px 25px -5px rgba(245, 158, 11, 0.4)'
      }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0 }}>Fleet & Transport Management 🚌</h2>
        </div>
        <div style={{ display: 'flex', gap: '16px' }}>
          <button 
            onClick={() => navigate(tenantSlug ? `/${tenantSlug}/routes` : '/routes')}
            className="hover-lift" 
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 20px', background: 'white', border: 'none', borderRadius: '12px', color: '#ea580c', fontWeight: 700, cursor: 'pointer' }}
          >
            <Bus size={20} /> Manage Routes & Buses
          </button>
        </div>
      </div>

      {/* LEFT COLUMN */}
      <div className="left-column">
        {/* KPI Row */}
        <div className="kpi-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '16px' }}>
          {[
            { label: 'Total Fleet', value: `${transportStats.totalFleet || 5} Buses`, icon: Bus, color: '#4F46E5', bg: 'rgba(79,70,229,0.1)' },
            { label: 'Active Routes', value: `${transportStats.activeRoutes || 5}`, icon: Navigation, color: '#16A34A', bg: 'rgba(22, 163, 74,0.1)' },
            { label: 'Students Commuting', value: `${transportStats.mappedStudents || 188}`, icon: Users, color: '#60A5FA', bg: 'rgba(96,165,250,0.1)' },
            { label: 'Fleet In Service', value: `${transportStats.inMaintenance || 1}`, icon: Wrench, color: '#DC2626', bg: 'rgba(220, 38, 38,0.1)' }
          ].map((kpi, i) => (
            <div key={i} className="card hover-lift" style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '18px 22px', borderRadius: '16px', background: 'var(--color-surface, white)', border: '1px solid var(--color-border, #e2e8f0)', boxShadow: '0 2px 10px rgba(0,0,0,0.02)', transition: 'all 0.3s' }}>
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

        {/* Live Routes Table */}
        <div className="card" style={{ flex: 1, padding: 0, overflow: 'hidden' }}>
          <div className="card-header" style={{ padding: '24px 24px 16px 24px' }}>
            <div className="card-title">Live Route Tracking ({filteredRoutes.length} active)</div>
            <div className="table-search" style={{ margin: 0, background: 'var(--color-bg, #f8fafc)', border: '1px solid var(--color-border, #cbd5e1)', borderRadius: '12px' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '10px', color: '#64748B' }} />
              <input 
                type="text" 
                placeholder="Search Bus No. or Route..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ outline: 'none', width: '220px', padding: '10px 10px 10px 36px', background: 'transparent', border: 'none', fontSize: '0.9rem', color: 'var(--color-text-main)' }}
              />
            </div>
          </div>
          
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--color-border)', background: 'var(--color-bg, rgba(248,250,252,0.4))' }}>
                  <th style={{ textAlign: 'left', padding: '12px 24px', color: 'var(--color-text-muted)', fontWeight: 600, fontSize: '0.85rem' }}>Route</th>
                  <th style={{ textAlign: 'left', padding: '12px 24px', color: 'var(--color-text-muted)', fontWeight: 600, fontSize: '0.85rem' }}>Bus & Driver</th>
                  <th style={{ textAlign: 'left', padding: '12px 24px', color: 'var(--color-text-muted)', fontWeight: 600, fontSize: '0.85rem' }}>Capacity Occupancy</th>
                  <th style={{ textAlign: 'center', padding: '12px 24px', color: 'var(--color-text-muted)', fontWeight: 600, fontSize: '0.85rem' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredRoutes.map((route, i) => (
                  <tr key={route._id || i} style={{ borderBottom: '1px solid var(--color-border)', transition: 'background-color 0.2s', cursor: 'pointer' }}>
                    <td style={{ padding: '16px 24px' }}>
                      <div style={{ fontWeight: 700, color: '#1e293b', fontSize: '0.95rem' }}>{route.routeId}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{route.name}</div>
                    </td>
                    <td style={{ padding: '16px 24px' }}>
                      <div style={{ fontWeight: 600, color: '#475569', fontSize: '0.9rem' }}>{route.busNumber}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{route.driverName}</div>
                    </td>
                    <td style={{ padding: '16px 24px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ flex: 1, height: '6px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden', minWidth: '60px' }}>
                          <div style={{ height: '100%', background: ((route.studentsAssigned || 30) / (route.capacity || 40)) > 0.9 ? '#DC2626' : '#16A34A', width: `${((route.studentsAssigned || 30) / (route.capacity || 40)) * 100}%` }}></div>
                        </div>
                        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-main)' }}>{route.studentsAssigned || 30}/{route.capacity || 40}</span>
                      </div>
                    </td>
                    <td style={{ padding: '16px 24px', textAlign: 'center' }}>
                      <span style={{ 
                        padding: '6px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700, 
                        backgroundColor: route.status === 'On Time' ? 'rgba(22, 163, 74,0.1)' : route.status === 'Completed' ? 'rgba(148,163,184,0.1)' : 'rgba(245,158,11,0.1)', 
                        color: route.status === 'On Time' ? '#16A34A' : route.status === 'Completed' ? '#64748b' : '#d97706' 
                      }}>
                        {route.status || 'On Time'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* RIGHT COLUMN */}
      <div className="right-column">
        {/* Fleet Status Chart */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">Fleet Deployment Curve</div>
          </div>
          <div style={{ height: '220px', marginTop: '16px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={fleetStatusData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} />
                <Tooltip />
                <Area type="monotone" dataKey="active" stroke="#F59E0B" fill="rgba(245,158,11,0.2)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Maintenance Alerts */}
        <div className="card" style={{ flex: 1 }}>
          <div className="card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Wrench size={20} color="#DC2626" />
              <div className="card-title">Vehicle Maintenance Status</div>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '12px' }}>
            {[
              { bus: 'MH-04-1234', issue: 'Annual Fitness Inspection', days: 'Scheduled This Week', urgency: 'Medium' },
              { bus: 'MH-04-5678', issue: 'Brake & Oil Maintenance', days: 'Inspected OK', urgency: 'Normal' }
            ].map((m, i) => (
              <div key={i} style={{ padding: '12px 16px', background: '#f8fafc', borderRadius: '8px', borderLeft: '4px solid #F59E0B' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontWeight: 700, color: '#1e3a8a' }}>{m.bus}</span>
                  <span style={{ fontSize: '0.75rem', color: '#d97706', fontWeight: 600 }}>{m.urgency}</span>
                </div>
                <div style={{ fontSize: '0.85rem', color: '#64748b' }}>{m.issue} • {m.days}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransportDashboard;
