/**
 * Moderation Routes
 * Admin-only endpoints for content moderation
 */

const express = require('express');
const { body, validationResult } = require('express-validator');
const prisma = require('../config/database');
const { authenticate, adminOnly } = require('../middleware/auth');
const { logger } = require('../utils/logger');

const router = express.Router();

// All routes require admin role
router.use(authenticate);
router.use(adminOnly);

// Validation middleware
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

/**
 * GET /api/moderation/queue
 * Get pending experiences for moderation
 */
router.get('/queue', async (req, res) => {
  try {
    const { status = 'pending', page = 1, limit = 20 } = req.query;

    const where = {
      status: status === 'all' ? undefined : status
    };

    const [experiences, total] = await Promise.all([
      prisma.experience.findMany({
        where,
        include: {
          user: { select: { name: true, email: true, college: true } },
          rounds: { select: { roundType: true } },
          _count: { select: { questions: true } }
        },
        orderBy: { createdAt: 'asc' },
        skip: (parseInt(page) - 1) * parseInt(limit),
        take: parseInt(limit)
      }),
      prisma.experience.count({ where })
    ]);

    res.json({
      experiences,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    logger.error('Moderation queue error:', error);
    res.status(500).json({ error: 'Failed to fetch moderation queue' });
  }
});

/**
 * POST /api/moderation/:id/approve
 * Approve an experience
 */
router.post('/:id/approve', async (req, res) => {
  try {
    const experience = await prisma.experience.update({
      where: { id: req.params.id },
      data: {
        status: 'approved',
        moderatedBy: req.user.id,
        moderatedAt: new Date()
      }
    });

    logger.info(`Experience ${req.params.id} approved by ${req.user.email}`);

    res.json({ message: 'Experience approved', experience });
  } catch (error) {
    logger.error('Approve error:', error);
    res.status(500).json({ error: 'Failed to approve experience' });
  }
});

/**
 * POST /api/moderation/:id/reject
 * Reject an experience
 */
router.post('/:id/reject', [
  body('reason').optional().trim(),
  validate
], async (req, res) => {
  try {
    const experience = await prisma.experience.update({
      where: { id: req.params.id },
      data: {
        status: 'rejected',
        moderatedBy: req.user.id,
        moderatedAt: new Date(),
        moderationNotes: req.body.reason
      }
    });

    logger.info(`Experience ${req.params.id} rejected by ${req.user.email}`);

    res.json({ message: 'Experience rejected', experience });
  } catch (error) {
    logger.error('Reject error:', error);
    res.status(500).json({ error: 'Failed to reject experience' });
  }
});

/**
 * POST /api/moderation/:id/flag
 * Flag an experience for review
 */
router.post('/:id/flag', [
  body('reason').trim().notEmpty(),
  validate
], async (req, res) => {
  try {
    const experience = await prisma.experience.update({
      where: { id: req.params.id },
      data: {
        status: 'flagged',
        moderatedBy: req.user.id,
        moderatedAt: new Date(),
        moderationNotes: req.body.reason
      }
    });

    logger.info(`Experience ${req.params.id} flagged by ${req.user.email}`);

    res.json({ message: 'Experience flagged', experience });
  } catch (error) {
    logger.error('Flag error:', error);
    res.status(500).json({ error: 'Failed to flag experience' });
  }
});

/**
 * GET /api/moderation/reports
 * Get spam reports
 */
router.get('/reports', async (req, res) => {
  try {
    const { status = 'pending', page = 1, limit = 20 } = req.query;

    const where = {
      status: status === 'all' ? undefined : status
    };

    const [reports, total] = await Promise.all([
      prisma.spamReport.findMany({
        where,
        include: {
          experience: {
            select: { id: true, companyName: true, role: true }
          },
          reporter: {
            select: { name: true, email: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: (parseInt(page) - 1) * parseInt(limit),
        take: parseInt(limit)
      }),
      prisma.spamReport.count({ where })
    ]);

    res.json({
      reports,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    logger.error('Reports error:', error);
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
});

/**
 * POST /api/moderation/reports/:id/resolve
 * Resolve a spam report
 */
router.post('/reports/:id/resolve', [
  body('action').isIn(['dismiss', 'remove_experience', 'warn_user']),
  validate
], async (req, res) => {
  try {
    const report = await prisma.spamReport.findUnique({
      where: { id: req.params.id },
      include: { experience: true }
    });

    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    // Handle action
    if (req.body.action === 'remove_experience' && report.experience) {
      await prisma.experience.update({
        where: { id: report.experienceId },
        data: { status: 'rejected' }
      });
    }

    // Update report status
    await prisma.spamReport.update({
      where: { id: req.params.id },
      data: { status: 'actioned' }
    });

    logger.info(`Report ${req.params.id} resolved with action: ${req.body.action}`);

    res.json({ message: 'Report resolved' });
  } catch (error) {
    logger.error('Resolve report error:', error);
    res.status(500).json({ error: 'Failed to resolve report' });
  }
});

/**
 * GET /api/moderation/stats
 * Get moderation statistics
 */
router.get('/stats', async (req, res) => {
  try {
    const [
      pendingCount,
      approvedToday,
      rejectedToday,
      pendingReports
    ] = await Promise.all([
      prisma.experience.count({ where: { status: 'pending' } }),
      prisma.experience.count({
        where: {
          status: 'approved',
          moderatedAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) }
        }
      }),
      prisma.experience.count({
        where: {
          status: 'rejected',
          moderatedAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) }
        }
      }),
      prisma.spamReport.count({ where: { status: 'pending' } })
    ]);

    res.json({
      pendingExperiences: pendingCount,
      approvedToday,
      rejectedToday,
      pendingReports
    });
  } catch (error) {
    logger.error('Moderation stats error:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

module.exports = router;
