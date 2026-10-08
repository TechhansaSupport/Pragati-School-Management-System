const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');

// GET /api/finance/transactions — List all transactions
router.get('/transactions', async (req, res) => {
  try {
    const { search, page = 1, limit = 10, type, status } = req.query;
    const query = {};

    if (search) {
      query.$or = [
        { refId: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } },
        { studentName: { $regex: search, $options: 'i' } },
      ];
    }

    if (type) query.type = type;
    if (status) query.status = status;

    const total = await Transaction.countDocuments(query);
    const transactions = await Transaction.find(query)
      .sort({ date: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({
      transactions,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// GET /api/finance/stats — Financial KPIs
router.get('/stats', async (req, res) => {
  try {
    const collections = await Transaction.aggregate([
      { $match: { type: 'Fee Collection', status: 'Completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);

    const expenses = await Transaction.aggregate([
      { $match: { type: 'Expense', status: 'Completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);

    const pendingFees = await Transaction.aggregate([
      { $match: { type: 'Fee Collection', status: 'Pending' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);

    const totalCollections = collections.length > 0 ? collections[0].total : 0;
    const totalExpenses = expenses.length > 0 ? expenses[0].total : 0;
    const totalPending = pendingFees.length > 0 ? pendingFees[0].total : 0;

    res.json({
      totalCollections,
      totalExpenses,
      pendingFees: totalPending,
      availableBalance: totalCollections - totalExpenses,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// POST /api/finance/transactions
router.post('/transactions', async (req, res) => {
  try {
    const transaction = new Transaction(req.body);
    await transaction.save();
    res.status(201).json(transaction);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Reference ID already exists' });
    }
    res.status(400).json({ message: 'Validation error', error: error.message });
  }
});

// PUT /api/finance/transactions/:id
router.put('/transactions/:id', async (req, res) => {
  try {
    const transaction = await Transaction.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }
    res.json(transaction);
  } catch (error) {
    res.status(400).json({ message: 'Update error', error: error.message });
  }
});

// DELETE /api/finance/transactions/:id
router.delete('/transactions/:id', async (req, res) => {
  try {
    const transaction = await Transaction.findByIdAndDelete(req.params.id);
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }
    res.json({ message: 'Transaction deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
