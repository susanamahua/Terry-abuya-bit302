// ============================================
// Input Validation Middleware
// ============================================
const { body, param, validationResult } = require('express-validator');

// Handle validation errors
function handleValidation(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(e => ({ field: e.path, message: e.msg }))
    });
  }
  next();
}

// ---- Validation Chains ----

const registerValidation = [
  body('name').trim().notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters'),
  body('email').trim().isEmail().withMessage('Valid email is required')
    .normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').optional().isIn(['donor', 'sponsor', 'staff']).withMessage('Invalid role'),
  body('phone').optional().trim(),
  body('location').optional().trim(),
  body('preferred_type').optional().trim(),
  handleValidation
];

const loginValidation = [
  body('email').trim().isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
  handleValidation
];

const childValidation = [
  body('name').trim().notEmpty().withMessage('Child name is required'),
  body('age').isInt({ min: 0, max: 18 }).withMessage('Age must be 0-18'),
  body('gender').isIn(['Male', 'Female']).withMessage('Gender must be Male or Female'),
  body('home_id').isInt().withMessage('Valid home ID is required'),
  body('health_status').optional().trim(),
  body('education_level').optional().trim(),
  body('welfare_status').optional().isIn(['green', 'amber', 'red']),
  body('needs').optional().trim(),
  handleValidation
];

const donationValidation = [
  body('home_id').isInt().withMessage('Valid home ID is required'),
  body('amount').isFloat({ min: 1 }).withMessage('Amount must be greater than 0'),
  body('donation_type').optional().trim(),
  body('payment_method').optional().trim(),
  body('child_id').optional({ values: 'null' }).isInt().withMessage('Valid child ID required'),
  body('message').optional().trim(),
  handleValidation
];

const sponsorshipValidation = [
  body('child_id').isInt().withMessage('Valid child ID is required'),
  body('monthly_amount').isFloat({ min: 1 }).withMessage('Monthly amount must be greater than 0'),
  body('notes').optional().trim(),
  handleValidation
];

const welfareValidation = [
  body('child_id').isInt().withMessage('Valid child ID is required'),
  body('report_type').trim().notEmpty().withMessage('Report type is required'),
  body('status').optional().trim(),
  body('notes').optional().trim(),
  body('report_date').optional().isISO8601().withMessage('Valid date required'),
  handleValidation
];

const idParamValidation = [
  param('id').isInt().withMessage('Valid ID parameter required'),
  handleValidation
];

module.exports = {
  registerValidation,
  loginValidation,
  childValidation,
  donationValidation,
  sponsorshipValidation,
  welfareValidation,
  idParamValidation,
  handleValidation
};
