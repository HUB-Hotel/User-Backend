const Lodging = require("./model");
const Room = require("../room/model");
const Booking = require("../booking/model");

exports.getLodgingsService = async (queryData) => {
    const { loc, category, star, hashtag, checkIn, checkOut } = queryData;
    let query = {};

    // 날짜 필터 (그대로 유지)
    if (checkIn && checkOut) {
        const start = new Date(checkIn);
        const end = new Date(checkOut);
        const conflictBookings = await Booking.find({
            status: { $ne: "cancelled" },
            $or: [
                { checkIn: { $lte: start }, checkOut: { $gt: start } },
                { checkIn: { $lt: end }, checkOut: { $gte: end } },
                { checkIn: { $gte: start }, checkOut: { $lte: end } }
            ]
        }).select("roomId");

        const bookingCounts = {};
        conflictBookings.forEach(b => {
            const rId = b.roomId.toString();
            bookingCounts[rId] = (bookingCounts[rId] || 0) + 1;
        });

        const allRooms = await Room.find({ status: 'active' }).select("lodgingId countRoom");

        const availableLodgingIds = allRooms
            .filter(room => {
                const bookedCount = bookingCounts[room._id.toString()] || 0;
                return room.countRoom > bookedCount;
            })
            .map(room => room.lodgingId);

        query._id = { $in: availableLodgingIds };
    }

    // 🚩 [수정됨] 주소 검색
    if (loc) {
        query.$or = [
            { address: { $regex: loc, $options: 'i' } },
            { country: { $regex: loc, $options: 'i' } },
            { lodgingName: { $regex: loc, $options: 'i' } } // name -> lodgingName 변경
        ];
    }

    if (category) query.category = category;
    if (star) query.starRating = { $gte: Number(star) };

    // 🚩 [수정됨] 해시태그 검색 (hashtags -> hashtag)
    if (hashtag) query.hashtag = { $in: [hashtag] };

    // 조회
    return await Lodging.find(query);
};

exports.getLodgingDetailService = async (id) => {
    const lodging = await Lodging.findById(id);
    if (!lodging) throw { status: 404, message: "숙소 없음" };

    // (만약 Amenity 모델이 있다면 여기서 populate('amenityId')를 해야 함)
    return lodging;
};