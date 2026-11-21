const express = require('express');
const router = express.Router();
const TransportRoute = require('../models/TransportRoute');
const Vehicle = require('../models/Vehicle');
const Driver = require('../models/Driver');
const Student = require('../models/Student');

// Seed helper if tenant has 0 routes, vehicles, or drivers
const seedInitialTransportIfEmpty = async (entityId) => {
  if (!entityId) return;

  const sampleRoutes = [
    { 
      routeId: 'RT-01', 
      name: 'Andheri West Express', 
      start: 'Lokhandwala Complex', 
      end: 'School Campus', 
      stops: 8, 
      stopNames: ['Lokhandwala Circle', 'Infinity Mall', 'Four Bungalows', 'DN Nagar Metro', 'Bhavans College', 'Versova Junction', 'Juhu Circle', 'School Campus'],
      busNumber: 'MH-04-1234', 
      driverName: 'Ramesh Singh', 
      driverContact: '+91 98200 44551', 
      timing: '06:45 AM - 07:30 AM', 
      studentsAssigned: 42, 
      capacity: 45, 
      distance: '12 km', 
      status: 'On Time', 
      entityId 
    },
    { 
      routeId: 'RT-02', 
      name: 'Bandra East Route', 
      start: 'BKC Business Hub', 
      end: 'School Campus', 
      stops: 6, 
      stopNames: ['BKC Business Hub', 'Kalanagar Junction', 'Bandra Station East', 'Kherwadi Signal', 'SVT College Road', 'School Campus'],
      busNumber: 'MH-04-5678', 
      driverName: 'Suresh Kumar', 
      driverContact: '+91 98200 44552', 
      timing: '06:30 AM - 07:30 AM', 
      studentsAssigned: 38, 
      capacity: 40, 
      distance: '15 km', 
      status: 'Delayed', 
      entityId 
    },
    { 
      routeId: 'RT-03', 
      name: 'Borivali North Line', 
      start: 'IC Colony Metro', 
      end: 'School Campus', 
      stops: 6, 
      stopNames: ['IC Colony Metro', 'Borivali Station West', 'Eksar Road', 'Shimpoli Signal', 'Kandivali Link Rd', 'School Campus'],
      busNumber: 'MH-04-9012', 
      driverName: 'Kishore Mathur', 
      driverContact: '+91 98200 44553', 
      timing: '06:15 AM - 07:30 AM', 
      studentsAssigned: 45, 
      capacity: 45, 
      distance: '18 km', 
      status: 'On Time', 
      entityId 
    },
    { 
      routeId: 'RT-04', 
      name: 'Goregaon Central', 
      start: 'Goregaon Station Road', 
      end: 'School Campus', 
      stops: 5, 
      stopNames: ['Goregaon Station Road', 'Inorbit Mall Signal', 'Bangur Nagar', 'Oshiwara Bridge', 'School Campus'],
      busNumber: 'MH-04-3456', 
      driverName: 'Vinod Patil', 
      driverContact: '+91 98200 44554', 
      timing: '06:50 AM - 07:25 AM', 
      studentsAssigned: 28, 
      capacity: 30, 
      distance: '8 km', 
      status: 'Completed', 
      entityId 
    },
    { 
      routeId: 'RT-05', 
      name: 'Juhu Circle Bus', 
      start: 'Juhu Beach Road', 
      end: 'School Campus', 
      stops: 5, 
      stopNames: ['Juhu Beach Road', 'JVPD Scheme', 'Mithibai College', 'Gulmohar Cross Road', 'School Campus'],
      busNumber: 'MH-04-7777', 
      driverName: 'Rajesh Sharma', 
      driverContact: '+91 98200 44555', 
      timing: '06:40 AM - 07:20 AM', 
      studentsAssigned: 35, 
      capacity: 40, 
      distance: '10 km', 
      status: 'On Time', 
      entityId 
    },
  ];

  const routeCount = await TransportRoute.countDocuments({ entityId });
  if (routeCount === 0) {
    await TransportRoute.insertMany(sampleRoutes).catch(() => {});
  } else {
    // Backfill stopNames for existing routes if empty
    for (const sr of sampleRoutes) {
      await TransportRoute.updateOne(
        { entityId, routeId: sr.routeId, $or: [{ stopNames: { $exists: false } }, { stopNames: { $size: 0 } }] },
        { $set: { stopNames: sr.stopNames, stopsList: sr.stopNames.map(s => ({ stopName: s, pickupTime: '' })) } }
      ).catch(() => {});
    }
  }

  const vehicleCount = await Vehicle.countDocuments({ entityId });
  if (vehicleCount === 0) {
    const sampleVehicles = [
      { vehicleNumber: 'MH-04-1234', model: 'Tata Starbus Ultra 45', vehicleType: 'Bus', capacity: 45, fuelType: 'Diesel', insuranceExpiry: '2027-04-30', fitnessExpiry: '2027-08-15', assignedRoute: 'RT-01 (Andheri West Express)', assignedDriver: 'Ramesh Singh', status: 'Active', entityId },
      { vehicleNumber: 'MH-04-5678', model: 'Ashok Leyland Falcon', vehicleType: 'Bus', capacity: 40, fuelType: 'CNG', insuranceExpiry: '2026-12-15', fitnessExpiry: '2026-11-20', assignedRoute: 'RT-02 (Bandra East Route)', assignedDriver: 'Suresh Kumar', status: 'Maintenance', entityId },
      { vehicleNumber: 'MH-04-9012', model: 'Eicher Skyline Pro', vehicleType: 'Bus', capacity: 45, fuelType: 'Diesel', insuranceExpiry: '2027-09-10', fitnessExpiry: '2027-10-01', assignedRoute: 'RT-03 (Borivali North Line)', assignedDriver: 'Kishore Mathur', status: 'Active', entityId },
      { vehicleNumber: 'MH-04-3456', model: 'Force Traveller Mini 30', vehicleType: 'Mini Bus', capacity: 30, fuelType: 'CNG', insuranceExpiry: '2027-05-18', fitnessExpiry: '2027-07-22', assignedRoute: 'RT-04 (Goregaon Central)', assignedDriver: 'Vinod Patil', status: 'Active', entityId },
      { vehicleNumber: 'MH-04-7777', model: 'Tata Marcopolo Electric', vehicleType: 'Bus', capacity: 40, fuelType: 'Electric', insuranceExpiry: '2027-11-30', fitnessExpiry: '2028-01-15', assignedRoute: 'RT-05 (Juhu Circle Bus)', assignedDriver: 'Rajesh Sharma', status: 'Active', entityId },
    ];
    await Vehicle.insertMany(sampleVehicles).catch(() => {});
  }

  const driverCount = await Driver.countDocuments({ entityId });
  if (driverCount === 0) {
    const sampleDrivers = [
      { name: 'Ramesh Singh', contact: '+91 98200 44551', licenseNumber: 'MH-0420160019284', licenseExpiry: '2028-05-14', experienceYears: 8, assignedBus: 'MH-04-1234', assignedRoute: 'RT-01 (Andheri West Express)', status: 'On Duty', entityId },
      { name: 'Suresh Kumar', contact: '+91 98200 44552', licenseNumber: 'MH-0420170028472', licenseExpiry: '2027-09-30', experienceYears: 6, assignedBus: 'MH-04-5678', assignedRoute: 'RT-02 (Bandra East Route)', status: 'On Duty', entityId },
      { name: 'Kishore Mathur', contact: '+91 98200 44553', licenseNumber: 'MH-0420140039281', licenseExpiry: '2029-02-18', experienceYears: 10, assignedBus: 'MH-04-9012', assignedRoute: 'RT-03 (Borivali North Line)', status: 'On Duty', entityId },
      { name: 'Vinod Patil', contact: '+91 98200 44554', licenseNumber: 'MH-0420190048291', licenseExpiry: '2028-11-05', experienceYears: 5, assignedBus: 'MH-04-3456', assignedRoute: 'RT-04 (Goregaon Central)', status: 'On Duty', entityId },
      { name: 'Rajesh Sharma', contact: '+91 98200 44555', licenseNumber: 'MH-0420150058291', licenseExpiry: '2027-08-20', experienceYears: 9, assignedBus: 'MH-04-7777', assignedRoute: 'RT-05 (Juhu Circle Bus)', status: 'On Duty', entityId },
    ];
    await Driver.insertMany(sampleDrivers).catch(() => {});
  }
};

// ================= ROUTES ENDPOINTS =================

// GET /api/transport/routes
router.get('/routes', async (req, res) => {
  try {
    const entityId = req.entityId || 'default';
    await seedInitialTransportIfEmpty(entityId);
    const { search } = req.query;
    const query = { entityId };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { routeId: { $regex: search, $options: 'i' } },
        { start: { $regex: search, $options: 'i' } },
        { driverName: { $regex: search, $options: 'i' } },
        { busNumber: { $regex: search, $options: 'i' } },
      ];
    }

    const routes = await TransportRoute.find(query).sort({ routeId: 1 });
    res.json(routes);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// POST /api/transport/routes
router.post('/routes', async (req, res) => {
  try {
    const entityId = req.entityId || 'default';
    const { 
      name, 
      start, 
      end = 'School Campus', 
      stops = 5, 
      stopNames = [],
      stopsList = [],
      busNumber, 
      driverName, 
      driverContact, 
      timing, 
      capacity = 40, 
      distance = '10 km' 
    } = req.body;

    if (!name || !start || !busNumber || !driverName) {
      return res.status(400).json({ message: 'Route name, start, bus number, and driver name are required' });
    }

    let formattedStopNames = [];
    if (Array.isArray(stopNames)) {
      formattedStopNames = stopNames.map(s => (typeof s === 'string' ? s.trim() : (s?.stopName || ''))).filter(Boolean);
    } else if (typeof stopNames === 'string' && stopNames.trim()) {
      formattedStopNames = stopNames.split(',').map(s => s.trim()).filter(Boolean);
    }

    const calculatedStops = formattedStopNames.length > 0 ? formattedStopNames.length : (Number(stops) || 5);

    const formattedStopsList = Array.isArray(stopsList) && stopsList.length > 0
      ? stopsList
      : formattedStopNames.map(s => ({ stopName: s, pickupTime: '' }));

    const count = await TransportRoute.countDocuments({ entityId });
    const routeId = `RT-0${count + 1}`;

    const route = new TransportRoute({
      routeId,
      name: name.trim(),
      start: start.trim(),
      end: end.trim(),
      stops: calculatedStops,
      stopNames: formattedStopNames,
      stopsList: formattedStopsList,
      busNumber: busNumber.trim(),
      driverName: driverName.trim(),
      driverContact: driverContact ? driverContact.trim() : '',
      timing: timing || '07:00 AM - 08:00 AM',
      capacity: Number(capacity) || 40,
      distance: distance.trim(),
      studentsAssigned: 0,
      status: 'On Time',
      entityId,
    });

    await route.save();
    res.status(201).json(route);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create route', error: error.message });
  }
});

// DELETE /api/transport/routes/:id
router.delete('/routes/:id', async (req, res) => {
  try {
    const entityId = req.entityId || 'default';
    const deleted = await TransportRoute.findOneAndDelete({ _id: req.params.id, entityId });
    if (!deleted) {
      return res.status(404).json({ message: 'Route not found' });
    }
    res.json({ message: 'Route deleted successfully', route: deleted });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete route', error: error.message });
  }
});

// PUT /api/transport/routes/:id (Update route details, status, or driver/bus)
router.put('/routes/:id', async (req, res) => {
  try {
    const entityId = req.entityId || 'default';
    const updated = await TransportRoute.findOneAndUpdate(
      { _id: req.params.id, entityId },
      { $set: req.body },
      { new: true }
    );
    if (!updated) {
      return res.status(404).json({ message: 'Route not found' });
    }
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update route', error: error.message });
  }
});

// ================= VEHICLES ENDPOINTS =================

// GET /api/transport/vehicles
router.get('/vehicles', async (req, res) => {
  try {
    const entityId = req.entityId || 'default';
    await seedInitialTransportIfEmpty(entityId);
    const { search } = req.query;
    const query = { entityId };

    if (search) {
      query.$or = [
        { vehicleNumber: { $regex: search, $options: 'i' } },
        { model: { $regex: search, $options: 'i' } },
        { vehicleType: { $regex: search, $options: 'i' } },
        { assignedRoute: { $regex: search, $options: 'i' } },
        { assignedDriver: { $regex: search, $options: 'i' } },
        { status: { $regex: search, $options: 'i' } },
      ];
    }

    const vehicles = await Vehicle.find(query).sort({ createdAt: -1 });
    res.json(vehicles);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// POST /api/transport/vehicles
router.post('/vehicles', async (req, res) => {
  try {
    const entityId = req.entityId || 'default';
    const {
      vehicleNumber,
      model = 'Tata Starbus 40-Seater',
      vehicleType = 'Bus',
      capacity = 40,
      fuelType = 'Diesel',
      insuranceExpiry,
      fitnessExpiry,
      assignedRoute = '',
      assignedDriver = '',
      status = 'Active',
    } = req.body;

    if (!vehicleNumber || !vehicleNumber.trim()) {
      return res.status(400).json({ message: 'Vehicle registration / bus number is required' });
    }

    // Check duplicate
    const existing = await Vehicle.findOne({
      entityId,
      vehicleNumber: { $regex: `^${vehicleNumber.trim()}$`, $options: 'i' },
    });
    if (existing) {
      return res.status(400).json({ message: `Vehicle with number "${vehicleNumber.trim()}" is already registered` });
    }

    const vehicle = new Vehicle({
      vehicleNumber: vehicleNumber.trim().toUpperCase(),
      model: model.trim(),
      vehicleType,
      capacity: Number(capacity) || 40,
      fuelType,
      insuranceExpiry: insuranceExpiry || '2027-03-31',
      fitnessExpiry: fitnessExpiry || '2027-06-30',
      assignedRoute: assignedRoute.trim(),
      assignedDriver: assignedDriver.trim(),
      status,
      entityId,
    });

    await vehicle.save();
    res.status(201).json(vehicle);
  } catch (error) {
    res.status(500).json({ message: 'Failed to add vehicle', error: error.message });
  }
});

// DELETE /api/transport/vehicles/:id
router.delete('/vehicles/:id', async (req, res) => {
  try {
    const entityId = req.entityId || 'default';
    const deleted = await Vehicle.findOneAndDelete({ _id: req.params.id, entityId });
    if (!deleted) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }
    res.json({ message: 'Vehicle deleted successfully', vehicle: deleted });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete vehicle', error: error.message });
  }
});

// PUT /api/transport/vehicles/:id (Update vehicle, status, or driver/route assignments)
router.put('/vehicles/:id', async (req, res) => {
  try {
    const entityId = req.entityId || 'default';
    const updated = await Vehicle.findOneAndUpdate(
      { _id: req.params.id, entityId },
      { $set: req.body },
      { new: true }
    );
    if (!updated) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update vehicle', error: error.message });
  }
});

// ================= DRIVERS ENDPOINTS =================

// GET /api/transport/drivers
router.get('/drivers', async (req, res) => {
  try {
    const entityId = req.entityId || 'default';
    await seedInitialTransportIfEmpty(entityId);
    const { search } = req.query;
    const query = { entityId };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { contact: { $regex: search, $options: 'i' } },
        { licenseNumber: { $regex: search, $options: 'i' } },
        { assignedBus: { $regex: search, $options: 'i' } },
        { assignedRoute: { $regex: search, $options: 'i' } },
        { status: { $regex: search, $options: 'i' } },
      ];
    }

    const drivers = await Driver.find(query).sort({ createdAt: -1 });
    res.json(drivers);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// POST /api/transport/drivers
router.post('/drivers', async (req, res) => {
  try {
    const entityId = req.entityId || 'default';
    const {
      name,
      contact,
      licenseNumber,
      licenseExpiry,
      experienceYears = 5,
      assignedBus = '',
      assignedRoute = '',
      status = 'On Duty',
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Driver name is required' });
    }
    if (!contact || !contact.trim()) {
      return res.status(400).json({ message: 'Driver contact phone number is required' });
    }
    if (!licenseNumber || !licenseNumber.trim()) {
      return res.status(400).json({ message: 'Commercial driving license number is required' });
    }

    // Check duplicate license
    const existing = await Driver.findOne({
      entityId,
      licenseNumber: { $regex: `^${licenseNumber.trim()}$`, $options: 'i' },
    });
    if (existing) {
      return res.status(400).json({ message: `Driver with license number "${licenseNumber.trim()}" is already registered` });
    }

    const driver = new Driver({
      name: name.trim(),
      contact: contact.trim(),
      licenseNumber: licenseNumber.trim().toUpperCase(),
      licenseExpiry: licenseExpiry || '2028-12-31',
      experienceYears: Number(experienceYears) || 1,
      assignedBus: assignedBus.trim(),
      assignedRoute: assignedRoute.trim(),
      status,
      entityId,
    });

    await driver.save();
    res.status(201).json(driver);
  } catch (error) {
    res.status(500).json({ message: 'Failed to add driver', error: error.message });
  }
});

// DELETE /api/transport/drivers/:id
router.delete('/drivers/:id', async (req, res) => {
  try {
    const entityId = req.entityId || 'default';
    const deleted = await Driver.findOneAndDelete({ _id: req.params.id, entityId });
    if (!deleted) {
      return res.status(404).json({ message: 'Driver not found' });
    }
    res.json({ message: 'Driver deleted successfully', driver: deleted });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete driver', error: error.message });
  }
});

// PUT /api/transport/drivers/:id (Update driver status, bus assignment, or contact)
router.put('/drivers/:id', async (req, res) => {
  try {
    const entityId = req.entityId || 'default';
    const updated = await Driver.findOneAndUpdate(
      { _id: req.params.id, entityId },
      { $set: req.body },
      { new: true }
    );
    if (!updated) {
      return res.status(404).json({ message: 'Driver not found' });
    }
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update driver', error: error.message });
  }
});

// ================= STATS ENDPOINT =================

// GET /api/transport/stats
router.get('/stats', async (req, res) => {
  try {
    const entityId = req.entityId || 'default';
    await seedInitialTransportIfEmpty(entityId);

    const [routes, vehicles, drivers] = await Promise.all([
      TransportRoute.find({ entityId }),
      Vehicle.find({ entityId }),
      Driver.find({ entityId }),
    ]);

    const totalFleet = vehicles.length || routes.length;
    const activeRoutes = routes.filter(r => r.status !== 'Maintenance').length;
    const totalStops = routes.reduce((acc, r) => acc + (r.stops || 0), 0);
    const enrolledStudents = await Student.countDocuments({ entityId });
    const rawAssigned = routes.reduce((acc, r) => acc + (r.studentsAssigned || 0), 0);
    const mappedStudents = Math.min(enrolledStudents, rawAssigned);
    const inMaintenance = vehicles.filter(v => v.status === 'Maintenance').length;
    const totalDrivers = drivers.length;
    const activeDrivers = drivers.filter(d => d.status === 'On Duty').length;

    // Calculate dynamic fleet deployment curve based on live active routes
    const timeSlots = ['06:00', '07:00', '08:00', '09:00', '13:00', '14:00', '15:00', '16:00'];
    const activeFleetRoutes = routes.filter(r => r.status !== 'Maintenance' && r.status !== 'Cancelled');
    const totalFleetActive = activeFleetRoutes.length;

    const deploymentCurve = timeSlots.map(time => {
      if (totalFleetActive === 0) return { time, active: 0 };

      let active = 0;
      if (time === '06:00') {
        // Routes that depart early in the morning
        active = activeFleetRoutes.filter(r => {
          const t = (r.timing || '').toUpperCase();
          return t.includes('06:15') || t.includes('06:30') || t.includes('06:40') || t.includes('06:00');
        }).length || Math.max(1, Math.floor(totalFleetActive * 0.4));
      } else if (time === '07:00') {
        // Peak morning transit
        active = totalFleetActive;
      } else if (time === '08:00') {
        // Campus arrival & final gate drop
        active = totalFleetActive;
      } else if (time === '09:00') {
        // Depot standby / off-peak
        active = totalFleetActive >= 4 ? 1 : 0;
      } else if (time === '13:00') {
        // Pre-primary early afternoon run
        active = totalFleetActive >= 3 ? 1 : 0;
      } else if (time === '14:00') {
        // Primary dispersal
        active = Math.max(1, Math.round(totalFleetActive * 0.8));
      } else if (time === '15:00') {
        // Peak general afternoon dispersal
        active = totalFleetActive;
      } else if (time === '16:00') {
        // Sports / activity late drop
        active = Math.max(1, Math.round(totalFleetActive * 0.4));
      }

      return { time, active: Math.min(totalFleetActive, active) };
    });

    res.json({
      totalFleet,
      activeRoutes,
      totalStops,
      mappedStudents,
      inMaintenance,
      totalVehicles: vehicles.length,
      totalDrivers,
      activeDrivers,
      deploymentCurve,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
