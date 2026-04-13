/**
 * utils/sendOtp.js
 *
 * Generates a cryptographically random 6-digit OTP and sends it
 * via Nodemailer (Gmail SMTP with App Password).
 *
 * Setup: https://myaccount.google.com/apppasswords
 */

const nodemailer = require('nodemailer');
const crypto     = require('crypto');

// ── Transporter (created once, reused) ─────────────────────────────────────
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    // Helps with some connection issues in restricted environments
    rejectUnauthorized: false,
  },
});

// Verify transporter on startup (logs warning if creds are missing)
transporter.verify((error) => {
  if (error) {
    console.error('❌ Email transporter error — check EMAIL_USER / EMAIL_PASS in .env');
    console.error(`Reason: ${error.message}`);
  } else {
    console.log('📧 Email transporter ready (Gmail)');
  }
});

// ── OTP Generator ───────────────────────────────────────────────────────────
/**
 * Generate a secure random 6-digit OTP string.
 * Uses crypto.randomInt for true randomness (not Math.random).
 * @returns {string} e.g. "047821"
 */
const generateOtp = () => {
  return crypto.randomInt(100000, 999999).toString();
};

// ── Email Template ───────────────────────────────────────────────────────────
const buildOtpEmail = (otp) => ({
  subject: '🔐 Your AuroraJewels Login OTP',
  html: `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <style>
        body { font-family: 'Helvetica Neue', Arial, sans-serif; background: #f8f4f0; margin: 0; padding: 0; }
        .container { max-width: 480px; margin: 40px auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
        .header { background: linear-gradient(135deg, #1a1a2e 0%, #4a0e3b 100%); padding: 32px 24px; text-align: center; }
        .header h1 { color: #d4af37; font-size: 26px; margin: 0; letter-spacing: 2px; }
        .header p  { color: #e8d5b5; margin: 6px 0 0; font-size: 13px; }
        .body { padding: 32px 32px 24px; }
        .body p { color: #555; line-height: 1.7; }
        .otp-box { background: #f8f4f0; border: 2px dashed #d4af37; border-radius: 10px; text-align: center; padding: 20px 0; margin: 24px 0; }
        .otp-code { font-size: 42px; font-weight: 800; letter-spacing: 10px; color: #1a1a2e; }
        .otp-hint { font-size: 13px; color: #999; margin-top: 6px; }
        .warning  { font-size: 12px; color: #e74c3c; margin-top: 16px; }
        .footer   { background: #f8f4f0; text-align: center; padding: 16px; font-size: 11px; color: #aaa; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>✦ Aurora Jewels</h1>
          <p>Exquisite jewelry, effortlessly yours</p>
        </div>
        <div class="body">
          <p>Hello,</p>
          <p>Use the One-Time Password below to log in to your Aurora Jewels account.</p>
          <div class="otp-box">
            <div class="otp-code">${otp}</div>
            <div class="otp-hint">Valid for 5 minutes</div>
          </div>
          <p class="warning">
            ⚠️ Never share this OTP with anyone — including Aurora Jewels support.
            If you did not request this, please ignore this email.
          </p>
        </div>
        <div class="footer">
          © ${new Date().getFullYear()} Aurora Jewels. All rights reserved.
        </div>
      </div>
    </body>
    </html>
  `,
});

// ── Main Export ──────────────────────────────────────────────────────────────
/**
 * Generate and send an OTP to the given email address.
 * @param {string} email  - Recipient email
 * @returns {string}      - The plain OTP (to be hashed and stored by caller)
 * @throws                - If email send fails
 */
const sendOtpEmail = async (email) => {
  const otp = generateOtp();
  const { subject, html } = buildOtpEmail(otp);

  try {
    const info = await transporter.sendMail({
      from: `"Aurora Jewels" <${process.env.EMAIL_USER}>`,
      to:   email,
      subject,
      html,
    });
    console.log(`✅ OTP Email sent to: ${email} (Info: ${info.response})`);
    return otp;
  } catch (err) {
    console.error(`❌ sendOtpEmail failure: ${err.message}`);
    // If we're missing credentials, provide a specific warning
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      throw new Error('Email credentials missing in .env (EMAIL_USER / EMAIL_PASS)');
    }
    throw err; // Propagate to controller
  }
};

module.exports = { sendOtpEmail, generateOtp };
