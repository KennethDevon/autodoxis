# Autodoxis System - Site Map

## Access Levels Legend

| Color | Role | Description |
|-------|------|-------------|
| 🔴 **Red** | Admin Only | Super Admin access with full system control |
| 🟡 **Yellow** | Admin Only | Administrative access to management features |
| 🟢 **Light Green** | Staff Only | Staff-level access for document processing |
| 🟢 **Dark Green** | Employee Only | Employee access for document submission |
| 🔵 **Blue** | User Only | Basic user access for document submission |
| 🟠 **Orange** | All Users | Accessible to all authenticated users |
| 🟣 **Purple** | Multiple Roles | Accessible to multiple role types |

---

## User Flow

```
┌─────────────┐
│ Onboarding  │ 🟠 All Users
└──────┬──────┘
       │
       ├───→ ┌────────┐
       │     │ Signup │ 🟣 Multiple Roles
       │     └────────┘
       │
       └───→ ┌────────┐
             │ Login  │ 🟠 All Users
             └───┬────┘
                 │
                 ├───→ ┌──────────────────────┐
                 │     │ Super Admin Dashboard │ 🔴 Admin Only
                 │     └───────────┬──────────┘
                 │                 │
                 │                 └───→ User Management 🔴
                 │
                 ├───→ ┌──────────────────┐
                 │     │ Admin Dashboard   │ 🟡 Admin Only
                 │     └─────────┬─────────┘
                 │               │
                 │               ├───→ Office Management 🟡
                 │               │
                 │               └───→ Employee Management 🟡
                 │
                 ├───→ ┌──────────────────┐
                 │     │ Staff Dashboard   │ 🟢 Staff Only
                 │     └─────────┬─────────┘
                 │               │
                 │               └───→ Document Management 🟢
                 │
                 ├───→ ┌────────────────────┐
                 │     │ Employee Dashboard │ 🟢 Employee Only
                 │     └──────────┬─────────┘
                 │                │
                 │                └───→ Document Management 🟢
                 │
                 └───→ ┌────────────────┐
                       │ User Dashboard  │ 🔵 User Only
                       └────────┬────────┘
                                │
                                └───→ Submit Management 🔵
```

---

## Dashboard Structure

### 🔴 Super Admin Dashboard
**Access:** Admin Only  
**Component:** `aboard.js`

**Management Sections:**
- **User Management** 🔴
  - View Users
  - Add User
  - Edit User
  - Update Roles
  - Manage Accounts

**Available Actions:**
- Update Document
- Review Status
- Add Document
- Recent Submissions
- Notifications
- Document Tracking
- Remove Office
- Add Office
- Remove Employee
- Edit Employee
- Add Employee
- Manage Accounts
- Update Roles
- View Users
- Logout
- Edit Profile
- Profile

---

### 🟡 Admin Dashboard
**Access:** Admin Only  
**Component:** `aboard.js`

**Management Sections:**
- **Office Management** 🟡
  - Add Office
  - Edit Office
  - Remove Office
  - View Offices

- **Employee Management** 🟡
  - Add Employee
  - Edit Employee
  - Remove Employee
  - View Employees

- **Document Management** 🟡
  - Add Document
  - Update Document
  - Review Status
  - Document Tracking

- **User Management** 🟡
  - View Users
  - Add User
  - Edit User
  - Update Roles

- **Document Type Management** 🟡
  - Add Document Type
  - Edit Document Type
  - Remove Document Type
  - View Document Types

- **Reports** 🟡
  - Dashboard Statistics
  - Document Analytics
  - Performance Reports

**Available Actions:**
- Update Document
- Review Status
- Add Document
- Recent Submissions
- Notifications
- Document Tracking
- Remove Office
- Add Office
- Remove Employee
- Edit Employee
- Add Employee
- Manage Accounts
- Update Roles
- View Users
- Logout
- Edit Profile
- Profile

---

### 🟢 Staff Dashboard
**Access:** Staff Only  
**Component:** `edashboard.js`

**Management Sections:**
- **Document Management** 🟢
  - Submit Document
  - Review Status
  - Document Tracking
  - Recent Submissions

**Available Actions:**
- Add Document
- Review Status
- Recent Submissions
- Notifications
- Document Tracking
- Logout
- Edit Profile
- Profile

---

### 🟢 Employee Dashboard
**Access:** Employee Only  
**Component:** `edashboard.js`

**Management Sections:**
- **Document Management** 🟢
  - Submit Document
  - Review Status
  - Document Tracking
  - Recent Submissions
  - History Logs

**Available Actions:**
- Add Document
- Review Status
- Recent Submissions
- Notifications
- Document Tracking
- Logout
- Edit Profile
- Profile

---

### 🔵 User Dashboard
**Access:** User Only  
**Component:** `edashboard.js`

**Management Sections:**
- **Submit Management** 🔵
  - Submit Document
  - Review Status
  - Document Tracking

**Available Actions:**
- Add Document
- Review Status
- Document Tracking
- Logout
- Edit Profile
- Profile

---

## Available Actions by Category

### Document Actions
- **Add Document** 🟠 (All Users)
- **Update Document** 🟡 (Admin Only)
- **Review Status** 🟠 (All Users)
- **Document Tracking** 🟠 (All Users)
- **Recent Submissions** 🟠 (All Users)

### Office Actions
- **Add Office** 🟡 (Admin Only)
- **Remove Office** 🟡 (Admin Only)
- **Edit Office** 🟡 (Admin Only)

### Employee Actions
- **Add Employee** 🟡 (Admin Only)
- **Edit Employee** 🟡 (Admin Only)
- **Remove Employee** 🟡 (Admin Only)

### User Management Actions
- **Manage Accounts** 🔴 (Super Admin Only)
- **Update Roles** 🟡 (Admin Only)
- **View Users** 🟡 (Admin Only)
- **Add User** 🟡 (Admin Only)
- **Edit User** 🟡 (Admin Only)

### System Actions
- **Notifications** 🟠 (All Users)
- **Profile** 🟠 (All Users)
- **Edit Profile** 🟠 (All Users)
- **Logout** 🟠 (All Users)

---

## Navigation Structure

### Admin Dashboard Navigation (`aboard.js`)
1. **Dashboard** → Reports & Statistics
2. **Employees** → Employee Management
3. **Offices** → Office Management
4. **Documents** → Document Management
5. **Users** → User Management
6. **Document List** → Document List View
7. **Document Type** → Document Type Management

### Employee/Staff/User Dashboard Navigation (`edashboard.js`)
1. **Dashboard** → Overview & Statistics
2. **Document Management** → Submit & Manage Documents
3. **History Logs** → View Document History

---

## Authentication Flow

```
┌─────────────┐
│   Landing   │
└──────┬──────┘
       │
       ├───→ ┌────────┐
       │     │ Signup │ 🟣 Multiple Roles
       │     └────────┘
       │
       └───→ ┌────────┐
             │ Login  │ 🟠 All Users
             └───┬────┘
                 │
                 ├───→ Role: Admin → Admin Dashboard
                 ├───→ Role: Staff → Staff Dashboard
                 ├───→ Role: User → User Dashboard
                 └───→ Role: Employee → Employee Dashboard
```

---

## Feature Matrix

| Feature | Admin | Staff | Employee | User |
|---------|-------|-------|----------|------|
| **Dashboard Access** | ✅ | ✅ | ✅ | ✅ |
| **Document Submission** | ✅ | ✅ | ✅ | ✅ |
| **Document Review** | ✅ | ✅ | ✅ | ❌ |
| **Document Tracking** | ✅ | ✅ | ✅ | ✅ |
| **Employee Management** | ✅ | ❌ | ❌ | ❌ |
| **Office Management** | ✅ | ❌ | ❌ | ❌ |
| **User Management** | ✅ | ❌ | ❌ | ❌ |
| **Document Type Management** | ✅ | ❌ | ❌ | ❌ |
| **Reports & Analytics** | ✅ | ❌ | ❌ | ❌ |
| **History Logs** | ✅ | ✅ | ✅ | ❌ |
| **Profile Management** | ✅ | ✅ | ✅ | ✅ |

---

## Component Mapping

| Component | File | Purpose |
|-----------|------|---------|
| **Admin Dashboard** | `src/aboard.js` | Main admin interface |
| **Employee Dashboard** | `src/edashboard.js` | Employee/Staff/User interface |
| **Login** | `src/Login.js` | Authentication |
| **Signup** | `src/Signup.js` | User registration |
| **Employee Management** | `src/Employee.js` | Employee CRUD operations |
| **Office Management** | `src/Office.js` | Office CRUD operations |
| **Document Management** | `src/Document.js` | Document CRUD operations |
| **Reports** | `src/Reports.js` | Analytics and reporting |

---

## Notes

- **Super Admin** (`sadmin@gmail.com`) has protected status and cannot have role modified
- **Admin Dashboard** integrates multiple management modules (Employee, Office, Document, Reports)
- **Employee Dashboard** is shared by Staff, Employee, and User roles with position-based document filtering
- Document visibility is filtered based on employee position (Communication, Program Head, Dean, etc.)
- All users can access profile management and logout functionality

