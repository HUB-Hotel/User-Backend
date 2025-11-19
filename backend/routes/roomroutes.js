const express = require("express");
const router = express.Router();
const Room = require("../models/Room");
const Lodging = require("../models/Lodging");

// 1. 객실 등록
router.post("/:lodgingId", async (req, res) => {
  const lodgingId = req.params.lodgingId;
  const newRoom = new Room(req.body);

  try {
    const lodging = await Lodging.findById(lodgingId);
    if (!lodging) {
      return res.status(404).json({ success: false, message: "숙소를 찾을 수 없습니다." });
    }

    newRoom.lodgingId = lodgingId;
    const savedRoom = await newRoom.save();

    // [통일된 응답]
    res.status(200).json({
      success: true,
      message: "객실이 등록되었습니다.",
      data: savedRoom
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 2. 객실 목록 조회
router.get("/:lodgingId", async (req, res) => {
  try {
    const rooms = await Room.find({ lodgingId: req.params.lodgingId });

    // [통일된 응답]
    res.status(200).json({
      success: true,
      message: rooms.length === 0 ? "등록된 객실이 없습니다." : `${rooms.length}개의 객실을 불러왔습니다.`,
      data: rooms
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 3. 객실 수정
router.put("/update/:roomId", async (req, res) => {
  try {
    const updatedRoom = await Room.findByIdAndUpdate(
      req.params.roomId, { $set: req.body }, { new: true }
    );
    res.status(200).json({
      success: true,
      message: "객실 정보가 수정되었습니다.",
      data: updatedRoom
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 4. 객실 삭제
router.delete("/:roomId", async (req, res) => {
  try {
    await Room.findByIdAndDelete(req.params.roomId);
    res.status(200).json({
      success: true,
      message: "객실이 삭제되었습니다.",
      data: null // 삭제했으니 데이터는 없음
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;