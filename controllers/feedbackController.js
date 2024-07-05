const validator = require("validator");
const appError = require("../utils/appError");
const handleSuccess = require("../utils/handleSuccess");
const Feedback = require("../models/feedback");

const feedbackController = {
  // 新增回饋
  createFeedback: async (req, res, next) => {
    const { memberId, contactPerson, phone, email, feedback, source } =
      req.body;

    // 驗證必填欄位
    if (!contactPerson || !email || !feedback) {
      return next(appError(400, "contactPerson, email, feedback 為必填"));
    }

    // 驗證 email 格式
    if (!validator.isEmail(email)) {
      return next(appError(400, "email 格式錯誤"));
    }

    // 動態構建物件，只包含有值的欄位
    const feedbackData = {
      ...(memberId && { memberId }),
      contactPerson: contactPerson,
      ...(phone && { phone }),
      email: email,
      feedback: feedback,
      ...(source && { source }),
    };

    const newFeedback = await Feedback.create(feedbackData);

    // 新增回饋
    handleSuccess(res, newFeedback, "新增回饋成功");
  },
};

module.exports = feedbackController;
