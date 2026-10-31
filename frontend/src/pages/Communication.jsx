import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useSearchParams } from 'react-router-dom';
import { 
  Search, Send, Bell, MessageSquare, Megaphone, Plus, 
  X, CheckCircle2, User, Mail, Phone, Calendar, Clock,
  AlertTriangle, Filter, Sparkles, RefreshCw, SendHorizontal,
  ShieldAlert, Radio, HelpCircle, Check, MapPin, Tag, LifeBuoy,
  BookOpen, FileText, Download, Trash2, Paperclip, GraduationCap,
  Layers, ExternalLink, ChevronDown
} from 'lucide-react';

const Communication = () => {
  const tenantSlug = sessionStorage.getItem('tenantSlug') || '';
  const userInfo = JSON.parse(sessionStorage.getItem('userInfo') || '{}');
  const token = userInfo.token || sessionStorage.getItem('token') || '';

  // Role authority definitions: Superadmin, Admin, and Principal have leadership authority
  const userRole = (sessionStorage.getItem('userRole') || userInfo.role || '').toLowerCase().trim();
  const isAuthorizedLeader = ['superadmin', 'super_admin', 'admin', 'branch_admin', 'school_admin', 'school', 'principal'].includes(userRole);
  const canPostClassMaterial = isAuthorizedLeader || ['teacher', 'faculty', 'staff'].includes(userRole);

  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'announcements';

  // Tab: 'announcements', 'messages', 'emergency', 'events', 'grievances', 'classMaterials'
  const [activeTab, setActiveTab] = useState(initialTab);

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && ['announcements', 'messages', 'emergency', 'events', 'grievances', 'classMaterials'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

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
  const [selectedGrievanceForManage, setSelectedGrievanceForManage] = useState(null);
  const [manageGrievanceForm, setManageGrievanceForm] = useState({
    status: 'Open',
    priority: 'Medium',
    remarks: ''
  });
  const [grievanceForm, setGrievanceForm] = useState({
    title: '',
    category: 'Transport',
    raisedBy: userInfo.name || 'Concerned Parent',
    student: 'Aarav Patel (Class 10 - A)',
    priority: 'High',
    description: ''
  });

  // Class Notes & Assignments State (Class-wise System)
  const [classMaterials, setClassMaterials] = useState([]);
  const [classMaterialFilterClass, setClassMaterialFilterClass] = useState('All');
  const [classMaterialFilterType, setClassMaterialFilterType] = useState('All');
  const [classMaterialSearch, setClassMaterialSearch] = useState('');
  const [isCreateMaterialModalOpen, setIsCreateMaterialModalOpen] = useState(false);
  const [selectedMaterialDetail, setSelectedMaterialDetail] = useState(null);
  const [isSubmittingMaterial, setIsSubmittingMaterial] = useState(false);
  const [classesList, setClassesList] = useState([]);
  const [materialForm, setMaterialForm] = useState({
    title: '',
    type: 'Note', // 'Note' or 'Assignment'
    classSection: 'Class 10 - A',
    subject: 'Mathematics',
    chapter: '',
    content: '',
    dueDate: '',
    maxMarks: 50,
    attachmentTitle: '',
    attachmentUrl: ''
  });

  const getHeaders = () => {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (tenantSlug) headers['x-tenant-slug'] = tenantSlug;
    if (userRole) headers['x-user-role'] = userRole;
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

  // Fetch Grievances (Superadmin, Admin & Principal Authority Only)
  const fetchGrievances = async () => {
    if (!isAuthorizedLeader) return;
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

  // Fetch Configured Classes List
  const fetchClassesList = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/classes', {
        headers: getHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data.classes) ? data.classes : [];
        setClassesList(list);
        if (list.length > 0 && !materialForm.classSection) {
          setMaterialForm(prev => ({
            ...prev,
            classSection: `${list[0].className} - ${list[0].section}`
          }));
        }
      }
    } catch (err) {
      console.warn('Error fetching classes list:', err);
    }
  };

  // Fetch Class Materials (Notes & Assignments)
  const fetchClassMaterials = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/communication/class-materials', {
        headers: getHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        setClassMaterials(Array.isArray(data.materials) ? data.materials : []);
      }
    } catch (err) {
      console.warn('Error fetching class materials:', err);
    }
  };

  useEffect(() => {
    setLoading(true);
    const promises = [
      fetchAnnouncements(), 
      fetchContacts(),
      fetchEmergency(),
      fetchEvents(),
      fetchClassMaterials(),
      fetchClassesList()
    ];
    if (isAuthorizedLeader) {
      promises.push(fetchGrievances());
    }
    Promise.all(promises).finally(() => {
      setLoading(false);
    });
  }, [tenantSlug, isAuthorizedLeader]);

  // Handle New Class Material (Note / Assignment) Submission
  const handleCreateMaterial = async (e) => {
    e.preventDefault();
    if (!materialForm.title.trim() || !materialForm.content.trim() || !materialForm.classSection) return;

    setIsSubmittingMaterial(true);
    try {
      const attachments = [];
      if (materialForm.attachmentTitle.trim()) {
        attachments.push({
          title: materialForm.attachmentTitle.trim(),
          url: materialForm.attachmentUrl.trim() || '#',
          fileType: 'PDF',
          fileSize: '1.5 MB'
        });
      }

      const payload = {
        title: materialForm.title.trim(),
        type: materialForm.type,
        classSection: materialForm.classSection,
        subject: materialForm.subject.trim(),
        chapter: materialForm.chapter.trim(),
        content: materialForm.content.trim(),
        dueDate: materialForm.dueDate || null,
        maxMarks: Number(materialForm.maxMarks) || 50,
        attachments,
        teacherName: userInfo.name || 'Class Faculty'
      };

      const res = await fetch('http://localhost:5000/api/communication/class-materials', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setNoticeSuccessMessage(`✅ ${materialForm.type === 'Assignment' ? 'Assignment' : 'Class Note'} published successfully to ${materialForm.classSection}!`);
        setIsCreateMaterialModalOpen(false);
        setMaterialForm({
          title: '',
          type: 'Note',
          classSection: classesList[0] ? `${classesList[0].className} - ${classesList[0].section}` : 'Class 10 - A',
          subject: 'Mathematics',
          chapter: '',
          content: '',
          dueDate: '',
          maxMarks: 50,
          attachmentTitle: '',
          attachmentUrl: ''
        });
        fetchClassMaterials();
        setTimeout(() => setNoticeSuccessMessage(''), 4000);
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.message || 'Error publishing material');
      }
    } catch (err) {
      alert('Network error: ' + err.message);
    } finally {
      setIsSubmittingMaterial(false);
    }
  };

  // Handle Deleting a Class Material
  const handleDeleteMaterial = async (id) => {
    if (!window.confirm('Are you sure you want to remove this class note / assignment?')) return;
    try {
      const res = await fetch(`http://localhost:5000/api/communication/class-materials/${id}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      if (res.ok) {
        setClassMaterials(prev => prev.filter(m => (m._id !== id && m.id !== id)));
        setNoticeSuccessMessage('✅ Class material removed successfully');
        setTimeout(() => setNoticeSuccessMessage(''), 3000);
      }
    } catch (err) {
      console.warn('Delete error:', err);
    }
  };

  // Handle New Announcement Submission (Superadmin, Admin & Principal)
  const handleCreateAnnouncement = async (e) => {
    e.preventDefault();
    if (!isAuthorizedLeader) {
      alert('Access Denied: Only Superadmin, Admin, and Principal have authority to post campus notices.');
      return;
    }
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
        setNoticeSuccessMessage('✅ Notice posted successfully to live campus bulletin!');
        setIsAnnounceModalOpen(false);
        setNoticeForm({
          title: '',
          content: '',
          targetAudience: 'All Students & Parents',
          priority: 'Normal',
          author: userInfo.name || 'School Administration'
        });
        setTimeout(() => setNoticeSuccessMessage(''), 4000);
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.message || 'Access Denied: Only Superadmin, Admin, and Principal have authority.');
      }
    } catch (err) {
      console.error('Failed to post announcement:', err);
    } finally {
      setIsSubmittingNotice(false);
    }
  };

  // Handle Delete Announcement (Superadmin, Admin & Principal)
  const handleDeleteNotice = async (id) => {
    if (!isAuthorizedLeader) {
      alert('Access Denied: Only Superadmin, Admin, and Principal have authority to delete notices.');
      return;
    }
    if (!window.confirm('Are you sure you want to delete this campus notice?')) return;
    try {
      const res = await fetch(`http://localhost:5000/api/communication/announcements/${id}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      if (res.ok) {
        setAnnouncements(prev => prev.filter(a => a._id !== id && a.id !== id));
        setNoticeSuccessMessage('✅ Notice deleted successfully');
        setTimeout(() => setNoticeSuccessMessage(''), 3000);
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.message || 'Failed to delete announcement');
      }
    } catch (err) {
      console.error('Delete notice error:', err);
    }
  };

  // Handle Emergency Publish (Superadmin, Admin & Principal)
  const handlePublishEmergency = async (e) => {
    e.preventDefault();
    if (!isAuthorizedLeader) {
      alert('Access Denied: Only Superadmin, Admin, and Principal have authority to publish emergency broadcasts.');
      return;
    }
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
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.message || 'Failed to publish emergency alert');
      }
    } catch (err) {
      console.error('Failed to publish emergency alert:', err);
    } finally {
      setIsPublishingEmergency(false);
    }
  };

  // Handle Emergency Revoke (Superadmin, Admin & Principal)
  const handleRevokeEmergency = async () => {
    if (!isAuthorizedLeader) {
      alert('Access Denied: Only Superadmin, Admin, and Principal have authority to deactivate emergency broadcasts.');
      return;
    }
    try {
      const res = await fetch('http://localhost:5000/api/communication/emergency', {
        method: 'DELETE',
        headers: getHeaders()
      });
      if (res.ok) {
        setActiveEmergency(null);
        setNoticeSuccessMessage('Emergency broadcast deactivated. Regular campus mode resumed.');
        setTimeout(() => setNoticeSuccessMessage(''), 4000);
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.message || 'Failed to revoke emergency broadcast');
      }
    } catch (err) {
      console.error('Failed to revoke emergency:', err);
    }
  };

  // Handle Create Event (Superadmin, Admin & Principal)
  const handleCreateEvent = async (e) => {
    e.preventDefault();
    if (!isAuthorizedLeader) {
      alert('Access Denied: Only Superadmin, Admin, and Principal have authority to schedule events.');
      return;
    }
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
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.message || 'Failed to create event');
      }
    } catch (err) {
      console.error('Failed to create event:', err);
    }
  };

  // Handle Delete Event (Superadmin, Admin & Principal)
  const handleDeleteEvent = async (id) => {
    if (!isAuthorizedLeader) {
      alert('Access Denied: Only Superadmin, Admin, and Principal have authority to remove events.');
      return;
    }
    if (!window.confirm('Are you sure you want to remove this campus event?')) return;
    try {
      const res = await fetch(`http://localhost:5000/api/communication/events/${id}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      if (res.ok) {
        setEvents(prev => prev.filter(e => e.id !== id));
        setNoticeSuccessMessage('✅ Campus event removed successfully');
        setTimeout(() => setNoticeSuccessMessage(''), 3000);
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.message || 'Failed to delete event');
      }
    } catch (err) {
      console.error('Delete event error:', err);
    }
  };

  // Handle Create Grievance (Available to all campus members)
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

  // Update Grievance Status (Superadmin, Admin & Principal)
  const handleUpdateGrievanceStatus = async (id, newStatus) => {
    if (!isAuthorizedLeader) {
      alert('Access Denied: Only Superadmin, Admin, and Principal have authority to manage grievance statuses.');
      return;
    }
    try {
      const res = await fetch(`http://localhost:5000/api/communication/grievances/${id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        setGrievances(prev => prev.map(g => g.id === id ? { ...g, status: newStatus } : g));
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.message || 'Failed to update grievance status');
      }
    } catch (err) {
      console.error('Failed to update grievance:', err);
    }
  };

  // Handle Dismiss Grievance (Superadmin, Admin & Principal)
  const handleDismissGrievance = async (id) => {
    if (!isAuthorizedLeader) {
      alert('Access Denied: Only Superadmin, Admin, and Principal have authority to dismiss grievances.');
      return;
    }
    if (!window.confirm('Are you sure you want to dismiss this grievance ticket?')) return;
    try {
      const res = await fetch(`http://localhost:5000/api/communication/grievances/${id}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      if (res.ok) {
        setGrievances(prev => prev.filter(g => g.id !== id));
        setNoticeSuccessMessage('✅ Grievance ticket dismissed');
        setTimeout(() => setNoticeSuccessMessage(''), 3000);
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.message || 'Failed to dismiss grievance');
      }
    } catch (err) {
      console.error('Dismiss grievance error:', err);
    }
  };

  // Open Manage Grievance Modal (Superadmin, Admin & Principal)
  const handleOpenManageGrievance = (ticket) => {
    if (!isAuthorizedLeader) return;
    setSelectedGrievanceForManage(ticket);
    setManageGrievanceForm({
      status: ticket.status || 'Open',
      priority: ticket.priority || 'Medium',
      remarks: ticket.remarks || ''
    });
  };

  // Save Grievance Management Updates (Superadmin, Admin & Principal)
  const handleSaveGrievanceManagement = async (e) => {
    e.preventDefault();
    if (!isAuthorizedLeader || !selectedGrievanceForManage) return;
    try {
      const res = await fetch(`http://localhost:5000/api/communication/grievances/${selectedGrievanceForManage.id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(manageGrievanceForm)
      });
      if (res.ok) {
        const updated = await res.json();
        setGrievances(prev => prev.map(g => g.id === selectedGrievanceForManage.id ? { ...g, ...updated } : g));
        setSelectedGrievanceForManage(null);
        setNoticeSuccessMessage(`✅ Grievance ticket #${selectedGrievanceForManage.id} updated successfully!`);
        setTimeout(() => setNoticeSuccessMessage(''), 4000);
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.message || 'Failed to update grievance ticket');
      }
    } catch (err) {
      console.error('Update grievance error:', err);
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

  // Current selected contact messages
  const currentContactId = selectedContact ? (selectedContact.id || selectedContact._id) : null;
  const currentChatMessages = (currentContactId && messagesByContact[currentContactId]) || [];

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

  // Available classes for dropdown
  const availableClasses = classesList.length > 0 
    ? classesList.map(c => `${c.className} - ${c.section}`)
    : ['Class 10 - A', 'Class 9 - B', 'Class 8 - A', 'Class 11 - SCIENCE'];

  // Filtered class materials
  const filteredClassMaterials = classMaterials.filter(item => {
    const matchesClass = classMaterialFilterClass === 'All' || item.classSection === classMaterialFilterClass;
    const matchesType = classMaterialFilterType === 'All' || 
      (classMaterialFilterType === 'Notes' ? (item.type === 'Note' || item.type === 'Study Material') : item.type === 'Assignment');
    const matchesSearch = !classMaterialSearch || 
      item.title?.toLowerCase().includes(classMaterialSearch.toLowerCase()) ||
      item.subject?.toLowerCase().includes(classMaterialSearch.toLowerCase()) ||
      item.chapter?.toLowerCase().includes(classMaterialSearch.toLowerCase()) ||
      item.content?.toLowerCase().includes(classMaterialSearch.toLowerCase()) ||
      item.classSection?.toLowerCase().includes(classMaterialSearch.toLowerCase());
    return matchesClass && matchesType && matchesSearch;
  });

  const notesCount = classMaterials.filter(m => m.type !== 'Assignment').length;
  const assignmentsCount = classMaterials.filter(m => m.type === 'Assignment').length;

  // Calculate statistics
  const totalAnnouncements = announcements.length;
  const urgentCount = announcements.filter(a => a.priority === 'Urgent').length;
  const openGrievancesCount = grievances.filter(g => g.status === 'Open' || g.status === 'In Progress').length;
  const upcomingEventsCount = events.length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
      
      {/* Top Banner & KPI Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
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

        {isAuthorizedLeader && (
          <div className="chart-card" style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', gap: '16px', background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 2px 10px rgba(0,0,0,0.03)', minHeight: '88px', boxSizing: 'border-box' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(245, 158, 11, 0.1)', color: '#F59E0B', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <LifeBuoy size={24} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', minWidth: 0 }}>
              <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '2px', lineHeight: 1.2 }}>Active Grievances</div>
              <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#b45309', lineHeight: 1.15 }}>{openGrievancesCount}</div>
            </div>
          </div>
        )}

        <div 
          onClick={() => setActiveTab('classMaterials')}
          className="chart-card hover-lift" 
          style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', gap: '16px', background: 'white', borderRadius: '16px', border: activeTab === 'classMaterials' ? '2px solid #0F766E' : '1px solid #e2e8f0', boxShadow: '0 2px 10px rgba(0,0,0,0.03)', minHeight: '88px', boxSizing: 'border-box', cursor: 'pointer', transition: 'all 0.2s' }}
        >
          <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(15, 118, 110, 0.1)', color: '#0F766E', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <BookOpen size={24} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', minWidth: 0 }}>
            <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '2px', lineHeight: 1.2 }}>Class Materials</div>
            <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0f766e', lineHeight: 1.15 }}>{classMaterials.length}</div>
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

          {isAuthorizedLeader && (
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
          )}

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

          <button 
            onClick={() => setActiveTab('classMaterials')}
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
              backgroundColor: activeTab === 'classMaterials' ? '#0F766E' : 'transparent', 
              color: activeTab === 'classMaterials' ? 'white' : '#64748b', 
              transition: 'all 0.2s',
              boxShadow: activeTab === 'classMaterials' ? '0 2px 8px rgba(15, 118, 110, 0.3)' : 'none'
            }}
          >
            <BookOpen size={15} /> Class Notes & Assignments ({classMaterials.length})
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {activeTab === 'classMaterials' && canPostClassMaterial && (
            <button 
              onClick={() => setIsCreateMaterialModalOpen(true)}
              style={{ 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: '8px', 
                background: 'linear-gradient(135deg, #0F766E, #14B8A6)', 
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
              className="hover-lift"
            >
              <Plus size={18} /> Send to Class
            </button>
          )}

          {activeTab === 'announcements' && isAuthorizedLeader && (
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

          {activeTab === 'events' && isAuthorizedLeader && (
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

          {activeTab === 'grievances' && isAuthorizedLeader && (
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: 600, color: '#1e3a8a' }}>
                        ✍️ {item.author || 'Admin Office'}
                      </span>
                      {isAuthorizedLeader && (
                        <button
                          onClick={() => handleDeleteNotice(item._id || item.id)}
                          title="Delete notice"
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#ef4444',
                            cursor: 'pointer',
                            padding: '4px',
                            display: 'inline-flex',
                            alignItems: 'center'
                          }}
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
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
              {isAuthorizedLeader ? (
                <button 
                  onClick={() => setIsAnnounceModalOpen(true)}
                  style={{ padding: '8px 16px', background: '#4F46E5', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}
                >
                  + Post the First Notice
                </button>
              ) : (
                <span style={{ fontSize: '0.82rem', color: '#64748b', fontStyle: 'italic' }}>
                  Official notices will be posted here once published by school administration.
                </span>
              )}
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
              {isAuthorizedLeader && (
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
              )}
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
                <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '2px' }}>Campus operating on regular academic schedule. No active alerts or safety warnings.</div>
              </div>
            </div>
          )}

          {/* Broadcast Console for Leaders OR Read-Only Campus Safety Hub for Non-Leaders */}
          {isAuthorizedLeader ? (
            <div className="chart-card" style={{ 
              padding: '24px', 
              background: 'white',
              borderRadius: '16px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 2px 10px rgba(0,0,0,0.02)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '8px' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#1e3a8a', margin: 0 }}>
                  🚨 Activate High-Visibility Emergency Broadcast
                </h3>
              </div>

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
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="chart-card" style={{ 
                padding: '24px', 
                background: 'white',
                borderRadius: '16px',
                border: '1px solid #e2e8f0',
                boxShadow: '0 2px 10px rgba(0,0,0,0.02)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                  <ShieldAlert size={22} style={{ color: '#0F766E' }} />
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#1e3a8a', margin: 0 }}>
                    Campus Safety Directives & Emergency Support
                  </h3>
                </div>
                <p style={{ fontSize: '0.9rem', color: '#475569', lineHeight: 1.6, margin: '0 0 18px' }}>
                  Emergency alerts, safety directives, and perimeter advisories are governed strictly by the Principal, Branch Administration, and Superadmin. In case of immediate campus emergencies or safety questions, reach out to the contacts below:
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', marginBottom: '18px' }}>
                  <div style={{ padding: '14px', borderRadius: '12px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Administrative Desk</div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#1e3a8a', marginTop: '4px' }}>Main Office Hotline</div>
                    <div style={{ fontSize: '0.85rem', color: '#0F766E', fontWeight: 700, marginTop: '2px' }}>+91 98201 12300 (Ext: 101)</div>
                  </div>
                  <div style={{ padding: '14px', borderRadius: '12px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Campus Security</div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#1e3a8a', marginTop: '4px' }}>Main Perimeter Gate</div>
                    <div style={{ fontSize: '0.85rem', color: '#DC2626', fontWeight: 700, marginTop: '2px' }}>+91 98201 12399 (24/7 Security)</div>
                  </div>
                  <div style={{ padding: '14px', borderRadius: '12px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Medical & Health</div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#1e3a8a', marginTop: '4px' }}>Campus Infirmary</div>
                    <div style={{ fontSize: '0.85rem', color: '#059669', fontWeight: 700, marginTop: '2px' }}>+91 98201 12355 (Nurse Station)</div>
                  </div>
                  <div style={{ padding: '14px', borderRadius: '12px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Transport Dispatch</div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#1e3a8a', marginTop: '4px' }}>Bus Operations Desk</div>
                    <div style={{ fontSize: '0.85rem', color: '#D97706', fontWeight: 700, marginTop: '2px' }}>+91 98201 12388 (Transport Desk)</div>
                  </div>
                </div>

                <div style={{ padding: '12px 16px', borderRadius: '10px', background: 'rgba(79, 70, 229, 0.06)', border: '1px solid rgba(79, 70, 229, 0.15)', fontSize: '0.82rem', color: '#4338ca', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ShieldAlert size={16} />
                  <span>Authority Notice: Only Superadmin, Admin, and Principal have authorization to trigger or deactivate emergency alerts across all student, parent, and faculty portals.</span>
                </div>
              </div>
            </div>
          )}
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

                  <div style={{ paddingTop: '12px', borderTop: '1px solid #f1f5f9', fontSize: '0.8rem', color: 'var(--color-text-secondary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>Audience: <strong>{evt.audience}</strong></span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ color: '#0F766E', fontWeight: 700 }}>ID: {evt.id}</span>
                      {isAuthorizedLeader && (
                        <button
                          onClick={() => handleDeleteEvent(evt.id)}
                          title="Remove event"
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#ef4444',
                            cursor: 'pointer',
                            padding: '4px',
                            display: 'inline-flex',
                            alignItems: 'center'
                          }}
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredEvents.length === 0 && (
            <div className="chart-card" style={{ padding: '60px', textAlign: 'center', color: 'var(--color-text-secondary)', background: 'white' }}>
              <Calendar size={40} style={{ margin: '0 auto 12px', color: '#cbd5e1' }} />
              <div style={{ fontSize: '1.1rem', fontWeight: 600, color: '#1e3a8a' }}>No Scheduled Events Found</div>
              <p style={{ fontSize: '0.88rem', margin: '6px 0 16px' }}>There are no campus calendar events matching the selected category.</p>
              {isAuthorizedLeader && (
                <button 
                  onClick={() => setIsEventModalOpen(true)}
                  style={{ padding: '8px 16px', background: '#0F766E', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}
                >
                  + Add First Event
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: GRIEVANCE MANAGEMENT (Section 9.21) */}
      {activeTab === 'grievances' && !isAuthorizedLeader && (
        <div className="chart-card" style={{ 
          padding: '60px 24px', 
          textAlign: 'center', 
          background: 'white', 
          borderRadius: '16px', 
          border: '1px solid #e2e8f0', 
          boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '16px'
        }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: 'rgba(239, 68, 68, 0.1)',
            color: '#dc2626',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <ShieldAlert size={32} />
          </div>
          <div style={{ maxWidth: '520px' }}>
            <h3 style={{ margin: '0 0 8px', fontSize: '1.25rem', fontWeight: 800, color: '#1e293b' }}>
              Administrative Authority Required
            </h3>
            <p style={{ margin: 0, fontSize: '0.9rem', color: '#64748b', lineHeight: 1.6 }}>
              All campus grievances and disciplinary concerns are managed exclusively by <strong>Superadmin, Admin, and Principal</strong>. You do not have permission to view or manage school grievances.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '10px', marginTop: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
            <button
              onClick={() => setActiveTab('announcements')}
              style={{
                padding: '10px 20px',
                borderRadius: '10px',
                border: 'none',
                background: '#4F46E5',
                color: 'white',
                fontWeight: 700,
                fontSize: '0.88rem',
                cursor: 'pointer'
              }}
            >
              View Live Notice Board
            </button>
            <button
              onClick={() => setActiveTab('classMaterials')}
              style={{
                padding: '10px 20px',
                borderRadius: '10px',
                border: '1px solid #cbd5e1',
                background: 'white',
                color: '#0F766E',
                fontWeight: 700,
                fontSize: '0.88rem',
                cursor: 'pointer'
              }}
            >
              Class Notes & Assignments
            </button>
          </div>
        </div>
      )}

      {activeTab === 'grievances' && isAuthorizedLeader && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* Governance Notice Banner */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '14px 20px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.08) 0%, rgba(99, 102, 241, 0.04) 100%)',
            border: '1px solid rgba(79, 70, 229, 0.2)',
            fontSize: '0.85rem',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#4338ca', fontWeight: 600 }}>
              <ShieldAlert size={20} />
              <div>
                <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#312e81' }}>
                  Leadership Grievance Management Desk
                </div>
                <div style={{ fontSize: '0.8rem', color: '#4338ca', marginTop: '2px' }}>
                  Superadmin, Admin, and Principal exclusive authority to review, investigate, update workflow state, and resolve campus concerns.
                </div>
              </div>
            </div>
            <button
              onClick={() => setIsGrievanceModalOpen(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: '#F59E0B',
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '8px',
                fontWeight: 700,
                fontSize: '0.82rem',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(245, 158, 11, 0.3)'
              }}
            >
              <Plus size={15} /> Log Grievance Ticket
            </button>
          </div>

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
                  <th style={{ padding: '14px 20px', textAlign: 'right' }}>Leadership Actions</th>
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
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end', alignItems: 'center' }}>
                          <button
                            onClick={() => handleOpenManageGrievance(ticket)}
                            style={{ 
                              padding: '6px 12px', 
                              borderRadius: '6px', 
                              border: '1px solid #4F46E5', 
                              background: 'rgba(79, 70, 229, 0.08)', 
                              color: '#4F46E5', 
                              fontSize: '0.75rem', 
                              fontWeight: 700, 
                              cursor: 'pointer' 
                            }}
                          >
                            Manage
                          </button>
                          {!isResolved && ticket.status === 'Open' && (
                            <button
                              onClick={() => handleUpdateGrievanceStatus(ticket.id, 'In Progress')}
                              style={{ 
                                padding: '6px 12px', 
                                borderRadius: '6px', 
                                border: '1px solid #cbd5e1', 
                                background: 'white', 
                                color: '#d97706', 
                                fontSize: '0.75rem', 
                                fontWeight: 700, 
                                cursor: 'pointer' 
                              }}
                            >
                              In Progress
                            </button>
                          )}
                          {!isResolved && (
                            <button
                              onClick={() => handleUpdateGrievanceStatus(ticket.id, 'Resolved')}
                              style={{ 
                                padding: '6px 12px', 
                                borderRadius: '6px', 
                                border: 'none', 
                                background: '#16a34a', 
                                color: 'white', 
                                fontSize: '0.75rem', 
                                fontWeight: 700, 
                                cursor: 'pointer' 
                              }}
                            >
                              Resolve
                            </button>
                          )}
                          {isResolved && (
                            <span style={{ fontSize: '0.78rem', color: '#16a34a', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px', marginRight: '4px' }}>
                              <Check size={14} /> Closed
                            </span>
                          )}
                          <button
                            onClick={() => handleDismissGrievance(ticket.id)}
                            title="Dismiss ticket"
                            style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px', display: 'inline-flex', alignItems: 'center' }}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {filteredGrievances.length === 0 && (
              <div style={{ padding: '48px', textAlign: 'center', color: '#64748b' }}>
                <LifeBuoy size={36} style={{ margin: '0 auto 10px', color: '#cbd5e1' }} />
                <div style={{ fontWeight: 700, color: '#1e3a8a', fontSize: '1rem' }}>No Grievances in this Category</div>
                <p style={{ fontSize: '0.82rem', margin: '4px 0 0', color: '#94a3b8' }}>All tickets have been reviewed or no records match the selected filter.</p>
              </div>
            )}
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

      {/* TAB 6: CLASS NOTES & ASSIGNMENTS (CLASS-WISE SYSTEM) */}
      {activeTab === 'classMaterials' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Filter Bar */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            gap: '12px', 
            flexWrap: 'wrap',
            background: 'white',
            padding: '14px 20px',
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 2px 10px rgba(0,0,0,0.02)'
          }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#475569' }}>Class:</span>
                <select
                  value={classMaterialFilterClass}
                  onChange={(e) => setClassMaterialFilterClass(e.target.value)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '10px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    color: '#1e293b',
                    background: 'white',
                    cursor: 'pointer',
                    outline: 'none'
                  }}
                >
                  <option value="All">All Classes ({availableClasses.length})</option>
                  {availableClasses.map((clsName) => (
                    <option key={clsName} value={clsName}>{clsName}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#475569' }}>Category:</span>
                <select
                  value={classMaterialFilterType}
                  onChange={(e) => setClassMaterialFilterType(e.target.value)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '10px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    color: '#1e293b',
                    background: 'white',
                    cursor: 'pointer',
                    outline: 'none'
                  }}
                >
                  <option value="All">All Post Types ({classMaterials.length})</option>
                  <option value="Notes">Study Notes & Material ({notesCount})</option>
                  <option value="Assignments">Homework & Assignments ({assignmentsCount})</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flex: 1, maxWidth: '380px', minWidth: '220px' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: '#f8fafc',
                border: '1.5px solid #e2e8f0',
                borderRadius: '10px',
                padding: '6px 14px',
                width: '100%'
              }}>
                <Search size={16} color="#94a3b8" />
                <input
                  type="text"
                  placeholder="Search notes, subject, chapter..."
                  value={classMaterialSearch}
                  onChange={(e) => setClassMaterialSearch(e.target.value)}
                  style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '0.85rem', width: '100%', color: '#1e293b' }}
                />
                {classMaterialSearch && (
                  <button onClick={() => setClassMaterialSearch('')} style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 0 }}>
                    <X size={14} color="#94a3b8" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Cards Grid */}
          {filteredClassMaterials.length === 0 ? (
            <div style={{ 
              background: 'white', 
              borderRadius: '16px', 
              padding: '60px 20px', 
              textAlign: 'center', 
              border: '1px solid #e2e8f0',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px'
            }}>
              <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(15, 118, 110, 0.1)', color: '#0F766E', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <BookOpen size={28} />
              </div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>No Class Materials Found</h3>
              <p style={{ margin: 0, fontSize: '0.88rem', color: '#64748b', maxWidth: '420px' }}>
                {classMaterialFilterClass !== 'All' 
                  ? `No study notes or assignments have been broadcast to ${classMaterialFilterClass} yet.`
                  : 'Start sending structured notes, chapter summaries, and homework assignments class-wise.'}
              </p>
              {canPostClassMaterial && (
                <button
                  onClick={() => setIsCreateMaterialModalOpen(true)}
                  style={{
                    marginTop: '8px',
                    background: '#0F766E',
                    color: 'white',
                    border: 'none',
                    padding: '10px 20px',
                    borderRadius: '10px',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <Plus size={16} /> Send First Note to Class
                </button>
              )}
            </div>
          ) : (
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', 
              gap: '18px' 
            }}>
              {filteredClassMaterials.map((item) => {
                const isAsg = item.type === 'Assignment';
                return (
                  <div 
                    key={item._id || item.id} 
                    className="hover-lift"
                    style={{
                      background: 'white',
                      borderRadius: '18px',
                      border: '1px solid #e2e8f0',
                      borderLeft: `5px solid ${isAsg ? '#4F46E5' : '#0F766E'}`,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
                      padding: '20px 22px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      gap: '14px',
                      transition: 'all 0.2s'
                    }}
                  >
                    <div>
                      {/* Badge Ribbon */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                          <span style={{ 
                            fontSize: '0.75rem', 
                            fontWeight: 800, 
                            background: 'rgba(15, 118, 110, 0.1)', 
                            color: '#0F766E', 
                            padding: '3px 10px', 
                            borderRadius: '12px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}>
                            <GraduationCap size={12} /> {item.classSection}
                          </span>
                          <span style={{ 
                            fontSize: '0.72rem', 
                            fontWeight: 700, 
                            background: '#f1f5f9', 
                            color: '#475569', 
                            padding: '3px 9px', 
                            borderRadius: '12px'
                          }}>
                            {item.subject}
                          </span>
                        </div>

                        <span style={{ 
                          fontSize: '0.72rem', 
                          fontWeight: 800, 
                          textTransform: 'uppercase', 
                          letterSpacing: '0.04em',
                          padding: '3px 10px', 
                          borderRadius: '12px',
                          background: isAsg ? 'rgba(79, 70, 229, 0.1)' : 'rgba(16, 185, 129, 0.12)',
                          color: isAsg ? '#4F46E5' : '#10B981',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}>
                          {isAsg ? <CheckCircle2 size={12} /> : <FileText size={12} />}
                          {isAsg ? 'Assignment' : 'Study Note'}
                        </span>
                      </div>

                      {/* Title & Chapter */}
                      <h4 style={{ 
                        margin: '0 0 6px 0', 
                        fontSize: '1.08rem', 
                        fontWeight: 800, 
                        color: '#0f172a',
                        lineHeight: 1.35
                      }}>
                        {item.title}
                      </h4>

                      {item.chapter && (
                        <div style={{ 
                          fontSize: '0.78rem', 
                          color: '#64748b', 
                          fontWeight: 600, 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '5px',
                          marginBottom: '10px'
                        }}>
                          <Layers size={13} color="#94a3b8" />
                          <span>{item.chapter}</span>
                        </div>
                      )}

                      {/* Content Preview */}
                      <p style={{ 
                        margin: 0, 
                        fontSize: '0.86rem', 
                        color: '#334155', 
                        lineHeight: 1.55,
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                      }}>
                        {item.content}
                      </p>

                      {/* Assignment Metrics (if assignment) */}
                      {isAsg && (
                        <div style={{ 
                          marginTop: '12px', 
                          padding: '10px 14px', 
                          background: '#f8fafc', 
                          borderRadius: '10px',
                          border: '1px solid #e2e8f0',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          fontSize: '0.78rem'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#4F46E5', fontWeight: 700 }}>
                            <Calendar size={13} />
                            <span>Due: {item.dueDate ? new Date(item.dueDate).toLocaleDateString() : 'Next Week'}</span>
                          </div>
                          <div style={{ fontWeight: 800, color: '#0f172a' }}>
                            Max: {item.maxMarks || 50} Marks
                          </div>
                        </div>
                      )}

                      {/* Attachments Preview */}
                      {item.attachments && item.attachments.length > 0 && (
                        <div style={{ marginTop: '10px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                          {item.attachments.map((att, attIdx) => (
                            <span 
                              key={attIdx} 
                              style={{ 
                                fontSize: '0.74rem', 
                                background: '#f8fafc', 
                                border: '1px solid #cbd5e1', 
                                padding: '3px 8px', 
                                borderRadius: '8px', 
                                color: '#475569', 
                                display: 'inline-flex', 
                                alignItems: 'center', 
                                gap: '4px' 
                              }}
                            >
                              <Paperclip size={11} color="#64748b" />
                              {att.title || 'Attachment.pdf'}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Card Footer */}
                    <div style={{ 
                      borderTop: '1px solid #f1f5f9', 
                      paddingTop: '12px', 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      fontSize: '0.78rem',
                      color: '#64748b'
                    }}>
                      <div>
                        Sent by <strong>{item.teacherName || 'Faculty'}</strong> • {new Date(item.createdAt || Date.now()).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                      </div>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <button
                          onClick={() => setSelectedMaterialDetail(item)}
                          style={{
                            padding: '5px 12px',
                            background: '#f1f5f9',
                            color: '#1e293b',
                            border: '1px solid #cbd5e1',
                            borderRadius: '8px',
                            fontWeight: 700,
                            fontSize: '0.76rem',
                            cursor: 'pointer'
                          }}
                        >
                          View Full
                        </button>
                        {canPostClassMaterial && (
                          <button
                            onClick={() => handleDeleteMaterial(item._id || item.id)}
                            title="Remove material"
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: '#ef4444',
                              cursor: 'pointer',
                              padding: '4px'
                            }}
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* CREATE ANNOUNCEMENT MODAL (Superadmin, Admin & Principal) */}
      {isAnnounceModalOpen && isAuthorizedLeader && createPortal(
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 99999, padding: '20px'
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
        </div>,
        document.body
      )}

      {/* CREATE EVENT MODAL (Superadmin, Admin & Principal) */}
      {isEventModalOpen && isAuthorizedLeader && createPortal(
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 99999, padding: '20px'
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
        </div>,
        document.body
      )}

      {/* CREATE GRIEVANCE MODAL */}
      {isGrievanceModalOpen && createPortal(
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 99999, padding: '20px'
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
        </div>,
        document.body
      )}

      {/* MANAGE GRIEVANCE MODAL (Superadmin, Admin & Principal) */}
      {selectedGrievanceForManage && isAuthorizedLeader && createPortal(
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 99999, padding: '20px'
        }}>
          <div style={{
            background: 'white', borderRadius: '16px', width: '100%', maxWidth: '540px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.15)', overflow: 'hidden',
            border: '1px solid rgba(226, 232, 240, 0.9)'
          }}>
            <div style={{
              padding: '20px 24px', borderBottom: '1px solid #e2e8f0',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              background: 'linear-gradient(135deg, #eff6ff 0%, #e0e7ff 100%)'
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                  <ShieldAlert size={18} style={{ color: '#4338ca' }} />
                  <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#4338ca', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Leadership Authority Desk
                  </span>
                </div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#1e3a8a' }}>
                  Manage Ticket: {selectedGrievanceForManage.id}
                </h3>
              </div>
              <button
                onClick={() => setSelectedGrievanceForManage(null)}
                style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              >
                <X size={16} style={{ color: '#64748b' }} />
              </button>
            </div>

            <div style={{ padding: '16px 24px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              <div style={{ fontWeight: 800, color: '#1e293b', fontSize: '0.95rem' }}>{selectedGrievanceForManage.title}</div>
              <div style={{ display: 'flex', gap: '12px', fontSize: '0.8rem', color: '#64748b', marginTop: '4px', flexWrap: 'wrap' }}>
                <span>Category: <strong>{selectedGrievanceForManage.category}</strong></span>
                <span>•</span>
                <span>Raised By: <strong>{selectedGrievanceForManage.raisedBy}</strong></span>
                <span>•</span>
                <span>Student: <strong>{selectedGrievanceForManage.student}</strong></span>
              </div>
            </div>

            <form onSubmit={handleSaveGrievanceManagement} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#1e3a8a', marginBottom: '6px' }}>
                    Resolution Status *
                  </label>
                  <select
                    value={manageGrievanceForm.status}
                    onChange={(e) => setManageGrievanceForm({ ...manageGrievanceForm, status: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', background: 'white', fontWeight: 600 }}
                  >
                    <option value="Open">🔴 Open</option>
                    <option value="In Progress">🟡 In Progress</option>
                    <option value="Resolved">🟢 Resolved</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#1e3a8a', marginBottom: '6px' }}>
                    Priority Level *
                  </label>
                  <select
                    value={manageGrievanceForm.priority}
                    onChange={(e) => setManageGrievanceForm({ ...manageGrievanceForm, priority: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', background: 'white', fontWeight: 600 }}
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#1e3a8a', marginBottom: '6px' }}>
                  Official Administrative Remarks & Resolution Notes
                </label>
                <textarea
                  rows={4}
                  value={manageGrievanceForm.remarks}
                  onChange={(e) => setManageGrievanceForm({ ...manageGrievanceForm, remarks: e.target.value })}
                  placeholder="Record leadership investigation findings, remedial steps taken, or resolution summary..."
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={() => setSelectedGrievanceForManage(null)}
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
                    background: '#4F46E5', 
                    color: 'white', 
                    fontWeight: 700, 
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)'
                  }}
                >
                  Save & Update Ticket
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* CREATE CLASS MATERIAL MODAL (Notes / Assignments - Faculty & Leaders) */}
      {isCreateMaterialModalOpen && canPostClassMaterial && createPortal(
        <div 
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
            padding: '24px 16px',
            boxSizing: 'border-box'
          }}
          onClick={() => setIsCreateMaterialModalOpen(false)}
        >
          <div 
            style={{
              background: 'white', 
              borderRadius: '24px', 
              width: '100%', 
              maxWidth: '680px',
              maxHeight: 'min(90vh, 780px)', 
              boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.35), 0 0 0 1px rgba(226, 232, 240, 0.8)', 
              overflow: 'hidden',
              display: 'flex', 
              flexDirection: 'column'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header (Fixed) */}
            <div style={{
              padding: '20px 24px', 
              borderBottom: '1px solid #e2e8f0',
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              background: 'linear-gradient(135deg, rgba(15, 118, 110, 0.08) 0%, rgba(99, 102, 241, 0.08) 100%)',
              flexShrink: 0
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '12px',
                  background: materialForm.type === 'Assignment' ? 'rgba(79, 70, 229, 0.12)' : 'rgba(15, 118, 110, 0.12)',
                  color: materialForm.type === 'Assignment' ? '#4F46E5' : '#0F766E',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  {materialForm.type === 'Assignment' ? <FileText size={22} /> : <BookOpen size={22} />}
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
                    Send Class Notes & Assignments
                  </h3>
                  <div style={{ fontSize: '0.82rem', color: '#64748B', marginTop: '2px' }}>
                    Target specific classes and sections with structured learning notes or homework.
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateMaterialModalOpen(false)}
                style={{ 
                  background: 'white', 
                  border: '1px solid #e2e8f0', 
                  borderRadius: '10px', 
                  width: '34px', 
                  height: '34px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  cursor: 'pointer',
                  color: '#64748B',
                  transition: 'all 0.15s'
                }}
                onMouseOver={(e) => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.color = '#0f172a'; }}
                onMouseOut={(e) => { e.currentTarget.style.background = 'white'; e.currentTarget.style.color = '#64748B'; }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Form Content (Scrollable with minHeight 0) */}
            <form 
              id="createMaterialForm"
              onSubmit={handleCreateMaterial} 
              style={{ 
                padding: '22px 24px', 
                overflowY: 'auto', 
                flex: 1, 
                minHeight: 0, 
                display: 'flex', 
                flexDirection: 'column', 
                gap: '16px' 
              }}
            >
              {/* Type Switcher */}
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#1e3a8a', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Material Type *
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <button
                    type="button"
                    onClick={() => setMaterialForm({ ...materialForm, type: 'Note' })}
                    style={{
                      padding: '12px 14px',
                      borderRadius: '12px',
                      border: materialForm.type === 'Note' ? '2px solid #0F766E' : '1px solid #cbd5e1',
                      background: materialForm.type === 'Note' ? 'rgba(15, 118, 110, 0.08)' : 'white',
                      color: materialForm.type === 'Note' ? '#0F766E' : '#64748B',
                      fontWeight: 700,
                      fontSize: '0.88rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      cursor: 'pointer',
                      transition: 'all 0.15s'
                    }}
                  >
                    <BookOpen size={18} />
                    <span>📝 Study Notes & Material</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMaterialForm({ ...materialForm, type: 'Assignment' })}
                    style={{
                      padding: '12px 14px',
                      borderRadius: '12px',
                      border: materialForm.type === 'Assignment' ? '2px solid #4F46E5' : '1px solid #cbd5e1',
                      background: materialForm.type === 'Assignment' ? 'rgba(79, 70, 229, 0.08)' : 'white',
                      color: materialForm.type === 'Assignment' ? '#4F46E5' : '#64748B',
                      fontWeight: 700,
                      fontSize: '0.88rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      cursor: 'pointer',
                      transition: 'all 0.15s'
                    }}
                  >
                    <CheckCircle2 size={18} />
                    <span>📋 Homework Assignment</span>
                  </button>
                </div>
              </div>

              {/* Class & Subject */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#1e3a8a', marginBottom: '6px' }}>
                    Target Class & Section *
                  </label>
                  <select
                    required
                    value={materialForm.classSection}
                    onChange={(e) => setMaterialForm({ ...materialForm, classSection: e.target.value })}
                    style={{ 
                      width: '100%', 
                      padding: '10px 14px', 
                      borderRadius: '10px', 
                      border: '1.5px solid #cbd5e1', 
                      fontSize: '0.88rem', 
                      background: 'white',
                      fontWeight: 600,
                      color: '#0f172a'
                    }}
                  >
                    {availableClasses.map((clsName) => (
                      <option key={clsName} value={clsName}>{clsName}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#1e3a8a', marginBottom: '6px' }}>
                    Subject *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Mathematics, Science"
                    value={materialForm.subject}
                    onChange={(e) => setMaterialForm({ ...materialForm, subject: e.target.value })}
                    style={{ 
                      width: '100%', 
                      padding: '10px 14px', 
                      borderRadius: '10px', 
                      border: '1.5px solid #cbd5e1', 
                      fontSize: '0.88rem',
                      outline: 'none',
                      color: '#0f172a'
                    }}
                  />
                </div>
              </div>

              {/* Chapter & Title */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 2fr', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#1e3a8a', marginBottom: '6px' }}>
                    Chapter / Topic (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Chapter 4: Quadratic Eq."
                    value={materialForm.chapter}
                    onChange={(e) => setMaterialForm({ ...materialForm, chapter: e.target.value })}
                    style={{ 
                      width: '100%', 
                      padding: '10px 14px', 
                      borderRadius: '10px', 
                      border: '1.5px solid #cbd5e1', 
                      fontSize: '0.88rem',
                      outline: 'none',
                      color: '#0f172a'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#1e3a8a', marginBottom: '6px' }}>
                    Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={materialForm.type === 'Assignment' ? 'e.g. Homework: Problem Set #3' : 'e.g. Formula Sheet & Derivations'}
                    value={materialForm.title}
                    onChange={(e) => setMaterialForm({ ...materialForm, title: e.target.value })}
                    style={{ 
                      width: '100%', 
                      padding: '10px 14px', 
                      borderRadius: '10px', 
                      border: '1.5px solid #cbd5e1', 
                      fontSize: '0.88rem',
                      outline: 'none',
                      color: '#0f172a'
                    }}
                  />
                </div>
              </div>

              {/* Assignment-specific Fields: Due Date & Max Marks */}
              {materialForm.type === 'Assignment' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', background: 'rgba(79, 70, 229, 0.05)', padding: '12px 16px', borderRadius: '12px', border: '1px solid rgba(79, 70, 229, 0.15)' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#4F46E5', marginBottom: '6px' }}>
                      Submission Deadline
                    </label>
                    <input
                      type="date"
                      value={materialForm.dueDate}
                      onChange={(e) => setMaterialForm({ ...materialForm, dueDate: e.target.value })}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', background: 'white' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#4F46E5', marginBottom: '6px' }}>
                      Maximum Marks
                    </label>
                    <input
                      type="number"
                      min={5}
                      max={200}
                      value={materialForm.maxMarks}
                      onChange={(e) => setMaterialForm({ ...materialForm, maxMarks: e.target.value })}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', background: 'white' }}
                    />
                  </div>
                </div>
              )}

              {/* Content / Notes Textarea */}
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#1e3a8a', marginBottom: '6px' }}>
                  {materialForm.type === 'Assignment' ? 'Assignment Questions & Instructions *' : 'Lecture Notes & Study Material Content *'}
                </label>
                <textarea
                  required
                  rows={4}
                  value={materialForm.content}
                  onChange={(e) => setMaterialForm({ ...materialForm, content: e.target.value })}
                  placeholder={
                    materialForm.type === 'Assignment'
                      ? "List homework questions, submission steps, and required solution format..."
                      : "Write core formulas, chapter summaries, key derivation steps, and lecture takeaways..."
                  }
                  style={{ 
                    width: '100%', 
                    padding: '12px 14px', 
                    borderRadius: '10px', 
                    border: '1.5px solid #cbd5e1', 
                    fontSize: '0.88rem', 
                    lineHeight: 1.5, 
                    resize: 'vertical',
                    fontFamily: 'inherit',
                    color: '#0f172a',
                    outline: 'none'
                  }}
                />
              </div>

              {/* Optional Attachment Fields */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#64748B', marginBottom: '4px' }}>
                    Resource Document Name (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Chapter4_Formulas.pdf"
                    value={materialForm.attachmentTitle}
                    onChange={(e) => setMaterialForm({ ...materialForm, attachmentTitle: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#64748B', marginBottom: '4px' }}>
                    Document / Google Drive Link (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. https://drive.google.com/..."
                    value={materialForm.attachmentUrl}
                    onChange={(e) => setMaterialForm({ ...materialForm, attachmentUrl: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                  />
                </div>
              </div>
            </form>

            {/* Modal Footer (Fixed at bottom so it NEVER gets cut off!) */}
            <div style={{
              padding: '16px 24px', 
              borderTop: '1px solid #e2e8f0', 
              background: '#f8fafc', 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              flexShrink: 0
            }}>
              <div style={{ fontSize: '0.82rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: materialForm.type === 'Assignment' ? '#4F46E5' : '#0F766E' }} />
                Targeting: <strong style={{ color: '#0f172a' }}>{materialForm.classSection}</strong>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setIsCreateMaterialModalOpen(false)}
                  style={{ padding: '9px 18px', borderRadius: '10px', border: '1px solid #cbd5e1', background: 'white', color: '#64748b', fontWeight: 600, fontSize: '0.88rem', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  form="createMaterialForm"
                  disabled={isSubmittingMaterial}
                  style={{ 
                    padding: '9px 22px', 
                    borderRadius: '10px', 
                    border: 'none', 
                    background: materialForm.type === 'Assignment' ? 'linear-gradient(135deg, #4F46E5, #6366F1)' : 'linear-gradient(135deg, #0F766E, #14B8A6)', 
                    color: 'white', 
                    fontWeight: 700, 
                    fontSize: '0.88rem',
                    cursor: isSubmittingMaterial ? 'not-allowed' : 'pointer',
                    boxShadow: materialForm.type === 'Assignment' ? '0 4px 12px rgba(79, 70, 229, 0.3)' : '0 4px 12px rgba(15, 118, 110, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <Send size={15} />
                  <span>{isSubmittingMaterial ? 'Broadcasting...' : `Send to ${materialForm.classSection}`}</span>
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* VIEW FULL MATERIAL DETAIL MODAL */}
      {selectedMaterialDetail && createPortal(
        <div 
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
            padding: '24px 16px',
            boxSizing: 'border-box'
          }}
          onClick={() => setSelectedMaterialDetail(null)}
        >
          <div 
            style={{
              background: 'white', 
              borderRadius: '24px', 
              width: '100%', 
              maxWidth: '680px',
              maxHeight: 'min(90vh, 780px)', 
              boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.35), 0 0 0 1px rgba(226, 232, 240, 0.8)', 
              overflow: 'hidden',
              display: 'flex', 
              flexDirection: 'column'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header (Fixed) */}
            <div style={{
              padding: '20px 24px', 
              borderBottom: '1px solid #e2e8f0',
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'flex-start',
              background: 'linear-gradient(135deg, rgba(15, 118, 110, 0.08) 0%, rgba(99, 102, 241, 0.08) 100%)',
              flexShrink: 0
            }}>
              <div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.78rem', fontWeight: 800, background: 'rgba(15, 118, 110, 0.12)', color: '#0F766E', padding: '3px 10px', borderRadius: '12px' }}>
                    {selectedMaterialDetail.classSection}
                  </span>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, background: '#e2e8f0', color: '#334155', padding: '3px 9px', borderRadius: '12px' }}>
                    {selectedMaterialDetail.subject}
                  </span>
                  <span style={{ fontSize: '0.75rem', fontWeight: 800, background: selectedMaterialDetail.type === 'Assignment' ? 'rgba(79, 70, 229, 0.12)' : 'rgba(16, 185, 129, 0.14)', color: selectedMaterialDetail.type === 'Assignment' ? '#4F46E5' : '#0F766E', padding: '3px 9px', borderRadius: '12px' }}>
                    {selectedMaterialDetail.type}
                  </span>
                </div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
                  {selectedMaterialDetail.title}
                </h3>
                {selectedMaterialDetail.chapter && (
                  <div style={{ fontSize: '0.82rem', color: '#64748B', marginTop: '4px' }}>
                    {selectedMaterialDetail.chapter}
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => setSelectedMaterialDetail(null)}
                style={{ 
                  background: 'white', 
                  border: '1px solid #e2e8f0', 
                  borderRadius: '10px', 
                  width: '34px', 
                  height: '34px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  cursor: 'pointer',
                  color: '#64748B',
                  transition: 'all 0.15s'
                }}
                onMouseOver={(e) => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.color = '#0f172a'; }}
                onMouseOut={(e) => { e.currentTarget.style.background = 'white'; e.currentTarget.style.color = '#64748B'; }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Content (Scrollable with minHeight 0) */}
            <div style={{ padding: '24px', overflowY: 'auto', flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {selectedMaterialDetail.type === 'Assignment' && (
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', background: 'rgba(79, 70, 229, 0.05)', borderRadius: '12px', border: '1px solid rgba(79, 70, 229, 0.15)', fontSize: '0.85rem' }}>
                  <div style={{ fontWeight: 700, color: '#4F46E5' }}>
                    📅 Due Date: {selectedMaterialDetail.dueDate ? new Date(selectedMaterialDetail.dueDate).toLocaleDateString() : 'N/A'}
                  </div>
                  <div style={{ fontWeight: 800, color: '#0f172a' }}>
                    ⭐ Max Marks: {selectedMaterialDetail.maxMarks || 50}
                  </div>
                </div>
              )}

              <div>
                <h5 style={{ margin: '0 0 8px 0', fontSize: '0.82rem', fontWeight: 700, textTransform: 'uppercase', color: '#64748B', letterSpacing: '0.04em' }}>Content & Notes:</h5>
                <div style={{ 
                  background: '#f8fafc', 
                  padding: '16px 20px', 
                  borderRadius: '12px', 
                  border: '1px solid #e2e8f0',
                  fontSize: '0.92rem', 
                  lineHeight: 1.6, 
                  color: '#1e293b', 
                  whiteSpace: 'pre-wrap',
                  fontFamily: 'inherit'
                }}>
                  {selectedMaterialDetail.content}
                </div>
              </div>

              {selectedMaterialDetail.attachments && selectedMaterialDetail.attachments.length > 0 && (
                <div>
                  <h5 style={{ margin: '0 0 8px 0', fontSize: '0.82rem', fontWeight: 700, textTransform: 'uppercase', color: '#64748B', letterSpacing: '0.04em' }}>Attachments:</h5>
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    {selectedMaterialDetail.attachments.map((att, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 14px', background: 'white', border: '1.5px solid #cbd5e1', borderRadius: '10px', fontSize: '0.85rem' }}>
                        <Paperclip size={16} color="#0F766E" />
                        <span style={{ fontWeight: 600, color: '#0f172a' }}>{att.title}</span>
                        <span style={{ fontSize: '0.75rem', color: '#64748b' }}>({att.fileSize || '1.5 MB'})</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer (Fixed) */}
            <div style={{ borderTop: '1px solid #e2e8f0', padding: '14px 24px', background: '#f8fafc', fontSize: '0.82rem', color: '#64748B', display: 'flex', justifyContent: 'space-between', flexShrink: 0 }}>
              <span>Broadcast to: <strong style={{ color: '#0f172a' }}>{selectedMaterialDetail.classSection}</strong></span>
              <span>Instructor: <strong style={{ color: '#0f172a' }}>{selectedMaterialDetail.teacherName || 'Faculty'}</strong></span>
            </div>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
};

export default Communication;
