const { generateHash } = require('./controllers/paymentController');

const req = {
  body: {
    application_id: 1,
    txnid: "TXN" + Date.now(),
    amount: "1.18",
    firstname: "Client",
    email: "test@gmail.com",
    phone: "9999999999",
    productinfo: "Trading and Demat Account Opening"
  },
  get: (header) => header === 'host' ? 'localhost:5000' : null,
  secure: false
};

const res = {
  json: (data) => {
    console.log("SUCCESS:", data);
    process.exit(0);
  },
  status: (code) => {
    console.log("STATUS:", code);
    return res;
  }
};

require('dotenv').config();
generateHash(req, res).catch(err => console.error("FATAL ERROR:", err));
