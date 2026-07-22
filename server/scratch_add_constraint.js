const pool = require("./config/db");

async function check() {
  try {
    const res = await pool.query(`
      ALTER TABLE public.techexcel ADD CONSTRAINT techexcel_client_id_key UNIQUE ("Client_id");
    `);
    console.log("Added unique constraint successfully!");
  } catch (err) {
    console.error(err);
  } finally {
    pool.end();
  }
}

check();
