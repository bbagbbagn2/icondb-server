/**
 * 태그 라우트
 * @description 태그 추가, 검색, 조회
 */

const express = require("express");
const router = express.Router();
const supabase = require("../config/supabase");
const { authenticate_user } = require("../middleware/auth");
const { handle_error, handle_success } = require("../handlers/errorHandler");

/**
 * POST /tags
 * @description 태그 추가
 * @body {Number} content_id - 콘텐츠 ID
 * @body {String} tag_context - 태그 내용
 */
router.post("/tag_insert", authenticate_user, async (req, res) => {
  try {
    const content_id = req.body.content_id;
    const tag_context = req.body.tag_context;

    if (!content_id || !tag_context) {
      return handle_error(
        res,
        new Error("Missing required fields"),
        "Content ID and tag are required",
        400,
      );
    }

    // 콘텐츠 조회
    const { data: content, error: fetch_error } = await supabase
      .from("content")
      .select("hashtag")
      .eq("content_id", content_id)
      .single();

    if (fetch_error) {
      if (fetch_error.code === "PGRST116") {
        return handle_error(res, fetch_error, "Content not found", 404);
      }
      throw fetch_error;
    }

    // 기존 태그 파싱
    const existing_tags = content.hashtag
      ? content.hashtag
          .split(",")
          .map((tag) => tag.trim())
          .filter((tag) => tag.length > 0)
      : [];

    // 중복 체크
    if (existing_tags.includes(tag_context.trim())) {
      return handle_error(
        res,
        new Error("Duplicate tag"),
        "This tag already exists",
        409,
      );
    }

    // 새 태그 추가
    const updated_tags = [...existing_tags, tag_context.trim()].join(",");

    const { error: update_error } = await supabase
      .from("content")
      .update({ hashtag: updated_tags })
      .eq("content_id", content_id);

    if (update_error) throw update_error;

    handle_success(res, null, "Tag added successfully", 201);
  } catch (error) {
    handle_error(res, error, "Failed to add tag");
  }
});

/**
 * POST /tags/search
 * @description 태그로 콘텐츠 검색
 * @body {String} Hashtag - 검색 태그
 */
router.post("/tag_search", async (req, res) => {
  try {
    const search_tag = req.body.Hashtag;

    if (!search_tag) {
      return handle_success(res, [], "Tag search completed");
    }

    const { data, error } = await supabase
      .from("content")
      .select("*")
      .ilike("hashtag", `%${search_tag}%`)
      .order("content_id", { ascending: false });

    if (error) throw error;

    handle_success(res, data || [], "Tag search completed");
  } catch (error) {
    handle_error(res, error, "Tag search failed");
  }
});

/**
 * POST /contents/:id/tags
 * @description 특정 콘텐츠의 태그 조회
 * @body {Number} content_id - 콘텐츠 ID
 */
router.post("/get_tags", async (req, res) => {
  try {
    const content_id = req.body.content_id;

    if (!content_id) {
      return handle_error(
        res,
        new Error("Missing content_id"),
        "Content ID is required",
        400,
      );
    }

    const { data, error } = await supabase
      .from("content")
      .select("hashtag")
      .eq("content_id", content_id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return handle_error(res, error, "Content not found", 404);
      }
      throw error;
    }

    // 태그 배열로 변환
    let tags = [];
    if (data && data.hashtag) {
      tags = data.hashtag
        .split(",")
        .map((tag) => ({
          Hashtag: tag.trim(),
        }))
        .filter((item) => item.Hashtag.length > 0);
    }

    handle_success(res, tags, "Tags retrieved successfully");
  } catch (error) {
    handle_error(res, error, "Failed to retrieve tags");
  }
});

module.exports = router;
