const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true, // 必填
  },
  status: {
    type: Number,
    default: 1, // 預設值為啟用狀態, 0:停用 1:啟用
  },
  count: {
    type: Number,
    default: 0, // 預設值為 0
  },
});

// 定義索引以提高查詢效率
categorySchema.index({ name: 1 });

const Category = mongoose.model("Category", categorySchema);

module.exports = Category;
