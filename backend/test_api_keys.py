#!/usr/bin/env python3
"""
Test script to verify API key loading and AI service initialization
"""

import os
import asyncio
from dotenv import load_dotenv
from services.ai_service import AIService
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def test_api_keys():
    """Test API key loading and AI service initialization"""
    
    # Load environment variables from .env file
    load_dotenv()
    
    # Check API keys
    openai_key = os.getenv("OPENAI_API_KEY")
    anthropic_key = os.getenv("ANTHROPIC_API_KEY")
    
    print("\n" + "="*50)
    print("API KEY STATUS CHECK")
    print("="*50)
    
    if openai_key and openai_key.strip():
        print(f"✅ OpenAI API Key: Set (starts with: {openai_key[:10]}...)")
    else:
        print("❌ OpenAI API Key: Not set or empty")
    
    if anthropic_key and anthropic_key.strip():
        print(f"✅ Anthropic API Key: Set (starts with: {anthropic_key[:10]}...)")
    else:
        print("❌ Anthropic API Key: Not set or empty")
    
    print("\n" + "="*50)
    print("AI SERVICE INITIALIZATION TEST")
    print("="*50)
    
    # Initialize AI service
    ai_service = AIService(
        openai_key=openai_key if openai_key and openai_key.strip() else None,
        anthropic_key=anthropic_key if anthropic_key and anthropic_key.strip() else None
    )
    
    print(f"Available providers: {list(ai_service.providers.keys())}")
    print(f"Default provider: {ai_service.default_provider}")
    
    # Test character response generation
    print("\n" + "="*50)
    print("TESTING AI RESPONSE GENERATION")
    print("="*50)
    
    test_character = {
        "name": "김미영",
        "age": 27,
        "issue": "불안장애",
        "difficulty": 3,
        "emotional_state": "불안, 초조"
    }
    
    test_message = "안녕하세요, 오늘 기분은 어떠신가요?"
    
    try:
        response = await ai_service.generate_character_response(
            character=test_character,
            conversation_history=[],
            user_message=test_message
        )
        
        print(f"Provider used: {ai_service.default_provider}")
        print(f"AI Response: {response}")
        
        # Check if response contains questions (should not)
        if "?" in response or any(q in response for q in ["하시나요", "하신가요", "인가요", "어떻게", "무엇이"]):
            print("\n⚠️  Warning: Response contains question patterns!")
        else:
            print("\n✅ Response properly formatted (no questions)")
            
    except Exception as e:
        print(f"❌ Error generating response: {e}")
    
    print("\n" + "="*50)
    print("TEST COMPLETE")
    print("="*50)
    
    print("\nInstructions:")
    print("1. If API keys are not set, add them to the .env file:")
    print('   OPENAI_API_KEY="your-openai-api-key-here"')
    print('   ANTHROPIC_API_KEY="your-anthropic-api-key-here"')
    print("2. After adding keys, restart the backend server")
    print("3. Run this test again to verify the keys are working")

if __name__ == "__main__":
    asyncio.run(test_api_keys())