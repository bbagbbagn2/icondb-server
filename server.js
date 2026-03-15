/**
 * ICONDB Server - Express.js + Supabase
 * @description RESTful API 서버
 * @author Backend Development Team
 * @version 1.0.0
 */

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const session = require("express-session");
const dotenv = require("dotenv");

dotenv.config();

// 라우트 임포트
const auth_routes = require("./src/routes/auth.routes");
const users_routes = require("./src/routes/users.routes");
const contents_routes = require("./src/routes/contents.routes");
const likes_routes = require("./src/routes/likes.routes");
const follows_routes = require("./src/routes/follows.routes");
const tags_routes = require("./src/routes/tags.routes");

// 유틸리티 임포트
const { get_svg_from_storage } = require("./src/utils/storage");

const app = express();
const PORT = process.env.PORT || 5000;

// ============================================================================
// 미들웨어 설정
// ============================================================================

// 보안 헤더 설정
app.use(
  helmet({
    contentSecurityPolicy: false,
  }),
);

// CORS 설정
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// 요청 파싱
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 세션 설정
app.use(
  session({
    secret: process.env.SESSION_SECRET || "dev-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production", // HTTPS에서만 전송
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24시간
    },
  }),
);

// ============================================================================
// 라우트 등록
// ============================================================================

// 헬스 체크
app.get("/", (req, res) => {
  res.json({
    status: "ok",
    message: "ICONDB Server is running",
    environment: process.env.NODE_ENV || "development",
    timestamp: new Date().toISOString(),
  });
});

// 인증 라우트
app.use(auth_routes);

// 사용자 라우트
app.use(users_routes);

// 콘텐츠 라우트
app.use(contents_routes);

// 좋아요 라우트
app.use(likes_routes);

// 팔로우 라우트
app.use(follows_routes);

// 태그 라우트
app.use(tags_routes);

// SVG 처리
app.get("/get_xml/:key", async (req, res) => {
  try {
    const file_key = req.params.key;

    if (!file_key) {
      return res.status(400).json({
        status: "error",
        message: "File key is required",
      });
    }

    const svg_buffer = await get_svg_from_storage(file_key);

    res.setHeader("Content-Type", "image/svg+xml");
    res.setHeader("Cache-Control", "public, max-age=86400");
    res.send(svg_buffer);
  } catch (error) {
    console.error("[SVG Retrieval Error]", error);
    res.status(500).json({
      status: "error",
      message: "Failed to retrieve SVG file",
    });
  }
});

// ============================================================================
// 에러 핸들링
// ============================================================================

// 404 핸들러
app.use((req, res) => {
  res.status(404).json({
    status: "error",
    message: "Endpoint not found",
    path: req.path,
  });
});

// 글로벌 에러 핸들러
app.use((error, req, res, next) => {
  console.error("[Global Error Handler]", error);

  const status_code = error.status || 500;
  const message =
    process.env.NODE_ENV === "production"
      ? "Internal Server Error"
      : error.message;

  res.status(status_code).json({
    status: "error",
    message: message,
    code: error.code || "INTERNAL_ERROR",
    ...(process.env.NODE_ENV === "development" && { stack: error.stack }),
  });
});

// ============================================================================
// 서버 시작
// ============================================================================

app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════════╗
║         ICONDB Server Started Successfully                    ║
║───────────────────────────────────────────────────────────────║
║ • Port: ${PORT}
║ • Environment: ${process.env.NODE_ENV || "development"}
║ • Database: Supabase
║ • Client URL: ${process.env.CLIENT_URL || "http://localhost:3000"}
╚═══════════════════════════════════════════════════════════════╝
  `);
});

module.exports = app;
