/**
 * utils/sendOtp.js
 *
 * Generates a cryptographically random 6-digit OTP and sends it
 * via Nodemailer (Gmail SMTP with App Password).
 */

const nodemailer = require('nodemailer');
const crypto     = require('crypto');
const dns        = require('dns');

// ── FORCE IPv4 PRIORITY GLOBALLY ───────────────────────────────────────────
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder('ipv4first');
}

/**
 * Creates a transporter with strict IPv4 settings.
 * @param {number} port - 587 or 465
 * @returns {object}
 */
const createTransporter = (port) => {
  const isSecure = port === 465;
  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: port,
    secure: isSecure,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    // CRITICAL: Force IPv4 for the SMTP connection
    lookup: (hostname, options, callback) => {
      dns.lookup(hostname, { family: 4 }, callback);
    },
    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 15000,
    family: 4, 
    tls: {
      rejectUnauthorized: false,
      minVersion: 'TLSv1.2'
    },
  });
};

// Default to Port 587 (Standard for Cloud)
let transporter = createTransporter(587);

/**
 * Generate a secure random 6-digit OTP string.
 */
const generateOtp = () => {
  return crypto.randomInt(100000, 999999).toString();
};

/**
 * Send OTP with automatic Port Fallback (587 -> 465)
 */
const sendOtpEmail = async (email) => {
  const otp = generateOtp();
  const subject = '🔐 Your AuroraJewels Login OTP';
  const html = `
    <div style="font-family: Arial, sans-serif; padding: 20px; background: #f8f4f0;">
      <h2 style="color: #1a1a2e;">✦ Aurora Jewels</h2>
      <p>Your OTP for login is:</p>
      <div style="font-size: 32px; font-weight: bold; letter-spacing: 5px; padding: 10px; border: 2px dashed #d4af37; display: inline-block;">
        ${otp}
      </div>
      <p style="color: #666; font-size: 12px; margin-top: 20px;">Valid for 5 minutes. Do not share this code.</p>
    </div>
  `;

  try {
    // Try sending with current transporter (initially 587)
    const info = await transporter.sendMail({
      from: `"Aurora Jewels" <${process.env.EMAIL_USER}>`,
      to: email,
      subject,
      html,
    });
    console.log(`✅ OTP sent via Port 587/IPv4`);
    return otp;
  } catch (err) {
    console.warn(`⚠️ Port 587 failed, attempting fallback to Port 465...`);
    
    try {
      // Fallback to Port 465
      const fallbackTransporter = createTransporter(465);
      const info = await fallbackTransporter.sendMail({
        from: `"Aurora Jewels" <${process.env.EMAIL_USER}>`,
        to: email,
        subject,
        html,
      });
      console.log(`✅ OTP sent via Fallback Port 465/IPv4`);
      // Update the main transporter for future calls
      transporter = fallbackTransporter;
      return otp;
    } catch (fallbackErr) {
      console.error(`❌ All SMTP ports failed (587 & 465)`);
      throw new Error(`Email failed: ${fallbackErr.message}`);
    }
  }
};

module.exports = { sendOtpEmail, generateOtp };
