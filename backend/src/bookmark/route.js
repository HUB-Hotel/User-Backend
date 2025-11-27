const express = require("express");
const router = express.Router();
const controller = require("./controller");
const { verifyToken } = require("../common/authMiddleware");

// POST /api/bookmarks/:lodgingId (토글)
router.post("/:lodgingId", verifyToken, controller.toggleBookmark);

// GET /api/bookmarks (목록)
router.get("/", verifyToken, controller.getMyBookmarks);

module.exports = router;