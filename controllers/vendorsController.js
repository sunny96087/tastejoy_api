const dayjs = require("dayjs");
const tools = require("../utils/tools");
const appError = require("../utils/appError");
const handleSuccess = require("../utils/handleSuccess"); // 引入自訂的成功處理工具
const validator = require("validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { isVendorAuth, generateSendJWT } = require("../utils/vendorAuth");
const Vendor = require("../models/vendor");
const {
  Course,
  CourseItem,
  CourseComment,
  CourseClickLog,
} = require("../models/course");
const Order = require("../models/order");
const Member = require("../models/member");
const Teacher = require("../models/teacher");

const nodemailer = require("nodemailer");
const { google } = require("googleapis");
const OAuth2 = google.auth.OAuth2;

const dotenv = require("dotenv");
dotenv.config({ path: "./config.env" });
const crypto = require("crypto");
const mongoose = require("mongoose");

const vendorController = {
  // todo : 分成 3 個使用方 ( Front 前台, Back 後台, Manage 平台管理 )

  // >> 審核後給予賣家密碼 (Manage)
  updateVendorManage: async function (req, res, next) {
    const vendorId = req.params.vendorId;
    const { adminPassword, password } = req.body;

    const correctAdminPassword = process.env.ADMIN_PASSWORD;

    if (adminPassword !== correctAdminPassword) {
      return next(appError("401", "管理員密碼錯誤！"));
    }

    let hashedPassword = await bcrypt.hash(password, 12);

    const vendor = await Vendor.findByIdAndUpdate(
      vendorId,
      {
        password: hashedPassword,
        status: 1, // 審核通過
      },
      { new: true }
    );

    if (!vendor) {
      return next(appError("404", "用戶不存在！"));
    }

    handleSuccess(res, vendor, "更新賣家資料成功");
  },

  // >> 寄開通信給賣家 (Manage)
  sendEmailToVendor: async function (req, res, next) {
    const vendorId = req.params.vendorId;
    const { adminPassword, subject, text } = req.body;

    // 檢查管理員密碼是否正確
    const correctAdminPassword = process.env.ADMIN_PASSWORD;

    if (adminPassword !== correctAdminPassword) {
      return next(appError("401", "管理員密碼錯誤！"));
    }

    // 從資料庫中找到賣家
    const vendor = await Vendor.findById(vendorId);
    if (!vendor) {
      return next(appError(400, "找不到該賣家"));
    }

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
      to: vendor.account,
      subject: subject,
      text: text,
    };

    await transporter.sendMail(mailOptions);

    // 回應成功
    handleSuccess(res, mailOptions, "審核通過郵件已成功發送給賣家");
  },

  // >> 取得全部賣家資料 (Manage)
  getVendorsManage: async function (req, res, next) {
    const { adminPassword } = req.body;

    // 檢查管理員密碼是否正確
    const correctAdminPassword = process.env.ADMIN_PASSWORD;

    if (adminPassword !== correctAdminPassword) {
      return next(appError("401", "管理員密碼錯誤！"));
    }

    const data = await Vendor.find(); // 查詢所有資料
    handleSuccess(res, data, "取得所有資料成功");
  },

  // ? 登入 (Back)
  vendorLogin: async function (req, res, next) {
    const { account, password } = req.body;
    if (!account || !password) {
      return next(appError(400, "帳號密碼不可為空"));
    }

    // 檢查 account 是否存在
    const vendor = await Vendor.findOne({ account }).select("+password");
    if (!vendor) {
      return next(appError(400, "帳號不存在"));
    }

    // 檢查狀態
    switch (vendor.status) {
      case 0:
        return next(appError(400, "帳號正在審核中"));
      case 2:
        return next(appError(400, "帳號被停權，若有疑問請聯絡平台管理員"));
      case 1:
        break; // 如果 status 為 1，則不做任何事情並繼續執行後續的程式碼
      default:
        return next(appError(400, "帳號狀態錯誤"));
    }

    // 檢查密碼
    const auth = await bcrypt.compare(password, vendor.password);
    if (!auth) {
      return next(appError(400, "您的密碼不正確"));
    }

    // 更新登入時間
    vendor.loginAt = Date.now();
    await vendor.save();
    generateSendJWT(vendor, 200, res);
  },

  // ? 確認賣家帳號是否存在 (Back)
  checkAdminVendorAccount: async function (req, res, next) {
    const account = req.params.account;

    const data = await Vendor.findOne({ account });
    if (data) {
      handleSuccess(res, null, "該帳號存在");
    } else {
      return next(appError(400, "該帳號不存在"));
    }
  },

  // ? 賣家儀表板總覽 (Back) => 缺 訪問用戶數
  getVendorAdminOverview: async function (req, res, next) {
    const vendorId = req.vendor.id;

    // note 今日 訂單收入（NT$）
    const todayIncome = await Order.aggregate([
      {
        $match: {
          vendorId: vendorId,
          paidStatus: { $in: [0, 1, 2, 3] },
          createdAt: {
            $gte: dayjs().startOf("day").toDate(),
            $lte: dayjs().endOf("day").toDate(),
          },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$totalAmount" },
        },
      },
    ]);

    // note 今日 訂單數量
    const todayOrderCount = await Order.find({
      vendorId: new mongoose.Types.ObjectId(vendorId),
      createdAt: {
        $gte: dayjs().startOf("day").toDate(),
        $lte: dayjs().endOf("day").toDate(),
      },
    }).countDocuments();

    // note 今日 訪問人數
    const todayVisitCount = await CourseClickLog.find({
      vendorId: new mongoose.Types.ObjectId(vendorId),
      createdAt: {
        $gte: dayjs().startOf("day").toDate(),
        $lte: dayjs().endOf("day").toDate(),
      },
    }).countDocuments();

    // note 今日 開課中課程
    const todaySaleCourseCount = await Course.countDocuments({
      vendorId: new mongoose.Types.ObjectId(vendorId),
      courseStatus: 1,
    });

    // note 今日 已完售課程
    const todaySoldCourseCount = await Course.countDocuments({
      vendorId: new mongoose.Types.ObjectId(vendorId),
      courseStatus: 2,
    });

    // note 近7日 訂單收入(NT$)
    const sevenDaysAgo = dayjs().subtract(7, "day").toDate();

    const income7Days = await Order.aggregate([
      {
        $match: {
          vendorId: new mongoose.Types.ObjectId(vendorId),
          paidStatus: { $in: [0, 1, 2, 3] },
          createdAt: {
            $gte: sevenDaysAgo,
            $lte: dayjs().toDate(),
          },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$totalPrice" },
        },
      },
    ]);

    const totalIncomeLast7Days =
      income7Days.length > 0 ? income7Days[0].total : 0;

    // note 近7日 訂單數量
    const orderCountLast7Days = await Order.countDocuments({
      vendorId: new mongoose.Types.ObjectId(vendorId),
      createdAt: {
        $gte: sevenDaysAgo,
        $lte: dayjs().toDate(),
      },
    });

    // note 近7日 訪問用戶數
    const visitCountLast7Days = await CourseClickLog.countDocuments({
      vendorId: new mongoose.Types.ObjectId(vendorId),
      createdAt: {
        $gte: sevenDaysAgo,
        $lte: dayjs().toDate(),
      },
    });

    // note 近7日 每日的日期 & (體驗課 & 培訓課)銷售金額 & % 數佔比
    const salesDataLast7Days = await Order.aggregate([
      {
        $match: {
          vendorId: new mongoose.Types.ObjectId(vendorId),
          paidStatus: { $in: [0, 1, 2, 3] },
          createdAt: {
            $gte: dayjs().subtract(7, "day").toDate(),
            $lte: dayjs().toDate(),
          },
        },
      },
      {
        $lookup: {
          from: "courses",
          localField: "courseId",
          foreignField: "_id",
          as: "course",
        },
      },
      {
        $unwind: "$course",
      },
      {
        $addFields: {
          date: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
          },
        },
      },
      {
        $group: {
          _id: {
            date: "$date",
            courseTerm: "$course.courseTerm",
          },
          totalSales: { $sum: "$totalPrice" },
        },
      },
      {
        $group: {
          _id: "$_id.date",
          sales: {
            $push: {
              courseTerm: "$_id.courseTerm",
              totalSales: "$totalSales",
            },
          },
          totalSales: { $sum: "$totalSales" },
        },
      },
      {
        $project: {
          _id: 0,
          date: "$_id",
          sales: {
            $map: {
              input: "$sales",
              as: "sale",
              in: {
                courseTerm: "$$sale.courseTerm",
                totalSales: "$$sale.totalSales",
                percentage: {
                  $multiply: [
                    { $divide: ["$$sale.totalSales", "$totalSales"] },
                    100,
                  ],
                },
              },
            },
          },
        },
      },
    ]);

    // note 近7日 體驗課 & 培訓課 銷售總額 & % 數佔比
    const salesSummaryLast7Days = await Order.aggregate([
      {
        $match: {
          vendorId: new mongoose.Types.ObjectId(vendorId),
          paidStatus: { $in: [0, 1, 2, 3] },
          createdAt: {
            $gte: sevenDaysAgo,
            $lte: dayjs().toDate(),
          },
        },
      },
      {
        $lookup: {
          from: "courses",
          localField: "courseId",
          foreignField: "_id",
          as: "course",
        },
      },
      {
        $unwind: "$course",
      },
      {
        $group: {
          _id: "$course.courseTerm",
          totalSales: { $sum: "$totalPrice" },
        },
      },
      {
        $group: {
          _id: null,
          totalSales: { $sum: "$totalSales" },
          sales: {
            $push: {
              courseTerm: "$_id",
              totalSales: "$totalSales",
            },
          },
        },
      },
      {
        $unwind: "$sales",
      },
      {
        $project: {
          _id: 0,
          trem: "$sales.courseTerm",
          total: "$sales.totalSales",
          percentage: {
            $multiply: [{ $divide: ["$sales.totalSales", "$totalSales"] }, 100],
          },
        },
      },
    ]);

    // note 近30日 訂單收入(NT$)
    const thirtyDaysAgo = dayjs().subtract(30, "day").toDate();

    const incomeLast30Days = await Order.aggregate([
      {
        $match: {
          vendorId: new mongoose.Types.ObjectId(vendorId),
          paidStatus: { $in: [0, 1, 2, 3] },
          createdAt: {
            $gte: thirtyDaysAgo,
            $lte: dayjs().toDate(),
          },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$totalPrice" },
        },
      },
    ]);

    // note 近30日 訂單數量
    const orderCountLast30Days = await Order.countDocuments({
      vendorId: vendorId,
      createdAt: {
        $gte: thirtyDaysAgo,
        $lte: dayjs().toDate(),
      },
    });

    // note 近30日 訪問用戶數
    const visitCountLast30Days = await CourseClickLog.find({
      vendorId: new mongoose.Types.ObjectId(vendorId),
      createdAt: {
        $gte: thirtyDaysAgo,
        $lte: dayjs().toDate(),
      },
    }).countDocuments();

    // note 近30日 每日的日期 & (體驗課 & 培訓課)銷售金額 & % 數佔比
    const salesDataLast30Days = await Order.aggregate([
      {
        $match: {
          vendorId: new mongoose.Types.ObjectId(vendorId),
          paidStatus: { $in: [0, 1, 2, 3] },
          createdAt: {
            $gte: thirtyDaysAgo,
            $lte: dayjs().toDate(),
          },
        },
      },
      {
        $lookup: {
          from: "courses",
          localField: "courseId",
          foreignField: "_id",
          as: "course",
        },
      },
      {
        $unwind: "$course",
      },
      {
        $addFields: {
          date: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
          },
        },
      },
      {
        $group: {
          _id: {
            date: "$date",
            courseTerm: "$course.courseTerm",
          },
          totalSales: { $sum: "$totalPrice" },
        },
      },
      {
        $group: {
          _id: "$_id.date",
          sales: {
            $push: {
              courseTerm: "$_id.courseTerm",
              totalSales: "$totalSales",
            },
          },
          totalSales: { $sum: "$totalSales" },
        },
      },
      {
        $project: {
          _id: 0,
          date: "$_id",
          sales: {
            $map: {
              input: "$sales",
              as: "sale",
              in: {
                courseTerm: "$$sale.courseTerm",
                totalSales: "$$sale.totalSales",
                percentage: {
                  $multiply: [
                    { $divide: ["$$sale.totalSales", "$totalSales"] },
                    100,
                  ],
                },
              },
            },
          },
        },
      },
    ]);

    // note 近30日 體驗課 & 培訓課 銷售總額 & % 數佔比
    const salesSummaryLast30Days = await Order.aggregate([
      {
        $match: {
          vendorId: new mongoose.Types.ObjectId(vendorId),
          paidStatus: { $in: [0, 1, 2, 3] },
          createdAt: {
            $gte: thirtyDaysAgo,
            $lte: dayjs().toDate(),
          },
        },
      },
      {
        $lookup: {
          from: "courses",
          localField: "courseId",
          foreignField: "_id",
          as: "course",
        },
      },
      {
        $unwind: "$course",
      },
      {
        $group: {
          _id: "$course.courseTerm",
          totalSales: { $sum: "$totalPrice" },
        },
      },
      {
        $group: {
          _id: null,
          totalSales: { $sum: "$totalSales" },
          sales: {
            $push: {
              courseTerm: "$_id",
              totalSales: "$totalSales",
            },
          },
        },
      },
      {
        $unwind: "$sales",
      },
      {
        $project: {
          _id: 0,
          trem: "$sales.courseTerm",
          total: "$sales.totalSales",
          percentage: {
            $multiply: [{ $divide: ["$sales.totalSales", "$totalSales"] }, 100],
          },
        },
      },
    ]);

    // note 訂單 待退款, 待付款, 待確認 數量
    let orderStatusCounts = await Order.aggregate([
      {
        $match: {
          vendorId: new mongoose.Types.ObjectId(vendorId),
          paidStatus: { $in: [0, 1, 6] },
        },
      },
      {
        $group: {
          _id: null,
          status0: {
            $sum: {
              $cond: [{ $eq: ["$paidStatus", 0] }, 1, 0],
            },
          },
          status1: {
            $sum: {
              $cond: [{ $eq: ["$paidStatus", 1] }, 1, 0],
            },
          },
          status6: {
            $sum: {
              $cond: [{ $eq: ["$paidStatus", 6] }, 1, 0],
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          status0: 1,
          status1: 1,
          status6: 1,
        },
      },
    ]);

    // 如果查詢結果為空，則返回一個包含所有狀態並設為 0 的物件
    if (orderStatusCounts.length === 0) {
      orderStatusCounts = [{ status0: 0, status1: 0, status6: 0 }];
    } else {
      // 檢查每個狀態的數量，如果沒有該狀態的數量，則設為 0
      const statusCounts = orderStatusCounts[0];
      if (statusCounts.status0 === undefined) statusCounts.status0 = 0;
      if (statusCounts.status1 === undefined) statusCounts.status1 = 0;
      if (statusCounts.status6 === undefined) statusCounts.status6 = 0;
    }

    // 全部資料整合
    const data = {
      todayIncome: todayIncome[0] ? todayIncome[0].total : 0,
      todayOrderCount,
      todayVisitCount,
      todaySaleCourseCount,
      todaySoldCourseCount,
      totalIncomeLast7Days,
      orderCountLast7Days,
      visitCountLast7Days,
      salesDataLast7Days,
      salesSummaryLast7Days,
      totalIncomeLast30Days: incomeLast30Days[0]
        ? incomeLast30Days[0].total
        : 0,
      orderCountLast30Days,
      visitCountLast30Days,
      salesDataLast30Days,
      salesSummaryLast30Days,
      orderStatusCounts,
    };

    handleSuccess(res, data, "取得賣家儀表板總覽成功");
  },

  // ? 忘記密碼 (Back)
  forgotVendorPassword: async function (req, res, next) {
    const { account } = req.body;

    if (!account) {
      return next(appError(400, "請輸入帳號"));
    }

    const vendor = await Vendor.findOne({ account });
    if (!vendor) {
      return next(appError(400, "找不到該帳號"));
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

    const verificationUrl = `https://ciaocraft-website.vercel.app/resetVendorPassword?token=${hashedToken}`;

    // 更新資料庫中的 token
    await Vendor.findByIdAndUpdate(vendor._id, {
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
      to: vendor.account,
      subject: `巧手玩藝 Ciao!Craft 重設密碼`,
      text: `請點擊以下連結重設密碼：${verificationUrl}，連結將在 1 小時後失效。`,
    };

    await transporter.sendMail(mailOptions);

    // 回應成功
    handleSuccess(res, null, "重設密碼郵件已成功發送");
  },

  // ? 忘記密碼 -> 重設密碼 (Back)
  resetVendorPassword: async function (req, res, next) {
    const { token, password, confirmPassword } = req.body;

    if (!token || !password || !confirmPassword) {
      return next(appError(400, "請輸入所有必填欄位"));
    }

    // 檢查密碼是否符合規則
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;
    if (!passwordRegex.test(password)) {
      return next(appError(400, "密碼必須為英數混合且至少 8 碼"));
    }

    if (password !== confirmPassword) {
      return next(appError(400, "密碼不一致！"));
    }

    // 檢查 token 是否有效
    const vendor = await Vendor.findOne({
      resetPasswordToken: token,
      // resetPasswordExpires: { $gt: Date.now() },
    });

    if (!vendor) {
      return next(appError(400, "token 無效或已過期"));
    }

    // 更新密碼
    const hashedPassword = await bcrypt.hash(password, 12);
    vendor.password = hashedPassword;
    vendor.resetPasswordToken = undefined;
    vendor.resetPasswordExpires = undefined;
    await vendor.save();

    generateSendJWT(vendor, 200, res, "重設密碼成功");
  },

  // ? 取得登入賣家資料 (Back)
  getVendorAdmin: async function (req, res, next) {
    const id = req.vendor.id;
    const vendor = await Vendor.findById(id);
    // ? 還沒選要顯示哪些資料

    if (vendor) {
      handleSuccess(res, vendor, "取得賣家資料成功");
    } else {
      return next(appError(400, "找不到該賣家"));
    }
  },

  // ? 編輯賣家資料 (Back)
  updateVendor: async function (req, res, next) {
    const id = req.vendor.id;
    let data = req.body;

    // 使用 trimObjectValues 函數來去掉資料中所有值的空格
    data = tools.trimObjectAllValues(data);

    // 使用 hasDataChanged 函數來檢查資料是否有改變
    const oldData = await Vendor.findById(id);
    if (!tools.hasDataChanged(oldData, data)) {
      return next(appError(400, "資料未變更"));
    }

    const updateVendor = await Vendor.findByIdAndUpdate(
      // 更新指定 ID 的資料
      id,
      {
        representative: data.representative,
        mobile: data.mobile,
        brandName: data.brandName,
        avatar: data.avatar,
        bannerImage: data.bannerImage,
        intro: data.intro,
        socialMedias: data.socialMedias,
        bankName: data.bankName,
        bankCode: data.bankCode,
        bankBranch: data.bankBranch,
        bankAccountName: data.bankAccountName,
        bankAccount: data.bankAccount,
        address: data.address,
        notice: data.notice,
      },
      { new: true }
    );

    if (updateVendor) {
      handleSuccess(res, updateVendor, "更新賣家資料成功");
    } else {
      return next(appError(400, "資料更新失敗"));
    }
  },

  // ? 修改密碼 (Back)
  updateVendorPassword: async function (req, res, next) {
    const { currentPassword, password, confirmPassword } = req.body;

    if (!currentPassword || !password || !confirmPassword) {
      return next(appError(400, "請輸入所有必填欄位"));
    }

    // 首先，驗證現有的密碼
    const vendor = await Vendor.findById(req.vendor.id).select("+password");
    if (!vendor || !vendor.password) {
      return next(appError("400", "無法驗證現有密碼"));
    }

    const isMatch = await bcrypt.compare(currentPassword, vendor.password);
    if (!isMatch) {
      return next(appError("400", "現有密碼不正確"));
    }

    // 密碼必須為英數混合且至少 8 碼
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;
    if (!passwordRegex.test(password)) {
      return next(appError("400", "密碼必須為英數混合且至少 8 碼"));
    }

    if (password !== confirmPassword) {
      return next(appError("400", "密碼不一致！"));
    }
    let newPassword = await bcrypt.hash(password, 12);

    await Vendor.findByIdAndUpdate(req.vendor.id, {
      password: newPassword,
    });
    generateSendJWT(vendor, 200, res, "更改密碼成功");
  },

  // * 新增賣家申請 (Front)
  newVendorReview: async function (req, res, next) {
    let data = req.body;
    data = tools.trimObjectAllValues(data);

    if (data) {
      // 定義及檢查數據是否包含所有必填欄位
      const requiredFields = [
        "representative",
        "mobile",
        "brandName",
        "account",
      ];
      const { isValid, missingFields } = tools.checkRequiredFields(
        data,
        requiredFields
      );
      if (!isValid) {
        return next(
          appError(400, `以下欄位為必填: ${missingFields.join(", ")}`)
        );
      }

      // 定義及檢查欄位內容不得為空
      const fieldsToCheck = [
        "representative",
        "mobile",
        "brandName",
        "account",
      ];
      const errorMessage = tools.checkFieldsNotEmpty(data, fieldsToCheck);
      if (errorMessage) {
        return next(appError(400, errorMessage));
      }

      // 定義及提供的數據是否只包含了允許的欄位
      const allowedFields = [
        "representative",
        "mobile",
        "brandName",
        "account",
        "reviewLinks",
        "reviewBrief",
        "reviewImages",
      ];
      const invalidFieldsError = tools.validateFields(data, allowedFields);
      if (invalidFieldsError) {
        return next(appError(400, invalidFieldsError));
      }

      // 檢查 account 是否重複
      const existingUser = await Vendor.findOne({ account: data.account });
      if (existingUser) {
        return next(appError(400, "該 account 已經被註冊"));
      }

      // 建立資料
      const newVendor = await Vendor.create({
        representative: data.representative,
        mobile: data.mobile,
        brandName: data.brandName,
        account: data.account,
        reviewLinks: data.reviewLinks,
        reviewBrief: data.reviewBrief,
        reviewImages: data.reviewImages,
      });

      handleSuccess(res, newVendor, "送出賣家申請成功", 201);
    } else {
      return next(appError(400, "請輸入必填資料"));
    }
  },

  // * 確認賣家帳號是否重複 (Front)
  checkVendorAccount: async function (req, res, next) {
    const account = req.params.account;

    const data = await Vendor.findOne({ account });

    if (!data) {
      handleSuccess(res, null, "該帳號可以使用");
    } else {
      return next(appError(400, "該帳號已經被註冊"));
    }
  },

  // * 取得單筆賣家綜合資料 (需計算學員數、全部課程、師資) (Front)
  getVendor: async function (req, res, next) {
    const vendorId = req.params.vendorId;

    let { courseTerm, courseType, sortBy, pageNo, pageSize } = req.query;

    const vendor = await Vendor.findById(vendorId).select(
      "-reviewLinks -reviewBrief -reviewImages -status -createdAt -updatedAt -__v"
    );
    if (!vendor) {
      return next(appError(400, "找不到該賣家"));
    }

    // ? 取得課程

    // 建立查詢條件；預設顯示狀態為 0 或 1 的課程
    let queryField = { courseStatus: { $in: [1] } };

    // 課程類型(Array)查詢
    if (courseType) {
      queryField.courseType = { $in: courseType.split(",") };
    }

    // 選擇課程時長類型 (0:單堂體驗 1:培訓課程)
    if (courseTerm) {
      courseTerm = parseInt(courseTerm);
      queryField.courseTerm = courseTerm;
    }

    // 分頁查詢 (預設第 1 頁，每頁 100 筆)
    pageNo = parseInt(pageNo) || 1;
    pageSize = parseInt(pageSize) || 100;
    let skip = (pageNo - 1) * pageSize;
    let limit = pageSize;

    // 課程
    let courses = [];

    // 排序查詢 (預設依照最新時間排序)
    sortBy = sortBy || "newest";
    if (sortBy === "newest") {
      // 依照最新時間排序
      courses = await Course.aggregate([
        { $match: queryField },
        {
          $lookup: {
            from: "vendors",
            localField: "vendorId",
            foreignField: "_id",
            as: "vendor",
          },
        },
        { $unwind: "$vendor" },
        {
          $project: {
            courseName: 1,
            brandName: "$vendor.brandName",
            courseType: 1,
            courseTerm: 1,
            courseImage: 1,
            coursePrice: 1,
            createdAt: 1,
          },
        },
        { $sort: { createdAt: -1 } },
        { $skip: skip },
        { $limit: limit },
      ]);
    } else if (sortBy === "mostPopular") {
      // 依照訂單被預訂數量 status=3(已完課) -> 收藏數量 -> 最新時間
      courses = await Course.aggregate([
        { $match: queryField },
        {
          $lookup: {
            from: "vendors",
            localField: "vendorId",
            foreignField: "_id",
            as: "vendor",
          },
        },
        { $unwind: "$vendor" },
        {
          $lookup: {
            from: "orders",
            localField: "_id",
            foreignField: "courseId",
            as: "orders",
          },
        },
        {
          $lookup: {
            from: "collections",
            localField: "_id",
            foreignField: "courseId",
            as: "collections",
          },
        },
        {
          $project: {
            courseName: 1,
            brandName: "$vendor.brandName",
            courseType: 1,
            courseTerm: 1,
            courseImage: 1,
            coursePrice: 1,
            orderCount: {
              $size: {
                $filter: {
                  input: "$orders",
                  as: "order",
                  cond: { $eq: ["$$order.status", 3] }, // order=3(已完課)
                },
              },
            },
            collectionCount: { $size: "$collections" },
            createdAt: 1,
          },
        },
        {
          $sort: { orderCount: -1, collectionCount: -1, createdAt: -1 },
        },
        { $skip: skip },
        { $limit: limit },
      ]);
    } else if (sortBy === "highestRate") {
      // 依照評價高低 -> 評論數最多 -> 最新上架時間
      courses = await Course.aggregate([
        {
          $match: queryField,
        },
        {
          $lookup: {
            from: "vendors",
            localField: "vendorId",
            foreignField: "_id",
            as: "vendor",
          },
        },
        {
          $unwind: "$vendor",
        },
        {
          $lookup: {
            from: "coursecomments",
            localField: "_id",
            foreignField: "courseId",
            as: "comments",
          },
        },
        {
          $unwind: {
            path: "$comments",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $group: {
            _id: "$_id",
            courseName: { $first: "$courseName" },
            brandName: { $first: "$vendor.brandName" },
            courseType: { $first: "$courseType" },
            courseTerm: { $first: "$courseTerm" },
            courseImage: { $first: "$courseImage" },
            coursePrice: { $first: "$coursePrice" },
            averageRate: {
              $avg: {
                $cond: [
                  { $ifNull: ["$comments.rating", false] },
                  "$comments.rating",
                  0,
                ],
              },
            },
            commentCount: {
              $sum: { $cond: [{ $ifNull: ["$comments._id", false] }, 1, 0] },
            },
            createdAt: { $first: "$createdAt" },
          },
        },
        { $sort: { averageRate: -1, commentCount: -1, createdAt: -1 } },
        { $skip: skip },
        { $limit: limit },
        {
          $project: {
            courseName: 1,
            brandName: 1,
            courseType: 1,
            courseTerm: 1,
            courseImage: 1,
            coursePrice: 1,
            averageRate: 1,
            commentCount: 1,
            createdAt: 1,
          },
        },
      ]);
    } else {
      return next(appError(400, "無效的排序方式"));
    }

    // ? 計算學員數 > 計算該賣家的訂單總數
    const orders = await Order.find({ vendorId: vendorId });
    const totalStudentCount = orders.reduce(
      (acc, order) => acc + order.count,
      0
    );

    // 取得師資
    const teachers = await Teacher.find({ vendorId: vendorId });

    // ? 取得平均評分
    // 1. 查詢該賣家的所有課程 ID
    const courseAllId = await Course.find({ vendorId: vendorId }).select("_id");
    const courseIds = courseAllId.map((course) => course._id);

    // 2. 使用課程 ID 查詢所有相關的評論
    const comments = await CourseComment.find({ courseId: { $in: courseIds } });

    // ? 獲得評論數量
    const commentCount = comments.length;

    // 3. 處理評論資料，例如計算總和或平均值
    // 這裡以計算平均評分為例
    const totalRating = comments.reduce(
      (acc, comment) => acc + comment.rating,
      0
    );
    const averageRating =
      comments.length > 0 ? totalRating / comments.length : 0;

    // console.log(averageRating); // 輸出平均評分

    const data = {
      vendor,
      totalStudentCount,
      averageRating,
      commentCount,
      courses,
      teachers,
    };

    handleSuccess(res, data, "取得賣家資料成功");
  },
};

module.exports = vendorController;
