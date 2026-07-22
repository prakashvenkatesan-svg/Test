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
    await pool.query("ALTER TABLE public.kyc_applications DROP CONSTRAINT IF EXISTS check_selected_scheme;");
    await pool.query("ALTER TABLE public.kyc_applications ADD CONSTRAINT check_selected_scheme CHECK (selected_scheme IS NULL OR selected_scheme IN ('lifeTime', 'annualCare', 'testing'));");
    console.log("Database constraint updated successfully.");
  } catch (e) {
    console.error(e);
  } finally {
    pool.end();
  }
}
run();
