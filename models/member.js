const mongoose = require('mongoose');
const memberSchema = new mongoose.Schema(
    {
        googleId: {
            type: String,
            unique: true,
        },
        googleAccount:{
            type: String,
            unique: true,
        },
        account: {
            type: String,
            unique: true,
        },
        password: {
            type: String,
            select: false,
        },
        name: {
            type: String,
        },
        nickname: {
            type: String,
        },
        phone: {
            type: String,
        },
        gender: {
            type: String,
            enum: ['male', 'female', 'other'],
            default: 'other',
        },
        birthday: {
            type: Date,
        },
        photo: {
            type: String,
        },
        status: {
            type: Number,
            default: 1,     // 0: : 停權 1: 啟用
        },
        point: {
            type: Number,
            default: 0,
        },
        interests: {
            type: [String],
            validate: {
                validator: function (v) {
                    return v.every(interest => ['工藝手作', '烹飪烘烤', '藝術人文', '生活品味'].includes(interest));
                },
                message: props => `${props.value} 非有效 interests 值`
            }
        },
        isAdmin: {
            type: Boolean,
            default: false,
        },
        loginAt: {
            type: Date,
        },
        resetPasswordToken: {
            type: String,
            select: false,
        },
        resetPasswordExpires: {
            type: Date,
            select: false,
        },
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true }
    }
)

const Member = mongoose.model('Member', memberSchema)
module.exports = Member;