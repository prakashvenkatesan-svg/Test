const pool = require('./config/db');

async function run() {
  try {
    const result = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'kyc_applications';
    `);
    console.log(result.rows.map(r => r.column_name).join(', '));
  } catch (error) {
    console.error(error);
  } finally {
    pool.end();
  }
}
run();
