const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { uniqueId, password } = req.body;
    
    if (!uniqueId || !password) {
        return res.status(400).json({ message: 'Please provide both uniqueId and password' });
    }

    // Find user by uniqueId (case insensitive)
    const user = await User.findOne({ uniqueId: new RegExp(`^${uniqueId}$`, 'i') });

    if (user && (await user.matchPassword(password))) {
      // Create token
      const token = jwt.sign(
        { id: user._id, role: user.role, uniqueId: user.uniqueId },
        process.env.JWT_SECRET || 'pragati_school_jwt_secret_key_2024',
        { expiresIn: '30d' }
      );

      res.json({
        _id: user._id,
        uniqueId: user.uniqueId,
        role: user.role,
        token,
      });
    } else {
      res.status(401).json({ message: 'Invalid credentials' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
router.post('/register', async (req, res) => {
  try {
    const { uniqueId, password, role } = req.body;

    const userExists = await User.findOne({ uniqueId: new RegExp(`^${uniqueId}$`, 'i') });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = await User.create({
      uniqueId,
      password,
      role
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        uniqueId: user.uniqueId,
        role: user.role
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
