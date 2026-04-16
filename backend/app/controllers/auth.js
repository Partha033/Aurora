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
          subject: '✦ Your Aurora Jewels Login Code',
          html: `
            <div style="font-family: 'Playfair Display', serif; max-width: 600px; margin: 0 auto; background-color: #0a0e1a; color: #ffffff; padding: 40px; border-radius: 20px; border: 1px solid #c9a84c;">
              <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #c9a84c; font-size: 32px; letter-spacing: 4px; margin: 0;">AURORA JEWELS</h1>
                <div style="width: 50px; height: 2px; background: #c9a84c; margin: 15px auto;"></div>
              </div>
              
              <div style="background: rgba(255,255,255,0.05); padding: 30px; border-radius: 15px; text-align: center; border: 1px solid rgba(201,168,76,0.2);">
                <p style="font-size: 18px; color: #e0e0e0; margin-bottom: 25px;">Hello there,</p>
                <p style="font-size: 16px; color: #b0b0b0; margin-bottom: 30px;">Use the exclusive verification code below to access your account:</p>
                
                <div style="background: #161b2b; padding: 20px; border-radius: 10px; border: 2px dashed #c9a84c; display: inline-block; margin-bottom: 30px;">
                  <span style="font-size: 42px; font-weight: bold; letter-spacing: 12px; color: #c9a84c; font-family: monospace;">${otp}</span>
                </div>
                
                <p style="font-size: 14px; color: #888; line-height: 1.6;">
                  This code is valid for <span style="color: #c9a84c;">10 minutes</span>.<br>
                  For your security, please do not share this code with anyone.
                </p>
              </div>
              
              <div style="text-align: center; margin-top: 35px; color: #666; font-size: 12px; letter-spacing: 1px;">
                <p>© 2026 AURORA JEWELS | EXQUISITE ELEGANCE</p>
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
      const { email: rawEmail, otp } = req.body;
      if (!rawEmail || !otp) return res.clientError({ msg: 'Email and OTP are required' });

      const email = rawEmail.trim().toLowerCase();
      // Explicitly include otp and otpExpiry which are select: false
      const user = await db.user.findOne({ email }).select('+otp +otpExpiry');

      if (!user) {
        return res.clientError({ msg: 'User not found' });
      }

      if (!user.otp || user.otp !== otp || !user.otpExpiry || user.otpExpiry < Date.now()) {
        return res.clientError({ msg: 'Invalid or expired OTP' });
      }

      // Clear OTP using direct update to avoid pre-save hook side effects (like password hashing)
      await db.user.findByIdAndUpdate(user._id, {
        $unset: { otp: 1, otpExpiry: 1 }
      });

      const accessToken = generateAccessToken(user._id);
      setRefreshTokenCookie(res, user._id);

      res.success({
        msg: 'Login successful',
        result: { accessToken, user },
      });
    } catch (error) {
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
