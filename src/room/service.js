const Room = require("./model");

exports.getRoomsByLodgingService = async (lodgingId) => {
    // lodgingId가 DB에 있는 방들을 찾아서 반환합니다.
    // Mongoose가 알아서 string ID를 ObjectId로 변환해서 검색해줍니다.
    const rooms = await Room.find({ lodgingId: lodgingId });
    return rooms;
};