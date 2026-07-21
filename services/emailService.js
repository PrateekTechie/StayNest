const nodemailer = require("nodemailer");

function getTransporter() {
    const user = process.env.EMAIL_USER;
    const pass = process.env.EMAIL_PASS;

    if (!user || !pass) {
        return null;
    }

    return nodemailer.createTransport({
        service: "gmail",
        auth: {
            user,
            pass,
        },
    });
}

async function sendMail({ to, subject, html }) {
    const transporter = getTransporter();

    if (!transporter) {
        console.log("Email not configured. Skipping email.");
        return;
    }

    return transporter.sendMail({
        from: process.env.EMAIL_USER,
        to,
        subject,
        html,
    });
}

module.exports.sendBookingConfirmation = async function sendBookingConfirmation(booking, guest, listing) {
    const subject = `StayNest Booking Confirmed - ${listing.title}`;
    const html = `
        <h3>Booking confirmed</h3>
        <p>Hello ${guest.username || guest.email},</p>
        <p>Your stay at <strong>${listing.title}</strong> is confirmed.</p>
        <p>Check-in: ${booking.checkIn.toDateString()}</p>
        <p>Check-out: ${booking.checkOut.toDateString()}</p>
        <p>Total: ₹${booking.totalAmount.toLocaleString("en-IN")}</p>
    `;

    return sendMail({ to: guest.email, subject, html });
};

module.exports.sendPaymentReceipt = async function sendPaymentReceipt(booking, guest, listing) {
    const subject = `StayNest Payment Receipt - ${listing.title}`;
    const html = `
        <h3>Payment received</h3>
        <p>Hello ${guest.username || guest.email},</p>
        <p>We received your payment for <strong>${listing.title}</strong>.</p>
        <p>Payment ID: ${booking.paymentId || "Pending"}</p>
        <p>Total paid: ₹${booking.totalAmount.toLocaleString("en-IN")}</p>
    `;

    return sendMail({ to: guest.email, subject, html });
};

module.exports.sendInvoiceEmail = async function sendInvoiceEmail(booking, guest, listing) {
    const subject = `StayNest Invoice - ${booking._id}`;
    const html = `
        <h3>Invoice ready</h3>
        <p>Hello ${guest.username || guest.email},</p>
        <p>Your invoice for <strong>${listing.title}</strong> is ready.</p>
        <p>Booking ID: ${booking._id}</p>
    `;

    return sendMail({ to: guest.email, subject, html });
};

module.exports.sendCancellationEmail = async function sendCancellationEmail(booking, guest, listing) {
    const subject = `StayNest Booking Cancelled - ${listing.title}`;
    const html = `
        <h3>Booking cancelled</h3>
        <p>Hello ${guest.username || guest.email},</p>
        <p>Your booking for <strong>${listing.title}</strong> has been cancelled.</p>
    `;

    return sendMail({ to: guest.email, subject, html });
};

module.exports.sendRefundEmail = async function sendRefundEmail(booking, guest, listing) {
    const subject = `StayNest Refund Processed - ${listing.title}`;
    const html = `
        <h3>Refund processed</h3>
        <p>Hello ${guest.username || guest.email},</p>
        <p>Your refund for <strong>${listing.title}</strong> has been processed.</p>
    `;

    return sendMail({ to: guest.email, subject, html });
};
