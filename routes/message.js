const express = require("express");
const router = express.Router();
const Message = require("../models/message");
const tools = require("../utils/tools");
const appError = require("../utils/appError");
const handleSuccess = require("../utils/handleSuccess"); // 引入自訂的成功處理工具
const handleErrorAsync = require("../utils/handleErrorAsync");
const Room = require("../models/room");
const Member = require("../models/member");
const Vendor = require("../models/vendor");

// * 獲取指定房間的所有訊息
router.get(
  "/:roomId",
  handleErrorAsync(async (req, res, next) => {
    const roomId = req.params.roomId;

    // 先查詢房間
    const room = await Room.findById(roomId);
    if (!room) {
      // return res.status(404).json({ message: "Room not found" });
      return next(appError("404", "Room not found"));
    }

    // 如果房間存在，則查詢訊息
    const messages = await Message.find({ roomId: roomId });

    // 查詢所有相關的會員資訊
    //   const memberIds = messages.map(message => message.memberId);
    const member = await Member.findById(room.memberId);

    // 查詢廠商資訊
    const vendor = await Vendor.findById(room.vendorId);

    console.log(
      `獲取房間 ${roomId} 的所有訊息, 共 ${messages.length} 條, messages:`,
      messages
    );
    console.log(
      `獲取所有相關的會員資訊, 共 ${member.length} 條, member:`,
      member
    );

    // 將訊息、會員資訊和廠商資訊一起回傳
    handleSuccess(res, { messages, member, vendor }, "取得歷史訊息成功");
  })
);

// * 獲取指定廠商的所有聊天室
router.get(
  "/admin/rooms/:vendorId",
  handleErrorAsync(async (req, res, next) => {
    const vendorId = req.params.vendorId;

    // 先查詢房間
    const rooms = await Room.find({ vendorId: vendorId })
      .populate("memberId")
      .populate("vendorId");
    if (!rooms) {
      return next(appError("404", "Room not found"));
      // return res.status(404).json({ message: "Room not found" });
    }

    // 如果房間存在，則查詢訊息
    // const messages = await Message.find({ vendorId: vendorId });
    // console.log(
    //   `獲取廠商 ${vendorId} 的所有訊息, 共 ${messages.length} 條, messages:`,
    //   messages
    // );
    // res.json(messages);
    handleSuccess(res, rooms, "取得指定廠商的所有聊天室成功");
  })
);

// * 獲取指定會員的所有聊天室
router.get(
  "/rooms/:memberId",
  handleErrorAsync(async (req, res, next) => {
    const memberId = req.params.memberId;

    // 先查詢房間
    const rooms = await Room.find({ memberId: memberId })
      .populate("memberId")
      .populate("vendorId");
    if (!rooms) {
      return next(appError("404", "Room not found"));
      // return res.status(404).json({ message: "Room not found" });
    }

    // 如果房間存在，則查詢訊息
    // const messages = await Message.find({ vendorId: vendorId });
    // console.log(
    //   `獲取廠商 ${vendorId} 的所有訊息, 共 ${messages.length} 條, messages:`,
    //   messages
    // );
    // res.json(messages);
    handleSuccess(res, rooms, "取得指定會員的所有聊天室成功");
  })
);


// * 建立聊天室
router.post(
  "/rooms",
  handleErrorAsync(async (req, res, next) => {
    const { memberId, vendorId } = req.body;
    // 查詢 memberId 和 vendorId 都符合的房間
    const room = await Room.findOne({ memberId, vendorId });
    if (room) {
      //   return res.status(400).json({ message: "Room already exists" });
      return next(appError("400", "Room already exists"));
    }

    // 如果房間不存在，則建立房間
    const newRoom = new Room({ memberId, vendorId });
    await newRoom.save();
    handleSuccess(res, newRoom, "建立聊天室成功");
  })
);

module.exports = router;
