# ⚡ 5분 안에 배포하기

## 1️⃣ Supabase 설정 (2분)

```bash
# 1. supabase.com 방문 → 프로젝트 생성
# 2. Project Settings → API에서 복사:
#    - SUPABASE_URL
#    - SUPABASE_ANON_KEY

# 3. Storage 탭 → New bucket → 이름: icondb
```

## 2️⃣ 배포 (3분)

### 옵션 A: Render (추천)

```bash
# 1. GitHub에 푸시
git push origin main

# 2. render.com → New Web Service
# 3. Repository 선택 → Deploy

# 4. Environment Variables 설정:
NODE_ENV=production
SUPABASE_URL=your_url
SUPABASE_ANON_KEY=your_key
SUPABASE_BUCKET=icondb
SESSION_SECRET=generate_strong_key
CLIENT_URL=your_frontend_url
```

### 옵션 B: Railway

```bash
npm i -g @railway/cli
railway login
cd server
railway init
railway add  # Supabase, SESSION_SECRET 입력
railway up
```

## ✅ 배포 완료!

서버 URL 확인:

```bash
curl https://your-server-url/
```

클라이언트 `.env.production` 업데이트:

```env
VITE_API_URL=https://your-server-url
```

---

📖 **자세한 가이드**: DEPLOYMENT_GUIDE.md 참조
