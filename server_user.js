const express = require("express");
const router = express.Router();
const sql_pool = require("./src/mysql");
const profile_upload = require("./src/aws_multer").profile_upload;

router.post("/get_profile", (req, res) => {
  const user = req.body.user;
  const sql = "SELECT * FROM user where id = ?";
  sql_pool.query(sql, [user], (err, result) => {
    if (err) throw err;
    else res.send(result);
  });
});

router.post("/update_profile_img", profile_upload.single("img"), (req, res) => {
  const filename = req.filedirectory;
  const id = req.session.sign;

  const sql = "UPDATE user SET profilename = ? WHERE id = ?";
  sql_pool.query(sql, [filename, id], (err, result) => {
    if (err) throw err;
    else res.send("success");
  });
});

router.post("/update_profile_nickname", (req, res) => {
  const nickname = req.body.nickname;
  const id = req.session.sign;

  const sql = "UPDATE user SET nickname = ? WHERE id = ?";
  sql_pool.query(sql, [nickname, id], (err, result) => {
    if (err) throw err;
    else res.send("success");
  });
});

router.post("/sign_up", (req, res) => {
  const id = req.body.id;
  const password = req.body.pw;
  const name = req.body.name;

  if (id && password && name) {
    const sql = "INSERT INTO user(id, password, nickname) VALUES(?, ?, ?)";
    sql_pool.query(sql, [id, password, name], (err, result) => {
      if (err) res.send("fail");
      else res.send("success");
    });
  } else res.send("void");
});

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
