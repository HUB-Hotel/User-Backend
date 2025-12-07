const Booking = require("./model");
const Room = require("../room/model");

// 1. 예약 생성 (그대로 유지)
exports.createBookingService = async (userId, data) => {
    const { lodgingId, roomId, checkIn, checkOut, price, userName, userPhone, paymentKey, paymentAmount } = data;

    console.log(`👉 [Service] Room 조회 시도. ID: ${roomId}`);

    const room = await Room.findById(roomId);

    console.log("👉 [Service] DB에서 찾은 Room 정보:", room);

    if (!room) throw { message: "객실을 찾을 수 없습니다.", status: 404 };

    const totalStock = room.countRoom;

    console.log(`👉 [Service] 날짜 변환 확인. CheckIn: ${new Date(checkIn)}, CheckOut: ${new Date(checkOut)}`);

    const existingBookingsCount = await Booking.countDocuments({
        roomId: roomId,
        status: { $ne: "cancelled" },
        $or: [
            { checkIn: { $lte: new Date(checkIn) }, checkOut: { $gt: new Date(checkIn) } },
            { checkIn: { $lt: new Date(checkOut) }, checkOut: { $gte: new Date(checkOut) } },
            { checkIn: { $gte: new Date(checkIn) }, checkOut: { $lte: new Date(checkOut) } }
        ]
    });

    console.log(`👉 [Service] 예약된 수: ${existingBookingsCount}, 전체 재고: ${totalStock}`);

    if (existingBookingsCount >= totalStock) {
        throw { message: "해당 날짜에 객실이 모두 매진되었습니다.", status: 400 };
    }

    const newBooking = await Booking.create({
        userId, lodgingId, roomId, userName, userPhone, checkIn, checkOut, price,
        status: "confirmed", // 예약 생성 시 바로 확정
        paymentKey, paymentAmount
    });

    console.log("👉 [Service] 예약 생성 완료!");

    return newBooking;
};

// 2. 내 예약 목록 조회 (🚨 여기를 수정했습니다!)
exports.getMyBookingsService = async (userId) => {
    return await Booking.find({ userId })
        .populate("lodgingId") // ✅ 특정 필드만 가져오지 말고 통째로 가져오는 게 안전합니다.
        .populate("roomId")    // ✅ 룸 정보도 통째로 가져옴 (roomName, roomImage 등 필요하니까)
        .sort({ createdAt: -1 }); // 최신순 정렬
};

// 3. 예약 취소 (그대로 유지)
exports.cancelBookingService = async (bookingId, userId) => {
    const booking = await Booking.findById(bookingId);
    if (!booking) throw { message: "예약이 없습니다.", status: 404 };
    
    // userId가 ObjectId 객체일 수 있으므로 문자열로 변환 후 비교
    if (booking.userId.toString() !== userId.toString()) throw { message: "권한이 없습니다.", status: 403 };

    booking.status = "cancelled";
    await booking.save();
    return null;
};