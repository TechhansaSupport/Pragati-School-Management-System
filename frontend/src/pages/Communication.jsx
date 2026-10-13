import React, { useState, useEffect } from 'react';
import { 
  Search, Send, Bell, MessageSquare, Megaphone, Plus, 
  X, CheckCircle2, User, Mail, Phone, Calendar, Clock,
  AlertTriangle, Filter, Sparkles, RefreshCw, SendHorizontal
} from 'lucide-react';

const Communication = () => {
  const tenantSlug = sessionStorage.getItem('tenantSlug') || '';
  const userInfo = JSON.parse(sessionStorage.getItem('userInfo') || '{}');
  const token = userInfo.token || sessionStorage.getItem('token') || '';

  // Tab: 'announcements' or 'messages'
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

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchAnnouncements(), fetchContacts()]).finally(() => {
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

  // Calculate statistics
  const totalAnnouncements = announcements.length;
  const urgentCount = announcements.filter(a => a.priority === 'Urgent').length;
  const staffCount = contacts.filter(c => !c.role?.startsWith('Student')).length;
  const studentCount = contacts.filter(c => c.role?.startsWith('Student')).length;

  // Active chat thread messages
  const activeContactId = selectedContact?.id || selectedContact?._id;
  const currentChatMessages = activeContactId ? (messagesByContact[activeContactId] || []) : [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
      
      {/* Top Banner & KPI Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <div className="chart-card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '16px', background: 'white' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(79, 70, 229, 0.1)', color: '#4F46E5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Megaphone size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>Live Bulletins</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#1e3a8a' }}>{totalAnnouncements}</div>
          </div>
        </div>

        <div className="chart-card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '16px', background: 'white' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(239, 68, 68, 0.1)', color: '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <AlertTriangle size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>Urgent Broadcasts</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#991b1b' }}>{urgentCount}</div>
          </div>
        </div>

        <div className="chart-card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '16px', background: 'white' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(15, 118, 110, 0.1)', color: '#0F766E', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <User size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>Faculty Contacts</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f766e' }}>{staffCount}</div>
          </div>
        </div>

        <div className="chart-card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '16px', background: 'white' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(245, 158, 11, 0.1)', color: '#F59E0B', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <MessageSquare size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>Active Students</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#b45309' }}>{studentCount}</div>
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
        <div style={{ display: 'flex', gap: '8px', background: 'white', padding: '4px', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
          <button 
            onClick={() => setActiveTab('announcements')}
            style={{ 
              padding: '8px 20px', 
              borderRadius: '8px', 
              border: 'none', 
              fontWeight: 700, 
              fontSize: '0.9rem', 
              cursor: 'pointer', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px',
              backgroundColor: activeTab === 'announcements' ? '#4F46E5' : 'transparent', 
              color: activeTab === 'announcements' ? 'white' : 'var(--color-text-secondary)', 
              transition: 'all 0.2s',
              boxShadow: activeTab === 'announcements' ? '0 2px 8px rgba(79, 70, 229, 0.3)' : 'none'
            }}
          >
            <Megaphone size={16} /> Notice Board & Bulletins ({totalAnnouncements})
          </button>
          <button 
            onClick={() => setActiveTab('messages')}
            style={{ 
              padding: '8px 20px', 
              borderRadius: '8px', 
              border: 'none', 
              fontWeight: 700, 
              fontSize: '0.9rem', 
              cursor: 'pointer', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px',
              backgroundColor: activeTab === 'messages' ? '#4F46E5' : 'transparent', 
              color: activeTab === 'messages' ? 'white' : 'var(--color-text-secondary)', 
              transition: 'all 0.2s',
              boxShadow: activeTab === 'messages' ? '0 2px 8px rgba(79, 70, 229, 0.3)' : 'none'
            }}
          >
            <MessageSquare size={16} /> Direct Messages & Contacts ({contacts.length})
          </button>
        </div>

        {activeTab === 'announcements' && (
          <button 
            onClick={() => setIsAnnounceModalOpen(true)}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px', 
              background: '#4F46E5', 
              color: 'white', 
              border: 'none', 
              padding: '10px 18px', 
              borderRadius: '10px', 
              fontWeight: 700, 
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(79, 70, 229, 0.25)'
            }}
          >
            <Plus size={18} /> Post New Notice
          </button>
        )}
      </div>

      {/* Main Content Area */}
      {activeTab === 'announcements' ? (
        /* NOTICE BOARD / ANNOUNCEMENTS TAB */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* Filter Bar */}
          <div className="chart-card" style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', background: 'white' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: '240px' }}>
              <div className="search-bar" style={{ width: '100%', maxWidth: '340px' }}>
                <Search size={16} />
                <input 
                  type="text" 
                  placeholder="Search notices by title, content or author..."
                  value={announcementSearch}
                  onChange={(e) => setAnnouncementSearch(e.target.value)}
                  style={{ padding: '8px 16px 8px 36px' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <Filter size={15} style={{ color: 'var(--color-text-secondary)' }} />
              <span style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>Priority:</span>
              {['ALL', 'URGENT', 'IMPORTANT', 'NORMAL'].map((level) => (
                <button
                  key={level}
                  onClick={() => setAnnouncementFilter(level)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--color-border)',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    background: announcementFilter === level ? '#1e3a8a' : 'white',
                    color: announcementFilter === level ? 'white' : 'var(--color-text-secondary)',
                    transition: 'all 0.15s'
                  }}
                >
                  {level}
                </button>
              ))}
              <button 
                onClick={fetchAnnouncements} 
                title="Refresh notices"
                style={{ padding: '6px 10px', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
              >
                <RefreshCw size={15} style={{ color: 'var(--color-text-secondary)' }} />
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
      ) : (
        /* DIRECT MESSAGES & STAFF/STUDENT DIRECTORY TAB */
        <div style={{ display: 'flex', gap: '20px', width: '100%', height: 'calc(100vh - 300px)', minHeight: '560px' }}>
          
          {/* Left Column: Live Contacts Directory */}
          <div className="chart-card" style={{ width: '360px', display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden', background: 'white' }}>
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
                  style={{ padding: '8px 16px 8px 36px', width: '100%' }}
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
          <div className="chart-card" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden', background: 'white' }}>
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
            {/* Modal Header */}
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

            {/* Modal Form */}
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

    </div>
  );
};

export default Communication;
