require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Employee = require('./models/Employee');
const Document = require('./models/Document');
const Office = require('./models/Office');

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected...'))
.catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});

async function checkAllData() {
  try {
    const users = await User.find({});
    const employees = await Employee.find({});
    const documents = await Document.find({});
    const offices = await Office.find({});
    
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('                 DATABASE DATA SUMMARY');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    console.log(`👥 USERS: ${users.length} records`);
    if (users.length > 0) {
      users.forEach((user, i) => {
        console.log(`   ${i + 1}. ${user.username} (${user.email}) - Role: ${user.role || 'N/A'}`);
      });
    }
    
    console.log(`\n👨‍💼 EMPLOYEES: ${employees.length} records`);
    if (employees.length > 0) {
      employees.slice(0, 5).forEach((emp, i) => {
        console.log(`   ${i + 1}. ${emp.name} - ID: ${emp.employeeId} - Role: ${emp.role || 'N/A'}`);
      });
      if (employees.length > 5) {
        console.log(`   ... and ${employees.length - 5} more employees`);
      }
    }
    
    console.log(`\n📄 DOCUMENTS: ${documents.length} records`);
    if (documents.length > 0) {
      documents.slice(0, 5).forEach((doc, i) => {
        console.log(`   ${i + 1}. ${doc.name} - ID: ${doc.documentId} - Type: ${doc.type || 'N/A'}`);
      });
      if (documents.length > 5) {
        console.log(`   ... and ${documents.length - 5} more documents`);
      }
    }
    
    console.log(`\n🏢 OFFICES: ${offices.length} records`);
    if (offices.length > 0) {
      offices.forEach((office, i) => {
        console.log(`   ${i + 1}. ${office.name} - ID: ${office.officeId}`);
      });
    }
    
    console.log('\n═══════════════════════════════════════════════════════════');
    
    if (users.length > 0 || employees.length > 0 || documents.length > 0 || offices.length > 0) {
      console.log('\n✅ YOUR DATA IS SAFE AND ACCESSIBLE!');
    } else {
      console.log('\n⚠️  No data found in any collections.');
    }
    
    console.log('═══════════════════════════════════════════════════════════\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error checking data:', error);
    process.exit(1);
  }
}

checkAllData();

