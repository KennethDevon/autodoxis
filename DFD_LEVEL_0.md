# Autodoxis System - Level 0 DFD (Context Diagram)

## Overview
The Level 0 DFD (Context Diagram) shows the Autodoxis System as a single process with all external entities and the data flows between them.

---

## Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│                          AUTODOXIS SYSTEM                                   │
│                    (Document Routing & Management System)                     │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │                                                                       │  │
│  │  • Authentication & Authorization                                     │  │
│  │  • User Management                                                   │  │
│  │  • Employee Management                                               │  │
│  │  • Office Management                                                 │  │
│  │  • Document Management                                              │  │
│  │  • Document Type Management                                         │  │
│  │  • Document Routing & Tracking                                      │  │
│  │  • Document Review & Approval                                       │  │
│  │  • Reports & Analytics                                               │  │
│  │  • Notification System                                               │  │
│  │                                                                       │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
         │                              │                              │
         │                              │                              │
         │                              │                              │
    ┌────▼────┐                    ┌───▼───┐                    ┌────▼────┐
    │  USER   │                    │ SYSTEM │                    │ DATABASE│
    │         │                    │        │                    │ (MongoDB)│
    └────┬────┘                    └───┬───┘                    └────┬────┘
         │                              │                              │
         │                              │                              │
         │                              │                              │
         └──────────────────────────────┴──────────────────────────────┘
```

---

## External Entities

### 1. USER
**Description:** All system users including Admin, Staff, Employee, and User roles.

**Data Flows FROM User:**
- Login Credentials (email, password)
- Registration Data (username, email, password, role, employeeId)
- Document Submission (document data, file, metadata)
- Document Review Request (documentId, review comments, status)
- User Management Request (add/edit/delete user, update role)
- Employee Management Request (add/edit/delete employee)
- Office Management Request (add/edit/delete office)
- Document Type Management Request (add/edit/delete document type)
- Search/Query Request (filters, search terms)
- Profile Update Request (user profile data)

**Data Flows TO User:**
- Authentication Response (user data, role, session)
- Document Data (document details, status, history)
- Employee Data (employee list, employee details)
- Office Data (office list, office details)
- User Data (user list, user details)
- Document Type Data (document type list)
- Reports & Analytics (statistics, charts, PDF reports)
- Notifications (alerts, status updates)
- Search Results (filtered documents, employees, offices)
- System Messages (success/error messages)

---

### 2. SYSTEM
**Description:** External system components including notification services, file storage, and reporting engines.

**Data Flows FROM System:**
- Notification Triggers (delay alerts, status changes)
- File Storage Events (upload confirmations, file paths)
- System Logs (audit trail, activity logs)

**Data Flows TO System:**
- Notification Requests (send alerts, emails)
- File Storage Requests (upload files, retrieve files)
- Report Generation Requests (generate PDFs, exports)

---

### 3. DATABASE (MongoDB)
**Description:** Persistent data storage for all system entities.

**Data Flows FROM Database:**
- User Records
- Employee Records
- Document Records
- Office Records
- Document Type Records
- Routing History
- Scan History

**Data Flows TO Database:**
- User Data (create/update/delete)
- Employee Data (create/update/delete)
- Document Data (create/update/delete)
- Office Data (create/update/delete)
- Document Type Data (create/update/delete)
- Routing History Updates
- Scan History Updates

---

## Data Flow Descriptions

### Authentication Flows
1. **Login Credentials** → System → **Authentication Response**
2. **Registration Data** → System → **User Account Created**

### Document Management Flows
3. **Document Submission** → System → **Document Data** (with status)
4. **Document Review Request** → System → **Updated Document Data**
5. **Search/Query Request** → System → **Search Results**

### Management Flows
6. **User Management Request** → System → **User Data**
7. **Employee Management Request** → System → **Employee Data**
8. **Office Management Request** → System → **Office Data**
9. **Document Type Management Request** → System → **Document Type Data**

### Reporting Flows
10. **Report Request** → System → **Reports & Analytics**

### Notification Flows
11. **System Events** → System → **Notifications** → User

---

## Data Stores (Internal to System)

The following data stores are maintained within the Autodoxis System:

- **D1: Users** - User accounts and authentication data
- **D2: Employees** - Employee records and organizational data
- **D3: Documents** - Document records, routing history, and status
- **D4: Offices** - Office records and organizational structure
- **D5: DocumentTypes** - Document type definitions and templates

---

## System Boundary

The Autodoxis System boundary includes:
- ✅ Authentication & Authorization Logic
- ✅ Business Logic (routing, review, approval)
- ✅ Data Validation & Processing
- ✅ Report Generation
- ✅ Notification Management

The system boundary excludes:
- ❌ Database Storage (external MongoDB)
- ❌ File Storage System (external storage)
- ❌ Email/Notification Services (external services)
- ❌ User's Browser/Client (external)

---

## Notes

1. **Single Process Representation:** At Level 0, the entire system is shown as one process to provide a high-level overview.

2. **External Entities:** Only entities outside the system boundary are shown. Internal data stores are detailed in Level 1 DFD.

3. **Bidirectional Flows:** Most data flows are bidirectional - requests flow in, responses flow out.

4. **Database as External Entity:** While MongoDB is technically part of the system infrastructure, it's shown as external to emphasize the separation between application logic and data storage.

5. **System Entity:** Represents external services and integrations that the system interacts with (notifications, file storage, etc.).

---

## Legend

- **Rectangle:** External Entity
- **Circle/Bubble:** Process (System)
- **Open Rectangle:** Data Store (shown in Level 1)
- **Arrow:** Data Flow (labeled with data description)

