const express = require('express');
const router = express.Router();
const platformController = require('../controllers/platformController');
const handleErrorAsync = require('../utils/handleErrorAsync');

// 取得全部平台資訊 (開發方便查詢用)
router.post(
    "/manage",
    handleErrorAsync(platformController.getAllPlatforms)
    /*  #swagger.tags = ['Platforms-manage']
        #swagger.summary = '取得全部平台資訊'
        #swagger.description = '取得全部平台資訊'
        #swagger.parameters['body'] = {
            in: 'body',
            schema: {
                $adminPassword: "管理員密碼"
            }
        }
    */
);

// 取得單一平台資訊
router.get(
    "/:platformId",
    handleErrorAsync(platformController.getPlatform)
    /*  #swagger.tags = ['Platforms-front']
        #swagger.summary = '取得平台資訊'
        #swagger.description = `取得平台資訊；`
    */
);

// 新增平台資訊
router.post(
    "/",
    handleErrorAsync(platformController.newPlatform)
    /*  #swagger.tags = ['Platforms-manage']
        #swagger.summary = '新增平台資訊'
        #swagger.description = '新增平台資訊 <br>'
        #swagger.parameters['body'] = {
            in: 'body',
            description: '此資料將用於網頁顯示，全為必填欄位',
            required: true,
            schema : {
                $platformNameCn: "巧手玩藝",
                $platformNameEn: "Ciao! Craft",
                $platformCompanyName: "巧手玩藝股份有限公司",
                $platformLogo: "https://www.ciaocraft.com/logo.png",
                $platformEmail: "ciao@ciaocraft.com",
                $platformInfo: "巧手玩藝是一個提供手作課程的平台，我們提供各種手作課程，讓您可以在家輕鬆學習手作技巧。",
                $copyright: "Copyright © 2021 Ciao! Craft"
            }
        }
    */
);

// 修改平台資訊
router.patch(
    "/:platformId",
    handleErrorAsync(platformController.updatePlatform)
    /*  #swagger.tags = ['Platforms-manage']
        #swagger.summary = '修改平台資訊'
        #swagger.description = `修改平台資訊，只需要帶入要修改的欄位， <br>
                                此資料將用於網頁顯示，不可為空值 <br>`
                                修改 platformNameEn 須注意其為查詢用唯一值 <br>`
        #swagger.parameters['body'] = {
            in: 'body',
            description: '平台資訊',
            required: true,
            schema : {
                platformNameCn: "巧手玩藝",
                platformNameEn: "Ciao! Craft",
                platformCompanyName: "巧手玩藝股份有限公司",
                platformLogo: "https://www.ciaocraft.com/logo.png",
                platformEmail: "ciao@ciaocraft.com",
                platformInfo: "巧手玩藝是一個提供手作課程的平台，我們提供各種手作課程，讓您可以在家輕鬆學習手作技巧。",
                copyright: "Copyright © 2021 Ciao! Craft"
            }
        }
    */
);

module.exports = router;