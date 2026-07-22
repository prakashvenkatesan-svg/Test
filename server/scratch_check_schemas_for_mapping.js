const pool = require("./config/db");

async function check() {
  try {
    const tables = [
      'kyc_applications',
      'personal_details',
      'contact_details',
      'identity_verifications',
      'bank_details',
      'nominee_details'
    ];
    
    for (const table of tables) {
      const res = await pool.query(`
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_name = $1
      `, [table]);
      console.log(`Columns in ${table}:`, res.rows.map(r => r.column_name).join(', '));
    }
  } catch (err) {
    console.error(err);
  } finally {
    pool.end();
  }
}

check();
