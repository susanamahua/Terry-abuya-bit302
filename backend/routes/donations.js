// ============================================
// Donation Routes
// ============================================
const express = require('express');
const { Donation, Transaction, User, Home, Child } = require('../models');
const { verifyToken, requireRole } = require('../middleware/auth');
const { donationValidation, idParamValidation } = require('../middleware/validate');

const router = express.Router();

/**
 * POST /api/donations
 * Create a new donation
 */
router.post('/', verifyToken, donationValidation, async (req, res) => {
  try {
    const { home_id, child_id, amount, donation_type, payment_method, message } = req.body;

    // Verify home exists
    const home = await Home.findByPk(home_id);
    if (!home) return res.status(404).json({ success: false, message: 'Home not found' });

    // Verify child if specified
    if (child_id) {
      const child = await Child.findByPk(child_id);
      if (!child) return res.status(404).json({ success: false, message: 'Child not found' });
    }

    // Create donation
    const donation = await Donation.create({
      donor_id: req.user.user_id,
      home_id,
      child_id: child_id || null,
      amount,
      donation_type: donation_type || 'General',
      payment_method: payment_method || 'Online',
      status: 'Pending',
      donation_date: new Date().toISOString().split('T')[0],
      message
    });

    // Create transaction record
    const refCode = 'TXN' + Date.now().toString(36).toUpperCase();
    await Transaction.create({
      donation_id: donation.donation_id,
      amount,
      payment_method: payment_method || 'Online',
      payment_status: 'Pending',
      reference_code: refCode,
      timestamp: new Date()
    });

    // Update child sponsorship if specific child donation
    if (child_id) {
      await Child.update(
        { sponsor_id: req.user.user_id, sponsorship_status: 'sponsored' },
        { where: { child_id } }
      );
    }

    // Fetch full donation with relations
    const fullDonation = await Donation.findByPk(donation.donation_id, {
      include: [
        { model: User, as: 'donor', attributes: ['user_id', 'name'] },
        { model: Home, as: 'home', attributes: ['home_id', 'name'] },
        { model: Child, as: 'child', attributes: ['child_id', 'name'] }
      ]
    });

    // Emit real-time event
    const io = req.app.get('io');
    if (io) io.emit('new_donation', fullDonation);

    res.status(201).json({ success: true, message: 'Donation submitted successfully', donation: fullDonation });
  } catch (error) {
    console.error('Donation error:', error);
    res.status(500).json({ success: false, message: 'Failed to process donation' });
  }
});

/**
 * GET /api/donations
 * Get all donations (admin) or own donations (donor)
 */
router.get('/', verifyToken, async (req, res) => {
  try {
    const { status, type, sort } = req.query;
    const where = {};

    // Non-admin users can only see their own donations
    if (req.user.role !== 'admin' && req.user.role !== 'staff') {
      where.donor_id = req.user.user_id;
    }

    if (status) where.status = status;
    if (type) where.donation_type = type;

    let order = [['donation_date', 'DESC']];
    if (sort === 'amount') order = [['amount', 'DESC']];
    if (sort === 'donor') order = [[{ model: User, as: 'donor' }, 'name', 'ASC']];

    const donations = await Donation.findAll({
      where,
      include: [
        { model: User, as: 'donor', attributes: ['user_id', 'name', 'email'] },
        { model: Home, as: 'home', attributes: ['home_id', 'name'] },
        { model: Child, as: 'child', attributes: ['child_id', 'name'] },
        { model: Transaction, as: 'transaction' }
      ],
      order
    });

    res.json({ success: true, donations });
  } catch (error) {
    console.error('Donations fetch error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch donations' });
  }
});

/**
 * GET /api/donations/history
 * Get donation history for current donor
 */
router.get('/history', verifyToken, async (req, res) => {
  try {
    const donations = await Donation.findAll({
      where: { donor_id: req.user.user_id },
      include: [
        { model: Home, as: 'home', attributes: ['home_id', 'name'] },
        { model: Child, as: 'child', attributes: ['child_id', 'name'] }
      ],
      order: [['donation_date', 'DESC']]
    });

    const total = donations.reduce((sum, d) => sum + parseFloat(d.amount), 0);
    const childrenSponsored = [...new Set(donations.filter(d => d.child_id).map(d => d.child_id))].length;

    res.json({
      success: true,
      donations,
      summary: {
        total_donated: total,
        donation_count: donations.length,
        children_sponsored: childrenSponsored
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch donation history' });
  }
});

/**
 * PUT /api/donations/:id/status
 * Update donation status (admin only)
 */
router.put('/:id/status', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const { status } = req.body;
    if (!['Pending', 'Completed', 'Rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const donation = await Donation.findByPk(req.params.id);
    if (!donation) {
      return res.status(404).json({ success: false, message: 'Donation not found' });
    }

    await donation.update({ status });

    // Update transaction status
    const txnStatus = status === 'Completed' ? 'Completed' : status === 'Rejected' ? 'Failed' : 'Pending';
    await Transaction.update(
      { payment_status: txnStatus },
      { where: { donation_id: donation.donation_id } }
    );

    // If completed, update donor's total
    if (status === 'Completed') {
      await User.increment('total_donated', {
        by: parseFloat(donation.amount),
        where: { user_id: donation.donor_id }
      });
    }

    const io = req.app.get('io');
    if (io) io.emit('donation_update', { donation_id: donation.donation_id, status });

    res.json({ success: true, message: `Donation status updated to ${status}` });
  } catch (error) {
    console.error('Donation status update error:', error);
    res.status(500).json({ success: false, message: 'Failed to update donation status' });
  }
});

module.exports = router;
