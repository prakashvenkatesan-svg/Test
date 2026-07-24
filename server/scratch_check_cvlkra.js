const pool = require("./config/db");

async function checkApp() {
  try {
    const res = await pool.query(`
      SELECT 
        k.id, 
        c.id as cvlkra_id, 
        c.app_pan_no,
        c.aadhaar_xml_s3_key
      FROM kyc_applications k
      LEFT JOIN cvlkra_data c ON c.application_id = k.id
      WHERE k.id IN (116, 124, 126, 127)
    `);
    console.log(res.rows);
  } catch (err) {
    console.error(err);
  } finally {
    pool.end();
  }
}

checkApp();
