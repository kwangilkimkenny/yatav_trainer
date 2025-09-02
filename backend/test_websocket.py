#!/usr/bin/env python3
"""
Test WebSocket communication with AI service
"""

import asyncio
import json
import websockets
from datetime import datetime

async def test_websocket():
    """Test WebSocket endpoint and AI responses"""
    
    # Session ID for testing
    session_id = "test_session_123"
    websocket_url = f"ws://127.0.0.1:8008/ws/{session_id}"
    
    print(f"\n{'='*60}")
    print("WEBSOCKET AI RESPONSE TEST")
    print(f"{'='*60}\n")
    
    try:
        async with websockets.connect(websocket_url) as websocket:
            print(f"✅ Connected to WebSocket: {websocket_url}")
            
            # Test messages to send
            test_messages = [
                "안녕하세요, 오늘 기분은 어떠신가요?",
                "어떤 것이 가장 힘드신가요?",
                "그렇군요. 더 자세히 말씀해주시겠어요?",
                "언제부터 그런 증상이 있으셨나요?"
            ]
            
            for i, user_msg in enumerate(test_messages, 1):
                print(f"\n--- Test {i} ---")
                print(f"상담사 (User): {user_msg}")
                
                # Send message
                message = {
                    "type": "user_message",
                    "character_id": "5",  # 정하나 character
                    "content": user_msg,
                    "timestamp": datetime.utcnow().isoformat()
                }
                
                await websocket.send(json.dumps(message))
                
                # Receive response
                response = await websocket.recv()
                response_data = json.loads(response)
                
                ai_content = response_data.get("content", "")
                print(f"내담자 (AI): {ai_content}")
                
                # Check for questions in AI response
                question_indicators = ["?", "하시나요", "하신가요", "인가요", "어떻게", "무엇이", "무엇을", "언제", "어디", "왜"]
                has_question = any(indicator in ai_content for indicator in question_indicators)
                
                if has_question:
                    print("⚠️  WARNING: AI response contains question patterns!")
                    for indicator in question_indicators:
                        if indicator in ai_content:
                            print(f"   Found: '{indicator}' in response")
                else:
                    print("✅ Response OK (no questions)")
                
                # Small delay between messages
                await asyncio.sleep(1)
            
            print(f"\n{'='*60}")
            print("TEST COMPLETE")
            print(f"{'='*60}\n")
            
    except Exception as e:
        print(f"❌ Error: {e}")
        print("\nMake sure the backend server is running on 127.0.0.1:8008")

if __name__ == "__main__":
    asyncio.run(test_websocket())