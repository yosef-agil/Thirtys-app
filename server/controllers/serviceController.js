import db from '../config/database.js';

// Services CRUD
export const getAllServices = async (req, res) => {
  try {
    const [services] = await db.execute('SELECT * FROM services ORDER BY created_at DESC');
    res.json(services);
  } catch (error) {
    console.error('Get services error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getServiceById = async (req, res) => {
  try {
    const { id } = req.params;
    const [services] = await db.execute('SELECT * FROM services WHERE id = ?', [id]);
    
    if (services.length === 0) {
      return res.status(404).json({ error: 'Service not found' });
    }
    
    res.json(services[0]);
  } catch (error) {
    console.error('Get service by ID error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createService = async (req, res) => {
  try {
    const { name, base_price, description, has_time_slots, discount_percentage } = req.body;
    
    if (!name || !base_price) {
      return res.status(400).json({ error: 'Name and base price are required' });
    }
    
    const [result] = await db.execute(
      'INSERT INTO services (name, base_price, description, has_time_slots, discount_percentage) VALUES (?, ?, ?, ?, ?)',
      [name, base_price, description, has_time_slots || false, discount_percentage || 0]
    );
    
    res.status(201).json({
      id: result.insertId,
      name,
      base_price,
      description,
      has_time_slots,
      discount_percentage
    });
  } catch (error) {
    console.error('Create service error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateService = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, base_price, description, has_time_slots, discount_percentage } = req.body;
    
    if (!name || !base_price) {
      return res.status(400).json({ error: 'Name and base price are required' });
    }
    
    const [result] = await db.execute(
      'UPDATE services SET name = ?, base_price = ?, description = ?, has_time_slots = ?, discount_percentage = ? WHERE id = ?',
      [name, base_price, description, has_time_slots || false, discount_percentage || 0, id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Service not found' });
    }
    
    res.json({ message: 'Service updated successfully' });
  } catch (error) {
    console.error('Update service error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteService = async (req, res) => {
  try {
    const { id } = req.params;
    
    const [result] = await db.execute('DELETE FROM services WHERE id = ?', [id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Service not found' });
    }
    
    res.json({ message: 'Service deleted successfully' });
  } catch (error) {
    console.error('Delete service error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Time Slots
export const getTimeSlots = async (req, res) => {
  try {
    const { serviceId } = req.params;
    const { date } = req.query;
    
    if (!date) {
      return res.status(400).json({ error: 'Date parameter is required' });
    }
    
    const [slots] = await db.execute(
      'SELECT * FROM time_slots WHERE service_id = ? AND date = ? AND is_booked = FALSE ORDER BY start_time',
      [serviceId, date]
    );
    
    res.json(slots);
  } catch (error) {
    console.error('Get time slots error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Service Packages CRUD
export const getAllPackages = async (req, res) => {
  try {
    const [packages] = await db.execute(`
      SELECT sp.*, s.name as service_name 
      FROM service_packages sp 
      JOIN services s ON sp.service_id = s.id 
      ORDER BY s.name, sp.package_name
    `);
    res.json(packages);
  } catch (error) {
    console.error('Get packages error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getPackagesByService = async (req, res) => {
  try {
    const { serviceId } = req.params;
    const [packages] = await db.execute(
      'SELECT * FROM service_packages WHERE service_id = ? ORDER BY package_name',
      [serviceId]
    );
    res.json(packages);
  } catch (error) {
    console.error('Get packages by service error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createPackage = async (req, res) => {
  try {
    const { service_id, package_name, price, description } = req.body;
    
    if (!service_id || !package_name || !price) {
      return res.status(400).json({ error: 'Service ID, package name, and price are required' });
    }
    
    const [result] = await db.execute(
      'INSERT INTO service_packages (service_id, package_name, price, description) VALUES (?, ?, ?, ?)',
      [service_id, package_name, price, description]
    );
    
    res.status(201).json({
      id: result.insertId,
      service_id,
      package_name,
      price,
      description
    });
  } catch (error) {
    console.error('Create package error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updatePackage = async (req, res) => {
  try {
    const { id } = req.params;
    const { service_id, package_name, price, description } = req.body;
    
    if (!service_id || !package_name || !price) {
      return res.status(400).json({ error: 'Service ID, package name, and price are required' });
    }
    
    const [result] = await db.execute(
      'UPDATE service_packages SET service_id = ?, package_name = ?, price = ?, description = ? WHERE id = ?',
      [service_id, package_name, price, description, id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Package not found' });
    }
    
    res.json({ message: 'Package updated successfully' });
  } catch (error) {
    console.error('Update package error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deletePackage = async (req, res) => {
  try {
    const { id } = req.params;
    
    const [result] = await db.execute('DELETE FROM service_packages WHERE id = ?', [id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Package not found' });
    }
    
    res.json({ message: 'Package deleted successfully' });
  } catch (error) {
    console.error('Delete package error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};