// 引入需要的模組
const WebSocket = require("ws");
const uuidv4 = require("uuid").v4;
const Message = require("../models/message");
const Room = require("../models/room");

// 建立一個新的 WebSocket 伺服器
const wss1 = new WebSocket.WebSocketServer({ noServer: true });

// 監聽連接事件
wss1.on("connection", function connection(ws) {
  // 監聽錯誤事件
  ws.on("error", console.error);
  console.log("ws 連線成功");
  // 生成一個新的 UUID
  const uuid = uuidv4();

  // 將 UUID 保存到 WebSocket 物件上，用於識別用戶
  ws.uuid = uuid;

  // 監聽來自用戶的訊息事件
  ws.on("message", async (message) => {
    // 解析訊息內容
    const msg = JSON.parse(message);

    // 如果訊息中包含 roomId，則認為用戶想要加入房間
    if (msg.roomId) {
      // 將房間 ID 保存到 WebSocket 物件上
      ws.roomId = msg.roomId;

      console.log(
        `User with memberId: ${msg.memberId}, vendorId: ${msg.vendorId} joined room ${ws.roomId}`
      );

    //   // 檢查房間是否已經存在
    //   const existingRoom = await Room.findOne({
    //     roomId: ws.roomId,
    //     memberId: msg.memberId,
    //     vendorId: msg.vendorId,
    //   });

    //   // 如果房間不存在，則將房間資訊保存到資料庫
    //   if (!existingRoom) {
    //     const roomDoc = new Room({
    //       roomId: ws.roomId,
    //       memberId: msg.memberId,
    //       vendorId: msg.vendorId,
    //     });
    //     await roomDoc.save();
    //   }
    } else {

        console.log(`使用者傳遞了一個消息：${msg.content}, roomId: ${ws.roomId}`);
      // 如果訊息中不包含 roomId，則認為用戶想要發送訊息
      const newMessage = {
        context: "message",
        roomId: ws.roomId,
        memberId: msg.memberId,
        vendorId: msg.vendorId,
        uuid,
        content: msg.content,
        timestamp: msg.timestamp,
      };

      // 將訊息保存到資料庫
      const messageDoc = new Message(newMessage);
      await messageDoc.save().catch((err) => console.error(err));

      // 將訊息發送給所有連接的用戶
      sendAllUser(newMessage);
    }
  });

  // 定義一個函數，用於將訊息發送給所有連接的用戶
  function sendAllUser(msg) {
    wss1.clients.forEach(function each(client) {
      // 只將訊息發送給同一個房間的用戶，並檢查 WebSocket 的連接狀態
      if (
        client.readyState === WebSocket.OPEN &&
        client.roomId === msg.roomId
      ) {
        client.send(JSON.stringify(msg));
      }
    });
  }
});

// 將 WebSocket 伺服器導出，以便在其他模組中使用
module.exports = wss1;
