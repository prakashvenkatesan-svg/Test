const pool = require("./config/db");

async function check() {
  try {
    let res = await pool.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'kyc_applications'
    `);
    console.log("Columns in kyc_applications:", res.rows.map(r => r.column_name));
    
    res = await pool.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'identity_verifications'
    `);
    console.log("Columns in identity_verifications:", res.rows.map(r => r.column_name));
    
    res = await pool.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'contact_details'
    `);
    console.log("Columns in contact_details:", res.rows.map(r => r.column_name));
  } catch (err) {
    console.error(err);
  } finally {
    pool.end();
  }
}

check();
