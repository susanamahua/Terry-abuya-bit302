// ============================================
// Transaction Model
// ============================================
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Transaction = sequelize.define('Transaction', {
  transaction_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  donation_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: 'donations', key: 'donation_id' }
  },
  sponsorship_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: 'sponsorships', key: 'sponsorship_id' }
  },
  amount: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false
  },
  payment_method: {
    type: DataTypes.STRING(50),
    defaultValue: 'Online'
  },
  payment_status: {
    type: DataTypes.ENUM('Pending', 'Completed', 'Failed', 'Refunded'),
    defaultValue: 'Pending'
  },
  reference_code: {
    type: DataTypes.STRING(50),
    allowNull: true,
    unique: true
  },
  timestamp: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'transactions'
});

module.exports = Transaction;
