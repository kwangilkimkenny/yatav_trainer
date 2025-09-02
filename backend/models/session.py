"""
Training Session models for YATAV Training System
"""

from datetime import datetime
from typing import Optional, List, Dict, Any
from enum import Enum
from pydantic import BaseModel, Field, ConfigDict
import uuid

class SessionStatus(str, Enum):
    """Training session status"""
    ACTIVE = "active"
    COMPLETED = "completed"
    PAUSED = "paused"
    CANCELLED = "cancelled"

class SessionType(str, Enum):
    """Training session type"""
    BASIC = "basic"
    CRISIS = "crisis"
    TECHNIQUES = "techniques"
    CUSTOM = "custom"

class TrainingSession(BaseModel):
    """Training session model"""
    model_config = ConfigDict(from_attributes=True)
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    program_id: str
    character_id: str
    
    # Session details
    title: str
    description: Optional[str] = None
    session_type: SessionType = SessionType.BASIC
    status: SessionStatus = SessionStatus.ACTIVE
    
    # Timing
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    started_at: Optional[datetime] = None
    ended_at: Optional[datetime] = None
    duration_minutes: int = 0
    
    # Content
    messages: List[Dict[str, Any]] = Field(default_factory=list)
    recording_url: Optional[str] = None
    transcript: Optional[str] = None
    
    # Evaluation
    scores: Dict[str, float] = Field(default_factory=dict)
    feedback: Optional[Dict[str, Any]] = None
    self_assessment: Optional[Dict[str, Any]] = None
    
    # Settings
    settings: Dict[str, Any] = Field(default_factory=dict)
    metadata: Dict[str, Any] = Field(default_factory=dict)

class SessionCreate(BaseModel):
    """Session creation model"""
    program_id: str
    character_id: str
    title: str
    description: Optional[str] = None
    session_type: SessionType = SessionType.BASIC
    settings: Dict[str, Any] = Field(default_factory=dict)

class SessionUpdate(BaseModel):
    """Session update model"""
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[SessionStatus] = None
    scores: Optional[Dict[str, float]] = None
    feedback: Optional[Dict[str, Any]] = None
    self_assessment: Optional[Dict[str, Any]] = None
    settings: Optional[Dict[str, Any]] = None

class SessionSummary(BaseModel):
    """Session summary for lists"""
    id: str
    title: str
    session_type: SessionType
    status: SessionStatus
    created_at: datetime
    duration_minutes: int
    character_name: str
    overall_score: Optional[float] = None