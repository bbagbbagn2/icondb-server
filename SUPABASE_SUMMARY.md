# MySQL → Supabase 마이그레이션 요약

## 📊 비교표

| 특성              | MySQL             | Supabase              |
| ----------------- | ----------------- | --------------------- |
| **데이터베이스**  | MySQL 8.0         | PostgreSQL 14+        |
| **드라이버**      | mysql 패키지      | @supabase/supabase-js |
| **연결 방식**     | Connection Pool   | REST API / WebSocket  |
| **인증**          | 없음              | JWT 토큰 기반         |
| **실시간 동기화** | 지원 안함         | 지원 ✅               |
| **호스팅**        | 자체 관리         | 클라우드 (Supabase)   |
| **비용**          | EC2 인스턴스 비용 | 무료 플랜 + 종량제    |
| **백업**          | 수동 설정         | 자동 백업 ✅          |
| **스케일링**      | 수동              | 자동 ✅               |

## 🔄 코드 변환 패턴

### Before (MySQL + Callback)

```javascript
sql_pool.query("SELECT * FROM user WHERE id = ?", [id], (err, result) => {
  if (err) throw err;
  res.send(result);
});
```

### After (Supabase + Async/Await)

```javascript
const { data, error } = await supabase.from("user").select("*").eq("id", id);

if (error) throw error;
res.send(data);
```

## 📝 마이그레이션 체크리스트

### 1단계: 준비

- [ ] Supabase 계정 생성 (supabase.com)
- [ ] 새 프로젝트 생성 (`icondb`)
- [ ] 프로젝트 URL과 API 키 복사
- [ ] `.env` 파일 업데이트

### 2단계: 의존성 변경

```bash
# 제거
npm uninstall mysql express-mysql-session

# 설치
npm install @supabase/supabase-js
```

### 3단계: 데이터베이스 마이그레이션

- [ ] Supabase SQL Editor 열기
- [ ] `SQL_SCHEMA.sql` 전체 복사
- [ ] SQL Editor에서 실행
- [ ] 테이블 생성 확인

### 4단계: 서버 코드 수정

- [ ] `src/supabase.js` 생성 ✅ (이미 완료)
- [ ] `server_user.js` 수정 (예시: `server_user_supabase.js` 참고)
- [ ] `server_tag.js` 수정
- [ ] `server_like.js` 수정
- [ ] `server_content.js` 수정
- [ ] `server_follow.js` 수정
- [ ] `server.js` 의존성 확인

### 5단계: 테스트

- [ ] 로그인/로그아웃 테스트
- [ ] 회원가입/탈퇴 테스트
- [ ] 데이터 CRUD 확인
- [ ] 성능 및 지연시간 확인

### 6단계: 배포

- [ ] 본 서버에 배포
- [ ] 모니터링
- [ ] 이슈 모니터링

## 🚨 주의사항

### 1. SQL 문법 차이

- MySQL의 `LIMIT ? OFFSET ?`는 PostgreSQL도 동일
- `AUTO_INCREMENT`는 `SERIAL` 또는 `BIGSERIAL`로 대체
- 날짜 함수 일부 호환성 확인 필요

### 2. 파라미터 바인딩

```javascript
// MySQL: ?
"WHERE id = ?"

  // Supabase: .eq("id", value)
  .eq("id", value);
```

### 3. Error Handling

```javascript
// MySQL
sql_pool.query(sql, [params], (err, result) => {
  if (err) throw err; // callback 기반
});

// Supabase
const { data, error } = await supabase...
if (error) throw error; // Promise 기반
```

### 4. 세션 저장소

현재 MySQL 세션 저장소 → 메모리 또는 Redis로 임시 변경 후,
필요시 Supabase 기반 저장소로 이전

```javascript
// 임시: 메모리 저장소
const session = require("express-session");
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    store: new session.MemoryStore(), // 임시 방편
  }),
);
```

## 💡 마이그레이션 전략

### Phase 1: 병렬 실행 (안전)

1. Supabase 별도 인스턴스에 데이터 복제
2. 새 엔드포인트에서 Supabase 사용
3. 기존 MySQL은 유지
4. 테스트 후 확인

### Phase 2: 완전 마이그레이션

1. Supabase로 모든 요청 전환
2. MySQL 데이터 보관 (백업)
3. 일정 기간 후 MySQL 종료

## 📚 참고 자료

- [Supabase 공식 문서](https://supabase.com/docs)
- [Supabase JS 클라이언트](https://supabase.com/docs/reference/javascript)
- [PostgreSQL vs MySQL 차이](https://www.postgresql.org/docs/current/)

## ❓ 추가 질문?

마이그레이션 중 문제가 있으면:

1. Supabase 공식 문서 확인
2. 에러 로그 확인 (server console)
3. SQL 문법 검증
