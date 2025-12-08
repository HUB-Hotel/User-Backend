const Booking = require("./model");
const Room = require("../room/model");
const Lodging = require("../lodging/model");

// 1. 예약 생성 (그대로 유지)
exports.createBookingService = async (userId, data) => {
    const { lodgingId, roomId, checkIn, checkOut, price, userName, userPhone, paymentKey, paymentAmount } = data;

    console.log(`👉 [Service] Room 조회 시도. lodgingId: ${lodgingId}, roomId: ${roomId}`);

    // lodgingId가 MongoDB ObjectId 형식인지 확인
    const isLodgingIdValid = /^[0-9a-fA-F]{24}$/.test(lodgingId);
    let actualLodgingId = lodgingId;
    
    // 숫자 lodgingId인 경우, Lodging을 조회해서 실제 ObjectId 찾기
    if (!isLodgingIdValid) {
        try {
            const lodgings = await Lodging.find().sort({ createdAt: 1 });
            const lodgingIndex = parseInt(lodgingId) - 1;
            
            if (lodgingIndex >= 0 && lodgingIndex < lodgings.length) {
                actualLodgingId = lodgings[lodgingIndex]._id;
                console.log(`👉 [Service] 숫자 lodgingId ${lodgingId}를 ObjectId ${actualLodgingId}로 변환`);
            }
        } catch (err) {
            console.error("Lodging 조회 실패:", err);
        }
    }

    let room;
    let actualRoomId = roomId;
    
    // roomId가 MongoDB ObjectId 형식인지 확인 (24자리 hex 문자열)
    const isRoomIdValid = /^[0-9a-fA-F]{24}$/.test(roomId);
    
    if (isRoomIdValid) {
        // ObjectId 형식이면 직접 조회
        room = await Room.findById(roomId);
        actualRoomId = roomId;
    } else {
        // 숫자 ID인 경우, 해당 lodgingId의 rooms를 조회해서 인덱스로 찾기
        const rooms = await Room.find({ lodgingId: actualLodgingId }).sort({ createdAt: 1 });
        const roomIndex = parseInt(roomId) - 1; // roomId가 1부터 시작한다고 가정
        
        if (roomIndex >= 0 && roomIndex < rooms.length) {
            room = rooms[roomIndex];
            actualRoomId = room._id; // 실제 ObjectId 저장
            console.log(`👉 [Service] 숫자 roomId ${roomId}를 ObjectId ${actualRoomId}로 변환`);
        } else {
            room = null;
        }
    }

    console.log("👉 [Service] DB에서 찾은 Room 정보:", room);

    if (!room) {
        throw { message: `객실 정보를 찾을 수 없습니다. (roomId: ${roomId})`, status: 404 };
    }

    const totalStock = room.countRoom;

    console.log(`👉 [Service] 날짜 변환 확인. CheckIn: ${new Date(checkIn)}, CheckOut: ${new Date(checkOut)}`);

    const existingBookingsCount = await Booking.countDocuments({
        roomId: actualRoomId, // 실제 ObjectId 사용
        status: { $ne: "cancelled" },
        $or: [
            { checkIn: { $lte: new Date(checkIn) }, checkOut: { $gt: new Date(checkIn) } },
            { checkIn: { $lt: new Date(checkOut) }, checkOut: { $gte: new Date(checkOut) } },
            { checkIn: { $gte: new Date(checkIn) }, checkOut: { $lte: new Date(checkOut) } }
        ]
    });

    console.log(`👉 [Service] 예약된 수: ${existingBookingsCount}, 전체 재고: ${totalStock}`);

    if (existingBookingsCount >= totalStock) {
        throw { message: "선택하신 날짜에 객실이 모두 예약되었습니다.", status: 400 };
    }

    const newBooking = await Booking.create({
        userId, 
        lodgingId: actualLodgingId, // 실제 ObjectId 사용
        roomId: actualRoomId, // 실제 ObjectId 사용
        userName, userPhone, checkIn, checkOut, price,
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
    if (!booking) throw { message: "예약 정보를 찾을 수 없습니다.", status: 404 };
    
    // userId가 ObjectId 객체일 수 있으므로 문자열로 변환 후 비교
    if (booking.userId.toString() !== userId.toString()) {
        throw { message: "예약을 취소할 권한이 없습니다.", status: 403 };
    }

    booking.status = "cancelled";
    await booking.save();
    return null;
};