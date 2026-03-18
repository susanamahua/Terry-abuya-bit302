// ============================================
// Sponsorship Model
// ============================================
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Sponsorship = sequelize.define('Sponsorship', {
  sponsorship_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  sponsor_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'users', key: 'user_id' }
  },
  child_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'children', key: 'child_id' }
  },
  monthly_amount: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    validate: { min: 1 }
  },
  start_date: {
    type: DataTypes.DATEONLY,
    defaultValue: DataTypes.NOW
  },
  end_date: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('Active', 'Paused', 'Completed', 'Cancelled'),
    defaultValue: 'Active'
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'sponsorships'
});

module.exports = Sponsorship;
