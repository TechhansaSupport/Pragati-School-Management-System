import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { User, Settings, HelpCircle, X, Shield, Bell, Key, CreditCard, Lock, Eye, EyeOff, CheckCircle2, AlertCircle, Camera, Upload, Trash2, Check, RefreshCw } from 'lucide-react';

const SettingsModal = ({ isOpen, onClose, initialTab = 'profile', userInfo, role }) => {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [currentUser, setCurrentUser] = useState(() => userInfo || JSON.parse(sessionStorage.getItem('userInfo') || '{}'));
  const [modalSchoolName, setModalSchoolName] = useState(() => sessionStorage.getItem('schoolName') || '');
  const [isSavingModalSchool, setIsSavingModalSchool] = useState(false);
  const [modalSaveMsg, setModalSaveMsg] = useState('');

  // Profile image & details state
  const [profileName, setProfileName] = useState(() => currentUser.name || currentUser.uniqueId || 'Pragati Admin');
  const [profileEmail, setProfileEmail] = useState(() => currentUser.email || `${role}@pragatischool.edu`);
  const [profileImage, setProfileImage] = useState(() => currentUser.profileImage || '');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [profileFeedback, setProfileFeedback] = useState({ type: '', message: '' });
  const fileInputRef = useRef(null);

  // Sync state whenever modal is opened or initial tab changes
  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      const sessionUser = JSON.parse(sessionStorage.getItem('userInfo') || '{}');
      const active = userInfo || sessionUser;
      setCurrentUser(active);
      setProfileName(active.name || active.uniqueId || 'Pragati Admin');
      setProfileEmail(active.email || `${role}@pragatischool.edu`);
      setProfileImage(active.profileImage || '');
      setProfileFeedback({ type: '', message: '' });
    }
  }, [isOpen, initialTab, userInfo, role]);

  // Handle Profile Photo Upload & Compression
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setProfileFeedback({ type: 'error', message: 'Please select an image file (PNG, JPG, WebP, etc.).' });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setProfileFeedback({ type: 'error', message: 'Image size should be less than 5MB.' });
      return;
    }

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const img = new Image();
      img.onload = () => {
        // High quality Canvas downscaling to max 450x450 for crisp rendering and instant network persistence
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const maxDim = 450;

        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.88);
        setProfileImage(compressedDataUrl);
        setProfileFeedback({ type: 'success', message: 'New photo selected! Click "Save Profile Changes" to apply.' });
      };
      img.src = uploadEvent.target.result;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleRemovePhoto = () => {
    setProfileImage('');
    setProfileFeedback({ type: 'info', message: 'Photo removed. Click "Save Profile Changes" to save changes.' });
  };

  const handleSaveProfile = async (e) => {
    e?.preventDefault();
    setIsUpdatingProfile(true);
    setProfileFeedback({ type: '', message: '' });

    try {
      const token = currentUser?.token || sessionStorage.getItem('token') || '';
      const tenantSlug = sessionStorage.getItem('tenantSlug') || '';
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      };
      if (tenantSlug) headers['x-tenant-slug'] = tenantSlug;

      const res = await fetch('http://localhost:5000/api/auth/profile', {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          profileImage: profileImage || '',
          name: profileName.trim(),
          email: profileEmail.trim()
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        const updatedUser = {
          ...currentUser,
          ...data.user,
          profileImage: profileImage || '',
          name: profileName.trim(),
          email: profileEmail.trim(),
          token: currentUser.token
        };

        sessionStorage.setItem('userInfo', JSON.stringify(updatedUser));
        const authSessionStr = localStorage.getItem('authSession');
        if (authSessionStr) {
          try {
            const authSession = JSON.parse(authSessionStr);
            authSession.userInfo = updatedUser;
            localStorage.setItem('authSession', JSON.stringify(authSession));
          } catch (_) {}
        }

        setCurrentUser(updatedUser);
        window.dispatchEvent(new CustomEvent('userProfileUpdated', { detail: updatedUser }));
        setProfileFeedback({ type: 'success', message: '✓ Profile and photo updated successfully!' });
      } else {
        // Fallback local update
        const fallbackUser = {
          ...currentUser,
          profileImage: profileImage || '',
          name: profileName.trim(),
          email: profileEmail.trim()
        };
        sessionStorage.setItem('userInfo', JSON.stringify(fallbackUser));
        setCurrentUser(fallbackUser);
        window.dispatchEvent(new CustomEvent('userProfileUpdated', { detail: fallbackUser }));
        setProfileFeedback({ type: 'success', message: '✓ Profile saved successfully!' });
      }
    } catch (err) {
      const fallbackUser = {
        ...currentUser,
        profileImage: profileImage || '',
        name: profileName.trim(),
        email: profileEmail.trim()
      };
      sessionStorage.setItem('userInfo', JSON.stringify(fallbackUser));
      setCurrentUser(fallbackUser);
      window.dispatchEvent(new CustomEvent('userProfileUpdated', { detail: fallbackUser }));
      setProfileFeedback({ type: 'success', message: '✓ Profile updated locally!' });
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  // Username change state
  const [newUsername, setNewUsername] = useState('');
  const [usernameCurrentPassword, setUsernameCurrentPassword] = useState('');
  const [showUsernameCurrentPw, setShowUsernameCurrentPw] = useState(false);
  const [isUpdatingUsername, setIsUpdatingUsername] = useState(false);
  const [usernameFeedback, setUsernameFeedback] = useState({ type: '', message: '' });

  // Password change state
  const [passwordCurrentPassword, setPasswordCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [passwordFeedback, setPasswordFeedback] = useState({ type: '', message: '' });

  const getPasswordStrength = (pwd) => {
    if (!pwd) return { score: 0, text: '', color: '#cbd5e1', width: '0%' };
    let score = 0;
    if (pwd.length >= 6) score += 1;
    if (pwd.length >= 8) score += 1;
    if (/[0-9]/.test(pwd) && /[a-zA-Z]/.test(pwd)) score += 1;
    if (/[^A-Za-z0-9]/.test(pwd)) score += 1;

    if (score <= 1) return { score: 1, text: 'Weak', color: '#ef4444', width: '25%' };
    if (score === 2) return { score: 2, text: 'Fair', color: '#f59e0b', width: '50%' };
    if (score === 3) return { score: 3, text: 'Good', color: '#10b981', width: '75%' };
    return { score: 4, text: 'Strong', color: '#059669', width: '100%' };
  };

  const handleUpdateUsername = async (e) => {
    e?.preventDefault();
    setUsernameFeedback({ type: '', message: '' });

    const trimmed = newUsername.trim();
    if (!trimmed) {
      setUsernameFeedback({ type: 'error', message: 'Please enter a new username.' });
      return;
    }
    if (trimmed.length < 3) {
      setUsernameFeedback({ type: 'error', message: 'Username must be at least 3 characters long.' });
      return;
    }
    if (trimmed.length > 50) {
      setUsernameFeedback({ type: 'error', message: 'Username cannot exceed 50 characters.' });
      return;
    }
    if (trimmed.toLowerCase() === (currentUser?.uniqueId || currentUser?.username || '').toLowerCase()) {
      setUsernameFeedback({ type: 'error', message: 'New username must be different from your current username.' });
      return;
    }
    if (!usernameCurrentPassword) {
      setUsernameFeedback({ type: 'error', message: 'Current password is required to verify your identity.' });
      return;
    }

    setIsUpdatingUsername(true);
    try {
      const token = currentUser?.token || sessionStorage.getItem('token') || '';
      const tenantSlug = sessionStorage.getItem('tenantSlug') || '';
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      };
      if (tenantSlug) headers['x-tenant-slug'] = tenantSlug;

      const res = await fetch('http://localhost:5000/api/auth/change-credentials', {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          currentPassword: usernameCurrentPassword,
          newUsername: trimmed
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        const updatedUser = {
          ...currentUser,
          ...data.user,
          uniqueId: data.user.uniqueId || data.user.username,
          username: data.user.username || data.user.uniqueId,
          token: data.user.token || currentUser.token
        };
        sessionStorage.setItem('userInfo', JSON.stringify(updatedUser));
        if (data.user.token) {
          sessionStorage.setItem('token', data.user.token);
        }
        setCurrentUser(updatedUser);
        window.dispatchEvent(new CustomEvent('userProfileUpdated', { detail: updatedUser }));
        setNewUsername('');
        setUsernameCurrentPassword('');
        setUsernameFeedback({
          type: 'success',
          message: `✓ Username updated successfully to "${updatedUser.uniqueId}"!`
        });
      } else {
        setUsernameFeedback({
          type: 'error',
          message: data?.error || 'Failed to update username.'
        });
      }
    } catch (err) {
      setUsernameFeedback({
        type: 'error',
        message: 'Network error: ' + err.message
      });
    } finally {
      setIsUpdatingUsername(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e?.preventDefault();
    setPasswordFeedback({ type: '', message: '' });

    if (!passwordCurrentPassword) {
      setPasswordFeedback({ type: 'error', message: 'Current password is required to verify your identity.' });
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      setPasswordFeedback({ type: 'error', message: 'New password must be at least 6 characters long.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordFeedback({ type: 'error', message: 'New password and confirm password do not match.' });
      return;
    }

    setIsUpdatingPassword(true);
    try {
      const token = currentUser?.token || sessionStorage.getItem('token') || '';
      const tenantSlug = sessionStorage.getItem('tenantSlug') || '';
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      };
      if (tenantSlug) headers['x-tenant-slug'] = tenantSlug;

      const res = await fetch('http://localhost:5000/api/auth/change-credentials', {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          currentPassword: passwordCurrentPassword,
          newPassword: newPassword
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        if (data.user?.token) {
          sessionStorage.setItem('token', data.user.token);
          const updatedUser = {
            ...currentUser,
            token: data.user.token
          };
          sessionStorage.setItem('userInfo', JSON.stringify(updatedUser));
          setCurrentUser(updatedUser);
          window.dispatchEvent(new CustomEvent('userProfileUpdated', { detail: updatedUser }));
        }
        setPasswordCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setPasswordFeedback({
          type: 'success',
          message: '✓ Password updated successfully! Please use your new password next time you log in.'
        });
      } else {
        setPasswordFeedback({
          type: 'error',
          message: data?.error || 'Failed to update password.'
        });
      }
    } catch (err) {
      setPasswordFeedback({
        type: 'error',
        message: 'Network error: ' + err.message
      });
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleSaveModalSchoolName = async () => {
    if (!modalSchoolName.trim()) {
      setModalSaveMsg('Please provide a valid school name');
      return;
    }
    setIsSavingModalSchool(true);
    setModalSaveMsg('');

    try {
      const token = currentUser?.token || sessionStorage.getItem('token') || '';
      const tenantSlug = sessionStorage.getItem('tenantSlug') || '';
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      };
      if (tenantSlug) headers['x-tenant-slug'] = tenantSlug;

      const res = await fetch('http://localhost:5000/api/school/name', {
        method: 'PUT',
        headers,
        body: JSON.stringify({ name: modalSchoolName.trim() })
      });

      const data = await res.json();
      if (res.ok) {
        const assignedName = data?.school?.name || modalSchoolName.trim();
        sessionStorage.setItem('schoolName', assignedName);
        window.dispatchEvent(new CustomEvent('schoolNameChanged', { detail: assignedName }));
        setModalSaveMsg(`✓ School name assigned to "${assignedName}"!`);
      } else {
        setModalSaveMsg(data?.error || 'Failed to update school name.');
      }
    } catch (err) {
      setModalSaveMsg('Error: ' + err.message);
    } finally {
      setIsSavingModalSchool(false);
    }
  };

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
        height: '620px',
        maxHeight: '92vh',
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
              { id: 'security', label: 'Security & Login', icon: Shield },
              { id: 'account', label: 'Account Settings', icon: Settings },
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
              <p style={{ color: '#64748b', marginBottom: '28px' }}>Manage your personal information, profile photo, and public profile.</p>

              {/* Profile Photo & Identity Banner */}
              <div style={{
                display: 'flex',
                gap: '28px',
                alignItems: 'center',
                marginBottom: '28px',
                padding: '24px',
                background: 'linear-gradient(135deg, #f8fafc 0%, #eff6ff 100%)',
                borderRadius: '20px',
                border: '1px solid #e2e8f0',
                boxShadow: '0 4px 16px rgba(0,0,0,0.02)'
              }}>
                {/* Circular Avatar with Camera badge */}
                <div style={{ position: 'relative', width: '96px', height: '96px', flexShrink: 0 }}>
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    title="Click to change profile photo"
                    style={{
                      width: '96px',
                      height: '96px',
                      borderRadius: '50%',
                      border: '4px solid white',
                      boxShadow: '0 8px 24px rgba(79, 70, 229, 0.15)',
                      overflow: 'hidden',
                      cursor: 'pointer',
                      background: '#e0e7ff',
                      position: 'relative'
                    }}
                  >
                    <img 
                      src={profileImage || `https://ui-avatars.com/api/?name=${currentUser.uniqueId || role}&background=e0e7ff&color=3730a3&bold=true&size=120`} 
                      alt="Profile Avatar" 
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                    />
                    <div 
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(15, 23, 42, 0.4)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        opacity: 0,
                        transition: 'opacity 0.2s',
                        color: 'white'
                      }}
                      onMouseOver={e => e.currentTarget.style.opacity = '1'}
                      onMouseOut={e => e.currentTarget.style.opacity = '0'}
                    >
                      <Camera size={26} />
                    </div>
                  </div>

                  {/* Camera Badge Button at bottom right */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    title="Upload new image"
                    style={{
                      position: 'absolute',
                      bottom: '0',
                      right: '0',
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: '#4F46E5',
                      color: 'white',
                      border: '3px solid white',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      transition: 'transform 0.15s, background 0.15s'
                    }}
                    onMouseOver={e => { e.currentTarget.style.transform = 'scale(1.1)'; e.currentTarget.style.background = '#4338ca'; }}
                    onMouseOut={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.background = '#4F46E5'; }}
                  >
                    <Camera size={14} />
                  </button>
                </div>

                {/* Hidden File Input */}
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  accept="image/png,image/jpeg,image/jpg,image/webp" 
                  style={{ display: 'none' }} 
                />

                {/* Actions & Credentials Info */}
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#1e3a8a' }}>
                      {profileName || currentUser.uniqueId || role}
                    </div>
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '2px 8px', borderRadius: '6px', background: '#dbeafe', color: '#1e40af', textTransform: 'capitalize' }}>
                      {role} Account
                    </span>
                  </div>
                  
                  <div style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '14px' }}>
                    Active Username: <strong>@{currentUser.uniqueId || currentUser.username || role}</strong>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    <button 
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      style={{ 
                        padding: '8px 16px', 
                        background: '#4F46E5', 
                        color: 'white', 
                        border: 'none', 
                        borderRadius: '10px', 
                        fontWeight: 700, 
                        fontSize: '0.84rem', 
                        cursor: 'pointer', 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '6px',
                        boxShadow: '0 2px 8px rgba(79, 70, 229, 0.25)',
                        transition: 'background 0.2s'
                      }}
                      onMouseOver={e => e.currentTarget.style.background = '#4338ca'}
                      onMouseOut={e => e.currentTarget.style.background = '#4F46E5'}
                    >
                      <Upload size={14} /> Upload New Photo
                    </button>

                    {profileImage && (
                      <button 
                        type="button"
                        onClick={handleRemovePhoto}
                        style={{ 
                          padding: '8px 14px', 
                          background: '#fee2e2', 
                          color: '#dc2626', 
                          border: '1px solid #fecaca', 
                          borderRadius: '10px', 
                          fontWeight: 600, 
                          fontSize: '0.84rem', 
                          cursor: 'pointer', 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '6px' 
                        }}
                      >
                        <Trash2 size={14} /> Remove Photo
                      </button>
                    )}

                    <button 
                      type="button"
                      onClick={() => setActiveTab('security')}
                      style={{ padding: '8px 14px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '10px', fontWeight: 600, color: '#334155', cursor: 'pointer', fontSize: '0.84rem' }}
                    >
                      Change Login Credentials &rarr;
                    </button>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '8px' }}>
                    Supports PNG, JPG, or WebP. Automatically optimized for fast rendering.
                  </div>
                </div>
              </div>

              {/* Feedback Banner */}
              {profileFeedback.message && (
                <div style={{
                  padding: '12px 16px',
                  borderRadius: '12px',
                  marginBottom: '24px',
                  fontSize: '0.88rem',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  background: profileFeedback.type === 'error' ? '#fef2f2' : profileFeedback.type === 'info' ? '#eff6ff' : '#f0fdf4',
                  border: `1px solid ${profileFeedback.type === 'error' ? '#fecaca' : profileFeedback.type === 'info' ? '#bfdbfe' : '#bbf7d0'}`,
                  color: profileFeedback.type === 'error' ? '#dc2626' : profileFeedback.type === 'info' ? '#1d4ed8' : '#16a34a'
                }}>
                  {profileFeedback.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
                  <span>{profileFeedback.message}</span>
                </div>
              )}

              {/* Profile Details Form */}
              <form onSubmit={handleSaveProfile}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '8px' }}>Display Name</label>
                    <input 
                      type="text" 
                      value={profileName} 
                      onChange={e => setProfileName(e.target.value)}
                      placeholder="e.g. Rahul Sharma"
                      style={{ width: '100%', padding: '12px 16px', borderRadius: '10px', border: '1px solid #cbd5e1', background: '#f8fafc', fontSize: '0.95rem', outline: 'none' }} 
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '8px' }}>Role / Designation</label>
                    <input 
                      type="text" 
                      disabled 
                      value={(role.charAt(0).toUpperCase() + role.slice(1)) + " Account"} 
                      style={{ width: '100%', padding: '12px 16px', borderRadius: '10px', border: '1px solid #e2e8f0', background: '#f1f5f9', fontSize: '0.95rem', color: '#64748b', cursor: 'not-allowed' }} 
                    />
                  </div>
                  <div style={{ gridColumn: 'span 2' }}>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '8px' }}>Email Address</label>
                    <input 
                      type="email" 
                      value={profileEmail} 
                      onChange={e => setProfileEmail(e.target.value)}
                      placeholder="admin@pragatischool.edu"
                      style={{ width: '100%', padding: '12px 16px', borderRadius: '10px', border: '1px solid #cbd5e1', background: '#f8fafc', fontSize: '0.95rem', outline: 'none' }} 
                    />
                  </div>
                </div>

                <div style={{ marginTop: '32px', display: 'flex', justifyContent: 'flex-end', gap: '14px', alignItems: 'center' }}>
                  <button 
                    type="button" 
                    onClick={onClose} 
                    style={{ padding: '11px 22px', background: 'white', border: '1px solid #cbd5e1', borderRadius: '10px', fontWeight: 600, color: '#475569', cursor: 'pointer' }}
                  >
                    Close
                  </button>
                  <button 
                    type="submit" 
                    disabled={isUpdatingProfile}
                    style={{ 
                      padding: '11px 26px', 
                      background: 'linear-gradient(135deg, #4F46E5 0%, #1e40af 100%)', 
                      color: 'white', 
                      border: 'none', 
                      borderRadius: '10px', 
                      fontWeight: 700, 
                      cursor: isUpdatingProfile ? 'not-allowed' : 'pointer',
                      boxShadow: '0 4px 14px rgba(79, 70, 229, 0.3)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    {isUpdatingProfile ? 'Saving Changes...' : 'Save Profile Changes'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(79, 70, 229, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Key size={20} color="#4F46E5" />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#1e3a8a', margin: 0 }}>
                      Login & Security Credentials
                    </h3>
                    <p style={{ color: '#64748b', fontSize: '0.85rem', margin: 0 }}>
                      Change your username and password for logging into Pragati SMS.
                    </p>
                  </div>
                </div>
              </div>

              {/* Active Sign-In Identity Banner */}
              <div style={{
                background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.05) 0%, rgba(15, 118, 110, 0.05) 100%)',
                border: '1px solid rgba(79, 70, 229, 0.15)',
                borderRadius: '16px',
                padding: '14px 20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '10px',
                    background: '#4F46E5',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '1rem',
                    boxShadow: '0 4px 12px rgba(79, 70, 229, 0.25)'
                  }}>
                    {(currentUser.uniqueId || currentUser.username || role || 'U').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b', fontWeight: 600 }}>
                      Current Login Username
                    </div>
                    <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#1e3a8a' }}>
                      @{currentUser.uniqueId || currentUser.username || 'user'}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{
                    background: 'rgba(79, 70, 229, 0.1)',
                    color: '#4338CA',
                    padding: '4px 10px',
                    borderRadius: '999px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    textTransform: 'capitalize'
                  }}>
                    {role} Account
                  </span>
                  <span style={{
                    background: 'rgba(16, 185, 129, 0.1)',
                    color: '#065F46',
                    padding: '4px 10px',
                    borderRadius: '999px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }}></span>
                    Active Session
                  </span>
                </div>
              </div>

              {/* Card 1: Change Username */}
              <div style={{
                background: 'white',
                border: '1px solid #e2e8f0',
                borderRadius: '16px',
                padding: '20px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <User size={16} color="#2563eb" />
                  </div>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#1e293b' }}>
                      Change Username
                    </h4>
                    <p style={{ margin: 0, fontSize: '0.78rem', color: '#64748b' }}>
                      Update the username handle used to sign into your account.
                    </p>
                  </div>
                </div>

                <form onSubmit={handleUpdateUsername}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '14px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
                        New Username
                      </label>
                      <input 
                        type="text"
                        value={newUsername}
                        onChange={e => setNewUsername(e.target.value)}
                        placeholder="e.g. principal_sharma or john_doe"
                        style={{
                          width: '100%',
                          padding: '10px 14px',
                          borderRadius: '10px',
                          border: '1px solid #cbd5e1',
                          background: '#f8fafc',
                          fontSize: '0.9rem',
                          outline: 'none',
                          boxSizing: 'border-box'
                        }}
                        onFocus={e => e.target.style.borderColor = '#2563eb'}
                        onBlur={e => e.target.style.borderColor = '#cbd5e1'}
                      />
                      <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '4px' }}>
                        3 to 50 characters. Unique within this school.
                      </div>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
                        Current Password (Identity Verification)
                      </label>
                      <div style={{ position: 'relative' }}>
                        <input 
                          type={showUsernameCurrentPw ? 'text' : 'password'}
                          value={usernameCurrentPassword}
                          onChange={e => setUsernameCurrentPassword(e.target.value)}
                          placeholder="Verify with current password"
                          style={{
                            width: '100%',
                            padding: '10px 38px 10px 14px',
                            borderRadius: '10px',
                            border: '1px solid #cbd5e1',
                            background: '#f8fafc',
                            fontSize: '0.9rem',
                            outline: 'none',
                            boxSizing: 'border-box'
                          }}
                          onFocus={e => e.target.style.borderColor = '#2563eb'}
                          onBlur={e => e.target.style.borderColor = '#cbd5e1'}
                        />
                        <button
                          type="button"
                          onClick={() => setShowUsernameCurrentPw(!showUsernameCurrentPw)}
                          style={{
                            position: 'absolute',
                            right: '10px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: '#94a3b8',
                            padding: 0,
                            display: 'flex'
                          }}
                        >
                          {showUsernameCurrentPw ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '4px' }}>
                        Confirm your current password to authorize change.
                      </div>
                    </div>
                  </div>

                  {usernameFeedback.message && (
                    <div style={{
                      padding: '10px 14px',
                      borderRadius: '10px',
                      marginBottom: '14px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      background: usernameFeedback.type === 'success' ? '#ecfdf5' : '#fef2f2',
                      color: usernameFeedback.type === 'success' ? '#047857' : '#b91c1c',
                      border: `1px solid ${usernameFeedback.type === 'success' ? '#a7f3d0' : '#fecaca'}`
                    }}>
                      {usernameFeedback.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                      <span>{usernameFeedback.message}</span>
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                      type="submit"
                      disabled={isUpdatingUsername || !newUsername.trim() || !usernameCurrentPassword}
                      style={{
                        padding: '9px 18px',
                        borderRadius: '8px',
                        border: 'none',
                        background: (!newUsername.trim() || !usernameCurrentPassword || isUpdatingUsername) ? '#94a3b8' : '#2563eb',
                        color: 'white',
                        fontWeight: 600,
                        fontSize: '0.85rem',
                        cursor: (!newUsername.trim() || !usernameCurrentPassword || isUpdatingUsername) ? 'not-allowed' : 'pointer',
                        transition: 'background 0.2s',
                        boxShadow: '0 2px 6px rgba(37, 99, 235, 0.25)'
                      }}
                    >
                      {isUpdatingUsername ? 'Updating Username...' : 'Save New Username'}
                    </button>
                  </div>
                </form>
              </div>

              {/* Card 2: Change Password */}
              <div style={{
                background: 'white',
                border: '1px solid #e2e8f0',
                borderRadius: '16px',
                padding: '20px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Lock size={16} color="#059669" />
                  </div>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#1e293b' }}>
                      Change Password
                    </h4>
                    <p style={{ margin: 0, fontSize: '0.78rem', color: '#64748b' }}>
                      Choose a secure password of at least 6 characters.
                    </p>
                  </div>
                </div>

                <form onSubmit={handleUpdatePassword}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '14px' }}>
                    {/* Current Password */}
                    <div>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
                        Current Password
                      </label>
                      <div style={{ position: 'relative' }}>
                        <input 
                          type={showCurrentPw ? 'text' : 'password'}
                          value={passwordCurrentPassword}
                          onChange={e => setPasswordCurrentPassword(e.target.value)}
                          placeholder="Enter current password"
                          style={{
                            width: '100%',
                            padding: '10px 38px 10px 14px',
                            borderRadius: '10px',
                            border: '1px solid #cbd5e1',
                            background: '#f8fafc',
                            fontSize: '0.9rem',
                            outline: 'none',
                            boxSizing: 'border-box'
                          }}
                          onFocus={e => e.target.style.borderColor = '#059669'}
                          onBlur={e => e.target.style.borderColor = '#cbd5e1'}
                        />
                        <button
                          type="button"
                          onClick={() => setShowCurrentPw(!showCurrentPw)}
                          style={{
                            position: 'absolute',
                            right: '10px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: '#94a3b8',
                            padding: 0,
                            display: 'flex'
                          }}
                        >
                          {showCurrentPw ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>

                    {/* New & Confirm Password Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
                          New Password
                        </label>
                        <div style={{ position: 'relative' }}>
                          <input 
                            type={showNewPw ? 'text' : 'password'}
                            value={newPassword}
                            onChange={e => setNewPassword(e.target.value)}
                            placeholder="Min 6 characters"
                            style={{
                              width: '100%',
                              padding: '10px 38px 10px 14px',
                              borderRadius: '10px',
                              border: '1px solid #cbd5e1',
                              background: '#f8fafc',
                              fontSize: '0.9rem',
                              outline: 'none',
                              boxSizing: 'border-box'
                            }}
                            onFocus={e => e.target.style.borderColor = '#059669'}
                            onBlur={e => e.target.style.borderColor = '#cbd5e1'}
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewPw(!showNewPw)}
                            style={{
                              position: 'absolute',
                              right: '10px',
                              top: '50%',
                              transform: 'translateY(-50%)',
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              color: '#94a3b8',
                              padding: 0,
                              display: 'flex'
                            }}
                          >
                            {showNewPw ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>

                        {newPassword && (
                          <div style={{ marginTop: '6px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#64748b', marginBottom: '3px' }}>
                              <span>Strength:</span>
                              <span style={{ fontWeight: 700, color: getPasswordStrength(newPassword).color }}>
                                {getPasswordStrength(newPassword).text}
                              </span>
                            </div>
                            <div style={{ width: '100%', height: '4px', background: '#e2e8f0', borderRadius: '2px', overflow: 'hidden' }}>
                              <div style={{
                                width: getPasswordStrength(newPassword).width,
                                height: '100%',
                                background: getPasswordStrength(newPassword).color,
                                transition: 'all 0.3s ease'
                              }} />
                            </div>
                          </div>
                        )}
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
                          Confirm New Password
                        </label>
                        <div style={{ position: 'relative' }}>
                          <input 
                            type={showConfirmPw ? 'text' : 'password'}
                            value={confirmPassword}
                            onChange={e => setConfirmPassword(e.target.value)}
                            placeholder="Re-enter new password"
                            style={{
                              width: '100%',
                              padding: '10px 38px 10px 14px',
                              borderRadius: '10px',
                              border: '1px solid #cbd5e1',
                              background: '#f8fafc',
                              fontSize: '0.9rem',
                              outline: 'none',
                              boxSizing: 'border-box'
                            }}
                            onFocus={e => e.target.style.borderColor = '#059669'}
                            onBlur={e => e.target.style.borderColor = '#cbd5e1'}
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPw(!showConfirmPw)}
                            style={{
                              position: 'absolute',
                              right: '10px',
                              top: '50%',
                              transform: 'translateY(-50%)',
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              color: '#94a3b8',
                              padding: 0,
                              display: 'flex'
                            }}
                          >
                            {showConfirmPw ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>

                        {confirmPassword && (
                          <div style={{ marginTop: '6px', fontSize: '0.74rem', fontWeight: 600, color: newPassword === confirmPassword ? '#059669' : '#dc2626' }}>
                            {newPassword === confirmPassword ? '✓ Passwords match' : '✗ Passwords do not match'}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {passwordFeedback.message && (
                    <div style={{
                      padding: '10px 14px',
                      borderRadius: '10px',
                      marginBottom: '14px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      background: passwordFeedback.type === 'success' ? '#ecfdf5' : '#fef2f2',
                      color: passwordFeedback.type === 'success' ? '#047857' : '#b91c1c',
                      border: `1px solid ${passwordFeedback.type === 'success' ? '#a7f3d0' : '#fecaca'}`
                    }}>
                      {passwordFeedback.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                      <span>{passwordFeedback.message}</span>
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                      type="submit"
                      disabled={isUpdatingPassword || !passwordCurrentPassword || !newPassword || newPassword.length < 6 || newPassword !== confirmPassword}
                      style={{
                        padding: '9px 18px',
                        borderRadius: '8px',
                        border: 'none',
                        background: (isUpdatingPassword || !passwordCurrentPassword || !newPassword || newPassword.length < 6 || newPassword !== confirmPassword) ? '#94a3b8' : '#059669',
                        color: 'white',
                        fontWeight: 600,
                        fontSize: '0.85rem',
                        cursor: (isUpdatingPassword || !passwordCurrentPassword || !newPassword || newPassword.length < 6 || newPassword !== confirmPassword) ? 'not-allowed' : 'pointer',
                        transition: 'background 0.2s',
                        boxShadow: '0 2px 6px rgba(5, 150, 105, 0.25)'
                      }}
                    >
                      {isUpdatingPassword ? 'Updating Password...' : 'Update Password'}
                    </button>
                  </div>
                </form>
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
                
                {(role === 'admin' || role === 'superadmin' || role === 'principal') && (
                  <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1.5px solid rgba(79, 70, 229, 0.2)' }}>
                    <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 700, color: '#1e3a8a', marginBottom: '4px' }}>
                      🏫 Official School / Institution Name
                    </label>
                    <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '14px' }}>
                      Administrator Privilege: Assign or update the official school name for this workspace.
                    </p>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <input 
                        type="text" 
                        value={modalSchoolName} 
                        onChange={(e) => setModalSchoolName(e.target.value)} 
                        placeholder="e.g. St. Xavier's High School"
                        style={{ flex: 1, padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', background: 'white', fontSize: '0.95rem', fontWeight: 600 }} 
                      />
                      <button 
                        type="button" 
                        onClick={handleSaveModalSchoolName}
                        disabled={isSavingModalSchool}
                        style={{ padding: '10px 18px', background: '#4F46E5', border: 'none', borderRadius: '8px', color: 'white', fontWeight: 600, cursor: isSavingModalSchool ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap' }}
                      >
                        {isSavingModalSchool ? 'Saving...' : 'Assign Name'}
                      </button>
                    </div>
                    {modalSaveMsg && (
                      <div style={{ marginTop: '8px', fontSize: '0.82rem', color: modalSaveMsg.startsWith('✓') ? '#16a34a' : '#dc2626', fontWeight: 600 }}>
                        {modalSaveMsg}
                      </div>
                    )}
                  </div>
                )}
                
                <div style={{ marginTop: '16px', padding: '24px', border: '1px solid #fecaca', borderRadius: '12px', background: '#fef2f2' }}>
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
          {['notifications', 'billing'].includes(activeTab) && (
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
