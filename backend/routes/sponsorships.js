// ============================================
// Sponsorship Routes
// ============================================
const express = require('express');
const { Sponsorship, Child, User, Home, Transaction } = require('../models');
const { verifyToken, requireRole } = require('../middleware/auth');
const { sponsorshipValidation } = require('../middleware/validate');

const router = express.Router();

/**
 * POST /api/sponsorships
 * Create a new sponsorship
 */
router.post('/', verifyToken, sponsorshipValidation, async (req, res) => {
  try {
    const { child_id, monthly_amount, notes } = req.body;

    // Verify child exists and is unsponsored
    const child = await Child.findByPk(child_id, {
      include: [{ model: Home, as: 'home' }]
    });
    if (!child) {
      return res.status(404).json({ success: false, message: 'Child not found' });
    }

    // Check if child already has active sponsorship
    const existing = await Sponsorship.findOne({
      where: { child_id, status: 'Active' }
    });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Child already has an active sponsor' });
    }

    // Create sponsorship
    const sponsorship = await Sponsorship.create({
      sponsor_id: req.user.user_id,
      child_id,
      monthly_amount,
      start_date: new Date().toISOString().split('T')[0],
      status: 'Active',
      notes
    });

    // Update child's sponsorship status
    await child.update({
      sponsorship_status: 'sponsored',
      sponsor_id: req.user.user_id
    });

    // Create initial transaction
    const refCode = 'SPO' + Date.now().toString(36).toUpperCase();
    await Transaction.create({
      sponsorship_id: sponsorship.sponsorship_id,
      amount: monthly_amount,
      payment_method: 'Online',
      payment_status: 'Completed',
      reference_code: refCode,
      timestamp: new Date()
    });

    const io = req.app.get('io');
    if (io) io.emit('sponsorship_update', { action: 'created', sponsorship, child: child.get({ plain: true }) });

    res.status(201).json({ success: true, message: 'Sponsorship created successfully', sponsorship });
  } catch (error) {
    console.error('Sponsorship error:', error);
    res.status(500).json({ success: false, message: 'Failed to create sponsorship' });
  }
});

/**
 * GET /api/sponsorships
 * Get all sponsorships (admin) or own sponsorships (sponsor/donor)
 */
router.get('/', verifyToken, async (req, res) => {
  try {
    const where = {};
    if (req.user.role !== 'admin' && req.user.role !== 'staff') {
      where.sponsor_id = req.user.user_id;
    }

    const { status } = req.query;
    if (status) where.status = status;

    const sponsorships = await Sponsorship.findAll({
      where,
      include: [
        { model: User, as: 'sponsor', attributes: ['user_id', 'name', 'email'] },
        {
          model: Child, as: 'child',
          include: [{ model: Home, as: 'home', attributes: ['home_id', 'name', 'location'] }]
        }
      ],
      order: [['created_at', 'DESC']]
    });

    res.json({ success: true, sponsorships });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch sponsorships' });
  }
});

/**
 * GET /api/sponsorships/reports
 * Generate sponsorship summary reports (admin)
 */
router.get('/reports', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const total = await Sponsorship.count();
    const active = await Sponsorship.count({ where: { status: 'Active' } });
    const paused = await Sponsorship.count({ where: { status: 'Paused' } });
    const cancelled = await Sponsorship.count({ where: { status: 'Cancelled' } });

    const sponsorships = await Sponsorship.findAll({
      where: { status: 'Active' },
      include: [
        { model: User, as: 'sponsor', attributes: ['name', 'email'] },
        { model: Child, as: 'child', attributes: ['name', 'age'] }
      ]
    });

    const totalMonthly = sponsorships.reduce((s, sp) => s + parseFloat(sp.monthly_amount), 0);

    res.json({
      success: true,
      report: {
        total_sponsorships: total,
        active, paused, cancelled,
        total_monthly_amount: totalMonthly,
        active_sponsorships: sponsorships
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to generate report' });
  }
});

/**
 * PUT /api/sponsorships/:id
 * Update sponsorship status
 */
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const sponsorship = await Sponsorship.findByPk(req.params.id);
    if (!sponsorship) {
      return res.status(404).json({ success: false, message: 'Sponsorship not found' });
    }

    // Only owner or admin can update
    if (req.user.role !== 'admin' && sponsorship.sponsor_id !== req.user.user_id) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const { status, monthly_amount, notes } = req.body;
    const updates = {};
    if (status) updates.status = status;
    if (monthly_amount) updates.monthly_amount = monthly_amount;
    if (notes !== undefined) updates.notes = notes;
    if (status === 'Cancelled' || status === 'Completed') updates.end_date = new Date().toISOString().split('T')[0];

    await sponsorship.update(updates);

    // Update child status if cancelled
    if (status === 'Cancelled' || status === 'Completed') {
      await Child.update(
        { sponsorship_status: 'unsponsored', sponsor_id: null },
        { where: { child_id: sponsorship.child_id } }
      );
    }

    const io = req.app.get('io');
    if (io) io.emit('sponsorship_update', { action: 'updated', sponsorship });

    res.json({ success: true, message: 'Sponsorship updated', sponsorship });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update sponsorship' });
  }
});

module.exports = router;
