const mongoose = require("mongoose");

const collectionSchema = new mongoose.Schema(
    {
        memberId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        },
        courseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Course",
        },
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true }
    }
)

const Collection = mongoose.model("Collection", collectionSchema);
module.exports = Collection;