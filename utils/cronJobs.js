// cronJobs.js
const cron = require("node-cron");
const User = require("../models/user");
const Order = require("../models/order");

// note 補充: 寫一支定時任務抓已確認訂單，且日期已過，將 paidStatus 改為 3 (已完課)
const updateFinishedOrders = async () => {
  try {
    // 找到所有已確認訂單，且日期已過的訂單
    const finishedOrders = await Order.find({
      paidStatus: 2,
      endTime: { $lt: Date.now() },
    });

    // 更新所有已確認訂單，且日期已過的訂單
    await Order.updateMany(
      {
        paidStatus: 2,
        endTime: { $lt: Date.now() },
      },
      { paidStatus: 3 }
    );

    // 回傳被更新的訂單的 id 或者相應的訊息
    if (finishedOrders.length > 0) {
      const updatedOrderIds = finishedOrders.map((order) => order._id);
      console.log(
        `定時任務已完成，被更新的訂單 id: ${updatedOrderIds.join(", ")}`
      );
      return `定時任務已完成，被更新的訂單 id: ${updatedOrderIds.join(", ")}`;
    } else {
      console.log("定時任務已完成，沒有已完課的訂單");
      return "定時任務已完成，沒有已完課的訂單";
    }
  } catch (error) {
    console.error("更新已完課訂單時發生錯誤:", error);
    return "更新已完課訂單時發生錯誤";
  }
};

// note 補充: 寫一支定時任務抓待付款訂單，且日期大於三天，將 paidStatus 改為 4 (訂單取消(已過期))
const updateExpiredOrders = async () => {
  try {
    // 找到所有待付款訂單，且日期大於三天的訂單
    const expiredOrders = await Order.find({
      paidStatus: 0,
      createdAt: { $lt: Date.now() - 3 * 24 * 60 * 60 * 1000 },
    });

    // 更新所有待付款訂單，且日期大於三天的訂單
    await Order.updateMany(
      {
        paidStatus: 0,
        createdAt: { $lt: Date.now() - 3 * 24 * 60 * 60 * 1000 },
      },
      { paidStatus: 4 }
    );

    // 回傳被更新的訂單的 id 或者相應的訊息
    if (expiredOrders.length > 0) {
      const updatedOrderIds = expiredOrders.map((order) => order._id);
      console.log(
        `定時任務已完成，被更新的訂單 id: ${updatedOrderIds.join(", ")}`
      );
      return `定時任務已完成，被更新的訂單 id: ${updatedOrderIds.join(", ")}`;
    } else {
      console.log("定時任務已完成，沒有已過期的訂單");
      return "定時任務已完成，沒有已過期的訂單";
    }
  } catch (error) {
    console.error("更新已過期訂單時發生錯誤:", error);
    return "更新已過期訂單時發生錯誤";
  }
};

// 定時任務：每 6 小時執行一次
cron.schedule("0 */6 * * *", () => {
  updateFinishedOrders()
    .then((message) => {
      console.log(message);
    })
    .catch((error) => {
      console.error("定時任務執行時發生錯誤:", error);
    });
});

cron.schedule("0 */6 * * *", () => {
  updateExpiredOrders()
    .then((message) => {
      console.log(message);
    })
    .catch((error) => {
      console.error("定時任務執行時發生錯誤:", error);
    });
});

module.exports = {
  updateFinishedOrders,
  updateExpiredOrders
};

// >> hr 下面是舊專案範例

// 定義定時任務函數
// const deleteExpiredAccounts = async () => {
//   try {
//     // 找到所有驗證鏈接已過期的帳號
//     const expiredUsers = await User.find({
//       emailVerificationTokenExpires: { $lt: Date.now() },
//     });

//     // 刪除所有驗證鏈接已過期的帳號
//     await User.deleteMany({
//       emailVerificationTokenExpires: { $lt: Date.now() },
//     });

//     // 回傳被刪除的用戶的 email 或者相應的訊息
//     if (expiredUsers.length > 0) {
//       const deletedEmails = expiredUsers.map((user) => user.email);
//       console.log(
//         `定時任務已完成，被刪除的用戶 email: ${deletedEmails.join(", ")}`
//       );
//       return `定時任務已完成，被刪除的用戶 email: ${deletedEmails.join(", ")}`;
//     } else {
//       console.log("定時任務已完成，沒有已過期的驗證帳號");
//       return "定時任務已完成，沒有已過期的驗證帳號";
//     }
//   } catch (error) {
//     console.error("刪除過期帳號時發生錯誤:", error);
//     return "刪除過期帳號時發生錯誤";
//   }
// };

// 定時任務：每 1 小時執行一次
// cron.schedule("0 */1 * * *", () => {
//   deleteExpiredAccounts()
//     .then((message) => {
//       console.log(message);
//     })
//     .catch((error) => {
//       console.error("定時任務執行時發生錯誤:", error);
//     });
// });

// 立即執行一次定時任務 => 寫了會變成執行兩次
/**
    deleteExpiredAccounts().then(message => {
    console.log(message);
    }).catch(error => {
    console.error('立即執行的定時任務執行時發生錯誤:', error);
    });
 */

// module.exports = deleteExpiredAccounts;
