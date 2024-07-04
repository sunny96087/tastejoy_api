const mongoose = require('mongoose');
const orderSchema = new mongoose.Schema(
    {
        memberId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Member',
            required: [true, "memberId 為必填"]
        },
        vendorId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Vendor',
            required: [true, "vendorId 為必填"]
        },
        courseId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Course',
            required: [true, "courseId 為必填"]
        },
        courseItemId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'CourseItem',
            required: [true, "courseItemId 為必填"]
        },
        commentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'CourseComment',
        },
        // 顯示廠商名稱，避免廠商名稱更動後，訂單顯示不同名稱
        brandName: {
            type: String,
            required: [true, "vendorName 為必填"]
        },
        // 顯示課程名稱
        courseName: {
            type: String,
            required: [true, "courseName 為必填"]
        },
        // 顯示品項名稱
        courseItemName: {
            type: String,
            required: [true, "itemName 為必填"]
        },
        // 訂購人數
        count: {
            type: Number,
            required: [true, "count 為必填"]
        },
        // 單價
        price: {
            type: Number,
            required: [true, "price 為必填"]
        },
        // 訂單總價
        totalPrice: {
            type: Number,
            required: [true, "totalPrice 為必填"]
        },
        // 上課日期，格式須為 Datetime 格式，用來確認是否已完課
        startTime:{
            type: Date,
            required: [true, "courseEndTime 為必填"]
        },
        endTime: {
            type: Date,
            required: [true, "courseStartTime 為必填"]
        },
        // 教室地址
        courseLocation: {
            type: String,
        },
        orderPoint:{
            type: Number,
            default: 0,
        },
        paymentType: {
            type: Number,
            enum: [1, 2], // 1: atm, 2: 金流
            default: 1,
        },
        paidStatus: {
            type: Number,
            enum: [0, 1, 2, 3, 4, 5, 6, 7], // 0:待付款, 1: 已付款, 2: 已確認收到款, 3:已完課, 4:訂單取消(已過期), 5:訂單取消(不需退款), 6:訂單取消(待退款), 7:訂單取消(已退款)
            default: 0,
        },
        // 使用者送出後 5 碼後的時間 (paidStatus 1: 已付款)
        paidTime: {
            type: Date,
        },
        // 賣家確認收款時間 (paidStatus 2: 已確認收到款)
        confirmTime: {
            type: Date,
        },
        // 取消訂單時間 (paidStatus 4:訂單取消(已過期), 5:訂單取消(不需退款), 6:訂單取消(待退款))
        cancelTime: {
            type: Date,
        },
        // 買家取消訂單原因 
        cancelReason: {
            type: String,
        },
        // 賣家退款時間 (paidStatus 7:訂單取消(已退款))
        refundTime: {
            type: Date,
        },
        // 銀行帳號後五碼
        lastFiveDigits: {
            type: String,
        },
        // 備註
        note: {
            type: String,
        }
    },
    {
        timestamps: true,
        virtuals: true
    }
)

const Order = mongoose.model('Order', orderSchema);

// ? 查詢時自動填充相關的欄位
orderSchema.pre('find', function () {
    this.populate('memberId');
    this.populate('vendorId');
    this.populate('courseId');
    this.populate('courseItemId');
    this.populate('commentId');
})

module.exports = Order;  