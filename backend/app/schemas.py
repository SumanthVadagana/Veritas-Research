"""
Pydantic v2 schemas for Veritas Research API.

Pattern per resource
--------------------
  <Name>Base     – fields shared across create/update
  <Name>Create   – request body for POST
  <Name>Update   – request body for PATCH (all fields optional)
  <Name>Read     – full response, ORM-mapped (from_attributes=True)
  <Name>Summary  – lightweight row used in list endpoints
"""

from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, List, Literal, Optional, Union

from pydantic import BaseModel, ConfigDict, Field


# ─── Shared config ────────────────────────────────────────────────────────────

_ORM = ConfigDict(from_attributes=True)


# ═══════════════════════════════════════════════════════════════════════════════
# Users
# ═══════════════════════════════════════════════════════════════════════════════

class UserBase(BaseModel):
    email: str
    name: Optional[str] = None
    avatar_url: Optional[str] = None


class UserCreate(UserBase):
    pass


class UserUpdate(BaseModel):
    name: Optional[str] = None
    avatar_url: Optional[str] = None
    role: Optional[Literal["user", "admin"]] = None


class UserRead(UserBase):
    model_config = _ORM
    id: str
    role: str
    created_at: datetime
    updated_at: Optional[datetime] = None
    last_active_at: Optional[datetime] = None


class UserSummary(BaseModel):
    model_config = _ORM
    id: str
    email: str
    name: Optional[str] = None
    role: str


# ═══════════════════════════════════════════════════════════════════════════════
# Request / Response Schemas
# ═══════════════════════════════════════════════════════════════════════════════

class ResearchRequest(BaseModel):
    """POST /api/research — request body."""
    topic: Optional[str] = Field(None, description="Research topic or question")
    query: Optional[str] = Field(None, description="Alias for topic")
    depth: Union[str, int] = Field(default="standard", description="quick | standard | deep or 1..5")
    user_id: Optional[str] = None

    def get_topic(self) -> str:
        t = self.topic or self.query
        if not t or len(str(t).strip()) < 3:
            raise ValueError("Must provide 'topic' or 'query' with at least 3 characters.")
        return str(t).strip()

    def get_depth_int(self) -> int:
        if isinstance(self.depth, int):
            return max(1, min(5, self.depth))
        d_map = {"quick": 1, "standard": 3, "deep": 5}
        return d_map.get(str(self.depth).lower(), 3)


class ResearchResponse(BaseModel):
    """Immediate response from POST /api/research."""
    session_id: str
    status: str
    message: str


# ═══════════════════════════════════════════════════════════════════════════════
# Sub-resource Read Schemas (defined before SessionRead)
# ═══════════════════════════════════════════════════════════════════════════════

class AgentOutputRead(BaseModel):
    model_config = _ORM
    id: str
    session_id: str
    agent_name: str
    event_type: str
    message: str
    payload: Optional[Dict[str, Any]] = None
    duration_ms: Optional[int] = None
    tokens_used: Optional[int] = None
    model_used: Optional[str] = None
    created_at: datetime


class SourceRead(BaseModel):
    model_config = _ORM
    id: str
    url: str
    title: Optional[str] = None
    domain: Optional[str] = None
    snippet: Optional[str] = None
    relevance_score: Optional[float] = None
    source_index: Optional[int] = None
    is_primary: bool = False
    retrieved_at: datetime


class ClaimRead(BaseModel):
    model_config = _ORM
    id: str
    claim_text: str
    verdict: Literal["verified", "disputed", "unverified"]
    confidence: Literal["high", "medium", "low"]
    confidence_score: Optional[float] = None
    explanation: Optional[str] = None
    supporting_sources: int = 0
    contrasting_sources: int = 0
    created_at: datetime


class FinalReportRead(BaseModel):
    model_config = _ORM
    id: str
    session_id: str
    synthesis: str
    executive_summary: Optional[str] = None
    confidence_score: Optional[float] = None
    word_count: Optional[int] = None
    model_used: Optional[str] = None
    tokens_used: Optional[int] = None
    generation_time_ms: Optional[int] = None
    created_at: datetime


# ═══════════════════════════════════════════════════════════════════════════════
# Research Sessions (ordered after sub-resources)
# ═══════════════════════════════════════════════════════════════════════════════

class SessionSummary(BaseModel):
    """Lightweight row for list endpoints."""
    model_config = _ORM
    id: str
    query: str
    status: str
    depth: int
    confidence_score: Optional[float] = None
    created_at: datetime
    completed_at: Optional[datetime] = None


class SessionRead(BaseModel):
    """Full session detail with all relationships."""
    model_config = _ORM
    id: str
    query: str
    status: str
    depth: int
    confidence_score: Optional[float] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    user: Optional[UserSummary] = None
    agent_outputs: List[AgentOutputRead] = []
    sources: List[SourceRead] = []
    claims: List[ClaimRead] = []
    final_report: Optional[FinalReportRead] = None


# ═══════════════════════════════════════════════════════════════════════════════
# Feedback
# ═══════════════════════════════════════════════════════════════════════════════

class FeedbackCreate(BaseModel):
    session_id: Optional[str] = None
    user_id: Optional[str] = None
    report_id: Optional[str] = None
    rating: Optional[int] = Field(default=None, ge=1, le=5)
    accuracy_rating: Optional[int] = Field(default=None, ge=1, le=5)
    completeness_rating: Optional[int] = Field(default=None, ge=1, le=5)
    comment: Optional[str] = None
    is_helpful: Optional[bool] = None


class FeedbackRead(BaseModel):
    model_config = _ORM
    id: str
    session_id: Optional[str] = None
    user_id: Optional[str] = None
    report_id: Optional[str] = None
    rating: Optional[int] = None
    accuracy_rating: Optional[int] = None
    completeness_rating: Optional[int] = None
    comment: Optional[str] = None
    is_helpful: Optional[bool] = None
    created_at: datetime


# ─── Rebuild models to resolve any type annotations ──────────────────────────
ResearchRequest.model_rebuild()
SessionRead.model_rebuild()
