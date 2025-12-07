const User = require("../auth/model");
const Lodging = require("../lodging/model"); // 숙소 존재 확인용

// 1. 찜 추가
exports.addBookmarkService = async (userId, lodgingId) => {
    // 숙소가 진짜 있는지 확인
    const lodging = await Lodging.findById(lodgingId);
    if (!lodging) throw { status: 404, message: "숙소를 찾을 수 없습니다." };

    // $addToSet: 이미 있으면 추가 안 함 (중복 방지)
    await User.findByIdAndUpdate(userId, {
        $addToSet: { wishlist: lodgingId }
    });
};

// 2. 찜 삭제
exports.removeBookmarkService = async (userId, lodgingId) => {
    // $pull: 배열에서 해당 ID 제거
    await User.findByIdAndUpdate(userId, {
        $pull: { wishlist: lodgingId }
    });
};

// 3. 내 북마크 목록 조회
exports.getMyBookmarksService = async (userId) => {
    const user = await User.findById(userId).populate("wishlist");
    return user ? user.wishlist : [];
};