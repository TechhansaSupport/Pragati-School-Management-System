import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';
import { Server, Users, ShieldAlert, Database, MoreVertical, Activity, HardDrive, ShieldCheck } from 'lucide-react';

const systemUsageData = [
  { time: '08:00', cpu: 20, memory: 45 },
  { time: '10:00', cpu: 65, memory: 55 },
  { time: '12:00', cpu: 85, memory: 70 },
  { time: '14:00', cpu: 50, memory: 60 },
  { time: '16:00', cpu: 30, memory: 50 },
  { time: '18:00', cpu: 15, memory: 40 },
];

const userRoleDistribution = [
  { name: 'Students', value: 3452, color: '#4F46E5' },
  { name: 'Parents', value: 2890, color: '#60A5FA' },
  { name: 'Teachers', value: 145, color: '#0F766E' },
  { name: 'Admin/Staff', value: 32, color: '#F59E0B' },
];

const recentAuditLogs = [
  { id: 1, action: 'User Role Updated', user: 'Admin (ADM001)', target: 'TCH045', time: '10 mins ago', status: 'Success', color: '#16A34A' },
  { id: 2, action: 'Failed Login Attempt', user: 'Unknown IP', target: 'PRIN001', time: '25 mins ago', status: 'Warning', color: '#F59E0B' },
  { id: 3, action: 'System Backup Completed', user: 'System', target: 'Database', time: '2 hours ago', status: 'Success', color: '#16A34A' },
  { id: 4, action: 'API Key Rotated', user: 'Super Admin (SUP001)', target: 'Payment Gateway', time: '5 hours ago', status: 'Success', color: '#16A34A' },
  { id: 5, action: 'Multiple Failed Logins', user: 'IP 192.168.1.45', target: 'System', time: '1 day ago', status: 'Blocked', color: '#0F766E' },
];

const SuperAdminDashboard = () => {
  return (
    <div className="dashboard-grid">
      {/* LEFT COLUMN */}
      <div className="left-column">
        {/* KPI Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(79,70,229,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Users size={20} color="#4F46E5" />
              </div>
              <div style={{ fontSize: '0.8rem', color: '#16A34A', fontWeight: 600 }}>+12 Today</div>
            </div>
            <div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-primary)' }}>6,519</div>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Active Users</div>
            </div>
          </div>

          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(96,165,250,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Server size={20} color="#60A5FA" />
              </div>
              <div style={{ fontSize: '0.8rem', color: '#16A34A', fontWeight: 600 }}>99.99%</div>
            </div>
            <div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-primary)' }}>45 Days</div>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Server Uptime</div>
            </div>
          </div>

          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(15, 118, 110,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Database size={20} color="#0F766E" />
              </div>
              <div style={{ fontSize: '0.8rem', color: '#F59E0B', fontWeight: 600 }}>78% Used</div>
            </div>
            <div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-primary)' }}>450 GB</div>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Database Storage</div>
            </div>
          </div>

          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(245,158,11,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ShieldAlert size={20} color="#F59E0B" />
              </div>
              <div style={{ fontSize: '0.8rem', color: '#0F766E', fontWeight: 600 }}>Action Req.</div>
            </div>
            <div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-primary)' }}>12</div>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Security Alerts</div>
            </div>
          </div>

        </div>

        {/* System Resource Usage (CPU/Memory) */}
        <div className="card" style={{ marginBottom: '24px' }}>
          <div className="card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Activity size={20} color="#4F46E5" />
              <div className="card-title">System Resource Utilization</div>
            </div>
            <div style={{ display: 'flex', gap: '16px', fontSize: '0.8rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-text-muted)' }}><div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#4F46E5' }}></div> CPU Load</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-text-muted)' }}><div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#60A5FA' }}></div> Memory</div>
            </div>
          </div>
          <div style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={systemUsageData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#4F46E5" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorMem" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#60A5FA" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#60A5FA" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} tickFormatter={(val) => `${val}%`} domain={[0, 100]} />
                <Tooltip />
                <Area type="monotone" dataKey="cpu" stroke="#4F46E5" strokeWidth={2} fillOpacity={1} fill="url(#colorCpu)" />
                <Area type="monotone" dataKey="memory" stroke="#60A5FA" strokeWidth={2} fillOpacity={1} fill="url(#colorMem)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* RIGHT COLUMN */}
      <div className="right-column" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* User Role Distribution */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">User Role Distribution</div>
            <MoreVertical size={20} className="text-muted" style={{cursor: 'pointer'}} />
          </div>
          <div style={{ height: '220px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={userRoleDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {userRoleDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'center', marginTop: '8px' }}>
            {userRoleDistribution.map((entry, index) => (
              <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: entry.color }}></div>
                {entry.name}
              </div>
            ))}
          </div>
        </div>

        {/* System Audit Logs */}
        <div className="card" style={{ flex: 1 }}>
          <div className="card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldCheck size={20} color="#16A34A" />
              <div className="card-title">System Audit Logs</div>
            </div>
            <div style={{ fontSize: '0.8rem', color: '#4F46E5', cursor: 'pointer', fontWeight: 600 }}>View All</div>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {recentAuditLogs.map(log => (
              <div key={log.id} style={{ display: 'flex', flexDirection: 'column', gap: '6px', padding: '12px', background: 'rgba(248, 250, 252, 0.5)', borderRadius: '12px', borderLeft: `3px solid ${log.color}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontWeight: 600, color: 'var(--color-text-main)', fontSize: '0.9rem' }}>{log.action}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{log.time}</div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>User: {log.user} • Target: {log.target}</div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: log.color }}>{log.status}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default SuperAdminDashboard;
