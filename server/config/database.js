import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// Debugging - tampilkan semua env yang terkait database
console.log('Environment Variables:', {
  host: process.env.MYSQLHOST || process.env.DB_HOST,
  port: process.env.MYSQLPORT || process.env.DB_PORT,
  database: process.env.MYSQLDATABASE || process.env.DB_NAME,
  user: process.env.MYSQLUSER || process.env.DB_USER,
  password: process.env.MYSQLPASSWORD || process.env.DB_PASSWORD
});

const pool = mysql.createPool({
  host: process.env.MYSQLHOST || process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.MYSQLPORT || process.env.DB_PORT || '3306'),
  user: process.env.MYSQLUSER || process.env.DB_USER || 'root',
  password: process.env.MYSQLPASSWORD || process.env.DB_PASSWORD || '',
  database: process.env.MYSQLDATABASE || process.env.DB_NAME || 'railway',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  connectTimeout: 60000,
  ssl: process.env.NODE_ENV === 'production' ? { 
    rejectUnauthorized: false,
    ca: process.env.MYSQL_SSL_CA // Jika diperlukan
  } : null
});

// Test connection dengan error handling lebih baik
const testConnection = async () => {
  let connection;
  try {
    connection = await pool.getConnection();
    console.log('✅ Database connected successfully!');
    
    // Test query sederhana
    const [rows] = await connection.query('SELECT 1 + 1 AS result');
    console.log('Test query result:', rows[0].result);
    
  } catch (err) {
    console.error('❌ Database connection failed:', err);
    
    // Detail error untuk debugging
    if (err.code === 'ETIMEDOUT') {
      console.error('Error: Connection timeout, periksa host dan port');
    } else if (err.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('Error: Credential salah, periksa username/password');
    } else if (err.code === 'ENOTFOUND') {
      console.error('Error: Host tidak ditemukan, periksa MYSQLHOST');
    }
    
    process.exit(1); // Keluar dari proses jika koneksi gagal
  } finally {
    if (connection) connection.release();
  }
};

testConnection();

export default pool;