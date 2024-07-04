const mongoose = require("mongoose");

// 定義師資模型
const teacherSchema = new mongoose.Schema(
  {
    // 關聯廠商
    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vendor",
    },
    // 關聯課程類型
    courseType: {
      type: [String],
    },
    // 關聯課程
    courseId: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Course",
      },
    ],
    // 名稱
    name: {
      type: String,
      required: [true, "名稱未填寫"],
    },
    // 介紹
    description: String,
    // 狀態
    status: {
      type: Number,
      default: 1,
      enum: [0, 1, 2], // 0: 停用 1: 啟用 2: 刪除
    },
    // 頭像
    photo: String,
    // 簡述 (編輯器)
    intro: String,
    // 社群連結
    socialMediaInfo: [
      {
        platform: {
          type: String,
          enum: ["facebook", "instagram", "website"],
          required: [true, "社群平台未填寫"],
        },
        link: String,
      },
    ],
    // 排序
    order: {
      type: Number,
      default: 0,
    },
  },
  {
    versionKey: false,
    timestamps: true,
    virtuals: true, // 虛擬屬性
  }
);

// 創建師資模型
const Teacher = mongoose.model("Teacher", teacherSchema);

//
teacherSchema.pre("find", function () {
  this.populate("courseId");
  this.populate("vendorId");
});

teacherSchema.pre("findOne", function () {
  this.populate("courseId");
  this.populate("vendorId");
});

// 導出
module.exports = Teacher;
