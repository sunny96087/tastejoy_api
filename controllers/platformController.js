const Platform = require('../models/platform');
const validator = require('validator');
const appError = require('../utils/appError');
const handleSuccess = require('../utils/handleSuccess');
const tools = require('../utils/tools');

const platformController = {
    // 取得全部平台資訊
    getAllPlatforms: async (req, res, next) => {
        // 驗證管理員密碼
        const adminPassword = req.body.adminPassword;
        if (adminPassword !== process.env.ADMIN_PASSWORD) {
            return next(appError(401, "管理員密碼錯誤"));
        }

        const platforms = await Platform.find();
        handleSuccess(res, platforms, '取得全部平台資訊成功');
    },

    // 取得單一平台資訊
    getPlatform: async (req, res, next) => {
        const platformId = req.params.platformId;

        // 驗證 platformId 是否為有效格式
        const isValidplatformId = tools.findModelById(Platform, platformId, res);
        if (!isValidplatformId) return;

        // 取得平台資訊，無結果回傳找不到平台資訊，成功回傳平台資訊
        const platform = await Platform.findById(platformId);
        if (!platform) { return next(appError(404, '找不到平台資訊')); }
        handleSuccess(res, platform, '取得平台資訊成功');
    },

    // 新增平台資訊
    newPlatform: async (req, res, next) => {
        const { platformNameCn, platformNameEn, platformCompanyName, platformLogo, platformEmail, platformInfo, copyright } = req.body;

        // 驗證必填欄位
        if (!platformNameCn || !platformNameEn || !platformCompanyName || !platformLogo || !platformEmail || !platformInfo || !copyright) {
            return next(appError(400, '欄位皆為必填'));
        }

        // 驗證 platformEmail 是否為 email 格式
        if (!validator.isEmail(platformEmail)) {
            return next(appError(400, '請輸入有效 email 格式'));
        }

        // 驗證 platformNameEn 不可包含非英文、數字或符號字元
        if (!validator.isAscii(platformNameEn)) {
            return next(appError(400, 'platformNameEn 只能是英文或數字'));
        }

        const platformExist = await Platform.findOne({ platformNameEn });

        // 檢查平台是否已存在，platformNameEn 做為查詢唯一值不可重複
        if (platformExist) {
            return next(appError(400, '此平台資料已存在，platformNameEn 不可重複'));
        }

        const platform = {
            platformNameCn,
            platformNameEn,
            platformCompanyName,
            platformLogo,
            platformEmail,
            platformInfo,
            copyright,
        }

        const newPlatform = await Platform.create(platform);

        if (!newPlatform) {
            return next(appError(400, '新增平台失敗'));
        }

        handleSuccess(res, newPlatform, '新增平台成功');
    },

    // 修改平台資訊
    updatePlatform: async (req, res, next) => {
        const platformId = req.params.platformId;
        const { platformNameCn, platformNameEn, platformCompanyName, platformLogo, platformEmail, platformInfo, copyright } = req.body;

        const platform = await Platform.findById(platformId);

        if (!platform) {
            return next(appError(404, '找不到平台資訊'));
        }

        // 更新用物件，有帶值的才更新
        let updateFields = {}

        if (platformNameCn) updateFields.platformNameCn = platformNameCn;
        if (platformNameEn) {
            if (!validator.isAscii(platformNameEn)) {
                return next(appError(400, 'platformNameEn 只能包含英文、數字或符號字元'));
            }
            updateFields.platformNameEn = platformNameEn;
        }
        if (platformCompanyName) updateFields.platformCompanyName = platformCompanyName;
        if (platformLogo) updateFields.platformLogo = platformLogo;
        if (platformEmail) {
            if (!validator.isEmail(platformEmail)) {
                return next(appError(400, '請輸入有效 email 格式'));
            }
            updateFields.platformEmail = platformEmail;
        }
        if (platformInfo) updateFields.platformInfo = platformInfo;
        if (copyright) updateFields.copyright = copyright;

        const updatedPlatform = await Platform.findOneAndUpdate(originalPlatformNameEn, platform, { new: true });

        if (!updatedPlatform) {
            return next(appError(400, '修改平台失敗'));
        }

        handleSuccess(res, updatedPlatform, '修改平台成功');
    }
};

module.exports = platformController;