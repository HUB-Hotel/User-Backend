const User = require("./model");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// 토큰 생성 함수
exports.generateToken = (user) => {
    return jwt.sign(
        { id: user._id.toString(), role: user.role, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
    );
};

exports.registerService = async (data) => {
    // ... (회원가입 코드는 기존과 동일) ...
    const { email, password, name, role, phoneNumber, address, birthDate, profileImage } = data;

    if (await User.findOne({ email: email.toLowerCase() })) throw { status: 400, message: "이미 가입된 이메일" };
    if (phoneNumber && await User.findOne({ phoneNumber })) throw { status: 400, message: "이미 가입된 번호" };

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
        email, passwordHash, name, role, phoneNumber,
        address, birthDate, profileImage,
        provider: 'local'
    });

    return user.toSafeJSON();
};

// 🔥 [핵심 수정] 로그인 로직 강화
exports.loginService = async (email, password) => {
    // 1. 유저 찾기 (+비밀번호, +상태 정보 가져오기)
    const user = await User.findOne({ email: email.toLowerCase() })
        .select("+passwordHash +role +isActive +failedLoginAttempts +lastLoginAttempt");

    if (!user) throw { status: 400, message: "이메일 또는 비밀번호 불일치" };

    // 2. [질문 3 해결] 계정 잠금 확인
    if (user.isActive === false) {
        throw { status: 403, message: "비밀번호 5회 오류로 계정이 잠겼습니다. 관리자에게 문의하세요." };
    }

    // 3. 비밀번호 검사
    const ok = await user.comparePassword(password);

    if (!ok) {
        // [질문 1 해결] 실패 시 카운트 증가 로직
        user.failedLoginAttempts += 1;

        if (user.failedLoginAttempts >= 5) {
            user.isActive = false; // 5회 이상이면 잠금
            await user.save();
            throw { status: 403, message: "비밀번호 5회 오류로 계정이 잠겼습니다." };
        }

        await user.save(); // 카운트 저장
        throw { status: 400, message: `비밀번호가 일치하지 않습니다. (실패 ${user.failedLoginAttempts}/5)` };
    }

    // 4. [추가 기능] 로그인 성공 시 상태 초기화
    user.failedLoginAttempts = 0;       // 실패 카운트 초기화
    user.lastLoginAttempt = new Date(); // 마지막 로그인 시간 기록
    await user.save();

    const token = exports.generateToken(user);
    return { user: user.toSafeJSON(), token };
};

exports.updateMeService = async (userId, data) => {
    // 1. 여기서 birthDate를 꺼내야 합니다! (기존 코드엔 없었음)
    const { name, phoneNumber, password, address, profileImage, birthDate } = data;

    const user = await User.findById(userId);
    if (!user) throw { status: 404, message: "사용자 없음" };

    // 2. 전화번호 중복 체크 (기존 유지)
    if (phoneNumber && phoneNumber !== user.phoneNumber) {
        if (await User.findOne({ phoneNumber })) throw { status: 400, message: "이미 사용 중인 번호" };
        user.phoneNumber = phoneNumber;
    }

    // 3. 나머지 정보 업데이트
    if (name) user.name = name;
    if (address) user.address = address;
    if (profileImage) user.profileImage = profileImage;

    // ✅ [추가] 생년월일 업데이트 로직 추가!
    if (birthDate) user.birthDate = birthDate;

    // 4. 비밀번호 변경 (기존 유지)
    if (password) {
        if (user.provider !== 'local') throw { status: 400, message: "소셜 유저 비번 변경 불가" };
        user.passwordHash = await bcrypt.hash(password, 10);
    }

    await user.save();
    return user.toSafeJSON();
};

exports.getMeService = async (userId) => {
    // ... (기존과 동일) ...
    const user = await User.findById(userId);
    if (!user) throw { status: 404, message: "사용자 없음" };
    return user.toSafeJSON();
};

exports.resetPasswordService = async (email, name) => {
    // 1. 유저 찾기
    const user = await User.findOne({ email, name, provider: 'local' });
    if (!user) throw { status: 404, message: "일치하는 사용자 정보가 없습니다." };

    // 2. 임시 비밀번호 생성 (예: temp + 랜덤숫자 4자리)
    const tempPassword = `temp${Math.floor(1000 + Math.random() * 9000)}`;
    
    // 3. 비밀번호 암호화 후 저장
    user.passwordHash = await bcrypt.hash(tempPassword, 10);
    await user.save();

    return tempPassword; // 임시 비번 반환
};