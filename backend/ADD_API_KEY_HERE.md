# API 키 설정 방법

## 1. .env 파일 수정
`backend/.env` 파일을 열고 다음 라인을 찾으세요:

```
OPENAI_API_KEY=""
```

이 부분을 실제 OpenAI API 키로 변경하세요:

```
OPENAI_API_KEY="sk-proj-실제키를여기에입력"
```

## 2. 서버 재시작
API 키를 추가한 후 백엔드 서버를 재시작해야 합니다:

```bash
# 현재 서버 종료
Ctrl+C

# 서버 재시작
python main.py
```

## 3. 확인 방법
서버 로그에서 다음을 확인하세요:
- "OpenAI API Key: Set" 메시지가 표시되어야 함
- "AI Service initialized with API keys" 메시지가 표시되어야 함

## 테스트
```bash
python test_api_keys.py
```

이 명령으로 API 키가 제대로 로드되었는지 확인할 수 있습니다.