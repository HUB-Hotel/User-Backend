// ...existing code...
require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const passport = require('passport');

const app = express();

// 환경 변수
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI;
const FRONT_ORIGIN = process.env.FRONT_ORIGIN || 'http://localhost:5173';
const SESSION_SECRET = process.env.SESSION_SECRET || 'dev_session_secret_change_me';

// 필수 값 확인
if (!MONGO_URI) {
  console.error('MONGO_URI가 설정되어 있지 않습니다. .env를 확인하세요.');
  process.exit(1);
}

// MongoDB 연결
mongoose.set('strictQuery', false);
mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch(err => {
    console.error('MongoDB 연결 실패:', err.message);
    process.exit(1);
  });

// 미들웨어
app.use(cors({
  origin: FRONT_ORIGIN,
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  },
}));
app.use(passport.initialize());
app.use(passport.session());

// TODO: passport 전략 설정 파일 연결 (예: ./config/passport)
// require('./config/passport')(passport);

// TODO: 라우트 마운트 (예: /auth, /users, /payments, /uploads)
// app.use('/auth', require('./routes/auth'));

// 기본 라우트
app.get('/', (req, res) => {
  res.json({ ok: true, message: 'Hotel backend running' });
});

app.get('/health', (req, res) => res.send('ok'));

// 서버 시작
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

//