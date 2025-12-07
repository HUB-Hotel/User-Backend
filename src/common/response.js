// 성공했을 때 쓰는 포장지
exports.successResponse = (data, message = "SUCCESS", code = 200) => {
  return {
    data,         // 실제 데이터 (객체, 배열 등)
    message,      // 성공 메시지
    resultCode: code, // HTTP 상태 코드 (200, 201 등)
    success: true
  };
};

// 실패했을 때 쓰는 포장지
exports.errorResponse = (message = "FAIL", code = 400, data = null) => {
  return {
    data,         // 에러일 땐 보통 null이지만, 필요하면 넣음
    message,      // 에러 메시지 (예: "로그인 실패")
    resultCode: code, // 에러 코드 (400, 404, 500 등)
  };
};