import axios from 'axios';

export const sendWhatsAppNotification = async (phoneNumber, bookingDetails) => {
  try {
    // Format phone number (Indonesia)
    let formattedPhone = phoneNumber.replace(/\D/g, '');
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '62' + formattedPhone.substring(1);
    }

    const message = `
Halo ${bookingDetails.customerName}! 

Terima kasih telah melakukan booking di Photo Studio kami.

Detail Booking:
- Kode Booking: ${bookingDetails.bookingCode}
- Layanan: ${bookingDetails.serviceName}
- Tanggal: ${bookingDetails.bookingDate}
- Total Pembayaran: Rp ${bookingDetails.totalPrice.toLocaleString('id-ID')}
- Status: ${bookingDetails.status}

Tim kami akan segera menghubungi Anda untuk konfirmasi.

Terima kasih!
    `.trim();

    // Implementasi tergantung provider WhatsApp API
    // Contoh menggunakan WhatsApp Business API
    if (process.env.WHATSAPP_API_URL && process.env.WHATSAPP_API_KEY) {
      await axios.post(
        `${process.env.WHATSAPP_API_URL}/messages`,
        {
          to: formattedPhone,
          type: 'text',
          text: { body: message }
        },
        {
          headers: {
            'Authorization': `Bearer ${process.env.WHATSAPP_API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );
    }
  } catch (error) {
    console.error('WhatsApp notification error:', error);
    // Don't throw error to not affect booking process
  }
};