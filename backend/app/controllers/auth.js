const db = require("../models");
const { errorHandlerFunction } = require("../middlewares/error");
const jwt = require('jsonwebtoken');
const { sendOtpEmail } = require('../utils/sendOtp');
const { generateAccessToken, setRefreshTokenCookie, clearRefreshTokenCookie } = require('../utils/generateTokens');

module.exports = {
  requestOtp: async (req, res) => {
    try {
      const { email: rawEmail } = req.body;
      if (!rawEmail) return res.clientError({ msg: 'Email is required' });

      // ── Normalize email ──────────────────────────────────────────────
      const email = rawEmail.trim().toLowerCase();

      let user = await db.user.findOne({ email }).select('+otp +otpExpiry +otpAttempts +otpLastSent');
      if (!user) {
        user = await db.user.create({ email });
        user = await db.user.findById(user._id).select('+otp +otpExpiry +otpAttempts +otpLastSent');
      }

      if (!user.canResendOtp()) {
        const secondsLeft = Math.ceil(60 - (Date.now() - user.otpLastSent.getTime()) / 1000);
        return res.status(429).json({ success: false, msg: `Please wait ${secondsLeft}s before requesting a new OTP` });
      }

      const plainOtp = await sendOtpEmail(email);
      await user.setOtp(plainOtp);

      res.success({
        msg: `OTP sent to ${email}`,
        result: process.env.NODE_ENV === 'development' ? { otp: plainOtp } : {},
      });
    } catch (error) {
      errorHandlerFunction(res, error);
    }
  },
  verifyOtp: async (req, res) => {
    try {
      const { email: rawEmail, otp } = req.body;
      if (!rawEmail || !otp) return res.clientError({ msg: 'Email and OTP are required' });

      const email = rawEmail.trim().toLowerCase();

      const user = await db.user.findOne({ email }).select('+otp +otpExpiry +otpAttempts +otpLastSent');
      if (!user) return res.clientError({ msg: 'User not found' });

      // ── Dev bypass: useDefaultOtp flag + magic OTP "1111" ────────────
      const isBypass = user.useDefaultOtp && otp === '111111';

      if (!isBypass) {
        const isValid = await user.verifyOtp(otp);
        if (!isValid) return res.clientError({ msg: 'Invalid or expired OTP' });
      }

      const accessToken = generateAccessToken(user._id);
      setRefreshTokenCookie(res, user._id);

      const safeUser = await db.user.findById(user._id);
      res.success({
        msg: 'Login successful',
        result: { accessToken, user: safeUser },
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

  // ── PATCH /auth/profile — update name & phone ─────────────────────────
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

  // ── PATCH /auth/address — manage saved addresses ───────────────────────
  updateAddress: async (req, res) => {
    try {
      const { action, addressId, address } = req.body;
      // action: 'add' | 'edit' | 'delete'
      const user = await db.user.findById(req.user._id);
      if (!user) return res.clientError({ msg: 'User not found' });

      if (action === 'add') {
        user.addresses.push(address);
      } else if (action === 'edit') {
        const idx = user.addresses.findIndex(a => a._id.toString() === addressId);
        if (idx === -1) return res.clientError({ msg: 'Address not found' });
        Object.assign(user.addresses[idx], address);
      } else if (action === 'delete') {
        user.addresses = user.addresses.filter(a => a._id.toString() !== addressId);
      } else {
        return res.clientError({ msg: 'Invalid action. Use add | edit | delete' });
      }

      await user.save();
      res.success({ msg: 'Addresses updated', result: { addresses: user.addresses } });
    } catch (error) {
      errorHandlerFunction(res, error);
    }
  },

  // ── PATCH /auth/avatar — upload profile picture ────────────────────────
  updateAvatar: async (req, res) => {
    try {
      if (!req.file) return res.clientError({ msg: 'No image file provided' });

      const { deleteFromCloudinary } = require('../utils/cloudinary');

      // Delete old avatar from Cloudinary if exists
      const oldPublicId = req.user.profileImage?.publicId;
      if (oldPublicId) await deleteFromCloudinary(oldPublicId);

      // Save new image (Multer-Cloudinary puts url in file.path, publicId in file.filename)
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
