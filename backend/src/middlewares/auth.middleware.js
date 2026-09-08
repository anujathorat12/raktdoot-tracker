'use strict';
const jwt = require('jsonwebtoken');
const { dbGet } = require('../db/database');

const JWT_SECRET = process.env.JWT_SECRET || 'delivery_tracking_super_secret_key_2024';

/**
 * Verifies JWT token and attaches decoded user to req.user.
 */
function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'No token provided.' });
  }

  const token = authHeader.slice(7);
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    // Verify user still exists
    const user = dbGet('SELECT id, name, email, role, phone, avatar_color, is_active FROM users WHERE id = ?', [decoded.id]);
    if (!user || !user.is_active) {
      return res.status(401).json({ success: false, message: 'User not found or deactivated.' });
    }
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token.' });
  }
}

/**
 * Role-based access control middleware factory.
 * @param {...string} roles - Allowed roles (e.g., 'admin', 'manager')
 */
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthenticated.' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role(s): ${roles.join(', ')}. Your role: ${req.user.role}`,
      });
    }
    next();
  };
}

module.exports = { authenticate, requireRole };
