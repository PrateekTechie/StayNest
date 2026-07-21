const crypto = require("crypto");
const Razorpay = require("razorpay");

function getRazorpayClient() {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
        return null;
    }

    return new Razorpay({
        key_id: keyId,
        key_secret: keySecret,
    });
}

module.exports.createOrder = async function createOrder({ amount, currency = "INR", receipt }) {
    const instance = getRazorpayClient();

    if (!instance) {
        throw new Error("Razorpay is not configured.");
    }

    return instance.orders.create({
        amount: Math.round(amount * 100),
        currency,
        receipt,
        payment_capture: 1,
    });
};

module.exports.verifySignature = function verifySignature({ orderId, paymentId, signature }) {
    const generatedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || "")
        .update(`${orderId}|${paymentId}`)
        .digest("hex");

    return generatedSignature === signature;
};

module.exports.capturePayment = async function capturePayment(paymentId, amount) {
    const instance = getRazorpayClient();

    if (!instance) {
        throw new Error("Razorpay is not configured.");
    }

    return instance.payments.capture(paymentId, Math.round(amount * 100));
};

module.exports.createRefund = async function createRefund(paymentId, amount, reason = "requested_by_customer") {
    const instance = getRazorpayClient();

    if (!instance) {
        throw new Error("Razorpay is not configured.");
    }

    return instance.payments.refund(paymentId, {
        amount: Math.round(amount * 100),
        reason,
    });
};

module.exports.verifyWebhookSignature = function verifyWebhookSignature(body, signature, secret) {
    const expected = crypto
        .createHmac("sha256", secret)
        .update(body)
        .digest("hex");

    return expected === signature;
};
