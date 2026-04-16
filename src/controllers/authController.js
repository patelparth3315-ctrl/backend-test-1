const Admin = require('../models/Admin');
const jwt = require('jsonwebtoken');

// Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

// @desc    Admin login
// @route   POST /api/admin/login
// @access  Public
exports.adminLogin = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    console.log(`Login attempt for: ${email}`);

    // ── SELF-HEALING ADMIN SYNC ──
    // Every login attempt checks if the .env admin exists and has the correct password.
    const rootEmail = process.env.ADMIN_EMAIL || 'admin@youthcamping.in';
    const rootPassword = process.env.ADMIN_PASSWORD || 'admin@123456';

    let rootAdmin = await Admin.findOne({ email: rootEmail });
    
    if (!rootAdmin) {
      console.log('No root admin found. Creating from .env...');
      rootAdmin = await Admin.create({
        name: 'Super Admin',
        email: rootEmail,
        password: rootPassword,
        role: 'superadmin'
      });
    } else {
      // Force update password if it doesn't match the .env (Self-healing)
      const isMatch = await rootAdmin.comparePassword(rootPassword);
      if (!isMatch) {
        console.log('Admin password mismatch with .env. Updating database to match .env...');
        rootAdmin.password = rootPassword;
        await rootAdmin.save();
      }
    }

    // ── MASTER ACCESS BYPASS (Robust) ──
    const submittedEmail = email?.toLowerCase().trim();
    const submittedPassword = password?.trim();
    const configEmail = rootEmail.toLowerCase().trim();
    const configPassword = rootPassword.trim();

    console.log(`Checking Master Bypass: ${submittedEmail} === ${configEmail}`);

    if (submittedEmail === configEmail && submittedPassword === configPassword) {
      console.log('Master Access Granted via .env credentials.');
      return res.json({
        success: true,
        data: {
          token: generateToken('root_admin_bypass'),
          admin: {
            id: 'root_admin_bypass',
            name: 'Master Admin',
            email: rootEmail,
            role: 'superadmin'
          }
        }
      });
    }

    const admin = await Admin.findOne({ email });
    console.log(`Admin found in DB: ${!!admin}`);

    if (!admin) {
      console.log('No admin found in database with that email.');
    } else {
      console.log('Admin found, comparing labels...');
    }

    if (admin && (await admin.comparePassword(password))) {
      res.json({
        success: true,
        data: {
          token: generateToken(admin._id),
          admin: {
            id: admin._id,
            name: admin.name,
            email: admin.email,
            role: admin.role
          }
        }
      });
    } else {
      res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Get current admin
// @route   GET /api/admin/me
// @access  Private
exports.getMe = async (req, res, next) => {
  try {
    const admin = await Admin.findById(req.admin.id);
    res.json({
      success: true,
      data: admin
    });
  } catch (error) {
    next(error);
  }
};
