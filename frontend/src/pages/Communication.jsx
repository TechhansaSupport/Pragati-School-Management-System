import React, { useState, useEffect } from 'react';
import { 
  Search, Send, Bell, MessageSquare, Megaphone, Plus, 
  X, CheckCircle2, User, Mail, Phone, Calendar, Clock,
  AlertTriangle, Filter, Sparkles, RefreshCw, SendHorizontal,
  ShieldAlert, Radio, HelpCircle, Check, MapPin, Tag, LifeBuoy
} from 'lucide-react';

const Communication = () => {
  const tenantSlug = sessionStorage.getItem('tenantSlug') || '';
  const userInfo = JSON.parse(sessionStorage.getItem('userInfo') || '{}');
  const token = userInfo.token || sessionStorage.getItem('token') || '';

  // Tab: 'announcements', 'messages', 'emergency', 'events', 'grievances'
  const [activeTab, setActiveTab] = useState('announcements');

  // Announcements State
  const [announcements, setAnnouncements] = useState([]);
  const [announcementFilter, setAnnouncementFilter] = useState('ALL');
  const [announcementSearch, setAnnouncementSearch] = useState('');
  const [isAnnounceModalOpen, setIsAnnounceModalOpen] = useState(false);
  const [isSubmittingNotice, setIsSubmittingNotice] = useState(false);
  const [noticeSuccessMessage, setNoticeSuccessMessage] = useState('');

  // Notice Form State
  const [noticeForm, setNoticeForm] = useState({
    title: '',
    content: '',
    targetAudience: 'All Students & Parents',
    priority: 'Normal',
    author: userInfo.name || 'School Administration'
  });

  // Direct Messages & Contacts State
  const [contacts, setContacts] = useState([]);
  const [selectedContact, setSelectedContact] = useState(null);
  const [contactSearch, setContactSearch] = useState('');
  const [messagesByContact, setMessagesByContact] = useState({});
  const [replyText, setReplyText] = useState('');
  const [loading, setLoading] = useState(true);

  // Emergency Mode State (Section 10.12)
  const [activeEmergency, setActiveEmergency] = useState(null);
  const [emergencyForm, setEmergencyForm] = useState({
    title: 'Severe Weather Warning & Early Dispersal',
    message: 'Due to severe torrential rains and waterlogging advisory issued by local authorities, campus operations will suspend at 01:30 PM today. School buses will depart 2 hours ahead of regular schedule.',
    severity: 'Urgent',
    actionRequired: 'Parents please coordinate with bus transport coordinators or pick up students directly from the main gate.'
  });
  const [isPublishingEmergency, setIsPublishingEmergency] = useState(false);

  // Events Calendar State (Section 9.20)
  const [events, setEvents] = useState([]);
  const [eventCategoryFilter, setEventCategoryFilter] = useState('ALL');
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [eventForm, setEventForm] = useState({
    title: '',
    date: new Date().toISOString().split('T')[0],
    time: '09:00 AM - 01:00 PM',
    location: 'Main Auditorium',
    category: 'Academic',
    audience: 'All Students & Parents'
  });

  // Grievance Management State (Section 9.21)
  const [grievances, setGrievances] = useState([]);
  const [grievanceStatusFilter, setGrievanceStatusFilter] = useState('ALL');
  const [isGrievanceModalOpen, setIsGrievanceModalOpen] = useState(false);
  const [grievanceForm, setGrievanceForm] = useState({
    title: '',
    category: 'Transport',
    raisedBy: userInfo.name || 'Concerned Parent',
    student: 'Aarav Patel (Class 10 - A)',
    priority: 'High',
    description: ''
  });

  const getHeaders = () => {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (tenantSlug) headers['x-tenant-slug'] = tenantSlug;
    return headers;
  };

  // Fetch Announcements from live MongoDB
  const fetchAnnouncements = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/communication/announcements', {
        headers: getHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        setAnnouncements(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.warn('Error fetching announcements:', err);
    }
  };

  // Fetch Real Contacts (Staff & Students) from live MongoDB
  const fetchContacts = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/communication/contacts', {
        headers: getHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        const contactList = Array.isArray(data) ? data : [];
        setContacts(contactList);
        if (contactList.length > 0 && !selectedContact) {
          setSelectedContact(contactList[0]);
        }
      }
    } catch (err) {
      console.warn('Error fetching contacts:', err);
    }
  };

  // Fetch Active Emergency Alert
  const fetchEmergency = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/communication/emergency', {
        headers: getHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        setActiveEmergency(data.alert || null);
      }
    } catch (err) {
      console.warn('Error fetching emergency alert:', err);
    }
  };

  // Fetch Events
  const fetchEvents = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/communication/events', {
        headers: getHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        setEvents(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.warn('Error fetching events:', err);
    }
  };

  // Fetch Grievances
  const fetchGrievances = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/communication/grievances', {
        headers: getHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        setGrievances(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.warn('Error fetching grievances:', err);
    }
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetchAnnouncements(), 
      fetchContacts(),
      fetchEmergency(),
      fetchEvents(),
      fetchGrievances()
    ]).finally(() => {
      setLoading(false);
    });
  }, [tenantSlug]);

  // Handle New Announcement Submission
  const handleCreateAnnouncement = async (e) => {
    e.preventDefault();
    if (!noticeForm.title.trim() || !noticeForm.content.trim()) return;

    setIsSubmittingNotice(true);
    try {
      const res = await fetch('http://localhost:5000/api/communication/announcements', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(noticeForm)
      });

      if (res.ok) {
        const created = await res.json();
        setAnnouncements(prev => [created, ...prev]);
        setNoticeSuccessMessage('Notice posted successfully to live campus bulletin!');
        setIsAnnounceModalOpen(false);
        setNoticeForm({
          title: '',
          content: '',
          targetAudience: 'All Students & Parents',
          priority: 'Normal',
          author: userInfo.name || 'School Administration'
        });
        setTimeout(() => setNoticeSuccessMessage(''), 4000);
      }
    } catch (err) {
      console.error('Failed to post announcement:', err);
    } finally {
      setIsSubmittingNotice(false);
    }
  };

  // Handle Emergency Publish
  const handlePublishEmergency = async (e) => {
    e.preventDefault();
    if (!emergencyForm.title.trim() || !emergencyForm.message.trim()) return;

    setIsPublishingEmergency(true);
    try {
      const res = await fetch('http://localhost:5000/api/communication/emergency', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(emergencyForm)
      });
      if (res.ok) {
        const data = await res.json();
        setActiveEmergency(data.alert);
        setNoticeSuccessMessage('🚨 Emergency broadcast mode activated campus-wide!');
        fetchAnnouncements();
        setTimeout(() => setNoticeSuccessMessage(''), 5000);
      }
    } catch (err) {
      console.error('Failed to publish emergency alert:', err);
    } finally {
      setIsPublishingEmergency(false);
    }
  };

  // Handle Emergency Revoke
  const handleRevokeEmergency = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/communication/emergency', {
        method: 'DELETE',
        headers: getHeaders()
      });
      if (res.ok) {
        setActiveEmergency(null);
        setNoticeSuccessMessage('Emergency broadcast deactivated. Regular campus mode resumed.');
        setTimeout(() => setNoticeSuccessMessage(''), 4000);
      }
    } catch (err) {
      console.error('Failed to revoke emergency:', err);
    }
  };

  // Handle Create Event
  const handleCreateEvent = async (e) => {
    e.preventDefault();
    if (!eventForm.title.trim()) return;
    try {
      const res = await fetch('http://localhost:5000/api/communication/events', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(eventForm)
      });
      if (res.ok) {
        const created = await res.json();
        setEvents(prev => [created, ...prev]);
        setIsEventModalOpen(false);
        setNoticeSuccessMessage('School event scheduled and added to academic calendar!');
        setTimeout(() => setNoticeSuccessMessage(''), 4000);
      }
    } catch (err) {
      console.error('Failed to create event:', err);
    }
  };

  // Handle Create Grievance
  const handleCreateGrievance = async (e) => {
    e.preventDefault();
    if (!grievanceForm.title.trim()) return;
    try {
      const res = await fetch('http://localhost:5000/api/communication/grievances', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(grievanceForm)
      });
      if (res.ok) {
        const created = await res.json();
        setGrievances(prev => [created, ...prev]);
        setIsGrievanceModalOpen(false);
        setNoticeSuccessMessage(`Ticket #${created.id} created successfully.`);
        setTimeout(() => setNoticeSuccessMessage(''), 4000);
      }
    } catch (err) {
      console.error('Failed to create grievance:', err);
    }
  };

  // Update Grievance Status
  const handleUpdateGrievanceStatus = async (id, newStatus) => {
    try {
      const res = await fetch(`http://localhost:5000/api/communication/grievances/${id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        setGrievances(prev => prev.map(g => g.id === id ? { ...g, status: newStatus } : g));
      }
    } catch (err) {
      console.error('Failed to update grievance:', err);
    }
  };

  // Handle Sending a Message in direct chat
  const handleSendMessage = () => {
    if (!replyText.trim() || !selectedContact) return;

    const contactId = selectedContact.id || selectedContact._id;
    const newMsg = {
      id: Date.now(),
      sender: userInfo.name || 'Me (Staff)',
      text: replyText.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isMine: true
    };

    setMessagesByContact(prev => ({
      ...prev,
      [contactId]: [...(prev[contactId] || []), newMsg]
    }));

    setReplyText('');
  };

  // Filtered announcements
  const filteredAnnouncements = announcements.filter(item => {
    const matchesFilter = announcementFilter === 'ALL' || item.priority?.toUpperCase() === announcementFilter;
    const matchesSearch = announcementSearch === '' || 
      item.title?.toLowerCase().includes(announcementSearch.toLowerCase()) ||
      item.content?.toLowerCase().includes(announcementSearch.toLowerCase()) ||
      item.author?.toLowerCase().includes(announcementSearch.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  // Filtered contacts
  const filteredContacts = contacts.filter(c => {
    if (!contactSearch) return true;
    const term = contactSearch.toLowerCase();
    return (
      c.name?.toLowerCase().includes(term) ||
      c.role?.toLowerCase().includes(term) ||
      c.department?.toLowerCase().includes(term) ||
      c.email?.toLowerCase().includes(term)
    );
  });

  // Filtered events
  const filteredEvents = events.filter(e => {
    if (eventCategoryFilter === 'ALL') return true;
    return e.category?.toUpperCase() === eventCategoryFilter.toUpperCase();
  });

  // Filtered grievances
  const filteredGrievances = grievances.filter(g => {
    if (grievanceStatusFilter === 'ALL') return true;
    return g.status?.toUpperCase() === grievanceStatusFilter.toUpperCase();
  });

  // Calculate statistics
  const totalAnnouncements = announcements.length;
  const urgentCount = announcements.filter(a => a.priority === 'Urgent').length;
  const openGrievancesCount = grievances.filter(g => g.status === 'Open' || g.status === 'In Progress').length;
  const upcomingEventsCount = events.length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
      
      {/* Top Banner & KPI Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <div className="chart-card" style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', gap: '16px', background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 2px 10px rgba(0,0,0,0.03)', minHeight: '88px', boxSizing: 'border-box' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(79, 70, 229, 0.1)', color: '#4F46E5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Megaphone size={24} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', minWidth: 0 }}>
            <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '2px', lineHeight: 1.2 }}>Live Bulletins</div>
            <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#1e3a8a', lineHeight: 1.15 }}>{totalAnnouncements}</div>
          </div>
        </div>

        <div className="chart-card" style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', gap: '16px', background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 2px 10px rgba(0,0,0,0.03)', minHeight: '88px', boxSizing: 'border-box' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: activeEmergency ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.1)', color: '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <ShieldAlert size={24} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', minWidth: 0 }}>
            <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '2px', lineHeight: 1.2 }}>Emergency Mode</div>
            <div style={{ 
              fontSize: '1.15rem', 
              fontWeight: 800, 
              color: activeEmergency ? '#dc2626' : '#16a34a',
              lineHeight: 1.2,
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <span style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: activeEmergency ? '#dc2626' : '#16a34a',
                boxShadow: activeEmergency ? '0 0 8px #dc2626' : '0 0 6px #16a34a',
                flexShrink: 0
              }} />
              {activeEmergency ? 'BROADCAST ACTIVE' : 'Normal / Standby'}
            </div>
          </div>
        </div>

        <div className="chart-card" style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', gap: '16px', background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 2px 10px rgba(0,0,0,0.03)', minHeight: '88px', boxSizing: 'border-box' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(15, 118, 110, 0.1)', color: '#0F766E', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Calendar size={24} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', minWidth: 0 }}>
            <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '2px', lineHeight: 1.2 }}>Campus Events</div>
            <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0f766e', lineHeight: 1.15 }}>{upcomingEventsCount}</div>
          </div>
        </div>

        <div className="chart-card" style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', gap: '16px', background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 2px 10px rgba(0,0,0,0.03)', minHeight: '88px', boxSizing: 'border-box' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(245, 158, 11, 0.1)', color: '#F59E0B', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <LifeBuoy size={24} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', minWidth: 0 }}>
            <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '2px', lineHeight: 1.2 }}>Active Grievances</div>
            <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#b45309', lineHeight: 1.15 }}>{openGrievancesCount}</div>
          </div>
        </div>
      </div>

      {/* Success Notification Alert */}
      {noticeSuccessMessage && (
        <div style={{ 
          padding: '12px 18px', 
          background: 'rgba(22, 163, 74, 0.1)', 
          border: '1px solid rgba(22, 163, 74, 0.25)', 
          borderRadius: '10px', 
          display: 'flex', 
          alignItems: 'center', 
          gap: '10px', 
          color: '#16a34a',
          fontWeight: 600,
          fontSize: '0.9rem'
        }}>
          <CheckCircle2 size={18} />
          <span>{noticeSuccessMessage}</span>
        </div>
      )}

      {/* Tabs & Action Toolbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', gap: '5px', background: 'white', padding: '5px', borderRadius: '14px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.02)', flexWrap: 'wrap', alignItems: 'center' }}>
          <button 
            onClick={() => setActiveTab('announcements')}
            style={{ 
              height: '36px',
              padding: '0 16px', 
              borderRadius: '10px', 
              border: 'none', 
              fontWeight: 700, 
              fontSize: '0.85rem', 
              cursor: 'pointer', 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '7px',
              backgroundColor: activeTab === 'announcements' ? '#4F46E5' : 'transparent', 
              color: activeTab === 'announcements' ? 'white' : '#64748b', 
              transition: 'all 0.2s',
              boxShadow: activeTab === 'announcements' ? '0 2px 8px rgba(79, 70, 229, 0.3)' : 'none'
            }}
          >
            <Megaphone size={15} /> Notice Board ({totalAnnouncements})
          </button>

          <button 
            onClick={() => setActiveTab('emergency')}
            style={{ 
              height: '36px',
              padding: '0 16px', 
              borderRadius: '10px', 
              border: 'none', 
              fontWeight: 700, 
              fontSize: '0.85rem', 
              cursor: 'pointer', 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '7px',
              backgroundColor: activeTab === 'emergency' ? '#DC2626' : (activeEmergency ? 'rgba(239, 68, 68, 0.12)' : 'transparent'), 
              color: activeTab === 'emergency' ? 'white' : (activeEmergency ? '#dc2626' : '#64748b'), 
              transition: 'all 0.2s',
              boxShadow: activeTab === 'emergency' ? '0 2px 8px rgba(220, 38, 38, 0.35)' : 'none'
            }}
          >
            <ShieldAlert size={15} /> Emergency Mode {activeEmergency && '🔴'}
          </button>

          <button 
            onClick={() => setActiveTab('events')}
            style={{ 
              height: '36px',
              padding: '0 16px', 
              borderRadius: '10px', 
              border: 'none', 
              fontWeight: 700, 
              fontSize: '0.85rem', 
              cursor: 'pointer', 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '7px',
              backgroundColor: activeTab === 'events' ? '#0F766E' : 'transparent', 
              color: activeTab === 'events' ? 'white' : '#64748b', 
              transition: 'all 0.2s',
              boxShadow: activeTab === 'events' ? '0 2px 8px rgba(15, 118, 110, 0.3)' : 'none'
            }}
          >
            <Calendar size={15} /> Events Calendar ({events.length})
          </button>

          <button 
            onClick={() => setActiveTab('grievances')}
            style={{ 
              height: '36px',
              padding: '0 16px', 
              borderRadius: '10px', 
              border: 'none', 
              fontWeight: 700, 
              fontSize: '0.85rem', 
              cursor: 'pointer', 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '7px',
              backgroundColor: activeTab === 'grievances' ? '#F59E0B' : 'transparent', 
              color: activeTab === 'grievances' ? 'white' : '#64748b', 
              transition: 'all 0.2s',
              boxShadow: activeTab === 'grievances' ? '0 2px 8px rgba(245, 158, 11, 0.3)' : 'none'
            }}
          >
            <LifeBuoy size={15} /> Grievances ({openGrievancesCount} Open)
          </button>

          <button 
            onClick={() => setActiveTab('messages')}
            style={{ 
              height: '36px',
              padding: '0 16px', 
              borderRadius: '10px', 
              border: 'none', 
              fontWeight: 700, 
              fontSize: '0.85rem', 
              cursor: 'pointer', 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '7px',
              backgroundColor: activeTab === 'messages' ? '#4F46E5' : 'transparent', 
              color: activeTab === 'messages' ? 'white' : '#64748b', 
              transition: 'all 0.2s',
              boxShadow: activeTab === 'messages' ? '0 2px 8px rgba(79, 70, 229, 0.3)' : 'none'
            }}
          >
            <MessageSquare size={15} /> Direct Messages ({contacts.length})
          </button>
        </div>

        {activeTab === 'announcements' && (
          <button 
            onClick={() => setIsAnnounceModalOpen(true)}
            style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '8px', 
              background: '#4F46E5', 
              color: 'white', 
              border: 'none', 
              height: '42px',
              padding: '0 20px', 
              borderRadius: '12px', 
              fontWeight: 700, 
              fontSize: '0.88rem',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(79, 70, 229, 0.25)',
              transition: 'all 0.2s'
            }}
          >
            <Plus size={18} /> Post New Notice
          </button>
        )}

        {activeTab === 'events' && (
          <button 
            onClick={() => setIsEventModalOpen(true)}
            style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '8px', 
              background: '#0F766E', 
              color: 'white', 
              border: 'none', 
              height: '42px',
              padding: '0 20px', 
              borderRadius: '12px', 
              fontWeight: 700, 
              fontSize: '0.88rem',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(15, 118, 110, 0.25)',
              transition: 'all 0.2s'
            }}
          >
            <Plus size={18} /> Add Campus Event
          </button>
        )}

        {activeTab === 'grievances' && (
          <button 
            onClick={() => setIsGrievanceModalOpen(true)}
            style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '8px', 
              background: '#F59E0B', 
              color: 'white', 
              border: 'none', 
              height: '42px',
              padding: '0 20px', 
              borderRadius: '12px', 
              fontWeight: 700, 
              fontSize: '0.88rem',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(245, 158, 11, 0.25)',
              transition: 'all 0.2s'
            }}
          >
            <Plus size={18} /> Log Grievance Ticket
          </button>
        )}
      </div>

      {/* TAB 1: NOTICE BOARD / ANNOUNCEMENTS */}
      {activeTab === 'announcements' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* Filter Bar */}
          <div className="chart-card" style={{ 
            padding: '14px 20px', 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            flexWrap: 'wrap', 
            gap: '14px', 
            background: 'white',
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 2px 10px rgba(0,0,0,0.02)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: '260px', maxWidth: '420px' }}>
              <div className="search-bar" style={{ width: '100%' }}>
                <Search size={16} />
                <input 
                  type="text" 
                  placeholder="Search notices by title, content or author..."
                  value={announcementSearch}
                  onChange={(e) => setAnnouncementSearch(e.target.value)}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginRight: '4px' }}>
                <Filter size={15} style={{ color: '#64748b' }} />
                <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>Priority:</span>
              </div>
              {['ALL', 'URGENT', 'IMPORTANT', 'NORMAL'].map((level) => (
                <button
                  key={level}
                  onClick={() => setAnnouncementFilter(level)}
                  style={{
                    height: '36px',
                    padding: '0 14px',
                    borderRadius: '8px',
                    border: announcementFilter === level ? '1px solid #1e3a8a' : '1px solid #e2e8f0',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    background: announcementFilter === level ? '#1e3a8a' : '#f8fafc',
                    color: announcementFilter === level ? 'white' : '#64748b',
                    transition: 'all 0.15s',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {level}
                </button>
              ))}
              <button 
                onClick={fetchAnnouncements} 
                title="Refresh notices"
                style={{ 
                  height: '36px', 
                  width: '36px', 
                  borderRadius: '8px', 
                  border: '1px solid #e2e8f0', 
                  background: '#f8fafc', 
                  cursor: 'pointer', 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  transition: 'all 0.15s'
                }}
              >
                <RefreshCw size={15} style={{ color: '#64748b' }} />
              </button>
            </div>
          </div>

          {/* Announcements Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '18px' }}>
            {filteredAnnouncements.map((item) => {
              const priorityUpper = (item.priority || 'Normal').toUpperCase();
              const isUrgent = priorityUpper === 'URGENT';
              const isImportant = priorityUpper === 'IMPORTANT';

              const badgeBg = isUrgent ? '#FEE2E2' : isImportant ? '#FEF3C7' : '#E0E7FF';
              const badgeColor = isUrgent ? '#B91C1C' : isImportant ? '#B45309' : '#3730A3';
              const cardBorder = isUrgent ? '1px solid #FECACA' : isImportant ? '1px solid #FDE68A' : '1px solid var(--color-border)';

              return (
                <div 
                  key={item._id || item.id} 
                  className="chart-card" 
                  style={{ 
                    padding: '22px', 
                    background: 'white', 
                    borderRadius: '14px', 
                    border: cardBorder,
                    display: 'flex', 
                    flexDirection: 'column', 
                    justifyContent: 'space-between',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
                    transition: 'transform 0.2s, box-shadow 0.2s'
                  }}
                >
                  <div>
                    {/* Header: Priority Badge & Date */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <span style={{ 
                        padding: '4px 10px', 
                        borderRadius: '20px', 
                        fontSize: '0.75rem', 
                        fontWeight: 800, 
                        background: badgeBg, 
                        color: badgeColor,
                        letterSpacing: '0.04em'
                      }}>
                        {item.priority || 'Normal'}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.78rem', color: 'var(--color-text-secondary)' }}>
                        <Calendar size={13} />
                        {new Date(item.date || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>

                    {/* Notice Title */}
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1e3a8a', marginBottom: '10px', lineHeight: 1.35 }}>
                      {item.title}
                    </h3>

                    {/* Notice Content */}
                    <p style={{ fontSize: '0.9rem', color: '#475569', lineHeight: 1.55, margin: '0 0 16px 0' }}>
                      {item.content}
                    </p>
                  </div>

                  {/* Card Footer: Target Audience & Author */}
                  <div style={{ 
                    paddingTop: '14px', 
                    borderTop: '1px solid #f1f5f9', 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    fontSize: '0.8rem', 
                    color: 'var(--color-text-secondary)' 
                  }}>
                    <span style={{ 
                      padding: '2px 8px', 
                      borderRadius: '6px', 
                      background: '#f8fafc', 
                      border: '1px solid #e2e8f0', 
                      fontWeight: 600,
                      color: '#475569' 
                    }}>
                      🎯 {item.targetAudience || 'All Students & Parents'}
                    </span>
                    <span style={{ fontWeight: 600, color: '#1e3a8a' }}>
                      ✍️ {item.author || 'Admin Office'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredAnnouncements.length === 0 && (
            <div className="chart-card" style={{ padding: '60px', textAlign: 'center', color: 'var(--color-text-secondary)', background: 'white' }}>
              <Megaphone size={40} style={{ margin: '0 auto 12px', color: '#cbd5e1' }} />
              <div style={{ fontSize: '1.1rem', fontWeight: 600, color: '#1e3a8a' }}>No Announcements Found</div>
              <p style={{ fontSize: '0.88rem', margin: '6px 0 16px' }}>There are no campus notices matching the current criteria.</p>
              <button 
                onClick={() => setIsAnnounceModalOpen(true)}
                style={{ padding: '8px 16px', background: '#4F46E5', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}
              >
                + Post the First Notice
              </button>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: EMERGENCY COMMUNICATION MODE (Section 10.12) */}
      {activeTab === 'emergency' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Active Alert Banner Status */}
          {activeEmergency ? (
            <div style={{ 
              background: 'linear-gradient(135deg, #7F1D1D 0%, #DC2626 100%)', 
              borderRadius: '16px', 
              padding: '24px', 
              color: 'white',
              boxShadow: '0 10px 25px rgba(220, 38, 38, 0.4)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '16px'
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                  <span style={{ background: 'white', color: '#DC2626', fontWeight: 900, fontSize: '0.75rem', padding: '3px 10px', borderRadius: '12px' }}>
                    BROADCASTING ACTIVE
                  </span>
                  <span style={{ fontSize: '0.85rem', opacity: 0.9 }}>
                    Published: {new Date(activeEmergency.publishedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} by {activeEmergency.publishedBy}
                  </span>
                </div>
                <h2 style={{ margin: '0 0 6px', fontSize: '1.4rem', fontWeight: 800 }}>{activeEmergency.title}</h2>
                <p style={{ margin: '0 0 10px', fontSize: '0.95rem', maxWidth: '800px', lineHeight: 1.5, opacity: 0.95 }}>
                  {activeEmergency.message}
                </p>
                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '8px 14px', borderRadius: '8px', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                  <strong>Action Required:</strong> {activeEmergency.actionRequired}
                </div>
              </div>
              <button
                onClick={handleRevokeEmergency}
                style={{
                  background: 'white',
                  color: '#DC2626',
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '10px',
                  fontWeight: 800,
                  fontSize: '0.95rem',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                }}
              >
                Deactivate & Revoke Broadcast
              </button>
            </div>
          ) : (
            <div className="chart-card" style={{ 
              padding: '20px 24px', 
              background: 'white', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '16px', 
              borderRadius: '16px',
              border: '1px solid #e2e8f0',
              borderLeft: '5px solid #16a34a',
              boxShadow: '0 2px 10px rgba(0,0,0,0.02)'
            }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(22, 163, 74, 0.12)', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CheckCircle2 size={24} />
              </div>
              <div>
                <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#1e3a8a' }}>All Clear — Normal Campus Protocol</h4>
                <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#64748b' }}>
                  No active emergency broadcasts. When activated, urgent banners will immediately flash on all student, parent, and faculty portals.
                </p>
              </div>
            </div>
          )}

          {/* Quick Scenario Templates */}
          <div className="chart-card" style={{ 
            padding: '24px', 
            background: 'white',
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 2px 10px rgba(0,0,0,0.02)'
          }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#1e3a8a', marginBottom: '8px' }}>
              🚨 Activate High-Visibility Emergency Broadcast
            </h3>
            <p style={{ fontSize: '0.88rem', color: '#64748b', marginBottom: '20px' }}>
              Select a quick emergency template or customize the broadcast fields below. Broadcasts appear instantly on all logged-in views.
            </p>

            {/* Template Buttons */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px', marginBottom: '24px' }}>
              {[
                {
                  label: '⛈️ Severe Weather / Flash Rain',
                  title: 'Severe Weather Warning & Early Dispersal',
                  msg: 'Due to severe torrential rains and waterlogging advisory issued by local authorities, campus operations will suspend at 01:30 PM today. School buses will depart 2 hours ahead of regular schedule.',
                  action: 'Parents please coordinate with bus transport coordinators or pick up students directly from the main gate.'
                },
                {
                  label: '🔒 Security & Campus Lockdown Protocol',
                  title: 'Campus Perimeter Security Protocol Activated',
                  msg: 'As a precautionary measure following local civic alerts, the campus main gates are locked. All students and staff remain safely inside classrooms with teacher supervision.',
                  action: 'No visitors allowed on campus until the regional security advisory is cleared.'
                },
                {
                  label: '⚡ Utility / Power Grid Interruption',
                  title: 'City Power Interruption — Afternoon Classes Reorganized',
                  msg: 'Regional power transmission breakdown reported. Backup generators powering critical computer labs and exams. Afternoon sports activities cancelled.',
                  action: 'Standard day dispersal will continue as scheduled at 03:00 PM.'
                }
              ].map((template, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setEmergencyForm({
                    title: template.title,
                    message: template.msg,
                    severity: 'Urgent',
                    actionRequired: template.action
                  })}
                  style={{
                    padding: '14px 16px',
                    textAlign: 'left',
                    borderRadius: '10px',
                    border: '1px solid #e2e8f0',
                    background: '#f8fafc',
                    cursor: 'pointer',
                    transition: 'all 0.15s'
                  }}
                  onMouseOver={e => e.currentTarget.style.borderColor = '#dc2626'}
                  onMouseOut={e => e.currentTarget.style.borderColor = '#e2e8f0'}
                >
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#1e3a8a', marginBottom: '4px' }}>{template.label}</div>
                  <div style={{ fontSize: '0.78rem', color: '#64748b', lineHeight: 1.4 }}>{template.title}</div>
                </button>
              ))}
            </div>

            {/* Broadcast Form */}
            <form onSubmit={handlePublishEmergency} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#1e3a8a', marginBottom: '6px' }}>
                    Alert Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={emergencyForm.title}
                    onChange={(e) => setEmergencyForm({ ...emergencyForm, title: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#1e3a8a', marginBottom: '6px' }}>
                    Severity
                  </label>
                  <select
                    value={emergencyForm.severity}
                    onChange={(e) => setEmergencyForm({ ...emergencyForm, severity: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', background: 'white' }}
                  >
                    <option value="Urgent">Urgent (High Visibility)</option>
                    <option value="Critical">Critical (Lockdown / Immediate)</option>
                    <option value="Advisory">Advisory (Notice Only)</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#1e3a8a', marginBottom: '6px' }}>
                  Detailed Emergency Broadcast Message *
                </label>
                <textarea
                  rows={3}
                  required
                  value={emergencyForm.message}
                  onChange={(e) => setEmergencyForm({ ...emergencyForm, message: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', resize: 'vertical' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#1e3a8a', marginBottom: '6px' }}>
                  Action Required by Parents / Faculty / Students
                </label>
                <input
                  type="text"
                  value={emergencyForm.actionRequired}
                  onChange={(e) => setEmergencyForm({ ...emergencyForm, actionRequired: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
                <button
                  type="submit"
                  disabled={isPublishingEmergency}
                  style={{
                    padding: '12px 28px',
                    borderRadius: '10px',
                    border: 'none',
                    background: '#DC2626',
                    color: 'white',
                    fontWeight: 800,
                    fontSize: '0.95rem',
                    cursor: isPublishingEmergency ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 15px rgba(220, 38, 38, 0.35)'
                  }}
                >
                  <ShieldAlert size={18} />
                  <span>{isPublishingEmergency ? 'Broadcasting...' : 'Broadcast Emergency Campus-Wide'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TAB 3: EVENTS CALENDAR & MANAGEMENT (Section 9.20) */}
      {activeTab === 'events' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* Filter Bar */}
          <div className="chart-card" style={{ 
            padding: '14px 20px', 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            flexWrap: 'wrap', 
            gap: '14px', 
            background: 'white',
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 2px 10px rgba(0,0,0,0.02)'
          }}>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginRight: '4px' }}>
                <Filter size={15} style={{ color: '#64748b' }} />
                <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>Category:</span>
              </div>
              {['ALL', 'ACADEMIC', 'MEETING', 'SPORTS', 'EXAM'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setEventCategoryFilter(cat)}
                  style={{
                    height: '36px',
                    padding: '0 14px',
                    borderRadius: '8px',
                    border: eventCategoryFilter === cat ? '1px solid #0F766E' : '1px solid #e2e8f0',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    background: eventCategoryFilter === cat ? '#0F766E' : '#f8fafc',
                    color: eventCategoryFilter === cat ? 'white' : '#64748b',
                    transition: 'all 0.15s',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>

            <button 
              onClick={fetchEvents} 
              title="Refresh calendar"
              style={{ 
                height: '36px', 
                width: '36px', 
                borderRadius: '8px', 
                border: '1px solid #e2e8f0', 
                background: '#f8fafc', 
                cursor: 'pointer', 
                display: 'inline-flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                transition: 'all 0.15s'
              }}
            >
              <RefreshCw size={15} style={{ color: '#64748b' }} />
            </button>
          </div>

          {/* Events Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '16px' }}>
            {filteredEvents.map((evt) => {
              const categoryColor = evt.category === 'Sports' ? '#059669' : evt.category === 'Meeting' ? '#D97706' : evt.category === 'Exam' ? '#DC2626' : '#4F46E5';
              const categoryBg = evt.category === 'Sports' ? '#dcfce7' : evt.category === 'Meeting' ? '#fef3c7' : evt.category === 'Exam' ? '#fee2e2' : '#e0e7ff';

              return (
                <div 
                  key={evt.id} 
                  className="chart-card" 
                  style={{ 
                    padding: '22px', 
                    background: 'white', 
                    borderRadius: '14px', 
                    border: '1px solid var(--color-border)',
                    display: 'flex', 
                    flexDirection: 'column', 
                    justifyContent: 'space-between',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.03)'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <span style={{ 
                        padding: '3px 10px', 
                        borderRadius: '20px', 
                        fontSize: '0.75rem', 
                        fontWeight: 800, 
                        background: categoryBg, 
                        color: categoryColor 
                      }}>
                        {evt.category}
                      </span>
                      <span style={{ 
                        padding: '2px 8px', 
                        borderRadius: '6px', 
                        fontSize: '0.72rem', 
                        fontWeight: 700, 
                        background: '#f1f5f9', 
                        color: '#475569' 
                      }}>
                        {evt.status}
                      </span>
                    </div>

                    <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#1e3a8a', marginBottom: '10px' }}>
                      {evt.title}
                    </h3>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.85rem', color: '#64748b', marginBottom: '14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Calendar size={14} style={{ color: '#0F766E' }} />
                        <span><strong>{evt.date}</strong> ({evt.time})</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <MapPin size={14} style={{ color: '#EF4444' }} />
                        <span>{evt.location}</span>
                      </div>
                    </div>
                  </div>

                  <div style={{ paddingTop: '12px', borderTop: '1px solid #f1f5f9', fontSize: '0.8rem', color: 'var(--color-text-secondary)', display: 'flex', justifyContent: 'space-between' }}>
                    <span>Audience: <strong>{evt.audience}</strong></span>
                    <span style={{ color: '#0F766E', fontWeight: 700 }}>ID: {evt.id}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 4: GRIEVANCE MANAGEMENT (Section 9.21) */}
      {activeTab === 'grievances' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* Filter Bar */}
          <div className="chart-card" style={{ 
            padding: '14px 20px', 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            flexWrap: 'wrap', 
            gap: '14px', 
            background: 'white',
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 2px 10px rgba(0,0,0,0.02)'
          }}>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginRight: '4px' }}>
                <Filter size={15} style={{ color: '#64748b' }} />
                <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>Status:</span>
              </div>
              {['ALL', 'OPEN', 'IN PROGRESS', 'RESOLVED'].map((st) => (
                <button
                  key={st}
                  onClick={() => setGrievanceStatusFilter(st)}
                  style={{
                    height: '36px',
                    padding: '0 14px',
                    borderRadius: '8px',
                    border: grievanceStatusFilter === st ? '1px solid #F59E0B' : '1px solid #e2e8f0',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    background: grievanceStatusFilter === st ? '#F59E0B' : '#f8fafc',
                    color: grievanceStatusFilter === st ? 'white' : '#64748b',
                    transition: 'all 0.15s',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {st}
                </button>
              ))}
            </div>

            <button 
              onClick={fetchGrievances} 
              title="Refresh tickets"
              style={{ 
                height: '36px', 
                width: '36px', 
                borderRadius: '8px', 
                border: '1px solid #e2e8f0', 
                background: '#f8fafc', 
                cursor: 'pointer', 
                display: 'inline-flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                transition: 'all 0.15s'
              }}
            >
              <RefreshCw size={15} style={{ color: '#64748b' }} />
            </button>
          </div>

          {/* Grievances Ticket Table */}
          <div className="chart-card" style={{ 
            padding: 0, 
            overflow: 'hidden', 
            background: 'white',
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 2px 10px rgba(0,0,0,0.02)'
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
              <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                <tr>
                  <th style={{ padding: '14px 20px' }}>Ticket ID & Subject</th>
                  <th style={{ padding: '14px 16px' }}>Category</th>
                  <th style={{ padding: '14px 16px' }}>Raised By / Student</th>
                  <th style={{ padding: '14px 16px' }}>Priority</th>
                  <th style={{ padding: '14px 16px' }}>Status</th>
                  <th style={{ padding: '14px 20px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredGrievances.map((ticket) => {
                  const isResolved = ticket.status === 'Resolved';
                  const isInProgress = ticket.status === 'In Progress';
                  const statusBg = isResolved ? '#dcfce7' : isInProgress ? '#fef3c7' : '#fee2e2';
                  const statusColor = isResolved ? '#166534' : isInProgress ? '#92400e' : '#991b1b';

                  return (
                    <tr key={ticket.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '16px 20px' }}>
                        <div style={{ fontWeight: 800, color: '#1e3a8a', fontSize: '0.92rem' }}>{ticket.title}</div>
                        <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '2px' }}>
                          Ticket: <strong style={{ color: '#4F46E5' }}>{ticket.id}</strong> • Logged: {ticket.date}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: '#475569', marginTop: '4px', fontStyle: 'italic' }}>
                          "{ticket.remarks}"
                        </div>
                      </td>
                      <td style={{ padding: '16px 16px' }}>
                        <span style={{ padding: '4px 8px', borderRadius: '6px', background: '#f1f5f9', fontWeight: 600, color: '#475569', fontSize: '0.78rem' }}>
                          {ticket.category}
                        </span>
                      </td>
                      <td style={{ padding: '16px 16px' }}>
                        <div style={{ fontWeight: 600, color: '#1e293b' }}>{ticket.raisedBy}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{ticket.student}</div>
                      </td>
                      <td style={{ padding: '16px 16px' }}>
                        <span style={{ 
                          fontWeight: 700, 
                          color: ticket.priority === 'High' ? '#dc2626' : ticket.priority === 'Medium' ? '#d97706' : '#16a34a',
                          fontSize: '0.8rem' 
                        }}>
                          {ticket.priority}
                        </span>
                      </td>
                      <td style={{ padding: '16px 16px' }}>
                        <span style={{ padding: '4px 10px', borderRadius: '14px', fontSize: '0.75rem', fontWeight: 800, background: statusBg, color: statusColor }}>
                          {ticket.status}
                        </span>
                      </td>
                      <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                        {!isResolved ? (
                          <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                            {ticket.status === 'Open' && (
                              <button
                                onClick={() => handleUpdateGrievanceStatus(ticket.id, 'In Progress')}
                                style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', background: 'white', color: '#4F46E5', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
                              >
                                Mark In Progress
                              </button>
                            )}
                            <button
                              onClick={() => handleUpdateGrievanceStatus(ticket.id, 'Resolved')}
                              style={{ padding: '6px 12px', borderRadius: '6px', border: 'none', background: '#16a34a', color: 'white', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
                            >
                              Resolve
                            </button>
                          </div>
                        ) : (
                          <span style={{ fontSize: '0.78rem', color: '#16a34a', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <Check size={14} /> Closed
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: DIRECT MESSAGES & STAFF/STUDENT DIRECTORY */}
      {activeTab === 'messages' && (
        <div style={{ display: 'flex', gap: '20px', width: '100%', height: 'calc(100vh - 300px)', minHeight: '560px' }}>
          
          {/* Left Column: Live Contacts Directory */}
          <div className="chart-card" style={{ 
            width: '360px', 
            display: 'flex', 
            flexDirection: 'column', 
            padding: 0, 
            overflow: 'hidden', 
            background: 'white',
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 2px 10px rgba(0,0,0,0.02)'
          }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-border)', background: 'white' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontWeight: 700, fontSize: '0.95rem', color: '#1e3a8a' }}>Campus Directory</span>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, background: '#E0E7FF', color: '#4F46E5', padding: '2px 8px', borderRadius: '12px' }}>
                  {filteredContacts.length} Verified
                </span>
              </div>
              <div className="search-bar" style={{ width: '100%' }}>
                <Search size={16} />
                <input 
                  type="text" 
                  placeholder="Search faculty or students..."
                  value={contactSearch}
                  onChange={(e) => setContactSearch(e.target.value)}
                />
              </div>
            </div>

            {/* Contacts Scrollable List */}
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {filteredContacts.map(c => {
                const isSelected = selectedContact && (selectedContact.id === c.id || selectedContact._id === c._id);
                const isStudent = c.role?.startsWith('Student');

                return (
                  <div 
                    key={c.id || c._id}
                    onClick={() => setSelectedContact(c)}
                    style={{ 
                      padding: '14px 18px', 
                      display: 'flex', 
                      gap: '12px', 
                      cursor: 'pointer', 
                      borderBottom: '1px solid #f8fafc', 
                      backgroundColor: isSelected ? 'rgba(79, 70, 229, 0.08)' : 'transparent',
                      borderLeft: isSelected ? '4px solid #4F46E5' : '4px solid transparent',
                      transition: 'background-color 0.15s'
                    }}
                  >
                    <div style={{ 
                      width: '42px', 
                      height: '42px', 
                      borderRadius: '50%', 
                      backgroundColor: isStudent ? '#0F766E' : '#4F46E5', 
                      color: 'white', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      fontWeight: 700, 
                      fontSize: '1rem',
                      flexShrink: 0 
                    }}>
                      {c.avatar || c.name?.charAt(0) || 'U'}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.92rem', color: '#1e3a8a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {c.name}
                        </span>
                      </div>
                      <div style={{ 
                        fontSize: '0.78rem', 
                        color: isStudent ? '#0F766E' : '#4F46E5', 
                        fontWeight: 600, 
                        marginTop: '2px',
                        overflow: 'hidden', 
                        textOverflow: 'ellipsis', 
                        whiteSpace: 'nowrap' 
                      }}>
                        {c.role} {c.department ? `• ${c.department}` : ''}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {c.email || c.phone || 'Ready for contact'}
                      </div>
                    </div>
                  </div>
                );
              })}

              {filteredContacts.length === 0 && (
                <div style={{ padding: '30px 20px', textAlign: 'center', color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>
                  No contacts found matching "{contactSearch}"
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Interactive Chat & Message Panel */}
          <div className="chart-card" style={{ 
            flex: 1, 
            display: 'flex', 
            flexDirection: 'column', 
            padding: 0, 
            overflow: 'hidden', 
            background: 'white',
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 2px 10px rgba(0,0,0,0.02)'
          }}>
            {selectedContact ? (
              <>
                {/* Chat Panel Header */}
                <div style={{ 
                  padding: '16px 24px', 
                  borderBottom: '1px solid var(--color-border)', 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  background: 'white'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{ 
                      width: '46px', 
                      height: '46px', 
                      borderRadius: '50%', 
                      backgroundColor: selectedContact.role?.startsWith('Student') ? '#0F766E' : '#4F46E5', 
                      color: 'white', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      fontWeight: 700, 
                      fontSize: '1.2rem' 
                    }}>
                      {selectedContact.avatar || selectedContact.name?.charAt(0)}
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0, color: '#1e3a8a' }}>{selectedContact.name}</h3>
                        <span style={{ 
                          fontSize: '0.72rem', 
                          fontWeight: 700, 
                          background: 'rgba(22, 163, 74, 0.1)', 
                          color: '#16a34a', 
                          padding: '2px 8px', 
                          borderRadius: '10px' 
                        }}>
                          Active
                        </span>
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#64748b', display: 'flex', gap: '12px', marginTop: '3px' }}>
                        <span>{selectedContact.role}</span>
                        {selectedContact.email && <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Mail size={12} /> {selectedContact.email}</span>}
                        {selectedContact.phone && <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Phone size={12} /> {selectedContact.phone}</span>}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Chat Thread Messages Stream */}
                <div style={{ 
                  flex: 1, 
                  padding: '24px', 
                  overflowY: 'auto', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: '16px', 
                  backgroundColor: '#f8fafc' 
                }}>
                  {/* System Initial Message */}
                  <div style={{ textAlign: 'center', margin: '8px 0' }}>
                    <span style={{ 
                      padding: '6px 16px', 
                      backgroundColor: 'white', 
                      border: '1px solid #e2e8f0', 
                      borderRadius: '16px', 
                      fontSize: '0.78rem', 
                      color: '#64748b', 
                      fontWeight: 600,
                      boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
                    }}>
                      💬 Direct communication thread initialized with {selectedContact.name} ({selectedContact.role})
                    </span>
                  </div>

                  {/* Preloaded Context Greeting */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                    <div style={{ 
                      maxWidth: '75%', 
                      padding: '12px 18px', 
                      borderRadius: '16px', 
                      borderBottomLeftRadius: '4px',
                      backgroundColor: 'white',
                      border: '1px solid #e2e8f0',
                      color: '#1e293b',
                      fontSize: '0.9rem',
                      lineHeight: 1.5,
                      boxShadow: '0 2px 5px rgba(0,0,0,0.03)'
                    }}>
                      Hello! This is <strong>{selectedContact.name}</strong> ({selectedContact.role}). Feel free to send official academic notifications, parent follow-ups, or meeting updates through this channel.
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '4px', paddingLeft: '6px' }}>
                      Today 09:00 AM
                    </div>
                  </div>

                  {/* Dynamic User Messages */}
                  {currentChatMessages.map((msg) => (
                    <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: msg.isMine ? 'flex-end' : 'flex-start' }}>
                      <div style={{ 
                        maxWidth: '75%', 
                        padding: '12px 18px', 
                        borderRadius: '16px', 
                        borderBottomRightRadius: msg.isMine ? '4px' : '16px',
                        borderBottomLeftRadius: msg.isMine ? '16px' : '4px',
                        backgroundColor: msg.isMine ? '#4F46E5' : 'white',
                        color: msg.isMine ? 'white' : '#1e293b',
                        fontSize: '0.9rem',
                        lineHeight: 1.5,
                        boxShadow: '0 2px 6px rgba(0,0,0,0.05)',
                        border: msg.isMine ? 'none' : '1px solid #e2e8f0'
                      }}>
                        {msg.text}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '4px', padding: '0 6px' }}>
                        {msg.time}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Quick Reply Chips */}
                <div style={{ padding: '8px 20px', background: 'white', borderTop: '1px solid #f1f5f9', display: 'flex', gap: '8px', overflowX: 'auto' }}>
                  {[
                    'Please review the student attendance report.',
                    'Meeting confirmed for tomorrow at 10 AM.',
                    'Fee clearance acknowledged, thank you.',
                    'Kindly share the latest grade assessment.'
                  ].map((quickText, idx) => (
                    <button
                      key={idx}
                      onClick={() => setReplyText(quickText)}
                      style={{
                        padding: '4px 10px',
                        borderRadius: '14px',
                        border: '1px solid #e2e8f0',
                        background: '#f8fafc',
                        fontSize: '0.75rem',
                        color: '#475569',
                        whiteSpace: 'nowrap',
                        cursor: 'pointer',
                        fontWeight: 500,
                        transition: 'all 0.15s'
                      }}
                      onMouseOver={e => e.currentTarget.style.background = '#e0e7ff'}
                      onMouseOut={e => e.currentTarget.style.background = '#f8fafc'}
                    >
                      {quickText}
                    </button>
                  ))}
                </div>

                {/* Chat Input Field */}
                <div style={{ padding: '16px 20px', borderTop: '1px solid var(--color-border)', backgroundColor: 'white' }}>
                  <form 
                    onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
                    style={{ display: 'flex', gap: '12px', alignItems: 'center' }}
                  >
                    <div style={{ 
                      flex: 1, 
                      display: 'flex', 
                      alignItems: 'center', 
                      backgroundColor: '#f8fafc', 
                      borderRadius: '24px', 
                      padding: '10px 18px', 
                      border: '1px solid #e2e8f0' 
                    }}>
                      <input 
                        type="text" 
                        placeholder={`Message ${selectedContact.name}...`}
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        style={{ flex: 1, border: 'none', outline: 'none', backgroundColor: 'transparent', fontSize: '0.92rem', color: '#1e293b' }}
                      />
                    </div>
                    <button 
                      type="submit"
                      disabled={!replyText.trim()}
                      style={{ 
                        padding: '12px 18px', 
                        borderRadius: '20px', 
                        border: 'none', 
                        backgroundColor: replyText.trim() ? '#4F46E5' : '#e2e8f0', 
                        color: 'white', 
                        cursor: replyText.trim() ? 'pointer' : 'not-allowed', 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '6px',
                        fontWeight: 700,
                        fontSize: '0.88rem',
                        transition: 'background-color 0.2s',
                        boxShadow: replyText.trim() ? '0 4px 12px rgba(79, 70, 229, 0.25)' : 'none'
                      }}
                    >
                      <span>Send</span>
                      <SendHorizontal size={16} />
                    </button>
                  </form>
                </div>
              </>
            ) : (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-secondary)', padding: '40px' }}>
                <MessageSquare size={48} style={{ color: '#cbd5e1', marginBottom: '16px' }} />
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1e3a8a', marginBottom: '6px' }}>Select a Contact</h3>
                <p style={{ fontSize: '0.88rem', maxWidth: '320px', textAlign: 'center' }}>Choose any faculty member or student from the left directory to start a direct message thread.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CREATE ANNOUNCEMENT MODAL */}
      {isAnnounceModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.45)', backdropFilter: 'blur(5px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, padding: '20px'
        }}>
          <div style={{
            background: 'white', borderRadius: '16px', width: '100%', maxWidth: '540px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.15)', overflow: 'hidden',
            border: '1px solid rgba(226, 232, 240, 0.9)'
          }}>
            <div style={{
              padding: '20px 24px', borderBottom: '1px solid #e2e8f0',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)'
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#1e3a8a' }}>
                  📢 Post Official Notice
                </h3>
                <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: '#64748b' }}>
                  Publish real-time announcements to the campus bulletin
                </p>
              </div>
              <button
                onClick={() => setIsAnnounceModalOpen(false)}
                style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              >
                <X size={16} style={{ color: '#64748b' }} />
              </button>
            </div>

            <form onSubmit={handleCreateAnnouncement} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#1e3a8a', marginBottom: '6px' }}>
                  Notice Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Annual Sports Meet 2026 / Winter Break Schedule"
                  value={noticeForm.title}
                  onChange={(e) => setNoticeForm({ ...noticeForm, title: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#1e3a8a', marginBottom: '6px' }}>
                    Priority Level
                  </label>
                  <select
                    value={noticeForm.priority}
                    onChange={(e) => setNoticeForm({ ...noticeForm, priority: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', background: 'white' }}
                  >
                    <option value="Normal">Normal</option>
                    <option value="Important">Important</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#1e3a8a', marginBottom: '6px' }}>
                    Target Audience
                  </label>
                  <select
                    value={noticeForm.targetAudience}
                    onChange={(e) => setNoticeForm({ ...noticeForm, targetAudience: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', background: 'white' }}
                  >
                    <option value="All Students & Parents">All Students & Parents</option>
                    <option value="Faculty & Staff Only">Faculty & Staff Only</option>
                    <option value="High School (Grades 9-12)">High School (Grades 9-12)</option>
                    <option value="Primary School (Grades 1-5)">Primary School (Grades 1-5)</option>
                    <option value="Administration">Administration</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#1e3a8a', marginBottom: '6px' }}>
                  Author / Issuing Body
                </label>
                <input
                  type="text"
                  placeholder="e.g. Principal Office / Physical Education Dept"
                  value={noticeForm.author}
                  onChange={(e) => setNoticeForm({ ...noticeForm, author: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#1e3a8a', marginBottom: '6px' }}>
                  Notice Content & Instructions *
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Type the full announcement details, deadlines, and instructions..."
                  value={noticeForm.content}
                  onChange={(e) => setNoticeForm({ ...noticeForm, content: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setIsAnnounceModalOpen(false)}
                  style={{ padding: '10px 18px', borderRadius: '8px', border: '1px solid #cbd5e1', background: 'white', color: '#64748b', fontWeight: 600, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingNotice}
                  style={{ 
                    padding: '10px 22px', 
                    borderRadius: '8px', 
                    border: 'none', 
                    background: '#4F46E5', 
                    color: 'white', 
                    fontWeight: 700, 
                    cursor: isSubmittingNotice ? 'not-allowed' : 'pointer',
                    boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)'
                  }}
                >
                  {isSubmittingNotice ? 'Publishing...' : 'Publish to Notice Board'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE EVENT MODAL */}
      {isEventModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.45)', backdropFilter: 'blur(5px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, padding: '20px'
        }}>
          <div style={{
            background: 'white', borderRadius: '16px', width: '100%', maxWidth: '520px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.15)', overflow: 'hidden',
            border: '1px solid rgba(226, 232, 240, 0.9)'
          }}>
            <div style={{
              padding: '20px 24px', borderBottom: '1px solid #e2e8f0',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              background: 'linear-gradient(135deg, #f0fdf4 0%, #e2e8f0 100%)'
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#0f766e' }}>
                  📅 Schedule Campus Event
                </h3>
                <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: '#64748b' }}>
                  Register sports meets, exams, PTMs, and cultural festivals
                </p>
              </div>
              <button
                onClick={() => setIsEventModalOpen(false)}
                style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              >
                <X size={16} style={{ color: '#64748b' }} />
              </button>
            </div>

            <form onSubmit={handleCreateEvent} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#1e3a8a', marginBottom: '6px' }}>
                  Event Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Annual Sports Meet 2026 / Science Fair"
                  value={eventForm.title}
                  onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#1e3a8a', marginBottom: '6px' }}>
                    Event Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={eventForm.date}
                    onChange={(e) => setEventForm({ ...eventForm, date: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#1e3a8a', marginBottom: '6px' }}>
                    Timing
                  </label>
                  <input
                    type="text"
                    value={eventForm.time}
                    onChange={(e) => setEventForm({ ...eventForm, time: e.target.value })}
                    placeholder="09:00 AM - 01:00 PM"
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#1e3a8a', marginBottom: '6px' }}>
                    Category
                  </label>
                  <select
                    value={eventForm.category}
                    onChange={(e) => setEventForm({ ...eventForm, category: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', background: 'white' }}
                  >
                    <option value="Academic">Academic</option>
                    <option value="Sports">Sports</option>
                    <option value="Meeting">Meeting (PTM)</option>
                    <option value="Exam">Examination</option>
                    <option value="Cultural">Cultural</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#1e3a8a', marginBottom: '6px' }}>
                    Audience
                  </label>
                  <input
                    type="text"
                    value={eventForm.audience}
                    onChange={(e) => setEventForm({ ...eventForm, audience: e.target.value })}
                    placeholder="All Students & Parents"
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#1e3a8a', marginBottom: '6px' }}>
                  Venue / Location
                </label>
                <input
                  type="text"
                  value={eventForm.location}
                  onChange={(e) => setEventForm({ ...eventForm, location: e.target.value })}
                  placeholder="Main Auditorium / Ground / Lab"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setIsEventModalOpen(false)}
                  style={{ padding: '10px 18px', borderRadius: '8px', border: '1px solid #cbd5e1', background: 'white', color: '#64748b', fontWeight: 600, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ 
                    padding: '10px 22px', 
                    borderRadius: '8px', 
                    border: 'none', 
                    background: '#0F766E', 
                    color: 'white', 
                    fontWeight: 700, 
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(15, 118, 110, 0.3)'
                  }}
                >
                  Confirm Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE GRIEVANCE MODAL */}
      {isGrievanceModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.45)', backdropFilter: 'blur(5px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, padding: '20px'
        }}>
          <div style={{
            background: 'white', borderRadius: '16px', width: '100%', maxWidth: '520px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.15)', overflow: 'hidden',
            border: '1px solid rgba(226, 232, 240, 0.9)'
          }}>
            <div style={{
              padding: '20px 24px', borderBottom: '1px solid #e2e8f0',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              background: 'linear-gradient(135deg, #fffbeb 0%, #e2e8f0 100%)'
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#b45309' }}>
                  🎫 Log Grievance / Support Ticket
                </h3>
                <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: '#64748b' }}>
                  Formal ticket assignment and resolution tracking
                </p>
              </div>
              <button
                onClick={() => setIsGrievanceModalOpen(false)}
                style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              >
                <X size={16} style={{ color: '#64748b' }} />
              </button>
            </div>

            <form onSubmit={handleCreateGrievance} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#1e3a8a', marginBottom: '6px' }}>
                  Issue Subject *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Bus Route 4 Repeated Delay / Library Book Renewal"
                  value={grievanceForm.title}
                  onChange={(e) => setGrievanceForm({ ...grievanceForm, title: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#1e3a8a', marginBottom: '6px' }}>
                    Category
                  </label>
                  <select
                    value={grievanceForm.category}
                    onChange={(e) => setGrievanceForm({ ...grievanceForm, category: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', background: 'white' }}
                  >
                    <option value="Transport">Transport</option>
                    <option value="Facilities">Facilities & Campus</option>
                    <option value="Fees">Fees & Finance</option>
                    <option value="Academic">Academic / Teachers</option>
                    <option value="Hostel / Canteen">Hostel / Canteen</option>
                    <option value="General">General</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#1e3a8a', marginBottom: '6px' }}>
                    Priority
                  </label>
                  <select
                    value={grievanceForm.priority}
                    onChange={(e) => setGrievanceForm({ ...grievanceForm, priority: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', background: 'white' }}
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#1e3a8a', marginBottom: '6px' }}>
                    Raised By
                  </label>
                  <input
                    type="text"
                    value={grievanceForm.raisedBy}
                    onChange={(e) => setGrievanceForm({ ...grievanceForm, raisedBy: e.target.value })}
                    placeholder="Parent / Staff Name"
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#1e3a8a', marginBottom: '6px' }}>
                    Associated Student / Class
                  </label>
                  <input
                    type="text"
                    value={grievanceForm.student}
                    onChange={(e) => setGrievanceForm({ ...grievanceForm, student: e.target.value })}
                    placeholder="e.g. Aarav Patel (Class 10 - A)"
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#1e3a8a', marginBottom: '6px' }}>
                  Incident Description & Request Details
                </label>
                <textarea
                  rows={3}
                  value={grievanceForm.description}
                  onChange={(e) => setGrievanceForm({ ...grievanceForm, description: e.target.value })}
                  placeholder="Provide concrete details to assist administration in speedy investigation..."
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setIsGrievanceModalOpen(false)}
                  style={{ padding: '10px 18px', borderRadius: '8px', border: '1px solid #cbd5e1', background: 'white', color: '#64748b', fontWeight: 600, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ 
                    padding: '10px 22px', 
                    borderRadius: '8px', 
                    border: 'none', 
                    background: '#F59E0B', 
                    color: 'white', 
                    fontWeight: 700, 
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)'
                  }}
                >
                  Submit Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Communication;
