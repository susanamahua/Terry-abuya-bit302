// ============================================
// Welfare Report Model
// ============================================
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const WelfareReport = sequelize.define('WelfareReport', {
  report_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  child_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'children', key: 'child_id' }
  },
  report_type: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  status: {
    type: DataTypes.STRING(30),
    defaultValue: 'Good'
  },
  report_date: {
    type: DataTypes.DATEONLY,
    defaultValue: DataTypes.NOW
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  reported_by: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: 'users', key: 'user_id' }
  }
}, {
  tableName: 'welfare_reports'
});

module.exports = WelfareReport;
