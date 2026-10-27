import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  FlaskConical, Microscope, Atom, TestTube, Sparkles, Plus, 
  Search, Filter, CheckCircle2, AlertTriangle, Clock, Calendar, 
  Users, MapPin, ShieldAlert, Wrench, RefreshCw, X, Check,
  ExternalLink, ChevronRight, Bookmark, ArrowUpRight, ShieldCheck,
  Activity, BookOpen, Layers, Flame, AlertOctagon, HelpCircle,
  Eye, Droplets, Info, CheckSquare, Square, CalendarPlus, Trash2, Edit3
} from 'lucide-react';
import StaffPunchClock from '../components/StaffPunchClock';

const API_BASE = 'http://localhost:5000/api';

const LabDashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const tenantSlug = sessionStorage.getItem('tenantSlug') || '';
  const userInfo = JSON.parse(sessionStorage.getItem('userInfo') || '{}');
  const token = userInfo.token || sessionStorage.getItem('token') || '';

  // Parse active tab from URL query params or default to 'schedule'
  const searchParams = new URLSearchParams(location.search);
  const initialTab = searchParams.get('tab') || 'schedule';
  const [activeTab, setActiveTab] = useState(
    ['schedule', 'equipments', 'chemicals', 'safety', 'overview'].includes(initialTab) ? initialTab : 'schedule'
  );

  useEffect(() => {
    const tabParam = new URLSearchParams(location.search).get('tab');
    if (tabParam && ['schedule', 'equipments', 'chemicals', 'safety', 'overview'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [location.search]);

  const switchTab = (tabId) => {
    setActiveTab(tabId);
    navigate({
      pathname: location.pathname,
      search: `?tab=${tabId}`
    }, { replace: true });
  };

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalLabs: 4,
    totalItems: 24,
    totalEquipments: 14,
    totalChemicals: 10,
    operationalCount: 21,
    lowStockCount: 2,
    calibrationCount: 1,
    todayPracticals: 4,
    todayStudentsCount: 114,
    safetyComplianceScore: 98,
    assistantName: userInfo.name || 'Mr. Sujal Vishwa',
    assistantEmpId: 'EMP-107',
    department: 'Science & Laboratories',
    campus: sessionStorage.getItem('schoolName') || 'Neel Public School (Main Campus)'
  });

  const [inventory, setInventory] = useState([]);
  const [practicals, setPracticals] = useState([]);

  // Search & Filters for Equipments & Chemicals
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLabFilter, setSelectedLabFilter] = useState('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('all');
  const [selectedHazardFilter, setSelectedHazardFilter] = useState('all');

  // Modals: Inventory Add Item
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [modalType, setModalType] = useState('equipment'); // 'equipment' or 'chemical'
  const [itemForm, setItemForm] = useState({
    name: '',
    labType: 'Chemistry',
    category: 'Apparatus',
    quantity: '10',
    unit: 'pcs',
    status: 'Operational',
    location: 'Shelf 1',
    hazardLevel: 'None',
    minimumThreshold: '5',
    notes: ''
  });
  const [isSubmittingItem, setIsSubmittingItem] = useState(false);

  // Modal: Schedule / Edit Practical Session (Lab Assistant Authority)
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [editingPracticalId, setEditingPracticalId] = useState(null);
  const [practicalForm, setPracticalForm] = useState({
    title: '',
    subject: 'Chemistry Practical',
    labRoom: 'Chemistry Lab 1 (Room 208)',
    classSection: 'Class 10 - Section A',
    studentCount: '32',
    workstationsCount: '16',
    instructor: 'Mrs. Neha Verma',
    timeSlot: '10:15 AM - 11:45 AM',
    scheduledDate: new Date().toISOString().split('T')[0],
    requiredEquipments: '',
    requiredChemicals: '',
    safetyRequirements: 'Mandatory cotton lab coats & splash goggles, active fume extraction',
    readinessStatus: 'Setup Required',
    notes: 'Workstations configured (2 students per bench).'
  });
  const [isSubmittingPractical, setIsSubmittingPractical] = useState(false);

  // Modal Escape key listener and body scroll lock
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (isScheduleModalOpen) setIsScheduleModalOpen(false);
        if (isAddModalOpen) setIsAddModalOpen(false);
      }
    };
    if (isScheduleModalOpen || isAddModalOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isScheduleModalOpen, isAddModalOpen]);

  // Practical Preparation Bench Checklists (Local State for Assistant Check-offs)
  const [benchChecklists, setBenchChecklists] = useState({});

  const toggleBenchCheck = (pracId, itemText) => {
    setBenchChecklists(prev => {
      const currentList = prev[pracId] || {};
      return {
        ...prev,
        [pracId]: {
          ...currentList,
          [itemText]: !currentList[itemText]
        }
      };
    });
  };

  // Safety Checklist State
  const [safetyChecklist, setSafetyChecklist] = useState([
    { id: 1, label: 'Emergency Chemical Eye-Wash Station Purged & Flow Certified', lab: 'Chemistry & Biology', checked: true },
    { id: 2, label: 'CO2 & Dry Chemical Fire Extinguishers Pressure In Green Zone', lab: 'All Science Labs', checked: true },
    { id: 3, label: 'Fume Hood Air Extraction Flow Certified at 0.5 m/s velocity', lab: 'Chemistry Lab 1', checked: true },
    { id: 4, label: 'Acid/Base Neutralizer Spill Kit Fully Stocked on Stand 1', lab: 'Chemistry Lab 1', checked: true },
    { id: 5, label: 'Biological Glassware Sharps Bin Disinfected & Labeled', lab: 'Biology Lab (205)', checked: true },
    { id: 6, label: 'Master LPG & Bunsen Gas Supply Valve Locked After Shift', lab: 'Chemistry Lab 1', checked: true },
    { id: 7, label: 'First Aid Burn & Chemical Trauma Kit Inspected for Expired Ointments', lab: 'Infirmary Corridor', checked: false }
  ]);

  // Daily Tasks Checklist
  const [labTasks, setLabTasks] = useState([
    { id: 1, text: 'Prepare 1.5L 0.1M standard NaOH titration solution for Class 10-A', done: true },
    { id: 2, text: 'Clean and inspect 15 compound immersion lenses for Class 9 Biology', done: true },
    { id: 3, text: 'Calibrate optical bench light pins & convex lenses in Physics Lab 2', done: true },
    { id: 4, text: 'Restock safranin biological stain & cover slips in Biology Rack A', done: false },
    { id: 5, text: 'Lock master gas supply cylinder and check fume hood dampers', done: false }
  ]);
  const [newTaskInput, setNewTaskInput] = useState('');

  // Toast notification
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: '', type: 'success' });
    }, 3500);
  };

  const getHeaders = () => {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (tenantSlug) headers['x-tenant-slug'] = tenantSlug;
    return headers;
  };

  const fetchLabData = async () => {
    setLoading(true);
    try {
      const headers = getHeaders();

      // Stats
      const statsRes = await fetch(`${API_BASE}/lab/stats`, { headers });
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        if (statsData.stats) setStats(prev => ({ ...prev, ...statsData.stats }));
      }

      // Inventory
      const invRes = await fetch(`${API_BASE}/lab/inventory`, { headers });
      if (invRes.ok) {
        const invData = await invRes.json();
        if (Array.isArray(invData.items)) setInventory(invData.items);
      }

      // Practicals
      const pracRes = await fetch(`${API_BASE}/lab/practicals`, { headers });
      if (pracRes.ok) {
        const pracData = await pracRes.json();
        if (Array.isArray(pracData.practicals)) setPracticals(pracData.practicals);
      }
    } catch (err) {
      console.warn('Error loading lab data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLabData();
  }, [tenantSlug]);

  // Practical status change
  const handleTogglePracticalReady = async (pracId, currentStatus) => {
    const nextStatus = 
      currentStatus === 'Setup Required' ? 'In Progress' :
      currentStatus === 'In Progress' ? 'Ready & Sanitized' :
      currentStatus === 'Ready & Sanitized' ? 'Completed' : 'Setup Required';

    try {
      const headers = getHeaders();
      const res = await fetch(`${API_BASE}/lab/practicals/${pracId}/status`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ status: nextStatus })
      });
      if (res.ok) {
        setPracticals(prev => prev.map(p => (p._id === pracId || p.id === pracId) ? { ...p, readinessStatus: nextStatus } : p));
        showToast(`Updated session readiness to "${nextStatus}"!`);
      }
    } catch (err) {
      setPracticals(prev => prev.map(p => (p._id === pracId || p.id === pracId) ? { ...p, readinessStatus: nextStatus } : p));
      showToast(`Updated session status to "${nextStatus}"!`);
    }
  };

  // Open Schedule Modal (Create or Edit)
  const handleOpenScheduleModal = (prac = null) => {
    if (prac) {
      setEditingPracticalId(prac._id || prac.id);
      setPracticalForm({
        title: prac.title || '',
        subject: prac.subject || 'Chemistry Practical',
        labRoom: prac.labRoom || 'Chemistry Lab 1 (Room 208)',
        classSection: prac.classSection || '',
        studentCount: String(prac.studentCount || prac.batchSize || 30),
        workstationsCount: String(prac.workstationsCount || Math.ceil((prac.studentCount || 30) / 2)),
        instructor: prac.instructor || '',
        timeSlot: prac.timeSlot || '10:00 AM - 11:30 AM',
        scheduledDate: prac.scheduledDate ? new Date(prac.scheduledDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        requiredEquipments: Array.isArray(prac.requiredEquipments) ? prac.requiredEquipments.join('\n') : (prac.requiredEquipments || ''),
        requiredChemicals: Array.isArray(prac.requiredChemicals) ? prac.requiredChemicals.join('\n') : (prac.requiredChemicals || ''),
        safetyRequirements: Array.isArray(prac.safetyRequirements) ? prac.safetyRequirements.join(', ') : (prac.safetyRequirements || ''),
        readinessStatus: prac.readinessStatus || 'Setup Required',
        notes: prac.notes || ''
      });
    } else {
      setEditingPracticalId(null);
      setPracticalForm({
        title: '',
        subject: 'Chemistry Practical',
        labRoom: 'Chemistry Lab 1 (Room 208)',
        classSection: 'Class 10 - Section A',
        studentCount: '32',
        workstationsCount: '16',
        instructor: 'Mrs. Neha Verma',
        timeSlot: '10:15 AM - 11:45 AM',
        scheduledDate: new Date().toISOString().split('T')[0],
        requiredEquipments: '16x Class A Burettes (50ml)\n16x Retort Stands & Clamps\n32x Conical Flasks (250ml)',
        requiredChemicals: '1.5L Standard 0.1M HCl\n1.5L Standard 0.1M NaOH\n4x Dropper Bottles Phenolphthalein',
        safetyRequirements: 'Mandatory cotton lab coats & splash goggles, fume hood active',
        readinessStatus: 'Setup Required',
        notes: 'Workstations configured (2 students per bench).'
      });
    }
    setIsScheduleModalOpen(true);
  };

  // Submit Practical Session (Create or Update)
  const handleSavePracticalSubmit = async (e) => {
    e.preventDefault();
    if (!practicalForm.title.trim()) {
      showToast('Practical experiment / topic title is required.', 'error');
      return;
    }
    if (!practicalForm.classSection.trim()) {
      showToast('Class and section are required.', 'error');
      return;
    }
    if (!practicalForm.studentCount || Number(practicalForm.studentCount) <= 0) {
      showToast('Number of students in the class is required.', 'error');
      return;
    }

    setIsSubmittingPractical(true);
    try {
      const headers = getHeaders();
      const url = editingPracticalId 
        ? `${API_BASE}/lab/practicals/${editingPracticalId}` 
        : `${API_BASE}/lab/practicals`;
      const method = editingPracticalId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(practicalForm)
      });
      const data = await res.json();

      if (res.ok && data.success) {
        showToast(data.message || (editingPracticalId ? 'Updated practical session!' : 'Practical session scheduled successfully!'));
        setIsScheduleModalOpen(false);
        fetchLabData();
      } else {
        showToast(data?.error || 'Failed to schedule practical', 'error');
      }
    } catch (err) {
      showToast('Network error: ' + err.message, 'error');
    } finally {
      setIsSubmittingPractical(false);
    }
  };

  // Delete / Cancel Scheduled Practical
  const handleDeletePractical = async (prac) => {
    const confirmCancel = window.confirm(`Are you sure you want to cancel and remove the scheduled practical for ${prac.classSection} ("${prac.title}")?`);
    if (!confirmCancel) return;

    try {
      const headers = getHeaders();
      const pracId = prac._id || prac.id;
      const res = await fetch(`${API_BASE}/lab/practicals/${pracId}`, {
        method: 'DELETE',
        headers
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(data.message || `Cancelled practical session for ${prac.classSection}.`);
        fetchLabData();
      } else {
        showToast(data?.error || 'Failed to cancel session', 'error');
      }
    } catch (err) {
      showToast('Error removing practical session', 'error');
    }
  };

  const handleToggleSafetyItem = (id) => {
    setSafetyChecklist(prev => prev.map(item => item.id === id ? { ...item, checked: !item.checked } : item));
    showToast('Updated lab safety compliance checklist.');
  };

  const handleToggleTask = (id) => {
    setLabTasks(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t));
  };

  const handleAddTask = (e) => {
    e.preventDefault();
    if (!newTaskInput.trim()) return;
    setLabTasks(prev => [
      ...prev,
      { id: Date.now(), text: newTaskInput.trim(), done: false }
    ]);
    setNewTaskInput('');
    showToast('Task logged to Assistant Register.');
  };

  const handleOpenAddModal = (type = 'equipment') => {
    setModalType(type);
    setItemForm({
      name: '',
      labType: type === 'chemical' ? 'Chemistry' : 'Physics',
      category: type === 'chemical' ? 'Chemical' : 'Apparatus',
      quantity: '10',
      unit: type === 'chemical' ? 'bottles (500ml)' : 'units',
      status: 'Operational',
      location: type === 'chemical' ? 'Acid Storage Locker 1' : 'Optics Shelf 1',
      hazardLevel: type === 'chemical' ? 'Moderate' : 'None',
      minimumThreshold: '5',
      notes: ''
    });
    setIsAddModalOpen(true);
  };

  const handleAddItemSubmit = async (e) => {
    e.preventDefault();
    if (!itemForm.name.trim()) {
      showToast('Please provide an item / chemical name.', 'error');
      return;
    }
    setIsSubmittingItem(true);
    try {
      const headers = getHeaders();
      const res = await fetch(`${API_BASE}/lab/inventory`, {
        method: 'POST',
        headers,
        body: JSON.stringify(itemForm)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(data.message || 'Added item to laboratory catalogue!');
        setIsAddModalOpen(false);
        fetchLabData();
      } else {
        showToast(data?.error || 'Failed to add item', 'error');
      }
    } catch (err) {
      showToast('Network error: ' + err.message, 'error');
    } finally {
      setIsSubmittingItem(false);
    }
  };

  const handleRestock = async (item) => {
    const addQty = window.prompt(`How many ${item.unit || 'units'} would you like to add to "${item.name}"?`, '10');
    if (!addQty || isNaN(Number(addQty)) || Number(addQty) <= 0) return;
    const newTotal = (item.quantity || 0) + Number(addQty);

    try {
      const headers = getHeaders();
      const res = await fetch(`${API_BASE}/lab/inventory/${item._id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ quantity: newTotal, status: 'Operational' })
      });
      if (res.ok) {
        showToast(`Restocked ${item.name}! Total now: ${newTotal} ${item.unit}.`);
        fetchLabData();
      }
    } catch (err) {
      showToast('Error restocking item', 'error');
    }
  };

  // Filtered Equipments List
  const equipmentsList = useMemo(() => {
    return inventory.filter(item => item.category !== 'Chemical').filter(item => {
      const matchSearch = !searchQuery.trim() || 
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.location && item.location.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.notes && item.notes.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchLab = selectedLabFilter === 'all' || item.labType === selectedLabFilter;
      const matchStatus = selectedStatusFilter === 'all' || item.status === selectedStatusFilter;
      return matchSearch && matchLab && matchStatus;
    });
  }, [inventory, searchQuery, selectedLabFilter, selectedStatusFilter]);

  // Filtered Chemicals List
  const chemicalsList = useMemo(() => {
    return inventory.filter(item => item.category === 'Chemical').filter(item => {
      const matchSearch = !searchQuery.trim() || 
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.location && item.location.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.notes && item.notes.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchLab = selectedLabFilter === 'all' || item.labType === selectedLabFilter;
      const matchStatus = selectedStatusFilter === 'all' || item.status === selectedStatusFilter;
      const matchHazard = selectedHazardFilter === 'all' || item.hazardLevel === selectedHazardFilter;
      return matchSearch && matchLab && matchStatus && matchHazard;
    });
  }, [inventory, searchQuery, selectedLabFilter, selectedStatusFilter, selectedHazardFilter]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px', width: '100%', paddingBottom: '40px' }}>
      
      {/* Toast Alert */}
      {toast.show && (
        <div style={{
          position: 'fixed',
          top: '24px',
          right: '24px',
          zIndex: 99999,
          background: toast.type === 'error' ? '#ef4444' : '#10b981',
          color: 'white',
          padding: '12px 20px',
          borderRadius: '12px',
          fontWeight: 700,
          boxShadow: '0 10px 25px rgba(0,0,0,0.18)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <CheckCircle2 size={18} />
          <span>{toast.message}</span>
        </div>
      )}

      {/* TOP SCIENTIFIC HERO BANNER */}
      <div style={{
        background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 45%, #065f46 100%)',
        borderRadius: '24px',
        padding: '26px 34px',
        color: 'white',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '24px',
        boxShadow: '0 12px 30px -6px rgba(49, 46, 129, 0.4)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ position: 'absolute', right: '-40px', top: '-40px', width: '220px', height: '220px', borderRadius: '50%', background: 'rgba(255, 255, 255, 0.05)', pointerEvents: 'none' }}></div>
        <div style={{ position: 'absolute', right: '140px', bottom: '-50px', width: '160px', height: '160px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.1)', pointerEvents: 'none' }}></div>

        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', padding: '5px 14px', borderRadius: '20px', fontSize: '0.78rem', fontWeight: 800, letterSpacing: '0.5px', marginBottom: '10px' }}>
            <Microscope size={14} color="#34d399" />
            <span>SCIENCE LABORATORIES & APPARATUS COMMAND</span>
          </div>

          <h1 style={{ fontSize: '1.95rem', fontWeight: 900, margin: '0 0 16px 0', letterSpacing: '-0.5px' }}>
            Good Afternoon, {stats.assistantName}! 🔬
          </h1>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            
            {/* PRIMARY SCHEDULE PRACTICAL ACTION BUTTON */}
            <button
              onClick={() => handleOpenScheduleModal()}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 20px',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                fontWeight: 800,
                fontSize: '0.88rem',
                cursor: 'pointer',
                boxShadow: '0 4px 16px rgba(16, 185, 129, 0.4)',
                transition: 'all 0.2s'
              }}
              onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <CalendarPlus size={16} /> Schedule Practical Class
            </button>

            <button
              onClick={() => handleOpenAddModal('equipment')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 20px',
                background: '#4F46E5',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                fontWeight: 700,
                fontSize: '0.88rem',
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(79, 70, 229, 0.35)',
                transition: 'all 0.2s'
              }}
              onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <Plus size={16} /> Add Equipment
            </button>

            <button
              onClick={() => handleOpenAddModal('chemical')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 20px',
                background: '#0d9488',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                fontWeight: 700,
                fontSize: '0.88rem',
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(13, 148, 136, 0.35)',
                transition: 'all 0.2s'
              }}
              onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <TestTube size={16} /> Log Chemical
            </button>
          </div>
        </div>

        <div style={{
          textAlign: 'right',
          background: 'rgba(255, 255, 255, 0.08)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.14)',
          borderRadius: '18px',
          padding: '14px 22px',
          boxShadow: '0 6px 20px rgba(0, 0, 0, 0.15)',
          minWidth: '200px'
        }}>
          <div style={{ fontSize: '0.74rem', fontWeight: 800, opacity: 0.85, textTransform: 'uppercase', letterSpacing: '0.6px', color: '#a7f3d0' }}>
            Live Science Campus
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 900, marginTop: '2px', letterSpacing: '-0.3px' }}>
            {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </div>
          <div style={{ fontSize: '0.82rem', opacity: 0.95, marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'flex-end', fontWeight: 600 }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#34d399', boxShadow: '0 0 8px #34d399', display: 'inline-block' }}></span>
            <span>All 4 Science Labs Active</span>
          </div>
        </div>
      </div>

      {/* 4 TELEMETRY SCIENTIFIC KPIS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        {[
          { 
            label: 'Scheduled Classes Today', 
            value: `${stats.todayPracticals} Scheduled Classes`, 
            sub: 'Practicals scheduled by assistant', 
            icon: Calendar, 
            color: '#4F46E5', 
            bg: 'rgba(79, 70, 229, 0.1)',
            badge: 'Active Today',
            badgeBg: 'rgba(79, 70, 229, 0.1)',
            badgeColor: '#4F46E5',
            tab: 'schedule'
          },
          { 
            label: 'Total Students in Labs', 
            value: `${stats.todayStudentsCount} Students`, 
            sub: 'Aggregate strength across active batches', 
            icon: Users, 
            color: '#059669', 
            bg: 'rgba(5, 150, 105, 0.1)',
            badge: 'Aggregate Count Only',
            badgeBg: 'rgba(5, 150, 105, 0.1)',
            badgeColor: '#059669',
            tab: 'schedule'
          },
          { 
            label: 'Lab Equipments & Apparatus', 
            value: `${inventory.filter(i => i.category !== 'Chemical').length || stats.totalEquipments} Apparatus Units`, 
            sub: `${inventory.filter(i => i.category !== 'Chemical' && i.status === 'Operational').length || 13} Operational • 1 Calibration due`, 
            icon: Microscope, 
            color: '#0284c7', 
            bg: 'rgba(2, 132, 199, 0.1)',
            badge: 'Registry Live',
            badgeBg: 'rgba(2, 132, 199, 0.1)',
            badgeColor: '#0284c7',
            tab: 'equipments'
          },
          { 
            label: 'Chemicals & Reagents', 
            value: `${inventory.filter(i => i.category === 'Chemical').length || stats.totalChemicals} Reagents Cataloged`, 
            sub: `${inventory.filter(i => i.category === 'Chemical' && i.status === 'Low Stock').length || 2} Low Stock / Reorder placed`, 
            icon: FlaskConical, 
            color: '#d97706', 
            bg: 'rgba(217, 119, 6, 0.1)',
            badge: 'Stock Monitored',
            badgeBg: 'rgba(217, 119, 6, 0.1)',
            badgeColor: '#d97706',
            tab: 'chemicals'
          }
        ].map((kpi, idx) => (
          <div 
            key={idx} 
            className="card"
            onClick={() => switchTab(kpi.tab)}
            style={{
              background: 'white',
              borderRadius: '16px',
              padding: '18px 22px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseOver={e => e.currentTarget.style.borderColor = kpi.color}
            onMouseOut={e => e.currentTarget.style.borderColor = '#e2e8f0'}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: kpi.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <kpi.icon size={22} color={kpi.color} />
              </div>
              <span style={{ fontSize: '0.72rem', fontWeight: 800, padding: '3px 8px', borderRadius: '12px', background: kpi.badgeBg, color: kpi.badgeColor }}>
                {kpi.badge}
              </span>
            </div>
            <div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1e293b', lineHeight: 1.1 }}>{kpi.value}</div>
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.4px', marginTop: '4px' }}>
                {kpi.label}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '3px' }}>
                {kpi.sub}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* DASHBOARD MAIN LAYOUT: LEFT CONTENT + RIGHT UTILITY COLUMN */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '22px', alignItems: 'start' }}>
        
        {/* LEFT COLUMN: INTERACTIVE LAB COMMAND CENTER */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Navigation Pill Switcher */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'white',
            padding: '6px',
            borderRadius: '14px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
            flexWrap: 'wrap'
          }}>
            {[
              { id: 'schedule', label: 'Scheduled Classes & Practicals', icon: Calendar, count: practicals.length },
              { id: 'equipments', label: 'Equipments & Apparatus', icon: Microscope, count: inventory.filter(i => i.category !== 'Chemical').length },
              { id: 'chemicals', label: 'Chemicals & Reagents', icon: FlaskConical, count: inventory.filter(i => i.category === 'Chemical').length },
              { id: 'safety', label: 'Safety & Daily Duties', icon: ShieldCheck, count: '98%' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => switchTab(tab.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 16px',
                  borderRadius: '10px',
                  border: 'none',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  background: activeTab === tab.id ? '#4F46E5' : 'transparent',
                  color: activeTab === tab.id ? 'white' : '#64748b',
                  transition: 'all 0.2s',
                  boxShadow: activeTab === tab.id ? '0 4px 12px rgba(79, 70, 229, 0.25)' : 'none'
                }}
              >
                <tab.icon size={16} />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span style={{
                    fontSize: '0.7rem',
                    padding: '2px 6px',
                    borderRadius: '10px',
                    background: activeTab === tab.id ? 'rgba(255,255,255,0.25)' : '#f1f5f9',
                    color: activeTab === tab.id ? 'white' : '#64748b'
                  }}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* TAB 1: SCHEDULED CLASSES & LAB SESSIONS */}
          {(activeTab === 'schedule' || activeTab === 'overview') && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <h3 style={{ fontSize: '1.22rem', fontWeight: 800, color: '#1e293b', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span>Scheduled Laboratory Classes</span>
                    <span style={{ fontSize: '0.76rem', fontWeight: 700, color: '#4F46E5', background: '#eef2ff', border: '1px solid #c7d2fe', padding: '3px 10px', borderRadius: '12px' }}>
                      {practicals.length} Sessions • {stats.todayStudentsCount} Total Students
                    </span>
                  </h3>
                </div>

                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => handleOpenScheduleModal()}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '8px 16px',
                      background: '#4F46E5',
                      color: 'white',
                      border: 'none',
                      borderRadius: '10px',
                      fontWeight: 700,
                      fontSize: '0.84rem',
                      cursor: 'pointer',
                      boxShadow: '0 3px 10px rgba(79, 70, 229, 0.3)',
                      transition: 'all 0.15s'
                    }}
                    onMouseOver={e => e.currentTarget.style.transform = 'translateY(-1px)'}
                    onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
                  >
                    <CalendarPlus size={15} /> Schedule Practical Class
                  </button>

                  <div style={{ fontSize: '0.76rem', color: '#059669', background: '#ecfdf5', border: '1px solid #a7f3d0', padding: '5px 12px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700 }}>
                    <Info size={14} />
                    <span>Student counts only • Privacy enforced</span>
                  </div>
                </div>
              </div>

              {practicals.length === 0 ? (
                <div style={{ background: 'white', borderRadius: '16px', padding: '40px', textAlign: 'center', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '2.5rem', marginBottom: '10px' }}>🧪</div>
                  <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#1e293b', margin: '0 0 6px 0' }}>No Practical Sessions Scheduled</h4>
                  <p style={{ fontSize: '0.85rem', color: '#64748b', maxWidth: '400px', margin: '0 auto 16px auto' }}>
                    You have the authority to schedule practical classes, specify student batch strength, and assign required apparatus.
                  </p>
                  <button
                    onClick={() => handleOpenScheduleModal()}
                    style={{
                      padding: '10px 20px',
                      background: '#4F46E5',
                      color: 'white',
                      border: 'none',
                      borderRadius: '10px',
                      fontWeight: 700,
                      fontSize: '0.85rem',
                      cursor: 'pointer'
                    }}
                  >
                    + Schedule First Practical Class
                  </button>
                </div>
              ) : (
                practicals.map((prac) => {
                  const pracId = prac._id || prac.id;
                  const checks = benchChecklists[pracId] || {};
                  const totalReq = (prac.requiredEquipments?.length || 0) + (prac.requiredChemicals?.length || 0);
                  const checkedCount = Object.values(checks).filter(Boolean).length;

                  return (
                    <div 
                      key={pracId}
                      className="card"
                      style={{
                        background: 'white',
                        borderRadius: '16px',
                        padding: '22px',
                        border: '1px solid #e2e8f0',
                        borderLeft: `6px solid ${prac.color || '#4F46E5'}`,
                        boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '16px'
                      }}
                    >
                      {/* Header Row: Class, Student Count & Management Actions */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '0.85rem', fontWeight: 900, color: '#1e293b', background: '#f1f5f9', padding: '4px 10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                              🏫 {prac.classSection}
                            </span>
                            <span style={{ fontSize: '0.78rem', fontWeight: 800, color: prac.color || '#4F46E5', background: `${prac.color || '#4F46E5'}15`, padding: '3px 10px', borderRadius: '8px' }}>
                              {prac.subject}
                            </span>
                            
                            {/* PROMINENT STUDENT COUNT BADGE */}
                            <span style={{
                              fontSize: '0.82rem',
                              fontWeight: 800,
                              color: '#065f46',
                              background: '#d1fae5',
                              border: '1px solid #6ee7b7',
                              padding: '3px 12px',
                              borderRadius: '20px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '5px'
                            }}>
                              <Users size={14} />
                              <strong>{prac.studentCount || prac.batchSize} Students Scheduled</strong>
                            </span>

                            <span style={{ fontSize: '0.76rem', color: '#64748b', fontWeight: 600 }}>
                              ({prac.workstationsCount || Math.ceil((prac.studentCount || prac.batchSize) / 2)} Workstations • 2 Students / Bench)
                            </span>
                          </div>

                          <h4 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#1e293b', margin: '6px 0 0 0' }}>
                            {prac.title}
                          </h4>

                          <div style={{ fontSize: '0.84rem', color: '#475569', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                            <span>📍 <strong>{prac.labRoom}</strong></span>
                            <span>⏰ <strong>{prac.timeSlot}</strong></span>
                            <span>👨‍🏫 Supervising Faculty: <strong>{prac.instructor}</strong></span>
                          </div>
                        </div>

                        {/* Readiness Status Button & Scheduling Authority Actions */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            
                            {/* Status Badge */}
                            <span style={{
                              fontSize: '0.78rem',
                              fontWeight: 800,
                              padding: '5px 12px',
                              borderRadius: '10px',
                              background: prac.readinessStatus === 'Ready & Sanitized' ? '#ecfdf5' : prac.readinessStatus === 'In Progress' ? '#eef2ff' : '#fffbeb',
                              color: prac.readinessStatus === 'Ready & Sanitized' ? '#059669' : prac.readinessStatus === 'In Progress' ? '#4F46E5' : '#d97706',
                              border: `1px solid ${prac.readinessStatus === 'Ready & Sanitized' ? '#a7f3d0' : prac.readinessStatus === 'In Progress' ? '#c7d2fe' : '#fde68a'}`
                            }}>
                              {prac.readinessStatus === 'Ready & Sanitized' ? '✓ Ready & Sanitized' : prac.readinessStatus}
                            </span>

                            {/* Cycle Status Button */}
                            <button
                              onClick={() => handleTogglePracticalReady(pracId, prac.readinessStatus)}
                              title="Advance readiness status"
                              style={{
                                padding: '6px 12px',
                                borderRadius: '8px',
                                border: '1px solid #cbd5e1',
                                background: '#f8fafc',
                                fontSize: '0.78rem',
                                fontWeight: 700,
                                color: '#334155',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                              }}
                              onMouseOver={e => e.currentTarget.style.background = '#e2e8f0'}
                              onMouseOut={e => e.currentTarget.style.background = '#f8fafc'}
                            >
                              Update Status ↻
                            </button>

                            {/* Edit Button (Assistant Authority) */}
                            <button
                              onClick={() => handleOpenScheduleModal(prac)}
                              title="Edit practical details, timing, or apparatus"
                              style={{
                                padding: '6px 10px',
                                borderRadius: '8px',
                                border: '1px solid #cbd5e1',
                                background: '#f8fafc',
                                fontSize: '0.78rem',
                                fontWeight: 700,
                                color: '#4F46E5',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                              onMouseOver={e => e.currentTarget.style.background = '#eef2ff'}
                              onMouseOut={e => e.currentTarget.style.background = '#f8fafc'}
                            >
                              <Edit3 size={13} /> Edit
                            </button>

                            {/* Cancel / Delete Button */}
                            <button
                              onClick={() => handleDeletePractical(prac)}
                              title="Cancel / delete this scheduled practical"
                              style={{
                                padding: '6px 10px',
                                borderRadius: '8px',
                                border: '1px solid #fecaca',
                                background: '#fef2f2',
                                fontSize: '0.78rem',
                                fontWeight: 700,
                                color: '#dc2626',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                              onMouseOver={e => e.currentTarget.style.background = '#fee2e2'}
                              onMouseOut={e => e.currentTarget.style.background = '#fef2f2'}
                            >
                              <Trash2 size={13} />
                            </button>

                          </div>

                          {totalReq > 0 && (
                            <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                              Bench items prepared: <strong>{checkedCount}/{totalReq}</strong>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Apparatus & Chemical Preparation Block */}
                      <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        
                        {/* Required Equipments */}
                        {(prac.requiredEquipments?.length > 0 || prac.requiredApparatus?.length > 0) && (
                          <div>
                            <div style={{ fontSize: '0.76rem', fontWeight: 800, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <Microscope size={14} color="#4F46E5" />
                              <span>Required Lab Equipments & Apparatus ({prac.requiredEquipments?.length || prac.requiredApparatus?.length} items):</span>
                            </div>
                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                              {(prac.requiredEquipments || prac.requiredApparatus).map((equip, idx) => {
                                const isChecked = !!checks[equip];
                                return (
                                  <div
                                    key={idx}
                                    onClick={() => toggleBenchCheck(pracId, equip)}
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '6px',
                                      padding: '5px 10px',
                                      borderRadius: '8px',
                                      background: isChecked ? '#f0fdf4' : 'white',
                                      border: `1px solid ${isChecked ? '#86efac' : '#cbd5e1'}`,
                                      fontSize: '0.78rem',
                                      color: isChecked ? '#15803d' : '#1e293b',
                                      fontWeight: isChecked ? 700 : 600,
                                      cursor: 'pointer',
                                      transition: 'all 0.15s'
                                    }}
                                  >
                                    {isChecked ? <CheckCircle2 size={13} color="#16a34a" /> : <Square size={13} color="#94a3b8" />}
                                    <span>{equip}</span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Required Chemicals */}
                        {prac.requiredChemicals?.length > 0 && (
                          <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '10px' }}>
                            <div style={{ fontSize: '0.76rem', fontWeight: 800, color: '#065f46', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <TestTube size={14} color="#059669" />
                              <span>Required Chemicals, Reagents & Solutions ({prac.requiredChemicals.length} items):</span>
                            </div>
                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                              {prac.requiredChemicals.map((chem, idx) => {
                                const isChecked = !!checks[chem];
                                return (
                                  <div
                                    key={idx}
                                    onClick={() => toggleBenchCheck(pracId, chem)}
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '6px',
                                      padding: '5px 10px',
                                      borderRadius: '8px',
                                      background: isChecked ? '#ecfdf5' : '#fefce8',
                                      border: `1px solid ${isChecked ? '#6ee7b7' : '#fef08a'}`,
                                      fontSize: '0.78rem',
                                      color: isChecked ? '#065f46' : '#854d0e',
                                      fontWeight: isChecked ? 700 : 600,
                                      cursor: 'pointer',
                                      transition: 'all 0.15s'
                                    }}
                                  >
                                    {isChecked ? <CheckCircle2 size={13} color="#059669" /> : <Square size={13} color="#ca8a04" />}
                                    <span>{chem}</span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Safety & Handling Directives */}
                        {prac.safetyRequirements?.length > 0 && (
                          <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '10px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#b91c1c', textTransform: 'uppercase' }}>
                              ⚠️ Safety Protocols:
                            </span>
                            {prac.safetyRequirements.map((s, idx) => (
                              <span key={idx} style={{ background: '#fef2f2', border: '1px solid #fecaca', padding: '2px 8px', borderRadius: '6px', fontSize: '0.75rem', color: '#991b1b', fontWeight: 600 }}>
                                {s}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Bench Allocation Note */}
                        {prac.notes && (
                          <div style={{ fontSize: '0.75rem', color: '#64748b', fontStyle: 'italic' }}>
                            💡 Assistant Workstation Note: {prac.notes}
                          </div>
                        )}

                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* TAB 2: LAB EQUIPMENTS & APPARATUS REGISTRY */}
          {activeTab === 'equipments' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              {/* Filter controls */}
              <div style={{
                background: 'white',
                padding: '16px 20px',
                borderRadius: '16px',
                border: '1px solid #e2e8f0',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                  <div>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#1e293b', margin: 0 }}>
                      Laboratory Apparatus & Equipment Registry
                    </h3>
                    <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '2px 0 0 0' }}>
                      Optical benches, compound microscopes, electronic meters, glassware sets, and robotics kits.
                    </p>
                  </div>
                  <button
                    onClick={() => handleOpenAddModal('equipment')}
                    style={{
                      padding: '9px 16px',
                      background: '#4F46E5',
                      color: 'white',
                      border: 'none',
                      borderRadius: '10px',
                      fontWeight: 700,
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <Plus size={16} /> Add Equipment
                  </button>
                </div>

                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: '220px', position: 'relative' }}>
                    <Search size={16} style={{ position: 'absolute', left: '12px', top: '11px', color: '#94a3b8' }} />
                    <input 
                      type="text" 
                      placeholder="Search apparatus, microscopes, optical benches, lockers..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '9px 14px 9px 36px',
                        borderRadius: '10px',
                        border: '1px solid #cbd5e1',
                        fontSize: '0.85rem',
                        outline: 'none',
                        background: '#f8fafc'
                      }}
                    />
                  </div>

                  <select 
                    value={selectedLabFilter} 
                    onChange={e => setSelectedLabFilter(e.target.value)}
                    style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.82rem', background: '#f8fafc', outline: 'none' }}
                  >
                    <option value="all">All Science Laboratories</option>
                    <option value="Physics">Physics Lab</option>
                    <option value="Chemistry">Chemistry Lab</option>
                    <option value="Biology">Biology Lab</option>
                    <option value="Computer & STEM">Computer & STEM Lab</option>
                    <option value="General Science">General Science</option>
                  </select>

                  <select 
                    value={selectedStatusFilter} 
                    onChange={e => setSelectedStatusFilter(e.target.value)}
                    style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.82rem', background: '#f8fafc', outline: 'none' }}
                  >
                    <option value="all">All Operating Statuses</option>
                    <option value="Operational">Operational</option>
                    <option value="Needs Calibration">Needs Calibration</option>
                    <option value="Under Repair">Under Repair</option>
                    <option value="Low Stock">Low Stock</option>
                  </select>

                  <span style={{ fontSize: '0.8rem', color: '#64748b', marginLeft: 'auto' }}>
                    Showing <strong>{equipmentsList.length}</strong> equipment units
                  </span>
                </div>
              </div>

              {/* Equipment Table */}
              <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                      <th style={{ padding: '12px 18px', fontWeight: 800, color: '#475569' }}>Apparatus / Equipment Name</th>
                      <th style={{ padding: '12px 14px', fontWeight: 800, color: '#475569' }}>Laboratory & Category</th>
                      <th style={{ padding: '12px 14px', fontWeight: 800, color: '#475569' }}>Available Stock</th>
                      <th style={{ padding: '12px 14px', fontWeight: 800, color: '#475569' }}>Storage Location</th>
                      <th style={{ padding: '12px 14px', fontWeight: 800, color: '#475569' }}>Condition</th>
                      <th style={{ padding: '12px 18px', fontWeight: 800, color: '#475569', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {equipmentsList.length === 0 ? (
                      <tr>
                        <td colSpan={6} style={{ padding: '30px', textAlign: 'center', color: '#64748b' }}>
                          No equipment items match the current search or filter.
                        </td>
                      </tr>
                    ) : (
                      equipmentsList.map((item, idx) => {
                        const isLowStock = item.quantity <= (item.minimumThreshold || 5);
                        return (
                          <tr key={item._id || idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '14px 18px' }}>
                              <div style={{ fontWeight: 700, color: '#1e293b' }}>{item.name}</div>
                              {item.notes && <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>{item.notes}</div>}
                            </td>
                            <td style={{ padding: '14px 14px' }}>
                              <div style={{ fontWeight: 600, color: '#334155' }}>{item.labType}</div>
                              <div style={{ fontSize: '0.74rem', color: '#94a3b8' }}>{item.category}</div>
                            </td>
                            <td style={{ padding: '14px 14px' }}>
                              <span style={{ fontSize: '1.05rem', fontWeight: 800, color: isLowStock ? '#dc2626' : '#1e293b' }}>
                                {item.quantity}
                              </span>
                              <span style={{ fontSize: '0.75rem', color: '#64748b', marginLeft: '4px' }}>{item.unit}</span>
                            </td>
                            <td style={{ padding: '14px 14px', color: '#475569', fontWeight: 600 }}>
                              📍 {item.location || 'General Storage'}
                            </td>
                            <td style={{ padding: '14px 14px' }}>
                              <span style={{
                                fontSize: '0.72rem',
                                fontWeight: 800,
                                padding: '3px 8px',
                                borderRadius: '8px',
                                background: item.status === 'Operational' ? '#ecfdf5' : item.status === 'Needs Calibration' ? '#fffbeb' : '#fff1f2',
                                color: item.status === 'Operational' ? '#059669' : item.status === 'Needs Calibration' ? '#d97706' : '#e11d48',
                                border: `1px solid ${item.status === 'Operational' ? '#a7f3d0' : item.status === 'Needs Calibration' ? '#fde68a' : '#fecdd3'}`
                              }}>
                                {item.status}
                              </span>
                            </td>
                            <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                              <button
                                onClick={() => handleRestock(item)}
                                style={{
                                  padding: '5px 10px',
                                  background: '#f0fdf4',
                                  border: '1px solid #bbf7d0',
                                  color: '#15803d',
                                  borderRadius: '6px',
                                  fontSize: '0.75rem',
                                  fontWeight: 700,
                                  cursor: 'pointer'
                                }}
                              >
                                + Restock
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: CHEMICALS & REAGENTS CATALOG */}
          {activeTab === 'chemicals' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              {/* Filter controls */}
              <div style={{
                background: 'white',
                padding: '16px 20px',
                borderRadius: '16px',
                border: '1px solid #e2e8f0',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                  <div>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#1e293b', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <FlaskConical size={20} color="#059669" />
                      <span>Chemicals & Reagents Inventory Catalogue</span>
                    </h3>
                    <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '2px 0 0 0' }}>
                      Acids, standard bases, salt reagents, indicators, histology stains, and hazard ratings.
                    </p>
                  </div>
                  <button
                    onClick={() => handleOpenAddModal('chemical')}
                    style={{
                      padding: '9px 16px',
                      background: '#059669',
                      color: 'white',
                      border: 'none',
                      borderRadius: '10px',
                      fontWeight: 700,
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <Plus size={16} /> Log Chemical Reagent
                  </button>
                </div>

                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: '220px', position: 'relative' }}>
                    <Search size={16} style={{ position: 'absolute', left: '12px', top: '11px', color: '#94a3b8' }} />
                    <input 
                      type="text" 
                      placeholder="Search chemicals (HCl, NaOH, Safranin, Ethanol, Iodine)..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '9px 14px 9px 36px',
                        borderRadius: '10px',
                        border: '1px solid #cbd5e1',
                        fontSize: '0.85rem',
                        outline: 'none',
                        background: '#f8fafc'
                      }}
                    />
                  </div>

                  <select 
                    value={selectedHazardFilter} 
                    onChange={e => setSelectedHazardFilter(e.target.value)}
                    style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.82rem', background: '#f8fafc', outline: 'none' }}
                  >
                    <option value="all">All Hazard Ratings</option>
                    <option value="None">Safe / None</option>
                    <option value="Low">Low Risk</option>
                    <option value="Moderate">Moderate</option>
                    <option value="Corrosive / Toxic">Corrosive / Toxic</option>
                  </select>

                  <select 
                    value={selectedStatusFilter} 
                    onChange={e => setSelectedStatusFilter(e.target.value)}
                    style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.82rem', background: '#f8fafc', outline: 'none' }}
                  >
                    <option value="all">All Stock Statuses</option>
                    <option value="Operational">In Stock (Operational)</option>
                    <option value="Low Stock">⚠️ Low Stock (Reorder Needed)</option>
                  </select>

                  <span style={{ fontSize: '0.8rem', color: '#64748b', marginLeft: 'auto' }}>
                    Showing <strong>{chemicalsList.length}</strong> reagents
                  </span>
                </div>
              </div>

              {/* Chemicals Table */}
              <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                      <th style={{ padding: '12px 18px', fontWeight: 800, color: '#475569' }}>Chemical / Reagent Name</th>
                      <th style={{ padding: '12px 14px', fontWeight: 800, color: '#475569' }}>Hazard Rating</th>
                      <th style={{ padding: '12px 14px', fontWeight: 800, color: '#475569' }}>Stock on Hand</th>
                      <th style={{ padding: '12px 14px', fontWeight: 800, color: '#475569' }}>Storage Cabinet</th>
                      <th style={{ padding: '12px 14px', fontWeight: 800, color: '#475569' }}>Status</th>
                      <th style={{ padding: '12px 18px', fontWeight: 800, color: '#475569', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {chemicalsList.length === 0 ? (
                      <tr>
                        <td colSpan={6} style={{ padding: '30px', textAlign: 'center', color: '#64748b' }}>
                          No chemicals match the current filters.
                        </td>
                      </tr>
                    ) : (
                      chemicalsList.map((chem, idx) => {
                        const isLowStock = chem.status === 'Low Stock' || chem.quantity <= (chem.minimumThreshold || 4);
                        const isCorrosive = chem.hazardLevel === 'Corrosive / Toxic';
                        const isModerate = chem.hazardLevel === 'Moderate';

                        return (
                          <tr key={chem._id || idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '14px 18px' }}>
                              <div style={{ fontWeight: 700, color: '#1e293b' }}>{chem.name}</div>
                              {chem.notes && <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '2px' }}>{chem.notes}</div>}
                            </td>
                            <td style={{ padding: '14px 14px' }}>
                              <span style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                fontSize: '0.72rem',
                                fontWeight: 800,
                                padding: '2px 8px',
                                borderRadius: '6px',
                                background: isCorrosive ? '#fef2f2' : isModerate ? '#fffbeb' : '#f0fdf4',
                                color: isCorrosive ? '#b91c1c' : isModerate ? '#b45309' : '#15803d',
                                border: `1px solid ${isCorrosive ? '#fecaca' : isModerate ? '#fde68a' : '#bbf7d0'}`
                              }}>
                                {isCorrosive && <Flame size={12} />}
                                {chem.hazardLevel || 'None'}
                              </span>
                            </td>
                            <td style={{ padding: '14px 14px' }}>
                              <span style={{ fontSize: '1.05rem', fontWeight: 800, color: isLowStock ? '#dc2626' : '#1e293b' }}>
                                {chem.quantity}
                              </span>
                              <span style={{ fontSize: '0.75rem', color: '#64748b', marginLeft: '4px' }}>{chem.unit}</span>
                              {isLowStock && (
                                <div style={{ fontSize: '0.7rem', color: '#dc2626', fontWeight: 700, marginTop: '2px' }}>
                                  ⚠️ Below min threshold ({chem.minimumThreshold})
                                </div>
                              )}
                            </td>
                            <td style={{ padding: '14px 14px', color: '#475569', fontWeight: 600 }}>
                              🔒 {chem.location || 'Chemical Locker'}
                            </td>
                            <td style={{ padding: '14px 14px' }}>
                              <span style={{
                                fontSize: '0.72rem',
                                fontWeight: 800,
                                padding: '3px 8px',
                                borderRadius: '8px',
                                background: isLowStock ? '#fff1f2' : '#ecfdf5',
                                color: isLowStock ? '#e11d48' : '#059669',
                                border: `1px solid ${isLowStock ? '#fecdd3' : '#a7f3d0'}`
                              }}>
                                {isLowStock ? 'Low Stock' : 'In Stock'}
                              </span>
                            </td>
                            <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                              <button
                                onClick={() => handleRestock(chem)}
                                style={{
                                  padding: '5px 10px',
                                  background: '#f0fdf4',
                                  border: '1px solid #bbf7d0',
                                  color: '#15803d',
                                  borderRadius: '6px',
                                  fontSize: '0.75rem',
                                  fontWeight: 700,
                                  cursor: 'pointer'
                                }}
                              >
                                + Restock
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: SAFETY & PROTOCOLS AUDIT */}
          {activeTab === 'safety' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              
              {/* Compliance Hero Bar */}
              <div style={{
                background: 'linear-gradient(135deg, #065f46 0%, #047857 100%)',
                color: 'white',
                borderRadius: '16px',
                padding: '20px 24px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                boxShadow: '0 4px 14px rgba(4, 120, 87, 0.25)'
              }}>
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', opacity: 0.85 }}>
                    Laboratories Safety & Audit Standard
                  </div>
                  <h3 style={{ fontSize: '1.4rem', fontWeight: 900, margin: '4px 0 0 0' }}>
                    Safety Compliance Score: {stats.safetyComplianceScore}% (Audit Compliant)
                  </h3>
                  <div style={{ fontSize: '0.82rem', opacity: 0.9, marginTop: '4px' }}>
                    Emergency eyewash station, fire extinguishers, acid spill kits, and fume hood exhaust certified.
                  </div>
                </div>
                <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ShieldCheck size={32} color="#a7f3d0" />
                </div>
              </div>

              {/* Safety Checklist */}
              <div style={{ background: 'white', borderRadius: '16px', padding: '20px', border: '1px solid #e2e8f0' }}>
                <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#1e293b', margin: '0 0 14px 0' }}>
                  Mandatory Lab Assistant Safety Checklist (Daily Audit)
                </h4>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {safetyChecklist.map(item => (
                    <div 
                      key={item.id}
                      onClick={() => handleToggleSafetyItem(item.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '12px 16px',
                        borderRadius: '12px',
                        background: item.checked ? '#f0fdf4' : '#fffbeb',
                        border: `1px solid ${item.checked ? '#bbf7d0' : '#fde68a'}`,
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                          width: '22px', height: '22px', borderRadius: '6px',
                          background: item.checked ? '#16a34a' : 'white',
                          border: `2px solid ${item.checked ? '#16a34a' : '#cbd5e1'}`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                          {item.checked && <Check size={14} color="white" />}
                        </div>
                        <div>
                          <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#1e293b' }}>{item.label}</div>
                          <div style={{ fontSize: '0.74rem', color: '#64748b' }}>Location: <strong>{item.lab}</strong></div>
                        </div>
                      </div>

                      <span style={{ fontSize: '0.74rem', fontWeight: 800, color: item.checked ? '#15803d' : '#b45309' }}>
                        {item.checked ? '✓ Verified Safe' : '⚠️ Pending Verification'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

        </div>

        {/* RIGHT UTILITY COLUMN */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          
          {/* Live Staff Punch Clock with Geofence */}
          <StaffPunchClock onPunchSuccess={(data) => showToast(data.message)} />

          {/* Quick Class Lab Timeline */}
          <div className="card" style={{ background: 'white', borderRadius: '16px', padding: '18px', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Clock size={16} color="#4F46E5" />
                <span>Today's Lab Period Timeline</span>
              </div>
              <button
                onClick={() => handleOpenScheduleModal()}
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  color: '#4F46E5',
                  background: '#eef2ff',
                  border: 'none',
                  padding: '2px 8px',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                + Schedule
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {practicals.map((p, idx) => (
                <div key={p._id || p.id || idx} style={{ padding: '8px 12px', borderRadius: '10px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#1e293b' }}>{p.classSection}</span>
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#059669', background: '#ecfdf5', padding: '1px 6px', borderRadius: '6px' }}>
                      👥 {p.studentCount || p.batchSize} Students
                    </span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '3px' }}>
                    {p.timeSlot} • {p.labRoom}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Lab Assistant Task Checklist */}
          <div className="card" style={{ background: 'white', borderRadius: '16px', padding: '18px', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#1e293b' }}>
                Lab Daily Duty Log
              </div>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#4F46E5', background: '#eef2ff', padding: '2px 8px', borderRadius: '8px' }}>
                {labTasks.filter(t => t.done).length}/{labTasks.length} Done
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {labTasks.map(t => (
                <div 
                  key={t.id}
                  onClick={() => handleToggleTask(t.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '8px 10px',
                    borderRadius: '8px',
                    background: t.done ? '#f8fafc' : '#ffffff',
                    border: '1px solid #e2e8f0',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{
                    width: '16px', height: '16px', borderRadius: '4px',
                    border: `2px solid ${t.done ? '#10b981' : '#cbd5e1'}`,
                    background: t.done ? '#10b981' : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    {t.done && <Check size={10} color="white" />}
                  </div>
                  <span style={{
                    fontSize: '0.8rem',
                    color: t.done ? '#94a3b8' : '#1e293b',
                    textDecoration: t.done ? 'line-through' : 'none',
                    fontWeight: t.done ? 500 : 600,
                    lineHeight: 1.3
                  }}>
                    {t.text}
                  </span>
                </div>
              ))}
            </div>

            <form onSubmit={handleAddTask} style={{ marginTop: '12px', display: 'flex', gap: '6px' }}>
              <input 
                type="text" 
                placeholder="New lab duty task..."
                value={newTaskInput}
                onChange={e => setNewTaskInput(e.target.value)}
                style={{
                  flex: 1,
                  padding: '7px 10px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.78rem',
                  outline: 'none',
                  background: '#f8fafc'
                }}
              />
              <button
                type="submit"
                style={{
                  padding: '7px 12px',
                  borderRadius: '8px',
                  background: '#4F46E5',
                  color: 'white',
                  border: 'none',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                +
              </button>
            </form>
          </div>

          {/* Emergency & Science HOD Contacts */}
          <div style={{ background: '#fffbeb', borderRadius: '16px', padding: '16px', border: '1px solid #fde68a' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#b45309', fontWeight: 800, fontSize: '0.85rem' }}>
              <AlertTriangle size={16} />
              <span>Lab Emergency Protocol</span>
            </div>
            <div style={{ fontSize: '0.78rem', color: '#92400e', marginTop: '6px', lineHeight: 1.4 }}>
              In case of severe acid spill, glass injury, or gas leak:
              <ul style={{ margin: '6px 0 0 0', paddingLeft: '18px' }}>
                <li>Trigger Master Gas Shutoff (Wall Key 2)</li>
                <li>Activate Emergency Eyewash Station</li>
                <li>Notify Science HOD & Medical Infirmary</li>
              </ul>
            </div>
          </div>

        </div>

      </div>

      {/* MODAL 1: SCHEDULE / EDIT PRACTICAL SESSION (LAB ASSISTANT AUTHORITY) */}
      {isScheduleModalOpen && createPortal(
        <div 
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsScheduleModalOpen(false);
          }}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 999999,
            padding: '16px',
            boxSizing: 'border-box'
          }}
        >
          <form 
            onSubmit={handleSavePracticalSubmit}
            style={{
              background: 'white',
              borderRadius: '20px',
              width: '100%',
              maxWidth: '680px',
              maxHeight: 'min(92vh, 760px)',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 25px 60px -15px rgba(0,0,0,0.3)',
              overflow: 'hidden',
              border: '1px solid #e2e8f0'
            }}
          >
            {/* Modal Header */}
            <div style={{ 
              padding: '18px 24px', 
              borderBottom: '1px solid #e2e8f0', 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              background: '#f8fafc',
              flexShrink: 0
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CalendarPlus size={20} color="#4F46E5" />
                  <span>{editingPracticalId ? 'Edit Practical Session' : 'Schedule Practical Laboratory Session'}</span>
                </h3>
                <p style={{ margin: '3px 0 0 0', fontSize: '0.8rem', color: '#64748b' }}>
                  Authorized Science Laboratory Assistant Scheduling Hub
                </p>
              </div>
              <button 
                type="button"
                onClick={() => setIsScheduleModalOpen(false)}
                style={{ 
                  background: '#f1f5f9', 
                  border: 'none', 
                  borderRadius: '8px', 
                  width: '32px', 
                  height: '32px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  cursor: 'pointer', 
                  color: '#64748b',
                  transition: 'background 0.15s' 
                }}
                onMouseOver={e => e.currentTarget.style.background = '#e2e8f0'}
                onMouseOut={e => e.currentTarget.style.background = '#f1f5f9'}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body (Scrollable Form Fields) */}
            <div style={{ 
              padding: '22px 26px', 
              overflowY: 'auto', 
              flex: '1 1 auto',
              minHeight: 0,
              display: 'flex', 
              flexDirection: 'column', 
              gap: '16px' 
            }}>
              
              {/* Class & Student Strength */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Class & Section *
                  </label>
                  <input 
                    type="text" 
                    placeholder="e.g. Class 10 - Section A"
                    value={practicalForm.classSection}
                    onChange={e => setPracticalForm({ ...practicalForm, classSection: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.88rem', outline: 'none' }}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Number of Students in Class *
                  </label>
                  <input 
                    type="number" 
                    placeholder="e.g. 32"
                    min="1"
                    max="100"
                    value={practicalForm.studentCount}
                    onChange={e => {
                      const count = e.target.value;
                      const ws = count ? Math.ceil(Number(count) / 2) : 15;
                      setPracticalForm({ 
                        ...practicalForm, 
                        studentCount: count,
                        workstationsCount: String(ws)
                      });
                    }}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.88rem', outline: 'none' }}
                    required
                  />
                  <div style={{ fontSize: '0.72rem', color: '#059669', fontWeight: 600, marginTop: '4px' }}>
                    ✓ Workstations: {practicalForm.workstationsCount} (2 Students / bench)
                  </div>
                </div>
              </div>

              {/* Subject & Experiment Title */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1.9fr', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Practical Subject
                  </label>
                  <select 
                    value={practicalForm.subject}
                    onChange={e => setPracticalForm({ ...practicalForm, subject: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.88rem', outline: 'none', background: 'white' }}
                  >
                    <option value="Chemistry Practical">Chemistry Practical</option>
                    <option value="Physics Practical">Physics Practical</option>
                    <option value="Biology Practical">Biology Practical</option>
                    <option value="STEM & Robotics Lab">STEM & Robotics Lab</option>
                    <option value="General Science">General Science</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Practical Topic / Experiment Title *
                  </label>
                  <input 
                    type="text" 
                    placeholder="e.g. Acid-Base Titration & pH Neutralization"
                    value={practicalForm.title}
                    onChange={e => setPracticalForm({ ...practicalForm, title: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.88rem', outline: 'none' }}
                    required
                  />
                </div>
              </div>

              {/* Lab Room & Supervising Faculty */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Laboratory Room *
                  </label>
                  <input 
                    type="text" 
                    placeholder="e.g. Chemistry Lab 1 (Room 208)"
                    value={practicalForm.labRoom}
                    onChange={e => setPracticalForm({ ...practicalForm, labRoom: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.88rem', outline: 'none' }}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Supervising Teacher / Faculty *
                  </label>
                  <input 
                    type="text" 
                    placeholder="e.g. Mrs. Neha Verma"
                    value={practicalForm.instructor}
                    onChange={e => setPracticalForm({ ...practicalForm, instructor: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.88rem', outline: 'none' }}
                    required
                  />
                </div>
              </div>

              {/* Scheduled Date & Time Slot */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Session Date
                  </label>
                  <input 
                    type="date" 
                    value={practicalForm.scheduledDate}
                    onChange={e => setPracticalForm({ ...practicalForm, scheduledDate: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.88rem', outline: 'none' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Time Slot / Period *
                  </label>
                  <input 
                    type="text" 
                    placeholder="e.g. 10:15 AM - 11:45 AM"
                    value={practicalForm.timeSlot}
                    onChange={e => setPracticalForm({ ...practicalForm, timeSlot: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.88rem', outline: 'none' }}
                    required
                  />
                </div>
              </div>

              {/* Required Lab Equipments & Apparatus */}
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                  Required Lab Equipments & Apparatus (One per line or comma-separated)
                </label>
                <textarea 
                  rows={2}
                  placeholder="e.g. 16x Class A Burettes (50ml), 16x Retort Stands & Clamps, 32x Conical Flasks (250ml)"
                  value={practicalForm.requiredEquipments}
                  onChange={e => setPracticalForm({ ...practicalForm, requiredEquipments: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.84rem', outline: 'none', resize: 'vertical' }}
                />
                
                {/* Quick Helper Chips from Inventory */}
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '6px' }}>
                  <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700, alignSelf: 'center' }}>+ Insert:</span>
                  {inventory.filter(i => i.category !== 'Chemical').slice(0, 5).map((item, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        const current = practicalForm.requiredEquipments ? practicalForm.requiredEquipments + ', ' : '';
                        setPracticalForm({ ...practicalForm, requiredEquipments: current + item.name });
                      }}
                      style={{
                        padding: '2px 8px',
                        borderRadius: '6px',
                        background: '#eef2ff',
                        border: '1px solid #c7d2fe',
                        color: '#4F46E5',
                        fontSize: '0.72rem',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      + {item.name.split('(')[0].trim()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Required Chemicals & Reagents */}
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                  Required Chemicals & Reagents (One per line or comma-separated)
                </label>
                <textarea 
                  rows={2}
                  placeholder="e.g. 1.5L Standard 0.1M HCl, 1.5L Standard 0.1M NaOH, 4x Dropper Bottles Phenolphthalein"
                  value={practicalForm.requiredChemicals}
                  onChange={e => setPracticalForm({ ...practicalForm, requiredChemicals: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.84rem', outline: 'none', resize: 'vertical' }}
                />
                
                {/* Quick Helper Chips from Chemical Inventory */}
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '6px' }}>
                  <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700, alignSelf: 'center' }}>+ Insert:</span>
                  {inventory.filter(i => i.category === 'Chemical').slice(0, 5).map((item, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        const current = practicalForm.requiredChemicals ? practicalForm.requiredChemicals + ', ' : '';
                        setPracticalForm({ ...practicalForm, requiredChemicals: current + item.name });
                      }}
                      style={{
                        padding: '2px 8px',
                        borderRadius: '6px',
                        background: '#ecfdf5',
                        border: '1px solid #a7f3d0',
                        color: '#059669',
                        fontSize: '0.72rem',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      + {item.name.split('(')[0].trim()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Safety & Notes */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Safety Protocols & Precautions
                  </label>
                  <input 
                    type="text" 
                    placeholder="e.g. Mandatory splash goggles & lab coats"
                    value={practicalForm.safetyRequirements}
                    onChange={e => setPracticalForm({ ...practicalForm, safetyRequirements: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.88rem', outline: 'none' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Assistant Workstation Notes
                  </label>
                  <input 
                    type="text" 
                    placeholder="e.g. Prepare standard solutions before period"
                    value={practicalForm.notes}
                    onChange={e => setPracticalForm({ ...practicalForm, notes: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.88rem', outline: 'none' }}
                  />
                </div>
              </div>
            </div>

            {/* Modal Footer (Pinned Actions) */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'flex-end', 
              alignItems: 'center', 
              gap: '12px', 
              padding: '14px 26px', 
              borderTop: '1px solid #e2e8f0', 
              background: '#f8fafc',
              flexShrink: 0
            }}>
              <button
                type="button"
                onClick={() => setIsScheduleModalOpen(false)}
                style={{ 
                  padding: '10px 20px', 
                  background: 'white', 
                  border: '1px solid #cbd5e1', 
                  borderRadius: '10px', 
                  fontWeight: 700, 
                  color: '#475569', 
                  cursor: 'pointer',
                  fontSize: '0.88rem',
                  transition: 'background 0.15s'
                }}
                onMouseOver={e => e.currentTarget.style.background = '#f1f5f9'}
                onMouseOut={e => e.currentTarget.style.background = 'white'}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmittingPractical}
                style={{ 
                  padding: '10px 24px', 
                  background: '#4F46E5', 
                  border: 'none', 
                  borderRadius: '10px', 
                  fontWeight: 800, 
                  color: 'white', 
                  cursor: 'pointer',
                  fontSize: '0.88rem',
                  boxShadow: '0 4px 14px rgba(79, 70, 229, 0.35)',
                  transition: 'all 0.15s'
                }}
                onMouseOver={e => e.currentTarget.style.transform = 'translateY(-1px)'}
                onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
              >
                {isSubmittingPractical ? 'Scheduling...' : editingPracticalId ? 'Save Changes' : '✓ Schedule Practical Session'}
              </button>
            </div>
          </form>
        </div>,
        document.body
      )}

      {/* MODAL 2: ADD NEW APPARATUS OR CHEMICAL */}
      {isAddModalOpen && createPortal(
        <div 
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsAddModalOpen(false);
          }}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 999999,
            padding: '16px',
            boxSizing: 'border-box'
          }}
        >
          <form 
            onSubmit={handleAddItemSubmit} 
            style={{
              background: 'white',
              borderRadius: '20px',
              width: '100%',
              maxWidth: '540px',
              maxHeight: 'min(92vh, 680px)',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 25px 60px -15px rgba(0,0,0,0.3)',
              overflow: 'hidden',
              border: '1px solid #e2e8f0'
            }}
          >
            {/* Modal Header */}
            <div style={{ 
              padding: '18px 24px', 
              borderBottom: '1px solid #e2e8f0', 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              background: '#f8fafc',
              flexShrink: 0
            }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#1e293b' }}>
                {modalType === 'chemical' ? '🧪 + Log Chemical Reagent' : '🔬 + Add Lab Apparatus / Equipment'}
              </h3>
              <button 
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                style={{ 
                  background: '#f1f5f9', 
                  border: 'none', 
                  borderRadius: '8px', 
                  width: '32px', 
                  height: '32px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  cursor: 'pointer', 
                  color: '#64748b',
                  transition: 'background 0.15s'
                }}
                onMouseOver={e => e.currentTarget.style.background = '#e2e8f0'}
                onMouseOut={e => e.currentTarget.style.background = '#f1f5f9'}
              >
                <X size={18} />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <div style={{ 
              padding: '22px 24px', 
              overflowY: 'auto', 
              flex: '1 1 auto',
              minHeight: 0,
              display: 'flex', 
              flexDirection: 'column', 
              gap: '15px' 
            }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  {modalType === 'chemical' ? 'Chemical / Solution Name *' : 'Apparatus / Equipment Name *'}
                </label>
                <input 
                  type="text" 
                  placeholder={modalType === 'chemical' ? "e.g. Copper (II) Sulphate Crystals (CuSO4.5H2O)" : "e.g. Optical Bench Set with Lens Holders"}
                  value={itemForm.name}
                  onChange={e => setItemForm({ ...itemForm, name: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.88rem', outline: 'none' }}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Laboratory Type
                  </label>
                  <select 
                    value={itemForm.labType}
                    onChange={e => setItemForm({ ...itemForm, labType: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.88rem', outline: 'none' }}
                  >
                    <option value="Physics">Physics Lab</option>
                    <option value="Chemistry">Chemistry Lab</option>
                    <option value="Biology">Biology Lab</option>
                    <option value="Computer & STEM">STEM & Robotics</option>
                    <option value="General Science">General Science</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Category
                  </label>
                  <select 
                    value={itemForm.category}
                    onChange={e => setItemForm({ ...itemForm, category: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.88rem', outline: 'none' }}
                  >
                    {modalType === 'chemical' ? (
                      <option value="Chemical">Chemical / Reagent</option>
                    ) : (
                      <>
                        <option value="Apparatus">Apparatus</option>
                        <option value="Glassware">Glassware</option>
                        <option value="Instrument">Instrument</option>
                        <option value="Electronic Instrument">Electronic Instrument</option>
                        <option value="Specimen & Kit">Specimen & Kit</option>
                        <option value="Safety & Protective">Safety & Protective</option>
                      </>
                    )}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Quantity & Units
                  </label>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <input 
                      type="number" 
                      value={itemForm.quantity}
                      onChange={e => setItemForm({ ...itemForm, quantity: e.target.value })}
                      style={{ width: '80px', padding: '10px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.88rem', outline: 'none' }}
                    />
                    <input 
                      type="text" 
                      placeholder={modalType === 'chemical' ? "bottles (500ml), g..." : "units, pcs, sets..."}
                      value={itemForm.unit}
                      onChange={e => setItemForm({ ...itemForm, unit: e.target.value })}
                      style={{ flex: 1, padding: '10px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.88rem', outline: 'none' }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Storage Location / Locker
                  </label>
                  <input 
                    type="text" 
                    placeholder={modalType === 'chemical' ? "e.g. Acid Storage Locker 1" : "e.g. Optics Shelf 4"}
                    value={itemForm.location}
                    onChange={e => setItemForm({ ...itemForm, location: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.88rem', outline: 'none' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Hazard / Toxicity Rating
                  </label>
                  <select 
                    value={itemForm.hazardLevel}
                    onChange={e => setItemForm({ ...itemForm, hazardLevel: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.88rem', outline: 'none' }}
                  >
                    <option value="None">None (Safe)</option>
                    <option value="Low">Low Risk</option>
                    <option value="Moderate">Moderate</option>
                    <option value="Corrosive / Toxic">Corrosive / Toxic</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Operating Status
                  </label>
                  <select 
                    value={itemForm.status}
                    onChange={e => setItemForm({ ...itemForm, status: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.88rem', outline: 'none' }}
                  >
                    <option value="Operational">Operational</option>
                    <option value="Low Stock">Low Stock</option>
                    <option value="Needs Calibration">Needs Calibration</option>
                    <option value="Under Repair">Under Repair</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  Handling Instructions / Notes
                </label>
                <input 
                  type="text" 
                  placeholder="e.g. Fume hood handling required, store under 25°C"
                  value={itemForm.notes}
                  onChange={e => setItemForm({ ...itemForm, notes: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.88rem', outline: 'none' }}
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'flex-end', 
              alignItems: 'center', 
              gap: '10px', 
              padding: '14px 24px', 
              borderTop: '1px solid #e2e8f0', 
              background: '#f8fafc',
              flexShrink: 0
            }}>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                style={{ 
                  padding: '10px 18px', 
                  background: 'white', 
                  border: '1px solid #cbd5e1', 
                  borderRadius: '10px', 
                  fontWeight: 700, 
                  color: '#475569', 
                  cursor: 'pointer',
                  fontSize: '0.88rem' 
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmittingItem}
                style={{ 
                  padding: '10px 22px', 
                  background: modalType === 'chemical' ? '#059669' : '#4F46E5', 
                  border: 'none', 
                  borderRadius: '10px', 
                  fontWeight: 700, 
                  color: 'white', 
                  cursor: 'pointer',
                  fontSize: '0.88rem',
                  boxShadow: modalType === 'chemical' ? '0 4px 14px rgba(5, 150, 105, 0.35)' : '0 4px 14px rgba(79, 70, 229, 0.35)'
                }}
              >
                {isSubmittingItem ? 'Saving...' : modalType === 'chemical' ? 'Log Chemical' : 'Add Equipment'}
              </button>
            </div>
          </form>
        </div>,
        document.body
      )}

    </div>
  );
};

export default LabDashboard;
