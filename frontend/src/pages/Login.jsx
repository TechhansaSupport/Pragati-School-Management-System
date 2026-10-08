import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PieChart, ShieldCheck, BellRing, MessageCircle, CheckCircle, TrendingUp, Star, Layers, Settings, Fingerprint } from 'lucide-react';

const Login = () => {
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    
    // Add a slight artificial delay to show the nice loading animation
    await new Promise(resolve => setTimeout(resolve, 600));
    
    const idStr = userId.toUpperCase();
    
    // Demo bypass for test IDs
    if (['SUP', 'PRIN', 'ADM', 'TCH', 'STU', 'PAR', 'ACC', 'LIB', 'TRN'].some(prefix => idStr.startsWith(prefix))) {
      let role = 'admin';
      if (idStr.startsWith('SUP')) { role = 'superadmin'; navigate('/dashboard'); }
      else if (idStr.startsWith('PRIN')) { role = 'principal'; navigate('/dashboard'); }
      else if (idStr.startsWith('ADM')) { role = 'admin'; navigate('/dashboard'); }
      else if (idStr.startsWith('TCH')) { role = 'teacher'; navigate('/teacher-dashboard'); }
      else if (idStr.startsWith('STU')) { role = 'student'; navigate('/student-dashboard'); }
      else if (idStr.startsWith('PAR')) { role = 'parent'; navigate('/parent-dashboard'); }
      else if (idStr.startsWith('ACC')) { role = 'accountant'; navigate('/finance'); }
      else if (idStr.startsWith('LIB')) { role = 'librarian'; navigate('/library-dashboard'); }
      else if (idStr.startsWith('TRN')) { role = 'transport'; navigate('/transport-dashboard'); }
      
      sessionStorage.setItem('userRole', role);
      sessionStorage.setItem('userInfo', JSON.stringify({ uniqueId: userId, role }));
      return;
    }
    
    try {
      // Connect to the backend
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ uniqueId: userId, password }),
      });

      const data = await response.json();

      if (response.ok) {
        // Store user info and token
        sessionStorage.setItem('userInfo', JSON.stringify(data));
        sessionStorage.setItem('userRole', data.role);
        
        // Route based on role
        if (data.role === 'principal' || data.role === 'admin' || data.role === 'superadmin') {
          navigate('/dashboard');
        } else if (data.role === 'teacher') {
          navigate('/teacher-dashboard');
        } else if (data.role === 'student') {
          navigate('/student-dashboard');
        } else if (data.role === 'parent') {
          navigate('/parent-dashboard');
        } else if (data.role === 'accountant') {
          navigate('/finance');
        } else if (data.role === 'librarian') {
          navigate('/library-dashboard');
        } else if (data.role === 'transport') {
          navigate('/transport-dashboard');
        } else {
          navigate('/dashboard');
        }
      } else {
        setError(data.message || 'Invalid credentials');
      }
    } catch (err) {
      console.error(err);
      setError('Cannot connect to the backend server.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="app-shell" style={{
      display: 'flex',
      height: '100vh',
      width: '100vw',
      fontFamily: "'Outfit', sans-serif",
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Seamless ambient background identical to dashboard */}
      <div className="ambient-background" style={{ filter: 'blur(4px)' }}></div>
      <style>{`
        @keyframes blob-spin {
          0% { transform: rotate(0deg) scale(1); }
          33% { transform: rotate(120deg) scale(1.1); }
          66% { transform: rotate(240deg) scale(0.9); }
          100% { transform: rotate(360deg) scale(1); }
        }
        @keyframes float-slow {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(-15px, 25px); }
        }
        @keyframes float-fast {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(15px, -20px); }
        }
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 15px 0 rgba(79, 70, 229, 0.3); }
          50% { box-shadow: 0 0 30px 10px rgba(79, 70, 229, 0.6); }
        }
        @keyframes slide-up-fade {
          0% { opacity: 0; transform: translateY(30px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        .animated-blob {
          animation: blob-spin 18s infinite linear;
          transform-origin: center center;
        }
        .animated-orb {
          animation: float-slow 10s infinite ease-in-out;
        }
        .bg-grid {
          background-size: 40px 40px;
          background-image: radial-gradient(circle, rgba(79, 70, 229, 0.12) 1px, transparent 1px);
        }
        .stagger-1 { animation: slide-up-fade 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.1s both; }
        .stagger-2 { animation: slide-up-fade 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.2s both; }
        .stagger-3 { animation: slide-up-fade 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.3s both; }
        .stagger-4 { animation: slide-up-fade 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.4s both; }
        .stagger-5 { animation: slide-up-fade 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.5s both; }
        
        .floating-icon-1 { animation: float-slow 6s infinite ease-in-out; }
        .floating-icon-2 { animation: float-fast 5s infinite ease-in-out; }
        .floating-icon-3 { animation: float-slow 7s infinite ease-in-out reverse; }
        
        .btn-shimmer {
          background: linear-gradient(90deg, #4F46E5 0%, #60A5FA 25%, #0F766E 50%, #60A5FA 75%, #4F46E5 100%);
          background-size: 200% auto;
          transition: 0.5s;
        }
        .btn-shimmer:hover {
          background-position: right center;
          animation: shimmer 3s infinite linear;
        }
      `}</style>
      {/* Floating Elements Container */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 5, pointerEvents: 'none' }}>
        {/* Left Side Icons */}
        <div className="floating-icon-1" style={{ position: 'absolute', top: '15%', left: '10%', animationDelay: '0.2s' }}>
          <div className="glass-card" style={{ padding: '16px', borderRadius: '16px', background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(12px)', boxShadow: '0 12px 40px rgba(0,0,0,0.25), 0 0 20px rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.9)' }}>
            <PieChart size={42} color="#60A5FA" strokeWidth={1.5} />
          </div>
        </div>

        <div className="floating-icon-2" style={{ position: 'absolute', top: '45%', left: '8%', animationDelay: '1.2s' }}>
          <div className="glass-card" style={{ padding: '12px', borderRadius: '12px', background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(12px)', boxShadow: '0 12px 40px rgba(0,0,0,0.25), 0 0 20px rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.9)' }}>
            <CheckCircle size={30} color="#4F46E5" strokeWidth={1.5} />
          </div>
        </div>

        <div className="floating-icon-3" style={{ position: 'absolute', top: '75%', left: '12%', animationDelay: '0.8s' }}>
          <div className="glass-card" style={{ padding: '14px', borderRadius: '14px', background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(12px)', boxShadow: '0 12px 40px rgba(0,0,0,0.25), 0 0 20px rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.9)' }}>
            <Star size={36} color="#8B5CF6" strokeWidth={1.5} />
          </div>
        </div>

        <div className="floating-icon-1" style={{ position: 'absolute', top: '30%', left: '20%', animationDelay: '2s' }}>
          <div className="glass-card" style={{ padding: '12px', borderRadius: '12px', background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(12px)', boxShadow: '0 12px 40px rgba(0,0,0,0.25), 0 0 20px rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.9)' }}>
            <Layers size={28} color="#0EA5E9" strokeWidth={1.5} />
          </div>
        </div>

        <div className="floating-icon-2" style={{ position: 'absolute', top: '60%', left: '22%', animationDelay: '0.9s' }}>
          <div className="glass-card" style={{ padding: '14px', borderRadius: '14px', background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(12px)', boxShadow: '0 12px 40px rgba(0,0,0,0.25), 0 0 20px rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.9)' }}>
            <BellRing size={34} color="#F59E0B" strokeWidth={1.5} />
          </div>
        </div>

        {/* Right Side Icons */}
        <div className="floating-icon-3" style={{ position: 'absolute', top: '18%', right: '12%', animationDelay: '1.5s' }}>
          <div className="glass-card" style={{ padding: '14px', borderRadius: '14px', background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(12px)', boxShadow: '0 12px 40px rgba(0,0,0,0.25), 0 0 20px rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.9)' }}>
            <ShieldCheck size={34} color="#0F766E" strokeWidth={1.5} />
          </div>
        </div>

        <div className="floating-icon-1" style={{ position: 'absolute', top: '48%', right: '8%', animationDelay: '0.5s' }}>
          <div className="glass-card" style={{ padding: '14px', borderRadius: '14px', background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(12px)', boxShadow: '0 12px 40px rgba(0,0,0,0.25), 0 0 20px rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.9)' }}>
            <TrendingUp size={32} color="#f43f5e" strokeWidth={1.5} />
          </div>
        </div>

        <div className="floating-icon-2" style={{ position: 'absolute', top: '78%', right: '15%', animationDelay: '2.5s' }}>
          <div className="glass-card" style={{ padding: '18px', borderRadius: '18px', background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(12px)', boxShadow: '0 12px 40px rgba(0,0,0,0.25), 0 0 20px rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.9)' }}>
            <MessageCircle size={40} color="#16A34A" strokeWidth={1.5} />
          </div>
        </div>

        <div className="floating-icon-3" style={{ position: 'absolute', top: '32%', right: '22%', animationDelay: '1.8s' }}>
          <div className="glass-card" style={{ padding: '14px', borderRadius: '14px', background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(12px)', boxShadow: '0 12px 40px rgba(0,0,0,0.25), 0 0 20px rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.9)' }}>
            <Settings size={32} color="#10B981" strokeWidth={1.5} />
          </div>
        </div>

        <div className="floating-icon-1" style={{ position: 'absolute', top: '62%', right: '20%', animationDelay: '1.1s' }}>
          <div className="glass-card" style={{ padding: '14px', borderRadius: '14px', background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(12px)', boxShadow: '0 12px 40px rgba(0,0,0,0.25), 0 0 20px rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.9)' }}>
            <Fingerprint size={30} color="#F97316" strokeWidth={1.5} />
          </div>
        </div>
      </div>

      {/* Center - Interactive Login Form */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'transparent',
        position: 'relative',
        zIndex: 10
      }}>
        <div style={{ 
          width: '100%', 
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px', 
          position: 'relative', 
          zIndex: 10,
        }}>
          
          {/* Glassmorphism Login Box */}
          <div style={{ 
            width: '100%', 
            maxWidth: '400px', 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center',
            background: 'rgba(255, 255, 255, 0.85)',
            backdropFilter: 'blur(30px)',
            WebkitBackdropFilter: 'blur(30px)',
            padding: '40px 32px',
            borderRadius: '24px',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.15)',
            border: '1px solid rgba(255, 255, 255, 0.9)'
          }}>
          
            <div className="stagger-1" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '24px', width: '100%' }}>
            {/* Dedicated space for the logo - You can replace the inner School icon with an <img src="/your-logo.png" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> */}
            <div style={{ 
              width: '70px', 
              height: '70px', 
              borderRadius: '50%', 
              background: 'white', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              boxShadow: '0 10px 25px -5px rgba(79, 70, 229, 0.2), 0 0 0 3px rgba(255, 255, 255, 0.5)',
              marginBottom: '16px',
              overflow: 'hidden',
              padding: '4px',
              animation: 'pulse-glow 4s infinite ease-in-out'
            }}>
               <img src="/logo.png" alt="Pragati Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </div>
            
            {/* System Branding */}
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#1e3a8a', margin: '0 0 2px 0', textAlign: 'center', letterSpacing: '-0.02em' }}>
              Pragati School
            </h2>
            <div style={{ 
              fontSize: '0.75rem', 
              textTransform: 'uppercase', 
              letterSpacing: '0.1em', 
              fontWeight: 700, 
              textAlign: 'center', 
              marginBottom: '20px',
              background: 'linear-gradient(90deg, #4F46E5 0%, #0F766E 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              opacity: 0.9
            }}>
              Management System
            </div>

            {/* Welcome Message */}
            <h1 className="stagger-2" style={{ textAlign: 'center', fontSize: '1.5rem', fontWeight: 800, marginBottom: '6px', color: '#1e3a8a', letterSpacing: '-0.03em' }}>
              Welcome Back
            </h1>
            <p className="stagger-2" style={{ textAlign: 'center', fontSize: '0.85rem', color: '#64748b', margin: 0, fontWeight: 500 }}>
              Please enter your details to sign in.
            </p>
          </div>

          {error && (
            <div style={{ backgroundColor: '#fef2f2', color: '#DC2626', padding: '14px', borderRadius: '12px', marginBottom: '24px', fontSize: '0.9rem', fontWeight: 500, textAlign: 'center', border: '1px solid #fecaca' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} style={{ width: '100%' }}>
            <div 
              className="stagger-3"
              style={{ 
                marginBottom: '12px', 
                position: 'relative', 
                borderRadius: '8px', 
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)', 
                border: focusedField === 'userId' ? '2px solid rgba(79, 70, 229, 0.8)' : '2px solid rgba(226, 232, 240, 0.6)', 
                backgroundColor: focusedField === 'userId' ? 'rgba(255, 255, 255, 1)' : 'rgba(255, 255, 255, 0.7)',
                backdropFilter: 'blur(10px)',
                boxShadow: focusedField === 'userId' ? '0 6px 16px -4px rgba(79, 70, 229, 0.25)' : 'none',
                transform: focusedField === 'userId' ? 'translateY(-1px)' : 'translateY(0)'
              }}
            >
              <input
                type="text"
                required
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                onFocus={() => setFocusedField('userId')}
                onBlur={() => setFocusedField(null)}
                placeholder="school ID"
                style={{
                  width: '100%',
                  padding: '10px 40px 10px 14px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: 'transparent',
                  fontSize: '0.9rem',
                  outline: 'none',
                  color: '#1e3a8a',
                  boxSizing: 'border-box'
                }}
              />
              <div style={{ position: 'absolute', right: '18px', top: '50%', transform: 'translateY(-50%)', color: focusedField === 'userId' ? '#4F46E5' : '#94a3b8', transition: 'color 0.3s', pointerEvents: 'none' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
              </div>
            </div>

            <div 
              className="stagger-4"
              style={{ 
                marginBottom: '10px', 
                position: 'relative', 
                borderRadius: '8px', 
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)', 
                border: focusedField === 'password' ? '2px solid rgba(79, 70, 229, 0.8)' : '2px solid rgba(226, 232, 240, 0.6)', 
                backgroundColor: focusedField === 'password' ? 'rgba(255, 255, 255, 1)' : 'rgba(255, 255, 255, 0.7)',
                backdropFilter: 'blur(10px)',
                boxShadow: focusedField === 'password' ? '0 6px 16px -4px rgba(79, 70, 229, 0.25)' : 'none',
                transform: focusedField === 'password' ? 'translateY(-1px)' : 'translateY(0)'
              }}
            >
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setFocusedField('password')}
                onBlur={() => setFocusedField(null)}
                placeholder="••••••••"
                style={{
                  width: '100%',
                  padding: '10px 40px 10px 14px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: 'transparent',
                  fontSize: '0.9rem',
                  outline: 'none',
                  color: '#1e3a8a',
                  boxSizing: 'border-box'
                }}
              />
              <div 
                onClick={() => setShowPassword(!showPassword)}
                style={{ position: 'absolute', right: '18px', top: '50%', transform: 'translateY(-50%)', color: showPassword ? '#4F46E5' : (focusedField === 'password' ? '#64748b' : '#94a3b8'), cursor: 'pointer', transition: 'all 0.2s' }} 
                onMouseOver={e => e.currentTarget.style.color = '#4F46E5'} 
                onMouseOut={e => e.currentTarget.style.color = showPassword ? '#4F46E5' : (focusedField === 'password' ? '#64748b' : '#94a3b8')}
              >
                {showPassword ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                )}
              </div>
            </div>

            <div className="stagger-4" style={{ textAlign: 'right', marginBottom: '16px' }}>
              <a href="#" style={{ color: '#0F766E', fontSize: '0.8rem', textDecoration: 'none', fontWeight: 600, transition: 'all 0.3s' }} onMouseOver={e => { e.target.style.color = '#b08b26'; e.target.style.letterSpacing = '0.02em'; }} onMouseOut={e => { e.target.style.color = '#0F766E'; e.target.style.letterSpacing = '0'; }}>Forgot Password?</a>
            </div>

            <div className="stagger-5" style={{ width: '100%' }}>
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-shimmer"
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  color: 'white',
                  border: 'none',
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  cursor: isSubmitting ? 'wait' : 'pointer',
                  transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
                  boxShadow: isSubmitting ? 'none' : '0 4px 12px -3px rgba(15, 118, 110, 0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: isSubmitting ? 0.8 : 1
                }}
                onMouseOver={(e) => {
                  if(!isSubmitting){
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 12px 24px -8px rgba(15, 118, 110, 0.6)';
                  }
                }}
                onMouseOut={(e) => {
                  if(!isSubmitting){
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 8px 20px -6px rgba(15, 118, 110, 0.5)';
                  }
                }}
              >
                {isSubmitting ? (
                  <>
                    <svg className="spinner" viewBox="0 0 50 50" style={{ width: '20px', height: '20px', marginRight: '10px', animation: 'spin 1s linear infinite' }}>
                      <circle cx="25" cy="25" r="20" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" strokeDasharray="31.4 31.4" opacity="0.8"></circle>
                    </svg>
                    <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
                    Signing In...
                  </>
                ) : (
                  'Sign In'
                )}
              </button>
            </div>
          </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
