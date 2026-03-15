/**
 * 인증 라우트
 * @description 로그인, 로그아웃, 인증 확인 처리
 */

const express = require("express");
const router = express.Router();
const supabase = require("../config/supabase");
const { authenticate_user } = require("../middleware/auth");
const { handle_error, handle_success } = require("../handlers/errorHandler");

/**
 * GET /api/auth/status
 * @description 현재 로그인 상태 확인
 */
router.post("/get_auth", (req, res) => {
  try {
    if (!req.session || !req.session.user_id) {
      return res.json(null);
    }
    res.json(req.session.user_id);
  } catch (error) {
    handle_error(res, error, "Failed to get auth status");
  }
});

/**
 * POST /api/auth/sign-up
 * @description 회원가입
 * @body {String} id - 사용자 ID
 * @body {String} pw - 비밀번호
 * @body {String} name - 사용자 이름
 */
router.post("/sign_up", async (req, res) => {
  try {
    const { id, password, name } = req.body.formData || req.body;

    // 필수 필드 검증
    if (!id || !password || !name) {
      return handle_error(
        res,
        new Error("Missing required fields"),
        "ID, password, and name are required",
        400,
      );
    }

    // 입력값 유효성 검사
    if (id.length < 3) {
      return handle_error(
        res,
        new Error("Invalid ID"),
        "ID must be at least 3 characters",
        400,
      );
    }

    if (password.length < 6) {
      return handle_error(
        res,
        new Error("Invalid password"),
        "Password must be at least 6 characters",
        400,
      );
    }

    // 중복 체크
    const { data: existing_user, error: check_error } = await supabase
      .from("user")
      .select("id")
      .eq("id", id)
      .single();

    if (!check_error && existing_user) {
      return handle_error(
        res,
        new Error("User exists"),
        "This ID is already registered",
        409,
      );
    }

    // 사용자 생성
    const { error: insert_error } = await supabase.from("user").insert([
      {
        id: id,
        password: password, // 실제 환경에서는 hashing 필수
        nickname: name,
        profilename: "Anonymous.png",
      },
    ]);

    if (insert_error) throw insert_error;

    handle_success(res, null, "Sign up successful", 201);
  } catch (error) {
    handle_error(res, error, "Sign up failed");
  }
});

/**
 * POST /api/auth/sign-in
 * @description 로그인
 * @body {String} id - 사용자 ID
 * @body {String} password - 비밀번호
 */
router.post("/sign_in", async (req, res) => {
  try {
    const { id, password } = req.body.formData || req.body;

    // 필수 필드 검증
    if (!id || !password) {
      return handle_error(
        res,
        new Error("Missing credentials"),
        "ID and password are required",
        400,
      );
    }

    // 사용자 조회
    const { data: user, error: query_error } = await supabase
      .from("user")
      .select("*")
      .eq("id", id)
      .eq("password", password)
      .single();

    if (query_error) {
      if (query_error.code === "PGRST116") {
        // 사용자 없음
        return handle_error(
          res,
          new Error("Invalid credentials"),
          "ID or password is incorrect",
          401,
        );
      }
      throw query_error;
    }

    if (!user) {
      return handle_error(
        res,
        new Error("Invalid credentials"),
        "ID or password is incorrect",
        401,
      );
    }

    // 세션 설정
    req.session.user_id = id;

    // 민감한 정보 제거 후 반환
    delete user.password;
    handle_success(res, user, "Sign in successful");
  } catch (error) {
    handle_error(res, error, "Sign in failed");
  }
});

/**
 * POST /api/auth/sign-out
 * @description 로그아웃
 */
router.post("/sign_out", authenticate_user, (req, res) => {
  try {
    req.session.destroy((error) => {
      if (error) throw error;

      res.clearCookie("connect.sid"); // 기본 세션 쿠키명
      handle_success(res, null, "Sign out successful");
    });
  } catch (error) {
    handle_error(res, error, "Sign out failed");
  }
});

module.exports = router;
