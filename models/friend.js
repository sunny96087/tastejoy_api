const mongoose = require("mongoose");

const friendSchema = new mongoose.Schema(
  {
    // 會員 ID
    memberId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Member",
      required: true, // 必填
    },
    // 好友列表
    friendList: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Member",
      },
    ],
    // 送出的好友邀請
    sentRequests: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Member",
      },
    ],
    // 收到的好友邀請
    receivedRequests: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Member",
      },
    ],
  },
  {
    timestamps: true, // 自動添加 createdAt 和 updatedAt 字段
  }
);

const Friend = mongoose.model("Friend", friendSchema);

module.exports = Friend;
