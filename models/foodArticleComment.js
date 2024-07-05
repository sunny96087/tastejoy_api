const mongoose = require("mongoose");

const foodArticleCommentSchema = new mongoose.Schema(
  {
    // 會員 ID
    memberId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Member",
      required: true, // 必填
    },
    // 文章 ID
    foodArticleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FoodArticle",
      required: true, // 必填
    },
    // 留言內容
    content: {
      type: String,
      required: true, // 必填
    },
    // 狀態
    status: {
      type: Number,
      default: 1, // 預設值為啟用狀態
    },
  },
  {
    timestamps: true, // 自動添加 createdAt 和 updatedAt 字段
  }
);

const FoodArticleComment = mongoose.model(
  "FoodArticleComment",
  foodArticleCommentSchema
);

module.exports = FoodArticleComment;
