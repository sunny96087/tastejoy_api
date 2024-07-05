const express = require("express");
const router = express.Router();
const handleErrorAsync = require("../utils/handleErrorAsync");
const authController = require("../controllers/authController");
const { isAuth } = require("../utils/auth");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const passport = require("passport");

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_AUTH_CLIENTID,
      clientSecret: process.env.GOOGLE_AUTH_CLIENT_SECRET,
      callbackURL: "http://localhost:3666/auth/google/callback",
      // callbackURL: "https://ciaocraft-api.onrender.com/auth/google/callback"
    },
    (accessToken, refreshToken, profile, cb) => cb(null, profile._json)
  )
);

// 註冊會員
router.post(
  "/signup",
  handleErrorAsync(authController.signUp)
  /*
    #swagger.tags = ['Auth-front']
    #swagger.summary = '註冊'
    #swagger.description = `註冊會員<br>
        * account(string): 帳號。需為 Email 格式<br>
        * password(string): 密碼。需至少 8 位數，且英數混合。<br>
        * confirmPassword(string): 確認密碼。兩次密碼需一致。<br>
    `
    #swagger.parameters['body'] = {
        in: 'body',
        description: '登入資訊',
        required: true,
        schema: {
            $account: "tester01@test.test",
            $password: "tester01",
            $confirmPassword: "tester01"
          }
      }
  */
);

// 會員登入
router.post(
  "/signin",
  handleErrorAsync(authController.login)
  /*
    #swagger.tags = ['Auth-front']
    #swagger.summary = '登入'
    #swagger.description = `會員登入<br>
        * account(string): 帳號。需為 Email 格式<br>
        * password(string): 密碼。需至少 8 位數，且英數混合。<br>
    `
    #swagger.parameters['body'] = {
        in: 'body',
        description: '登入資訊',
        required: true,
        schema: {
            $account: "tester01@test.test",
            $password: "tester01"
          }
      }
  */
);

// 檢查帳號是否可以使用 (即不存在)
router.post(
  "/check-account-exist",
  handleErrorAsync(authController.checkAccountExist)
  /*
    #swagger.tags = ['Auth-front']
    #swagger.summary = '檢查帳號是否可以使用'
    #swagger.description = `檢查帳號是否可以使用<br>
        不存在回傳 200，已存在回傳 400<br>
        * account(string): 帳號。需為 Email 格式`
    #swagger.parameters['body'] = {
      in: 'body',
      required: true,
      schema : {
        $account: 'tester01@test.test'
      }
    }
  */
);

// 檢查帳號是否重複 (即已存在)
router.post(
  "/check-account-duplicate",
  handleErrorAsync(authController.checkAccountDuplicate)
  /*
    #swagger.tags = ['Auth-front']
    #swagger.summary = '檢查帳號是否重複'
    #swagger.description = `檢查帳號是否重複<br>
        已存在回傳 200，不存在回傳 400<br>
        * account(string): 帳號。需為 Email 格式`
    #swagger.parameters['body'] = {
      in: 'body',
      required: true,
      schema : {
        $account: 'tester01@test.test'
      }
    }
  */
);

// 忘記密碼並寄送更改密碼郵件
router.post(
  "/forget-password",
  handleErrorAsync(authController.sendResetPwdEmail)
  /*
    #swagger.tags = ['Auth-front']
    #swagger.summary = '忘記密碼'
    #swagger.description = '忘記密碼，發送重設密碼信至會員信箱，測試要收到信要帶真實信箱'
    #swagger.parameters['body'] = {
      in: 'body',
      required: true,
      schema: {
        $account: 'tester01@test.test'
      }
    }
  */
);

// 重設密碼
router.post(
  "/reset-password",
  handleErrorAsync(authController.resetPassword)
  /*
    #swagger.tags = ['Auth-front']
    #swagger.summary = '重設密碼'
    #swagger.description = '重設密碼'
    #swagger.parameters['body'] = {
      in: 'body',
      required: true,
      schema: {
        $token: "重設密碼 token",
        $password: "Aa123456@",
        $confirmPassword: "Aa123456@"
      }
    }
  */
);

// google 登入
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
  /** 
    #swagger.tags = ['Auth-front']
    #swagger.summary = 'Google 登入'
    #swagger.description = 'Google 登入'
  */
);

router.get(
  "/google/callback",
  passport.authenticate("google", {
    // failureRedirect: "https://ciaocraft-website.vercel.app", // BUG: 這裡要改成前端網址
    failureRedirect: "http://localhost:5173",
    session: false,
  }),
  // passport.authenticate("google", { failureRedirect: 'http://localhost:3000', session: false }),
  handleErrorAsync(authController.googleLoginCallback)
  /** 
    #swagger.tags = ['Auth-front']
    #swagger.summary = 'Google 登入 callback'
    #swagger.description = 'Google 登入 callback'
  */
);

// router.post(
//   "/linkGoogleAccount",
//   handleErrorAsync(authController.linkGoogleAccount)
//   /*
//     #swagger.tags = ['Auth-front']
//     #swagger.summary = 'Google 帳號綁定'
//     #swagger.description = 'Google 帳號綁定'
//   */
// );

// router.post(
//   "/unlinkGoogleAccount",
//   isAuth,
//   handleErrorAsync(authController.unlinkGoogleAccount)
//   /*
//     #swagger.tags = ['Auth-front']
//     #swagger.summary = 'Google 帳號解除綁定'
//     #swagger.description = 'Google 帳號解除綁定'
//   */
// );

// router.get(
//   "/checkGoogleAccountExist/:googleId",
//   isAuth,
//   handleErrorAsync(authController.checkGoogleAccountExist)
// );
/*
  #swagger.tags = ['Auth-front']
  #swagger.summary = '檢查 Google 帳號是否已綁定'
  #swagger.description = '檢查 Google 帳號是否已綁定'
  #swagger.parameters['googleId'] = {
    in: 'path',
    description: 'googleId',
    required: true,
    type: 'string'
  }
*/

router.get("/login", (req, res) => {
  res.render("login");
});

router.get("/fail", (req, res) => {
  res.render("fail");
});

module.exports = router;
