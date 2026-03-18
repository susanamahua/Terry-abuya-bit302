// ============================================
// Children Routes - Full CRUD + Auto-Match
// ============================================
const express = require('express');
const { Child, Home, User, WelfareReport } = require('../models');
const { verifyToken, requireRole } = require('../middleware/auth');
const { childValidation, idParamValidation } = require('../middleware/validate');

const router = express.Router();

/**
 * GET /api/children
 * Get all children (with optional filters)
 */
router.get('/', async (req, res) => {
  try {
    const { home_id, gender, welfare_status, search, sponsorship_status } = req.query;
    const where = {};

    if (home_id) where.home_id = home_id;
    if (gender) where.gender = gender;
    if (welfare_status) where.welfare_status = welfare_status;
    if (sponsorship_status) where.sponsorship_status = sponsorship_status;
    if (search) {
      const { Op } = require('sequelize');
      where.name = { [Op.like]: `%${search}%` };
    }

    const children = await Child.findAll({
      where,
      include: [
        { model: Home, as: 'home', attributes: ['home_id', 'name', 'location'] },
        { model: User, as: 'sponsor', attributes: ['user_id', 'name'] }
      ],
      order: [['name', 'ASC']]
    });

    res.json({ success: true, children });
  } catch (error) {
    console.error('Children fetch error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch children' });
  }
});

/**
 * GET /api/children/:id
 * Get a single child with welfare reports
 */
router.get('/:id', idParamValidation, async (req, res) => {
  try {
    const child = await Child.findByPk(req.params.id, {
      include: [
        { model: Home, as: 'home' },
        { model: User, as: 'sponsor', attributes: ['user_id', 'name', 'email'] },
        { model: WelfareReport, as: 'welfareReports', order: [['report_date', 'DESC']] }
      ]
    });

    if (!child) {
      return res.status(404).json({ success: false, message: 'Child not found' });
    }

    res.json({ success: true, child });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch child details' });
  }
});

/**
 * POST /api/children
 * Add a new child (admin/staff only)
 */
router.post('/', verifyToken, requireRole('admin', 'staff'), childValidation, async (req, res) => {
  try {
    const { name, age, gender, home_id, health_status, education_level, welfare_status, needs, join_date, photo } = req.body;

    // Verify home exists
    const home = await Home.findByPk(home_id);
    if (!home) {
      return res.status(404).json({ success: false, message: 'Home not found' });
    }

    const child = await Child.create({
      name, age, gender, home_id,
      health_status: health_status || 'Good',
      education_level,
      welfare_status: welfare_status || 'green',
      needs,
      join_date: join_date || new Date().toISOString().split('T')[0],
      photo: photo || (gender === 'Female' ? '👧🏾' : '👦🏾'),
      sponsorship_status: 'unsponsored'
    });

    // Emit real-time event
    const io = req.app.get('io');
    if (io) io.emit('child_update', { action: 'created', child });

    res.status(201).json({ success: true, message: 'Child added successfully', child });
  } catch (error) {
    console.error('Child creation error:', error);
    res.status(500).json({ success: false, message: 'Failed to add child' });
  }
});

/**
 * PUT /api/children/:id
 * Update a child (admin/staff only)
 */
router.put('/:id', verifyToken, requireRole('admin', 'staff'), async (req, res) => {
  try {
    const child = await Child.findByPk(req.params.id);
    if (!child) {
      return res.status(404).json({ success: false, message: 'Child not found' });
    }

    const allowedFields = ['name', 'age', 'gender', 'home_id', 'health_status', 'education_level', 'welfare_status', 'needs', 'photo', 'sponsorship_status'];
    const updates = {};
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    await child.update(updates);

    const io = req.app.get('io');
    if (io) io.emit('child_update', { action: 'updated', child });

    res.json({ success: true, message: 'Child updated successfully', child });
  } catch (error) {
    console.error('Child update error:', error);
    res.status(500).json({ success: false, message: 'Failed to update child' });
  }
});

/**
 * DELETE /api/children/:id
 * Delete a child (admin only)
 */
router.delete('/:id', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const child = await Child.findByPk(req.params.id);
    if (!child) {
      return res.status(404).json({ success: false, message: 'Child not found' });
    }

    const childName = child.name;
    await child.destroy();

    const io = req.app.get('io');
    if (io) io.emit('child_update', { action: 'deleted', child_id: req.params.id });

    res.json({ success: true, message: `${childName} has been removed` });
  } catch (error) {
    console.error('Child deletion error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete child' });
  }
});

/**
 * GET /api/children/match/auto
 * Auto-match algorithm - find best child match for a donor
 */
router.get('/match/auto', verifyToken, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.user_id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Get unsponsored children
    const children = await Child.findAll({
      where: { sponsorship_status: 'unsponsored' },
      include: [{ model: Home, as: 'home' }]
    });

    if (children.length === 0) {
      return res.json({ success: true, match: null, message: 'No unsponsored children available' });
    }

    // Score each child
    const scored = children.map(child => {
      let score = 0;
      const c = child.get({ plain: true });

      // Urgency scoring
      if (c.welfare_status === 'red') score += 30;
      else if (c.welfare_status === 'amber') score += 20;
      else score += 10;

      // Match donor preference to child needs
      const pref = (user.preferred_type || '').toLowerCase();
      const needs = (c.needs || '').toLowerCase();
      if (pref && needs.includes(pref)) score += 25;
      if (pref === 'education' && (needs.includes('school') || needs.includes('book') || needs.includes('tuition'))) score += 20;
      if (pref === 'healthcare' && (needs.includes('medical') || needs.includes('health') || needs.includes('nutrition'))) score += 20;

      // Younger children priority
      if (c.age < 7) score += 10;
      else if (c.age < 12) score += 5;

      // Add randomness
      score += Math.random() * 10;

      return { child: c, score };
    });

    scored.sort((a, b) => b.score - a.score);

    res.json({ success: true, match: scored[0] });
  } catch (error) {
    console.error('Auto-match error:', error);
    res.status(500).json({ success: false, message: 'Auto-match failed' });
  }
});

module.exports = router;
