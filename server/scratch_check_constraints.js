const pool = require("./config/db");

async function check() {
  try {
    const res = await pool.query(`
      SELECT conname, conkey, pg_get_constraintdef(c.oid)
      FROM pg_constraint c
      JOIN pg_class t ON c.conrelid = t.oid
      WHERE t.relname = 'techexcel'
    `);
    console.log("Constraints on techexcel:", res.rows);
  } catch (err) {
    console.error(err);
  } finally {
    pool.end();
  }
}

check();
