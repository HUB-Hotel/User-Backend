const express = require("express")
const router = express.Router()
const jwt = require("jsonwebtoken")
const bcrypt = require("bcrypt")
const passport = require('../config/passport')
const User = require("../models/User")
const { authenticateToken } = require('../middlewares/auth'); // ✅ 변경됨: auth → authenticateToken 명시적 미들웨어 사용
const LOCK_MAX = 5
const LOCKOUT_DURATION_MS = 2 * 60 * 1000

const FRONT_ORIGIN = process.env.FRONT_ORIGIN
const JWT_SECRET = process.env.JWT_SECRET

function makeToken(user) {
    return jwt.sign(
        {
            id: user._id.toString(),
            role: user.role,
            email: user.email
        },
        process.env.JWT_SECRET,
        {
            expiresIn: "7d",
            jwtid: `${user._id}-${Date.now()}`,
        }
    )
}

router.post("/register", async (req, res) => {
    try {
        const { email, password, displayName, role, phone } = req.body

        if (!email || !password || !phone) {
            return res.status(400).json({ message: "이메일/비밀번호/전화번호 필요" })
        }

        const exists = await User.findOne({
            email: email.toLowerCase()
        })
        if (exists) {
            return res.status(400).json({ message: "이미 가입된 이메일" })
        }

        const phoneExists = await User.findOne({ phone });
        if (phoneExists) {
            return res.status(400).json({ message: "이미 가입된 전화번호입니다." });
        }

        const passwordHash = await bcrypt.hash(password, 10)
        const validRoles = ["user", "admin"]
        const safeRole = validRoles.includes(role) ? role : "user"

        const user = await User.create({
            email,
            displayName,
            passwordHash,
            role: safeRole,
            phone
        })

        res.status(201).json({
            message: "회원 가입이 완료되었습니다!",
            user: user.toSafeJSON()
        })

    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ message: "중복된 정보(이메일 또는 전화번호)가 있습니다." });
        }
        return res.status(500).json({
            message: "회원가입 실패",
            error: error.message
        })

    }
})

router.post("/login", async (req, res) => {
    try {
        // 1) req.body에서 email, password를 꺼낸다(기본값은 빈 문자열).
        const email = String(req.body?.email || "").toLowerCase()
        const password = String(req.body?.password ?? "")
        const invalidMsg = { message: "이메일 또는 비밀번호가 올바르지 않습니다." };

        if (!email || !password) {
            return res.status(400).json({
                ...invalidMsg,
                remainingAttempts: null,
                locked: false
            })
        }

        //  2) 이메일을 소문자로 바꿔 활성화된 유저(isActive: true)만 조회한다. .findOne() /.toLowerCase()
        const user = await User.findOne({ email }).select(
            "+passwordHash +role +isActive +failedLoginAttempts +lastLoginAttempt"
        )

        // 3 사용자 없음
        if (!user) {
            return res.status(400).json({
                ...invalidMsg,
                loginAttempts: null,
                remainingAttempts: null,
                locked: false
            })
        }

        // 4 잠금 해제 로직
        if (!user.isActive) {
            const last = user.lastLoginAttempt ? user.lastLoginAttempt.getTime() : 0
            const passed = Date.now() - last;
            if (passed > LOCKOUT_DURATION_MS) {
                user.isActive = true
                user.failedLoginAttempts = 0
                user.lastLoginAttempt = null
                await user.save()
            }
        }

        // 5 여전히 잠금 상태면 로그인 불가
        if (!user.isActive) {
            const last = user.lastLoginAttempt ? user.lastLoginAttempt.getTime() : 0
            const remainMs = Math.max(0, LOCKOUT_DURATION_MS - (Date.now() - last))
            const remainMin = Math.ceil(remainMs / 60000)

            return res.status(423).json({
                message:
                    remainMs > 0
                        ? `계정이 잠금 상태입니다 약 ${remainMin}분후 다시 시도해 주세요`
                        : "계정이 잠금 상태입니다. 관리자에게 문의 하세요",
                locked: true
            })
        }

        // 6)비밀번호 검증 (User 모델에 comparePassword 메서드가 있다고 가정)
        const ok =
            typeof user.comparePassword === 'function'
                ? await user.comparePassword(password)
                : await bcrypt.compare(password, user.passwordHash || "")

        // 7)비밀번호 불일치
        if (!ok) {
            user.failedLoginAttempts += 1
            user.lastLoginAttempt = new Date()

            // 최대 횟수 초과 계정 잠금
            if (user.failedLoginAttempts >= LOCK_MAX) {
                user.isActive = false//잠금처리

                await user.save()

                return res.status(423).json({
                    message: "유효성 검증 실패로 계정이 잠겼습니다. 관리자에게 문의하세요.",
                    loginAttempts: user.failedLoginAttempts,
                    remainingAttempts: 0,
                    locked: true
                })
            }

            const remaining = Math.max(0, LOCK_MAX - user.failedLoginAttempts)
            await user.save()

            //  아직 잠금 전 400 현재 실패 남은 횟수 안내
            await user.save()
            return res.status(400).json({
                ...invalidMsg,
                loginAttempts: user.failedLoginAttempts,
                remainingAttempts: remaining,
                locked: false
            })
        }

        // 8.로그인 성공: 실패 카운트 초기화 접속 정보 업데이트
        user.failedLoginAttempts = 0
        user.lastLoginAttempt = new Date()

        await user.save()

        // 9 JWT 발급 및 쿠키 설정
        const token = makeToken(user)

        res.cookie('token', token, {
            httpOnly: true,
            sameSite: "lax",
            secure: process.env.NODE_ENV === "production",
            path: "/",
            maxAge: 7 * 24 * 60 * 60 * 1000
        })

        // 10 성공 응답: 사용자 정보 +토큰+ 참조용 카운트 
        return res.status(200).json({
            user: typeof user.toSafeJSON() === 'function' ? user.toSafeJSON() : {
                _id: user._id,
                email: user.email,
                displayName: user.displayName,
                role: user.role
            },
            token,
            loginAttempts: 0,
            remainingAttempts: LOCK_MAX,
            locked: false
        })

    } catch (error) {
        return res.status(500).json({
            message: "로그인 실패",
            error: error.message
        })
    }
})

router.get('/kakao', passport.authenticate('kakao'))

router.get('/kakao/callback', (req, res, next) => {
    passport.authenticate('kakao', {
        session: false
    }, async (err, user, info) => {
        if (err) {
            console.error('kakao error', err)
            return res.status(500).json({ message: "카카오 인증 에러" })
        }

        if (!user) {
            console.warn('카카오 로그인 실패', info)
            return res.redirect(`${FRONT_ORIGIN}/admin/login?error=kakao`)

        }

        const token = makeToken(user)
        const redirectUrl = `${FRONT_ORIGIN}/oauth/kakao?token=${token}`

        console.log('kakao redirect', redirectUrl)
        return res.redirect(redirectUrl)
    })(req, res, next)
})

router.get('/google', passport.authenticate('google', {
    scope: ['profile', 'email'] // 프로필과 이메일 정보 달라고 요청
}));

router.get('/google/callback',
    passport.authenticate('google', { session: false }),
    (req, res) => {
        // 성공 시 토큰 발급
        const token = makeToken(req.user);
        // 프론트엔드로 토큰과 함께 리다이렉트
        res.redirect(`${process.env.FRONT_ORIGIN}/oauth/google?token=${token}`);
    }
);

router.use(authenticateToken)

router.get("/me", async (req, res) => {
    try {
        const me = await User.findById(req.user.id)

        if (!me) return res.status(404).json({ message: "사용자 없음" })

        return res.status(200).json(me.toSafeJSON())

    } catch (error) {

        res.status(401).json({ message: "조회 실패", error: error.message })
    }
})

router.patch("/me", async (req, res) => {
    try {
        // 1. req.body에서 email도 받아오도록 추가
        const { displayName, phone, password, email } = req.body;
        const userId = req.user.id;

        // 내 정보 찾기
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: "사용자를 찾을 수 없습니다." });

        // 2. 이메일 변경 로직 (추가됨)

        if (email && email !== user.email) {
            // 소셜 로그인 유저는 이메일 변경을 막고 싶다면 이 주석을 해제하세요.
            if (user.provider !== 'local') return res.status(400).json({ message: "소셜 계정은 이메일을 변경할 수 없습니다." });

            // 중복 검사
            const emailExists = await User.findOne({ email: email.toLowerCase() });
            if (emailExists) {
                return res.status(400).json({ message: "이미 사용 중인 이메일입니다." });
            }
            user.email = email;
        }

        // 3. 전화번호 변경 시 중복 체크
        if (phone && phone !== user.phone) {
            const phoneExists = await User.findOne({ phone });
            if (phoneExists) {
                return res.status(400).json({ message: "이미 사용 중인 전화번호입니다." });
            }
            user.phone = phone;
        }

        // 4. 이름 변경
        if (displayName) {
            user.displayName = displayName;
        }

        // 5. 비밀번호 변경
        if (password) {
            if (user.provider !== 'local') {
                return res.status(400).json({ message: "소셜 로그인 유저는 비밀번호를 변경할 수 없습니다." });
            }
            const hash = await bcrypt.hash(password, 10);
            user.passwordHash = hash;
        }

        // 저장
        await user.save();

        res.json({
            message: "회원 정보가 수정되었습니다.",
            user: user.toSafeJSON()
        });

    } catch (error) {
        res.status(500).json({ message: "정보 수정 실패", error: error.message });
    }
});

router.get("/users", async (req, res) => {
    try {
        const me = await User.findById(req.user.id)
        if (!me) return res.status(404).json({ message: '사용자 없음' })


        if (me.role !== 'admin') {
            return res.status(403).json({ message: '권한 없음' })
        }
        const users = await User.find().select('-passwordHash')

        return res.status(200).json({ users })
    } catch (error) {
        res.status(401).json({ message: "조회 실패", error: error.message })

    }
})

router.post("/logout", async (req, res) => {
    try {
        await User.findByIdAndUpdate(
            req.user.id,
            { $set: { isLoggined: false }, },
            { new: true }
        )

        res.clearCookie('token', {
            httpOnly: true,
            sameSite: "lax",
            secure: process.env.NODE_ENV === "production",
            path: '/'
        })
        return res.status(200).json({ message: '로그아웃 성공' })
    } catch (error) {

        return res.status(500).json({ message: '로그아웃 실패', error: error.message })
    }
})



module.exports = router