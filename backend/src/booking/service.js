const Booking = require("./model");
// 🚨 수정됨: Room 모델의 위치는 '../room/model' 입니다.
const Room = require("../room/model"); 

// 날짜 계산 함수
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

// 1. 예약 생성 서비스
exports.createBookingService = async (userId, data) => {
  const { lodgingId, roomId, roomNumber, checkIn, checkOut, price, userName, userPhone, paymentKey, paymentAmount } = data;
  const allDates = getDatesInRange(checkIn, checkOut);

  // (1) 방 확인
  const room = await Room.findById(roomId);
  if (!room) throw { message: "객실을 찾을 수 없습니다.", status: 404 };

  // (2) 중복 검사
  const targetRoomNumber = room.roomNumbers.find((r) => r.number === Number(roomNumber));
  if (!targetRoomNumber) throw { message: "존재하지 않는 방 번호입니다.", status: 404 }; // 방 번호 없을 때 예외처리 추가

  const isUnavailable = targetRoomNumber.unavailableDates.some((date) => {
    return allDates.some((requestedDate) => new Date(date).getTime() === requestedDate.getTime());
  });

  if (isUnavailable) throw { message: "이미 예약된 날짜가 포함되어 있습니다.", status: 400 };

  // (3) 방 날짜 차단
  await Room.updateOne(
    { _id: roomId, "roomNumbers.number": roomNumber },
    { $push: { "roomNumbers.$.unavailableDates": allDates } }
  );

  // (4) 예약 생성
  const newBooking = await Booking.create({
    userId, lodgingId, roomId, roomNumber, userName, userPhone, checkIn, checkOut, price,
    stayDates: allDates, status: "booked", paymentKey, paymentAmount
  });

  return newBooking;
};

// 2. 내 예약 목록 서비스
exports.getMyBookingsService = async (userId) => {
  return await Booking.find({ userId })
    .populate("lodgingId", "name address")
    .populate("roomId", "title");
};

// 3. 예약 취소 서비스
exports.cancelBookingService = async (bookingId, userId) => {
  const booking = await Booking.findById(bookingId);
  if (!booking) throw { message: "예약이 없습니다.", status: 404 };
  
  // userId를 String으로 변환해서 비교해야 안전함
  if (booking.userId.toString() !== userId) throw { message: "권한이 없습니다.", status: 403 };

  // 날짜 차단 해제
  await Room.updateOne(
    { _id: booking.roomId, "roomNumbers.number": booking.roomNumber },
    { $pull: { "roomNumbers.$.unavailableDates": { $in: booking.stayDates } } }
  );

  booking.status = "cancelled";
  await booking.save();
  return null;
};