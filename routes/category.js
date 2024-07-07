const express = require("express");
const router = express.Router();
const categoryController = require("../controllers/categoryController");
const handleErrorAsync = require("../utils/handleErrorAsync");
const { isAuth } = require("../utils/auth");

// * 取得系統分類
router.get(
  "/system",
  handleErrorAsync(categoryController.getSystemCategories)
  /*  #swagger.tags = ['Category-front']
        #swagger.summary = '取得系統分類'
        #swagger.description = '取得系統分類'
    */
);

// * 新增一筆系統分類
router.post(
  "/system",
  handleErrorAsync(categoryController.addSystemCategory)
  /*  #swagger.tags = ['Category-front']
            #swagger.summary = '新增一筆系統分類'
            #swagger.description = `新增一筆系統分類<br>名稱重複會回傳錯誤訊息`
            #swagger.parameters['body'] = {
                in: 'body',
                required: true,
                schema: {
                    $name: "分類名稱",
                    $adminPassword: "管理員密碼"
                }
            }
    */
);

// * 取得登入會員自訂分類
router.get(
  "/member",
  isAuth,
  handleErrorAsync(categoryController.getMemberCategories)
  /*  #swagger.tags = ['Category-front']
        #swagger.summary = '取得自訂分類'
        #swagger.description = '取得自訂分類'
    */
);

// * 新增登入會員自訂分類
router.post(
  "/member",
  isAuth,
  handleErrorAsync(categoryController.addMemberCategory)
  /*  #swagger.tags = ['Category-front']
        #swagger.summary = '新增自訂分類'
        #swagger.description = '新增自訂分類'
        #swagger.parameters['body'] = {
            in: 'body',
            required: true,
            schema: {
                $name: "分類名稱"
            },
            description: '前端應該用不到，新增刪除請統一使用 > 修改登入會員自訂分類'
        }
    */
);

// * 修改登入會員自訂分類
router.patch(
  "/member",
  isAuth,
  handleErrorAsync(categoryController.editMemberCategory)
  /*  #swagger.tags = ['Category-front']
        #swagger.summary = '修改自訂分類'
        #swagger.description = `讓使用者修改其自訂分類，<br>
            包括刪除現有分類和新增新的分類。`
        #swagger.parameters['body'] = {
            in: 'body',
            required: true,
            schema: {
                $deleteIds: ["categoryId1", "categoryId2"],
                $newCategories: ["newCategory1"]
            },
            description: `
            deleteIds: 要刪除的分類ID陣列。<br>
            記得提示用戶刪除自訂分類，會將分類從美食紀錄和我的最愛中移除。<br>
            newCategories [string]: 要新增的分類名稱陣列，請在前端阻擋相同名稱的自訂分類，若傳到後台的話幫名稱加上 #1, #2... 的後綴詞<br>`
        }
    */
);

// // * 刪除登入會員自訂分類

// * 取得會員美食紀錄全分類 /member/food-record
// * 取得公開美食全分類 /public/food-record
// * 隨機抽系統的分類 /random/public
// * 隨機抽自己的分類 /random

module.exports = router;
