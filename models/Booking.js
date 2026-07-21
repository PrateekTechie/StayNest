const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const bookingSchema = new Schema({
    listing: {
        type: Schema.Types.ObjectId,
        ref: "Listing",
        required: true,
    },
    guest: {
        type: Schema.Types.ObjectId,
        ref: "user",
        required: true,
    },
    host: {
        type: Schema.Types.ObjectId,
        ref: "user",
        required: true,
    },
    checkIn: {
        type: Date,
        required: true,
    },
    checkOut: {
        type: Date,
        required: true,
    },
    totalNights: {
        type: Number,
        required: true,
        min: 1,
    },
    guestsCount: {
        type: Number,
        required: true,
        min: 1,
    },
    pricePerNight: {
        type: Number,
        required: true,
        min: 0,
    },
    cleaningFee: {
        type: Number,
        default: 0,
    },
    serviceFee: {
        type: Number,
        default: 0,
    },
    taxes: {
        type: Number,
        default: 0,
    },
    totalAmount: {
        type: Number,
        required: true,
        min: 0,
    },
    bookingStatus: {
        type: String,
        enum: ["Pending", "Confirmed", "Completed", "Cancelled", "Refunded"],
        default: "Pending",
    },
    paymentStatus: {
        type: String,
        enum: ["Pending", "Paid", "Failed", "Refunded", "Expired"],
        default: "Pending",
    },
    paymentId: {
        type: String,
        default: "",
    },
    orderId: {
        type: String,
        default: "",
    },
    paymentMethod: {
        type: String,
        default: "Razorpay",
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
});

bookingSchema.pre("save", function () {
    this.updatedAt = new Date();
});

module.exports = mongoose.models.Booking || mongoose.model("Booking", bookingSchema);
