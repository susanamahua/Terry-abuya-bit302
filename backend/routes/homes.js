// ============================================
// Homes Routes
// ============================================
const express = require('express');
const { Home, Child, Donation, User } = require('../models');
const { optionalAuth } = require('../middleware/auth');
const { sequelize } = require('../config/database');

const router = express.Router();

/**
 * GET /api/homes
 * Get all children's homes
 */
router.get('/', optionalAuth, async (req, res) => {
  try {
    const homes = await Home.findAll({
      include: [
        {
          model: Child,
          as: 'children',
          attributes: ['child_id']
        }
      ],
      order: [['name', 'ASC']]
    });

    const result = homes.map(h => {
      const data = h.get({ plain: true });
      data.children_count = data.children ? data.children.length : 0;
      delete data.children;
      return data;
    });

    res.json({ success: true, homes: result });
  } catch (error) {
    console.error('Homes fetch error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch homes' });
  }
});

/**
 * GET /api/homes/:id
 * Get a single home with children and donation totals
 */
router.get('/:id', async (req, res) => {
  try {
    const home = await Home.findByPk(req.params.id, {
      include: [
        {
          model: Child,
          as: 'children',
          include: [
            { model: User, as: 'sponsor', attributes: ['user_id', 'name'] }
          ]
        },
        {
          model: Donation,
          as: 'donations',
          attributes: ['donation_id', 'amount', 'status']
        }
      ]
    });

    if (!home) {
      return res.status(404).json({ success: false, message: 'Home not found' });
    }

    const data = home.get({ plain: true });
    data.total_received = data.donations
      .filter(d => d.status === 'Completed')
      .reduce((sum, d) => sum + parseFloat(d.amount), 0);
    data.children_count = data.children.length;

    res.json({ success: true, home: data });
  } catch (error) {
    console.error('Home detail error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch home details' });
  }
});

module.exports = router;
