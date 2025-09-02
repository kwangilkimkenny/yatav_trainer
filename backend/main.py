#!/usr/bin/env python3
"""
YATAV Training System Backend
FastAPI-based API server for AI counseling training platform
"""

import os
import sys
import logging
import asyncio
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any, Union
from contextlib import asynccontextmanager

# FastAPI and HTTP
from fastapi import FastAPI, HTTPException, Depends, status, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
import uvicorn

# Database
from motor.motor_asyncio import AsyncIOMotorClient
import redis.asyncio as redis
from pymongo.errors import ConnectionFailure

# Security
from passlib.context import CryptContext
from jose import JWTError, jwt

# Models and validation
from pydantic import BaseModel, EmailStr, Field, ConfigDict
from pydantic_settings import BaseSettings

# Utilities
import uuid
import json
from pathlib import Path

# AI Services
from services.ai_service import AIService

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('yatav_backend.log'),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

# Settings
class Settings(BaseSettings):
    # App Settings
    app_name: str = "YATAV Training System Backend"
    app_version: str = "2.0.0"
    debug: bool = False
    
    # Database
    mongodb_url: str = "mongodb://localhost:27017"
    mongodb_name: str = "yatav_training"
    redis_url: str = "redis://localhost:6379"
    
    # Security
    secret_key: str = "yatav-super-secret-key-change-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    
    # API Keys
    openai_api_key: Optional[str] = None
    anthropic_api_key: Optional[str] = None
    
    # CORS
    allowed_origins: List[str] = ["http://localhost:3001", "http://127.0.0.1:3001"]
    
    model_config = ConfigDict(env_file=".env", extra="ignore")

settings = Settings()

# Security
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

# Database clients (initialized in lifespan)
mongo_client: Optional[AsyncIOMotorClient] = None
mongo_db = None
redis_client: Optional[redis.Redis] = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events"""
    global mongo_client, mongo_db, redis_client, ai_service
    
    # Startup
    logger.info("Starting YATAV Backend Server...")
    
    try:
        # Initialize MongoDB
        mongo_client = AsyncIOMotorClient(settings.mongodb_url)
        mongo_db = mongo_client[settings.mongodb_name]
        await mongo_client.admin.command('ping')
        logger.info("✓ Connected to MongoDB")
        
        # Initialize Redis (optional - continue without Redis if unavailable)
        try:
            redis_client = redis.from_url(settings.redis_url)
            await redis_client.ping()
            logger.info("✓ Connected to Redis")
        except Exception as redis_error:
            logger.warning(f"⚠ Redis connection failed: {redis_error}")
            logger.info("Continuing without Redis (caching disabled)")
        
        # Create indexes
        await create_database_indexes()
        
    except Exception as e:
        logger.error(f"✗ Database connection failed: {e}")
        raise e
    
    logger.info("🚀 YATAV Backend Server started successfully")
    
    # Initialize default characters (비활성화 - 새로운 데이터 사용)
    # await init_default_characters()
    
    # Initialize AI service with available API keys or demo provider
    try:
        openai_key = settings.openai_api_key or os.getenv("OPENAI_API_KEY")
        anthropic_key = settings.anthropic_api_key or os.getenv("ANTHROPIC_API_KEY")
        
        logger.info(f"OpenAI API Key: {'Set' if openai_key else 'Not set'}")
        logger.info(f"Anthropic API Key: {'Set' if anthropic_key else 'Not set'}")
        
        # Always initialize AI service (will use demo provider if no keys)
        ai_service = AIService(
            openai_key=openai_key,
            anthropic_key=anthropic_key
        )
        
        if openai_key or anthropic_key:
            logger.info("✓ AI Service initialized with API keys")
        else:
            logger.info("✓ AI Service initialized with demo provider")
            
    except Exception as e:
        logger.error(f"Failed to initialize AI service: {e}")
        # Even on error, create AI service with demo provider
        ai_service = AIService()
        logger.warning("⚠ Using demo AI provider due to initialization error")
    
    yield
    
    # Shutdown
    logger.info("Shutting down YATAV Backend Server...")
    
    if mongo_client:
        mongo_client.close()
        logger.info("✓ MongoDB connection closed")
    
    if redis_client:
        await redis_client.close()
        logger.info("✓ Redis connection closed")
    
    logger.info("👋 YATAV Backend Server shutdown complete")

# FastAPI app
app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="AI-powered counseling training platform backend",
    docs_url="/docs" if settings.debug else None,
    redoc_url="/redoc" if settings.debug else None,
    lifespan=lifespan
)

# Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(
    TrustedHostMiddleware, 
    allowed_hosts=["localhost", "127.0.0.1"]
)

# Pydantic Models
class User(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: Optional[str] = Field(default_factory=lambda: str(uuid.uuid4()))
    email: EmailStr
    name: str
    role: str = "trainee"  # trainee, instructor, admin
    created_at: datetime = Field(default_factory=datetime.utcnow)
    last_login: Optional[datetime] = None
    is_active: bool = True

class UserCreate(BaseModel):
    email: EmailStr
    name: str
    password: str
    role: str = "trainee"

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user: User

class TrainingSession(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: Optional[str] = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    program_id: str
    character_id: str
    status: str = "active"  # active, completed, paused
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    messages: List[Dict[str, Any]] = []
    feedback: Optional[Dict[str, Any]] = None

class Message(BaseModel):
    id: Optional[str] = Field(default_factory=lambda: str(uuid.uuid4()))
    session_id: str
    sender: str  # user, character
    content: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    metadata: Optional[Dict[str, Any]] = None

class VirtualCharacter(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: Optional[str] = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    age: int
    gender: str
    issue: str
    difficulty: int = Field(ge=1, le=10)
    background: str
    primary_issue: str
    personality: str
    character_type: str
    created_at: Optional[datetime] = Field(default_factory=datetime.utcnow)
    is_active: bool = True

# Database helper functions
async def create_database_indexes():
    """Create necessary database indexes"""
    try:
        # Users collection indexes
        await mongo_db.users.create_index("email", unique=True)
        await mongo_db.users.create_index("created_at")
        
        # Sessions collection indexes
        await mongo_db.sessions.create_index("user_id")
        await mongo_db.sessions.create_index("created_at")
        await mongo_db.sessions.create_index([("user_id", 1), ("created_at", -1)])
        
        # Messages collection indexes
        await mongo_db.messages.create_index("session_id")
        await mongo_db.messages.create_index("timestamp")
        
        # Characters collection indexes
        await mongo_db.characters.create_index("is_active")
        await mongo_db.characters.create_index("difficulty")
        
        logger.info("✓ Database indexes created")
        
    except Exception as e:
        logger.error(f"✗ Failed to create database indexes: {e}")

# Authentication functions
def hash_password(password: str) -> str:
    """Hash a password"""
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password"""
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Create JWT access token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.access_token_expire_minutes)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.secret_key, algorithm=settings.algorithm)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> User:
    """Get current authenticated user"""
    token = credentials.credentials
    
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user_doc = await mongo_db.users.find_one({"id": user_id})
    if user_doc is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return User(**user_doc)

async def get_current_user_optional(credentials: Optional[HTTPAuthorizationCredentials] = Depends(HTTPBearer(auto_error=False))) -> Optional[User]:
    """Get current authenticated user or None for demo mode"""
    if not credentials:
        # Demo mode - return a default demo user
        return User(
            id="demo_user",
            email="demo@yatav.com",
            name="Demo User",
            role="trainee",
            is_active=True,
            created_at=datetime.utcnow()
        )
    
    try:
        token = credentials.credentials
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
        user_id: str = payload.get("sub")
        if user_id is None:
            return None
            
        user_doc = await mongo_db.users.find_one({"id": user_id})
        if user_doc is None:
            return None
            
        return User(**user_doc)
    except JWTError:
        return None

# API Routes

# Health check
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow(),
        "version": settings.app_version,
        "services": {
            "mongodb": "connected" if mongo_client else "disconnected",
            "redis": "connected" if redis_client else "disconnected"
        }
    }

# Authentication endpoints
@app.post("/auth/register", response_model=Token)
async def register(user_data: UserCreate):
    """Register a new user"""
    # Check if user already exists
    existing_user = await mongo_db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create new user
    user = User(
        email=user_data.email,
        name=user_data.name,
        role=user_data.role
    )
    
    # Hash password and store user
    user_doc = user.model_dump()
    user_doc["password"] = hash_password(user_data.password)
    
    await mongo_db.users.insert_one(user_doc)
    
    # Create access token
    access_token = create_access_token(data={"sub": user.id})
    
    logger.info(f"New user registered: {user.email}")
    
    return Token(
        access_token=access_token,
        token_type="bearer",
        user=user
    )

@app.post("/auth/login", response_model=Token)
async def login(user_data: UserLogin):
    """User login"""
    # Find user
    user_doc = await mongo_db.users.find_one({"email": user_data.email})
    if not user_doc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    # Verify password
    if not verify_password(user_data.password, user_doc["password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    # Update last login
    await mongo_db.users.update_one(
        {"id": user_doc["id"]},
        {"$set": {"last_login": datetime.utcnow()}}
    )
    
    user = User(**user_doc)
    
    # Create access token
    access_token = create_access_token(data={"sub": user.id})
    
    logger.info(f"User logged in: {user.email}")
    
    return Token(
        access_token=access_token,
        token_type="bearer",
        user=user
    )

# User endpoints
@app.get("/auth/me", response_model=User)
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    """Get current user information"""
    return current_user

# Virtual Characters endpoints
@app.get("/characters", response_model=List[VirtualCharacter])
async def get_characters():
    """Get all active virtual characters"""
    characters_docs = await mongo_db.characters.find({"is_active": True}).to_list(length=None)
    return [VirtualCharacter(**doc) for doc in characters_docs]

@app.get("/characters/{character_id}", response_model=VirtualCharacter)
async def get_character(character_id: str):
    """Get a specific virtual character"""
    character_doc = await mongo_db.characters.find_one({"id": character_id, "is_active": True})
    if not character_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Character not found"
        )
    return VirtualCharacter(**character_doc)

# Training Sessions endpoints
@app.post("/sessions", response_model=TrainingSession)
async def create_session(
    program_id: str,
    character_id: str,
    current_user: User = Depends(get_current_user_optional)
):
    """Create a new training session"""
    # Verify character exists
    character_doc = await mongo_db.characters.find_one({"id": character_id, "is_active": True})
    if not character_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Character not found"
        )
    
    session = TrainingSession(
        user_id=current_user.id,
        program_id=program_id,
        character_id=character_id
    )
    
    await mongo_db.sessions.insert_one(session.model_dump())
    
    logger.info(f"New training session created: {session.id} for user {current_user.email}")
    
    return session

@app.get("/sessions", response_model=List[TrainingSession])
async def get_user_sessions(current_user: User = Depends(get_current_user_optional)):
    """Get all sessions for current user"""
    sessions_docs = await mongo_db.sessions.find(
        {"user_id": current_user.id}
    ).sort("created_at", -1).to_list(length=None)
    
    return [TrainingSession(**doc) for doc in sessions_docs]

@app.get("/sessions/{session_id}", response_model=TrainingSession)
async def get_session(session_id: str, current_user: User = Depends(get_current_user_optional)):
    """Get a specific session"""
    session_doc = await mongo_db.sessions.find_one({
        "id": session_id,
        "user_id": current_user.id
    })
    
    if not session_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found"
        )
    
    return TrainingSession(**session_doc)

# Messages endpoint
@app.post("/sessions/{session_id}/messages")
async def add_message(
    session_id: str,
    message_data: dict,
    current_user: User = Depends(get_current_user_optional)
):
    """Add a message to a training session"""
    # Verify session exists and belongs to user
    session_doc = await mongo_db.sessions.find_one({
        "id": session_id,
        "user_id": current_user.id
    })
    
    if not session_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found"
        )
    
    message = Message(
        session_id=session_id,
        sender=message_data.get("sender"),
        content=message_data.get("content"),
        metadata=message_data.get("metadata")
    )
    
    # Add message to session
    await mongo_db.sessions.update_one(
        {"id": session_id},
        {
            "$push": {"messages": message.model_dump()},
            "$set": {"updated_at": datetime.utcnow()}
        }
    )
    
    return {"status": "success", "message_id": message.id}

# WebSocket for real-time communication
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}
    
    async def connect(self, websocket: WebSocket, session_id: str):
        await websocket.accept()
        self.active_connections[session_id] = websocket
        logger.info(f"WebSocket connected for session: {session_id}")
    
    def disconnect(self, session_id: str):
        if session_id in self.active_connections:
            del self.active_connections[session_id]
            logger.info(f"WebSocket disconnected for session: {session_id}")
    
    async def send_message(self, session_id: str, message: dict):
        if session_id in self.active_connections:
            await self.active_connections[session_id].send_json(message)

manager = ConnectionManager()

# Initialize AI Service
ai_service = None

@app.websocket("/ws/{session_id}")
async def websocket_endpoint(websocket: WebSocket, session_id: str):
    await manager.connect(websocket, session_id)
    try:
        while True:
            data = await websocket.receive_json()
            
            # Process user message and generate AI response
            if data.get("type") == "user_message":
                character_id = data.get("character_id")
                user_message = data.get("content", "")
                
                # Get character info
                character_doc = await mongo_db.characters.find_one({"id": character_id})
                
                if character_doc and ai_service:
                    # Get conversation history
                    messages = await mongo_db.messages.find(
                        {"session_id": session_id}
                    ).sort("timestamp", -1).limit(10).to_list(length=10)
                    messages.reverse()
                    
                    # Use character document directly for AI service
                    character = character_doc
                    
                    # Generate AI response
                    try:
                        ai_content = await ai_service.generate_character_response(
                            character=character,
                            conversation_history=messages,
                            user_message=user_message
                        )
                    except Exception as e:
                        logger.error(f"AI generation error: {e}")
                        # Fallback response
                        ai_content = _generate_fallback_response(character_doc, user_message)
                else:
                    # Simple fallback if no AI service or character
                    ai_content = _generate_fallback_response(character_doc, user_message)
                
                ai_response = {
                    "type": "ai_response",
                    "content": ai_content,
                    "timestamp": datetime.utcnow().isoformat(),
                    "character_id": character_id
                }
                
                # Save AI response to database
                await mongo_db.messages.insert_one({
                    "session_id": session_id,
                    "sender": "character",
                    "content": ai_content,
                    "timestamp": datetime.utcnow(),
                    "metadata": {"character_id": character_id}
                })
                
                await manager.send_message(session_id, ai_response)
                
    except WebSocketDisconnect:
        manager.disconnect(session_id)

def _generate_fallback_response(character_doc: Optional[Dict], user_message: str) -> str:
    """Generate a simple fallback response when AI is not available"""
    
    if not character_doc:
        return "죄송합니다, 잠시 연결이 불안정합니다."
    
    difficulty = character_doc.get("difficulty", 3)
    name = character_doc.get("name", "내담자")
    
    # Simple response templates based on difficulty
    if difficulty <= 3:
        responses = [
            "네, 맞아요... 정말 그런 것 같아요.",
            "선생님 말씀을 들으니 제 마음이 좀 편해지는 것 같아요.",
            "그런데 여전히 불안한 마음이 들어요...",
            "네... 어떻게 해야 할지 잘 모르겠어요."
        ]
    elif difficulty <= 6:
        responses = [
            "글쎄요... 잘 모르겠어요.",
            "...(침묵)",
            "그게 그렇게 간단한 문제는 아닌 것 같은데요.",
            "음... 생각해본 적이 없어서..."
        ]
    else:
        responses = [
            "잘 모르겠어요.",
            "...",
            "말하고 싶지 않아요.",
            "그런 얘기는 하고 싶지 않아요."
        ]
    
    import random
    return random.choice(responses)

# Initialize default characters
async def init_default_characters():
    """Initialize default virtual characters"""
    default_characters = [
        {
            "id": "char_001",
            "name": "김미영 (27세)",
            "age": 27,
            "issue": "불안장애",
            "difficulty": 3,
            "background": "직장에서의 스트레스로 인한 불안증상",
            "personality": "내향적, 완벽주의",
            "character_type": "female-young",
            "created_at": datetime.utcnow(),
            "is_active": True
        },
        {
            "id": "char_002",
            "name": "박준호 (34세)",
            "age": 34,
            "issue": "우울증",
            "difficulty": 5,
            "background": "최근 이혼 후 우울감과 무기력증",
            "personality": "외향적이었으나 현재 위축됨",
            "character_type": "male-adult",
            "created_at": datetime.utcnow(),
            "is_active": True
        },
        {
            "id": "char_003",
            "name": "이소영 (19세)",
            "age": 19,
            "issue": "대인관계 문제",
            "difficulty": 2,
            "background": "대학 새내기, 친구 관계에서의 어려움",
            "personality": "수줍음, 민감함",
            "character_type": "female-teen",
            "created_at": datetime.utcnow(),
            "is_active": True
        }
    ]
    
    for char_data in default_characters:
        existing = await mongo_db.characters.find_one({"id": char_data["id"]})
        if not existing:
            await mongo_db.characters.insert_one(char_data)
    
    logger.info("✓ Default characters initialized")

# Note: Startup tasks are now handled in the lifespan context manager above

if __name__ == "__main__":
    # 특정 IP만 사용하도록 설정 (localhost/127.0.0.1만 허용)
    uvicorn.run(
        "main:app",
        host="127.0.0.1",  # localhost만 허용
        port=8008,
        reload=settings.debug,
        log_level="info" if not settings.debug else "debug"
    )