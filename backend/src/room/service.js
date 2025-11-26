const Room = require("./model");

exports.getRoomsByLodgingService = async (lodgingId) => {
    return await Room.find({ lodgingId });
};