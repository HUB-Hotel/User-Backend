const passport = require("passport");
const KakaoStrategy = require("passport-kakao").Strategy;
const GoogleStrategy = require("passport-google-oauth20").Strategy;
// 🚨 경로 변경: ../models/User -> ../auth/model
const User = require("../auth/model"); 
require("dotenv").config();

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (err) {
        done(err);
    }
});

// (카카오 전략 코드는 기존과 동일, 경로만 주의하면 됨)
passport.use(new KakaoStrategy({
    clientID: process.env.KAKAO_CLIENT_ID,
    clientSecret: process.env.KAKAO_CLIENT_SECRET,
    callbackURL: process.env.KAKAO_CALLBACK_URL,
}, async (accessToken, refreshToken, profile, done) => {
    try {
        const kakaoId = profile.id;
        const email = profile._json?.kakao_account?.email;
        const displayName = profile.displayName || "카카오유저";
        const photoUrl = profile._json?.properties?.profile_image;

        let user = await User.findOne({ kakaoId });
        if (!user && email) {
            user = await User.findOne({ email });
            if (user) {
                user.kakaoId = kakaoId;
                user.provider = "kakao";
                await user.save();
            }
        }
        if (!user) {
            user = await User.create({
                email: email || undefined,
                name: displayName,
                kakaoId,
                provider: "kakao",
                profileImage: profile._json?.properties?.profile_image
            });
        }
        return done(null, user);
    } catch (err) { return done(err); }
}));

// (구글 전략 코드도 동일)
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL
}, async (accessToken, refreshToken, profile, done) => {
    try {
        const googleId = profile.id;
        const email = profile.emails?.[0]?.value;
        const displayName = profile.displayName;
        const photoUrl = profile.photos?.[0]?.value;

        let user = await User.findOne({ googleId });
        if (!user && email) {
            user = await User.findOne({ email });
            if (user) {
                user.googleId = googleId;
                await user.save();
            }
        }
        if (!user) {
            user = await User.create({
                email,
                name: displayName,
                googleId,
                provider: "google",
                profileImage: profile.photos?.[0]?.value
            });
        }
        return done(null, user);
    } catch (err) { return done(err); }
}));

module.exports = passport;