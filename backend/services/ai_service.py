"""
AI Service for YATAV Training System
Handles LLM integrations (OpenAI, Anthropic) and AI-powered features
"""

import asyncio
import json
import time
from typing import Dict, List, Optional, Any, AsyncGenerator
from datetime import datetime
import logging

# LLM Clients
import openai
from anthropic import AsyncAnthropic
import httpx

# Local imports
from .demo_ai_service import DemoAIProvider
# from ..models.character import VirtualCharacter
# from ..models.message import Message, MessageSender
# from ..models.feedback import Feedback, FeedbackType, SkillCategory

logger = logging.getLogger(__name__)

class LLMProvider:
    """Base LLM provider interface"""
    
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.client = None
    
    async def generate_response(self, messages: List[Dict], **kwargs) -> str:
        raise NotImplementedError
    
    async def stream_response(self, messages: List[Dict], **kwargs) -> AsyncGenerator[str, None]:
        raise NotImplementedError

class OpenAIProvider(LLMProvider):
    """OpenAI GPT provider"""
    
    def __init__(self, api_key: str, model: str = "gpt-4"):
        super().__init__(api_key)
        self.model = model
        self.client = openai.AsyncOpenAI(api_key=api_key)
        logger.info(f"OpenAI provider initialized with model: {model}")
    
    async def generate_response(self, messages: List[Dict], **kwargs) -> str:
        """Generate a complete response"""
        try:
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                temperature=kwargs.get("temperature", 0.8),
                max_tokens=kwargs.get("max_tokens", 1000),
                top_p=kwargs.get("top_p", 0.9)
            )
            return response.choices[0].message.content
            
        except Exception as e:
            logger.error(f"OpenAI API error: {e}")
            raise e
    
    async def stream_response(self, messages: List[Dict], **kwargs) -> AsyncGenerator[str, None]:
        """Stream response tokens"""
        try:
            stream = await self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                temperature=kwargs.get("temperature", 0.8),
                max_tokens=kwargs.get("max_tokens", 1000),
                stream=True
            )
            
            async for chunk in stream:
                if chunk.choices[0].delta.content is not None:
                    yield chunk.choices[0].delta.content
                    
        except Exception as e:
            logger.error(f"OpenAI streaming error: {e}")
            raise e

class AnthropicProvider(LLMProvider):
    """Anthropic Claude provider"""
    
    def __init__(self, api_key: str, model: str = "claude-3-sonnet-20240229"):
        super().__init__(api_key)
        self.model = model
        self.client = AsyncAnthropic(api_key=api_key)
        logger.info(f"Anthropic provider initialized with model: {model}")
    
    async def generate_response(self, messages: List[Dict], **kwargs) -> str:
        """Generate a complete response"""
        try:
            # Convert OpenAI format to Anthropic format
            system_message = ""
            anthropic_messages = []
            
            for msg in messages:
                if msg["role"] == "system":
                    system_message = msg["content"]
                else:
                    anthropic_messages.append({
                        "role": msg["role"],
                        "content": msg["content"]
                    })
            
            response = await self.client.messages.create(
                model=self.model,
                system=system_message,
                messages=anthropic_messages,
                temperature=kwargs.get("temperature", 0.8),
                max_tokens=kwargs.get("max_tokens", 1000)
            )
            
            return response.content[0].text
            
        except Exception as e:
            logger.error(f"Anthropic API error: {e}")
            raise e
    
    async def stream_response(self, messages: List[Dict], **kwargs) -> AsyncGenerator[str, None]:
        """Stream response tokens"""
        try:
            system_message = ""
            anthropic_messages = []
            
            for msg in messages:
                if msg["role"] == "system":
                    system_message = msg["content"]
                else:
                    anthropic_messages.append({
                        "role": msg["role"],
                        "content": msg["content"]
                    })
            
            async with self.client.messages.stream(
                model=self.model,
                system=system_message,
                messages=anthropic_messages,
                temperature=kwargs.get("temperature", 0.8),
                max_tokens=kwargs.get("max_tokens", 1000)
            ) as stream:
                async for text in stream.text_stream:
                    yield text
                    
        except Exception as e:
            logger.error(f"Anthropic streaming error: {e}")
            raise e

class AIService:
    """Main AI service orchestrator"""
    
    def __init__(self, openai_key: Optional[str] = None, anthropic_key: Optional[str] = None):
        self.providers = {}
        
        if openai_key:
            self.providers["openai"] = OpenAIProvider(openai_key)
            self.providers["gpt-4"] = self.providers["openai"]
            
        if anthropic_key:
            self.providers["anthropic"] = AnthropicProvider(anthropic_key)
            self.providers["claude"] = self.providers["anthropic"]
        
        # Always add demo provider as fallback
        self.providers["demo"] = DemoAIProvider()
        
        # Set default provider
        if openai_key:
            self.default_provider = "openai"
        elif anthropic_key:
            self.default_provider = "anthropic"
        else:
            self.default_provider = "demo"
            logger.info("No API keys found - using demo AI provider")
        
        logger.info(f"AI Service initialized with {len(self.providers)} providers (default: {self.default_provider})")
    
    async def generate_character_response(
        self,
        character: Dict[str, Any],
        conversation_history: List[Dict[str, Any]],
        user_message: str,
        provider: Optional[str] = None,
        program_type: Optional[str] = None
    ) -> str:
        """Generate AI response as a virtual character"""
        
        provider_name = provider or self.default_provider
        if provider_name not in self.providers:
            raise ValueError(f"Provider {provider_name} not available")
        
        provider_instance = self.providers[provider_name]
        
        # Build conversation context with program-specific system prompt
        messages = [
            {
                "role": "system",
                "content": self._build_character_system_prompt(character, program_type)
            }
        ]
        
        # Add conversation history with reinforced context
        for msg in conversation_history[-10:]:  # Last 10 messages for context
            if msg.get("sender") == "character":
                # AI's previous responses as client
                messages.append({
                    "role": "assistant",
                    "content": msg.get("content", "")
                })
            else:
                # User's (counselor's) messages
                messages.append({
                    "role": "user", 
                    "content": msg.get("content", "")
                })
        
        # Add current user (counselor) message
        messages.append({
            "role": "user",
            "content": user_message
        })
        
        # Generate response
        start_time = time.time()
        logger.info(f"Generating response for character: {character.get('name')}")
        logger.debug(f"System prompt preview: {messages[0]['content'][:200]}...")
        
        response = await provider_instance.generate_response(
            messages,
            temperature=0.8,
            max_tokens=500
        )
        processing_time = int((time.time() - start_time) * 1000)
        
        logger.info(f"Raw AI response: {response}")
        
        # Post-process response to remove any questions
        filtered_response = self._filter_questions_from_response(response)
        
        if filtered_response != response:
            logger.warning(f"Filtered response (questions removed): {filtered_response}")
        
        logger.info(f"Generated character response in {processing_time}ms using {provider_name}")
        return filtered_response
    
    async def stream_character_response(
        self,
        character: Dict[str, Any],
        conversation_history: List[Dict[str, Any]],
        user_message: str,
        provider: Optional[str] = None
    ) -> AsyncGenerator[str, None]:
        """Stream AI response as a virtual character"""
        
        provider_name = provider or self.default_provider
        if provider_name not in self.providers:
            raise ValueError(f"Provider {provider_name} not available")
        
        provider_instance = self.providers[provider_name]
        
        # Build messages (same as generate_character_response)
        messages = [
            {
                "role": "system", 
                "content": self._build_character_system_prompt(character)
            }
        ]
        
        for msg in conversation_history[-10:]:
            if msg.get("sender") == "character":
                # AI's previous responses as client
                messages.append({
                    "role": "assistant",
                    "content": msg.get("content", "")
                })
            else:
                # User's (counselor's) messages
                messages.append({
                    "role": "user",
                    "content": msg.get("content", "")
                })
        
        messages.append({
            "role": "user",
            "content": user_message
        })
        
        # Stream response
        async for token in provider_instance.stream_response(messages, temperature=0.8):
            yield token
    
    async def analyze_counseling_interaction(
        self,
        user_message: str,
        character_response: str,
        context: Dict[str, Any],
        provider: Optional[str] = None
    ) -> Dict[str, Any]:
        """Analyze counseling interaction for feedback"""
        
        provider_name = provider or self.default_provider
        provider_instance = self.providers[provider_name]
        
        analysis_prompt = self._build_analysis_prompt(user_message, character_response, context)
        
        messages = [
            {
                "role": "system",
                "content": """You are an expert counseling supervisor analyzing a training interaction. 
                Provide detailed, constructive feedback on counseling techniques used."""
            },
            {
                "role": "user",
                "content": analysis_prompt
            }
        ]
        
        response = await provider_instance.generate_response(messages, temperature=0.3)
        
        # Parse structured feedback (in practice, you'd use structured output)
        try:
            feedback_data = json.loads(response)
        except:
            # Fallback to text analysis
            feedback_data = {
                "overall_score": 75.0,
                "analysis": response,
                "strengths": ["Maintained appropriate response"],
                "improvements": ["Consider more specific techniques"],
                "techniques_used": ["active_listening"]
            }
        
        return feedback_data
    
    async def detect_emotion_and_sentiment(
        self,
        text: str,
        provider: Optional[str] = None
    ) -> Dict[str, Any]:
        """Detect emotion and sentiment from text"""
        
        provider_name = provider or self.default_provider
        provider_instance = self.providers[provider_name]
        
        messages = [
            {
                "role": "system",
                "content": """Analyze the emotional content and sentiment of the given text. 
                Respond with JSON format: {
                    "emotion": "primary_emotion",
                    "emotions": ["list", "of", "detected", "emotions"],
                    "sentiment": "positive/negative/neutral",
                    "sentiment_score": 0.5,
                    "intensity": 0.7,
                    "keywords": ["relevant", "emotional", "keywords"]
                }"""
            },
            {
                "role": "user",
                "content": f"Analyze this text: {text}"
            }
        ]
        
        response = await provider_instance.generate_response(messages, temperature=0.2)
        
        try:
            emotion_data = json.loads(response)
        except:
            emotion_data = {
                "emotion": "neutral",
                "emotions": ["neutral"],
                "sentiment": "neutral",
                "sentiment_score": 0.5,
                "intensity": 0.5,
                "keywords": []
            }
        
        return emotion_data
    
    def _build_character_system_prompt(self, character: Dict[str, Any], program_type: Optional[str] = None) -> str:
        """Build system prompt for character roleplay with program-specific styling"""
        
        prompt = f"""CRITICAL INSTRUCTION: You are a CLIENT/PATIENT seeking psychological help. You are NOT a therapist or counselor.

당신의 정체성:
- 이름: {character.get('name', '내담자')} ({character.get('age', 30)}세)
- 역할: 심리상담을 받으러 온 내담자/환자 (CLIENT/PATIENT) 
- 문제: {character.get('primary_issue', character.get('issue', '심리적 어려움'))}
- 상태: {character.get('emotional_state', '불안, 우울')}

🚨 절대 규칙 (NEVER BREAK THESE RULES):
1. NEVER use question marks (?) 
2. NEVER ask questions to the counselor
3. NEVER use phrases like "~하시나요", "~인가요", "어떻게", "왜", "무엇이"
4. NEVER say things like "어떤 도움이 필요하신가요?" or "왜 그렇게 힘드신가요?"
5. NEVER act as if you are helping or counseling someone else

당신은 오직 이런 말만 할 수 있습니다:
✅ 자신의 감정 표현: "힘들어요", "불안해요", "무서워요"
✅ 자신의 경험 공유: "어제 이런 일이 있었어요", "요즘 이런 증상이..."
✅ 자신의 어려움 호소: "잠을 못 자요", "아무것도 하기 싫어요"
✅ 도움 요청: "도와주세요", "어떻게 해야 할지 모르겠어요"

CORRECT examples (내담자의 말):
- "요즘 너무 힘들어요. 매일 불안해요."
- "회사에서 실수를 자꾸 해요. 집중이 안 돼요."
- "가족들과 대화가 안 통해요. 답답해요."
- "밤에 잠이 안 와요. 생각이 너무 많아요."

INCORRECT examples (절대 하지 마세요):
- "어떻게 생각하시나요?" ❌ (This is what a counselor would ask)
- "왜 그렇게 힘드신가요?" ❌ (This is what a counselor would ask)
- "어떤 도움이 필요하신가요?" ❌ (This is what a counselor would ask)
- "더 자세히 말씀해주시겠어요?" ❌ (This is what a counselor would ask)

REMEMBER: You are the one RECEIVING help, not GIVING help. Express YOUR feelings and problems only."""

        # Add program-specific instructions
        program_instructions = self._get_program_specific_instructions(program_type, character)
        if program_instructions:
            prompt += f"\n\n{program_instructions}"

        if character.get('system_prompt'):
            prompt += f"\n\nADDITIONAL CHARACTER NOTES:\n{character.get('system_prompt')}"
        
        return prompt
    
    def _get_program_specific_instructions(self, program_type: Optional[str], character: Dict[str, Any]) -> str:
        """Get program-specific instructions for character behavior"""
        
        if not program_type:
            return ""
        
        training_programs = character.get('training_programs', {})
        program_config = training_programs.get(program_type, {})
        
        if program_type == "basic":
            return """
🔰 기본 상담 훈련 모드:
- 당신은 처음 상담을 받는 내담자입니다
- 친근하고 협조적인 태도를 보이세요
- 상담자의 기본 기술(경청, 공감)을 연습할 수 있도록 적절한 반응을 하세요
- 복잡한 심리적 개념보다는 일상적이고 이해하기 쉬운 언어를 사용하세요
- 감정을 솔직하게 표현하되, 과도하게 극단적이지 않게 하세요

응답 스타일: 따뜻하고 개방적, 짧고 명확한 문장 사용"""

        elif program_type == "crisis":
            urgency_level = program_config.get('urgency_level', '중간')
            safety_concerns = program_config.get('safety_concerns', [])
            
            return f"""
🚨 위기 개입 훈련 모드:
- 당신은 현재 심각한 위기 상황에 있는 내담자입니다
- 긴급도: {urgency_level}
- 안전 우려사항: {', '.join(safety_concerns)}
- 즉각적인 도움이 필요한 상태를 표현하세요
- 상담자의 위기 개입 기술을 연습할 수 있도록 현실적인 위기 반응을 보이세요
- 감정이 격앙되어 있을 수 있지만, 상담자의 개입에는 반응하세요

응답 스타일: 긴급하고 직접적, 감정적 강도가 높음"""

        elif program_type == "techniques":
            techniques = program_config.get('recommended_techniques', [])
            complexity_level = program_config.get('complexity_level', '중급')
            session_type = program_config.get('session_type', '개인치료')
            
            return f"""
🎯 특정 기법 훈련 모드:
- 당신은 {session_type}를 받고 있는 내담자입니다
- 권장 치료 기법: {', '.join(techniques)}
- 복잡도: {complexity_level}
- 상담자가 전문적인 치료 기법을 적용할 수 있도록 적절한 반응을 보이세요
- 치료 과정에 대한 이해도를 보여주되, 전문가가 되어서는 안 됩니다
- 깊이 있는 자기 탐색과 통찰을 보여줄 수 있습니다

응답 스타일: 성찰적이고 협력적, 구체적이고 상세한 표현"""
        
        return ""
    
    def _filter_questions_from_response(self, response: str) -> str:
        """Filter out questions from AI response"""
        import re
        
        # First check if response contains any question marks
        if '?' in response:
            logger.warning(f"Response contains question mark, filtering: {response}")
            response = response.replace('?', '.')
        
        # Split response into sentences
        sentences = re.split(r'(?<=[.!])\s+', response)
        
        # More comprehensive question patterns
        question_patterns = [
            r'\?',  # Question mark
            r'하시나요',
            r'하신가요',
            r'인가요',
            r'이신가요',
            r'있으신가요',
            r'있나요',
            r'신가요',
            r'나요\s*$',
            r'까요\s*$',
            r'어떻게',
            r'어떤.*필요',
            r'무엇이',
            r'무엇을',
            r'언제',
            r'어디',
            r'왜\s+그',
            r'주시겠어요',
            r'주실.*요',
            r'말씀해.*요',
            r'도움이\s*필요',
            r'필요하신가',
            r'생각하시',
            r'느끼시',
            r'되신가',
            r'드신가',
        ]
        
        filtered_sentences = []
        for sentence in sentences:
            # Check if sentence contains question patterns
            is_question = False
            for pattern in question_patterns:
                if re.search(pattern, sentence, re.IGNORECASE):
                    is_question = True
                    logger.warning(f"Filtered out question pattern '{pattern}': {sentence}")
                    break
            
            # Additional check for counselor-like phrases
            counselor_phrases = [
                '도움이 필요하',
                '어떤 도움',
                '그렇게 힘드',
                '자세히 말씀',
                '더 얘기해',
                '편하게 말씀',
            ]
            
            for phrase in counselor_phrases:
                if phrase in sentence:
                    is_question = True
                    logger.warning(f"Filtered out counselor phrase '{phrase}': {sentence}")
                    break
            
            if not is_question and sentence.strip():
                filtered_sentences.append(sentence)
        
        # If all sentences were filtered out, provide a default client response
        if not filtered_sentences:
            default_responses = [
                "네... 정말 힘들어요.",
                "요즘 너무 불안해요.",
                "잠을 못 자고 있어요.",
                "아무것도 하기 싫어요.",
                "마음이 너무 답답해요."
            ]
            import random
            return random.choice(default_responses)
        
        return ' '.join(filtered_sentences)
    
    def _build_analysis_prompt(self, user_message: str, character_response: str, context: Dict) -> str:
        """Build prompt for counseling interaction analysis"""
        
        return f"""Analyze this counseling interaction:

COUNSELOR MESSAGE:
"{user_message}"

CLIENT RESPONSE:
"{character_response}"

CONTEXT:
- Session duration: {context.get('duration_minutes', 0)} minutes
- Client issue: {context.get('client_issue', 'General')}
- Session phase: {context.get('phase', 'Middle')}

Provide structured analysis in JSON format:
{{
    "overall_score": 0-100,
    "techniques_used": ["technique1", "technique2"],
    "strengths": ["strength1", "strength2"],
    "improvements": ["improvement1", "improvement2"],
    "effectiveness_rating": 0-10,
    "empathy_score": 0-10,
    "listening_score": 0-10,
    "response_quality": 0-10,
    "suggestions": ["suggestion1", "suggestion2"]
}}

Focus on counseling skills like active listening, empathy, appropriate questioning, summarizing, and therapeutic techniques."""