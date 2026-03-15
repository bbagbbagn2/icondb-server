/**
 * 인증 미들웨어
 * @description 세션 기반 인증 검증
 */

const authenticate_user = (req, res, next) => {
  try {
    if (!req.session || !req.session.user_id) {
      return res.status(401).json({
        status: "error",
        message: "Unauthorized. Please login first.",
        code: "AUTH_REQUIRED",
      });
    }

    // 요청 객체에 현재 사용자 ID 추가
    req.current_user_id = req.session.user_id;
    next();
  } catch (error) {
    console.error("[Auth Middleware Error]", error);
    res.status(500).json({
      status: "error",
      message: "Authentication check failed",
      code: "AUTH_ERROR",
    });
  }
};

/**
 * 선택적 인증 미들웨어
 * @description 있으면 user_id를 추가하고 없으면 진행
 */
const authenticate_optional = (req, res, next) => {
  try {
    if (req.session && req.session.user_id) {
      req.current_user_id = req.session.user_id;
    }
    next();
  } catch (error) {
    console.error("[Optional Auth Middleware Error]", error);
    next();
  }
};

module.exports = {
  authenticate_user,
  authenticate_optional,
};
