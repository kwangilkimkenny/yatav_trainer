"""
User models for YATAV Training System
"""

from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, EmailStr, Field, ConfigDict
import uuid

class User(BaseModel):
    """User model"""
    model_config = ConfigDict(from_attributes=True)
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: EmailStr
    name: str
    role: str = Field(default="trainee", description="Role: trainee, instructor, admin")
    profile_image: Optional[str] = None
    
    # Settings
    preferences: Dict[str, Any] = Field(default_factory=dict)
    api_keys: Dict[str, str] = Field(default_factory=dict)
    
    # Metadata
    created_at: datetime = Field(default_factory=datetime.utcnow)
    last_login: Optional[datetime] = None
    last_activity: Optional[datetime] = None
    
    # Status
    is_active: bool = True
    is_verified: bool = False
    
    # Statistics
    total_sessions: int = 0
    total_hours: float = 0.0
    average_score: float = 0.0

class UserCreate(BaseModel):
    """User creation model"""
    email: EmailStr
    name: str
    password: str = Field(min_length=8, description="Password must be at least 8 characters")
    role: str = Field(default="trainee")

class UserLogin(BaseModel):
    """User login model"""
    email: EmailStr
    password: str

class UserUpdate(BaseModel):
    """User update model"""
    name: Optional[str] = None
    profile_image: Optional[str] = None
    preferences: Optional[Dict[str, Any]] = None
    api_keys: Optional[Dict[str, str]] = None

class UserStats(BaseModel):
    """User statistics model"""
    total_sessions: int
    total_hours: float
    average_score: float
    sessions_this_month: int
    recent_activity: List[Dict[str, Any]]
    skill_progress: Dict[str, float]