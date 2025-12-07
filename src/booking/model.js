const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    lodgingId: { type: mongoose.Schema.Types.ObjectId, ref: "Lodging", required: true },
    roomId: { type: mongoose.Schema.Types.ObjectId, ref: "Room", required: true },
    userName: { type: String, required: true },
    userPhone: { type: String, required: true },
    checkIn: { type: Date, required: true },
    checkOut: { type: Date, required: true },
    price: { type: Number, required: true },
    status: {
      type: String,
      enum: ["pending", "booked", "confirmed", "cancelled"], // 여기에 'confirmed'가 있어야 함
      default: "confirmed",
    },
    paymentKey: { type: String },
    paymentAmount: { type: Number },
    isReviewed: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Booking", bookingSchema);