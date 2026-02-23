# MySQL → Supabase 마이그레이션 가이드

## 1. Supabase 프로젝트 생성

### 1.1 회원가입 및 프로젝트 생성

- [Supabase 공식 사이트](https://supabase.com) 방문
- 회원가입 후 새 프로젝트 생성
- 프로젝트 이름: `icondb`
- Database 패스워드 저장

### 1.2 API 키 확인

- Settings > API 메뉴에서 다음 값 복사:
  - **Project URL** → `SUPABASE_URL`
  - **anon public** → `SUPABASE_ANON_KEY`

### 1.3 .env 파일 설정

```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
```

## 2. 데이터베이스 마이그레이션

### 2.1 현재 MySQL 스키마 확인

```sql
-- MySQL에서 실행
SHOW CREATE TABLE user;
SHOW CREATE TABLE tag;
SHOW CREATE TABLE like;
SHOW CREATE TABLE content;
SHOW CREATE TABLE follow;
```

### 2.2 Supabase에서 테이블 생성

#### user 테이블

```sql
CREATE TABLE user (
  id VARCHAR(255) PRIMARY KEY,
  password VARCHAR(255) NOT NULL,
  nickname VARCHAR(100),
  profilename VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 기타 테이블들도 동일한 방식으로 생성

## 3. 서버 코드 변경

### 3.1 패키지 설치

```bash
npm install @supabase/supabase-js
npm uninstall mysql express-mysql-session
```

### 3.2 코드 마이그레이션 패턴

#### Before (MySQL)

```javascript
const sql_pool = require("./src/mysql");

router.post("/get_profile", (req, res) => {
  const user = req.body.user;
  const sql = "SELECT * FROM user where id = ?";
  sql_pool.query(sql, [user], (err, result) => {
    if (err) throw err;
    else res.send(result);
  });
});
```

#### After (Supabase)

```javascript
const supabase = require("./src/supabase");

router.post("/get_profile", async (req, res) => {
  const user = req.body.user;
  const { data, error } = await supabase
    .from("user")
    .select("*")
    .eq("id", user);

  if (error) res.status(400).send(error);
  else res.send(data);
});
```

## 4. 주요 SQL → Supabase 변환 규칙

| SQL              | Supabase                        |
| ---------------- | ------------------------------- |
| `SELECT *`       | `.select("*")`                  |
| `WHERE id = ?`   | `.eq("id", value)`              |
| `INSERT INTO`    | `.insert(data)`                 |
| `UPDATE ... SET` | `.update(data).eq("id", value)` |
| `DELETE FROM`    | `.delete().eq("id", value)`     |

## 5. 마이그레이션 체크리스트

- [ ] Supabase 프로젝트 생성
- [ ] API 키 .env에 설정
- [ ] @supabase/supabase-js 설치
- [ ] Database 테이블 생성
- [ ] server_user.js 수정
- [ ] server_tag.js 수정
- [ ] server_like.js 수정
- [ ] server_content.js 수정
- [ ] server_follow.js 수정
- [ ] 세션 저장소 변경 (선택사항)
- [ ] 전체 테스트

## 6. 세션 저장소 변경 (선택사항)

MySQL 세션 저장소 → Supabase 기반 저장소:

```javascript
const session = require("express-session");
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY,
);

// Supabase sessions 테이블 사용
const sessionStore = new (require("connect-pg-simple")(session))({
  pool: supabase, // 대체 방안 필요
});
```

## 7. 환경변수 정리

마이그레이션 완료 후 불필요한 환경변수 제거:

```
# 삭제 가능:
DB_HOST, DB_PORT, DB_USER, DB_PASS, DB_NAME
```

## 주의사항

⚠️ **데이터 일관성**: 마이그레이션 전 데이터 백업  
⚠️ **트래픽 변경 없음**: 쿼리 성능 테스트 권장  
⚠️ **보안**: API 키 노출 주의
