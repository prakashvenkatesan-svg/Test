const pool = require("./config/db");

async function check() {
  try {
    const res = await pool.query(`
      SELECT iv.full_name, iv.dob, pd.father_name, iv.gender
      FROM public.kyc_applications ka
      LEFT JOIN public.identity_verifications iv ON iv.application_id = ka.id
      LEFT JOIN public.personal_details pd ON pd.application_id = ka.id
      WHERE iv.pan_number = 'PHQPK0909C'
    `);
    console.log("User data:", res.rows);
  } catch (err) {
    console.error(err);
  } finally {
    pool.end();
  }
}

check();
