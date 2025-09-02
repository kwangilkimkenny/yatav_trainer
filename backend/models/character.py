"""
Virtual Character models for YATAV Training System
"""

from datetime import datetime
from typing import Optional, List, Dict, Any
from enum import Enum
from pydantic import BaseModel, Field, ConfigDict
import uuid

class CharacterType(str, Enum):
    """Character visual type"""
    FEMALE_YOUNG = "female-young"
    FEMALE_ADULT = "female-adult"
    FEMALE_TEEN = "female-teen"
    FEMALE_TEEN_2 = "female-teen-2"
    MALE_ADULT = "male-adult"
    MALE_MIDDLE = "male-middle"
    MALE_STRESSED = "male-stressed"

class IssueCategory(str, Enum):
    """Counseling issue categories"""
    ANXIETY = "anxiety"
    DEPRESSION = "depression"
    RELATIONSHIP = "relationship"
    TRAUMA = "trauma"
    ADDICTION = "addiction"
    SELF_HARM = "self_harm"
    CRISIS = "crisis"
    FAMILY = "family"
    WORK_STRESS = "work_stress"
    ACADEMIC = "academic"

class VirtualCharacter(BaseModel):
    """Virtual character model"""
    model_config = ConfigDict(from_attributes=True)
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    
    # Basic Info
    name: str
    age: int = Field(ge=16, le=80)
    gender: str
    character_type: CharacterType
    
    # Issue & Background
    primary_issue: IssueCategory
    secondary_issues: List[IssueCategory] = Field(default_factory=list)
    background: str
    current_situation: str
    
    # Personality
    personality_traits: List[str] = Field(default_factory=list)
    communication_style: str
    emotional_state: str
    defense_mechanisms: List[str] = Field(default_factory=list)
    
    # Clinical Information
    difficulty: int = Field(ge=1, le=10, description="Difficulty level 1-10")
    therapy_goals: List[str] = Field(default_factory=list)
    contraindications: List[str] = Field(default_factory=list)
    
    # AI Configuration
    system_prompt: str
    personality_prompt: str
    response_guidelines: List[str] = Field(default_factory=list)
    
    # Voice & Appearance
    voice_settings: Dict[str, Any] = Field(default_factory=dict)
    avatar_config: Dict[str, Any] = Field(default_factory=dict)
    
    # Metadata
    created_by: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    version: str = "1.0"
    
    # Status & Usage
    is_active: bool = True
    is_public: bool = True
    usage_count: int = 0
    average_rating: float = 0.0
    
    # Tags for filtering
    tags: List[str] = Field(default_factory=list)
    categories: List[str] = Field(default_factory=list)

class CharacterCreate(BaseModel):
    """Character creation model"""
    name: str
    age: int = Field(ge=16, le=80)
    gender: str
    character_type: CharacterType
    primary_issue: IssueCategory
    secondary_issues: List[IssueCategory] = Field(default_factory=list)
    background: str
    current_situation: str
    personality_traits: List[str] = Field(default_factory=list)
    communication_style: str
    emotional_state: str
    difficulty: int = Field(ge=1, le=10)
    system_prompt: str
    personality_prompt: str
    is_public: bool = True
    tags: List[str] = Field(default_factory=list)

class CharacterUpdate(BaseModel):
    """Character update model"""
    name: Optional[str] = None
    background: Optional[str] = None
    current_situation: Optional[str] = None
    personality_traits: Optional[List[str]] = None
    communication_style: Optional[str] = None
    emotional_state: Optional[str] = None
    difficulty: Optional[int] = Field(None, ge=1, le=10)
    system_prompt: Optional[str] = None
    personality_prompt: Optional[str] = None
    voice_settings: Optional[Dict[str, Any]] = None
    is_active: Optional[bool] = None
    tags: Optional[List[str]] = None

class CharacterSummary(BaseModel):
    """Character summary for lists"""
    id: str
    name: str
    age: int
    character_type: CharacterType
    primary_issue: IssueCategory
    difficulty: int
    background: str
    is_active: bool
    usage_count: int
    average_rating: float