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

async function run() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS public.live_photo_tokens (
        id SERIAL PRIMARY KEY,
        application_id INTEGER NOT NULL REFERENCES public.kyc_applications(id) ON DELETE CASCADE,
        token VARCHAR(255) UNIQUE NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        is_used BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log("Table live_photo_tokens created successfully.");
  } catch (e) {
    console.error(e);
  } finally {
    pool.end();
  }
}
run();
