const Booking = require("./model");
const Room = require("../room/model");

// 1. 예약 생성 서비스 (재고 카운팅 방식)
exports.createBookingService = async (userId, data) => {
  const { lodgingId, roomId, checkIn, checkOut, price, userName, userPhone, paymentKey, paymentAmount } = data;

  // (1) 방 정보 확인 (총 개수 파악)
  const room = await Room.findById(roomId);
  if (!room) throw { message: "객실을 찾을 수 없습니다.", status: 404 };

  const totalStock = room.countRoom; // 예: 5개

  // (2) [핵심 로직] 해당 날짜에 겹치는 예약이 몇 개인지 셉니다. 🧮
  // 조건: 내 체크인 ~ 체크아웃 기간과 하루라도 겹치는 예약들
  const existingBookingsCount = await Booking.countDocuments({
    roomId: roomId,
    status: { $ne: "cancelled" }, // 취소된 건 제외
    $or: [
      // 1. 기존 예약이 내 체크인 날짜를 포함할 때
      { checkIn: { $lte: new Date(checkIn) }, checkOut: { $gt: new Date(checkIn) } },
      // 2. 기존 예약이 내 체크아웃 날짜를 포함할 때
      { checkIn: { $lt: new Date(checkOut) }, checkOut: { $gte: new Date(checkOut) } },
      // 3. 내 예약이 기존 예약을 완전히 덮어쓸 때
      { checkIn: { $gte: new Date(checkIn) }, checkOut: { $lte: new Date(checkOut) } }
    ]
  });

  // (3) 재고 비교
  if (existingBookingsCount >= totalStock) {
    throw { message: "해당 날짜에 객실이 모두 매진되었습니다.", status: 400 };
  }

  // (4) 예약 생성 (roomNumber 없이)
  const newBooking = await Booking.create({
    userId, lodgingId, roomId, userName, userPhone, checkIn, checkOut, price,
    status: "booked", paymentKey, paymentAmount
  });

  return newBooking;
};

// 2. 내 예약 목록 서비스
exports.getMyBookingsService = async (userId) => {
  return await Booking.find({ userId })
    .populate("lodgingId", "name address") // Lodging 모델의 name, address 가져오기
    .populate("roomId", "roomName"); // Room 모델의 roomName 가져오기
};

// 3. 예약 취소 서비스
exports.cancelBookingService = async (bookingId, userId) => {
  const booking = await Booking.findById(bookingId);
  if (!booking) throw { message: "예약이 없습니다.", status: 404 };
  if (booking.userId.toString() !== userId) throw { message: "권한이 없습니다.", status: 403 };

  // 복잡한 날짜 계산 필요 없이 상태만 바꾸면 끝! (재고가 자동으로 +1 되는 효과)
  booking.status = "cancelled";
  await booking.save();
  return null;
};