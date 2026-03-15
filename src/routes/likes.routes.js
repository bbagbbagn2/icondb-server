/**
 * 좋아요 라우트
 * @description 좋아요 추가/제거, 상태 확인
 */

const express = require("express");
const router = express.Router();
const supabase = require("../config/supabase");
const { authenticate_user } = require("../middleware/auth");
const { handle_error, handle_success } = require("../handlers/errorHandler");

/**
 * POST /likes/check
 * @description 좋아요 여부 확인
 * @body {Number} content_id - 콘텐츠 ID
 */
router.post("/check_liked", authenticate_user, async (req, res) => {
  try {
    const content_id = req.body.content_id;
    const user_id = req.current_user_id;

    if (!content_id) {
      return handle_error(
        res,
        new Error("Missing content_id"),
        "Content ID is required",
        400,
      );
    }

    const { data, error } = await supabase
      .from("likes")
      .select("*")
      .eq("user_id", user_id)
      .eq("content_id", content_id)
      .single();

    if (error && error.code === "PGRST116") {
      // 데이터 없음
      res.json("unliked");
      return;
    }

    if (error) throw error;

    const is_liked = !!data;
    res.json(is_liked ? "liked" : "unliked");
  } catch (error) {
    console.error("[Check Like Error]", error);
    res.json("unliked");
  }
});

/**
 * POST /likes (toggle)
 * @description 좋아요 토글
 * @body {Number} content_id - 콘텐츠 ID
 */
router.post("/setLike", authenticate_user, async (req, res) => {
  try {
    const content_id = req.body.content_id;
    const user_id = req.current_user_id;

    if (!content_id) {
      return handle_error(
        res,
        new Error("Missing content_id"),
        "Content ID is required",
        400,
      );
    }

    // 기존 좋아요 확인
    const { data: existing_like, error: check_error } = await supabase
      .from("likes")
      .select("*")
      .eq("user_id", user_id)
      .eq("content_id", content_id)
      .single();

    if (check_error && check_error.code !== "PGRST116") {
      throw check_error;
    }

    const is_already_liked = !!existing_like;

    if (is_already_liked) {
      // 좋아요 제거
      const { error: delete_error } = await supabase
        .from("likes")
        .delete()
        .eq("user_id", user_id)
        .eq("content_id", content_id);

      if (delete_error) throw delete_error;

      res.json(false);
    } else {
      // 좋아요 추가
      const { error: insert_error } = await supabase.from("likes").insert([
        {
          user_id: user_id,
          content_id: content_id,
          created_at: new Date().toISOString(),
        },
      ]);

      if (insert_error) throw insert_error;

      res.json(true);
    }
  } catch (error) {
    handle_error(res, error, "Failed to toggle like");
  }
});

/**
 * POST /users/:user_id/liked-contents
 * @description 사용자가 좋아요한 콘텐츠 조회
 * @body {String} id - 사용자 ID
 */
router.post("/get_userlikedcontent", async (req, res) => {
  try {
    const user_id = req.body.id;

    if (!user_id) {
      return handle_error(
        res,
        new Error("Missing user_id"),
        "User ID is required",
        400,
      );
    }

    const { data, error } = await supabase
      .from("likes")
      .select("content(*)")
      .eq("user_id", user_id);

    if (error) throw error;

    // content 객체 추출
    const liked_contents = data
      ? data
          .map((item) => item.content)
          .filter(Boolean)
          .sort((a, b) => b.content_id - a.content_id)
      : [];

    handle_success(
      res,
      liked_contents,
      "User liked contents retrieved successfully",
    );
  } catch (error) {
    handle_error(res, error, "Failed to retrieve liked contents");
  }
});

module.exports = router;
