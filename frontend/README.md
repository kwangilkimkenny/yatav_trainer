# YATAV AI Counseling Training Platform

## 개요
YATAV는 AI 기반 심리상담 훈련 플랫폼으로, 상담사들이 다양한 가상 내담자와 상호작용하며 상담 기술을 연습할 수 있는 환경을 제공합니다.

원본 디자인: https://www.figma.com/design/x0FgnBBpBsizLKXhjM1HxB/YATAV-AI-Counseling-Training-Platform

## 🎯 주요 기능

### 3가지 차별화된 훈련 프로그램

#### 🔰 기본 상담 훈련
- **대상**: 초급 상담사
- **캐릭터**: 8명 (난이도 1-5)
- **특징**: 일반적인 심리적 문제, 협조적 태도
- **학습 목표**: 기본 상담 기술 (경청, 공감, 개방형 질문)
- **응답 스타일**: 따뜻하고 개방적, 짧고 명확한 표현

#### 🚨 위기 개입 훈련  
- **대상**: 위기상담 전문가
- **캐릭터**: 64명 (난이도 7-10)
- **특징**: 트라우마, 분노조절, 중독 등 위기 상황
- **학습 목표**: 즉시 개입, 안전 평가, 위기 관리
- **응답 스타일**: 긴급하고 직접적, 높은 감정적 강도

#### 🎯 특정 기법 훈련
- **대상**: 중급-고급 상담사
- **캐릭터**: 98명 (난이도 4-9)
- **특징**: 전문 치료 기법 적용 가능한 사례
- **학습 목표**: CBT, EMDR, 가족치료 등 전문 기법
- **응답 스타일**: 성찰적이고 협력적, 구체적이고 상세한 표현

### 🤖 AI 기반 지능형 응답 시스템

- **다중 AI 프로바이더 지원**: OpenAI GPT-4, Anthropic Claude, Demo 모드
- **프로그램별 맞춤 응답**: 각 훈련 프로그램에 최적화된 AI 응답 스타일
- **실시간 대화**: WebSocket 기반 즉시 응답
- **감정 분석**: 내담자의 감정 상태 실시간 분석

### 📊 실시간 데이터 관리 시스템

#### 프로그램별 캐릭터 관리
- **동적 필터링**: 선택한 훈련 프로그램에 적합한 캐릭터만 표시
- **맞춤 정보**: 세션 유형, 긴급도, 권장 기법 등 프로그램별 특화 정보
- **통계 대시보드**: 문제 유형별 분포, 평균 난이도 등 실시간 분석

#### 관리자 대시보드
- **시스템 모니터링**: API 서버, 데이터베이스, AI 서비스 상태 실시간 확인
- **사용량 통계**: 총 사용자, 활성 세션, 완료된 훈련 등 실제 데이터 기반 통계
- **API 관리**: 실시간 API 설정 및 모니터링 도구

## 🛠 기술 스택

### Frontend
- **React 18** with TypeScript
- **Vite** - 빌드 도구 (현재 포트: 3000)
- **Tailwind CSS** - 스타일링
- **shadcn/ui** - UI 컴포넌트 라이브러리
- **Lucide React** - 아이콘 시스템

### Backend Integration
- **FastAPI** REST API (포트: 8008)
- **WebSocket** 실시간 채팅
- **MongoDB** 캐릭터 및 세션 데이터 저장
- **Redis** 캐싱 (선택적)

### AI Services
- **OpenAI GPT-4** - 주요 AI 프로바이더
- **Anthropic Claude** - 보조 AI 프로바이더
- **Demo Mode** - 개발/테스트용 모의 응답

## 🌐 API 엔드포인트

### 캐릭터 관리
```
GET /characters                           # 모든 캐릭터 조회
GET /characters/program/{type}            # 프로그램별 캐릭터 조회
GET /characters/program/{type}/stats      # 프로그램별 통계
GET /characters/{id}                      # 특정 캐릭터 상세 조회
```

### 관리자 API
```
GET /admin/stats                          # 전체 시스템 통계
GET /admin/system-health                  # 시스템 상태 확인
GET /admin/api-usage                      # API 사용량 통계
GET /admin/api-endpoints                  # 사용 가능한 엔드포인트 목록
POST /admin/api-config                    # API 설정 업데이트
```

### 세션 관리
```
POST /sessions                            # 새 세션 생성
GET /sessions/{id}                        # 세션 상세 조회
WebSocket /ws/session/{id}                # 실시간 채팅
```

## 🚀 실행 방법

### 1. 의존성 설치
```bash
npm install
```

### 2. 개발 서버 실행
```bash
npm run dev
```
- 프론트엔드: http://localhost:3000
- 백엔드: http://127.0.0.1:8008

### 3. 빌드
```bash
npm run build
```

### 4. 백엔드 서버 시작 (별도 터미널)
```bash
cd ../backend
source venv/bin/activate
python main.py
```

## 📁 프로젝트 구조

```
frontend/
├── src/
│   ├── components/          # 재사용 가능한 컴포넌트
│   │   ├── ui/             # shadcn/ui 컴포넌트
│   │   ├── figma/          # Figma 디자인 컴포넌트
│   │   └── NotionCharacter.tsx
│   ├── hooks/              # 커스텀 훅
│   │   └── useApi.ts       # API 호출 및 상태 관리 훅
│   ├── services/           # API 서비스
│   │   └── api.ts          # API 클라이언트 (Axios 기반)
│   ├── styles/             # 글로벌 스타일
│   ├── App.tsx             # 메인 애플리케이션 (1500+ 줄)
│   └── main.tsx            # 앱 진입점
├── public/                 # 정적 파일
└── package.json
```

## 🎨 UI/UX 특징

### 디자인 시스템
- **모노크롬 테마**: 깔끔하고 전문적인 인터페이스
- **반응형 디자인**: 모바일, 태블릿, 데스크톱 지원
- **접근성**: WCAG 가이드라인 준수
- **다크/라이트 모드**: 사용자 선호도에 따른 테마 전환

### 사용자 경험
- **직관적 네비게이션**: 탭 기반 프로그램 선택
- **실시간 피드백**: WebSocket 기반 즉시 응답
- **스마트 필터링**: 검색, 난이도별, 프로그램별 캐릭터 필터
- **상세 정보**: 각 캐릭터의 배경, 성격, 프로그램별 특성 표시
- **로딩 상태**: 모든 비동기 작업에 대한 시각적 피드백

## 🔧 관리자 기능

### API 관리 (신규 추가)
- **API 설정**: Base URL, OpenAI/Anthropic API 키 실시간 설정
- **연결 테스트**: API 서버 연결 상태 즉시 확인
- **사용량 모니터링**: AI 서비스, 데이터베이스 상태 실시간 추적
- **엔드포인트 탐색**: 전체 21개 API 엔드포인트 카테고리별 표시

### 시스템 모니터링
- **실시간 통계**: 실제 데이터베이스 기반 사용자/세션/캐릭터 통계
- **상태 대시보드**: API 서버, MongoDB, AI 서비스 상태 모니터링
- **오류 추적**: 시스템 오류 및 성능 지표 실시간 확인

## 💡 개발 가이드

### 새로운 훈련 프로그램 추가
1. `TrainingPrograms` 인터페이스에 새 프로그램 타입 추가
2. `useCharactersByProgram` 훅에서 새 프로그램 지원
3. AI 서비스의 `_get_program_specific_instructions`에 새 프로그램 로직 추가
4. 프론트엔드 UI에 새 프로그램 탭 추가

### 캐릭터 데이터 확장
1. `VirtualCharacter` 인터페이스 수정
2. MongoDB 스키마 업데이트
3. 백엔드 Pydantic 모델 동기화
4. 프론트엔드 타입 정의 업데이트

### API 엔드포인트 추가
1. 백엔드 FastAPI에 새 엔드포인트 구현
2. 프론트엔드 `api.ts`에 새 메서드 추가
3. `useApi.ts`에 새 훅 구현
4. 컴포넌트에서 새 훅 사용

## 📈 성능 최적화

- **코드 분할**: 라우트 기반 청크 분할
- **이미지 최적화**: WebP 포맷 및 지연 로딩
- **API 캐싱**: 커스텀 훅을 통한 데이터 캐싱
- **번들 최적화**: Vite의 트리 쉐이킹 활용
- **메모이제이션**: React.memo, useMemo, useCallback 적극 활용

## 🔒 보안

- **API 키 보안**: 환경 변수 및 마스킹 처리
- **CORS 설정**: 안전한 크로스 오리진 요청
- **입력 검증**: 클라이언트 및 서버 측 데이터 검증
- **XSS 방지**: React의 기본 XSS 보호 활용
- **JWT 인증**: 토큰 기반 사용자 인증 (구현 예정)

## 🐛 문제 해결

### 자주 발생하는 문제
1. **API 500 오류**: MongoDB boolean 검사 문제 → `is not None` 사용
2. **Import 오류**: named export vs default export 혼동
3. **CORS 오류**: 백엔드 CORS 설정 확인
4. **WebSocket 연결 실패**: 백엔드 서버 실행 상태 확인

### 디버깅 팁
- 브라우저 개발자 도구 Console 탭 확인
- 네트워크 탭에서 API 요청/응답 상태 확인
- 백엔드 로그 파일 (`yatav_backend.log`) 확인

## 📱 브라우저 지원

- **Chrome 90+** (권장)
- **Firefox 88+**
- **Safari 14+**
- **Edge 90+**

## 🔄 업데이트 내역

### v2.1.0 (2025-09-03)
- ✅ 관리자 API 관리 기능 추가
- ✅ 실시간 시스템 모니터링 구현
- ✅ 프로그램별 캐릭터 차별화 완성
- ✅ 실제 데이터 기반 통계 대시보드
- ✅ MongoDB boolean 검사 오류 수정
- ✅ Import/Export 문제 해결

### v2.0.0 (2025-09-02)
- ✅ 5가지 차별화 전략 완전 구현
- ✅ 100개 다양한 캐릭터 데이터 추가
- ✅ AI 응답 스타일 프로그램별 차별화
- ✅ 프론트엔드-백엔드 완전 연동

## 🤝 기여 가이드

1. 이슈 확인 및 생성
2. 피처 브랜치 생성 (`feature/new-feature`)
3. 코드 작성 및 테스트
4. Pull Request 생성
5. 코드 리뷰 및 머지

## 📞 지원

- 기술 문의: 개발팀 문의
- 버그 리포트: GitHub Issues
- 기능 요청: GitHub Discussions

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다.

---

**현재 실행 환경:**
- 프론트엔드: `http://localhost:3000/` 
- 백엔드: `http://127.0.0.1:8008/`
- 관리자 페이지: 상단 네비게이션 → "관리자" → "API 관리" 탭