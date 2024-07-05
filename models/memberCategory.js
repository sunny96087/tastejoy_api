const mongoose = require("mongoose");

const memberCategorySchema = new mongoose.Schema({
  // 會員 ID
  memberId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true, // 必填
  },
  // 自訂類別名稱
  name: {
    type: String,
    required: true, // 必填
  },
  // 狀態
  status: {
    type: Number,
    default: 1, // 預設值為啟用狀態, 0:停用 1:啟用
  },
  // 使用數量
  count: {
    type: Number,
    default: 0, // 預設值為 0
  },
});

// 定義索引以提高查詢效率
memberCategorySchema.index({ memberId: 1, name: 1 });

const MemberCategory = mongoose.model("MemberCategory", memberCategorySchema);

module.exports = MemberCategory;
