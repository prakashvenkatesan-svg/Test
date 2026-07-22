require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({
  user: process.env.MASTER_DB_USER,
  host: process.env.MASTER_DB_HOST,
  database: process.env.MASTER_DB_NAME,
  password: process.env.MASTER_DB_PASSWORD,
  port: process.env.MASTER_DB_PORT,
  ssl: { rejectUnauthorized: false }
});
pool.query('SELECT stamp_number, image_path, status FROM public.stamp_paper_master WHERE status = \'AVAILABLE\' LIMIT 5').then(res => {
  console.log('Master DB Stamp Papers:');
  console.table(res.rows);
  pool.end();
}).catch(console.error);
