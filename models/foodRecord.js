const mongoose = require("mongoose");

const foodRecordSchema = new mongoose.Schema(
  {
    // 會員 ID
    memberId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Member",
      required: true, // 必填
    },
    // 分類 ID
    categoryId: [
      {
        id: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Category",
        },
        name: String, // 存儲關聯文檔的名稱
      },
    ],
    // 自訂分類 ID
    customCategoryId: [
      {
        id: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "MemberCategory",
        },
        name: String, // 存儲關聯文檔的名稱
      },
    ],
    // 餐廳名稱
    store: {
      type: String,
      required: true, // 必填
    },
    // 餐廳電話
    phone: {
      type: String,
    },
    // 食物名稱
    foodName: {
      type: String,
      required: true, // 必填
    },
    // 說明
    description: {
      type: String,
    },
    // 圖片
    image: {
      type: String,
    },
    // 日期
    date: {
      type: Date,
      required: true, // 必填
    },
    // 評分
    rating: {
      type: Number,
      required: true, // 必填
      min: 1,
      max: 5,
    },
    // 感想
    thoughts: {
      type: String,
    },
    // 備註
    notes: {
      type: String,
    },
    // 營業時間
    openingHours: {
      type: String,
    },
    // 店家備註
    storeNotes: {
      type: String,
    },
    // 縣市
    city: {
      type: String,
      required: true, // 必填
    },
    // 區域
    district: {
      type: String,
      required: true, // 必填
    },
    // 地址
    address: {
      type: String,
      required: true, // 必填
    },
    // 經度
    longitude: {
      type: String,
      required: true, // 必填
    },
    // 緯度
    latitude: {
      type: String,
      required: true, // 必填
    },
    // 是否公開
    isPublic: {
      type: Number,
      required: true, // 必填
      default: 0, // 預設為私密, 0:私密 1:公開
    },
    // 狀態
    status: {
      type: Number,
      default: 1, // 預設值為啟用狀態, 0:停用 1:啟用
    },
  },
  {
    timestamps: true,
  }
);

const FoodRecord = mongoose.model("FoodRecord", foodRecordSchema);

module.exports = FoodRecord;
