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
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/google/callback',
    passport.authenticate('google', { session: false }),
    controller.googleCallback
);

// ==========================================
// 2. 카카오 로그인 (▼▼▼ 여기 추가하세요 ▼▼▼)
// ==========================================
router.get('/kakao', passport.authenticate('kakao'));
router.get('/kakao/callback',
    passport.authenticate('kakao', { session: false }),
    controller.kakaoCallback
);

module.exports = router;