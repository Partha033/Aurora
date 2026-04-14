const db = require("../models");
const { errorHandlerFunction } = require("../middlewares/error");
const jwt = require('jsonwebtoken');
const { generateAccessToken, setRefreshTokenCookie, clearRefreshTokenCookie } = require('../utils/generateTokens');

module.exports = {
  // ── POST /auth/login — Login/Register with Email Only ────────────────
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

      // Generate tokens
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
