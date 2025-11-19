// backend/models/Room.js
const mongoose = require("mongoose");

const roomSchema = new mongoose.Schema(
  {
    // 🚨 핵심: 이 방이 어느 숙소 소속인지 연결하는 고리!
    lodgingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lodging", // Lodging 모델을 참조함
      required: true,
    },

    title: { type: String, required: true }, // 예: "디럭스 오션뷰"
    price: { type: Number, required: true }, // 1박 가격
    maxPeople: { type: Number, required: true }, // 최대 인원
    desc: { type: String, required: true }, // 방 설명
    photos: [String], // 방 사진들
    
    // 실제 방 번호 관리 (재고 관리)
    roomNumbers: [{ 
        number: Number, 
        unavailableDates: { type: [Date] } 
    }],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Room", roomSchema);