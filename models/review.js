const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const reviewSchema = new Schema ({
    comment : {
        type: String,
        required: true
    },
    rating : {
        type : Number,
        required : true,
        min :[1, "Rating must be at least 1"],
        max : [5, "Rating must be at most 5"],
    },
    createdAt : {
        type : Date,
        default : Date.now()
    },
    author : {
        type : Schema.Types.ObjectId,
        ref: "user"
    },
    trustScore: {
        type: Number,
        default: 100,
    },
    trustLabel: {
        type: String,
        default: "Genuine Review",
    },
    trustReasons: [
        {
            type: String,
        }
    ]
});

const Review =
    mongoose.models.Review ||
    mongoose.model("Review", reviewSchema);

module.exports = Review;