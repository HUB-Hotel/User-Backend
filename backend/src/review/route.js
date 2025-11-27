const express = require("express");
const router = express.Router();
const controller = require("./controller");
const { verifyToken } = require("../common/authMiddleware");

// POST /api/reviews (작성)
router.post("/", verifyToken, controller.createReview);

// GET /api/reviews/me (내 리뷰)
router.get("/me", verifyToken, controller.getMyReviews);

// GET /api/reviews/:lodgingId (숙소 리뷰 - 공개)
router.get("/:lodgingId", controller.getLodgingReviews);

module.exports = router;