const express = require("express");
const router = express.Router();
const foodRecordController = require("../controllers/foodRecordController");
const handleErrorAsync = require("../utils/handleErrorAsync");
const { isAuth } = require("../utils/auth");

// * 取得登入會員所有美食紀錄
router.get(
  "/logged-in",
  isAuth,
  handleErrorAsync(foodRecordController.getLoggedInAllFoodRecords)
  /*  #swagger.tags = ['FoodRecord-front']
        #swagger.summary = '取得登入會員所有美食紀錄'
        #swagger.description = '取得登入會員所有美食紀錄'
    */
);

// * 取得指定的單筆美食紀錄
router.get(
  "/:foodRecordId",
  handleErrorAsync(foodRecordController.getFoodRecord)
  /*  #swagger.tags = ['FoodRecord-front']
        #swagger.summary = '取得指定的單筆美食紀錄'
        #swagger.description = `取得指定的單筆美食紀錄。<br>
            無法查看已刪除或未公開的紀錄。`
        #swagger.parameters['path'] = {
            in: 'path',
            required: true,
            name: 'foodRecordId',
            description: '美食紀錄 ID'
        }
    */
);

// * 新增單筆美食紀錄
router.post(
  "/",
  isAuth,
  handleErrorAsync(foodRecordController.addFoodRecord)
  /*  #swagger.tags = ['FoodRecord-front']
        #swagger.summary = '新增單筆美食紀錄'
        #swagger.description = `新增單筆美食紀錄`
        #swagger.parameters['body'] = {
            in: 'body',
            required: true,
            schema: {
                $categoryId: ["categoryId1", "categoryId2"],
                $customCategoryId: ["customCategoryId1", "customCategoryId2"],
                $store: "店家名稱",
                $phone: "店家電話",
                $foodName: "美食名稱",
                $description: "美食描述",
                $image: "美食圖片",
                $date: "日期",
                $rating: "評分",
                $thoughts: "想法",
                $notes: "筆記",
                $openingHours: "營業時間",
                $storeNotes: "店家備註",
                $city: "城市",
                $district: "區域",
                $address: "地址",
                $longitude: "經度",
                $latitude: "緯度",
                $isPublic: "是否公開"
            },
            description (Array(object)): `
                categoryId: 系統分類ID陣列。<br>
                customCategoryId (Array(object)): 自訂分類ID陣列。<br>
                * store (String): 店家名稱。<br>
                phone (String): 店家電話。<br>
                * foodName (String): 美食名稱。<br>
                description (String): 美食描述。<br>
                image (String): 美食圖片 url。<br>
                * date (Date): 日期格式為 "YYYY-MM-DD"。<br>
                * rating (Number): 評分。 1-5 正整數<br>
                thoughts (String): 想法。<br>
                notes (String): 筆記。<br>
                openingHours (String): 營業時間。<br>
                storeNotes (String): 店家備註。<br>
                * city (String): 城市。<br>
                * district (String): 區域。<br>
                * address (String): 地址。<br>
                * longitude (String): 經度。<br>
                * latitude (String): 緯度。<br>
                * isPublic (Boolean): 是否公開。`
        }
    */
);

// * 修改單筆美食紀錄
router.put(
  "/:foodRecordId",
  isAuth,
  handleErrorAsync(foodRecordController.updateFoodRecord)
  /*  #swagger.tags = ['FoodRecord-front']
        #swagger.summary = '修改單筆美食紀錄'
        #swagger.description = `修改單筆美食紀錄，整筆資料都要回傳，會直接整筆覆蓋過去。<br>
            params: foodRecordId 帶要修改的美食紀錄 ID。<br>
            body: 要修改的整筆美食紀錄資料。`
        #swagger.parameters['path'] = {
            in: 'path',
            required: true,
            name: 'foodRecordId',
            description: '美食紀錄 ID'
        }
        #swagger.parameters['body'] = {
            in: 'body',
            required: true,
            schema: {
                $categoryId: ["categoryId1", "categoryId2"],
                $customCategoryId: ["customCategoryId1", "customCategoryId2"],
                $store: "店家名稱",
                $phone: "店家電話",
                $foodName: "美食名稱",
                $description: "美食描述",
                $image: "美食圖片",
                $date: "日期",
                $rating: "評分",
                $thoughts: "想法",
                $notes: "筆記",
                $openingHours: "營業時間",
                $storeNotes: "店家備註",
                $city: "城市",
                $district: "區域",
                $address: "地址",
                $longitude: "經度",
                $latitude: "緯度",
                $isPublic: "是否公開"
            },
            description (Array(object)): `
                categoryId: 系統分類ID陣列。<br>
                customCategoryId (Array(object)): 自訂分類ID陣列。<br>
                * store (String): 店家名稱。<br>
                phone (String): 店家電話。<br>
                * foodName (String): 美食名稱。<br>
                description (String): 美食描述。<br>
                image (String): 美食圖片 url。<br>
                * date (Date): 日期格式為 "YYYY-MM-DD"。<br>
                * rating (Number): 評分。 1-5 正整數<br>
                thoughts (String): 想法。<br>
                notes (String): 筆記。<br>
                openingHours (String): 營業時間。<br>
                storeNotes (String): 店家備註。<br>
                * city (String): 城市。<br>
                * district (String): 區域。<br>
                * address (String): 地址。<br>
                * longitude (String): 經度。<br>
                * latitude (String): 緯度。<br>
                * isPublic (Boolean): 是否公開。`
        }
    */
);

// * (偽)刪除單筆美食紀錄
router.patch(
  "/soft-delete/:foodRecordId",
  isAuth,
  handleErrorAsync(foodRecordController.softDeleteFoodRecord)
  /*  #swagger.tags = ['FoodRecord-front']
        #swagger.summary = '偽刪除單筆美食紀錄'
        #swagger.description = `偽刪除單筆美食紀錄。<br>
            params: foodRecordId 帶要刪除的美食紀錄 ID。`
        #swagger.parameters['path'] = {
            in: 'path',
            required: true,
            name: 'foodRecordId',
            description: '美食紀錄 ID'
        }
    */
);

// * 登入會員隨機抽自己的美食
// * 隨機抽公開的美食

module.exports = router;
