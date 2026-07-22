const { exportApplicationToTechexcel } = require("./services/techexcelExportService");
const pool = require("./config/db");

async function check() {
  try {
    // kyc_applications doesn't have pan_number directly, we have to join
    const res = await pool.query(`
      SELECT ka.id 
      FROM public.kyc_applications ka
      JOIN public.identity_verifications iv ON iv.application_id = ka.id
      WHERE iv.pan_number = 'PHQPK0909C' LIMIT 1
    `);
    
    if (res.rows.length > 0) {
      await exportApplicationToTechexcel(res.rows[0].id);
      
      const techexcelRes = await pool.query(\`SELECT * FROM public.techexcel WHERE "Client_id" = 'K100002'\`);
      console.log("Techexcel row for K100002 found:", techexcelRes.rows.length > 0);
    }
  } catch (err) {
    console.error(err);
  } finally {
    pool.end();
  }
}

check();
