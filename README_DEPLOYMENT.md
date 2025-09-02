# YATAV Training System - Deployment Guide

## 🚀 완벽한 설치형 Electron 앱 배포 가이드

### 📋 시스템 요구사항

#### 최소 요구사항
- **OS**: Windows 10+, macOS 10.14+, Ubuntu 20.04+
- **RAM**: 4GB
- **Storage**: 2GB
- **CPU**: Dual-core 2.0GHz+
- **Network**: 인터넷 연결 (초기 설정 및 API 사용 시)

#### 권장 요구사항
- **RAM**: 8GB+
- **Storage**: 5GB+ (녹음 파일 저장 공간 포함)
- **CPU**: Quad-core 2.5GHz+
- **GPU**: 비디오 처리를 위한 전용 그래픽 카드

### 🛠️ 개발 환경 설정

#### 1. 필수 도구 설치

```bash
# Node.js 18+ 설치
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Python 3.9+ 설치
sudo apt-get install python3.9 python3-pip python3-venv

# 빌드 도구
sudo apt-get install build-essential
```

#### 2. 프로젝트 클론 및 의존성 설치

```bash
# 프로젝트 클론
git clone https://github.com/yatav/training-system.git
cd yatav-training-system

# Root 패키지 설치
npm install

# Frontend 패키지 설치
cd frontend
npm install
cd ..

# Backend 가상환경 및 패키지 설치
cd backend
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cd ..
```

### 🏗️ 빌드 프로세스

#### 1. 개발 모드 실행

```bash
# 모든 서비스 동시 실행
npm start

# 개별 실행
npm run backend:dev   # 백엔드만
npm run frontend:dev  # 프론트엔드만
npm run electron:dev  # Electron만
```

#### 2. 프로덕션 빌드

```bash
# 전체 빌드
npm run build

# 플랫폼별 패키징
npm run dist:win    # Windows
npm run dist:mac    # macOS
npm run dist:linux  # Linux

# 모든 플랫폼
npm run dist
```

### 📦 패키징 및 배포

#### Windows 배포

1. **코드 서명 (선택사항)**
```bash
# 환경변수 설정
export WINDOWS_CERT_FILE=path/to/certificate.pfx
export WINDOWS_CERT_PASSWORD=your_password

# 서명된 빌드
npm run dist:win
```

2. **설치 파일 생성**
- `dist/YATAV-Training-Setup.exe` - 설치 프로그램
- `dist/YATAV-Training-Portable.exe` - 포터블 버전

#### macOS 배포

1. **코드 서명 및 공증**
```bash
# 환경변수 설정
export APPLE_ID=your@email.com
export APPLE_ID_PASSWORD=app-specific-password
export APPLE_TEAM_ID=TEAM123456

# 서명 및 공증된 빌드
npm run dist:mac
```

2. **배포 파일**
- `dist/YATAV-Training-System.dmg` - DMG 설치 파일
- `dist/YATAV-Training-System.zip` - ZIP 아카이브

#### Linux 배포

```bash
npm run dist:linux
```

배포 파일:
- `dist/yatav-training.AppImage` - AppImage (모든 배포판)
- `dist/yatav-training.deb` - Debian/Ubuntu
- `dist/yatav-training.rpm` - Fedora/RHEL

### 🔧 설정 및 커스터마이징

#### 환경 설정 파일

1. **`.env.production`** - 프로덕션 환경변수
```env
NODE_ENV=production
API_URL=https://api.yatav.com
MONGODB_URL=mongodb://localhost:27017
SECRET_KEY=your-secret-key
```

2. **`electron/config.json`** - Electron 설정
```json
{
  "appId": "com.yatav.training",
  "productName": "YATAV Training System",
  "copyright": "Copyright © 2024 YATAV",
  "buildVersion": "2.0.0"
}
```

### 🚀 자동 업데이트

#### 1. GitHub Releases 설정

```javascript
// package.json
{
  "build": {
    "publish": {
      "provider": "github",
      "owner": "yatav",
      "repo": "training-system"
    }
  }
}
```

#### 2. 릴리스 배포

```bash
# GitHub에 자동 배포
npm run release

# 수동 업로드
gh release create v2.0.0 dist/*.exe dist/*.dmg dist/*.AppImage
```

### 📊 성능 최적화

#### 1. 빌드 최적화

```javascript
// webpack.config.js
module.exports = {
  optimization: {
    minimize: true,
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          priority: 10
        }
      }
    }
  }
};
```

#### 2. 애플리케이션 최적화

- **지연 로딩**: 필요한 모듈만 로드
- **코드 스플리팅**: 청크 단위 로드
- **캐싱**: 로컬 스토리지 및 IndexedDB 활용
- **압축**: Brotli/Gzip 압축 적용

### 🔒 보안 설정

#### 1. CSP (Content Security Policy)

```javascript
// electron/main.js
session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
  callback({
    responseHeaders: {
      ...details.responseHeaders,
      'Content-Security-Policy': [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline'",
        "style-src 'self' 'unsafe-inline'"
      ].join('; ')
    }
  });
});
```

#### 2. 권한 관리

```javascript
// 권한 요청 핸들러
session.defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
  const allowedPermissions = ['media', 'microphone', 'camera'];
  callback(allowedPermissions.includes(permission));
});
```

### 🐛 문제 해결

#### 일반적인 문제

1. **빌드 실패**
```bash
# 캐시 정리
npm run clean
rm -rf node_modules
npm install
```

2. **서명 오류 (macOS)**
```bash
# 서명 확인
codesign --verify --verbose dist/mac/YATAV*.app

# Gatekeeper 재설정
sudo spctl --master-disable
sudo spctl --master-enable
```

3. **MongoDB 연결 실패**
```bash
# MongoDB 서비스 확인
sudo systemctl status mongod
sudo systemctl start mongod
```

### 📈 모니터링

#### 로그 위치

- **Windows**: `%APPDATA%/yatav-training/logs/`
- **macOS**: `~/Library/Logs/yatav-training/`
- **Linux**: `~/.config/yatav-training/logs/`

#### 성능 모니터링

```javascript
// 성능 리포트 엔드포인트
GET /api/performance/report

// 시스템 상태
GET /api/health
```

### 📚 추가 리소스

- [공식 문서](https://docs.yatav.com)
- [API 레퍼런스](https://api.yatav.com/docs)
- [이슈 트래커](https://github.com/yatav/training-system/issues)
- [커뮤니티 포럼](https://community.yatav.com)

### 🤝 지원

기술 지원이 필요하신 경우:
- Email: support@yatav.com
- Discord: https://discord.gg/yatav
- Slack: yatav.slack.com

---

© 2025 YATAV. All rights reserved.