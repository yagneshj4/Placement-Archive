-- =====================================================
-- THE PLACEMENT ARCHIVE - Database Schema
-- PostgreSQL 14+
-- =====================================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- =====================================================
-- USERS TABLE
-- =====================================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    name VARCHAR(255) NOT NULL,
    college VARCHAR(255) NOT NULL,
    graduation_year INTEGER,
    role VARCHAR(20) DEFAULT 'junior' CHECK (role IN ('junior', 'senior', 'admin')),
    avatar_url TEXT,
    google_id VARCHAR(255),
    is_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_college ON users(college);

-- =====================================================
-- COMPANIES TABLE
-- =====================================================
CREATE TABLE companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) UNIQUE NOT NULL,
    logo_url TEXT,
    industry VARCHAR(100),
    tier VARCHAR(20) CHECK (tier IN ('tier1', 'tier2', 'tier3', 'startup')),
    avg_ctc DECIMAL(10, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_companies_name ON companies USING gin(name gin_trgm_ops);

-- =====================================================
-- INTERVIEW EXPERIENCES TABLE
-- =====================================================
CREATE TABLE experiences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
    
    -- Core Info
    company_name VARCHAR(255) NOT NULL,
    role VARCHAR(255) NOT NULL,
    interview_year INTEGER NOT NULL,
    interview_month INTEGER CHECK (interview_month BETWEEN 1 AND 12),
    
    -- Experience Details
    offer_status VARCHAR(20) DEFAULT 'pending' CHECK (offer_status IN ('selected', 'rejected', 'pending', 'waitlist')),
    difficulty_level INTEGER CHECK (difficulty_level BETWEEN 1 AND 5),
    overall_experience VARCHAR(20) CHECK (overall_experience IN ('positive', 'neutral', 'negative')),
    
    -- Content
    preparation_time VARCHAR(100),
    tips TEXT,
    resources_used TEXT[],
    
    -- File Uploads
    pdf_url TEXT,
    
    -- Metadata
    views_count INTEGER DEFAULT 0,
    likes_count INTEGER DEFAULT 0,
    is_anonymous BOOLEAN DEFAULT FALSE,
    
    -- Moderation
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'flagged')),
    moderation_notes TEXT,
    moderated_by UUID REFERENCES users(id),
    moderated_at TIMESTAMP WITH TIME ZONE,
    
    -- AI Processing
    is_embedded BOOLEAN DEFAULT FALSE,
    embedding_id VARCHAR(255),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_experiences_company ON experiences(company_name);
CREATE INDEX idx_experiences_year ON experiences(interview_year);
CREATE INDEX idx_experiences_status ON experiences(status);
CREATE INDEX idx_experiences_user ON experiences(user_id);
CREATE INDEX idx_experiences_search ON experiences USING gin(company_name gin_trgm_ops);

-- =====================================================
-- INTERVIEW ROUNDS TABLE
-- =====================================================
CREATE TABLE interview_rounds (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    experience_id UUID REFERENCES experiences(id) ON DELETE CASCADE,
    
    round_number INTEGER NOT NULL,
    round_type VARCHAR(50) NOT NULL CHECK (round_type IN (
        'online_assessment', 'technical', 'hr', 'managerial',
        'system_design', 'behavioral', 'group_discussion', 'case_study'
    )),
    round_name VARCHAR(255),
    duration_minutes INTEGER,
    mode VARCHAR(20) CHECK (mode IN ('online', 'offline', 'phone')),
    
    description TEXT,
    difficulty INTEGER CHECK (difficulty BETWEEN 1 AND 5),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_rounds_experience ON interview_rounds(experience_id);
CREATE INDEX idx_rounds_type ON interview_rounds(round_type);

-- =====================================================
-- QUESTIONS TABLE
-- =====================================================
CREATE TABLE questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    round_id UUID REFERENCES interview_rounds(id) ON DELETE CASCADE,
    experience_id UUID REFERENCES experiences(id) ON DELETE CASCADE,
    
    question_text TEXT NOT NULL,
    question_type VARCHAR(50) CHECK (question_type IN (
        'dsa', 'coding', 'system_design', 'behavioral', 'technical',
        'hr', 'puzzle', 'case_study', 'project_based', 'theory'
    )),
    topic VARCHAR(100),
    subtopic VARCHAR(100),
    difficulty INTEGER CHECK (difficulty BETWEEN 1 AND 5),
    
    answer_approach TEXT,
    time_given_minutes INTEGER,
    was_solved BOOLEAN,
    
    -- AI extracted tags
    tags TEXT[],
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_questions_round ON questions(round_id);
CREATE INDEX idx_questions_type ON questions(question_type);
CREATE INDEX idx_questions_topic ON questions(topic);
CREATE INDEX idx_questions_search ON questions USING gin(question_text gin_trgm_ops);

-- =====================================================
-- LIKES TABLE
-- =====================================================
CREATE TABLE experience_likes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    experience_id UUID REFERENCES experiences(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(experience_id, user_id)
);

-- =====================================================
-- BOOKMARKS TABLE
-- =====================================================
CREATE TABLE bookmarks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    experience_id UUID REFERENCES experiences(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, experience_id)
);

-- =====================================================
-- QUERY HISTORY TABLE
-- =====================================================
CREATE TABLE query_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    query_text TEXT NOT NULL,
    response_text TEXT,
    sources_used UUID[],
    response_time_ms INTEGER,
    was_helpful BOOLEAN,
    feedback TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_query_history_user ON query_history(user_id);
CREATE INDEX idx_query_history_date ON query_history(created_at);

-- =====================================================
-- SPAM REPORTS TABLE
-- =====================================================
CREATE TABLE spam_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    experience_id UUID REFERENCES experiences(id) ON DELETE CASCADE,
    reported_by UUID REFERENCES users(id) ON DELETE SET NULL,
    reason VARCHAR(50) CHECK (reason IN ('spam', 'inappropriate', 'fake', 'duplicate', 'other')),
    description TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'actioned')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- ANALYTICS EVENTS TABLE
-- =====================================================
CREATE TABLE analytics_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_type VARCHAR(50) NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    experience_id UUID REFERENCES experiences(id) ON DELETE SET NULL,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_analytics_type ON analytics_events(event_type);
CREATE INDEX idx_analytics_date ON analytics_events(created_at);

-- =====================================================
-- VIEWS & MATERIALIZED VIEWS FOR ANALYTICS
-- =====================================================

-- Company Statistics View
CREATE OR REPLACE VIEW company_stats AS
SELECT 
    company_name,
    COUNT(*) as total_experiences,
    COUNT(*) FILTER (WHERE offer_status = 'selected') as selected_count,
    COUNT(*) FILTER (WHERE offer_status = 'rejected') as rejected_count,
    ROUND(AVG(difficulty_level), 2) as avg_difficulty,
    MAX(interview_year) as latest_year
FROM experiences
WHERE status = 'approved'
GROUP BY company_name;

-- Topic Statistics View
CREATE OR REPLACE VIEW topic_stats AS
SELECT 
    topic,
    question_type,
    COUNT(*) as frequency,
    ROUND(AVG(difficulty), 2) as avg_difficulty,
    COUNT(DISTINCT e.company_name) as companies_asking
FROM questions q
JOIN experiences e ON q.experience_id = e.id
WHERE e.status = 'approved'
GROUP BY topic, question_type;

-- Year over Year Trends
CREATE OR REPLACE VIEW yearly_trends AS
SELECT 
    interview_year,
    COUNT(*) as total_experiences,
    COUNT(DISTINCT company_name) as unique_companies,
    ROUND(AVG(difficulty_level), 2) as avg_difficulty,
    COUNT(*) FILTER (WHERE offer_status = 'selected') as selections
FROM experiences
WHERE status = 'approved'
GROUP BY interview_year
ORDER BY interview_year DESC;

-- =====================================================
-- FUNCTIONS & TRIGGERS
-- =====================================================

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER experiences_updated_at
    BEFORE UPDATE ON experiences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Increment views counter
CREATE OR REPLACE FUNCTION increment_view_count(exp_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE experiences SET views_count = views_count + 1 WHERE id = exp_id;
END;
$$ LANGUAGE plpgsql;

-- Update likes count
CREATE OR REPLACE FUNCTION update_likes_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE experiences SET likes_count = likes_count + 1 WHERE id = NEW.experience_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE experiences SET likes_count = likes_count - 1 WHERE id = OLD.experience_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_experience_likes
    AFTER INSERT OR DELETE ON experience_likes
    FOR EACH ROW EXECUTE FUNCTION update_likes_count();
