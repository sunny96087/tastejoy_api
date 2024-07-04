// routes / upload.js

const express = require("express");
const router = express.Router();
const handleErrorAsync = require("../utils/handleErrorAsync");
const appError = require("../utils/appError");
const uploadController = require("../controllers/uploadController");
const { isAuth } = require("../utils/auth");
const { isVendorAuth } = require("../utils/vendorAuth");

const multer = require("multer");

// 捕捉圖片上傳錯誤 (單張)
async function handleFileUpload(req, res, next) {
  const upload = multer({
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB
    },
    fileFilter: function (req, file, cb) {
      // 允許的圖片類型
      const allowedMimes = [
        "image/jpeg",
        "image/pjpeg",
        "image/png",
        "image/gif",
        "image/jpg",
        "image/webp",
      ];

      if (allowedMimes.includes(file.mimetype)) {
        // 接受文件
        cb(null, true);
      } else {
        // 拒絕文件
        cb(
          new next(appError("400", "只允許上傳 JPEG、PNG 或 GIF 格式的圖片")),
          false
        );
      }
    },
  }).single("file");

  upload(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      // 文件上傳錯誤
      if (err.code === "LIMIT_UNEXPECTED_FILE") {
        // 如果上傳了超過一個文件，使用 appError 處理
        return next(appError("400", "請上傳單個文件"));
      } else if (err.code === "LIMIT_FILE_SIZE") {
        // 如果文件大小超過限制，使用 appError 處理
        return next(appError("400", "文件大小超過限制"));
      }
      return next(err);
    } else if (err) {
      // 其他錯誤
      return next(err);
    }
    // 文件上傳成功，繼續處理
    next();
  });
}

// 捕捉圖片上傳錯誤 (多張)
async function handleFilesUpload(req, res, next) {
  const upload = multer({
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB
    },
    fileFilter: function (req, file, cb) {
      // 允許的圖片類型
      const allowedMimes = [
        "image/jpeg",
        "image/pjpeg",
        "image/png",
        "image/gif",
        "image/jpg",
        "image/webp",
      ];

      if (allowedMimes.includes(file.mimetype)) {
        // 接受文件
        cb(null, true);
      } else {
        // 拒絕文件
        cb(
          new next(appError("400", "只允許上傳 JPEG、PNG 或 GIF 格式的圖片")),
          false
        );
      }
    },
  }).array("file", 5); // 改成接受最多 5 個文件

  upload(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      // 文件上傳錯誤
      if (err.code === "LIMIT_UNEXPECTED_FILE") {
        // 如果上傳了超過一個文件，使用 appError 處理
        return next(appError("400", "請上傳單個文件"));
      } else if (err.code === "LIMIT_FILE_SIZE") {
        // 如果文件大小超過限制，使用 appError 處理
        return next(appError("400", "文件大小超過限制"));
      } else if (err.code === "LIMIT_FILE_COUNT") {
        // 如果文件數量超過限制，使用 appError 處理
        return next(appError("400", "文件數量超過限制"));
      }
      return next(err);
    } else if (err) {
      // 其他錯誤
      return next(err);
    }
    // 文件上傳成功，繼續處理
    next();
  });
}

// ? 上傳單張圖片 (back)
router.post(
  "/singleImage/admin",
  handleFileUpload,
  handleErrorAsync(uploadController.uploadVendorImage)
  /*  #swagger.tags = ['Upload-back']
      #swagger.summary = '上傳單張圖片 (back)'
      #swagger.description = '上傳單張圖片 (back)'
      #swagger.parameters['upload'] = {
        in: 'formData',
        required: true,
        type: 'file',
        name: 'file',
        description: '圖片檔案',
        schema: {
            type: 'file',
            format: 'binary',
            required: true
        }
      }
  */
);

// ? 上傳多張圖片 (不超過 5 張) (back)
router.post(
  "/multipleImage/admin",
  handleFilesUpload,
  handleErrorAsync(uploadController.uploadVendorImages)
  /*  #swagger.tags = ['Upload-back']
      #swagger.summary = '上傳多張圖片 (不超過 5 張) (back)'
      #swagger.description = '上傳多張圖片 (不超過 5 張) (back)'
      #swagger.parameters['upload'] = {
        in: 'formData',
        required: true,
        type: 'file',
        name: 'file',
        description: '圖片檔案',
        schema: {
            type: 'file',
            format: 'binary',
            required: true
        }
      }
  */
);

// 前台圖片上傳-單張 (front)
router.post(
  "/singleImage/front",
  isAuth,
  handleFileUpload,
  handleErrorAsync(uploadController.uploadMemberImage)
  /*  #swagger.tags = ['Upload-front']
      #swagger.summary = '上傳單張圖片 (front)'
      #swagger.description = '上傳單張圖片 (front)'
      #swagger.parameters['upload'] = {
        in: 'formData',
        required: true,
        type: 'file',
        name: 'file',
        description: '圖片檔案',
        schema: {
            type: 'file',
            format: 'binary',
            required: true
        }
      }
  */
);

// ! 分隔線

// 上傳圖片
router.post(
  "/image",
  isAuth,
  handleFileUpload,
  handleErrorAsync(uploadController.uploadImage)
  /*  #swagger.tags = ['Upload']
      #swagger.description = '上傳圖片'
      #swagger.description = '上傳圖片'

      #swagger.parameters['body'] = {
        in: 'body',
        required: true,
        schema: {
            file: {
                type: 'file',
                format: 'binary',
                description: '圖片檔案',
                required: true
            }
        }
      }
  */
);

// 上傳圖片 -> 要登入才能用的版本
router.post(
  "/userImage",
  isAuth,
  handleFileUpload,
  handleErrorAsync(uploadController.uploadUserImage)
  /*  #swagger.tags = ['Upload']
      #swagger.summary = '上傳圖片 -> 要登入才能用的版本'
      #swagger.description = '上傳圖片 -> 要登入才能用的版本'

      #swagger.parameters['body'] = {
        in: 'body',
        required: true,
        schema: {
            file: {
                type: 'file',
                format: 'binary',
                description: '圖片檔案',
                required: true
            }
        }
      }
  */
);

// 刪除圖片
router.delete(
  "/image",
  handleErrorAsync(uploadController.deleteImage)
  /*  #swagger.tags = ['Upload']
      #swagger.summary = '刪除圖片'
      #swagger.description = '刪除圖片'

      #swagger.parameters['upload'] = {
        in: 'query',
        required: true,
        name: 'fileName',
        schema: {
                type: 'string',
                description: '圖片檔案名稱',
                required: true,
        }
      }
  */
);

// 獲取所有圖片列表
router.get(
  "/image",
  handleErrorAsync(uploadController.getImages)
  /*  #swagger.tags = ['Upload']
      #swagger.summary = '獲取所有圖片列表'
      #swagger.description = '獲取所有圖片列表'
  */
);

module.exports = router;
