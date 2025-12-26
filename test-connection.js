// test-connection.js
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function testConnection() {
  try {
    const client = await pool.connect();
    console.log('✅ Database connected successfully!');
    const res = await client.query('SELECT NOW()');
    console.log('Current time:', res.rows[0]);
    client.release();
  } catch (err) {
    console.error('❌ Database connection failed:', err.message);
  } finally {
    await pool.end();
  }
}

testConnection();
