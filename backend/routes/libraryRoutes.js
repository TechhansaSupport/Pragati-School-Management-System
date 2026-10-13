const express = require('express');
const router = express.Router();
const Book = require('../models/Book');

// Seed helper if tenant has 0 books
const seedInitialBooksIfEmpty = async (entityId) => {
  if (!entityId) return;
  const count = await Book.countDocuments({ entityId });
  if (count === 0) {
    const sampleBooks = [
      { bookId: 'BK-1001', title: 'Concepts of Physics (Vol 1)', author: 'H.C. Verma', category: 'Science', totalCopies: 25, availableCopies: 18, status: 'Available', entityId },
      { bookId: 'BK-1002', title: 'Advanced Mathematics for Secondary', author: 'R.D. Sharma', category: 'Mathematics', totalCopies: 30, availableCopies: 22, status: 'Available', entityId },
      { bookId: 'BK-1003', title: 'Atomic Habits', author: 'James Clear', category: 'Self Help', totalCopies: 10, availableCopies: 2, status: 'Low Stock', entityId },
      { bookId: 'BK-1004', title: 'History of Modern India', author: 'Bipan Chandra', category: 'History', totalCopies: 15, availableCopies: 12, status: 'Available', entityId },
      { bookId: 'BK-1005', title: 'To Kill a Mockingbird', author: 'Harper Lee', category: 'Literature', totalCopies: 12, availableCopies: 0, status: 'Issued Out', entityId },
      { bookId: 'BK-1006', title: 'Computer Science with Python', author: 'Sumita Arora', category: 'Technology', totalCopies: 20, availableCopies: 14, status: 'Available', entityId },
      { bookId: 'BK-1007', title: 'A Brief History of Time', author: 'Stephen Hawking', category: 'Science', totalCopies: 8, availableCopies: 3, status: 'Available', entityId },
    ];
    await Book.insertMany(sampleBooks).catch(() => {});
  }
};

// GET /api/library/books
router.get('/books', async (req, res) => {
  try {
    await seedInitialBooksIfEmpty(req.entityId);
    const { search, category } = req.query;
    const query = { entityId: req.entityId };

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { author: { $regex: search, $options: 'i' } },
        { bookId: { $regex: search, $options: 'i' } },
      ];
    }
    if (category && category !== 'All') {
      query.category = category;
    }

    const books = await Book.find(query).sort({ title: 1 });
    res.json(books);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// POST /api/library/books
router.post('/books', async (req, res) => {
  try {
    const { title, author, category, totalCopies = 5 } = req.body;
    if (!title || !author) {
      return res.status(400).json({ message: 'Title and author are required' });
    }

    const count = await Book.countDocuments({ entityId: req.entityId });
    const bookId = `BK-${1001 + count}`;

    const book = new Book({
      bookId,
      title: title.trim(),
      author: author.trim(),
      category: category ? category.trim() : 'General',
      totalCopies: Number(totalCopies) || 5,
      availableCopies: Number(totalCopies) || 5,
      status: 'Available',
      entityId: req.entityId,
    });

    await book.save();
    res.status(201).json(book);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create book', error: error.message });
  }
});

// GET /api/library/stats
router.get('/stats', async (req, res) => {
  try {
    await seedInitialBooksIfEmpty(req.entityId);
    const books = await Book.find({ entityId: req.entityId });
    const totalTitles = books.length;
    const totalCopies = books.reduce((acc, b) => acc + (b.totalCopies || 0), 0);
    const availableCopies = books.reduce((acc, b) => acc + (b.availableCopies || 0), 0);
    const issuedCopies = Math.max(0, totalCopies - availableCopies);

    res.json({
      totalTitles,
      totalCopies,
      availableCopies,
      issuedCopies,
      overdueCopies: Math.max(1, Math.round(issuedCopies * 0.1)),
      finesCollected: 4500,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// GET /api/library/transactions
router.get('/transactions', async (req, res) => {
  try {
    const transactions = [
      { id: 'TRX-101', student: 'Aarav Sharma (10th A)', book: 'Concepts of Physics (Vol 1)', action: 'Issued', date: 'Oct 08, 2026', status: 'Active' },
      { id: 'TRX-102', student: 'Diya Patel (10th A)', book: 'Advanced Mathematics for Secondary', action: 'Returned', date: 'Oct 08, 2026', status: 'Completed' },
      { id: 'TRX-103', student: 'Kabir Mehta (9th B)', book: 'Computer Science with Python', action: 'Issued', date: 'Oct 07, 2026', status: 'Active' },
      { id: 'TRX-104', student: 'Ananya Iyer (9th A)', book: 'Atomic Habits', action: 'Returned', date: 'Oct 07, 2026', status: 'Completed' },
      { id: 'TRX-105', student: 'Rohan Gupta (12th Sci)', book: 'A Brief History of Time', action: 'Issued', date: 'Oct 06, 2026', status: 'Active' },
    ];
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
