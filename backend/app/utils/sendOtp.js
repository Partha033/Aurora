/**
 * utils/sendOtp.js
 *
 * ULTIMATE FAIL-SAFE SMTP FOR GMAIL ON RENDER
 */

const nodemailer = require('nodemailer');
const crypto     = require('crypto');
const dns        = require('dns');

// ── FORCE GOOGLE DNS & IPv4 ──────────────────────────────────────────────
if (dns.setServers) {
  dns.setServers(['8.8.8.8', '8.8.4.4']);
}
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder('ipv4first');
}

/**
 * Optimized Port 587 configuration. 
 * Many cloud providers allow 587 but transparently proxy it.
 */
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, // TLS
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  // CRITICAL: Low-level socket override
  lookup: (hostname, options, callback) => {
    dns.lookup(hostname, { family: 4 }, callback);
  },
  connectionTimeout: 40000, // 40 seconds
  greetingTimeout: 40000,
  socketTimeout: 40000,
  family: 4,
  tls: {
    servername: 'smtp.gmail.com',
    rejectUnauthorized: false,
    minVersion: 'TLSv1.2'
  }
});

const generateOtp = () => {
  return crypto.randomInt(100000, 999999).toString();
};

const sendOtpEmail = async (email) => {
  const otp = generateOtp();
  const subject = '🔐 Your AuroraJewels Login OTP';
  const html = `
    <div style="padding:20px; font-family: sans-serif;">
      <h2>OTP: <span style="color:#d4af37">${otp}</span></h2>
      <p>Valid for 5 minutes.</p>
    </div>
  `;

  try {
    console.log(`🔌 Attempting SMTP Port 587 (IPv4 Forced) to ${email}...`);
    
    await transporter.sendMail({
      from: `"Aurora Jewels" <${process.env.EMAIL_USER}>`,
      to: email,
      subject,
      html,
    });

    console.log(`✅ OTP sent successfully!`);
    return otp;
  } catch (err) {
    console.error(`❌ SMTP Error: ${err.message}`);
    
    // FAIL-SAFE: If email fails, log the OTP to the console so YOU can still log in
    console.log(`-----------------------------------------`);
    console.log(`EMERGENCY OTP FOR ${email}: ${otp}`);
    console.log(`-----------------------------------------`);
    
    throw new Error(`Email failed: ${err.message}. Check Render logs for emergency OTP.`);
  }
};

module.exports = { sendOtpEmail, generateOtp };
