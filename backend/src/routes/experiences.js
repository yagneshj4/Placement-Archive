/**
 * Interview Experiences Routes
 */

const express = require('express');
const { body, query, validationResult } = require('express-validator');
const multer = require('multer');
const path = require('path');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const prisma = require('../config/database');
const { authenticate, optionalAuth, seniorOnly } = require('../middleware/auth');
const { logger } = require('../utils/logger');

const router = express.Router();

// File upload configuration
const storage = multer.diskStorage({
  destination: './uploads/pdfs',
  filename: (req, file, cb) => {
    cb(null, `${uuidv4()}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  }
});

// Validation middleware
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

/**
 * GET /api/experiences
 * List all approved experiences with filters
 */
router.get('/', optionalAuth, async (req, res) => {
  try {
    const {
      company,
      role,
      year,
      difficulty,
      status = 'approved',
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const where = {
      status: status === 'all' && req.user?.role === 'admin' ? undefined : 'approved',
      ...(company && { companyName: { contains: company, mode: 'insensitive' } }),
      ...(role && { role: { contains: role, mode: 'insensitive' } }),
      ...(year && { interviewYear: parseInt(year) }),
      ...(difficulty && { difficultyLevel: parseInt(difficulty) })
    };

    const [experiences, total] = await Promise.all([
      prisma.experience.findMany({
        where,
        include: {
          user: {
            select: { name: true, college: true }
          },
          rounds: {
            select: { roundType: true, roundNumber: true }
          },
          questions: {
            select: { questionType: true, topic: true }
          },
          _count: {
            select: { likes: true, questions: true }
          }
        },
        skip: (parseInt(page) - 1) * parseInt(limit),
        take: parseInt(limit),
        orderBy: { [sortBy]: sortOrder }
      }),
      prisma.experience.count({ where })
    ]);

    // Hide user info for anonymous posts
    const sanitized = experiences.map(exp => ({
      ...exp,
      user: exp.isAnonymous ? { name: 'Anonymous', college: exp.user.college } : exp.user
    }));

    res.json({
      experiences: sanitized,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    logger.error('List experiences error:', error);
    res.status(500).json({ error: 'Failed to fetch experiences' });
  }
});

/**
 * GET /api/experiences/:id
 * Get single experience by ID
 */
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const experience = await prisma.experience.findUnique({
      where: { id: req.params.id },
      include: {
        user: {
          select: { name: true, college: true, avatarUrl: true }
        },
        rounds: {
          include: {
            questions: true
          },
          orderBy: { roundNumber: 'asc' }
        },
        questions: true,
        _count: {
          select: { likes: true }
        }
      }
    });

    if (!experience) {
      return res.status(404).json({ error: 'Experience not found' });
    }

    // Only show approved experiences to non-owners
    if (experience.status !== 'approved' && 
        req.user?.id !== experience.userId && 
        req.user?.role !== 'admin') {
      return res.status(404).json({ error: 'Experience not found' });
    }

    // Increment view count
    await prisma.experience.update({
      where: { id: req.params.id },
      data: { viewsCount: { increment: 1 } }
    });

    // Hide user info for anonymous posts
    const sanitized = {
      ...experience,
      user: experience.isAnonymous ? 
        { name: 'Anonymous', college: experience.user.college } : 
        experience.user,
      isLiked: req.user ? await prisma.experienceLike.findUnique({
        where: {
          experienceId_userId: {
            experienceId: experience.id,
            userId: req.user.id
          }
        }
      }) !== null : false,
      isBookmarked: req.user ? await prisma.bookmark.findUnique({
        where: {
          userId_experienceId: {
            userId: req.user.id,
            experienceId: experience.id
          }
        }
      }) !== null : false
    };

    res.json({ experience: sanitized });
  } catch (error) {
    logger.error('Get experience error:', error);
    res.status(500).json({ error: 'Failed to fetch experience' });
  }
});

/**
 * POST /api/experiences
 * Submit a new interview experience (Senior only)
 */
router.post('/', 
  authenticate, 
  seniorOnly,
  upload.single('pdf'),
  [
    body('companyName').trim().notEmpty(),
    body('role').trim().notEmpty(),
    body('interviewYear').isInt({ min: 2015, max: 2030 }),
    body('difficultyLevel').optional().isInt({ min: 1, max: 5 }),
    body('rounds').optional().isArray(),
    body('questions').optional().isArray(),
    validate
  ],
  async (req, res) => {
    try {
      const {
        companyName,
        role,
        interviewYear,
        interviewMonth,
        offerStatus,
        difficultyLevel,
        overallExperience,
        preparationTime,
        tips,
        resourcesUsed,
        isAnonymous,
        rounds,
        questions
      } = req.body;

      // Find or create company
      let company = await prisma.company.findFirst({
        where: { name: { equals: companyName, mode: 'insensitive' } }
      });

      if (!company) {
        company = await prisma.company.create({
          data: { name: companyName }
        });
      }

      // Create experience with rounds and questions
      const experience = await prisma.experience.create({
        data: {
          userId: req.user.id,
          companyId: company.id,
          companyName,
          role,
          interviewYear: parseInt(interviewYear),
          interviewMonth: interviewMonth ? parseInt(interviewMonth) : null,
          offerStatus: offerStatus || 'pending',
          difficultyLevel: difficultyLevel ? parseInt(difficultyLevel) : null,
          overallExp: overallExperience,
          preparationTime,
          tips,
          resourcesUsed: resourcesUsed ? JSON.parse(resourcesUsed) : [],
          isAnonymous: isAnonymous === 'true' || isAnonymous === true,
          pdfUrl: req.file ? `/uploads/pdfs/${req.file.filename}` : null,
          status: 'pending', // Goes to moderation queue
          rounds: rounds ? {
            create: JSON.parse(rounds).map((round, index) => ({
              roundNumber: index + 1,
              roundType: round.type,
              roundName: round.name,
              durationMinutes: round.duration,
              mode: round.mode,
              description: round.description,
              difficulty: round.difficulty
            }))
          } : undefined,
          questions: questions ? {
            create: JSON.parse(questions).map(q => ({
              questionText: q.text,
              questionType: q.type,
              topic: q.topic,
              subtopic: q.subtopic,
              difficulty: q.difficulty,
              answerApproach: q.approach,
              tags: q.tags || []
            }))
          } : undefined
        },
        include: {
          rounds: true,
          questions: true
        }
      });

      // Trigger embedding generation asynchronously
      triggerEmbedding(experience.id).catch(err => 
        logger.error('Embedding trigger failed:', err)
      );

      logger.info(`New experience submitted: ${experience.id} by ${req.user.email}`);

      res.status(201).json({
        message: 'Experience submitted successfully. Pending moderation.',
        experience
      });
    } catch (error) {
      logger.error('Submit experience error:', error);
      res.status(500).json({ error: 'Failed to submit experience' });
    }
  }
);

/**
 * PUT /api/experiences/:id
 * Update an experience (owner or admin only)
 */
router.put('/:id', authenticate, async (req, res) => {
  try {
    const experience = await prisma.experience.findUnique({
      where: { id: req.params.id }
    });

    if (!experience) {
      return res.status(404).json({ error: 'Experience not found' });
    }

    if (experience.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const updated = await prisma.experience.update({
      where: { id: req.params.id },
      data: {
        ...req.body,
        status: 'pending', // Re-submit for moderation after edit
        isEmbedded: false
      }
    });

    // Re-trigger embedding
    triggerEmbedding(updated.id).catch(err => 
      logger.error('Re-embedding trigger failed:', err)
    );

    res.json({ message: 'Experience updated', experience: updated });
  } catch (error) {
    logger.error('Update experience error:', error);
    res.status(500).json({ error: 'Failed to update experience' });
  }
});

/**
 * DELETE /api/experiences/:id
 * Delete an experience (owner or admin only)
 */
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const experience = await prisma.experience.findUnique({
      where: { id: req.params.id }
    });

    if (!experience) {
      return res.status(404).json({ error: 'Experience not found' });
    }

    if (experience.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized' });
    }

    await prisma.experience.delete({
      where: { id: req.params.id }
    });

    // Trigger embedding removal
    removeEmbedding(req.params.id).catch(err =>
      logger.error('Embedding removal failed:', err)
    );

    res.json({ message: 'Experience deleted' });
  } catch (error) {
    logger.error('Delete experience error:', error);
    res.status(500).json({ error: 'Failed to delete experience' });
  }
});

/**
 * POST /api/experiences/:id/like
 * Like/unlike an experience
 */
router.post('/:id/like', authenticate, async (req, res) => {
  try {
    const existing = await prisma.experienceLike.findUnique({
      where: {
        experienceId_userId: {
          experienceId: req.params.id,
          userId: req.user.id
        }
      }
    });

    if (existing) {
      await prisma.experienceLike.delete({
        where: { id: existing.id }
      });
      res.json({ liked: false, message: 'Like removed' });
    } else {
      await prisma.experienceLike.create({
        data: {
          experienceId: req.params.id,
          userId: req.user.id
        }
      });
      res.json({ liked: true, message: 'Liked' });
    }
  } catch (error) {
    logger.error('Like experience error:', error);
    res.status(500).json({ error: 'Failed to process like' });
  }
});

/**
 * POST /api/experiences/:id/bookmark
 * Bookmark/unbookmark an experience
 */
router.post('/:id/bookmark', authenticate, async (req, res) => {
  try {
    const existing = await prisma.bookmark.findUnique({
      where: {
        userId_experienceId: {
          userId: req.user.id,
          experienceId: req.params.id
        }
      }
    });

    if (existing) {
      await prisma.bookmark.delete({
        where: { id: existing.id }
      });
      res.json({ bookmarked: false, message: 'Bookmark removed' });
    } else {
      await prisma.bookmark.create({
        data: {
          userId: req.user.id,
          experienceId: req.params.id
        }
      });
      res.json({ bookmarked: true, message: 'Bookmarked' });
    }
  } catch (error) {
    logger.error('Bookmark experience error:', error);
    res.status(500).json({ error: 'Failed to process bookmark' });
  }
});

/**
 * POST /api/experiences/:id/report
 * Report an experience as spam/inappropriate
 */
router.post('/:id/report', authenticate, [
  body('reason').isIn(['spam', 'inappropriate', 'fake', 'duplicate', 'other']),
  body('description').optional().trim(),
  validate
], async (req, res) => {
  try {
    await prisma.spamReport.create({
      data: {
        experienceId: req.params.id,
        reportedBy: req.user.id,
        reason: req.body.reason,
        description: req.body.description
      }
    });

    res.json({ message: 'Report submitted' });
  } catch (error) {
    logger.error('Report experience error:', error);
    res.status(500).json({ error: 'Failed to submit report' });
  }
});

/**
 * GET /api/experiences/user/me
 * Get current user's experiences
 */
router.get('/user/me', authenticate, async (req, res) => {
  try {
    const experiences = await prisma.experience.findMany({
      where: { userId: req.user.id },
      include: {
        _count: { select: { likes: true, questions: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ experiences });
  } catch (error) {
    logger.error('Get user experiences error:', error);
    res.status(500).json({ error: 'Failed to fetch experiences' });
  }
});

/**
 * GET /api/experiences/user/bookmarks
 * Get user's bookmarked experiences
 */
router.get('/user/bookmarks', authenticate, async (req, res) => {
  try {
    const bookmarks = await prisma.bookmark.findMany({
      where: { userId: req.user.id },
      include: {
        experience: {
          include: {
            user: { select: { name: true, college: true } },
            _count: { select: { likes: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ 
      bookmarks: bookmarks.map(b => ({
        ...b.experience,
        user: b.experience.isAnonymous ? 
          { name: 'Anonymous', college: b.experience.user.college } : 
          b.experience.user
      }))
    });
  } catch (error) {
    logger.error('Get bookmarks error:', error);
    res.status(500).json({ error: 'Failed to fetch bookmarks' });
  }
});

// Helper function to trigger embedding generation
async function triggerEmbedding(experienceId) {
  try {
    await axios.post(`${process.env.AI_SERVICE_URL}/api/embed`, {
      experience_id: experienceId
    });
    
    await prisma.experience.update({
      where: { id: experienceId },
      data: { isEmbedded: true }
    });
  } catch (error) {
    logger.error(`Failed to embed experience ${experienceId}:`, error.message);
  }
}

// Helper function to remove embedding
async function removeEmbedding(experienceId) {
  try {
    await axios.delete(`${process.env.AI_SERVICE_URL}/api/embed/${experienceId}`);
  } catch (error) {
    logger.error(`Failed to remove embedding ${experienceId}:`, error.message);
  }
}

module.exports = router;
