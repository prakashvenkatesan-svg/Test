const { exportApplicationToTechexcel } = require("./services/techexcelExportService");
const pool = require("./config/db");

async function pushTest() {
  try {
    // Find application ID for K100002
    const res = await pool.query(`
      SELECT ka.id 
      FROM public.kyc_applications ka
      LEFT JOIN public.identity_verifications iv ON iv.application_id = ka.id
      LEFT JOIN public.client_codes cc ON cc.pan_number = iv.pan_number
      WHERE cc.client_code = 'K100002' OR ka.client_code = 'K100002'
      LIMIT 1
    `);
    
    if (res.rows.length === 0) {
      console.log("No application found for K100002");
      return;
    }

    const appId = res.rows[0].id;
    console.log(`Found application ID ${appId} for K100002. Exporting...`);
    
    await exportApplicationToTechexcel(appId);
    console.log("Export successful!");
    
    const techexcelRes = await pool.query(`SELECT * FROM public.techexcel WHERE "Client_id" = 'K100002'`);
    console.log("Techexcel data inserted:", techexcelRes.rows[0]);

  } catch (err) {
    console.error("Error during push:", err);
  } finally {
    pool.end();
  }
}

pushTest();
