/**
 * utils/generateTokens.js
 *
 * Issues a short-lived Access Token (15m) and sets a long-lived
 * Refresh Token in an HTTP-only cookie. This pattern:
 *   - Keeps access tokens out of localStorage (XSS risk)
 *   - Keeps refresh tokens out of JavaScript scope (also XSS-safe)
 */

const jwt = require('jsonwebtoken');

/**
 * Generate JWT access token (15 minutes)
 * @param {string} userId
 * @returns {string}
 */
const generateAccessToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRE_TIME || '15m' }
  );
};

/**
 * Generate JWT refresh token and set it as an HTTP-only cookie.
 * @param {object} res  - Express response object
 * @param {string} userId
 * @returns {string}    - the raw refresh token (for logging/debug only)
 */
const setRefreshTokenCookie = (res, userId) => {
  const refreshToken = jwt.sign(
    { id: userId },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRE_TIME || '7d' }
  );

  const isProduction = process.env.NODE_ENV === 'production';
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: isProduction,           // HTTPS only in prod
    sameSite: isProduction ? 'none' : 'strict', // 'none' required for cross-site (Vercel ↔ Render)
    maxAge: 7 * 24 * 60 * 60 * 1000,           // 7 days in ms
  });

  return refreshToken;
};

/**
 * Clear the refresh token cookie on logout.
 * @param {object} res
 */
const clearRefreshTokenCookie = (res) => {
  const isProduction = process.env.NODE_ENV === 'production';
  res.cookie('refreshToken', '', {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'strict',
    expires: new Date(0),
  });
};

module.exports = { generateAccessToken, setRefreshTokenCookie, clearRefreshTokenCookie };
