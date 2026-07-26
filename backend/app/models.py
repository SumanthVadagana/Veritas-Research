"""
SQLAlchemy ORM models for Veritas Research.

Tables
------
users              – registered users (optional auth layer)
research_sessions  – one session per research query
agent_outputs      – every agent step event in a session
sources            – web pages retrieved during research
claims             – fact-checked claims extracted from findings
claim_sources      – many-to-many: which sources back each claim
final_reports      – the synthesised answer for a completed session
feedback           – user ratings / comments on a session's report
"""

import uuid
from sqlalchemy import (
    Boolean,
    CheckConstraint,
    Column,
    DateTime,
    Float,
    ForeignKey,
    Index,
    Integer,
    JSON,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


def _uuid() -> str:
    return str(uuid.uuid4())


# ─── Users ────────────────────────────────────────────────────────────────────

class User(Base):
    __tablename__ = "users"
    __table_args__ = (
        Index("idx_users_email", "email"),
        Index("idx_users_role", "role"),
    )

    id             = Column(String(36), primary_key=True, default=_uuid)
    email          = Column(String(255), unique=True, nullable=False)
    name           = Column(String(255), nullable=True)
    avatar_url     = Column(Text, nullable=True)
    role           = Column(String(50), default="user", nullable=False)   # user | admin
    password_hash  = Column(String(255), nullable=True)
    created_at     = Column(DateTime(timezone=True), server_default=func.now())

    updated_at     = Column(DateTime(timezone=True), onupdate=func.now())
    last_active_at = Column(DateTime(timezone=True), nullable=True)

    sessions = relationship("ResearchSession", back_populates="user")
    feedback = relationship("Feedback", back_populates="user")


# ─── Research Sessions ────────────────────────────────────────────────────────

class ResearchSession(Base):
    __tablename__ = "research_sessions"
    __table_args__ = (
        CheckConstraint("depth BETWEEN 1 AND 5",           name="ck_session_depth"),
        CheckConstraint("confidence_score >= 0.0",         name="ck_session_confidence_min"),
        CheckConstraint("confidence_score <= 1.0",         name="ck_session_confidence_max"),
        Index("idx_sessions_user_id",    "user_id"),
        Index("idx_sessions_status",     "status"),
        Index("idx_sessions_created_at", "created_at"),
    )

    id               = Column(String(36), primary_key=True, default=_uuid)
    user_id          = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    query            = Column(Text, nullable=False)
    status           = Column(String(50), default="pending", nullable=False)  # pending | running | completed | failed
    depth            = Column(Integer, default=3, nullable=False)
    # Denormalised from final_reports for fast listing queries
    confidence_score = Column(Float, nullable=True)
    created_at       = Column(DateTime(timezone=True), server_default=func.now())
    updated_at       = Column(DateTime(timezone=True), onupdate=func.now())
    completed_at     = Column(DateTime(timezone=True), nullable=True)

    user          = relationship("User", back_populates="sessions")
    agent_outputs = relationship("AgentOutput",  back_populates="session", cascade="all, delete-orphan")
    sources       = relationship("Source",       back_populates="session", cascade="all, delete-orphan")
    claims        = relationship("Claim",        back_populates="session", cascade="all, delete-orphan")
    final_report  = relationship("FinalReport",  back_populates="session", uselist=False, cascade="all, delete-orphan")
    feedback      = relationship("Feedback",     back_populates="session")


# ─── Agent Outputs ────────────────────────────────────────────────────────────

class AgentOutput(Base):
    """Records every step an agent takes during a research session."""
    __tablename__ = "agent_outputs"
    __table_args__ = (
        Index("idx_agent_outputs_session_id",  "session_id"),
        Index("idx_agent_outputs_agent_name",  "agent_name"),
        Index("idx_agent_outputs_created_at",  "created_at"),
    )

    id           = Column(String(36), primary_key=True, default=_uuid)
    session_id   = Column(String(36), ForeignKey("research_sessions.id", ondelete="CASCADE"), nullable=False)
    agent_name   = Column(String(100), nullable=False)   # Planner | Researcher | Critic | FactChecker | Synthesizer
    event_type   = Column(String(50),  nullable=False)   # thinking | searching | found | done | error
    message      = Column(Text, nullable=False)
    payload      = Column(JSON, nullable=True)            # arbitrary structured context
    duration_ms  = Column(Integer, nullable=True)         # wall-clock time for this step
    tokens_used  = Column(Integer, nullable=True)         # LLM token cost
    model_used   = Column(String(100), nullable=True)     # e.g. claude-haiku-4-5
    created_at   = Column(DateTime(timezone=True), server_default=func.now())

    session = relationship("ResearchSession", back_populates="agent_outputs")


# ─── Sources ──────────────────────────────────────────────────────────────────

class Source(Base):
    """A web page retrieved via Tavily during the research phase."""
    __tablename__ = "sources"
    __table_args__ = (
        CheckConstraint("relevance_score >= 0.0", name="ck_source_relevance_min"),
        CheckConstraint("relevance_score <= 1.0", name="ck_source_relevance_max"),
        Index("idx_sources_session_id",  "session_id"),
        Index("idx_sources_domain",      "domain"),
        Index("idx_sources_relevance",   "relevance_score"),
    )

    id              = Column(String(36), primary_key=True, default=_uuid)
    session_id      = Column(String(36), ForeignKey("research_sessions.id", ondelete="CASCADE"), nullable=False)
    url             = Column(Text, nullable=False)
    title           = Column(Text, nullable=True)
    domain          = Column(String(255), nullable=True)   # extracted hostname
    snippet         = Column(Text, nullable=True)           # short excerpt shown in UI
    full_content    = Column(Text, nullable=True)           # raw content from Tavily
    relevance_score = Column(Float, nullable=True)
    source_index    = Column(Integer, nullable=True)        # 1-based display order
    is_primary      = Column(Boolean, default=False)        # flagged by FactChecker
    retrieved_at    = Column(DateTime(timezone=True), server_default=func.now())

    session     = relationship("ResearchSession", back_populates="sources")
    claim_links = relationship("ClaimSource", back_populates="source", cascade="all, delete-orphan")


# ─── Claims ───────────────────────────────────────────────────────────────────

class Claim(Base):
    """A fact-checked claim extracted from research findings."""
    __tablename__ = "claims"
    __table_args__ = (
        CheckConstraint("confidence_score >= 0.0", name="ck_claim_cs_min"),
        CheckConstraint("confidence_score <= 1.0", name="ck_claim_cs_max"),
        Index("idx_claims_session_id", "session_id"),
        Index("idx_claims_verdict",    "verdict"),
        Index("idx_claims_confidence", "confidence"),
    )

    id                  = Column(String(36), primary_key=True, default=_uuid)
    session_id          = Column(String(36), ForeignKey("research_sessions.id", ondelete="CASCADE"), nullable=False)
    claim_text          = Column(Text, nullable=False)
    verdict             = Column(String(50), nullable=False)     # verified | disputed | unverified
    confidence          = Column(String(50), nullable=False)     # high | medium | low
    confidence_score    = Column(Float, nullable=True)           # 0.0 – 1.0 numeric
    explanation         = Column(Text, nullable=True)
    supporting_sources  = Column(Integer, default=0)
    contrasting_sources = Column(Integer, default=0)
    created_at          = Column(DateTime(timezone=True), server_default=func.now())

    session     = relationship("ResearchSession", back_populates="claims")
    source_links = relationship("ClaimSource", back_populates="claim", cascade="all, delete-orphan")


# ─── Claim ↔ Source (junction) ────────────────────────────────────────────────

class ClaimSource(Base):
    """Many-to-many: a claim can be backed or contradicted by multiple sources."""
    __tablename__ = "claim_sources"
    __table_args__ = (
        Index("idx_claim_sources_source_id", "source_id"),
    )

    claim_id  = Column(String(36), ForeignKey("claims.id",  ondelete="CASCADE"), primary_key=True)
    source_id = Column(String(36), ForeignKey("sources.id", ondelete="CASCADE"), primary_key=True)
    supports  = Column(Boolean, nullable=False)   # True = supports | False = contradicts

    claim  = relationship("Claim",  back_populates="source_links")
    source = relationship("Source", back_populates="claim_links")


# ─── Final Reports ────────────────────────────────────────────────────────────

class FinalReport(Base):
    """The Synthesizer's output — one report per completed session."""
    __tablename__ = "final_reports"
    __table_args__ = (
        UniqueConstraint("session_id", name="uq_report_session"),
        CheckConstraint("confidence_score >= 0.0", name="ck_report_cs_min"),
        CheckConstraint("confidence_score <= 1.0", name="ck_report_cs_max"),
        CheckConstraint("word_count >= 0",         name="ck_report_word_count"),
    )

    id                  = Column(String(36), primary_key=True, default=_uuid)
    session_id          = Column(String(36), ForeignKey("research_sessions.id", ondelete="CASCADE"), unique=True, nullable=False)
    synthesis           = Column(Text, nullable=False)
    executive_summary   = Column(Text, nullable=True)    # optional 2-3 sentence TL;DR
    confidence_score    = Column(Float, nullable=True)
    word_count          = Column(Integer, nullable=True)
    model_used          = Column(String(100), nullable=True)
    tokens_used         = Column(Integer, nullable=True)
    generation_time_ms  = Column(Integer, nullable=True)
    created_at          = Column(DateTime(timezone=True), server_default=func.now())

    session  = relationship("ResearchSession", back_populates="final_report")
    feedback = relationship("Feedback", back_populates="report")


# ─── Feedback ─────────────────────────────────────────────────────────────────

class Feedback(Base):
    """User ratings and comments on a research report."""
    __tablename__ = "feedback"
    __table_args__ = (
        CheckConstraint("rating              BETWEEN 1 AND 5", name="ck_fb_rating"),
        CheckConstraint("accuracy_rating     BETWEEN 1 AND 5", name="ck_fb_accuracy"),
        CheckConstraint("completeness_rating BETWEEN 1 AND 5", name="ck_fb_completeness"),
        Index("idx_feedback_session_id", "session_id"),
        Index("idx_feedback_user_id",    "user_id"),
        Index("idx_feedback_report_id",  "report_id"),
    )

    id                   = Column(String(36), primary_key=True, default=_uuid)
    session_id           = Column(String(36), ForeignKey("research_sessions.id",  ondelete="SET NULL"), nullable=True)
    user_id              = Column(String(36), ForeignKey("users.id",              ondelete="SET NULL"), nullable=True)
    report_id            = Column(String(36), ForeignKey("final_reports.id",      ondelete="SET NULL"), nullable=True)
    rating               = Column(Integer, nullable=True)   # 1-5 overall
    accuracy_rating      = Column(Integer, nullable=True)   # 1-5
    completeness_rating  = Column(Integer, nullable=True)   # 1-5
    comment              = Column(Text, nullable=True)
    is_helpful           = Column(Boolean, nullable=True)
    created_at           = Column(DateTime(timezone=True), server_default=func.now())

    session = relationship("ResearchSession", back_populates="feedback")
    user    = relationship("User",            back_populates="feedback")
    report  = relationship("FinalReport",     back_populates="feedback")
