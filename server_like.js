const express = require("express");
const router = express.Router();
const supabase = require("./src/supabase");

/**
 * 좋아요 관련 API
 * Supabase 기반
 */

// 좋아요 여부 확인
router.post("/check_liked", async (req, res) => {
  try {
    const content_id = req.body.content_id;
    const user_id = req.session.sign;

    const { data, error } = await supabase
      .from("likes")
      .select("*")
      .eq("user_id", user_id)
      .eq("content_id", content_id);

    if (error) throw error;
    res.json(data && data.length > 0 ? "liked" : "unliked");
  } catch (error) {
    console.error("Check liked error:", error);
    res.json("unliked");
  }
});

// 좋아요 토글
router.post("/setLike", async (req, res) => {
  try {
    const content_id = req.body.content_id;
    const user_id = req.session.sign;

    // 이미 좋아요한 상태인지 확인
    const { data: existingLike, error: checkError } = await supabase
      .from("likes")
      .select("*")
      .eq("user_id", user_id)
      .eq("content_id", content_id);

    if (checkError) throw checkError;

    const isLiked = existingLike && existingLike.length > 0;

    if (isLiked) {
      // 좋아요 제거
      const { error: deleteError } = await supabase
        .from("likes")
        .delete()
        .eq("user_id", user_id)
        .eq("content_id", content_id);

      if (deleteError) throw deleteError;
      res.json(false);
    } else {
      // 좋아요 추가
      const { error: insertError } = await supabase
        .from("likes")
        .insert([{ user_id, content_id }]);

      if (insertError) throw insertError;
      res.json(true);
    }
  } catch (error) {
    console.error("Set like error:", error);
    res.status(500).json({ error: "Failed to toggle like" });
  }
});

// 사용자가 좋아요한 콘텐츠 조회
router.post("/get_userlikedcontent", async (req, res) => {
  try {
    const user_id = req.body.id;

    const { data, error } = await supabase
      .from("likes")
      .select("content(*)")
      .eq("user_id", user_id);

    if (error) throw error;

    // content 객체 추출
    const contents = data
      ? data.map((item) => item.content).filter(Boolean)
      : [];
    res.json(contents);
  } catch (error) {
    console.error("Get user liked content error:", error);
    res.status(500).json({ error: "Failed to get liked content" });
  }
});

module.exports = router;
