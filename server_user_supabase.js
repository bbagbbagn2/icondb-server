const express = require("express");
const router = express.Router();
const supabase = require("./src/supabase");
const profile_upload = require("./src/aws_multer").profile_upload;

// 프로필 조회
router.post("/get_profile", async (req, res) => {
  try {
    const user = req.body.user;
    const { data, error } = await supabase
      .from("user")
      .select("*")
      .eq("id", user);

    if (error) throw error;
    res.send(data);
  } catch (error) {
    console.error("Error fetching profile:", error);
    res.status(400).send({ error: error.message });
  }
});

// 프로필 이미지 업데이트
router.post(
  "/update_profile_img",
  profile_upload.single("img"),
  async (req, res) => {
    try {
      const filename = req.filedirectory;
      const id = req.session.sign;

      const { data, error } = await supabase
        .from("user")
        .update({ profilename: filename })
        .eq("id", id);

      if (error) throw error;
      res.send("success");
    } catch (error) {
      console.error("Error updating profile image:", error);
      res.status(400).send("fail");
    }
  },
);

// 닉네임 업데이트
router.post("/update_profile_nickname", async (req, res) => {
  try {
    const nickname = req.body.nickname;
    const id = req.session.sign;

    const { data, error } = await supabase
      .from("user")
      .update({ nickname: nickname })
      .eq("id", id);

    if (error) throw error;
    res.send("success");
  } catch (error) {
    console.error("Error updating nickname:", error);
    res.status(400).send("fail");
  }
});

// 회원가입
router.post("/sign_up", async (req, res) => {
  try {
    const id = req.body.id;
    const password = req.body.pw;
    const name = req.body.name;

    if (!id || !password || !name) {
      return res.send("void");
    }

    const { data, error } = await supabase
      .from("user")
      .insert([{ id, password, nickname: name }]);

    if (error) throw error;
    res.send("success");
  } catch (error) {
    console.error("Error signing up:", error);
    res.status(400).send("fail");
  }
});

// 로그인
router.post("/sign_in", async (req, res) => {
  try {
    const id = req.body.id;
    const password = req.body.pw;

    if (!id || !password) {
      return res.send("void");
    }

    const { data, error } = await supabase
      .from("user")
      .select("*")
      .eq("id", id)
      .eq("password", password);

    if (error) throw error;

    if (data && data.length > 0) {
      req.session.sign = id;
      res.send("success");
    } else {
      res.send("fail");
    }
  } catch (error) {
    console.error("Error signing in:", error);
    res.status(400).send("fail");
  }
});

// 로그아웃
router.post("/sign_out", (req, res) => {
  try {
    req.session.destroy((err) => {
      if (err) throw err;
      res.send("success");
    });
  } catch (error) {
    console.error("Error signing out:", error);
    res.status(400).send("fail");
  }
});

// 구글 로그인
router.post("/google_sign_in", async (req, res) => {
  try {
    const id = req.body.id;
    const password = req.body.pw;
    const name = req.body.name;

    if (!id || !password || !name) {
      return res.send("void");
    }

    // 이미 존재하는 사용자 확인
    const { data: existingUser, error: selectError } = await supabase
      .from("user")
      .select("*")
      .eq("id", id)
      .eq("password", password);

    if (selectError) throw selectError;

    if (existingUser && existingUser.length > 0) {
      // 기존 사용자 로그인
      req.session.sign = id;
      res.send("success");
    } else {
      // 새 사용자 회원가입
      const { data, error: insertError } = await supabase
        .from("user")
        .insert([{ id, password, nickname: name }]);

      if (insertError) throw insertError;
      req.session.sign = id;
      res.send("success");
    }
  } catch (error) {
    console.error("Error in google sign in:", error);
    res.status(400).send("fail");
  }
});

// 모든 사용자 조회 (테스트용)
router.get("/all_users", async (req, res) => {
  try {
    const { data, error } = await supabase.from("user").select("*");

    if (error) throw error;
    res.send(data);
  } catch (error) {
    console.error("Error fetching all users:", error);
    res.status(400).send({ error: error.message });
  }
});

module.exports = router;
