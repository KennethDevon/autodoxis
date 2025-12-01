require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected...'))
.catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});

async function resetPassword(email, newPassword) {
  try {
    // Find the user
    const user = await User.findOne({ email });
    
    if (!user) {
      console.log(`❌ User with email "${email}" not found`);
      process.exit(1);
    }

    console.log(`✅ Found user: ${user.username} (${user.email})`);
    
    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    
    // Update the password
    user.password = hashedPassword;
    await user.save();
    
    console.log(`✅ Password successfully reset for ${user.email}`);
    console.log(`   New password: ${newPassword}`);
    console.log(`\n✅ You can now login with:`);
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${newPassword}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error resetting password:', error);
    process.exit(1);
  }
}

// Get email and password from command line arguments
const email = process.argv[2];
const newPassword = process.argv[3];

if (!email || !newPassword) {
  console.log('Usage: node resetPassword.js <email> <new-password>');
  console.log('Example: node resetPassword.js sadmin@gmail.com admin123');
  process.exit(1);
}

resetPassword(email, newPassword);

