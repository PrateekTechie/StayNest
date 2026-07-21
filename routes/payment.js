const express = require("express");
const router = express.Router();
const WrapAsync = require("../utils/wrapasync.js");
const paymentController = require("../controllers/payment.js");
const { isloggedin } = require("../middleware.js");
const { paymentRateLimiter, validatePaymentInput } = require("../middleware/payment.js");

router.post("/create-booking", isloggedin, paymentRateLimiter, validatePaymentInput, WrapAsync(paymentController.createBooking));
router.post("/verify-payment", isloggedin, paymentRateLimiter, WrapAsync(paymentController.verifyPayment));
router.post("/webhook", paymentRateLimiter, WrapAsync(paymentController.handleWebhook));
router.post("/cancel/:id", isloggedin, paymentRateLimiter, WrapAsync(paymentController.cancelBooking));
router.post("/refund/:id", isloggedin, paymentRateLimiter, WrapAsync(paymentController.refundPayment));
router.post("/approve/:id", isloggedin, paymentRateLimiter, WrapAsync(paymentController.approveBooking));
router.post("/reject/:id", isloggedin, paymentRateLimiter, WrapAsync(paymentController.rejectBooking));
router.get("/history", isloggedin, WrapAsync(paymentController.bookingHistory));
router.get("/invoice/:id", isloggedin, WrapAsync(paymentController.downloadInvoice));
router.get("/host-dashboard", isloggedin, WrapAsync(paymentController.hostDashboard));
router.get("/admin-dashboard", isloggedin, WrapAsync(paymentController.adminDashboard));

module.exports = router;
