import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { 
  GraduationCap, Sparkles, X, Check, CheckCircle2, AlertCircle, 
  ArrowRight, RefreshCw, Users, BookOpen, Layers, ShieldCheck, 
  RotateCcw, History, FileText, ChevronDown, ChevronRight, Filter
} from 'lucide-react';

const API_BASE = 'http://localhost:5000/api';

const STANDARD_GRADE_ORDER = [
  'Nursery', 'LKG', 'UKG',
  'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5',
  'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10',
  'Class 11', 'Class 12'
];

const STANDARD_SECTIONS = ['A', 'B', 'C', 'D', 'Science', 'Commerce', 'Arts'];
const STANDARD_SESSIONS = ['2025-2026', '2026-2027', '2027-2028', '2028-2029', '2029-2030'];

const getNextGradeInfo = (currentGrade = '') => {
  const cg = String(currentGrade || '').trim();
  const idx = STANDARD_GRADE_ORDER.findIndex(g => g.toLowerCase() === cg.toLowerCase());
  if (idx !== -1) {
    if (idx === STANDARD_GRADE_ORDER.length - 1) {
      return { nextGrade: 'Graduated', isFinalYear: true };
    }
    return { nextGrade: STANDARD_GRADE_ORDER[idx + 1], isFinalYear: false };
  }
  const match = cg.match(/(?:Class|Grade)\s*(\d+)/i);
  if (match) {
    const num = parseInt(match[1], 10);
    if (num >= 12) return { nextGrade: 'Graduated', isFinalYear: true };
    return { nextGrade: `Class ${num + 1}`, isFinalYear: false };
  }
  return { nextGrade: cg, isFinalYear: false };
};

const StudentPromotionModal = ({
  isOpen,
  onClose,
  onSuccess,
  tenantSlug = '',
  token = '',
  initialGrade = '',
  initialSection = ''
}) => {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState('class_wise'); // 'class_wise' | 'school_rollover' | 'history'
  
  // Data states
  const [classesSummary, setClassesSummary] = useState([]);
  const [totalActiveStudents, setTotalActiveStudents] = useState(0);
  const [historyList, setHistoryList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Class-wise Promotion Form State
  const [sourceClass, setSourceClass] = useState('');
  const [sourceSection, setSourceSection] = useState('All');
  const [targetClass, setTargetClass] = useState('');
  const [targetSection, setTargetSection] = useState('A');
  const [fromSession, setFromSession] = useState('2026-2027');
  const [toSession, setToSession] = useState('2027-2028');
  const [candidates, setCandidates] = useState([]);
  const [studentActions, setStudentActions] = useState({}); // { [studentId]: 'Promoted' | 'Retained' | 'Graduated' | 'Transferred' }
  const [studentTargetSections, setStudentTargetSections] = useState({}); // { [studentId]: 'A' | 'B' | ... }
  const [remarks, setRemarks] = useState('');

  // Whole-School Rollover State
  const [schoolRolloverConfirm, setSchoolRolloverConfirm] = useState(false);
  const [schoolFromSession, setSchoolFromSession] = useState('2026-2027');
  const [schoolToSession, setSchoolToSession] = useState('2027-2028');
  const [expandedHistoryId, setExpandedHistoryId] = useState(null);

  const getAuthHeaders = () => {
    const headers = { 'Content-Type': 'application/json' };
    const authToken = token || sessionStorage.getItem('token') || '';
    if (authToken) headers['Authorization'] = `Bearer ${authToken}`;
    if (tenantSlug) headers['x-school-slug'] = tenantSlug;
    return headers;
  };

  // Fetch classes overview for promotion
  const fetchPromotionClasses = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const slugQuery = tenantSlug ? `?schoolSlug=${encodeURIComponent(tenantSlug)}` : '';
      const res = await fetch(`${API_BASE}/students/promotion-classes${slugQuery}`, {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        const classes = data.classes || [];
        setClassesSummary(classes);
        setTotalActiveStudents(data.totalActiveStudents || 0);

        // Pre-fill initial selection
        if (classes.length > 0) {
          const matched = initialGrade 
            ? classes.find(c => c.grade.toLowerCase() === initialGrade.toLowerCase() && (initialSection ? c.section.toLowerCase() === initialSection.toLowerCase() : true))
            : null;
          const chosen = matched || classes[0];
          setSourceClass(chosen.grade);
          setSourceSection(chosen.section || 'All');
          setTargetClass(chosen.suggestedNextGrade);
          setTargetSection(chosen.section || 'A');
          setFromSession(chosen.currentSession || '2026-2027');
        }
      } else {
        setErrorMsg('Failed to load classes for promotion.');
      }
    } catch (err) {
      console.error('Error fetching promotion classes:', err);
      setErrorMsg('Network error retrieving classes.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch candidates for selected source class
  const fetchCandidates = async (grade, section) => {
    if (!grade) return;
    setLoading(true);
    setErrorMsg('');
    try {
      const secParam = section && section !== 'All' ? `&section=${encodeURIComponent(section)}` : '';
      const slugParam = tenantSlug ? `&schoolSlug=${encodeURIComponent(tenantSlug)}` : '';
      const res = await fetch(`${API_BASE}/students/promotion-candidates?grade=${encodeURIComponent(grade)}${secParam}${slugParam}`, {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        const studentList = data.candidates || [];
        setCandidates(studentList);
        
        // Default action: 'Promoted' (or 'Graduated' if final year)
        const initialActions = {};
        const initialSecs = {};
        const defaultAction = data.isFinalYear || data.suggestedNextGrade === 'Graduated' ? 'Graduated' : 'Promoted';

        studentList.forEach(st => {
          initialActions[st._id] = defaultAction;
          initialSecs[st._id] = targetSection || st.section || 'A';
        });

        setStudentActions(initialActions);
        setStudentTargetSections(initialSecs);

        if (!targetClass) {
          setTargetClass(data.suggestedNextGrade);
        }
      } else {
        setErrorMsg('Failed to retrieve students for selected class.');
      }
    } catch (err) {
      console.error('Error fetching candidates:', err);
      setErrorMsg('Connection error loading students.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch past promotion audit history
  const fetchPromotionHistory = async () => {
    setLoading(true);
    try {
      const slugQuery = tenantSlug ? `?schoolSlug=${encodeURIComponent(tenantSlug)}` : '';
      const res = await fetch(`${API_BASE}/students/promotion-history${slugQuery}`, {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        setHistoryList(data.history || []);
      }
    } catch (err) {
      console.error('Error fetching promotion history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPromotionClasses();
  }, []);

  useEffect(() => {
    if (sourceClass) {
      const next = getNextGradeInfo(sourceClass);
      setTargetClass(next.nextGrade);
      fetchCandidates(sourceClass, sourceSection);
    }
  }, [sourceClass, sourceSection]);

  useEffect(() => {
    if (activeTab === 'history') {
      fetchPromotionHistory();
    }
  }, [activeTab]);

  // Bulk action helpers for candidates
  const handleBulkSetAction = (action) => {
    const updated = {};
    candidates.forEach(st => {
      updated[st._id] = action;
    });
    setStudentActions(updated);
  };

  const handleSetStudentAction = (studentId, action) => {
    setStudentActions(prev => ({
      ...prev,
      [studentId]: action
    }));
  };

  const handleSetStudentSection = (studentId, sec) => {
    setStudentTargetSections(prev => ({
      ...prev,
      [studentId]: sec
    }));
  };

  // Counts summary of staged actions
  const stagedCounts = useMemo(() => {
    let promoted = 0;
    let retained = 0;
    let graduated = 0;
    let transferred = 0;
    Object.values(studentActions).forEach(act => {
      if (act === 'Promoted') promoted++;
      else if (act === 'Retained') retained++;
      else if (act === 'Graduated') graduated++;
      else if (act === 'Transferred') transferred++;
    });
    return { promoted, retained, graduated, transferred, total: candidates.length };
  }, [studentActions, candidates]);

  // Execute Class-Wise Promotion
  const handleExecuteBatchPromotion = async () => {
    if (candidates.length === 0) return;
    setSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const payloadStudents = candidates.map(st => ({
        studentId: st._id,
        action: studentActions[st._id] || 'Promoted',
        targetGrade: targetClass,
        targetSec: studentTargetSections[st._id] || targetSection || st.section || 'A',
        studentRemarks: remarks
      }));

      const res = await fetch(`${API_BASE}/students/promote-batch`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          sourceClass,
          sourceSection,
          targetClass,
          targetSection,
          fromSession,
          toSession,
          students: payloadStudents,
          remarks
        })
      });

      if (res.ok) {
        const data = await res.json();
        setSuccessMsg(data.message || 'Promotion successfully recorded!');
        if (onSuccess) onSuccess();
        // Refresh classes
        fetchPromotionClasses();
        // Clear candidates list to show completion
        setCandidates([]);
      } else {
        const err = await res.json().catch(() => ({}));
        setErrorMsg(err.message || 'Failed to process batch promotion.');
      }
    } catch (err) {
      console.error('Error executing batch promotion:', err);
      setErrorMsg('Network error executing promotion.');
    } finally {
      setSubmitting(false);
    }
  };

  // Execute Whole-School Rollover
  const handleExecuteSchoolRollover = async () => {
    if (!schoolRolloverConfirm) return;
    setSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await fetch(`${API_BASE}/students/promote-school-rollover`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          fromSession: schoolFromSession,
          toSession: schoolToSession,
          remarks: `Annual Whole-School Rollover from ${schoolFromSession} to ${schoolToSession}`
        })
      });

      if (res.ok) {
        const data = await res.json();
        setSuccessMsg(data.message || 'Whole-school annual rollover executed successfully!');
        if (onSuccess) onSuccess();
        fetchPromotionClasses();
      } else {
        const err = await res.json().catch(() => ({}));
        setErrorMsg(err.message || 'Failed to process annual school rollover.');
      }
    } catch (err) {
      console.error('Error executing school rollover:', err);
      setErrorMsg('Network error executing school rollover.');
    } finally {
      setSubmitting(false);
    }
  };

  return createPortal(
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 10000, padding: '20px'
    }}>
      <div
        id="student-promotion-modal"
        style={{
          background: 'white',
          borderRadius: '24px',
          width: '100%',
          maxWidth: '920px',
          height: '92vh',
          maxHeight: '900px',
          boxShadow: '0 25px 60px -15px rgba(15, 23, 42, 0.4), 0 0 0 1px rgba(226, 232, 240, 0.8)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <style>{`
          #student-promotion-modal *::-webkit-scrollbar {
            width: 6px;
            height: 6px;
          }
          #student-promotion-modal *::-webkit-scrollbar-track {
            background: #f1f5f9;
            border-radius: 4px;
          }
          #student-promotion-modal *::-webkit-scrollbar-thumb {
            background: #cbd5e1;
            border-radius: 4px;
          }
          #student-promotion-modal *::-webkit-scrollbar-thumb:hover {
            background: #94a3b8;
          }
        `}</style>

        {/* Modal Header */}
        <div style={{
          padding: '20px 28px',
          borderBottom: '1px solid #e2e8f0',
          background: 'linear-gradient(to right, #f8fafc, #ffffff)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexShrink: 0
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: '46px',
              height: '46px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, #059669, #0d9488)',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 6px 16px rgba(5, 150, 105, 0.3)'
            }}>
              <GraduationCap size={22} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{
                  fontSize: '0.68rem',
                  fontWeight: 800,
                  color: '#059669',
                  background: '#dcfce7',
                  padding: '2px 8px',
                  borderRadius: '6px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em'
                }}>
                  Academic Rollover Engine
                </span>
                <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>
                  End-of-Session Student Progression
                </span>
              </div>
              <h3 style={{ margin: '4px 0 0 0', fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
                Student Promotion & Session Progression
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: '#f8fafc',
              border: '1px solid #cbd5e1',
              borderRadius: '10px',
              padding: '8px',
              cursor: 'pointer',
              color: '#64748b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            onMouseOver={e => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.color = '#0f172a'; }}
            onMouseOut={e => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.color = '#64748b'; }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Navigation Tabs */}
        <div style={{
          display: 'flex',
          gap: '10px',
          padding: '12px 28px',
          background: '#f8fafc',
          borderBottom: '1px solid #e2e8f0',
          flexShrink: 0
        }}>
          {[
            { id: 'class_wise', label: 'Class-Wise Promotion', icon: GraduationCap },
            { id: 'school_rollover', label: 'Whole-School Annual Rollover', icon: Sparkles },
            { id: 'history', label: 'Promotion Audit Logs', icon: History }
          ].map(tab => {
            const Icon = tab.icon;
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setActiveTab(tab.id);
                  setErrorMsg('');
                  setSuccessMsg('');
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 16px',
                  borderRadius: '10px',
                  border: isSelected ? '1px solid #059669' : '1px solid #e2e8f0',
                  background: isSelected ? '#059669' : 'white',
                  color: isSelected ? 'white' : '#475569',
                  fontWeight: 700,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  boxShadow: isSelected ? '0 2px 8px rgba(5, 150, 105, 0.25)' : 'none',
                  transition: 'all 0.15s'
                }}
              >
                <Icon size={15} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Modal Scrollable Body */}
        <div style={{
          padding: '20px 28px',
          overflowY: 'auto',
          flex: 1,
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: '18px'
        }}>
          
          {/* Notification Alerts */}
          {errorMsg && (
            <div style={{
              background: '#fef2f2',
              color: '#991b1b',
              border: '1px solid #fecaca',
              borderRadius: '12px',
              padding: '12px 18px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              fontSize: '0.86rem',
              fontWeight: 600
            }}>
              <AlertCircle size={18} />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div style={{
              background: '#ecfdf5',
              color: '#065f46',
              border: '1px solid #a7f3d0',
              borderRadius: '12px',
              padding: '12px 18px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              fontSize: '0.86rem',
              fontWeight: 700
            }}>
              <CheckCircle2 size={18} color="#059669" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* TAB 1: CLASS-WISE PROMOTION */}
          {activeTab === 'class_wise' && (
            <>
              {/* Form Card: Source & Target Class Selection */}
              <div style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '16px',
                padding: '18px',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '14px',
                alignItems: 'flex-end',
                flexShrink: 0
              }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', marginBottom: '6px' }}>
                    1. Current Class (Source)
                  </label>
                  <select
                    value={sourceClass}
                    onChange={(e) => {
                      setSourceClass(e.target.value);
                      const matched = classesSummary.find(c => c.grade === e.target.value);
                      if (matched) {
                        setSourceSection(matched.section || 'All');
                        setTargetClass(matched.suggestedNextGrade);
                        setTargetSection(matched.section || 'A');
                      }
                    }}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      border: '1.5px solid #cbd5e1',
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      color: '#0f172a',
                      background: 'white'
                    }}
                  >
                    {STANDARD_GRADE_ORDER.map(g => (
                      <option key={g} value={g}>🏫 {g}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', marginBottom: '6px' }}>
                    Section
                  </label>
                  <select
                    value={sourceSection}
                    onChange={(e) => setSourceSection(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      border: '1.5px solid #cbd5e1',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      background: 'white'
                    }}
                  >
                    <option value="All">All Sections</option>
                    {STANDARD_SECTIONS.map(s => (
                      <option key={s} value={s}>Section {s}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 800, color: '#059669', textTransform: 'uppercase', marginBottom: '6px' }}>
                    2. Target Next Class (Progression)
                  </label>
                  <select
                    value={targetClass}
                    onChange={(e) => setTargetClass(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      border: '1.5px solid #059669',
                      fontSize: '0.85rem',
                      fontWeight: 800,
                      color: '#065f46',
                      background: '#f0fdf4'
                    }}
                  >
                    {STANDARD_GRADE_ORDER.map(g => (
                      <option key={g} value={g}>Promote to {g}</option>
                    ))}
                    <option value="Graduated">🎓 Mark as Graduated (Alumni)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', marginBottom: '6px' }}>
                    Target Section
                  </label>
                  <select
                    value={targetSection}
                    onChange={(e) => {
                      setTargetSection(e.target.value);
                      const updatedSecs = {};
                      candidates.forEach(st => {
                        updatedSecs[st._id] = e.target.value;
                      });
                      setStudentTargetSections(updatedSecs);
                    }}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      border: '1.5px solid #cbd5e1',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      background: 'white'
                    }}
                  >
                    {STANDARD_SECTIONS.map(s => (
                      <option key={s} value={s}>Section {s}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', marginBottom: '6px' }}>
                    Session Transition
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <select
                      value={fromSession}
                      onChange={(e) => setFromSession(e.target.value)}
                      style={{ padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.78rem', background: 'white' }}
                    >
                      {STANDARD_SESSIONS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <ArrowRight size={14} color="#64748b" />
                    <select
                      value={toSession}
                      onChange={(e) => setToSession(e.target.value)}
                      style={{ padding: '8px 10px', borderRadius: '8px', border: '1.5px solid #059669', fontSize: '0.78rem', background: '#ecfdf5', fontWeight: 700 }}
                    >
                      {STANDARD_SESSIONS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              {/* Candidate Roster & Action Grid */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '10px',
                  background: '#f1f5f9',
                  borderRadius: '12px',
                  padding: '10px 16px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#1e293b' }}>
                      Roster: {candidates.length} Students in {sourceClass} {sourceSection !== 'All' ? `(${sourceSection})` : ''}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>•</span>
                    <span style={{ fontSize: '0.78rem', color: '#16a34a', fontWeight: 700 }}>
                      {stagedCounts.promoted} to Promote
                    </span>
                    {stagedCounts.retained > 0 && (
                      <span style={{ fontSize: '0.78rem', color: '#d97706', fontWeight: 700 }}>
                        • {stagedCounts.retained} to Retain
                      </span>
                    )}
                    {stagedCounts.graduated > 0 && (
                      <span style={{ fontSize: '0.78rem', color: '#7c3aed', fontWeight: 700 }}>
                        • {stagedCounts.graduated} to Graduate
                      </span>
                    )}
                    {stagedCounts.transferred > 0 && (
                      <span style={{ fontSize: '0.78rem', color: '#dc2626', fontWeight: 700 }}>
                        • {stagedCounts.transferred} TC
                      </span>
                    )}
                  </div>

                  {/* Bulk Selectors */}
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={() => handleBulkSetAction('Promoted')}
                      style={{
                        padding: '5px 12px', borderRadius: '6px', border: '1px solid #86efac',
                        background: '#dcfce7', color: '#15803d', fontWeight: 700, fontSize: '0.74rem', cursor: 'pointer'
                      }}
                    >
                      ✓ Promote All
                    </button>
                    <button
                      type="button"
                      onClick={() => handleBulkSetAction('Retained')}
                      style={{
                        padding: '5px 12px', borderRadius: '6px', border: '1px solid #fde68a',
                        background: '#fef3c7', color: '#b45309', fontWeight: 700, fontSize: '0.74rem', cursor: 'pointer'
                      }}
                    >
                      Retain All
                    </button>
                  </div>
                </div>

                {/* Candidate Table */}
                <div style={{
                  border: '1px solid #e2e8f0',
                  borderRadius: '14px',
                  overflowX: 'auto',
                  overflowY: 'auto',
                  maxHeight: '340px',
                  background: 'white'
                }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.78rem' }}>
                    <thead style={{ position: 'sticky', top: 0, zIndex: 5, background: '#f8fafc' }}>
                      <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: 800, textTransform: 'uppercase' }}>
                        <th style={{ padding: '10px 14px', background: '#f8fafc' }}>Student</th>
                        <th style={{ padding: '10px 14px', background: '#f8fafc' }}>Current Roll & Class</th>
                        <th style={{ padding: '10px 14px', background: '#f8fafc' }}>Attendance</th>
                        <th style={{ padding: '10px 14px', background: '#f8fafc' }}>Progression Action</th>
                        <th style={{ padding: '10px 14px', background: '#f8fafc' }}>Target Section</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <tr>
                          <td colSpan={5} style={{ padding: '36px', textAlign: 'center', color: '#64748b' }}>
                            <RefreshCw size={20} className="spin" style={{ margin: '0 auto 8px', color: '#059669' }} />
                            <div>Loading students for {sourceClass}...</div>
                          </td>
                        </tr>
                      ) : candidates.length === 0 ? (
                        <tr>
                          <td colSpan={5} style={{ padding: '36px', textAlign: 'center', color: '#94a3b8' }}>
                            No active students found in {sourceClass} {sourceSection !== 'All' ? `Section ${sourceSection}` : ''}.
                          </td>
                        </tr>
                      ) : (
                        candidates.map((st, idx) => {
                          const action = studentActions[st._id] || 'Promoted';
                          const targetSec = studentTargetSections[st._id] || targetSection || st.section || 'A';
                          const isEven = idx % 2 === 0;

                          return (
                            <tr
                              key={st._id}
                              style={{
                                borderBottom: '1px solid #f1f5f9',
                                background: isEven ? '#ffffff' : '#fcfcfd'
                              }}
                            >
                              <td style={{ padding: '10px 14px' }}>
                                <div style={{ fontWeight: 800, color: '#1e293b' }}>{st.name}</div>
                                <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Parent: {st.parentName || '—'}</div>
                              </td>

                              <td style={{ padding: '10px 14px' }}>
                                <div style={{ fontWeight: 700, color: '#334155' }}>{st.rollNo}</div>
                                <div style={{ fontSize: '0.7rem', color: '#64748b' }}>{st.grade} - {st.section}</div>
                              </td>

                              <td style={{ padding: '10px 14px' }}>
                                <span style={{
                                  padding: '2px 8px',
                                  borderRadius: '6px',
                                  fontSize: '0.72rem',
                                  fontWeight: 700,
                                  background: (st.attendance || 100) >= 85 ? '#dcfce7' : (st.attendance || 100) >= 75 ? '#fef3c7' : '#fee2e2',
                                  color: (st.attendance || 100) >= 85 ? '#15803d' : (st.attendance || 100) >= 75 ? '#b45309' : '#dc2626'
                                }}>
                                  {st.attendance || 100}%
                                </span>
                              </td>

                              {/* Action Switcher Pills */}
                              <td style={{ padding: '10px 14px' }}>
                                <div style={{ display: 'inline-flex', gap: '4px', background: '#f1f5f9', padding: '3px', borderRadius: '8px' }}>
                                  <button
                                    type="button"
                                    onClick={() => handleSetStudentAction(st._id, 'Promoted')}
                                    style={{
                                      border: 'none',
                                      padding: '3px 8px',
                                      borderRadius: '6px',
                                      fontSize: '0.72rem',
                                      fontWeight: 700,
                                      cursor: 'pointer',
                                      background: action === 'Promoted' ? '#16a34a' : 'transparent',
                                      color: action === 'Promoted' ? 'white' : '#475569'
                                    }}
                                  >
                                    Promote
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleSetStudentAction(st._id, 'Retained')}
                                    style={{
                                      border: 'none',
                                      padding: '3px 8px',
                                      borderRadius: '6px',
                                      fontSize: '0.72rem',
                                      fontWeight: 700,
                                      cursor: 'pointer',
                                      background: action === 'Retained' ? '#d97706' : 'transparent',
                                      color: action === 'Retained' ? 'white' : '#475569'
                                    }}
                                    title="Keep student in the same class for the new session"
                                  >
                                    Retain
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleSetStudentAction(st._id, 'Graduated')}
                                    style={{
                                      border: 'none',
                                      padding: '3px 8px',
                                      borderRadius: '6px',
                                      fontSize: '0.72rem',
                                      fontWeight: 700,
                                      cursor: 'pointer',
                                      background: action === 'Graduated' ? '#7c3aed' : 'transparent',
                                      color: action === 'Graduated' ? 'white' : '#475569'
                                    }}
                                  >
                                    Graduate
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleSetStudentAction(st._id, 'Transferred')}
                                    style={{
                                      border: 'none',
                                      padding: '3px 8px',
                                      borderRadius: '6px',
                                      fontSize: '0.72rem',
                                      fontWeight: 700,
                                      cursor: 'pointer',
                                      background: action === 'Transferred' ? '#dc2626' : 'transparent',
                                      color: action === 'Transferred' ? 'white' : '#475569'
                                    }}
                                    title="Student leaving with Transfer Certificate"
                                  >
                                    TC
                                  </button>
                                </div>
                              </td>

                              <td style={{ padding: '10px 14px' }}>
                                {action === 'Promoted' || action === 'Retained' ? (
                                  <select
                                    value={targetSec}
                                    onChange={(e) => handleSetStudentSection(st._id, e.target.value)}
                                    style={{
                                      padding: '4px 8px',
                                      borderRadius: '6px',
                                      border: '1px solid #cbd5e1',
                                      fontSize: '0.76rem',
                                      background: 'white'
                                    }}
                                  >
                                    {STANDARD_SECTIONS.map(s => <option key={s} value={s}>Sec {s}</option>)}
                                  </select>
                                ) : (
                                  <span style={{ color: '#94a3b8', fontSize: '0.72rem' }}>N/A</span>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Optional Promotion Note */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <input
                    type="text"
                    placeholder="Optional administrative remarks or notification for this batch promotion..."
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    style={{
                      flex: 1,
                      padding: '9px 14px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.82rem'
                    }}
                  />
                </div>
              </div>
            </>
          )}

          {/* TAB 2: WHOLE-SCHOOL ANNUAL ROLLOVER */}
          {activeTab === 'school_rollover' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div style={{
                background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)',
                border: '1.5px solid #a7f3d0',
                borderRadius: '16px',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Sparkles size={22} color="#059669" />
                  <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#065f46' }}>
                    Annual School Session Progression
                  </h4>
                </div>
                <p style={{ margin: 0, fontSize: '0.84rem', color: '#047857', lineHeight: 1.6 }}>
                  This automatic rollover feature advances <strong>every active class in the school</strong> to the next standard grade for the upcoming session:
                </p>

                {/* Grade Progression Ladder Flow */}
                <div style={{
                  background: 'white',
                  borderRadius: '12px',
                  padding: '12px 16px',
                  border: '1px solid #a7f3d0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  flexWrap: 'wrap',
                  fontSize: '0.74rem',
                  fontWeight: 700,
                  color: '#0f172a'
                }}>
                  <span>Nursery</span> <ArrowRight size={12} color="#059669" />
                  <span>LKG</span> <ArrowRight size={12} color="#059669" />
                  <span>UKG</span> <ArrowRight size={12} color="#059669" />
                  <span>Class 1</span> <ArrowRight size={12} color="#059669" />
                  <span>...</span> <ArrowRight size={12} color="#059669" />
                  <span>Class 10</span> <ArrowRight size={12} color="#059669" />
                  <span>Class 11</span> <ArrowRight size={12} color="#059669" />
                  <span>Class 12</span> <ArrowRight size={12} color="#059669" />
                  <span style={{ color: '#7c3aed', background: '#f5f3ff', padding: '2px 8px', borderRadius: '4px' }}>🎓 Graduated (Alumni)</span>
                </div>

                {/* Session Pickers */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap', marginTop: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#065f46' }}>Current Session:</span>
                    <select
                      value={schoolFromSession}
                      onChange={(e) => setSchoolFromSession(e.target.value)}
                      style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.82rem', background: 'white' }}
                    >
                      {STANDARD_SESSIONS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>

                  <ArrowRight size={16} color="#059669" />

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#065f46' }}>Next Active Session:</span>
                    <select
                      value={schoolToSession}
                      onChange={(e) => setSchoolToSession(e.target.value)}
                      style={{ padding: '6px 12px', borderRadius: '8px', border: '1.5px solid #059669', fontSize: '0.82rem', background: '#ffffff', fontWeight: 800, color: '#065f46' }}
                    >
                      {STANDARD_SESSIONS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              {/* Breakdown by Current Classes */}
              <div>
                <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#1e293b', marginBottom: '10px' }}>
                  Class Breakdown ({classesSummary.length} Active Classes • {totalActiveStudents} Total Students)
                </div>

                <div style={{
                  border: '1px solid #e2e8f0',
                  borderRadius: '14px',
                  overflow: 'hidden',
                  background: 'white'
                }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.78rem' }}>
                    <thead style={{ background: '#f8fafc' }}>
                      <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: 800, textTransform: 'uppercase' }}>
                        <th style={{ padding: '10px 16px' }}>Current Class</th>
                        <th style={{ padding: '10px 16px' }}>Enrolled Active</th>
                        <th style={{ padding: '10px 16px' }}>Progression Destination</th>
                        <th style={{ padding: '10px 16px' }}>Status in New Session</th>
                      </tr>
                    </thead>
                    <tbody>
                      {classesSummary.map((cls, idx) => {
                        const isEven = idx % 2 === 0;
                        return (
                          <tr key={cls.classLabel} style={{ borderBottom: '1px solid #f1f5f9', background: isEven ? '#fff' : '#fcfcfd' }}>
                            <td style={{ padding: '10px 16px', fontWeight: 700, color: '#1e293b' }}>
                              🏫 {cls.grade} - Section {cls.section}
                            </td>
                            <td style={{ padding: '10px 16px', fontWeight: 800, color: '#0284c7' }}>
                              {cls.studentCount} Students
                            </td>
                            <td style={{ padding: '10px 16px', fontWeight: 700, color: cls.isFinalYear ? '#7c3aed' : '#059669' }}>
                              {cls.isFinalYear ? '🎓 Graduated (Alumni)' : `➔ ${cls.suggestedNextGrade} - Section ${cls.section}`}
                            </td>
                            <td style={{ padding: '10px 16px' }}>
                              <span style={{
                                padding: '2px 8px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 800,
                                background: cls.isFinalYear ? '#f5f3ff' : '#dcfce7',
                                color: cls.isFinalYear ? '#7c3aed' : '#15803d'
                              }}>
                                {cls.isFinalYear ? 'Graduated' : 'Active Student'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Safety Confirmation Checkbox */}
              <div style={{
                background: '#fffbeb',
                border: '1.5px solid #fde68a',
                borderRadius: '12px',
                padding: '14px 18px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <input
                  type="checkbox"
                  id="confirm-rollover-box"
                  checked={schoolRolloverConfirm}
                  onChange={(e) => setSchoolRolloverConfirm(e.target.checked)}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
                <label htmlFor="confirm-rollover-box" style={{ fontSize: '0.82rem', color: '#92400e', fontWeight: 700, cursor: 'pointer' }}>
                  I confirm that annual examinations & assessments for session {schoolFromSession} have completed, and all eligible students should be promoted to session {schoolToSession}.
                </label>
              </div>
            </div>
          )}

          {/* TAB 3: PROMOTION AUDIT LOGS */}
          {activeTab === 'history' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#1e293b' }}>
                Institutional Promotion & Rollover Audit Records ({historyList.length})
              </div>

              {historyList.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8', background: '#f8fafc', borderRadius: '14px' }}>
                  <History size={32} style={{ margin: '0 auto 8px', color: '#cbd5e1' }} />
                  <div>No session promotions recorded yet. Executing a promotion will generate permanent audit logs here.</div>
                </div>
              ) : (
                historyList.map(log => {
                  const isExpanded = expandedHistoryId === log._id;
                  const dateStr = new Date(log.createdAt).toLocaleString('en-US', {
                    month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
                  });

                  return (
                    <div
                      key={log._id}
                      style={{
                        background: 'white',
                        border: '1px solid #e2e8f0',
                        borderRadius: '14px',
                        overflow: 'hidden'
                      }}
                    >
                      <div
                        onClick={() => setExpandedHistoryId(isExpanded ? null : log._id)}
                        style={{
                          padding: '14px 18px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          cursor: 'pointer',
                          background: isExpanded ? '#f8fafc' : 'white'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{
                            width: '36px', height: '36px', borderRadius: '10px',
                            background: log.mode === 'school_rollover' ? '#ecfdf5' : '#eff6ff',
                            color: log.mode === 'school_rollover' ? '#059669' : '#2563eb',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                          }}>
                            {log.mode === 'school_rollover' ? <Sparkles size={18} /> : <GraduationCap size={18} />}
                          </div>
                          <div>
                            <div style={{ fontWeight: 800, color: '#1e293b', fontSize: '0.88rem' }}>
                              {log.mode === 'school_rollover' ? 'Whole-School Rollover' : `Class Promotion: ${log.sourceClass} ➔ ${log.targetClass}`}
                            </div>
                            <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                              Session: <strong>{log.fromSession} ➔ {log.toSession}</strong> • Executed by: <strong>{log.executedBy}</strong> ({log.executedByRole || 'Admin'}) • {dateStr}
                            </div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <span style={{ fontSize: '0.72rem', fontWeight: 800, background: '#dcfce7', color: '#15803d', padding: '2px 8px', borderRadius: '6px' }}>
                              {log.promotedCount} Promoted
                            </span>
                            {log.retainedCount > 0 && (
                              <span style={{ fontSize: '0.72rem', fontWeight: 800, background: '#fef3c7', color: '#b45309', padding: '2px 8px', borderRadius: '6px' }}>
                                {log.retainedCount} Retained
                              </span>
                            )}
                            {log.graduatedCount > 0 && (
                              <span style={{ fontSize: '0.72rem', fontWeight: 800, background: '#f5f3ff', color: '#7c3aed', padding: '2px 8px', borderRadius: '6px' }}>
                                {log.graduatedCount} Graduated
                              </span>
                            )}
                          </div>
                          {isExpanded ? <ChevronDown size={18} color="#64748b" /> : <ChevronRight size={18} color="#64748b" />}
                        </div>
                      </div>

                      {/* Expanded Details */}
                      {isExpanded && Array.isArray(log.details) && log.details.length > 0 && (
                        <div style={{ padding: '14px 18px', borderTop: '1px solid #f1f5f9', background: '#fafbfc' }}>
                          <div style={{ fontSize: '0.74rem', fontWeight: 800, color: '#475569', marginBottom: '8px', textTransform: 'uppercase' }}>
                            Processed Students List ({log.details.length})
                          </div>
                          <div style={{ maxHeight: '180px', overflowY: 'auto' }}>
                            <table style={{ width: '100%', fontSize: '0.74rem', borderCollapse: 'collapse' }}>
                              <thead>
                                <tr style={{ color: '#64748b', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>
                                  <th style={{ padding: '4px 8px' }}>Student</th>
                                  <th style={{ padding: '4px 8px' }}>Roll No</th>
                                  <th style={{ padding: '4px 8px' }}>From</th>
                                  <th style={{ padding: '4px 8px' }}>To</th>
                                  <th style={{ padding: '4px 8px' }}>Action</th>
                                </tr>
                              </thead>
                              <tbody>
                                {log.details.map((item, i) => (
                                  <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                    <td style={{ padding: '4px 8px', fontWeight: 600 }}>{item.studentName}</td>
                                    <td style={{ padding: '4px 8px', color: '#64748b' }}>{item.rollNo}</td>
                                    <td style={{ padding: '4px 8px' }}>{item.fromGrade} - {item.fromSection}</td>
                                    <td style={{ padding: '4px 8px', fontWeight: 600, color: '#059669' }}>{item.toGrade} - {item.toSection}</td>
                                    <td style={{ padding: '4px 8px' }}>
                                      <span style={{
                                        fontSize: '0.68rem', fontWeight: 800, padding: '1px 6px', borderRadius: '4px',
                                        background: item.action === 'Promoted' ? '#dcfce7' : item.action === 'Graduated' ? '#f5f3ff' : '#fef3c7',
                                        color: item.action === 'Promoted' ? '#15803d' : item.action === 'Graduated' ? '#7c3aed' : '#b45309'
                                      }}>
                                        {item.action}
                                      </span>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div style={{
          padding: '16px 28px',
          borderTop: '1px solid #e2e8f0',
          background: '#f8fafc',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexShrink: 0
        }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '9px 18px',
              borderRadius: '10px',
              border: '1px solid #cbd5e1',
              background: 'white',
              color: '#475569',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer'
            }}
          >
            Close
          </button>

          {activeTab === 'class_wise' && (
            <button
              type="button"
              disabled={submitting || candidates.length === 0}
              onClick={handleExecuteBatchPromotion}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '9px 22px',
                borderRadius: '10px',
                border: 'none',
                background: 'linear-gradient(135deg, #059669 0%, #0d9488 100%)',
                color: 'white',
                fontWeight: 700,
                fontSize: '0.86rem',
                cursor: (submitting || candidates.length === 0) ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 12px rgba(5, 150, 105, 0.25)'
              }}
            >
              <GraduationCap size={16} />
              <span>
                {submitting ? 'Promoting Students...' : `Promote ${stagedCounts.promoted} of ${candidates.length} Students to ${targetClass}`}
              </span>
            </button>
          )}

          {activeTab === 'school_rollover' && (
            <button
              type="button"
              disabled={submitting || !schoolRolloverConfirm}
              onClick={handleExecuteSchoolRollover}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '9px 22px',
                borderRadius: '10px',
                border: 'none',
                background: schoolRolloverConfirm ? 'linear-gradient(135deg, #059669 0%, #047857 100%)' : '#94a3b8',
                color: 'white',
                fontWeight: 700,
                fontSize: '0.86rem',
                cursor: (submitting || !schoolRolloverConfirm) ? 'not-allowed' : 'pointer',
                boxShadow: schoolRolloverConfirm ? '0 4px 12px rgba(5, 150, 105, 0.3)' : 'none'
              }}
            >
              <Sparkles size={16} />
              <span>
                {submitting ? 'Executing Rollover...' : `Execute Whole-School Rollover to ${schoolToSession}`}
              </span>
            </button>
          )}

          {activeTab === 'history' && (
            <button
              type="button"
              onClick={fetchPromotionHistory}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '9px 18px',
                borderRadius: '10px',
                border: '1px solid #cbd5e1',
                background: 'white',
                color: '#475569',
                fontWeight: 700,
                fontSize: '0.84rem',
                cursor: 'pointer'
              }}
            >
              <RefreshCw size={14} className={loading ? 'spin' : ''} />
              <span>Refresh Logs</span>
            </button>
          )}
        </div>

      </div>
    </div>,
    document.body
  );
};

export default StudentPromotionModal;
