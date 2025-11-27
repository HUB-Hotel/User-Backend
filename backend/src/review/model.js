const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    lodgingId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Lodging",
        required: true
    },
    bookingId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Booking",
        required: true
    },

    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    }, // 1~5점
    content: {
        type: String,
        required: true
    },
},
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Review", reviewSchema);