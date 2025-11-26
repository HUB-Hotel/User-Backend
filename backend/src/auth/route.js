const express = require("express");
const router = express.Router();
const controller = require("./controller");
const { verifyToken } = require("../common/authMiddleware");
const passport = require("passport");

router.post("/register", controller.register);
router.post("/login", controller.login);
router.get("/me", verifyToken, controller.getMe);
router.patch("/me", verifyToken, controller.updateMe);

// 소셜 로그인
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

// ✅ 수정됨: 콜백 로직을 컨트롤러로 연결
router.get('/google/callback', 
    passport.authenticate('google', { session: false }), 
    controller.googleCallback
);

module.exports = router;