require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected...'))
.catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});

async function linkUserToEmployee(email, employeeId) {
  try {
    const user = await User.findOne({ email });
    
    if (!user) {
      console.log(`❌ User with email "${email}" not found`);
      process.exit(1);
    }

    console.log(`✅ Found user: ${user.username} (${user.email})`);
    
    // Update the employeeId
    user.employeeId = employeeId;
    await user.save();
    
    console.log(`✅ Successfully linked user to Employee ID: ${employeeId}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

const email = process.argv[2];
const employeeId = process.argv[3];

if (!email || !employeeId) {
  console.log('Usage: node linkUserToEmployee.js <email> <employeeId>');
  console.log('Example: node linkUserToEmployee.js kenneth@employee.com 2022-1433');
  process.exit(1);
}

linkUserToEmployee(email, employeeId);

