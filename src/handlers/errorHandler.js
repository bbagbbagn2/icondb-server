/**
 * 에러 응답 핸들러
 * @description 일관된 에러 응답 형식 제공
 */

const handle_error = (res, error, message = "An error occurred", status_code = 500) => {
  console.error("[Error]", error);

  const error_response = {
    status: "error",
    message: message,
    code: error?.code || "INTERNAL_ERROR",
  };

  // 개발 환경에서만 에러 상세정보 포함
  if (process.env.NODE_ENV === "development") {
    error_response.details = error?.message;
  }

  res.status(status_code).json(error_response);
};

/**
 * 성공 응답 포맷
 */
const handle_success = (res, data = null, message = "Success", status_code = 200) => {
  res.status(status_code).json({
    status: "success",
    message: message,
    data: data,
  });
};

module.exports = {
  handle_error,
  handle_success,
};
