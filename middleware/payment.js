const rateLimit = require("express-rate-limit");

module.exports.paymentRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 50,
    standardHeaders: true,
    legacyHeaders: false,
});

module.exports.validatePaymentInput = (req, res, next) => {
    const { checkIn, checkOut, guestsCount } = req.body;
    if (!checkIn || !checkOut || !guestsCount) {
        return res.status(400).json({ success: false, message: "Invalid payment input" });
    }
    next();
};
