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
const FoodShare = require("../models/foodShare");

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

  // * 分享一筆美食紀錄給好友
  shareFoodRecord: async (req, res, next) => {
    // 取得登入會員 id
    const memberId = req.user.id;

    const foodRecordId = req.params.foodRecordId;
    const { friendId } = req.body;

    // 驗證 foodRecordId 是否存在
    const isfoodRecord = await tools.findModelByIdNext(
      FoodRecord,
      foodRecordId,
      next
    );
    if (!isfoodRecord) return; // 如果不存在，已經在函數內處理錯誤

    // 驗證該紀錄是否為該會員的
    if (isfoodRecord.memberId.toString() !== memberId) {
      return next(appError(403, "無權限分享他人的美食紀錄"));
    }

    // 驗證 friendId 是否為會員的好友
    const isFriend = await Friend.findOne({
      memberId,
      friendList: { $in: [friendId] },
    });

    if (!isFriend) {
      return next(appError(403, "無權限分享非好友的美食紀錄"));
    }

    // 驗證 friendId 是否為會員
    const isMember = await tools.findModelByIdNext(Member, friendId, next);
    if (!isMember) return; // 如果不存在，已經在函數內處理錯誤

    // 驗證該會員接收到的分享紀錄是否已經存在
    const isReceived = await FoodShare.findOne({
      memberId: memberId, // 直接使用 friendId，Mongoose 會自動處理轉換
      sharedWithMemberId: friendId, // 直接使用 memberId
      foodRecordId: foodRecordId, // 直接使用 foodRecordId
    });

    console.log(`isReceived: ${isReceived}`);

    if (isReceived) {
      return next(appError(403, "已分享過該美食紀錄"));
    }

    // 分享美食紀錄
    const newFoodShare = await FoodShare.create({
      memberId,
      sharedWithMemberId: friendId,
      foodRecordId: foodRecordId,
    });

    // 將分享的美食紀錄 id 加入到被分享好友的 receivedFoodShareId 中
    await Member.findByIdAndUpdate(friendId, {
      $push: { receivedFoodShareId: newFoodShare._id },
    });

    handleSuccess(res, newFoodShare, "分享美食紀錄成功");
  },

  // * 取得登入會員所有被分享美食 getSharedFoodRecords
  getSharedFoodRecords: async (req, res, next) => {
    // 取得登入會員 id
    const memberId = req.user.id;

    // 取得登入會員的所有被分享美食紀錄
    const sharedFoodRecords = await FoodShare.find({
      sharedWithMemberId: memberId,
      status: 0,
    }).populate("foodRecordId");

    handleSuccess(res, sharedFoodRecords, "取得被分享美食紀錄成功");
  },

  // * 變更分享美食狀態 updateShareStatus
  updateShareStatus: async (req, res, next) => {
    // 取得登入會員 id
    const memberId = req.user.id;

    const foodShareId = req.params.foodShareId;
    const { status } = req.body; // 0:待確認 1:接收 accept 2:不接收 reject

    // 驗證 foodShareId 是否存在
    const isFoodShare = await tools.findModelByIdNext(
      FoodShare,
      foodShareId,
      next
    );
    if (!isFoodShare) return; // 如果不存在，已經在函數內處理錯誤

    // 驗證該分享是否為該會員的
    if (isFoodShare.sharedWithMemberId.toString() !== memberId) {
      return next(appError(403, "無權限變更他人的分享美食紀錄狀態"));
    }

    // 驗證 status 是否為 accept, reject
    if (status !== "accept" && status !== "reject") {
      return next(appError(400, "status 參數不正確，只能是 accept 或 reject"));
    }

    // ? 處理同意接收 accept
    if (status === "accept") {
      // 變更分享狀態
      const updatedFoodShare = await FoodShare.findByIdAndUpdate(
        foodShareId,
        { status: 1 },
        { new: true }
      );

      // 將分享的美食紀錄 id 從被分享好友的 receivedFoodShareId 中移除
      await Member.findByIdAndUpdate(memberId, {
        $pull: { receivedFoodShareId: foodShareId },
      });

      // 步驟 1: 查詢 FoodShare 實例
      const foodShare = await FoodShare.findById(foodShareId).populate(
        "foodRecordId"
      );

      // 將接收的美食變成新紀錄加到會員的 FoodRecord 中
      const newFoodRecordData = {
        memberId,
        ...(foodShare.foodRecordId.categoryId && {
          categoryId: foodShare.foodRecordId.categoryId,
        }),
        ...(foodShare.foodRecordId.customCategoryId && {
          customCategoryId: foodShare.foodRecordId.customCategoryId,
        }),
        ...(foodShare.foodRecordId.store && {
          store: foodShare.foodRecordId.store,
        }),
        ...(foodShare.foodRecordId.phone && {
          phone: foodShare.foodRecordId.phone,
        }),
        ...(foodShare.foodRecordId.foodName && {
          foodName: foodShare.foodRecordId.foodName,
        }),
        ...(foodShare.foodRecordId.description && {
          description: foodShare.foodRecordId.description,
        }),
        ...(foodShare.foodRecordId.image && {
          image: foodShare.foodRecordId.image,
        }),
        ...(foodShare.foodRecordId.date && {
          date: foodShare.foodRecordId.date,
        }),
        ...(foodShare.foodRecordId.rating && {
          rating: foodShare.foodRecordId.rating,
        }),
        ...(foodShare.foodRecordId.thoughts && {
          thoughts: foodShare.foodRecordId.thoughts,
        }),
        ...(foodShare.foodRecordId.notes && {
          notes: foodShare.foodRecordId.notes,
        }),
        ...(foodShare.foodRecordId.openingHours && {
          openingHours: foodShare.foodRecordId.openingHours,
        }),
        ...(foodShare.foodRecordId.storeNotes && {
          storeNotes: foodShare.foodRecordId.storeNotes,
        }),
        ...(foodShare.foodRecordId.city && {
          city: foodShare.foodRecordId.city,
        }),
        ...(foodShare.foodRecordId.district && {
          district: foodShare.foodRecordId.district,
        }),
        ...(foodShare.foodRecordId.address && {
          address: foodShare.foodRecordId.address,
        }),
        ...(foodShare.foodRecordId.longitude && {
          longitude: foodShare.foodRecordId.longitude,
        }),
        ...(foodShare.foodRecordId.latitude && {
          latitude: foodShare.foodRecordId.latitude,
        }),
        ...(foodShare.foodRecordId.isPublic !== undefined && {
          isPublic: foodShare.foodRecordId.isPublic,
        }),
      };

      const newFoodRecord = await FoodRecord.create(newFoodRecordData);

      handleSuccess(
        res,
        newFoodRecord,
        "接收分享美食紀錄成功，已將美食紀錄加入到您的美食紀錄中！"
      );
    }

    // ? 處理拒絕接收 reject
    if (status === "reject") {
      // 刪除分享紀錄
      await FoodShare.findByIdAndUpdate(foodShareId, { status: 2 });

      // 將分享的美食紀錄 id 從被分享好友的 receivedFoodShareId 中移除
      await Member.findByIdAndUpdate(memberId, {
        $pull: { receivedFoodShareId: foodShareId },
      });

      handleSuccess(res, null, "拒絕接收分享美食紀錄成功");
    }
  },

  // * 登入會員隨機抽自己的美食 randomMemberFoodRecord
  // * 隨機抽公開的美食 randomPublicFoodRecord
};

module.exports = foodRecordController;
