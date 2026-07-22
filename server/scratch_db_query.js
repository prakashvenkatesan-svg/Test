const pool = require("./config/db");

async function check() {
  try {
    const res = await pool.query(`
      SELECT ka.id, ka.client_code, iv.pan_number
      FROM public.kyc_applications ka
      LEFT JOIN public.identity_verifications iv ON iv.application_id = ka.id
      WHERE iv.pan_number = 'PHQPK0909C'
    `);
    console.log("Applications for PAN:", res.rows);
    
    if (res.rows.length > 0) {
      const appId = res.rows[0].id;
      const techexcelExportService = require("./services/techexcelExportService");
      try {
        console.log("Attempting export to techexcel for appId", appId);
        const result = await techexcelExportService.exportApplicationToTechexcel(appId);
        console.log("Export result:", result);
      } catch (err) {
        console.error("Export error:", err);
      }
    }
  } catch (err) {
    console.error(err);
  } finally {
    pool.end();
  }
}

check();
