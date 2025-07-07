import db from '../config/database.js';

export const getDashboardStats = async (req, res) => {
  try {
    // Get current month stats
    const currentMonth = new Date().toISOString().slice(0, 7);

    // Total bookings this month
    const [monthlyBookings] = await db.execute(`
      SELECT COUNT(*) as count, SUM(total_price) as revenue
      FROM bookings
      WHERE DATE_FORMAT(created_at, '%Y-%m') = ?
    `, [currentMonth]);

    // Bookings by service
    const [serviceStats] = await db.execute(`
      SELECT s.name as service, COUNT(b.id) as count
      FROM bookings b
      JOIN services s ON b.service_id = s.id
      WHERE DATE_FORMAT(b.created_at, '%Y-%m') = ?
      GROUP BY s.id, s.name
    `, [currentMonth]);

    // Pending bookings count
    const [pendingCount] = await db.execute(
      'SELECT COUNT(*) as count FROM bookings WHERE status = "pending"'
    );

    res.json({
      monthlyRevenue: monthlyBookings[0].revenue || 0,
      monthlyBookingsCount: monthlyBookings[0].count || 0,
      pendingBookings: pendingCount[0].count || 0,
      serviceStats
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getMonthlyRevenue = async (req, res) => {
  try {
    const { year } = req.query;
    const queryYear = year || new Date().getFullYear();

    const [revenue] = await db.execute(`
      SELECT 
        DATE_FORMAT(created_at, '%Y-%m') as month,
        SUM(total_price) as revenue,
        COUNT(*) as bookings
      FROM bookings
      WHERE YEAR(created_at) = ? AND status != 'cancelled'
      GROUP BY DATE_FORMAT(created_at, '%Y-%m')
      ORDER BY month
    `, [queryYear]);

    res.json(revenue);
  } catch (error) {
    console.error('Get monthly revenue error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};