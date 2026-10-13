const express = require('express');
const router = express.Router();
const TransportRoute = require('../models/TransportRoute');
const Student = require('../models/Student');

// Seed helper if tenant has 0 routes
const seedInitialTransportIfEmpty = async (entityId) => {
  if (!entityId) return;
  const count = await TransportRoute.countDocuments({ entityId });
  if (count === 0) {
    const sampleRoutes = [
      { routeId: 'RT-01', name: 'Andheri West Express', start: 'Lokhandwala Complex', end: 'School Campus', stops: 8, busNumber: 'MH-04-1234', driverName: 'Ramesh Singh', driverContact: '+91 98200 44551', timing: '06:45 AM - 07:30 AM', studentsAssigned: 42, capacity: 45, distance: '12 km', status: 'On Time', entityId },
      { routeId: 'RT-02', name: 'Bandra East Route', start: 'BKC Business Hub', end: 'School Campus', stops: 6, busNumber: 'MH-04-5678', driverName: 'Suresh Kumar', driverContact: '+91 98200 44552', timing: '06:30 AM - 07:30 AM', studentsAssigned: 38, capacity: 40, distance: '15 km', status: 'Delayed', entityId },
      { routeId: 'RT-03', name: 'Borivali North Line', start: 'IC Colony Metro', end: 'School Campus', stops: 12, busNumber: 'MH-04-9012', driverName: 'Kishore Mathur', driverContact: '+91 98200 44553', timing: '06:15 AM - 07:30 AM', studentsAssigned: 45, capacity: 45, distance: '18 km', status: 'On Time', entityId },
      { routeId: 'RT-04', name: 'Goregaon Central', start: 'Goregaon Station Road', end: 'School Campus', stops: 5, busNumber: 'MH-04-3456', driverName: 'Vinod Patil', driverContact: '+91 98200 44554', timing: '06:50 AM - 07:25 AM', studentsAssigned: 28, capacity: 30, distance: '8 km', status: 'Completed', entityId },
      { routeId: 'RT-05', name: 'Juhu Circle Bus', start: 'Juhu Beach Road', end: 'School Campus', stops: 7, busNumber: 'MH-04-7777', driverName: 'Rajesh Sharma', driverContact: '+91 98200 44555', timing: '06:40 AM - 07:20 AM', studentsAssigned: 35, capacity: 40, distance: '10 km', status: 'On Time', entityId },
    ];
    await TransportRoute.insertMany(sampleRoutes).catch(() => {});
  }
};

// GET /api/transport/routes
router.get('/routes', async (req, res) => {
  try {
    await seedInitialTransportIfEmpty(req.entityId);
    const { search } = req.query;
    const query = { entityId: req.entityId };

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
    const { name, start, end = 'School Campus', stops = 5, busNumber, driverName, driverContact, timing, capacity = 40, distance = '10 km' } = req.body;
    if (!name || !start || !busNumber || !driverName) {
      return res.status(400).json({ message: 'Route name, start, bus number, and driver name are required' });
    }

    const count = await TransportRoute.countDocuments({ entityId: req.entityId });
    const routeId = `RT-0${count + 1}`;

    const route = new TransportRoute({
      routeId,
      name: name.trim(),
      start: start.trim(),
      end: end.trim(),
      stops: Number(stops) || 5,
      busNumber: busNumber.trim(),
      driverName: driverName.trim(),
      driverContact: driverContact ? driverContact.trim() : '',
      timing: timing || '07:00 AM - 08:00 AM',
      capacity: Number(capacity) || 40,
      distance: distance.trim(),
      studentsAssigned: 0,
      status: 'On Time',
      entityId: req.entityId,
    });

    await route.save();
    res.status(201).json(route);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create route', error: error.message });
  }
});

// GET /api/transport/stats
router.get('/stats', async (req, res) => {
  try {
    await seedInitialTransportIfEmpty(req.entityId);
    const routes = await TransportRoute.find({ entityId: req.entityId });
    const totalFleet = routes.length;
    const activeRoutes = routes.filter(r => r.status !== 'Maintenance').length;
    const totalStops = routes.reduce((acc, r) => acc + (r.stops || 0), 0);
    const mappedStudents = routes.reduce((acc, r) => acc + (r.studentsAssigned || 0), 0);

    res.json({
      totalFleet,
      activeRoutes,
      totalStops,
      mappedStudents,
      inMaintenance: routes.filter(r => r.status === 'Maintenance').length || 1,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
