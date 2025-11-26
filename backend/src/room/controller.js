const service = require("./service");
const { successResponse, errorResponse } = require("../common/response");

exports.getRooms = async (req, res) => {
    try {
        const data = await service.getRoomsByLodgingService(req.params.lodgingId);
        res.status(200).json(successResponse(data));
    } catch (err) {
        res.status(500).json(errorResponse(err.message, 500));
    }
};