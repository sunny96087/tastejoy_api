const mongoose = require("mongoose");

// todo 定義課程模型
const courseSchema = new mongoose.Schema(
  {
    // * 關聯廠商
    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vendor",
    },
    // * 關聯教師
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Teacher",
    },
    // * 關聯課程時間
    courseItemId: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "CourseItem",
      },
    ],
    // * 關聯評論
    comments: [{ type: mongoose.Schema.Types.ObjectId, ref: "CourseComment" }],
    // 課程類型
    courseType: {
      type: [String],
      enum: ["工藝手作", "烹飪烘焙", "藝術人文", "生活品味"],
      message: "課程類型只能是：工藝手作、烹飪烘焙、藝術人文、生活品味",
    },
    // 課程時長類型
    courseTerm: {
      type: Number,
      enum: [0, 1], // 0: 單堂體驗 1:培訓課程
    },
    // 課程名稱
    courseName: String,
    // 課程價格
    coursePrice: Number,
    // 課程狀態
    courseStatus: {
      type: Number,
      enum: [0, 1, 2], // 0: 下架, 1: 上架, 2: 刪除
      default: 1,
    },
    // 課程名額
    courseCapacity: Number,
    // 課程摘要
    courseSummary: String,
    // 課程所在地 (指縣市供作篩選)
    courseLocation: String,
    // 課程地址 (詳細活動地址)
    courseAddress: String,
    // 備註 (報名的注意事項)
    courseRemark: String,
    // 課程圖片
    courseImage: [String],
    // 課程內容 (編輯器) // 又改成要四個欄位了..
    courseContent: String,
    // 注意事項
    courseNotice: String,
    // 適合對象
    courseSuitableFor: String,
    // 你可以學到
    courseSkillsLearned: String,
    // 課程總時數 (時長)
    courseTotalHours: Number
  },
  {
    versionKey: false,
    timestamps: true,
    virtuals: true, // 虛擬屬性
  }
);

// 創建課程模型
const Course = mongoose.model("Course", courseSchema);

// todo 定義課程項目模型
const courseItemSchema = new mongoose.Schema(
  {
    // 關聯課程
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
    },
    // 人數
    capacity: Number,
    // 主課程名稱
    mainCourseName: String,
    // 上課時間
    startTime: Date,
    // 結束時間
    endTime: Date,
    // 項目名稱
    itemName: String,
    // 項目狀態
    status: {
      type: Number,
      enum: [0, 1, 2], // 0: 下架, 1: 上架, 2: 刪除
      default: 1,
    },
  },
  {
    versionKey: false,
    timestamps: true,
  }
);

// 創建課程項目模型
const CourseItem = mongoose.model("CourseItem", courseItemSchema);

// todo 定義課程評論模型
/*
 */
const courseCommentSchema = new mongoose.Schema(
  {
    memberId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Member",
      required: [true, "memberId 為必填"],
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: [true, "courseId 為必填"],
    },
    orderId:{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order"
    },
    content: {
      type: String,
      required: [true, "content 為必填"],
    },
    images: {
      type: [String],
      validate: {
        validator: function (v) {
          return v.length <= 5;
        },
        message: (props) =>
          `最多只可存 5 張圖片，現有 ${props.value.length} 張`,
      },
    },
    tags: {
      type: [
        {
          type: String,
          enum: ["師生互動", "教學環境", "專業度", "其他"],
        },
      ],
      validate: {
        validator: function (v) {
          return v.every((tag) =>
            ["師生互動", "教學環境", "專業度", "其他"].includes(tag)
          );
        },
        message: (props) => `${props.value} 非有效 tags 值`,
      },
    },
    rating: {
      type: Number,
      default: 1,
    },
    // 評論讚數會員Id
    likes: [
      { type: mongoose.Schema.Types.ObjectId, ref: "Member" }
    ]
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

const CourseComment = mongoose.model("CourseComment", courseCommentSchema);

// 課程點擊紀錄
const courseClickLogSchema = new mongoose.Schema({
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Course",
    required: [true, "courseId 為必填"],
  },
  vendorId:{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Vendor",
    required: [true, "vendorId 為必填"],
  },
  memberId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Member",
    required: [true, "memberId 為必填"],
  },
  ipAddress:{
    type: String,
    required: [true, "ipAddress 為必填"],
  }
},
{
  versionKey: false,
  timestamps: true
});
const CourseClickLog = mongoose.model("CourseClickLog", courseClickLogSchema);


// ? 查詢時自動填充相關的欄位

courseSchema.pre("find", function () {
  this.populate("vendorId")
    .populate("teacherId")
    .populate("courseItemId")
    .populate("comments");
});

courseSchema.pre("findOne", function () {
  this.populate("vendorId")
    .populate("teacherId")
    .populate("courseItemId")
    .populate("comments");
});

courseItemSchema.pre("find", function () {
  this.populate("courseId");
});

courseItemSchema.pre("findOne", function () {
  this.populate("courseId");
});

courseCommentSchema.pre("find", function () {
  this.populate("memberId").populate("courseId");
});

courseCommentSchema.pre("findOne", function () {
  this.populate("memberId").populate("courseId");
});

// 導出

module.exports = { Course, CourseItem, CourseComment, CourseClickLog };