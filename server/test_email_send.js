const nodemailer = require("nodemailer");
require('dotenv').config();
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: String(process.env.SMTP_SECURE || "false") === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: {
    rejectUnauthorized: false
  }
});
transporter.sendMail({
  from: process.env.MAIL_FROM,
  to: 'prakash.venkatesan@aionioncapital.com',
  subject: 'Test Email OTP from Script',
  text: 'This is a test email to verify OTP delivery.'
}).then(info => console.log('Mail sent:', info.messageId)).catch(e => console.error('Send Error:', e));
