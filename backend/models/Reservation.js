// backend/models/Reservation.js
const mongoose = require("mongoose");

const reservationSchema = new mongoose.Schema(
  {
    // 1. 누가 예약했니?
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // 2. 어떤 숙소니?
    lodgingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lodging",
      required: true,
    },

    // 3. 어떤 객실 타입이니? (예: 디럭스룸)
    roomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room",
      required: true,
    },

    // 4. 실제 몇 호실이니? (예: 101호) -> 이게 있어야 unavailableDates를 찾아가서 지움
    roomNumber: {
      type: Number,
      required: true,
    },

    // 5. 예약자 이름/전화번호 (회원정보와 다를 수 있으므로 따로 저장 추천)
    userName: { type: String, required: true },
    userPhone: { type: String, required: true },

    // 6. 날짜 정보
    checkIn: { type: Date, required: true },
    checkOut: { type: Date, required: true },

    // 편의상 1박씩 쪼개진 날짜들도 저장해두면 관리하기 편함 (예: [12/25, 12/26])
    stayDates: [{ type: Date }],

    // 7. 결제 정보
    price: { type: Number, required: true },
    status: {
      type: String,
      enum: ["booked", "cancelled", "completed"], // 예약됨, 취소됨, 이용완료
      default: "booked",
    },
    // [추가 1] 결제 고유 ID (PG사 결제 번호 - 환불할 때 필수!)
    paymentKey: { type: String },

    // [추가 2] 결제 금액 (price가 있지만 실결제 금액은 다를 수 있음)
    paymentAmount: { type: Number },

    // [추가 3] 리뷰 작성 여부 (작성했으면 true로 변경 -> 중복 작성 방지)
    isReviewed: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Reservation", reservationSchema);