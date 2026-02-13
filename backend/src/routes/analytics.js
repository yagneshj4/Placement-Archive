/**
 * Analytics Routes
 */

const express = require('express');
const prisma = require('../config/database');
const { optionalAuth } = require('../middleware/auth');
const { logger } = require('../utils/logger');

const router = express.Router();

/**
 * GET /api/analytics/overview
 * Get overall platform statistics
 */
router.get('/overview', async (req, res) => {
  try {
    const [
      totalExperiences,
      totalCompanies,
      totalQuestions,
      totalUsers
    ] = await Promise.all([
      prisma.experience.count({ where: { status: 'approved' } }),
      prisma.company.count(),
      prisma.question.count(),
      prisma.user.count()
    ]);

    res.json({
      totalExperiences,
      totalCompanies,
      totalQuestions,
      totalUsers
    });
  } catch (error) {
    logger.error('Analytics overview error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

/**
 * GET /api/analytics/companies
 * Get company-wise statistics
 */
router.get('/companies', async (req, res) => {
  try {
    const { limit = 20, year } = req.query;

    const companies = await prisma.experience.groupBy({
      by: ['companyName'],
      where: {
        status: 'approved',
        ...(year && { interviewYear: parseInt(year) })
      },
      _count: { id: true },
      _avg: { difficultyLevel: true },
      orderBy: { _count: { id: 'desc' } },
      take: parseInt(limit)
    });

    // Get selection rates
    const withSelectionRates = await Promise.all(
      companies.map(async (company) => {
        const stats = await prisma.experience.aggregate({
          where: { 
            companyName: company.companyName, 
            status: 'approved'
          },
          _count: { id: true }
        });

        const selected = await prisma.experience.count({
          where: {
            companyName: company.companyName,
            status: 'approved',
            offerStatus: 'selected'
          }
        });

        return {
          name: company.companyName,
          totalExperiences: company._count.id,
          avgDifficulty: Math.round((company._avg.difficultyLevel || 0) * 10) / 10,
          selectionRate: stats._count.id > 0 
            ? Math.round((selected / stats._count.id) * 100) 
            : 0
        };
      })
    );

    res.json({ companies: withSelectionRates });
  } catch (error) {
    logger.error('Company analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch company analytics' });
  }
});

/**
 * GET /api/analytics/topics
 * Get most asked topics/question types
 */
router.get('/topics', async (req, res) => {
  try {
    const { company, year } = req.query;

    const whereClause = {
      experience: {
        status: 'approved',
        ...(company && { companyName: { contains: company, mode: 'insensitive' } }),
        ...(year && { interviewYear: parseInt(year) })
      }
    };

    // By question type
    const byType = await prisma.question.groupBy({
      by: ['questionType'],
      where: whereClause,
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } }
    });

    // By topic
    const byTopic = await prisma.question.groupBy({
      by: ['topic'],
      where: {
        ...whereClause,
        topic: { not: null }
      },
      _count: { id: true },
      _avg: { difficulty: true },
      orderBy: { _count: { id: 'desc' } },
      take: 20
    });

    res.json({
      byType: byType.map(t => ({
        type: t.questionType,
        count: t._count.id
      })),
      byTopic: byTopic.map(t => ({
        topic: t.topic,
        count: t._count.id,
        avgDifficulty: Math.round((t._avg.difficulty || 0) * 10) / 10
      }))
    });
  } catch (error) {
    logger.error('Topic analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch topic analytics' });
  }
});

/**
 * GET /api/analytics/trends
 * Get year-over-year trends
 */
router.get('/trends', async (req, res) => {
  try {
    const { company } = req.query;

    const whereClause = {
      status: 'approved',
      ...(company && { companyName: { contains: company, mode: 'insensitive' } })
    };

    const byYear = await prisma.experience.groupBy({
      by: ['interviewYear'],
      where: whereClause,
      _count: { id: true },
      _avg: { difficultyLevel: true },
      orderBy: { interviewYear: 'asc' }
    });

    // Calculate year-over-year changes
    const trends = byYear.map((year, index) => {
      const prevYear = index > 0 ? byYear[index - 1] : null;
      const countChange = prevYear 
        ? Math.round(((year._count.id - prevYear._count.id) / prevYear._count.id) * 100)
        : 0;

      return {
        year: year.interviewYear,
        count: year._count.id,
        avgDifficulty: Math.round((year._avg.difficultyLevel || 0) * 10) / 10,
        countChange
      };
    });

    res.json({ trends });
  } catch (error) {
    logger.error('Trends analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch trends' });
  }
});

/**
 * GET /api/analytics/difficulty-heatmap
 * Get difficulty distribution by company and round type
 */
router.get('/difficulty-heatmap', async (req, res) => {
  try {
    const { year } = req.query;

    const heatmap = await prisma.interviewRound.groupBy({
      by: ['roundType'],
      where: {
        experience: {
          status: 'approved',
          ...(year && { interviewYear: parseInt(year) })
        }
      },
      _avg: { difficulty: true },
      _count: { id: true }
    });

    // Get company-specific difficulty
    const topCompanies = await prisma.experience.groupBy({
      by: ['companyName'],
      where: { status: 'approved' },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 10
    });

    const companyDifficulty = await Promise.all(
      topCompanies.map(async (company) => {
        const rounds = await prisma.interviewRound.groupBy({
          by: ['roundType'],
          where: {
            experience: {
              companyName: company.companyName,
              status: 'approved'
            }
          },
          _avg: { difficulty: true }
        });

        return {
          company: company.companyName,
          rounds: Object.fromEntries(
            rounds.map(r => [r.roundType, Math.round((r._avg.difficulty || 0) * 10) / 10])
          )
        };
      })
    );

    res.json({
      overall: heatmap.map(h => ({
        roundType: h.roundType,
        avgDifficulty: Math.round((h._avg.difficulty || 0) * 10) / 10,
        count: h._count.id
      })),
      byCompany: companyDifficulty
    });
  } catch (error) {
    logger.error('Difficulty heatmap error:', error);
    res.status(500).json({ error: 'Failed to fetch heatmap' });
  }
});

/**
 * GET /api/analytics/insights
 * Get AI-generated insights (trends, patterns)
 */
router.get('/insights', async (req, res) => {
  try {
    // Get various metrics for insight generation
    const currentYear = new Date().getFullYear();
    const lastYear = currentYear - 1;

    const [currentYearStats, lastYearStats] = await Promise.all([
      prisma.experience.aggregate({
        where: { status: 'approved', interviewYear: currentYear },
        _count: { id: true },
        _avg: { difficultyLevel: true }
      }),
      prisma.experience.aggregate({
        where: { status: 'approved', interviewYear: lastYear },
        _count: { id: true },
        _avg: { difficultyLevel: true }
      })
    ]);

    // Topic trends
    const [currentTopics, lastTopics] = await Promise.all([
      prisma.question.groupBy({
        by: ['questionType'],
        where: { experience: { status: 'approved', interviewYear: currentYear } },
        _count: { id: true }
      }),
      prisma.question.groupBy({
        by: ['questionType'],
        where: { experience: { status: 'approved', interviewYear: lastYear } },
        _count: { id: true }
      })
    ]);

    // Generate insights
    const insights = [];

    // Difficulty trend
    const diffChange = currentYearStats._avg.difficultyLevel && lastYearStats._avg.difficultyLevel
      ? Math.round(((currentYearStats._avg.difficultyLevel - lastYearStats._avg.difficultyLevel) / 
          lastYearStats._avg.difficultyLevel) * 100)
      : 0;
    
    if (Math.abs(diffChange) > 5) {
      insights.push({
        type: 'difficulty',
        icon: diffChange > 0 ? '📈' : '📉',
        text: `Interview difficulty ${diffChange > 0 ? 'increased' : 'decreased'} by ${Math.abs(diffChange)}% compared to last year`,
        change: diffChange
      });
    }

    // Topic trends
    const currentTopicMap = Object.fromEntries(currentTopics.map(t => [t.questionType, t._count.id]));
    const lastTopicMap = Object.fromEntries(lastTopics.map(t => [t.questionType, t._count.id]));

    for (const [topic, count] of Object.entries(currentTopicMap)) {
      const lastCount = lastTopicMap[topic] || 1;
      const change = Math.round(((count - lastCount) / lastCount) * 100);
      
      if (change > 30) {
        insights.push({
          type: 'topic_increase',
          icon: '🔥',
          text: `${topic.replace('_', ' ')} questions ↑ ${change}%`,
          change
        });
      }
    }

    // Most active company this year
    const topCompany = await prisma.experience.groupBy({
      by: ['companyName'],
      where: { status: 'approved', interviewYear: currentYear },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 1
    });

    if (topCompany[0]) {
      insights.push({
        type: 'top_company',
        icon: '🏆',
        text: `${topCompany[0].companyName} is the most interviewed company this year`,
        count: topCompany[0]._count.id
      });
    }

    res.json({ insights });
  } catch (error) {
    logger.error('Insights error:', error);
    res.status(500).json({ error: 'Failed to generate insights' });
  }
});

/**
 * GET /api/analytics/company/:name
 * Get detailed analytics for a specific company
 */
router.get('/company/:name', async (req, res) => {
  try {
    const companyName = decodeURIComponent(req.params.name);

    const [
      totalExperiences,
      avgDifficulty,
      selectionRate,
      roundTypes,
      questionTypes,
      yearlyTrend
    ] = await Promise.all([
      prisma.experience.count({
        where: { companyName: { equals: companyName, mode: 'insensitive' }, status: 'approved' }
      }),
      prisma.experience.aggregate({
        where: { companyName: { equals: companyName, mode: 'insensitive' }, status: 'approved' },
        _avg: { difficultyLevel: true }
      }),
      prisma.experience.count({
        where: { 
          companyName: { equals: companyName, mode: 'insensitive' }, 
          status: 'approved',
          offerStatus: 'selected'
        }
      }),
      prisma.interviewRound.groupBy({
        by: ['roundType'],
        where: {
          experience: { companyName: { equals: companyName, mode: 'insensitive' }, status: 'approved' }
        },
        _count: { id: true }
      }),
      prisma.question.groupBy({
        by: ['questionType'],
        where: {
          experience: { companyName: { equals: companyName, mode: 'insensitive' }, status: 'approved' }
        },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } }
      }),
      prisma.experience.groupBy({
        by: ['interviewYear'],
        where: { companyName: { equals: companyName, mode: 'insensitive' }, status: 'approved' },
        _count: { id: true },
        orderBy: { interviewYear: 'asc' }
      })
    ]);

    // Get common topics
    const topTopics = await prisma.question.groupBy({
      by: ['topic'],
      where: {
        experience: { companyName: { equals: companyName, mode: 'insensitive' }, status: 'approved' },
        topic: { not: null }
      },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 10
    });

    res.json({
      company: companyName,
      stats: {
        totalExperiences,
        avgDifficulty: Math.round((avgDifficulty._avg.difficultyLevel || 0) * 10) / 10,
        selectionRate: totalExperiences > 0 
          ? Math.round((selectionRate / totalExperiences) * 100) 
          : 0
      },
      roundTypes: roundTypes.map(r => ({ type: r.roundType, count: r._count.id })),
      questionTypes: questionTypes.map(q => ({ type: q.questionType, count: q._count.id })),
      topTopics: topTopics.map(t => ({ topic: t.topic, count: t._count.id })),
      yearlyTrend: yearlyTrend.map(y => ({ year: y.interviewYear, count: y._count.id }))
    });
  } catch (error) {
    logger.error('Company analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch company analytics' });
  }
});

module.exports = router;
