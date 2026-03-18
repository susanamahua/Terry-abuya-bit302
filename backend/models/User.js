// ============================================
// User Model
// ============================================
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const bcrypt = require('bcryptjs');

const User = sequelize.define('User', {
  user_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: { notEmpty: true }
  },
  email: {
    type: DataTypes.STRING(150),
    allowNull: false,
    unique: true,
    validate: { isEmail: true }
  },
  password_hash: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  role: {
    type: DataTypes.ENUM('admin', 'donor', 'sponsor', 'staff'),
    allowNull: false,
    defaultValue: 'donor'
  },
  phone: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  location: {
    type: DataTypes.STRING(150),
    allowNull: true
  },
  preferred_type: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  total_donated: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0
  }
}, {
  tableName: 'users',
  hooks: {
    beforeCreate: async (user) => {
      if (user.password_hash && !user.password_hash.startsWith('$2a$')) {
        const salt = await bcrypt.genSalt(10);
        user.password_hash = await bcrypt.hash(user.password_hash, salt);
      }
    }
  }
});

// Instance method to check password
User.prototype.validatePassword = async function (password) {
  return bcrypt.compare(password, this.password_hash);
};

// Remove password from JSON
User.prototype.toSafeJSON = function () {
  const values = { ...this.get() };
  delete values.password_hash;
  return values;
};

module.exports = User;
