const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Models
const User = require('./models/User');
const Admin = require('./models/Admin');

const createAdminUser = async () => {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('Connected to MongoDB...');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ username: 'admin', role: 'admin' });
    if (existingAdmin) {
      console.log('Admin user already exists!');
      console.log('Username: admin');
      console.log('You can reset the password if needed.');
      process.exit(0);
    }

    // Admin details - you can modify these
    const adminDetails = {
      username: 'admin',
      password: 'admin123', // Change this to a secure password
      name: 'System Administrator',
      email: 'admin@moneylendingapp.com',
      phoneNumber: '+1234567890'
    };

    // Create user record
    const user = new User({
      username: adminDetails.username,
      password: adminDetails.password, // Will be hashed by pre-save hook
      role: 'admin',
      isActive: true
    });

    // Save user
    await user.save();
    console.log('Admin user created successfully!');

    // Create admin profile
    const adminProfile = new Admin({
      userId: user._id,
      name: adminDetails.name,
      email: adminDetails.email,
      phoneNumber: adminDetails.phoneNumber,
      permissions: ['user_management', 'loan_management', 'payment_approval', 'reports']
    });

    await adminProfile.save();
    console.log('Admin profile created successfully!');

    // Display admin credentials
    console.log('\n=== ADMIN ACCOUNT CREATED SUCCESSFULLY ===');
    console.log('Username: ' + adminDetails.username);
    console.log('Password: ' + adminDetails.password);
    console.log('Name: ' + adminDetails.name);
    console.log('Email: ' + adminDetails.email);
    console.log('Phone: ' + adminDetails.phoneNumber);
    console.log('=========================================\n');
    console.log('IMPORTANT: Change the default password after first login!');

  } catch (error) {
    console.error('Error creating admin user:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed.');
  }
};

// Run the script
createAdminUser();