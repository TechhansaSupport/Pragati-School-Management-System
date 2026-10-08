import React from 'react';
import { User, CreditCard, Activity, Calendar, Bell, ChevronRight, FileText, CheckCircle, AlertTriangle } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const academicTrend = [
  { term: 'Unit Test 1', score: 72 },
  { term: 'Mid Term', score: 78 },
  { term: 'Unit Test 2', score: 75 },
  { term: 'Finals (Proj)', score: 85 },
];

const ParentDashboard = () => {
  return (
    <div className="dashboard-grid">
      {/* Top Banner - Glassmorphism */}
      <div style={{
        gridColumn: '1 / -1',
        background: 'linear-gradient(135deg, rgba(22, 163, 74,0.9) 0%, rgba(79,70,229,0.9) 100%)',
        borderRadius: '16px',
        padding: '24px 32px',
        color: 'white',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 10px 25px -5px rgba(22, 163, 74, 0.4)'
      }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, margin: '0 0 8px 0' }}>Welcome, Mr. Sharma! 👨‍👩‍👦</h2>
          <p style={{ opacity: 0.9, fontSize: '0.95rem', margin: 0 }}>Here is the latest update on Rahul's academic progress and school activities.</p>
        </div>
        <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>Rahul Sharma</div>
            <div style={{ fontSize: '0.9rem', fontWeight: 600, opacity: 0.9 }}>10th Grade - Sec A</div>
          </div>
          <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <User size={24} color="#16A34A" />
          </div>
        </div>
      </div>

      {/* LEFT COLUMN */}
      <div className="left-column">
        {/* KPI Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          {[
            { label: 'Attendance', value: '92%', icon: Activity, color: '#4F46E5', bg: 'rgba(79,70,229,0.1)' },
            { label: 'Avg Grade', value: 'A-', icon: CheckCircle, color: '#16A34A', bg: 'rgba(22, 163, 74,0.1)' },
            { label: 'Upcoming Event', value: 'Annual Day', icon: Calendar, color: '#60A5FA', bg: 'rgba(96,165,250,0.1)' },
            { label: 'Fees Due', value: '₹2,500', icon: CreditCard, color: '#0F766E', bg: 'rgba(15, 118, 110,0.1)' }
          ].map((kpi, i) => (
            <div key={i} className="card hover-lift" style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '16px', transition: 'all 0.3s' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: kpi.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <kpi.icon size={20} color={kpi.color} />
                </div>
              </div>
              <div>
                <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--color-primary)' }}>{kpi.value}</div>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>{kpi.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Academic Progress */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">Rahul's Academic Progress</div>
            <div style={{ fontSize: '0.85rem', color: '#16A34A', fontWeight: 600, cursor: 'pointer' }}>View Detailed Report</div>
          </div>
          <div style={{ height: '240px', marginTop: '16px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={academicTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="term" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} domain={[60, 100]} />
                <Tooltip cursor={{ stroke: 'rgba(226,232,240,0.8)', strokeWidth: 2 }} />
                <Line type="monotone" dataKey="score" stroke="#16A34A" strokeWidth={3} dot={{ r: 6, fill: '#16A34A', stroke: 'white', strokeWidth: 2 }} activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* RIGHT COLUMN */}
      <div className="right-column" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* Fee Summary */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">Fee Summary</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', cursor: 'pointer' }}>History</div>
          </div>
          
          <div style={{ 
            padding: '24px', 
            background: 'linear-gradient(135deg, rgba(15, 118, 110,0.05) 0%, rgba(15, 118, 110,0.15) 100%)', 
            borderRadius: '16px', 
            border: '1px solid rgba(15, 118, 110,0.2)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            marginBottom: '16px'
          }}>
            <div style={{ fontSize: '0.85rem', color: '#0F766E', fontWeight: 700, letterSpacing: '1px', marginBottom: '8px' }}>DUE BY OCT 15, 2023</div>
            <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#1e293b', marginBottom: '8px' }}>₹2,500</div>
            <div style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', marginBottom: '24px' }}>Term 2 Tuition Fee</div>
            
            <button className="hover-lift" style={{ 
              width: '100%', padding: '16px', 
              background: 'linear-gradient(135deg, #0F766E 0%, #f43f5e 100%)', 
              color: 'white', border: 'none', borderRadius: '12px', 
              fontSize: '1rem', fontWeight: 700, cursor: 'pointer',
              boxShadow: '0 10px 20px -5px rgba(15, 118, 110,0.4)',
              transition: 'all 0.3s'
            }}>
              Pay Now Securely
            </button>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 8px', borderBottom: '1px solid var(--color-border)', fontSize: '0.9rem' }}>
            <span style={{ color: 'var(--color-text-muted)' }}>Last Payment (Sep 1)</span>
            <span style={{ fontWeight: 600, color: '#16A34A' }}>₹2,500 Paid</span>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="card" style={{ flex: 1 }}>
          <div className="card-header">
            <div className="card-title">Recent Activity</div>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            <div style={{ display: 'flex', gap: '16px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(22, 163, 74,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <FileText size={18} color="#16A34A" />
              </div>
              <div style={{ flex: 1, paddingBottom: '16px', borderBottom: '1px solid var(--color-border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <div style={{ fontWeight: 600, fontSize: '0.95rem', color: '#1e293b' }}>Math Mid-Term Result</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>2d ago</div>
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Rahul scored <span style={{ fontWeight: 700, color: '#16A34A' }}>85/100 (A Grade)</span> in Mathematics.</div>
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '16px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(245,158,11,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <AlertTriangle size={18} color="#F59E0B" />
              </div>
              <div style={{ flex: 1, paddingBottom: '16px', borderBottom: '1px solid var(--color-border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <div style={{ fontWeight: 600, fontSize: '0.95rem', color: '#1e293b' }}>Absent Alert</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Oct 4</div>
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Rahul was marked absent for the day. Please submit a leave application if required.</div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '16px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(79,70,229,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Calendar size={18} color="#4F46E5" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <div style={{ fontWeight: 600, fontSize: '0.95rem', color: '#1e293b' }}>Annual Sports Day</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Oct 1</div>
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Don't forget to sign the permission slip for Rahul's track events.</div>
              </div>
            </div>
            
          </div>
        </div>

      </div>
    </div>
  );
};

export default ParentDashboard;
