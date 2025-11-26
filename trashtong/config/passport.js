const passport = require("passport");
const KakaoStrategy = require("passport-kakao").Strategy;
const GoogleStrategy = require("passport-google-oauth20").Strategy; // 추가됨
const User = require("../models/User");
require("dotenv").config();

// 공통: 사용자 저장/복구 (세션용이지만 구조상 유지)
passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (err) {
        done(err);
    }
});

// 1. 카카오 전략 (기존 코드 유지)
passport.use(new KakaoStrategy({
    clientID: process.env.KAKAO_CLIENT_ID,
    clientSecret: process.env.KAKAO_CLIENT_SECRET, // 카카오는 선택사항
    callbackURL: process.env.KAKAO_CALLBACK_URL,
},
    async (accessToken, refreshToken, profile, done) => {
        try {
            const kakaoId = profile.id;
            const email = profile._json?.kakao_account?.email;
            const displayName = profile.displayName || "카카오유저";
            const photoUrl = profile._json?.properties?.profile_image;

            // A. 이미 있는 카카오 유저인지?
            let user = await User.findOne({ kakaoId });

            // B. 없으면 이메일로 기존 유저 찾기 (계정 통합)
            if (!user && email) {
                user = await User.findOne({ email });
                if (user) {
                    user.kakaoId = kakaoId;
                    user.provider = "kakao"; // 혹은 'mixed' 로 관리하기도 함
                    await user.save();
                }
            }

            // C. 아예 없으면 회원가입
            if (!user) {
                user = await User.create({
                    email: email || undefined, // 이메일 없을 수도 있음
                    displayName,
                    kakaoId,
                    provider: "kakao",
                    avatarUrl: photoUrl
                });
            }
            return done(null, user);
        } catch (err) {
            return done(err);
        }
    }
));

// 2. 구글 전략 (새로 추가)
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL
},
    async (accessToken, refreshToken, profile, done) => {
        try {
            const googleId = profile.id;
            const email = profile.emails?.[0]?.value; // 구글은 이메일 구조가 다름
            const displayName = profile.displayName;
            const photoUrl = profile.photos?.[0]?.value;

            // A. 구글 유저 찾기
            let user = await User.findOne({ googleId });

            // B. 이메일 연동
            if (!user && email) {
                user = await User.findOne({ email });
                if (user) {
                    user.googleId = googleId;
                    // user.provider = "google"; // 기존 local/kakao 덮어쓰기 방지 위해 생략 가능
                    await user.save();
                }
            }

            // C. 회원가입
            if (!user) {
                user = await User.create({
                    email,
                    displayName,
                    googleId,
                    provider: "google",
                    avatarUrl: photoUrl
                });
            }
            return done(null, user);
        } catch (err) {
            return done(err);
        }
    }
));

module.exports = passport;