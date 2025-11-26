const express = require("express");
const router = express.Router();
const Booking = require("../../backend/models/Booking"); // 모델 이름 변경
const Room = require("../../backend/models/Room");
const { authenticateToken } = require("../../backend/middlewares/auth");

// [날짜 변환 함수]
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

// 1. 예약하기 (Create)
// POST /api/bookings
router.post("/", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { lodgingId, roomId, roomNumber, checkIn, checkOut, price, userName, userPhone, paymentKey, paymentAmount } = req.body;

    const allDates = getDatesInRange(checkIn, checkOut);

    // (1) 방 찾기
    const room = await Room.findById(roomId);
    if (!room) return res.status(404).json({ success: false, message: "객실을 찾을 수 없습니다." });

    // (2) 중복 검사
    const targetRoomNumber = room.roomNumbers.find(r => r.number === Number(roomNumber));
    const isUnavailable = targetRoomNumber.unavailableDates.some(date => {
        return allDates.some(requestedDate => new Date(date).getTime() === requestedDate.getTime());
    });

    if (isUnavailable) {
      return res.status(400).json({ success: false, message: "이미 예약된 날짜가 포함되어 있습니다." });
    }

    // (3) 방 날짜 차단 (X표)
    await Room.updateOne(
      { _id: roomId, "roomNumbers.number": roomNumber },
      { $push: { "roomNumbers.$.unavailableDates": allDates } }
    );

    // (4) Booking 생성
    const newBooking = new Booking({
      userId, lodgingId, roomId, roomNumber, userName, userPhone, checkIn, checkOut, price,
      stayDates: allDates,
      status: "booked",
      paymentKey,       // 추가됨
      paymentAmount     // 추가됨
    });

    const savedBooking = await newBooking.save();

    res.status(200).json({
        success: true,
        message: "예약이 확정되었습니다!",
        data: savedBooking
    });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 2. 내 예약 목록 (Read)
// GET /api/bookings/me
router.get("/me", authenticateToken, async (req, res) => {
    try {
        const bookings = await Booking.find({ userId: req.user.id })
            .populate("lodgingId", "name address")
            .populate("roomId", "title");
            
        res.status(200).json({
            success: true,
            message: bookings.length === 0 ? "예약 내역이 없습니다." : "예약 내역을 불러왔습니다.",
            data: bookings
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// 3. 예약 취소 (Cancel)
// PATCH /api/bookings/cancel/:id
router.patch("/cancel/:id", authenticateToken, async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);
        if(!booking) return res.status(404).json({ success: false, message: "예약이 없습니다." });

        if(booking.userId.toString() !== req.user.id) {
            return res.status(403).json({ success: false, message: "권한이 없습니다." });
        }

        // 날짜 차단 해제
        await Room.updateOne(
            { _id: booking.roomId, "roomNumbers.number": booking.roomNumber },
            { $pull: { "roomNumbers.$.unavailableDates": { $in: booking.stayDates } } }
        );

        booking.status = "cancelled";
        await booking.save();

        res.status(200).json({
            success: true,
            message: "예약이 정상적으로 취소되었습니다.",
            data: null
        });

    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;