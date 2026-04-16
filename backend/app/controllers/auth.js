const db = require("../models");
const { errorHandlerFunction } = require("../middlewares/error");
const jwt = require('jsonwebtoken');
const { generateAccessToken, setRefreshTokenCookie, clearRefreshTokenCookie } = require('../utils/generateTokens');

module.exports = {
  register: async (req, res) => {
    try {
      const { email: rawEmail, password, name } = req.body;
      if (!rawEmail || !password) return res.clientError({ msg: 'Email and password are required' });

      const email = rawEmail.trim().toLowerCase();

      let user = await db.user.findOne({ email });
      if (user) return res.clientError({ msg: 'Email already exists' });

      user = await db.user.create({ email, password, name: name || email.split('@')[0] });

      const accessToken = generateAccessToken(user._id);
      setRefreshTokenCookie(res, user._id);
      
      const userObj = user.toObject();
      delete userObj.password;

      res.success({
        msg: 'Registration successful',
        result: { accessToken, user: userObj },
      });
    } catch (error) {
      errorHandlerFunction(res, error);
    }
  },

  // ── POST /auth/login — Login with Email and Password ────────────────
  login: async (req, res) => {
    try {
      const { email: rawEmail, password } = req.body;
      if (!rawEmail || !password) return res.clientError({ msg: 'Email and password are required' });

      const email = rawEmail.trim().toLowerCase();

      // Find user and select password explicitly
      const user = await db.user.findOne({ email }).select('+password');
      if (!user) return res.clientError({ msg: 'Invalid email or password' });

      if (!user.isActive) return res.status(403).json({ success: false, msg: 'Account deactivated' });

      const isMatch = await user.matchPassword(password);
      if (!isMatch) return res.clientError({ msg: 'Invalid email or password' });

      // Generate tokens
      const accessToken = generateAccessToken(user._id);
      setRefreshTokenCookie(res, user._id);

      const userObj = user.toObject();
      delete userObj.password;

      res.success({
        msg: 'Login successful',
        result: { accessToken, user: userObj },
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
