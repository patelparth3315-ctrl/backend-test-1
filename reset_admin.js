require('dotenv').config();
const mongoose = require('mongoose');
const Admin = require('./src/models/Admin');

async function resetAdmin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const email = process.env.ADMIN_EMAIL || 'admin@youthcamping.in';
    const password = process.env.ADMIN_PASSWORD || 'admin@123456';

    console.log(`Resetting admin: ${email}`);

    // Delete existing
    await Admin.deleteOne({ email: email.toLowerCase().trim() });
    console.log('Old admin deleted');

    // Create fresh
    const newAdmin = await Admin.create({
      name: 'Super Admin',
      email: email.toLowerCase().trim(),
      password: password,
      role: 'superadmin'
    });

    console.log('Fresh admin created successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error resetting admin:', error);
    process.exit(1);
  }
}

resetAdmin();
