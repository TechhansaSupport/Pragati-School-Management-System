const express = require('express');
const router = express.Router();
const LabItem = require('../models/LabItem');
const Staff = require('../models/Staff');
const ClassSection = require('../models/ClassSection');
const PracticalSession = require('../models/PracticalSession');
const Student = require('../models/Student');


// @desc    Get Lab telemetry KPIs and stats
// @route   GET /api/lab/stats
router.get('/stats', async (req, res) => {
  try {
    const entityId = req.entityId;
    const schoolSlug = req.schoolSlug;
    const totalItems = await LabItem.countDocuments({ entityId });
    const totalEquipments = await LabItem.countDocuments({ entityId, category: { $ne: 'Chemical' } });
    const totalChemicals = await LabItem.countDocuments({ entityId, category: 'Chemical' });

    const operationalCount = await LabItem.countDocuments({ entityId, status: 'Operational' });
    const lowStockCount = await LabItem.countDocuments({ 
      entityId, 
      $or: [{ status: 'Low Stock' }, { $expr: { $lte: ['$quantity', '$minimumThreshold'] } }] 
    });
    const calibrationCount = await LabItem.countDocuments({ 
      entityId, 
      status: { $in: ['Needs Calibration', 'Under Repair', 'Damaged'] } 
    });

    // Active lab assistant identity
    const assistantStaff = await Staff.findOne({
      entityId,
      $or: [
        { role: 'Lab Assistant' },
        { portalUsername: req.user?.username }
      ]
    }).catch(() => null);

    const practicals = await PracticalSession.find({ entityId, readinessStatus: { $ne: 'Cancelled' } });
    const todayPracticals = practicals.length;
    const enrolledStudents = await Student.countDocuments({ entityId });
    const rawStudents = practicals.reduce((sum, p) => sum + (p.studentCount || 0), 0);
    const todayStudentsCount = enrolledStudents > 0 ? Math.min(enrolledStudents * todayPracticals, rawStudents) : 0;

    return res.json({
      success: true,
      stats: {
        totalLabs: 4,
        totalItems,
        totalEquipments,
        totalChemicals,
        operationalCount,
        lowStockCount,
        calibrationCount,
        todayPracticals,
        todayStudentsCount,
        safetyComplianceScore: 98,
        assistantName: assistantStaff?.name || req.user?.name || 'Mr. Sujal Vishwa',
        assistantEmpId: assistantStaff?.employeeId || 'EMP-107',
        department: assistantStaff?.department || 'Science',
        campus: req.tenant?.name || req.school?.name || 'Main Campus'
      }
    });
  } catch (error) {
    console.error('Error fetching lab stats:', error);
    return res.status(500).json({ error: 'Server error', message: error.message });
  }
});

// @desc    Get all lab inventory items with optional filters
// @route   GET /api/lab/inventory
router.get('/inventory', async (req, res) => {
  try {
    const entityId = req.entityId;
    const schoolSlug = req.schoolSlug;
    const { search, labType, category, status, type } = req.query;
    const filter = { entityId };

    if (type === 'chemical') {
      filter.category = 'Chemical';
    } else if (type === 'equipment') {
      filter.category = { $ne: 'Chemical' };
    }

    if (labType && labType !== 'all') {
      filter.labType = labType;
    }
    if (category && category !== 'all') {
      filter.category = category;
    }
    if (status && status !== 'all') {
      filter.status = status;
    }
    if (search && search.trim()) {
      filter.$or = [
        { name: new RegExp(search.trim(), 'i') },
        { location: new RegExp(search.trim(), 'i') },
        { notes: new RegExp(search.trim(), 'i') }
      ];
    }

    const items = await LabItem.find(filter).sort({ category: 1, name: 1 });
    return res.json({ success: true, items });
  } catch (error) {
    console.error('Error fetching lab inventory:', error);
    return res.status(500).json({ error: 'Server error', message: error.message });
  }
});

// @desc    Add new lab apparatus or reagent
// @route   POST /api/lab/inventory
router.post('/inventory', async (req, res) => {
  try {
    const { name, labType, category, quantity, unit, status, location, hazardLevel, minimumThreshold, notes } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Item name is required' });
    }

    const newItem = new LabItem({
      name: name.trim(),
      labType: labType || 'General Science',
      category: category || 'Apparatus',
      quantity: Number(quantity) || 1,
      unit: unit || 'units',
      status: status || 'Operational',
      location: location || 'Main Storage',
      hazardLevel: hazardLevel || 'None',
      minimumThreshold: Number(minimumThreshold) || 5,
      notes: notes || '',
      entityId: req.entityId,
      schoolSlug: req.schoolSlug || ''
    });

    await newItem.save();
    return res.status(201).json({ success: true, item: newItem, message: `Added "${newItem.name}" to laboratory inventory!` });
  } catch (error) {
    console.error('Error adding lab item:', error);
    return res.status(500).json({ error: 'Server error', message: error.message });
  }
});

// @desc    Update lab item (Restock, change status, inspect)
// @route   PUT /api/lab/inventory/:id
router.put('/inventory/:id', async (req, res) => {
  try {
    const item = await LabItem.findOne({ _id: req.params.id, entityId: req.entityId });
    if (!item) {
      return res.status(404).json({ error: 'Lab item not found' });
    }

    const allowed = ['name', 'labType', 'category', 'quantity', 'unit', 'status', 'location', 'hazardLevel', 'minimumThreshold', 'notes'];
    allowed.forEach(field => {
      if (req.body[field] !== undefined) {
        item[field] = req.body[field];
      }
    });

    item.lastInspected = new Date();
    await item.save();

    return res.json({ success: true, item, message: `Updated "${item.name}"!` });
  } catch (error) {
    console.error('Error updating lab item:', error);
    return res.status(500).json({ error: 'Server error', message: error.message });
  }
});

// @desc    Delete lab item
// @route   DELETE /api/lab/inventory/:id
router.delete('/inventory/:id', async (req, res) => {
  try {
    const item = await LabItem.findOneAndDelete({ _id: req.params.id, entityId: req.entityId });
    if (!item) {
      return res.status(404).json({ error: 'Lab item not found' });
    }
    return res.json({ success: true, message: `Removed "${item.name}" from inventory.` });
  } catch (error) {
    console.error('Error deleting lab item:', error);
    return res.status(500).json({ error: 'Server error', message: error.message });
  }
});


// @desc    Get scheduled practical laboratory sessions
// @route   GET /api/lab/practicals
router.get('/practicals', async (req, res) => {
  try {
    const entityId = req.entityId;
    const schoolSlug = req.schoolSlug;
    const practicals = await PracticalSession.find({ entityId }).sort({ scheduledDate: 1, createdAt: 1 });
    return res.json({ success: true, practicals });
  } catch (error) {
    console.error('Error fetching practicals:', error);
    return res.status(500).json({ error: 'Server error', message: error.message });
  }
});

// @desc    Schedule a new practical session (Authority of Lab Assistant)
// @route   POST /api/lab/practicals
router.post('/practicals', async (req, res) => {
  try {
    const { 
      title, 
      subject, 
      labRoom, 
      classSection, 
      studentCount, 
      workstationsCount, 
      instructor, 
      scheduledDate, 
      timeSlot, 
      requiredEquipments, 
      requiredChemicals, 
      safetyRequirements, 
      readinessStatus,
      notes 
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Practical topic / experiment title is required' });
    }
    if (!classSection || !classSection.trim()) {
      return res.status(400).json({ error: 'Class and section are required' });
    }
    if (!studentCount || Number(studentCount) <= 0) {
      return res.status(400).json({ error: 'Number of students in the class is required' });
    }

    const students = Number(studentCount);
    const workstations = workstationsCount ? Number(workstationsCount) : Math.ceil(students / 2);

    // Color code according to subject
    let color = '#4F46E5';
    if (subject?.toLowerCase().includes('chem')) color = '#059669';
    else if (subject?.toLowerCase().includes('bio')) color = '#0284c7';
    else if (subject?.toLowerCase().includes('stem') || subject?.toLowerCase().includes('robot')) color = '#7c3aed';
    else if (subject?.toLowerCase().includes('phys')) color = '#4F46E5';

    // Parse array inputs if strings were passed
    const parseList = (val) => {
      if (Array.isArray(val)) return val.map(s => String(s).trim()).filter(Boolean);
      if (typeof val === 'string') return val.split('\n').flatMap(s => s.split(',')).map(s => s.trim()).filter(Boolean);
      return [];
    };

    const newPractical = new PracticalSession({
      title: title.trim(),
      subject: subject || 'General Science',
      labRoom: labRoom || 'Main Science Lab',
      classSection: classSection.trim(),
      studentCount: students,
      workstationsCount: workstations,
      instructor: instructor || 'Science Faculty',
      scheduledDate: scheduledDate ? new Date(scheduledDate) : new Date(),
      timeSlot: timeSlot || '10:00 AM - 11:30 AM',
      requiredEquipments: parseList(requiredEquipments),
      requiredChemicals: parseList(requiredChemicals),
      safetyRequirements: parseList(safetyRequirements),
      readinessStatus: readinessStatus || 'Setup Required',
      color,
      notes: notes || '',
      createdBy: req.user?.name || 'Lab Assistant',
      entityId: req.entityId,
      schoolSlug: req.schoolSlug || ''
    });

    await newPractical.save();
    return res.status(201).json({
      success: true,
      practical: newPractical,
      message: `Successfully scheduled practical for ${newPractical.classSection} (${students} students)!`
    });
  } catch (error) {
    console.error('Error scheduling practical:', error);
    return res.status(500).json({ error: 'Server error', message: error.message });
  }
});

// @desc    Update practical session readiness status
// @route   PUT /api/lab/practicals/:id/status
router.put('/practicals/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const practical = await PracticalSession.findOne({ _id: req.params.id, entityId: req.entityId });
    if (!practical) {
      return res.status(404).json({ error: 'Practical session not found' });
    }
    practical.readinessStatus = status || practical.readinessStatus;
    await practical.save();
    return res.json({ success: true, practical, message: `Updated session to "${status}"!` });
  } catch (error) {
    console.error('Error updating practical status:', error);
    return res.status(500).json({ error: 'Server error', message: error.message });
  }
});

// @desc    Update scheduled practical details
// @route   PUT /api/lab/practicals/:id
router.put('/practicals/:id', async (req, res) => {
  try {
    const practical = await PracticalSession.findOne({ _id: req.params.id, entityId: req.entityId });
    if (!practical) {
      return res.status(404).json({ error: 'Practical session not found' });
    }

    const fields = ['title', 'subject', 'labRoom', 'classSection', 'studentCount', 'workstationsCount', 'instructor', 'timeSlot', 'scheduledDate', 'readinessStatus', 'notes'];
    fields.forEach(field => {
      if (req.body[field] !== undefined) practical[field] = req.body[field];
    });

    const parseList = (val) => {
      if (Array.isArray(val)) return val.map(s => String(s).trim()).filter(Boolean);
      if (typeof val === 'string') return val.split('\n').flatMap(s => s.split(',')).map(s => s.trim()).filter(Boolean);
      return [];
    };

    if (req.body.requiredEquipments !== undefined) practical.requiredEquipments = parseList(req.body.requiredEquipments);
    if (req.body.requiredChemicals !== undefined) practical.requiredChemicals = parseList(req.body.requiredChemicals);
    if (req.body.safetyRequirements !== undefined) practical.safetyRequirements = parseList(req.body.safetyRequirements);

    if (req.body.studentCount && !req.body.workstationsCount) {
      practical.workstationsCount = Math.ceil(Number(req.body.studentCount) / 2);
    }

    await practical.save();
    return res.json({ success: true, practical, message: `Updated practical session "${practical.title}"!` });
  } catch (error) {
    console.error('Error updating practical session:', error);
    return res.status(500).json({ error: 'Server error', message: error.message });
  }
});

// @desc    Delete or cancel practical session
// @route   DELETE /api/lab/practicals/:id
router.delete('/practicals/:id', async (req, res) => {
  try {
    const practical = await PracticalSession.findOneAndDelete({ _id: req.params.id, entityId: req.entityId });
    if (!practical) {
      return res.status(404).json({ error: 'Practical session not found' });
    }
    return res.json({ success: true, message: `Cancelled & deleted scheduled practical for ${practical.classSection}.` });
  } catch (error) {
    console.error('Error deleting practical session:', error);
    return res.status(500).json({ error: 'Server error', message: error.message });
  }
});

// --- LAB ASSISTANT DUTY TASKS SCHEMA & ROUTES ---
const mongoose = require('mongoose');

const labTaskSchema = new mongoose.Schema({
  text: { type: String, required: true, trim: true },
  done: { type: Boolean, default: false },
  entityId: { type: String, required: true, index: true },
  schoolSlug: { type: String, default: '' },
}, { timestamps: true });

const LabTask = mongoose.models.LabTask || mongoose.model('LabTask', labTaskSchema);


// GET /api/lab/tasks
router.get('/tasks', async (req, res) => {
  try {
    const entityId = req.entityId || 'default';
    const schoolSlug = req.schoolSlug || '';
    const tasks = await LabTask.find({ entityId }).sort({ createdAt: 1 });
    return res.json({ success: true, tasks });
  } catch (error) {
    return res.status(500).json({ error: 'Server error', message: error.message });
  }
});

// POST /api/lab/tasks
router.post('/tasks', async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Task text is required' });
    }
    const newTask = new LabTask({
      text: text.trim(),
      done: false,
      entityId: req.entityId || 'default',
      schoolSlug: req.schoolSlug || ''
    });
    await newTask.save();
    return res.status(201).json({ success: true, task: newTask, message: 'Duty task added to Lab Register!' });
  } catch (error) {
    return res.status(500).json({ error: 'Server error', message: error.message });
  }
});

// PUT /api/lab/tasks/:id/toggle
router.put('/tasks/:id/toggle', async (req, res) => {
  try {
    const task = await LabTask.findOne({ _id: req.params.id, entityId: req.entityId });
    if (!task) return res.status(404).json({ error: 'Task not found' });
    task.done = !task.done;
    await task.save();
    return res.json({ success: true, task });
  } catch (error) {
    return res.status(500).json({ error: 'Server error', message: error.message });
  }
});

// DELETE /api/lab/tasks/:id
router.delete('/tasks/:id', async (req, res) => {
  try {
    await LabTask.findOneAndDelete({ _id: req.params.id, entityId: req.entityId });
    return res.json({ success: true, message: 'Task deleted' });
  } catch (error) {
    return res.status(500).json({ error: 'Server error', message: error.message });
  }
});

// --- LAB SAFETY CHECKLIST SCHEMA & ROUTES ---
const labSafetySchema = new mongoose.Schema({
  label: { type: String, required: true, trim: true },
  lab: { type: String, default: 'All Science Labs' },
  checked: { type: Boolean, default: true },
  entityId: { type: String, required: true, index: true },
  schoolSlug: { type: String, default: '' },
}, { timestamps: true });

const LabSafetyCheck = mongoose.models.LabSafetyCheck || mongoose.model('LabSafetyCheck', labSafetySchema);


// GET /api/lab/safety
router.get('/safety', async (req, res) => {
  try {
    const entityId = req.entityId || 'default';
    const schoolSlug = req.schoolSlug || '';
    const items = await LabSafetyCheck.find({ entityId }).sort({ createdAt: 1 });
    return res.json({ success: true, items });
  } catch (error) {
    return res.status(500).json({ error: 'Server error', message: error.message });
  }
});

// PUT /api/lab/safety/:id/toggle
router.put('/safety/:id/toggle', async (req, res) => {
  try {
    const item = await LabSafetyCheck.findOne({ _id: req.params.id, entityId: req.entityId });
    if (!item) return res.status(404).json({ error: 'Safety item not found' });
    item.checked = !item.checked;
    await item.save();
    return res.json({ success: true, item });
  } catch (error) {
    return res.status(500).json({ error: 'Server error', message: error.message });
  }
});

module.exports = router;

