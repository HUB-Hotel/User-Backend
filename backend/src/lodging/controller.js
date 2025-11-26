const service = require("./service");
const { successResponse, errorResponse } = require("../common/response");

exports.getLodgings = async (req, res) => {
    try {
        const data = await service.getLodgingsService(req.query);
        res.status(200).json(successResponse(data, `${data.length}개 발견`));
    } catch (err) {
        res.status(500).json(errorResponse(err.message, 500));
    }
};

exports.getLodgingDetail = async (req, res) => {
    try {
        const data = await service.getLodgingDetailService(req.params.id);
        res.status(200).json(successResponse(data));
    } catch (err) {
        res.status(err.status || 500).json(errorResponse(err.message, err.status || 500));
    }
};