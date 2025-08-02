// server/routes/timeSlots.js
import express from 'express';
import pool from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// ✅ GET time slots for a service
router.get('/', authenticateToken, async (req, res) => {
  try {
    const serviceId = parseInt(req.query.serviceId, 10);
    const { date } = req.query;

    if (!serviceId || isNaN(serviceId)) {
      console.warn('Missing or invalid serviceId for GET /api/time-slots');
      return res.status(200).json([]); // Mengembalikan array kosong jika serviceId tidak valid/ada
    }

    let query = `
      SELECT
        ts.*,
        (SELECT COUNT(*) FROM time_slot_bookings WHERE time_slot_id = ts.id) as current_bookings
      FROM time_slots ts
      WHERE ts.service_id = ?
    `;
    const params = [serviceId];

    if (date) {
      query += ' AND ts.date = ?';
      params.push(date);
    }

    query += ' ORDER BY ts.date, ts.start_time';

    const [slots] = await pool.execute(query, params);
    res.json(slots);
  } catch (error) {
    console.error('Error fetching time slots:', error);
    res.status(500).json({ error: 'Failed to fetch time slots' });
  }
});

// ✅ GET time slots for PUBLIC BOOKING (tanpa auth)
router.get('/public', async (req, res) => {
  try {
    const serviceId = parseInt(req.query.serviceId, 10);
    const { date } = req.query;

    if (!serviceId || isNaN(serviceId)) {
      console.warn('Missing or invalid serviceId for GET /api/time-slots/public');
      return res.status(200).json([]);
    }

    let query = `
      SELECT
        ts.*,
        (SELECT COUNT(*) FROM time_slot_bookings WHERE time_slot_id = ts.id) as current_bookings
      FROM time_slots ts
      WHERE ts.service_id = ?
    `;
    const params = [serviceId];

    if (date) {
      query += ' AND ts.date = ?';
      params.push(date);
    }

    query += ' ORDER BY ts.date, ts.start_time';

    const [slots] = await pool.execute(query, params);
    res.json(slots);
  } catch (error) {
    console.error('Error fetching public time slots:', error);
    res.status(500).json({ error: 'Failed to fetch time slots' });
  }
});

// ✅ CREATE time slot
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { service_id, date, start_time, end_time, max_capacity } = req.body;

    if (!service_id || !date || !start_time || !end_time || !max_capacity) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const [result] = await pool.execute(
      'INSERT INTO time_slots (service_id, date, start_time, end_time, max_capacity) VALUES (?, ?, ?, ?, ?)',
      [service_id, date, start_time, end_time, max_capacity]
    );

    res.status(201).json({ id: result.insertId, message: 'Time slot created successfully' });
  } catch (error) {
    console.error('Error creating time slot:', error);
    res.status(500).json({ error: 'Failed to create time slot' });
  }
});

// ✅ BULK CREATE
router.post('/bulk', authenticateToken, async (req, res) => {
  try {
    const { slots } = req.body;
    let created = 0;
    let skipped = 0;

    if (!Array.isArray(slots) || slots.length === 0) {
      return res.status(400).json({ error: 'Invalid or empty slots array provided' });
    }

    for (const slot of slots) {
      // Basic validation for each slot object
      if (!slot.service_id || !slot.date || !slot.start_time || !slot.end_time || slot.max_capacity === undefined) {
        console.warn('Skipping invalid slot due to missing fields:', slot);
        skipped++;
        continue;
      }

      const [existing] = await pool.execute(
        'SELECT id FROM time_slots WHERE service_id = ? AND date = ? AND start_time = ?',
        [slot.service_id, slot.date, slot.start_time]
      );

      if (existing.length === 0) {
        await pool.execute(
          'INSERT INTO time_slots (service_id, date, start_time, end_time, max_capacity) VALUES (?, ?, ?, ?, ?)',
          [slot.service_id, slot.date, slot.start_time, slot.end_time, slot.max_capacity]
        );
        created++;
      } else {
        skipped++;
      }
    }

    res.json({
      success: true,
      created,
      skipped,
      message: `${created} time slots created, ${skipped} skipped (already exist or invalid).`
    });
  } catch (error) {
    console.error('Error bulk creating time slots:', error);
    res.status(500).json({ error: 'Failed to bulk create time slots' });
  }
});

// ✅ BULK DELETE - Hapus time slots berdasarkan range tanggal
router.delete('/bulk', authenticateToken, async (req, res) => {
  try {
    const { service_id, start_date, end_date, force = false } = req.body;

    if (!service_id || !start_date || !end_date) {
      return res.status(400).json({ 
        error: 'service_id, start_date, dan end_date harus diisi' 
      });
    }

    // Validasi tanggal
    if (new Date(start_date) > new Date(end_date)) {
      return res.status(400).json({ 
        error: 'start_date tidak boleh lebih besar dari end_date' 
      });
    }

    // Cek slots yang akan dihapus
    const [slots] = await pool.execute(`
      SELECT 
        ts.id,
        ts.date,
        ts.start_time,
        ts.end_time,
        COUNT(tsb.id) as booking_count
      FROM time_slots ts
      LEFT JOIN time_slot_bookings tsb ON ts.id = tsb.time_slot_id
      WHERE ts.service_id = ? 
        AND ts.date >= ? 
        AND ts.date <= ?
      GROUP BY ts.id
    `, [service_id, start_date, end_date]);

    const totalSlots = slots.length;
    const bookedSlots = slots.filter(s => s.booking_count > 0).length;

    // Jika ada yang sudah dibooking dan force=false, return info
    if (bookedSlots > 0 && !force) {
      return res.status(400).json({
        error: 'Ada slot yang sudah memiliki booking',
        totalSlots,
        bookedSlots,
        requireForce: true
      });
    }

    // Hapus slots
    const [result] = await pool.execute(`
      DELETE FROM time_slots 
      WHERE service_id = ? 
        AND date >= ? 
        AND date <= ?
    `, [service_id, start_date, end_date]);

    res.json({
      success: true,
      message: `Berhasil menghapus ${result.affectedRows} time slots`,
      deletedCount: result.affectedRows
    });

  } catch (error) {
    console.error('Error bulk deleting time slots:', error);
    res.status(500).json({ error: 'Gagal menghapus time slots' });
  }
});

// ✅ UPDATE time slot
router.put('/:id', authenticateToken, async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { start_time, end_time, max_capacity } = req.body; // Hanya ambil field yang diperlukan

  // Validasi field yang diperlukan
  if (!start_time || !end_time || max_capacity === undefined) {
    return res.status(400).json({ error: 'start_time, end_time, and max_capacity are required' });
  }

  try {
    // Cek apakah slot ada
    const [slot] = await pool.execute('SELECT * FROM time_slots WHERE id = ?', [id]);
    if (slot.length === 0) {
      return res.status(404).json({ error: 'Time slot not found' });
    }

    // Update hanya field yang diizinkan
    await pool.execute(
      'UPDATE time_slots SET start_time = ?, end_time = ?, max_capacity = ? WHERE id = ?',
      [start_time, end_time, max_capacity, id]
    );

    res.json({ message: 'Time slot updated successfully' });
  } catch (error) {
    console.error('Error updating time slot:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ✅ DELETE time slot
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if there are any bookings for this time slot
    const [bookings] = await pool.execute(
      'SELECT COUNT(*) as count FROM time_slot_bookings WHERE time_slot_id = ?',
      [id]
    );

    if (bookings[0].count > 0) {
      return res.status(400).json({ error: 'Cannot delete slot with existing bookings' });
    }

    await pool.execute('DELETE FROM time_slots WHERE id = ?', [id]);
    res.json({ success: true, message: 'Time slot deleted successfully' });
  } catch (error) {
    console.error('Error deleting time slot:', error);
    res.status(500).json({ error: 'Failed to delete time slot' });
  }
});

export default router;