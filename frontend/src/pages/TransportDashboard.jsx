import React, { useState } from 'react';
import { Bus, Map, Users, AlertCircle, Wrench, Search, CheckCircle, Navigation, Clock } from 'lucide-react';
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer, CartesianGrid, YAxis } from 'recharts';

const fleetStatusData = [
  { time: '06:00', active: 2 },
  { time: '07:00', active: 15 },
  { time: '08:00', active: 18 },
  { time: '09:00', active: 4 },
  { time: '13:00', active: 3 },
  { time: '14:00', active: 16 },
  { time: '15:00', active: 18 },
  { time: '16:00', active: 5 },
];

const activeRoutes = [
  { id: 'RT-01', bus: 'MH-04-1234', driver: 'Ramesh Singh', area: 'Andheri West', students: 42, capacity: 45, status: 'On Time' },
  { id: 'RT-02', bus: 'MH-04-5678', driver: 'Suresh Kumar', area: 'Bandra East', students: 38, capacity: 40, status: 'Delayed (5m)' },
  { id: 'RT-03', bus: 'MH-04-9012', driver: 'Kishore M.', area: 'Borivali', students: 45, capacity: 45, status: 'On Time' },
  { id: 'RT-04', bus: 'MH-04-3456', driver: 'Vinod Patil', area: 'Goregaon', students: 28, capacity: 30, status: 'Completed' },
];

const maintenanceAlerts = [
  { bus: 'MH-04-1111', issue: 'Regular Service Due', days: 'In 2 days', urgency: 'Medium' },
  { bus: 'MH-04-2222', issue: 'AC Malfunction', days: 'Scheduled Today', urgency: 'High' },
];

const TransportDashboard = () => {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="dashboard-grid">
      {/* Top Banner - Glassmorphism */}
      <div style={{
        gridColumn: '1 / -1',
        background: 'linear-gradient(135deg, rgba(245,158,11,0.9) 0%, rgba(220, 38, 38,0.9) 100%)',
        borderRadius: '16px',
        padding: '24px 32px',
        color: 'white',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 10px 25px -5px rgba(245, 158, 11, 0.4)'
      }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, margin: '0 0 8px 0' }}>Fleet & Transport Management 🚌</h2>
          <p style={{ opacity: 0.9, fontSize: '0.95rem', margin: 0 }}>Monitor live routes, manage bus allocations, and track maintenance schedules.</p>
        </div>
        <div style={{ display: 'flex', gap: '16px' }}>
          <button className="hover-lift" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 20px', background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.4)', borderRadius: '12px', color: 'white', fontWeight: 700, cursor: 'pointer', backdropFilter: 'blur(10px)' }}>
            <Map size={20} /> Route Map
          </button>
          <button className="hover-lift" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 20px', background: 'white', border: 'none', borderRadius: '12px', color: '#ea580c', fontWeight: 700, cursor: 'pointer' }}>
            <Bus size={20} /> Add Vehicle
          </button>
        </div>
      </div>

      {/* LEFT COLUMN */}
      <div className="left-column">
        {/* KPI Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          {[
            { label: 'Total Fleet', value: '18 Buses', icon: Bus, color: '#4F46E5', bg: 'rgba(79,70,229,0.1)' },
            { label: 'Active Routes', value: '15', icon: Navigation, color: '#16A34A', bg: 'rgba(22, 163, 74,0.1)' },
            { label: 'Total Students', value: '640', icon: Users, color: '#60A5FA', bg: 'rgba(96,165,250,0.1)' },
            { label: 'In Maintenance', value: '2', icon: Wrench, color: '#DC2626', bg: 'rgba(220, 38, 38,0.1)' }
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

        {/* Live Routes Table */}
        <div className="card" style={{ flex: 1, padding: 0, overflow: 'hidden' }}>
          <div className="card-header" style={{ padding: '24px 24px 16px 24px' }}>
            <div className="card-title">Live Route Tracking</div>
            <div className="table-search" style={{ margin: 0, background: 'rgba(248,250,252,0.8)', border: '1px solid rgba(226,232,240,0.8)', borderRadius: '12px' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '10px', color: '#64748B' }} />
              <input 
                type="text" 
                placeholder="Search Bus No. or Area..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ outline: 'none', width: '220px', padding: '10px 10px 10px 36px', background: 'transparent', border: 'none', fontSize: '0.9rem' }}
              />
            </div>
          </div>
          
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--color-border)', background: 'rgba(248,250,252,0.4)' }}>
                  <th style={{ textAlign: 'left', padding: '12px 24px', color: 'var(--color-text-muted)', fontWeight: 600, fontSize: '0.85rem' }}>Route</th>
                  <th style={{ textAlign: 'left', padding: '12px 24px', color: 'var(--color-text-muted)', fontWeight: 600, fontSize: '0.85rem' }}>Bus & Driver</th>
                  <th style={{ textAlign: 'left', padding: '12px 24px', color: 'var(--color-text-muted)', fontWeight: 600, fontSize: '0.85rem' }}>Capacity</th>
                  <th style={{ textAlign: 'center', padding: '12px 24px', color: 'var(--color-text-muted)', fontWeight: 600, fontSize: '0.85rem' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {activeRoutes.map((route, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--color-border)', transition: 'background-color 0.2s', cursor: 'pointer' }} onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(248,250,252,0.6)'} onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                    <td style={{ padding: '16px 24px' }}>
                      <div style={{ fontWeight: 700, color: '#1e293b', fontSize: '0.95rem' }}>{route.id}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{route.area}</div>
                    </td>
                    <td style={{ padding: '16px 24px' }}>
                      <div style={{ fontWeight: 600, color: '#475569', fontSize: '0.9rem' }}>{route.bus}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{route.driver}</div>
                    </td>
                    <td style={{ padding: '16px 24px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ flex: 1, height: '6px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden', minWidth: '60px' }}>
                          <div style={{ height: '100%', background: (route.students/route.capacity) > 0.9 ? '#DC2626' : '#16A34A', width: `${(route.students/route.capacity)*100}%` }}></div>
                        </div>
                        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-main)' }}>{route.students}/{route.capacity}</span>
                      </div>
                    </td>
                    <td style={{ padding: '16px 24px', textAlign: 'center' }}>
                      <span style={{ 
                        padding: '6px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700, 
                        backgroundColor: route.status === 'On Time' ? 'rgba(22, 163, 74,0.1)' : route.status === 'Completed' ? 'rgba(148,163,184,0.1)' : 'rgba(245,158,11,0.1)', 
                        color: route.status === 'On Time' ? '#16A34A' : route.status === 'Completed' ? '#64748b' : '#d97706' 
                      }}>
                        {route.status}
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
      <div className="right-column" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* Fleet Activity */}
        <div className="card">
          <div className="card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Clock size={20} color="#4F46E5" />
              <div className="card-title">Daily Fleet Activity</div>
            </div>
          </div>
          <div style={{ height: '220px', marginTop: '16px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={fleetStatusData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorActive" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#4F46E5" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} />
                <Tooltip />
                <Area type="monotone" dataKey="active" name="Active Buses" stroke="#4F46E5" strokeWidth={3} fillOpacity={1} fill="url(#colorActive)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Maintenance Alerts */}
        <div className="card" style={{ flex: 1 }}>
          <div className="card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Wrench size={20} color="#DC2626" />
              <div className="card-title">Maintenance Alerts</div>
            </div>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '12px' }}>
            {maintenanceAlerts.map((alert, i) => (
              <div key={i} className="hover-lift" style={{ 
                padding: '16px', 
                background: alert.urgency === 'High' ? 'rgba(220, 38, 38,0.05)' : 'rgba(245,158,11,0.05)', 
                border: alert.urgency === 'High' ? '1px solid rgba(220, 38, 38,0.2)' : '1px solid rgba(245,158,11,0.2)', 
                borderRadius: '12px', 
                display: 'flex', 
                justifyContent: 'space-between',
                alignItems: 'center',
                cursor: 'pointer'
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <div style={{ fontWeight: 700, color: '#1e293b', fontSize: '0.95rem' }}>{alert.bus}</div>
                    <div style={{ padding: '2px 6px', background: alert.urgency === 'High' ? '#DC2626' : '#F59E0B', color: 'white', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase' }}>{alert.urgency}</div>
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>{alert.issue}</div>
                </div>
                <div style={{ textAlign: 'right', fontSize: '0.8rem', fontWeight: 600, color: alert.urgency === 'High' ? '#DC2626' : '#d97706' }}>
                  {alert.days}
                </div>
              </div>
            ))}
          </div>
          
          <button className="hover-lift" style={{ width: '100%', marginTop: 'auto', padding: '12px', background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', fontWeight: 600, color: '#4F46E5', cursor: 'pointer' }}>
            View Full Service Log
          </button>
        </div>

      </div>
    </div>
  );
};

export default TransportDashboard;
