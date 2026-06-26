const mongoose = require('mongoose');
const User = require('../models/User');

// Helper Middleware to verify Admin Token
function verifyAdminToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return res.status(401).json({ success: false, message: 'Access denied. No token provided.' });
  }

  const token = authHeader.split(' ')[1]; // "Bearer TOKEN"
  if (!token) {
    return res.status(401).json({ success: false, message: 'Access denied. Invalid token format.' });
  }

  try {
    const decoded = Buffer.from(token, 'base64').toString('ascii');
    const [username, timestampStr] = decoded.split(':');
    const timestamp = parseInt(timestampStr, 10);

    if (username !== process.env.ADMIN_USERNAME) {
      return res.status(401).json({ success: false, message: 'Access denied. Invalid token.' });
    }

    const TWO_HOURS = 2 * 60 * 60 * 1000;
    if (Date.now() - timestamp > TWO_HOURS) {
      return res.status(401).json({ success: false, message: 'Token expired. Please log in again.' });
    }

    req.adminUser = username;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Access denied. Invalid signature.' });
  }
}

// Helper Middleware to verify Player Token
async function verifyPlayerToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return res.status(401).json({ success: false, message: 'Access denied. Please log in first.' });
  }

  const token = authHeader.split(' ')[1]; // "Bearer TOKEN"
  if (!token) {
    return res.status(401).json({ success: false, message: 'Access denied. Invalid token.' });
  }

  try {
    const decoded = Buffer.from(token, 'base64').toString('ascii');
    const [email, timestampStr] = decoded.split(':');
    const timestamp = parseInt(timestampStr, 10);

    if (!email || isNaN(timestamp)) {
      return res.status(401).json({ success: false, message: 'Access denied. Invalid session.' });
    }

    const ONE_DAY = 24 * 60 * 60 * 1000;
    if (Date.now() - timestamp > ONE_DAY) {
      return res.status(401).json({ success: false, message: 'Session expired. Please log in again.' });
    }

    req.playerEmail = email;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Access denied. Invalid session.' });
  }
}

module.exports = {
  verifyAdminToken,
  verifyPlayerToken
};
