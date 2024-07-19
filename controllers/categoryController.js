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

      // 從美食紀錄中移除指定的自訂分類ID
      await FoodRecord.updateMany(
        { memberId: memberId },
        { $pull: { customCategoryId: { id: { $in: deleteIds } } } }
      );

      // 從 Member.favoriteCustomCategorys 中刪除該自訂分類
      await Member.updateMany(
        { favoriteCustomCategorys: { $in: deleteIds } },
        { $pull: { favoriteCustomCategorys: { $in: deleteIds } } }
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

  // * 取得會員美食紀錄全分類 (在美食紀錄中使用到的所有 categoryId 和 customCategoryId)
  getMemberFoodRecordCategories: async (req, res, next) => {
    // 取得登入會員 id
    const memberId = req.user.id;
    console.log("memberId", memberId);

    // 將 memberId 從字符串轉換為 ObjectId
    const objectIdMemberId = new mongoose.Types.ObjectId(memberId);

    // 使用聚合管道取回所有使用到的 categoryId 和 customCategoryId
    const usedCategories = await FoodRecord.aggregate([
      { $match: { memberId: objectIdMemberId } },
      { $unwind: { path: "$categoryId", preserveNullAndEmptyArrays: true } },
      {
        $unwind: {
          path: "$customCategoryId",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          categoryId: 1,
          customCategoryId: 1,
        },
      },
      {
        $group: {
          _id: null,
          uniqueCategoryIds: { $addToSet: "$categoryId" },
          uniqueCustomCategoryIds: { $addToSet: "$customCategoryId" },
        },
      },
      {
        $project: {
          uniqueCategoryIds: {
            $filter: {
              input: "$uniqueCategoryIds",
              as: "categoryId",
              cond: { $ne: ["$$categoryId", null] },
            },
          },
          uniqueCustomCategoryIds: {
            $filter: {
              input: "$uniqueCustomCategoryIds",
              as: "customCategoryId",
              cond: { $ne: ["$$customCategoryId", null] },
            },
          },
        },
      },
    ]);

    // 檢查是否有結果，如果沒有，則返回一個空的數據集
    if (
      !usedCategories.length ||
      (!usedCategories[0].uniqueCategoryIds.length &&
        !usedCategories[0].uniqueCustomCategoryIds.length)
    ) {
      return handleSuccess(
        res,
        { uniqueCategoryIds: [], uniqueCustomCategoryIds: [] },
        "取得使用到的分類成功，但沒有找到任何分類"
      );
    }

    // 定義一個函數來過濾 uniqueCategoryIds 和 uniqueCustomCategoryIds 陣列中重複的 id
    function filterUniqueCategories(categories) {
      const unique = {};
      // 使用 reduce 方法來累積唯一的項目
      return categories.reduce((acc, current) => {
        if (!unique[current.id]) {
          unique[current.id] = true;
          acc.push(current);
        }
        return acc;
      }, []);
    }

    // 假設這是聚合管道的結果
    const result = usedCategories[0]; // 假設只有一個結果

    const uniqueCategoryIds = filterUniqueCategories(result.uniqueCategoryIds);

    const uniqueCustomCategoryIds = filterUniqueCategories(
      result.uniqueCustomCategoryIds
    );

    // 更新結果
    const uniqueResult = {
      ...result,
      uniqueCategoryIds,
      uniqueCustomCategoryIds,
    };

    console.log(uniqueResult);

    // 成功取得資料，返回給客戶端
    handleSuccess(res, uniqueResult, "取得使用到的分類成功");
  },

  // * 取得公開美食全分類
  getPublicFoodRecordCategories: async (req, res, next) => {
    // 使用聚合管道取回所有使用到的 categoryId 和 customCategoryId
    const usedCategories = await FoodRecord.aggregate([
      {
        $match: {
          isPublic: 1, // 修改搜尋條件為 isPublic 等於 1
        },
      },
      { $unwind: { path: "$categoryId", preserveNullAndEmptyArrays: true } },
      {
        $unwind: {
          path: "$customCategoryId",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          categoryId: 1,
          customCategoryId: 1,
        },
      },
      {
        $group: {
          _id: null,
          uniqueCategoryIds: { $addToSet: "$categoryId" },
          uniqueCustomCategoryIds: { $addToSet: "$customCategoryId" },
        },
      },
      {
        $project: {
          uniqueCategoryIds: {
            $filter: {
              input: "$uniqueCategoryIds",
              as: "categoryId",
              cond: { $ne: ["$$categoryId", null] },
            },
          },
          uniqueCustomCategoryIds: {
            $filter: {
              input: "$uniqueCustomCategoryIds",
              as: "customCategoryId",
              cond: { $ne: ["$$customCategoryId", null] },
            },
          },
        },
      },
    ]);

    // 檢查是否有結果，如果沒有，則返回一個空的數據集
    if (
      !usedCategories.length ||
      (!usedCategories[0].uniqueCategoryIds.length &&
        !usedCategories[0].uniqueCustomCategoryIds.length)
    ) {
      return handleSuccess(
        res,
        { uniqueCategoryIds: [], uniqueCustomCategoryIds: [] },
        "取得使用到的分類成功，但沒有找到任何分類"
      );
    }

    // 定義一個函數來過濾 uniqueCategoryIds 和 uniqueCustomCategoryIds 陣列中重複的 id
    function filterUniqueCategories(categories) {
      const unique = {};
      // 使用 reduce 方法來累積唯一的項目
      return categories.reduce((acc, current) => {
        if (!unique[current.id]) {
          unique[current.id] = true;
          acc.push(current);
        }
        return acc;
      }, []);
    }

    // 假設這是聚合管道的結果
    const result = usedCategories[0]; // 假設只有一個結果

    const uniqueCategoryIds = filterUniqueCategories(result.uniqueCategoryIds);

    const uniqueCustomCategoryIds = filterUniqueCategories(
      result.uniqueCustomCategoryIds
    );

    // 更新結果
    const uniqueResult = {
      ...result,
      uniqueCategoryIds,
      uniqueCustomCategoryIds,
    };

    console.log(uniqueResult);

    // 成功取得資料，返回給客戶端
    handleSuccess(res, uniqueResult, "取得使用到的分類成功");
  },

  // * 隨機抽自己的分類 > 限制抽取分類、抽取數量
  randomMemberCategory: async (req, res, next) => {
    // 取得登入會員 id
    const memberId = req.user.id;

    // 取回參數 (選擇系統分類、選擇自訂分類、抽取數量)
    const { categorys = [], memberCategorys = [], limit } = req.body;

    let allCategories = [];

    // 如果有選擇系統分類、選擇自訂分類，則從選擇的這幾個分類中隨機抽取
    if (categorys.length > 0 || memberCategorys.length > 0) {
      allCategories = categorys.concat(memberCategorys);
    } else {
      // 取得登入會員的自訂分類
      const memberCategories = await MemberCategory.find({ memberId });
      // 取得系統分類
      const systemCategories = await Category.find();
      allCategories = memberCategories.concat(systemCategories);
    }

    // 隨機抽取指定數量
    const randomCategories = allCategories
      .sort(() => 0.5 - Math.random())
      .slice(0, limit);

    // 填充分類資料
    const filledCategories = await Promise.all(
      randomCategories.map(async (id) => {
        // 先在 MemberCategory 中尋找
        let category = await MemberCategory.findById(id);

        // 如果在 MemberCategory 中找不到，則在 Category 中尋找
        if (!category) {
          category = await Category.findById(id);
        }

        // 返回找到的分類，如果兩者都沒有找到，則返回 null 或其他適當的值
        return category;
      })
    );

    // 過濾掉未找到的項目（如果需要）
    const foundCategories = filledCategories.filter(
      (category) => category !== null
    );

    handleSuccess(res, foundCategories, "隨機抽取分類成功");
  },

  // * 隨機抽系統的分類 > 限制抽取分類、抽取數量
  randomPublicCategory: async (req, res, next) => {
    // 取回參數 (選擇系統分類、選擇自訂分類、抽取數量)
    const { categorys = [], limit } = req.body;

    let allCategories = [];

    // 如果有選擇系統分類，則從選擇的這幾個分類中隨機抽取
    if (categorys.length > 0) {
      allCategories = categorys;
    } else {
      // 取得系統分類
      allCategories = await Category.find();
    }

    // 隨機抽取指定數量
    const randomCategories = allCategories
      .sort(() => 0.5 - Math.random())
      .slice(0, limit);

    // 填充分類資料
    const filledCategories = await Promise.all(
      randomCategories.map(async (id) => {
        // 在 Category 中尋找
        const category = await Category.findById(id);

        // 返回找到的分類，如果兩者都沒有找到，則返回 null 或其他適當的值
        return category;
      })
    );

    // 過濾掉未找到的項目（如果需要）
    const foundCategories = filledCategories.filter(
      (category) => category !== null
    );

    handleSuccess(res, foundCategories, "隨機抽取分類成功");
  },
};

module.exports = categoryController;
