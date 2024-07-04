const Member = require('../models/member');
const bcrypt = require('bcryptjs');
const validator = require('validator');
const appError = require('../utils/appError');
const handleSuccess = require('../utils/handleSuccess');
const { generateSendJWT, generateJWT } = require('../utils/auth');
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const { google } = require("googleapis");
const OAuth2 = google.auth.OAuth2;

const authController = {
    // 註冊會員
    signUp: async (req, res, next) => {
        let { account, password, confirmPassword } = req.body;

        // 驗證必填欄位
        if (!account || !password || !confirmPassword) {
            return next(appError(400, 'account, password, confirmPassword 為必填'));
        }

        // 驗證 email 格式
        if (!validator.isEmail(account)) {
            return next(appError(400, '請輸入有效 email 格式'));
        }

        // 檢查帳號是否已存在
        const isAccountExist = await Member.findOne({ account: account });
        if (isAccountExist) {
            return next(appError(400, '此 email 已註冊'));
        }

        // 檢查密碼是否一致
        if (password !== confirmPassword) {
            return next(appError(400, '密碼不一致'));
        }

        const isValidPassword = /^(?=.*[a-zA-Z])(?=.*[0-9]).{8,}$/.test(password);
        if (!isValidPassword) {
            return next(appError(400, '密碼需包含英文及數字，且至少 8 碼'));
        }

        password = await bcrypt.hash(password, 12);

        // 創建新會員
        const newMember = await Member.create({
            account,
            password,
        });

        if (!newMember) {
            return next(appError(500, '註冊失敗'));
        }

        generateSendJWT(newMember, 201, res, '註冊成功');
    },

    // 檢查帳號是否存在
    checkAccountExist: async (req, res, next) => {
        let { account } = req.body;

        // 驗證必填欄位
        if (!account) {
            return next(appError(400, 'account 為必填'));
        }

        // 驗證 email 格式
        if (!validator.isEmail(account)) {
            return next(appError(400, '請輸入有效 email 格式'));
        }

        // 檢查帳號是否已存在
        const isAccountExist = await Member.findOne({ account: account });
        if (isAccountExist) {
            return next(appError(400, '此 email 已註冊過會員'));
        }

        handleSuccess(res, isAccountExist, '此 email 可以使用');
    },

    // 會員登入
    login: async (req, res, next) => {
        let { account, password } = req.body;

        // 驗證必填欄位
        if (!account || !password) {
            return next(appError(400, 'account, password 為必填'));
        }

        // 檢查帳號是否存在且未被停權
        const member = await Member.findOne({ account: account }).select("+password");

        if (!member) {
            return next(appError(400, '帳號錯誤'));
        }

        if (member.status === 0) {
            return next(appError(400, '此帳號已被停權'));
        }

        // if (member.password === undefined) {
        //     return next(appError(400, '此為第三方登入帳號，請使用正確方式登入'));
        // }

        // 檢查密碼是否正確
        const isPasswordCorrect = await bcrypt.compare(password, member.password);
        if (!isPasswordCorrect) {
            return next(appError(400, '密碼錯誤'));
        }

        // 產生 token
        generateSendJWT(member, 200, res, '登入成功');
    },

    // 忘記密碼並寄送更改密碼郵件
    sendResetPwdEmail: async (req, res, next) => {
        const { account } = req.body;

        // 驗證必填欄位
        if (!account) {
            return next(appError(400, "account 為必填"));
        }

        // 驗證 email 格式
        if (!validator.isEmail(account)) {
            return next(appError(400, "請輸入有效 email 格式"));
        }

        // 檢查帳號是否存在
        const member = await Member.findOne({ account: account });
        if (!member) {
            return next(appError(400, "此 email 未註冊"));
        }

        // 產生重設密碼 token
        const resetToken = crypto.randomBytes(32).toString("hex");

        // 加密 token
        const hashedToken = crypto
            .createHash("sha256")
            .update(resetToken)
            .digest("hex");

        // 設定 token 有效時間
        const resetTokenExpires = new Date(Date.now() + 3600000); // 1 小時

        // 寄送重設密碼郵件
        const resetPasswordUrl = `https://ciaocraft-website.vercel.app/member/forgetPwd?token=${hashedToken}`;
        // const resetPasswordUrl = `http://localhost:3000/member/forgetPwd?token=${hashedToken}`;

        // 更新資料庫中的 token
        await Member.findByIdAndUpdate(member._id, {
            resetPasswordToken: hashedToken,
            resetPasswordExpires: resetTokenExpires,
        });

        // 讓 Google 驗證專案
        const oauth2Client = new OAuth2(
            process.env.GOOGLE_AUTH_CLIENTID,
            process.env.GOOGLE_AUTH_CLIENT_SECRET,
            "https://developers.google.com/oauthplayground"
        );

        oauth2Client.setCredentials({
            refresh_token: process.env.GOOGLE_AUTH_REFRESH_TOKEN,
        });

        // 取得一次性的 access token
        const accessToken = oauth2Client.getAccessToken();

        let transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                type: "OAuth2",
                user: "yu13142013@gmail.com",
                clientId: process.env.GOOGLE_AUTH_CLIENTID,
                clientSecret: process.env.GOOGLE_AUTH_CLIENT_SECRET,
                refreshToken: process.env.GOOGLE_AUTH_REFRESH_TOKEN,
                accessToken: accessToken,
            },
        });

        // 發送郵件
        const mailOptions = {
            from: "巧手玩藝 Ciao!Craft <yu13142013@gmail.com>",
            to: member.account,
            subject: `巧手玩藝 Ciao!Craft 重設密碼`,
            text: `請點擊以下連結重設密碼：${resetPasswordUrl}，連結將在 1 小時後失效。`,
        };

        await transporter.sendMail(mailOptions);

        handleSuccess(res, null, "重設密碼郵件已成功發送");
    },

    // 重設密碼
    resetPassword: async (req, res, next) => {
        const { token, password, confirmPassword } = req.body;

        if (!token || !password || !confirmPassword) {
            return next(appError(400, "請輸入所有必填欄位"));
        }

        // 檢查密碼是否符合規則
        const isValidPassword = /^(?=.*[a-zA-Z])(?=.*[0-9]).{8,}$/.test(password);
        if (!isValidPassword) {
            return next(appError(400, '密碼需包含英文及數字，且至少 8 碼'));
        }

        if (password !== confirmPassword) {
            return next(appError(400, "密碼不一致！"));
        }

        const now = new Date();

        // 檢查 token 是否有效
        const member = await Member.findOne({
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: now },
        });

        if (!member) {
            return next(appError(400, "token 無效或已過期"));
        }

        // 更新密碼
        const hashedPassword = await bcrypt.hash(password, 12);

        const updateMember = await Member.findByIdAndUpdate(member._id, {
            password: hashedPassword,
            resetPasswordToken: null,
            resetPasswordExpires: null,
        })

        generateSendJWT(member, 200, res, "重設密碼成功");
    },

    googleLoginCallback: async (req, res, next) => {
        // Successful authentication, redirect home.
        let member = await Member.findOne({ googleId: req.user.sub });
        if (!member) {
            member = await Member.create({
                googleId: req.user.sub,
                googleAccount: req.user.email,
                account: '',
                name: req.user.name,
                photo: req.user.picture,
            });

            if (!member) {
                return next(appError(500, 'Google 登入失敗'));
            }
        }
        // 產生 token 並加入 cookie
        const token = generateJWT(member);

        // res.redirect(`http://localhost:3000/SSOLogin?user=${token}&memberId=${member._id}`);
        res.redirect(`https://ciaocraft-website.vercel.app/SSOLogin?user=${token}&memberId=${member._id}`);
    },

    // 取消連結 Google 帳號
    unlinkGoogleAccount: async (req, res, next) => {
        const memeberId = req.user.id;

        // 清除 googleId
        const member = await Member.findByIdAndUpdate(memeberId, { googleId: null, googleAccount: null });

        if (!member) {
            return next(appError(500, '取消連結 Google 帳號失敗'));
        }

        handleSuccess(res, member, '取消連結 Google 帳號成功');
    },

    checkGoogleAccountExist: async (req, res, next) => {
        let { googleId } = req.params;

        // 驗證必填欄位
        if (!googleId) {
            return next(appError(400, 'googleId 為必填'));
        }

        // 檢查帳號是否已存在
        const isGoogleIdExist = await Member.findOne({ googleId: googleId });
        if (isGoogleIdExist) {
            return next(appError(400, '此 Google 帳號已綁定其他會員帳號'));
        }

        handleSuccess(res, isGoogleIdExist, '此 Google 帳號可以使用');
    }
};

module.exports = authController;