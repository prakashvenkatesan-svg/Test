const { Pool } = require('pg');
require('dotenv').config();
const pool = new Pool({
  user: process.env.MASTER_DB_USER || process.env.DB_USER,
  host: process.env.MASTER_DB_HOST || process.env.DB_HOST,
  database: process.env.MASTER_DB_NAME || process.env.DB_NAME,
  password: process.env.MASTER_DB_PASSWORD || process.env.DB_PASSWORD,
  port: process.env.MASTER_DB_PORT || process.env.DB_PORT || 5432,
  ssl: { rejectUnauthorized: false }
});

async function check() {
  try {
    const res = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'stamp_paper_master'");
    console.log(res.rows);
  } catch(e) {
    console.error(e);
  } finally {
    pool.end();
  }
}
check();
