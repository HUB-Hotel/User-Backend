const express = require("express");
const router = express.Router();
const controller = require("./controller");
const { verifyToken } = require("../common/authMiddleware");

// 찜 목록 조회
router.get("/", verifyToken, controller.getMyBookmarks);

// ✅ [수정] 찜 추가 (POST /api/bookmarks) - body에 lodgingId
router.post("/", verifyToken, controller.addBookmark);

// ✅ [수정] 찜 삭제 (DELETE /api/bookmarks/:lodgingId) - param에 lodgingId
router.delete("/:lodgingId", verifyToken, controller.removeBookmark);

module.exports = router;