// ============================================
// Database Configuration - Sequelize + SQLite
// ============================================
const { Sequelize } = require('sequelize');
const path = require('path');
require('dotenv').config();

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, '..', process.env.DB_STORAGE || './database.sqlite'),
  logging: false,
  define: {
    timestamps: true,
    underscored: true
  }
});

// Test connection
async function testConnection() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');
  } catch (error) {
    console.error('❌ Unable to connect to the database:', error.message);
    process.exit(1);
  }
}

module.exports = { sequelize, testConnection };
