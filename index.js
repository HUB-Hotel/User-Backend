require('dotenv').config();
const express = require("express");
const cors = require("cors");
const cookieParser = require('cookie-parser');
const passport = require('./src/config/passport'); 

// ✅ DB 연결 함수
const connectDB = require("./src/config/db");

// ✅ 각 기능별 라우트 불러오기
const authRoutes = require("./src/auth/route");
const lodgingRoutes = require("./src/lodging/route");
const roomRoutes = require("./src/room/route");
const bookingRoutes = require("./src/booking/route");
const reviewRoutes = require("./src/review/route");
const bookmarkRoutes = require("./src/bookmark/route");
const paymentRoutes = require("./src/payment/route"); 

const app = express();
const PORT = process.env.PORT || 3000;

// DB 연결
connectDB();

// 미들웨어
app.use(cors({ origin: process.env.FRONT_ORIGIN, credentials: true }));
app.use(express.json());
app.use(cookieParser());
app.use(passport.initialize());

// API 주소 연결
app.use("/api/auth", authRoutes);
app.use("/api/lodgings", lodgingRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/bookmarks", bookmarkRoutes);
app.use("/api/payments", paymentRoutes);

// 에러 핸들링
app.use((req, res, next) => {
    res.status(404).json({ 
        success: false, 
        message: '요청하신 페이지를 찾을 수 없습니다.',
        resultCode: 404
    });
});

app.use((err, req, res, next) => {
    console.error('Server Error:', err);
    
    // Mongoose validation 에러 처리
    if (err.name === 'ValidationError') {
        const messages = Object.values(err.errors).map(e => {
            const field = e.path;
            const fieldNames = {
                'name': '이름',
                'email': '이메일',
                'password': '비밀번호',
                'phoneNumber': '전화번호'
            };
            const fieldName = fieldNames[field] || field;
            
            if (e.message.includes('required')) {
                return `${fieldName}을(를) 입력해주세요.`;
            } else if (e.message.includes('unique')) {
                return `이미 사용 중인 ${fieldName}입니다.`;
            }
            return e.message;
        });
        
        return res.status(400).json({ 
            success: false, 
            message: messages.join(' '),
            resultCode: 400
        });
    }
    
    // 기타 에러
    const status = err.status || 500;
    const message = err.message || '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
    
    res.status(status).json({ 
        success: false, 
        message,
        resultCode: status
    });
});

app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));