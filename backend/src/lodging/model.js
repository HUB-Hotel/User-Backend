const mongoose = require("mongoose");

const lodgingSchema = new mongoose.Schema(
  {
    // =========================================================
    // 1. 사업자 백엔드 기준 (필드명 및 구조 일치시킴)
    // =========================================================
    
    // 숙소 이름 (name -> lodgingName 변경됨)
    lodgingName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50
    },
    
    address: {
      type: String,
      required: true,
      trim: true,
      maxlength: 255
    },
    
    starRating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
      default: 3
    },
    
    description: {
      type: String,
      required: true,
      trim: true
    },
    
    images: {
      type: [String],
      default: [],
      trim: true
    },
    
    country: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50
    },
    
    category: {
      type: String,
      enum: ["호텔", "모텔", "리조트", "게스트하우스", "에어비앤비"],
      required: true
    },
    
    // 해시태그 (hashtags -> hashtag 변경됨)
    hashtag: {
      type: [String],
      default: [],
      trim: true,
    },
    
    // 사업자 ID (String -> ObjectId 변경됨)
    businessId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Business', 
      required: true,
      index: true
    },

    // 편의시설 (Amenity 모델 참조 방식)
    amenityId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Amenity',
      required: false
    },
    
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: false
    },

    // =========================================================
    // 2. [요청 사항] 사용자 앱 필수 필드 (사업자 팀에 추가 요청할 것들)
    // =========================================================

    // 📍 지도 좌표 (지도 서비스 필수)
    lat: { type: Number }, 
    lng: { type: Number }, 

    // 📊 통계 정보 (정렬 및 필터링용 - 리뷰 작성 시 업데이트됨)
    rating: { type: Number, default: 0, index: -1 }, // 평점
    reviewCount: { type: Number, default: 0 },       // 리뷰 수
    minPrice: { type: Number, default: 0, index: 1 }, // 최저가

    // ⏰ 이용 시간 (UI 표시용)
    checkInTime: { type: String, default: "15:00" },
    checkOutTime: { type: String, default: "11:00" }
  },
  {
    timestamps: true,
    collection: 'lodgings' // 컬렉션 이름 일치
  }
);

// 인덱스 설정 (사업자 설정 + 사용자 검색용 병합)
lodgingSchema.index({ businessId: 1, createdAt: -1 });
lodgingSchema.index({ country: 1 });
lodgingSchema.index({ category: 1 });
lodgingSchema.index({ starRating: -1 });
lodgingSchema.index({ amenityId: 1 });
// 추가 인덱스
lodgingSchema.index({ lodgingName: 1 }); // 이름 검색용
lodgingSchema.index({ minPrice: 1 });    // 가격순 정렬용
lodgingSchema.index({ rating: -1 });     // 평점순 정렬용

module.exports = mongoose.model('Lodging', lodgingSchema);