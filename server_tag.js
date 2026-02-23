const express = require("express");
const router = express.Router();
const supabase = require("./src/supabase");

/**
 * 태그 관련 API
 * Supabase 기반
 * content.hashtag 필드에 태그 저장
 */

// 태그 추가
router.post("/tag_insert", async (req, res) => {
  try {
    const content_id = req.body.content_id;
    const tag_context = req.body.tag_context;

    if (!tag_context) {
      return res.json("fail");
    }

    // 콘텐츠 조회
    const { data: content, error: fetchError } = await supabase
      .from("content")
      .select("hashtag")
      .eq("content_id", content_id);

    if (fetchError) throw fetchError;

    if (!content || content.length === 0) {
      return res.json("fail");
    }

    // 기존 태그와 새 태그 결합
    const existingTags = content[0].hashtag
      ? content[0].hashtag.split(",")
      : [];
    if (existingTags.includes(tag_context)) {
      return res.json("duplication");
    }

    const updatedTags = [...existingTags, tag_context].join(",");

    // 콘텐츠 업데이트
    const { error: updateError } = await supabase
      .from("content")
      .update({ hashtag: updatedTags })
      .eq("content_id", content_id);

    if (updateError) throw updateError;
    res.json({ success: true });
  } catch (error) {
    console.error("Tag insert error:", error);
    res.json("fail");
  }
});

// 태그로 콘텐츠 검색
router.post("/tag_search", async (req, res) => {
  try {
    const search_tag = req.body.Hashtag;

    if (!search_tag) {
      return res.json([]);
    }

    const { data, error } = await supabase
      .from("content")
      .select("*")
      .ilike("hashtag", `%${search_tag}%`)
      .order("content_id", { ascending: false });

    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    console.error("Tag search error:", error);
    res.status(500).json({ error: "Tag search failed" });
  }
});

// 콘텐츠의 모든 태그 조회
router.post("/get_tags", async (req, res) => {
  try {
    const content_id = req.body.content_id;

    const { data, error } = await supabase
      .from("content")
      .select("hashtag")
      .eq("content_id", content_id);

    if (error) throw error;

    if (data && data.length > 0 && data[0].hashtag) {
      const tags = data[0].hashtag.split(",").map((tag) => ({
        Hashtag: tag.trim(),
      }));
      res.json(tags);
    } else {
      res.json([]);
    }
  } catch (error) {
    console.error("Get tags error:", error);
    res.status(500).json({ error: "Failed to get tags" });
  }
});

module.exports = router;
