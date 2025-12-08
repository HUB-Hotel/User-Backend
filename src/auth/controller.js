const authService = require("./service");
const { successResponse, errorResponse } = require("../common/response");

exports.register = async (req, res) => {
    try {
        const data = await authService.registerService(req.body);
        res.status(201).json(successResponse(data, "회원가입이 완료되었습니다.", 201));
    } catch (err) {
        const status = err.status || 500;
        const message = err.message || "회원가입 중 오류가 발생했습니다.";
        res.status(status).json(errorResponse(message, status));
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        
        if (!email) {
            return res.status(400).json(errorResponse("이메일을 입력해주세요.", 400));
        }
        if (!password) {
            return res.status(400).json(errorResponse("비밀번호를 입력해주세요.", 400));
        }
        
        const { user, token } = await authService.loginService(email, password);

        res.cookie('token', token, { httpOnly: true, path: "/" });

        res.status(200).json(successResponse({ user, token }, "로그인되었습니다.", 200));
    } catch (err) {
        const status = err.status || 500;
        const message = err.message || "로그인 중 오류가 발생했습니다.";
        res.status(status).json(errorResponse(message, status));
    }
};

// ✅ [추가] 로그아웃 (쿠키 삭제)
exports.logout = (req, res) => {
    try {
        // 쿠키를 비우고 옵션을 동일하게 줘서 만료시킴
        res.clearCookie('token', { httpOnly: true, path: "/" });
        res.status(200).json(successResponse(null, "로그아웃 되었습니다.", 200));
    } catch (err) {
        res.status(500).json(errorResponse(err.message, 500));
    }
};

exports.getMe = async (req, res) => {
    try {
        const data = await authService.getMeService(req.user.id);
        res.status(200).json(successResponse(data, "내 정보 조회 성공", 200));
    } catch (err) {
        const status = err.status || 500;
        const message = err.message || "사용자 정보를 불러오는데 실패했습니다.";
        res.status(status).json(errorResponse(message, status));
    }
};

exports.updateMe = async (req, res) => {
    try {
        const data = await authService.updateMeService(req.user.id, req.body);
        res.status(200).json(successResponse(data, "정보가 수정되었습니다.", 200));
    } catch (err) {
        const status = err.status || 500;
        const message = err.message || "정보 수정에 실패했습니다.";
        res.status(status).json(errorResponse(message, status));
    }
};

// ✅ 추가됨: 구글 로그인 콜백 처리
exports.googleCallback = (req, res) => {
    try {
        // Passport가 req.user에 유저 정보를 담아줌 -> 토큰 생성
        const token = authService.generateToken(req.user);

        // 프론트엔드로 리다이렉트 (토큰 전달)
        res.redirect(`${process.env.FRONT_ORIGIN}/oauth/google?token=${token}`);
    } catch (err) {
        res.status(500).json(errorResponse("소셜 로그인 실패", 500));
    }
};

// ▼▼▼ [추가] 카카오 로그인 콜백 ▼▼▼
exports.kakaoCallback = (req, res) => {
    try {
        const token = authService.generateToken(req.user);
        // 프론트엔드의 카카오 처리 페이지로 리다이렉트
        // (프론트 주소는 상황에 맞춰 /oauth/callback 등으로 통일해도 됨)
        res.redirect(`${process.env.FRONT_ORIGIN}/oauth/kakao?token=${token}`);
    } catch (err) {
        res.status(500).json(errorResponse("카카오 로그인 실패", 500));
    }
};

exports.resetPassword = async (req, res) => {
    try {
        const { email, name } = req.body;
        
        if (!email) {
            return res.status(400).json(errorResponse("이메일을 입력해주세요.", 400));
        }
        if (!name) {
            return res.status(400).json(errorResponse("이름을 입력해주세요.", 400));
        }
        
        const tempPassword = await authService.resetPasswordService(email, name);
        
        res.status(200).json(successResponse({ tempPassword }, "임시 비밀번호가 발급되었습니다."));
    } catch (err) {
        const status = err.status || 500;
        const message = err.message || "비밀번호 재설정에 실패했습니다.";
        res.status(status).json(errorResponse(message, status));
    }
};