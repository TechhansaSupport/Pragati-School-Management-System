const express = require('express');
const router = express.Router();
const LabItem = require('../models/LabItem');
const Staff = require('../models/Staff');
const ClassSection = require('../models/ClassSection');
const PracticalSession = require('../models/PracticalSession');

// Comprehensive laboratory inventory catalogue (Equipments, Apparatus & Chemicals)
const STARTER_LAB_ITEMS = [
  // --- EQUIPMENTS, APPARATUS & GLASSWARE ---
  {
    name: 'Compound Monocular Microscope (1000x)',
    labType: 'Biology',
    category: 'Instrument',
    quantity: 18,
    unit: 'units',
    status: 'Operational',
    location: 'Optics Cabinet B-1',
    hazardLevel: 'None',
    minimumThreshold: 5,
    notes: 'Calibrated lenses and LED illumination stage.'
  },
  {
    name: 'Borosilicate Glass Beakers Set (100ml, 250ml, 500ml)',
    labType: 'Chemistry',
    category: 'Glassware',
    quantity: 120,
    unit: 'pcs',
    status: 'Operational',
    location: 'Glassware Bay 3',
    hazardLevel: 'None',
    minimumThreshold: 30,
    notes: 'Heat resistant Class A volumetric calibration.'
  },
  {
    name: 'Burette with PTFE Stopcock (50ml Class A)',
    labType: 'Chemistry',
    category: 'Glassware',
    quantity: 36,
    unit: 'units',
    status: 'Operational',
    location: 'Glassware Rack 2',
    hazardLevel: 'None',
    minimumThreshold: 10,
    notes: '0.1ml graduation, acid-resistant stopcock.'
  },
  {
    name: 'Optical Bench & Convex / Concave Lens Kit',
    labType: 'Physics',
    category: 'Apparatus',
    quantity: 24,
    unit: 'sets',
    status: 'Operational',
    location: 'Optics Shelf 4',
    hazardLevel: 'None',
    minimumThreshold: 8,
    notes: 'Includes millimeter ruled scale & light pin mounts.'
  },
  {
    name: 'Digital Vernier Caliper & Micrometer Screw Gauge',
    labType: 'Physics',
    category: 'Instrument',
    quantity: 30,
    unit: 'units',
    status: 'Operational',
    location: 'Precision Drawer 2A',
    hazardLevel: 'None',
    minimumThreshold: 10,
    notes: '0.01mm resolution digital zero-calibrated.'
  },
  {
    name: 'Galvanometer & Ammeter DC Panel Meters',
    labType: 'Physics',
    category: 'Electronic Instrument',
    quantity: 22,
    unit: 'units',
    status: 'Needs Calibration',
    location: 'Electronics Rack 3',
    hazardLevel: 'Low',
    minimumThreshold: 6,
    notes: 'Internal shunt resistance verification due.'
  },
  {
    name: 'Retort Stand with Heavy Iron Base & Bosshead Clamps',
    labType: 'Chemistry',
    category: 'Apparatus',
    quantity: 32,
    unit: 'sets',
    status: 'Operational',
    location: 'Heavy Apparatus Bay 1',
    hazardLevel: 'None',
    minimumThreshold: 12,
    notes: 'Anti-corrosion coated steel rod & brass clamp.'
  },
  {
    name: 'Analytical Precision Digital Balance (0.001g Resolution)',
    labType: 'Chemistry',
    category: 'Instrument',
    quantity: 4,
    unit: 'units',
    status: 'Operational',
    location: 'Balance Room Counter 1',
    hazardLevel: 'None',
    minimumThreshold: 2,
    notes: 'Glass draft shield installed; level calibrated.'
  },
  {
    name: 'Bunsen Burners with Airflow Collar & Neoprene Tubing',
    labType: 'Chemistry',
    category: 'Apparatus',
    quantity: 26,
    unit: 'units',
    status: 'Operational',
    location: 'Burner Station Locker 2',
    hazardLevel: 'Low',
    minimumThreshold: 8,
    notes: 'Inspect hose connections before each practical period.'
  },
  {
    name: 'Permanent Plant & Animal Histology Slide Box',
    labType: 'Biology',
    category: 'Specimen & Kit',
    quantity: 60,
    unit: 'boxes (25 slides)',
    status: 'Operational',
    location: 'Slide Case 1',
    hazardLevel: 'None',
    minimumThreshold: 15,
    notes: 'Onion root tip mitosis, xylem, phloem, human blood smear.'
  },
  {
    name: 'Human Anatomical Torso & Skeleton Model (Life Size)',
    labType: 'Biology',
    category: 'Apparatus',
    quantity: 2,
    unit: 'units',
    status: 'Operational',
    location: 'Biology Display Pod A',
    hazardLevel: 'None',
    minimumThreshold: 1,
    notes: 'Removable visceral organs and numbered bones guide.'
  },
  {
    name: 'Arduino STEM Microcontroller Robotics Kits',
    labType: 'Computer & STEM',
    category: 'Electronic Instrument',
    quantity: 35,
    unit: 'kits',
    status: 'Operational',
    location: 'STEM Lab Locker 5',
    hazardLevel: 'Low',
    minimumThreshold: 10,
    notes: 'Includes sensor shields, breadboards, servo motors.'
  },
  {
    name: 'Heavy Duty Fume Hood & Chemical Extraction Unit',
    labType: 'Chemistry',
    category: 'Safety & Protective',
    quantity: 2,
    unit: 'units',
    status: 'Operational',
    location: 'Chemistry Lab Wall North',
    hazardLevel: 'None',
    minimumThreshold: 1,
    notes: 'Airflow certified compliant (0.5 m/s face velocity).'
  },
  {
    name: 'Emergency Chemical Eye-Wash & Drench Shower Pod',
    labType: 'General Science',
    category: 'Safety & Protective',
    quantity: 4,
    unit: 'units',
    status: 'Operational',
    location: 'Lab Entrance Corridor',
    hazardLevel: 'None',
    minimumThreshold: 4,
    notes: 'Weekly water purge completed & pressure verified.'
  },

  // --- CHEMICALS, REAGENTS & SOLUTIONS ---
  {
    name: 'Hydrochloric Acid Solution (HCl 0.1M & 1.0M)',
    labType: 'Chemistry',
    category: 'Chemical',
    quantity: 8,
    unit: 'bottles (2.5L)',
    status: 'Operational',
    location: 'Acid Storage Locker 1',
    hazardLevel: 'Corrosive / Toxic',
    minimumThreshold: 3,
    notes: 'Fume cupboard handling protocol required.'
  },
  {
    name: 'Sodium Hydroxide Pellets (Analytical Reagent NaOH)',
    labType: 'Chemistry',
    category: 'Chemical',
    quantity: 2,
    unit: 'bottles (500g)',
    status: 'Low Stock',
    location: 'Base Cabinet 2',
    hazardLevel: 'Corrosive / Toxic',
    minimumThreshold: 4,
    notes: 'Hygroscopic; store tightly sealed. Reorder placed.'
  },
  {
    name: 'Sulfuric Acid (H2SO4 98% Concentrated)',
    labType: 'Chemistry',
    category: 'Chemical',
    quantity: 4,
    unit: 'bottles (2.5L)',
    status: 'Operational',
    location: 'Acid Storage Locker 1',
    hazardLevel: 'Corrosive / Toxic',
    minimumThreshold: 2,
    notes: 'Double locked cabinet; teacher authorization only.'
  },
  {
    name: 'Copper (II) Sulphate Pentahydrate Crystals (CuSO4.5H2O)',
    labType: 'Chemistry',
    category: 'Chemical',
    quantity: 6,
    unit: 'bottles (500g)',
    status: 'Operational',
    location: 'Reagent Shelf 3',
    hazardLevel: 'Moderate',
    minimumThreshold: 2,
    notes: 'Bright blue crystalline reagent for salt analysis.'
  },
  {
    name: 'Phenolphthalein pH Indicator Solution (1% w/v)',
    labType: 'Chemistry',
    category: 'Chemical',
    quantity: 5,
    unit: 'bottles (500ml)',
    status: 'Operational',
    location: 'Indicator Shelf 1',
    hazardLevel: 'Low',
    minimumThreshold: 2,
    notes: 'Clear in acid, magenta/pink in alkaline (pH 8.2 - 10.0).'
  },
  {
    name: 'Methyl Orange pH Indicator Solution (0.1% aqueous)',
    labType: 'Chemistry',
    category: 'Chemical',
    quantity: 4,
    unit: 'bottles (500ml)',
    status: 'Operational',
    location: 'Indicator Shelf 1',
    hazardLevel: 'Low',
    minimumThreshold: 2,
    notes: 'Red in acid, yellow in alkaline (pH 3.1 - 4.4).'
  },
  {
    name: 'Safranin Staining Solution (0.5% Aqueous Biological Stain)',
    labType: 'Biology',
    category: 'Chemical',
    quantity: 6,
    unit: 'dropper bottles (100ml)',
    status: 'Operational',
    location: 'Biology Stain Rack A',
    hazardLevel: 'Low',
    minimumThreshold: 3,
    notes: 'Nuclear counterstain for histology & plant stomata mounts.'
  },
  {
    name: 'Iodine Solution for Starch Test (Lugol\'s Iodine)',
    labType: 'Biology',
    category: 'Chemical',
    quantity: 8,
    unit: 'dropper bottles (100ml)',
    status: 'Operational',
    location: 'Biology Stain Rack A',
    hazardLevel: 'Low',
    minimumThreshold: 3,
    notes: 'Dark blue/black reaction with starch in leaves.'
  },
  {
    name: 'Ethanol Absolute (99.9% Analytical Grade Reagent)',
    labType: 'Chemistry',
    category: 'Chemical',
    quantity: 2,
    unit: 'bottles (1.0L)',
    status: 'Low Stock',
    location: 'Flammable Storage Locker F-1',
    hazardLevel: 'Moderate',
    minimumThreshold: 4,
    notes: 'Flammable liquid; keep away from open flame or Bunsen burners.'
  },
  {
    name: 'Benedict\'s Reagent Solution (Qualitative Sugar Test)',
    labType: 'Biology',
    category: 'Chemical',
    quantity: 5,
    unit: 'bottles (500ml)',
    status: 'Operational',
    location: 'Bio Reagent Shelf 2',
    hazardLevel: 'Low',
    minimumThreshold: 2,
    notes: 'Tests reducing sugars; color shifts blue -> green -> brick red.'
  }
];

// Seed starter data if entity inventory is empty
const ensureSeedData = async (entityId, schoolSlug) => {
  const count = await LabItem.countDocuments({ entityId });
  if (count === 0) {
    const items = STARTER_LAB_ITEMS.map(item => ({
      ...item,
      entityId,
      schoolSlug: schoolSlug || ''
    }));
    await LabItem.insertMany(items).catch(() => {});
  }
};

// @desc    Get Lab telemetry KPIs and stats
// @route   GET /api/lab/stats
router.get('/stats', async (req, res) => {
  try {
    const entityId = req.entityId;
    const schoolSlug = req.schoolSlug;
    await ensureSeedData(entityId, schoolSlug);

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

    await ensureSeedPracticals(entityId, schoolSlug);

    const practicals = await PracticalSession.find({ entityId, readinessStatus: { $ne: 'Cancelled' } });
    const todayPracticals = practicals.length;
    const todayStudentsCount = practicals.reduce((sum, p) => sum + (p.studentCount || 0), 0);

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
    await ensureSeedData(entityId, schoolSlug);

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

// Initial starter schedule for seed initialization
const STARTER_PRACTICALS = [
  {
    title: 'Light Refraction & Focal Length Determination',
    subject: 'Physics Practical',
    labRoom: 'Physics Lab 2 (Room 304)',
    classSection: 'Class 11 - Science',
    studentCount: 28,
    workstationsCount: 14,
    instructor: 'Dr. Ramesh Singh',
    timeSlot: '08:30 AM - 10:00 AM',
    requiredEquipments: [
      '14x Optical Bench Sets with millimeter rulers',
      '14x Convex Lenses (f=15cm) & Lens Holders',
      '14x Illuminated Object Pins',
      '2x Spherometers & Plane Mirrors'
    ],
    requiredChemicals: [],
    safetyRequirements: [
      'Safety goggles for optical pin alignment',
      'Align benches away from direct sunlight'
    ],
    readinessStatus: 'Ready & Sanitized',
    color: '#4F46E5',
    notes: '14 workstations configured (2 students per optical bench).'
  },
  {
    title: 'Acid-Base Titration & pH Neutralization Curve',
    subject: 'Chemistry Practical',
    labRoom: 'Chemistry Lab 1 (Room 208)',
    classSection: 'Class 10 - Section A',
    studentCount: 32,
    workstationsCount: 16,
    instructor: 'Mrs. Neha Verma',
    timeSlot: '10:15 AM - 11:45 AM',
    requiredEquipments: [
      '16x Class A Burettes (50ml) with PTFE Stopcocks',
      '16x Retort Stands & Double Burette Clamps',
      '32x Conical Flasks (250ml Borosilicate)',
      '16x Graduated Pipettes (10ml & 25ml)',
      '16x White Tile Titration Bases'
    ],
    requiredChemicals: [
      '1.5L Standard 0.1M Hydrochloric Acid (HCl)',
      '1.5L Standard 0.1M Sodium Hydroxide (NaOH)',
      '4x Dropper Bottles Phenolphthalein pH Indicator (1%)',
      '16x Distilled Water Wash Bottles (500ml)'
    ],
    safetyRequirements: [
      'Mandatory cotton lab coats & splash goggles',
      'Fume extraction hoods on active cycle',
      'Acid-base spill neutralizer bucket on Stand 1'
    ],
    readinessStatus: 'In Progress',
    color: '#059669',
    notes: '16 workstations (2 students per bench). Solutions pre-titrated by assistant.'
  },
  {
    title: 'Plant Epidermis & Stomata Slide Mount Examination',
    subject: 'Biology Practical',
    labRoom: 'Biology Lab (Room 205)',
    classSection: 'Class 9 - Section B',
    studentCount: 30,
    workstationsCount: 15,
    instructor: 'Mr. Arvind Gupta',
    timeSlot: '12:30 PM - 01:45 PM',
    requiredEquipments: [
      '15x Compound Monocular Microscopes (1000x)',
      '30x Plain Glass Slides & Glass Cover Slips',
      '15x Watch Glasses & Petri Dishes',
      '15x Dissection Needles & Precision Forceps'
    ],
    requiredChemicals: [
      '3x Dropper Bottles Safranin Staining Solution (0.5%)',
      '3x Dropper Bottles Glycerine Mountant (50% v/v)',
      'Distilled Water for Rinsing Peels'
    ],
    safetyRequirements: [
      'Glass coverslip disposal sharps bin placed on every aisle',
      'Microscope lens paper provided for clean immersion lenses'
    ],
    readinessStatus: 'Setup Required',
    color: '#0284c7',
    notes: '15 workstations (2 students per microscope). Fresh Tradescantia / Bryophyllum leaves sourced.'
  },
  {
    title: 'Obstacle Avoidance Ultrasonic Sensor Interfacing',
    subject: 'STEM & Robotics Lab',
    labRoom: 'STEM Innovation Pod (Room 110)',
    classSection: 'Class 8 - Section A',
    studentCount: 24,
    workstationsCount: 12,
    instructor: 'Ms. Pooja Nair',
    timeSlot: '02:00 PM - 03:15 PM',
    requiredEquipments: [
      '12x Arduino Uno R3 Microcontroller Boards',
      '12x HC-SR04 Ultrasonic Distance Sensor Modules',
      '12x Solderless Breadboards & Jumper Wire Bundles',
      '12x USB-B Interface Cables'
    ],
    requiredChemicals: [],
    safetyRequirements: [
      'Low 5V USB bus voltage only; no mains line connections',
      'ESD antistatic work mats on all 12 benches'
    ],
    readinessStatus: 'Setup Required',
    color: '#7c3aed',
    notes: '12 workstations (2 students per robotics kit). IDE libraries pre-flashed.'
  }
];

// Ensure initial practicals are seeded in database
const ensureSeedPracticals = async (entityId, schoolSlug) => {
  const count = await PracticalSession.countDocuments({ entityId });
  if (count === 0) {
    const items = STARTER_PRACTICALS.map(p => ({
      ...p,
      entityId,
      schoolSlug: schoolSlug || ''
    }));
    await PracticalSession.insertMany(items).catch(() => {});
  }
};

// @desc    Get scheduled practical laboratory sessions
// @route   GET /api/lab/practicals
router.get('/practicals', async (req, res) => {
  try {
    const entityId = req.entityId;
    const schoolSlug = req.schoolSlug;
    await ensureSeedPracticals(entityId, schoolSlug);

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

module.exports = router;

