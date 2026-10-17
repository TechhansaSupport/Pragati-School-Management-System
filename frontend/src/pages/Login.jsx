import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  PieChart, ShieldCheck, BellRing, MessageCircle, CheckCircle, 
  TrendingUp, Star, Layers, Settings, Fingerprint, AlertTriangle, 
  Ban, AlertCircle, Building2
} from 'lucide-react';

const Login = () => {
  const { tenantSlug } = useParams();
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const [displaySchoolName, setDisplaySchoolName] = useState('');
  const [schoolStatus, setSchoolStatus] = useState({
    isLoading: true,
    isValid: true,
    isSuspended: false,
    isDeleted: false,
    isUnlicensed: false,
    isInactive: false,
    title: '',
    message: '',
    schoolName: ''
  });
  const navigate = useNavigate();

  useEffect(() => {
    if (!tenantSlug) {
      setSchoolStatus({
        isLoading: false,
        isValid: true,
        isSuspended: false,
        isDeleted: false,
        isUnlicensed: false,
        isInactive: false,
        title: '',
        message: '',
        schoolName: 'Pragati Central Portal'
      });
      setDisplaySchoolName('Pragati Central Portal');
      document.title = 'Pragati Multi-School Portal | Universal Login';
      return;
    }

    setSchoolStatus(prev => ({ ...prev, isLoading: true }));

    fetch(`http://localhost:5000/api/school/public/${tenantSlug}`)
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (res.ok && data?.success) {
          const schoolName = data?.school?.name || 'Pragati School';
          setDisplaySchoolName(schoolName);
          document.title = `${schoolName} | Portal Login`;
          setSchoolStatus({
            isLoading: false,
            isValid: true,
            isSuspended: false,
            isDeleted: false,
            isUnlicensed: false,
            isInactive: false,
            title: '',
            message: '',
            schoolName
          });
        } else {
          // Failure: Suspended, deleted, unlicensed, or inactive
          setDisplaySchoolName(''); // NEVER show school name as active when license is invalid!
          
          if (res.status === 403 && (data?.code === 'TENANT_SUSPENDED' || data?.status === 'suspended')) {
            document.title = 'Account Suspended | Pragati Portal';
            setSchoolStatus({
              isLoading: false,
              isValid: false,
              isSuspended: true,
              isDeleted: false,
              isUnlicensed: false,
              isInactive: false,
              title: 'School Workspace Suspended',
              message: data.error || 'This school management workspace has been suspended or revoked in the Pragati License Portal. Portal access and logins are currently disabled.',
              schoolName: data.schoolName || ''
            });
          } else if (res.status === 403 && (data?.code === 'NO_SHMS_LICENSE' || data?.code === 'NO_SMS_LICENSE' || data?.status === 'unlicensed')) {
            document.title = 'License Inactive | Pragati Portal';
            setSchoolStatus({
              isLoading: false,
              isValid: false,
              isSuspended: false,
              isDeleted: false,
              isUnlicensed: true,
              isInactive: false,
              title: 'SHMS Subscription Required',
              message: data.error || 'This organization does not have an active School Management System (SHMS) subscription in the Pragati License Portal.',
              schoolName: ''
            });
          } else if (res.status === 403 && (data?.code === 'TENANT_INACTIVE' || data?.status === 'inactive')) {
            document.title = 'Campus Inactive | Pragati Portal';
            setSchoolStatus({
              isLoading: false,
              isValid: false,
              isSuspended: false,
              isDeleted: false,
              isUnlicensed: false,
              isInactive: true,
              title: 'School Campus Inactive',
              message: data.error || 'This school campus is currently marked as inactive by administration.',
              schoolName: ''
            });
          } else {
            // 404 or any other deletion / not found
            document.title = 'School Not Found | Pragati Portal';
            setSchoolStatus({
              isLoading: false,
              isValid: false,
              isSuspended: false,
              isDeleted: true,
              isUnlicensed: false,
              isInactive: false,
              title: 'School Workspace Not Found',
              message: data.error || `School workspace "${tenantSlug}" does not exist or has been deleted from the Pragati License Portal.`,
              schoolName: ''
            });
          }
        }
      })
      .catch(() => {
        setDisplaySchoolName('');
        setSchoolStatus({
          isLoading: false,
          isValid: false,
          isSuspended: false,
          isDeleted: false,
          isUnlicensed: false,
          isInactive: false,
          title: 'Unable to Connect',
          message: 'Could not connect to the school verification service. Please verify that the server is online.',
          schoolName: ''
        });
      });
  }, [tenantSlug]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    
    if (tenantSlug && !schoolStatus.isValid) {
      setError('This school workspace is currently restricted or suspended.');
      return;
    }

    setIsSubmitting(true);
    
    // Add a slight artificial delay to show the nice loading animation
    await new Promise(resolve => setTimeout(resolve, 600));
    
    try {
      const loginSlug = tenantSlug || 'universal';
      // Connect to the backend
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ slug: loginSlug, tenantSlug: loginSlug, username: userId, uniqueId: userId, password }),
      });

      const data = await response.json();

      if (response.ok) {
        const effectiveSlug = data.tenantSlug || data.slug || tenantSlug || 'pragati';
        // Store user info and token
        sessionStorage.setItem('userInfo', JSON.stringify(data));
        sessionStorage.setItem('userRole', data.role);
        sessionStorage.setItem('tenantSlug', effectiveSlug);
        if (data.token) {
          sessionStorage.setItem('token', data.token);
        }
        if (data.schoolName) {
          sessionStorage.setItem('schoolName', data.schoolName);
        }
        // Multi-window synchronization support
        localStorage.setItem('authSession', JSON.stringify({ userInfo: data, userRole: data.role, token: data.token }));
        
        // Route based on role
        if (data.role === 'superadmin') {
          navigate(`/${effectiveSlug}/superadmin`);
        } else if (data.role === 'principal' || data.role === 'admin') {
          navigate(`/${effectiveSlug}/dashboard`);
        } else if (data.role === 'teacher') {
          navigate(`/${effectiveSlug}/teacher-dashboard`);
        } else if (data.role === 'student') {
          navigate(`/${effectiveSlug}/student-dashboard`);
        } else if (data.role === 'parent') {
          navigate(`/${effectiveSlug}/parent-dashboard`);
        } else if (data.role === 'accountant') {
          navigate(`/${effectiveSlug}/finance`);
        } else if (data.role === 'librarian') {
          navigate(`/${effectiveSlug}/library-dashboard`);
        } else if (data.role === 'transport') {
          navigate(`/${effectiveSlug}/transport-dashboard`);
        } else {
          navigate(`/${effectiveSlug}/dashboard`);
        }
      } else {
        if (data.code === 'TENANT_SUSPENDED') {
          setSchoolStatus(prev => ({
            ...prev,
            isValid: false,
            isSuspended: true,
            title: 'School Workspace Suspended',
            message: data.message || data.error
          }));
        } else if (data.code === 'TENANT_NOT_FOUND') {
          setSchoolStatus(prev => ({
            ...prev,
            isValid: false,
            isDeleted: true,
            title: 'School Workspace Not Found',
            message: data.message || data.error
          }));
        } else if (data.code === 'NO_SHMS_LICENSE' || data.code === 'NO_SMS_LICENSE') {
          setSchoolStatus(prev => ({
            ...prev,
            isValid: false,
            isUnlicensed: true,
            title: 'SHMS Subscription Required',
            message: data.message || data.error
          }));
        }
        setError(data.message || data.error || 'Invalid credentials');
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
      overflow: 'hidden',
      backgroundImage: 'url("/Modern Indigo Study Workspace.png")',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat'
    }}>
      {/* Dark overlay for better form readability against the background */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.2)', zIndex: 1 }}></div>
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
            maxWidth: '420px', 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center',
            background: 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(30px)',
            WebkitBackdropFilter: 'blur(30px)',
            padding: '40px 32px',
            borderRadius: '24px',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.18)',
            border: '1px solid rgba(255, 255, 255, 0.9)'
          }}>
          
            {/* Header: Logo and Branding */}
            <div className="stagger-1" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: schoolStatus.isValid ? '20px' : '16px', width: '100%' }}>
              <div style={{ 
                width: '70px', 
                height: '70px', 
                borderRadius: '50%', 
                background: 'white', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                boxShadow: schoolStatus.isSuspended 
                  ? '0 10px 25px -5px rgba(239, 68, 68, 0.3), 0 0 0 3px rgba(254, 202, 202, 0.6)' 
                  : '0 10px 25px -5px rgba(79, 70, 229, 0.2), 0 0 0 3px rgba(255, 255, 255, 0.5)',
                marginBottom: '16px',
                overflow: 'hidden',
                padding: '4px',
                animation: 'pulse-glow 4s infinite ease-in-out'
              }}>
                 <img src="/logo.png" alt="Pragati Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              </div>
              
              {/* System Branding */}
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1e3a8a', margin: '0 0 8px 0', textAlign: 'center', letterSpacing: '-0.02em' }}>
                Pragati School Management System
              </h2>

              {/* Status Badge */}
              {schoolStatus.isValid && displaySchoolName ? (
                <div style={{ 
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '0.82rem', 
                  fontWeight: 700, 
                  color: '#4F46E5',
                  background: 'rgba(79, 70, 229, 0.08)',
                  border: '1px solid rgba(79, 70, 229, 0.22)',
                  padding: '4px 14px',
                  borderRadius: '999px',
                  marginBottom: '16px'
                }}>
                  <span>🏫</span>
                  <span>{displaySchoolName}</span>
                </div>
              ) : schoolStatus.isSuspended ? (
                <div style={{ 
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '0.8rem', 
                  fontWeight: 700, 
                  color: '#dc2626',
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  padding: '4px 14px',
                  borderRadius: '999px',
                  marginBottom: '16px'
                }}>
                  <Ban size={14} color="#dc2626" />
                  <span>Workspace Suspended</span>
                </div>
              ) : schoolStatus.isDeleted ? (
                <div style={{ 
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '0.8rem', 
                  fontWeight: 700, 
                  color: '#e11d48',
                  background: 'rgba(225, 29, 72, 0.1)',
                  border: '1px solid rgba(225, 29, 72, 0.3)',
                  padding: '4px 14px',
                  borderRadius: '999px',
                  marginBottom: '16px'
                }}>
                  <AlertCircle size={14} color="#e11d48" />
                  <span>School Not Found</span>
                </div>
              ) : schoolStatus.isUnlicensed ? (
                <div style={{ 
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '0.8rem', 
                  fontWeight: 700, 
                  color: '#d97706',
                  background: 'rgba(217, 119, 6, 0.1)',
                  border: '1px solid rgba(217, 119, 6, 0.3)',
                  padding: '4px 14px',
                  borderRadius: '999px',
                  marginBottom: '16px'
                }}>
                  <AlertTriangle size={14} color="#d97706" />
                  <span>No SHMS License</span>
                </div>
              ) : null}
            </div>

            {/* Condition 1: Checking License Status */}
            {schoolStatus.isLoading ? (
              <div style={{ padding: '24px 0', textAlign: 'center', width: '100%' }}>
                <div style={{ 
                  width: '32px', 
                  height: '32px', 
                  margin: '0 auto 12px', 
                  borderRadius: '50%', 
                  border: '3px solid rgba(79, 70, 229, 0.2)', 
                  borderTopColor: '#4f46e5', 
                  animation: 'spin 0.8s linear infinite' 
                }} />
                <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
                <p style={{ margin: 0, fontSize: '0.88rem', color: '#64748b', fontWeight: 600 }}>
                  Verifying school workspace & license...
                </p>
              </div>
            ) : !schoolStatus.isValid ? (
              /* Condition 2: Restricted / Suspended / Deleted / Unlicensed View */
              <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <h1 style={{ 
                  textAlign: 'center', 
                  fontSize: '1.35rem', 
                  fontWeight: 800, 
                  marginBottom: '10px', 
                  color: schoolStatus.isSuspended ? '#b91c1c' : '#1e293b', 
                  letterSpacing: '-0.02em' 
                }}>
                  {schoolStatus.title}
                </h1>

                <div style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  backgroundColor: schoolStatus.isSuspended ? '#fef2f2' : (schoolStatus.isUnlicensed ? '#fffbeb' : '#f8fafc'),
                  color: schoolStatus.isSuspended ? '#991b1b' : (schoolStatus.isUnlicensed ? '#92400e' : '#334155'),
                  padding: '16px',
                  borderRadius: '14px',
                  marginBottom: '24px',
                  fontSize: '0.88rem',
                  lineHeight: 1.55,
                  fontWeight: 500,
                  textAlign: 'center',
                  border: schoolStatus.isSuspended ? '1px solid #fecaca' : (schoolStatus.isUnlicensed ? '1px solid #fde68a' : '1px solid #e2e8f0'),
                  boxShadow: '0 4px 12px -2px rgba(0,0,0,0.04)'
                }}>
                  {schoolStatus.message}
                </div>

                <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ textAlign: 'center', fontSize: '0.78rem', color: '#94a3b8', marginTop: '6px' }}>
                    For licensing inquiries, reach out to <span style={{ color: '#4f46e5', fontWeight: 600 }}>support@pragati.edu</span>
                  </div>
                </div>
              </div>
            ) : (
              /* Condition 3: Active School Login Form */
              <>
                <h1 className="stagger-2" style={{ textAlign: 'center', fontSize: '1.45rem', fontWeight: 800, marginBottom: '6px', color: '#1e3a8a', letterSpacing: '-0.03em' }}>
                  Welcome Back
                </h1>
                <p className="stagger-2" style={{ textAlign: 'center', fontSize: '0.85rem', color: '#64748b', margin: '0 0 20px 0', fontWeight: 500 }}>
                  Please enter your details to sign in.
                </p>

                {error && (
                  <div style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#fef2f2', color: '#DC2626', padding: '12px', borderRadius: '12px', marginBottom: '16px', fontSize: '0.88rem', fontWeight: 500, textAlign: 'center', border: '1px solid #fecaca' }}>
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
                      placeholder="School ID / Username"
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
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
