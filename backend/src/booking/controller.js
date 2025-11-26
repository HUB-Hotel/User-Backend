const bookingService = require("./service");
const { successResponse, errorResponse } = require("../common/response");

// 예약 생성
exports.createBooking = async (req, res) => {
  try {
    const data = await bookingService.createBookingService(req.user.id, req.body);
    res.status(201).json(successResponse(data, "예약이 확정되었습니다!", 201));
  } catch (err) {
    res.status(err.status || 500).json(errorResponse(err.message, err.status || 500));
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