const jwt = require("jsonwebtoken");
const { errorResponse } = require("./response");

// 1. [인증] 로그인 여부 확인 (기존 코드)
exports.verifyToken = (req, res, next) => {
  try {
    let token = null;
    const authHeader = req.headers.authorization;

    // 헤더에서 토큰 추출 (Bearer ...)
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    }
    // 쿠키에서 토큰 추출 (백업)
    if (!token && req.cookies?.token) {
      token = req.cookies.token;
    }

    // 토큰 없으면 401 (누구세요?)
    if (!token) return res.status(401).json(errorResponse("로그인이 필요합니다.", 401));

    // 토큰 검증
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // ▼▼▼ [추가하면 좋은 로직] ▼▼▼
    // 토큰은 유효해도, 실제 DB에서 정지된 유저인지 한 번 더 체크
    // (이걸 하려면 User 모델을 require 해야 함)
    // const User = require("../auth/model");
    // const currentUser = await User.findById(decoded.id);
    // if (!currentUser || !currentUser.isActive) {
    //    return res.status(401).json(errorResponse("정지된 계정입니다.", 401));
    // }

    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json(errorResponse("유효하지 않은 토큰입니다.", 401));
  }
};

// 2. [인가] 권한 체크 (새로 추가된 부분!) ⭐
// 사용법: router.get(..., verifyToken, requireRole("admin"), ...)
exports.requireRole = (role) => {
  return (req, res, next) => {
    // verifyToken을 먼저 거쳤기 때문에 req.user가 있음
    if (!req.user || req.user.role !== role) {
      // 역할이 다르면 403 (들어오지 마!)
      return res.status(403).json(errorResponse("접근 권한이 없습니다.", 403));
    }
    next();
  };
};