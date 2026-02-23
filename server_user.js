const express = require("express");
const router = express.Router();
const supabase = require("./src/supabase");
const { profile_upload, uploadToSupabase } = require("./src/supabase_multer");

/**
 * 사용자 관련 API
 * Supabase 기반
 */

// 프로필 조회
router.post("/get_profile", async (req, res) => {
  try {
    const user = req.body.user;
    const { data, error } = await supabase
      .from("user")
      .select("*")
      .eq("id", user);

    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({ error: "Failed to get profile" });
  }
});

// 프로필 이미지 업데이트
router.post(
  "/update_profile_img",
  profile_upload.single("img"),
  async (req, res) => {
    try {
      const id = req.session.sign;

      if (!req.file) {
        return res.status(400).json({ error: "No file provided" });
      }

      // Supabase에 이미지 업로드
      const filename = await uploadToSupabase(req.file.buffer, "userprofile");

      // 사용자 테이블 업데이트
      const { error } = await supabase
        .from("user")
        .update({ profilename: filename })
        .eq("id", id);

      if (error) throw error;
      res.json({ success: true, profilename: filename });
    } catch (error) {
      console.error("Update profile image error:", error);
      res.status(500).json({ error: "Failed to update profile image" });
    }
  },
);

// 닉네임 업데이트
router.post("/update_profile_nickname", async (req, res) => {
  try {
    const nickname = req.body.nickname;
    const id = req.session.sign;

    const { error } = await supabase
      .from("user")
      .update({ nickname })
      .eq("id", id);

    if (error) throw error;
    res.json({ success: true });
  } catch (error) {
    console.error("Update nickname error:", error);
    res.status(500).json({ error: "Failed to update nickname" });
  }
});

// 회원가입
router.post("/sign_up", async (req, res) => {
  try {
    const { id, pw: password, name } = req.body;

    if (!id || !password || !name) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // 중복 체크
    const { data: existing } = await supabase
      .from("user")
      .select("id")
      .eq("id", id);

    if (existing && existing.length > 0) {
      return res.json("fail"); // 이미 존재하는 사용자
    }

    // 사용자 생성
    const { error } = await supabase.from("user").insert([
      {
        id,
        password,
        nickname: name,
        profilename: "Anonymous.png",
      },
    ]);

    if (error) {
      console.error("Sign up error:", error);
      res.json("fail");
    } else {
      res.json("success");
    }
  } catch (error) {
    console.error("Sign up error:", error);
    res.json("fail");
  }
});

// 로그인
router.post("/sign_in", async (req, res) => {
  try {
    const { id, pw: password } = req.body;

    if (!id || !password) {
      return res.json("void");
    }

    const { data, error } = await supabase
      .from("user")
      .select("*")
      .eq("id", id)
      .eq("password", password);

    if (error) throw error;

    if (data && data.length > 0) {
      req.session.sign = id;
      res.json("success");
    } else {
      res.json("fail");
    }
  } catch (error) {
    console.error("Sign in error:", error);
    res.json("fail");
  }
});

// 로그아웃
router.post("/sign_out", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Sign out error:", err);
      res.status(500).json({ error: "Failed to sign out" });
    } else {
      res.json("success");
    }
  });
});

// Google 로그인
router.post("/google_sign_in", async (req, res) => {
  try {
    const { id, pw: password, name } = req.body;

    if (!id || !password || !name) {
      return res.json("fail");
    }

    // 기존 사용자 확인
    const { data: existing } = await supabase
      .from("user")
      .select("*")
      .eq("id", id)
      .eq("password", password);

    if (existing && existing.length > 0) {
      // 기존 사용자
      req.session.sign = id;
      res.json("existed");
    } else {
      // 새 사용자 생성
      const { error } = await supabase.from("user").insert([
        {
          id,
          password,
          nickname: name,
          profilename: "Anonymous.png",
        },
      ]);

      if (error) throw error;
      req.session.sign = id;
      res.json("success");
    }
  } catch (error) {
    console.error("Google sign in error:", error);
    res.json("fail");
  }
});

// 현재 인증된 사용자 조회
router.post("/get_auth", (req, res) => {
  if (req.session.sign) {
    res.json(req.session.sign);
  } else {
    res.json(null);
  }
});

module.exports = router;

router.post("/sign_in", (req, res) => {
  const id = req.body.id;
  const password = req.body.pw;

  if (id && password) {
    const sql = "SELECT * FROM user WHERE id = ? AND password = ?";
    sql_pool.query(sql, [id, password], (err, result) => {
      if (err) throw err;
      if (result.length > 0) {
        req.session.sign = id;
        res.send("success");
      } else res.send("fail");
    });
  } else res.send("void");
});

router.post("/sign_out", (req, res) => {
  req.session.destroy(function (err) {
    if (err) throw err;
    else res.send("success");
  });
});

router.post("/google_sign_in", (req, res) => {
  const id = req.body.id;
  const password = req.body.pw;
  const name = req.body.name;

  if (id && password && name) {
    let sql = "SELECT * FROM user WHERE id = ? AND password = ?";
    sql_pool.query(sql, [id, password], (err, result) => {
      if (err) throw err;
      if (result.length > 0) {
        req.session.sign = id;
        res.send("success");
      } else {
        let sql = "INSERT INTO user VALUES(?, ?, ?)";
        sql_pool.query(sql, [id, password, name], (err, result) => {
          if (err) res.send("fail");
          else {
            req.session.sign = id;
            res.send("success");
          }
        });
      }
    });
  } else res.send("void");
});

router.post("/get_auth", (req, res) => {
  if (req.session.sign) res.send(req.session.sign);
  else res.send("null");
});

router.post("/get_user", (req, res) => {
  const sql = "SELECT * FROM user where id = ?";
  sql_pool.query(sql, [req.session.sign], (err, result) => {
    if (err) throw err;
    else res.send(result);
  });
});

module.exports = router;
