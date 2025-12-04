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
                return this.provider === 'local'; // ✅ 수정: 카카오, 구글 통합 대응
            }
        },
        avatarUrl: {
            type: String
        },
        // [추가 2] 찜한 숙소 목록 (Lodging ID들을 배열로 저장)
        wishlist: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Lodging'
        }],
        passwordHash: {
            type: String,
            select: false
        },
        displayName: {
            type: String,
            default: "고객님"
        },
        phone: {
            type: String,
            trim: true,
            unique: true,  // 중복 방지
            sparse: true,  // 소셜 유저는 null 허용 (unique 충돌 방지)
            required: function () {
                // provider가 'local'일 때만 필수!
                return this.provider === 'local';
            }
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
        kakaoId: {
            type: String,
            index: true,
            unique: true,
            sparse: true
        },
        googleId: {
            type: String,
            index: true,
            unique: true,
            sparse: true
        },
        isActive: {
            type: Boolean,
            default: true
        },
        failedLoginAttempts: {
            type: Number,
            default: 0
        },
        lastLoginAttempt: {
            type: Date
        }
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