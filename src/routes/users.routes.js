/**
 * 사용자 라우트
 * @description 프로필 조회, 프로필 수정
 */

const express = require("express");
const router = express.Router();
const multer = require("multer");
const supabase = require("../config/supabase");
const { authenticate_user } = require("../middleware/auth");
const { handle_error, handle_success } = require("../handlers/errorHandler");
const { upload_file_to_storage } = require("../utils/storage");

// 메모리 기반 파일 업로드
const memory_storage = multer.memoryStorage();
const upload_profile = multer({
  storage: memory_storage,
  limits: { fileSize: 10 * 1024 * 1024 },
});

/**
 * POST /users/:user_id/profile
 * @description 특정 사용자의 프로필 조회
 * @param {String} user_id - 사용자 ID (query 또는 body)
 */
router.post("/get_profile", async (req, res) => {
  try {
    const target_user_id = req.body.user;

    if (!target_user_id) {
      return handle_error(
        res,
        new Error("Missing user_id"),
        "User ID is required",
        400,
      );
    }

    const { data: user_profile, error } = await supabase
      .from("user")
      .select("*")
      .eq("id", target_user_id)
      .single();

    if (error && error.code === "PGRST116") {
      return handle_error(res, error, "User not found", 404);
    }

    if (error) throw error;

    // 민감한 정보 제거
    if (user_profile) {
      delete user_profile.password;
    }

    handle_success(
      res,
      user_profile ? [user_profile] : [],
      "Profile retrieved successfully",
    );
  } catch (error) {
    handle_error(res, error, "Failed to retrieve profile");
  }
});

/**
 * POST /users/profile
 * @description 현재 사용자의 프로필 수정
 * @body {File} img - 프로필 이미지
 * @body {String} nickname - 닉네임
 */
router.post(
  "/update_profile",
  authenticate_user,
  upload_profile.single("img"),
  async (req, res) => {
    try {
      const current_user_id = req.current_user_id;
      const { nickname } = req.body;
      const update_data = {};

      // 프로필 이미지 업로드
      if (req.file) {
        try {
          const file_path = await upload_file_to_storage(
            req.file.buffer,
            "user_profiles",
            "profiles",
          );
          update_data.profilename = file_path;
        } catch (upload_error) {
          return handle_error(
            res,
            upload_error,
            "Profile image upload failed",
            400,
          );
        }
      }

      // 닉네임 업데이트
      if (nickname) {
        update_data.nickname = nickname;
      }

      if (Object.keys(update_data).length === 0) {
        return handle_error(
          res,
          new Error("No data to update"),
          "Please provide image or nickname",
          400,
        );
      }

      const { error: update_error } = await supabase
        .from("user")
        .update(update_data)
        .eq("id", current_user_id);

      if (update_error) throw update_error;

      handle_success(res, update_data, "Profile updated successfully");
    } catch (error) {
      handle_error(res, error, "Failed to update profile");
    }
  },
);

/**
 * POST /users/profile/nickname
 * @description 닉네임 수정
 * @body {String} nickname - 새 닉네임
 */
router.post("/update_profile_nickname", authenticate_user, async (req, res) => {
  try {
    const current_user_id = req.current_user_id;
    const { nickname } = req.body;

    if (!nickname) {
      return handle_error(
        res,
        new Error("Missing nickname"),
        "Nickname is required",
        400,
      );
    }

    const { error } = await supabase
      .from("user")
      .update({ nickname })
      .eq("id", current_user_id);

    if (error) throw error;

    handle_success(res, null, "Nickname updated successfully");
  } catch (error) {
    handle_error(res, error, "Failed to update nickname");
  }
});

/**
 * POST /users/profile/image
 * @description 프로필 이미지 수정
 * @body {File} img - 프로필 이미지
 */
router.post(
  "/update_profile_img",
  authenticate_user,
  upload_profile.single("img"),
  async (req, res) => {
    try {
      const current_user_id = req.current_user_id;

      if (!req.file) {
        return handle_error(
          res,
          new Error("No file"),
          "Image file is required",
          400,
        );
      }

      try {
        const file_path = await upload_file_to_storage(
          req.file.buffer,
          "user_profiles",
          "profiles",
        );

        const { error } = await supabase
          .from("user")
          .update({ profilename: file_path })
          .eq("id", current_user_id);

        if (error) throw error;

        handle_success(
          res,
          { profilename: file_path },
          "Profile image updated successfully",
        );
      } catch (upload_error) {
        return handle_error(
          res,
          upload_error,
          "Profile image upload failed",
          400,
        );
      }
    } catch (error) {
      handle_error(res, error, "Failed to update profile image");
    }
  },
);

module.exports = router;
