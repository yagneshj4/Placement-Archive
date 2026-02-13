/**
 * AI Query Routes
 * Interface with the FastAPI RAG service
 */

const express = require('express');
const axios = require('axios');
const { body, validationResult } = require('express-validator');
const prisma = require('../config/database');
const { authenticate, optionalAuth } = require('../middleware/auth');
const { logger } = require('../utils/logger');

const router = express.Router();

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

// Validation middleware
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

/**
 * POST /api/query
 * Ask a question to the RAG system
 */
router.post('/', optionalAuth, [
  body('query').trim().notEmpty().isLength({ min: 3, max: 500 }),
  body('company').optional().trim(),
  body('year').optional().isInt({ min: 2015, max: 2030 }),
  validate
], async (req, res) => {
  const startTime = Date.now();
  
  try {
    const { query, company, year, topK = 5 } = req.body;

    // Call AI service
    const response = await axios.post(`${AI_SERVICE_URL}/api/query`, {
      query,
      company,
      year,
      top_k: topK
    }, {
      timeout: 30000 // 30 second timeout
    });

    const { answer, sources, confidence, trends } = response.data;

    // Fetch full experience details for sources
    const sourceExperiences = await prisma.experience.findMany({
      where: {
        id: { in: sources.map(s => s.experience_id) }
      },
      include: {
        user: { select: { name: true, college: true } }
      }
    });

    // Enrich sources with experience data
    const enrichedSources = sources.map(source => {
      const exp = sourceExperiences.find(e => e.id === source.experience_id);
      return {
        ...source,
        companyName: exp?.companyName,
        role: exp?.role,
        year: exp?.interviewYear,
        author: exp?.isAnonymous ? 'Anonymous' : exp?.user?.name,
        college: exp?.user?.college
      };
    });

    const responseTimeMs = Date.now() - startTime;

    // Save query to history
    if (req.user) {
      await prisma.queryHistory.create({
        data: {
          userId: req.user.id,
          queryText: query,
          responseText: answer,
          sourcesUsed: sources.map(s => s.experience_id),
          responseTimeMs
        }
      });
    }

    // Track analytics event
    await prisma.analyticsEvent.create({
      data: {
        eventType: 'query',
        userId: req.user?.id,
        metadata: { query, company, year, responseTimeMs }
      }
    });

    logger.info(`Query processed in ${responseTimeMs}ms: "${query.substring(0, 50)}..."`);

    res.json({
      answer,
      sources: enrichedSources,
      confidence,
      trends,
      responseTimeMs
    });
  } catch (error) {
    logger.error('Query error:', {
      message: error.message,
      code: error.code,
      response: error.response?.data,
      stack: error.stack
    });
    
    if (error.code === 'ECONNREFUSED') {
      return res.status(503).json({ 
        error: 'AI service is currently unavailable. Please try again later.' 
      });
    }
    
    if (error.response?.data?.detail) {
      return res.status(error.response.status || 500).json({ 
        error: error.response.data.detail 
      });
    }
    
    res.status(500).json({ error: 'Failed to process query' });
  }
});

/**
 * GET /api/query/suggestions
 * Get query suggestions based on popular queries
 */
router.get('/suggestions', async (req, res) => {
  try {
    const { company } = req.query;

    // Get recent popular queries
    const popularQueries = await prisma.queryHistory.groupBy({
      by: ['queryText'],
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 10
    });

    // Static suggestions based on company
    const staticSuggestions = company ? [
      `What is the interview process at ${company}?`,
      `What DSA questions are asked in ${company}?`,
      `${company} interview difficulty level?`,
      `Tips for ${company} interview preparation?`,
      `${company} selection rate?`
    ] : [
      'What DSA questions are most commonly asked?',
      'Which companies ask system design questions?',
      'Tips for technical interviews?',
      'Most common HR questions?',
      'Interview preparation strategy?'
    ];

    res.json({
      popular: popularQueries.map(q => q.queryText),
      suggested: staticSuggestions
    });
  } catch (error) {
    logger.error('Suggestions error:', error);
    res.status(500).json({ error: 'Failed to fetch suggestions' });
  }
});

/**
 * GET /api/query/history
 * Get user's query history
 */
router.get('/history', authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const [queries, total] = await Promise.all([
      prisma.queryHistory.findMany({
        where: { userId: req.user.id },
        orderBy: { createdAt: 'desc' },
        skip: (parseInt(page) - 1) * parseInt(limit),
        take: parseInt(limit)
      }),
      prisma.queryHistory.count({ where: { userId: req.user.id } })
    ]);

    res.json({
      queries,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    logger.error('Query history error:', error);
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

/**
 * POST /api/query/:id/feedback
 * Submit feedback for a query
 */
router.post('/:id/feedback', authenticate, [
  body('wasHelpful').isBoolean(),
  body('feedback').optional().trim(),
  validate
], async (req, res) => {
  try {
    await prisma.queryHistory.update({
      where: { id: req.params.id },
      data: {
        wasHelpful: req.body.wasHelpful,
        feedback: req.body.feedback
      }
    });

    res.json({ message: 'Feedback submitted' });
  } catch (error) {
    logger.error('Query feedback error:', error);
    res.status(500).json({ error: 'Failed to submit feedback' });
  }
});

/**
 * GET /api/query/similar
 * Find similar experiences to a query
 */
router.get('/similar', optionalAuth, async (req, res) => {
  try {
    const { experienceId } = req.query;

    if (!experienceId) {
      return res.status(400).json({ error: 'Experience ID required' });
    }

    // Call AI service for similarity search
    const response = await axios.get(`${AI_SERVICE_URL}/api/similar`, {
      params: { experience_id: experienceId, top_k: 5 }
    });

    const { similar_ids, scores } = response.data;

    // Fetch similar experiences
    const similarExperiences = await prisma.experience.findMany({
      where: {
        id: { in: similar_ids },
        status: 'approved'
      },
      include: {
        user: { select: { name: true, college: true } },
        _count: { select: { likes: true } }
      }
    });

    // Attach similarity scores
    const withScores = similarExperiences.map(exp => ({
      ...exp,
      user: exp.isAnonymous ? { name: 'Anonymous', college: exp.user.college } : exp.user,
      similarityScore: scores[similar_ids.indexOf(exp.id)]
    }));

    res.json({ similar: withScores });
  } catch (error) {
    logger.error('Similar search error:', error);
    res.status(500).json({ error: 'Failed to find similar experiences' });
  }
});

module.exports = router;
