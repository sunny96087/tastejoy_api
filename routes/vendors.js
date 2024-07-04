const express = require("express"); // 引入 Express 框架
const router = express.Router(); // 創建一個路由器實例
const handleErrorAsync = require("../utils/handleErrorAsync");

const vendorsController = require("../controllers/vendorsController");
const { isVendorAuth } = require("../utils/vendorAuth");

const dotenv = require("dotenv");
dotenv.config({ path: "./config.env" });
const passport = require("passport");

// >> 審核後給予賣家密碼 (Manage)
router.post(
    "/manage/:vendorId",
    handleErrorAsync(vendorsController.updateVendorManage)
    /* 	
      #swagger.tags = ['Vendors-manage']
      #swagger.summary = '審核後給予賳戶密碼 (Manage)'
      #swagger.description = '審核後給予賣家密碼 (Manage)' 
  
      #swagger.parameters['body'] = {
          in: 'body',
          required: true,
          schema: {
              $adminPassword: '管理員密碼',
              $password:'新密碼',
            }
        }
    */
);

// >> 寄開通信給賣家 (Manage)
router.post(
    "/sendEmail/:vendorId",
    handleErrorAsync(vendorsController.sendEmailToVendor)
    /*
      #swagger.tags = ['Vendors-manage']
      #swagger.summary = '寄開通信給賣家 (Manage)'
      #swagger.description = '寄開通信給賣家 (Manage)' 
  
      #swagger.parameters['body'] = {
          in: 'body',
          required: true,
          schema: {
              $adminPassword: '管理員密碼',
              $subject:  '主旨',
              $text: '內文',
            }
        }
    */
);

// >> 取得全部賣家資料 (Manage)
router.get(
    "/manage",
    handleErrorAsync(vendorsController.getVendorsManage)
    /*
      #swagger.tags = ['Vendors-manage']
      #swagger.summary = '取得全部賣家資料 (Manage)'
      #swagger.description = '取得全部賣家資料 (Manage)' 
  
      #swagger.parameters['body'] = {
          in: 'body',
          required: true,
          schema: {
              $adminPassword:"管理員密碼"
            }
        }
    */
);

// ? 登入 (Back)
router.post(
    "/login",
    handleErrorAsync(vendorsController.vendorLogin)
    /*
      #swagger.tags = ['Vendors-back']
      #swagger.summary = '登入 (Back)'
      #swagger.description = '登入 (Back)' 
      #swagger.parameters['body'] = {
          in: 'body',
          required: true,
          description: '會檢查帳號狀態(審核中或停權), 再檢查密碼',
          schema: {
                $account: "帳號 (電子郵件)",
                $password: '密碼'
            }
        }
    */
);

// ? 確認賣家帳號是否存在 (Back)
router.get(
    "/admin/checkAccount/:account",
    handleErrorAsync(vendorsController.checkAdminVendorAccount)
    /*
      #swagger.tags = ['Vendors-back']
      #swagger.summary = '確認賣家帳號是否存在 (Back)'
      #swagger.description = '確認賣家帳號是否存在 (Back)' 
    */
);

// ? 賣家儀表板總覽 (Back) => 缺 訪問用戶數
router.get(
    "/admin/overview",
    isVendorAuth,
    handleErrorAsync(vendorsController.getVendorAdminOverview)
    /*
      #swagger.tags = ['Vendors-back']
      #swagger.summary = '賣家儀表板總覽 (Back)'
      #swagger.description = '
        近7日 訂單數量 orderCountLast7Days <br>
        近7日 訪問用戶數 userCountLast7Days <br>
        近7日 每日的日期 & (體驗課 & 培訓課)銷售金額 & % 數佔比 salesDataLast7Days<br>
        近7日 體驗課 & 培訓課 銷售總額 & % 數佔比 salesSummaryLast7Days <br>
        近30日 訂單收入(NT$) incomeLast30Days <br>
        近30日 訂單數量 orderCountLast30Days <br>
        近30日 訪問用戶數 visitCountLast30Days <br>
        近30日 每日的日期 & (體驗課 & 培訓課)銷售金額 & % 數佔比 salesDataLast30Days <br>
        近30日 體驗課 & 培訓課 銷售總額 & % 數佔比 salesSummaryLast30Days <br>
        訂單 待退款, 待付款, 待確認 數量 orderStatusCount ' 
    */
);

// ? 忘記密碼 (Back)
router.post('/forgetPassword', handleErrorAsync(vendorsController.forgotVendorPassword)
    /*
        #swagger.tags = ['Vendors-back']
        #swagger.summary = '忘記密碼 (Back)'
        #swagger.description = '忘記密碼 (Back)' 
        #swagger.parameters['body'] = {
            in: 'body',
            required: true,
            schema: {
                $account: '帳號 (電子郵件)'
                }
            }
        */
)

// ? 忘記密碼 -> 重設密碼 (Back)
router.post('/resetPassword', handleErrorAsync(vendorsController.resetVendorPassword)
    /*
        #swagger.tags = ['Vendors-back']
        #swagger.summary = '忘記密碼 -> 重設密碼 (Back)'
        #swagger.description = '忘記密碼 -> 重設密碼 (Back)' 
        #swagger.parameters['body'] = {
            in: 'body',
            required: true,
            schema: {
                $token: '重設密碼 token, 從 query 取得',
                $password: '新密碼',
                $confirmPassword: '新密碼確認'
                }
            }
        */
)

// ? 取得登入賣家資料 (Back)
router.get(
    "/admin",
    isVendorAuth,
    handleErrorAsync(vendorsController.getVendorAdmin)
    /*
      #swagger.tags = ['Vendors-back']
      #swagger.summary = '取得登入賣家資料 (Back)'
      #swagger.description = '取得登入賣家資料 (Back)' 
    */
);

// ? 編輯賣家資料 (Back)
router.patch(
    "/admin",
    isVendorAuth,
    handleErrorAsync(vendorsController.updateVendor)
    /*
        #swagger.tags = ['Vendors-back']
        #swagger.summary = '編輯賣家資料 (Back)'
        #swagger.description = '編輯賣家資料 (Back)' 
    
        #swagger.parameters['body'] = {
            in: 'body',
            required: true,
            schema: {
                $mobile:'手機號碼',
                $brandName: '品牌名稱',
                $avatar: '品牌頭像連結',
                $bannerImage: '品牌封面連結',
                $intro: '品牌介紹',
                $socialMedias: [
                    {
                        name: 'facebook',
                        link: '連結'
                    },
                    {
                        name: 'instagram',
                        link: '連結'
                    }
                ],
                $bankName:'銀行名稱',
                $bankCode:'銀行代碼',
                $bankBranch: '分行名稱',
                $bankAccountName:'銀行戶名',
                $bankAccount: '銀行帳號',
                $address: '銀行帳號',
                $notice: '公告'
            }
        }
    */
);

// ? 修改密碼 (Back)
router.patch(
    "/password",
    isVendorAuth,
    handleErrorAsync(vendorsController.updateVendorPassword)
    /*
      #swagger.tags = ['Vendors-back']
      #swagger.summary = '修改密碼 (Back)'
      #swagger.description = '修改密碼 (Back)' 
  
      #swagger.parameters['body'] = {
          in: 'body',
          required: true,
          schema: {
              $currentPassword: '舊密碼',
              $password: '新密碼',
              $confirmPassword: '新密碼確認'
            }
        }
    */
);

// * 新增賣家申請 (Front)
router.post(
    "/",
    handleErrorAsync(vendorsController.newVendorReview)
    /*
      #swagger.tags = ['Vendors-front']
      #swagger.summary = '新增賣家申請 (Front)'
      #swagger.description = '新增賣家申請 (Front)' 
  
      #swagger.parameters['body'] = {
          in: 'body',
          required: true,
          schema: {
                $representative: '申請人名稱',
                $account: '帳號(電子郵件)',
                $mobile: '手機號碼',
                $brandName: '品牌名稱',
                $reviewLinks: ['網站1', '網站2', '網站3', '網站4', '網站5'],
                $reviewBrief:'審核用簡介',
                $reviewImages: ['圖片1', '圖片2', '圖片3', '圖片4', '圖片5']
            }
        }
    */
);

// * 確認賣家帳號是否重複 (Front)
router.get(
    "/checkAccount/:account",
    handleErrorAsync(vendorsController.checkVendorAccount)
    /*
      #swagger.tags = ['Vendors-front']
      #swagger.summary = '確認賣家帳號是否重複 (Front)'
      #swagger.description = '確認賣家帳號是否重複 (Front)' 
    */
);

// * 取得單筆賣家綜合資料 (需計算學員數、全部課程、師資) (Front)
router.get(
    "/:vendorId",
    handleErrorAsync(vendorsController.getVendor)
    /*
        #swagger.tags = ['Vendors-front']
        #swagger.summary = '取得單筆賣家綜合資料 (需計算學員數、全部課程、師資) (Front)'
        #swagger.description = '搜尋條件：可帶入「課程時長類型 (courseTerm)、課程類型 (courseType)篩選課程。 <br>
        排序條件：sortBy 可帶入「newest (最近日期), mostPopular (最熱門), highestRate (評分最高)」；未選擇則預設 newest 方式排序。 <br>
        分頁功能：可帶入頁碼 (pageNo)、筆數 (pageSize) 以使用分頁功能。未帶入則預設 pageNo = 1, pageSize = 20。'
        #swagger.parameters['courseTerm'] = {
            in: 'query',
            description: '課程時長類型；0: 單堂體驗 1:培訓課程',
            required: false,
            type: 'string'
        }
        #swagger.parameters['courseType'] = {
            in: 'query',
            description: '課程類型；多選以逗號分隔，可帶入類型：工藝手作, 烹飪烘焙, 藝術人文, 生活品味',
            required: false,
            type: 'string'
        }
        #swagger.parameters['sortBy'] = {
            in: 'query',
            description: '預設依照日期排序：可填 newest(最近日期), mostPopular(最熱門), highestRate(評分最高)',
            required: false,
            type: 'string'
        }
        #swagger.parameters['pageNo'] = {
            in: 'query',
            description: '當前頁碼，預設 1',
            required: false,
            type: 'string'
        }
        #swagger.parameters['pageSize'] = {
            in: 'query',
            description: '每頁筆數，預設 20 筆，上限 100 筆',
            required: false,
            type: 'string'
        }
    */
);

module.exports = router;
