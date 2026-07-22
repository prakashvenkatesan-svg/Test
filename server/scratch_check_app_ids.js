const pool = require('./config/db');
pool.query(`SELECT application_id FROM identity_verifications WHERE pan_number = 'CTDPA9166M'`)
  .then(res => console.log('App IDs:', res.rows))
  .catch(console.error)
  .finally(() => pool.end());
