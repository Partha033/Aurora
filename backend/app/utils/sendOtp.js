/**
 * utils/sendOtp.js
 *
 * ULTIMATE FAIL-SAFE SMTP FOR RENDER
 */

const nodemailer = require('nodemailer');
const crypto     = require('crypto');
const dns        = require('dns');

// ── FORCE IPv4 PRIORITY ──────────────────────────────────────────────────
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder('ipv4first');
}

/**
 * Creates a transporter optimized for Render's restrictive network.
 * Port 465 is often MORE stable on cloud providers.
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
    // CRITICAL: Force IPv4 and skip DNS if possible
    lookup: (hostname, options, callback) => {
      dns.lookup(hostname, { family: 4 }, callback);
    },
    connectionTimeout: 30000, // 30 seconds for cold starts
    greetingTimeout: 30000,
    socketTimeout: 30000,
    family: 4, 
    tls: {
      rejectUnauthorized: false,
      minVersion: 'TLSv1.2',
      servername: 'smtp.gmail.com'
    },
    // Enable debugging for logs
    debug: true,
    logger: true
  });
};

/**
 * Generate a 6-digit OTP
 */
const generateOtp = () => {
  return crypto.randomInt(100000, 999999).toString();
};

/**
 * Main send function with Port 465 Primary strategy
 */
const sendOtpEmail = async (email) => {
  const otp = generateOtp();
  const subject = '🔐 Your AuroraJewels Login OTP';
  const html = `<div style="padding:20px; background:#f8f4f0;"><h2>OTP: ${otp}</h2></div>`;

  // Start with Port 465 (usually more stable on Render)
  let portsToTry = [465, 587];
  
  for (const port of portsToTry) {
    try {
      console.log(`🔌 Attempting SMTP connection via Port ${port}...`);
      const transporter = createTransporter(port);
      await transporter.sendMail({
        from: `"Aurora Jewels" <${process.env.EMAIL_USER}>`,
        to: email,
        subject,
        html,
      });
      console.log(`✅ OTP sent successfully via Port ${port}`);
      return otp;
    } catch (err) {
      console.warn(`⚠️ Port ${port} failed: ${err.message}`);
      if (port === portsToTry[portsToTry.length - 1]) {
        console.error(`❌ ALL PORTS FAILED. Please check EMAIL_PASS on Render.`);
        throw new Error(`SMTP Failure: ${err.message}`);
      }
    }
  }
};

module.exports = { sendOtpEmail, generateOtp };
