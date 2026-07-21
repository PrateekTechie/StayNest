const Booking = require("../models/Booking");
const PaymentLog = require("../models/PaymentLog");
const Listing = require("../models/listing");
const User = require("../models/user");
const paymentService = require("../services/paymentService");
const emailService = require("../services/emailService");
const invoiceService = require("../services/invoiceService");

function calculateFees(pricePerNight, nights, guestsCount) {
    const baseAmount = pricePerNight * nights;
    const cleaningFee = Math.round(baseAmount * 0.08);
    const serviceFee = Math.round(baseAmount * 0.1);
    const taxes = Math.round((baseAmount + cleaningFee + serviceFee) * 0.18);
    const totalAmount = baseAmount + cleaningFee + serviceFee + taxes;

    return {
        cleaningFee,
        serviceFee,
        taxes,
        totalAmount,
        baseAmount,
        guestsCount,
    };
}

module.exports.createBooking = async function createBooking(req, res) {
    try {
        const listing = await Listing.findById(req.body.listingId).populate("owner");
        if (!listing) {
            return res.status(404).json({ success: false, message: "Listing not found" });
        }

        const { checkIn, checkOut, guestsCount } = req.body;
        if (!checkIn || !checkOut || !guestsCount) {
            return res.status(400).json({ success: false, message: "Please provide valid booking details" });
        }

        const start = new Date(checkIn);
        const end = new Date(checkOut);
        if (start >= end || start < new Date()) {
            return res.status(400).json({ success: false, message: "Invalid booking dates" });
        }

        const overlappingBooking = await Booking.findOne({
            listing: listing._id,
            bookingStatus: { $in: ["Pending", "Confirmed", "Completed"] },
            $or: [
                { checkIn: { $lt: end }, checkOut: { $gt: start } },
            ],
        });

        if (overlappingBooking) {
            return res.status(409).json({ success: false, message: "These dates are already booked" });
        }

        const nights = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
        const fees = calculateFees(listing.price, nights, Number(guestsCount));

        const booking = new Booking({
            listing: listing._id,
            guest: req.user._id,
            host: listing.owner._id,
            checkIn: start,
            checkOut: end,
            totalNights: nights,
            guestsCount: Number(guestsCount),
            pricePerNight: listing.price,
            cleaningFee: fees.cleaningFee,
            serviceFee: fees.serviceFee,
            taxes: fees.taxes,
            totalAmount: fees.totalAmount,
            bookingStatus: "Pending",
            paymentStatus: "Pending",
        });

        await booking.save();

        const order = await paymentService.createOrder({
            amount: booking.totalAmount,
            receipt: booking._id.toString(),
        });

        booking.orderId = order.id;
        await booking.save();

        await PaymentLog.create({
            bookingId: booking._id,
            action: "order_created",
            status: "Pending",
            amount: booking.totalAmount,
            details: { orderId: order.id },
        });

        if (req.headers.accept && req.headers.accept.includes("application/json")) {
            return res.json({ success: true, order, booking });
        }

        return res.render("bookings/checkout.ejs", {
            booking,
            order,
            listing,
            guest: req.user,
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: "Booking failed" });
    }
};

module.exports.verifyPayment = async function verifyPayment(req, res) {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, bookingId } = req.body;
        const booking = await Booking.findById(bookingId);
        if (!booking) {
            return res.status(404).json({ success: false, message: "Booking not found" });
        }

        const isValid = paymentService.verifySignature({
            orderId: razorpay_order_id,
            paymentId: razorpay_payment_id,
            signature: razorpay_signature,
        });

        if (!isValid) {
            booking.paymentStatus = "Failed";
            booking.bookingStatus = "Cancelled";
            await booking.save();
            return res.status(400).json({ success: false, message: "Signature verification failed" });
        }

        booking.paymentStatus = "Paid";
        booking.paymentId = razorpay_payment_id;
        booking.orderId = razorpay_order_id;
        booking.bookingStatus = "Confirmed";
        await booking.save();

        const listing = await Listing.findById(booking.listing);
        const guest = await User.findById(booking.guest);
        const host = await User.findById(booking.host);

        await PaymentLog.create({
            bookingId: booking._id,
            action: "payment_verified",
            status: "Paid",
            amount: booking.totalAmount,
            details: { paymentId: razorpay_payment_id },
        });

        await emailService.sendBookingConfirmation(booking, guest, listing);
        await emailService.sendPaymentReceipt(booking, guest, listing);
        await emailService.sendInvoiceEmail(booking, guest, listing);

        const invoiceText = invoiceService.buildInvoiceText(booking, guest, host, listing);
        console.log(invoiceText);

        return res.render("bookings/payment-success.ejs", {
            booking,
            listing,
            guest,
            host,
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: "Payment verification failed" });
    }
};

module.exports.handleWebhook = async function handleWebhook(req, res) {
    try {
        const signature = req.headers["x-razorpay-signature"];
        const body = req.body;
        const isValid = paymentService.verifyWebhookSignature(JSON.stringify(body), signature, process.env.RAZORPAY_WEBHOOK_SECRET || "");

        if (!isValid) {
            return res.status(400).send("Invalid signature");
        }

        const event = req.body.event;
        if (event === "payment.authorized") {
            const booking = await Booking.findOne({ paymentId: req.body.payload.payment.entity.id });
            if (booking) {
                booking.paymentStatus = "Paid";
                booking.bookingStatus = "Confirmed";
                await booking.save();
            }
        }

        return res.json({ success: true });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: "Webhook failed" });
    }
};

module.exports.cancelBooking = async function cancelBooking(req, res) {
    try {
        const booking = await Booking.findById(req.params.id);
        if (!booking) {
            return res.status(404).json({ success: false, message: "Booking not found" });
        }

        booking.bookingStatus = "Cancelled";
        booking.paymentStatus = booking.paymentStatus === "Paid" ? "Refunded" : "Failed";
        await booking.save();

        const listing = await Listing.findById(booking.listing);
        const guest = await User.findById(booking.guest);
        await emailService.sendCancellationEmail(booking, guest, listing);

        return res.render("bookings/payment-cancel.ejs", {
            booking,
            listing,
            guest,
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: "Cancellation failed" });
    }
};

module.exports.refundPayment = async function refundPayment(req, res) {
    try {
        const booking = await Booking.findById(req.params.id);
        if (!booking) {
            return res.status(404).json({ success: false, message: "Booking not found" });
        }

        const refund = await paymentService.createRefund(booking.paymentId, booking.totalAmount);
        booking.paymentStatus = "Refunded";
        booking.bookingStatus = "Refunded";
        await booking.save();

        const listing = await Listing.findById(booking.listing);
        const guest = await User.findById(booking.guest);
        await emailService.sendRefundEmail(booking, guest, listing);

        return res.json({ success: true, refund, booking });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: "Refund failed" });
    }
};

module.exports.bookingHistory = async function bookingHistory(req, res) {
    try {
        const bookings = await Booking.find({ guest: req.user._id }).populate("listing").sort({ createdAt: -1 });
        res.render("bookings/history.ejs", { bookings });
    } catch (err) {
        console.error(err);
        res.status(500).send("Unable to load booking history");
    }
};

module.exports.downloadInvoice = async function downloadInvoice(req, res) {
    try {
        const booking = await Booking.findById(req.params.id).populate("listing");
        if (!booking) {
            return res.status(404).send("Booking not found");
        }

        const guest = await User.findById(booking.guest);
        const host = await User.findById(booking.host);
        const invoiceText = invoiceService.buildInvoiceText(booking, guest, host, booking.listing);

        res.setHeader("Content-Type", "text/plain; charset=utf-8");
        res.setHeader("Content-Disposition", `attachment; filename=invoice-${booking._id}.txt`);
        res.send(invoiceText);
    } catch (err) {
        console.error(err);
        res.status(500).send("Unable to generate invoice");
    }
};

module.exports.hostDashboard = async function hostDashboard(req, res) {
    try {
        const bookings = await Booking.find({ host: req.user._id }).populate("listing").sort({ createdAt: -1 });
        res.render("bookings/host-dashboard.ejs", { bookings });
    } catch (err) {
        console.error(err);
        res.status(500).send("Unable to load host dashboard");
    }
};

module.exports.approveBooking = async function approveBooking(req, res) {
    try {
        const booking = await Booking.findById(req.params.id);
        if (!booking) {
            return res.status(404).json({ success: false, message: "Booking not found" });
        }

        booking.bookingStatus = "Confirmed";
        booking.paymentStatus = booking.paymentStatus === "Pending" ? "Pending" : booking.paymentStatus;
        await booking.save();

        return res.json({ success: true, message: "Booking approved", booking });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: "Unable to approve booking" });
    }
};

module.exports.rejectBooking = async function rejectBooking(req, res) {
    try {
        const booking = await Booking.findById(req.params.id);
        if (!booking) {
            return res.status(404).json({ success: false, message: "Booking not found" });
        }

        booking.bookingStatus = "Cancelled";
        booking.paymentStatus = booking.paymentStatus === "Paid" ? "Refunded" : "Failed";
        await booking.save();

        return res.json({ success: true, message: "Booking rejected", booking });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: "Unable to reject booking" });
    }
};

module.exports.adminDashboard = async function adminDashboard(req, res) {
    try {
        const bookings = await Booking.find().populate("listing").sort({ createdAt: -1 });
        res.render("bookings/admin-dashboard.ejs", { bookings });
    } catch (err) {
        console.error(err);
        res.status(500).send("Unable to load admin dashboard");
    }
};
