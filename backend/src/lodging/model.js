// backend/models/Lodging.js
const mongoose = require('mongoose');

const lodgingSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    category: {
        type: String,
        required: true
    },  // 호텔, 펜션 등
    country: {
        type: String,
        required: true
    },   // 나라 (예: 한국, 일본)
    address: {
        type: String,
        required: true
    },   // 상세 주소
    lat: {
        type: Number,
        required: true
    }, // 위도 (Latitude)
    lng: {
        type: Number,
        required: true
    }, // 경도 (Longitude)
    starRating: {
        type: Number,
        default: 0
    },    // 숙소 성급 (5성급 등)
    hashtags: [String],  // 해시태그 (예: ["#오션뷰", "#커플"])
    businessId: {
        type: String,
        required: true,
        index: true
    }, // business backend의 사장님 ID (String으로 저장)
    description: {
        type: String
    },
    images: [String],
    amenities: [String],
    rating: {
        type: Number,
        default: 0
    },        // 평균 평점 (리뷰에서 계산해서 넣을 값)
    // [추가 1] 검색 목록에 보여줄 '최저가' (방 등록/수정할 때 갱신됨)
    minPrice: {
        type: Number,
        default: 0, index: true
    },
    // [추가 2] 리뷰 개수 (평점만 있으면 신뢰도 부족, 개수도 필요)
    reviewCount: {
        type: Number,
        default: 0
    },
    // [추가 3] 체크인/체크아웃 시간 (호텔마다 다르니까)
    checkInTime: {
        type: String,
        default: "15:00"
    },
    checkOutTime: {
        type: String,
        default: "11:00"
    },
},
    {
        timestamps: true
    }
);

module.exports = mongoose.model('Lodging', lodgingSchema);