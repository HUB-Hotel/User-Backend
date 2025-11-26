const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    // 1. 예약자 (User)
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // 2. 숙소 (Lodging)
    lodgingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lodging",
      required: true,
    },

    // 3. 객실 타입 (Room)
    roomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room",
      required: true,
    },

    // 4. 실제 호수 (101호)
    roomNumber: {
      type: Number,
      required: true,
    },

    // 5. 예약자 정보
    userName: { type: String, required: true },
    userPhone: { type: String, required: true },

    // 6. 날짜 정보
    checkIn: { type: Date, required: true },
    checkOut: { type: Date, required: true },
    stayDates: [{ type: Date }], // 날짜별 X표 처리를 위해 저장

    // 7. 금액 및 상태
    price: { type: Number, required: true },
    status: {
      type: String,
      enum: ["booked", "cancelled", "completed"],
      default: "booked",
    },

    // ▼▼▼ [추가된 필드] ▼▼▼
    paymentKey: { type: String },      // PG사 결제 고유 키 (환불용)
    paymentAmount: { type: Number },   // 실제 결제된 금액
    isReviewed: { type: Boolean, default: false }, // 리뷰 작성 여부
  },
  { timestamps: true }
);

module.exports = mongoose.model("Booking", bookingSchema);