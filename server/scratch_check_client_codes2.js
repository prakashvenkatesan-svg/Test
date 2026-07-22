const pool = require("./config/db");

async function check() {
  try {
    const dataRes = await pool.query(`
      SELECT * FROM public.client_codes WHERE pan_number = 'PHQPK0909C'
    `);
    console.log("Data for PAN PHQPK0909C:", dataRes.rows);
  } catch (err) {
    console.error(err);
  } finally {
    pool.end();
  }
}

check();
