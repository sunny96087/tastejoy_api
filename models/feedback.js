const mongoose = require("mongoose");

// 定義評價模型
const feedbackSchema = new mongoose.Schema(
  {
    // 名稱
    contactPerson: { String, required: [true, "姓名未填寫"] },
    // 電話
    phone: { String, required: [true, "電話未填寫"] },
    // 信箱
    email: { String, required: [true, "信箱未填寫"] },
    // 內容
    feedback: { String, required: [true, "內容未填寫"] },
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
