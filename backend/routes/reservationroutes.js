const express = require("express");
const router = express.Router();
const Reservation = require("../models/Reservation");
const Room = require("../models/Room");
const { authenticateToken } = require("../middlewares/auth");

function getDatesInRange(startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const date = new Date(start.getTime());
  const dates = [];
  while (date < end) {
    dates.push(new Date(date));
    date.setDate(date.getDate() + 1);
  }
  return dates;
}

// 1. 예약하기
router.post("/", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { lodgingId, roomId, roomNumber, checkIn, checkOut, price, userName, userPhone } = req.body;

    const allDates = getDatesInRange(checkIn, checkOut);

    const room = await Room.findById(roomId);
    if (!room) return res.status(404).json({ success: false, message: "객실을 찾을 수 없습니다." });

    const targetRoomNumber = room.roomNumbers.find(r => r.number === Number(roomNumber));

    const isUnavailable = targetRoomNumber.unavailableDates.some(date => {
      return allDates.some(requestedDate => new Date(date).getTime() === requestedDate.getTime());
    });

    if (isUnavailable) {
      return res.status(400).json({ success: false, message: "이미 예약된 날짜가 포함되어 있습니다." });
    }

    await Room.updateOne(
      { _id: roomId, "roomNumbers.number": roomNumber },
      { $push: { "roomNumbers.$.unavailableDates": allDates } }
    );

    const newReservation = new Reservation({
      userId, lodgingId, roomId, roomNumber, userName, userPhone, checkIn, checkOut, price,
      stayDates: allDates, status: "booked"
    });

    const savedReservation = await newReservation.save();

    // [통일된 응답]
    res.status(200).json({
      success: true,
      message: "예약이 확정되었습니다!",
      data: savedReservation
    });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 2. 내 예약 목록
router.get("/me", authenticateToken, async (req, res) => {
  try {
    const reservations = await Reservation.find({ userId: req.user.id })
      .populate("lodgingId", "name address")
      .populate("roomId", "title");

    // [통일된 응답]
    res.status(200).json({
      success: true,
      message: reservations.length === 0 ? "예약 내역이 없습니다." : "예약 내역을 불러왔습니다.",
      data: reservations
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 3. 예약 취소
router.patch("/cancel/:id", authenticateToken, async (req, res) => {
  try {
    const reservation = await Reservation.findById(req.params.id);
    if (!reservation) return res.status(404).json({ success: false, message: "예약이 없습니다." });

    if (reservation.userId.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: "권한이 없습니다." });
    }

    await Room.updateOne(
      { _id: reservation.roomId, "roomNumbers.number": reservation.roomNumber },
      { $pull: { "roomNumbers.$.unavailableDates": { $in: reservation.stayDates } } }
    );

    reservation.status = "cancelled";
    await reservation.save();

    // [통일된 응답]
    res.json({
      success: true,
      message: "예약이 정상적으로 취소되었습니다.",
      data: null
    });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;