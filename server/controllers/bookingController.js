import db from '../config/database.js';
import crypto from 'crypto';

const generateBookingCode = () => {
  return 'BK' + Date.now().toString(36).toUpperCase() + crypto.randomBytes(2).toString('hex').toUpperCase();
};

export const createBooking = async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();

    const {
      customerName,
      phoneNumber,
      serviceId,
      packageId,
      bookingDate,
      timeSlotId,
      faculty,
      university,
      paymentType
    } = req.body;

    const bookingCode = generateBookingCode();
    const paymentProof = req.file ? req.file.filename : null;

    // Calculate total price
    const [packageData] = await connection.execute(
      'SELECT price FROM service_packages WHERE id = ?',
      [packageId]
    );

    if (packageData.length === 0) {
      throw new Error('Package not found');
    }

    let totalPrice = packageData[0].price;

    // Apply discount if any
    const [serviceData] = await connection.execute(
      'SELECT discount_percentage FROM services WHERE id = ?',
      [serviceId]
    );

    if (serviceData[0].discount_percentage > 0) {
      totalPrice = totalPrice * (1 - serviceData[0].discount_percentage / 100);
    }

    // If down payment, calculate 50%
    if (paymentType === 'down_payment') {
      totalPrice = totalPrice * 0.5;
    }

    // Insert booking
    const [result] = await connection.execute(`
      INSERT INTO bookings (
        booking_code, customer_name, phone_number, service_id, package_id,
        booking_date, time_slot_id, faculty, university, total_price,
        payment_type, payment_proof, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
    `, [
      bookingCode, customerName, phoneNumber, serviceId, packageId,
      bookingDate, timeSlotId, faculty, university, totalPrice,
      paymentType, paymentProof
    ]);

    // Update time slot if applicable
    if (timeSlotId) {
      await connection.execute(
        'UPDATE time_slots SET is_booked = TRUE WHERE id = ?',
        [timeSlotId]
      );
    }

    await connection.commit();

    res.status(201).json({
      message: 'Booking created successfully',
      bookingCode,
      bookingId: result.insertId
    });

  } catch (error) {
    await connection.rollback();
    console.error('Create booking error:', error);
    res.status(500).json({ error: 'Failed to create booking' });
  } finally {
    connection.release();
  }
};

export const getAllBookings = async (req, res) => {
  try {
    const { status, serviceId, date, month } = req.query;
    let query = `
      SELECT b.*, s.name as service_name, sp.package_name,
        ts.start_time, ts.end_time
      FROM bookings b
      JOIN services s ON b.service_id = s.id
      JOIN service_packages sp ON b.package_id = sp.id
      LEFT JOIN time_slots ts ON b.time_slot_id = ts.id
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      query += ' AND b.status = ?';
      params.push(status);
    }

    if (serviceId) {
      query += ' AND b.service_id = ?';
      params.push(serviceId);
    }

    if (date) {
      query += ' AND DATE(b.booking_date) = ?';
      params.push(date);
    }

    if (month) {
      query += ' AND DATE_FORMAT(b.booking_date, "%Y-%m") = ?';
      params.push(month);
    }

    query += ' ORDER BY b.created_at DESC';

    const [bookings] = await db.execute(query, params);
    res.json(bookings);
  } catch (error) {
    console.error('Get bookings error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getBookingById = async (req, res) => {
  try {
    const { id } = req.params;

    const [bookings] = await db.execute(`
      SELECT b.*, s.name as service_name, sp.package_name,
        ts.start_time, ts.end_time
      FROM bookings b
      JOIN services s ON b.service_id = s.id
      JOIN service_packages sp ON b.package_id = sp.id
      LEFT JOIN time_slots ts ON b.time_slot_id = ts.id
      WHERE b.id = ?
    `, [id]);

    if (bookings.length === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    res.json(bookings[0]);
  } catch (error) {
    console.error('Get booking error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateBookingStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['pending', 'confirmed', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    await db.execute(
      'UPDATE bookings SET status = ? WHERE id = ?',
      [status, id]
    );

    res.json({ message: 'Booking status updated successfully' });
  } catch (error) {
    console.error('Update booking error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteBooking = async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();

    const { id } = req.params;

    // Get booking details first
    const [bookings] = await connection.execute(
      'SELECT time_slot_id FROM bookings WHERE id = ?',
      [id]
    );

    if (bookings.length === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Free up time slot if applicable
    if (bookings[0].time_slot_id) {
      await connection.execute(
        'UPDATE time_slots SET is_booked = FALSE WHERE id = ?',
        [bookings[0].time_slot_id]
      );
    }

    // Delete booking
    await connection.execute('DELETE FROM bookings WHERE id = ?', [id]);

    await connection.commit();
    res.json({ message: 'Booking deleted successfully' });
  } catch (error) {
    await connection.rollback();
    console.error('Delete booking error:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    connection.release();
  }
};