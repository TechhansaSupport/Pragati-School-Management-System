const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
const Staff = require('../models/Staff');
const Fee = require('../models/Fee');
const User = require('../models/User');

// Helper to verify admin authority
const checkAdminAuthority = (req, res) => {
  const userRole = (req.user && req.user.role) ? req.user.role.toLowerCase() : '';
  
  if (userRole === 'principal') {
    res.status(403).json({
      error: 'Access Denied: Principals are appointed for Academic Duties only. Financial management is restricted to School Administrators and Accountants.',
      code: 'FORBIDDEN_ACADEMICS_ONLY',
      message: 'Access Denied: Principals are appointed for Academic Duties only. Financial management is restricted to School Administrators and Accountants.'
    });
    return false;
  }

  const allowedRoles = ['admin', 'superadmin', 'accountant'];
  if (userRole && !allowedRoles.includes(userRole)) {
    res.status(403).json({
      error: 'Access Denied: Only School Administrators and Accountants have authority to manage financial records',
      code: 'FORBIDDEN_ADMIN_ONLY',
      message: 'Access Denied: Only School Administrators and Accountants have authority to manage financial records'
    });
    return false;
  }
  return true;
};

// Seed initial transactions ONLY when explicitly triggered by admin (e.g. via /api/finance/seed)
const seedInitialTransactionsIfEmpty = async (entityId, force = false, schoolSlug = null) => {
  if (!force) return; // Strictly never auto-seed on read queries
  const count = await Transaction.countDocuments(entityId ? { entityId } : {});
  if (count === 0 || force) {
    const timestamp = Date.now().toString().slice(-6);
    const sampleTransactions = [
      { refId: `TXN-${timestamp}-1001`, type: 'Fee Collection', category: 'Tuition Fee', amount: 45000, date: new Date('2026-09-15'), studentName: 'Aarav Sharma', description: 'Term 1 Tuition & Lab Fees', paymentMethod: 'Bank Transfer', status: 'Completed', entityId: entityId || 'default-school', schoolSlug },
      { refId: `TXN-${timestamp}-1002`, type: 'Fee Collection', category: 'Tuition Fee', amount: 45000, date: new Date('2026-09-18'), studentName: 'Diya Patel', description: 'Term 1 Tuition Fee', paymentMethod: 'UPI', status: 'Completed', entityId: entityId || 'default-school', schoolSlug },
      { refId: `TXN-${timestamp}-1003`, type: 'Fee Collection', category: 'Transport', amount: 12000, date: new Date('2026-09-20'), studentName: 'Vihaan Verma', description: 'Q2 Bus Transportation Pass', paymentMethod: 'Online', status: 'Completed', entityId: entityId || 'default-school', schoolSlug },
      { refId: `TXN-${timestamp}-1004`, type: 'Expense', category: 'Faculty Payroll', amount: 62000, date: new Date('2026-09-30'), studentName: 'R. K. Sharma (Staff)', description: 'September Staff Compensation', paymentMethod: 'Bank Transfer', status: 'Completed', entityId: entityId || 'default-school', schoolSlug },
      { refId: `TXN-${timestamp}-1005`, type: 'Expense', category: 'Faculty Payroll', amount: 58000, date: new Date('2026-09-30'), studentName: 'Pooja Iyer (Staff)', description: 'September Staff Compensation', paymentMethod: 'Bank Transfer', status: 'Completed', entityId: entityId || 'default-school', schoolSlug },
      { refId: `TXN-${timestamp}-1006`, type: 'Expense', category: 'Campus Maintenance', amount: 24500, date: new Date('2026-10-02'), description: 'HVAC and Electrical Servicing', paymentMethod: 'Cheque', status: 'Completed', entityId: entityId || 'default-school', schoolSlug },
      { refId: `TXN-${timestamp}-1007`, type: 'Expense', category: 'Library & Learning', amount: 18000, date: new Date('2026-10-05'), description: 'Annual Science Journal Subscriptions', paymentMethod: 'Online', status: 'Completed', entityId: entityId || 'default-school', schoolSlug },
      { refId: `TXN-${timestamp}-1008`, type: 'Fee Collection', category: 'Tuition Fee', amount: 42000, date: new Date('2026-10-08'), studentName: 'Kabir Mehta', description: 'Term 1 Outstanding Dues', paymentMethod: 'Cash', status: 'Pending', entityId: entityId || 'default-school', schoolSlug },
      { refId: `TXN-${timestamp}-1009`, type: 'Fee Collection', category: 'Tuition Fee', amount: 48000, date: new Date('2026-10-10'), studentName: 'Rohan Gupta', description: 'Senior Secondary Lab & Tuition', paymentMethod: 'UPI', status: 'Pending', entityId: entityId || 'default-school', schoolSlug },
    ];
    for (const t of sampleTransactions) {
      try {
        await Transaction.create(t);
      } catch (e) {
        // ignore duplicate in race
      }
    }
  }
};

// GET /api/finance/transactions — List all transactions
router.get('/transactions', async (req, res) => {
  if (!checkAdminAuthority(req, res)) return;
  try {
    const { search, page = 1, limit = 50, type, status, category, schoolSlug, all } = req.query;
    const query = { entityId: req.entityId };

    const isSuperAdmin = (req.user?.role || '').toLowerCase() === 'superadmin';
    const effectiveSchoolSlug = isSuperAdmin 
      ? (schoolSlug || req.schoolSlug || req.headers['x-school-slug']) 
      : req.schoolSlug;

    if (effectiveSchoolSlug && effectiveSchoolSlug !== 'all' && effectiveSchoolSlug !== 'central') {
      const primarySchool = await User.findOne({ role: 'school', entityId: req.entityId }).sort({ createdAt: 1 });
      const isPrimary = !primarySchool || primarySchool.slug === effectiveSchoolSlug;
      if (isPrimary) {
        query.$or = [
          { schoolSlug: effectiveSchoolSlug },
          { schoolSlug: null },
          { schoolSlug: { $exists: false } },
          { schoolSlug: '' }
        ];
      } else {
        query.schoolSlug = effectiveSchoolSlug;
      }
    }

    if (search) {
      const searchOr = [
        { refId: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } },
        { studentName: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
      if (query.$or) {
        query.$and = [{ $or: query.$or }, { $or: searchOr }];
        delete query.$or;
      } else {
        query.$or = searchOr;
      }
    }

    if (type && type !== 'All') query.type = type;
    if (status && status !== 'All') query.status = status;
    if (category && category !== 'All') query.category = category;

    const total = await Transaction.countDocuments(query);
    let queryBuilder = Transaction.find(query).sort({ date: -1 });

    if (all !== 'true') {
      queryBuilder = queryBuilder.skip((Number(page) - 1) * Number(limit)).limit(Number(limit));
    }

    const transactions = await queryBuilder;

    res.json({
      transactions,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / Number(limit)) || 1,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// GET /api/finance/stats — Financial KPIs (Real Live Database Aggregate)
router.get('/stats', async (req, res) => {
  if (!checkAdminAuthority(req, res)) return;
  try {
    const isSuperAdmin = (req.user?.role || '').toLowerCase() === 'superadmin';
    const targetSlug = isSuperAdmin ? (req.query.schoolSlug || req.schoolSlug) : req.schoolSlug;
    
    let scopeFilter = { entityId: req.entityId };
    if (targetSlug && targetSlug !== 'all' && targetSlug !== 'central') {
      const primarySchool = await User.findOne({ role: 'school', entityId: req.entityId }).sort({ createdAt: 1 });
      const isPrimary = !primarySchool || primarySchool.slug === targetSlug;
      if (isPrimary) {
        scopeFilter.$or = [
          { schoolSlug: targetSlug },
          { schoolSlug: null },
          { schoolSlug: { $exists: false } },
          { schoolSlug: '' }
        ];
      } else {
        scopeFilter.schoolSlug = targetSlug;
      }
    }

    const collectionsMatch = { $match: { ...scopeFilter, type: 'Fee Collection', status: 'Completed' } };
    const expensesMatch = { $match: { ...scopeFilter, type: 'Expense', status: 'Completed' } };
    const pendingMatch = { $match: { ...scopeFilter, type: 'Fee Collection', status: 'Pending' } };

    const collections = await Transaction.aggregate([
      collectionsMatch,
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);

    const expenses = await Transaction.aggregate([
      expensesMatch,
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);

    const pendingFees = await Transaction.aggregate([
      pendingMatch,
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);

    // Also check Fee model for active pending student fees
    const feePendingAgg = await Fee.aggregate([
      { $match: { ...scopeFilter, status: { $in: ['Overdue', 'Due this month'] } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const feeModelPending = feePendingAgg.length > 0 ? feePendingAgg[0].total : 0;
    const totalPending = Math.max(pendingFees.length > 0 ? pendingFees[0].total : 0, feeModelPending);

    // Calculate Due Salaries for current month
    const staffMembers = await Staff.find({ ...scopeFilter, status: 'Active' });
    const totalStaffPayroll = staffMembers.reduce((sum, s) => sum + Number(s.salary || 0), 0);
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    const payrollPaidAgg = await Transaction.aggregate([
      { 
        $match: { 
          ...scopeFilter, 
          type: 'Expense', 
          category: { $in: ['Faculty Payroll', 'Staff Salary', 'Payroll'] },
          status: 'Completed',
          date: { $gte: startOfMonth, $lte: endOfMonth }
        } 
      },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const paidPayroll = payrollPaidAgg.length > 0 ? payrollPaidAgg[0].total : 0;
    const dueSalaries = Math.max(0, totalStaffPayroll - paidPayroll);

    const totalCollections = collections.length > 0 ? collections[0].total : 0;
    const totalExpenses = expenses.length > 0 ? expenses[0].total : 0;

    res.json({
      totalCollections,
      totalExpenses,
      pendingFees: totalPending,
      dueSalaries,
      totalStaffPayroll,
      availableBalance: totalCollections - totalExpenses,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// GET /api/finance/salaries — Live Staff Payroll & Due Salaries Register
router.get('/salaries', async (req, res) => {
  if (!checkAdminAuthority(req, res)) return;
  try {
    const isSuperAdmin = (req.user?.role || '').toLowerCase() === 'superadmin';
    const targetSlug = isSuperAdmin ? (req.query.schoolSlug || req.schoolSlug) : req.schoolSlug;
    
    let scopeFilter = { entityId: req.entityId, status: 'Active' };
    if (targetSlug && targetSlug !== 'all' && targetSlug !== 'central') {
      const primarySchool = await User.findOne({ role: 'school', entityId: req.entityId }).sort({ createdAt: 1 });
      const isPrimary = !primarySchool || primarySchool.slug === targetSlug;
      if (isPrimary) {
        scopeFilter.$or = [
          { schoolSlug: targetSlug },
          { schoolSlug: null },
          { schoolSlug: { $exists: false } },
          { schoolSlug: '' }
        ];
      } else {
        scopeFilter.schoolSlug = targetSlug;
      }
    }

    const staffMembers = await Staff.find(scopeFilter).sort({ role: 1, name: 1 });

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const payrollTxns = await Transaction.find({
      entityId: req.entityId,
      type: 'Expense',
      category: { $in: ['Faculty Payroll', 'Staff Salary', 'Payroll'] },
      status: 'Completed',
      date: { $gte: startOfMonth, $lte: endOfMonth }
    });

    let totalPayroll = 0;
    let disbursedTotal = 0;
    let dueTotal = 0;
    let dueCount = 0;
    let paidCount = 0;

    const payrollList = staffMembers.map(staff => {
      const monthlySalary = Number(staff.salary || 0);
      totalPayroll += monthlySalary;

      const matchingTxn = payrollTxns.find(t => 
        (t.studentName && t.studentName.toLowerCase().includes(staff.name.toLowerCase())) ||
        (t.description && (t.description.toLowerCase().includes(staff.name.toLowerCase()) || (staff.employeeId && t.description.includes(staff.employeeId))))
      );

      const isPaid = !!matchingTxn;
      if (isPaid) {
        disbursedTotal += monthlySalary;
        paidCount++;
      } else {
        dueTotal += monthlySalary;
        dueCount++;
      }

      return {
        _id: staff._id,
        name: staff.name,
        employeeId: staff.employeeId,
        role: staff.role,
        department: staff.department,
        salary: monthlySalary,
        status: isPaid ? 'Paid' : 'Due',
        disbursedAt: matchingTxn?.date || null,
        refId: matchingTxn?.refId || null,
        paymentMethod: matchingTxn?.paymentMethod || null,
        currentMonth: now.toLocaleString('en-US', { month: 'long', year: 'numeric' })
      };
    });

    res.json({
      success: true,
      currentMonth: now.toLocaleString('en-US', { month: 'long', year: 'numeric' }),
      totalStaffCount: staffMembers.length,
      totalPayroll,
      disbursedTotal,
      dueTotal,
      paidCount,
      dueCount,
      staff: payrollList
    });
  } catch (error) {
    console.error('Salaries endpoint error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// POST /api/finance/disburse-salary — Disburse staff monthly salary
router.post('/disburse-salary', async (req, res) => {
  if (!checkAdminAuthority(req, res)) return;
  try {
    const { staffId, amount, paymentMethod, month, notes } = req.body;
    if (!staffId) {
      return res.status(400).json({ message: 'Staff ID is required' });
    }

    const staff = await Staff.findById(staffId);
    if (!staff) {
      return res.status(404).json({ message: 'Staff member not found' });
    }

    const salaryAmount = amount ? Number(amount) : Number(staff.salary || 0);
    if (salaryAmount <= 0) {
      return res.status(400).json({ message: 'Salary amount must be greater than 0' });
    }

    const timestamp = Date.now().toString().slice(-6);
    const count = await Transaction.countDocuments({ entityId: req.entityId });
    const finalRefId = `SAL-${new Date().getFullYear()}-${timestamp}-${1000 + count + 1}`;
    const targetMonth = month || new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' });

    const transaction = new Transaction({
      refId: finalRefId,
      type: 'Expense',
      category: 'Faculty Payroll',
      amount: salaryAmount,
      studentName: `${staff.name} (${staff.role})`,
      description: notes || `Monthly Salary Disbursement for ${targetMonth} - ID: ${staff.employeeId} - Dept: ${staff.department}`,
      paymentMethod: paymentMethod || 'Bank Transfer',
      status: 'Completed',
      date: new Date(),
      entityId: req.entityId || 'default-school',
      schoolSlug: req.schoolSlug || req.headers['x-school-slug'] || staff.schoolSlug,
    });

    await transaction.save();

    res.status(201).json({
      success: true,
      message: `Salary of ₹${salaryAmount.toLocaleString()} successfully disbursed to ${staff.name}`,
      transaction
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to disburse salary', error: error.message });
  }
});

// POST /api/finance/collect-due-fee — Record payment for a pending fee
router.post('/collect-due-fee', async (req, res) => {
  if (!checkAdminAuthority(req, res)) return;
  try {
    const { feeId, studentName, classSection, amount, paymentMethod, notes } = req.body;

    let targetStudentName = studentName;
    let targetClass = classSection;
    let targetAmount = amount ? Number(amount) : 0;

    if (feeId) {
      const feeDoc = await Fee.findById(feeId);
      if (feeDoc) {
        targetStudentName = targetStudentName || feeDoc.studentName;
        targetClass = targetClass || feeDoc.classSection;
        targetAmount = targetAmount || feeDoc.amount;
        feeDoc.status = 'Collected';
        await feeDoc.save();
      }
    }

    if (!targetAmount || targetAmount <= 0) {
      return res.status(400).json({ message: 'A valid collection amount is required' });
    }

    const timestamp = Date.now().toString().slice(-6);
    const count = await Transaction.countDocuments({ entityId: req.entityId });
    const finalRefId = `FEE-${new Date().getFullYear()}-${timestamp}-${1000 + count + 1}`;

    const transaction = new Transaction({
      refId: finalRefId,
      type: 'Fee Collection',
      category: 'Tuition Fee',
      amount: targetAmount,
      studentName: targetStudentName || 'Student',
      description: notes || `Fee payment received for ${targetClass || 'Academic Year'}`,
      paymentMethod: paymentMethod || 'UPI',
      status: 'Completed',
      date: new Date(),
      entityId: req.entityId || 'default-school',
      schoolSlug: req.schoolSlug || req.headers['x-school-slug'],
    });

    await transaction.save();

    res.status(201).json({
      success: true,
      message: `Fee of ₹${targetAmount.toLocaleString()} recorded successfully for ${targetStudentName}`,
      transaction
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to record fee collection', error: error.message });
  }
});

// GET /api/finance/analytics — Real Live MongoDB Aggregated Financial Intelligence
router.get('/analytics', async (req, res) => {
  if (!checkAdminAuthority(req, res)) return;
  try {
    const isSuperAdmin = (req.user?.role || '').toLowerCase() === 'superadmin';
    const targetSlug = isSuperAdmin ? (req.query.schoolSlug || req.schoolSlug) : req.schoolSlug;
    
    let scopeFilter = { entityId: req.entityId };
    if (targetSlug && targetSlug !== 'all' && targetSlug !== 'central') {
      const primarySchool = await User.findOne({ role: 'school', entityId: req.entityId }).sort({ createdAt: 1 });
      const isPrimary = !primarySchool || primarySchool.slug === targetSlug;
      if (isPrimary) {
        scopeFilter.$or = [
          { schoolSlug: targetSlug },
          { schoolSlug: null },
          { schoolSlug: { $exists: false } },
          { schoolSlug: '' }
        ];
      } else {
        scopeFilter.schoolSlug = targetSlug;
      }
    }

    // 1. Total Completed Collections
    const collectionsAgg = await Transaction.aggregate([
      { $match: { ...scopeFilter, type: 'Fee Collection', status: 'Completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const totalCollections = collectionsAgg.length > 0 ? collectionsAgg[0].total : 0;

    // 2. Total Completed Expenses
    const expensesAgg = await Transaction.aggregate([
      { $match: { ...scopeFilter, type: 'Expense', status: 'Completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const totalExpenses = expensesAgg.length > 0 ? expensesAgg[0].total : 0;

    // 3. Total Pending Fees
    const pendingAgg = await Transaction.aggregate([
      { $match: { ...scopeFilter, type: 'Fee Collection', status: 'Pending' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const totalPending = pendingAgg.length > 0 ? pendingAgg[0].total : 0;

    // 4. Monthly Aggregation Pipeline directly from MongoDB dates
    const monthlyAgg = await Transaction.aggregate([
      { $match: { ...scopeFilter, status: 'Completed' } },
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' },
            type: '$type'
          },
          totalAmount: { $sum: '$amount' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    const monthNames = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const academicMonthsOrder = [4, 5, 6, 7, 8, 9, 10]; // Apr to Oct (AY 2026-27)
    
    const monthlyMap = new Map();
    for (const mNum of academicMonthsOrder) {
      monthlyMap.set(mNum, {
        name: monthNames[mNum],
        collections: 0,
        expenses: 0,
        revenue: 0
      });
    }

    for (const item of monthlyAgg) {
      const mNum = item._id.month;
      if (!monthlyMap.has(mNum)) {
        monthlyMap.set(mNum, {
          name: monthNames[mNum] || `M${mNum}`,
          collections: 0,
          expenses: 0,
          revenue: 0
        });
      }
      const entry = monthlyMap.get(mNum);
      if (item._id.type === 'Fee Collection') {
        entry.collections += item.totalAmount;
      } else if (item._id.type === 'Expense') {
        entry.expenses += item.totalAmount;
      }
      // Real Gross Revenue earned in month
      entry.revenue = entry.collections;
    }

    const monthlyTrend = Array.from(monthlyMap.values());

    // 5. Quarterly Aggregation from Real Monthly Data
    const q1 = { name: 'Q1 (Apr-Jun)', collections: 0, expenses: 0, revenue: 0 };
    const q2 = { name: 'Q2 (Jul-Sep)', collections: 0, expenses: 0, revenue: 0 };
    const q3 = { name: 'Q3 (Oct-Dec)', collections: 0, expenses: 0, revenue: 0 };
    const q4 = { name: 'Q4 (Jan-Mar)', collections: 0, expenses: 0, revenue: 0 };

    monthlyTrend.forEach(m => {
      if (['Apr', 'May', 'Jun'].includes(m.name)) {
        q1.collections += m.collections;
        q1.expenses += m.expenses;
        q1.revenue += m.revenue;
      } else if (['Jul', 'Aug', 'Sep'].includes(m.name)) {
        q2.collections += m.collections;
        q2.expenses += m.expenses;
        q2.revenue += m.revenue;
      } else if (['Oct', 'Nov', 'Dec'].includes(m.name)) {
        q3.collections += m.collections;
        q3.expenses += m.expenses;
        q3.revenue += m.revenue;
      } else {
        q4.collections += m.collections;
        q4.expenses += m.expenses;
        q4.revenue += m.revenue;
      }
    });

    const quarterlyTrend = [q1, q2, q3, q4];

    // Real gross revenue generated
    const totalRevenue = totalCollections;
    const availableBalance = totalCollections - totalExpenses;
    const collectionEfficiency = (totalCollections + totalPending) > 0
      ? Math.round((totalCollections / (totalCollections + totalPending)) * 1000) / 10
      : 100;
    const operatingMargin = totalRevenue > 0
      ? Math.round(((totalRevenue - totalExpenses) / totalRevenue) * 1000) / 10
      : 0;

    res.json({
      success: true,
      totalRevenue,
      totalCollections,
      totalExpenses,
      pendingFees: totalPending,
      availableBalance,
      collectionEfficiency,
      operatingMargin,
      monthlyTrend,
      quarterlyTrend
    });
  } catch (error) {
    console.error('Finance analytics error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// POST /api/finance/transactions — Record new transaction
router.post('/transactions', async (req, res) => {
  if (!checkAdminAuthority(req, res)) return;

  try {
    const { refId, type, category, amount, studentName, description, paymentMethod, status } = req.body;

    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({ message: 'A valid transaction amount is required' });
    }

    let finalRefId = refId && refId.trim();
    if (!finalRefId) {
      const timestamp = Date.now().toString().slice(-6);
      const count = await Transaction.countDocuments(req.entityId ? { entityId: req.entityId } : {});
      finalRefId = `TXN-${new Date().getFullYear()}-${timestamp}-${1000 + count + 1}`;
    }

    const transaction = new Transaction({
      refId: finalRefId,
      type: type || 'Fee Collection',
      category: category || 'Tuition Fee',
      amount: Number(amount),
      studentName: studentName || '',
      description: description || '',
      paymentMethod: paymentMethod || 'Online',
      status: status || 'Completed',
      date: req.body.date || new Date(),
      entityId: req.entityId || 'default-school',
      schoolSlug: req.schoolSlug || req.headers['x-school-slug'],
    });

    await transaction.save();
    res.status(201).json({
      success: true,
      message: 'Transaction recorded successfully',
      transaction
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Reference ID already exists' });
    }
    res.status(400).json({ message: 'Validation error', error: error.message });
  }
});

// PUT /api/finance/transactions/:id
router.put('/transactions/:id', async (req, res) => {
  if (!checkAdminAuthority(req, res)) return;

  try {
    const transaction = await Transaction.findOneAndUpdate(
      { _id: req.params.id, entityId: req.entityId },
      req.body,
      { new: true, runValidators: true }
    );

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }
    res.json({ success: true, message: 'Transaction updated', transaction });
  } catch (error) {
    res.status(400).json({ message: 'Update error', error: error.message });
  }
});

// DELETE /api/finance/transactions/:id — Delete single transaction
router.delete('/transactions/:id', async (req, res) => {
  if (!checkAdminAuthority(req, res)) return;

  try {
    const transaction = await Transaction.findOneAndDelete({ _id: req.params.id, entityId: req.entityId });

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }
    res.json({ success: true, message: 'Transaction deleted successfully', id: req.params.id });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// DELETE /api/finance/transactions — Bulk delete all transactions
router.delete('/transactions', async (req, res) => {
  if (!checkAdminAuthority(req, res)) return;

  try {
    const filter = { entityId: req.entityId };

    const result = await Transaction.deleteMany(filter);
    res.json({
      success: true,
      message: `Successfully deleted all ${result.deletedCount} transaction records`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// POST /api/finance/seed — On-demand starter transactions
router.post('/seed', async (req, res) => {
  if (!checkAdminAuthority(req, res)) return;

  try {
    const Store = require('../models/Store');
    const User = require('../models/User');
    const schoolUsers = await User.find({ role: 'school' });
    const localStores = await Store.find({});
    if (schoolUsers.length === 0 && localStores.length === 0) {
      return res.status(400).json({
        error: 'School Required',
        message: 'Cannot generate starter financial records without a registered school campus. Please create a school campus first.',
        code: 'SCHOOL_REQUIRED'
      });
    }

    await seedInitialTransactionsIfEmpty(req.entityId, true, req.schoolSlug);
    res.json({
      success: true,
      message: 'Default starter financial transactions created successfully'
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
