"""
Demo AI Service for YATAV Training System
Provides realistic client responses without requiring API keys
"""

import random
import asyncio
from typing import Dict, List, Any, AsyncGenerator
import logging

logger = logging.getLogger(__name__)

class DemoAIProvider:
    """Demo AI provider for client simulation"""
    
    def __init__(self):
        self.response_templates = {
            "anxiety": [
                "요즘 정말 불안해서 잠을 제대로 못 자고 있어요.",
                "회사 갈 생각만 하면 가슴이 답답하고 숨이 막혀요.",
                "아침에 일어나는 게 너무 두려워요. 하루가 시작되는 게 무서워요.",
                "손이 떨리고 식은땀이 나요. 심장이 너무 빨리 뛰어요.",
                "집중이 안 돼서 일을 제대로 못하고 있어요.",
                "사람들이 저를 이상하게 볼까봐 걱정돼요.",
                "실수할까봐 너무 무서워서 아무것도 못하겠어요."
            ],
            "depression": [
                "아무것도 하고 싶지 않아요. 그냥 누워만 있고 싶어요.",
                "예전에 좋아하던 것들이 이제는 아무 의미가 없어요.",
                "혼자 있으면 눈물이 나요. 이유도 모르겠어요.",
                "아무도 저를 이해하지 못할 것 같아요.",
                "미래가 보이지 않아요. 희망이 없는 것 같아요.",
                "제가 쓸모없는 사람 같아요.",
                "매일이 똑같고 지루해요. 살아있는 게 힘들어요."
            ],
            "relationship": [
                "사람들과 대화하는 게 너무 어려워요.",
                "친구들이 저를 싫어하는 것 같아요.",
                "혼자 있는 게 편하면서도 외로워요.",
                "거절당하는 게 무서워서 먼저 다가가지 못해요.",
                "사람들 앞에서 말하면 얼굴이 빨개지고 더듬어요.",
                "관계를 유지하는 게 너무 피곤해요.",
                "상처받는 게 무서워서 마음을 열지 못하겠어요."
            ],
            "stress": [
                "일이 너무 많아서 압도당하는 느낌이에요.",
                "책임감이 너무 무거워요. 견딜 수가 없어요.",
                "실패하면 어떻게 하나 하는 생각만 들어요.",
                "주변 사람들의 기대가 부담스러워요.",
                "시간이 부족해요. 할 일은 많은데 시간은 없고...",
                "완벽하게 해야 한다는 압박감이 너무 커요.",
                "스트레스 때문에 머리가 아프고 소화도 안 돼요."
            ],
            "general": [
                "네... 그렇게 느껴져요.",
                "맞아요. 정말 힘들어요.",
                "그때는 정말 막막했어요.",
                "어떻게 해야 할지 모르겠어요.",
                "도움이 필요한 것 같아요.",
                "혼자서는 해결이 안 될 것 같아요.",
                "선생님 말씀 들으니 조금 위로가 되네요."
            ]
        }
        
        self.emotional_expressions = [
            "(한숨을 쉬며)",
            "(눈물을 글썽이며)",
            "(잠시 침묵)",
            "(고개를 숙이며)",
            "(손을 비비며)",
            "(목소리가 떨리며)"
        ]
    
    async def generate_response(self, messages: List[Dict], **kwargs) -> str:
        """Generate a demo response based on context"""
        
        # Analyze the conversation context
        last_user_message = ""
        for msg in reversed(messages):
            if msg["role"] == "user":
                last_user_message = msg["content"].lower()
                break
        
        # Choose appropriate response category
        category = self._determine_category(last_user_message)
        
        # Select and customize response
        response = self._create_response(category, last_user_message)
        
        # Add realistic delay
        await asyncio.sleep(random.uniform(0.5, 1.5))
        
        logger.info(f"Demo AI generated response: {response[:50]}...")
        return response
    
    async def stream_response(self, messages: List[Dict], **kwargs) -> AsyncGenerator[str, None]:
        """Stream response tokens"""
        response = await self.generate_response(messages, **kwargs)
        
        # Simulate streaming by yielding words
        words = response.split()
        for i, word in enumerate(words):
            if i > 0:
                yield " "
            yield word
            await asyncio.sleep(random.uniform(0.01, 0.05))
    
    def _determine_category(self, message: str) -> str:
        """Determine response category based on user message"""
        
        if any(word in message for word in ["불안", "무서", "두려", "걱정", "초조"]):
            return "anxiety"
        elif any(word in message for word in ["우울", "슬프", "희망", "의미", "죽"]):
            return "depression"
        elif any(word in message for word in ["관계", "친구", "사람", "대인", "혼자"]):
            return "relationship"
        elif any(word in message for word in ["스트레스", "압박", "부담", "일", "회사"]):
            return "stress"
        else:
            return "general"
    
    def _create_response(self, category: str, user_message: str) -> str:
        """Create a contextual response"""
        
        # Get base response
        responses = self.response_templates.get(category, self.response_templates["general"])
        base_response = random.choice(responses)
        
        # Sometimes add emotional expression
        if random.random() < 0.3:
            emotion = random.choice(self.emotional_expressions)
            base_response = f"{emotion} {base_response}"
        
        # Add contextual elements based on user message
        if "어떻게" in user_message or "어떤" in user_message:
            # User is asking for details
            if random.random() < 0.5:
                base_response += " 구체적으로 설명하기는 어렵지만... 그냥 그런 느낌이에요."
        
        elif "왜" in user_message:
            # User is asking for reasons
            if random.random() < 0.5:
                base_response += " 저도 왜 그런지 잘 모르겠어요."
        
        elif "언제" in user_message:
            # User is asking about timing
            time_responses = [
                " 한 달 전부터 그랬던 것 같아요.",
                " 최근 들어 더 심해진 것 같아요.",
                " 정확히 언제부터인지는 기억이 안 나요."
            ]
            if random.random() < 0.5:
                base_response += random.choice(time_responses)
        
        return base_response