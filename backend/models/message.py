"""
Message models for YATAV Training System
"""

from datetime import datetime
from typing import Optional, Dict, Any
from enum import Enum
from pydantic import BaseModel, Field, ConfigDict
import uuid

class MessageSender(str, Enum):
    """Message sender type"""
    USER = "user"
    CHARACTER = "character"
    SYSTEM = "system"

class MessageType(str, Enum):
    """Message type"""
    TEXT = "text"
    AUDIO = "audio"
    IMAGE = "image"
    SYSTEM_NOTIFICATION = "system_notification"
    FEEDBACK = "feedback"

class Message(BaseModel):
    """Message model"""
    model_config = ConfigDict(from_attributes=True)
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    session_id: str
    
    # Content
    sender: MessageSender
    message_type: MessageType = MessageType.TEXT
    content: str
    audio_url: Optional[str] = None
    image_url: Optional[str] = None
    
    # Timing
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    sequence_number: int = 0
    
    # Analysis
    emotion_detected: Optional[str] = None
    sentiment_score: Optional[float] = None
    keywords: list[str] = Field(default_factory=list)
    
    # Metadata
    metadata: Dict[str, Any] = Field(default_factory=dict)
    processing_time_ms: Optional[int] = None
    
    # Evaluation (for counselor messages)
    technique_used: Optional[str] = None
    effectiveness_score: Optional[float] = None
    feedback_notes: Optional[str] = None

class MessageCreate(BaseModel):
    """Message creation model"""
    session_id: str
    sender: MessageSender
    content: str
    message_type: MessageType = MessageType.TEXT
    audio_url: Optional[str] = None
    image_url: Optional[str] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)

class MessageAnalysis(BaseModel):
    """Message analysis result"""
    message_id: str
    emotion_detected: Optional[str] = None
    sentiment_score: Optional[float] = None
    keywords: list[str] = Field(default_factory=list)
    technique_used: Optional[str] = None
    effectiveness_score: Optional[float] = None
    suggestions: list[str] = Field(default_factory=list)