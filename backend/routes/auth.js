// ============================================
// Auth Routes - Registration & Login
// ============================================
const express = require('express');
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { registerValidation, loginValidation } = require('../middleware/validate');
const { verifyToken } = require('../middleware/auth');
require('dotenv').config();

const router = express.Router();

/**
 * POST /api/auth/register
 * Register a new user (donor/sponsor)
 */
router.post('/register', registerValidation, async (req, res) => {
  try {
    const { name, email, password, role, phone, location, preferred_type } = req.body;

    // Check if email already exists
    const existing = await User.findOne({ where: { email } });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered'
      });
    }

    // Create user (password hashed by model hook)
    const user = await User.create({
      name,
      email,
      password_hash: password,
      role: role || 'donor',
      phone,
      location,
      preferred_type
    });

    // Generate JWT
    const token = jwt.sign(
      { user_id: user.user_id, name: user.name, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      token,
      user: user.toSafeJSON()
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ success: false, message: 'Server error during registration' });
  }
});

/**
 * POST /api/auth/login
 * Login with email and password
 */
router.post('/login', loginValidation, async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check password
    const validPassword = await user.validatePassword(password);
    if (!validPassword) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Generate JWT
    const token = jwt.sign(
      { user_id: user.user_id, name: user.name, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: user.toSafeJSON()
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Server error during login' });
  }
});

/**
 * GET /api/auth/me
 * Get current authenticated user profile
 */
router.get('/me', verifyToken, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.user_id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({ success: true, user: user.toSafeJSON() });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
