const express = require('express');
const router = express.Router();
const { isAuth } = require("../utils/auth");
const memberController = require('../controllers/memberController');
const handleErrorAsync = require('../utils/handleErrorAsync');

// 取得所有會員資料 (開發方便查詢用)
router.post(
    "/manage",
    handleErrorAsync(memberController.getAllMembers)
    /*  #swagger.tags = ['Members-front']
        #swagger.summary = '取得所有會員 (開發查詢用)'
        #swagger.description = `取得所有會員資料 (方便開發查詢用) <br>
                                body 需帶入管理員密碼`
        #swagger.parameters['body'] = {
            in: 'body',
            description: '管理者密碼',
            required: true,
            schema: {
                $adminPassword: "管理員密碼"
            }
        }
    */
)

// 取得登入會員資料
router.get(
    "/memberOne",
    isAuth,
    handleErrorAsync(memberController.getMember)
    /*  #swagger.tags = ['Members-front']
        #swagger.summary = '取得登入會員資料'
        #swagger.description = '取得登入會員資料'
    */
);

// 修改登入會員資料
router.patch(
    "/memberOne",
    isAuth,
    handleErrorAsync(memberController.updateMember)
    /*  #swagger.tags = ['Members-front']
        #swagger.summary = '修改會員資料'
        #swagger.description = `修改登入會員資料，只需帶入欲修改欄位 <br>
                                interests 陣列中可帶入值為: ['工藝手作','烹飪烘烤','藝術人文','生活品味'] <br>
                                gender 可帶入值為: male, female, other <br>
                                birthday 格式需為 Date 物件格式: YYYY-MM-DD、YYYY-MM-DD HH:mm:ss.SSS 等 <br>`
        #swagger.parameters['body'] = {
            in: 'body',
            schema: {
                nickname: "瑄瑄仔",
                interests: ['工藝手作','烹飪烘烤'],
                name:"",
                gender: "female",
                birthday: "2000-01-01 12:00:00.000",
                phone: "886912345678",
                point:10000
            }
        }
    */
);

// 取得登入會員收藏
router.get(
    "/memberOne/collections",
    isAuth,
    handleErrorAsync(memberController.getMemberCollections)
    /*  #swagger.tags = ['Members-front']
        #swagger.summary = '取得登入會員收藏'
        #swagger.description = '取得登入會員收藏'
    */
);

// 新增登入會員收藏
router.post(
    "/memberOne/collections",
    isAuth,
    handleErrorAsync(memberController.newMemberCollections)
    /*  #swagger.tags = ['Members-front']
        #swagger.summary = '會員新增收藏'
        #swagger.description = '會員新增收藏'
        #swagger.parameters['body'] = {
            in: 'body',
            required: true,
            schema: {
                $courseId: "帶入有效課程 Id"
            }
        }
    */
)

// 刪除登入會員收藏
router.delete(
    "/memberOne/collections/:collectionId",
    isAuth,
    handleErrorAsync(memberController.deleteMemberCollection)
    /*  #swagger.tags = ['Members-front']
        #swagger.summary = '會員刪除收藏'
        #swagger.description = '會員刪除收藏'
        #swagger.parameters['collectionId'] = {
            in: 'path',
            required: true,
            type: 'string'
        }
    */
)

// 取得登入會員訂單
router.get(
    "/memberOne/orders",
    isAuth,
    handleErrorAsync(memberController.getMemberOrders)
    /*  #swagger.tags = ['Members-front']
        #swagger.summary = '取得登入會員全部訂單'
        #swagger.description = `取得登入會員全部訂單 <br>
                                訂單狀態；0:未付款, 1:已付款, 2:已確認收款, 3:已完成, 4:已取消, 5:訂單取消(不需退款), 6:訂單取消(待退款), 7:訂單取消(已退款)`
    */
);

// 修改會員密碼
router.patch(
    "/memberOne/password",
    isAuth,
    handleErrorAsync(memberController.updatePassword)
    /*  #swagger.tags = ['Members-front']
        #swagger.summary = '修改會員密碼'
        #swagger.description = `修改會員密碼 <br>
                                newPassword: 新密碼需包含英文及數字，且至少 8 碼 <br>
                                confirmNewPassword: 確認新密碼 <br>`
        #swagger.parameters['body'] = {
            in: 'body',
            required: true,
            schema: {
                $newPassword: "Abc123456",
                $confirmNewPassword: "Abc123456"
            }
        }
    */
);

module.exports = router;