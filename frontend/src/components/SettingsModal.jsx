import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { User, Settings, HelpCircle, X, Shield, Bell, Key, CreditCard } from 'lucide-react';

const SettingsModal = ({ isOpen, onClose, initialTab = 'profile', userInfo, role }) => {
  const [activeTab, setActiveTab] = useState(initialTab);

  if (!isOpen) return null;

  return createPortal(
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(15, 23, 42, 0.6)',
      backdropFilter: 'blur(8px)',
      zIndex: 99999, // Ensure it's on top of everything
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      animation: 'fade-in 0.2s ease-out'
    }}>
      <div style={{
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(20px)',
        width: '900px',
        maxWidth: '95vw',
        height: '600px',
        maxHeight: '90vh',
        borderRadius: '24px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        display: 'flex',
        overflow: 'hidden',
        border: '1px solid rgba(226, 232, 240, 0.8)',
        animation: 'slide-up-fade 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
      }}>
        
        {/* Sidebar */}
        <div style={{
          width: '240px',
          background: 'rgba(248, 250, 252, 0.8)',
          borderRight: '1px solid rgba(226, 232, 240, 0.8)',
          padding: '32px 16px',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1e3a8a', marginBottom: '32px', paddingLeft: '12px' }}>
            Settings
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {[
              { id: 'profile', label: 'My Profile', icon: User },
              { id: 'account', label: 'Account Settings', icon: Settings },
              { id: 'security', label: 'Security', icon: Shield },
              { id: 'notifications', label: 'Notifications', icon: Bell },
              { id: 'billing', label: 'Billing & Plans', icon: CreditCard },
              { id: 'help', label: 'Help & Support', icon: HelpCircle },
            ].map(tab => (
              <div 
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '12px',
                  padding: '12px', borderRadius: '12px',
                  cursor: 'pointer',
                  background: activeTab === tab.id ? 'white' : 'transparent',
                  boxShadow: activeTab === tab.id ? '0 4px 12px rgba(0,0,0,0.05)' : 'none',
                  color: activeTab === tab.id ? '#4F46E5' : '#64748b',
                  fontWeight: activeTab === tab.id ? 600 : 500,
                  transition: 'all 0.2s'
                }}
              >
                <tab.icon size={18} />
                <span style={{ fontSize: '0.9rem' }}>{tab.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Content Area */}
        <div style={{ flex: 1, padding: '40px', overflowY: 'auto', position: 'relative' }}>
          <button 
            onClick={onClose}
            style={{
              position: 'absolute', top: '24px', right: '24px',
              background: 'rgba(241, 245, 249, 0.8)', border: 'none',
              width: '36px', height: '36px', borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: '#64748b', transition: 'all 0.2s'
            }}
            onMouseOver={e => { e.currentTarget.style.background = '#e2e8f0'; e.currentTarget.style.color = '#0f172a'; }}
            onMouseOut={e => { e.currentTarget.style.background = 'rgba(241, 245, 249, 0.8)'; e.currentTarget.style.color = '#64748b'; }}
          >
            <X size={18} />
          </button>

          {activeTab === 'profile' && (
            <div className="animate-fade-in">
              <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1e3a8a', marginBottom: '8px' }}>My Profile</h3>
              <p style={{ color: '#64748b', marginBottom: '32px' }}>Manage your personal information and public profile.</p>

              <div style={{ display: 'flex', gap: '32px', marginBottom: '40px' }}>
                <div style={{ width: '100px', height: '100px', borderRadius: '50%', border: '4px solid white', boxShadow: '0 4px 15px rgba(0,0,0,0.1)', overflow: 'hidden', flexShrink: 0 }}>
                  <img src={`https://ui-avatars.com/api/?name=${userInfo.uniqueId || role}&background=e0e7ff&color=3730a3&bold=true&size=100`} alt="Avatar" style={{ width: '100%', height: '100%' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <button style={{ padding: '8px 16px', background: 'white', border: '1px solid #cbd5e1', borderRadius: '8px', fontWeight: 600, color: '#334155', cursor: 'pointer', marginRight: '12px' }}>Upload New Picture</button>
                  <button style={{ padding: '8px 16px', background: 'transparent', border: 'none', fontWeight: 600, color: '#DC2626', cursor: 'pointer' }}>Delete</button>
                  <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '12px' }}>JPG, GIF or PNG. Max size of 800K.</p>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '8px' }}>Full Name</label>
                  <input type="text" defaultValue={userInfo.name || "Pragati Administrator"} style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f8fafc', fontSize: '0.95rem' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '8px' }}>Role / Designation</label>
                  <input type="text" disabled defaultValue={(role.charAt(0).toUpperCase() + role.slice(1)) + " Account"} style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#f1f5f9', fontSize: '0.95rem', color: '#64748b', cursor: 'not-allowed' }} />
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '8px' }}>Email Address</label>
                  <input type="email" defaultValue={`${role}@pragatischool.edu`} style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f8fafc', fontSize: '0.95rem' }} />
                </div>
              </div>

              <div style={{ marginTop: '40px', display: 'flex', justifyContent: 'flex-end', gap: '16px' }}>
                <button onClick={onClose} style={{ padding: '10px 20px', background: 'white', border: '1px solid #cbd5e1', borderRadius: '8px', fontWeight: 600, color: '#334155', cursor: 'pointer' }}>Cancel</button>
                <button style={{ padding: '10px 24px', background: '#4F46E5', border: 'none', borderRadius: '8px', fontWeight: 600, color: 'white', cursor: 'pointer', boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)' }}>Save Changes</button>
              </div>
            </div>
          )}

          {activeTab === 'account' && (
            <div className="animate-fade-in">
              <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1e3a8a', marginBottom: '8px' }}>Account Settings</h3>
              <p style={{ color: '#64748b', marginBottom: '32px' }}>Update your system preferences and regional settings.</p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '8px' }}>Language</label>
                  <select style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f8fafc', fontSize: '0.95rem', outline: 'none' }}>
                    <option>English (United States)</option>
                    <option>English (United Kingdom)</option>
                    <option>Hindi (भारत)</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '8px' }}>Timezone</label>
                  <select style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f8fafc', fontSize: '0.95rem', outline: 'none' }}>
                    <option>(GMT+05:30) Chennai, Kolkata, Mumbai, New Delhi</option>
                    <option>(GMT+00:00) Universal Time Coordinated</option>
                  </select>
                </div>
                
                <div style={{ marginTop: '24px', padding: '24px', border: '1px solid #fecaca', borderRadius: '12px', background: '#fef2f2' }}>
                  <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#b91c1c', margin: '0 0 8px 0' }}>Danger Zone</h4>
                  <p style={{ fontSize: '0.85rem', color: '#991b1b', marginBottom: '16px' }}>Permanently deactivate your account and wipe all personal data. This action cannot be undone.</p>
                  <button style={{ padding: '8px 16px', background: '#dc2626', border: 'none', borderRadius: '6px', fontWeight: 600, color: 'white', cursor: 'pointer' }}>Deactivate Account</button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'help' && (
            <div className="animate-fade-in">
              <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1e3a8a', marginBottom: '8px' }}>Help & Support</h3>
              <p style={{ color: '#64748b', marginBottom: '32px' }}>Get assistance with using the Pragati Management System.</p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '32px' }}>
                <div style={{ padding: '24px', border: '1px solid #e2e8f0', borderRadius: '16px', background: 'white', cursor: 'pointer', transition: 'all 0.2s' }} onMouseOver={e=>e.currentTarget.style.borderColor='#4F46E5'} onMouseOut={e=>e.currentTarget.style.borderColor='#e2e8f0'}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                    <HelpCircle size={20} color="#4F46E5" />
                  </div>
                  <h4 style={{ margin: '0 0 8px 0', fontSize: '1.05rem', color: '#1e3a8a' }}>Knowledge Base</h4>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>Browse articles, tutorials, and FAQs to learn how to use the system.</p>
                </div>
                <div style={{ padding: '24px', border: '1px solid #e2e8f0', borderRadius: '16px', background: 'white', cursor: 'pointer', transition: 'all 0.2s' }} onMouseOver={e=>e.currentTarget.style.borderColor='#4F46E5'} onMouseOut={e=>e.currentTarget.style.borderColor='#e2e8f0'}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                    <User size={20} color="#4F46E5" />
                  </div>
                  <h4 style={{ margin: '0 0 8px 0', fontSize: '1.05rem', color: '#1e3a8a' }}>Contact Support</h4>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>Open a ticket with our IT support team for technical issues.</p>
                </div>
              </div>

              <div style={{ padding: '24px', background: '#f8fafc', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                <h4 style={{ margin: '0 0 16px 0', fontSize: '1rem', color: '#1e3a8a' }}>System Information</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.85rem', color: '#475569' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Version:</span> <span style={{ fontWeight: 600 }}>v2.4.1 (Stable)</span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Environment:</span> <span style={{ fontWeight: 600 }}>Production</span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Last Updated:</span> <span style={{ fontWeight: 600 }}>Today, 09:41 AM</span></div>
                </div>
              </div>
            </div>
          )}

          {/* Placeholders for other tabs */}
          {['security', 'notifications', 'billing'].includes(activeTab) && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', opacity: 0.5 }}>
              <Settings size={48} color="#94a3b8" style={{ marginBottom: '16px' }} />
              <h3 style={{ margin: 0, color: '#475569' }}>Coming Soon</h3>
              <p style={{ fontSize: '0.9rem', color: '#64748b' }}>This section is currently under development.</p>
            </div>
          )}

        </div>
      </div>
      <style>{`
        @keyframes slide-up-fade {
          from { opacity: 0; transform: translateY(20px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
    </div>,
    document.body
  );
};

export default SettingsModal;
