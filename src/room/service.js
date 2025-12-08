const Room = require("./model");
const Lodging = require("../lodging/model");

exports.getRoomsByLodgingService = async (lodgingId) => {
    // lodgingId가 MongoDB ObjectId 형식인지 확인 (24자리 hex 문자열)
    const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(lodgingId);
    
    let actualLodgingId = lodgingId;
    
    // 숫자 ID인 경우, Lodging을 조회해서 실제 ObjectId 찾기
    if (!isValidObjectId) {
        try {
            // 숫자 ID로 Lodging 조회 시도 (숫자 ID가 다른 필드에 저장되어 있다고 가정)
            // 또는 모든 Lodging을 조회해서 인덱스로 찾기
            const lodgings = await Lodging.find().sort({ createdAt: 1 });
            const lodgingIndex = parseInt(lodgingId) - 1; // lodgingId가 1부터 시작한다고 가정
            
            if (lodgingIndex >= 0 && lodgingIndex < lodgings.length) {
                actualLodgingId = lodgings[lodgingIndex]._id;
            } else {
                // 찾지 못한 경우 원래 ID 사용 (에러 발생 가능)
                actualLodgingId = lodgingId;
            }
        } catch (err) {
            console.error("Lodging 조회 실패:", err);
            // 에러 발생 시 원래 ID 사용
            actualLodgingId = lodgingId;
        }
    }
    
    // 실제 ObjectId로 Room 조회
    const rooms = await Room.find({ lodgingId: actualLodgingId });
    return rooms;
};