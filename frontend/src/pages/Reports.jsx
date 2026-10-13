import React, { useState, useEffect } from 'react';
import { FileText, Download, Activity, Users, BookOpen, CreditCard, X, Calendar, Filter, CheckCircle2 } from 'lucide-react';

const Reports = () => {
  const tenantSlug = sessionStorage.getItem('tenantSlug') || '';
  const userInfo = JSON.parse(sessionStorage.getItem('userInfo') || '{}');
  const token = userInfo.token || sessionStorage.getItem('token') || '';

  const [selectedReport, setSelectedReport] = useState(null);
  const [reportSummary, setReportSummary] = useState(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const reportTypes = [
    { id: 'academic', title: 'Academic Performance & Rosters', icon: BookOpen, color: '#4F46E5', desc: 'Class-wise student directory, attendance standing, and grade tracking.' },
    { id: 'attendance', title: 'Attendance Summary & Risk Analysis', icon: Activity, color: '#16A34A', desc: 'Real student attendance registers, critical risk thresholds, and absent tracking.' },
    { id: 'finance', title: 'Fee Collection & Defaulters Ledger', icon: CreditCard, color: '#F59E0B', desc: 'Live dues, collected amounts, overdue accounts, and parent contact logs.' },
    { id: 'demographics', title: 'Demographics & Faculty Records', icon: Users, color: '#8B5CF6', desc: 'Complete school population breakdown, teaching faculty, and staff data.' },
  ];

  const getHeaders = () => {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (tenantSlug) headers['x-tenant-slug'] = tenantSlug;
    return headers;
  };

  useEffect(() => {
    fetch('http://localhost:5000/api/reports/summary', { headers: getHeaders() })
      .then(res => res.ok ? res.json() : null)
      .then(data => { if (data) setReportSummary(data); })
      .catch(err => console.warn('Reports summary error:', err));
  }, [tenantSlug]);

  const handleDownload = async (reportId) => {
    setIsDownloading(true);
    setDownloadSuccess(false);
    try {
      const res = await fetch(`http://localhost:5000/api/reports/export?type=${reportId}`, {
        headers: getHeaders(),
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${tenantSlug || 'school'}_${reportId}_report.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        setDownloadSuccess(true);
        setTimeout(() => setDownloadSuccess(false), 3000);
      }
    } catch (err) {
      console.error('Download error:', err);
    } finally {
      setIsDownloading(false);
    }
  };

  const renderConfigurationDrawer = () => {
    if (!selectedReport) return null;

    return (
      <>
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.4)', zIndex: 40 }} onClick={() => setSelectedReport(null)} />
        <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: '450px', backgroundColor: 'var(--color-surface)', zIndex: 50, boxShadow: '-4px 0 15px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column' }}>
          
          <div style={{ padding: '24px', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Generate Report Data</h2>
            <button onClick={() => setSelectedReport(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}><X size={20}/></button>
          </div>

          <div style={{ padding: '24px', flex: 1, overflowY: 'auto' }}>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '32px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: selectedReport.color + '15', color: selectedReport.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <selectedReport.icon size={24} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--color-text-main)' }}>{selectedReport.title}</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', margin: 0 }}>Campus: {tenantSlug || 'Active School'}</p>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', fontWeight: 600, marginBottom: '8px' }}>
                  <Calendar size={16} className="text-muted"/> Academic Session
                </label>
                <select style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg)', outline: 'none' }}>
                  <option>Current Academic Session (2026-2027)</option>
                  <option>Term 1 (Autumn 2026)</option>
                  <option>All-Time Records</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', fontWeight: 600, marginBottom: '8px' }}>
                  <Filter size={16} className="text-muted"/> Cohort Scope
                </label>
                <select style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg)', outline: 'none' }}>
                  <option>All Enrolled Campus Classes</option>
                  <option>Secondary (9th - 10th)</option>
                  <option>Higher Secondary (11th - 12th)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, marginBottom: '8px' }}>Format</label>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <label style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px', border: '1px solid var(--color-primary)', backgroundColor: 'var(--color-primary)', color: 'white', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>
                    CSV Data Export
                  </label>
                </div>
              </div>

              {downloadSuccess && (
                <div style={{ padding: '12px', background: '#dcfce7', color: '#16a34a', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', fontWeight: 600 }}>
                  <CheckCircle2 size={16} /> Report generated and downloaded successfully!
                </div>
              )}
            </div>

            <div style={{ marginTop: '40px' }}>
              <button 
                onClick={() => handleDownload(selectedReport.id)}
                disabled={isDownloading}
                style={{ width: '100%', padding: '12px', backgroundColor: 'var(--color-primary)', color: 'white', borderRadius: '8px', border: 'none', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                <Download size={18} /> {isDownloading ? 'Exporting MongoDB Records...' : 'Generate & Download CSV'}
              </button>
            </div>
          </div>
        </div>
      </>
    );
  };

  const exportsList = reportSummary?.recentExports || [
    { name: 'Academic_Performance_Summary.csv', date: 'Oct 10, 2026', user: 'Principal Office', category: 'academic' },
    { name: 'Student_Attendance_Register.csv', date: 'Oct 08, 2026', user: 'Admin Staff', category: 'attendance' },
    { name: 'Fee_Collections_Defaulters.csv', date: 'Oct 05, 2026', user: 'Accounts Dept', category: 'finance' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--dashboard-card-gap)', width: '100%', height: '100%' }}>
      {renderConfigurationDrawer()}

      {/* Top Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #4338ca 0%, #3b82f6 100%)',
        borderRadius: '16px',
        padding: '24px 32px',
        color: 'white',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 10px 25px -5px rgba(59, 130, 246, 0.4)'
      }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, margin: '0 0 8px 0' }}>Reports & Institutional Analytics 📊</h2>
          <p style={{ opacity: 0.9, fontSize: '0.95rem', margin: 0 }}>
            Generate real-time exports compiled directly from live student, fee, attendance, and faculty records.
          </p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '0.85rem', opacity: 0.9 }}>Total Live Campus Students</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800 }}>
            {reportSummary?.totalStudents || 6} Enrolled
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-title">Live Data Reports Categories</div>
        </div>
        <p className="text-muted" style={{ marginBottom: '24px' }}>Select any report category below to configure parameters and download live MongoDB records.</p>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
          {reportTypes.map((report) => (
            <div key={report.id} onClick={() => setSelectedReport(report)} style={{ border: '1px solid var(--color-border)', borderRadius: '12px', padding: '24px', transition: 'all 0.2s', cursor: 'pointer' }} className="report-card hover-shadow">
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: report.color + '15', color: report.color, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                <report.icon size={24} />
              </div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '8px' }}>{report.title}</h3>
              <p className="text-muted" style={{ fontSize: '0.85rem', lineHeight: 1.5, marginBottom: '20px' }}>{report.desc}</p>
              <button className="btn-outline" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: 'var(--color-text-main)' }}>
                <FileText size={16} /> Configure & Export
              </button>
            </div>
          ))}
        </div>
      </div>
      
      <div className="card" style={{ flex: 1 }}>
        <div className="card-header">
          <div className="card-title">Quick Download Recent Export Datasets</div>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: '12px', borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>Report Dataset</th>
              <th style={{ textAlign: 'left', padding: '12px', borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>Session Date</th>
              <th style={{ textAlign: 'left', padding: '12px', borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>Authority</th>
              <th style={{ textAlign: 'right', padding: '12px', borderBottom: '1px solid var(--color-border)' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {exportsList.map((exportItem, i) => (
              <tr key={i}>
                <td style={{ padding: '16px 12px', borderBottom: '1px solid var(--color-border)', fontWeight: 600, color: '#1e3a8a' }}>{exportItem.name}</td>
                <td style={{ padding: '16px 12px', borderBottom: '1px solid var(--color-border)' }} className="text-muted">{exportItem.date}</td>
                <td style={{ padding: '16px 12px', borderBottom: '1px solid var(--color-border)' }} className="text-muted">{exportItem.user}</td>
                <td style={{ padding: '16px 12px', borderBottom: '1px solid var(--color-border)', textAlign: 'right' }}>
                  <button 
                    onClick={() => handleDownload(exportItem.category || 'academic')}
                    className="btn-outline" 
                    style={{ padding: '6px 14px', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
                  >
                    <Download size={14} /> Download CSV
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <style>{`
        .hover-shadow:hover {
          box-shadow: 0 4px 12px rgba(0,0,0,0.05);
          border-color: #d1d5db;
        }
      `}</style>
    </div>
  );
};

export default Reports;
