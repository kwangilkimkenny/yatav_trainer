#!/usr/bin/env python3
"""
Initialize default characters in MongoDB
"""

import asyncio
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorClient
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def init_characters():
    """Initialize default characters in database"""
    
    # Connect to MongoDB
    mongo_client = AsyncIOMotorClient("mongodb://localhost:27017/")
    mongo_db = mongo_client.yatav_training
    
    # Default characters data
    default_characters = [
        {
            "id": "1",
            "name": "김미영",
            "age": 27,
            "gender": "female",
            "issue": "직장 스트레스로 인한 불안장애",
            "background": "대기업 3년차 직장인, 최근 승진 압박과 업무 과중으로 불안 증상 호소",
            "current_situation": "회사에서의 스트레스로 인한 불안증상이 일상생활에 영향을 미치기 시작함",
            "personality": "성실하고 책임감이 강하지만 완벽주의 성향",
            "communication_style": "논리적이고 체계적이지만 감정 표현에 서툴름",
            "emotional_state": "불안, 초조, 피로감",
            "primary_issue": "직장에서의 스트레스로 인한 불안증상",
            "difficulty": 3,
            "character_type": "female-adult",
            "created_at": datetime.utcnow(),
            "is_active": True
        },
        {
            "id": "2",
            "name": "박준호",
            "age": 35,
            "gender": "male",
            "issue": "우울증",
            "background": "최근 이혼 후 우울감 경험, IT 개발자",
            "current_situation": "이혼 후 혼자 생활하며 의욕 저하와 우울감을 느끼고 있음",
            "personality": "내향적, 분석적",
            "communication_style": "조용하고 신중한 편",
            "emotional_state": "우울, 무기력",
            "primary_issue": "이혼 후 우울증",
            "difficulty": 5,
            "character_type": "male-adult",
            "created_at": datetime.utcnow(),
            "is_active": True
        },
        {
            "id": "3",
            "name": "이소영",
            "age": 19,
            "gender": "female",
            "issue": "대인관계 문제",
            "background": "대학 새내기, 친구 관계에서의 어려움",
            "current_situation": "대학 입학 후 새로운 환경에 적응하는데 어려움을 겪고 있음",
            "personality": "수줍음, 민감함",
            "communication_style": "조심스럽고 망설이는 편",
            "emotional_state": "불안, 외로움",
            "primary_issue": "대인관계 형성의 어려움",
            "difficulty": 2,
            "character_type": "female-teen",
            "created_at": datetime.utcnow(),
            "is_active": True
        },
        {
            "id": "4",
            "name": "최영수",
            "age": 45,
            "gender": "male",
            "issue": "중년의 위기",
            "background": "중견기업 임원, 가족 부양 압박",
            "current_situation": "커리어 정체와 가족 책임감 사이에서 갈등",
            "personality": "책임감 강함, 권위적",
            "communication_style": "직설적, 때로는 방어적",
            "emotional_state": "좌절감, 불안",
            "primary_issue": "중년의 정체성 위기",
            "difficulty": 7,
            "character_type": "male-adult",
            "created_at": datetime.utcnow(),
            "is_active": True
        },
        {
            "id": "5",
            "name": "정하나",
            "age": 23,
            "gender": "female",
            "issue": "취업 스트레스",
            "background": "대학 졸업 예정자, 취업 준비 중",
            "current_situation": "졸업을 앞두고 취업 준비로 인한 극심한 스트레스",
            "personality": "열정적이지만 불안정",
            "communication_style": "감정적, 변화가 큼",
            "emotional_state": "불안, 압박감",
            "primary_issue": "미래에 대한 불확실성과 취업 스트레스",
            "difficulty": 4,
            "character_type": "female-adult",
            "created_at": datetime.utcnow(),
            "is_active": True
        },
        {
            "id": "6",
            "name": "김철수",
            "age": 30,
            "gender": "male",
            "issue": "대인 공포증",
            "background": "프리랜서 디자이너, 재택근무",
            "current_situation": "사회적 상황을 피하고 고립된 생활",
            "personality": "예민, 창의적",
            "communication_style": "소극적, 회피적",
            "emotional_state": "두려움, 고립감",
            "primary_issue": "사회적 상황에 대한 극심한 불안",
            "difficulty": 6,
            "character_type": "male-adult",
            "created_at": datetime.utcnow(),
            "is_active": True
        }
    ]
    
    # Clear existing characters
    result = await mongo_db.characters.delete_many({})
    logger.info(f"Cleared {result.deleted_count} existing characters")
    
    # Insert new characters
    for char_data in default_characters:
        await mongo_db.characters.insert_one(char_data)
        logger.info(f"Added character: {char_data['name']} (ID: {char_data['id']})")
    
    logger.info(f"✓ Successfully initialized {len(default_characters)} characters")
    
    # Verify insertion
    count = await mongo_db.characters.count_documents({})
    logger.info(f"Total characters in database: {count}")
    
    # Close connection
    mongo_client.close()

if __name__ == "__main__":
    asyncio.run(init_characters())