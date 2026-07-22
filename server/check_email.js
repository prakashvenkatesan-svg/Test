const { Pool } = require('pg');
require('dotenv').config();
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT || 5432,
  ssl: { rejectUnauthorized: false }
});
pool.query("SELECT email, created_at FROM email_otp_sessions ORDER BY created_at DESC LIMIT 1;")
  .then(res => { console.log('Latest OTP requested for:', res.rows[0].email, 'at', res.rows[0].created_at); pool.end(); })
  .catch(err => { console.error(err); pool.end(); });
