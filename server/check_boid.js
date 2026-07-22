const { Pool } = require('pg');
require('dotenv').config();
const pool = new Pool({
  user: process.env.MASTER_DB_USER,
  host: process.env.MASTER_DB_HOST,
  database: process.env.MASTER_DB_NAME,
  password: process.env.MASTER_DB_PASSWORD,
  port: process.env.MASTER_DB_PORT || 5432,
  ssl: { rejectUnauthorized: false }
});

async function check() {
  try {
    const res = await pool.query("SELECT * FROM public.boid_master LIMIT 5");
    console.log(res.rows);
  } catch(e) {
    console.error(e);
  } finally {
    pool.end();
  }
}
check();
