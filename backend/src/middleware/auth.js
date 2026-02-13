/**
 * Authentication Middleware
 */

const passport = require('passport');

// JWT authentication middleware
const authenticate = passport.authenticate('jwt', { session: false });

// Optional authentication - doesn't fail if no token
const optionalAuth = (req, res, next) => {
  passport.authenticate('jwt', { session: false }, (err, user) => {
    if (user) {
      req.user = user;
    }
    next();
  })(req, res, next);
};

// Role-based authorization
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    
    next();
  };
};

// Senior or Admin only
const seniorOnly = authorize('senior', 'admin');

// Admin only
const adminOnly = authorize('admin');

module.exports = {
  authenticate,
  optionalAuth,
  authorize,
  seniorOnly,
  adminOnly
};
