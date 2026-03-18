// ============================================
// Model Index - Associations & Relationships
// ============================================
const { sequelize } = require('../config/database');
const User = require('./User');
const Home = require('./Home');
const Child = require('./Child');
const Donation = require('./Donation');
const Sponsorship = require('./Sponsorship');
const Transaction = require('./Transaction');
const WelfareReport = require('./WelfareReport');

// ---- Associations ----

// Home has many Children
Home.hasMany(Child, { foreignKey: 'home_id', as: 'children' });
Child.belongsTo(Home, { foreignKey: 'home_id', as: 'home' });

// User (sponsor) has many Children
User.hasMany(Child, { foreignKey: 'sponsor_id', as: 'sponsoredChildren' });
Child.belongsTo(User, { foreignKey: 'sponsor_id', as: 'sponsor' });

// User (donor) has many Donations
User.hasMany(Donation, { foreignKey: 'donor_id', as: 'donations' });
Donation.belongsTo(User, { foreignKey: 'donor_id', as: 'donor' });

// Home has many Donations
Home.hasMany(Donation, { foreignKey: 'home_id', as: 'donations' });
Donation.belongsTo(Home, { foreignKey: 'home_id', as: 'home' });

// Child has many Donations (optional child-specific donations)
Child.hasMany(Donation, { foreignKey: 'child_id', as: 'donations' });
Donation.belongsTo(Child, { foreignKey: 'child_id', as: 'child' });

// User (sponsor) has many Sponsorships
User.hasMany(Sponsorship, { foreignKey: 'sponsor_id', as: 'sponsorships' });
Sponsorship.belongsTo(User, { foreignKey: 'sponsor_id', as: 'sponsor' });

// Child has many Sponsorships
Child.hasMany(Sponsorship, { foreignKey: 'child_id', as: 'sponsorships' });
Sponsorship.belongsTo(Child, { foreignKey: 'child_id', as: 'child' });

// Donation has one Transaction
Donation.hasOne(Transaction, { foreignKey: 'donation_id', as: 'transaction' });
Transaction.belongsTo(Donation, { foreignKey: 'donation_id', as: 'donation' });

// Sponsorship has many Transactions
Sponsorship.hasMany(Transaction, { foreignKey: 'sponsorship_id', as: 'transactions' });
Transaction.belongsTo(Sponsorship, { foreignKey: 'sponsorship_id', as: 'sponsorship' });

// Child has many WelfareReports
Child.hasMany(WelfareReport, { foreignKey: 'child_id', as: 'welfareReports' });
WelfareReport.belongsTo(Child, { foreignKey: 'child_id', as: 'child' });

// User (reporter) has many WelfareReports
User.hasMany(WelfareReport, { foreignKey: 'reported_by', as: 'reports' });
WelfareReport.belongsTo(User, { foreignKey: 'reported_by', as: 'reporter' });

module.exports = {
  sequelize,
  User,
  Home,
  Child,
  Donation,
  Sponsorship,
  Transaction,
  WelfareReport
};
