require('dotenv').config();
const mongoose = require('mongoose');
const Employee = require('./models/Employee');
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

async function testEmployeeUserCreation() {
  try {
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('     EMPLOYEE USER ACCOUNT AUTO-CREATION TEST');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    // Get all employees
    const employees = await Employee.find();
    console.log(`📋 Found ${employees.length} employee(s) in the database\n`);
    
    if (employees.length === 0) {
      console.log('⚠️  No employees found. Please add an employee first.\n');
      process.exit(0);
    }
    
    // Check each employee's user account
    for (const employee of employees) {
      console.log(`\n👤 Employee: ${employee.name}`);
      console.log(`   Employee ID: ${employee.employeeId}`);
      console.log(`   Position: ${employee.position}`);
      console.log(`   Department: ${employee.department}`);
      
      // Generate expected email
      const emailUsername = employee.name.toLowerCase().replace(/\s+/g, '.');
      const expectedEmail = `${emailUsername}@employee.com`;
      
      // Check if user account exists
      const user = await User.findOne({ employeeId: employee.employeeId });
      
      if (user) {
        console.log(`   ✅ User Account: EXISTS`);
        console.log(`   📧 Email: ${user.email}`);
        console.log(`   🔑 Password: ${employee.employeeId} (Employee ID)`);
        console.log(`   👔 Role: ${user.role}`);
      } else {
        console.log(`   ❌ User Account: DOES NOT EXIST`);
        console.log(`   💡 Expected email: ${expectedEmail}`);
        console.log(`   💡 Expected password: ${employee.employeeId}`);
      }
      
      console.log('   ' + '─'.repeat(50));
    }
    
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('                    SUMMARY');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    const employeeUsers = await User.find({ role: 'Employee' });
    console.log(`✅ Total Employee User Accounts: ${employeeUsers.length}`);
    console.log(`📋 Total Employee Records: ${employees.length}\n`);
    
    if (employeeUsers.length < employees.length) {
      console.log('⚠️  Some employees do not have user accounts.');
      console.log('   New employees added from now on will automatically get accounts.\n');
    } else {
      console.log('✅ All employees have user accounts!\n');
    }
    
    console.log('═══════════════════════════════════════════════════════════\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

testEmployeeUserCreation();

