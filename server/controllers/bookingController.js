import db from '../config/database.js';
import crypto from 'crypto';

const generateBookingCode = () => {
  return 'BK' + Date.now().toString(36).toUpperCase() + crypto.randomBytes(2).toString('hex').toUpperCase();
};

export const createBooking = async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();

    // Debug log
    console.log('Request body:', req.body);
    console.log('Request file:', req.file);

    const {
      customerName,
      phoneNumber,
      serviceId,
      packageId,
      bookingDate,
      timeSlotId,
      faculty,
      university,
      paymentType,
      paymentMethod,  // NEW
      selectedBank,   // NEW
      promoCode,  // NEW
      totalPrice,
      paidAmount
    } = req.body;

    // Validate required fields
    if (!customerName || !phoneNumber || !serviceId || !packageId || !bookingDate || !paymentType) {
      throw new Error('Missing required fields');
    }

    // Validate payment method
    if (!paymentMethod || !['qris', 'transfer', 'cash'].includes(paymentMethod)) {
      throw new Error('Invalid payment method');
    }

    // Validate bank selection for transfer payments
    if (paymentMethod === 'transfer' && !req.file) {
      throw new Error('Payment proof required for bank transfer');
    }

    const bookingCode = generateBookingCode();
    const paymentProof = req.file ? req.file.filename : null;

    // Calculate full package price (for verification and fallback)
    const [packageData] = await connection.execute(
      'SELECT price FROM service_packages WHERE id = ?',
      [packageId]
    );

    if (packageData.length === 0) {
      throw new Error('Package not found');
    }

    let calculatedFullPrice = packageData[0].price;

    // Apply service discount if any
    const [serviceData] = await connection.execute(
      'SELECT discount_percentage FROM services WHERE id = ?',
      [serviceId]
    );

    if (serviceData.length > 0 && serviceData[0].discount_percentage > 0) {
      calculatedFullPrice = calculatedFullPrice * (1 - serviceData[0].discount_percentage / 100);
    }

    // NEW - Handle promo code
    let promoCodeId = null;
    let promoDiscountAmount = 0;
    
    if (promoCode) {
      // Validate promo code
      const [promoCodes] = await connection.execute(`
        SELECT * FROM promo_codes 
        WHERE code = ? 
        AND is_active = true
        AND (service_id IS NULL OR service_id = ?)
        AND (valid_from IS NULL OR valid_from <= NOW())
        AND (valid_until IS NULL OR valid_until >= NOW())
        AND (usage_limit IS NULL OR used_count < usage_limit)
        FOR UPDATE
      `, [promoCode.toUpperCase(), serviceId]);

      if (promoCodes.length > 0) {
        const promoData = promoCodes[0];
        promoCodeId = promoData.id;

        // Calculate promo discount
        if (promoData.discount_type === 'percentage') {
          promoDiscountAmount = calculatedFullPrice * (promoData.discount_value / 100);
        } else {
          promoDiscountAmount = Math.min(promoData.discount_value, calculatedFullPrice);
        }
      }
    }


    // Use frontend-provided totalPrice if available, otherwise use calculated
    const finalFullPrice = calculatedFullPrice - promoDiscountAmount;
    
    // Calculate paid amount
    let finalPaidAmount;
    if (paidAmount) {
      finalPaidAmount = parseFloat(paidAmount);
    } else {
      finalPaidAmount = paymentType === 'down_payment' ? finalFullPrice * 0.5 : finalFullPrice;
    }

    // Check time slot availability before booking
    if (timeSlotId) {
      const [slotCheck] = await connection.execute(`
        SELECT 
          ts.max_capacity,
          COALESCE(COUNT(tsb.id), 0) as current_bookings
        FROM time_slots ts
        LEFT JOIN time_slot_bookings tsb ON ts.id = tsb.time_slot_id
        LEFT JOIN bookings b ON tsb.booking_id = b.id AND b.status != 'cancelled'
        WHERE ts.id = ?
        GROUP BY ts.id, ts.max_capacity
      `, [timeSlotId]);

      if (slotCheck.length === 0) {
        throw new Error('Time slot not found');
      }

      const { max_capacity, current_bookings } = slotCheck[0];
      if (current_bookings >= max_capacity) {
        throw new Error('Time slot is fully booked');
      }
    }

    // Check if columns exist (for backward compatibility)
    const [columns] = await connection.execute(
      "SHOW COLUMNS FROM bookings LIKE 'payment_method'"
    );
    
    const hasPaymentMethodColumn = columns.length > 0;

    // Insert booking
    let insertQuery;
    let insertParams;

    if (hasPaymentMethodColumn) {
      insertQuery = `
      INSERT INTO bookings (
        booking_code, customer_name, phone_number, service_id, package_id,
        booking_date, time_slot_id, faculty, university, total_price,
        payment_type, payment_method, selected_bank, payment_proof, 
        promo_code_id, discount_amount, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', NOW())
      `;
      insertParams = [
      bookingCode, customerName, phoneNumber, serviceId, packageId,
      bookingDate, timeSlotId || null, faculty || null, university || null, 
      finalFullPrice,
      paymentType, 
      paymentMethod,
      selectedBank || null,
      paymentProof,
      promoCodeId,
      promoDiscountAmount
    ];

    } else {
      // Fallback for old database schema
      insertQuery = `
      INSERT INTO bookings (
        booking_code, customer_name, phone_number, service_id, package_id,
        booking_date, time_slot_id, faculty, university, total_price,
        payment_type, payment_method, selected_bank, payment_proof, 
        promo_code_id, discount_amount, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', NOW())
      `;
      insertParams = [
      bookingCode, customerName, phoneNumber, serviceId, packageId,
      bookingDate, timeSlotId || null, faculty || null, university || null, 
      finalFullPrice,
      paymentType, 
      paymentMethod,
      selectedBank || null,
      paymentProof,
      promoCodeId,
      promoDiscountAmount
    ];
    }

    const [result] = await connection.execute(insertQuery, insertParams);

    // Record promo usage
    if (promoCodeId) {
      // Update usage count
      await connection.execute(
        'UPDATE promo_codes SET used_count = used_count + 1 WHERE id = ?',
        [promoCodeId]
      );
      
      // Record promo usage
      await connection.execute(
        `INSERT INTO promo_usage (
          promo_code_id, booking_id, customer_phone, discount_amount
        ) VALUES (?, ?, ?, ?)`,
        [promoCodeId, result.insertId, phoneNumber, promoDiscountAmount]
      );
    }


    // Update time slot booking relationship
    if (timeSlotId) {
      // Insert into junction table
      await connection.execute(
        'INSERT INTO time_slot_bookings (time_slot_id, booking_id) VALUES (?, ?)',
        [timeSlotId, result.insertId]
      );

      // Check if slot is now full and update is_booked flag
      const [slotStatus] = await connection.execute(`
        SELECT 
          ts.max_capacity,
          COUNT(tsb.id) as current_bookings
        FROM time_slots ts
        LEFT JOIN time_slot_bookings tsb ON ts.id = tsb.time_slot_id
        LEFT JOIN bookings b ON tsb.booking_id = b.id AND b.status != 'cancelled'
        WHERE ts.id = ?
        GROUP BY ts.id, ts.max_capacity
      `, [timeSlotId]);

      if (slotStatus.length > 0) {
        const { max_capacity, current_bookings } = slotStatus[0];
        const isFull = current_bookings >= max_capacity;
        
        await connection.execute(
          'UPDATE time_slots SET is_booked = ? WHERE id = ?',
          [isFull, timeSlotId]
        );
      }
    }

    await connection.commit();

    // Send WhatsApp notification (if configured)
    const paymentMethodText = paymentMethod === 'transfer' ? `Transfer Bank (${selectedBank || 'Bank'})` : paymentMethod;
    const whatsappMessage = `
    🎉 *New Booking Alert!*

    📋 Booking Code: ${bookingCode}
    👤 Customer: ${customerName}
    📱 Phone: ${phoneNumber}
    📅 Date: ${bookingDate}
    💰 Total: Rp ${finalFullPrice.toLocaleString('id-ID')}
    💳 Payment: ${paymentType.replace('_', ' ')} via ${paymentMethodText}

    Please check admin dashboard for details.
    `;

    // TODO: Implement WhatsApp notification
    // await whatsappService.sendMessage(adminPhoneNumber, whatsappMessage);

    res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      bookingCode,
      bookingId: result.insertId,
      originalPrice: calculatedFullPrice,
      discountAmount: promoDiscountAmount,
      totalPrice: finalFullPrice,
      paidAmount: finalPaidAmount,
      remainingAmount: paymentType === 'down_payment' ? finalFullPrice - finalPaidAmount : 0
    });

  } catch (error) {
    await connection.rollback();
    console.error('Create booking error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message || 'Failed to create booking' 
    });
  } finally {
    connection.release();
  }
};

export const getAllBookings = async (req, res) => {
  try {
    const { status, serviceId, date, month } = req.query;
    
    // Check if payment_method column exists
    const [columns] = await db.execute(
      "SHOW COLUMNS FROM bookings LIKE 'payment_method'"
    );
    const hasPaymentMethodColumn = columns.length > 0;
    
    let query = `
      SELECT b.*, s.name as service_name, sp.package_name,
        ts.start_time, ts.end_time
        ${hasPaymentMethodColumn ? ', b.payment_method, b.selected_bank' : ''}
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

    // Check if payment_method column exists
    const [columns] = await db.execute(
      "SHOW COLUMNS FROM bookings LIKE 'payment_method'"
    );
    const hasPaymentMethodColumn = columns.length > 0;

    const [bookings] = await db.execute(`
      SELECT b.*, s.name as service_name, sp.package_name,
        ts.start_time, ts.end_time
        ${hasPaymentMethodColumn ? ', b.payment_method, b.selected_bank' : ''}
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

    // Remove from time slot bookings junction table
    if (bookings[0].time_slot_id) {
      await connection.execute(
        'DELETE FROM time_slot_bookings WHERE booking_id = ?',
        [id]
      );

      // Update time slot availability
      const timeSlotId = bookings[0].time_slot_id;
      const [slotStatus] = await connection.execute(`
        SELECT 
          ts.max_capacity,
          COUNT(tsb.id) as current_bookings
        FROM time_slots ts
        LEFT JOIN time_slot_bookings tsb ON ts.id = tsb.time_slot_id
        LEFT JOIN bookings b ON tsb.booking_id = b.id AND b.status != 'cancelled'
        WHERE ts.id = ?
        GROUP BY ts.id, ts.max_capacity
      `, [timeSlotId]);

      if (slotStatus.length > 0) {
        const { max_capacity, current_bookings } = slotStatus[0];
        const isFull = current_bookings >= max_capacity;
        
        await connection.execute(
          'UPDATE time_slots SET is_booked = ? WHERE id = ?',
          [isFull, timeSlotId]
        );
      }
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


// Add this function to bookingController.js

export const getBookingsWithPagination = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      status, 
      serviceId, 
      month, 
      search 
    } = req.query;
    
    const offset = (page - 1) * limit;
    
    // Base query
    let countQuery = `
      SELECT COUNT(*) as total
      FROM bookings b
      JOIN services s ON b.service_id = s.id
      JOIN service_packages sp ON b.package_id = sp.id
      WHERE 1=1
    `;
    
    let dataQuery = `
      SELECT b.*, s.name as service_name, sp.package_name,
        ts.start_time, ts.end_time,
        b.payment_method, b.selected_bank
      FROM bookings b
      JOIN services s ON b.service_id = s.id
      JOIN service_packages sp ON b.package_id = sp.id
      LEFT JOIN time_slots ts ON b.time_slot_id = ts.id
      WHERE 1=1
    `;
    
    const params = [];
    const countParams = [];
    
    // Add filters
    if (status && status !== 'all') {
      const condition = ' AND b.status = ?';
      countQuery += condition;
      dataQuery += condition;
      params.push(status);
      countParams.push(status);
    }
    
    if (serviceId && serviceId !== 'all') {
      const condition = ' AND b.service_id = ?';
      countQuery += condition;
      dataQuery += condition;
      params.push(serviceId);
      countParams.push(serviceId);
    }
    
    if (month) {
      const condition = ' AND DATE_FORMAT(b.booking_date, "%Y-%m") = ?';
      countQuery += condition;
      dataQuery += condition;
      params.push(month);
      countParams.push(month);
    }
    
    if (search) {
      const condition = ` AND (
        b.booking_code LIKE ? OR
        b.display_code LIKE ? OR
        b.customer_name LIKE ? OR
        b.phone_number LIKE ? OR
        s.name LIKE ? OR
        sp.package_name LIKE ?
      )`;
      countQuery += condition;
      dataQuery += condition;
      
      const searchPattern = `%${search}%`;
      params.push(...Array(6).fill(searchPattern));
      countParams.push(...Array(6).fill(searchPattern));
    }
    
    // Get total count
    const [countResult] = await db.execute(countQuery, countParams);
    const totalBookings = countResult[0].total;
    
    // Add sorting and pagination
    dataQuery += ' ORDER BY b.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));
    
    // Get paginated data
    const [bookings] = await db.execute(dataQuery, params);
    
    res.json({
      bookings,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalBookings / limit),
        totalBookings,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get bookings with pagination error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update routes in bookings.js to include:
// router.get('/paginated', authenticateToken, requireAdmin, getBookingsWithPagination);