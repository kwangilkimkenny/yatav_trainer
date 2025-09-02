"""
Feedback models for YATAV Training System
"""

from datetime import datetime
from typing import Optional, List, Dict, Any
from enum import Enum
from pydantic import BaseModel, Field, ConfigDict
import uuid

class FeedbackType(str, Enum):
    """Feedback type"""
    REAL_TIME = "real_time"
    SESSION_SUMMARY = "session_summary"
    SKILL_ASSESSMENT = "skill_assessment"
    IMPROVEMENT_PLAN = "improvement_plan"

class SkillCategory(str, Enum):
    """Counseling skill categories"""
    LISTENING = "listening"
    EMPATHY = "empathy"
    QUESTIONING = "questioning"
    REFLECTION = "reflection"
    SUMMARIZING = "summarizing"
    GOAL_SETTING = "goal_setting"
    CRISIS_MANAGEMENT = "crisis_management"
    BOUNDARY_SETTING = "boundary_setting"

class Feedback(BaseModel):
    """Feedback model"""
    model_config = ConfigDict(from_attributes=True)
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    session_id: str
    user_id: str
    message_id: Optional[str] = None  # For message-specific feedback
    
    # Feedback Details
    feedback_type: FeedbackType
    category: SkillCategory
    
    # Content
    title: str
    summary: str
    detailed_analysis: str
    strengths: List[str] = Field(default_factory=list)
    areas_for_improvement: List[str] = Field(default_factory=list)
    recommendations: List[str] = Field(default_factory=list)
    
    # Scoring
    overall_score: float = Field(ge=0, le=100)
    skill_scores: Dict[str, float] = Field(default_factory=dict)
    
    # Evidence
    supporting_quotes: List[str] = Field(default_factory=list)
    missed_opportunities: List[str] = Field(default_factory=list)
    
    # Metadata
    created_at: datetime = Field(default_factory=datetime.utcnow)
    generated_by: str = "ai"  # ai, instructor, self
    ai_model_used: Optional[str] = None
    
    # Interaction
    is_read: bool = False
    user_rating: Optional[int] = Field(None, ge=1, le=5)
    user_notes: Optional[str] = None

class FeedbackCreate(BaseModel):
    """Feedback creation model"""
    session_id: str
    message_id: Optional[str] = None
    feedback_type: FeedbackType
    category: SkillCategory
    title: str
    summary: str
    detailed_analysis: str
    strengths: List[str] = Field(default_factory=list)
    areas_for_improvement: List[str] = Field(default_factory=list)
    recommendations: List[str] = Field(default_factory=list)
    overall_score: float = Field(ge=0, le=100)
    skill_scores: Dict[str, float] = Field(default_factory=dict)

class SessionFeedbackSummary(BaseModel):
    """Complete session feedback summary"""
    session_id: str
    overall_performance: Dict[str, Any]
    skill_breakdown: Dict[str, Dict[str, Any]]
    timeline_analysis: List[Dict[str, Any]]
    improvement_plan: Dict[str, Any]
    next_session_recommendations: List[str]
    
    # Progress tracking
    comparison_to_previous: Optional[Dict[str, Any]] = None
    learning_trajectory: Optional[Dict[str, Any]] = None

class SkillProgress(BaseModel):
    """User skill progress tracking"""
    user_id: str
    skill_category: SkillCategory
    current_level: float = Field(ge=0, le=100)
    sessions_practiced: int = 0
    improvement_rate: float = 0.0
    last_updated: datetime = Field(default_factory=datetime.utcnow)
    milestones_achieved: List[str] = Field(default_factory=list)