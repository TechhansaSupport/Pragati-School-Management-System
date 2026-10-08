import React, { useState } from 'react';
import { FileText, Download, Activity, Users, BookOpen, CreditCard, X, Calendar, Filter } from 'lucide-react';

const Reports = () => {
  const [selectedReport, setSelectedReport] = useState(null);

  const reportTypes = [
    { id: 'academic', title: 'Academic Performance', icon: BookOpen, color: '#4F46E5', desc: 'Class-wise and student-wise grade distributions and trends.' },
    { id: 'attendance', title: 'Attendance Summary', icon: Activity, color: '#16A34A', desc: 'Monthly attendance rates, chronic absenteeism, and late arrivals.' },
    { id: 'finance', title: 'Fee Collection', icon: CreditCard, color: '#F59E0B', desc: 'Defaulters list, collection projections, and historical revenue.' },
    { id: 'demographics', title: 'Demographics & Enrollment', icon: Users, color: '#8B5CF6', desc: 'Student population breakdown by age, gender, and location.' },
  ];

  const renderConfigurationDrawer = () => {
    if (!selectedReport) return null;

    return (
      <>
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.4)', zIndex: 40 }} onClick={() => setSelectedReport(null)} />
        <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: '450px', backgroundColor: 'var(--color-surface)', zIndex: 50, boxShadow: '-4px 0 15px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column' }}>
          
          <div style={{ padding: '24px', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Configure Report</h2>
            <button onClick={() => setSelectedReport(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}><X size={20}/></button>
          </div>

          <div style={{ padding: '24px', flex: 1, overflowY: 'auto' }}>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '32px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: selectedReport.color + '15', color: selectedReport.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <selectedReport.icon size={24} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--color-text-main)' }}>{selectedReport.title}</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', margin: 0 }}>Custom report generation</p>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', fontWeight: 600, marginBottom: '8px' }}>
                  <Calendar size={16} className="text-muted"/> Date Range
                </label>
                <select style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg)', outline: 'none' }}>
                  <option>Current Academic Year (2023-2024)</option>
                  <option>Last Academic Year (2022-2023)</option>
                  <option>Current Term (Term 1)</option>
                  <option>Custom Date Range</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', fontWeight: 600, marginBottom: '8px' }}>
                  <Filter size={16} className="text-muted"/> Target Grade / Section
                </label>
                <select style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg)', outline: 'none' }}>
                  <option>All School (Aggregate)</option>
                  <option>Primary (1st - 5th)</option>
                  <option>Middle (6th - 8th)</option>
                  <option>High School (9th - 12th)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, marginBottom: '8px' }}>Export Format</label>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <label style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px', border: '1px solid var(--color-primary)', backgroundColor: 'var(--color-primary)', color: 'white', borderRadius: '8px', cursor: 'pointer', fontWeight: 500 }}>
                    <input type="radio" name="format" defaultChecked style={{ display: 'none' }} /> PDF Report
                  </label>
                  <label style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px', border: '1px solid var(--color-border)', borderRadius: '8px', cursor: 'pointer', fontWeight: 500, color: 'var(--color-text-muted)' }}>
                    <input type="radio" name="format" style={{ display: 'none' }} /> CSV Data
                  </label>
                </div>
              </div>
            </div>

            <div style={{ marginTop: '40px' }}>
              <button style={{ width: '100%', padding: '12px', backgroundColor: 'var(--color-primary)', color: 'white', borderRadius: '8px', border: 'none', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <FileText size={18} /> Generate Report
              </button>
            </div>
          </div>
        </div>
      </>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%', height: '100%' }}>
      {renderConfigurationDrawer()}

      <div className="card">
        <div className="card-header">
          <div className="card-title">Generated Reports</div>
        </div>
        <p className="text-muted" style={{ marginBottom: '24px' }}>Select a report category below to configure and generate detailed analytics.</p>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
          {reportTypes.map((report) => (
            <div key={report.id} onClick={() => setSelectedReport(report)} style={{ border: '1px solid var(--color-border)', borderRadius: '12px', padding: '24px', transition: 'all 0.2s', cursor: 'pointer' }} className="report-card hover-shadow">
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: report.color + '15', color: report.color, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                <report.icon size={24} />
              </div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '8px' }}>{report.title}</h3>
              <p className="text-muted" style={{ fontSize: '0.85rem', lineHeight: 1.5, marginBottom: '20px' }}>{report.desc}</p>
              <button className="btn-outline" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: 'var(--color-text-main)' }}>
                <FileText size={16} /> Configure Report
              </button>
            </div>
          ))}
        </div>
      </div>
      
      <div className="card" style={{ flex: 1 }}>
        <div className="card-header">
          <div className="card-title">Recent Exports</div>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: '12px', borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>Report Name</th>
              <th style={{ textAlign: 'left', padding: '12px', borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>Date Generated</th>
              <th style={{ textAlign: 'left', padding: '12px', borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>Generated By</th>
              <th style={{ textAlign: 'right', padding: '12px', borderBottom: '1px solid var(--color-border)' }}></th>
            </tr>
          </thead>
          <tbody>
            {[
              { name: 'Term 1 Exam Results Summary.pdf', date: 'Aug 20, 2023 14:30', user: 'Admin User' },
              { name: 'Defaulters_List_Aug.csv', date: 'Aug 19, 2023 09:15', user: 'Accounts Dept' },
              { name: 'Staff_Attendance_July.xlsx', date: 'Aug 15, 2023 11:00', user: 'HR Dept' }
            ].map((exportItem, i) => (
              <tr key={i}>
                <td style={{ padding: '16px 12px', borderBottom: '1px solid var(--color-border)', fontWeight: 500 }}>{exportItem.name}</td>
                <td style={{ padding: '16px 12px', borderBottom: '1px solid var(--color-border)' }} className="text-muted">{exportItem.date}</td>
                <td style={{ padding: '16px 12px', borderBottom: '1px solid var(--color-border)' }} className="text-muted">{exportItem.user}</td>
                <td style={{ padding: '16px 12px', borderBottom: '1px solid var(--color-border)', textAlign: 'right' }}>
                  <button className="btn-outline" style={{ padding: '4px 12px', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <Download size={12} /> Download
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
