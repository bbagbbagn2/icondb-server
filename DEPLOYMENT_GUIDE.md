# 🚀 ICONDB 서버 배포 가이드

프론트엔드 개발자도 쉽게 배포할 수 있도록 구성했습니다.

## 📋 필수 사항

- Supabase 계정 (무료)
- Render / Railway / Fly.io 계정 (호스팅)
- Git (코드 푸시용)

---

## 🔧 Step 1: Supabase 설정 (5분)

### 1-1. Supabase 프로젝트 생성

1. [supabase.com](https://supabase.com) 방문
2. GitHub으로 로그인
3. **New Project** → 프로젝트 이름 입력 → **Create project**

### 1-2. 필요한 정보 복사

1. **Project Settings** → **API** 탭
2. 다음 정보를 메모장에 복사:
   - **Project URL** → `SUPABASE_URL`
   - **anon (public)** → `SUPABASE_ANON_KEY`

### 1-3. Storage 버킷 생성

1. **Storage** → **New bucket**
2. 버킷 이름: `icondb`
3. **Create bucket**
4. **Permissions** → `Public` 설정

### 1-4. 데이터베이스 마이그레이션

1. **SQL Editor** → **New query**
2. 다음 SQL 실행:

```sql
-- users 테이블
CREATE TABLE IF NOT EXISTS public.user (
  id VARCHAR(255) PRIMARY KEY,
  password VARCHAR(255) NOT NULL,
  nickname VARCHAR(255) NOT NULL,
  profilename VARCHAR(255) DEFAULT 'Anonymous.png',
  created_at TIMESTAMP DEFAULT NOW()
);

-- content 테이블
CREATE TABLE IF NOT EXISTS public.content (
  content_id SERIAL PRIMARY KEY,
  id VARCHAR(255) NOT NULL REFERENCES public.user(id),
  filename VARCHAR(255),
  hashtag TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- follows 테이블
CREATE TABLE IF NOT EXISTS public.follows (
  follow_id SERIAL PRIMARY KEY,
  follower_id VARCHAR(255) NOT NULL REFERENCES public.user(id),
  following_id VARCHAR(255) NOT NULL REFERENCES public.user(id),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(follower_id, following_id)
);

-- likes 테이블
CREATE TABLE IF NOT EXISTS public.likes (
  like_id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL REFERENCES public.user(id),
  content_id INT NOT NULL REFERENCES public.content(content_id),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, content_id)
);
```

---

## 🚀 Step 2: Render에 배포 (권장, 가장 쉬움)

### 2-1. 코드 준비

```bash
cd server
git init
git add .
git commit -m "Initial server commit"
git branch -M main
git remote add origin https://github.com/your-username/icondb-server.git
git push -u origin main
```

### 2-2. Render 배포

1. [render.com](https://render.com) 방문
2. **Dashboard** → **New +** → **Web Service**
3. **Connect a repository** → 자신의 `icondb-server` 레포지토리 선택
4. 설정:
   - **Name**: `icondb-server`
   - **Environment**: `Node`
   - **Build Command**: `npm ci`
   - **Start Command**: `npm start`

### 2-3. 환경변수 설정

**Environment** 탭에서 다음 추가:

```
NODE_ENV=production
PORT=5000
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_BUCKET=icondb
SESSION_SECRET=your_strong_secret_key
CLIENT_URL=your_frontend_url
```

### 2-4. 배포 시작

**Create Web Service** 클릭 → 자동으로 배포 시작

배포 완료 후:

- **server-name.onrender.com** 생성됨
- 이 URL을 클라이언트의 환경변수로 설정

---

## 🚀 Step 3: Railway에 배포 (대안)

### 3-1. Railway 설정

```bash
npm i -g @railway/cli
railway login
cd server
railway init
```

### 3-2. 환경변수 설정

```bash
railway add
# Supabase, SESSION_SECRET 등 추가
```

### 3-3. 배포

```bash
railway up
```

---

## 🚀 Step 4: Fly.io에 배포 (성능 중심)

```bash
npm i -g flyctl
fly auth login
cd server
fly launch
# 환경변수 입력
fly deploy
```

---

## 🔗 클라이언트 연동

배포 후 클라이언트 `.env.production` 업데이트:

```env
VITE_API_URL=https://icondb-server.onrender.com
```

또는 JavaScript에서:

```javascript
const API_URL = process.env.VITE_API_URL || "https://your-server-url.com";

// axios 기본 설정
axios.defaults.baseURL = API_URL;
```

---

## 🔍 배포 후 확인

1. 서버 상태 확인:

   ```bash
   curl https://your-server-url/
   ```

2. 응답:
   ```json
   {
     "message": "ICONDB Server is running on port 5000",
     "environment": "production"
   }
   ```

---

## 🐛 문제 해결

### "Supabase connection error"

- ✅ `SUPABASE_URL`과 `SUPABASE_ANON_KEY` 확인
- ✅ Supabase 프로젝트가 활성화되어 있는지 확인

### "Permission denied" (Storage)

- ✅ Render/Railway에서 환경변수 다시 확인
- ✅ Storage 버킷 권한이 Public인지 확인

### "CORS 에러"

- ✅ `CLIENT_URL` 환경변수 올바른지 확인
- ✅ 클라이언트 URL에 프로토콜 포함 (https://)

---

## 📚 로컬 테스트

```bash
# 의존성 설치
npm install

# .env 파일 생성 (Supabase 정보 입력)
cp .env.example .env

# 로컬 서버 시작
npm run dev
```

---

## 💡 마이그레이션 팁

기존 MySQL 데이터를 Supabase로 이관:

```bash
# MySQL에서 dump
mysqldump -u root -p icondb > dump.sql

# Supabase SQL Editor에서 실행
# SQL 문법을 PostgreSQL로 변환 필요
```

---

## 📞 지원

문제 발생 시:

1. 로그 확인: Render/Railway 대시보드에서 실시간 로그 확인
2. Supabase 문서: https://supabase.com/docs
3. Express 문서: https://expressjs.com

---

**Happy Deploying! 🎉**
