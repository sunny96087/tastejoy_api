const mongoose = require("mongoose");

const memberSchema = new mongoose.Schema(
  {
    // google id
    googleId: {
      type: String,
      unique: true,
      sparse: true,
    },
    // google 帳號
    googleAccount: {
      type: String,
      unique: true,
      sparse: true,
    },
    // dc id
    dcId: {
      type: String,
      unique: true,
      sparse: true,
    },
    // dc 帳號
    dcAccount: {
      type: String,
      unique: true,
      sparse: true,
    },
    // github id
    githubId: {
      type: String,
      unique: true,
      sparse: true,
    },
    // github 帳號
    githubAccount: {
      type: String,
      unique: true,
      sparse: true,
    },
    // 帳號
    account: {
      type: String,
      unique: true,
      unique: true,
      sparse: true,
    },
    // 密碼
    password: {
      type: String,
      select: false,
    },
    // 名稱
    name: {
      type: String,
    },
    // 性別
    gender: {
      type: String,
      enum: ["male", "female", "other"],
      default: "other",
    },
    // 生日
    birthday: {
      type: Date,
    },
    // 大頭照
    photo: {
      type: String,
    },
    // 狀態
    status: {
      type: Number,
      default: 1, // 0:停權 1:啟用
      select: false,
    },
    // 喜歡的分類
    favoriteCategorys: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category", // 引用 Category 集合
      },
    ],
    // 喜歡的自訂分類
    favoriteCustomCategorys: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "MemberCategory", // 引用 MemberCategory 集合
      },
    ],
    // 自訂分類
    customCategories: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "MemberCategory", // 引用 MemberCategory 集合
      },
    ],
    // 朋友資料表 ID
    friendId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Friend",
    },
    // 個人介紹
    intro: {
      type: String,
    },
    // 管理員?
    isAdmin: {
      type: Boolean,
      default: false,
      select: false,
    },
    // 登入時間
    loginAt: {
      type: Date,
      select: false,
    },
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
    // toJSON: { virtuals: true },
    // toObject: { virtuals: true },
  }
);

memberSchema.pre("save", async function (next) {
  if (this.isNew && !this.name) {
    const count = await this.constructor.countDocuments();
    this.name = `新用戶${count + 1}`;
  }
  next();
});

const Member = mongoose.model("Member", memberSchema);

module.exports = Member;
