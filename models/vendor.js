const mongoose = require("mongoose");
// const { validate } = require("./user");
// const { login } = require("../controllers/authController");

const vendorSchema = new mongoose.Schema(
  {
    // 帳號 (也是申請賣家時的電子信箱)
    account: {
      type: String,
      validate: {
        validator: function (v) {
          return /^([\w-\.]+@([\w-]+\.)+[\w-]{2,4})?$/.test(v);
        },
        message: (props) => `${props.value} 不是有效 email`,
      },
      unique: true,
      required: [true, "account 為必填"],
    },
    // 密碼
    password: {
      type: String,
      select: false,
    },
    // 申請人名稱
    representative: {
      type: String,
      required: [true, "representative 為必填"],
    },
    // 手機號碼
    mobile: {
      type: String,
      validate: {
        validator: function (v) {
          return /^[0-9]+$/.test(v);
        },
        message: (props) => `${props.value} 只能是數字字元`,
      },
      required: [true, "phone 為必填"],
    },
    // 品牌名稱
    brandName: {
      type: String,
      required: [true, "brandName 為必填"],
    },
    // * 審核使用
    // 審核用通路連結
    reviewLinks: {
      type: [String],
      required: [true, "reviewLinks 為必填"],
    },
    // 審核用簡介
    reviewBrief: {
      type: String,
      required: [true, "reviewBrief 為必填"],
    },
    // 審核用圖片
    reviewImages: {
      type: [String],
      validate: {
        validator: function (v) {
          return v.length <= 5;
        },
        message: (props) =>
          `最多只可存 5 張圖片，現有 ${props.value.length} 張`,
      },
      required: [true, "reviewImages 為必填"],
    },
    // 品牌頭像
    avatar: {
      type: String,
    },
    // 形象圖片
    bannerImage: {
      type: String,
    },
    // 品牌介紹
    intro: {
      type: String,
    },
    // 社群連結
    socialMedias: {
      type: [
        {
          platform: {
            type: String,
            enum: ["facebook", "instagram", "website"],
            required: [true, "社群平台未填寫"],
          },
          url: {
            type: String,
          },
        },
      ],
    },
    // * 財務管理
    // 銀行名稱
    bankName: {
      type: String,
    },
    // 銀行代碼
    bankCode: {
      type: String,
    },
    // 分行名稱
    bankBranch: {
      type: String,
    },
    // 銀行戶名
    bankAccountName: {
      type: String,
    },
    // 銀行帳號
    bankAccount: {
      type: String,
    },
    // 狀態
    status: {
      type: Number,
      default: 0,
      enum: [0, 1, 2], // 0: 審核中 1: 啟用 2: 停權
    },
    // 地址
    address: {
      type: String,
    },
    // 公告
    notice: {
      type: String,
    },
    // 登入時間
    loginAt: {
      type: Date,
      select: false,
    },
    // 關聯課程
    courseId: [{ type: mongoose.Schema.Types.ObjectId, ref: "Course" }],
    // 重設密碼 token
    resetPasswordToken: {
      type: String,
      select: false,
    },
    // 重設密碼 token 有效時間
    resetPasswordExpires: {
      type: Date,
      select: false,
    },
  },
  {
    timestamps: true,
    virtuals: true, // 虛擬屬性
  }
);

vendorSchema.post("save", function (error, doc, next) {
  if (error.name === "MongoError" && error.code === 11000) {
    next(new Error("該帳號已存在"));
  } else {
    next(error);
  }
});

vendorSchema.pre("find", function () {
  this.populate("courseId");
});

vendorSchema.pre("findOne", function () {
  this.populate("courseId");
});

const Vendor = mongoose.model("Vendor", vendorSchema);
module.exports = Vendor;
