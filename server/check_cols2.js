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
pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'personal_details';")
  .then(res => { console.log(res.rows.map(r => r.column_name).join(', ')); pool.end(); })
  .catch(err => { console.error(err); pool.end(); });
