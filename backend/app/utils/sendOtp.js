/**
 * utils/sendOtp.js
 *
 * ULTIMATE OPTIMIZED SMTP FOR GMAIL ON RENDER
 */

const nodemailer = require('nodemailer');
const crypto     = require('crypto');
const dns        = require('dns');

// ── FORCE IPv4 PRIORITY AT THE OS LEVEL ──────────────────────────────────
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder('ipv4first');
}

/**
 * Using the 'service: gmail' abstraction is the most reliable way 
 * to handle Gmail's dynamic IP and port requirements on cloud hosts.
 */
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  // CRITICAL: Strictly force IPv4 to avoid ENETUNREACH on Render
  family: 4,
  connectionTimeout: 30000,
  greetingTimeout: 30000,
  socketTimeout: 30000,
  tls: {
    // Ensures the connection is not dropped due to local certificate issues
    rejectUnauthorized: false
  }
});

/**
 * Generate a 6-digit OTP
 */
const generateOtp = () => {
  return crypto.randomInt(100000, 999999).toString();
};

/**
 * Send OTP with maximized reliability
 */
const sendOtpEmail = async (email) => {
  const otp = generateOtp();
  const subject = '🔐 Your AuroraJewels Login OTP';
  const html = `
    <div style="font-family: sans-serif; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
      <h2 style="color: #1a1a2e;">Aurora Jewels</h2>
      <p>Use the code below to log in:</p>
      <h1 style="letter-spacing: 5px; color: #d4af37;">${otp}</h1>
      <p style="color: #888; font-size: 12px;">Valid for 5 minutes.</p>
    </div>
  `;

  try {
    console.log(`🔌 Attempting to send OTP to ${email} via Gmail Service...`);
    
    await transporter.sendMail({
      from: `"Aurora Jewels" <${process.env.EMAIL_USER}>`,
      to: email,
      subject,
      html,
    });

    console.log(`✅ OTP Email sent successfully!`);
    return otp;
  } catch (err) {
    console.error(`❌ Gmail Service Error: ${err.message}`);
    
    // Check for common App Password issues
    if (err.message.includes('Invalid login')) {
      throw new Error('Email auth failed: Check your Google App Password');
    }
    
    throw new Error(`Connection Error: ${err.message}`);
  }
};

module.exports = { sendOtpEmail, generateOtp };
