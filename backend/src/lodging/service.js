const Lodging = require("./model");
const Room = require("../room/model"); // Room 모델 경로 확인 (src/room/model.js)

// ✅ [복구완료] 날짜 변환 헬퍼 함수
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

exports.getLodgingsService = async (queryData) => {
    const { loc, category, star, hashtag, checkIn, checkOut } = queryData;
    let query = {};

    // ✅ [복구완료] 날짜 필터 로직
    if (checkIn && checkOut) {
        const searchDates = getDatesInRange(checkIn, checkOut);
        
        // 1. 예약 가능한 방 찾기 (unavailableDates에 날짜가 안 겹치는 방)
        const availableRooms = await Room.find({
            "roomNumbers": {
                $elemMatch: {
                    unavailableDates: { $nin: searchDates }
                }
            }
        }).select("lodgingId");

        // 2. 그 방들의 주인(숙소 ID) 추출
        const availableLodgingIds = availableRooms.map(room => room.lodgingId);
        
        // 3. 쿼리에 추가 (이 숙소들만 보여줘!)
        query._id = { $in: availableLodgingIds };
    }

    // 기타 필터들
    if (loc) {
        query.$or = [
            { address: { $regex: loc, $options: 'i' } }, 
            { country: { $regex: loc, $options: 'i' } }
        ];
    }
    if (category) query.category = category;
    if (star) query.starRating = { $gte: Number(star) };
    if (hashtag) query.hashtags = { $in: [hashtag] };

    // 조회
    return await Lodging.find(query);
};

exports.getLodgingDetailService = async (id) => {
    const lodging = await Lodging.findById(id);
    if (!lodging) throw { status: 404, message: "숙소 없음" };
    return lodging;
};