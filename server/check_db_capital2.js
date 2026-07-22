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

async function check() {
  try {
    const res = await pool.query("SELECT COUNT(*) FROM public.stamp_paper_master WHERE status = 'AVAILABLE'");
    console.log("AVAILABLE stamp papers:", res.rows[0].count);
  } catch(e) {
    console.error(e);
  } finally {
    pool.end();
  }
}
check();
