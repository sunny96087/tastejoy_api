// message.js
const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  roomId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Room",
  },
  memberId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Member",
  },
  vendorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Vendor",
  },
  uuid: String,
  content: String,
  timestamp: { type: Date, default: Date.now },
});

const Message = mongoose.model("Message", messageSchema);

// ? 查詢時自動填充相關的欄位
messageSchema.pre("find", function () {
  this.populate("memberId").populate("vendorId");
});

module.exports = Message;
