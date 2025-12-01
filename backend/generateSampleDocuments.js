const mongoose = require('mongoose');
require('dotenv').config();

const Document = require('./models/Document');
const Office = require('./models/Office');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ Connected to MongoDB'))
.catch(err => {
  console.error('❌ MongoDB connection error:', err);
  process.exit(1);
});

const documentTypes = [
  'Transcript Request',
  'Certificate of Enrollment',
  'Certificate of Grades',
  'Clearance Form',
  'Transfer Credentials',
  'Honorable Dismissal',
  'Diploma Request',
  'Recommendation Letter',
  'Special Order',
  'Memorandum'
];

const statuses = ['Submitted', 'Under Review', 'Approved', 'Completed', 'Processing', 'On Hold'];
const priorities = ['Low', 'Normal', 'High', 'Urgent'];
const submitters = ['John Doe', 'Jane Smith', 'Bob Johnson', 'Alice Williams', 'Charlie Brown', 'Diana Prince'];

// Helper function to get random element from array
function getRandom(array) {
  return array[Math.floor(Math.random() * array.length)];
}

// Helper function to generate random date between start and end
function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

async function generateSampleDocuments() {
  try {
    console.log('\n🔄 Generating sample documents...\n');
    
    // Get all offices
    const offices = await Office.find({});
    if (offices.length === 0) {
      console.log('❌ No offices found! Please create offices first.');
      process.exit(1);
    }
    
    console.log(`✅ Found ${offices.length} offices`);
    
    const officeNames = offices.map(o => o.name);
    
    // Generate documents for the last 6 months
    const now = new Date();
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const documentsToCreate = [];
    
    // Generate 60 documents (about 10 per month)
    for (let i = 0; i < 60; i++) {
      const uploadDate = randomDate(sixMonthsAgo, now);
      const docType = getRandom(documentTypes);
      const status = getRandom(statuses);
      const priority = getRandom(priorities);
      const submitter = getRandom(submitters);
      const currentOffice = getRandom(officeNames);
      
      // Random expected processing time (12-72 hours)
      const expectedTime = Math.floor(Math.random() * 60) + 12;
      
      // Stage start time (between upload date and now)
      const stageStartTime = randomDate(uploadDate, now);
      
      // Calculate if delayed
      const hoursSinceStageStart = (now - stageStartTime) / (1000 * 60 * 60);
      const isDelayed = hoursSinceStageStart > expectedTime;
      const delayedHours = isDelayed ? Math.floor(hoursSinceStageStart - expectedTime) : 0;
      
      // Generate routing history (2-5 entries per document)
      const numRoutingEntries = Math.floor(Math.random() * 4) + 2;
      const routingHistory = [];
      
      let entryDate = new Date(uploadDate);
      for (let j = 0; j < numRoutingEntries; j++) {
        const office = getRandom(officeNames);
        const action = getRandom(['received', 'reviewed', 'approved', 'forwarded']);
        const handler = getRandom(submitters);
        
        // Random processing time (2-48 hours)
        const processingTime = Math.floor(Math.random() * 46) + 2;
        
        // Move entry date forward by processing time
        entryDate = new Date(entryDate.getTime() + processingTime * 60 * 60 * 1000);
        
        // Make sure entry date doesn't exceed current date
        if (entryDate > now) entryDate = new Date(now);
        
        routingHistory.push({
          office,
          action,
          handler,
          timestamp: entryDate,
          comments: `Processed by ${handler}`,
          processingTime
        });
      }
      
      const document = {
        documentId: `DOC-${String(1000 + i).padStart(4, '0')}`,
        name: `${docType} - ${submitter}`,
        type: docType,
        dateUploaded: uploadDate,
        status,
        submittedBy: submitter,
        description: `${docType} request submitted by ${submitter}`,
        currentOffice,
        priority,
        expectedProcessingTime: expectedTime,
        currentStageStartTime: stageStartTime,
        isDelayed,
        delayedHours,
        routingHistory,
        tags: [docType.split(' ')[0], priority],
        department: getRandom(['Academic Affairs', 'Student Services', 'Registrar', 'Finance']),
        category: getRandom(['Academic Records', 'Administrative', 'Student Request'])
      };
      
      documentsToCreate.push(document);
    }
    
    // Insert documents
    console.log(`\n📝 Creating ${documentsToCreate.length} sample documents...`);
    
    await Document.insertMany(documentsToCreate);
    
    console.log(`\n✅ Successfully created ${documentsToCreate.length} sample documents!`);
    
    // Show summary
    const delayed = documentsToCreate.filter(d => d.isDelayed).length;
    const completed = documentsToCreate.filter(d => d.status === 'Completed' || d.status === 'Approved').length;
    
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('                  SUMMARY');
    console.log('═══════════════════════════════════════════════════════');
    console.log(`📄 Total Documents: ${documentsToCreate.length}`);
    console.log(`⚠️  Delayed Documents: ${delayed} (${Math.round(delayed/documentsToCreate.length*100)}%)`);
    console.log(`✅ Completed Documents: ${completed} (${Math.round(completed/documentsToCreate.length*100)}%)`);
    console.log(`📅 Date Range: ${sixMonthsAgo.toLocaleDateString()} - ${now.toLocaleDateString()}`);
    console.log(`🏢 Offices Used: ${officeNames.length}`);
    console.log(`📋 Document Types: ${documentTypes.length}`);
    console.log('═══════════════════════════════════════════════════════\n');
    
    console.log('✨ Your analytics dashboard should now have data!');
    console.log('🔄 Refresh your browser to see the trends and insights.\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error generating documents:', error);
    process.exit(1);
  }
}

// Run the function
generateSampleDocuments();

