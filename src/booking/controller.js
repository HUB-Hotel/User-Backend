const bookingService = require("./service");
const { successResponse, errorResponse } = require("../common/response");
const { PortOneClient } = require('@portone/server-sdk');

const portone = PortOneClient({
  secret: process.env.PORTONE_API_SECRET,
});

// 예약 생성 (결제 검증 포함)
exports.createBooking = async (req, res) => {
  try {
    // 프론트에서 보낸 데이터
    const { paymentId, ...bookingData } = req.body;
    const userId = req.user ? req.user.id : null;

    if (!userId) {
      return res.status(401).json(errorResponse("로그인이 필요합니다.", 401));
    }

    // 필수 필드 검증
    if (!bookingData.lodgingId) {
      return res.status(400).json(errorResponse("숙소 정보가 없습니다.", 400));
    }
    if (!bookingData.roomId) {
      return res.status(400).json(errorResponse("객실 정보가 없습니다.", 400));
    }
    if (!bookingData.checkIn || !bookingData.checkOut) {
      return res.status(400).json(errorResponse("체크인/체크아웃 날짜를 선택해주세요.", 400));
    }
    if (!bookingData.price) {
      return res.status(400).json(errorResponse("가격 정보가 없습니다.", 400));
    }

    // 사용자 정보 가져오기
    const User = require("../auth/model");
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json(errorResponse("사용자 정보를 찾을 수 없습니다.", 404));
    }

    // userName과 userPhone 설정
    bookingData.userName = user.name || user.displayName || "사용자";
    bookingData.userPhone = bookingData.phone || bookingData.userPhone || user.phoneNumber || "";

    // ==========================================
    // 🔍 포트원 결제 검증 (임시 paymentId인 경우 건너뛰기)
    // ==========================================
    let paymentKey = paymentId;
    let paymentAmount = bookingData.price;

    if (paymentId && !paymentId.startsWith('temp_') && process.env.PORTONE_API_SECRET) {
      try {
        // 포트원에 이 결제 내역 조회
        const payment = await portone.payment.getPayment({ paymentId });

        // 결제 상태 확인
        if (payment.status !== 'PAID') {
          return res.status(400).json(errorResponse("결제가 완료되지 않았습니다.", 400));
        }

        // 결제 금액 확인
        if (payment.amount.total !== Number(bookingData.price)) {
          return res.status(400).json(errorResponse("결제 금액이 일치하지 않습니다.", 400));
        }

        paymentKey = paymentId;
        paymentAmount = payment.amount.total;
      } catch (portoneError) {
        console.error("[PortOne Error]", portoneError.message);
        // 포트원 에러는 무시하고 계속 진행 (개발 환경)
        if (process.env.NODE_ENV === 'production') {
          return res.status(500).json(errorResponse("결제 검증에 실패했습니다.", 500));
        }
      }
    }

    // ==========================================
    // 📝 DB에 예약 저장
    // ==========================================
    const newBookingData = {
      ...bookingData,
      paymentKey: paymentKey,
      paymentAmount: paymentAmount,
      status: 'confirmed'
    };

    const data = await bookingService.createBookingService(userId, newBookingData);

    res.status(201).json(successResponse(data, "예약이 완료되었습니다.", 201));

  } catch (err) {
    // 에러 발생 시 로그는 남기는 것이 좋습니다 (서버 내부 확인용)
    console.error("[Booking Error]", err);
    const status = err.status || 500;
    const message = err.message || "예약 처리 중 오류가 발생했습니다.";
    res.status(status).json(errorResponse(message, status));
  }
};

// 내 예약 조회
exports.getMyBookings = async (req, res) => {
  try {
    const data = await bookingService.getMyBookingsService(req.user.id);
    res.status(200).json(successResponse(data, "예약 목록 조회 성공", 200));
  } catch (err) {
    res.status(500).json(errorResponse(err.message, 500));
  }
};

// 예약 취소
exports.cancelBooking = async (req, res) => {
  try {
    await bookingService.cancelBookingService(req.params.id, req.user.id);
    res.status(200).json(successResponse(null, "예약이 취소되었습니다.", 200));
  } catch (err) {
    res.status(err.status || 500).json(errorResponse(err.message, err.status || 500));
  }
};