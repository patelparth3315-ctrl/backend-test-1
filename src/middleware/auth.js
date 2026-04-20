const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Handle Master Bypass in Token
      if (decoded.id === 'root_admin_bypass') {
        req.admin = { id: 'root_admin_bypass', role: 'superadmin', name: 'Master Admin' };
        return next();
      }

      // Find if it's an admin in DB
      const admin = await Admin.findById(decoded.id);
      if (admin) {
        req.admin = admin;
        return next();
      }

      return res.status(401).json({ success: false, message: 'Not authorized as admin' });
    } catch (error) {
      return res.status(401).json({ success: false, message: 'Invalid token' });
    }
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'No token found' });
  }
};

const protectUser = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Not authorized, user not found'
        });
      }

      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized, token failed'
      });
    }
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized, no token'
    });
  }
};

module.exports = { protect, protectUser };
