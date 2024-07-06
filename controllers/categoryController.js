const Member = require("../models/member");
const Collection = require("../models/collection");
const Order = require("../models/order");
const { Course, CourseComment } = require("../models/course");
const tools = require("../utils/tools");
const appError = require("../utils/appError");
const handleSuccess = require("../utils/handleSuccess");
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const Friend = require("../models/friend");
const Category = require("../models/category");
const MemberCategory = require("../models/memberCategory");
const FoodRecord = require("../models/foodRecord");

const categoryController = {
  // * 取得系統分類
  getSystemCategories: async (req, res, next) => {
    const categorys = await Category.find();
    handleSuccess(res, categorys, "取得系統分類成功");
  },

  // * 新增一筆系統分類
  addSystemCategory: async (req, res, next) => {
    const { name, adminPassword } = req.body;
    // 驗證管理員密碼
    if (adminPassword !== process.env.ADMIN_PASSWORD) {
      return next(appError(401, "管理員密碼錯誤"));
    }

    if (!name) {
      return next(appError(400, "name 為必填"));
    }

    // 檢查名稱是否已存在
    const existingCategory = await Category.findOne({ name });
    if (existingCategory) {
      return next(appError(400, `${name} 已存在系統分類資料表`));
    }

    const newCategory = await Category.create({ name });

    handleSuccess(res, newCategory, "新增系統分類成功");
  },

  // * 取得登入會員自訂分類
  getMemberCategories: async (req, res, next) => {
    // 取得登入會員 id
    const memberId = req.user.id;

    // 取得登入會員的自訂分類
    const memberCategories = await MemberCategory.find({ memberId });

    handleSuccess(res, memberCategories, "取得自訂分類成功");
  },

  // * 新增登入會員自訂分類
  addMemberCategory: async (req, res, next) => {
    // 取得登入會員 id
    const memberId = req.user.id;
    const { name } = req.body;

    if (!name) {
      return next(appError(400, "name 為必填"));
    }

    const newCategory = await MemberCategory.create({ name, memberId });

    // 將新增的自訂分類加入到會員的自訂分類中
    await Member.findByIdAndUpdate(memberId, {
      $push: { customCategories: newCategory._id },
    });

    handleSuccess(res, newCategory, "新增自訂分類成功");
  },

  // * 修改登入會員自訂分類
  editMemberCategory: async (req, res, next) => {
    // 取得登入會員 id
    const memberId = req.user.id;
    const { deleteIds = [], newCategories = [] } = req.body; // 預設為空陣列以處理單獨刪除或新增的情況

    // 驗證傳進來的 deleteIds 和 newCategories 是否為陣列
    if (!Array.isArray(deleteIds) || !Array.isArray(newCategories)) {
      return next(appError(400, "deleteIds 和 newCategories 必須是陣列。"));
    }

    // 處理要刪除的自訂分類
    if (deleteIds.length > 0) {
      // 驗證 deleteIds 是否存在
      const isValidateDeleteIds = await tools.findArrayModelsByIdsNext(
        MemberCategory,
        deleteIds,
        next
      );

      // 從會員資料庫移除自訂分類
      await Member.findByIdAndUpdate(memberId, {
        $pull: { customCategories: { $in: deleteIds } },
      });

      // 從美食紀錄中移除該自訂分類 // BUG 待測試
      await FoodRecord.updateMany(
        { memberId: memberId },
        { $pull: { customCategory: { $in: deleteIds } } }
      );

      // 從 MemberCategory 中刪除該自訂分類
      await MemberCategory.deleteMany({
        _id: { $in: deleteIds },
        memberId: memberId, // 確保只刪除該會員的自訂分類
      });
    }

    // 處理要新增的自訂分類
    let newCategoryIds = [];
    if (newCategories.length > 0) {
      const processedCategories = await Promise.all(
        newCategories.map(async (name) => {
          let newName = name;
          let count = 0;
          // 檢查名稱是否存在
          while (await MemberCategory.findOne({ name: newName, memberId })) {
            count++;
            newName = `${name}#${count}`;
          }
          return newName;
        })
      );

      // 新增自訂分類
      const newCategoriesDocs = await MemberCategory.insertMany(
        processedCategories.map((name) => ({ name, memberId }))
      );

      // 將新增的自訂分類加入到會員的自訂分類中
      newCategoryIds = newCategoriesDocs.map((doc) => doc._id);
      await Member.findByIdAndUpdate(memberId, {
        $push: { customCategories: { $each: newCategoryIds } },
      });
    }

    handleSuccess(
      res,
      { deletedIds: deleteIds, addedCategories: newCategoryIds },
      "修改自訂分類成功"
    );
  },

  // // * 刪除登入會員自訂分類

  // * 取得會員美食紀錄全分類 getMemberFoodRecordCategories
  // * 取得公開美食全分類 getPublicFoodRecordCategories

  // * 隨機抽系統的分類 > 限制抽取分類、抽取數量 randomPublicCategory
  // * 隨機抽自己的分類 > 限制抽取分類、抽取數量 randomMemberCategory
};

module.exports = categoryController;
