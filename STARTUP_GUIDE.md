# YATAV 시스템 시작 가이드

## 🚀 빠른 시작

### 현재 서버 상태 확인
- **백엔드**: http://127.0.0.1:8008 
- **프론트엔드**: http://localhost:3000 

### 새 터미널에서 백엔드 시작하기

1. **프로젝트 디렉토리로 이동**
   ```bash
   cd /Users/kone/Documents/workdesk/project_03/yatav_v2/yatav_trainer/backend
   ```

2. **Python 가상환경 활성화**


3. **누락된 패키지 설치 (필요시)**
   ```bash
   pip install pydantic-settings email-validator bcrypt
   ```

4. **백엔드 서버 실행**
   ```bash
   python main.py
   ```

### 전체 시스템 시작 (권장 방법)

프로젝트 루트에서 한 번에 모든 서비스 시작:

```bash
cd /Users/kone/Documents/workdesk/project_03/yatav_v2/yatav_trainer
npm start
```

## 🔧 문제 해결

### 1. `ModuleNotFoundError: No module named 'pydantic_settings'`
```bash
cd backend
source venv/bin/activate
pip install pydantic-settings
```

### 2. `ModuleNotFoundError: No module named 'email_validator'`
```bash
pip install email-validator
```

### 3. `ModuleNotFoundError: No module named 'bcrypt'`
```bash
pip install bcrypt
```

### 4. 전체 의존성 다시 설치
```bash
cd backend
source venv/bin/activate
pip install -r requirements.txt
```

## 📊 현재 시스템 상태

✅ **백엔드 서버 실행 중**
- FastAPI 서버: http://127.0.0.1:8008
- MongoDB 연결: 정상
- Redis 연결: 비활성화 (선택적)
- API 엔드포인트: 정상 작동
- WebSocket: 정상 작동

✅ **프론트엔드 실행 중**
- React 앱: http://localhost:3000
- API 연결: 정상
- 실시간 헬스체크: 동작 중

## 🎯 기능 테스트

1. **헬스체크**: http://127.0.0.1:8008/health
2. **캐릭터 목록**: http://127.0.0.1:8008/characters
3. **API 문서**: http://127.0.0.1:8008/docs (DEBUG 모드)
4. **프론트엔드**: http://localhost:3000

## 💡 유용한 명령어

```bash
# 백엔드 로그 실시간 확인
tail -f backend/yatav_backend.log

# 프로세스 확인
ps aux | grep python
ps aux | grep node

# 포트 사용 확인
lsof -i :8008  # 백엔드
lsof -i :3000  # 프론트엔드
```

## 🔑 API 키 설정 (AI 기능 활성화)

`backend/.env` 파일에 API 키 추가:

```env
OPENAI_API_KEY="your-openai-api-key"
ANTHROPIC_API_KEY="your-anthropic-api-key" 
ELEVENLABS_API_KEY="your-elevenlabs-api-key"
AZURE_SPEECH_KEY="your-azure-speech-key"
AZURE_SPEECH_REGION="your-region"
```

---

**현재 시스템은 정상 작동 중입니다!** 🎉



 1. STARTUP_GUIDE.md 업데이트
    - 백엔드 실행 명령어 추가
    - 서버 재시작 명령어 추가
    - 한 줄 실행 명령어 제공
  2. restart_backend.sh 스크립트 생성
    - 실행 중인 서버 자동 감지 및 종료
    - Python 가상환경 자동 활성화 (venv 또는 conda)
    - 새 서버 시작
    - 사용자 친화적인 메시지 출력

  사용법:

  # 서버 재시작 (가장 간단)
  ./restart_backend.sh

  # 또는 수동으로 (프로젝트 루트에서 실행)
  kill -9 $(lsof -t -i:8008) 2>/dev/null; cd /Users/kone/Documents/workdesk/project_03/yatav_v2/yatav_trainer/backend && source venv/bin/activate && python main.py
  
  # backend 디렉토리에서 실행하는 경우
  kill -9 $(lsof -t -i:8008) 2>/dev/null; source venv/bin/activate && python main.py

  서버가 성공적으로 실행 중입니다:
  - 주소: http://127.0.0.1:8008
  - API 문서: http://127.0.0.1:8008/docs