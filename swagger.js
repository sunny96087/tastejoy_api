const swaggerAutogen = require("swagger-autogen")();
const dotenv = require("dotenv");
dotenv.config({ path: "./config.env" });

const doc = {
  info: {
    version: "1.0.0",
    title: "tastejoy api",
    description: "食享 - 美食地圖專題 api",
  },
  // * 開發
  // host: "localhost:3666",
  // schemes: ["http", "https"],
  // * 部署
  host: "tastejoy-api.onrender.com",
  schemes: ["https"],

  basePath: "/",
  tags: [
    // by default: empty Array
    {
      name: "Feedback-front",
      description: "回饋 (前台)",
    },
    {
      name: "Auth-front",
      description: "登入/註冊 (前台)",
    },
    {
      name: "Category-front",
      description: "分類 (前台)",
    },
    {
      name: "Members-front",
      description: "會員 (前台)",
    },
    {
      name: "FoodRecord-front",
      description: "美食紀錄 (前台)",
    },
    {
      name: "Upload-front",
      description: "上傳圖片 (前台)",
    },
    
    {
      name: "HR",
      description: "--- 分隔線 - 以下是參考的 ---",
    },

    {
      name: "Vendors-front",
      description: "賣家 (前台)",
    },
    {
      name: "Vendors-back",
      description: "賣家 (後台)",
    },
    {
      name: "Vendors-manage",
      description: "賣家 (平台管理員)",
    },
    {
      name: "Teachers-front",
      description: "老師 (前台)",
    },
    {
      name: "Teachers-back",
      description: "老師 (後台)",
    },
    {
      name: "Teachers-manage",
      description: "老師 (平台管理員)",
    },
    {
      name: "Courses-front",
      description: "課程 (前台)",
    },
    {
      name: "Courses-back",
      description: "課程 (後台)",
    },
    {
      name: "Courses-manage",
      description: "課程 (平台管理員)",
    },
    {
      name: "Orders-front",
      description: "訂單 (前台)",
    },
    {
      name: "Orders-back",
      description: "訂單 (後台)",
    },
    {
      name: "Orders-manage",
      description: "訂單 (平台管理員)",
    },
    {
      name: "Collections-front",
      description: "收藏 (前台)",
    },
    {
      name: "Platforms-front",
      description: "平台資料",
    },
    {
      name: "Platforms-manage",
      description: "平台資料 (平台管理員)",
    },

    {
      name: "Upload-back",
      description: "上傳圖片 (後台)",
    },
    {
      name: "Upload-manage",
      description: "上傳圖片 (平台管理員)",
    },
    {
      name: "Index",
      description: "首頁",
    },
    {
      name: "Users",
      description: "使用者",
    },
    {
      name: "Posts",
      description: "文章",
    },
    {
      name: "Upload",
      description: "上傳圖片",
    },
    {
      name: "Email",
      description: "信箱驗證",
    },
  ],
};

const outputFile = "./swagger_output.json"; // 輸出的文件名稱
const endpointsFiles = ["./app.js"]; // 要指向的 API，通常使用 Express 直接指向到 app.js 就可以

swaggerAutogen(outputFile, endpointsFiles, doc); // swaggerAutogen 的方法

// Demo
// http://localhost:3666/v1
// https://tastejoy-api.onrender.com
