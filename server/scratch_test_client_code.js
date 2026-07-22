const { generateClientCodeAfterPayment } = require('./controllers/clientCodeController');
const pool = require('./config/db');

async function testGenerate() {
  const req = {
    body: {
      email: 'test_generate@example.com',
      panNumber: 'ABCDE1234F',
      application_id: 999
    }
  };
  
  const res = {
    status: (code) => ({
      json: (data) => console.log(`Status: ${code}, Data:`, data)
    })
  };
  
  try {
    await generateClientCodeAfterPayment(req, res);
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

testGenerate().catch(console.error);
