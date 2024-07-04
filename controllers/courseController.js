const Vendor = require("../models/vendor");
const Teacher = require("../models/teacher");
const Order = require("../models/order");
const Member = require("../models/member");
const { Course, CourseItem, CourseComment, CourseClickLog } = require("../models/course");
const appError = require("../utils/appError");
const handleSuccess = require("../utils/handleSuccess");
const { isVendorAuth, generateSendJWT } = require("../utils/vendorAuth");
const tools = require("../utils/tools");
const validator = require("validator");
const mongoose = require("mongoose");

const courseController = {
  // ? 取得賣家所有課程評價 (query: startDate + endDate, tags, keyword(orderId || content))  (Back)
  getAdminCourseComments: async (req, res, next) => {
    // 取得賣家 id
    const vendorId = req.vendor.id;

    // 從請求中取得查詢參數
    const { startDate, endDate, tags, keyword, sort } = req.query;

    // 先查詢賣家的所有訂單
    const orders = await Order.find({ vendorId });
    const orderIds = orders.map((order) => order._id);

    // 建立查詢條件
    const query = { orderId: { $in: orderIds } };

    // 根據 startDate 和 endDate 查詢評價
    if (startDate && endDate) {
      // 包含結束日期的整個時間範圍 -> 23:59:59：
      let end = new Date(endDate);
      end.setHours(23);
      end.setMinutes(59);
      end.setSeconds(59);

      query.createdAt = { $gte: new Date(startDate), $lte: end };
    }

    // 根據 tags 查詢評價
    if (tags) {
      query.tags = { $in: tags.split(",") };
    }

    // 根據 keyword 查詢評價
    if (keyword) {
      if (mongoose.Types.ObjectId.isValid(keyword)) {
        query.$or = [
          { 'orderId': keyword },
          { content: { $regex: new RegExp(keyword, 'i') } },
        ];
      } else {
        query.$or = [
          { content: { $regex: new RegExp(keyword, 'i') } },
        ];
      }
    }

    // 查詢賣家的所有課程評價
    let commentsQuery = CourseComment.find(query)
      .populate("memberId")
      .populate("orderId")
      .populate("courseId")
      .select("content images tags rating likes createdAt orderId courseId");

    // 如果請求的 query 中有 sort 參數，則進行排序
    if (sort) {
      let sortField, sortOrder;
      switch (sort) {
        case 'createdAtAsc': // 建立日期舊到新
          sortField = 'createdAt';
          sortOrder = 1;
          break;
        case 'createdAtDesc': // 建立日期新到舊 (預設)
          sortField = 'createdAt';
          sortOrder = -1;
          break;
        case 'ratingAsc': // 評分低到高
          sortField = 'rating';
          sortOrder = 1;
          break;
        case 'ratingDesc': // 評分高到低
          sortField = 'rating';
          sortOrder = -1;
          break;
        default:
          sortField = 'createdAt';
          sortOrder = -1;
      }

      commentsQuery = commentsQuery.sort({ [sortField]: sortOrder });
    }

    const comments = await commentsQuery;

    handleSuccess(res, comments, "取得所有評價成功");
  },

  // ? 取得全部課程 (query: createdAt, courseTerm, courseStatus, keyword(teacherId > name || courseName)) (Back)
  getAdminCourses: async (req, res, next) => {
    // 取得賣家 id
    const vendorId = req.vendor.id;

    // console.log("vendorId", vendorId);
    // console.log("req.query", req.query);

    // 從請求中取得查詢參數
    const { startDate, courseTerm, courseStatus, keyword } = req.query;

    // 建立查詢條件
    const query = { vendorId };

    // 只返回 courseStatus 為 0 或 1 的課程
    query.courseStatus = { $in: [0, 1] };

    // 根據 courseTerm 課程時長類型 過濾課程 (0: 單堂體驗 1:培訓課程)
    if (courseTerm !== "") {
      query.courseTerm = courseTerm;
    }

    // 根據 courseStatus 課程狀態 過濾課程 (0: 下架, 1: 上架, 2: 刪除)
    if (courseStatus !== "") {
      query.courseStatus = courseStatus;
    }

    // 根據 keyword 過濾課程
    if (keyword !== "") {
      const keywordCourses = await Course.aggregate([
        {
          $lookup: {
            from: "teachers", // 請根據你的實際情況替換為 teacher 集合的名稱
            localField: "teacherId",
            foreignField: "_id",
            as: "teacher",
          },
        },
        { $unwind: "$teacher" },
        {
          $match: {
            $or: [
              { "teacher.name": { $regex: keyword, $options: "i" } },
              { courseName: { $regex: keyword, $options: "i" } },
            ],
          },
        },
      ]);

      query._id = { $in: keywordCourses.map((course) => course._id) };
    }

    // 根據 createdAt 排序課程
    // const sort = {};
    // if (createdAt === "asc") {
    //   sort.createdAt = 1;
    // } else {
    //   sort.createdAt = -1; // 預設為降序
    // }

    // 查詢賣家的所有課程
    let courses = await Course.find(query)
      .populate("teacherId")
      .populate("courseItemId");
    // .sort(sort)

    // 對每個課程查詢相關的 courseItemId 並找出最早的 startTime 和最晚的 endTime
    courses = await Promise.all(
      courses.map(async (course) => {
        const courseItems = await CourseItem.find({
          _id: { $in: course.courseItemId },
        });

        if (courseItems.length === 0) {
          return course;
        }

        const startTimes = courseItems
          .filter((item) => item.startTime)
          .map((item) => new Date(item.startTime).getTime());
        const endTimes = courseItems
          .filter((item) => item.endTime)
          .map((item) => new Date(item.endTime).getTime());

        if (startTimes.length === 0 || endTimes.length === 0) {
          return course;
        }

        const earliestStartTime = new Date(Math.min(...startTimes));
        const latestEndTime = new Date(Math.max(...endTimes));

        return {
          ...course._doc,
          earliestStartTime,
          latestEndTime,
        };
      })
    );

    // 根據 earliestStartTime 排序課程
    if (startDate === "asc") {
      courses.sort((a, b) => a.earliestStartTime - b.earliestStartTime);
    } else {
      courses.sort((a, b) => b.earliestStartTime - a.earliestStartTime); // 預設為降序
    }

    // 返回查詢結果
    handleSuccess(res, courses, "取得全部課程成功");
  },

  // ? 取得單筆課程資料 + 項目資料 (Back)
  getAdminCourse: async (req, res, next) => {
    // 從請求中取得課程 id
    const { courseId } = req.params;

    // 檢查課程是否存在
    const isCourseExist = await tools.findModelByIdNext(Course, courseId, next);
    if (!isCourseExist) {
      return;
    }

    // 檢查課程是否被假刪除
    const courseCheck = await Course.findById(courseId);
    if (courseCheck.courseStatus === 2) {
      return next(appError(404, "該課程已刪除"));
    }

    // 查詢課程
    const course = await Course.findById(courseId)
      .populate("teacherId")
      .populate("courseItemId");

    // 如果課程不存在，則返回錯誤
    if (!course) {
      return next(appError(404, "課程不存在"));
    }

    // 返回查詢結果
    handleSuccess(res, course, "取得單筆課程資料成功");
  },

  // * 取得課程列表 (Front)
  getCourses: async (req, res, next) => {
    let { keyword, courseTerm, courseType, sortBy, pageNo, pageSize } = req.query;

    // 建立查詢條件；預設顯示狀態為 0 或 1 的課程
    let queryField = { courseStatus: { $in: [0, 1] } };

    // 關鍵字查詢
    if (keyword) {
      queryField.courseName = { $regex: keyword, $options: "i" };
    }

    // 課程類型(Array)查詢
    if (courseType) {
      queryField.courseType = { $in: courseType.split(",") };
    }

    // 選擇課程時長類型 (0:單堂體驗 1:培訓課程)
    if (courseTerm) {
      courseTerm = parseInt(courseTerm);
      queryField.courseTerm = courseTerm;
    }

    // 分頁查詢 (預設第 1 頁，每頁 100 筆)
    pageNo = parseInt(pageNo) || 1;
    pageSize = parseInt(pageSize) || 100;
    let skip = (pageNo - 1) * pageSize;
    let limit = pageSize;

    // 課程
    let courses = [];

    // 排序查詢 (預設依照最新時間排序)
    sortBy = sortBy || "newest";
    if (sortBy === "newest") {
      // 依照最新時間排序
      courses = await Course.aggregate([
        { $match: queryField },
        {
          $lookup: {
            from: "vendors",
            localField: "vendorId",
            foreignField: "_id",
            as: "vendor",
          }
        },
        { $unwind: "$vendor" },
        {
          $project: {
            courseName: 1,
            brandName: "$vendor.brandName",
            courseType: 1,
            courseTerm: 1,
            courseImage: 1,
            coursePrice: 1,
            createdAt: 1
          }
        },
        { $sort: { createdAt: -1 } },
        { $skip: skip },
        { $limit: limit }
      ])
    } else if (sortBy === "mostPopular") {
      // 依照訂單被預訂數量 status=3(已完課) -> 收藏數量 -> 最新時間
      courses = await Course.aggregate([
        { $match: queryField },
        {
          $lookup: {
            from: "vendors",
            localField: "vendorId",
            foreignField: "_id",
            as: "vendor",
          },
        },
        { $unwind: "$vendor" },
        {
          $lookup: {
            from: "orders",
            localField: "_id",
            foreignField: "courseId",
            as: "orders",
          },
        },
        {
          $lookup: {
            from: "collections",
            localField: "_id",
            foreignField: "courseId",
            as: "collections",
          },
        },
        {
          $project: {
            courseName: 1,
            brandName: "$vendor.brandName",
            courseType: 1,
            courseTerm: 1,
            courseImage: 1,
            coursePrice: 1,
            orderCount: {
              $size: {
                $filter: {
                  input: "$orders",
                  as: "order",
                  cond: { $eq: ["$$order.status", 3] }, // order=3(已完課)
                },
              },
            },
            collectionCount: { $size: "$collections" },
            createdAt: 1,
          },
        },
        {
          $sort: { orderCount: -1, collectionCount: -1, createdAt: -1 },
        },
        { $skip: skip },
        { $limit: limit },
      ]);
    } else if (sortBy === "highestRate") {
      // 依照評價高低 -> 評論數最多 -> 最新上架時間
      courses = await Course.aggregate([
        {
          $match: queryField,
        },
        {
          $lookup: {
            from: "vendors",
            localField: "vendorId",
            foreignField: "_id",
            as: "vendor",
          },
        },
        {
          $unwind: "$vendor",
        },
        {
          $lookup: {
            from: "coursecomments",
            localField: "_id",
            foreignField: "courseId",
            as: "comments",
          },
        },
        {
          $unwind: {
            path: "$comments",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $group: {
            _id: "$_id",
            courseName: { $first: "$courseName" },
            brandName: { $first: "$vendor.brandName" },
            courseType: { $first: "$courseType" },
            courseTerm: { $first: "$courseTerm" },
            courseImage: { $first: "$courseImage" },
            coursePrice: { $first: "$coursePrice" },
            averageRate: {
              $avg: {
                $cond: [{ $ifNull: ["$comments.rating", false] }, "$comments.rating", 0],
              },
            },
            commentCount: {
              $sum: { $cond: [{ $ifNull: ["$comments._id", false] }, 1, 0] },
            },
            createdAt: { $first: "$createdAt" },
          },
        },
        { $sort: { averageRate: -1, commentCount: -1, createdAt: -1 } },
        { $skip: skip },
        { $limit: limit },
        {
          $project: {
            courseName: 1,
            brandName: 1,
            courseType: 1,
            courseTerm: 1,
            courseImage: 1,
            coursePrice: 1,
            averageRate: 1,
            commentCount: 1,
            createdAt: 1,
          },
        },
      ]);
    } else {
      return next(appError(400, "無效的排序方式"));
    }

    handleSuccess(res, courses, "取得課程列表成功");
  },

  // ? 新增課程 + 項目資料 (Back)
  newCourse: async (req, res, next) => {
    // 先建立主課程
    let data = req.body;

    // 取得登入的賣家 id
    let vendorId = req.vendor.id;

    // 檢查老師 id 是否存在
    const isIdExist = await tools.findModelByIdNext(
      Teacher,
      data.teacherId,
      next
    );
    if (!isIdExist) {
      return;
    }

    // 使用 trimObjectValues 函數來去掉資料中所有值的空格
    data = tools.trimObjectAllValues(data);

    // 定義及檢查欄位內容不得為空 // ps. courseLocation 課程所在地 暫時不用
    const fieldsToCheck = [
      "teacherId",
      "courseType",
      "courseTerm",
      "courseName",
      "coursePrice",
      "courseStatus",
      "courseCapacity",
      "courseSummary",
      "courseAddress",
      "courseImage",
      "courseContent",
    ];
    const errorMessage = tools.checkFieldsNotEmpty(data, fieldsToCheck);
    if (errorMessage) {
      return next(appError(400, errorMessage));
    }

    // create course
    const newCourse = await Course.create({
      vendorId,
      ...data,
    });

    // 找到相對應的老師並將新課程 _id 添加到 courseId 陣列中
    const teacher = await Teacher.findById(data.teacherId);
    if (!teacher) {
      return next(appError(400, "找不到相對應的老師"));
    }
    teacher.courseId.push(newCourse._id);
    await teacher.save();

    // 建立課程項目並儲存課程項目的 ID
    const courseItems = data.courseItems;
    const courseItemIds = [];
    for (let item of courseItems) {
      const newCourseItem = await CourseItem.create({
        courseId: newCourse._id,
        // ...item,
        capacity: data.courseCapacity,
        mainCourseName: data.courseName,
        startTime: item.startTime,
        endTime: item.endTime,
        itemName: item.itemName,
      });
      courseItemIds.push(newCourseItem._id);
    }

    // 更新課程的 courseItemId
    newCourse.courseItemId = courseItemIds;
    await newCourse.save();

    handleSuccess(res, newCourse, "新增課程及時段成功");
  },

  // ? 刪除課程 (偽刪除) (Back)
  deactivateCourse: async (req, res, next) => {
    // 從請求中獲取課程 id
    const { courseId } = req.params;

    // 檢查課程是否存在
    const course = await Course.findById(courseId);
    if (!course) {
      return next(appError(404, "課程不存在"));
    }

    // 將課程狀態設為 2 來表示假刪除
    course.courseStatus = 2;
    await course.save();

    // 找到相對應的老師並從 courseId 陣列中移除該課程 _id
    const teacher = await Teacher.findById(course.teacherId);
    if (teacher) {
      const index = teacher.courseId.indexOf(courseId);
      if (index > -1) {
        teacher.courseId.splice(index, 1);
        await teacher.save();
      }
    }

    handleSuccess(res, null, "刪除課程成功");
  },

  // ? 編輯課程 + 項目資料 (Back)
  updateCourse: async (req, res, next) => {
    // 從請求中獲取課程 id 和更新的資料
    const { courseId } = req.params;
    let data = req.body;

    // 檢查課程是否存在
    const course = await Course.findById(courseId);
    if (!course) {
      return next(appError(404, "課程不存在"));
    }

    // 使用 trimObjectValues 函數來去掉資料中所有值的空格
    data = tools.trimObjectAllValues(data);

    // 定義及檢查欄位內容不得為空
    const fieldsToCheck = [
      "teacherId",
      "courseType",
      "courseTerm",
      "courseName",
      "coursePrice",
      "courseStatus",
      "courseCapacity",
      "courseSummary",
      "courseAddress",
      "courseImage",
      "courseContent",
    ];
    const errorMessage = tools.checkFieldsNotEmpty(data, fieldsToCheck);
    if (errorMessage) {
      return next(appError(400, errorMessage));
    }

    // 更新課程資料
    Object.assign(course, data);
    await course.save();

    // 找到相對應的老師並將課程 _id 添加到 courseId 陣列中
    const teacher = await Teacher.findById(data.teacherId);
    if (!teacher) {
      return next(appError(400, "找不到相對應的老師"));
    }

    // 找到原來的老師並從其 courseId 陣列中移除該課程 _id
    const originalTeacher = await Teacher.findOne({ courseId: course._id });
    if (originalTeacher) {
      originalTeacher.courseId = originalTeacher.courseId.filter(
        (id) => !id.equals(course._id)
      );
      await originalTeacher.save();
    }

    // 將課程 _id 添加到新老師的 courseId 陣列
    teacher.courseId.push(course._id);
    await teacher.save();

    // 對取回來的 item.id 進行比對, 若資料庫有的 id, 但資料內沒出現, 則刪除該筆資料
    const courseItemIds = data.courseItems.map((item) => item.id);

    for (let id of course.courseItemId) {
      if (!courseItemIds.includes(id.toString())) {
        const courseItem = await CourseItem.findOne({
          _id: id,
          courseId: courseId,
        });
        if (courseItem) {
          courseItem.status = 2; // 將狀態設為 2 來表示假刪除
          await courseItem.save();
        }
      }
    }

    course.courseItemId = course.courseItemId.filter((id) =>
      courseItemIds.includes(id.toString())
    );

    // 更新課程項目
    const courseItems = data.courseItems;
    for (let item of courseItems) {
      const courseItem = await CourseItem.findById(item.id);

      // 如果課程項目存在，則更新課程項目
      if (courseItem) {
        Object.assign(courseItem, item);
        // 更新其他欄位
        courseItem.capacity = data.courseCapacity;
        courseItem.mainCourseName = data.courseName;
        courseItem.startTime = item.startTime;
        courseItem.endTime = item.endTime;
        courseItem.itemName = item.itemName;
        await courseItem.save();
      } else {
        // 如果課程項目不存在，則創建新的課程項目
        const newCourseItem = await CourseItem.create({
          courseId: course._id,
          // ...item,
          capacity: data.courseCapacity,
          mainCourseName: data.courseName,
          startTime: item.startTime,
          endTime: item.endTime,
          itemName: item.itemName,
        });
        course.courseItemId.push(newCourseItem._id); // 將新的課程項目的 _id 加入到 course.courseItemId
        await course.save(); // 立即保存課程
      }
    }

    await course.save(); // 在迴圈結束後再次保存課程

    handleSuccess(res, course, "編輯課程及時段成功");
  },

  // 取得單一課程資料 (Front)
  getCourse: async (req, res, next) => {
    const { courseId } = req.params;

    // 驗證 courseId 格式和是否存在
    const isValidCourseId = await tools.findModelByIdNext(
      Course,
      courseId,
      next
    );
    if (!isValidCourseId) {
      return;
    }

    // 查詢課程
    const course = await Course.findById(courseId)
      .populate({
        path: "teacherId",
        select: "name photo",
      })
      .populate({
        path: "vendorId",
        match: { status: 1 },
        select: "brandName intro",
      })
      .populate({
        path: "courseItemId",
        match: { status: 1 },
        select: "capacity startTime endTime itemName",
      })
      .select(
        `courseType courseTerm courseName coursePrice courseStatus courseCapacity 
         courseSummary courseLocation courseAddress courseRemark courseImage 
         courseContent courseNotice courseSuitableFor courseSkillsLearned 
         courseTotalHours createdAt updatedAt`
      )
      .lean();

    // 如果課程不存在，則返回錯誤
    if (!course) {
      return next(appError(404, "課程不存在 或 已下架"));
    }

    // 計算 賣家 評價分數：取得該賣家所有課程的評價，計算評價總數和平均值
    // 取得該賣家的所有 courseId
    const vendorCourses = await Course.find({
      vendorId: course.vendorId,
    }).select("courseId");

    // 取得所有課程的評價數值
    let allVendorCommentsRatings = []; // 賣家所有評價
    for (const course of vendorCourses) {
      const courseComments = await CourseComment.find({
        courseId: course._id,
      }).select("rating");
      allRatingsValue = courseComments.map((comment) => comment.rating);
      allVendorCommentsRatings.push(...allRatingsValue);
    }

    // 計算 賣家所有課程 評論總數 和 評論平均分數 (如賣家尚無評論則回傳 0)
    const vendorCommentsCounts = allVendorCommentsRatings.reduce((acc, cur) => acc + cur, 0);
    const vendorAvgRating = allVendorCommentsRatings.length === 0 ? 0 : vendorCommentsCounts / allVendorCommentsRatings.length;

    // 取得 此課程 的所有評論
    const courseComments = await CourseComment.find({
      courseId: courseId,
    }).select("rating");

    // 計算 此課程 評論總數 和 評論平均分數 (如課程尚無評論則回傳 0)
    const totalCourseComments = courseComments.reduce((acc, cur) => acc + cur.rating, 0);
    const courseAvgRating = courseComments.length === 0 ? 0 : totalCourseComments / courseComments.length;

    // 更新 course 物件
    course.vendorCommentsCount = allVendorCommentsRatings.length;     // 賣家評論總數
    course.vendorAvgRating = parseFloat(vendorAvgRating.toFixed(2));  // 賣家評論平均分數
    course.courseCommentsCount = courseComments.length;               // 課程評論總數
    course.courseAvgRating = parseFloat(courseAvgRating.toFixed(2));  // 課程評論平均分數

    handleSuccess(res, course, "取得單一課程資料成功");
  },

  // 取得單一課程全部評價 (Front)
  getCourseAllComments: async (req, res, next) => {
    const { courseId } = req.params;

    // 驗證 courseId 格式和是否存在
    const isValidCourseId = await tools.findModelByIdNext(
      Course,
      courseId,
      next
    );
    if (!isValidCourseId) {
      return;
    }

    const isCourseExist = await Course.find({ _id: courseId, courseStatus: 1 });
    if (!isCourseExist) {
      return next(appError(404, "課程不存在 或 已下架"));
    }

    // 查詢課程全部評價
    const comments = await CourseComment.find({ courseId: courseId })
      .populate({
        path: "memberId",
        select: "name",
      })
      .select("content images tags rating likes createAt");

    handleSuccess(res, comments, "取得單一課程全部評價成功");
  },

  // 取得單一評價 (Front)
  getComment: async (req, res, next) => {
    const memberId = req.user.id;
    const { commentId } = req.params;

    // 驗證 commentId 格式和是否存在
    const isValidCommentId = await tools.findModelByIdNext(
      CourseComment,
      commentId,
      next
    );
    if (!isValidCommentId) {
      return;
    }

    const isMeberComment = await CourseComment.findOne({
      _id: commentId,
      memberId: memberId,
    });
    if (!isMeberComment) {
      return next(appError(403, "無權限查看該評價"));
    }

    // 查詢評價
    const comment = await CourseComment.findById(commentId)
      .populate({
        path: "courseId",
        select: "courseName",
      })
      .select("content images tags rating createAt");

    // 如果評價不存在，則返回錯誤
    if (!comment) {
      return next(appError(404, "評價不存在"));
    }

    handleSuccess(res, comment, "取得單一評價成功");
  },

  // 新增課程評價 (Front)
  newComment: async (req, res, next) => {
    const memberId = req.user.id;
    let { courseId, orderId, content, images, tags, rating } = req.body;

    // 驗證必填欄位
    if (!orderId || !content || !rating || !tags) {
      return next(appError(400, "orderId, content, rating, tags 為必填欄位"));
    }

    // 驗證 courseId 格式和是否存在
    const isValidCourseId = await tools.findModelByIdNext(
      Course,
      courseId,
      next
    );
    if (!isValidCourseId) {
      return;
    }

    // 驗證 orderId 格式和是否存在
    const isValidOrderId = await tools.findModelByIdNext(Order, orderId, next);
    if (!isValidOrderId) {
      return;
    }

    const isCourseFinished = await Order.findOne({
      _id: orderId,
      paidStatus: 3,
    });
    if (!isCourseFinished) {
      return next(appError(400, "尚未完課，無法評價"));
    }

    // 驗證是否已評價過
    const isCommentExist = await CourseComment.findOne({
      memberId: memberId,
      courseId: courseId,
      orderId: orderId,
    });
    if (isCommentExist) {
      return next(appError(400, "已評價過該課程"));
    }

    if (content.length > 500) {
      return next(appError(400, "content 長度不得超過 500 字元"));
    }

    // 驗證 rating 格式
    if (!Number.isInteger(rating) && rating >= 1 && rating <= 5) {
      return next(appError(400, "rating 應介於 1 到 5 之正整數"));
    }

    // 驗證 tags 格式
    if (!Array.isArray(tags) || tags.length === 0) {
      return next(appError(400, "tags 應為不為空的陣列"));
    }

    // 新增評價
    const newComment = await CourseComment.create({
      memberId: memberId,
      courseId: courseId,
      orderId: orderId,
      content: content,
      images: images,
      tags: tags,
      rating: rating,
    });

    if (!newComment) {
      return next(appError(500, "新增課程評價失敗 #1"));
    }

    const newCommentToCourse = await Course.findByIdAndUpdate(courseId, {
      $push: { comments: newComment._id },
    });
    if (!newCommentToCourse) {
      return next(appError(500, "新增課程評價失敗 #2"));
    }

    const newCommentToOrder = await Order.findByIdAndUpdate(orderId, {
      commentId: newComment._id,
    });
    if (!newCommentToOrder) {
      return next(appError(500, "新增課程評價失敗 #3"));
    }

    handleSuccess(res, newComment, "新增課程評價成功");
  },

  // 課程評價按讚 (Front): 如果已按讚，則取消按讚；如果未按讚，則按讚
  likeComment: async (req, res, next) => {
    const memberId = req.user.id;
    const { commentId } = req.body;

    // 驗證 commentId 格式和是否存在
    const isValidCommentId = await tools.findModelByIdNext(
      CourseComment,
      commentId,
      next
    );
    if (!isValidCommentId) {
      return;
    }

    // 驗證 memberId 是否按讚過，如果按讚過，則取消按讚；如果未按讚，則按讚
    const isLike = await CourseComment.findOne({
      _id: commentId,
      likes: { $in: memberId },
    });

    if (isLike) {
      // 取消按讚
      const unLikeComment = await CourseComment.findByIdAndUpdate(
        commentId,
        { $pull: { likes: memberId } },
        { new: true }
      );
      if (!unLikeComment) {
        return next(appError(400, "取消按讚失敗"));
      }
      handleSuccess(res, null, "取消按讚成功");
    } else {
      // 按讚
      const likeComment = await CourseComment.findByIdAndUpdate(
        commentId,
        { $push: { likes: memberId } },
        { new: true }
      );
      if (!likeComment) {
        return next(appError(400, "按讚失敗"));
      }
      handleSuccess(res, null, "按讚成功");
    }
  },

  // 新增課程點擊紀錄 (Front)
  newClickLog: async (req, res, next) => {
    const { courseId, vendorId, memberId } = req.body;
    const ipAddress = req.ip;

    // 驗證 courseId 格式和是否存在
    const isValidCourseId = await tools.findModelByIdNext(Course, courseId, next);
    if (!isValidCourseId) {
      return;
    }

    // 驗證 memberId 格式和是否存在
    const isValidMemberId = await tools.findModelByIdNext(Member, memberId, next);
    if (!isValidMemberId) {
      return;
    }

    // 今日開始時間和結束時間
    const startTime = new Date();
    startTime.setHours(0, 0, 0, 0);
    const endTime = new Date();
    endTime.setHours(23, 59, 59, 999);

    // 新增點擊紀錄，如果已存在則會更新 updatedAt 
    const newClickLog = await CourseClickLog.findOneAndUpdate(
      {
        courseId: courseId,
        vendorId: vendorId,
        memberId: memberId,
        ipAddress: ipAddress,
        createdAt: { $gte: startTime, $lte: endTime }
      },
      {
        $setOnInsert: {
          courseId: courseId,
          memberId: memberId,
          vendorId: vendorId,
          ipAddress: ipAddress
        }
      },
      {
        new: true, 
        upsert: true, // 如果查詢條件不存在，則新增一筆新的點擊紀錄
        setDefaultsOnInsert: true 
      }
    );

    if(newClickLog.createdAt === newClickLog.updatedAt) {
      handleSuccess(res, newClickLog, "新增點擊紀錄成功");
    }
    else{
      handleSuccess(res, null, "點擊紀錄已存在，將更新 updatedAt");
    }
  }
};

module.exports = courseController;
