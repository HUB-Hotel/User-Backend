const User = require("../auth/model");
const Lodging = require("../lodging/model");

// 1. 북마크 토글 (ON/OFF)
exports.toggleBookmarkService = async (userId, lodgingId) => {
    const user = await User.findById(userId);
    if (!user) throw { status: 404, message: "사용자 없음" };

    // Lodging이 진짜 있는지 확인
    const lodging = await Lodging.findById(lodgingId);
    if (!lodging) throw { status: 404, message: "숙소 없음" };

    // 이미 찜했는지 확인
    const isBookmarked = user.wishlist.includes(lodgingId);

    if (isBookmarked) {
        // 이미 있으면 -> 삭제 (Pull)
        user.wishlist.pull(lodgingId);
        await user.save();
        return { isBookmarked: false, message: "찜 목록에서 삭제했습니다." };
    } else {
        // 없으면 -> 추가 (Push)
        user.wishlist.push(lodgingId);
        await user.save();
        return { isBookmarked: true, message: "찜 목록에 추가했습니다." };
    }
};

// 2. 내 북마크 목록 조회
exports.getMyBookmarksService = async (userId) => {
    const user = await User.findById(userId).populate("wishlist"); // 숙소 정보 통째로 가져옴
    return user.wishlist;
};