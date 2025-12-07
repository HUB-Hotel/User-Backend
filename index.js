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
app.use((req, res, next) => res.status(404).json({ success: false, message: 'Not Found' }));
app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
});

app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));