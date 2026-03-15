/**
 * 콘텐츠 라우트
 * @description 콘텐츠 조회, 생성, 수정, 삭제
 */

const express = require("express");
const router = express.Router();
const multer = require("multer");
const supabase = require("../config/supabase");
const {
  authenticate_user,
  authenticate_optional,
} = require("../middleware/auth");
const { handle_error, handle_success } = require("../handlers/errorHandler");
const { upload_file_to_storage } = require("../utils/storage");

const memory_storage = multer.memoryStorage();
const upload_content = multer({
  storage: memory_storage,
  limits: { fileSize: 50 * 1024 * 1024 },
});

/**
 * POST /contents
 * @description 모든 콘텐츠 조회 (페이지네이션)
 * @body {Number} id - 오프셋 (기본값: 0)
 * @body {Number} count - 로드할 아이템 개수 (기본값: 20)
 */
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

    handle_success(res, data || [], "Contents retrieved successfully");
  } catch (error) {
    handle_error(res, error, "Failed to retrieve contents");
  }
});

/**
 * POST /contents/:id
 * @description 특정 콘텐츠 조회
 * @body {Number} content_id - 콘텐츠 ID
 */
router.post("/get_content", async (req, res) => {
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
      .select("*")
      .eq("content_id", content_id)
      .single();

    if (error && error.code === "PGRST116") {
      return handle_error(res, error, "Content not found", 404);
    }

    if (error) throw error;

    handle_success(res, data ? [data] : [], "Content retrieved successfully");
  } catch (error) {
    handle_error(res, error, "Failed to retrieve content");
  }
});

/**
 * POST /users/:user_id/contents
 * @description 특정 사용자의 콘텐츠 조회
 * @body {String} id - 사용자 ID
 */
router.post("/get_usercontent", async (req, res) => {
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
      .from("content")
      .select("*")
      .eq("id", user_id)
      .order("content_id", { ascending: false });

    if (error) throw error;

    handle_success(res, data || [], "User contents retrieved successfully");
  } catch (error) {
    handle_error(res, error, "Failed to retrieve user contents");
  }
});

/**
 * POST /contents (create)
 * @description 콘텐츠 생성
 * @body {File} img - 콘텐츠 이미지
 * @body {String} message - 해시태그 메시지
 */
router.post(
  "/insert_content",
  authenticate_user,
  upload_content.single("img"),
  async (req, res) => {
    try {
      const user_id = req.current_user_id;
      const message = req.body.message || "";

      if (!req.file) {
        return handle_error(
          res,
          new Error("No file"),
          "Image file is required",
          400,
        );
      }

      try {
        // 파일 업로드
        const file_path = await upload_file_to_storage(
          req.file.buffer,
          "content_images",
          "contents",
        );

        // 콘텐츠 데이터베이스 저장
        const { error: insert_error } = await supabase.from("content").insert([
          {
            id: user_id,
            filename: file_path,
            hashtag: message,
            created_at: new Date().toISOString(),
          },
        ]);

        if (insert_error) throw insert_error;

        handle_success(res, null, "Content created successfully", 201);
      } catch (upload_error) {
        return handle_error(res, upload_error, "Content upload failed", 400);
      }
    } catch (error) {
      handle_error(res, error, "Failed to create content");
    }
  },
);

/**
 * DELETE /contents/:id
 * @description 콘텐츠 삭제
 * @body {Number} content_id - 콘텐츠 ID
 */
router.post("/content_delete", authenticate_user, async (req, res) => {
  try {
    const content_id = req.body.content_id;
    const current_user_id = req.current_user_id;

    if (!content_id) {
      return handle_error(
        res,
        new Error("Missing content_id"),
        "Content ID is required",
        400,
      );
    }

    // 콘텐츠 소유자 확인
    const { data: content, error: fetch_error } = await supabase
      .from("content")
      .select("id")
      .eq("content_id", content_id)
      .single();

    if (fetch_error) throw fetch_error;

    if (!content || content.id !== current_user_id) {
      return handle_error(
        res,
        new Error("Unauthorized"),
        "You can only delete your own content",
        403,
      );
    }

    // 콘텐츠 삭제
    const { error: delete_error } = await supabase
      .from("content")
      .delete()
      .eq("content_id", content_id);

    if (delete_error) throw delete_error;

    handle_success(res, null, "Content deleted successfully");
  } catch (error) {
    handle_error(res, error, "Failed to delete content");
  }
});

/**
 * PUT /contents/:id
 * @description 콘텐츠 수정
 * @body {Number} content_id - 콘텐츠 ID
 * @body {String} message - 새 해시태그 메시지
 */
router.post("/content_update", authenticate_user, async (req, res) => {
  try {
    const content_id = req.body.content_id;
    const message = req.body.message;
    const current_user_id = req.current_user_id;

    if (!content_id) {
      return handle_error(
        res,
        new Error("Missing content_id"),
        "Content ID is required",
        400,
      );
    }

    // 콘텐츠 소유자 확인
    const { data: content, error: fetch_error } = await supabase
      .from("content")
      .select("id")
      .eq("content_id", content_id)
      .single();

    if (fetch_error) throw fetch_error;

    if (!content || content.id !== current_user_id) {
      return handle_error(
        res,
        new Error("Unauthorized"),
        "You can only update your own content",
        403,
      );
    }

    // 콘텐츠 업데이트
    const { error: update_error } = await supabase
      .from("content")
      .update({ hashtag: message || "" })
      .eq("content_id", content_id);

    if (update_error) throw update_error;

    handle_success(res, null, "Content updated successfully");
  } catch (error) {
    handle_error(res, error, "Failed to update content");
  }
});

/**
 * POST /search
 * @description 콘텐츠 검색
 * @body {String} searchbox - 검색어
 */
router.post("/search", async (req, res) => {
  try {
    const search_keyword = req.body.searchbox;

    if (!search_keyword) {
      return handle_success(res, [], "Search completed");
    }

    const { data, error } = await supabase
      .from("content")
      .select("*")
      .ilike("hashtag", `%${search_keyword}%`)
      .order("content_id", { ascending: false });

    if (error) throw error;

    handle_success(res, data || [], "Search completed");
  } catch (error) {
    handle_error(res, error, "Search failed");
  }
});

module.exports = router;
