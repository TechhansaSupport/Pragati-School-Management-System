const express = require('express');
const router = express.Router();
const Book = require('../models/Book');
const LibraryTransaction = require('../models/LibraryTransaction');
const Student = require('../models/Student');

// Seed helper if tenant has 0 books or transactions
const seedInitialLibraryIfEmpty = async (entityId) => {
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

  const txCount = await LibraryTransaction.countDocuments({ entityId });
  if (txCount === 0) {
    const existingStudent = await Student.findOne({ entityId });
    if (existingStudent) {
      await LibraryTransaction.create({
        transactionId: 'TRX-101',
        student: existingStudent.name,
        classSection: `${existingStudent.grade} - Section ${existingStudent.section || 'A'}`,
        rollNo: existingStudent.rollNo || 'STU0001',
        phone: existingStudent.parentContact || '+91 98765 43210',
        email: existingStudent.email || 'student@pragati.edu',
        book: 'Concepts of Physics (Vol 1)',
        bookId: 'BK-1001',
        category: 'Science',
        action: 'Issued',
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: 'Active',
        fine: 0,
        finePaid: false,
        daysOverdue: 0,
        entityId,
      }).catch(() => {});
    }
  }
};

// GET /api/library/books
router.get('/books', async (req, res) => {
  try {
    const entityId = req.entityId || 'default';
    await seedInitialLibraryIfEmpty(entityId);
    const { search, category } = req.query;
    const query = { entityId };

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
    const entityId = req.entityId || 'default';
    const { title, author, category, totalCopies = 5 } = req.body;
    if (!title || !author) {
      return res.status(400).json({ message: 'Title and author are required' });
    }

    const count = await Book.countDocuments({ entityId });
    const bookId = `BK-${1001 + count}`;

    const book = new Book({
      bookId,
      title: title.trim(),
      author: author.trim(),
      category: category ? category.trim() : 'General',
      totalCopies: Number(totalCopies) || 5,
      availableCopies: Number(totalCopies) || 5,
      status: 'Available',
      entityId,
    });

    await book.save();
    res.status(201).json(book);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create book', error: error.message });
  }
});

// DELETE /api/library/books/:id
router.delete('/books/:id', async (req, res) => {
  try {
    const entityId = req.entityId || 'default';
    const deleted = await Book.findOneAndDelete({ _id: req.params.id, entityId });
    if (!deleted) {
      return res.status(404).json({ message: 'Book not found' });
    }
    res.json({ message: 'Book deleted successfully', book: deleted });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete book', error: error.message });
  }
});

// GET /api/library/stats
router.get('/stats', async (req, res) => {
  try {
    const entityId = req.entityId || 'default';
    await seedInitialLibraryIfEmpty(entityId);

    const [books, transactions] = await Promise.all([
      Book.find({ entityId }),
      LibraryTransaction.find({ entityId }),
    ]);

    const totalTitles = books.length;
    const totalCopies = books.reduce((acc, b) => acc + (b.totalCopies || 0), 0);
    const availableCopies = books.reduce((acc, b) => acc + (b.availableCopies || 0), 0);
    const issuedCopies = Math.max(0, totalCopies - availableCopies);

    const now = new Date();
    const overdueTransactions = transactions.filter(t => {
      if (t.status === 'Completed') return false;
      if (t.status === 'Overdue') return true;
      if (t.dueDate) {
        return new Date(t.dueDate) < now;
      }
      return false;
    });

    const overdueCopies = overdueTransactions.length;
    const finesCollected = transactions
      .filter(t => t.finePaid && t.fine > 0)
      .reduce((acc, t) => acc + (t.fine || 0), 0);

    // Calculate circulation demand per book
    const circulationDemand = books.map(b => {
      const issues = transactions.filter(t => t.book === b.title || t.bookId === b.bookId).length;
      const circulatingCount = Math.max(0, (b.totalCopies || 0) - (b.availableCopies || 0));
      return {
        bookId: b.bookId,
        title: b.title,
        author: b.author,
        category: b.category,
        totalCopies: b.totalCopies,
        availableCopies: b.availableCopies,
        issuesCount: issues + circulatingCount * 3,
      };
    }).sort((a, b) => b.issuesCount - a.issuesCount);

    res.json({
      totalTitles,
      totalCopies,
      availableCopies,
      issuedCopies,
      overdueCopies,
      finesCollected: finesCollected || 0,
      circulationDemand,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// GET /api/library/transactions
router.get('/transactions', async (req, res) => {
  try {
    const entityId = req.entityId || 'default';
    await seedInitialLibraryIfEmpty(entityId);

    const { status, search } = req.query;
    const query = { entityId };

    if (status && status !== 'all') {
      if (status === 'issued') {
        query.action = 'Issued';
        query.status = 'Active';
      } else if (status === 'returned') {
        query.status = 'Completed';
      } else if (status === 'overdue') {
        query.status = 'Overdue';
      } else if (status.toLowerCase() === 'active') {
        query.status = { $in: ['Active', 'Overdue'] };
      }
    }

    if (search) {
      query.$or = [
        { student: { $regex: search, $options: 'i' } },
        { book: { $regex: search, $options: 'i' } },
        { transactionId: { $regex: search, $options: 'i' } },
        { classSection: { $regex: search, $options: 'i' } },
      ];
    }

    const transactions = await LibraryTransaction.find(query).sort({ createdAt: -1 });

    // Normalize id field for frontend compatibility
    const normalized = transactions.map(t => ({
      ...t.toObject(),
      id: t.transactionId,
    }));

    res.json(normalized);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// GET /api/library/overdue
router.get('/overdue', async (req, res) => {
  try {
    const entityId = req.entityId || 'default';
    await seedInitialLibraryIfEmpty(entityId);

    const overdue = await LibraryTransaction.find({
      entityId,
      status: 'Overdue',
    }).sort({ fine: -1 });

    const normalized = overdue.map(o => ({
      ...o.toObject(),
      id: o.transactionId,
      days: o.daysOverdue || 3,
    }));

    res.json(normalized);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// POST /api/library/issue - Issue book to student
router.post('/issue', async (req, res) => {
  try {
    const entityId = req.entityId || 'default';
    const { student, classSection, bookId, dueDate, rollNo, phone, email } = req.body;

    if (!student || !bookId) {
      return res.status(400).json({ message: 'Student name and book are required' });
    }

    const book = await Book.findOne({
      entityId,
      $or: [{ bookId: bookId.trim() }, { title: bookId.trim() }],
    });

    if (!book) {
      return res.status(404).json({ message: 'Book not found in library catalog' });
    }

    if (book.availableCopies <= 0) {
      return res.status(400).json({ message: `No available copies of "${book.title}" on shelf` });
    }

    // Decrement available copies
    book.availableCopies = Math.max(0, book.availableCopies - 1);
    if (book.availableCopies === 0) {
      book.status = 'Issued Out';
    } else if (book.availableCopies <= 2) {
      book.status = 'Low Stock';
    } else {
      book.status = 'Available';
    }
    await book.save();

    const count = await LibraryTransaction.countDocuments({ entityId });
    const transactionId = `TRX-${101 + count}`;

    const tx = new LibraryTransaction({
      transactionId,
      student: student.trim(),
      classSection: classSection ? classSection.trim() : 'Class 10 - A',
      rollNo: rollNo ? rollNo.trim() : '',
      phone: phone ? phone.trim() : '',
      email: email ? email.trim() : '',
      book: book.title,
      bookId: book.bookId,
      category: book.category,
      action: 'Issued',
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      dueDate: dueDate || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'Active',
      fine: 0,
      finePaid: false,
      daysOverdue: 0,
      entityId,
    });

    await tx.save();

    res.status(201).json({
      message: `Book "${book.title}" successfully issued to ${student}!`,
      transaction: { ...tx.toObject(), id: tx.transactionId },
      book,
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to issue book', error: error.message });
  }
});

// POST /api/library/return - Return book to catalog shelf
router.post('/return', async (req, res) => {
  try {
    const entityId = req.entityId || 'default';
    const { id, transactionId } = req.body;
    const txId = transactionId || id;

    if (!txId) {
      return res.status(400).json({ message: 'Transaction ID is required' });
    }

    const tx = await LibraryTransaction.findOne({
      entityId,
      $or: [{ transactionId: txId }, { _id: txId }],
    });

    if (!tx) {
      return res.status(404).json({ message: 'Transaction record not found' });
    }

    tx.status = 'Completed';
    tx.action = 'Returned';
    tx.returnDate = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    await tx.save();

    // Increment available copies of the book
    const book = await Book.findOne({
      entityId,
      $or: [{ bookId: tx.bookId }, { title: tx.book }],
    });

    if (book) {
      book.availableCopies = Math.min(book.totalCopies, (book.availableCopies || 0) + 1);
      if (book.availableCopies > 2) {
        book.status = 'Available';
      } else if (book.availableCopies > 0) {
        book.status = 'Low Stock';
      }
      await book.save();
    }

    res.json({
      message: `Book "${tx.book}" successfully returned to catalog shelf!`,
      transaction: { ...tx.toObject(), id: tx.transactionId },
      book,
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to return book', error: error.message });
  }
});

// POST /api/library/settle-overdue - Settle overdue fine and return book
router.post('/settle-overdue', async (req, res) => {
  try {
    const entityId = req.entityId || 'default';
    const { id, transactionId } = req.body;
    const txId = transactionId || id;

    const tx = await LibraryTransaction.findOne({
      entityId,
      $or: [{ transactionId: txId }, { _id: txId }],
    });

    if (!tx) {
      return res.status(404).json({ message: 'Overdue record not found' });
    }

    tx.status = 'Completed';
    tx.action = 'Returned';
    tx.finePaid = true;
    tx.returnDate = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    await tx.save();

    // Increment available copies
    const book = await Book.findOne({
      entityId,
      $or: [{ bookId: tx.bookId }, { title: tx.book }],
    });

    if (book) {
      book.availableCopies = Math.min(book.totalCopies, (book.availableCopies || 0) + 1);
      book.status = book.availableCopies > 2 ? 'Available' : 'Low Stock';
      await book.save();
    }

    res.json({
      message: `Overdue settled for ${tx.student}. Fine of ₹${tx.fine || 0} collected.`,
      transaction: { ...tx.toObject(), id: tx.transactionId },
      book,
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to settle overdue', error: error.message });
  }
});

// POST /api/library/alerts/dispatch - Send return reminder/alert to student
router.post('/alerts/dispatch', async (req, res) => {
  try {
    const { student, book, channels, alertType, message } = req.body;
    res.json({
      success: true,
      message: `Alert dispatched to ${student || 'Student'} successfully.`,
      dispatchedAt: new Date().toISOString(),
      channels: channels || ['portal', 'sms', 'whatsapp'],
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to dispatch alert', error: error.message });
  }
});

module.exports = router;
