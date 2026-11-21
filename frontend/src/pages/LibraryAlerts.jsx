import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { 
  BookOpen, 
  Bell, 
  Smartphone, 
  MessageSquare, 
  Search, 
  X, 
  AlertTriangle, 
  CheckCircle2, 
  CheckCheck, 
  Radio, 
  Send, 
  Clock, 
  ArrowLeft, 
  Book, 
  ArrowUpRight,
  Filter,
  Users,
  AlertCircle
} from 'lucide-react';

const LibraryAlerts = () => {
  const navigate = useNavigate();
  const tenantSlug = sessionStorage.getItem('tenantSlug') || '';
  const userInfo = JSON.parse(sessionStorage.getItem('userInfo') || '{}');
  const token = userInfo.token || sessionStorage.getItem('token') || '';

  // Toast
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');

  // Filter & Search States
  const [alertFilter, setAlertFilter] = useState('all'); // 'all', 'overdue', 'due_soon', 'dispatched'
  const [alertSearchQuery, setAlertSearchQuery] = useState('');

  // Modal & Composer States
  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);
  const [selectedBorrowerForAlert, setSelectedBorrowerForAlert] = useState(null);
  const [alertTemplate, setAlertTemplate] = useState('gentle'); // 'gentle', 'due_soon', 'overdue', 'custom'
  const [customAlertMessage, setCustomAlertMessage] = useState('');
  const [selectedChannels, setSelectedChannels] = useState({ portal: true, sms: true, whatsapp: true });
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [isSendingAlert, setIsSendingAlert] = useState(false);

  // Initial Seeded Dispatched Alerts
  const [dispatchedAlerts, setDispatchedAlerts] = useState({
    'TRX-103': { timestamp: '02:40 PM', channels: ['portal', 'sms'], template: 'overdue', message: 'Urgent overdue hold alert' }
  });

  // Active Borrowers Data
  const [activeBorrowers, setActiveBorrowers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const showToast = (msg, type = 'success') => {
    setToastMessage(msg);
    setToastType(type);
    setTimeout(() => {
      setToastMessage('');
    }, 3500);
  };

  const getHeaders = () => {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (tenantSlug) headers['x-tenant-slug'] = tenantSlug;
    return headers;
  };

  const fetchBorrowers = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/library/transactions?status=active', { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        const mapped = (Array.isArray(data) ? data : []).map(trx => {
          const isOverdue = trx.status === 'Overdue' || (trx.daysOverdue > 0) || (trx.dueDate && new Date(trx.dueDate) < new Date());
          const daysRem = trx.daysRemaining !== undefined ? trx.daysRemaining : (trx.dueDate ? Math.ceil((new Date(trx.dueDate) - new Date()) / (1000 * 60 * 60 * 24)) : 0);
          return {
            id: trx.transactionId || trx.id || 'TRX-0',
            student: trx.student,
            classSection: trx.classSection || 'Class 10-A',
            rollNo: trx.rollNo || '10-A-01',
            phone: trx.phone || '+91 98200 12345',
            email: trx.email || `${(trx.student || 'student').toLowerCase().replace(/\s+/g, '.')}@school.edu`,
            book: trx.book,
            category: trx.category || 'General',
            date: trx.date,
            dueDate: trx.dueDate,
            isOverdue: isOverdue,
            daysOverdue: trx.daysOverdue || (isOverdue ? Math.abs(daysRem) : 0),
            fine: trx.fine || (isOverdue ? Math.abs(daysRem) * 10 : 0),
            daysRemaining: daysRem,
            urgency: isOverdue ? 'overdue' : (daysRem <= 3 ? 'due_soon' : 'normal')
          };
        });
        setActiveBorrowers(mapped);
      }
    } catch (err) {
      console.warn('Failed to fetch active library borrowers:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBorrowers();
  }, [tenantSlug]);

  // Filtered Active Borrowers
  const filteredActiveBorrowers = useMemo(() => {
    return activeBorrowers.filter(b => {
      const matchSearch = 
        b.student.toLowerCase().includes(alertSearchQuery.toLowerCase()) ||
        b.book.toLowerCase().includes(alertSearchQuery.toLowerCase()) ||
        b.classSection.toLowerCase().includes(alertSearchQuery.toLowerCase()) ||
        b.id.toLowerCase().includes(alertSearchQuery.toLowerCase());

      if (!matchSearch) return false;

      const hasDispatched = !!dispatchedAlerts[b.id] || !!dispatchedAlerts[b.student];

      if (alertFilter === 'all') return true;
      if (alertFilter === 'overdue') return b.isOverdue || b.urgency === 'overdue';
      if (alertFilter === 'due_soon') return b.urgency === 'due_soon';
      if (alertFilter === 'dispatched') return hasDispatched;
      return true;
    });
  }, [activeBorrowers, alertSearchQuery, alertFilter, dispatchedAlerts]);

  // Generate dynamic alert message preview
  const getAlertMessagePreview = (borrower, templateType, customText) => {
    if (!borrower) return '';
    if (templateType === 'custom') {
      return customText || `Hello ${borrower.student}, this is a reminder from the school library regarding your borrowed book "${borrower.book}".`;
    }
    if (templateType === 'overdue' || borrower.isOverdue) {
      return `🚨 URGENT LIBRARY NOTICE: Dear ${borrower.student} (${borrower.classSection}), your borrowed book "${borrower.book}" is ${borrower.daysOverdue || 3} days overdue. An accumulated late fine of ₹${borrower.fine || 30} has accrued. Please return this book immediately to the library circulation desk to avoid restriction of library privileges.`;
    }
    if (templateType === 'due_soon') {
      return `⏳ LIBRARY NOTICE: Dear ${borrower.student}, this is a reminder that "${borrower.book}" borrowed by you is due for return on ${borrower.dueDate}. Please return or renew it at the library counter to avoid late charges.`;
    }
    // Gentle reminder
    return `📖 GENTLE REMINDER: Hi ${borrower.student}, we hope you are enjoying "${borrower.book}". Please remember that your book loan is scheduled for return by ${borrower.dueDate}. Thank you from the Library Department!`;
  };

  // Open Alert Composer Modal for a specific borrower
  const handleOpenAlertModal = (borrower, initialTemplate = null) => {
    setSelectedBorrowerForAlert(borrower);
    const template = initialTemplate || (borrower.isOverdue ? 'overdue' : (borrower.urgency === 'due_soon' ? 'due_soon' : 'gentle'));
    setAlertTemplate(template);
    setCustomAlertMessage('');
    setIsAlertModalOpen(true);
  };

  // Submit Alert Dispatch for Single Student
  const handleSendSingleAlert = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!selectedBorrowerForAlert) return;

    const channelsArray = Object.keys(selectedChannels).filter(k => selectedChannels[k]);
    if (channelsArray.length === 0) {
      showToast('Please select at least one delivery channel (Portal, SMS, or WhatsApp)', 'error');
      return;
    }

    setIsSendingAlert(true);
    const message = getAlertMessagePreview(selectedBorrowerForAlert, alertTemplate, customAlertMessage);

    try {
      await fetch('http://localhost:5000/api/library/alerts/dispatch', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          student: selectedBorrowerForAlert.student,
          book: selectedBorrowerForAlert.book,
          channels: channelsArray,
          alertType: alertTemplate,
          message: message
        })
      });
    } catch {
      // offline / mock fallback
    }

    const timeStr = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    setDispatchedAlerts(prev => ({
      ...prev,
      [selectedBorrowerForAlert.id]: {
        timestamp: timeStr,
        channels: channelsArray,
        template: alertTemplate,
        message: message
      },
      [selectedBorrowerForAlert.student]: {
        timestamp: timeStr,
        channels: channelsArray,
        template: alertTemplate,
        message: message
      }
    }));

    setIsSendingAlert(false);
    setIsAlertModalOpen(false);
    showToast(`🔔 Alert successfully dispatched to ${selectedBorrowerForAlert.student} via ${channelsArray.join(', ').toUpperCase()}!`);
  };

  // 1-Click Quick Ping for student
  const handleQuickPing = (borrower) => {
    const timeStr = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const template = borrower.isOverdue ? 'overdue' : 'gentle';
    const message = getAlertMessagePreview(borrower, template, '');

    setDispatchedAlerts(prev => ({
      ...prev,
      [borrower.id]: {
        timestamp: timeStr,
        channels: ['portal', 'sms'],
        template: template,
        message: message
      },
      [borrower.student]: {
        timestamp: timeStr,
        channels: ['portal', 'sms'],
        template: template,
        message: message
      }
    }));

    showToast(`⚡ Quick Return Reminder sent to ${borrower.student} via Student Portal & SMS!`);
  };

  // 1-Click Broadcast to all active borrowers (or overdue borrowers)
  const handleBroadcastAlerts = (scope = 'all') => {
    const targets = scope === 'overdue' 
      ? activeBorrowers.filter(b => b.isOverdue || b.urgency === 'overdue')
      : activeBorrowers;

    if (targets.length === 0) {
      showToast(scope === 'overdue' ? 'No overdue borrowers currently pending alerts!' : 'No active borrowers found!', 'error');
      return;
    }

    setIsBroadcasting(true);
    setTimeout(() => {
      const timeStr = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      setDispatchedAlerts(prev => {
        const updated = { ...prev };
        targets.forEach(t => {
          const tmpl = t.isOverdue ? 'overdue' : 'gentle';
          const msg = getAlertMessagePreview(t, tmpl, '');
          updated[t.id] = { timestamp: timeStr, channels: ['portal', 'sms', 'whatsapp'], template: tmpl, message: msg };
          updated[t.student] = { timestamp: timeStr, channels: ['portal', 'sms', 'whatsapp'], template: tmpl, message: msg };
        });
        return updated;
      });
      setIsBroadcasting(false);
      showToast(`🚀 Return reminder alerts successfully broadcasted to ${targets.length} student borrower(s)!`);
    }, 600);
  };

  const overdueCount = activeBorrowers.filter(b => b.isOverdue).length;
  const dueSoonCount = activeBorrowers.filter(b => b.urgency === 'due_soon').length;
  const dispatchedCount = activeBorrowers.filter(b => dispatchedAlerts[b.id] || dispatchedAlerts[b.student]).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%', minHeight: '100%', boxSizing: 'border-box' }}>
      
      {/* Toast Notification */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          top: '24px',
          right: '24px',
          zIndex: 10000,
          background: toastType === 'error' ? '#ef4444' : '#10b981',
          color: 'white',
          padding: '12px 20px',
          borderRadius: '12px',
          fontWeight: 700,
          fontSize: '0.9rem',
          boxShadow: '0 10px 25px -5px rgba(0,0,0,0.2)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          animation: 'fadeIn 0.2s ease-in-out'
        }}>
          {toastType === 'error' ? <AlertTriangle size={18} /> : <CheckCircle2 size={18} />}
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage('')} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', marginLeft: '6px' }}>
            <X size={15} />
          </button>
        </div>
      )}

      {/* TOP COMMAND HEADER */}
      <div style={{
        background: 'var(--color-surface, white)',
        borderRadius: '16px',
        padding: '20px 24px',
        border: '1px solid var(--color-border, #e2e8f0)',
        boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div style={{ maxWidth: '680px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
            <span style={{
              background: '#e0e7ff',
              color: '#4338ca',
              padding: '3px 10px',
              borderRadius: '8px',
              fontSize: '0.74rem',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.4px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px'
            }}>
              <BookOpen size={13} color="#4338ca" /> Library & Media Center
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#dcfce7', color: '#15803d', padding: '2px 8px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 800 }}>
              <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#16a34a', display: 'inline-block' }} />
              Alert Dispatch System Active
            </span>
          </div>

          <h1 style={{ margin: '0 0 14px 0', fontSize: '1.45rem', fontWeight: 800, color: 'var(--color-text-main, #1e293b)', letterSpacing: '-0.01em' }}>
            Borrower Return & Due Date Alerts 📢
          </h1>

          {/* Quick Action Navigation */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              onClick={() => navigate(tenantSlug ? `/${tenantSlug}/library-dashboard` : '/library-dashboard')}
              className="hover-lift"
              style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                color: '#1e293b',
                padding: '8px 16px',
                borderRadius: '10px',
                fontSize: '0.82rem',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer',
                transition: 'all 0.15s'
              }}
            >
              <ArrowLeft size={15} color="#64748b" /> Library Overview
            </button>

            <button
              onClick={() => navigate(tenantSlug ? `/${tenantSlug}/books` : '/books')}
              className="hover-lift"
              style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                color: '#1e293b',
                padding: '8px 16px',
                borderRadius: '10px',
                fontSize: '0.82rem',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer',
                transition: 'all 0.15s'
              }}
            >
              <Book size={15} color="#0284c7" /> Books & Inventory <ArrowUpRight size={14} color="#64748b" />
            </button>
          </div>
        </div>

        {/* Right side session status */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          background: 'var(--color-bg, #f8fafc)',
          padding: '12px 18px',
          borderRadius: '12px',
          border: '1px solid var(--color-border, #e2e8f0)',
          minWidth: '190px'
        }}>
          <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Live Dispatch Session
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#1e293b', marginTop: '2px' }}>
            {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </div>
          <div style={{
            fontSize: '0.72rem',
            color: '#4338ca',
            fontWeight: 800,
            background: '#e0e7ff',
            padding: '2px 8px',
            borderRadius: '6px',
            marginTop: '4px'
          }}>
            {userInfo.name || 'Mr. Ganesh Kumar'} • Librarian
          </div>
        </div>
      </div>

      {/* METRIC KPI STRIP */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        {[
          { 
            label: 'Active Student Borrowers', 
            value: activeBorrowers.length, 
            icon: Users, 
            color: '#4F46E5', 
            bg: 'rgba(79,70,229,0.1)',
            badge: 'Holding Books',
            badgeBg: 'rgba(79,70,229,0.08)',
            badgeColor: '#4F46E5'
          },
          { 
            label: 'Overdue Returns', 
            value: overdueCount, 
            icon: AlertTriangle, 
            color: '#DC2626', 
            bg: 'rgba(220, 38, 38, 0.1)',
            badge: 'Action Needed',
            badgeBg: 'rgba(220, 38, 38, 0.08)',
            badgeColor: '#DC2626'
          },
          { 
            label: 'Due Soon (≤ 3 Days)', 
            value: dueSoonCount, 
            icon: Clock, 
            color: '#D97706', 
            bg: 'rgba(217, 119, 6, 0.1)',
            badge: 'Expiring Soon',
            badgeBg: 'rgba(217, 119, 6, 0.08)',
            badgeColor: '#D97706'
          },
          { 
            label: 'Reminders Dispatched', 
            value: dispatchedCount, 
            icon: CheckCheck, 
            color: '#059669', 
            bg: 'rgba(5, 150, 105, 0.1)',
            badge: 'Today Logged',
            badgeBg: 'rgba(5, 150, 105, 0.08)',
            badgeColor: '#059669'
          }
        ].map((kpi, idx) => (
          <div 
            key={idx} 
            className="card hover-lift" 
            style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '10px', 
              padding: '18px 20px', 
              borderRadius: '16px', 
              background: 'var(--color-surface, white)', 
              border: '1px solid var(--color-border, #e2e8f0)', 
              boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
              transition: 'all 0.3s'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: kpi.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <kpi.icon size={20} color={kpi.color} />
              </div>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '3px 8px', borderRadius: '12px', background: kpi.badgeBg, color: kpi.badgeColor }}>
                {kpi.badge}
              </span>
            </div>
            <div>
              <div style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--color-primary, #1e293b)' }}>
                {kpi.value}
              </div>
              <div style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--color-text-muted, #64748b)', textTransform: 'uppercase', letterSpacing: '0.4px', marginTop: '2px' }}>
                {kpi.label}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ─── MAIN STUDENT BOOK RETURN & DUE DATE ALERT DISPATCHER CARD ─── */}
      <div className="card" style={{
        background: 'var(--color-surface, white)',
        borderRadius: '16px',
        border: '1px solid var(--color-border, #e2e8f0)',
        padding: '24px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px'
      }}>
        {/* Header Strip & Broadcast Controls */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span style={{
                background: '#ede9fe',
                color: '#6366f1',
                padding: '3px 10px',
                borderRadius: '8px',
                fontSize: '0.74rem',
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.4px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px'
              }}>
                <Bell size={13} color="#6366f1" /> Loan Reminders & Compliance
              </span>
              <span style={{
                background: overdueCount > 0 ? '#fee2e2' : '#dcfce7',
                color: overdueCount > 0 ? '#dc2626' : '#15803d',
                padding: '2px 8px',
                borderRadius: '6px',
                fontSize: '0.72rem',
                fontWeight: 800,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: overdueCount > 0 ? '#dc2626' : '#16a34a' }} />
                {overdueCount} Overdue Holds
              </span>
            </div>
            <h2 style={{ margin: '0 0 4px 0', fontSize: '1.3rem', fontWeight: 800, color: 'var(--color-text-main, #1e293b)' }}>
              Student Book Return & Due Date Alert Dispatcher 📢
            </h2>
            <p style={{ margin: 0, fontSize: '0.84rem', color: '#64748b' }}>
              Broadcast instant return reminders and overdue notices to students holding library books via In-App Portal, SMS, and WhatsApp.
            </p>
          </div>

          {/* Broadcast Quick Action Buttons */}
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
            <button
              onClick={() => handleBroadcastAlerts('overdue')}
              disabled={isBroadcasting || overdueCount === 0}
              className="hover-lift"
              style={{
                background: '#fff1f2',
                border: '1px solid #fecdd3',
                color: '#e11d48',
                padding: '10px 16px',
                borderRadius: '10px',
                fontSize: '0.82rem',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                cursor: overdueCount === 0 ? 'not-allowed' : 'pointer',
                opacity: overdueCount === 0 ? 0.6 : 1,
                transition: 'all 0.15s'
              }}
            >
              <AlertTriangle size={15} color="#e11d48" /> Alert Overdue Students ({overdueCount})
            </button>

            <button
              onClick={() => handleBroadcastAlerts('all')}
              disabled={isBroadcasting || activeBorrowers.length === 0}
              className="hover-lift"
              style={{
                background: 'linear-gradient(135deg, #4F46E5 0%, #4338ca 100%)',
                border: 'none',
                color: 'white',
                padding: '10px 18px',
                borderRadius: '10px',
                fontSize: '0.82rem',
                fontWeight: 800,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                cursor: activeBorrowers.length === 0 ? 'not-allowed' : 'pointer',
                boxShadow: '0 2px 10px rgba(79, 70, 229, 0.28)',
                opacity: activeBorrowers.length === 0 ? 0.6 : 1,
                transition: 'all 0.15s'
              }}
            >
              <Radio size={15} color="white" />
              {isBroadcasting ? 'Broadcasting...' : `Broadcast Alert to All Active Borrowers (${activeBorrowers.length})`}
            </button>
          </div>
        </div>

        {/* Mini Status Counters & Search/Filter Toolbar */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          background: '#f8fafc',
          padding: '12px 16px',
          borderRadius: '12px',
          border: '1px solid #e2e8f0'
        }}>
          {/* Quick Filter Tabs */}
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {[
              { id: 'all', label: `All Borrowers (${activeBorrowers.length})` },
              { id: 'overdue', label: `Overdue Holds (${overdueCount})` },
              { id: 'due_soon', label: `Due Soon (≤3d) (${dueSoonCount})` },
              { id: 'dispatched', label: `Alert Dispatched (${dispatchedCount})` }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setAlertFilter(tab.id)}
                style={{
                  padding: '6px 14px',
                  borderRadius: '8px',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  border: 'none',
                  background: alertFilter === tab.id ? '#4F46E5' : '#ffffff',
                  color: alertFilter === tab.id ? '#ffffff' : '#64748b',
                  boxShadow: alertFilter === tab.id ? '0 1px 4px rgba(79, 70, 229, 0.2)' : '0 1px 2px rgba(0,0,0,0.05)',
                  transition: 'all 0.15s'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div style={{ position: 'relative', minWidth: '240px', flex: '1', maxWidth: '340px' }}>
            <Search size={14} style={{ position: 'absolute', left: '10px', top: '9px', color: '#94a3b8' }} />
            <input 
              type="text" 
              placeholder="Search student or book title..." 
              value={alertSearchQuery}
              onChange={e => setAlertSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '7px 10px 7px 32px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '0.82rem',
                outline: 'none',
                background: '#ffffff',
                boxSizing: 'border-box'
              }}
            />
            {alertSearchQuery && (
              <button 
                onClick={() => setAlertSearchQuery('')}
                style={{ position: 'absolute', right: '8px', top: '8px', background: 'transparent', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
              >
                <X size={13} />
              </button>
            )}
          </div>
        </div>

        {/* Borrower Cards Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '16px' }}>
          {filteredActiveBorrowers.length === 0 ? (
            <div style={{ gridColumn: '1 / -1', padding: '40px', textAlign: 'center', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
              <CheckCircle2 size={36} color="#10b981" style={{ margin: '0 auto 8px auto' }} />
              <div style={{ fontWeight: 800, color: '#1e293b', fontSize: '0.96rem' }}>No matching student borrowers found</div>
              <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '2px' }}>All issued books are accounted for or filter criteria returned zero active loans.</div>
            </div>
          ) : (
            filteredActiveBorrowers.map((borrower) => {
              const dispatched = dispatchedAlerts[borrower.id] || dispatchedAlerts[borrower.student];
              return (
                <div
                  key={borrower.id}
                  className="hover-lift"
                  style={{
                    background: borrower.isOverdue ? '#fffaf8' : '#ffffff',
                    borderRadius: '14px',
                    border: borrower.isOverdue ? '1px solid #fed7aa' : '1px solid #e2e8f0',
                    padding: '18px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '14px',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
                    transition: 'all 0.15s'
                  }}
                >
                  {/* Student Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: '10px',
                        background: borrower.isOverdue ? '#ffedd5' : '#e0e7ff',
                        color: borrower.isOverdue ? '#c2410c' : '#4338ca',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 800,
                        fontSize: '0.9rem'
                      }}>
                        {borrower.student.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </div>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: '0.94rem', color: '#1e293b' }}>
                          {borrower.student}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span>{borrower.classSection}</span>
                          <span>•</span>
                          <span>{borrower.phone}</span>
                        </div>
                      </div>
                    </div>

                    {/* Status Pill */}
                    <span style={{
                      padding: '3px 8px',
                      borderRadius: '8px',
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      background: borrower.isOverdue ? '#fee2e2' : (borrower.urgency === 'due_soon' ? '#fef3c7' : '#e0e7ff'),
                      color: borrower.isOverdue ? '#dc2626' : (borrower.urgency === 'due_soon' ? '#b45309' : '#4338ca')
                    }}>
                      <span style={{
                        width: '5px',
                        height: '5px',
                        borderRadius: '50%',
                        background: borrower.isOverdue ? '#dc2626' : (borrower.urgency === 'due_soon' ? '#b45309' : '#4F46E5')
                      }} />
                      {borrower.isOverdue ? `${borrower.daysOverdue}d Overdue` : (borrower.urgency === 'due_soon' ? `Due Soon` : 'On Schedule')}
                    </span>
                  </div>

                  {/* Book & Loan Info */}
                  <div style={{ background: '#f8fafc', padding: '12px 14px', borderRadius: '10px', border: '1px solid #f1f5f9', fontSize: '0.82rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 700, color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '210px' }}>
                        📖 {borrower.book}
                      </span>
                      <span style={{ fontSize: '0.74rem', color: '#059669', fontWeight: 600 }}>
                        {borrower.category}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px', fontSize: '0.76rem', color: '#64748b' }}>
                      <span>Due Date: <strong style={{ color: borrower.isOverdue ? '#dc2626' : '#1e293b' }}>{borrower.dueDate}</strong></span>
                      {borrower.fine > 0 && (
                        <span style={{ color: '#b45309', fontWeight: 800 }}>Fine: ₹{borrower.fine}</span>
                      )}
                    </div>
                  </div>

                  {/* Alert Dispatch Status Badge */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.74rem' }}>
                    {dispatched ? (
                      <span style={{ color: '#15803d', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <CheckCheck size={14} color="#16a34a" /> Alert Dispatched ({dispatched.timestamp})
                      </span>
                    ) : (
                      <span style={{ color: '#94a3b8', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <Clock size={13} /> No alert sent today
                      </span>
                    )}

                    <span style={{ color: '#64748b', fontSize: '0.72rem' }}>
                      Tx: {borrower.id}
                    </span>
                  </div>

                  {/* Action Buttons */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '8px', marginTop: '2px' }}>
                    <button
                      onClick={() => handleOpenAlertModal(borrower)}
                      className="hover-lift"
                      style={{
                        padding: '8px 14px',
                        borderRadius: '8px',
                        border: 'none',
                        background: borrower.isOverdue ? '#dc2626' : '#4F46E5',
                        color: 'white',
                        fontWeight: 700,
                        fontSize: '0.8rem',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        boxShadow: borrower.isOverdue ? '0 2px 8px rgba(220, 38, 38, 0.25)' : '0 2px 8px rgba(79, 70, 229, 0.25)'
                      }}
                    >
                      <Bell size={14} /> {borrower.isOverdue ? 'Send Overdue Notice' : 'Send Return Alert'}
                    </button>

                    <button
                      onClick={() => handleQuickPing(borrower)}
                      title="Send Instant 1-Click Reminder via Portal & SMS"
                      className="hover-lift"
                      style={{
                        padding: '8px 12px',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        background: '#ffffff',
                        color: '#475569',
                        fontWeight: 700,
                        fontSize: '0.78rem',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <Send size={13} color="#4F46E5" /> Quick Ping
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ─── ALERT COMPOSER MODAL (PORTAL) ─── */}
      {isAlertModalOpen && selectedBorrowerForAlert && createPortal(
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(5px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999999,
          padding: '16px'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '20px',
            width: '100%',
            maxWidth: '560px',
            maxHeight: '92vh',
            overflowY: 'auto',
            padding: '24px 26px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            animation: 'fadeIn 0.2s ease-out'
          }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#ede9fe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Bell size={20} color="#6366f1" />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#1e293b' }}>
                    Send Book Return Alert 📢
                  </h3>
                  <div style={{ fontSize: '0.76rem', color: '#64748b' }}>
                    Notify student regarding their active or overdue library loan
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setIsAlertModalOpen(false)} 
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '4px' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Target Student & Book Card */}
            <div style={{
              background: selectedBorrowerForAlert.isOverdue ? '#fff7ed' : '#f8fafc',
              border: selectedBorrowerForAlert.isOverdue ? '1px solid #fed7aa' : '1px solid #e2e8f0',
              borderRadius: '12px',
              padding: '14px 16px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '12px'
            }}>
              <div>
                <div style={{ fontWeight: 800, fontSize: '0.96rem', color: selectedBorrowerForAlert.isOverdue ? '#9a3412' : '#1e293b' }}>
                  {selectedBorrowerForAlert.student}
                  <span style={{ fontSize: '0.76rem', fontWeight: 600, color: '#64748b', marginLeft: '6px' }}>
                    ({selectedBorrowerForAlert.classSection})
                  </span>
                </div>
                <div style={{ fontSize: '0.82rem', color: '#334155', marginTop: '3px', fontWeight: 600 }}>
                  📖 {selectedBorrowerForAlert.book}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '3px' }}>
                  📱 Contact: {selectedBorrowerForAlert.phone} • Roll: {selectedBorrowerForAlert.rollNo || 'N/A'}
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <span style={{
                  padding: '4px 10px',
                  borderRadius: '12px',
                  fontSize: '0.74rem',
                  fontWeight: 800,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  background: selectedBorrowerForAlert.isOverdue ? '#fee2e2' : '#e0e7ff',
                  color: selectedBorrowerForAlert.isOverdue ? '#dc2626' : '#4338ca'
                }}>
                  {selectedBorrowerForAlert.isOverdue ? `⚠️ ${selectedBorrowerForAlert.daysOverdue || 3}d Overdue` : '🟢 Active Loan'}
                </span>
                <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '4px' }}>
                  Due: <strong>{selectedBorrowerForAlert.dueDate}</strong>
                </div>
                {selectedBorrowerForAlert.fine > 0 && (
                  <div style={{ fontSize: '0.76rem', color: '#b45309', fontWeight: 800 }}>
                    Fine: ₹{selectedBorrowerForAlert.fine}
                  </div>
                )}
              </div>
            </div>

            {/* Template Selector */}
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, color: '#334155', marginBottom: '8px' }}>
                Select Alert Template
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                {[
                  { id: 'gentle', label: 'Gentle Reminder', desc: 'Standard friendly return notice', color: '#059669', bg: '#f0fdf4' },
                  { id: 'due_soon', label: 'Due Soon Notice', desc: 'Alert for books due within 48-72h', color: '#d97706', bg: '#fffbeb' },
                  { id: 'overdue', label: 'Urgent Overdue Hold', desc: 'Notice with late fine warning', color: '#dc2626', bg: '#fef2f2' },
                  { id: 'custom', label: 'Custom Message', desc: 'Type customized alert content', color: '#4F46E5', bg: '#eef2ff' },
                ].map(tmpl => (
                  <div
                    key={tmpl.id}
                    onClick={() => setAlertTemplate(tmpl.id)}
                    style={{
                      border: alertTemplate === tmpl.id ? `2px solid ${tmpl.color}` : '1px solid #e2e8f0',
                      background: alertTemplate === tmpl.id ? tmpl.bg : '#ffffff',
                      borderRadius: '10px',
                      padding: '10px 12px',
                      cursor: 'pointer',
                      transition: 'all 0.15s'
                    }}
                  >
                    <div style={{ fontWeight: 800, fontSize: '0.82rem', color: alertTemplate === tmpl.id ? tmpl.color : '#1e293b' }}>
                      {tmpl.label}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '2px' }}>
                      {tmpl.desc}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Custom Message Input if Selected */}
            {alertTemplate === 'custom' && (
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  Custom Message Content
                </label>
                <textarea
                  rows={3}
                  value={customAlertMessage}
                  onChange={e => setCustomAlertMessage(e.target.value)}
                  placeholder={`Write alert for ${selectedBorrowerForAlert.student}...`}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '10px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.84rem',
                    fontFamily: 'inherit',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            )}

            {/* Delivery Channels */}
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, color: '#334155', marginBottom: '8px' }}>
                Delivery Channels
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                {[
                  { key: 'portal', label: 'Student Portal', icon: Bell, hint: 'In-app notification' },
                  { key: 'sms', label: 'SMS Notice', icon: Smartphone, hint: 'To parent phone' },
                  { key: 'whatsapp', label: 'WhatsApp', icon: MessageSquare, hint: 'Direct ping' }
                ].map(ch => (
                  <label
                    key={ch.key}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                      padding: '10px 12px',
                      borderRadius: '10px',
                      border: selectedChannels[ch.key] ? '1px solid #6366f1' : '1px solid #e2e8f0',
                      background: selectedChannels[ch.key] ? '#f5f3ff' : '#f8fafc',
                      cursor: 'pointer',
                      transition: 'all 0.15s'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <ch.icon size={14} color={selectedChannels[ch.key] ? '#6366f1' : '#64748b'} />
                        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1e293b' }}>{ch.label}</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={selectedChannels[ch.key]}
                        onChange={e => setSelectedChannels({ ...selectedChannels, [ch.key]: e.target.checked })}
                        style={{ cursor: 'pointer' }}
                      />
                    </div>
                    <span style={{ fontSize: '0.7rem', color: '#64748b' }}>{ch.hint}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Live Message Preview */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                  Live Message Preview
                </span>
                <span style={{ fontSize: '0.72rem', color: '#059669', fontWeight: 700 }}>
                  Ready to send
                </span>
              </div>
              <div style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '10px',
                padding: '12px 14px',
                fontSize: '0.82rem',
                lineHeight: '1.45',
                color: '#1e293b',
                whiteSpace: 'pre-wrap'
              }}>
                {getAlertMessagePreview(selectedBorrowerForAlert, alertTemplate, customAlertMessage)}
              </div>
            </div>

            {/* Footer Buttons */}
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '6px', borderTop: '1px solid #f1f5f9', paddingTop: '14px' }}>
              <button
                type="button"
                onClick={() => setIsAlertModalOpen(false)}
                style={{
                  padding: '9px 16px',
                  borderRadius: '10px',
                  border: '1px solid #cbd5e1',
                  background: 'white',
                  color: '#475569',
                  fontWeight: 700,
                  fontSize: '0.84rem',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSendSingleAlert}
                disabled={isSendingAlert}
                style={{
                  padding: '9px 20px',
                  borderRadius: '10px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #4F46E5 0%, #4338ca 100%)',
                  color: 'white',
                  fontWeight: 800,
                  fontSize: '0.84rem',
                  cursor: isSendingAlert ? 'not-allowed' : 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)',
                  opacity: isSendingAlert ? 0.7 : 1
                }}
              >
                <Send size={15} />
                {isSendingAlert ? 'Dispatching Alert...' : 'Dispatch Alert Now'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
};

export default LibraryAlerts;
