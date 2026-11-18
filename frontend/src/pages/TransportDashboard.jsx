import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { 
  Bus, Map, Users, AlertCircle, Wrench, Search, Navigation, 
  Plus, UserPlus, Phone, Shield, Fuel, CheckCircle, Trash2, 
  X, Check, AlertTriangle, Truck, Calendar, Clock
} from 'lucide-react';
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer, CartesianGrid, YAxis } from 'recharts';

const fleetStatusData = [
  { time: '06:00', active: 2 },
  { time: '07:00', active: 5 },
  { time: '08:00', active: 5 },
  { time: '09:00', active: 1 },
  { time: '13:00', active: 1 },
  { time: '14:00', active: 4 },
  { time: '15:00', active: 5 },
  { time: '16:00', active: 2 },
];

const initialVehicleForm = {
  vehicleNumber: '',
  model: 'Tata Starbus 40-Seater',
  vehicleType: 'Bus',
  capacity: 40,
  fuelType: 'Diesel',
  insuranceExpiry: '2027-03-31',
  fitnessExpiry: '2027-06-30',
  assignedRoute: '',
  assignedDriver: '',
  status: 'Active',
};

const initialDriverForm = {
  name: '',
  contact: '',
  licenseNumber: '',
  licenseExpiry: '2028-12-31',
  experienceYears: 5,
  assignedBus: '',
  assignedRoute: '',
  status: 'On Duty',
};

const TransportDashboard = () => {
  const navigate = useNavigate();
  const tenantSlug = sessionStorage.getItem('tenantSlug') || '';
  const userInfo = JSON.parse(sessionStorage.getItem('userInfo') || '{}');
  const token = userInfo.token || sessionStorage.getItem('token') || '';

  const [activeTab, setActiveTab] = useState('vehicles'); // 'vehicles' | 'drivers' | 'routes'
  const [searchQuery, setSearchQuery] = useState('');
  const [transportStats, setTransportStats] = useState({
    totalFleet: 5,
    activeRoutes: 5,
    totalStops: 38,
    mappedStudents: 188,
    inMaintenance: 1,
    totalVehicles: 5,
    totalDrivers: 5,
    activeDrivers: 5,
  });

  const [routes, setRoutes] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [isAddVehicleOpen, setIsAddVehicleOpen] = useState(false);
  const [isAddDriverOpen, setIsAddDriverOpen] = useState(false);
  const [vehicleForm, setVehicleForm] = useState(initialVehicleForm);
  const [driverForm, setDriverForm] = useState(initialDriverForm);
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState({ show: false, text: '', type: 'success' });

  const showToast = (text, type = 'success') => {
    setToastMessage({ show: true, text, type });
    setTimeout(() => {
      setToastMessage({ show: false, text: '', type: 'success' });
    }, 3500);
  };

  const getHeaders = () => {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (tenantSlug) headers['x-tenant-slug'] = tenantSlug;
    return headers;
  };

  const fetchTransportData = async () => {
    setIsLoading(true);
    const headers = getHeaders();
    try {
      const [statsRes, routesRes, vehiclesRes, driversRes] = await Promise.all([
        fetch('http://localhost:5000/api/transport/stats', { headers }),
        fetch('http://localhost:5000/api/transport/routes', { headers }),
        fetch('http://localhost:5000/api/transport/vehicles', { headers }),
        fetch('http://localhost:5000/api/transport/drivers', { headers }),
      ]);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setTransportStats(statsData);
      }
      if (routesRes.ok) {
        const routesData = await routesRes.json();
        setRoutes(Array.isArray(routesData) ? routesData : []);
      }
      if (vehiclesRes.ok) {
        const vehiclesData = await vehiclesRes.json();
        setVehicles(Array.isArray(vehiclesData) ? vehiclesData : []);
      }
      if (driversRes.ok) {
        const driversData = await driversRes.json();
        setDrivers(Array.isArray(driversData) ? driversData : []);
      }
    } catch (err) {
      console.warn('Transport data fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTransportData();
  }, [tenantSlug]);

  // Handle Add Vehicle Submit
  const handleAddVehicle = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!vehicleForm.vehicleNumber.trim()) {
      setFormError('Please enter a vehicle registration / bus number.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('http://localhost:5000/api/transport/vehicles', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(vehicleForm),
      });

      const data = await res.json();
      if (!res.ok) {
        setFormError(data.message || 'Failed to add vehicle.');
        setIsSubmitting(false);
        return;
      }

      setIsAddVehicleOpen(false);
      setVehicleForm(initialVehicleForm);
      showToast(`Vehicle ${data.vehicleNumber} successfully added to fleet!`);
      fetchTransportData();
    } catch (err) {
      setFormError('Network error while saving vehicle.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Add Driver Submit
  const handleAddDriver = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!driverForm.name.trim()) {
      setFormError('Please enter the driver full name.');
      return;
    }
    if (!driverForm.contact.trim()) {
      setFormError('Please enter a contact phone number.');
      return;
    }
    if (!driverForm.licenseNumber.trim()) {
      setFormError('Please enter commercial driving license number.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('http://localhost:5000/api/transport/drivers', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(driverForm),
      });

      const data = await res.json();
      if (!res.ok) {
        setFormError(data.message || 'Failed to add driver profile.');
        setIsSubmitting(false);
        return;
      }

      setIsAddDriverOpen(false);
      setDriverForm(initialDriverForm);
      showToast(`Driver ${data.name} successfully registered!`);
      fetchTransportData();
    } catch (err) {
      setFormError('Network error while saving driver profile.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Delete Vehicle
  const handleDeleteVehicle = async (id, vehicleNum) => {
    if (!window.confirm(`Are you sure you want to remove vehicle ${vehicleNum} from the fleet?`)) return;
    try {
      const res = await fetch(`http://localhost:5000/api/transport/vehicles/${id}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });
      if (res.ok) {
        showToast(`Vehicle ${vehicleNum} removed.`);
        fetchTransportData();
      }
    } catch (err) {
      console.error('Delete vehicle error:', err);
    }
  };

  // Handle Delete Driver
  const handleDeleteDriver = async (id, driverName) => {
    if (!window.confirm(`Are you sure you want to remove driver ${driverName}?`)) return;
    try {
      const res = await fetch(`http://localhost:5000/api/transport/drivers/${id}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });
      if (res.ok) {
        showToast(`Driver ${driverName} removed.`);
        fetchTransportData();
      }
    } catch (err) {
      console.error('Delete driver error:', err);
    }
  };

  // Filters
  const q = searchQuery.toLowerCase();
  const filteredVehicles = vehicles.filter(v =>
    v.vehicleNumber?.toLowerCase().includes(q) ||
    v.model?.toLowerCase().includes(q) ||
    v.vehicleType?.toLowerCase().includes(q) ||
    v.assignedRoute?.toLowerCase().includes(q) ||
    v.assignedDriver?.toLowerCase().includes(q) ||
    v.status?.toLowerCase().includes(q)
  );

  const filteredDrivers = drivers.filter(d =>
    d.name?.toLowerCase().includes(q) ||
    d.contact?.toLowerCase().includes(q) ||
    d.licenseNumber?.toLowerCase().includes(q) ||
    d.assignedBus?.toLowerCase().includes(q) ||
    d.assignedRoute?.toLowerCase().includes(q) ||
    d.status?.toLowerCase().includes(q)
  );

  const filteredRoutes = routes.filter(route =>
    route.name?.toLowerCase().includes(q) ||
    route.busNumber?.toLowerCase().includes(q) ||
    route.driverName?.toLowerCase().includes(q) ||
    route.routeId?.toLowerCase().includes(q)
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%', minHeight: '100%', paddingBottom: '32px' }}>
      
      {/* Toast Alert */}
      {toastMessage.show && (
        <div style={{
          position: 'fixed', top: '24px', right: '28px', zIndex: 100000,
          background: toastMessage.type === 'error' ? '#ef4444' : '#10b981',
          color: 'white', padding: '12px 22px', borderRadius: '12px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', gap: '10px',
          fontWeight: 700, fontSize: '0.9rem', animation: 'slide-down 0.3s ease'
        }}>
          {toastMessage.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle size={18} />}
          {toastMessage.text}
        </div>
      )}

      {/* KPI Row (5 Key Transport Metrics) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        {[
          { 
            label: 'Total Fleet', 
            value: `${vehicles.length || transportStats.totalFleet || 5} Vehicles`, 
            icon: Bus, 
            color: '#4F46E5', 
            bg: 'rgba(79,70,229,0.1)',
            badge: 'Registered',
            badgeBg: 'rgba(79,70,229,0.08)',
            badgeColor: '#4F46E5',
            tab: 'vehicles'
          },
          { 
            label: 'Active Drivers', 
            value: `${drivers.length || transportStats.totalDrivers || 5} Verified`, 
            icon: Shield, 
            color: '#0F766E', 
            bg: 'rgba(15,118,110,0.1)',
            badge: '100% On-Duty',
            badgeBg: 'rgba(15,118,110,0.08)',
            badgeColor: '#0F766E',
            tab: 'drivers'
          },
          { 
            label: 'Active Routes', 
            value: `${routes.length || transportStats.activeRoutes || 5} Lines`, 
            icon: Navigation, 
            color: '#16A34A', 
            bg: 'rgba(22, 163, 74,0.1)',
            badge: 'Active Lines',
            badgeBg: 'rgba(22, 163, 74,0.08)',
            badgeColor: '#16A34A',
            tab: 'routes'
          },
          { 
            label: 'Students Commuting', 
            value: `${transportStats.mappedStudents || 188} Daily`, 
            icon: Users, 
            color: '#2563EB', 
            bg: 'rgba(37,99,235,0.1)',
            badge: 'Safe Commute',
            badgeBg: 'rgba(37,99,235,0.08)',
            badgeColor: '#2563EB'
          },
          { 
            label: 'In Maintenance', 
            value: `${vehicles.filter(v => v.status === 'Maintenance').length || transportStats.inMaintenance || 1} Vehicle`, 
            icon: Wrench, 
            color: '#DC2626', 
            bg: 'rgba(220, 38, 38,0.1)',
            badge: 'In Garage',
            badgeBg: 'rgba(220, 38, 38,0.08)',
            badgeColor: '#DC2626',
            tab: 'vehicles'
          }
        ].map((kpi, idx) => (
          <div 
            key={idx} 
            className="card hover-lift" 
            onClick={() => kpi.tab && setActiveTab(kpi.tab)}
            style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '10px', 
              padding: '18px 20px', 
              borderRadius: '16px', 
              background: 'var(--color-surface, white)', 
              border: '1px solid var(--color-border, #e2e8f0)', 
              boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
              cursor: kpi.tab ? 'pointer' : 'default',
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

      {/* Main Grid: Left Directory Workspace + Right Analytics */}
      <div className="dashboard-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 360px', gap: '20px' }}>
        
        {/* LEFT COLUMN: Multi-Tab Directory */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          <div className="card" style={{ 
            background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', 
            padding: '22px 24px', boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
            display: 'flex', flexDirection: 'column'
          }}>
            
            {/* Top Workspace Header & Tabs */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px', marginBottom: '20px' }}>
              
              {/* Tab Switcher */}
              <div style={{ display: 'flex', gap: '6px', background: '#f8fafc', padding: '5px', borderRadius: '12px', border: '1px solid #e2e8f0', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => setActiveTab('vehicles')}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '8px',
                    padding: '8px 16px', borderRadius: '9px', border: 'none',
                    fontSize: '0.84rem', fontWeight: 700, cursor: 'pointer',
                    background: activeTab === 'vehicles' ? '#4F46E5' : 'transparent',
                    color: activeTab === 'vehicles' ? 'white' : '#64748b',
                    boxShadow: activeTab === 'vehicles' ? '0 2px 8px rgba(79, 70, 229, 0.25)' : 'none',
                    transition: 'all 0.15s'
                  }}
                >
                  <Bus size={15} color={activeTab === 'vehicles' ? 'white' : '#94a3b8'} />
                  Vehicles & Fleet
                  <span style={{ fontSize: '0.72rem', background: activeTab === 'vehicles' ? 'rgba(255,255,255,0.25)' : '#e2e8f0', color: activeTab === 'vehicles' ? 'white' : '#475569', padding: '1px 7px', borderRadius: '8px', fontWeight: 800 }}>
                    {vehicles.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('drivers')}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '8px',
                    padding: '8px 16px', borderRadius: '9px', border: 'none',
                    fontSize: '0.84rem', fontWeight: 700, cursor: 'pointer',
                    background: activeTab === 'drivers' ? '#4F46E5' : 'transparent',
                    color: activeTab === 'drivers' ? 'white' : '#64748b',
                    boxShadow: activeTab === 'drivers' ? '0 2px 8px rgba(79, 70, 229, 0.25)' : 'none',
                    transition: 'all 0.15s'
                  }}
                >
                  <Shield size={15} color={activeTab === 'drivers' ? 'white' : '#94a3b8'} />
                  Drivers & Operators
                  <span style={{ fontSize: '0.72rem', background: activeTab === 'drivers' ? 'rgba(255,255,255,0.25)' : '#e2e8f0', color: activeTab === 'drivers' ? 'white' : '#475569', padding: '1px 7px', borderRadius: '8px', fontWeight: 800 }}>
                    {drivers.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('routes')}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '8px',
                    padding: '8px 16px', borderRadius: '9px', border: 'none',
                    fontSize: '0.84rem', fontWeight: 700, cursor: 'pointer',
                    background: activeTab === 'routes' ? '#4F46E5' : 'transparent',
                    color: activeTab === 'routes' ? 'white' : '#64748b',
                    boxShadow: activeTab === 'routes' ? '0 2px 8px rgba(79, 70, 229, 0.25)' : 'none',
                    transition: 'all 0.15s'
                  }}
                >
                  <Navigation size={15} color={activeTab === 'routes' ? 'white' : '#94a3b8'} />
                  Live Routes
                  <span style={{ fontSize: '0.72rem', background: activeTab === 'routes' ? 'rgba(255,255,255,0.25)' : '#e2e8f0', color: activeTab === 'routes' ? 'white' : '#475569', padding: '1px 7px', borderRadius: '8px', fontWeight: 800 }}>
                    {routes.length}
                  </span>
                </button>
              </div>

              {/* Action Bar (Search + Quick Add Button) */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <div style={{ position: 'relative' }}>
                  <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                  <input 
                    type="text" 
                    placeholder={
                      activeTab === 'vehicles' ? "Search vehicle #, model..." :
                      activeTab === 'drivers' ? "Search driver name, license..." :
                      "Search route, stop, bus..."
                    }
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    style={{
                      padding: '8px 12px 8px 34px',
                      borderRadius: '10px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.84rem',
                      outline: 'none',
                      width: '210px'
                    }}
                  />
                </div>

                {activeTab === 'vehicles' && (
                  <button
                    onClick={() => {
                      setFormError('');
                      setVehicleForm(initialVehicleForm);
                      setIsAddVehicleOpen(true);
                    }}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: '6px',
                      padding: '8px 14px', borderRadius: '10px', border: 'none',
                      background: '#4F46E5',
                      color: 'white', fontWeight: 700, fontSize: '0.82rem',
                      cursor: 'pointer', boxShadow: '0 2px 8px rgba(79, 70, 229, 0.25)'
                    }}
                    className="hover-lift"
                  >
                    <Plus size={15} /> Add Vehicle
                  </button>
                )}

                {activeTab === 'drivers' && (
                  <button
                    onClick={() => {
                      setFormError('');
                      setDriverForm(initialDriverForm);
                      setIsAddDriverOpen(true);
                    }}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: '6px',
                      padding: '8px 14px', borderRadius: '10px', border: 'none',
                      background: '#0F766E',
                      color: 'white', fontWeight: 700, fontSize: '0.82rem',
                      cursor: 'pointer', boxShadow: '0 2px 8px rgba(15, 118, 110, 0.25)'
                    }}
                    className="hover-lift"
                  >
                    <UserPlus size={15} /> Add Driver
                  </button>
                )}

                {activeTab === 'routes' && (
                  <button
                    onClick={() => navigate(tenantSlug ? `/${tenantSlug}/routes` : '/routes')}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: '6px',
                      padding: '8px 14px', borderRadius: '10px', border: 'none',
                      background: '#2563EB',
                      color: 'white', fontWeight: 700, fontSize: '0.82rem',
                      cursor: 'pointer', boxShadow: '0 2px 8px rgba(37, 99, 235, 0.25)'
                    }}
                    className="hover-lift"
                  >
                    <Plus size={15} /> Manage All Routes
                  </button>
                )}
              </div>
            </div>

            {/* TAB CONTENT TABLES */}
            <div style={{ width: '100%', overflowX: 'auto' }}>
              
              {/* TAB 1: VEHICLES DIRECTORY */}
              {activeTab === 'vehicles' && (
                filteredVehicles.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '48px 0', color: '#64748b' }}>
                    <Bus size={42} style={{ margin: '0 auto 12px', color: '#cbd5e1' }} />
                    <h4 style={{ margin: '0 0 6px', color: '#1e3a8a', fontSize: '1.1rem', fontWeight: 700 }}>No Vehicles Found</h4>
                    <p style={{ margin: 0, fontSize: '0.85rem' }}>Add school buses, vans or mini-buses using the "Add Vehicle" button.</p>
                  </div>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ borderBottom: '1.5px solid #e2e8f0', background: '#f8fafc' }}>
                        <th style={{ padding: '12px 16px', fontSize: '0.74rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Vehicle Number</th>
                        <th style={{ padding: '12px 16px', fontSize: '0.74rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Model & Type</th>
                        <th style={{ padding: '12px 16px', fontSize: '0.74rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Capacity</th>
                        <th style={{ padding: '12px 16px', fontSize: '0.74rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Fuel</th>
                        <th style={{ padding: '12px 16px', fontSize: '0.74rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Assigned Driver & Route</th>
                        <th style={{ padding: '12px 16px', fontSize: '0.74rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Fitness / Insurance</th>
                        <th style={{ padding: '12px 16px', fontSize: '0.74rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Status</th>
                        <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '0.74rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredVehicles.map((v) => (
                        <tr key={v._id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background-color 0.15s' }}>
                          <td style={{ padding: '14px 16px' }}>
                            <div style={{ fontWeight: 800, color: '#1e3a8a', fontSize: '0.92rem' }}>
                              {v.vehicleNumber}
                            </div>
                            <div style={{ fontSize: '0.72rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                              <Truck size={12} /> {v.vehicleType || 'Bus'}
                            </div>
                          </td>
                          <td style={{ padding: '14px 16px' }}>
                            <div style={{ fontWeight: 600, color: '#334155', fontSize: '0.86rem' }}>{v.model}</div>
                          </td>
                          <td style={{ padding: '14px 16px' }}>
                            <span style={{ background: '#eff6ff', color: '#1d4ed8', padding: '3px 9px', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 700 }}>
                              {v.capacity} Seats
                            </span>
                          </td>
                          <td style={{ padding: '14px 16px' }}>
                            <span style={{ 
                              padding: '3px 8px', borderRadius: '6px', fontSize: '0.74rem', fontWeight: 700,
                              background: v.fuelType === 'Electric' ? '#dcfce7' : v.fuelType === 'CNG' ? '#fef3c7' : '#f1f5f9',
                              color: v.fuelType === 'Electric' ? '#15803d' : v.fuelType === 'CNG' ? '#b45309' : '#475569'
                            }}>
                              {v.fuelType || 'Diesel'}
                            </span>
                          </td>
                          <td style={{ padding: '14px 16px' }}>
                            <div style={{ fontWeight: 700, color: '#1e293b', fontSize: '0.84rem' }}>
                              {v.assignedDriver || <span style={{ color: '#94a3b8', fontStyle: 'italic', fontWeight: 400 }}>Unassigned</span>}
                            </div>
                            <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '2px' }}>
                              {v.assignedRoute || 'No Route Pinned'}
                            </div>
                          </td>
                          <td style={{ padding: '14px 16px', fontSize: '0.78rem', color: '#64748b' }}>
                            <div>Fitness: <strong style={{ color: '#334155' }}>{v.fitnessExpiry || '2027-06-30'}</strong></div>
                            <div style={{ fontSize: '0.72rem' }}>Insurance: {v.insuranceExpiry || '2027-03-31'}</div>
                          </td>
                          <td style={{ padding: '14px 16px' }}>
                            <span style={{
                              padding: '4px 10px', borderRadius: '20px', fontSize: '0.74rem', fontWeight: 700,
                              background: v.status === 'Active' ? '#dcfce7' : v.status === 'Maintenance' ? '#fee2e2' : '#f1f5f9',
                              color: v.status === 'Active' ? '#15803d' : v.status === 'Maintenance' ? '#b91c1c' : '#475569',
                              display: 'inline-flex', alignItems: 'center', gap: '4px'
                            }}>
                              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'currentColor' }} />
                              {v.status || 'Active'}
                            </span>
                          </td>
                          <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                            <button
                              onClick={() => handleDeleteVehicle(v._id, v.vehicleNumber)}
                              title="Delete vehicle"
                              style={{
                                background: '#fef2f2', border: '1px solid #fee2e2', color: '#ef4444',
                                width: '32px', height: '32px', borderRadius: '8px', cursor: 'pointer',
                                display: 'inline-flex', alignItems: 'center', justifyContent: 'center'
                              }}
                            >
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )
              )}

              {/* TAB 2: DRIVERS & OPERATORS */}
              {activeTab === 'drivers' && (
                filteredDrivers.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '48px 0', color: '#64748b' }}>
                    <Shield size={42} style={{ margin: '0 auto 12px', color: '#cbd5e1' }} />
                    <h4 style={{ margin: '0 0 6px', color: '#1e3a8a', fontSize: '1.1rem', fontWeight: 700 }}>No Drivers Found</h4>
                    <p style={{ margin: 0, fontSize: '0.85rem' }}>Add certified drivers using the "Add Driver" button.</p>
                  </div>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ borderBottom: '1.5px solid #e2e8f0', background: '#f8fafc' }}>
                        <th style={{ padding: '12px 16px', fontSize: '0.74rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Driver Profile</th>
                        <th style={{ padding: '12px 16px', fontSize: '0.74rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Contact Phone</th>
                        <th style={{ padding: '12px 16px', fontSize: '0.74rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>License Number</th>
                        <th style={{ padding: '12px 16px', fontSize: '0.74rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Experience</th>
                        <th style={{ padding: '12px 16px', fontSize: '0.74rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Assigned Bus</th>
                        <th style={{ padding: '12px 16px', fontSize: '0.74rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Status</th>
                        <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '0.74rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredDrivers.map((d) => (
                        <tr key={d._id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background-color 0.15s' }}>
                          <td style={{ padding: '14px 16px' }}>
                            <div style={{ fontWeight: 800, color: '#1e3a8a', fontSize: '0.92rem' }}>
                              {d.name}
                            </div>
                            <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '2px' }}>
                              Valid till: {d.licenseExpiry || '2028-12-31'}
                            </div>
                          </td>
                          <td style={{ padding: '14px 16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#334155', fontWeight: 600, fontSize: '0.84rem' }}>
                              <Phone size={13} color="#0f766e" />
                              {d.contact}
                            </div>
                          </td>
                          <td style={{ padding: '14px 16px' }}>
                            <code style={{ background: '#f1f5f9', padding: '3px 8px', borderRadius: '6px', fontSize: '0.78rem', color: '#475569', fontWeight: 700 }}>
                              {d.licenseNumber}
                            </code>
                          </td>
                          <td style={{ padding: '14px 16px' }}>
                            <span style={{ fontSize: '0.84rem', fontWeight: 700, color: '#1e293b' }}>
                              {d.experienceYears} Years
                            </span>
                          </td>
                          <td style={{ padding: '14px 16px' }}>
                            <div style={{ fontWeight: 700, color: '#0f766e', fontSize: '0.84rem' }}>
                              {d.assignedBus || <span style={{ color: '#94a3b8', fontStyle: 'italic', fontWeight: 400 }}>No Bus Assigned</span>}
                            </div>
                            <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                              {d.assignedRoute || 'Flexible Line'}
                            </div>
                          </td>
                          <td style={{ padding: '14px 16px' }}>
                            <span style={{
                              padding: '4px 10px', borderRadius: '20px', fontSize: '0.74rem', fontWeight: 700,
                              background: d.status === 'On Duty' ? '#ccfbf1' : d.status === 'Available' ? '#eff6ff' : '#fef3c7',
                              color: d.status === 'On Duty' ? '#0f766e' : d.status === 'Available' ? '#1d4ed8' : '#b45309',
                              display: 'inline-flex', alignItems: 'center', gap: '4px'
                            }}>
                              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'currentColor' }} />
                              {d.status || 'On Duty'}
                            </span>
                          </td>
                          <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                            <button
                              onClick={() => handleDeleteDriver(d._id, d.name)}
                              title="Delete driver profile"
                              style={{
                                background: '#fef2f2', border: '1px solid #fee2e2', color: '#ef4444',
                                width: '32px', height: '32px', borderRadius: '8px', cursor: 'pointer',
                                display: 'inline-flex', alignItems: 'center', justifyContent: 'center'
                              }}
                            >
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )
              )}

              {/* TAB 3: LIVE ACTIVE ROUTES */}
              {activeTab === 'routes' && (
                filteredRoutes.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '48px 0', color: '#64748b' }}>
                    <Navigation size={42} style={{ margin: '0 auto 12px', color: '#cbd5e1' }} />
                    <h4 style={{ margin: '0 0 6px', color: '#1e3a8a', fontSize: '1.1rem', fontWeight: 700 }}>No Routes Recorded</h4>
                    <p style={{ margin: 0, fontSize: '0.85rem' }}>Set up commuter lines in the route manager.</p>
                  </div>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ borderBottom: '1.5px solid #e2e8f0', background: '#f8fafc' }}>
                        <th style={{ padding: '12px 16px', fontSize: '0.74rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Route & Line</th>
                        <th style={{ padding: '12px 16px', fontSize: '0.74rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Bus & Driver</th>
                        <th style={{ padding: '12px 16px', fontSize: '0.74rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Timing & Stops</th>
                        <th style={{ padding: '12px 16px', fontSize: '0.74rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Capacity Occupancy</th>
                        <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '0.74rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRoutes.map((route, i) => (
                        <tr key={route._id || i} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background-color 0.15s' }}>
                          <td style={{ padding: '14px 16px' }}>
                            <div style={{ fontWeight: 800, color: '#1e3a8a', fontSize: '0.92rem' }}>{route.routeId}</div>
                            <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '2px' }}>{route.name}</div>
                          </td>
                          <td style={{ padding: '14px 16px' }}>
                            <div style={{ fontWeight: 700, color: '#334155', fontSize: '0.86rem' }}>{route.busNumber}</div>
                            <div style={{ fontSize: '0.76rem', color: '#64748b' }}>{route.driverName}</div>
                          </td>
                          <td style={{ padding: '14px 16px' }}>
                            <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#334155' }}>{route.timing}</div>
                            <div style={{ fontSize: '0.74rem', color: '#64748b' }}>{route.stops} Pick-up Stops • {route.distance || '10 km'}</div>
                          </td>
                          <td style={{ padding: '14px 16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <div style={{ flex: 1, height: '6px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden', minWidth: '70px' }}>
                                <div style={{ 
                                  height: '100%', 
                                  background: ((route.studentsAssigned || 30) / (route.capacity || 40)) > 0.9 ? '#DC2626' : '#16A34A', 
                                  width: `${Math.min(100, ((route.studentsAssigned || 30) / (route.capacity || 40)) * 100)}%` 
                                }} />
                              </div>
                              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155' }}>
                                {route.studentsAssigned || 30}/{route.capacity || 40}
                              </span>
                            </div>
                          </td>
                          <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                            <span style={{ 
                              padding: '4px 10px', borderRadius: '20px', fontSize: '0.74rem', fontWeight: 700, 
                              backgroundColor: route.status === 'On Time' ? '#dcfce7' : route.status === 'Completed' ? '#f1f5f9' : '#fef3c7', 
                              color: route.status === 'On Time' ? '#16A34A' : route.status === 'Completed' ? '#64748b' : '#d97706' 
                            }}>
                              {route.status || 'On Time'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )
              )}

            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Deployment Curves & Maintenance Alerts */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Fleet Status Curve */}
          <div className="card" style={{ background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '20px 22px', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div style={{ fontWeight: 800, color: '#1e293b', fontSize: '0.96rem' }}>Fleet Deployment Curve</div>
              <span style={{ fontSize: '0.72rem', background: '#fef3c7', color: '#b45309', padding: '2px 8px', borderRadius: '6px', fontWeight: 700 }}>Peak Hours</span>
            </div>
            <div style={{ height: '190px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={fleetStatusData} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="fleetGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#4F46E5" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748B' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748B' }} />
                  <Tooltip />
                  <Area type="monotone" dataKey="active" stroke="#4F46E5" fill="url(#fleetGradient)" strokeWidth={2.5} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Maintenance & Compliance Alerts */}
          <div className="card" style={{ background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '20px 22px', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <Wrench size={18} color="#DC2626" />
              <div style={{ fontWeight: 800, color: '#1e293b', fontSize: '0.96rem' }}>Fleet Service & Compliance</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {vehicles.filter(v => v.status === 'Maintenance').length > 0 ? (
                vehicles.filter(v => v.status === 'Maintenance').map((m, i) => (
                  <div key={i} style={{ padding: '12px 14px', background: '#fef2f2', borderRadius: '10px', border: '1px solid #fee2e2', borderLeft: '4px solid #ef4444' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontWeight: 800, color: '#991b1b', fontSize: '0.88rem' }}>{m.vehicleNumber}</span>
                      <span style={{ fontSize: '0.72rem', color: '#b91c1c', fontWeight: 700, background: '#fee2e2', padding: '1px 7px', borderRadius: '6px' }}>In Garage</span>
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#64748b' }}>{m.model} • Scheduled for Routine Maintenance</div>
                  </div>
                ))
              ) : (
                <div style={{ padding: '12px 14px', background: '#f0fdf4', borderRadius: '10px', border: '1px solid #dcfce7', borderLeft: '4px solid #16a34a' }}>
                  <div style={{ fontWeight: 700, color: '#166534', fontSize: '0.85rem' }}>All Vehicles Road-Ready</div>
                  <div style={{ fontSize: '0.78rem', color: '#64748b' }}>No active mechanical breakdowns reported.</div>
                </div>
              )}

              {/* Reminders */}
              <div style={{ padding: '12px 14px', background: '#fffbeb', borderRadius: '10px', border: '1px solid #fef3c7', borderLeft: '4px solid #F59E0B' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontWeight: 800, color: '#92400e', fontSize: '0.86rem' }}>Fleet Fitness Verification</span>
                  <span style={{ fontSize: '0.72rem', color: '#d97706', fontWeight: 700, background: '#fef3c7', padding: '1px 7px', borderRadius: '6px' }}>Annual</span>
                </div>
                <div style={{ fontSize: '0.78rem', color: '#78350f' }}>RTO compliance verified for academic year 2026-27.</div>
              </div>
            </div>
          </div>

          {/* Quick Dispatch Card */}
          <div className="card" style={{
            background: 'white',
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            padding: '20px 22px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.02)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Phone size={16} color="#2563eb" />
              </div>
              <div>
                <div style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#64748b' }}>
                  Transport Helpdesk & Dispatch
                </div>
                <div style={{ fontSize: '0.96rem', fontWeight: 800, color: '#1e293b' }}>
                  Emergency SOS Hotline
                </div>
              </div>
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 14px',
              background: '#f8fafc',
              borderRadius: '10px',
              border: '1px solid #e2e8f0'
            }}>
              <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>Hotline Dispatch:</span>
              <a href="tel:+9102228559000" style={{ fontSize: '0.92rem', fontWeight: 800, color: '#2563eb', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <Phone size={14} /> +91 (022) 2855-9000
              </a>
            </div>
          </div>

        </div>
      </div>

      {/* ======================================================== */}
      {/* MODAL: ADD VEHICLE */}
      {/* ======================================================== */}
      {isAddVehicleOpen && createPortal(
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(8px)',
          zIndex: 999999, display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            background: '#ffffff', borderRadius: '24px', width: '580px', maxWidth: '95vw',
            maxHeight: '90vh', overflowY: 'auto', padding: '26px 30px',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', border: '1px solid rgba(226, 232, 240, 0.9)',
            display: 'flex', flexDirection: 'column'
          }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', paddingBottom: '14px', borderBottom: '1px solid #f1f5f9' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(217, 119, 6, 0.15) 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Bus size={22} color="#d97706" />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#1e3a8a' }}>Register New Vehicle</h3>
                  <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: '#64748b' }}>Add a school bus, mini-bus, or commuter van to fleet</p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setIsAddVehicleOpen(false)}
                style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: '34px', height: '34px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748b', transition: 'all 0.15s' }}
                onMouseOver={e => e.currentTarget.style.background = '#e2e8f0'}
                onMouseOut={e => e.currentTarget.style.background = '#f1f5f9'}
              >
                <X size={18} />
              </button>
            </div>

            {formError && (
              <div style={{ padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', color: '#b91c1c', fontSize: '0.84rem', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertCircle size={16} /> {formError}
              </div>
            )}

            <form onSubmit={handleAddVehicle} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              
              {/* Section 1: Vehicle Basic Details */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#475569', marginBottom: '5px' }}>
                    Vehicle Reg Number *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. MH-04-AB-1234"
                    value={vehicleForm.vehicleNumber}
                    onChange={e => setVehicleForm({ ...vehicleForm, vehicleNumber: e.target.value.toUpperCase() })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '10px', border: '1.5px solid #e2e8f0', fontSize: '0.88rem', fontWeight: 700, color: '#1e293b', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#475569', marginBottom: '5px' }}>
                    Vehicle Type
                  </label>
                  <select
                    value={vehicleForm.vehicleType}
                    onChange={e => setVehicleForm({ ...vehicleForm, vehicleType: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '10px', border: '1.5px solid #e2e8f0', fontSize: '0.88rem', outline: 'none', background: 'white', boxSizing: 'border-box' }}
                  >
                    <option value="Bus">School Bus</option>
                    <option value="Mini Bus">Mini Bus</option>
                    <option value="Van">Van / Traveller</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#475569', marginBottom: '5px' }}>
                    Make & Model Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Tata Starbus 45"
                    value={vehicleForm.model}
                    onChange={e => setVehicleForm({ ...vehicleForm, model: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '10px', border: '1.5px solid #e2e8f0', fontSize: '0.88rem', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#475569', marginBottom: '5px' }}>
                    Seats Capacity
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="90"
                    value={vehicleForm.capacity}
                    onChange={e => setVehicleForm({ ...vehicleForm, capacity: Number(e.target.value) })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '10px', border: '1.5px solid #e2e8f0', fontSize: '0.88rem', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#475569', marginBottom: '5px' }}>
                    Fuel Type
                  </label>
                  <select
                    value={vehicleForm.fuelType}
                    onChange={e => setVehicleForm({ ...vehicleForm, fuelType: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '10px', border: '1.5px solid #e2e8f0', fontSize: '0.88rem', outline: 'none', background: 'white', boxSizing: 'border-box' }}
                  >
                    <option value="Diesel">Diesel</option>
                    <option value="CNG">CNG</option>
                    <option value="Electric">Electric</option>
                    <option value="Petrol">Petrol</option>
                  </select>
                </div>
              </div>

              {/* Section 2: Route & Crew Deployment Box */}
              <div style={{ padding: '14px 16px', background: '#fefce8', borderRadius: '14px', border: '1.5px solid #fef08a' }}>
                <div style={{ fontSize: '0.76rem', fontWeight: 800, color: '#a16207', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Navigation size={14} /> Route & Driver Deployment
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                      Assign Commuter Line (Optional)
                    </label>
                    <select
                      value={vehicleForm.assignedRoute}
                      onChange={e => setVehicleForm({ ...vehicleForm, assignedRoute: e.target.value })}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '0.86rem', outline: 'none', background: 'white', boxSizing: 'border-box' }}
                    >
                      <option value="">-- No Route Assigned --</option>
                      {routes.map(r => (
                        <option key={r._id || r.routeId} value={`${r.routeId} (${r.name})`}>
                          {r.routeId} - {r.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                      Assign Driver (Optional)
                    </label>
                    <select
                      value={vehicleForm.assignedDriver}
                      onChange={e => setVehicleForm({ ...vehicleForm, assignedDriver: e.target.value })}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '0.86rem', outline: 'none', background: 'white', boxSizing: 'border-box' }}
                    >
                      <option value="">-- No Driver Assigned --</option>
                      {drivers.map(d => (
                        <option key={d._id || d.name} value={d.name}>
                          {d.name} ({d.contact})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Section 3: Compliance & Status */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: '#475569', marginBottom: '5px' }}>
                    Fitness Expiry
                  </label>
                  <input
                    type="date"
                    value={vehicleForm.fitnessExpiry}
                    onChange={e => setVehicleForm({ ...vehicleForm, fitnessExpiry: e.target.value })}
                    style={{ width: '100%', padding: '9px 10px', borderRadius: '10px', border: '1.5px solid #e2e8f0', fontSize: '0.84rem', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: '#475569', marginBottom: '5px' }}>
                    Insurance Expiry
                  </label>
                  <input
                    type="date"
                    value={vehicleForm.insuranceExpiry}
                    onChange={e => setVehicleForm({ ...vehicleForm, insuranceExpiry: e.target.value })}
                    style={{ width: '100%', padding: '9px 10px', borderRadius: '10px', border: '1.5px solid #e2e8f0', fontSize: '0.84rem', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: '#475569', marginBottom: '5px' }}>
                    Road Status
                  </label>
                  <select
                    value={vehicleForm.status}
                    onChange={e => setVehicleForm({ ...vehicleForm, status: e.target.value })}
                    style={{ width: '100%', padding: '9px 10px', borderRadius: '10px', border: '1.5px solid #e2e8f0', fontSize: '0.84rem', outline: 'none', background: 'white', boxSizing: 'border-box' }}
                  >
                    <option value="Active">Active (On Road)</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="In Service">In Service</option>
                    <option value="Standby">Standby / Spare</option>
                  </select>
                </div>
              </div>

              {/* Footer */}
              <div style={{ display: 'flex', gap: '12px', marginTop: '6px', paddingTop: '14px', borderTop: '1px solid #f1f5f9', justifyContent: 'flex-end', alignItems: 'center' }}>
                <button
                  type="button"
                  onClick={() => setIsAddVehicleOpen(false)}
                  style={{ padding: '9px 18px', borderRadius: '10px', border: '1.5px solid #cbd5e1', background: '#f8fafc', fontWeight: 700, fontSize: '0.86rem', cursor: 'pointer', color: '#475569' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{
                    padding: '9px 22px', borderRadius: '10px', border: 'none',
                    background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                    color: 'white', fontWeight: 700, fontSize: '0.86rem',
                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
                    boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)',
                    display: 'inline-flex', alignItems: 'center', gap: '6px'
                  }}
                >
                  <Bus size={16} />
                  {isSubmitting ? 'Saving...' : 'Add Vehicle to Fleet'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* ======================================================== */}
      {/* MODAL: ADD DRIVER */}
      {/* ======================================================== */}
      {isAddDriverOpen && createPortal(
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(8px)',
          zIndex: 999999, display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            background: '#ffffff', borderRadius: '24px', width: '580px', maxWidth: '95vw',
            maxHeight: '90vh', overflowY: 'auto', padding: '26px 30px',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', border: '1px solid rgba(226, 232, 240, 0.9)',
            display: 'flex', flexDirection: 'column'
          }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', paddingBottom: '14px', borderBottom: '1px solid #f1f5f9' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'linear-gradient(135deg, rgba(15, 118, 110, 0.15) 0%, rgba(13, 148, 136, 0.15) 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Shield size={22} color="#0f766e" />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#1e3a8a' }}>Register New Driver</h3>
                  <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: '#64748b' }}>Add verified commercial driver and assign to school fleet</p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setIsAddDriverOpen(false)}
                style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: '34px', height: '34px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748b', transition: 'all 0.15s' }}
                onMouseOver={e => e.currentTarget.style.background = '#e2e8f0'}
                onMouseOut={e => e.currentTarget.style.background = '#f1f5f9'}
              >
                <X size={18} />
              </button>
            </div>

            {formError && (
              <div style={{ padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', color: '#b91c1c', fontSize: '0.84rem', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertCircle size={16} /> {formError}
              </div>
            )}

            <form onSubmit={handleAddDriver} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              
              {/* Section 1: Personal & Phone */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#475569', marginBottom: '5px' }}>
                    Driver Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ramesh Singh"
                    value={driverForm.name}
                    onChange={e => setDriverForm({ ...driverForm, name: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '10px', border: '1.5px solid #e2e8f0', fontSize: '0.88rem', fontWeight: 700, color: '#1e293b', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#475569', marginBottom: '5px' }}>
                    Mobile Phone *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="+91 98200 44551"
                    value={driverForm.contact}
                    onChange={e => setDriverForm({ ...driverForm, contact: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '10px', border: '1.5px solid #e2e8f0', fontSize: '0.88rem', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              {/* Section 2: Commercial License Card */}
              <div style={{ padding: '14px 16px', background: '#f8fafc', borderRadius: '14px', border: '1.5px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.76rem', fontWeight: 800, color: '#0f766e', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Shield size={14} /> Commercial License & Experience
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1.1fr 0.9fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                      License Number *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. MH-0420180019284"
                      value={driverForm.licenseNumber}
                      onChange={e => setDriverForm({ ...driverForm, licenseNumber: e.target.value.toUpperCase() })}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '0.86rem', fontWeight: 700, outline: 'none', boxSizing: 'border-box' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                      Valid Till
                    </label>
                    <input
                      type="date"
                      value={driverForm.licenseExpiry}
                      onChange={e => setDriverForm({ ...driverForm, licenseExpiry: e.target.value })}
                      style={{ width: '100%', padding: '9px 10px', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '0.84rem', outline: 'none', boxSizing: 'border-box' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                      Experience
                    </label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type="number"
                        min="1"
                        max="50"
                        value={driverForm.experienceYears}
                        onChange={e => setDriverForm({ ...driverForm, experienceYears: Number(e.target.value) })}
                        style={{ width: '100%', padding: '9px 34px 9px 10px', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '0.86rem', outline: 'none', boxSizing: 'border-box' }}
                      />
                      <span style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', fontSize: '0.74rem', color: '#64748b', fontWeight: 700, pointerEvents: 'none' }}>
                        Yrs
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 3: Bus & Route Deployment Card */}
              <div style={{ padding: '14px 16px', background: '#f0fdf4', borderRadius: '14px', border: '1.5px solid #bbf7d0' }}>
                <div style={{ fontSize: '0.76rem', fontWeight: 800, color: '#15803d', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Bus size={14} /> Fleet & Route Allocation
                </div>
                
                {/* 2-column layout for Vehicle and Route so text does not get truncated */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '10px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                      Assign Vehicle
                    </label>
                    <select
                      value={driverForm.assignedBus}
                      onChange={e => setDriverForm({ ...driverForm, assignedBus: e.target.value })}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '0.86rem', outline: 'none', background: 'white', boxSizing: 'border-box' }}
                    >
                      <option value="">-- No Bus Assigned --</option>
                      {vehicles.map(v => (
                        <option key={v._id || v.vehicleNumber} value={v.vehicleNumber}>
                          {v.vehicleNumber} ({v.model})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                      Assign Commuter Route
                    </label>
                    <select
                      value={driverForm.assignedRoute}
                      onChange={e => setDriverForm({ ...driverForm, assignedRoute: e.target.value })}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '0.86rem', outline: 'none', background: 'white', boxSizing: 'border-box' }}
                    >
                      <option value="">-- No Route Assigned --</option>
                      {routes.map(r => (
                        <option key={r._id || r.routeId} value={`${r.routeId} (${r.name})`}>
                          {r.routeId} - {r.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Duty Status Row */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', alignItems: 'center' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                      Duty Status
                    </label>
                    <select
                      value={driverForm.status}
                      onChange={e => setDriverForm({ ...driverForm, status: e.target.value })}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '0.86rem', outline: 'none', background: 'white', boxSizing: 'border-box' }}
                    >
                      <option value="On Duty">On Duty</option>
                      <option value="Available">Available (Relief)</option>
                      <option value="On Leave">On Leave</option>
                    </select>
                  </div>

                  <div style={{ fontSize: '0.76rem', color: '#15803d', background: '#dcfce7', padding: '8px 12px', borderRadius: '8px', border: '1px solid #bbf7d0', marginTop: '16px' }}>
                    ✓ Driver profile links directly to live route tracking.
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div style={{ display: 'flex', gap: '12px', marginTop: '6px', paddingTop: '14px', borderTop: '1px solid #f1f5f9', justifyContent: 'flex-end', alignItems: 'center' }}>
                <button
                  type="button"
                  onClick={() => setIsAddDriverOpen(false)}
                  style={{ padding: '9px 18px', borderRadius: '10px', border: '1.5px solid #cbd5e1', background: '#f8fafc', fontWeight: 700, fontSize: '0.86rem', cursor: 'pointer', color: '#475569' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{
                    padding: '9px 22px', borderRadius: '10px', border: 'none',
                    background: 'linear-gradient(135deg, #0F766E 0%, #0d9488 100%)',
                    color: 'white', fontWeight: 700, fontSize: '0.86rem',
                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
                    boxShadow: '0 4px 14px rgba(15, 118, 110, 0.3)',
                    display: 'inline-flex', alignItems: 'center', gap: '6px'
                  }}
                >
                  <UserPlus size={16} />
                  {isSubmitting ? 'Saving...' : 'Register Driver Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
};

export default TransportDashboard;
