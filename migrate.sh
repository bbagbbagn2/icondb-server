#!/bin/bash

# ICONDB 서버 빠른 마이그레이션 스크립트
# MySQL → Supabase

cd server

# 1. 의존성 재설치
echo "📦 의존성 재설치..."
rm -f package-lock.json
npm install

# 2. 환경변수 확인
echo "🔐 환경변수 확인..."
if [ ! -f .env ]; then
  echo "❌ .env 파일이 없습니다. .env.example을 참고하세요."
  exit 1
fi

# 3. Git 커밋
echo "📝 변경사항 커밋..."
git add -A
git commit -m "Migrate to Supabase - Fix MySQL dependency issues" || true

# 4. GitHub 푸시
echo "🚀 GitHub에 푸시..."
git push origin main

echo "✅ 마이그레이션 완료!"
echo "📊 Render 대시보드에서 자동 배포 확인"
