const pool = require("./config/db");

async function check() {
  try {
    const res = await pool.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'client_codes'
    `);
    console.log("Columns in client_codes:", res.rows.map(r => r.column_name));

    const dataRes = await pool.query(`
      SELECT * FROM public.client_codes WHERE application_id IN (63, 66)
    `);
    console.log("Data for apps 63, 66:", dataRes.rows);
  } catch (err) {
    console.error(err);
  } finally {
    pool.end();
  }
}

check();
