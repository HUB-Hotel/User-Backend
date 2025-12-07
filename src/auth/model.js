const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const userSchema = new mongoose.Schema(
    {
        email: {
            type: String,
            required: true,
            lowercase: true,
            trim: true,
            match: [EMAIL_REGEX, "유효한 이메일"],
            unique: true,
            required: function () {
                return this.provider === 'local';
            }
        },

        // 프로필 이미지 (profileImage 사용 추천)
        profileImage: {
            type: String,
            default: "" // 없으면 빈 문자열
        },

        // 생년월일 (미성년자 체크용 및 생일 쿠폰 적용)
        birthDate: {
            type: Date
        },

        // 찜 목록
        wishlist: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Lodging'
        }],

        passwordHash: {
            type: String,
            select: false
        },

        name: { 
            type: String,
            required: true
        },

        phoneNumber: {
            type: String,
            trim: true,
            sparse: true,
            unique: true,

            // (나중에 필수 체크가 필요하면 아래 주석 해제)
            // required: function () {
            //     return this.provider === 'local';
            // }
        },

        address: {
            type: String
        },

        role: {
            type: String,
            enum: ["user", "admin"],
            default: "user",
            index: true
        },

        provider: {
            type: String,
            enum: ['local', 'kakao', 'google'],
            default: 'local'
        },

        kakaoId: { type: String, index: true, unique: true, sparse: true },
        googleId: { type: String, index: true, unique: true, sparse: true },

        isActive: { type: Boolean, default: true },
        failedLoginAttempts: { type: Number, default: 0 },
        lastLoginAttempt: { type: Date }
    },
    {
        timestamps: true
    }
);

// 비밀번호 검증
userSchema.methods.comparePassword = function (plain) {
    return bcrypt.compare(plain, this.passwordHash);
};

// 정보 내보내기 (비번 제외)
userSchema.methods.toSafeJSON = function () {
    const obj = this.toObject({ versionKey: false });
    delete obj.passwordHash;
    return obj;
};

module.exports = mongoose.model("User", userSchema);