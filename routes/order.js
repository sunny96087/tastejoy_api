const express = require("express");
const router = express.Router();
const handleErrorAsync = require("../utils/handleErrorAsync");
const orderController = require("../controllers/orderController");
const { isAuth } = require("../utils/auth");
const { isVendorAuth } = require("../utils/vendorAuth");

// ? 取得進帳總覽 (今日、近 7 天、30 天、12個月) (Back)
router.get(
  "/admin/payment/summary",
  isVendorAuth,
  handleErrorAsync(orderController.getAdminOrdersSummary)
  /*
    #swagger.tags = ['Orders-back']
    #swagger.summary = '取得進帳總覽 (Back)'
    #swagger.description = '取得進帳總覽 (今日、近 7 天、30 天、12個月) (Back)'
    */
);

// ? 取得進帳詳情 (query: startDate + endDate) (Back)
router.get(
  "/admin/payment",
  isVendorAuth,
  handleErrorAsync(orderController.getAdminOrdersPayment)
  /*
    #swagger.tags = ['Orders-back']
    #swagger.summary = '取得進帳詳情 (Back)'
    #swagger.description = '取得進帳詳情 (Back)'

    #swagger.parameters['query'] = {
        in: 'query',
        required: false,
        schema: {
            startDate: {
                type: 'string',
                description: '查詢創建日期範圍 - 起始日',
                default: '2024-05-25'
            },
            endDate: {
                type: 'string',
                description: '查詢創建日期範圍 - 終止日',
                default: '2024-05-25'
            },
        }
    }
  */
);


// ? 取得單筆訂單資料 (Back)
router.get(
  "/admin/:orderId",
  isVendorAuth,
  handleErrorAsync(orderController.getAdminOrder)
  /*
    #swagger.tags = ['Orders-back']
    #swagger.summary = '取得單筆訂單資料 (Back)'
    #swagger.description = '取得單筆訂單資料 (Back)'
    #swagger.parameters['orderId'] = {
        in: 'path',
        description: '要取得的訂單 ID',
        required: true,
        type: 'string'
    }
  */
);

// ? 取得所有訂單 (query: 訂單狀態、日期區間、keyword (_id || member.name)) (Back)
router.get(
  "/admin",
  isVendorAuth,
  handleErrorAsync(orderController.getAdminOrders)
  /*
    #swagger.tags = ['Orders-back']
    #swagger.summary = '取得所有訂單 (Back)'
    #swagger.description = '取得所有訂單 (query: 訂單狀態、日期區間、keyword (_id || member.name)) (Back)' 

    #swagger.parameters['query'] = {
        in: 'query',
        required: false,
        schema: {
            startDate: {
                type: 'string',
                description: '查詢創建日期範圍 - 起始日',
            },
            endDate: {
                type: 'string',
                description: '查詢創建日期範圍 - 終止日',
            },
            createdAt: {
                type: 'string',
                description: '排序條件：(創建日期新到舊(預設), 舊到新: CREATED_AT_ASC)',
            },
            keyword: {
                type: 'string',
                description: '關鍵字 (訂單編號 || 會員名稱)',
            },
            paidStatus: {
                type: 'string',
                description: '課程狀態：(0:待付款, 1: 已付款, 2: 已確認收到款, 3:已完課, 4:訂單取消(已過期), 5:訂單取消(待退款), 6:已退款)',
            },
        }
    }
 */
);

// ? 修改訂單 (賣家確認收到款項) (Back)
router.patch(
  "/admin/:orderId",
  isVendorAuth,
  handleErrorAsync(orderController.updateAdminOrder)
  /*
    #swagger.tags = ['Orders-back']
    #swagger.summary = '修改訂單 (賣家確認收到款項) (Back)'
    #swagger.description = `修改訂單 (賣家確認收到款項) (Back) <br>
                            paidStatus: 課程狀態 (int)；2: 已確認收到款, 5:訂單取消(不需退款), 6:訂單取消(待退款), 7:訂單取消(已退款) <br>
                            cancelReason: 5 || 6 要備註取消訂單原因`

    #swagger.parameters['orderId'] = {
        in: 'path',
        description: '要修改的訂單 ID',
        required: true,
        type: 'string'
    }
    #swagger.parameters['body'] = {
        in: 'body',
        required: true,
        description: '各狀態碼說明：2 (已確認收款 + confirmTime)、5 (訂單取消(不需退款) + cancelTime)、6 (訂單取消(待退款) + cancelTime)、7 (訂單取消(已退款) + refundTime)',
        schema: {
            $paidStatus: 2,
            cancelReason: '5 || 6 要備註取消訂單原因'
        }
    }
   */
);

// 取得單一訂單資料
router.get(
  "/:orderId",
  isAuth,
  handleErrorAsync(orderController.getOrder)
  /*  #swagger.tags = ['Orders-front']
      #swagger.summary = '取得單一訂單資料'
      #swagger.description = '取得單一訂單資料'
  */
);

// 新增訂單
router.post(
  "/",
  isAuth,
  handleErrorAsync(orderController.newOrder)
  /*  #swagger.tags = ['Orders-front']
      #swagger.summary = '新增訂單'
      #swagger.description = `新增訂單 <br>
                              vendorId: 賣家 ID <br>
                              courseId: 課程 ID <br>
                              courseItemId: 課程時段 ID <br>
                              brandName: 品牌名稱 (string) <br>
                              courseName: 課程名稱 (string)；ex. 培訓課格式: 2024-05-29 課程名稱, 體驗課格式: 2024-05-29 10:00 ~ 12:00 <br>
                              courseItemName: 課程時段名稱 (string) <br>
                              count: 購買數量 (int) <br>
                              price: 單價 (int) <br>
                              totalPrice: 總價 (int) <br>
                              courseLocation: 上課地點 (string) <br>
                              startTime: 上課時間 (string)；帶入 Date 物件格式 ex. 2024-05-29 10:00:00.000 <br>
                              endTime: 下課時間 (string)；帶入 Date 物件格式 ex. 2024-05-29 12:00:00.000 <br>
                              note: 備註 (string)`
      #swagger.parameters['body'] = {
        in: 'body',
        required: true,
        schema : {
          $vendorId: '賣家 ID',
          $courseId: '課程 ID',
          $courseItemId: '課程項目 ID',
          $brandName: '品牌名稱',
          $courseName: '課程名稱',
          $courseItemName: '2024-05-29 10:00 ~ 12:00',
          $count: 1,
          $price: 666,
          $totalPrice: 666,
          $courseLocation: '台北市信義區',
          $startTime: '2024-05-29 10:00:00.000',
          $endTime: '2024-05-29 12:00:00.000',
          note: '太貴了，你應該給我半價'
        }
      }
  */
);

// 更新訂單資料 (前台會員僅可更新後5碼)
router.patch(
  "/:orderId",
  isAuth,
  handleErrorAsync(orderController.updateOrder)
  /*  #swagger.tags = ['Orders-front']
      #swagger.summary = '更新訂單資料'
      #swagger.description = '更新訂單資料，前台會員僅可更新後5碼'
      #swagger.parameters['body'] = {
        in: 'body',
        required: true,
        schema : {
          $lastFiveDigits: '銀行帳號後五碼',
        }
      }
    }
  */
);

module.exports = router;
