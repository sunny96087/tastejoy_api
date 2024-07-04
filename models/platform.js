const mongoose =  require('mongoose');

const platformSchema = new mongoose.Schema({
    platformNameCn:{
        type: String,
    },
    platformNameEn:{
        type: String,
        unique: true,   // 做為查詢唯一值
        required: [true, 'platformNameEn 為必填']
    },
    platformCompanyName:{
        type: String,
    },
    platformLogo:{
        type: String,
    },
    platformEmail:{
        type: String,
    },
    platformInfo:{
        type: String,
    },
    copyright:{
        type: String,
    },
})

const Platform = mongoose.model('Platform', platformSchema);
module.exports = Platform;