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

const memberController = {
  // * 取得所有會員資料 (開發方便查詢用)
  getAllMembers: async (req, res, next) => {
    // 驗證管理員密碼
    const adminPassword = req.body.adminPassword;
    if (adminPassword !== process.env.ADMIN_PASSWORD) {
      return next(appError(401, "管理員密碼錯誤"));
    }

    const members = await Member.find();
    handleSuccess(res, members, "取得所有會員資料成功");
  },

  // * 取得登入會員資料
  getLoggedInMember: async (req, res, next) => {
    const memberId = req.user.id;

    // 取得會員資料
    const member = await Member.findById(memberId)
      .select("-status -updatedAt -__v -isAdmin")
      .populate("friendId");

    handleSuccess(res, member, "取得會員資料成功");
  },

  // * 取得指定會員資料
  getMemberById: async (req, res, next) => {
    const memberId = req.params.memberId;

    // 驗證 memberId 格式和是否存在
    const isValidMemberId = await tools.findModelByIdNext(
      Member,
      memberId,
      next
    );
    if (!isValidMemberId) {
      return;
    }

    // 取得會員資料
    const member = await Member.findById(memberId)
      .select("-status -updatedAt -__v -isAdmin")
      .populate("friendId");

    handleSuccess(res, member, "取得指定會員資料成功");
  },

  // * 修改會員資料
  updateLoggedInMember: async (req, res, next) => {
    const memberId = req.user.id;

    const {
      name,
      gender,
      birthday,
      photo,
      favoriteCategorys,
      favoriteCustomCategorys,
      intro,
    } = req.body;

    // 更新物件
    const updateFields = {};

    if (name) {
      updateFields.name = name;
    }
    if (photo) {
      updateFields.photo = photo;
    }
    if (intro) {
      updateFields.intro = intro;
    }

    // 驗證 gender 值
    if (gender) {
      if (!["male", "female", "other"].includes(gender)) {
        return next(appError(400, "gender 須為 male, female 或 other"));
      }
      updateFields.gender = gender;
    }

    // 驗證 birthday 和轉換 Date 物件
    if (birthday) {
      const isValidDateStr = Date.parse(birthday);
      if (!isValidDateStr) {
        return next(appError(400, "birthday 格式錯誤"));
      }
      const birthdayDateObj = new Date(birthday);
      updateFields.birthday = birthdayDateObj;
    }

    // 驗證 favoriteCategorys 格式
    if (favoriteCategorys) {
      if (!Array.isArray(favoriteCategorys)) {
        return next(appError(400, "favoriteCategorys 須為陣列"));
      }

      // 驗證 favoriteCategorys 是否存在
      const isValidCategorys = await tools.findArrayModelsByIdsNext(
        Category,
        favoriteCategorys,
        next
      );

      updateFields.favoriteCategorys = favoriteCategorys;
    }

    // 驗證 favoriteCustomCategorys 格式
    if (favoriteCustomCategorys) {
      if (!Array.isArray(favoriteCustomCategorys)) {
        return next(appError(400, "favoriteCustomCategorys 須為陣列"));
      }

      // 驗證 favoriteCustomCategorys 是否存在
      const isValidCustomCategorys = await tools.findArrayModelsByIdsNext(
        MemberCategory,
        favoriteCustomCategorys,
        next
      );

      updateFields.favoriteCustomCategorys = favoriteCustomCategorys;
    }

    // 更新會員資料
    const updateMember = await Member.findByIdAndUpdate(
      memberId,
      updateFields,
      { new: true, runValidators: true }
    ).select(
      "name gender birthday photo favoriteCategorys favoriteCustomCategorys intro"
    );

    if (!updateMember) {
      return next(appError(404, "找不到會員資料，更新失敗"));
    }

    handleSuccess(res, updateMember, "更新會員資料成功");
  },

  // * 修改登入會員密碼
  updateLoggedInPassword: async (req, res, next) => {
    const memberId = req.user.id;
    let { newPassword, confirmNewPassword } = req.body;

    // 驗證必填欄位
    if (!newPassword || !confirmNewPassword) {
      return next(appError(400, "newPassword, confirmNewPassword 為必填"));
    }

    // 檢查密碼是否一致
    if (newPassword !== confirmNewPassword) {
      return next(appError(400, "新密碼不一致"));
    }

    // 驗證密碼格式
    const isValidPassword = /^(?=.*[a-zA-Z])(?=.*[0-9]).{8,}$/.test(
      newPassword
    );
    if (!isValidPassword) {
      return next(appError(400, "密碼需包含英文及數字，且至少 8 碼"));
    }

    // 更新密碼
    newPassword = await bcrypt.hash(newPassword, 12);
    const updatePassword = await Member.findByIdAndUpdate(
      memberId,
      { password: newPassword },
      { new: true }
    );

    if (!updatePassword) {
      return next(appError(404, "找不到會員資料，更新失敗"));
    }

    handleSuccess(res, null, "更新會員密碼成功");
  },

  // * 管理員修改會員密碼
  adminUpdatePassword: async (req, res, next) => {
    let { memberId, newPassword, adminPassword } = req.body;

    if (adminPassword !== process.env.ADMIN_PASSWORD) {
      return next(appError(401, "管理員密碼錯誤"));
    }

    // 驗證 memberId 格式和是否存在
    const isValidMemberId = await tools.findModelByIdNext(
      Member,
      memberId,
      next
    );
    if (!isValidMemberId) {
      return;
    }

    // 更新密碼
    newPassword = await bcrypt.hash(newPassword, 12);
    const updatePassword = await Member.findByIdAndUpdate(
      memberId,
      { password: newPassword },
      { new: true }
    );

    if (!updatePassword) {
      return next(appError(404, "找不到會員資料，更新失敗"));
    }

    handleSuccess(res, null, "管理員更新會員密碼成功");
  },


};

module.exports = memberController;
