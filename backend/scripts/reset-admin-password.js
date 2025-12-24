/**
 * Script to reset admin password
 * Run this with: node backend/scripts/reset-admin-password.js
 * 
 * This will reset the password for kennethdevon2004@gmail.com to "admin123"
 */

require('dotenv').config();
const sequelize = require('../config/database');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

async function resetAdminPassword() {
  try {
    const email = 'kennethdevon2004.updated@gmail.com';
    const newPassword = 'admin123';
    
    console.log(`🔐 Resetting password for: ${email}`);
    
    // Find the user
    const user = await User.findOne({ where: { email } });
    
    if (!user) {
      console.error(`❌ User not found: ${email}`);
      console.log('\nAvailable users:');
      const allUsers = await User.findAll({ attributes: ['id', 'email', 'username', 'role'] });
      allUsers.forEach(u => {
        console.log(`  - ${u.email} (${u.username}) - Role: ${u.role || 'No role'}`);
      });
      await sequelize.close();
      process.exit(1);
    }
    
    console.log(`✅ Found user: ${user.username} (ID: ${user.id})`);
    console.log(`   Current role: ${user.role || 'No role'}`);
    
    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    
    // Update the password
    await user.update({ password: hashedPassword });
    
    console.log(`\n✅ Password reset successfully!`);
    console.log(`   Email: ${email}`);
    console.log(`   New password: ${newPassword}`);
    console.log(`\n📧 Note: Admin login requires email verification (OTP sent to email)`);
    console.log(`   If email service is not configured, check the backend console for the OTP code.`);
    
    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    await sequelize.close();
    process.exit(1);
  }
}

// Run the reset
resetAdminPassword();

