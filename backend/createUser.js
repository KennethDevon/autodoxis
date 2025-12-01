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

async function createUser(username, email, password, role = 'Admin') {
  try {
    // Check if user already exists
    let existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log(`❌ User with email "${email}" already exists`);
      process.exit(1);
    }

    existingUser = await User.findOne({ username });
    if (existingUser) {
      console.log(`❌ User with username "${username}" already exists`);
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
    
    console.log(`✅ User successfully created!`);
    console.log(`   Username: ${username}`);
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}`);
    console.log(`   Role: ${role}`);
    console.log(`\n✅ You can now login with:`);
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating user:', error);
    process.exit(1);
  }
}

// Get parameters from command line arguments
const username = process.argv[2];
const email = process.argv[3];
const password = process.argv[4];
const role = process.argv[5] || 'Admin';

if (!username || !email || !password) {
  console.log('Usage: node createUser.js <username> <email> <password> [role]');
  console.log('Example: node createUser.js "Admin User" admin@gmail.com admin123 Admin');
  console.log('\nAvailable roles: Admin, Employee, Receiver');
  process.exit(1);
}

createUser(username, email, password, role);

