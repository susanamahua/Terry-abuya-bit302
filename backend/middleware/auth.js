// ============================================
// Authentication Middleware - JWT + Role Guard
// ============================================
const jwt = require('jsonwebtoken');
require('dotenv').config();

/**
 * Verify JWT token from Authorization header
 * Attaches decoded user to req.user
 */
function verifyToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ 
      success: false, 
      message: 'Access denied. No token provided.' 
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ 
      success: false, 
      message: 'Invalid or expired token.' 
    });
  }
}

/**
 * Role-based access control middleware
 * @param  {...string} roles - Allowed roles (e.g., 'admin', 'donor')
 */
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required.' 
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: `Access denied. Required role: ${roles.join(' or ')}.` 
      });
    }

    next();
  };
}

/**
 * Optional auth - doesn't fail if no token, but attaches user if present
 */
function optionalAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
    } catch (error) {
      // Token invalid but we don't block - just no user attached
    }
  }

  next();
}

module.exports = { verifyToken, requireRole, optionalAuth };
