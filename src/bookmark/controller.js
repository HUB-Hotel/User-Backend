const service = require("./service");
const { successResponse, errorResponse } = require("../common/response");

exports.toggleBookmark = async (req, res) => {
    try {
        const result = await service.toggleBookmarkService(req.user.id, req.params.lodgingId);
        res.status(200).json(successResponse({ isBookmarked: result.isBookmarked }, result.message));
    } catch (err) {
        res.status(err.status || 500).json(errorResponse(err.message, err.status || 500));
    }
};

exports.getMyBookmarks = async (req, res) => {
    try {
        const data = await service.getMyBookmarksService(req.user.id);
        res.status(200).json(successResponse(data));
    } catch (err) {
        res.status(500).json(errorResponse(err.message, 500));
    }
};