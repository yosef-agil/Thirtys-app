import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

console.log('Database Config:', {
  host: process.env.MYSQLHOST,
  port: process.env.MYSQLPORT,
  user: process.env.MYSQLUSER,
  database: process.env.MYSQLDATABASE,
  // Jangan log password
});

const pool = mysql.createPool({
  host: process.env.MYSQLHOST || 'localhost',
  port: parseInt(process.env.MYSQLPORT || '3306'),
  user: process.env.MYSQLUSER || 'root',
  password: process.env.MYSQLPASSWORD || '',
  database: process.env.MYSQLDATABASE || 'railway',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  connectTimeout: 60000,
  // Tambahan untuk debugging
  ssl: {
    rejectUnauthorized: false
  }
});

// Test connection
const testConnection = async () => {
  try {
    console.log('Attempting to connect to database...');
    const connection = await pool.getConnection();
    console.log('Database connected successfully!');
    
    // Test query
    const [rows] = await connection.query('SELECT 1');
    console.log('Test query successful:', rows);
    
    connection.release();
  } catch (err) {
    console.error('Database connection failed:', {
      message: err.message,
      code: err.code,
      errno: err.errno,
      syscall: err.syscall,
      hostname: err.hostname
    });
  }
};

// Delay connection test untuk Railway
setTimeout(testConnection, 5000);

export default pool;