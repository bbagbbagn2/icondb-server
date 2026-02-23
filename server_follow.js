const express = require("express");
const router = express.Router();
const supabase = require("./src/supabase");

/**
 * 팔로우 관련 API
 * Supabase 기반
 */

// 팔로우 여부 확인
router.post("/check_followed", async (req, res) => {
  try {
    const current_user = req.session.sign;
    const target_user = req.body.userId || req.body.id;

    const { data, error } = await supabase
      .from("follows")
      .select("*")
      .eq("follower_id", current_user)
      .eq("following_id", target_user);

    if (error) throw error;
    res.json({
      followed: data && data.length > 0,
    });
  } catch (error) {
    console.error("Check followed error:", error);
    res.json({ followed: false });
  }
});

// 팔로우 토글
router.post("/setFollow", async (req, res) => {
  try {
    const current_user = req.session.sign;
    const target_user = req.body.id;

    // 이미 팔로우 상태인지 확인
    const { data: existingFollow, error: checkError } = await supabase
      .from("follows")
      .select("*")
      .eq("follower_id", current_user)
      .eq("following_id", target_user);

    if (checkError) throw checkError;

    const isFollowed = existingFollow && existingFollow.length > 0;

    if (isFollowed) {
      // 팔로우 해제
      const { error: deleteError } = await supabase
        .from("follows")
        .delete()
        .eq("follower_id", current_user)
        .eq("following_id", target_user);

      if (deleteError) throw deleteError;
      res.json(false);
    } else {
      // 팔로우 추가
      const { error: insertError } = await supabase
        .from("follows")
        .insert([{ follower_id: current_user, following_id: target_user }]);

      if (insertError) throw insertError;
      res.json(true);
    }
  } catch (error) {
    console.error("Set follow error:", error);
    res.status(500).json({ error: "Failed to toggle follow" });
  }
});

// 팔로우하는 사람들 조회
router.post("/get_following", async (req, res) => {
  try {
    const user_id = req.body.id;

    const { data, error } = await supabase
      .from("follows")
      .select("user(*)")
      .eq("follower_id", user_id);

    if (error) throw error;

    // user 객체 추출
    const users = data ? data.map((item) => item.user).filter(Boolean) : [];
    res.json(users);
  } catch (error) {
    console.error("Get following error:", error);
    res.status(500).json({ error: "Failed to get following" });
  }
});

// 팔로워 조회
router.post("/get_followers", async (req, res) => {
  try {
    const user_id = req.body.id;

    const { data, error } = await supabase
      .from("follows")
      .select("user(*)")
      .eq("following_id", user_id);

    if (error) throw error;

    // user 객체 추출
    const users = data ? data.map((item) => item.user).filter(Boolean) : [];
    res.json(users);
  } catch (error) {
    console.error("Get followers error:", error);
    res.status(500).json({ error: "Failed to get followers" });
  }
});

// 팔로우 상태 확인 (POST /follow)
router.post("/follow", async (req, res) => {
  try {
    const current_user = req.session.sign;
    const target_user = req.body.userId;

    const { error } = await supabase
      .from("follows")
      .insert([{ follower_id: current_user, following_id: target_user }]);

    if (error) {
      if (error.message.includes("duplicate")) {
        return res.json({ success: false, message: "Already followed" });
      }
      throw error;
    }
    res.json({ success: true });
  } catch (error) {
    console.error("Follow error:", error);
    res.status(500).json({ error: "Failed to follow" });
  }
});

// 언팔로우 (POST /unfollow)
router.post("/unfollow", async (req, res) => {
  try {
    const current_user = req.session.sign;
    const target_user = req.body.userId;

    const { error } = await supabase
      .from("follows")
      .delete()
      .eq("follower_id", current_user)
      .eq("following_id", target_user);

    if (error) throw error;
    res.json({ success: true });
  } catch (error) {
    console.error("Unfollow error:", error);
    res.status(500).json({ error: "Failed to unfollow" });
  }
});

module.exports = router;
