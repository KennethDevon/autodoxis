# AutoDoxis Data Dictionary

This document describes the database structure defined in `backend/config/schema.sql`.

## Database

- **Name:** `autodoxis`
- **Engine:** MySQL (InnoDB)
- **Character Set / Collation:** `utf8mb4` / `utf8mb4_unicode_ci`

---

## Table: `users`

Stores application user accounts.

| Column | Type | Null | Default | Key | Notes |
|---|---|---|---|---|---|
| `id` | INT | NO | AUTO_INCREMENT | PK | Internal user primary key |
| `username` | VARCHAR(255) | NO | - | UNIQUE | Login/display username |
| `email` | VARCHAR(255) | NO | - | UNIQUE | User email |
| `password` | VARCHAR(255) | NO | - | - | Hashed password |
| `employeeId` | VARCHAR(255) | YES | NULL | INDEX | External employee identifier |
| `role` | VARCHAR(50) | YES | `''` | - | Role string |
| `date` | TIMESTAMP | YES | CURRENT_TIMESTAMP | - | Legacy date field |
| `createdAt` | TIMESTAMP | YES | CURRENT_TIMESTAMP | - | Record creation time |
| `updatedAt` | TIMESTAMP | YES | CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | - | Last update time |

**Indexes**
- `idx_email` (`email`)
- `idx_username` (`username`)
- `idx_employeeId` (`employeeId`)

---

## Table: `offices`

Stores office metadata.

| Column | Type | Null | Default | Key | Notes |
|---|---|---|---|---|---|
| `id` | INT | NO | AUTO_INCREMENT | PK | Internal office primary key |
| `officeId` | VARCHAR(255) | NO | - | UNIQUE | External office identifier |
| `name` | VARCHAR(255) | NO | - | - | Office name |
| `department` | VARCHAR(255) | NO | - | - | Department ownership |
| `location` | VARCHAR(255) | YES | `''` | - | Physical/location text |
| `createdAt` | TIMESTAMP | YES | CURRENT_TIMESTAMP | - | Record creation time |
| `updatedAt` | TIMESTAMP | YES | CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | - | Last update time |

**Indexes**
- `idx_officeId` (`officeId`)

---

## Table: `employees`

Stores employee profile and assignment metadata.

| Column | Type | Null | Default | Key | Notes |
|---|---|---|---|---|---|
| `id` | INT | NO | AUTO_INCREMENT | PK | Internal employee primary key |
| `employeeId` | VARCHAR(255) | NO | - | UNIQUE | External employee identifier |
| `name` | VARCHAR(255) | NO | - | - | Employee full name |
| `position` | VARCHAR(255) | NO | - | - | Position title |
| `department` | VARCHAR(255) | NO | - | - | Department |
| `role` | VARCHAR(50) | YES | `''` | - | Role string |
| `officeId` | INT | YES | NULL | FK, INDEX | Primary office reference |
| `createdAt` | TIMESTAMP | YES | CURRENT_TIMESTAMP | - | Record creation time |
| `updatedAt` | TIMESTAMP | YES | CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | - | Last update time |

**Foreign Keys**
- `officeId` -> `offices.id` (`ON DELETE SET NULL`)

**Indexes**
- `idx_employeeId` (`employeeId`)
- `idx_officeId` (`officeId`)

---

## Table: `office_employees`

Junction table for many-to-many relationship between offices and employees.

| Column | Type | Null | Default | Key | Notes |
|---|---|---|---|---|---|
| `id` | INT | NO | AUTO_INCREMENT | PK | Internal junction primary key |
| `officeId` | INT | NO | - | FK, UNIQUE PART, INDEX | Office reference |
| `employeeId` | INT | NO | - | FK, UNIQUE PART, INDEX | Employee reference |
| `createdAt` | TIMESTAMP | YES | CURRENT_TIMESTAMP | - | Record creation time |

**Foreign Keys**
- `officeId` -> `offices.id` (`ON DELETE CASCADE`)
- `employeeId` -> `employees.id` (`ON DELETE CASCADE`)

**Constraints / Indexes**
- `unique_office_employee` UNIQUE (`officeId`, `employeeId`)
- `idx_officeId` (`officeId`)
- `idx_employeeId` (`employeeId`)

---

## Table: `document_types`

Stores configurable document type definitions.

| Column | Type | Null | Default | Key | Notes |
|---|---|---|---|---|---|
| `id` | INT | NO | AUTO_INCREMENT | PK | Internal document type primary key |
| `name` | VARCHAR(255) | NO | - | UNIQUE, INDEX | Document type name |
| `description` | TEXT | YES | NULL | - | Description/details |
| `isActive` | BOOLEAN | YES | TRUE | INDEX | Activation flag |
| `dateCreated` | TIMESTAMP | YES | CURRENT_TIMESTAMP | - | Type creation timestamp |
| `dateUploaded` | VARCHAR(255) | YES | `''` | - | Legacy upload date text |
| `timeUploaded` | VARCHAR(255) | YES | `''` | - | Legacy upload time text |
| `uploadedBy` | VARCHAR(255) | YES | `''` | - | Uploader label |
| `createdAt` | TIMESTAMP | YES | CURRENT_TIMESTAMP | - | Record creation time |
| `updatedAt` | TIMESTAMP | YES | CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | - | Last update time |

**Indexes**
- `idx_name` (`name`)
- `idx_isActive` (`isActive`)

---

## Table: `documents`

Core document records and routing metadata.

| Column | Type | Null | Default | Key | Notes |
|---|---|---|---|---|---|
| `id` | INT | NO | AUTO_INCREMENT | PK | Internal document primary key |
| `documentId` | VARCHAR(255) | NO | - | UNIQUE, INDEX | External document identifier |
| `name` | VARCHAR(255) | NO | - | - | Document title/name |
| `type` | VARCHAR(255) | NO | - | INDEX | Document type label |
| `dateUploaded` | TIMESTAMP | YES | CURRENT_TIMESTAMP | INDEX | Upload timestamp |
| `status` | ENUM(...) | YES | `Submitted` | INDEX | Workflow status |
| `submittedBy` | VARCHAR(255) | YES | `''` | INDEX | Submitter label/user |
| `description` | TEXT | YES | NULL | - | Description/details |
| `reviewer` | VARCHAR(255) | YES | `''` | - | Current/last reviewer |
| `reviewDate` | TIMESTAMP | YES | NULL | - | Review timestamp |
| `comments` | TEXT | YES | NULL | - | Review comments |
| `filePath` | VARCHAR(500) | YES | `''` | - | Stored file location/path |
| `nextOffice` | VARCHAR(255) | YES | `''` | - | Next routing destination |
| `qrCode` | TEXT | YES | NULL | - | QR content/data |
| `barcode` | TEXT | YES | NULL | - | Barcode content/data |
| `priority` | ENUM('Low','Normal','High','Urgent') | YES | `Normal` | - | Priority level |
| `currentOffice` | VARCHAR(255) | YES | `''` | - | Current office holder |
| `expectedProcessingTime` | INT | YES | `24` | - | SLA/expected time (hours) |
| `currentStageStartTime` | TIMESTAMP | YES | CURRENT_TIMESTAMP | - | Stage start timestamp |
| `isDelayed` | BOOLEAN | YES | FALSE | - | Delay flag |
| `delayedHours` | INT | YES | `0` | - | Delay amount in hours |
| `routingHistory` | JSON | YES | NULL | - | Routing event history |
| `scanHistory` | JSON | YES | NULL | - | Scan/trace history |
| `tags` | JSON | YES | NULL | - | Tag collection |
| `department` | VARCHAR(255) | YES | `''` | - | Department label |
| `category` | VARCHAR(255) | YES | `''` | - | Category label |
| `currentHandlerId` | INT | YES | NULL | FK, INDEX | Active employee handler |
| `forwardedBy` | VARCHAR(255) | YES | `''` | - | Forwarder label |
| `forwardedDate` | TIMESTAMP | YES | NULL | - | Forward timestamp |
| `travelOrderDepartureDate` | TIMESTAMP | YES | NULL | - | Travel order: departure date |
| `travelOrderDepartureTime` | VARCHAR(50) | YES | `''` | - | Travel order: departure time |
| `travelOrderReturnDate` | TIMESTAMP | YES | NULL | - | Travel order: return date |
| `travelOrderReturnTime` | VARCHAR(50) | YES | `''` | - | Travel order: return time |
| `createdAt` | TIMESTAMP | YES | CURRENT_TIMESTAMP | - | Record creation time |
| `updatedAt` | TIMESTAMP | YES | CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | - | Last update time |

**Status ENUM Values**
- `Submitted`
- `Under Review`
- `Approved`
- `Rejected`
- `Processing`
- `On Hold`
- `Returned`

**Foreign Keys**
- `currentHandlerId` -> `employees.id` (`ON DELETE SET NULL`)

**Indexes**
- `idx_documentId` (`documentId`)
- `idx_status` (`status`)
- `idx_submittedBy` (`submittedBy`)
- `idx_type` (`type`)
- `idx_currentHandlerId` (`currentHandlerId`)
- `idx_dateUploaded` (`dateUploaded`)

---

## Table: `document_employees`

Junction table for many-to-many relationship between documents and employees.

| Column | Type | Null | Default | Key | Notes |
|---|---|---|---|---|---|
| `id` | INT | NO | AUTO_INCREMENT | PK | Internal junction primary key |
| `documentId` | INT | NO | - | FK, UNIQUE PART, INDEX | Document reference |
| `employeeId` | INT | NO | - | FK, UNIQUE PART, INDEX | Employee reference |
| `createdAt` | TIMESTAMP | YES | CURRENT_TIMESTAMP | - | Record creation time |

**Foreign Keys**
- `documentId` -> `documents.id` (`ON DELETE CASCADE`)
- `employeeId` -> `employees.id` (`ON DELETE CASCADE`)

**Constraints / Indexes**
- `unique_document_employee` UNIQUE (`documentId`, `employeeId`)
- `idx_documentId` (`documentId`)
- `idx_employeeId` (`employeeId`)

---

## Table: `notifications`

Stores user/employee notification events.

| Column | Type | Null | Default | Key | Notes |
|---|---|---|---|---|---|
| `id` | INT | NO | AUTO_INCREMENT | PK | Internal notification primary key |
| `userId` | VARCHAR(255) | NO | - | INDEX | User identifier (string) |
| `employeeId` | INT | YES | NULL | FK, INDEX | Related employee |
| `type` | ENUM(...) | NO | - | - | Notification event type |
| `title` | VARCHAR(255) | NO | - | - | Notification title |
| `message` | TEXT | NO | - | - | Notification body |
| `documentId` | INT | YES | NULL | FK, INDEX | Related document |
| `documentName` | VARCHAR(255) | YES | `''` | - | Document display name |
| `read` | BOOLEAN | YES | FALSE | INDEX | Read/unread flag |
| `metadata` | JSON | YES | NULL | - | Additional event payload |
| `createdAt` | TIMESTAMP | YES | CURRENT_TIMESTAMP | INDEX | Record creation time |
| `updatedAt` | TIMESTAMP | YES | CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | - | Last update time |

**Type ENUM Values**
- `document_uploaded`
- `document_updated`
- `document_assigned`
- `document_forwarded`
- `document_approved`
- `document_rejected`
- `file_updated`

**Foreign Keys**
- `employeeId` -> `employees.id` (`ON DELETE CASCADE`)
- `documentId` -> `documents.id` (`ON DELETE CASCADE`)

**Indexes**
- `idx_userId` (`userId`)
- `idx_employeeId` (`employeeId`)
- `idx_documentId` (`documentId`)
- `idx_read` (`read`)
- `idx_createdAt` (`createdAt`)
- `idx_user_read_created` (`userId`, `read`, `createdAt`)
- `idx_employee_read_created` (`employeeId`, `read`, `createdAt`)

---

## Table: `verification_codes`

Stores one-time verification codes for email/user verification flows.

| Column | Type | Null | Default | Key | Notes |
|---|---|---|---|---|---|
| `id` | INT | NO | AUTO_INCREMENT | PK | Internal verification code primary key |
| `email` | VARCHAR(255) | NO | - | INDEX | Target email |
| `code` | VARCHAR(10) | NO | - | INDEX | Verification code |
| `userId` | INT | NO | - | FK, INDEX | Related user |
| `expiresAt` | TIMESTAMP | NO | - | INDEX | Expiration timestamp |
| `used` | BOOLEAN | YES | FALSE | - | Code usage flag |
| `createdAt` | TIMESTAMP | YES | CURRENT_TIMESTAMP | - | Record creation time |

**Foreign Keys**
- `userId` -> `users.id` (`ON DELETE CASCADE`)

**Indexes**
- `idx_email` (`email`)
- `idx_code` (`code`)
- `idx_userId` (`userId`)
- `idx_expiresAt` (`expiresAt`)
- `idx_email_code_used` (`email`, `code`, `used`)

---

## Relationships Overview

- `employees.officeId` -> `offices.id` (many employees to one primary office)
- `office_employees` creates many-to-many between `offices` and `employees`
- `documents.currentHandlerId` -> `employees.id`
- `document_employees` creates many-to-many between `documents` and `employees`
- `notifications.employeeId` -> `employees.id`
- `notifications.documentId` -> `documents.id`
- `verification_codes.userId` -> `users.id`

---

## Operational Objects

The schema also defines:

- **Stored Procedure:** `cleanup_expired_codes()`  
  Deletes expired unused rows from `verification_codes`.

- **Optional Scheduled Event (commented in schema):** `cleanup_expired_codes_event`  
  Intended to call the cleanup procedure daily when MySQL event scheduler is enabled.

---

*Generated from current `backend/config/schema.sql`.*
