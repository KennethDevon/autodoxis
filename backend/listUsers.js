require('dotenv').config();
const mongoose = require('mongoose');
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

async function listUsers() {
  try {
    const users = await User.find({});
    
    console.log(`\n📋 Found ${users.length} user(s) in the database:\n`);
    
    if (users.length === 0) {
      console.log('   No users found. You need to register users first.');
    } else {
      users.forEach((user, index) => {
        console.log(`${index + 1}. Username: ${user.username}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Role: ${user.role || 'N/A'}`);
        console.log(`   Employee ID: ${user.employeeId || 'N/A'}`);
        console.log('');
      });
    }
    
    console.log('💡 Tip: Use resetPassword.js to set a new password for any user');
    console.log('   Example: node resetPassword.js <email> <new-password>\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error listing users:', error);
    process.exit(1);
  }
}

listUsers();

