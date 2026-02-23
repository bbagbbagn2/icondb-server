const session = require("express-session");
const dotenv = require("dotenv");
dotenv.config();

/**
 * Express Session 설정
 * Supabase 기반 배포를 위해 메모리 세션 사용
 * 프로덕션 환경에서는 Redis 권장 (별도 설정 필요)
 */

const session_options = {
  key: process.env.SESSION_KEY || "session_cookie_name",
  secret: process.env.SESSION_SECRET || "my_secret_key",
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === "production", // HTTPS에서만 쿠키 전송
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24시간
    sameSite: "lax",
  },
};

const session_stream = session(session_options);

module.exports = session_stream;
