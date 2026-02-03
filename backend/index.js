require('dotenv').config();
const express = require('express');
const sequelize = require('./config/database');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files statically
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Import routes
const employeeRoutes = require('./routes/employeeRoutes');
const officeRoutes = require('./routes/officeRoutes');
const programRoutes = require('./routes/programRoutes');
const positionRoutes = require('./routes/positionRoutes');
const documentRoutes = require('./routes/documentRoutes');
const documentTypeRoutes = require('./routes/documentTypeRoutes');
const authRoutes = require('./routes/authRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

// Use routes
app.use('/employees', employeeRoutes);
app.use('/offices', officeRoutes);
app.use('/programs', programRoutes);
app.use('/positions', positionRoutes);
app.use('/documents', documentRoutes);
app.use('/document-types', documentTypeRoutes);
app.use('/auth', authRoutes);
app.use('/notifications', notificationRoutes);

// Initialize models
const User = require('./models/User');
const Office = require('./models/Office');
const Program = require('./models/Program');
const Position = require('./models/Position');
const Employee = require('./models/Employee');
const Document = require('./models/Document');
const DocumentType = require('./models/DocumentType');
const Notification = require('./models/Notification');
const VerificationCode = require('./models/VerificationCode');

// Initialize associations
const models = { User, Office, Program, Position, Employee, Document, DocumentType, Notification, VerificationCode };
Object.keys(models).forEach(modelName => {
  if (models[modelName].associate) {
    models[modelName].associate(models);
  }
});

// MySQL Connection via Sequelize
sequelize.sync({ alter: false }) // Set to { alter: true } to auto-update schema, or use migrations
  .then(() => {
    console.log('✅ MySQL database synced successfully');
  })
  .catch(err => {
    console.error('❌ MySQL database sync error:', err);
  });

// Basic Route
app.get('/', (req, res) => {
  res.send('API is running...');
});

// Helper function to get local network IP address
function getLocalIPAddress() {
  const os = require('os');
  const networkInterfaces = os.networkInterfaces();
  
  // Look for IPv4 address that's not internal
  for (const interfaceName in networkInterfaces) {
    const addresses = networkInterfaces[interfaceName];
    for (const address of addresses) {
      if (address.family === 'IPv4' && !address.internal) {
        return address.address;
      }
    }
  }
  return 'localhost'; // Fallback
}

const LOCAL_IP = getLocalIPAddress();

// Make PORT and LOCAL_IP available to routes
app.locals.PORT = PORT;
app.locals.LOCAL_IP = LOCAL_IP;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Local: http://localhost:${PORT}`);
  console.log(`Network: http://${LOCAL_IP}:${PORT}`);
  console.log(`\n📱 To access from your phone, use: http://${LOCAL_IP}:${PORT}`);
  console.log(`   Make sure your phone is on the same WiFi network!\n`);
});
