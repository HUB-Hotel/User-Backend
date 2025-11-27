const mongoose = require("mongoose");

const roomSchema = new mongoose.Schema(
  {
    lodgingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lodging',
      required: true,
      index: true
    },
    
    roomName: { // (구 title)
      type: String,
      required: true,
      trim: true,
      maxlength: 100
    },
    
    roomSize: { // (구 size)
      type: String,
      required: true,
      trim: true,
      maxlength: 50
    },
    
    capacityMin: { // [신규] 최소 인원
      type: Number,
      required: true,
      min: 1
    },
    
    capacityMax: { // (구 maxPeople)
      type: Number,
      required: true,
      min: 1
    },
    
    checkInTime: { // [신규] 입실 시간
      type: String,
      required: true,
      default: "15:00"
    },
    
    checkOutTime: { // [신규] 퇴실 시간
      type: String,
      required: true,
      default: "11:00"
    },
    
    roomImage: { // (구 photos 배열 -> 단일 문자열로 변경됨 ⚠️)
      type: String,
      trim: true
    },
    
    price: {
      type: Number,
      required: true,
      min: 0
    },
    
    countRoom: { // [신규] 방 개수 (재고)
      type: Number,
      required: true,
      min: 1,
      default: 1
    },
    
    ownerDiscount: { // [신규] 사장님 할인율 ??
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    
    platformDiscount: { // [신규] 플랫폼 할인율
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    
    status: { // [신규] 방 상태
      type: String,
      enum: ['active', 'inactive', 'maintenance'],
      default: 'active',
      index: true
    }
  },
  {
    timestamps: true,
    collection: 'rooms' // DB 컬렉션 이름을 'rooms'로 고정
  }
);

roomSchema.index({ lodgingId: 1, createdAt: -1 });

module.exports = mongoose.model('Room', roomSchema);