import React, { useState } from 'react';
import { Map, MapPin, Search, Plus, Navigation, Users, Clock, AlertCircle } from 'lucide-react';

const mockRoutes = [
  { id: 'RT-01', name: 'Andheri West Express', start: 'Lokhandwala', end: 'School Campus', stops: 8, bus: 'MH-04-1234', driver: 'Ramesh Singh', time: '06:45 AM - 07:30 AM', students: 42, distance: '12 km' },
  { id: 'RT-02', name: 'Bandra East Route', start: 'BKC', end: 'School Campus', stops: 6, bus: 'MH-04-5678', driver: 'Suresh Kumar', time: '06:30 AM - 07:30 AM', students: 38, distance: '15 km' },
  { id: 'RT-03', name: 'Borivali North Line', start: 'IC Colony', end: 'School Campus', stops: 12, bus: 'MH-04-9012', driver: 'Kishore M.', time: '06:15 AM - 07:30 AM', students: 45, distance: '18 km' },
  { id: 'RT-04', name: 'Goregaon Central', start: 'Goregaon Station', end: 'School Campus', stops: 5, bus: 'MH-04-3456', driver: 'Vinod Patil', time: '06:50 AM - 07:25 AM', students: 28, distance: '8 km' },
  { id: 'RT-05', name: 'Juhu Circle Bus', start: 'Juhu Beach', end: 'School Campus', stops: 7, bus: 'MH-04-7777', driver: 'Rajesh Sharma', time: '06:40 AM - 07:20 AM', students: 35, distance: '10 km' },
];

const TransportRoutes = () => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredRoutes = mockRoutes.filter(route => 
    route.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    route.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    route.start.toLowerCase().includes(searchQuery.toLowerCase())
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
          <p style={{ opacity: 0.9, fontSize: '0.95rem', margin: 0 }}>Configure bus routes, manage pick-up points, and optimize path mapping.</p>
        </div>
        <div style={{ display: 'flex', gap: '16px' }}>
          <button className="hover-lift" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 20px', background: 'white', border: 'none', borderRadius: '12px', color: '#059669', fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
            <Plus size={20} /> Create New Route
          </button>
        </div>
      </div>

      <div className="left-column" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Active Route Metrics */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          {[
            { label: 'Active Routes', value: '15', icon: Navigation, color: '#4F46E5', bg: 'rgba(79,70,229,0.1)' },
            { label: 'Total Stops', value: '124', icon: MapPin, color: '#16A34A', bg: 'rgba(22, 163, 74,0.1)' },
            { label: 'Students Mapped', value: '640', icon: Users, color: '#60A5FA', bg: 'rgba(96,165,250,0.1)' },
            { label: 'Optimization Needed', value: '2', icon: AlertCircle, color: '#F59E0B', bg: 'rgba(245, 158, 11,0.1)' }
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
            <div className="card-title">Configured Routes</div>
            <div className="table-search" style={{ margin: 0, background: 'rgba(248,250,252,0.8)', border: '1px solid rgba(226,232,240,0.8)', borderRadius: '12px' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '10px', color: '#64748B' }} />
              <input 
                type="text" 
                placeholder="Search route name, ID..." 
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
                  <th style={{ padding: '12px 24px', textAlign: 'right', fontSize: '0.75rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredRoutes.map((route, i) => (
                  <tr key={i} className="table-row-hover" style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td style={{ padding: '16px 24px' }}>
                      <div style={{ fontWeight: 700, color: '#1e293b' }}>{route.id}</div>
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
                          <Clock size={14} color="#6366f1" /> {route.time}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: '#475569' }}>
                          <MapPin size={14} color="#10b981" /> {route.stops} Stops ({route.distance})
                        </div>
                      </div>
                      <div style={{ marginTop: '8px', fontSize: '0.8rem', color: '#64748b' }}>
                        Bus: <strong>{route.bus}</strong> • Driver: {route.driver}
                      </div>
                    </td>
                    <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                      <button className="btn-outline" style={{ fontSize: '0.75rem', padding: '6px 12px' }}>Edit Route</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
      {/* RIGHT COLUMN - MAP VISUALIZATION */}
      <div className="right-column">
        <div className="card" style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>
          <div className="card-header" style={{ padding: '24px 24px 16px 24px', borderBottom: '1px solid var(--color-border)' }}>
            <div className="card-title">Live Map View</div>
            <div className="badge" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10B981' }}>Live Tracking Active</div>
          </div>
          <div style={{ flex: 1, background: '#f1f5f9', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {/* Map Placeholder Vector */}
            <div style={{ position: 'absolute', inset: 0, opacity: 0.5, backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
            
            <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}>
                <Map size={32} color="#059669" />
              </div>
              <div style={{ fontWeight: 600, color: '#334155' }}>Interactive Map Integration</div>
              <div style={{ fontSize: '0.85rem', color: '#64748b', textAlign: 'center', maxWidth: '250px' }}>Connect with Google Maps API or Mapbox to visualize live bus locations and routes here.</div>
            </div>

            {/* Faux Route Path visual overlay */}
            <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
              <path d="M 50 150 Q 150 50 250 150 T 400 150" fill="none" stroke="#10B981" strokeWidth="4" strokeDasharray="8 8" opacity="0.4" />
              <circle cx="50" cy="150" r="6" fill="#10B981" />
              <circle cx="250" cy="150" r="6" fill="#10B981" />
              <circle cx="400" cy="150" r="8" fill="#EF4444" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransportRoutes;
