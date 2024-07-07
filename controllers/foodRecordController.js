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

const foodRecordController = {
  // * 取得登入會員所有美食紀錄
  getLoggedInAllFoodRecords: async (req, res, next) => {
    // 取得登入會員 id
    const memberId = req.user.id;

    // 取得登入會員的所有美食紀錄，且 status = 1
    const foodRecords = await FoodRecord.find({ memberId, status: 1 });

    handleSuccess(res, foodRecords, "取得美食紀錄成功");
  },

  // * 取得指定的單筆美食紀錄
  getFoodRecord: async (req, res, next) => {
    const foodRecordId = req.params.foodRecordId;

    // 驗證 foodRecordId 是否存在
    const isfoodRecord = await tools.findModelByIdNext(
      FoodRecord,
      foodRecordId,
      next
    );
    if (!isfoodRecord) return; // 如果不存在，已經在函數內處理錯誤

    // 驗證該紀錄是否為已刪除的
    if (isfoodRecord.status !== 1) {
      return next(appError(404, "美食紀錄不存在"));
    }

    // 驗證該紀錄是否為公開的
    if (isfoodRecord.isPublic !== 1) {
      return next(appError(403, "無權限查看非公開的美食紀錄"));
    }

    handleSuccess(res, isfoodRecord, "取得美食紀錄成功");
  },

  // * 新增單筆美食紀錄
  addFoodRecord: async (req, res, next) => {
    // 取得登入會員 id
    const memberId = req.user.id;

    const {
      categoryId,
      customCategoryId,
      store,
      phone,
      foodName,
      description,
      image,
      date,
      rating,
      thoughts,
      notes,
      openingHours,
      storeNotes,
      city,
      district,
      address,
      longitude,
      latitude,
      isPublic,
    } = req.body;

    let categories = [];
    let customCategories = [];

    // 驗證 categoryId 和 customCategoryId 是否為陣列
    if (categoryId) {
      if (!Array.isArray(categoryId)) {
        return next(appError(400, "categoryId 必須是陣列。"));
      }

      // 驗證 categoryId 是否存在並獲取名稱
      categories = await tools.findArrayModelsByIdsAndReturn(
        Category,
        categoryId,
        next
      );
      if (!categories) return; // 如果不存在，已經在函數內處理錯誤
    }

    if (customCategoryId) {
      if (!Array.isArray(customCategoryId)) {
        return next(appError(400, "customCategoryId 必須是陣列。"));
      }

      // 驗證 customCategoryId 是否存在並獲取名稱
      customCategories = await tools.findArrayModelsByIdsAndReturn(
        MemberCategory,
        customCategoryId,
        next
      );
      if (!customCategories) return; // 如果不存在，已經在函數內處理錯誤
    }

    // 驗證必填欄位
    if (
      !store ||
      !foodName ||
      !date ||
      !rating ||
      !city ||
      !district ||
      !address ||
      !longitude ||
      !latitude
    ) {
      return next(
        appError(
          400,
          "餐廳名稱、食物名稱、日期、評分、縣市、區域、地址、經度、緯度為必填"
        )
      );
    }

    // 新增美食紀錄
    const newFoodRecord = await FoodRecord.create({
      memberId,
      categoryId: categories.map((cat) => ({ id: cat._id, name: cat.name })), // 假設 categories 是一個對象陣列
      customCategoryId: customCategories.map((cat) => ({
        id: cat._id,
        name: cat.name,
      })), // 同上
      store,
      phone,
      foodName,
      description,
      image,
      date,
      rating,
      thoughts,
      notes,
      openingHours,
      storeNotes,
      city,
      district,
      address,
      longitude,
      latitude,
      isPublic,
    });

    console.log(`newFoodRecord: ${newFoodRecord}`);

    handleSuccess(res, newFoodRecord, "新增美食紀錄成功");
  },

  // * 修改單筆美食紀錄
  updateFoodRecord: async (req, res, next) => {
    // 取得登入會員 id
    const memberId = req.user.id;

    const foodRecordId = req.params.foodRecordId;

    // 驗證 foodRecordId 是否存在
    const isfoodRecord = await tools.findModelByIdNext(
      FoodRecord,
      foodRecordId,
      next
    );
    if (!isfoodRecord) return; // 如果不存在，已經在函數內處理錯誤

    const {
      categoryId,
      customCategoryId,
      store,
      phone,
      foodName,
      description,
      image,
      date,
      rating,
      thoughts,
      notes,
      openingHours,
      storeNotes,
      city,
      district,
      address,
      longitude,
      latitude,

      isPublic,
    } = req.body;

    let categories = [];
    let customCategories = [];

    // 驗證 categoryId 和 customCategoryId 是否為陣列
    if (categoryId) {
      if (!Array.isArray(categoryId)) {
        return next(appError(400, "categoryId 必須是陣列。"));
      }

      // 驗證 categoryId 是否存在並獲取名稱
      categories = await tools.findArrayModelsByIdsAndReturn(
        Category,
        categoryId,
        next
      );
      if (!categories) return; // 如果不存在，已經在函數內處理錯誤
    }

    if (customCategoryId) {
      if (!Array.isArray(customCategoryId)) {
        return next(appError(400, "customCategoryId 必須是陣列。"));
      }

      // 驗證 customCategoryId 是否存在並獲取名稱
      customCategories = await tools.findArrayModelsByIdsAndReturn(
        MemberCategory,
        customCategoryId,
        next
      );
      if (!customCategories) return; // 如果不存在，已經在函數內處理錯誤
    }

    // 驗證必填欄位
    if (
      !store ||
      !foodName ||
      !date ||
      !rating ||
      !city ||
      !district ||
      !address ||
      !longitude ||
      !latitude
    ) {
      return next(
        appError(
          400,
          "餐廳名稱、食物名稱、日期、評分、縣市、區域、地址、經度、緯度為必填"
        )
      );
    }

    // 修改美食紀錄
    const updatedFoodRecord = await FoodRecord.findByIdAndUpdate(
      foodRecordId,
      {
        memberId,
        categoryId: categories.map((cat) => ({ id: cat._id, name: cat.name })), // 假設 categories 是一個對象陣列
        customCategoryId: customCategories.map((cat) => ({
          id: cat._id,
          name: cat.name,
        })), // 同上
        store,
        phone,
        foodName,
        description,
        image,
        date,
        rating,
        thoughts,
        notes,
        openingHours,
        storeNotes,
        city,
        district,
        address,
        longitude,
        latitude,
        isPublic,
      },
      { new: true }
    );

    handleSuccess(res, updatedFoodRecord, "修改美食紀錄成功");
  },

  // * (偽)刪除單筆美食紀錄
  softDeleteFoodRecord: async (req, res, next) => {
    // 取得登入會員 id
    const memberId = req.user.id;

    const foodRecordId = req.params.foodRecordId;

    // 驗證 foodRecordId 是否存在
    const isfoodRecord = await tools.findModelByIdNext(
      FoodRecord,
      foodRecordId,
      next
    );
    if (!isfoodRecord) return; // 如果不存在，已經在函數內處理錯誤

    // 驗證該紀錄是否為該會員的
    if (isfoodRecord.memberId.toString() !== memberId) {
      return next(appError(403, "無權限刪除他人的美食紀錄"));
    }

    // 軟刪除美食紀錄
    const softDeletedFoodRecord = await FoodRecord.findByIdAndUpdate(
      foodRecordId,
      { isPublic: 0, status: 0 },
      { new: true }
    );

    handleSuccess(res, null, "刪除美食紀錄成功");
  },

  // * 登入會員隨機抽自己的美食 randomMemberFoodRecord
  // * 隨機抽公開的美食 randomPublicFoodRecord
};

module.exports = foodRecordController;
