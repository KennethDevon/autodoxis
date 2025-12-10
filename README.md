# AutoDoxis: Automated Document Routing For Adaptive Workflow Optimization System

**A Capstone Project by:** Jhomarie T. Avenido, Nikki C. Matinagnos, Kenneth Devon Valeriano  
**Institution:** Davao Oriental State University  
**Course:** Bachelor of Science in Information Technology  
**Date:** May 2025

---

## 📋 Project Overview

AutoDoxis is an Automated Document Routing System with Descriptive Analytics designed to optimize document workflows in organizational settings, particularly for Davao Oriental State University (DorSU). The system automates document routing, provides real-time tracking, detects delays, and generates comprehensive analytics for continuous process improvement.

### Main Objective
Develop an Automated Document Routing For Adaptive Workflow Optimization System with Descriptive Analytics for adaptive workflow optimization to enhance efficiency, reduce delays, improve communication, and provide real-time updates while offering an intuitive user interface and performance monitoring tools.

---

## ✨ Key Features

### 1. Real-Time Document Tracking
- Automatically tracks and logs document movement across all offices in real-time
- Records timestamps, handlers, and processing times at every stage
- Visual timeline showing complete document journey

### 2. Delay Detection & Alerts
- Automatically detects when documents exceed expected processing times
- Real-time alerts with color-coded urgency levels
- Delay reports by office and document type

### 3. Visual Dashboards
- **Admin Dashboard:** Complete system management, user administration, and analytics
- **Employee Dashboard:** Document submission, tracking, and status monitoring
- Real-time updates and comprehensive reporting

### 4. Secure Audit Trail
- Tamper-proof logging of all document movements
- Immutable routing history with server-side timestamps
- Complete accountability and traceability

### 5. Advanced Search & Discovery
- Multi-criteria search with 10+ filter options
- Search by document ID, name, type, status, office, priority, and more
- View current location and complete routing history

### 6. Descriptive Analytics
- Summarizes historical workflow data
- Identifies bottlenecks and processing patterns
- Generates performance insights and trend analysis
- PDF report export capabilities

---

## 🏗️ Technology Stack

### Frontend
- **React 19.1.1** - Modern UI framework
- **React Router** - Navigation
- **jsPDF & jsPDF-AutoTable** - PDF report generation
- **QRCode React** - QR code generation
- **Barcode libraries** - Barcode generation

### Backend
- **Node.js** - Runtime environment
- **Express 5.1.0** - Web framework
- **MongoDB** - Document database
- **Mongoose** - ODM for MongoDB
- **JWT** - Authentication
- **Bcrypt** - Password hashing
- **Multer** - File upload handling
- **Nodemailer** - Email notifications

### Architecture
- RESTful API design
- Role-Based Access Control (RBAC)
- Modular component architecture
- Secure authentication and authorization

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or cloud instance)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone [repository-url]
   cd autodoxis
   ```

2. **Install frontend dependencies**
   ```bash
   npm install
   ```

3. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   ```

4. **Configure environment variables**
   
   Create a `.env` file in the `backend` directory:
   ```env
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret_key
   API_URL=http://localhost:5000
   EMAIL_HOST=your_email_host
   EMAIL_USER=your_email_user
   EMAIL_PASS=your_email_password
   ```

5. **Start the backend server**
   ```bash
   cd backend
   npm start
   ```

6. **Start the frontend development server**
   ```bash
   npm start
   ```

7. **Open your browser**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

---

## 📁 Project Structure

```
autodoxis/
├── backend/
│   ├── models/          # MongoDB models (Document, User, Employee, Office, etc.)
│   ├── routes/          # API routes (auth, documents, employees, offices)
│   ├── utils/           # Utility functions (email service)
│   ├── uploads/         # Uploaded document storage
│   └── index.js         # Backend entry point
│
├── src/
│   ├── aboard.js        # Admin dashboard component
│   ├── edashboard.js    # Employee/Staff dashboard component
│   ├── Login.js         # Login component
│   ├── Signup.js        # Registration component
│   ├── Document.js      # Document management component
│   ├── Reports.js       # Reports and analytics component
│   ├── Employee.js      # Employee management component
│   ├── Office.js        # Office management component
│   └── components/      # Reusable components
│       ├── DelayAlerts.js
│       ├── DocumentTrackingTimeline.js
│       ├── AdvancedSearch.js
│       ├── QRCodeDisplay.js
│       └── ...
│
├── public/              # Static assets
├── README.md            # This file
├── OBJECTIVES_COMPLIANCE_REPORT.md  # Detailed compliance report
└── CAPSTONE_PRESENTATION_GUIDE.md   # Presentation guide
```

---

## 👥 User Roles

### Admin
- Full system access
- User and employee management
- Office management
- Document type configuration
- Comprehensive reports and analytics
- System monitoring

### Staff
- Document submission and forwarding
- View assigned documents
- Track document status
- Generate personal reports

### User
- Document submission
- Track own documents
- View document history
- Status monitoring

---

## 📊 System Capabilities

### Document Management
- Upload multiple file formats (PDF, DOCX, JPG, PNG, TXT)
- Automatic metadata extraction
- Document classification and tagging
- Priority assignment (Low, Normal, High, Urgent)
- Status tracking (Submitted, Under Review, Approved, Rejected, etc.)

### Routing & Workflow
- Automated routing based on document type and destination
- Multi-office routing workflows
- Forwarding between departments
- Approval workflows

### Analytics & Reporting
- Department approval time reports
- Documents by submitter's office
- Delay analysis by office
- Employee and office statistics
- PDF export functionality
- Trend analysis (backend API)

### Tracking & Monitoring
- Real-time location tracking
- Routing history timeline
- Processing time calculations
- Delay detection and alerts
- Scan history audit trail

---

## 📈 Compliance Status

**Overall Status: ✅ 95% Complete - Excellent**

All 6 specific objectives from Chapter 1, Section 1.3 are implemented:

1. ✅ Real-time tracking and logging (100%)
2. ✅ Delay reports and alerts (100%)
3. ✅ Visual dashboards (100%)
4. ✅ Secure audit trail (100%)
5. ✅ Search and location tracking (100%)
6. ✅ Descriptive analytics (70% - with room for enhancement)

See `OBJECTIVES_COMPLIANCE_REPORT.md` for detailed analysis.

---

## 📚 Documentation

- **OBJECTIVES_COMPLIANCE_REPORT.md** - Detailed verification against capstone requirements
- **CAPSTONE_PRESENTATION_GUIDE.md** - Complete presentation guide with demo script
- **SYSTEM_STATUS_REPORT.txt** - System status and feature verification
- **Chap-1-3-AutoDoxis (1).txt** - Original capstone document (Chapters 1-3)

---

## 🔒 Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Role-based access control
- Server-side validation
- Immutable audit trails
- Secure file uploads
- CORS protection

---

## 🎯 Use Cases

1. **Document Submission:** Staff/Users submit documents through the system
2. **Automatic Routing:** System routes documents to appropriate offices
3. **Real-Time Tracking:** Users track document location and status
4. **Delay Management:** System alerts when documents are delayed
5. **Analytics:** Administrators analyze workflow performance
6. **Reporting:** Generate comprehensive PDF reports

---

## 📝 Available Scripts

### Frontend
- `npm start` - Start development server (Open [http://localhost:3000](http://localhost:3000))
- `npm run build` - Build for production
- `npm test` - Run tests

### Backend
- `npm start` - Start backend server (from backend directory)

---

## 🤝 Contributing

This is a capstone project. For questions or contributions, please contact the project authors.

---

## 📄 License

This project is part of an academic capstone project at Davao Oriental State University.

---

## 👨‍💻 Authors

- **Jhomarie T. Avenido**
- **Nikki C. Matinagnos**
- **Kenneth Devon Valeriano**

---

## 🙏 Acknowledgments

- Davao Oriental State University
- Faculty of Computing, Engineering and Technology
- Capstone advisors and panel members

---

## 📞 Support

For technical issues or questions about the system, please refer to the documentation files or contact the project authors.

---

**Status:** ✅ Production Ready  
**Last Updated:** December 2025  
**Version:** 0.1.2
