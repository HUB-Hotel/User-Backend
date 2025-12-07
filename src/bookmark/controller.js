const service = require("./service");
const { successResponse, errorResponse } = require("../common/response");

// 내 북마크 조회
exports.getMyBookmarks = async (req, res) => {
    try {
        const data = await service.getMyBookmarksService(req.user.id);
        res.status(200).json(successResponse(data));
    } catch (err) {
        res.status(500).json(errorResponse(err.message, 500));
    }
};

// ✅ [추가] 찜하기
exports.addBookmark = async (req, res) => {
    try {
        // 프론트에서 body로 { lodgingId: "..." }를 보냄
        const { lodgingId } = req.body; 
        await service.addBookmarkService(req.user.id, lodgingId);
        res.status(200).json(successResponse(null, "찜 목록에 추가했습니다."));
    } catch (err) {
        res.status(err.status || 500).json(errorResponse(err.message, err.status || 500));
    }
};

// ✅ [추가] 찜 삭제
exports.removeBookmark = async (req, res) => {
    try {
        // 프론트에서 url parameter로 ID를 보냄
        const { lodgingId } = req.params; 
        await service.removeBookmarkService(req.user.id, lodgingId);
        res.status(200).json(successResponse(null, "찜 목록에서 삭제했습니다."));
    } catch (err) {
        res.status(err.status || 500).json(errorResponse(err.message, err.status || 500));
    }
};