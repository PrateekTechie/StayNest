const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const paymentLogSchema = new Schema({
    bookingId: {
        type: Schema.Types.ObjectId,
        ref: "Booking",
        required: true,
    },
    action: {
        type: String,
        required: true,
    },
    status: {
        type: String,
        required: true,
    },
    amount: {
        type: Number,
        default: 0,
    },
    provider: {
        type: String,
        default: "Razorpay",
    },
    details: {
        type: Object,
        default: {},
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.models.PaymentLog || mongoose.model("PaymentLog", paymentLogSchema);
