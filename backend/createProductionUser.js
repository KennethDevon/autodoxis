require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

// Get MongoDB URI from command line or use environment variable
let MONGODB_URI;
if (process.argv[2] && process.argv[2].startsWith('mongodb')) {
  MONGODB_URI = process.argv[2];
} else {
  MONGODB_URI = process.env.MONGODB_URI;
}

if (!MONGODB_URI) {
  console.log('❌ Error: MongoDB URI is required');
  console.log('\nUsage:');
  console.log('  Option 1: node createProductionUser.js <mongodb-uri> <username> <email> <password> [role]');
  console.log('  Option 2: Set MONGODB_URI in .env file, then:');
  console.log('            node createProductionUser.js <username> <email> <password> [role]');
  console.log('\nExample:');
  console.log('  node createProductionUser.js "Kenneth Devon" kennethdevon2004@gmail.com mypassword Admin');
  process.exit(1);
}

// Connect to MongoDB
mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ Connected to MongoDB...'))
.catch(err => {
  console.error('❌ MongoDB connection error:', err.message);
  process.exit(1);
});

async function createUser(username, email, password, role = 'Admin') {
  try {
    // Check if user already exists
    let existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log(`⚠️  User with email "${email}" already exists`);
      console.log(`   Username: ${existingUser.username}`);
      console.log(`   Role: ${existingUser.role || 'Not set'}`);
      console.log('\n💡 If you want to reset the password, use:');
      console.log(`   node resetPassword.js ${email} <new-password>`);
      process.exit(1);
    }

    existingUser = await User.findOne({ username });
    if (existingUser) {
      console.log(`⚠️  User with username "${username}" already exists`);
      console.log(`   Email: ${existingUser.email}`);
      process.exit(1);
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Create new user
    const user = new User({
      username,
      email,
      password: hashedPassword,
      role,
    });
    
    await user.save();
    
    console.log('\n✅ User successfully created in production database!');
    console.log(`   Username: ${username}`);
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}`);
    console.log(`   Role: ${role}`);
    console.log(`\n✅ You can now login on Vercel with:`);
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}`);
    console.log(`\n⚠️  Note: Admin users will need email verification code!`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating user:', error.message);
    process.exit(1);
  }
}

// Get parameters from command line arguments
let username, email, password, role;

if (process.argv[2] && process.argv[2].startsWith('mongodb')) {
  // MongoDB URI provided as first argument
  username = process.argv[3];
  email = process.argv[4];
  password = process.argv[5];
  role = process.argv[6] || 'Admin';
} else {
  // MongoDB URI from .env, arguments start from index 2
  username = process.argv[2];
  email = process.argv[3];
  password = process.argv[4];
  role = process.argv[5] || 'Admin';
}

if (!username || !email || !password) {
  console.log('❌ Error: Username, email, and password are required');
  console.log('\nUsage:');
  console.log('  node createProductionUser.js <username> <email> <password> [role]');
  console.log('\nExample:');
  console.log('  node createProductionUser.js "Kenneth Devon" kennethdevon2004@gmail.com mypassword Admin');
  console.log('\nAvailable roles: Admin, Staff, User');
  process.exit(1);
}

createUser(username, email, password, role);

