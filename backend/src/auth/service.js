const User = require("./model");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// ✅ 수정됨: Controller에서도 쓸 수 있게 exports로 변경
exports.generateToken = (user) => {
    return jwt.sign(
        { id: user._id.toString(), role: user.role, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
    );
};

exports.registerService = async (data) => {
    const { email, password, displayName, role, phone } = data;
    
    if (await User.findOne({ email: email.toLowerCase() })) throw { status: 400, message: "이미 가입된 이메일" };
    if (await User.findOne({ phone })) throw { status: 400, message: "이미 가입된 번호" };

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ email, passwordHash, displayName, role, phone, provider: 'local' });
    
    return user.toSafeJSON();
};

exports.loginService = async (email, password) => {
    const user = await User.findOne({ email: email.toLowerCase() }).select("+passwordHash +role +isActive +failedLoginAttempts +lastLoginAttempt");
    
    if (!user) throw { status: 400, message: "이메일 또는 비밀번호 불일치" };
    
    const ok = await user.comparePassword(password);
    if (!ok) {
        throw { status: 400, message: "이메일 또는 비밀번호 불일치" };
    }

    // ✅ 수정됨: 위에서 만든 함수 사용
    const token = exports.generateToken(user);
    return { user: user.toSafeJSON(), token };
};

exports.updateMeService = async (userId, data) => {
    const { displayName, phone, password } = data;
    const user = await User.findById(userId);
    if (!user) throw { status: 404, message: "사용자 없음" };

    if (phone && phone !== user.phone) {
        if (await User.findOne({ phone })) throw { status: 400, message: "이미 사용 중인 번호" };
        user.phone = phone;
    }
    if (displayName) user.displayName = displayName;
    if (password) {
        if (user.provider !== 'local') throw { status: 400, message: "소셜 유저 비번 변경 불가" };
        user.passwordHash = await bcrypt.hash(password, 10);
    }
    await user.save();
    return user.toSafeJSON();
};

exports.getMeService = async (userId) => {
    const user = await User.findById(userId);
    if (!user) throw { status: 404, message: "사용자 없음" };
    return user.toSafeJSON();
};