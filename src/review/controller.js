const service = require("./service");
const { successResponse, errorResponse } = require("../common/response");

exports.createReview = async (req, res) => {
    try {
        const data = await service.createReviewService(req.user.id, req.body);
        res.status(201).json(successResponse(data, "리뷰가 등록되었습니다.", 201));
    } catch (err) {
        res.status(err.status || 500).json(errorResponse(err.message, err.status || 500));
    }
};

exports.getLodgingReviews = async (req, res) => {
    try {
        const data = await service.getLodgingReviewsService(req.params.lodgingId);
        res.status(200).json(successResponse(data));
    } catch (err) {
        res.status(500).json(errorResponse(err.message, 500));
    }
};

exports.getMyReviews = async (req, res) => {
    try {
        const data = await service.getMyReviewsService(req.user.id);
        res.status(200).json(successResponse(data));
    } catch (err) {
        res.status(500).json(errorResponse(err.message, 500));
    }
};