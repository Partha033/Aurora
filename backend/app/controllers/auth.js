const db = require("../models");
const { errorHandlerFunction } = require("../middlewares/error");
const jwt = require('jsonwebtoken');
const { generateAccessToken, setRefreshTokenCookie, clearRefreshTokenCookie } = require('../utils/generateTokens');
const sendEmail = require('../utils/sendEmail');

module.exports = {
  // ── POST /auth/login — Multi-mode Login ────────────────
  login: async (req, res) => {
    try {
      const { email: rawEmail } = req.body;
      if (!rawEmail) return res.clientError({ msg: 'Email is required' });

      const email = rawEmail.trim().toLowerCase();

      // Find or create user
      let user = await db.user.findOne({ email });
      if (!user) {
        user = await db.user.create({ email, name: email.split('@')[0] });
      }

      if (!user.isActive) return res.status(403).json({ success: false, msg: 'Account deactivated' });

      // Admin Flow: Direct login without password
      if (user.role === 'admin') {
        const accessToken = generateAccessToken(user._id);
        setRefreshTokenCookie(res, user._id);
        return res.success({
          msg: 'Admin login successful',
          result: { accessToken, user },
        });
      }

      // User Flow: Send OTP to email
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      
      // Update user with OTP using findByIdAndUpdate to bypass select:false issues
      await db.user.findByIdAndUpdate(user._id, {
        $set: {
          otp: otp,
          otpExpiry: Date.now() + 10 * 60 * 1000 // 10 mins
        }
      });

      console.log(`[AUTH] Sending OTP to ${user.email}: ${otp}`);

      try {
        await sendEmail({
          to: user.email,
          subject: '✦ Your Aurora Jewels Verification Code',
          html: `
            <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #050505; color: #ffffff; padding: 2px; border-radius: 30px; background: linear-gradient(145deg, #c9a84c, #1a1a1a, #c9a84c);">
              <div style="background-color: #050505; border-radius: 28px; overflow: hidden;">
                <!-- Header Section -->
                <div style="padding: 60px 20px 40px; text-align: center; background: radial-gradient(circle at top, #1a1a1a 0%, #050505 100%);">
                  <h1 style="color: #c9a84c; font-size: 32px; letter-spacing: 8px; margin: 0; text-transform: uppercase; font-weight: 200; font-family: 'Georgia', serif;">AURORA JEWELS</h1>
                  <div style="width: 40px; height: 1px; background: #c9a84c; margin: 20px auto; opacity: 0.5;"></div>
                  <p style="color: rgba(201, 168, 76, 0.5); font-size: 10px; letter-spacing: 5px; text-transform: uppercase; margin: 0;">Privé Access</p>
                </div>
                
                <!-- Content Section -->
                <div style="padding: 0 50px 60px; text-align: center;">
                  <p style="font-size: 16px; color: #888; margin-bottom: 40px; font-weight: 300; line-height: 1.8;">
                    Welcome to the inner circle. Use this unique signature code to authenticate your session.
                  </p>
                  
                  <div style="background: linear-gradient(135deg, rgba(201,168,76,0.1) 0%, rgba(201,168,76,0) 100%); border: 1px solid rgba(201,168,76,0.3); padding: 30px; border-radius: 20px; margin-bottom: 40px;">
                    <span style="font-size: 54px; font-weight: 200; letter-spacing: 15px; color: #ffffff; font-family: 'Courier New', Courier, monospace; text-shadow: 0 0 20px rgba(201,168,76,0.3);">${otp}</span>
                  </div>
                  
                  <div style="border-top: 1px solid rgba(255,255,255,0.05); padding-top: 30px; text-align: left;">
                    <p style="font-size: 12px; color: #555; margin: 0; line-height: 1.6;">
                      <span style="color: #c9a84c;">●</span> &nbsp; Code expires in 10 minutes<br>
                      <span style="color: #c9a84c;">●</span> &nbsp; One-time use only<br>
                      <span style="color: #c9a84c;">●</span> &nbsp; Secure encryption active
                    </p>
                  </div>
                </div>
                
                <!-- Footer Section -->
                <div style="background: #000; padding: 30px; text-align: center;">
                  <a href="https://aurora-chi-snowy.vercel.app/" style="color: #333; font-size: 10px; letter-spacing: 3px; margin: 0; text-decoration: none; font-weight: bold;">AURORAJEWELS.COM</a>
                </div>
              </div>
            </div>
          `,
        });
        res.success({ msg: 'OTP sent to your email' });
      } catch (err) {
        console.error('Email send error:', err);
        res.status(500).json({ success: false, msg: 'Failed to send OTP email' });
      }
    } catch (error) {
      errorHandlerFunction(res, error);
    }
  },

  // ── POST /auth/verify-otp — Verify User OTP ────────────────
  verifyOtp: async (req, res) => {
    try {
      const { email, otp } = req.body;
      if (!email || !otp) return res.clientError({ msg: 'Email and OTP are required' });

      const user = await db.user.findOne({ email: email.trim().toLowerCase() }).select('+otp +otpExpiry');

      if (!user) return res.clientError({ msg: 'User not found' });

      if (!user.otp || user.otp !== otp || !user.otpExpiry || user.otpExpiry < Date.now()) {
        return res.clientError({ msg: 'Invalid or expired OTP' });
      }

      // Clear OTP using direct update to bypass ANY hooks that might cause issues
      await db.user.updateOne({ _id: user._id }, {
        $unset: { otp: 1, otpExpiry: 1 }
      });

      const accessToken = generateAccessToken(user._id);
      setRefreshTokenCookie(res, user._id);

      res.success({
        msg: 'Login successful',
        result: { accessToken, user },
      });
    } catch (error) {
      console.error('[AUTH_VERIFY_ERROR]', error);
      errorHandlerFunction(res, error);
    }
  },

  refresh: async (req, res) => {
    try {
      const token = req.cookies?.refreshToken;
      if (!token) return res.status(401).json({ success: false, msg: 'No refresh token' });

      const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
      const user = await db.user.findById(decoded.id);
      if (!user || !user.isActive) return res.status(401).json({ success: false, msg: 'User not found' });

      const accessToken = generateAccessToken(user._id);
      setRefreshTokenCookie(res, user._id);

      res.success({ result: { accessToken, user } });
    } catch (error) {
      errorHandlerFunction(res, error);
    }
  },

  logout: async (req, res) => {
    try {
      clearRefreshTokenCookie(res);
      res.success({ msg: 'Logged out successfully' });
    } catch (error) {
      errorHandlerFunction(res, error);
    }
  },

  getMe: async (req, res) => {
    try {
      res.success({ result: { user: req.user } });
    } catch (error) {
      errorHandlerFunction(res, error);
    }
  },

  updateProfile: async (req, res) => {
    try {
      const { name, phone } = req.body;
      const update = {};
      if (name  !== undefined) update.name  = name.trim();
      if (phone !== undefined) update.phone = phone.trim();

      if (Object.keys(update).length === 0)
        return res.clientError({ msg: 'Nothing to update' });

      const user = await db.user.findByIdAndUpdate(
        req.user._id,
        { $set: update },
        { new: true, runValidators: true }
      );
      res.success({ msg: 'Profile updated', result: { user } });
    } catch (error) {
      errorHandlerFunction(res, error);
    }
  },

  updateAddress: async (req, res) => {
    try {
      const { action, addressId, address } = req.body;
      const userId = req.user._id;

      if (action === 'add') {
        const user = await db.user.findByIdAndUpdate(userId, { $push: { addresses: address } }, { new: true, runValidators: true });
        return res.success({ msg: 'Address added', result: { addresses: user.addresses } });
      } else if (action === 'edit') {
        if (!addressId) return res.clientError({ msg: 'addressId required for edit' });
        const setObj = {};
        for (const key in address) setObj[`addresses.$.${key}`] = address[key];
        const user = await db.user.findOneAndUpdate(
          { _id: userId, 'addresses._id': addressId },
          { $set: setObj },
          { new: true, runValidators: true }
        );
        if (!user) return res.clientError({ msg: 'Address not found' });
        return res.success({ msg: 'Address updated', result: { addresses: user.addresses } });
      } else if (action === 'delete') {
        if (!addressId) return res.clientError({ msg: 'addressId required for delete' });
        const user = await db.user.findByIdAndUpdate(userId, { $pull: { addresses: { _id: addressId } } }, { new: true });
        return res.success({ msg: 'Address removed', result: { addresses: user.addresses } });
      } else {
        return res.clientError({ msg: 'Invalid action. Use add | edit | delete' });
      }
    } catch (error) {
      errorHandlerFunction(res, error);
    }
  },

  updateAvatar: async (req, res) => {
    try {
      if (!req.file) return res.clientError({ msg: 'No image file provided' });
      const { deleteFromCloudinary } = require('../utils/cloudinary');
      const oldPublicId = req.user.profileImage?.publicId;
      if (oldPublicId) deleteFromCloudinary(oldPublicId).catch(console.error);

      const user = await db.user.findByIdAndUpdate(
        req.user._id,
        {
          $set: {
            'profileImage.url':      req.file.path,
            'profileImage.publicId': req.file.filename,
          },
        },
        { new: true }
      );

      res.success({ msg: 'Profile picture updated', result: { user } });
    } catch (error) {
      errorHandlerFunction(res, error);
    }
  },
};
