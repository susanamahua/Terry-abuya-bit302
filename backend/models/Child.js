// ============================================
// Child Model
// ============================================
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Child = sequelize.define('Child', {
  child_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: { notEmpty: true }
  },
  age: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: { min: 0, max: 18 }
  },
  gender: {
    type: DataTypes.ENUM('Male', 'Female'),
    allowNull: false
  },
  health_status: {
    type: DataTypes.STRING(50),
    defaultValue: 'Good'
  },
  education_level: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  welfare_status: {
    type: DataTypes.ENUM('green', 'amber', 'red'),
    defaultValue: 'green'
  },
  needs: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  sponsorship_status: {
    type: DataTypes.ENUM('unsponsored', 'sponsored', 'partial'),
    defaultValue: 'unsponsored'
  },
  join_date: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  photo: {
    type: DataTypes.STRING(10),
    allowNull: true
  },
  home_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'homes', key: 'home_id' }
  },
  sponsor_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: 'users', key: 'user_id' }
  }
}, {
  tableName: 'children'
});

module.exports = Child;
