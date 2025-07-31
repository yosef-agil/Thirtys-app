import db from '../config/database.js';

// Admin functions
export const createPromoCode = async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const {
      code,
      discount_type,
      discount_value,
      service_id,
      usage_limit,
      valid_from,
      valid_until
    } = req.body;

    // Validate input
    if (!code || !discount_type || !discount_value) {
      return res.status(400).json({ 
        error: 'Code, discount type, and discount value are required' 
      });
    }

    // Check if code already exists
    const [existing] = await connection.execute(
      'SELECT id FROM promo_codes WHERE code = ?',
      [code.toUpperCase()]
    );

    if (existing.length > 0) {
      return res.status(400).json({ error: 'Promo code already exists' });
    }

    // Insert promo code
    const [result] = await connection.execute(
      `INSERT INTO promo_codes (
        code, discount_type, discount_value, service_id, 
        usage_limit, valid_from, valid_until
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        code.toUpperCase(),
        discount_type,
        discount_value,
        service_id || null,
        usage_limit || null,
        valid_from || new Date(),
        valid_until || null
      ]
    );

    await connection.commit();

    res.status(201).json({
      success: true,
      message: 'Promo code created successfully',
      promoCodeId: result.insertId
    });

  } catch (error) {
    await connection.rollback();
    console.error('Create promo code error:', error);
    res.status(500).json({ error: 'Failed to create promo code' });
  } finally {
    connection.release();
  }
};

export const getAllPromoCodes = async (req, res) => {
  try {
    const [promoCodes] = await db.execute(`
      SELECT 
        pc.*,
        s.name as service_name,
        CASE 
          WHEN pc.usage_limit IS NULL THEN NULL
          ELSE pc.usage_limit - COALESCE(pc.used_count, 0)
        END as remaining_uses
      FROM promo_codes pc
      LEFT JOIN services s ON pc.service_id = s.id
      ORDER BY pc.created_at DESC
    `);

    // Ensure used_count is never null
    const sanitizedPromoCodes = promoCodes.map(promo => ({
      ...promo,
      used_count: promo.used_count || 0
    }));

    res.json(sanitizedPromoCodes);
  } catch (error) {
    console.error('Get promo codes error:', error);
    res.status(500).json({ error: 'Failed to fetch promo codes' });
  }
};

export const updatePromoCode = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      discount_type,
      discount_value,
      service_id,
      usage_limit,
      valid_from,
      valid_until,
      is_active
    } = req.body;

    const updates = [];
    const params = [];

    if (discount_type !== undefined) {
      updates.push('discount_type = ?');
      params.push(discount_type);
    }
    if (discount_value !== undefined) {
      updates.push('discount_value = ?');
      params.push(discount_value);
    }
    if (service_id !== undefined) {
      updates.push('service_id = ?');
      params.push(service_id || null);
    }
    if (usage_limit !== undefined) {
      updates.push('usage_limit = ?');
      params.push(usage_limit || null);
    }
    if (valid_from !== undefined) {
      updates.push('valid_from = ?');
      params.push(valid_from);
    }
    if (valid_until !== undefined) {
      updates.push('valid_until = ?');
      params.push(valid_until || null);
    }
    if (is_active !== undefined) {
      updates.push('is_active = ?');
      params.push(is_active);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    params.push(id);

    await db.execute(
      `UPDATE promo_codes SET ${updates.join(', ')} WHERE id = ?`,
      params
    );

    res.json({ success: true, message: 'Promo code updated successfully' });
  } catch (error) {
    console.error('Update promo code error:', error);
    res.status(500).json({ error: 'Failed to update promo code' });
  }
};

export const deletePromoCode = async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const { id } = req.params;

    // Check if promo code has been used
    const [usage] = await connection.execute(
      'SELECT COUNT(*) as count FROM promo_usage WHERE promo_code_id = ?',
      [id]
    );

    if (usage[0].count > 0) {
      // Option 1: Soft delete - just deactivate instead of delete
      await connection.execute(
        'UPDATE promo_codes SET is_active = 0 WHERE id = ?',
        [id]
      );
      
      await connection.commit();
      
      return res.json({ 
        success: true, 
        message: 'Promo code has been deactivated since it has been used',
        softDeleted: true 
      });
      
      // Option 2: If you really want to allow deletion (uncomment below and comment above)
      /*
      // Delete from promo_usage first
      await connection.execute('DELETE FROM promo_usage WHERE promo_code_id = ?', [id]);
      
      // Then delete promo code
      await connection.execute('DELETE FROM promo_codes WHERE id = ?', [id]);
      
      await connection.commit();
      
      return res.json({ 
        success: true, 
        message: 'Promo code and its usage history deleted successfully',
        warning: 'Historical booking data may be affected' 
      });
      */
    }

    // If never used, can delete directly
    await connection.execute('DELETE FROM promo_codes WHERE id = ?', [id]);
    
    await connection.commit();
    
    res.json({ success: true, message: 'Promo code deleted successfully' });
  } catch (error) {
    await connection.rollback();
    console.error('Delete promo code error:', error);
    res.status(500).json({ error: 'Failed to delete promo code' });
  } finally {
    connection.release();
  }
};

// User functions
export const validatePromoCode = async (req, res) => {
  try {
    const { code, service_id, phone_number, booking_date } = req.body; // Add booking_date

    console.log('Validating promo code:', { code, service_id, phone_number, booking_date });

    if (!code || !service_id) {
      return res.status(400).json({ 
        error: 'Promo code and service ID are required' 
      });
    }

    // Convert service_id to integer for comparison
    const serviceIdInt = parseInt(service_id);
    
    // Use booking date for validation if provided, otherwise use current date
    const validationDate = booking_date ? new Date(booking_date) : new Date();

    // Get promo code details - check validity based on booking date
    const query = `
      SELECT * FROM promo_codes 
      WHERE code = ? 
      AND is_active = 1
      AND (service_id IS NULL OR service_id = ?)
      AND (valid_from IS NULL OR valid_from <= ?)
      AND (valid_until IS NULL OR valid_until >= ?)
    `;
    
    console.log('Executing query with params:', [code.toUpperCase(), serviceIdInt, validationDate, validationDate]);
    
    const [promoCodes] = await db.execute(query, [code.toUpperCase(), serviceIdInt, validationDate, validationDate]);

    console.log('Found promo codes:', promoCodes);

    if (promoCodes.length === 0) {
      // More specific error message
      const [allCodes] = await db.execute(
        'SELECT * FROM promo_codes WHERE code = ?',
        [code.toUpperCase()]
      );
      
      if (allCodes.length > 0) {
        const promo = allCodes[0];
        if (!promo.is_active) {
          return res.status(400).json({ error: 'Promo code is inactive' });
        }
        if (promo.service_id && promo.service_id !== serviceIdInt) {
          return res.status(400).json({ error: 'Promo code is not valid for this service' });
        }
        if (promo.valid_from && new Date(promo.valid_from) > validationDate) {
          return res.status(400).json({ error: 'Promo code is not yet valid for the booking date' });
        }
        if (promo.valid_until && new Date(promo.valid_until) < validationDate) {
          return res.status(400).json({ error: 'Promo code has expired for the booking date' });
        }
      }
      
      return res.status(400).json({ 
        error: 'Invalid or expired promo code' 
      });
    }

    const promoCode = promoCodes[0];

    // Check usage limit
    if (promoCode.usage_limit !== null && promoCode.used_count >= promoCode.usage_limit) {
      return res.status(400).json({ 
        error: 'Promo code usage limit reached' 
      });
    }

    // Check if user has already used this promo (optional - uncomment if needed)
    /*
    if (phone_number) {
      const [userUsage] = await db.execute(
        'SELECT id FROM promo_usage WHERE promo_code_id = ? AND customer_phone = ?',
        [promoCode.id, phone_number]
      );

      if (userUsage.length > 0) {
        return res.status(400).json({ 
          error: 'You have already used this promo code' 
        });
      }
    }
    */

    res.json({
      success: true,
      promoCode: {
        id: promoCode.id,
        code: promoCode.code,
        discount_type: promoCode.discount_type,
        discount_value: promoCode.discount_value
      }
    });

  } catch (error) {
    console.error('Validate promo code error:', error);
    res.status(500).json({ error: 'Failed to validate promo code' });
  }
};

// Get promo usage statistics
export const getPromoStats = async (req, res) => {
  try {
    const { id } = req.params;

    const [stats] = await db.execute(`
      SELECT 
        pc.*,
        COUNT(DISTINCT pu.id) as total_uses,
        SUM(pu.discount_amount) as total_discount_given,
        COUNT(DISTINCT pu.customer_phone) as unique_users
      FROM promo_codes pc
      LEFT JOIN promo_usage pu ON pc.id = pu.promo_code_id
      WHERE pc.id = ?
      GROUP BY pc.id
    `, [id]);

    const [recentUsage] = await db.execute(`
      SELECT 
        pu.*,
        b.customer_name,
        b.booking_code,
        s.name as service_name
      FROM promo_usage pu
      JOIN bookings b ON pu.booking_id = b.id
      JOIN services s ON b.service_id = s.id
      WHERE pu.promo_code_id = ?
      ORDER BY pu.used_at DESC
      LIMIT 10
    `, [id]);

    res.json({
      stats: stats[0],
      recentUsage
    });

  } catch (error) {
    console.error('Get promo stats error:', error);
    res.status(500).json({ error: 'Failed to fetch promo statistics' });
  }
};

// Add these functions to promoCodeController.js

export const bulkCreatePromoCodes = async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const {
      prefix,
      count,
      discount_type,
      discount_value,
      service_id,
      usage_limit,
      valid_from,
      valid_until
    } = req.body;

    // Validate input
    if (!prefix || !count || !discount_type || !discount_value) {
      return res.status(400).json({ 
        error: 'Prefix, count, discount type, and discount value are required' 
      });
    }

    if (count < 1 || count > 100) {
      return res.status(400).json({ 
        error: 'Count must be between 1 and 100' 
      });
    }

    const createdCodes = [];
    const errors = [];

    // Generate unique codes
    for (let i = 0; i < count; i++) {
      // Generate shorter random suffix (4 characters instead of 6)
      const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
      const code = `${prefix.toUpperCase()}${randomSuffix}`;

      try {
        // Check if code already exists
        const [existing] = await connection.execute(
          'SELECT id FROM promo_codes WHERE code = ?',
          [code]
        );

        if (existing.length > 0) {
          // Try again with different suffix
          i--;
          continue;
        }

        // Insert promo code
        const [result] = await connection.execute(
          `INSERT INTO promo_codes (
            code, discount_type, discount_value, service_id, 
            usage_limit, valid_from, valid_until
          ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            code,
            discount_type,
            discount_value,
            service_id || null,
            usage_limit || null,
            valid_from || new Date(),
            valid_until || null
          ]
        );

        createdCodes.push({
          id: result.insertId,
          code: code
        });
      } catch (error) {
        errors.push(`Failed to create code: ${code}`);
      }
    }

    await connection.commit();

    res.status(201).json({
      success: true,
      message: `Created ${createdCodes.length} promo codes`,
      createdCodes: createdCodes,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    await connection.rollback();
    console.error('Bulk create promo codes error:', error);
    res.status(500).json({ error: 'Failed to create promo codes' });
  } finally {
    connection.release();
  }
};

export const bulkDeletePromoCodes = async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ 
        error: 'Please provide an array of promo code IDs' 
      });
    }

    // Get info about codes to be deleted
    const placeholders = ids.map(() => '?').join(',');
    const [promoCodes] = await connection.execute(
      `SELECT id, code, used_count FROM promo_codes WHERE id IN (${placeholders})`,
      ids
    );

    const deletedCodes = [];
    const deactivatedCodes = [];
    const errors = [];

    for (const promo of promoCodes) {
      try {
        if (promo.used_count > 0) {
          // Deactivate instead of delete if used
          await connection.execute(
            'UPDATE promo_codes SET is_active = 0 WHERE id = ?',
            [promo.id]
          );
          deactivatedCodes.push(promo.code);
        } else {
          // Delete if never used
          await connection.execute(
            'DELETE FROM promo_codes WHERE id = ?',
            [promo.id]
          );
          deletedCodes.push(promo.code);
        }
      } catch (error) {
        errors.push(`Failed to process code: ${promo.code}`);
      }
    }

    await connection.commit();

    res.json({
      success: true,
      message: `Processed ${promoCodes.length} promo codes`,
      deletedCodes: deletedCodes,
      deactivatedCodes: deactivatedCodes,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    await connection.rollback();
    console.error('Bulk delete promo codes error:', error);
    res.status(500).json({ error: 'Failed to delete promo codes' });
  } finally {
    connection.release();
  }
};

// Add this to export promo codes
export const exportPromoCodes = async (req, res) => {
  try {
    const [promoCodes] = await db.execute(`
      SELECT 
        pc.code,
        pc.discount_type,
        pc.discount_value,
        s.name as service_name,
        pc.usage_limit,
        pc.used_count,
        pc.valid_from,
        pc.valid_until,
        pc.is_active,
        pc.created_at
      FROM promo_codes pc
      LEFT JOIN services s ON pc.service_id = s.id
      ORDER BY pc.created_at DESC
    `);

    res.json(promoCodes);
  } catch (error) {
    console.error('Export promo codes error:', error);
    res.status(500).json({ error: 'Failed to export promo codes' });
  }
};