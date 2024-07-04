// room.js
const mongoose = require("mongoose");

const roomSchema = new mongoose.Schema(
  {
    // roomId: String,
    memberId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Member",
    },
    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vendor",
    },
  },
  {
    timestamps: true,
    virtuals: true,
  }
);

const Room = mongoose.model("Room", roomSchema);

// ? 查詢時自動填充相關的欄位
roomSchema.pre("find", function () {
  this.populate("memberId").populate("vendorId");
});

module.exports = Room;
