// test-mail.js
const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
dotenv.config();

const config = {
  host: process.env.SMTP_HOST || 'smtp-relay.brevo.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_PORT === '465',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
};

console.log('Testing SMTP with config:', {
  ...config,
  auth: { ...config.auth, pass: '****' },
});

const transporter = nodemailer.createTransport(config);

async function testMail() {
  try {
    console.log('Verifying connection...');
    await transporter.verify();
    console.log('✅ SMTP connection successful!');

    console.log('Sending test email...');
    const info = await transporter.sendMail({
      from: `"Test" <${config.auth.user}>`,
      to: config.auth.user,
      subject: 'SMTP Test - Naija Merit',
      text: 'If you see this, SMTP is working!',
    });
    console.log('✅ Email sent successfully:', info.messageId);
  } catch (error) {
    console.error('❌ SMTP test failed:', error);
  }
}

testMail();
