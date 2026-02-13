/**
 * Authentication Routes
 */

const express = require('express');
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const passport = require('passport');
const prisma = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { logger } = require('../utils/logger');

const router = express.Router();

// Validation middleware
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// Generate JWT token
const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

/**
 * POST /api/auth/register
 * Register a new user
 */
router.post('/register', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('name').trim().notEmpty(),
  body('college').trim().notEmpty(),
  body('role').optional().isIn(['junior', 'senior']),
  validate
], async (req, res) => {
  try {
    const { email, password, name, college, role = 'junior', graduationYear } = req.body;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name,
        college,
        role,
        graduationYear
      },
      select: {
        id: true,
        email: true,
        name: true,
        college: true,
        role: true,
        createdAt: true
      }
    });

    const token = generateToken(user);

    logger.info(`New user registered: ${email}`);
    
    res.status(201).json({
      message: 'Registration successful',
      user,
      token
    });
  } catch (error) {
    logger.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

/**
 * POST /api/auth/login
 * Login user
 */
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
  validate
], async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.passwordHash) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({ error: 'Account is deactivated' });
    }

    // Verify password
    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = generateToken(user);

    logger.info(`User logged in: ${email}`);

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        college: user.college,
        role: user.role,
        avatarUrl: user.avatarUrl
      },
      token
    });
  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

/**
 * GET /api/auth/google
 * Initiate Google OAuth
 */
router.get('/google', passport.authenticate('google', {
  scope: ['profile', 'email']
}));

/**
 * GET /api/auth/google/callback
 * Google OAuth callback
 */
router.get('/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/login' }),
  (req, res) => {
    const token = generateToken(req.user);
    // Redirect to frontend with token
    res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${token}`);
  }
);

/**
 * GET /api/auth/me
 * Get current user
 */
router.get('/me', authenticate, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        college: true,
        role: true,
        avatarUrl: true,
        graduationYear: true,
        isVerified: true,
        createdAt: true,
        _count: {
          select: {
            experiences: true,
            bookmarks: true
          }
        }
      }
    });

    res.json({ user });
  } catch (error) {
    logger.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

/**
 * PUT /api/auth/profile
 * Update user profile
 */
router.put('/profile', authenticate, [
  body('name').optional().trim().notEmpty(),
  body('college').optional().trim().notEmpty(),
  body('graduationYear').optional().isInt({ min: 2000, max: 2100 }),
  validate
], async (req, res) => {
  try {
    const { name, college, graduationYear } = req.body;

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        ...(name && { name }),
        ...(college && { college }),
        ...(graduationYear && { graduationYear })
      },
      select: {
        id: true,
        email: true,
        name: true,
        college: true,
        role: true,
        graduationYear: true
      }
    });

    res.json({ message: 'Profile updated', user });
  } catch (error) {
    logger.error('Profile update error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

/**
 * POST /api/auth/upgrade
 * Request role upgrade to senior
 */
router.post('/upgrade', authenticate, async (req, res) => {
  try {
    if (req.user.role === 'senior' || req.user.role === 'admin') {
      return res.status(400).json({ error: 'Already a senior/admin' });
    }

    // For hackathon demo, auto-upgrade
    // In production, this would go through verification
    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: { role: 'senior' },
      select: {
        id: true,
        email: true,
        name: true,
        role: true
      }
    });

    const token = generateToken(user);

    res.json({ 
      message: 'Upgraded to senior successfully',
      user,
      token
    });
  } catch (error) {
    logger.error('Upgrade error:', error);
    res.status(500).json({ error: 'Upgrade failed' });
  }
});

module.exports = router;
