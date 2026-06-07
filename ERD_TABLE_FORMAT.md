# AutoDoxis ERD (Easy View)

## Quick Relationship Map

- `offices` 1 -> many `employees`
- `offices` many <-> many `employees` via `office_employees`
- `documents` many <-> many `employees` via `document_employees`
- `employees` 1 -> many `documents` (through `documents.currentHandlerId`)
- `employees` 1 -> many `notifications`
- `documents` 1 -> many `notifications`
- `users` 1 -> many `verification_codes`

---

## A) Core Identity Tables

| Table | PK | FK | Purpose |
|---|---|---|---|
| `users` | `id` | - | Login/account records |
| `verification_codes` | `id` | `userId -> users.id` | OTP/email verification |

---

## B) Organization Tables

| Table | PK | FK | Purpose |
|---|---|---|---|
| `offices` | `id` | - | Office master list |
| `employees` | `id` | `officeId -> offices.id` | Employee profile/assignment |
| `office_employees` | `id` | `officeId -> offices.id`, `employeeId -> employees.id` | Office-employee bridge table |

**Bridge rule**
- `office_employees` unique pair: (`officeId`, `employeeId`)

---

## C) Document Workflow Tables

| Table | PK | FK | Purpose |
|---|---|---|---|
| `document_types` | `id` | - | Document type catalog |
| `documents` | `id` | `currentHandlerId -> employees.id` | Main document routing record |
| `document_employees` | `id` | `documentId -> documents.id`, `employeeId -> employees.id` | Document-employee bridge table |
| `notifications` | `id` | `employeeId -> employees.id`, `documentId -> documents.id` | Workflow/user alerts |

**Bridge rule**
- `document_employees` unique pair: (`documentId`, `employeeId`)

---

## D) Parent -> Child Reference List

| Parent | Child | Link Column |
|---|---|---|
| `offices` | `employees` | `employees.officeId` |
| `offices` | `office_employees` | `office_employees.officeId` |
| `employees` | `office_employees` | `office_employees.employeeId` |
| `employees` | `documents` | `documents.currentHandlerId` |
| `documents` | `document_employees` | `document_employees.documentId` |
| `employees` | `document_employees` | `document_employees.employeeId` |
| `employees` | `notifications` | `notifications.employeeId` |
| `documents` | `notifications` | `notifications.documentId` |
| `users` | `verification_codes` | `verification_codes.userId` |
