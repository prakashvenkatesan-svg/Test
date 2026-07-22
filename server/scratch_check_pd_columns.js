const pool = require("./config/db");

async function check() {
  try {
    const res = await pool.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'personal_details'
    `);
    console.log("Columns in personal_details:", res.rows.map(r => r.column_name));
  } catch (err) {
    console.error(err);
  } finally {
    pool.end();
  }
}

check();
