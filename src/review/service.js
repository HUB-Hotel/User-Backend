const Review = require("./model");
const Booking = require("../booking/model");
const Lodging = require("../lodging/model");

// 1. 리뷰 작성
exports.createReviewService = async (userId, data) => {
    const { bookingId, rating, content } = data;

    // (1) 예약 확인
    const booking = await Booking.findById(bookingId);
    if (!booking) throw { status: 404, message: "예약 정보를 찾을 수 없습니다." };
    
    // (2) 권한 및 중복 확인
    if (booking.userId.toString() !== userId) throw { status: 403, message: "본인의 예약만 리뷰할 수 있습니다." };
    if (booking.isReviewed) throw { status: 400, message: "이미 작성된 리뷰가 있습니다." };

    // (3) 리뷰 저장
    const review = await Review.create({
        userId,
        lodgingId: booking.lodgingId,
        bookingId,
        rating,
        content
    });

    // (4) 예약 상태 업데이트 (리뷰 작성됨 표시)
    booking.isReviewed = true;
    await booking.save();

    // (5) [핵심 수정] 숙소 평점 & 리뷰 수 업데이트 (안전한 로직) 🛡️
    const lodging = await Lodging.findById(booking.lodgingId);
    
    if (lodging) {
        // 기존 값이 없으면(undefined) 0으로 취급 (안전장치)
        const currentRating = lodging.rating || 0;
        const currentCount = lodging.reviewCount || 0;

        // 새 평균 = ((기존평균 * 기존개수) + 새점수) / (기존개수 + 1)
        const newCount = currentCount + 1;
        const totalScore = (currentRating * currentCount) + Number(rating);
        const newRating = totalScore / newCount;
        
        // 데이터 갱신
        lodging.reviewCount = newCount;
        lodging.rating = parseFloat(newRating.toFixed(1)); // 소수점 1자리로 자름
        
        await lodging.save();
        
        console.log(`✅ 숙소 평점 업데이트 완료: ${lodging.name} (평점: ${lodging.rating}, 개수: ${lodging.reviewCount})`);
    } else {
        console.log("❌ 숙소를 찾을 수 없어 평점을 업데이트하지 못했습니다.");
    }

    return review;
};

// ... (나머지 조회 함수들은 그대로 유지) ...
exports.getLodgingReviewsService = async (lodgingId) => { /*...*/ };
exports.getMyReviewsService = async (userId) => { /*...*/ };