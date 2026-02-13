"""
Database utilities for the AI service
Connects to PostgreSQL to fetch experience data
"""

import asyncpg
import logging
from typing import Dict, List, Optional
from config import settings

logger = logging.getLogger(__name__)

# Connection pool
pool: Optional[asyncpg.Pool] = None

async def get_pool() -> asyncpg.Pool:
    """Get or create database connection pool"""
    global pool
    if pool is None:
        pool = await asyncpg.create_pool(
            settings.DATABASE_URL,
            min_size=2,
            max_size=10
        )
    return pool

async def close_pool():
    """Close the database connection pool"""
    global pool
    if pool:
        await pool.close()
        pool = None

async def get_experience_by_id(experience_id: str) -> Optional[Dict]:
    """Fetch a single experience with all related data"""
    try:
        db = await get_pool()
        
        # Get experience
        experience = await db.fetchrow("""
            SELECT 
                e.id,
                e.company_name,
                e.role,
                e.interview_year,
                e.interview_month,
                e.offer_status,
                e.difficulty_level,
                e.overall_experience,
                e.preparation_time,
                e.tips,
                e.resources_used,
                u.college
            FROM experiences e
            JOIN users u ON e.user_id = u.id
            WHERE e.id = $1
        """, experience_id)
        
        if not experience:
            return None
        
        # Get rounds
        rounds = await db.fetch("""
            SELECT 
                round_number,
                round_type,
                round_name,
                duration_minutes,
                mode,
                description,
                difficulty
            FROM interview_rounds
            WHERE experience_id = $1
            ORDER BY round_number
        """, experience_id)
        
        # Get questions
        questions = await db.fetch("""
            SELECT 
                question_text,
                question_type,
                topic,
                subtopic,
                difficulty,
                answer_approach,
                tags
            FROM questions
            WHERE experience_id = $1
        """, experience_id)
        
        return {
            'id': str(experience['id']),
            'company_name': experience['company_name'],
            'role': experience['role'],
            'interview_year': experience['interview_year'],
            'interview_month': experience['interview_month'],
            'offer_status': experience['offer_status'],
            'difficulty_level': experience['difficulty_level'],
            'overall_experience': experience['overall_experience'],
            'preparation_time': experience['preparation_time'],
            'tips': experience['tips'],
            'resources_used': experience['resources_used'],
            'college': experience['college'],
            'rounds': [dict(r) for r in rounds],
            'questions': [dict(q) for q in questions]
        }
        
    except Exception as e:
        logger.error(f"Error fetching experience {experience_id}: {e}")
        return None

async def get_all_approved_experiences() -> List[Dict]:
    """Fetch all approved experiences for indexing"""
    try:
        db = await get_pool()
        
        experiences = await db.fetch("""
            SELECT 
                e.id,
                e.company_name,
                e.role,
                e.interview_year,
                e.interview_month,
                e.offer_status,
                e.difficulty_level,
                e.overall_experience,
                e.tips,
                u.college
            FROM experiences e
            JOIN users u ON e.user_id = u.id
            WHERE e.status = 'approved'
            ORDER BY e.created_at DESC
        """)
        
        results = []
        for exp in experiences:
            # Get rounds and questions for each
            full_exp = await get_experience_by_id(str(exp['id']))
            if full_exp:
                results.append(full_exp)
        
        return results
        
    except Exception as e:
        logger.error(f"Error fetching all experiences: {e}")
        return []

async def get_experiences_by_company(company_name: str) -> List[Dict]:
    """Fetch experiences for a specific company"""
    try:
        db = await get_pool()
        
        experiences = await db.fetch("""
            SELECT id
            FROM experiences
            WHERE status = 'approved'
            AND company_name ILIKE $1
        """, f"%{company_name}%")
        
        results = []
        for exp in experiences:
            full_exp = await get_experience_by_id(str(exp['id']))
            if full_exp:
                results.append(full_exp)
        
        return results
        
    except Exception as e:
        logger.error(f"Error fetching experiences for {company_name}: {e}")
        return []

async def get_experiences_by_year(year: int) -> List[Dict]:
    """Fetch experiences for a specific year"""
    try:
        db = await get_pool()
        
        experiences = await db.fetch("""
            SELECT id
            FROM experiences
            WHERE status = 'approved'
            AND interview_year = $1
        """, year)
        
        results = []
        for exp in experiences:
            full_exp = await get_experience_by_id(str(exp['id']))
            if full_exp:
                results.append(full_exp)
        
        return results
        
    except Exception as e:
        logger.error(f"Error fetching experiences for year {year}: {e}")
        return []
