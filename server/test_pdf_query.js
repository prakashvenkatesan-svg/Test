const { fetchApplicationForPdf } = require('./pdf-flow/queries/pdfApplicationQuery');
const { ensureClientCode } = require('./services/clientCodeService');
const pool = require('./config/db');

async function test() {
  try {
    const res = await pool.query('SELECT id FROM kyc_applications ORDER BY id DESC LIMIT 1');
    if (res.rows.length === 0) {
      console.log('No applications found');
      return;
    }
    const id = res.rows[0].id;
    console.log("Application ID:", id);

    // This should now generate the client code
    const newCode = await ensureClientCode(id);
    console.log("Ensured Client Code:", newCode);

    // Fetch PDF Application details
    const app = await fetchApplicationForPdf(id);
    
    console.log("Client Code Details from Query:", JSON.stringify(app.client_code_details, null, 2));
    
  } catch(e) {
    console.error(e);
  } finally {
    pool.end();
  }
}
test();
