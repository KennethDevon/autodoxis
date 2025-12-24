/**
 * Script to update admin email
 * Run this with: node backend/scripts/update-admin-email.js
 * 
 * This will change the email from kennethdevon2004.updated@gmail.com to kennethdevon2004@gmail.com
 */

require('dotenv').config();
const sequelize = require('../config/database');
const User = require('../models/User');

async function updateAdminEmail() {
  try {
    const oldEmail = 'kennethdevon2004.updated@gmail.com';
    const newEmail = 'kennethdevon2004@gmail.com';
    
    console.log(`📧 Updating email from: ${oldEmail}`);
    console.log(`   To: ${newEmail}`);
    
    // Check if new email already exists
    const existingUser = await User.findOne({ where: { email: newEmail } });
    if (existingUser) {
      console.error(`❌ Email ${newEmail} already exists in database!`);
      console.log(`   Existing user: ${existingUser.username} (ID: ${existingUser.id})`);
      await sequelize.close();
      process.exit(1);
    }
    
    // Find the user with old email
    const user = await User.findOne({ where: { email: oldEmail } });
    
    if (!user) {
      console.error(`❌ User not found with email: ${oldEmail}`);
      await sequelize.close();
      process.exit(1);
    }
    
    console.log(`✅ Found user: ${user.username} (ID: ${user.id})`);
    console.log(`   Current role: ${user.role || 'No role'}`);
    
    // Update the email
    await user.update({ email: newEmail });
    
    console.log(`\n✅ Email updated successfully!`);
    console.log(`   Old email: ${oldEmail}`);
    console.log(`   New email: ${newEmail}`);
    console.log(`\n🔐 You can now login with:`);
    console.log(`   Email: ${newEmail}`);
    console.log(`   Password: admin123`);
    
    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    await sequelize.close();
    process.exit(1);
  }
}

// Run the update
updateAdminEmail();

