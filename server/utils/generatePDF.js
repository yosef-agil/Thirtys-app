import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

export const generateInvoicePDF = (booking) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument();
    const filename = `invoice-${booking.booking_code}.pdf`;
    const filepath = path.join('uploads', filename);

    const stream = fs.createWriteStream(filepath);
    doc.pipe(stream);

    // Header
    doc.fontSize(20).text('INVOICE', 50, 50);
    doc.fontSize(12).text('Photo Studio Booking', 50, 80);

    // Invoice details
    doc.fontSize(10);
    doc.text(`Invoice Number: ${booking.booking_code}`, 50, 120);
    doc.text(`Date: ${new Date().toLocaleDateString('id-ID')}`, 50, 135);

    // Customer details
    doc.text('CUSTOMER DETAILS', 50, 170, { underline: true });
    doc.text(`Name: ${booking.customer_name}`, 50, 190);
    doc.text(`Phone: ${booking.phone_number}`, 50, 205);
    if (booking.faculty) {
      doc.text(`Faculty: ${booking.faculty}`, 50, 220);
      doc.text(`University: ${booking.university}`, 50, 235);
    }

    // Booking details
    doc.text('BOOKING DETAILS', 50, 270, { underline: true });
    doc.text(`Service: ${booking.service_name}`, 50, 290);
    doc.text(`Package: ${booking.package_name}`, 50, 305);
    doc.text(`Date: ${booking.booking_date}`, 50, 320);
    if (booking.start_time) {
      doc.text(`Time: ${booking.start_time} - ${booking.end_time}`, 50, 335);
    }

    // Payment details
    doc.text('PAYMENT DETAILS', 50, 370, { underline: true });
    doc.text(`Payment Type: ${booking.payment_type}`, 50, 390);
    doc.text(`Total Amount: Rp ${booking.total_price.toLocaleString('id-ID')}`, 50, 405);
    doc.text(`Status: ${booking.status.toUpperCase()}`, 50, 420);

    // Footer
    doc.fontSize(8);
    doc.text('Thank you for your business!', 50, 500, { align: 'center' });

    doc.end();

    stream.on('finish', () => resolve(filename));
    stream.on('error', reject);
  });
};