const express = require("express");
const router = express.Router();
const { isAuth } = require("../utils/auth");
const memberController = require("../controllers/memberController");
const handleErrorAsync = require("../utils/handleErrorAsync");

// * 取得所有會員資料 (開發方便查詢用)
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
);

// * 取得登入會員資料
router.get(
  "/logged-in",
  isAuth,
  handleErrorAsync(memberController.getLoggedInMember)
  /*  #swagger.tags = ['Members-front']
        #swagger.summary = '取得登入會員資料'
        #swagger.description = '取得登入會員資料'
    */
);

// * 取得指定會員資料
router.get(
  "/:memberId",
  handleErrorAsync(memberController.getMemberById)
  /*  
        #swagger.tags = ['Members-front']
        #swagger.summary = '取得指定會員資料'
        #swagger.description = '取得指定會員資料'
    */
);

// * 修改登入會員資料
router.patch(
  "/logged-in/info",
  isAuth,
  handleErrorAsync(memberController.updateLoggedInMember)
  /*  
        #swagger.tags = ['Members-front']
        #swagger.summary = '修改登入會員資料'
        #swagger.description = `修改登入會員資料，只需帶入欲修改欄位。`
        #swagger.parameters['body'] = {
            in: 'body',
            required: true,
            schema: {
                name:"test123",
                gender: "female",
                birthday: "2000-01-01 12:00:00.000",
                photo: "https://www.example.com/photo.jpg",
                favoriteCategorys: ["分類1", "分類2"],
                favoriteCustomCategorys: ["自訂分類1", "自訂分類2"],
                intro: "我的個人簡介"
            },
            description: `
                name (string): 名稱 <br>
                gender (string): 性別。可帶入值為: male, female, other(預設) <br>
                birthday (Date): 生日。格式需為 Date 物件格式: YYYY-MM-DD、YYYY-MM-DD HH:mm:ss.SSS 等 <br>
                photo (string): 大頭照 url <br>
                favoriteCategorys (Array(objectId)): 喜歡的分類 <br>
                favoriteCustomCategorys (Array(objectId)): 喜歡的自訂分類 <br>
                intro (string): 個人介紹`
        }
    */
);

// * 修改登入會員密碼
router.patch(
  "/logged-in/password",
  isAuth,
  handleErrorAsync(memberController.updateLoggedInPassword)
  /*  
        #swagger.tags = ['Members-front']
        #swagger.summary = '修改會員密碼'
        #swagger.description = `修改會員密碼`
        #swagger.parameters['body'] = {
            in: 'body',
            required: true,
            schema: {
                $newPassword: "abc123456",
                $confirmNewPassword: "abc123456"
            },
            description: `
                newPassword: 新密碼需包含英文及數字，且至少 8 碼 <br>
                confirmNewPassword: 確認新密碼需與新密碼相同`
        }
    */
);

// * 管理員修改會員密碼
router.patch(
  "/admin/password",
  handleErrorAsync(memberController.adminUpdatePassword)
  /*  
            #swagger.tags = ['Members-front']
            #swagger.summary = '管理員修改會員密碼'
            #swagger.description = `管理員修改會員密碼`
            #swagger.parameters['body'] = {
                in: 'body',
                required: true,
                schema: {
                    $memberId: "會員 Id",
                    $newPassword: "abc123456",
                    $adminPassword: "管理員密碼"
                },
                description: `
                    memberId (objectId): 會員 Id <br>
                    newPassword (string): 新密碼 <br>
                    adminPassword (string): 管理員密碼`
            }
        */
);



module.exports = router;
