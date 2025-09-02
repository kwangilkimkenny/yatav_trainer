#!/usr/bin/env python3
"""
Test real conversation flow with specific character
"""

import asyncio
import json
import websockets
from datetime import datetime
import uuid

async def test_real_conversation():
    """Test real conversation with character ID 4 (최영수)"""
    
    # Create a new session ID
    session_id = str(uuid.uuid4())
    websocket_url = f"ws://127.0.0.1:8008/ws/{session_id}"
    
    print(f"\n{'='*60}")
    print("REAL CONVERSATION TEST - Character: 최영수 (45세)")
    print(f"Session ID: {session_id}")
    print(f"{'='*60}\n")
    
    try:
        async with websockets.connect(websocket_url) as websocket:
            print(f"✅ Connected to WebSocket\n")
            
            # Simulate the exact conversation from the frontend
            conversation = [
                {
                    "user": "안녕하세요... 상담사님. 제가 여기 온 것도 사실 쉽지 않았어요.",
                    "character_id": "4"
                },
                {
                    "user": "그렇군요.",
                    "character_id": "4"  
                },
                {
                    "user": "네, 그런 상황이시군요. 그때 어떤 기분이 드셨나요?",
                    "character_id": "4"
                }
            ]
            
            for i, turn in enumerate(conversation, 1):
                print(f"--- Turn {i} ---")
                print(f"상담사: {turn['user']}")
                
                # Send message
                message = {
                    "type": "user_message",
                    "character_id": turn["character_id"],
                    "content": turn["user"],
                    "timestamp": datetime.utcnow().isoformat()
                }
                
                await websocket.send(json.dumps(message))
                
                # Receive response
                response = await websocket.recv()
                response_data = json.loads(response)
                
                ai_content = response_data.get("content", "")
                print(f"내담자 (AI): {ai_content}")
                
                # Check for questions
                if any(indicator in ai_content for indicator in ["?", "하시나요", "하신가요", "드셨나요", "무엇인가요"]):
                    print("⚠️  WARNING: AI is asking questions!")
                else:
                    print("✅ Response OK (no questions)")
                
                print()
                await asyncio.sleep(2)
            
            print(f"{'='*60}")
            print("TEST COMPLETE")
            print(f"{'='*60}\n")
            
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    asyncio.run(test_real_conversation())