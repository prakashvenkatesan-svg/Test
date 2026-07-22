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

async function reset() {
  try {
    const res = await pool.query("UPDATE public.stamp_paper_master SET status = 'AVAILABLE', assigned_application_id = NULL, assigned_at = NULL, used_at = NULL");
    console.log("Updated rows:", res.rowCount);
  } catch(e) {
    console.error(e);
  } finally {
    pool.end();
  }
}
reset();
