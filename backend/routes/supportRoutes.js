const express = require('express');
const router = express.Router();
const Visitor = require('../models/Visitor');
const Inquiry = require('../models/Inquiry');
const GatePass = require('../models/GatePass');
const Parcel = require('../models/Parcel');
const Student = require('../models/Student');
const Fee = require('../models/Fee');
const Transaction = require('../models/Transaction');


// ----------------------------------------------------
// 1. Telemetry / Desk Overview
// ----------------------------------------------------
router.get('/telemetry', async (req, res) => {
  try {
    const { entityId, schoolSlug } = req;
    const activeVisitors = await Visitor.countDocuments({ entityId, status: 'Checked In' });
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayInquiries = await Inquiry.countDocuments({
      entityId,
      createdAt: { $gte: todayStart }
    });

    const activeGatePasses = await GatePass.countDocuments({
      entityId,
      createdAt: { $gte: todayStart }
    });

    const pendingParcels = await Parcel.countDocuments({
      entityId,
      status: 'Received at Desk'
    });

    // Today's fee collection counter
    const todayTransactions = await Transaction.find({
      entityId,
      type: 'Fee Collection',
      status: 'Completed',
      date: { $gte: todayStart }
    });

    const todayCollectionTotal = todayTransactions.reduce((acc, t) => acc + (t.amount || 0), 0);
    const todayReceiptCount = todayTransactions.length;

    res.json({
      success: true,
      telemetry: {
        activeVisitors,
        todayInquiries,
        activeGatePasses,
        pendingParcels,
        todayCollectionTotal,
        todayReceiptCount
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ----------------------------------------------------
// 2. Reception & Visitors Management
// ----------------------------------------------------
router.get('/visitors', async (req, res) => {
  try {
    const { entityId } = req;
    const { status, search } = req.query;

    const query = { entityId };
    if (status && status !== 'All') {
      query.status = status;
    }
    if (search) {
      query.$or = [
        { visitorName: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { hostPerson: { $regex: search, $options: 'i' } },
        { passNumber: { $regex: search, $options: 'i' } }
      ];
    }

    const visitors = await Visitor.find(query).sort({ checkInTime: -1 });
    res.json({ success: true, visitors });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/visitors', async (req, res) => {
  try {
    const { entityId, schoolSlug } = req;
    const { visitorName, phone, purpose, hostPerson, department, idType, idNumber, vehicleNumber, badgeNumber, remarks } = req.body;

    if (!visitorName || !phone) {
      return res.status(400).json({ message: 'Visitor name and phone are required' });
    }

    const count = await Visitor.countDocuments({ entityId });
    const passNumber = `VIS-${new Date().getFullYear()}-${100 + count + 1}`;

    const newVisitor = new Visitor({
      visitorName,
      phone,
      purpose: purpose || 'General Visit',
      hostPerson: hostPerson || 'Administration',
      department: department || 'General Duty',
      idType: idType || 'Aadhaar Card',
      idNumber: idNumber || '',
      vehicleNumber: vehicleNumber || '',
      badgeNumber: badgeNumber || `B-${Math.floor(10 + Math.random() * 90)}`,
      passNumber,
      status: 'Checked In',
      checkInTime: new Date(),
      remarks: remarks || '',
      recordedBy: req.user?.name || 'Mr. Sonu Kumar (Support Staff)',
      schoolSlug,
      entityId
    });

    await newVisitor.save();
    res.status(201).json({ success: true, visitor: newVisitor, message: `Gate pass #${passNumber} issued to ${visitorName}` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/visitors/:id/checkout', async (req, res) => {
  try {
    const { id } = req.params;
    const visitor = await Visitor.findById(id);
    if (!visitor) return res.status(404).json({ message: 'Visitor record not found' });

    visitor.status = 'Completed';
    visitor.checkOutTime = new Date();
    await visitor.save();

    res.json({ success: true, visitor, message: `${visitor.visitorName} successfully checked out` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/visitors/:id', async (req, res) => {
  try {
    await Visitor.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Visitor pass record deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ----------------------------------------------------
// 3. Accounts Window / Fee Submission Desk
// ----------------------------------------------------
router.get('/students/search', async (req, res) => {
  try {
    const { entityId } = req;
    const { query } = req.query;

    if (!query || query.trim().length < 2) {
      return res.json({ success: true, students: [] });
    }

    const searchRegex = new RegExp(query.trim(), 'i');
    const students = await Student.find({
      entityId,
      $or: [
        { name: searchRegex },
        { rollNo: searchRegex },
        { parentContact: searchRegex },
        { grade: searchRegex }
      ]
    }).limit(15);

    // Look up fee dues for each found student
    const enriched = await Promise.all(
      students.map(async (st) => {
        const fees = await Fee.find({
          entityId,
          $or: [
            { student: st._id },
            { studentName: st.name }
          ]
        });

        const pendingFees = fees.filter(f => f.status !== 'Collected');
        const totalPending = pendingFees.reduce((acc, f) => acc + (f.amount || 0), 0);

        return {
          ...st.toObject(),
          fees,
          pendingFees,
          totalPending: totalPending > 0 ? totalPending : 0
        };
      })
    );

    res.json({ success: true, students: enriched });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Submit fee payment at counter
router.post('/fees/collect', async (req, res) => {
  try {
    const { entityId, schoolSlug } = req;
    const {
      studentId,
      studentName,
      rollNo,
      grade,
      category,
      amount,
      paymentMethod,
      payerName,
      payerPhone,
      txnReference,
      notes
    } = req.body;

    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      return res.status(400).json({ message: 'Valid payment amount is required' });
    }

    const timestamp = Date.now().toString().slice(-6);
    const count = await Transaction.countDocuments({ entityId });
    const receiptNo = `REC-${new Date().getFullYear()}-${timestamp}-${1000 + count + 1}`;
    const txnRefId = txnReference || `TXN-COUNTER-${timestamp}-${Math.floor(100 + Math.random() * 900)}`;

    const transaction = new Transaction({
      refId: receiptNo,
      type: 'Fee Collection',
      category: category || 'Tuition Fee',
      amount: numAmount,
      studentName: studentName || 'Student',
      description: `[Counter Receipt #${receiptNo}] ${category || 'Fee'} payment via ${paymentMethod || 'Cash'}. Payer: ${payerName || 'Parent'}. ${notes || ''}`.trim(),
      paymentMethod: paymentMethod || 'Cash',
      status: 'Completed',
      date: new Date(),
      entityId,
      schoolSlug: schoolSlug || req.headers['x-school-slug']
    });

    await transaction.save();

    // If there is an existing pending fee for this student, mark as collected
    if (studentId || studentName) {
      const feeQuery = { entityId, status: { $ne: 'Collected' } };
      if (studentId) feeQuery.student = studentId;
      else feeQuery.studentName = studentName;

      const pendingFee = await Fee.findOne(feeQuery);
      if (pendingFee) {
        pendingFee.status = 'Collected';
        await pendingFee.save();
      }
    }

    // Receipt details payload for instant UI modal & printing
    const receiptData = {
      receiptNo,
      refId: txnRefId,
      date: new Date(),
      studentName: studentName || 'Student',
      rollNo: rollNo || 'N/A',
      grade: grade || 'N/A',
      category: category || 'Tuition Fee',
      amount: numAmount,
      paymentMethod: paymentMethod || 'Cash',
      payerName: payerName || studentName || 'Parent',
      payerPhone: payerPhone || '',
      cashierName: req.user?.name || 'Mr. Sonu Kumar (Support Staff - Front Counter)',
      status: 'PAID & VERIFIED'
    };

    res.status(201).json({
      success: true,
      message: `Fee of ₹${numAmount.toLocaleString()} collected successfully! Receipt #${receiptNo}`,
      receipt: receiptData,
      transaction
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Today's counter receipts
router.get('/fees/today', async (req, res) => {
  try {
    const { entityId } = req;
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const receipts = await Transaction.find({
      entityId,
      type: 'Fee Collection',
      date: { $gte: todayStart }
    }).sort({ date: -1 });

    res.json({ success: true, receipts });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ----------------------------------------------------
// 4. Admission Inquiries & Helpdesk
// ----------------------------------------------------
router.get('/inquiries', async (req, res) => {
  try {
    const { entityId } = req;
    const { status, search } = req.query;

    const query = { entityId };
    if (status && status !== 'All') {
      query.status = status;
    }
    if (search) {
      query.$or = [
        { parentName: { $regex: search, $options: 'i' } },
        { studentName: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { inquiryNumber: { $regex: search, $options: 'i' } }
      ];
    }

    const inquiries = await Inquiry.find(query).sort({ createdAt: -1 });
    res.json({ success: true, inquiries });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/inquiries', async (req, res) => {
  try {
    const { entityId, schoolSlug } = req;
    const { parentName, studentName, phone, email, gradeSeeking, previousSchool, source, notes, status } = req.body;

    if (!parentName || !phone) {
      return res.status(400).json({ message: 'Parent name and contact phone are required' });
    }

    const count = await Inquiry.countDocuments({ entityId });
    const inquiryNumber = `INQ-${new Date().getFullYear()}-${100 + count + 1}`;

    const newInq = new Inquiry({
      inquiryNumber,
      parentName,
      studentName: studentName || '',
      phone,
      email: email || '',
      gradeSeeking: gradeSeeking || 'Class 1',
      previousSchool: previousSchool || '',
      source: source || 'Walk-in',
      status: status || 'New',
      notes: notes || '',
      handledBy: req.user?.name || 'Mr. Sonu Kumar (Support Staff)',
      schoolSlug,
      entityId
    });

    await newInq.save();
    res.status(201).json({ success: true, inquiry: newInq, message: `Inquiry #${inquiryNumber} registered` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/inquiries/:id', async (req, res) => {
  try {
    const { status, notes, followUpDate } = req.body;
    const inq = await Inquiry.findById(req.params.id);
    if (!inq) return res.status(404).json({ message: 'Inquiry not found' });

    if (status) inq.status = status;
    if (notes !== undefined) inq.notes = notes;
    if (followUpDate) inq.followUpDate = followUpDate;

    await inq.save();
    res.json({ success: true, inquiry: inq, message: 'Inquiry updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/inquiries/:id', async (req, res) => {
  try {
    await Inquiry.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Inquiry record removed' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ----------------------------------------------------
// 5. Gate Passes (Student Movement)
// ----------------------------------------------------
router.get('/gatepasses', async (req, res) => {
  try {
    const { entityId } = req;
    const passes = await GatePass.find({ entityId }).sort({ createdAt: -1 });
    res.json({ success: true, gatePasses: passes });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/gatepasses', async (req, res) => {
  try {
    const { entityId, schoolSlug } = req;
    const { studentName, rollNo, classSection, passType, reason, escortedBy, parentContact, parentPermissionVerified, remarks } = req.body;

    if (!studentName || !reason) {
      return res.status(400).json({ message: 'Student name and reason are required' });
    }

    const count = await GatePass.countDocuments({ entityId });
    const passNumber = `GP-${new Date().getFullYear()}-${100 + count + 1}`;

    const newPass = new GatePass({
      passNumber,
      studentName,
      rollNo: rollNo || '',
      classSection: classSection || '',
      passType: passType || 'Early Departure',
      reason,
      escortedBy: escortedBy || 'Self / Parent',
      parentContact: parentContact || '',
      parentPermissionVerified: parentPermissionVerified !== false,
      status: 'Approved & Exited',
      outTime: new Date(),
      issuedBy: req.user?.name || 'Mr. Sonu Kumar (Support Staff)',
      remarks: remarks || '',
      schoolSlug,
      entityId
    });

    await newPass.save();
    res.status(201).json({ success: true, gatePass: newPass, message: `Gate pass #${passNumber} issued for ${studentName}` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ----------------------------------------------------
// 6. Courier & Parcels Registry
// ----------------------------------------------------
router.get('/parcels', async (req, res) => {
  try {
    const { entityId } = req;
    const parcels = await Parcel.find({ entityId }).sort({ receivedDate: -1 });
    res.json({ success: true, parcels });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/parcels', async (req, res) => {
  try {
    const { entityId, schoolSlug } = req;
    const { trackingNumber, courierService, type, sender, recipient, department, remarks } = req.body;

    if (!recipient) {
      return res.status(400).json({ message: 'Recipient name / department is required' });
    }

    const newParcel = new Parcel({
      trackingNumber: trackingNumber || `TRK-${Date.now().toString().slice(-6)}`,
      courierService: courierService || 'India Post',
      type: type || 'Inward',
      sender: sender || '',
      recipient,
      department: department || 'Administration',
      status: 'Received at Desk',
      receivedDate: new Date(),
      receivedByStaff: req.user?.name || 'Mr. Sonu Kumar (Support Staff)',
      remarks: remarks || '',
      schoolSlug,
      entityId
    });

    await newParcel.save();
    res.status(201).json({ success: true, parcel: newParcel, message: `Parcel logged for ${recipient}` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/parcels/:id/handover', async (req, res) => {
  try {
    const parcel = await Parcel.findById(req.params.id);
    if (!parcel) return res.status(404).json({ message: 'Parcel not found' });

    parcel.status = 'Handed Over';
    parcel.handedOverDate = new Date();
    await parcel.save();

    res.json({ success: true, parcel, message: `Parcel marked as handed over to ${parcel.recipient}` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
