# Autodoxis System - Level 1 DFD

## Overview
The Level 1 DFD breaks down the Autodoxis System into major processes, showing how data flows between processes and data stores.

---

## Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                                                                                             │
│                                    AUTODOXIS SYSTEM                                         │
│                                                                                             │
│  ┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐                      │
│  │  1.0             │    │  2.0             │    │  3.0             │                      │
│  │  Authenticate    │    │  Manage Users    │    │  Manage          │                      │
│  │  User            │    │                  │    │  Employees       │                      │
│  └────────┬─────────┘    └────────┬─────────┘    └────────┬─────────┘                      │
│           │                       │                        │                                │
│           │                       │                        │                                │
│  ┌────────▼─────────┐    ┌────────▼─────────┐    ┌────────▼─────────┐                      │
│  │   D1: Users      │    │   D1: Users      │    │   D2: Employees  │                      │
│  └──────────────────┘    └──────────────────┘    └──────────────────┘                      │
│                                                                                             │
│  ┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐                      │
│  │  4.0             │    │  5.0             │    │  6.0             │                      │
│  │  Manage          │    │  Manage          │    │  Manage          │                      │
│  │  Offices         │    │  Documents       │    │  Document Types  │                      │
│  └────────┬─────────┘    └────────┬─────────┘    └────────┬─────────┘                      │
│           │                       │                        │                                │
│           │                       │                        │                                │
│  ┌────────▼─────────┐    ┌────────▼─────────┐    ┌────────▼─────────┐                      │
│  │   D4: Offices    │    │   D3: Documents  │    │   D5: Document   │                      │
│  └──────────────────┘    └──────────────────┘    │   Types          │                      │
│                                                   └──────────────────┘                      │
│                                                                                             │
│  ┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐                      │
│  │  7.0             │    │  8.0             │    │  9.0             │                      │
│  │  Route & Track   │    │  Review &        │    │  Generate        │                      │
│  │  Documents       │    │  Approve         │    │  Reports         │                      │
│  │                  │    │  Documents       │    │                  │                      │
│  └────────┬─────────┘    └────────┬─────────┘    └────────┬─────────┘                      │
│           │                       │                        │                                │
│           │                       │                        │                                │
│  ┌────────▼─────────┐    ┌────────▼─────────┐             │                                │
│  │   D3: Documents   │    │   D3: Documents   │             │                                │
│  │   (Routing       │    │   (Status &      │             │                                │
│  │    History)      │    │    Review)       │             │                                │
│  └──────────────────┘    └──────────────────┘             │                                │
│                                                          │                                │
│                                                          │                                │
│  ┌──────────────────────────────────────────────────────▼──────────────┐                  │
│  │                                                                      │                  │
│  │                          EXTERNAL ENTITIES                           │                  │
│  │                                                                      │                  │
│  │  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐     │                  │
│  │  │   USER   │    │  SYSTEM  │    │ DATABASE │    │  FILES   │     │                  │
│  │  └──────────┘    └──────────┘    └──────────┘    └──────────┘     │                  │
│  │                                                                      │                  │
│  └──────────────────────────────────────────────────────────────────────┘                  │
│                                                                                             │
└─────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Processes

### 1.0 Authenticate User
**Description:** Handles user login, registration, and authentication.

**Inputs:**
- Login Credentials (from User)
- Registration Data (from User)

**Outputs:**
- Authentication Response (to User)
- User Session Data (to D1: Users)
- User Account (to D1: Users)

**Data Stores:**
- **Reads from:** D1: Users
- **Writes to:** D1: Users

**Data Flows:**
- Login Credentials → 1.0 → [Validate] → D1: Users → [Read] → User Data → 1.0 → Authentication Response → User
- Registration Data → 1.0 → [Create] → D1: Users → User Account

---

### 2.0 Manage Users
**Description:** Handles CRUD operations for user accounts and role management.

**Inputs:**
- User Management Request (from User)
- User Data (from D1: Users)

**Outputs:**
- User Data (to User)
- Updated User Records (to D1: Users)

**Data Stores:**
- **Reads from:** D1: Users, D2: Employees
- **Writes to:** D1: Users

**Data Flows:**
- User Management Request → 2.0 → [Process] → D1: Users → [Read/Write] → Updated User Records → 2.0 → User Data → User
- Employee Data (from D2) → 2.0 → [Link] → User Records

---

### 3.0 Manage Employees
**Description:** Handles CRUD operations for employee records and office assignments.

**Inputs:**
- Employee Management Request (from User)
- Employee Data (from D2: Employees)
- Office Data (from D4: Offices)

**Outputs:**
- Employee Data (to User)
- Updated Employee Records (to D2: Employees)
- Office Assignment Updates (to D4: Offices)

**Data Stores:**
- **Reads from:** D2: Employees, D4: Offices
- **Writes to:** D2: Employees, D4: Offices

**Data Flows:**
- Employee Management Request → 3.0 → [Process] → D2: Employees → [Read/Write] → Updated Employee Records → 3.0 → Employee Data → User
- Office Assignment → 3.0 → D4: Offices → [Update] → Office Employee List

---

### 4.0 Manage Offices
**Description:** Handles CRUD operations for office records and employee assignments.

**Inputs:**
- Office Management Request (from User)
- Office Data (from D4: Offices)
- Employee Data (from D2: Employees)

**Outputs:**
- Office Data (to User)
- Updated Office Records (to D4: Offices)
- Employee Assignment Updates (to D2: Employees)

**Data Stores:**
- **Reads from:** D4: Offices, D2: Employees
- **Writes to:** D4: Offices, D2: Employees

**Data Flows:**
- Office Management Request → 4.0 → [Process] → D4: Offices → [Read/Write] → Updated Office Records → 4.0 → Office Data → User
- Employee Assignment → 4.0 → D2: Employees → [Update] → Employee Office Reference

---

### 5.0 Manage Documents
**Description:** Handles document creation, updates, retrieval, and basic document operations.

**Inputs:**
- Document Submission (from User)
- Document Management Request (from User)
- Document Data (from D3: Documents)
- Document Type Data (from D5: Document Types)
- Employee Data (from D2: Employees)

**Outputs:**
- Document Data (to User)
- New/Updated Document Records (to D3: Documents)

**Data Stores:**
- **Reads from:** D3: Documents, D5: Document Types, D2: Employees
- **Writes to:** D3: Documents

**Data Flows:**
- Document Submission → 5.0 → [Validate] → D5: Document Types → [Check] → Document Type Valid → 5.0 → [Create] → D3: Documents → New Document Record
- Document Management Request → 5.0 → D3: Documents → [Read/Update] → Updated Document Records → 5.0 → Document Data → User

---

### 6.0 Manage Document Types
**Description:** Handles CRUD operations for document type definitions.

**Inputs:**
- Document Type Management Request (from User)
- Document Type Data (from D5: Document Types)

**Outputs:**
- Document Type Data (to User)
- Updated Document Type Records (to D5: Document Types)

**Data Stores:**
- **Reads from:** D5: Document Types
- **Writes to:** D5: Document Types

**Data Flows:**
- Document Type Management Request → 6.0 → [Process] → D5: Document Types → [Read/Write] → Updated Document Type Records → 6.0 → Document Type Data → User

---

### 7.0 Route & Track Documents
**Description:** Handles document routing between offices, tracking, and delay detection.

**Inputs:**
- Routing Request (from User/Process 8.0)
- Document Data (from D3: Documents)
- Employee Data (from D2: Employees)
- Office Data (from D4: Offices)

**Outputs:**
- Routing History (to D3: Documents)
- Tracking Information (to User)
- Delay Alerts (to User/System)

**Data Stores:**
- **Reads from:** D3: Documents, D2: Employees, D4: Offices
- **Writes to:** D3: Documents (routing history, scan history)

**Data Flows:**
- Routing Request → 7.0 → D3: Documents → [Read] → Current Document Status → 7.0 → [Process Routing] → D4: Offices → [Get Next Office] → 7.0 → [Update] → D3: Documents → Routing History Updated
- Document Tracking Request → 7.0 → D3: Documents → [Read History] → Tracking Information → 7.0 → Tracking Data → User
- Delay Detection → 7.0 → D3: Documents → [Check Delays] → Delay Alerts → User/System

---

### 8.0 Review & Approve Documents
**Description:** Handles document review, approval, rejection, and status updates.

**Inputs:**
- Review Request (from User)
- Document Data (from D3: Documents)
- Employee Data (from D2: Employees)

**Outputs:**
- Updated Document Status (to D3: Documents)
- Review Comments (to D3: Documents)
- Review Results (to User)
- Routing Request (to Process 7.0)

**Data Stores:**
- **Reads from:** D3: Documents, D2: Employees
- **Writes to:** D3: Documents (status, review comments, review date)

**Data Flows:**
- Review Request → 8.0 → D3: Documents → [Read] → Document Details → 8.0 → [Process Review] → D3: Documents → [Update Status] → Updated Document Status
- Review Comments → 8.0 → D3: Documents → [Store] → Review History
- Approval/Rejection → 8.0 → Routing Request → 7.0 → [Route Document]

---

### 9.0 Generate Reports
**Description:** Generates analytics, statistics, and reports for documents, employees, and system performance.

**Inputs:**
- Report Request (from User)
- Document Data (from D3: Documents)
- Employee Data (from D2: Employees)
- Office Data (from D4: Offices)
- User Data (from D1: Users)

**Outputs:**
- Reports & Analytics (to User)
- PDF Reports (to User/System)
- Statistics (to User)

**Data Stores:**
- **Reads from:** D1: Users, D2: Employees, D3: Documents, D4: Offices

**Data Flows:**
- Report Request → 9.0 → D3: Documents → [Aggregate] → Document Statistics → 9.0 → Reports & Analytics → User
- Report Request → 9.0 → D2: Employees → [Aggregate] → Employee Statistics → 9.0 → Reports
- Report Request → 9.0 → D4: Offices → [Aggregate] → Office Statistics → 9.0 → Reports
- Analytics Data → 9.0 → [Generate PDF] → PDF Reports → User/System

---

## Data Stores

### D1: Users
**Description:** Stores user accounts, authentication data, and user roles.

**Contents:**
- User ID, username, email, password (hashed)
- Role, employeeId
- Account creation date

**Accessed by:**
- Process 1.0 (Authenticate User) - Read/Write
- Process 2.0 (Manage Users) - Read/Write
- Process 9.0 (Generate Reports) - Read

---

### D2: Employees
**Description:** Stores employee records, positions, departments, and office assignments.

**Contents:**
- Employee ID, name, position, department
- Role, office reference
- Employee details

**Accessed by:**
- Process 2.0 (Manage Users) - Read
- Process 3.0 (Manage Employees) - Read/Write
- Process 4.0 (Manage Offices) - Read/Write
- Process 5.0 (Manage Documents) - Read
- Process 7.0 (Route & Track Documents) - Read
- Process 8.0 (Review & Approve Documents) - Read
- Process 9.0 (Generate Reports) - Read

---

### D3: Documents
**Description:** Stores document records, routing history, scan history, and status information.

**Contents:**
- Document ID, name, type, status
- Submission data, review data
- Routing history, scan history
- Current office, next office
- Delay information, priority
- Assigned employees, current handler

**Accessed by:**
- Process 5.0 (Manage Documents) - Read/Write
- Process 7.0 (Route & Track Documents) - Read/Write
- Process 8.0 (Review & Approve Documents) - Read/Write
- Process 9.0 (Generate Reports) - Read

---

### D4: Offices
**Description:** Stores office records, employee assignments, and organizational structure.

**Contents:**
- Office ID, name, department
- Location, employee list
- Number of employees

**Accessed by:**
- Process 3.0 (Manage Employees) - Read/Write
- Process 4.0 (Manage Offices) - Read/Write
- Process 7.0 (Route & Track Documents) - Read
- Process 9.0 (Generate Reports) - Read

---

### D5: Document Types
**Description:** Stores document type definitions and templates.

**Contents:**
- Document type name, description
- Active status, creation date
- Upload metadata

**Accessed by:**
- Process 5.0 (Manage Documents) - Read
- Process 6.0 (Manage Document Types) - Read/Write

---

## Data Flow Summary

### User → System Flows
1. **Login Credentials** → 1.0 → Authentication
2. **Registration Data** → 1.0 → User Account Creation
3. **User Management Request** → 2.0 → User Management
4. **Employee Management Request** → 3.0 → Employee Management
5. **Office Management Request** → 4.0 → Office Management
6. **Document Submission** → 5.0 → Document Creation
7. **Document Management Request** → 5.0 → Document Operations
8. **Document Type Management Request** → 6.0 → Document Type Management
9. **Routing Request** → 7.0 → Document Routing
10. **Review Request** → 8.0 → Document Review
11. **Report Request** → 9.0 → Report Generation

### System → User Flows
1. **Authentication Response** ← 1.0 ← User Authentication
2. **User Data** ← 2.0 ← User Management
3. **Employee Data** ← 3.0 ← Employee Management
4. **Office Data** ← 4.0 ← Office Management
5. **Document Data** ← 5.0 ← Document Management
6. **Document Type Data** ← 6.0 ← Document Type Management
7. **Tracking Information** ← 7.0 ← Document Tracking
8. **Review Results** ← 8.0 ← Document Review
9. **Reports & Analytics** ← 9.0 ← Report Generation
10. **Notifications** ← System ← Delay Alerts, Status Updates

---

## Process Interactions

### Sequential Flows
1. **Document Lifecycle:**
   - 5.0 (Create Document) → 7.0 (Route Document) → 8.0 (Review Document) → 7.0 (Route to Next Office) → 8.0 (Final Approval)

2. **Employee Assignment:**
   - 3.0 (Create Employee) → 4.0 (Assign to Office) → 2.0 (Link to User Account)

3. **Document Review & Routing:**
   - 8.0 (Review Document) → 7.0 (Route Document) → 8.0 (Next Review)

### Parallel Processes
- Processes 2.0, 3.0, 4.0, 6.0 can operate independently (management operations)
- Process 9.0 reads from all data stores independently for reporting

---

## Notes

1. **Data Store Naming:** Data stores are prefixed with "D" (D1, D2, D3, D4, D5) following standard DFD conventions.

2. **Process Numbering:** Processes are numbered 1.0 through 9.0, with decimal notation indicating they are Level 1 processes.

3. **Bidirectional Flows:** Most processes have bidirectional data flows with data stores (read and write operations).

4. **External Entities:** User, System, Database, and Files are shown as external to the system boundary.

5. **Data Flow Labels:** Data flows are labeled with descriptive names indicating the type of data being transferred.

6. **Process Decomposition:** Each process can be further decomposed into Level 2 DFDs if needed for detailed analysis.

---

## Legend

- **Circle/Bubble:** Process (numbered 1.0, 2.0, etc.)
- **Open Rectangle:** Data Store (D1, D2, D3, D4, D5)
- **Rectangle:** External Entity (User, System, Database, Files)
- **Arrow:** Data Flow (labeled with data description)
- **Numbered Process:** Major system function

