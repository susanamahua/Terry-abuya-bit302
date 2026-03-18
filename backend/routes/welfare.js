// ============================================
// Welfare Routes
// ============================================
const express = require('express');
const { WelfareReport, Child, Home, User } = require('../models');
const { verifyToken, requireRole } = require('../middleware/auth');
const { welfareValidation } = require('../middleware/validate');

const router = express.Router();

/**
 * POST /api/welfare
 * Add a new welfare report (admin/staff only)
 */
router.post('/', verifyToken, requireRole('admin', 'staff'), welfareValidation, async (req, res) => {
  try {
    const { child_id, report_type, status, notes, report_date } = req.body;

    // Verify child exists
    const child = await Child.findByPk(child_id);
    if (!child) {
      return res.status(404).json({ success: false, message: 'Child not found' });
    }

    const report = await WelfareReport.create({
      child_id,
      report_type,
      status: status || 'Good',
      notes,
      report_date: report_date || new Date().toISOString().split('T')[0],
      reported_by: req.user.user_id
    });

    // Update child welfare status based on report
    const statusMap = { 'Good': 'green', 'In Progress': 'amber', 'Needs Attention': 'amber', 'Recovering': 'amber', 'Critical': 'red' };
    const newWelfare = statusMap[status] || 'green';
    const newHealth = status === 'Good' ? 'Good' : status;
    await child.update({ welfare_status: newWelfare, health_status: newHealth });

    const io = req.app.get('io');
    if (io) {
      io.emit('welfare_alert', { report, child: child.get({ plain: true }) });
    }

    res.status(201).json({ success: true, message: 'Welfare report submitted', report });
  } catch (error) {
    console.error('Welfare report error:', error);
    res.status(500).json({ success: false, message: 'Failed to submit welfare report' });
  }
});

/**
 * GET /api/welfare
 * Get all welfare reports
 */
router.get('/', verifyToken, async (req, res) => {
  try {
    const { type, child_id } = req.query;
    const where = {};
    if (type) where.report_type = type;
    if (child_id) where.child_id = child_id;

    const reports = await WelfareReport.findAll({
      where,
      include: [
        {
          model: Child, as: 'child',
          attributes: ['child_id', 'name', 'age', 'photo', 'welfare_status'],
          include: [{ model: Home, as: 'home', attributes: ['name'] }]
        },
        { model: User, as: 'reporter', attributes: ['user_id', 'name'] }
      ],
      order: [['report_date', 'DESC']]
    });

    res.json({ success: true, reports });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch welfare reports' });
  }
});

/**
 * GET /api/welfare/child/:childId
 * Get welfare reports for a specific child
 */
router.get('/child/:childId', verifyToken, async (req, res) => {
  try {
    const child = await Child.findByPk(req.params.childId, {
      include: [
        { model: Home, as: 'home' },
        { model: User, as: 'sponsor', attributes: ['user_id', 'name'] }
      ]
    });

    if (!child) {
      return res.status(404).json({ success: false, message: 'Child not found' });
    }

    const reports = await WelfareReport.findAll({
      where: { child_id: req.params.childId },
      include: [{ model: User, as: 'reporter', attributes: ['user_id', 'name'] }],
      order: [['report_date', 'DESC']]
    });

    res.json({ success: true, child, reports });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch child welfare data' });
  }
});

/**
 * GET /api/welfare/stats
 * Get welfare statistics
 */
router.get('/stats', verifyToken, requireRole('admin', 'staff'), async (req, res) => {
  try {
    const children = await Child.findAll();
    const stats = { green: 0, amber: 0, red: 0 };
    children.forEach(c => { stats[c.welfare_status] = (stats[c.welfare_status] || 0) + 1; });

    const recentCritical = await Child.findAll({
      where: { welfare_status: ['red', 'amber'] },
      include: [{ model: Home, as: 'home', attributes: ['name'] }],
      order: [['updated_at', 'DESC']]
    });

    res.json({ success: true, stats, attention_needed: recentCritical });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch welfare stats' });
  }
});

module.exports = router;
