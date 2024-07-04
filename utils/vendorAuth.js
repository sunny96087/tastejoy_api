const jwt = require("jsonwebtoken");
const appError = require("../utils/appError");
const handleErrorAsync = require("../utils/handleErrorAsync");
const Vendor = require("../models/vendor");
const dotenv = require("dotenv");
dotenv.config({ path: "./config.env" });

const isVendorAuth = handleErrorAsync(async (req, res, next) => {
  // 確認 token 是否存在
  let token;
  //   if (
  //     req.headers.authorization &&
  //     req.headers.authorization.startsWith("Bearer")
  //   ) {
  //     token = req.headers.authorization.split(" ")[1];
  //   }

  if (req.headers.token) {
    token = `${req.headers.token}`;
  } else {
    return next(appError(401, "你尚未登入！"));
  }

  //   console.log(token);

  // 驗證 token 正確性
  const decoded = await new Promise((resolve, reject) => {
    jwt.verify(token, process.env.JWT_SECRET, (err, payload) => {
      if (err) {
        reject(err);
        return next(appError(400, "token 不正確！"));
      } else {
        resolve(payload);
      }
    });
  });
  const currentVendor = await Vendor.findById(decoded.id);

  req.vendor = currentVendor;
  // console.log(req.vendor);
  next();
});
const generateSendJWT = (vendor, statusCode, res, message) => {
  // 產生 JWT token＿＿＿＿＿＿＿＿＿＿＿＿使用 JWT_SECRET 混淆
  const token = jwt.sign({ id: vendor._id }, process.env.JWT_SECRET, {
    // 設定 token 過期時間
    expiresIn: process.env.JWT_EXPIRES_DAY,
  });
  vendor.password = undefined;
  res.status(statusCode).json({
    status: "success",
    statusCode,
    vendor: {
      token,
      brandName: vendor.brandName,
      account: vendor.account,
      id: vendor._id,
      avatar: vendor.avatar,
      mobile: vendor.mobile,
      // isAdmin: vendor.isAdmin,
      // googleId: vendor.googleId,
      // url: 'http://localhost:3000/'
    },
    message,
  });
};

module.exports = {
  isVendorAuth,
  generateSendJWT,
};
