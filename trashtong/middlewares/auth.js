const jwt = require("jsonwebtoken");

exports.authenticateToken = (req, res, next) => {
    let token = null;

    // 1️⃣ Authorization 헤더에서 먼저 추출 (1순위: 가장 강력함)
    const h = req.headers.authorization || '';
    if (h.toLowerCase().startsWith('bearer')) {
        token = h.slice(7).trim();
    }

    // 2️⃣ 헤더에 토큰이 '없을 때만' 쿠키에서 추출 (2순위: 백업용)
    // 수정됨: !token 조건을 추가하여, 헤더에 토큰이 있다면 쿠키값을 무시하고 헤더값을 씁니다.
    if (!token && req.cookies?.token) {
        token = req.cookies.token;
    }

    if (!token) {
        return res.status(401).json({ message: '토큰이 없습니다.' });
    }

    try {
        req.user = jwt.verify(token, process.env.JWT_SECRET);
        next();
    } catch (err) {
        console.error("❌ Invalid token:", err.message);
        return res.status(403).json({ message: '유효하지 않은 토큰입니다.' });
    }
};