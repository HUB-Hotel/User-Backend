const express = require("express");
const router = express.Router();
const Room = require("../models/Room");

// ============================================================
// 특정 숙소의 객실 목록 가져오기 (Read Only)
// GET /api/rooms/:lodgingId
// ============================================================
router.get("/:lodgingId", async (req, res) => {
  try {
    const rooms = await Room.find({ lodgingId: req.params.lodgingId });

    res.status(200).json({
      success: true,
      message: rooms.length === 0 ? "현재 등록된 객실이 없습니다." : `${rooms.length}개의 객실을 불러왔습니다.`,
      data: rooms
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;