import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const pool = mysql.createPool({
  host: process.env.MYSQLHOST || 'mysql-production-9548.up.railway.app',
  port: parseInt(process.env.MYSQLPORT || '3306'), // or 3366 based on what works
  user: process.env.MYSQLUSER || 'root',
  password: process.env.MYSQLPASSWORD || 'RvLywKsDS1JfpWqnTQeG0AWhFXtCfYos', // verify exact password
  database: process.env.MYSQLDATABASE || 'railway',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  connectTimeout: 120000,
  ssl: {
    rejectUnauthorized: false // Railway's public MySQL might need this
  }
});

// Test connection with better error handling
const testConnection = async () => {
  let retries = 3;
  while (retries > 0) {
    try {
      console.log(`Connection attempt ${4 - retries}...`);
      const connection = await pool.getConnection();
      console.log('✓ Database connected successfully!');
      
      const [rows] = await connection.query('SELECT 1 as test');
      console.log('✓ Test query successful');
      
      connection.release();
      return;
    } catch (err) {
      console.error(`Connection attempt failed:`, err.code);
      retries--;
      if (retries > 0) {
        console.log(`Retrying in 5 seconds...`);
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }
  }
  console.error('Failed to connect after all retries');
};

// Start connection test after delay
setTimeout(testConnection, 3000);

export default pool;