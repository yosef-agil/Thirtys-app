import db from '../config/database.js';

export const getAllServices = async (req, res) => {
  try {
    const [services] = await db.execute(`
      SELECT s.*, 
        CASE 
          WHEN s.discount_percentage > 0 
          THEN s.base_price * (1 - s.discount_percentage / 100)
          ELSE s.base_price 
        END as discounted_price
      FROM services s
      ORDER BY s.id
    `);

    for (let service of services) {
      const [packages] = await db.execute(
        'SELECT * FROM service_packages WHERE service_id = ?',
        [service.id]
      );
      service.packages = packages;
    }

    res.json(services);
  } catch (error) {
    console.error('Get services error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getServiceById = async (req, res) => {
  try {
    const { id } = req.params;

    const [services] = await db.execute(
      'SELECT * FROM services WHERE id = ?',
      [id]
    );

    if (services.length === 0) {
      return res.status(404).json({ error: 'Service not found' });
    }

    const service = services[0];

    const [packages] = await db.execute(
      'SELECT * FROM service_packages WHERE service_id = ?',
      [id]
    );

    service.packages = packages;

    res.json(service);
  } catch (error) {
    console.error('Get service error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getAvailableTimeSlots = async (req, res) => {
  try {
    const { serviceId, date } = req.query;

    if (!serviceId || !date) {
      return res.status(400).json({ error: 'Service ID and date required' });
    }

    const [slots] = await db.execute(`
      SELECT id, date, start_time, end_time, is_booked
      FROM time_slots
      WHERE service_id = ? AND date = ? AND is_booked = FALSE
      ORDER BY start_time
    `, [serviceId, date]);

    res.json(slots);
  } catch (error) {
    console.error('Get time slots error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateService = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, base_price, description, discount_percentage } = req.body;

    await db.execute(`
      UPDATE services 
      SET name = ?, base_price = ?, description = ?, discount_percentage = ?
      WHERE id = ?
    `, [name, base_price, description, discount_percentage, id]);

    res.json({ message: 'Service updated successfully' });
  } catch (error) {
    console.error('Update service error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updatePackage = async (req, res) => {
  try {
    const { id } = req.params;
    const { package_name, price, description } = req.body;

    await db.execute(`
      UPDATE service_packages 
      SET package_name = ?, price = ?, description = ?
      WHERE id = ?
    `, [package_name, price, description, id]);

    res.json({ message: 'Package updated successfully' });
  } catch (error) {
    console.error('Update package error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};