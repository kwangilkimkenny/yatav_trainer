#!/bin/bash

# YATAV Backend Server 재시작 스크립트
# 이미 실행 중인 서버를 종료하고 새로 시작합니다.

echo "🔄 YATAV Backend Server 재시작 중..."

# 1. 현재 실행 중인 서버 확인 및 종료
if lsof -i :8008 > /dev/null 2>&1; then
    echo "⚠️  포트 8008에서 실행 중인 프로세스를 종료합니다..."
    kill -9 $(lsof -t -i:8008) 2>/dev/null
    sleep 2
    echo "✅ 기존 서버가 종료되었습니다."
else
    echo "ℹ️  실행 중인 서버가 없습니다."
fi

# 2. backend 디렉토리로 이동
cd "$(dirname "$0")/backend" || exit 1

# 3. Python 가상환경 활성화
if [ -d "venv" ]; then
    echo "🐍 Python venv 환경을 활성화합니다..."
    source venv/bin/activate
elif command -v conda &> /dev/null; then
    echo "🐍 Conda 환경을 활성화합니다..."
    conda activate py11_yatav
else
    echo "❌ Python 가상환경을 찾을 수 없습니다!"
    echo "   backend/venv 디렉토리가 있는지 확인하세요."
    exit 1
fi

# 4. 서버 시작
echo "🚀 YATAV Backend Server를 시작합니다..."
echo "   주소: http://127.0.0.1:8008"
echo "   API 문서: http://127.0.0.1:8008/docs"
echo ""
echo "서버를 종료하려면 Ctrl+C를 누르세요."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

python main.py