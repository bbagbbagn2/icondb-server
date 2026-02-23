const express = require("express");
const router = express.Router();
const supabase = require("./src/supabase");
const { upload, uploadToSupabase } = require("./src/supabase_multer");

/**
 * 콘텐츠 관련 API
 * Supabase 기반
 */

// 모든 콘텐츠 조회 (페이지네이션)
router.post("/get_contents", async (req, res) => {
  try {
    const offset = req.body.id || 0;
    const limit = req.body.count || 20;

    const { data, error } = await supabase
      .from("content")
      .select("*")
      .order("content_id", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    console.error("Get contents error:", error);
    res.status(500).json({ error: "Failed to get contents" });
  }
});

// 특정 콘텐츠 조회
router.post("/get_content", async (req, res) => {
  try {
    const content_id = req.body.content_id;

    const { data, error } = await supabase
      .from("content")
      .select("*")
      .eq("content_id", content_id);

    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    console.error("Get content error:", error);
    res.status(500).json({ error: "Failed to get content" });
  }
});

// 사용자 콘텐츠 조회
router.post("/get_usercontent", async (req, res) => {
  try {
    const user_id = req.body.id;

    const { data, error } = await supabase
      .from("content")
      .select("*")
      .eq("id", user_id)
      .order("content_id", { ascending: false });

    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    console.error("Get user content error:", error);
    res.status(500).json({ error: "Failed to get user content" });
  }
});

// 콘텐츠 업로드
router.post("/insert_content", upload.single("img"), async (req, res) => {
  try {
    const user_id = req.session.sign;
    const message = req.body.message;

    if (!req.file) {
      return res.status(400).json({ error: "No file provided" });
    }

    // Supabase Storage에 파일 업로드
    const filename = await uploadToSupabase(req.file.buffer, "img");

    // 콘텐츠 테이블에 레코드 삽입
    const { error } = await supabase.from("content").insert([
      {
        id: user_id,
        filename: filename,
        hashtag: message, // hashtag 필드에 메시지 저장
      },
    ]);

    if (error) throw error;
    res.json({ success: true });
  } catch (error) {
    console.error("Insert content error:", error);
    res.status(500).json({ error: "Failed to insert content" });
  }
});

// 검색
router.post("/search", async (req, res) => {
  try {
    const searchbox = req.body.searchbox || "";

    const { data, error } = await supabase
      .from("content")
      .select("*")
      .ilike("hashtag", `%${searchbox}%`)
      .order("content_id", { ascending: false });

    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    console.error("Search error:", error);
    res.status(500).json({ error: "Search failed" });
  }
});

// 콘텐츠 삭제
router.post("/content_delete", async (req, res) => {
  try {
    const content_id = req.body.content_id;

    const { error } = await supabase
      .from("content")
      .delete()
      .eq("content_id", content_id);

    if (error) throw error;
    res.json({ success: true });
  } catch (error) {
    console.error("Delete content error:", error);
    res.status(500).json({ error: "Failed to delete content" });
  }
});

// 콘텐츠 업데이트
router.post("/content_update", async (req, res) => {
  try {
    const content_id = req.body.content_id;
    const content_message = req.body.content_message;

    const { error } = await supabase
      .from("content")
      .update({ hashtag: content_message })
      .eq("content_id", content_id);

    if (error) throw error;
    res.json({ success: true });
  } catch (error) {
    console.error("Update content error:", error);
    res.status(500).json({ error: "Failed to update content" });
  }
});

router.get("/download/:key", (req, res) => {
  const key = req.params.key;
  download(req, res, key);
});

module.exports = router;
