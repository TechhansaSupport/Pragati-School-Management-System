import React, { useState, useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, LineChart, Line, ComposedChart } from 'recharts';
import { Search, MoreVertical, User, ChevronLeft, ChevronRight } from 'lucide-react';

const revenueData = [
  { name: 'Apr', rev: 9000, cost: 7500, net: 8500 },
  { name: 'May', rev: 10200, cost: 8000, net: 9500 },
  { name: 'Jun', rev: 9500, cost: 9200, net: 7500 },
  { name: 'Jul', rev: 11177, cost: 8200, net: 9850 },
  { name: 'Aug', rev: 10500, cost: 8900, net: 10200 },
];

const balanceData = [
  { name: '1', val: 50 }, { name: '2', val: 60 }, { name: '3', val: 55 }, { name: '4', val: 70 },
  { name: '5', val: 65 }, { name: '6', val: 80 }, { name: '7', val: 75 }, { name: '8', val: 85 },
  { name: '9', val: 95 }, { name: '10', val: 90 }, { name: '11', val: 100 }, { name: '12', val: 105 },
  { name: '13', val: 95 }, { name: '14', val: 115 }, { name: '15', val: 110 }, { name: '16', val: 125 },
];

const initialPendingFees = [
  { id: 1, student: 'Rahul Sharma', date: '08/17/23', contact: '9876543210', value: 2700, status: 'Collected', icon: User, color: '#111827', cls: '10th - A' },
  { id: 2, student: 'Priya Singh', date: '08/17/23', contact: '9876543211', value: 1100, status: 'Overdue', icon: User, color: '#EF4444', cls: '8th - B' },
  { id: 3, student: 'Amit Kumar', date: '08/16/23', contact: '9876543212', value: 1500, status: 'Due this month', icon: User, color: '#3B82F6', cls: '12th - Sci' },
  { id: 4, student: 'Neha Gupta', date: '08/16/23', contact: '9876543213', value: 1030, status: 'Overdue', icon: User, color: '#EAB308', cls: '5th - C' },
  { id: 5, student: 'Vikram Patel', date: '08/16/23', contact: '9876543214', value: 2800, status: 'Collected', icon: User, color: '#111827', cls: '11th - Com' },
  { id: 6, student: 'Anjali Desai', date: '08/16/23', contact: '9876543215', value: 1200, status: 'Due this month', icon: User, color: '#6B7280', cls: '9th - A' },
  { id: 7, student: 'Karan Malhotra', date: '08/15/23', contact: '9876543216', value: 1400, status: 'Overdue', icon: User, color: '#111827', cls: '7th - B' },
  { id: 8, student: 'Sneha Reddy', date: '08/15/23', contact: '9876543217', value: 1600, status: 'Collected', icon: User, color: '#111827', cls: '6th - A' },
  { id: 9, student: 'Rohan Mehta', date: '08/15/23', contact: '9876543218', value: 2300, status: 'Collected', icon: User, color: '#0EA5E9', cls: '10th - B' },
  { id: 10, student: 'Pooja Joshi', date: '08/15/23', contact: '9876543219', value: 1510, status: 'Due this month', icon: User, color: '#6B7280', cls: '4th - A' },
  { id: 11, student: 'Ravi Verma', date: '08/14/23', contact: '9876543220', value: 3100, status: 'Collected', icon: User, color: '#22C55E', cls: '9th - C' },
  { id: 12, student: 'Sonia Gandhi', date: '08/14/23', contact: '9876543221', value: 1800, status: 'Overdue', icon: User, color: '#EF4444', cls: '11th - Arts' },
];

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [toggleVsPeriod, setToggleVsPeriod] = useState(false);

  const filteredFees = useMemo(() => {
    return initialPendingFees.filter(fee => {
      const matchesTab = activeTab === 'All' || fee.status === activeTab;
      const matchesSearch = fee.student.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            fee.cls.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesTab && matchesSearch;
    });
  }, [activeTab, searchQuery]);

  const totalPages = Math.ceil(filteredFees.length / itemsPerPage);
  const paginatedFees = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredFees.slice(start, start + itemsPerPage);
  }, [filteredFees, currentPage, itemsPerPage]);

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(new Set(paginatedFees.map(f => f.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectOne = (id) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const formatCurrency = (val) => `₹${val.toLocaleString()}`;

  return (
    <div className="dashboard-grid">
      <div className="left-column">
        {/* Overview */}
        <div className="card">
          <div className="card-header" style={{ marginBottom: '32px' }}>
            <div className="card-title">School Overview</div>
            <MoreVertical size={20} className="text-muted" style={{cursor: 'pointer'}} />
          </div>
          
          <div className="deliveries-grid">
            <div className="delivery-metric">
              <div className="metric-label">Seat utilization</div>
              <div className="metric-value">95.1%</div>
              <div className="mini-bar-chart">
                {Array(20).fill(0).map((_, i) => (
                  <div key={i} className="mini-bar" style={{ height: `${Math.random() * 60 + 40}%`, backgroundColor: i > 17 ? '#E5E7EB' : '#22C55E' }}></div>
                ))}
              </div>
            </div>
            
            <div className="delivery-metric">
              <div className="metric-label">Avg Attendance</div>
              <div className="metric-value">97.9%</div>
              <div className="progress-bar-container">
                <div className="progress-marker" style={{ left: '90%' }}></div>
              </div>
            </div>
            
            <div className="delivery-metric">
              <div className="metric-label">Total Enrolled</div>
              <div className="metric-value">3,452 <span className="metric-trend">+3.5%</span></div>
              <div style={{ height: '40px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={balanceData}>
                    <Line type="monotone" dataKey="val" stroke="#22C55E" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        {/* Financials */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">Fees and Expenses</div>
            <MoreVertical size={20} className="text-muted" style={{cursor: 'pointer'}} />
          </div>
          <div className="text-muted" style={{ fontSize: '0.85rem', marginBottom: '16px' }}>Collection, surplus, ₹ (Thousands)</div>
          
          <div style={{ height: '250px', marginBottom: '24px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenueData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} tickFormatter={(val) => `₹${val/1000}K`} />
                <Tooltip />
                <Line type="monotone" dataKey="rev" stroke="#22C55E" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="cost" stroke="#EF4444" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="net" stroke="#111827" strokeWidth={2} dot={{ r: 4, fill: '#111827' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          
          <div className="flex-between">
            <div className="chart-legend">
              <div className="legend-item"><div className="legend-color" style={{backgroundColor: '#22C55E'}}></div> Fee Collection</div>
              <div className="legend-item"><div className="legend-color" style={{backgroundColor: '#EF4444'}}></div> Expenses</div>
              <div className="legend-item"><div className="legend-color" style={{backgroundColor: '#111827'}}></div> Surplus</div>
            </div>
            <div className="legend-item text-muted" style={{cursor: 'pointer'}} onClick={() => setToggleVsPeriod(!toggleVsPeriod)}>
              <div style={{
                width: '32px', height: '16px', borderRadius: '8px', position: 'relative', transition: 'all 0.2s',
                backgroundColor: toggleVsPeriod ? '#22C55E' : '#E5E7EB'
              }}>
                 <div style={{
                   width: '12px', height: '12px', backgroundColor: 'white', borderRadius: '50%', position: 'absolute', top: '2px', transition: 'all 0.2s',
                   left: toggleVsPeriod ? '18px' : '2px'
                 }}></div>
              </div>
              Vs. previous period
            </div>
          </div>
        </div>

        {/* Bottom Grid */}
        <div className="bottom-grid">
          <div className="card">
            <div className="card-header">
              <div className="card-title">Cash Flow</div>
              <MoreVertical size={20} className="text-muted" style={{cursor: 'pointer'}} />
            </div>
            <div className="flex-between" style={{marginBottom: '24px'}}>
              <div>
                <div className="metric-label">Bank balance</div>
                <div className="metric-value" style={{marginBottom: 0}}>₹12.6L</div>
              </div>
              <div className="text-muted" style={{fontSize: '0.85rem'}}>Target: ~₹10L</div>
            </div>
            
            <div style={{ height: '150px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={balanceData}>
                   <Bar dataKey="val" fill="#22C55E" radius={[2, 2, 0, 0]} barSize={8} />
                   <Line type="step" dataKey="val" stroke="#111827" strokeDasharray="3 3" dot={false} strokeWidth={1} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          <div className="card">
            <div className="card-header">
              <div className="card-title">Expenses by category</div>
              <MoreVertical size={20} className="text-muted" style={{cursor: 'pointer'}} />
            </div>
            
            <div style={{display: 'flex', height: '8px', borderRadius: '4px', overflow: 'hidden', marginBottom: '24px', gap: '2px'}}>
               <div style={{backgroundColor: '#22C55E', flex: 45}}></div>
               <div style={{backgroundColor: '#4ADE80', flex: 20}}></div>
               <div style={{backgroundColor: '#EAB308', flex: 12}}></div>
               <div style={{backgroundColor: '#FDE047', flex: 10}}></div>
               <div style={{backgroundColor: '#FBBF24', flex: 8}}></div>
               <div style={{backgroundColor: '#D97706', flex: 5}}></div>
            </div>
            
            <div style={{display: 'flex', flexDirection: 'column', gap: '12px'}}>
              {[
                { label: 'Staff Salaries', val: '₹8.9L', pct: '45%', color: '#22C55E' },
                { label: 'Infrastructure', val: '₹4.3L', pct: '20%', color: '#4ADE80' },
                { label: 'Transport', val: '₹2.8L', pct: '12%', color: '#EAB308' },
                { label: 'Events & Activities', val: '₹1.5L', pct: '10%', color: '#FDE047' },
                { label: 'Tech & Software', val: '₹0.8L', pct: '8%', color: '#FBBF24' },
                { label: 'Utilities', val: '₹0.5L', pct: '5%', color: '#D97706' },
              ].map(item => (
                 <div key={item.label} className="flex-between" style={{fontSize: '0.85rem'}}>
                   <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                      <div style={{width: '6px', height: '6px', backgroundColor: item.color}}></div>
                      <span className="text-muted">{item.label}</span>
                   </div>
                   <div style={{display: 'flex', gap: '16px', fontWeight: 500}}>
                     <span>{item.val}</span>
                     <span style={{width: '32px', textAlign: 'right'}}>{item.pct}</span>
                   </div>
                 </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      <div className="right-column">
        <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div className="card-header">
            <div className="card-title">Pending Fees</div>
            <MoreVertical size={20} className="text-muted" style={{cursor: 'pointer'}} />
          </div>
          
          <div className="invoice-stats">
            <div className="inv-stat">
              <span className="label">Collected</span>
              <span className="val">₹16.9L</span>
              <span className="pct">51.5%</span>
            </div>
            <div className="inv-stat">
              <span className="label">Due this month</span>
              <span className="val">₹9.5L</span>
              <span className="pct">29%</span>
            </div>
            <div className="inv-stat">
              <span className="label">Overdue</span>
              <span className="val">₹6.4L</span>
              <span className="pct">19.5%</span>
            </div>
          </div>
          
          <div className="segmented-progress">
            <div className="seg-green"></div>
            <div className="seg-yellow"></div>
            <div className="seg-gray"></div>
          </div>
          
          <div className="table-tabs">
            {['All', 'Overdue', 'Due this month', 'Collected'].map(tab => (
              <div 
                key={tab}
                className={`table-tab ${activeTab === tab ? 'active' : ''}`}
                onClick={() => { setActiveTab(tab); setCurrentPage(1); }}
                style={{cursor: 'pointer'}}
              >
                {tab}
              </div>
            ))}
            
            <div className="table-search">
              <Search size={16} style={{position: 'absolute', left: '10px', top: '9px', color: '#6B7280'}} />
              <input 
                type="text" 
                placeholder="Search students..." 
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                style={{outline: 'none'}}
              />
            </div>
          </div>
          
          <div style={{flex: 1, overflowY: 'auto', minHeight: '300px'}}>
            <table>
              <thead>
                <tr>
                  <th style={{width: '40px'}}>
                    <input 
                      type="checkbox" 
                      checked={paginatedFees.length > 0 && selectedIds.size === paginatedFees.length}
                      onChange={handleSelectAll}
                      style={{cursor: 'pointer'}}
                    />
                  </th>
                  <th>Student Name</th>
                  <th style={{cursor: 'pointer'}}>Due date ▾</th>
                  <th>Class/Sec</th>
                  <th>Parent Contact</th>
                  <th>Amount</th>
                  <th style={{width: '40px'}}></th>
                </tr>
              </thead>
              <tbody>
                {paginatedFees.length > 0 ? paginatedFees.map((fee) => (
                  <tr key={fee.id} style={{backgroundColor: selectedIds.has(fee.id) ? 'var(--color-bg)' : 'transparent', transition: 'background-color 0.2s'}}>
                    <td>
                      <input 
                        type="checkbox" 
                        checked={selectedIds.has(fee.id)}
                        onChange={() => handleSelectOne(fee.id)}
                        style={{cursor: 'pointer'}}
                      />
                    </td>
                    <td>
                      <div className="company-cell">
                        <div className="company-icon" style={{backgroundColor: fee.color + '15', color: fee.color}}>
                          <fee.icon size={14} />
                        </div>
                        {fee.student}
                      </div>
                    </td>
                    <td className="text-muted">{fee.date}</td>
                    <td className="text-muted">{fee.cls}</td>
                    <td className="text-muted">{fee.contact}</td>
                    <td style={{fontWeight: 600, color: fee.status === 'Overdue' ? 'var(--color-red)' : 'var(--color-text-main)'}}>
                      {formatCurrency(fee.value)}
                    </td>
                    <td className="text-muted"><MoreVertical size={16} style={{cursor: 'pointer'}} /></td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="7" style={{textAlign: 'center', padding: '32px', color: 'var(--color-text-muted)'}}>
                      No matching records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          <div className="flex-between text-muted" style={{marginTop: '16px', fontSize: '0.85rem'}}>
            <div>
              Show by 
              <select 
                style={{border: 'none', background: 'transparent', fontWeight: 500, outline: 'none', marginLeft: '4px', cursor: 'pointer', color: 'var(--color-text-main)'}}
                value={itemsPerPage}
                onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
              </select>
            </div>
            <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
              <button 
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                style={{background: 'none', border: 'none', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', color: currentPage === 1 ? 'var(--color-border)' : 'inherit', display: 'flex', alignItems: 'center'}}
              >
                <ChevronLeft size={16} />
              </button>
              <span>{currentPage} / {Math.max(1, totalPages)}</span>
              <button 
                disabled={currentPage === totalPages || totalPages === 0}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                style={{background: 'none', border: 'none', cursor: (currentPage === totalPages || totalPages === 0) ? 'not-allowed' : 'pointer', color: (currentPage === totalPages || totalPages === 0) ? 'var(--color-border)' : 'inherit', display: 'flex', alignItems: 'center'}}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
