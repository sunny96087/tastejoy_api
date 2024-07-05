const mongoose = require("mongoose");

const foodArticleSchema = new mongoose.Schema(
  {
    // 會員 ID
    memberId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Member",
      required: true, // 必填
    },
    // 內文
    content: {
      type: String,
      required: true, // 必填
    },
    // 圖片
    image: {
      type: String,
    },
    // 地點
    location: {
      type: String,
    },
    // 標記好友
    taggedFriends: [
      {
        friendId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Member",
        },
        friendName: {
          type: String,
        },
      },
    ],
    // 分享的文章 ID
    sharedArticleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FoodArticle",
    },
    // 分享該文章的文章 ID
    sharedInArticles: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "FoodArticle",
      },
    ],
    // 狀態
    status: {
      type: Number,
      default: 1, // 預設值為啟用, 0:停用 1:啟用
    },
    // 按讚數
    likesCount: {
      type: Number,
      default: 0, // 預設值為 0
    },
    // 按讚的會員
    likedByMembers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Member",
      },
    ],
    // 留言數
    commentsCount: {
      type: Number,
      default: 0, // 預設值為 0
    },
    // 留言
    comments: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "FoodArticleComment",
      },
    ],
  },
  {
    timestamps: true, // 自動添加 createdAt 和 updatedAt 字段
  }
);

const FoodArticle = mongoose.model("FoodArticle", foodArticleSchema);

module.exports = FoodArticle;
