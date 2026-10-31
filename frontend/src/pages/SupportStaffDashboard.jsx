import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Users, CreditCard, Search, Plus, CheckCircle2, Clock, Calendar, 
  Building2, ShieldCheck, FileText, Printer, X, Check, Mail, Phone, 
  ArrowRight, ArrowLeft, ChevronRight, AlertCircle, Package, RefreshCw, MapPin, 
  UserPlus, Car, Download, Eye, Sparkles, AlertTriangle, Shield, CheckCircle,
  HelpCircle, UserCheck, ArrowUpRight
} from 'lucide-react';
import StaffPunchClock from '../components/StaffPunchClock';

const API_BASE = 'http://localhost:5000/api';

const SupportStaffDashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const tenantSlug = sessionStorage.getItem('tenantSlug') || '';
  const userInfo = JSON.parse(sessionStorage.getItem('userInfo') || '{}');
  const token = userInfo.token || sessionStorage.getItem('token') || '';
  const userRole = (sessionStorage.getItem('userRole') || userInfo.role || 'support_staff').toLowerCase().trim();

  // Student Admission State (Support Staff Authority)
  const [isAdmitStudentModalOpen, setIsAdmitStudentModalOpen] = useState(false);
  const [isSubmittingAdmission, setIsSubmittingAdmission] = useState(false);
  const [admitStudentForm, setAdmitStudentForm] = useState({
    name: '',
    grade: 'Class 10',
    section: 'A',
    rollNo: '',
    gender: 'Male',
    parentName: '',
    parentContact: '',
    email: '',
    address: '',
    linkedInquiryId: null
  });

  // Parse active tab from URL or default to 'overview'
  const searchParams = new URLSearchParams(location.search);
  const initialTab = searchParams.get('tab') || 'overview';
  const validTabs = ['overview', 'reception', 'fees', 'inquiries', 'gatepasses', 'parcels'];
  const [activeTab, setActiveTab] = useState(validTabs.includes(initialTab) ? initialTab : 'overview');

  useEffect(() => {
    const tabParam = new URLSearchParams(location.search).get('tab');
    if (tabParam && validTabs.includes(tabParam)) {
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

  const [telemetry, setTelemetry] = useState({
    activeVisitors: 0,
    todayInquiries: 0,
    activeGatePasses: 0,
    pendingParcels: 0,
    todayCollectionTotal: 0,
    todayReceiptCount: 0
  });

  const [visitors, setVisitors] = useState([]);
  const [inquiries, setInquiries] = useState([]);
  const [gatePasses, setGatePasses] = useState([]);
  const [parcels, setParcels] = useState([]);
  const [todayReceipts, setTodayReceipts] = useState([]);

  // Search & Filter state for individual tabs
  const [visitorFilter, setVisitorFilter] = useState('All');
  const [visitorSearchQuery, setVisitorSearchQuery] = useState('');
  const [inquiryFilter, setInquiryFilter] = useState('All');
  const [inquirySearchQuery, setInquirySearchQuery] = useState('');
  const [gatePassFilter, setGatePassFilter] = useState('All');
  const [parcelFilter, setParcelFilter] = useState('All');

  // Modals state
  const [isVisitorModalOpen, setIsVisitorModalOpen] = useState(false);
  const [isInquiryModalOpen, setIsInquiryModalOpen] = useState(false);
  const [isGatePassModalOpen, setIsGatePassModalOpen] = useState(false);
  const [isParcelModalOpen, setIsParcelModalOpen] = useState(false);
  const [isFeeModalOpen, setIsFeeModalOpen] = useState(false);
  const [selectedVisitorForPass, setSelectedVisitorForPass] = useState(null);
  const [selectedReceiptForPrint, setSelectedReceiptForPrint] = useState(null);
  const [selectedGatePassForPrint, setSelectedGatePassForPrint] = useState(null);
  const [isPunchModalOpen, setIsPunchModalOpen] = useState(false);

  // Fee Submission Window state
  const [studentSearchQuery, setStudentSearchQuery] = useState('');
  const [isSearchingStudents, setIsSearchingStudents] = useState(false);
  const [studentSearchResults, setStudentSearchResults] = useState([]);
  const [selectedStudentForFee, setSelectedStudentForFee] = useState(null);

  // Fee Form state
  const [feeForm, setFeeForm] = useState({
    category: 'Tuition Fee',
    amount: '',
    paymentMethod: 'Cash',
    payerName: '',
    payerPhone: '',
    txnReference: '',
    notes: ''
  });

  // Visitor Form state
  const [visitorForm, setVisitorForm] = useState({
    visitorName: '',
    phone: '',
    purpose: 'Parent-Teacher Academic Discussion',
    hostPerson: 'Administration',
    department: 'General Duty',
    idType: 'Aadhaar Card',
    idNumber: '',
    vehicleNumber: '',
    badgeNumber: '',
    remarks: ''
  });

  // Inquiry Form state
  const [inquiryForm, setInquiryForm] = useState({
    parentName: '',
    studentName: '',
    phone: '',
    email: '',
    gradeSeeking: 'Class 1',
    previousSchool: '',
    source: 'Walk-in',
    notes: '',
    status: 'New'
  });

  // GatePass Form state
  const [gatePassForm, setGatePassForm] = useState({
    studentName: '',
    rollNo: '',
    classSection: '',
    passType: 'Early Departure',
    reason: '',
    escortedBy: 'Parent / Guardian',
    parentContact: '',
    parentPermissionVerified: true,
    remarks: ''
  });

  // Parcel Form state
  const [parcelForm, setParcelForm] = useState({
    trackingNumber: '',
    courierService: 'India Post Speed Post',
    type: 'Inward',
    sender: '',
    recipient: '',
    department: 'Administration',
    remarks: ''
  });

  const getHeaders = () => {
    const h = { 'Content-Type': 'application/json' };
    if (token) h['Authorization'] = `Bearer ${token}`;
    if (tenantSlug) h['x-tenant-slug'] = tenantSlug;
    if (userRole) h['x-user-role'] = userRole;
    return h;
  };

  // Load telemetry & records
  const fetchAllData = async () => {
    setLoading(true);
    try {
      const headers = getHeaders();
      const [telRes, visRes, inqRes, gpRes, parcRes, recRes] = await Promise.all([
        fetch(`${API_BASE}/support/telemetry`, { headers }),
        fetch(`${API_BASE}/support/visitors`, { headers }),
        fetch(`${API_BASE}/support/inquiries`, { headers }),
        fetch(`${API_BASE}/support/gatepasses`, { headers }),
        fetch(`${API_BASE}/support/parcels`, { headers }),
        fetch(`${API_BASE}/support/fees/today`, { headers })
      ]);

      if (telRes.ok) {
        const d = await telRes.json();
        if (d.telemetry) setTelemetry(d.telemetry);
      }
      if (visRes.ok) {
        const d = await visRes.json();
        setVisitors(d.visitors || []);
      }
      if (inqRes.ok) {
        const d = await inqRes.json();
        setInquiries(d.inquiries || []);
      }
      if (gpRes.ok) {
        const d = await gpRes.json();
        setGatePasses(d.gatePasses || []);
      }
      if (parcRes.ok) {
        const d = await parcRes.json();
        setParcels(d.parcels || []);
      }
      if (recRes.ok) {
        const d = await recRes.json();
        setTodayReceipts(d.receipts || []);
      }
    } catch (err) {
      console.error('Failed to load support telemetry:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, [tenantSlug]);

  // Search Students for Fee Counter
  const handleStudentSearch = async (q) => {
    setStudentSearchQuery(q);
    if (!q || q.trim().length < 2) {
      setStudentSearchResults([]);
      return;
    }
    setIsSearchingStudents(true);
    try {
      const res = await fetch(`${API_BASE}/support/students/search?query=${encodeURIComponent(q)}`, {
        headers: getHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        setStudentSearchResults(data.students || []);
      }
    } catch (err) {
      console.error('Student search failed:', err);
    } finally {
      setIsSearchingStudents(false);
    }
  };

  // Submit Visitor Check-In
  const handleCheckInVisitor = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/support/visitors`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(visitorForm)
      });
      if (res.ok) {
        const data = await res.json();
        setIsVisitorModalOpen(false);
        setVisitorForm({
          visitorName: '',
          phone: '',
          purpose: 'Parent-Teacher Academic Discussion',
          hostPerson: 'Administration',
          department: 'General Duty',
          idType: 'Aadhaar Card',
          idNumber: '',
          vehicleNumber: '',
          badgeNumber: '',
          remarks: ''
        });
        fetchAllData();
        if (data.visitor) {
          setSelectedVisitorForPass(data.visitor);
        }
      } else {
        const err = await res.json();
        alert(err.message || 'Failed to check in visitor');
      }
    } catch (err) {
      alert(err.message);
    }
  };

  // Visitor Check-Out
  const handleCheckOutVisitor = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/support/visitors/${id}/checkout`, {
        method: 'PUT',
        headers: getHeaders()
      });
      if (res.ok) {
        fetchAllData();
      }
    } catch (err) {
      alert(err.message);
    }
  };

  // Record Fee Payment
  const handleRecordFee = async (e) => {
    e.preventDefault();
    if (!selectedStudentForFee) {
      alert('Please select a student first');
      return;
    }
    try {
      const payload = {
        studentId: selectedStudentForFee._id,
        studentName: selectedStudentForFee.name,
        rollNo: selectedStudentForFee.rollNo,
        grade: selectedStudentForFee.grade,
        category: feeForm.category,
        amount: feeForm.amount,
        paymentMethod: feeForm.paymentMethod,
        payerName: feeForm.payerName || selectedStudentForFee.parentName || selectedStudentForFee.name,
        payerPhone: feeForm.payerPhone || selectedStudentForFee.parentContact || '',
        txnReference: feeForm.txnReference,
        notes: feeForm.notes
      };

      const res = await fetch(`${API_BASE}/support/fees/collect`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const data = await res.json();
        setIsFeeModalOpen(false);
        setFeeForm({
          category: 'Tuition Fee',
          amount: '',
          paymentMethod: 'Cash',
          payerName: '',
          payerPhone: '',
          txnReference: '',
          notes: ''
        });
        fetchAllData();
        if (data.receipt) {
          setSelectedReceiptForPrint(data.receipt);
        }
      } else {
        const err = await res.json();
        alert(err.message || 'Failed to record fee');
      }
    } catch (err) {
      alert(err.message);
    }
  };

  // Register Inquiry
  const handleRegisterInquiry = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/support/inquiries`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(inquiryForm)
      });
      if (res.ok) {
        setIsInquiryModalOpen(false);
        setInquiryForm({
          parentName: '',
          studentName: '',
          phone: '',
          email: '',
          gradeSeeking: 'Class 1',
          previousSchool: '',
          source: 'Walk-in',
          notes: '',
          status: 'New'
        });
        fetchAllData();
      } else {
        const err = await res.json();
        alert(err.message || 'Failed to save inquiry');
      }
    } catch (err) {
      alert(err.message);
    }
  };

  // Update Inquiry Status
  const handleUpdateInquiryStatus = async (id, newStatus) => {
    try {
      await fetch(`${API_BASE}/support/inquiries/${id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ status: newStatus })
      });
      fetchAllData();
    } catch (err) {
      console.error(err);
    }
  };

  // Open Student Admission Modal (Support Staff Authority)
  const handleOpenAdmitStudentModal = (inquiry = null) => {
    if (inquiry) {
      setAdmitStudentForm({
        name: inquiry.studentName || '',
        grade: inquiry.gradeSeeking || 'Class 10',
        section: 'A',
        rollNo: '',
        gender: 'Male',
        parentName: inquiry.parentName || '',
        parentContact: inquiry.phone || '',
        email: inquiry.email || '',
        address: '',
        linkedInquiryId: inquiry._id || null
      });
    } else {
      setAdmitStudentForm({
        name: '',
        grade: 'Class 10',
        section: 'A',
        rollNo: '',
        gender: 'Male',
        parentName: '',
        parentContact: '',
        email: '',
        address: '',
        linkedInquiryId: null
      });
    }
    setIsAdmitStudentModalOpen(true);
  };

  // Submit Student Admission (Support Staff Authority)
  const handleAdmitStudentSubmit = async (e) => {
    e.preventDefault();
    if (!admitStudentForm.name.trim()) {
      alert('Student full name is required');
      return;
    }
    if (!admitStudentForm.grade.trim()) {
      alert('Class / Grade is required');
      return;
    }

    setIsSubmittingAdmission(true);
    try {
      const payload = {
        name: admitStudentForm.name.trim(),
        grade: admitStudentForm.grade.trim(),
        section: (admitStudentForm.section || 'A').trim().toUpperCase(),
        rollNo: admitStudentForm.rollNo ? admitStudentForm.rollNo.trim() : undefined,
        gender: admitStudentForm.gender,
        parentName: admitStudentForm.parentName.trim(),
        parentContact: admitStudentForm.parentContact.trim(),
        email: admitStudentForm.email.trim(),
        address: admitStudentForm.address.trim(),
        status: 'Active'
      };

      const res = await fetch(`${API_BASE}/students`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (res.ok) {
        if (admitStudentForm.linkedInquiryId) {
          try {
            await fetch(`${API_BASE}/support/inquiries/${admitStudentForm.linkedInquiryId}`, {
              method: 'PUT',
              headers: getHeaders(),
              body: JSON.stringify({ status: 'Enrolled' })
            });
            setInquiries(prev => prev.map(inq => inq._id === admitStudentForm.linkedInquiryId ? { ...inq, status: 'Enrolled' } : inq));
          } catch (inqErr) {
            console.warn('Could not update linked inquiry:', inqErr);
          }
        }

        alert(`🎉 Student "${data.student?.name || payload.name}" successfully enrolled in ${data.student?.grade || payload.grade} - Section ${data.student?.section || payload.section}!`);
        setIsAdmitStudentModalOpen(false);
        fetchAllData();
      } else {
        alert(data.message || data.error || 'Failed to admit student');
      }
    } catch (err) {
      alert('Network error while admitting student: ' + err.message);
    } finally {
      setIsSubmittingAdmission(false);
    }
  };

  // Issue Gate Pass
  const handleIssueGatePass = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/support/gatepasses`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(gatePassForm)
      });
      if (res.ok) {
        const data = await res.json();
        setIsGatePassModalOpen(false);
        setGatePassForm({
          studentName: '',
          rollNo: '',
          classSection: '',
          passType: 'Early Departure',
          reason: '',
          escortedBy: 'Parent / Guardian',
          parentContact: '',
          parentPermissionVerified: true,
          remarks: ''
        });
        fetchAllData();
        if (data.gatePass) {
          setSelectedGatePassForPrint(data.gatePass);
        }
      } else {
        const err = await res.json();
        alert(err.message || 'Failed to issue gate pass');
      }
    } catch (err) {
      alert(err.message);
    }
  };

  // Log Parcel
  const handleLogParcel = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/support/parcels`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(parcelForm)
      });
      if (res.ok) {
        setIsParcelModalOpen(false);
        setParcelForm({
          trackingNumber: '',
          courierService: 'India Post Speed Post',
          type: 'Inward',
          sender: '',
          recipient: '',
          department: 'Administration',
          remarks: ''
        });
        fetchAllData();
      } else {
        const err = await res.json();
        alert(err.message || 'Failed to log parcel');
      }
    } catch (err) {
      alert(err.message);
    }
  };

  // Handover Parcel
  const handleHandoverParcel = async (id) => {
    try {
      await fetch(`${API_BASE}/support/parcels/${id}/handover`, {
        method: 'PUT',
        headers: getHeaders()
      });
      fetchAllData();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ width: '100%', maxWidth: '100%', margin: '0 auto', color: 'var(--color-text-main)', boxSizing: 'border-box' }}>
      {/* 1. Modern Command Center Hero Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 52%, #0d9488 100%)',
        borderRadius: '18px',
        padding: '20px 24px',
        color: 'white',
        boxShadow: '0 10px 25px -5px rgba(37, 99, 235, 0.3)',
        marginBottom: '20px',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px',
        width: '100%',
        boxSizing: 'border-box',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Subtle decorative background watermarks */}
        <div style={{
          position: 'absolute', right: '-40px', top: '-40px',
          width: '240px', height: '240px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,255,255,0.12) 0%, transparent 70%)',
          pointerEvents: 'none'
        }} />

        {/* Left Side: School Branding & Operator Info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', zIndex: 1, minWidth: 0, flex: '1 1 300px' }}>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '14px',
            background: 'rgba(255, 255, 255, 0.16)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.6rem',
            boxShadow: '0 6px 14px rgba(0, 0, 0, 0.1)',
            flexShrink: 0
          }}>
            🏢
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
              <h1 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em', lineHeight: 1.2 }}>
                Front Desk & Support Command Center
              </h1>
              <span style={{
                background: 'rgba(255, 255, 255, 0.22)',
                border: '1px solid rgba(255, 255, 255, 0.35)',
                padding: '2px 10px',
                borderRadius: '999px',
                fontSize: '0.7rem',
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.04em'
              }}>
                Support Staff • EMP-108
              </span>
            </div>
            <p style={{ margin: 0, fontSize: '0.85rem', opacity: 0.92, display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Building2 size={14} />
                <strong>{sessionStorage.getItem('schoolName') || 'Neel Public School (Main Campus)'}</strong>
              </span>
              <span>•</span>
              <span>Operator: <strong>{userInfo.name || 'Mr. Sonu Kumar'}</strong> (Administration)</span>
              <span>•</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'rgba(16, 185, 129, 0.25)', padding: '1px 7px', borderRadius: '5px', fontSize: '0.72rem', fontWeight: 700 }}>
                <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#34d399', display: 'inline-block' }} />
                Active Shift
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Back to Overview button when on a sub-tab */}
      {activeTab !== 'overview' && (
        <div style={{ marginBottom: '16px' }}>
          <button
            onClick={() => switchTab('overview')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: 'var(--color-surface, #ffffff)',
              border: '1px solid var(--color-border, #e2e8f0)',
              padding: '7px 14px',
              borderRadius: '10px',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '0.82rem',
              color: '#1e3a8a',
              boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = '#2563eb';
              e.currentTarget.style.color = '#2563eb';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = '#e2e8f0';
              e.currentTarget.style.color = '#1e3a8a';
            }}
          >
            <ArrowLeft size={15} /> Back to Command Center
          </button>
        </div>
      )}

      {/* Tab Contents */}

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div 
          className="dashboard-grid support-dashboard-grid"
        >
          {/* MAIN / LEFT COLUMN */}
          <div className="left-column" style={{ minWidth: 0 }}>
            {/* Quick KPI Stat Cards */}
            <div 
              className="kpi-row" 
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
                gap: '16px',
                width: '100%'
              }}
            >
              {[
                {
                  id: 'visitors',
                  tab: 'reception',
                  label: 'Active Campus Visitors',
                  value: telemetry.activeVisitors,
                  icon: Users,
                  color: '#2563eb',
                  bg: 'rgba(37, 99, 235, 0.1)',
                  badge: 'On Campus',
                  badgeColor: '#16a34a',
                  badgeBg: 'rgba(22, 163, 74, 0.08)',
                  sub: telemetry.activeVisitors > 0 ? `${telemetry.activeVisitors} checked in now` : 'No visitors on premises'
                },
                {
                  id: 'fees',
                  tab: 'fees',
                  label: 'Fee Counter Total (Today)',
                  value: `₹${(telemetry.todayCollectionTotal || 0).toLocaleString()}`,
                  icon: CreditCard,
                  color: '#059669',
                  bg: 'rgba(5, 150, 105, 0.1)',
                  badge: 'Today',
                  badgeColor: '#059669',
                  badgeBg: 'rgba(5, 150, 105, 0.08)',
                  sub: `${telemetry.todayReceiptCount} payments logged`
                },
                {
                  id: 'inquiries',
                  tab: 'inquiries',
                  label: 'Admission Inquiries',
                  value: telemetry.todayInquiries,
                  icon: Mail,
                  color: '#d97706',
                  bg: 'rgba(217, 119, 6, 0.1)',
                  badge: 'Pending',
                  badgeColor: '#d97706',
                  badgeBg: 'rgba(217, 119, 6, 0.08)',
                  sub: telemetry.todayInquiries > 0 ? 'Follow-ups pending' : 'All inquiries up to date'
                }
              ].map((kpi) => (
                <div 
                  key={kpi.id}
                  className="card hover-lift"
                  onClick={() => switchTab(kpi.tab)}
                  title={`Click to view ${kpi.label}`}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                    padding: '18px 20px',
                    borderRadius: '16px',
                    background: 'var(--color-surface, white)',
                    border: '1px solid var(--color-border, #e2e8f0)',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
                    cursor: 'pointer',
                    transition: 'all 0.3s'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '10px',
                      background: kpi.bg,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <kpi.icon size={22} color={kpi.color} />
                    </div>
                    <span style={{
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      color: kpi.badgeColor,
                      background: kpi.badgeBg,
                      padding: '3px 8px',
                      borderRadius: '12px'
                    }}>
                      {kpi.badge}
                    </span>
                  </div>
                  <div>
                    <div style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--color-primary)' }}>
                      {kpi.value}
                    </div>
                    <div style={{
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      color: 'var(--color-text-muted)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.4px',
                      marginTop: '2px'
                    }}>
                      {kpi.label}
                    </div>
                    <div style={{
                      fontSize: '0.75rem',
                      color: 'var(--color-text-muted)',
                      marginTop: '4px'
                    }}>
                      {kpi.sub}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Active Visitors Live Snapshot */}
            <div style={{
              background: 'var(--color-surface, #ffffff)',
              borderRadius: '18px',
              border: '1px solid var(--color-border, #e2e8f0)',
              padding: '24px',
              boxShadow: '0 2px 10px rgba(0,0,0,0.03)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    👥 Currently Active Visitors on Campus
                    <span style={{ fontSize: '0.75rem', background: '#dbeafe', color: '#1d4ed8', padding: '2px 8px', borderRadius: '999px', fontWeight: 800 }}>
                      {visitors.filter(v => v.status === 'Checked In').length} active
                    </span>
                  </h3>
                  <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: '#64748b' }}>
                    Security clearance log for visitors currently inside school grounds
                  </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    onClick={() => setIsVisitorModalOpen(true)}
                    style={{
                      background: '#2563eb', color: 'white', border: 'none',
                      fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 14px', borderRadius: '8px',
                      boxShadow: '0 2px 8px rgba(37, 99, 235, 0.25)'
                    }}
                  >
                    <UserPlus size={14} /> New Visitor Check-In
                  </button>
                  <button
                    onClick={() => switchTab('reception')}
                    style={{
                      background: '#f1f5f9', border: '1px solid #cbd5e1', color: '#2563eb',
                      fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 14px', borderRadius: '8px'
                    }}
                  >
                    Full Visitor Registry <ChevronRight size={14} />
                  </button>
                </div>
              </div>

              {visitors.filter(v => v.status === 'Checked In').length === 0 ? (
                <div style={{ textAlign: 'center', padding: '36px', color: '#94a3b8', background: '#f8fafc', borderRadius: '12px' }}>
                  <CheckCircle2 size={40} color="#16a34a" style={{ margin: '0 auto 8px' }} />
                  <p style={{ margin: 0, fontWeight: 700, color: '#334155' }}>All visitors checked out</p>
                  <p style={{ margin: '4px 0 0 0', fontSize: '0.78rem' }}>No outside guests currently inside the campus perimeter.</p>
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#64748b' }}>
                        <th style={{ padding: '10px 12px' }}>Pass ID</th>
                        <th style={{ padding: '10px 12px' }}>Visitor Name</th>
                        <th style={{ padding: '10px 12px' }}>Contact</th>
                        <th style={{ padding: '10px 12px' }}>Purpose & Host</th>
                        <th style={{ padding: '10px 12px' }}>Check-In Time</th>
                        <th style={{ padding: '10px 12px', textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {visitors.filter(v => v.status === 'Checked In').map(v => (
                        <tr key={v._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '12px', fontWeight: 800, color: '#2563eb' }}>
                            {v.passNumber}
                          </td>
                          <td style={{ padding: '12px' }}>
                            <div style={{ fontWeight: 700, color: '#1e293b' }}>{v.visitorName}</div>
                            <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Badge: {v.badgeNumber || 'General'}</div>
                          </td>
                          <td style={{ padding: '12px', color: '#475569' }}>{v.phone}</td>
                          <td style={{ padding: '12px' }}>
                            <div style={{ fontWeight: 600 }}>{v.purpose}</div>
                            <div style={{ fontSize: '0.74rem', color: '#059669' }}>Host: {v.hostPerson} ({v.department})</div>
                          </td>
                          <td style={{ padding: '12px', color: '#64748b' }}>
                            <Clock size={13} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
                            {new Date(v.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td style={{ padding: '12px', textAlign: 'right' }}>
                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                              <button
                                onClick={() => setSelectedVisitorForPass(v)}
                                style={{
                                  background: '#f1f5f9', border: '1px solid #cbd5e1',
                                  padding: '5px 10px', borderRadius: '8px', fontSize: '0.76rem',
                                  cursor: 'pointer', fontWeight: 700, color: '#334155'
                                }}
                              >
                                Print Badge
                              </button>
                              <button
                                onClick={() => handleCheckOutVisitor(v._id)}
                                style={{
                                  background: '#fee2e2', border: '1px solid #fca5a5',
                                  padding: '5px 10px', borderRadius: '8px', fontSize: '0.76rem',
                                  cursor: 'pointer', fontWeight: 800, color: '#b91c1c'
                                }}
                              >
                                Check Out
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Today's Fee Counter Collections Snapshot */}
            <div style={{
              background: 'var(--color-surface, #ffffff)',
              borderRadius: '18px',
              border: '1px solid var(--color-border, #e2e8f0)',
              padding: '24px',
              boxShadow: '0 2px 10px rgba(0,0,0,0.03)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    💳 Today's Fee Counter Collections
                    <span style={{ fontSize: '0.75rem', background: '#dcfce7', color: '#15803d', padding: '2px 8px', borderRadius: '999px', fontWeight: 800 }}>
                      ₹{(telemetry.todayCollectionTotal || 0).toLocaleString()} Collected
                    </span>
                  </h3>
                  <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: '#64748b' }}>
                    Fee receipts logged at the counter during today's shift
                  </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    onClick={() => switchTab('fees')}
                    style={{
                      background: '#059669', color: 'white', border: 'none',
                      fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 14px', borderRadius: '8px',
                      boxShadow: '0 2px 8px rgba(5, 150, 105, 0.25)'
                    }}
                  >
                    <Plus size={14} /> Accept Fee Payment
                  </button>
                  <button
                    onClick={() => switchTab('fees')}
                    style={{
                      background: '#f1f5f9', border: '1px solid #cbd5e1', color: '#059669',
                      fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 14px', borderRadius: '8px'
                    }}
                  >
                    All Receipts <ChevronRight size={14} />
                  </button>
                </div>
              </div>

              {todayReceipts.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '36px', color: '#94a3b8', background: '#f8fafc', borderRadius: '12px' }}>
                  <CreditCard size={40} color="#059669" style={{ margin: '0 auto 8px', opacity: 0.6 }} />
                  <p style={{ margin: 0, fontWeight: 700, color: '#334155' }}>No counter fees collected yet today</p>
                  <p style={{ margin: '4px 0 0 0', fontSize: '0.78rem' }}>Click 'Accept Fee Payment' to search for a student and record payment.</p>
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#64748b' }}>
                        <th style={{ padding: '10px 12px' }}>Receipt #</th>
                        <th style={{ padding: '10px 12px' }}>Student</th>
                        <th style={{ padding: '10px 12px' }}>Category</th>
                        <th style={{ padding: '10px 12px' }}>Amount</th>
                        <th style={{ padding: '10px 12px' }}>Mode</th>
                        <th style={{ padding: '10px 12px' }}>Time</th>
                        <th style={{ padding: '10px 12px', textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {todayReceipts.slice(0, 5).map(rc => (
                        <tr key={rc._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '12px', fontWeight: 800, color: '#059669' }}>
                            {rc.receiptNo || rc.receiptNumber || rc.refId}
                          </td>
                          <td style={{ padding: '12px' }}>
                            <div style={{ fontWeight: 700, color: '#1e293b' }}>{rc.studentName}</div>
                            <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Roll: {rc.rollNo || 'N/A'} • {rc.grade}</div>
                          </td>
                          <td style={{ padding: '12px', color: '#334155' }}>{rc.category}</td>
                          <td style={{ padding: '12px', fontWeight: 800, color: '#059669' }}>
                            ₹{(rc.amount || 0).toLocaleString()}
                          </td>
                          <td style={{ padding: '12px' }}>
                            <span style={{ padding: '2px 8px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 800, background: '#f1f5f9', color: '#475569' }}>
                              {rc.paymentMethod}
                            </span>
                          </td>
                          <td style={{ padding: '12px', color: '#64748b' }}>
                            <Clock size={13} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
                            {new Date(rc.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td style={{ padding: '12px', textAlign: 'right' }}>
                            <button
                              onClick={() => setSelectedReceiptForPrint(rc)}
                              style={{
                                background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#15803d',
                                padding: '5px 12px', borderRadius: '8px', fontSize: '0.76rem', fontWeight: 700, cursor: 'pointer'
                              }}
                            >
                              Print
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Recent Admission Inquiries Snapshot */}
            <div style={{
              background: 'var(--color-surface, #ffffff)',
              borderRadius: '18px',
              border: '1px solid var(--color-border, #e2e8f0)',
              padding: '24px',
              boxShadow: '0 2px 10px rgba(0,0,0,0.03)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    ✉ Recent Walk-In Admissions & Inquiries
                    <span style={{ fontSize: '0.75rem', background: '#fef3c7', color: '#b45309', padding: '2px 8px', borderRadius: '999px', fontWeight: 800 }}>
                      {inquiries.filter(i => i.status === 'New').length} New
                    </span>
                  </h3>
                  <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: '#64748b' }}>
                    Prospective parents and inquiry follow-ups logged at front desk
                  </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    onClick={() => setIsInquiryModalOpen(true)}
                    style={{
                      background: '#d97706', color: 'white', border: 'none',
                      fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 14px', borderRadius: '8px',
                      boxShadow: '0 2px 8px rgba(217, 119, 6, 0.25)'
                    }}
                  >
                    <Plus size={14} /> New Inquiry
                  </button>
                  <button
                    onClick={() => switchTab('inquiries')}
                    style={{
                      background: '#f1f5f9', border: '1px solid #cbd5e1', color: '#d97706',
                      fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 14px', borderRadius: '8px'
                    }}
                  >
                    All Inquiries <ChevronRight size={14} />
                  </button>
                </div>
              </div>

              {inquiries.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '36px', color: '#94a3b8', background: '#f8fafc', borderRadius: '12px' }}>
                  <Mail size={40} color="#d97706" style={{ margin: '0 auto 8px', opacity: 0.6 }} />
                  <p style={{ margin: 0, fontWeight: 700, color: '#334155' }}>No walk-in inquiries logged</p>
                  <p style={{ margin: '4px 0 0 0', fontSize: '0.78rem' }}>Click 'New Inquiry' to record parent inquiry details.</p>
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#64748b' }}>
                        <th style={{ padding: '10px 12px' }}>Ref #</th>
                        <th style={{ padding: '10px 12px' }}>Parent Name</th>
                        <th style={{ padding: '10px 12px' }}>Student / Grade</th>
                        <th style={{ padding: '10px 12px' }}>Contact</th>
                        <th style={{ padding: '10px 12px' }}>Status</th>
                        <th style={{ padding: '10px 12px', textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {inquiries.slice(0, 5).map(inq => (
                        <tr key={inq._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '12px', fontWeight: 800, color: '#d97706' }}>
                            {inq.inquiryNumber}
                          </td>
                          <td style={{ padding: '12px', fontWeight: 700, color: '#1e293b' }}>
                            {inq.parentName}
                          </td>
                          <td style={{ padding: '12px' }}>
                            <div style={{ fontWeight: 600 }}>{inq.studentName || 'Prospective Student'}</div>
                            <div style={{ fontSize: '0.72rem', color: '#2563eb' }}>Applying: {inq.gradeSeeking}</div>
                          </td>
                          <td style={{ padding: '12px', color: '#475569' }}>
                            <div>{inq.phone}</div>
                          </td>
                          <td style={{ padding: '12px' }}>
                            <span style={{
                              padding: '2px 8px', borderRadius: '999px', fontSize: '0.72rem', fontWeight: 800,
                              background: inq.status === 'New' ? '#fef3c7' : inq.status === 'Enrolled' ? '#dcfce7' : '#f1f5f9',
                              color: inq.status === 'New' ? '#b45309' : inq.status === 'Enrolled' ? '#15803d' : '#475569'
                            }}>
                              {inq.status}
                            </span>
                          </td>
                          <td style={{ padding: '12px', textAlign: 'right' }}>
                            <select
                              value={inq.status}
                              onChange={(e) => handleUpdateInquiryStatus(inq._id, e.target.value)}
                              style={{
                                padding: '4px 8px', borderRadius: '6px', border: '1px solid #cbd5e1',
                                fontSize: '0.75rem', fontWeight: 600, color: '#334155', cursor: 'pointer'
                              }}
                            >
                              <option value="New">New</option>
                              <option value="Contacted">Contacted</option>
                              <option value="Visited Campus">Visited</option>
                              <option value="Enrolled">Enrolled</option>
                              <option value="Closed">Closed</option>
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT UTILITY COLUMN */}
          <div className="right-column">
            {/* Real-time Front Desk Staff Punch In / Punch Out Time Clock */}
            <StaffPunchClock onPunchSuccess={() => fetchAllData()} />

            {/* Front Desk Protocols & Safety Checklist */}
            <div style={{
              background: 'var(--color-surface, #ffffff)',
              borderRadius: '18px',
              border: '1px solid var(--color-border, #e2e8f0)',
              padding: '22px',
              boxShadow: '0 2px 10px rgba(0,0,0,0.03)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                <ShieldCheck size={20} color="#2563eb" />
                <h4 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 800, color: '#1e293b' }}>
                  Front Desk Operational Protocols
                </h4>
              </div>
              <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '0.82rem', color: '#475569', lineHeight: 1.65 }}>
                <li><strong>Identity Verification:</strong> Require government photo ID for all new visitor check-ins.</li>
                <li><strong>Cash Balancing:</strong> Reconcile all physical fee collections with digital receipts at 04:00 PM.</li>
                <li><strong>Gate Security:</strong> Student early departures require verified parent authorization.</li>
                <li><strong>Inbound Courier:</strong> Log parcels immediately and notify staff recipient department.</li>
              </ul>
              
              <div style={{
                marginTop: '16px', paddingTop: '14px', borderTop: '1px solid #f1f5f9',
                display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: '#64748b', fontWeight: 600
              }}>
                <span>Main Gate: <strong>Ext. 101</strong></span>
                <span>Principal: <strong>Ext. 200</strong></span>
                <span>Infirmary: <strong>Ext. 112</strong></span>
              </div>
            </div>

            {/* Live Campus Security & Facility Status */}
            <div style={{
              background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
              borderRadius: '18px',
              border: '1px solid var(--color-border, #e2e8f0)',
              padding: '20px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
            }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.04em', marginBottom: '12px' }}>
                Campus Facilities Status
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.82rem' }}>
                  <span style={{ color: '#334155', fontWeight: 600 }}>Main Gate 1 (Vehicular)</span>
                  <span style={{ color: '#15803d', fontWeight: 800, background: '#dcfce7', padding: '2px 8px', borderRadius: '6px', fontSize: '0.74rem' }}>
                    ● Open & Guarded
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.82rem' }}>
                  <span style={{ color: '#334155', fontWeight: 600 }}>Accounts Fee Counter</span>
                  <span style={{ color: '#15803d', fontWeight: 800, background: '#dcfce7', padding: '2px 8px', borderRadius: '6px', fontSize: '0.74rem' }}>
                    ● Window Active
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.82rem' }}>
                  <span style={{ color: '#334155', fontWeight: 600 }}>Visitor Badge Quota</span>
                  <span style={{ color: '#2563eb', fontWeight: 800, background: '#dbeafe', padding: '2px 8px', borderRadius: '6px', fontSize: '0.74rem' }}>
                    100 / 100 Available
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: RECEPTION & VISITORS */}
      {activeTab === 'reception' && (
        <div style={{
          background: 'var(--color-surface, #ffffff)',
          borderRadius: '18px',
          border: '1px solid var(--color-border, #e2e8f0)',
          padding: '24px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.03)'
        }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '14px' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800, color: '#1e293b' }}>
                Reception Desk & Visitor Pass Registry
              </h2>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.84rem', color: '#64748b' }}>
                Issue entrance passes, verify identity documents, manage visitor security logs, and record departures
              </p>
            </div>
            <button
              onClick={() => setIsVisitorModalOpen(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                background: '#2563eb', color: 'white', border: 'none',
                padding: '10px 20px', borderRadius: '12px', fontWeight: 800,
                fontSize: '0.88rem', cursor: 'pointer', boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)'
              }}
            >
              <UserPlus size={16} /> New Visitor Check-In
            </button>
          </div>

          {/* Search & Filters */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ position: 'relative', width: '320px' }}>
              <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                placeholder="Search visitor by name, phone, or badge..."
                value={visitorSearchQuery}
                onChange={(e) => setVisitorSearchQuery(e.target.value)}
                style={{
                  width: '100%', padding: '9px 12px 9px 36px',
                  borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.85rem'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '6px' }}>
              {['All', 'Checked In', 'Completed'].map(status => (
                <button
                  key={status}
                  onClick={() => setVisitorFilter(status)}
                  style={{
                    padding: '6px 14px', borderRadius: '8px', border: 'none',
                    background: visitorFilter === status ? '#2563eb' : '#f1f5f9',
                    color: visitorFilter === status ? 'white' : '#475569',
                    fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer'
                  }}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          {/* Visitors Table */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e2e8f0', color: '#64748b', background: '#f8fafc' }}>
                  <th style={{ padding: '12px' }}>Pass #</th>
                  <th style={{ padding: '12px' }}>Visitor Name</th>
                  <th style={{ padding: '12px' }}>Phone / ID</th>
                  <th style={{ padding: '12px' }}>Purpose & Host</th>
                  <th style={{ padding: '12px' }}>Check-In Time</th>
                  <th style={{ padding: '12px' }}>Check-Out</th>
                  <th style={{ padding: '12px' }}>Status</th>
                  <th style={{ padding: '12px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {visitors
                  .filter(v => visitorFilter === 'All' ? true : v.status === visitorFilter)
                  .filter(v => {
                    if (!visitorSearchQuery) return true;
                    const q = visitorSearchQuery.toLowerCase();
                    return (
                      v.visitorName?.toLowerCase().includes(q) ||
                      v.phone?.toLowerCase().includes(q) ||
                      v.passNumber?.toLowerCase().includes(q)
                    );
                  })
                  .map(v => (
                    <tr key={v._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '12px', fontWeight: 800, color: '#2563eb' }}>
                        {v.passNumber}
                      </td>
                      <td style={{ padding: '12px' }}>
                        <div style={{ fontWeight: 700, color: '#1e293b' }}>{v.visitorName}</div>
                        {v.vehicleNumber && (
                          <div style={{ fontSize: '0.72rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Car size={11} /> {v.vehicleNumber}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '12px' }}>
                        <div>{v.phone}</div>
                        <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{v.idType} {v.idNumber}</div>
                      </td>
                      <td style={{ padding: '12px' }}>
                        <div style={{ fontWeight: 600 }}>{v.purpose}</div>
                        <div style={{ fontSize: '0.74rem', color: '#059669' }}>Host: {v.hostPerson}</div>
                      </td>
                      <td style={{ padding: '12px', color: '#64748b' }}>
                        {new Date(v.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td style={{ padding: '12px', color: '#64748b' }}>
                        {v.checkOutTime ? new Date(v.checkOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                      </td>
                      <td style={{ padding: '12px' }}>
                        <span style={{
                          padding: '3px 10px', borderRadius: '999px', fontSize: '0.72rem', fontWeight: 800,
                          background: v.status === 'Checked In' ? '#dcfce7' : '#f1f5f9',
                          color: v.status === 'Checked In' ? '#15803d' : '#64748b'
                        }}>
                          {v.status === 'Checked In' ? '● On Premises' : 'Completed'}
                        </span>
                      </td>
                      <td style={{ padding: '12px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                          <button
                            onClick={() => setSelectedVisitorForPass(v)}
                            title="Print Gate Pass"
                            style={{
                              background: '#f8fafc', border: '1px solid #cbd5e1',
                              padding: '5px 10px', borderRadius: '8px', cursor: 'pointer',
                              display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.76rem', fontWeight: 700
                            }}
                          >
                            <Printer size={13} color="#475569" /> Badge
                          </button>
                          {v.status === 'Checked In' && (
                            <button
                              onClick={() => handleCheckOutVisitor(v._id)}
                              style={{
                                background: '#fee2e2', border: '1px solid #fca5a5',
                                padding: '5px 10px', borderRadius: '8px', fontSize: '0.76rem',
                                cursor: 'pointer', fontWeight: 800, color: '#b91c1c'
                              }}
                            >
                              Check Out
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: ACCOUNTS WINDOW & FEES SUBMISSION */}
      {activeTab === 'fees' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Student Search & Lookup Section */}
          <div style={{
            background: 'var(--color-surface, #ffffff)',
            borderRadius: '18px',
            border: '1px solid var(--color-border, #e2e8f0)',
            padding: '24px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.03)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '18px' }}>
              <div style={{
                width: '44px', height: '44px', borderRadius: '12px',
                background: 'rgba(5, 150, 105, 0.1)', color: '#059669',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <CreditCard size={24} />
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800, color: '#1e293b' }}>
                  Accounts Window — Student Fee Collection Desk
                </h2>
                <p style={{ margin: '2px 0 0 0', fontSize: '0.82rem', color: '#64748b' }}>
                  Search student by name or roll number to inspect pending dues, accept cash/UPI, and print counter receipts
                </p>
              </div>
            </div>

            {/* Search Input */}
            <div style={{ position: 'relative', maxWidth: '640px', marginBottom: '20px' }}>
              <Search size={18} color="#94a3b8" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                placeholder="Search student by name or roll number (e.g. Aarav, 2024-001)..."
                value={studentSearchQuery}
                onChange={(e) => handleStudentSearch(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 16px 12px 42px',
                  borderRadius: '12px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.92rem',
                  outline: 'none',
                  boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.05)'
                }}
              />
              {isSearchingStudents && (
                <div style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', fontSize: '0.78rem', color: '#64748b' }}>
                  Searching...
                </div>
              )}
            </div>

            {/* Found Student Candidates */}
            {studentSearchResults.length > 0 && !selectedStudentForFee && (
              <div style={{
                border: '1px solid #e2e8f0',
                borderRadius: '14px',
                padding: '14px',
                background: '#f8fafc',
                marginBottom: '20px'
              }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '10px' }}>
                  Select Student to Open Fee Payment Window:
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '10px' }}>
                  {studentSearchResults.map(st => (
                    <div
                      key={st._id}
                      onClick={() => {
                        setSelectedStudentForFee(st);
                        setFeeForm(prev => ({
                          ...prev,
                          amount: st.totalPending || 15000,
                          payerName: st.parentName || st.name,
                          payerPhone: st.parentContact || ''
                        }));
                      }}
                      style={{
                        padding: '12px 16px',
                        background: 'white',
                        border: '1px solid #cbd5e1',
                        borderRadius: '12px',
                        cursor: 'pointer',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        transition: 'all 0.2s',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                      }}
                      onMouseOver={e => e.currentTarget.style.borderColor = '#059669'}
                      onMouseOut={e => e.currentTarget.style.borderColor = '#cbd5e1'}
                    >
                      <div>
                        <div style={{ fontWeight: 800, color: '#1e293b' }}>{st.name}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                          Roll: <strong>{st.rollNo}</strong> • Class: {st.grade}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.72rem', color: '#d97706', fontWeight: 700 }}>Pending Dues</div>
                        <div style={{ fontSize: '1rem', fontWeight: 900, color: '#b91c1c' }}>
                          ₹{(st.totalPending || 15000).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Selected Student Active Counter Panel */}
            {selectedStudentForFee && (
              <div style={{
                background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)',
                border: '1px solid #a7f3d0',
                borderRadius: '16px',
                padding: '22px',
                marginBottom: '24px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px' }}>
                  <div>
                    <span style={{ fontSize: '0.72rem', background: '#dcfce7', color: '#15803d', padding: '3px 10px', borderRadius: '6px', fontWeight: 800, textTransform: 'uppercase' }}>
                      Active Student Account Ready
                    </span>
                    <h3 style={{ margin: '8px 0 2px 0', fontSize: '1.35rem', fontWeight: 800, color: '#065f46' }}>
                      {selectedStudentForFee.name}
                    </h3>
                    <p style={{ margin: 0, fontSize: '0.84rem', color: '#047857' }}>
                      Roll No: <strong>{selectedStudentForFee.rollNo}</strong> • Grade: <strong>{selectedStudentForFee.grade}</strong> • Parent: {selectedStudentForFee.parentName || 'N/A'} ({selectedStudentForFee.parentContact || 'N/A'})
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <div style={{ textAlign: 'right', marginRight: '10px' }}>
                      <div style={{ fontSize: '0.75rem', color: '#047857', fontWeight: 700 }}>Outstanding Balance</div>
                      <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#b91c1c' }}>
                        ₹{(selectedStudentForFee.totalPending || 15000).toLocaleString()}
                      </div>
                    </div>
                    <button
                      onClick={() => setIsFeeModalOpen(true)}
                      style={{
                        background: '#059669', color: 'white', border: 'none',
                        padding: '12px 22px', borderRadius: '12px', fontWeight: 800,
                        fontSize: '0.9rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
                        boxShadow: '0 4px 12px rgba(5, 150, 105, 0.3)'
                      }}
                    >
                      <CreditCard size={18} /> Collect Payment Now
                    </button>
                    <button
                      onClick={() => setSelectedStudentForFee(null)}
                      style={{
                        background: 'white', color: '#475569', border: '1px solid #cbd5e1',
                        padding: '12px 14px', borderRadius: '12px', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer'
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Today's Fee Receipts */}
          <div style={{
            background: 'var(--color-surface, #ffffff)',
            borderRadius: '18px',
            border: '1px solid var(--color-border, #e2e8f0)',
            padding: '24px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.03)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#1e293b' }}>
                Today's Counter Collections ({todayReceipts.length} Transactions)
              </h3>
            </div>

            {todayReceipts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '36px', color: '#94a3b8' }}>
                <CreditCard size={40} style={{ margin: '0 auto 8px', opacity: 0.5 }} />
                <p style={{ margin: 0, fontWeight: 700 }}>No counter payments collected yet today</p>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem' }}>Search for a student above to accept tuition or transport fees.</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #e2e8f0', color: '#64748b' }}>
                      <th style={{ padding: '12px' }}>Receipt #</th>
                      <th style={{ padding: '12px' }}>Student</th>
                      <th style={{ padding: '12px' }}>Category</th>
                      <th style={{ padding: '12px' }}>Amount</th>
                      <th style={{ padding: '12px' }}>Mode</th>
                      <th style={{ padding: '12px' }}>Time</th>
                      <th style={{ padding: '12px', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {todayReceipts.map(rc => (
                      <tr key={rc._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '12px', fontWeight: 800, color: '#059669' }}>
                          {rc.receiptNo}
                        </td>
                        <td style={{ padding: '12px' }}>
                          <div style={{ fontWeight: 700, color: '#1e293b' }}>{rc.studentName}</div>
                          <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Roll: {rc.rollNo || 'N/A'}</div>
                        </td>
                        <td style={{ padding: '12px' }}>{rc.category}</td>
                        <td style={{ padding: '12px', fontWeight: 800, color: '#059669' }}>
                          ₹{(rc.amount || 0).toLocaleString()}
                        </td>
                        <td style={{ padding: '12px' }}>
                          <span style={{ padding: '2px 8px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 800, background: '#f1f5f9' }}>
                            {rc.paymentMethod}
                          </span>
                        </td>
                        <td style={{ padding: '12px', color: '#64748b' }}>
                          {new Date(rc.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td style={{ padding: '12px', textAlign: 'right' }}>
                          <button
                            onClick={() => setSelectedReceiptForPrint(rc)}
                            style={{
                              background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#15803d',
                              padding: '5px 12px', borderRadius: '8px', fontSize: '0.76rem', fontWeight: 700, cursor: 'pointer'
                            }}
                          >
                            Print Receipt
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: ADMISSIONS & INQUIRIES */}
      {activeTab === 'inquiries' && (
        <div style={{
          background: 'var(--color-surface, #ffffff)',
          borderRadius: '18px',
          border: '1px solid var(--color-border, #e2e8f0)',
          padding: '24px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.03)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '14px' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800, color: '#1e293b' }}>
                Walk-In Admissions & Inquiry Desk
              </h2>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.84rem', color: '#64748b' }}>
                Record prospective parent inquiries, capture student grade details, and track admissions status
              </p>
            </div>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={() => setIsInquiryModalOpen(true)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  background: 'white', color: '#d97706', border: '1px solid #d97706',
                  padding: '9px 16px', borderRadius: '12px', fontWeight: 700,
                  fontSize: '0.86rem', cursor: 'pointer'
                }}
              >
                <Mail size={16} /> Register Walk-in Inquiry
              </button>
              <button
                onClick={() => handleOpenAdmitStudentModal()}
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)', color: 'white', border: 'none',
                  padding: '9px 18px', borderRadius: '12px', fontWeight: 800,
                  fontSize: '0.86rem', cursor: 'pointer', boxShadow: '0 4px 12px rgba(22, 163, 74, 0.3)'
                }}
              >
                <UserPlus size={16} /> + Admit New Student
              </button>
            </div>
          </div>

          {/* Filters */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ position: 'relative', width: '320px' }}>
              <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                placeholder="Search parent or student name..."
                value={inquirySearchQuery}
                onChange={(e) => setInquirySearchQuery(e.target.value)}
                style={{
                  width: '100%', padding: '9px 12px 9px 36px',
                  borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.85rem'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '6px' }}>
              {['All', 'New', 'Contacted', 'Enrolled'].map(status => (
                <button
                  key={status}
                  onClick={() => setInquiryFilter(status)}
                  style={{
                    padding: '6px 14px', borderRadius: '8px', border: 'none',
                    background: inquiryFilter === status ? '#d97706' : '#f1f5f9',
                    color: inquiryFilter === status ? 'white' : '#475569',
                    fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer'
                  }}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          {/* Inquiries Table */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e2e8f0', color: '#64748b', background: '#f8fafc' }}>
                  <th style={{ padding: '12px' }}>Ref #</th>
                  <th style={{ padding: '12px' }}>Parent Name</th>
                  <th style={{ padding: '12px' }}>Student & Grade</th>
                  <th style={{ padding: '12px' }}>Contact</th>
                  <th style={{ padding: '12px' }}>Source</th>
                  <th style={{ padding: '12px' }}>Status</th>
                  <th style={{ padding: '12px', textAlign: 'right' }}>Update Status</th>
                </tr>
              </thead>
              <tbody>
                {inquiries
                  .filter(inq => inquiryFilter === 'All' ? true : inq.status === inquiryFilter)
                  .filter(inq => {
                    if (!inquirySearchQuery) return true;
                    const q = inquirySearchQuery.toLowerCase();
                    return (
                      inq.parentName?.toLowerCase().includes(q) ||
                      inq.studentName?.toLowerCase().includes(q) ||
                      inq.phone?.toLowerCase().includes(q)
                    );
                  })
                  .map(inq => (
                    <tr key={inq._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '12px', fontWeight: 800, color: '#d97706' }}>
                        {inq.inquiryNumber}
                      </td>
                      <td style={{ padding: '12px', fontWeight: 700, color: '#1e293b' }}>
                        {inq.parentName}
                      </td>
                      <td style={{ padding: '12px' }}>
                        <div style={{ fontWeight: 600 }}>{inq.studentName || 'Prospective Student'}</div>
                        <div style={{ fontSize: '0.72rem', color: '#2563eb' }}>Applying: {inq.gradeSeeking}</div>
                      </td>
                      <td style={{ padding: '12px' }}>
                        <div>{inq.phone}</div>
                        {inq.email && <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{inq.email}</div>}
                      </td>
                      <td style={{ padding: '12px', color: '#64748b' }}>{inq.source}</td>
                      <td style={{ padding: '12px' }}>
                        <span style={{
                          padding: '3px 10px', borderRadius: '999px', fontSize: '0.72rem', fontWeight: 800,
                          background: inq.status === 'New' ? '#fef3c7' : inq.status === 'Enrolled' ? '#dcfce7' : '#f1f5f9',
                          color: inq.status === 'New' ? '#b45309' : inq.status === 'Enrolled' ? '#15803d' : '#475569'
                        }}>
                          {inq.status}
                        </span>
                      </td>
                      <td style={{ padding: '12px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', alignItems: 'center' }}>
                          {inq.status !== 'Enrolled' && (
                            <button
                              onClick={() => handleOpenAdmitStudentModal(inq)}
                              style={{
                                padding: '5px 10px',
                                borderRadius: '6px',
                                border: 'none',
                                background: '#16a34a',
                                color: 'white',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                              title="Admit directly into school roster"
                            >
                              <UserPlus size={12} /> Admit
                            </button>
                          )}
                          <select
                            value={inq.status}
                            onChange={(e) => handleUpdateInquiryStatus(inq._id, e.target.value)}
                            style={{
                              padding: '4px 8px', borderRadius: '6px', border: '1px solid #cbd5e1',
                              fontSize: '0.75rem', fontWeight: 600, color: '#334155', cursor: 'pointer'
                            }}
                          >
                            <option value="New">New</option>
                            <option value="Contacted">Contacted</option>
                            <option value="Visited Campus">Visited Campus</option>
                            <option value="Enrolled">Enrolled</option>
                            <option value="Closed">Closed</option>
                          </select>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: STUDENT GATE PASSES */}
      {activeTab === 'gatepasses' && (
        <div style={{
          background: 'var(--color-surface, #ffffff)',
          borderRadius: '18px',
          border: '1px solid var(--color-border, #e2e8f0)',
          padding: '24px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.03)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '14px' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800, color: '#1e293b' }}>
                Student Gate Movement & Departure Passes
              </h2>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.84rem', color: '#64748b' }}>
                Issue authorized gate passes for student early departures, verified parent pickups, and medical leaves
              </p>
            </div>
            <button
              onClick={() => setIsGatePassModalOpen(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                background: '#7c3aed', color: 'white', border: 'none',
                padding: '10px 20px', borderRadius: '12px', fontWeight: 800,
                fontSize: '0.88rem', cursor: 'pointer', boxShadow: '0 4px 12px rgba(124, 58, 237, 0.3)'
              }}
            >
              <ShieldCheck size={16} /> Issue Student Gate Pass
            </button>
          </div>

          {/* Gate Passes Table */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e2e8f0', color: '#64748b', background: '#f8fafc' }}>
                  <th style={{ padding: '12px' }}>Pass #</th>
                  <th style={{ padding: '12px' }}>Student Name</th>
                  <th style={{ padding: '12px' }}>Pass Type</th>
                  <th style={{ padding: '12px' }}>Reason</th>
                  <th style={{ padding: '12px' }}>Escort & Permission</th>
                  <th style={{ padding: '12px' }}>Departure Time</th>
                  <th style={{ padding: '12px' }}>Status</th>
                  <th style={{ padding: '12px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {gatePasses.map(gp => (
                  <tr key={gp._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '12px', fontWeight: 800, color: '#7c3aed' }}>
                      {gp.passNumber}
                    </td>
                    <td style={{ padding: '12px' }}>
                      <div style={{ fontWeight: 700, color: '#1e293b' }}>{gp.studentName}</div>
                      <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Roll: {gp.rollNo || 'N/A'} • {gp.classSection}</div>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span style={{
                        padding: '3px 8px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 800,
                        background: '#f5f3ff', color: '#6d28d9'
                      }}>
                        {gp.passType}
                      </span>
                    </td>
                    <td style={{ padding: '12px', color: '#334155' }}>{gp.reason}</td>
                    <td style={{ padding: '12px' }}>
                      <div style={{ fontSize: '0.8rem', fontWeight: 600 }}>{gp.escortedBy}</div>
                      <div style={{ fontSize: '0.72rem', color: gp.parentPermissionVerified ? '#15803d' : '#b91c1c' }}>
                        {gp.parentPermissionVerified ? '✓ Parent Verified' : '⚠ Unverified'}
                      </div>
                    </td>
                    <td style={{ padding: '12px', color: '#64748b' }}>
                      {new Date(gp.outTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span style={{
                        padding: '3px 10px', borderRadius: '999px', fontSize: '0.72rem', fontWeight: 800,
                        background: '#dcfce7', color: '#15803d'
                      }}>
                        {gp.status}
                      </span>
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right' }}>
                      <button
                        onClick={() => setSelectedGatePassForPrint(gp)}
                        style={{
                          background: '#f5f3ff', border: '1px solid #ddd6fe', color: '#7c3aed',
                          padding: '5px 12px', borderRadius: '8px', fontSize: '0.76rem', fontWeight: 700, cursor: 'pointer'
                        }}
                      >
                        Print Pass Slip
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 6: COURIERS & DISPATCH */}
      {activeTab === 'parcels' && (
        <div style={{
          background: 'var(--color-surface, #ffffff)',
          borderRadius: '18px',
          border: '1px solid var(--color-border, #e2e8f0)',
          padding: '24px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.03)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '14px' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800, color: '#1e293b' }}>
                Courier & Inbound Parcel Registry Desk
              </h2>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.84rem', color: '#64748b' }}>
                Log incoming courier deliveries, notify recipient teachers/staff, and verify secure handovers
              </p>
            </div>
            <button
              onClick={() => setIsParcelModalOpen(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                background: '#0f766e', color: 'white', border: 'none',
                padding: '10px 20px', borderRadius: '12px', fontWeight: 800,
                fontSize: '0.88rem', cursor: 'pointer', boxShadow: '0 4px 12px rgba(15, 118, 110, 0.3)'
              }}
            >
              <Package size={16} /> Log Inbound Parcel
            </button>
          </div>

          {/* Parcels Table */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e2e8f0', color: '#64748b', background: '#f8fafc' }}>
                  <th style={{ padding: '12px' }}>Waybill / Tracking #</th>
                  <th style={{ padding: '12px' }}>Courier Service</th>
                  <th style={{ padding: '12px' }}>Sender</th>
                  <th style={{ padding: '12px' }}>Recipient & Dept</th>
                  <th style={{ padding: '12px' }}>Received At</th>
                  <th style={{ padding: '12px' }}>Status</th>
                  <th style={{ padding: '12px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {parcels.map(p => (
                  <tr key={p._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '12px', fontWeight: 800, color: '#0f766e' }}>
                      {p.trackingNumber}
                    </td>
                    <td style={{ padding: '12px', fontWeight: 600 }}>{p.courierService}</td>
                    <td style={{ padding: '12px', color: '#475569' }}>{p.sender || 'Direct Delivery'}</td>
                    <td style={{ padding: '12px' }}>
                      <div style={{ fontWeight: 700, color: '#1e293b' }}>{p.recipient}</div>
                      <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Dept: {p.department}</div>
                    </td>
                    <td style={{ padding: '12px', color: '#64748b' }}>
                      {new Date(p.receivedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span style={{
                        padding: '3px 10px', borderRadius: '999px', fontSize: '0.72rem', fontWeight: 800,
                        background: p.status === 'Received at Desk' ? '#fef3c7' : '#dcfce7',
                        color: p.status === 'Received at Desk' ? '#b45309' : '#15803d'
                      }}>
                        {p.status}
                      </span>
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right' }}>
                      {p.status === 'Received at Desk' ? (
                        <button
                          onClick={() => handleHandoverParcel(p._id)}
                          style={{
                            background: '#0f766e', color: 'white', border: 'none',
                            padding: '6px 14px', borderRadius: '8px', fontSize: '0.76rem', fontWeight: 700, cursor: 'pointer'
                          }}
                        >
                          Hand Over
                        </button>
                      ) : (
                        <span style={{ fontSize: '0.74rem', color: '#15803d', fontWeight: 700 }}>
                          ✓ Handed Over
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODALS & PRINTABLE DOCUMENT TEMPLATES                        */}
      {/* ============================================================ */}

      {/* 1. NEW VISITOR CHECK-IN MODAL */}
      {isVisitorModalOpen && createPortal(
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(8px)',
          zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px'
        }} onClick={() => setIsVisitorModalOpen(false)}>
          <div style={{
            background: 'white', borderRadius: '20px', width: '100%', maxWidth: '540px',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', overflow: 'hidden'
          }} onClick={e => e.stopPropagation()}>
            <div style={{
              padding: '20px 24px', background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)',
              color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>New Visitor Check-In</h3>
                <p style={{ margin: '2px 0 0 0', fontSize: '0.78rem', opacity: 0.9 }}>Issue visitor security badge & campus entry pass</p>
              </div>
              <button onClick={() => setIsVisitorModalOpen(false)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCheckInVisitor} style={{ padding: '24px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    Visitor Full Name *
                  </label>
                  <input
                    type="text" required
                    placeholder="e.g. Ramesh Kumar"
                    value={visitorForm.visitorName}
                    onChange={(e) => setVisitorForm({ ...visitorForm, visitorName: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    Phone Number *
                  </label>
                  <input
                    type="tel" required
                    placeholder="e.g. +91 98765 43210"
                    value={visitorForm.phone}
                    onChange={(e) => setVisitorForm({ ...visitorForm, phone: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    Purpose of Visit *
                  </label>
                  <input
                    type="text" required
                    placeholder="e.g. Parent-Teacher Discussion"
                    value={visitorForm.purpose}
                    onChange={(e) => setVisitorForm({ ...visitorForm, purpose: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    Host Person / Teacher *
                  </label>
                  <input
                    type="text" required
                    placeholder="e.g. Mr. Sharma (Science Dept)"
                    value={visitorForm.hostPerson}
                    onChange={(e) => setVisitorForm({ ...visitorForm, hostPerson: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    Photo ID Type
                  </label>
                  <select
                    value={visitorForm.idType}
                    onChange={(e) => setVisitorForm({ ...visitorForm, idType: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  >
                    <option value="Aadhaar Card">Aadhaar Card</option>
                    <option value="Driving License">Driving License</option>
                    <option value="Voter ID">Voter ID</option>
                    <option value="PAN Card">PAN Card</option>
                    <option value="Passport">Passport</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    ID Number (Last 4 digits)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 4819"
                    value={visitorForm.idNumber}
                    onChange={(e) => setVisitorForm({ ...visitorForm, idNumber: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '18px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    Vehicle Number (if parked inside)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. DL-01-AB-1234"
                    value={visitorForm.vehicleNumber}
                    onChange={(e) => setVisitorForm({ ...visitorForm, vehicleNumber: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    Assigned Physical Badge #
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. V-14"
                    value={visitorForm.badgeNumber}
                    onChange={(e) => setVisitorForm({ ...visitorForm, badgeNumber: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setIsVisitorModalOpen(false)}
                  style={{
                    padding: '9px 16px', borderRadius: '8px', border: '1px solid #cbd5e1',
                    background: 'white', color: '#475569', fontWeight: 700, cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '9px 20px', borderRadius: '8px', border: 'none',
                    background: '#2563eb', color: 'white', fontWeight: 800, cursor: 'pointer'
                  }}
                >
                  Check In & Issue Badge
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* 2. PRINTABLE VISITOR GATE PASS BADGE TEMPLATE */}
      {selectedVisitorForPass && createPortal(
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(8px)',
          zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px'
        }} onClick={() => setSelectedVisitorForPass(null)}>
          <div style={{
            background: 'white', borderRadius: '20px', width: '100%', maxWidth: '420px',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', overflow: 'hidden'
          }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: '26px 24px', textAlign: 'center', borderBottom: '2px dashed #cbd5e1' }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#2563eb', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                Pragati School Management
              </div>
              <h3 style={{ margin: '4px 0', fontSize: '1.25rem', fontWeight: 900, color: '#1e293b' }}>
                OFFICIAL VISITOR PASS
              </h3>
              <div style={{ fontSize: '0.76rem', color: '#64748b' }}>
                {sessionStorage.getItem('schoolName') || 'Neel Public School (Main Campus)'}
              </div>

              <div style={{
                margin: '16px auto', width: '70px', height: '70px', borderRadius: '16px',
                background: '#f1f5f9', border: '2px solid #cbd5e1', display: 'flex',
                alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem'
              }}>
                👤
              </div>

              <div style={{ fontSize: '1.3rem', fontWeight: 900, color: '#1e293b' }}>
                {selectedVisitorForPass.visitorName}
              </div>
              <div style={{ fontSize: '0.85rem', color: '#475569', marginTop: '2px' }}>
                {selectedVisitorForPass.phone}
              </div>

              <div style={{
                marginTop: '14px', background: '#eff6ff', border: '1px solid #bfdbfe',
                borderRadius: '10px', padding: '10px 14px', fontSize: '0.85rem'
              }}>
                <div style={{ color: '#1e40af', fontWeight: 800 }}>Pass #{selectedVisitorForPass.passNumber}</div>
                <div style={{ color: '#3b82f6', fontSize: '0.78rem', fontWeight: 700 }}>Badge: {selectedVisitorForPass.badgeNumber || 'General Access'}</div>
              </div>

              <div style={{ marginTop: '16px', textAlign: 'left', fontSize: '0.82rem', color: '#334155', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div><strong>Purpose:</strong> {selectedVisitorForPass.purpose}</div>
                <div><strong>Host Person:</strong> {selectedVisitorForPass.hostPerson} ({selectedVisitorForPass.department || 'General'})</div>
                <div><strong>Check-In Time:</strong> {new Date(selectedVisitorForPass.checkInTime).toLocaleString()}</div>
                <div><strong>Authorized By:</strong> Mr. Sonu Kumar (Support Staff)</div>
              </div>

              {/* Barcode Mock for pass verification */}
              <div style={{ marginTop: '16px', letterSpacing: '4px', fontFamily: 'monospace', fontWeight: 700, color: '#475569', fontSize: '0.9rem' }}>
                |||| | ||||| || |||||| | ||||
              </div>
            </div>

            <div style={{ padding: '16px 24px', background: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                onClick={() => setSelectedVisitorForPass(null)}
                style={{
                  background: 'none', border: 'none', color: '#64748b',
                  fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer'
                }}
              >
                Close
              </button>
              <button
                onClick={() => window.print()}
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  background: '#2563eb', color: 'white', border: 'none',
                  padding: '9px 18px', borderRadius: '10px', fontWeight: 800,
                  fontSize: '0.82rem', cursor: 'pointer'
                }}
              >
                <Printer size={15} /> Print Pass Badge
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* 3. COLLECT FEE PAYMENT MODAL */}
      {isFeeModalOpen && selectedStudentForFee && createPortal(
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(8px)',
          zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px'
        }} onClick={() => setIsFeeModalOpen(false)}>
          <div style={{
            background: 'white', borderRadius: '20px', width: '100%', maxWidth: '520px',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', overflow: 'hidden'
          }} onClick={e => e.stopPropagation()}>
            <div style={{
              padding: '20px 24px', background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
              color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>Record Fee Collection</h3>
                <p style={{ margin: '2px 0 0 0', fontSize: '0.78rem', opacity: 0.9 }}>
                  Student: {selectedStudentForFee.name} (Roll: {selectedStudentForFee.rollNo})
                </p>
              </div>
              <button onClick={() => setIsFeeModalOpen(false)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleRecordFee} style={{ padding: '24px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    Fee Category *
                  </label>
                  <select
                    value={feeForm.category}
                    onChange={(e) => setFeeForm({ ...feeForm, category: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  >
                    <option value="Tuition Fee">Tuition Fee</option>
                    <option value="Transport Fee">Transport Fee</option>
                    <option value="Examination Fee">Examination Fee</option>
                    <option value="Admission / Registration Fee">Admission / Registration Fee</option>
                    <option value="Lab & Practical Fee">Lab & Practical Fee</option>
                    <option value="Annual Activity Fee">Annual Activity Fee</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    Amount (₹) *
                  </label>
                  <input
                    type="number" required
                    placeholder="Amount in Rupees"
                    value={feeForm.amount}
                    onChange={(e) => setFeeForm({ ...feeForm, amount: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontWeight: 800, fontSize: '1rem', color: '#059669' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    Payment Mode *
                  </label>
                  <select
                    value={feeForm.paymentMethod}
                    onChange={(e) => setFeeForm({ ...feeForm, paymentMethod: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  >
                    <option value="Cash">Cash (Counter)</option>
                    <option value="UPI / QR">UPI / QR Code</option>
                    <option value="Debit / Credit Card">Debit / Credit Card</option>
                    <option value="Net Banking">Net Banking</option>
                    <option value="Cheque / DD">Cheque / Demand Draft</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    Transaction Ref / Cheque No
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. UPI-99214 or Cash Slip"
                    value={feeForm.txnReference}
                    onChange={(e) => setFeeForm({ ...feeForm, txnReference: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    Payer Name
                  </label>
                  <input
                    type="text"
                    placeholder="Parent / Guardian Name"
                    value={feeForm.payerName}
                    onChange={(e) => setFeeForm({ ...feeForm, payerName: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    Payer Phone
                  </label>
                  <input
                    type="tel"
                    placeholder="Contact Number"
                    value={feeForm.payerPhone}
                    onChange={(e) => setFeeForm({ ...feeForm, payerPhone: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '18px' }}>
                <button
                  type="button"
                  onClick={() => setIsFeeModalOpen(false)}
                  style={{
                    padding: '9px 16px', borderRadius: '8px', border: '1px solid #cbd5e1',
                    background: 'white', color: '#475569', fontWeight: 700, cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '9px 22px', borderRadius: '8px', border: 'none',
                    background: '#059669', color: 'white', fontWeight: 800, cursor: 'pointer'
                  }}
                >
                  Confirm & Generate Receipt
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* 4. PRINTABLE OFFICIAL FEE RECEIPT TEMPLATE */}
      {selectedReceiptForPrint && createPortal(
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(8px)',
          zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px'
        }} onClick={() => setSelectedReceiptForPrint(null)}>
          <div style={{
            background: 'white', borderRadius: '20px', width: '100%', maxWidth: '480px',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', overflow: 'hidden'
          }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: '26px 24px', borderBottom: '2px dashed #cbd5e1' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                <div>
                  <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#059669', textTransform: 'uppercase' }}>
                    Fee Collection Counter Receipt
                  </div>
                  <h3 style={{ margin: '2px 0', fontSize: '1.2rem', fontWeight: 900, color: '#1e293b' }}>
                    {sessionStorage.getItem('schoolName') || 'Neel Public School'}
                  </h3>
                  <div style={{ fontSize: '0.74rem', color: '#64748b' }}>
                    Accounts Window • Pragati SHMS Counter
                  </div>
                </div>
                <div style={{
                  padding: '4px 10px', background: '#dcfce7', color: '#15803d',
                  borderRadius: '6px', fontSize: '0.75rem', fontWeight: 900
                }}>
                  PAID
                </div>
              </div>

              <div style={{
                background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px',
                padding: '12px 14px', marginBottom: '16px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '4px' }}>
                  <span style={{ color: '#64748b' }}>Receipt Number:</span>
                  <strong style={{ color: '#059669' }}>{selectedReceiptForPrint.receiptNo}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '4px' }}>
                  <span style={{ color: '#64748b' }}>Date & Time:</span>
                  <span>{new Date(selectedReceiptForPrint.date).toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                  <span style={{ color: '#64748b' }}>Payment Mode:</span>
                  <strong>{selectedReceiptForPrint.paymentMethod}</strong>
                </div>
              </div>

              <div style={{ fontSize: '0.85rem', marginBottom: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f1f5f9' }}>
                  <span style={{ color: '#64748b' }}>Student Name:</span>
                  <strong>{selectedReceiptForPrint.studentName}</strong>
                </div>
                {selectedReceiptForPrint.rollNo && selectedReceiptForPrint.rollNo !== 'N/A' && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f1f5f9' }}>
                    <span style={{ color: '#64748b' }}>Roll Number:</span>
                    <span>{selectedReceiptForPrint.rollNo}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f1f5f9' }}>
                  <span style={{ color: '#64748b' }}>Fee Category:</span>
                  <span>{selectedReceiptForPrint.category}</span>
                </div>
              </div>

              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '14px', background: '#ecfdf5', borderRadius: '12px',
                border: '1px solid #a7f3d0'
              }}>
                <span style={{ fontSize: '0.92rem', fontWeight: 800, color: '#065f46' }}>Total Amount Paid:</span>
                <span style={{ fontSize: '1.45rem', fontWeight: 900, color: '#059669' }}>
                  ₹{(selectedReceiptForPrint.amount || 0).toLocaleString()}
                </span>
              </div>

              <div style={{ marginTop: '16px', fontSize: '0.74rem', color: '#64748b', textAlign: 'right' }}>
                Authorized Counter Operator: <strong>Mr. Sonu Kumar (Support Staff)</strong>
              </div>
            </div>

            <div style={{ padding: '16px 24px', background: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                onClick={() => setSelectedReceiptForPrint(null)}
                style={{
                  background: 'none', border: 'none', color: '#64748b',
                  fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer'
                }}
              >
                Close
              </button>
              <button
                onClick={() => window.print()}
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  background: '#059669', color: 'white', border: 'none',
                  padding: '9px 20px', borderRadius: '10px', fontWeight: 800,
                  fontSize: '0.84rem', cursor: 'pointer'
                }}
              >
                <Printer size={15} /> Print Official Receipt
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* 5. PRINTABLE STUDENT GATE PASS TEMPLATE */}
      {selectedGatePassForPrint && createPortal(
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(8px)',
          zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px'
        }} onClick={() => setSelectedGatePassForPrint(null)}>
          <div style={{
            background: 'white', borderRadius: '20px', width: '100%', maxWidth: '440px',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', overflow: 'hidden'
          }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: '26px 24px', textAlign: 'center', borderBottom: '2px dashed #cbd5e1' }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#7c3aed', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                Pragati Campus Security
              </div>
              <h3 style={{ margin: '4px 0', fontSize: '1.25rem', fontWeight: 900, color: '#1e293b' }}>
                STUDENT GATE MOVEMENT PASS
              </h3>
              <div style={{ fontSize: '0.76rem', color: '#64748b' }}>
                {sessionStorage.getItem('schoolName') || 'Neel Public School (Main Campus)'}
              </div>

              <div style={{
                marginTop: '14px', background: '#f5f3ff', border: '1px solid #ddd6fe',
                borderRadius: '10px', padding: '10px 14px', fontSize: '0.85rem'
              }}>
                <div style={{ color: '#5b21b6', fontWeight: 800 }}>Pass #{selectedGatePassForPrint.passNumber}</div>
                <div style={{ color: '#7c3aed', fontSize: '0.78rem', fontWeight: 700 }}>Type: {selectedGatePassForPrint.passType}</div>
              </div>

              <div style={{ marginTop: '16px', textAlign: 'left', fontSize: '0.84rem', color: '#334155', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div><strong>Student Name:</strong> {selectedGatePassForPrint.studentName}</div>
                <div><strong>Roll & Class:</strong> {selectedGatePassForPrint.rollNo || 'N/A'} • {selectedGatePassForPrint.classSection}</div>
                <div><strong>Reason:</strong> {selectedGatePassForPrint.reason}</div>
                <div><strong>Escorted By:</strong> {selectedGatePassForPrint.escortedBy}</div>
                <div><strong>Departure Time:</strong> {new Date(selectedGatePassForPrint.outTime).toLocaleTimeString()}</div>
                <div><strong>Parent Permission:</strong> <span style={{ color: '#15803d', fontWeight: 700 }}>✓ Verified by Front Desk</span></div>
              </div>

              <div style={{ marginTop: '16px', letterSpacing: '4px', fontFamily: 'monospace', fontWeight: 700, color: '#475569', fontSize: '0.9rem' }}>
                |||| || | ||||| || |||||| | ||||
              </div>
            </div>

            <div style={{ padding: '16px 24px', background: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                onClick={() => setSelectedGatePassForPrint(null)}
                style={{
                  background: 'none', border: 'none', color: '#64748b',
                  fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer'
                }}
              >
                Close
              </button>
              <button
                onClick={() => window.print()}
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  background: '#7c3aed', color: 'white', border: 'none',
                  padding: '9px 18px', borderRadius: '10px', fontWeight: 800,
                  fontSize: '0.82rem', cursor: 'pointer'
                }}
              >
                <Printer size={15} /> Print Gate Pass
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* 6. REGISTER INQUIRY MODAL */}
      {isInquiryModalOpen && createPortal(
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(8px)',
          zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px'
        }} onClick={() => setIsInquiryModalOpen(false)}>
          <div style={{
            background: 'white', borderRadius: '20px', width: '100%', maxWidth: '520px',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', overflow: 'hidden'
          }} onClick={e => e.stopPropagation()}>
            <div style={{
              padding: '20px 24px', background: 'linear-gradient(135deg, #d97706 0%, #f59e0b 100%)',
              color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>Walk-In Admission Inquiry</h3>
                <p style={{ margin: '2px 0 0 0', fontSize: '0.78rem', opacity: 0.9 }}>Register prospective student & parent consultation</p>
              </div>
              <button onClick={() => setIsInquiryModalOpen(false)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleRegisterInquiry} style={{ padding: '24px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    Parent / Guardian Name *
                  </label>
                  <input
                    type="text" required
                    placeholder="e.g. Sunita Devi"
                    value={inquiryForm.parentName}
                    onChange={(e) => setInquiryForm({ ...inquiryForm, parentName: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    Student Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Ankit"
                    value={inquiryForm.studentName}
                    onChange={(e) => setInquiryForm({ ...inquiryForm, studentName: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    Phone Number *
                  </label>
                  <input
                    type="tel" required
                    placeholder="+91 98765 00000"
                    value={inquiryForm.phone}
                    onChange={(e) => setInquiryForm({ ...inquiryForm, phone: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    Grade Seeking *
                  </label>
                  <select
                    value={inquiryForm.gradeSeeking}
                    onChange={(e) => setInquiryForm({ ...inquiryForm, gradeSeeking: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  >
                    <option value="Nursery">Nursery</option>
                    <option value="Kindergarten">Kindergarten</option>
                    <option value="Class 1">Class 1</option>
                    <option value="Class 2">Class 2</option>
                    <option value="Class 3">Class 3</option>
                    <option value="Class 4">Class 4</option>
                    <option value="Class 5">Class 5</option>
                    <option value="Class 6">Class 6</option>
                    <option value="Class 7">Class 7</option>
                    <option value="Class 8">Class 8</option>
                    <option value="Class 9">Class 9</option>
                    <option value="Class 10">Class 10</option>
                    <option value="Class 11 - Science">Class 11 - Science</option>
                    <option value="Class 11 - Commerce">Class 11 - Commerce</option>
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                  Counselor Notes / Remarks
                </label>
                <textarea
                  rows={2}
                  placeholder="Inquiry notes, previous school, queries..."
                  value={inquiryForm.notes}
                  onChange={(e) => setInquiryForm({ ...inquiryForm, notes: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setIsInquiryModalOpen(false)}
                  style={{
                    padding: '9px 16px', borderRadius: '8px', border: '1px solid #cbd5e1',
                    background: 'white', color: '#475569', fontWeight: 700, cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '9px 20px', borderRadius: '8px', border: 'none',
                    background: '#d97706', color: 'white', fontWeight: 800, cursor: 'pointer'
                  }}
                >
                  Register Inquiry
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* 7. ISSUE STUDENT GATE PASS MODAL */}
      {isGatePassModalOpen && createPortal(
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(8px)',
          zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px'
        }} onClick={() => setIsGatePassModalOpen(false)}>
          <div style={{
            background: 'white', borderRadius: '20px', width: '100%', maxWidth: '520px',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', overflow: 'hidden'
          }} onClick={e => e.stopPropagation()}>
            <div style={{
              padding: '20px 24px', background: 'linear-gradient(135deg, #7c3aed 0%, #8b5cf6 100%)',
              color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>Issue Student Gate Pass</h3>
                <p style={{ margin: '2px 0 0 0', fontSize: '0.78rem', opacity: 0.9 }}>Authorized student movement & gate clearance</p>
              </div>
              <button onClick={() => setIsGatePassModalOpen(false)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleIssueGatePass} style={{ padding: '24px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    Student Name *
                  </label>
                  <input
                    type="text" required
                    placeholder="e.g. Aarav Sharma"
                    value={gatePassForm.studentName}
                    onChange={(e) => setGatePassForm({ ...gatePassForm, studentName: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    Class / Roll No *
                  </label>
                  <input
                    type="text" required
                    placeholder="e.g. 10-A (Roll: 14)"
                    value={gatePassForm.rollNo}
                    onChange={(e) => setGatePassForm({ ...gatePassForm, rollNo: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    Pass Type *
                  </label>
                  <select
                    value={gatePassForm.passType}
                    onChange={(e) => setGatePassForm({ ...gatePassForm, passType: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  >
                    <option value="Early Departure">Early Departure</option>
                    <option value="Medical Emergency">Medical Emergency</option>
                    <option value="Parent Pickup">Parent Pickup</option>
                    <option value="Official School Duty">Official School Duty</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    Reason for Leaving *
                  </label>
                  <input
                    type="text" required
                    placeholder="e.g. Doctor appointment, family function"
                    value={gatePassForm.reason}
                    onChange={(e) => setGatePassForm({ ...gatePassForm, reason: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    Escorted By (Parent / Guardian)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Mr. Sharma (Father)"
                    value={gatePassForm.escortedBy}
                    onChange={(e) => setGatePassForm({ ...gatePassForm, escortedBy: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    Parent Contact Number
                  </label>
                  <input
                    type="tel"
                    placeholder="+91 98765 00000"
                    value={gatePassForm.parentContact}
                    onChange={(e) => setGatePassForm({ ...gatePassForm, parentContact: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setIsGatePassModalOpen(false)}
                  style={{
                    padding: '9px 16px', borderRadius: '8px', border: '1px solid #cbd5e1',
                    background: 'white', color: '#475569', fontWeight: 700, cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '9px 20px', borderRadius: '8px', border: 'none',
                    background: '#7c3aed', color: 'white', fontWeight: 800, cursor: 'pointer'
                  }}
                >
                  Issue & Clear at Gate
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* 8. LOG COURIER / PARCEL MODAL */}
      {isParcelModalOpen && createPortal(
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(8px)',
          zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px'
        }} onClick={() => setIsParcelModalOpen(false)}>
          <div style={{
            background: 'white', borderRadius: '20px', width: '100%', maxWidth: '520px',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', overflow: 'hidden'
          }} onClick={e => e.stopPropagation()}>
            <div style={{
              padding: '20px 24px', background: 'linear-gradient(135deg, #0f766e 0%, #14b8a6 100%)',
              color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>Log Inbound Parcel / Courier</h3>
                <p style={{ margin: '2px 0 0 0', fontSize: '0.78rem', opacity: 0.9 }}>Register delivery package at front reception desk</p>
              </div>
              <button onClick={() => setIsParcelModalOpen(false)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleLogParcel} style={{ padding: '24px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    Recipient Staff / Department *
                  </label>
                  <input
                    type="text" required
                    placeholder="e.g. Principal Office / Dr. Sen"
                    value={parcelForm.recipient}
                    onChange={(e) => setParcelForm({ ...parcelForm, recipient: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    Courier Service Provider
                  </label>
                  <select
                    value={parcelForm.courierService}
                    onChange={(e) => setParcelForm({ ...parcelForm, courierService: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  >
                    <option value="India Post Speed Post">India Post Speed Post</option>
                    <option value="BlueDart">BlueDart</option>
                    <option value="DTDC">DTDC</option>
                    <option value="Amazon Logistics">Amazon Logistics</option>
                    <option value="Delhivery">Delhivery</option>
                    <option value="Hand Delivery">Hand Delivery</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    Sender Name / Organization
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. CBSE Board / Pearson Books"
                    value={parcelForm.sender}
                    onChange={(e) => setParcelForm({ ...parcelForm, sender: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    Tracking / Waybill No
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. IN-448192"
                    value={parcelForm.trackingNumber}
                    onChange={(e) => setParcelForm({ ...parcelForm, trackingNumber: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setIsParcelModalOpen(false)}
                  style={{
                    padding: '9px 16px', borderRadius: '8px', border: '1px solid #cbd5e1',
                    background: 'white', color: '#475569', fontWeight: 700, cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '9px 20px', borderRadius: '8px', border: 'none',
                    background: '#0f766e', color: 'white', fontWeight: 800, cursor: 'pointer'
                  }}
                >
                  Log Parcel at Reception
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* 8. ADMIT NEW STUDENT MODAL (Support Staff Authority) */}
      {isAdmitStudentModalOpen && createPortal(
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px'
        }} onClick={() => setIsAdmitStudentModalOpen(false)}>
          <div style={{
            background: 'white',
            borderRadius: '18px',
            maxWidth: '560px',
            width: '100%',
            overflow: 'hidden',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column'
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{
              background: 'linear-gradient(135deg, #15803d 0%, #16a34a 100%)',
              color: 'white',
              padding: '20px 24px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>
                  🎓 Admit New Student
                </h3>
                <p style={{ margin: '3px 0 0 0', fontSize: '0.8rem', opacity: 0.9 }}>
                  Enroll student directly into school central database (Support Staff Desk)
                </p>
              </div>
              <button 
                onClick={() => setIsAdmitStudentModalOpen(false)} 
                style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', padding: '4px' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAdmitStudentSubmit} style={{ padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                  Student Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Aarav Sharma"
                  value={admitStudentForm.name}
                  onChange={(e) => setAdmitStudentForm({ ...admitStudentForm, name: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    Assigned Class / Grade *
                  </label>
                  <select
                    value={admitStudentForm.grade}
                    onChange={(e) => setAdmitStudentForm({ ...admitStudentForm, grade: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', background: 'white', fontSize: '0.88rem' }}
                  >
                    {['Nursery', 'LKG', 'UKG', 'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5', 'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10', 'Class 11', 'Class 12'].map(g => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    Section *
                  </label>
                  <select
                    value={admitStudentForm.section}
                    onChange={(e) => setAdmitStudentForm({ ...admitStudentForm, section: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', background: 'white', fontSize: '0.88rem' }}
                  >
                    {['A', 'B', 'C', 'D', 'Science', 'Commerce', 'Arts'].map(sec => (
                      <option key={sec} value={sec}>Section {sec}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    Roll Number (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="Auto: STU-100x"
                    value={admitStudentForm.rollNo}
                    onChange={(e) => setAdmitStudentForm({ ...admitStudentForm, rollNo: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    Gender
                  </label>
                  <select
                    value={admitStudentForm.gender}
                    onChange={(e) => setAdmitStudentForm({ ...admitStudentForm, gender: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', background: 'white', fontSize: '0.88rem' }}
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    Parent / Guardian Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ramesh Sharma"
                    value={admitStudentForm.parentName}
                    onChange={(e) => setAdmitStudentForm({ ...admitStudentForm, parentName: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    Parent Contact / Phone *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="+91 98201 00000"
                    value={admitStudentForm.parentContact}
                    onChange={(e) => setAdmitStudentForm({ ...admitStudentForm, parentContact: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                  Parent Email (Optional)
                </label>
                <input
                  type="email"
                  placeholder="parent@example.com"
                  value={admitStudentForm.email}
                  onChange={(e) => setAdmitStudentForm({ ...admitStudentForm, email: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                  Residential Address
                </label>
                <textarea
                  rows={2}
                  placeholder="House / Street, City, Pincode"
                  value={admitStudentForm.address}
                  onChange={(e) => setAdmitStudentForm({ ...admitStudentForm, address: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem', resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={() => setIsAdmitStudentModalOpen(false)}
                  style={{
                    padding: '9px 16px', borderRadius: '8px', border: '1px solid #cbd5e1',
                    background: 'white', color: '#475569', fontWeight: 700, cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingAdmission}
                  style={{
                    padding: '9px 22px', borderRadius: '8px', border: 'none',
                    background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
                    color: 'white', fontWeight: 800, cursor: isSubmittingAdmission ? 'wait' : 'pointer',
                    boxShadow: '0 4px 12px rgba(22, 163, 74, 0.35)'
                  }}
                >
                  {isSubmittingAdmission ? 'Enrolling Student...' : 'Admit & Enroll Student'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* 9. PUNCH CLOCK INTERACTIVE MODAL */}
      {isPunchModalOpen && createPortal(
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px'
        }} onClick={() => setIsPunchModalOpen(false)}>
          <div style={{
            maxWidth: '520px',
            width: '100%',
            position: 'relative'
          }} onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setIsPunchModalOpen(false)}
              style={{
                position: 'absolute',
                top: '-12px',
                right: '-12px',
                background: '#1e293b',
                color: 'white',
                border: '2px solid white',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
                zIndex: 10
              }}
              title="Close Time Clock"
            >
              <X size={16} />
            </button>
            <StaffPunchClock onPunchSuccess={() => { fetchAllData(); setIsPunchModalOpen(false); }} />
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default SupportStaffDashboard;
