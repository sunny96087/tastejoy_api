const e = require("express");
const mongoose = require("mongoose");

// 定義評價模型
const feedbackSchema = new mongoose.Schema(
  {
    memberId: { type: mongoose.Schema.Types.ObjectId, ref: "Member" },
    // 名稱
    contactPerson: { String, required: [true, "姓名未填寫"] },
    // 電話
    phone: { String },
    // 信箱
    email: { String, required: [true, "信箱未填寫"] },
    // 內容
    feedback: { String, required: [true, "內容未填寫"] },
    source: {
      String,
      enum: ["網路搜尋", "親友推薦", "社群媒體", "其他"],
    },
  },
  {
    versionKey: false,
    timestamps: true,
    virtuals: true, // 虛擬屬性
  }
);

// 創建評價模型
const Feedback = mongoose.model("Feedback", feedbackSchema);

// 導出
module.exports = Feedback;
