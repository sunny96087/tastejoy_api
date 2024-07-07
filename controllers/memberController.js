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

  // * 取得登入會員好友 getLoggedInFriends
  getLoggedInFriends: async (req, res, next) => {
    const memberId = req.user.id;

    // 先找到登入會員的好友資料 id
    const memberFriendId = await Member.findById(memberId).select("friendId");

    // 驗證好友資料是否存在
    if (!memberFriendId) {
      return next(appError(404, "找不到好友資料"));
    }

    // 取得好友資料
    const friendData = await Friend.findById(memberFriendId.friendId)
      .populate("friendList")
      .populate("sentRequests")
      .populate("receivedRequests");

    handleSuccess(res, friendData, "取得登入會員好友成功");
  },

  // * 新增單筆好友邀請 addFriendInvite
  addFriendInvite: async (req, res, next) => {
    const memberId = req.user.id;
    const { friendId } = req.body;

    // 驗證 friendId 格式和是否存在
    const isValidFriendId = await tools.findModelByIdNext(
      Member,
      friendId,
      next
    );
    if (!isValidFriendId) {
      return;
    }

    // 驗證是否為好友
    const isFriend = await Friend.findOne({
      memberId: memberId,
      friendList: friendId,
    });
    if (isFriend) {
      return next(appError(400, "已經是好友了"));
    }

    // 驗證是否已送出邀請
    const isSentRequest = await Friend.findOne({
      memberId: memberId,
      sentRequests: friendId,
    });
    if (isSentRequest) {
      return next(appError(400, "已送出好友邀請"));
    }

    // 驗證是否已收到邀請
    const isReceivedRequest = await Friend.findOne({
      memberId: memberId,
      receivedRequests: friendId,
    });
    if (isReceivedRequest) {
      return next(
        appError(400, "已收到該用戶的好友邀請，到待確認好友看看吧！")
      );
    }

    // 新增好友邀請
    const addInvite = await Friend.findOneAndUpdate(
      { memberId: memberId },
      { $push: { sentRequests: friendId } },
      { new: true }
    );

    if (!addInvite) {
      return next(appError(400, "新增好友邀請失敗"));
    }

    // 送出好友邀請的用戶新增收到邀請
    const addReceivedInvite = await Friend.findOneAndUpdate(
      { memberId: friendId },
      { $push: { receivedRequests: memberId } },
      { new: true }
    );

    if (!addReceivedInvite) {
      return next(appError(400, "新增好友邀請失敗"));
    }

    handleSuccess(res, null, "新增好友邀請成功");
  },

  // * 變更好友列表狀態 (接受/拒絕 邀請、刪除好友、取消好友邀請)
  updateFriendInviteStatus: async (req, res, next) => {
    const memberId = req.user.id;
    const { friendId, status } = req.body;

    // 驗證 friendId, status 是否存在
    if (!friendId || !status) {
      return next(appError(400, "好友 Id, 處理狀態為必填"));
    }

    // 驗證 friendId 格式和是否存在
    const isValidFriendId = await tools.findModelByIdNext(
      Member,
      friendId,
      next
    );
    if (!isValidFriendId) {
      return;
    }

    // 驗證 status 值
    if (!["accept", "reject", "delete", "cancel"].includes(status)) {
      return next(
        appError(
          400,
          "請選擇如何處理好友狀態，status 須為 accept, reject, delete, cancel"
        )
      );
    }

    if (status === "accept" || status === "reject") {
      // 驗證是否有好友邀請
      const isReceivedRequest = await Friend.findOne({
        memberId: memberId,
        receivedRequests: friendId,
      });
      if (!isReceivedRequest) {
        return next(appError(400, "找不到好友邀請"));
      }
    }

    if (status === "cancel") {
      // 驗證是否有送出的好友邀請
      const isSentRequest = await Friend.findOne({
        memberId: memberId,
        sentRequests: friendId,
      });
      if (!isSentRequest) {
        return next(appError(400, "找不到送出的好友邀請"));
      }
    }

    // ? 處理接受好友邀請
    if (status === "accept") {
      // 我收到一則好友邀請，我是 memberId，對方是 friendId

      // 先將我收到的好友邀請刪除
      const deleteReceivedRequest = await Friend.findOneAndUpdate(
        { memberId: memberId },
        { $pull: { receivedRequests: friendId } },
        { new: true }
      );

      if (!deleteReceivedRequest) {
        return next(appError(400, "刪除好友收到的好友邀請失敗"));
      }

      // 將對方送出的好友邀請刪除
      const deleteSentRequest = await Friend.findOneAndUpdate(
        { memberId: friendId },
        { $pull: { sentRequests: memberId } },
        { new: true }
      );

      if (!deleteSentRequest) {
        return next(appError(400, "刪除好友送出的好友邀請失敗"));
      }

      // 將對方加入我的 friendList
      const addFriend = await Friend.findOneAndUpdate(
        { memberId: memberId },
        { $push: { friendList: friendId } },
        { new: true }
      );

      if (!addFriend) {
        return next(appError(400, "將好友加入 friendList 失敗"));
      }

      // 將我加入對方的 friendList
      const addSelfToFriend = await Friend.findOneAndUpdate(
        { memberId: friendId },
        { $push: { friendList: memberId } },
        { new: true }
      );

      if (!addSelfToFriend) {
        return next(appError(400, "將自己加入好友的 friendList 失敗"));
      }

      handleSuccess(res, null, "接受好友邀請成功");
    }

    // ? 處理拒絕好友邀請
    if (status === "reject") {
      // 刪除對方的 sentRequests
      const deleteSentRequest = await Friend.findOneAndUpdate(
        { memberId: friendId },
        { $pull: { sentRequests: memberId } },
        { new: true }
      );

      if (!deleteSentRequest) {
        return next(appError(400, "刪除朋友收到的好友邀請失敗"));
      }

      // 刪除自己收到的 receivedRequests
      const deleteReceivedRequest = await Friend.findOneAndUpdate(
        { memberId: memberId },
        { $pull: { receivedRequests: friendId } },
        { new: true }
      );

      if (!deleteReceivedRequest) {
        return next(appError(400, "刪除自己收到的好友邀請失敗"));
      }

      handleSuccess(res, null, "拒絕好友邀請成功");
    }

    // ? 處理刪除好友
    if (status === "delete") {
      // 驗證是否為好友
      const isFriend = await Friend.findOne({
        memberId: memberId,
        friendList: friendId,
      });
      if (!isFriend) {
        return next(appError(400, "找不到好友"));
      }

      // 刪除自己的 friendList
      const deleteFriend = await Friend.findOneAndUpdate(
        { memberId: memberId },
        { $pull: { friendList: friendId } },
        { new: true }
      );

      if (!deleteFriend) {
        return next(appError(400, "從我的好友列表刪除該好友失敗"));
      }

      // 刪除對方的 friendList
      const deleteFriendFromFriend = await Friend.findOneAndUpdate(
        { memberId: friendId },
        { $pull: { friendList: memberId } },
        { new: true }
      );

      if (!deleteFriendFromFriend) {
        return next(appError(400, "從對方的好友列表刪除我的好友失敗"));
      }

      handleSuccess(res, null, "刪除好友成功");
    }

    // ? 處理取消好友邀請
    if (status === "cancel") {
      // 刪除自己的 sentRequests
      const deleteSentRequest = await Friend.findOneAndUpdate(
        { memberId: memberId },
        { $pull: { sentRequests: friendId } },
        { new: true }
      );

      if (!deleteSentRequest) {
        return next(appError(400, "刪除送出的好友邀請失敗"));
      }

      // 刪除對方的 receivedRequests
      const deleteReceivedRequest = await Friend.findOneAndUpdate(
        { memberId: friendId },
        { $pull: { receivedRequests: memberId } },
        { new: true }
      );

      if (!deleteReceivedRequest) {
        return next(appError(400, "刪除對方收到的好友邀請失敗"));
      }

      handleSuccess(res, null, "取消好友邀請成功");
    }
  },
};

module.exports = memberController;
