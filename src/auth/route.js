const express = require("express");
const router = express.Router();
const controller = require("./controller");
const { verifyToken } = require("../common/authMiddleware");
const passport = require("passport");

router.post("/register", controller.register);
router.post("/login", controller.login);
router.post("/logout", controller.logout);
router.get("/me", verifyToken, controller.getMe);
router.patch("/me", verifyToken, controller.updateMe);

// ==========================================
// 1. 구글 로그인
// ==========================================
router.get('/google', passport.authenticate('google', {
    scope: ['profile', 'email'],
    prompt: 'select_account' // ✅ [추가 추천] 구글 계정 선택 화면 강제
}));

router.get('/google/callback',
    passport.authenticate('google', { session: false }),
    controller.googleCallback
);

// ==========================================
// 2. 카카오 로그인 (▼▼▼ 여기 추가하세요 ▼▼▼)
// ==========================================
router.get('/kakao', passport.authenticate('kakao', { 
    prompt: 'login' // ✅ 최신 카카오 API 표준: 무조건 ID/PW 입력창 띄우기
}));

router.get('/kakao/callback',
    passport.authenticate('kakao', { session: false }),
    controller.kakaoCallback
);

// 비밀번호 찾기 (초기화)
router.post("/forgot-password", controller.resetPassword);

module.exports = router;