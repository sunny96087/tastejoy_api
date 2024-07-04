const appError = require("../utils/appError");
const handleSuccess = require("../utils/handleSuccess");

const collectionController = {
    // 新增收藏
    newCollection: async (req, res, next) => {
        const memberId = req.user.id;
        const courseId = req.body.courseId;

        // 檢查是否已收藏
        const isCollectionExist = await Collection.findOne({ memberId: memberId, courseId: courseId });
        if (isCollectionExist) {
            return next(new appError("課程已收藏", 400));
        }

        // 新增收藏
        const newCollection = await Collection.create({ memberId: memberId, courseId: courseId });
        if (!newCollection) {
            return next(new appError("課程收藏失敗", 400));
        }

        return handleSuccess(res, newCollection, "新增收藏成功");
    },

    // 刪除收藏
    deleteCollection: async (req, res, next) => {
        const memberId = req.user.id;
        const collectionId = req.params.collectionId;

        // 檢查收藏是否存在
        const collection = await Collection.findOne({ _id: collectionId, memberId: memberId });
        if (!collection) {
            return next(new appError("此課程收藏不存在", 400));
        }

        // 刪除收藏
        const deleteCollection = await Collection.findByIdAndDelete(collectionId);
        if (!deleteCollection) {
            return next(new appError("刪除收藏失敗", 400));
        }

        return handleSuccess(res, deleteCollection, "刪除收藏成功");
    },
}

module.exports = collectionController;