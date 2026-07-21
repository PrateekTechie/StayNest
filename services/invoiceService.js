function buildInvoiceText(booking, guest, host, listing) {
    const invoiceNumber = `SN-${booking._id.toString().slice(-6).toUpperCase()}`;

    return `
StayNest Invoice
================
Invoice Number: ${invoiceNumber}
Booking ID: ${booking._id}

Guest: ${guest.username || guest.email}
Host: ${host.username || host.email}
Property: ${listing.title}

Booking Dates:
Check-in: ${booking.checkIn.toDateString()}
Check-out: ${booking.checkOut.toDateString()}

Charges:
Price per night: ₹${booking.pricePerNight.toLocaleString("en-IN")}
Cleaning fee: ₹${booking.cleaningFee.toLocaleString("en-IN")}
Service fee: ₹${booking.serviceFee.toLocaleString("en-IN")}
Taxes: ₹${booking.taxes.toLocaleString("en-IN")}
GST: 18%
Total: ₹${booking.totalAmount.toLocaleString("en-IN")}

Payment Method: ${booking.paymentMethod || "Razorpay"}
Status: ${booking.paymentStatus}
`;
}

module.exports = {
    buildInvoiceText,
};
