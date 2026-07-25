-- =============================================================================
-- Veritas Research — Initial Database Schema
-- Target: PostgreSQL 15+ / Supabase
-- Run order: execute this file once against a fresh database.
-- =============================================================================

-- Enable UUID generation (pgcrypto ships with Supabase)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Helper: auto-update updated_at columns
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- =============================================================================
-- 1. users
-- =============================================================================

CREATE TABLE users (
    id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    email          VARCHAR(255) UNIQUE NOT NULL,
    name           VARCHAR(255),
    avatar_url     TEXT,
    role           VARCHAR(50) NOT NULL DEFAULT 'user'
                     CHECK (role IN ('user', 'admin')),
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMPTZ,
    last_active_at TIMESTAMPTZ
);

CREATE INDEX idx_users_email ON users (email);
CREATE INDEX idx_users_role  ON users (role);

CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- =============================================================================
-- 2. research_sessions
-- =============================================================================

CREATE TABLE research_sessions (
    id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id          UUID        REFERENCES users (id) ON DELETE SET NULL,
    query            TEXT        NOT NULL,
    status           VARCHAR(50) NOT NULL DEFAULT 'pending'
                       CHECK (status IN ('pending', 'running', 'completed', 'failed')),
    depth            SMALLINT    NOT NULL DEFAULT 3
                       CHECK (depth BETWEEN 1 AND 5),
    confidence_score NUMERIC(5,4)
                       CHECK (confidence_score BETWEEN 0 AND 1),
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ,
    completed_at     TIMESTAMPTZ
);

CREATE INDEX idx_sessions_user_id    ON research_sessions (user_id);
CREATE INDEX idx_sessions_status     ON research_sessions (status);
CREATE INDEX idx_sessions_created_at ON research_sessions (created_at DESC);

CREATE TRIGGER trg_sessions_updated_at
    BEFORE UPDATE ON research_sessions
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- =============================================================================
-- 3. agent_outputs
-- =============================================================================

CREATE TABLE agent_outputs (
    id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id   UUID        NOT NULL
                   REFERENCES research_sessions (id) ON DELETE CASCADE,
    agent_name   VARCHAR(100) NOT NULL
                   CHECK (agent_name IN ('Planner','Researcher','Critic','FactChecker','Synthesizer')),
    event_type   VARCHAR(50)  NOT NULL
                   CHECK (event_type IN ('thinking','searching','found','done','error')),
    message      TEXT         NOT NULL,
    payload      JSONB,
    duration_ms  INTEGER      CHECK (duration_ms >= 0),
    tokens_used  INTEGER      CHECK (tokens_used  >= 0),
    model_used   VARCHAR(100),
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_agent_outputs_session_id  ON agent_outputs (session_id);
CREATE INDEX idx_agent_outputs_agent_name  ON agent_outputs (agent_name);
CREATE INDEX idx_agent_outputs_created_at  ON agent_outputs (created_at);
-- JSONB index for payload queries
CREATE INDEX idx_agent_outputs_payload     ON agent_outputs USING GIN (payload);


-- =============================================================================
-- 4. sources
-- =============================================================================

CREATE TABLE sources (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id      UUID        NOT NULL
                      REFERENCES research_sessions (id) ON DELETE CASCADE,
    url             TEXT        NOT NULL,
    title           TEXT,
    domain          VARCHAR(255),
    snippet         TEXT,
    full_content    TEXT,
    relevance_score NUMERIC(5,4)
                      CHECK (relevance_score BETWEEN 0 AND 1),
    source_index    SMALLINT,
    is_primary      BOOLEAN     NOT NULL DEFAULT FALSE,
    retrieved_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sources_session_id  ON sources (session_id);
CREATE INDEX idx_sources_domain      ON sources (domain);
CREATE INDEX idx_sources_relevance   ON sources (relevance_score DESC);


-- =============================================================================
-- 5. claims
-- =============================================================================

CREATE TABLE claims (
    id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id          UUID        NOT NULL
                          REFERENCES research_sessions (id) ON DELETE CASCADE,
    claim_text          TEXT        NOT NULL,
    verdict             VARCHAR(50) NOT NULL
                          CHECK (verdict IN ('verified','disputed','unverified')),
    confidence          VARCHAR(50) NOT NULL
                          CHECK (confidence IN ('high','medium','low')),
    confidence_score    NUMERIC(5,4)
                          CHECK (confidence_score BETWEEN 0 AND 1),
    explanation         TEXT,
    supporting_sources  SMALLINT    NOT NULL DEFAULT 0 CHECK (supporting_sources  >= 0),
    contrasting_sources SMALLINT    NOT NULL DEFAULT 0 CHECK (contrasting_sources >= 0),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_claims_session_id ON claims (session_id);
CREATE INDEX idx_claims_verdict    ON claims (verdict);
CREATE INDEX idx_claims_confidence ON claims (confidence);


-- =============================================================================
-- 5a. claim_sources  (many-to-many junction)
-- =============================================================================

CREATE TABLE claim_sources (
    claim_id  UUID    NOT NULL REFERENCES claims  (id) ON DELETE CASCADE,
    source_id UUID    NOT NULL REFERENCES sources (id) ON DELETE CASCADE,
    supports  BOOLEAN NOT NULL,   -- TRUE = supports | FALSE = contradicts
    PRIMARY KEY (claim_id, source_id)
);

CREATE INDEX idx_claim_sources_source_id ON claim_sources (source_id);


-- =============================================================================
-- 6. final_reports
-- =============================================================================

CREATE TABLE final_reports (
    id                 UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id         UUID        UNIQUE NOT NULL
                         REFERENCES research_sessions (id) ON DELETE CASCADE,
    synthesis          TEXT        NOT NULL,
    executive_summary  TEXT,
    confidence_score   NUMERIC(5,4)
                         CHECK (confidence_score BETWEEN 0 AND 1),
    word_count         INTEGER     CHECK (word_count >= 0),
    model_used         VARCHAR(100),
    tokens_used        INTEGER     CHECK (tokens_used >= 0),
    generation_time_ms INTEGER     CHECK (generation_time_ms >= 0),
    created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Full-text search index on synthesis
CREATE INDEX idx_final_reports_fts
    ON final_reports
    USING GIN (to_tsvector('english', synthesis));


-- =============================================================================
-- 7. feedback
-- =============================================================================

CREATE TABLE feedback (
    id                   UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id           UUID    REFERENCES research_sessions (id) ON DELETE SET NULL,
    user_id              UUID    REFERENCES users             (id) ON DELETE SET NULL,
    report_id            UUID    REFERENCES final_reports     (id) ON DELETE SET NULL,
    rating               SMALLINT CHECK (rating               BETWEEN 1 AND 5),
    accuracy_rating      SMALLINT CHECK (accuracy_rating      BETWEEN 1 AND 5),
    completeness_rating  SMALLINT CHECK (completeness_rating  BETWEEN 1 AND 5),
    comment              TEXT,
    is_helpful           BOOLEAN,
    created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_feedback_session_id ON feedback (session_id);
CREATE INDEX idx_feedback_user_id    ON feedback (user_id);
CREATE INDEX idx_feedback_report_id  ON feedback (report_id);


-- =============================================================================
-- Row Level Security (Supabase)
-- Enable per-table RLS and add basic policies.
-- Adjust to match your auth strategy.
-- =============================================================================

ALTER TABLE users             ENABLE ROW LEVEL SECURITY;
ALTER TABLE research_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_outputs     ENABLE ROW LEVEL SECURITY;
ALTER TABLE sources           ENABLE ROW LEVEL SECURITY;
ALTER TABLE claims            ENABLE ROW LEVEL SECURITY;
ALTER TABLE claim_sources     ENABLE ROW LEVEL SECURITY;
ALTER TABLE final_reports     ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback          ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile
CREATE POLICY "users_select_own"
    ON users FOR SELECT
    USING (auth.uid()::text = id::text);

-- Sessions are readable by their owner (or publicly if user_id is null)
CREATE POLICY "sessions_select_own"
    ON research_sessions FOR SELECT
    USING (user_id IS NULL OR auth.uid()::text = user_id::text);

-- All authenticated users can insert sessions
CREATE POLICY "sessions_insert"
    ON research_sessions FOR INSERT
    WITH CHECK (true);

-- Feedback: anyone can insert, only the submitter can read theirs
CREATE POLICY "feedback_insert"
    ON feedback FOR INSERT
    WITH CHECK (true);

CREATE POLICY "feedback_select_own"
    ON feedback FOR SELECT
    USING (user_id IS NULL OR auth.uid()::text = user_id::text);

-- Service role bypasses all RLS (used by FastAPI backend)
-- Grant this role in Supabase dashboard → API → service_role key
