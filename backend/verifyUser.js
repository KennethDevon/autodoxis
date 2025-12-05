require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ Connected to MongoDB...'))
.catch(err => {
  console.error('❌ MongoDB connection error:', err.message);
  process.exit(1);
});

async function verifyUser(email, password) {
  try {
    console.log(`\n🔍 Looking for user with email: "${email}"`);
    
    // Try exact match first
    let user = await User.findOne({ email });
    
    // If not found, try case-insensitive
    if (!user) {
      console.log('   ⚠️  Exact match not found, trying case-insensitive...');
      user = await User.findOne({ email: { $regex: new RegExp(`^${email}$`, 'i') } });
    }
    
    if (!user) {
      console.log('   ❌ User not found in database');
      console.log('\n📋 All users in database:');
      const allUsers = await User.find({}, { password: 0 });
      allUsers.forEach(u => {
        console.log(`   - ${u.email} (${u.username}, Role: ${u.role || 'Not set'})`);
      });
      process.exit(1);
    }
    
    console.log(`   ✅ User found: ${user.username} (${user.email})`);
    console.log(`   Role: ${user.role || 'Not set'}`);
    
    // Test password
    console.log(`\n🔐 Testing password...`);
    const isMatch = await bcrypt.compare(password, user.password);
    
    if (isMatch) {
      console.log('   ✅ Password matches!');
      console.log(`\n✅ Login should work with:`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Password: ${password}`);
      
      // Check if admin
      const isAdmin = user.email === 'sadmin@gmail.com' || user.role === 'Admin';
      if (isAdmin) {
        console.log(`\n⚠️  This is an Admin account - email verification will be required!`);
        console.log(`   Make sure EMAIL_USER and EMAIL_PASS are set in Railway.`);
      }
    } else {
      console.log('   ❌ Password does NOT match!');
      console.log(`\n💡 To reset password, run:`);
      console.log(`   node resetPassword.js ${user.email} <new-password>`);
      process.exit(1);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Get email and password from command line
const email = process.argv[2];
const password = process.argv[3];

if (!email || !password) {
  console.log('Usage: node verifyUser.js <email> <password>');
  console.log('Example: node verifyUser.js kennethdevon2004@gmail.com admin123');
  process.exit(1);
}

verifyUser(email, password);

