// ============================================
// Home Model (Children's Home)
// ============================================
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Home = sequelize.define('Home', {
  home_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(150),
    allowNull: false
  },
  location: {
    type: DataTypes.STRING(150),
    allowNull: false
  },
  latitude: {
    type: DataTypes.DECIMAL(10, 6),
    allowNull: true
  },
  longitude: {
    type: DataTypes.DECIMAL(10, 6),
    allowNull: true
  },
  capacity: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  established: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  needs: {
    type: DataTypes.TEXT, // stored as JSON string
    allowNull: true,
    get() {
      const val = this.getDataValue('needs');
      return val ? JSON.parse(val) : [];
    },
    set(val) {
      this.setDataValue('needs', JSON.stringify(val));
    }
  },
  image: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  rating: {
    type: DataTypes.DECIMAL(2, 1),
    defaultValue: 0
  }
}, {
  tableName: 'homes'
});

module.exports = Home;
