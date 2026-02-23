const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const dotenv = require("dotenv");

dotenv.config();

const session_stream = require("./src/session");
const server_user = require("./server_user");
const server_tag = require("./server_tag");
const server_like = require("./server_like");
const server_content = require("./server_content");
const server_follow = require("./server_follow");

const app = express();
const PORT = process.env.PORT || 5000;

// 미들웨어
app.use(helmet()); // 보안 헤더 설정
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true,
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(session_stream);

// 라우트
app.get("/", (req, res) => {
  res.json({
    message: `ICONDB Server is running on port ${PORT}`,
    environment: process.env.NODE_ENV || "development",
  });
});

app.use(server_user);
app.use(server_tag);
app.use(server_like);
app.use(server_content);
app.use(server_follow);

// SVG 처리
const supabase_handler = require("./src/supabase_multer").svg;
app.get("/get_xml/:key", async (req, res) => {
  const key = req.params.key + ".svg";
  supabase_handler(req, res, key);
});

// 에러 핸들링
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Internal Server Error" });
});

// 서버 시작
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`📦 Database: Supabase`);
});
