const jwt  = require('jsonwebtoken');
const db = require('../models');

const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, msg: 'Not authorised — no token provided' });
    }

    const token = authHeader.split(' ')[1];

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ success: false, msg: 'Access token expired — please refresh' });
      }
      return res.status(401).json({ success: false, msg: 'Invalid token' });
    }

    const user = await db.user.findById(decoded.id).select('-otp -otpExpiry -otpAttempts -otpLastSent');
    if (!user) return res.status(401).json({ success: false, msg: 'User not found' });
    if (!user.isActive) return res.status(403).json({ success: false, msg: 'Account deactivated' });

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    return next();
  }
  return res.status(403).json({ success: false, msg: 'Admin access required' });
};

module.exports = { protect, isAdmin };
