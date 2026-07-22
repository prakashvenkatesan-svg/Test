const pool = require('./config/db');
pool.query(`SELECT * FROM client_codes WHERE pan_number = 'BLAPV5840H' OR email = 'prakash.venkatesan@aionioncapital.com'`)
  .then(res => console.log('Client Codes for app 54:', res.rows))
  .catch(console.error)
  .finally(() => pool.end());
