const express = require("express");
const router = express.Router();
const handleErrorAsync = require("../utils/handleErrorAsync");
const feedbackController = require("../controllers/feedbackController");

// 新增回饋
router.post(
  "/",
  handleErrorAsync(feedbackController.createFeedback)
  /*  #swagger.tags = ['Feedback-front']
        #swagger.summary = '新增回饋'   
        #swagger.description = `新增回饋<br>
            memberId: 會員 ID<br>
            contactPerson: 姓名 *<br>
            phone: 電話<br>
            email: 信箱 *<br>
            feedback: 內容 *<br>
            source: 來源。限定值：["網路搜尋", "親友推薦", "社群媒體", "其他"]<br>
            `
        #swagger.parameters['body'] = {
            in: 'body',
            required: true,
            schema:{
                $memberId: '會員 ID',
                $contactPerson:'姓名',
                $phone:'電話',
                $email: '信箱',
                $feedback: '內容',
                $source: '來源'
            }
        }
    */
);

module.exports = router;
