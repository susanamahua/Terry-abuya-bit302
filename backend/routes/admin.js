// ============================================
// Admin Routes - Dashboard & User Management
// ============================================
const express = require('express');
const { User, Home, Child, Donation, Sponsorship, Transaction, WelfareReport } = require('../models');
const { verifyToken, requireRole } = require('../middleware/auth');
const { sequelize } = require('../config/database');

const router = express.Router();

/**
 * GET /api/admin/stats
 * Dashboard statistics
 */
router.get('/stats', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const totalChildren = await Child.count();
    const totalHomes = await Home.count();
    const totalDonors = await User.count({ where: { role: 'donor' } });
    const totalSponsors = await User.count({ where: { role: 'sponsor' } });

    // Donation totals
    const donations = await Donation.findAll();
    const totalDonationAmount = donations.reduce((s, d) => s + parseFloat(d.amount), 0);
    const completedDonations = donations.filter(d => d.status === 'Completed');
    const completedAmount = completedDonations.reduce((s, d) => s + parseFloat(d.amount), 0);
    const pendingDonations = donations.filter(d => d.status === 'Pending');
    const pendingAmount = pendingDonations.reduce((s, d) => s + parseFloat(d.amount), 0);

    // Sponsorship stats
    const activeSponsorships = await Sponsorship.count({ where: { status: 'Active' } });

    // Welfare stats
    const welfareStats = { green: 0, amber: 0, red: 0 };
    const children = await Child.findAll({ attributes: ['welfare_status'] });
    children.forEach(c => { welfareStats[c.welfare_status] = (welfareStats[c.welfare_status] || 0) + 1; });

    // Donations by type
    const donationsByType = {};
    donations.forEach(d => {
      donationsByType[d.donation_type] = (donationsByType[d.donation_type] || 0) + parseFloat(d.amount);
    });

    // Donations by month
    const donationsByMonth = {};
    donations.forEach(d => {
      const month = d.donation_date ? d.donation_date.substring(0, 7) : 'Unknown';
      donationsByMonth[month] = (donationsByMonth[month] || 0) + parseFloat(d.amount);
    });

    res.json({
      success: true,
      stats: {
        total_children: totalChildren,
        total_homes: totalHomes,
        total_donors: totalDonors,
        total_sponsors: totalSponsors,
        total_donations: totalDonationAmount,
        completed_donations: { count: completedDonations.length, amount: completedAmount },
        pending_donations: { count: pendingDonations.length, amount: pendingAmount },
        total_transactions: donations.length,
        active_sponsorships: activeSponsorships,
        welfare: welfareStats,
        donations_by_type: donationsByType,
        donations_by_month: donationsByMonth
      }
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch statistics' });
  }
});

/**
 * GET /api/admin/users
 * Get all users
 */
router.get('/users', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const { role } = req.query;
    const where = {};
    if (role) where.role = role;

    const users = await User.findAll({
      where,
      attributes: { exclude: ['password_hash'] },
      order: [['created_at', 'DESC']]
    });

    res.json({ success: true, users });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch users' });
  }
});

/**
 * POST /api/admin/users
 * Create a new admin or staff user
 */
router.post('/users', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const { name, email, password, role, phone, location } = req.body;

    // Check if email already exists
    const existing = await User.findOne({ where: { email } });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Create user
    const newUserRole = role === 'staff' ? 'staff' : 'admin';
    const user = await User.create({
      name,
      email,
      password_hash: password,
      role: newUserRole,
      phone,
      location
    });

    res.status(201).json({
      success: true,
      message: `${newUserRole.charAt(0).toUpperCase() + newUserRole.slice(1)} account created successfully`,
      user: user.toSafeJSON()
    });
  } catch (error) {
    console.error('Create admin error:', error);
    res.status(500).json({ success: false, message: 'Server error during user creation' });
  }
});

/**
 * GET /api/admin/recent-activity
 * Get recent donations and welfare reports
 */
router.get('/recent-activity', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const recentDonations = await Donation.findAll({
      include: [
        { model: User, as: 'donor', attributes: ['name'] },
        { model: Home, as: 'home', attributes: ['name'] },
        { model: Child, as: 'child', attributes: ['name'] }
      ],
      order: [['donation_date', 'DESC']],
      limit: 10
    });

    const recentWelfare = await WelfareReport.findAll({
      include: [
        { model: Child, as: 'child', attributes: ['name', 'photo'] }
      ],
      order: [['report_date', 'DESC']],
      limit: 10
    });

    res.json({
      success: true,
      recent_donations: recentDonations,
      recent_welfare: recentWelfare
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch recent activity' });
  }
});

module.exports = router;
