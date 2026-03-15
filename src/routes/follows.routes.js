/**
 * 팔로우 라우트
 * @description 팔로우/언팔로우, 팔로우 목록 조회
 */

const express = require("express");
const router = express.Router();
const supabase = require("../config/supabase");
const { authenticate_user } = require("../middleware/auth");
const { handle_error, handle_success } = require("../handlers/errorHandler");

/**
 * POST /follows/check
 * @description 팔로우 여부 확인
 * @body {String} userId - 대상 사용자 ID
 */
router.post("/check_followed", authenticate_user, async (req, res) => {
  try {
    const current_user_id = req.current_user_id;
    const target_user_id = req.body.userId || req.body.id;

    if (!target_user_id) {
      return handle_error(
        res,
        new Error("Missing target user"),
        "Target user ID is required",
        400,
      );
    }

    const { data, error } = await supabase
      .from("follows")
      .select("*")
      .eq("follower_id", current_user_id)
      .eq("following_id", target_user_id)
      .single();

    if (error && error.code === "PGRST116") {
      res.json({ followed: false });
      return;
    }

    if (error) throw error;

    res.json({
      followed: !!data,
    });
  } catch (error) {
    console.error("[Check Follow Error]", error);
    res.json({ followed: false });
  }
});

/**
 * POST /follows
 * @description 팔로우 추가
 * @body {String} userId - 대상 사용자 ID
 */
router.post("/follow", authenticate_user, async (req, res) => {
  try {
    const current_user_id = req.current_user_id;
    const target_user_id = req.body.userId || req.body.id;

    if (!target_user_id) {
      return handle_error(
        res,
        new Error("Missing target user"),
        "Target user ID is required",
        400,
      );
    }

    if (current_user_id === target_user_id) {
      return handle_error(
        res,
        new Error("Self-follow"),
        "Cannot follow yourself",
        400,
      );
    }

    // 이미 팔로우 상태 확인
    const { data: existing, error: check_error } = await supabase
      .from("follows")
      .select("*")
      .eq("follower_id", current_user_id)
      .eq("following_id", target_user_id)
      .single();

    if (check_error && check_error.code !== "PGRST116") {
      throw check_error;
    }

    if (existing) {
      return handle_error(
        res,
        new Error("Already following"),
        "Already following this user",
        409,
      );
    }

    // 팔로우 추가
    const { error: insert_error } = await supabase.from("follows").insert([
      {
        follower_id: current_user_id,
        following_id: target_user_id,
        created_at: new Date().toISOString(),
      },
    ]);

    if (insert_error) throw insert_error;

    handle_success(res, null, "User followed successfully");
  } catch (error) {
    handle_error(res, error, "Failed to follow user");
  }
});

/**
 * DELETE /follows/:id
 * @description 팔로우 해제
 * @body {String} userId - 대상 사용자 ID
 */
router.post("/unfollow", authenticate_user, async (req, res) => {
  try {
    const current_user_id = req.current_user_id;
    const target_user_id = req.body.userId || req.body.id;

    if (!target_user_id) {
      return handle_error(
        res,
        new Error("Missing target user"),
        "Target user ID is required",
        400,
      );
    }

    // 팔로우 관계 확인
    const { data: existing, error: check_error } = await supabase
      .from("follows")
      .select("*")
      .eq("follower_id", current_user_id)
      .eq("following_id", target_user_id)
      .single();

    if (check_error && check_error.code !== "PGRST116") {
      throw check_error;
    }

    if (!existing) {
      return handle_error(
        res,
        new Error("Not following"),
        "Not following this user",
        404,
      );
    }

    // 팔로우 해제
    const { error: delete_error } = await supabase
      .from("follows")
      .delete()
      .eq("follower_id", current_user_id)
      .eq("following_id", target_user_id);

    if (delete_error) throw delete_error;

    handle_success(res, null, "User unfollowed successfully");
  } catch (error) {
    handle_error(res, error, "Failed to unfollow user");
  }
});

/**
 * POST /users/:user_id/following
 * @description 사용자가 팔로우 중인 사람 목록
 * @body {String} id - 사용자 ID
 */
router.post("/get_following", async (req, res) => {
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
      .from("follows")
      .select("following_id, user!following_id(*)")
      .eq("follower_id", user_id);

    if (error) throw error;

    const following_users = data
      ? data.map((item) => ({
          id: item.following_id,
          ...item.user,
        }))
      : [];

    handle_success(
      res,
      following_users,
      "Following list retrieved successfully",
    );
  } catch (error) {
    handle_error(res, error, "Failed to retrieve following list");
  }
});

/**
 * POST /users/:user_id/followers
 * @description 사용자의 팔로워 목록
 * @body {String} id - 사용자 ID
 */
router.post("/get_followers", async (req, res) => {
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
      .from("follows")
      .select("follower_id, user!follower_id(*)")
      .eq("following_id", user_id);

    if (error) throw error;

    const followers = data
      ? data.map((item) => ({
          id: item.follower_id,
          ...item.user,
        }))
      : [];

    handle_success(res, followers, "Followers list retrieved successfully");
  } catch (error) {
    handle_error(res, error, "Failed to retrieve followers list");
  }
});

/**
 * POST /follows/toggle
 * @description 팔로우 토글 (편의 엔드포인트)
 * @body {String} id - 대상 사용자 ID
 */
router.post("/setFollow", authenticate_user, async (req, res) => {
  try {
    const current_user_id = req.current_user_id;
    const target_user_id = req.body.id;

    if (!target_user_id) {
      return handle_error(
        res,
        new Error("Missing target user"),
        "Target user ID is required",
        400,
      );
    }

    // 기존 팔로우 확인
    const { data: existing, error: check_error } = await supabase
      .from("follows")
      .select("*")
      .eq("follower_id", current_user_id)
      .eq("following_id", target_user_id)
      .single();

    if (check_error && check_error.code !== "PGRST116") {
      throw check_error;
    }

    const is_following = !!existing;

    if (is_following) {
      // 팔로우 해제
      const { error: delete_error } = await supabase
        .from("follows")
        .delete()
        .eq("follower_id", current_user_id)
        .eq("following_id", target_user_id);

      if (delete_error) throw delete_error;

      res.json(false);
    } else {
      // 팔로우 추가
      const { error: insert_error } = await supabase.from("follows").insert([
        {
          follower_id: current_user_id,
          following_id: target_user_id,
          created_at: new Date().toISOString(),
        },
      ]);

      if (insert_error) throw insert_error;

      res.json(true);
    }
  } catch (error) {
    handle_error(res, error, "Failed to toggle follow");
  }
});

module.exports = router;
