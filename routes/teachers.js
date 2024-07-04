const express = require("express"); // 引入 Express 框架
const router = express.Router(); // 創建一個路由器實例
const handleErrorAsync = require("../utils/handleErrorAsync");

const teacherController = require("../controllers/teacherController");
const { isVendorAuth } = require("../utils/vendorAuth");

const dotenv = require("dotenv");
dotenv.config({ path: "./config.env" });
const passport = require("passport");

// * 取得所有老師 (Manage)
router.get(
  "/manage",
  handleErrorAsync(teacherController.getManageTeachers)
  /*
    #swagger.tags = ['Teachers-manage']
    #swagger.summary = '取得所有老師 (Manage)'
    #swagger.description = '取得所有老師 (Manage)'

    #swagger.parameters['getManageTeachers'] = {
        in: 'body',
        description: '使用管理員密碼取得所有老師',
        required: true,
        schema: {
            $adminPassword: '管理員密碼',
        }
    }
    */
);

// * 取得所有老師 (query: sort, createdAt, 課程類型, keyword) (Back)
router.get(
  "/admin",
  isVendorAuth,
  handleErrorAsync(teacherController.getAdminTeachers)
  /*
    #swagger.tags = ['Teachers-back']
    #swagger.summary = '取得所有老師 (Back)'
    #swagger.description = '取得所有老師 (Back)'

    #swagger.parameters['sort'] = {
        in: 'query',
        description: '排序方式，數字小到大(預設)、大到小: ORDER_DESC',
        required: false,
        type: 'string'
    }
    #swagger.parameters['createdAt'] = {
        in: 'query',
        description: '創建日期的排序方式，日期新到舊(預設)、舊到新: CREATED_AT_ASC',
        required: false,
        type: 'string'
    }
    #swagger.parameters['keyword'] = {
        in: 'query',
        description: '搜尋關鍵字, 查詢姓名欄位',
        required: false,
        type: 'string'
    }
    #swagger.parameters['courseTerm'] = {
        in: 'query',
        description: '課程時長類型, 0: 單堂體驗 1:培訓課程',
        required: false,
        type: 'string'
    }
  */
);

// * 取得單筆老師資料 (Front)
router.get(
  "/:teacherId",
  handleErrorAsync(teacherController.getTeacher)
  /*
      #swagger.tags = ['Teachers-front']
      #swagger.summary = '取得單筆老師資料 (Front)'
      #swagger.description = '取得單筆老師資料 (Front)'
      */
);

// * 取得單筆老師資料 (Back)
router.get(
  "/admin/:teacherId",
  isVendorAuth,
  handleErrorAsync(teacherController.getAdminTeacher)
  /*
    #swagger.tags = ['Teachers-back']
    #swagger.summary = '取得單筆老師資料 (Back)'
    #swagger.description = '取得單筆老師資料 (Back)'
    */
);

// * 新增老師 (Back)
router.post(
  "/",
  isVendorAuth,
  handleErrorAsync(teacherController.newTeacher)
  /*
        #swagger.tags = ['Teachers-back']
        #swagger.summary = '新增老師 (Back)'
        #swagger.description = `新增老師 (Back) <br>
                                vendorId: 供應商 ID，由登入資訊取得 <br>
                                name: 老師名稱 (string) <br>
                                description: 老師描述 (string) <br>
                                photo: 老師頭像 (string) <br>
                                intro: 老師簡述 (編輯器) (string) <br>
                                socialMediaInfo: 老師社群連結 (object)；platform 可帶入 "facebook", "instagram", "website" <br>
                                order: 老師排序 (int)；數字越小越前面 <br>`                                
        `
        #swagger.parameters['newTeacher'] = {
            in: 'body',
            description: '老師資訊',
            required: true,
            schema: {
                $vendorId: '供應商 ID',
                $name: '老師名稱',
                description:'老師描述',
                photo: '老師頭像連結',
                intro: '老師簡述 (編輯器)',
                socialMediaInfo: [
                    {
                        platform: 'facebook',
                        link: '連結',
                    },
                    {
                        platform: 'instagram',
                        link: '連結',
                    }
                ],
                $order: 1
            }
        }
    */
);

// * 刪除老師 (偽刪除) (Back)
router.patch(
  "/admin/deactivate/:teacherId",
  isVendorAuth,
  handleErrorAsync(teacherController.deactivateTeacher)
    /*
        #swagger.tags = ['Teachers-back']
        #swagger.summary = '刪除老師 (偽刪除) (Back)'
        #swagger.description = '刪除老師 (偽刪除) (Back)'
    */
);

// * 編輯老師 (Back)
router.patch(
  "/:teacherId",
  isVendorAuth,
  handleErrorAsync(teacherController.updateTeacher)
    /*
        #swagger.tags = ['Teachers-back']
        #swagger.summary = '編輯老師 (Back)'
        #swagger.description = `編輯老師 (Back) <br>
                                name: 老師名稱 (string) <br>
                                description: 老師描述 (string) <br>
                                photo: 老師頭像 (string) <br>
                                intro: 老師簡述 (編輯器) (string) <br>
                                socialMediaInfo: 老師社群連結 (object)；platform 可帶入 "facebook", "instagram", "website" <br>
                                order: 老師排序 (int)；數字越小越前面 <br>`
        
        #swagger.parameters['body'] = {
            in: 'body',
            description: '老師資訊',
            required: true,
            schema: {
                $name: '老師名稱',
                description: '老師描述',
                photo: '老師頭像',
                intro:'老師簡述 (編輯器)',
                socialMediaInfo:[
                    {
                        platform: 'facebook',
                        link: '連結'
                    },
                    {
                        platform: 'instagram',
                        link: '連結'
                    }
                ],
                $order: 1
            }
        }
    */
);

// * 刪除老師 (Manage)
router.delete(
  "/:teacherId",
  handleErrorAsync(teacherController.deleteTeacherManage)
  /*
    #swagger.tags = ['Teachers-manage']
    #swagger.summary = '刪除老師 (Manage)'
    #swagger.description = '刪除老師 (Manage)'
        
    #swagger.parameters['deleteTeacherManage'] = {
        in: 'body',
        description: '使用管理員密碼刪除老師',
        required: true,
        schema: {
            adminPassword: '管理員密碼',
        }
    }
    */
);

module.exports = router;
