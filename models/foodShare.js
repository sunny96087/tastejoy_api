const mongoose = require("mongoose");

const foodShareSchema = new mongoose.Schema(
  {
    // 會員 ID
    memberId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true, // 必填
    },
    // 被分享的會員 ID
    sharedWithMemberId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true, // 必填
    },
    // 美食 ID
    foodRecordId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true, // 必填
      ref: "FoodRecord",
    },
    // 狀態
    status: {
      type: Number,
      default: 0, // 預設值為待確認, 0:待確認 1:已接收 2:不接收
    },
  },
  {
    timestamps: true, // 自動添加 createdAt 和 updatedAt 字段
  }
);

const FoodShare = mongoose.model("FoodShare", foodShareSchema);

module.exports = FoodShare;
