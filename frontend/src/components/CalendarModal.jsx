import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { 
  Calendar as CalendarIcon, Plus, X, Edit3, Trash2, Clock, 
  MapPin, Users, CheckCircle2, AlertCircle, Sparkles, ChevronLeft, 
  ChevronRight, Filter, ShieldCheck, Eye, BookOpen, Award, 
  Tag, Info, ExternalLink, CalendarDays, Check, Lock
} from 'lucide-react';

const API_BASE = 'http://localhost:5000/api';

const CATEGORIES = [
  { id: 'All', label: 'All Items', color: '#4F46E5' },
  { id: 'Holiday', label: 'Holidays (Off-Day)', color: '#DC2626' },
  { id: 'Event', label: 'Events & Celebrations', color: '#4F46E5' },
  { id: 'Examination', label: 'Exams & Tests', color: '#D97706' },
  { id: 'Meeting', label: 'Meetings & PTM', color: '#2563EB' },
  { id: 'Sports', label: 'Sports & Games', color: '#16A34A' },
  { id: 'Cultural', label: 'Cultural & Fests', color: '#0D9488' }
];

const AUDIENCES = [
  'All',
  'Students',
  'Teachers & Staff',
  'Parents',
  'Grades 9-12',
  'Grades 1-8'
];

const HOLIDAY_PRESETS = [
  { title: 'Diwali Festive Break', category: 'Holiday', days: 5, color: '#DC2626' },
  { title: 'Winter Vacation', category: 'Holiday', days: 10, color: '#DC2626' },
  { title: 'Republic Day', category: 'Holiday', days: 1, color: '#DC2626' },
  { title: 'Independence Day', category: 'Holiday', days: 1, color: '#DC2626' },
  { title: 'Gandhi Jayanti', category: 'Holiday', days: 1, color: '#DC2626' },
  { title: 'Holi Break', category: 'Holiday', days: 2, color: '#DC2626' },
  { title: 'Eid-ul-Fitr', category: 'Holiday', days: 1, color: '#DC2626' },
  { title: 'Summer Vacation', category: 'Holiday', days: 30, color: '#DC2626' }
];

export const CalendarView = ({ isOpen, onClose, embedded = false }) => {
  const userInfo = JSON.parse(sessionStorage.getItem('userInfo') || '{}');
  const token = userInfo.token || sessionStorage.getItem('token') || '';
  const tenantSlug = sessionStorage.getItem('tenantSlug') || userInfo.slug || '';
  const userRole = (sessionStorage.getItem('userRole') || userInfo.role || 'student').toLowerCase();

  // Authority Check: ONLY Super Admin and School Admin have right to add/edit/delete
  const canManageCalendar = ['superadmin', 'admin'].includes(userRole);

  const getAuthHeaders = () => {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (tenantSlug) headers['x-tenant-slug'] = tenantSlug;
    if (userRole) headers['x-user-role'] = userRole;
    return headers;
  };

  // View States
  const [activeTab, setActiveTab] = useState('month'); // 'month' | 'agenda'
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [eventsList, setEventsList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncingGoogle, setIsSyncingGoogle] = useState(false);
  const [notification, setNotification] = useState('');
  const [actionError, setActionError] = useState('');

  // Current Calendar Navigation Date (Default to Oct 2026 or current active date)
  const [viewDate, setViewDate] = useState(() => {
    // If today is in 2026, use today; else anchor to October 2026
    const now = new Date();
    return now.getFullYear() === 2026 ? now : new Date(2026, 9, 1);
  });

  // Add / Edit Modal State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState('add'); // 'add' | 'edit'
  const [editingEventId, setEditingEventId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Holiday',
    type: 'holiday',
    startDate: '2026-10-29',
    endDate: '2026-10-29',
    startTime: '09:00 AM',
    endTime: '03:00 PM',
    allDay: true,
    location: 'Main Campus',
    audience: 'All',
    color: '#DC2626',
    isHoliday: true
  });

  // Selected Event Detail Modal (for view / read-only)
  const [selectedEventDetail, setSelectedEventDetail] = useState(null);

  // Fetch events from backend
  const fetchCalendarEvents = async () => {
    setIsLoading(true);
    setActionError('');
    try {
      const res = await fetch(`${API_BASE}/calendar/events`, { headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        setEventsList(Array.isArray(data.events) ? data.events : []);
      } else {
        const err = await res.json().catch(() => ({}));
        setActionError(err.message || 'Error loading calendar events');
      }
    } catch (err) {
      console.warn('Error fetching calendar events:', err);
      setActionError('Network error connecting to calendar service');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen || embedded) {
      fetchCalendarEvents();
    }
  }, [isOpen, embedded, tenantSlug]);

  // Show notification toast with auto-dismiss
  const showToast = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(''), 4500);
  };

  // Month navigation helpers
  const currentYear = viewDate.getFullYear();
  const currentMonth = viewDate.getMonth(); // 0-indexed

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const handlePrevMonth = () => {
    setViewDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate(new Date(currentYear, currentMonth + 1, 1));
  };

  const handleToday = () => {
    setViewDate(new Date(2026, 9, 29)); // Active system date
  };

  // Timezone-safe local YYYY-MM-DD generator
  const formatLocalDate = (year, monthZeroIndexed, dayNumber) => {
    const y = year;
    const m = String(monthZeroIndexed + 1).padStart(2, '0');
    const d = String(dayNumber).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  // Effective system today string (timezone-safe YYYY-MM-DD)
  const todayStr = useMemo(() => {
    const todayObj = new Date();
    const formatted = formatLocalDate(todayObj.getFullYear(), todayObj.getMonth(), todayObj.getDate());
    return formatted < '2026-10-29' ? '2026-10-29' : formatted;
  }, []);

  // Calendar Grid Calculation (Accurate & Timezone-Safe)
  const calendarGridDays = useMemo(() => {
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay(); // 0 (Sun) to 6 (Sat)
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();

    const days = [];

    // 1. Previous month padding
    for (let i = firstDayOfMonth - 1; i >= 0; i--) {
      const dayNum = daysInPrevMonth - i;
      const prevMonthIdx = currentMonth === 0 ? 11 : currentMonth - 1;
      const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
      const dateStr = formatLocalDate(prevYear, prevMonthIdx, dayNum);
      days.push({
        dayNumber: dayNum,
        dateStr,
        isCurrentMonth: false,
        isPrevMonth: true,
        isPast: dateStr < todayStr,
        year: prevYear,
        month: prevMonthIdx
      });
    }

    // 2. Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      const dateStr = formatLocalDate(currentYear, currentMonth, i);
      days.push({
        dayNumber: i,
        dateStr,
        isCurrentMonth: true,
        isPast: dateStr < todayStr,
        isToday: dateStr === todayStr,
        year: currentYear,
        month: currentMonth
      });
    }

    // 3. Next month padding to complete weeks (multiple of 7)
    const totalCells = Math.ceil(days.length / 7) * 7;
    const remaining = totalCells - days.length;
    for (let i = 1; i <= remaining; i++) {
      const nextMonthIdx = currentMonth === 11 ? 0 : currentMonth + 1;
      const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear;
      const dateStr = formatLocalDate(nextYear, nextMonthIdx, i);
      days.push({
        dayNumber: i,
        dateStr,
        isCurrentMonth: false,
        isNextMonth: true,
        isPast: dateStr < todayStr,
        year: nextYear,
        month: nextMonthIdx
      });
    }

    return days;
  }, [currentYear, currentMonth, todayStr]);

  // Filter events based on active category
  const filteredEvents = useMemo(() => {
    return eventsList.filter(evt => {
      if (selectedCategory === 'All') return true;
      if (selectedCategory === 'Holiday') return evt.isHoliday || evt.category === 'Holiday';
      return evt.category === selectedCategory;
    });
  }, [eventsList, selectedCategory]);

  // Map events to date strings for fast grid lookup
  const eventsByDate = useMemo(() => {
    const map = {};
    filteredEvents.forEach(evt => {
      const start = evt.startDate;
      const end = evt.endDate || evt.startDate;

      if (!start) return;

      const [sy, sm, sd] = start.split('-').map(Number);
      const [ey, em, ed] = (end || start).split('-').map(Number);

      let cur = new Date(sy, (sm || 1) - 1, sd || 1);
      const endD = new Date(ey, (em || 1) - 1, ed || 1);

      let count = 0;
      while (cur <= endD && count < 60) {
        const y = cur.getFullYear();
        const m = String(cur.getMonth() + 1).padStart(2, '0');
        const d = String(cur.getDate()).padStart(2, '0');
        const dateStr = `${y}-${m}-${d}`;

        if (!map[dateStr]) map[dateStr] = [];
        map[dateStr].push(evt);

        cur.setDate(cur.getDate() + 1);
        count++;
      }
    });
    return map;
  }, [filteredEvents]);

  // Open Form to Add Event (Guards against past dates)
  const handleOpenAddForm = (prefilledDate = null) => {
    if (!canManageCalendar) return;
    if (prefilledDate && prefilledDate < todayStr) {
      alert(`Editing in dates that have passed is disabled (Selected date ${prefilledDate} is prior to today ${todayStr}). Please choose today or a future date.`);
      return;
    }
    const initialDate = prefilledDate && prefilledDate >= todayStr ? prefilledDate : todayStr;
    setFormMode('add');
    setEditingEventId(null);
    setFormData({
      title: '',
      description: '',
      category: 'Holiday',
      type: 'holiday',
      startDate: initialDate,
      endDate: initialDate,
      startTime: '09:00 AM',
      endTime: '03:00 PM',
      allDay: true,
      location: 'Main Campus',
      audience: 'All',
      color: '#DC2626',
      isHoliday: true
    });
    setIsFormOpen(true);
  };

  // Open Form to Edit Event (Guards against past dates)
  const handleOpenEditForm = (evt, e) => {
    if (e) e.stopPropagation();
    if (!canManageCalendar) return;
    if ((evt.endDate || evt.startDate) < todayStr) {
      alert('Editing past calendar entries is disabled. Historical records cannot be modified.');
      return;
    }
    setFormMode('edit');
    setEditingEventId(evt._id);
    setFormData({
      title: evt.title || '',
      description: evt.description || '',
      category: evt.category || 'Event',
      type: evt.type || (evt.isHoliday ? 'holiday' : 'event'),
      startDate: evt.startDate || '',
      endDate: evt.endDate || evt.startDate || '',
      startTime: evt.startTime || '09:00 AM',
      endTime: evt.endTime || '03:00 PM',
      allDay: evt.allDay !== undefined ? evt.allDay : true,
      location: evt.location || 'Main Campus',
      audience: evt.audience || 'All',
      color: evt.color || (evt.isHoliday ? '#DC2626' : '#4F46E5'),
      isHoliday: Boolean(evt.isHoliday)
    });
    setSelectedEventDetail(null);
    setIsFormOpen(true);
  };

  // Handle Preset Selection
  const handleSelectPreset = (preset) => {
    const [sy, sm, sd] = (formData.startDate || todayStr).split('-').map(Number);
    const start = new Date(sy, (sm || 1) - 1, sd || 1);
    const end = new Date(start);
    end.setDate(end.getDate() + (preset.days - 1));

    const endStr = formatLocalDate(end.getFullYear(), end.getMonth(), end.getDate());

    setFormData(prev => ({
      ...prev,
      title: preset.title,
      category: preset.category,
      type: 'holiday',
      isHoliday: true,
      endDate: endStr,
      color: preset.color,
      allDay: true,
      location: 'All Campuses'
    }));
  };

  // Submit Add or Edit Form
  const handleSubmitForm = async (e) => {
    e.preventDefault();
    if (!canManageCalendar) return;
    if (!formData.title.trim() || !formData.startDate) {
      alert('Please fill in title and start date.');
      return;
    }

    if (formData.startDate < todayStr) {
      alert(`Declaring or updating entries on passed dates is disabled (Selected start date: ${formData.startDate}, Today: ${todayStr}). Please choose today or a future date.`);
      return;
    }

    setIsSubmitting(true);
    try {
      const isEdit = formMode === 'edit' && editingEventId;
      const url = isEdit ? `${API_BASE}/calendar/events/${editingEventId}` : `${API_BASE}/calendar/events`;
      const method = isEdit ? 'PUT' : 'POST';

      const payload = {
        ...formData,
        isHoliday: formData.category === 'Holiday' || formData.isHoliday,
        schoolSlug: tenantSlug
      };

      const res = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const data = await res.json();
        showToast(data.message || (isEdit ? 'Calendar entry updated!' : 'Calendar entry published!'));
        setIsFormOpen(false);
        fetchCalendarEvents();
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.message || 'Error saving calendar entry');
      }
    } catch (err) {
      console.error('Error submitting calendar form:', err);
      alert('Network error saving calendar entry');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Calendar Event
  const handleDeleteEvent = async (eventId, title, e) => {
    if (e) e.stopPropagation();
    if (!canManageCalendar) return;
    const targetEvt = events.find(ev => ev._id === eventId) || selectedEventDetail;
    if (targetEvt && (targetEvt.endDate || targetEvt.startDate) < todayStr) {
      alert('Deleting past calendar entries is disabled. Historical records cannot be modified.');
      return;
    }
    if (!window.confirm(`Are you sure you want to remove "${title}" from the school calendar?`)) {
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/calendar/events/${eventId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      if (res.ok) {
        showToast(`"${title}" removed from the school calendar.`);
        setSelectedEventDetail(null);
        fetchCalendarEvents();
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.message || 'Could not delete entry');
      }
    } catch (err) {
      alert('Network error deleting calendar entry');
    }
  };

  // Sync official gazetted holidays & observances directly from Google Calendar
  const handleSyncGoogleCalendar = async () => {
    if (!canManageCalendar) return;
    setIsSyncingGoogle(true);
    try {
      const res = await fetch(`${API_BASE}/calendar/sync-google-holidays`, {
        method: 'POST',
        headers: getAuthHeaders()
      });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message || 'Holidays successfully synced from Google Calendar!');
        fetchCalendarEvents();
      } else {
        alert(data.message || 'Failed to sync Google Calendar holidays');
      }
    } catch (err) {
      console.error('Error syncing Google Calendar:', err);
      alert('Network error connecting to Google Calendar sync service.');
    } finally {
      setIsSyncingGoogle(false);
    }
  };

  if (!isOpen && !embedded) return null;

  const content = (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      background: 'white',
      borderRadius: embedded ? '14px' : '22px',
      boxShadow: embedded ? '0 2px 12px rgba(0,0,0,0.03)' : '0 25px 60px -15px rgba(15, 23, 42, 0.35)',
      overflow: 'hidden',
      border: '1px solid #e2e8f0',
      width: '100%',
      maxWidth: '100%',
      height: embedded ? '100%' : 'auto',
      minHeight: 0,
      maxHeight: embedded ? '100%' : '90vh',
      flex: 1
    }}>
      {/* 1. Top Header Bar */}
      <div style={{
        padding: embedded ? '8px 16px' : '14px 24px',
        background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #1e3a8a 100%)',
        color: 'white',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '8px',
        flexShrink: 0,
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: embedded ? '34px' : '42px',
            height: embedded ? '34px' : '42px',
            borderRadius: '10px',
            background: 'rgba(255, 255, 255, 0.15)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
          }}>
            <CalendarIcon size={embedded ? 18 : 22} color="#a5b4fc" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2 style={{ margin: 0, fontSize: embedded ? '1.05rem' : '1.25rem', fontWeight: 800, letterSpacing: '-0.01em' }}>
                Institutional School Calendar & Holidays
              </h2>
              {canManageCalendar ? (
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  background: 'rgba(22, 163, 74, 0.25)',
                  border: '1px solid rgba(74, 222, 128, 0.4)',
                  padding: '1px 8px',
                  borderRadius: '16px',
                  fontSize: '0.66rem',
                  fontWeight: 800,
                  color: '#86efac',
                  letterSpacing: '0.03em'
                }}>
                  <ShieldCheck size={11} /> ADMIN: FULL EDIT
                </span>
              ) : (
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  background: 'rgba(255, 255, 255, 0.18)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  padding: '1px 8px',
                  borderRadius: '16px',
                  fontSize: '0.66rem',
                  fontWeight: 800,
                  color: '#e0e7ff',
                  letterSpacing: '0.03em'
                }}>
                  <Eye size={11} /> VIEW-ONLY
                </span>
              )}
            </div>
            {!embedded && (
              <div style={{ fontSize: '0.74rem', color: '#c7d2fe', marginTop: '1px' }}>
                {canManageCalendar 
                  ? 'Super Admin & School Admin have authority to declare holidays, academic exams, and campus events.'
                  : 'Official institutional schedule of holidays, sports, examinations, and events published by Administration.'
                }
              </div>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {canManageCalendar && (
            <>
              <button
                type="button"
                onClick={handleSyncGoogleCalendar}
                disabled={isSyncingGoogle}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: embedded ? '6px 12px' : '8px 15px',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 255, 255, 0.28)',
                  background: 'rgba(255, 255, 255, 0.12)',
                  color: 'white',
                  fontWeight: 800,
                  fontSize: embedded ? '0.78rem' : '0.82rem',
                  cursor: isSyncingGoogle ? 'not-allowed' : 'pointer',
                  opacity: isSyncingGoogle ? 0.7 : 1,
                  backdropFilter: 'blur(4px)',
                  transition: 'all 0.15s ease'
                }}
                title="Sync official gazetted holidays & observances directly from Google Calendar"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>{isSyncingGoogle ? 'Syncing...' : 'Sync Google Holidays'}</span>
              </button>

              <button
                type="button"
                onClick={() => handleOpenAddForm()}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: embedded ? '6px 14px' : '8px 18px',
                  borderRadius: '8px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: 'white',
                  fontWeight: 800,
                  fontSize: embedded ? '0.8rem' : '0.85rem',
                  cursor: 'pointer',
                  boxShadow: '0 3px 12px rgba(16, 185, 129, 0.35)',
                  transition: 'all 0.15s ease'
                }}
              >
                <Plus size={15} strokeWidth={2.8} />
                <span>Add Holiday / Event</span>
              </button>
            </>
          )}

          {!embedded && onClose && (
            <button
              type="button"
              onClick={onClose}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.15)',
                border: '1px solid rgba(255, 255, 255, 0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: 'white'
              }}
              title="Close Calendar"
            >
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      {/* 2. Toast Notification */}
      {notification && (
        <div style={{
          background: '#ecfdf5',
          borderBottom: '1px solid #a7f3d0',
          padding: '10px 24px',
          color: '#065f46',
          fontSize: '0.84rem',
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <CheckCircle2 size={16} color="#059669" />
          <span>{notification}</span>
        </div>
      )}

      {/* 3. Controls & Filter Ribbon */}
      <div style={{
        padding: embedded ? '6px 14px' : '10px 18px',
        borderBottom: '1px solid #e2e8f0',
        background: '#f8fafc',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '8px',
        flexShrink: 0
      }}>
        {/* Month Navigator & Views */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <button
              type="button"
              onClick={handlePrevMonth}
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '7px',
                border: '1px solid #cbd5e1',
                background: 'white',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#334155'
              }}
              title="Previous Month"
            >
              <ChevronLeft size={15} />
            </button>

            <span style={{ fontSize: embedded ? '0.96rem' : '1.05rem', fontWeight: 800, color: '#1e3a8a', minWidth: '135px', textAlign: 'center' }}>
              {monthNames[currentMonth]} {currentYear}
            </span>

            <button
              type="button"
              onClick={handleNextMonth}
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '7px',
                border: '1px solid #cbd5e1',
                background: 'white',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#334155'
              }}
              title="Next Month"
            >
              <ChevronRight size={15} />
            </button>

            <button
              type="button"
              onClick={handleToday}
              style={{
                padding: '4px 10px',
                borderRadius: '7px',
                border: '1px solid #cbd5e1',
                background: 'white',
                fontSize: '0.74rem',
                fontWeight: 700,
                color: '#4f46e5',
                cursor: 'pointer',
                marginLeft: '3px'
              }}
            >
              Today
            </button>
          </div>

          <div style={{ width: '1px', height: '18px', background: '#cbd5e1' }} />

          {/* View Tab Toggle */}
          <div style={{ display: 'flex', background: '#e2e8f0', borderRadius: '7px', padding: '2px' }}>
            <button
              type="button"
              onClick={() => setActiveTab('month')}
              style={{
                padding: embedded ? '4px 10px' : '6px 14px',
                borderRadius: '5px',
                border: 'none',
                background: activeTab === 'month' ? 'white' : 'transparent',
                color: activeTab === 'month' ? '#1e3a8a' : '#64748b',
                fontWeight: 800,
                fontSize: embedded ? '0.75rem' : '0.8rem',
                cursor: 'pointer',
                boxShadow: activeTab === 'month' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                transition: 'all 0.15s'
              }}
            >
              📅 Month View
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('agenda')}
              style={{
                padding: embedded ? '4px 10px' : '6px 14px',
                borderRadius: '5px',
                border: 'none',
                background: activeTab === 'agenda' ? 'white' : 'transparent',
                color: activeTab === 'agenda' ? '#1e3a8a' : '#64748b',
                fontWeight: 800,
                fontSize: embedded ? '0.75rem' : '0.8rem',
                cursor: 'pointer',
                boxShadow: activeTab === 'agenda' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                transition: 'all 0.15s'
              }}
            >
              📋 Agenda & Events ({filteredEvents.length})
            </button>
          </div>
        </div>

        {/* Filter Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b', marginRight: '2px' }}>
            Filter:
          </span>
          {CATEGORIES.map(cat => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                style={{
                  padding: embedded ? '3px 8px' : '4px 10px',
                  borderRadius: '16px',
                  border: isSelected ? `1.5px solid ${cat.color}` : '1px solid #cbd5e1',
                  background: isSelected ? `${cat.color}15` : 'white',
                  color: isSelected ? cat.color : '#475569',
                  fontSize: embedded ? '0.7rem' : '0.75rem',
                  fontWeight: isSelected ? 800 : 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                {cat.id === 'Holiday' && <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#DC2626' }} />}
                {cat.id === 'Event' && <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#4F46E5' }} />}
                {cat.id === 'Examination' && <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#D97706' }} />}
                {cat.id === 'Meeting' && <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#2563EB' }} />}
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Main Body Content */}
      <div style={{
        flex: 1,
        height: '100%',
        minHeight: 0,
        padding: embedded ? '6px 10px' : '12px 18px',
        background: '#f8fafc',
        display: 'flex',
        flexDirection: 'column',
        overflow: activeTab === 'agenda' ? 'auto' : 'hidden'
      }}>
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748b' }}>
            <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>Loading institutional calendar...</div>
            <div style={{ fontSize: '0.85rem', marginTop: '6px' }}>Synchronizing events and holidays with MongoDB</div>
          </div>
        ) : activeTab === 'month' ? (
          /* =================== 100% BALANCED 7-COLUMN MONTH GRID (FIT TO VIEWPORT) =================== */
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            background: 'white',
            borderRadius: '12px',
            border: '1.5px solid #e2e8f0',
            overflow: 'hidden',
            boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
            width: '100%',
            flex: 1,
            height: '100%',
            minHeight: 0
          }}>
            {/* Day Header Row (ALWAYS PINNED & STRICTLY EQUAL 7 COLUMNS) */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
              background: '#f8fafc',
              borderBottom: '1.5px solid #cbd5e1',
              flexShrink: 0,
              textAlign: 'center',
              boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
              width: '100%'
            }}>
              {[
                { label: 'Sunday', short: 'SUN', isSunday: true },
                { label: 'Monday', short: 'MON' },
                { label: 'Tuesday', short: 'TUE' },
                { label: 'Wednesday', short: 'WED' },
                { label: 'Thursday', short: 'THU' },
                { label: 'Friday', short: 'FRI' },
                { label: 'Saturday', short: 'SAT' }
              ].map((d, i) => (
                <div
                  key={d.label}
                  style={{
                    padding: embedded ? '5px 4px' : '8px 6px',
                    fontSize: '0.74rem',
                    fontWeight: 800,
                    color: d.isSunday ? '#dc2626' : '#1e3a8a',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    borderRight: i === 6 ? 'none' : '1px solid #e2e8f0',
                    background: d.isSunday ? '#fff1f2' : '#f8fafc'
                  }}
                >
                  <span>{d.short}</span>
                </div>
              ))}
            </div>

            {/* Date Cells Grid (STRICT EQUAL-WIDTH 7 COLUMNS & EQUAL-HEIGHT ROWS THAT FILL SCREEN WITH ZERO SCROLLING) */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
              gridTemplateRows: `repeat(${Math.max(1, Math.ceil(calendarGridDays.length / 7))}, minmax(0, 1fr))`,
              width: '100%',
              flex: 1,
              height: '100%',
              minHeight: 0
            }}>
              {calendarGridDays.map((cell, idx) => {
                const dayEvents = eventsByDate[cell.dateStr] || [];
                const hasHoliday = dayEvents.some(e => e.isHoliday || e.category === 'Holiday');
                const isSunday = idx % 7 === 0;
                const isPast = cell.isPast || cell.dateStr < todayStr;
                const canEditThisDay = canManageCalendar && !isPast;

                return (
                  <div
                    key={cell.dateStr + '_' + idx}
                    onClick={() => {
                      if (canEditThisDay) {
                        handleOpenAddForm(cell.dateStr);
                      }
                    }}
                    style={{
                      minWidth: 0,
                      minHeight: 0,
                      width: '100%',
                      height: '100%',
                      boxSizing: 'border-box',
                      borderRight: (idx + 1) % 7 === 0 ? 'none' : '1px solid #e2e8f0',
                      borderBottom: '1px solid #e2e8f0',
                      padding: embedded ? '3px 5px' : '6px 8px',
                      background: cell.isToday
                        ? '#eff6ff'
                        : (hasHoliday 
                            ? '#fff5f5' 
                            : (cell.isCurrentMonth 
                                ? (isSunday ? '#fffbfb' : 'white') 
                                : '#f8fafc')),
                      opacity: cell.isCurrentMonth ? (isPast ? 0.68 : 1) : 0.35,
                      display: 'flex',
                      flexDirection: 'column',
                      cursor: canEditThisDay ? 'pointer' : 'default',
                      position: 'relative',
                      overflow: 'hidden',
                      transition: 'background 0.12s ease'
                    }}
                    onMouseEnter={e => {
                      if (canEditThisDay) e.currentTarget.style.background = '#f0fdf4';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = cell.isToday 
                        ? '#eff6ff' 
                        : (hasHoliday ? '#fff5f5' : (cell.isCurrentMonth ? (isSunday ? '#fffbfb' : 'white') : '#f8fafc'));
                    }}
                  >
                    {/* Date Number Header Bar */}
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '2px',
                      flexShrink: 0,
                      minWidth: 0
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <span style={{
                          width: '18px',
                          height: '18px',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.72rem',
                          fontWeight: cell.isToday ? 900 : 700,
                          background: cell.isToday ? '#2563eb' : 'transparent',
                          color: cell.isToday ? 'white' : (isSunday ? '#dc2626' : (cell.isCurrentMonth ? (isPast ? '#64748b' : '#1e293b') : '#94a3b8'))
                        }}>
                          {cell.dayNumber}
                        </span>

                        {cell.isToday && (
                          <span style={{
                            fontSize: '0.55rem',
                            fontWeight: 800,
                            color: '#2563eb',
                            background: '#dbeafe',
                            padding: '0 3px',
                            borderRadius: '3px',
                            textTransform: 'uppercase'
                          }}>
                            Today
                          </span>
                        )}
                      </div>

                      {canEditThisDay && (
                        <span
                          className="calendar-hover-plus"
                          title="Click to declare Holiday / Event"
                          style={{
                            fontSize: '0.68rem',
                            color: '#059669',
                            opacity: 0.5,
                            fontWeight: 800,
                            padding: '0 2px'
                          }}
                        >
                          +
                        </span>
                      )}
                    </div>

                    {/* Event Chips List */}
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '2px',
                      flex: 1,
                      minHeight: 0,
                      minWidth: 0,
                      width: '100%',
                      overflow: 'hidden'
                    }}>
                      {dayEvents.slice(0, 2).map((evt, eIdx) => {
                        const isHol = evt.isHoliday || evt.category === 'Holiday';
                        const isEventPassed = (evt.endDate || evt.startDate) < todayStr;
                        return (
                          <div
                            key={evt._id || eIdx}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedEventDetail(evt);
                            }}
                            style={{
                              minWidth: 0,
                              maxWidth: '100%',
                              boxSizing: 'border-box',
                              background: isHol ? '#fee2e2' : `${evt.color || '#4f46e5'}18`,
                              borderLeft: `2.5px solid ${isHol ? '#dc2626' : (evt.color || '#4f46e5')}`,
                              borderRadius: '3px',
                              padding: '1.5px 4px',
                              fontSize: '0.67rem',
                              fontWeight: 700,
                              color: isHol ? '#991b1b' : '#1e3a8a',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: '2px',
                              overflow: 'hidden',
                              lineHeight: 1.2,
                              opacity: isEventPassed ? 0.8 : 1
                            }}
                            title={`${evt.title} (${evt.category})${isEventPassed ? ' [Past - Editing disabled]' : ''}\nClick to view full details`}
                          >
                            <span style={{
                              minWidth: 0,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              flex: 1
                            }}>
                              {isHol ? '🏖️ ' : '📌 '}
                              {evt.title}
                            </span>
                            {canManageCalendar && !isEventPassed && (
                              <button
                                type="button"
                                onClick={(e) => handleOpenEditForm(evt, e)}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  padding: 0,
                                  color: '#64748b',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  flexShrink: 0,
                                  opacity: 0.7
                                }}
                                title="Edit this entry"
                              >
                                <Edit3 size={10} />
                              </button>
                            )}
                          </div>
                        );
                      })}

                      {dayEvents.length > 2 && (
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveTab('agenda');
                          }}
                          style={{
                            fontSize: '0.6rem',
                            fontWeight: 800,
                            color: '#4f46e5',
                            cursor: 'pointer',
                            padding: '0 2px',
                            lineHeight: 1
                          }}
                          title="Click to view all events in Agenda view"
                        >
                          +{dayEvents.length - 2} more
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* =================== AGENDA / LIST VIEW =================== */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#1e3a8a', textTransform: 'uppercase' }}>
                All Scheduled Holidays, Examinations & Institutional Events ({filteredEvents.length})
              </span>
              {canManageCalendar && (
                <button
                  type="button"
                  onClick={() => handleOpenAddForm()}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    border: '1px solid #10b981',
                    background: '#ecfdf5',
                    color: '#065f46',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  <Plus size={14} /> Add Calendar Entry
                </button>
              )}
            </div>

            {filteredEvents.length === 0 ? (
              <div style={{
                background: 'white',
                borderRadius: '16px',
                padding: '48px 24px',
                textAlign: 'center',
                border: '1px dashed #cbd5e1'
              }}>
                <CalendarIcon size={40} color="#94a3b8" style={{ margin: '0 auto 12px' }} />
                <h4 style={{ margin: 0, fontSize: '1.1rem', color: '#334155' }}>No calendar entries found</h4>
                <p style={{ margin: '6px 0 16px', fontSize: '0.85rem', color: '#64748b' }}>
                  There are no scheduled items matching "{selectedCategory}".
                </p>
                {canManageCalendar && (
                  <button
                    type="button"
                    onClick={() => handleOpenAddForm()}
                    style={{
                      padding: '8px 16px',
                      background: '#4f46e5',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    + Declare First Holiday / Event
                  </button>
                )}
              </div>
            ) : (
              filteredEvents.map((evt) => {
                const isHol = evt.isHoliday || evt.category === 'Holiday';
                const isMultiDay = evt.endDate && evt.endDate !== evt.startDate;

                return (
                  <div
                    key={evt._id}
                    onClick={() => setSelectedEventDetail(evt)}
                    style={{
                      background: 'white',
                      borderRadius: '14px',
                      border: isHol ? '1.5px solid #fecaca' : '1px solid #e2e8f0',
                      padding: '16px 20px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '16px',
                      cursor: 'pointer',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
                      transition: 'all 0.15s'
                    }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = isHol ? '#ef4444' : '#6366f1'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = isHol ? '#fecaca' : '#e2e8f0'}
                  >
                    {/* Left Date Badge & Details */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: '1 1 320px' }}>
                      <div style={{
                        width: '74px',
                        height: '74px',
                        borderRadius: '12px',
                        background: isHol ? '#fef2f2' : '#eef2ff',
                        border: `1.5px solid ${isHol ? '#fca5a5' : '#c7d2fe'}`,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        <span style={{ fontSize: '0.68rem', fontWeight: 800, color: isHol ? '#dc2626' : '#4f46e5', textTransform: 'uppercase' }}>
                          {new Date(evt.startDate).toLocaleString('en-US', { month: 'short' })}
                        </span>
                        <span style={{ fontSize: '1.4rem', fontWeight: 900, color: isHol ? '#b91c1c' : '#1e1b4b', lineHeight: 1.1 }}>
                          {new Date(evt.startDate).getDate()}
                        </span>
                        <span style={{ fontSize: '0.62rem', fontWeight: 700, color: '#64748b' }}>
                          {new Date(evt.startDate).getFullYear()}
                        </span>
                      </div>

                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
                          <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#1e293b' }}>
                            {evt.title}
                          </h4>
                          <span style={{
                            fontSize: '0.72rem',
                            fontWeight: 800,
                            padding: '2px 8px',
                            borderRadius: '6px',
                            background: isHol ? '#fee2e2' : `${evt.color || '#4f46e5'}18`,
                            color: isHol ? '#b91c1c' : (evt.color || '#4f46e5')
                          }}>
                            {isHol ? '🏖️ HOLIDAY' : evt.category}
                          </span>
                          {isMultiDay && (
                            <span style={{ fontSize: '0.7rem', color: '#64748b', background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>
                              Through {evt.endDate}
                            </span>
                          )}
                        </div>

                        {evt.description && (
                          <div style={{ fontSize: '0.82rem', color: '#64748b', marginBottom: '6px', maxWidth: '600px' }}>
                            {evt.description}
                          </div>
                        )}

                        <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', fontSize: '0.76rem', color: '#475569', fontWeight: 600 }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Clock size={13} color="#6366f1" />
                            {evt.allDay ? 'Full Day Schedule' : `${evt.startTime} - ${evt.endTime}`}
                          </span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <MapPin size={13} color="#059669" />
                            {evt.location || 'Campus'}
                          </span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Users size={13} color="#d97706" />
                            Audience: {evt.audience || 'All'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right Actions */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedEventDetail(evt);
                        }}
                        style={{
                          padding: '7px 12px',
                          borderRadius: '8px',
                          border: '1px solid #cbd5e1',
                          background: 'white',
                          color: '#334155',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        View Details
                      </button>

                      {canManageCalendar && (
                        (evt.endDate || evt.startDate) < todayStr ? (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '5px 9px',
                              borderRadius: '6px',
                              background: '#f1f5f9',
                              color: '#64748b',
                              fontSize: '0.72rem',
                              fontWeight: 700
                            }}
                            title="Past event (historical record - editing disabled)"
                          >
                            <Lock size={12} color="#64748b" /> Past Record
                          </span>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={(e) => handleOpenEditForm(evt, e)}
                              style={{
                                padding: '7px 10px',
                                borderRadius: '8px',
                                border: '1px solid #cbd5e1',
                                background: '#f8fafc',
                                color: '#2563eb',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center'
                              }}
                              title="Edit Event"
                            >
                              <Edit3 size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => handleDeleteEvent(evt._id, evt.title, e)}
                              style={{
                                padding: '7px 10px',
                                borderRadius: '8px',
                                border: '1px solid #fecaca',
                                background: '#fef2f2',
                                color: '#dc2626',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center'
                              }}
                              title="Delete Event"
                            >
                              <Trash2 size={14} />
                            </button>
                          </>
                        )
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );

  /* ================= 5. ADD / EDIT HOLIDAY OR EVENT MODAL (PORTAL TO ROOT) ================= */
  const addEditModalPortal = isFormOpen && canManageCalendar ? createPortal(
    <div
      onClick={() => setIsFormOpen(false)}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 999999,
        padding: '16px'
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'white',
          borderRadius: '20px',
          width: '100%',
          maxWidth: '600px',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.45)',
          overflow: 'hidden',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          border: '1px solid #e2e8f0'
        }}
      >
        {/* Pinned Non-scrolling Modal Header */}
        <div style={{
          flexShrink: 0,
          padding: '16px 22px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.15)',
          background: formData.isHoliday 
            ? 'linear-gradient(135deg, #991b1b 0%, #dc2626 100%)' 
            : 'linear-gradient(135deg, #1e1b4b 0%, #4338ca 100%)',
          color: 'white',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
              {formData.isHoliday ? <Award size={20} /> : <CalendarIcon size={20} />}
              <span>{formMode === 'edit' ? 'Edit Calendar Entry' : (formData.isHoliday ? 'Declare Institutional Holiday' : 'Create Campus Event / Exam')}</span>
            </h3>
            <span style={{ fontSize: '0.76rem', color: 'rgba(255, 255, 255, 0.85)', marginTop: '2px', display: 'block' }}>
              Published officially across student, parent, faculty & administrative dashboards.
            </span>
          </div>
          <button
            type="button"
            onClick={() => setIsFormOpen(false)}
            style={{
              background: 'rgba(255, 255, 255, 0.2)',
              border: 'none',
              borderRadius: '8px',
              padding: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              transition: 'background 0.15s ease'
            }}
            title="Close Dialog"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Form Container with Scrollable Body & Pinned Footer */}
        <form onSubmit={handleSubmitForm} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden', margin: 0 }}>
          
          {/* Scrollable Form Body */}
          <div style={{ flex: 1, overflowY: 'auto', minHeight: 0, padding: '18px 22px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            
            {/* Quick Presets for Holidays */}
            {formMode === 'add' && (
              <div style={{ background: '#f8fafc', padding: '12px 14px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.74rem', fontWeight: 800, color: '#475569', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  ✨ Quick Institutional Presets:
                </div>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {HOLIDAY_PRESETS.map(preset => (
                    <button
                      key={preset.title}
                      type="button"
                      onClick={() => handleSelectPreset(preset)}
                      style={{
                        padding: '4px 10px',
                        borderRadius: '16px',
                        border: '1px solid #fecaca',
                        background: '#fef2f2',
                        color: '#991b1b',
                        fontSize: '0.74rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = '#dc2626'; e.currentTarget.style.color = '#ffffff'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = '#fef2f2'; e.currentTarget.style.color = '#991b1b'; }}
                    >
                      + {preset.title}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Title / Event Name */}
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '5px' }}>
                Title / Event Name <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <input
                required
                type="text"
                placeholder="e.g. Diwali Vacation, Annual Sports Meet, Pre-Board Examination"
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '10px',
                  border: '1.5px solid #cbd5e1',
                  fontSize: '0.88rem',
                  fontWeight: 600,
                  boxSizing: 'border-box',
                  outline: 'none'
                }}
              />
            </div>

            {/* Category & Target Audience */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '5px' }}>
                  Category
                </label>
                <select
                  value={formData.category}
                  onChange={e => {
                    const cat = e.target.value;
                    const isHol = cat === 'Holiday';
                    setFormData(prev => ({
                      ...prev,
                      category: cat,
                      isHoliday: isHol,
                      type: isHol ? 'holiday' : 'event',
                      color: isHol ? '#DC2626' : (cat === 'Examination' ? '#D97706' : (cat === 'Sports' ? '#16A34A' : '#4F46E5'))
                    }));
                  }}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '10px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '0.86rem',
                    fontWeight: 700,
                    background: 'white',
                    boxSizing: 'border-box'
                  }}
                >
                  <option value="Holiday">Holiday (Off-Day / Vacation)</option>
                  <option value="Event">Institutional Event / Celebration</option>
                  <option value="Examination">Examination / Assessment</option>
                  <option value="Meeting">Meeting / PTM</option>
                  <option value="Sports">Sports & Tournaments</option>
                  <option value="Cultural">Cultural & Arts</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '5px' }}>
                  Target Audience
                </label>
                <select
                  value={formData.audience}
                  onChange={e => setFormData({ ...formData, audience: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '10px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '0.86rem',
                    fontWeight: 700,
                    background: 'white',
                    boxSizing: 'border-box'
                  }}
                >
                  {AUDIENCES.map(aud => (
                    <option key={aud} value={aud}>{aud}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Date Range: Start Date & End Date */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '5px' }}>
                  Start Date <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <input
                  required
                  type="date"
                  value={formData.startDate}
                  min={todayStr}
                  onChange={e => {
                    const newStart = e.target.value;
                    setFormData(prev => ({
                      ...prev,
                      startDate: newStart,
                      endDate: prev.endDate < newStart ? newStart : prev.endDate
                    }));
                  }}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '10px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '0.86rem',
                    fontWeight: 700,
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '5px' }}>
                  End Date <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 500 }}>(for multi-day breaks)</span>
                </label>
                <input
                  type="date"
                  value={formData.endDate}
                  min={formData.startDate && formData.startDate > todayStr ? formData.startDate : todayStr}
                  onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '10px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '0.86rem',
                    fontWeight: 700,
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>

            {/* All Day Toggle & Timings */}
            <div style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  id="calendarAllDayCheck"
                  checked={formData.allDay}
                  onChange={e => setFormData({ ...formData, allDay: e.target.checked })}
                  style={{ width: '16px', height: '16px', accentColor: '#4f46e5', cursor: 'pointer' }}
                />
                <label htmlFor="calendarAllDayCheck" style={{ fontSize: '0.82rem', fontWeight: 700, color: '#1e293b', cursor: 'pointer' }}>
                  All-Day Schedule (Campus closed or full day schedule)
                </label>
              </div>

              {!formData.allDay && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '8px', paddingTop: '8px', borderTop: '1px dashed #cbd5e1' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: '#475569', marginBottom: '3px' }}>
                      Start Time
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 09:00 AM"
                      value={formData.startTime}
                      onChange={e => setFormData({ ...formData, startTime: e.target.value })}
                      style={{ width: '100%', padding: '7px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.82rem', boxSizing: 'border-box' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: '#475569', marginBottom: '3px' }}>
                      End Time
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 02:00 PM"
                      value={formData.endTime}
                      onChange={e => setFormData({ ...formData, endTime: e.target.value })}
                      style={{ width: '100%', padding: '7px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.82rem', boxSizing: 'border-box' }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Location & Venue */}
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '5px' }}>
                Location / Venue
              </label>
              <input
                type="text"
                placeholder="e.g. All Campuses, Main Sports Ground, Auditorium"
                value={formData.location}
                onChange={e => setFormData({ ...formData, location: e.target.value })}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '10px',
                  border: '1.5px solid #cbd5e1',
                  fontSize: '0.86rem',
                  fontWeight: 600,
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* Description */}
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '5px' }}>
                Instructions / Description
              </label>
              <textarea
                rows={2}
                placeholder="Provide instructions, timings, or details for students, parents, and staff..."
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '10px',
                  border: '1.5px solid #cbd5e1',
                  fontSize: '0.84rem',
                  resize: 'vertical',
                  boxSizing: 'border-box'
                }}
              />
            </div>

          </div>

          {/* Pinned Non-scrolling Modal Footer */}
          <div style={{
            flexShrink: 0,
            padding: '12px 22px',
            background: '#f8fafc',
            borderTop: '1px solid #e2e8f0',
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            gap: '10px'
          }}>
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
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
              type="submit"
              disabled={isSubmitting}
              style={{
                padding: '9px 20px',
                borderRadius: '10px',
                border: 'none',
                background: formData.isHoliday 
                  ? 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)' 
                  : 'linear-gradient(135deg, #4f46e5 0%, #3730a3 100%)',
                color: 'white',
                fontWeight: 800,
                fontSize: '0.86rem',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                boxShadow: formData.isHoliday 
                  ? '0 4px 14px rgba(220, 38, 38, 0.35)' 
                  : '0 4px 14px rgba(79, 70, 229, 0.35)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              {isSubmitting ? (
                <span>Publishing...</span>
              ) : (
                <>
                  <Check size={16} strokeWidth={2.8} />
                  <span>{formMode === 'edit' ? 'Update Entry' : 'Declare & Publish Entry'}</span>
                </>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>,
    document.body
  ) : null;

  /* ================= 6. EVENT DETAILS VIEW MODAL (PORTAL TO ROOT) ================= */
  const detailModalPortal = selectedEventDetail ? createPortal(
    <div
      onClick={() => setSelectedEventDetail(null)}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 999999,
        padding: '16px'
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'white',
          borderRadius: '20px',
          width: '100%',
          maxWidth: '520px',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.45)',
          overflow: 'hidden',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          border: '1px solid #e2e8f0'
        }}
      >
        {/* Pinned Header */}
        <div style={{
          flexShrink: 0,
          padding: '18px 22px',
          background: selectedEventDetail.isHoliday 
            ? 'linear-gradient(135deg, #991b1b 0%, #dc2626 100%)' 
            : 'linear-gradient(135deg, #1e1b4b 0%, #3730a3 100%)',
          color: 'white',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start'
        }}>
          <div>
            <span style={{
              display: 'inline-block',
              padding: '3px 10px',
              borderRadius: '20px',
              fontSize: '0.72rem',
              fontWeight: 800,
              background: 'rgba(255, 255, 255, 0.2)',
              marginBottom: '6px'
            }}>
              {selectedEventDetail.isHoliday ? '🏖️ INSTITUTIONAL HOLIDAY' : selectedEventDetail.category}
            </span>
            <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, lineHeight: 1.25 }}>
              {selectedEventDetail.title}
            </h3>
          </div>
          <button
            type="button"
            onClick={() => setSelectedEventDetail(null)}
            style={{
              background: 'rgba(255, 255, 255, 0.2)',
              border: 'none',
              borderRadius: '8px',
              padding: '6px',
              cursor: 'pointer',
              display: 'flex',
              color: 'white'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div style={{ flex: 1, overflowY: 'auto', minHeight: 0, padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          
          {/* Date & Time Badge */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', background: '#f8fafc', padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <div>
              <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
                Date Scheduled
              </div>
              <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#1e293b', marginTop: '2px' }}>
                {selectedEventDetail.startDate}
                {selectedEventDetail.endDate && selectedEventDetail.endDate !== selectedEventDetail.startDate && (
                  <span style={{ color: '#4f46e5' }}> to {selectedEventDetail.endDate}</span>
                )}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
                Timing
              </div>
              <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#1e293b', marginTop: '2px' }}>
                {selectedEventDetail.allDay ? 'All Day' : `${selectedEventDetail.startTime} - ${selectedEventDetail.endTime}`}
              </div>
            </div>
          </div>

          {/* Location & Audience */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
                Location
              </div>
              <div style={{ fontSize: '0.86rem', fontWeight: 700, color: '#334155', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <MapPin size={13} color="#059669" />
                <span>{selectedEventDetail.location || 'Campus'}</span>
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
                Target Audience
              </div>
              <div style={{ fontSize: '0.86rem', fontWeight: 700, color: '#334155', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Users size={13} color="#d97706" />
                <span>{selectedEventDetail.audience || 'All'}</span>
              </div>
            </div>
          </div>

          {/* Description */}
          {selectedEventDetail.description && (
            <div>
              <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>
                Description & Directives
              </div>
              <div style={{ fontSize: '0.84rem', color: '#334155', lineHeight: 1.5, background: '#f8fafc', padding: '10px 12px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                {selectedEventDetail.description}
              </div>
            </div>
          )}

          {/* Published By */}
          <div style={{ fontSize: '0.74rem', color: '#94a3b8', display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #f1f5f9', paddingTop: '8px' }}>
            <span>Published by: <strong>{selectedEventDetail.createdBy || 'Administration'}</strong></span>
            <span>Type: <strong>{selectedEventDetail.isHoliday ? 'Institutional Holiday' : selectedEventDetail.category}</strong></span>
          </div>

        </div>

        {/* Pinned Action Buttons Footer */}
        <div style={{
          flexShrink: 0,
          padding: '12px 22px',
          background: '#f8fafc',
          borderTop: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center',
          gap: '8px'
        }}>
          {canManageCalendar && (
            (selectedEventDetail.endDate || selectedEventDetail.startDate) < todayStr ? (
              <span
                style={{
                  fontSize: '0.76rem',
                  color: '#64748b',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: '#f1f5f9',
                  padding: '7px 14px',
                  borderRadius: '8px',
                  fontWeight: 700,
                  border: '1px solid #e2e8f0'
                }}
              >
                <Lock size={13} color="#64748b" /> Historical Record (Editing Disabled)
              </span>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => handleOpenEditForm(selectedEventDetail)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '8px',
                    border: '1.5px solid #4f46e5',
                    background: '#eef2ff',
                    color: '#3730a3',
                    fontWeight: 700,
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px'
                  }}
                >
                  <Edit3 size={13} /> Edit Entry
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteEvent(selectedEventDetail._id, selectedEventDetail.title)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '8px',
                    border: '1px solid #fecaca',
                    background: '#fef2f2',
                    color: '#dc2626',
                    fontWeight: 700,
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px'
                  }}
                >
                  <Trash2 size={13} /> Delete
                </button>
              </>
            )
          )}
          <button
            type="button"
            onClick={() => setSelectedEventDetail(null)}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              background: 'white',
              color: '#475569',
              fontWeight: 700,
              fontSize: '0.82rem',
              cursor: 'pointer'
            }}
          >
            Close
          </button>
        </div>

      </div>
    </div>,
    document.body
  ) : null;

  /* ================= 7. RENDER VIEW: EMBEDDED OR MODAL ================= */
  if (embedded) {
    return (
      <>
        {content}
        {addEditModalPortal}
        {detailModalPortal}
      </>
    );
  }

  return (
    <>
      {createPortal(
        <div
          onClick={onClose}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99999,
            padding: '20px'
          }}
        >
          <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: '1240px' }}>
            {content}
          </div>
        </div>,
        document.body
      )}
      {addEditModalPortal}
      {detailModalPortal}
    </>
  );
};

export default CalendarView;
