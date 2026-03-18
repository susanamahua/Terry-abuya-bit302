// ============================================
// Donation Model
// ============================================
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Donation = sequelize.define('Donation', {
  donation_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  donor_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'users', key: 'user_id' }
  },
  home_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'homes', key: 'home_id' }
  },
  child_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: 'children', key: 'child_id' }
  },
  amount: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    validate: { min: 1 }
  },
  donation_type: {
    type: DataTypes.STRING(50),
    defaultValue: 'General'
  },
  payment_method: {
    type: DataTypes.STRING(50),
    defaultValue: 'Online'
  },
  status: {
    type: DataTypes.ENUM('Pending', 'Completed', 'Rejected'),
    defaultValue: 'Pending'
  },
  donation_date: {
    type: DataTypes.DATEONLY,
    defaultValue: DataTypes.NOW
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'donations'
});

module.exports = Donation;
