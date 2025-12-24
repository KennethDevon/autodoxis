-- AutoDoxis MySQL Database Schema
-- Run this SQL script to create the database and tables
-- Make sure MySQL is running and you have appropriate permissions

-- Create database (if it doesn't exist)
CREATE DATABASE IF NOT EXISTS autodoxis CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE autodoxis;


CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(255) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  employeeId VARCHAR(255) NULL,
  role VARCHAR(50) DEFAULT '',
  date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_username (username),
  INDEX idx_employeeId (employeeId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE IF NOT EXISTS offices (
  id INT AUTO_INCREMENT PRIMARY KEY,
  officeId VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  department VARCHAR(255) NOT NULL,
  location VARCHAR(255) DEFAULT '',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_officeId (officeId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE IF NOT EXISTS employees (
  id INT AUTO_INCREMENT PRIMARY KEY,
  employeeId VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  position VARCHAR(255) NOT NULL,
  department VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT '',
  officeId INT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (officeId) REFERENCES offices(id) ON DELETE SET NULL,
  INDEX idx_employeeId (employeeId),
  INDEX idx_officeId (officeId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Junction table for office-employee relationship (many-to-many)
CREATE TABLE IF NOT EXISTS office_employees (
  id INT AUTO_INCREMENT PRIMARY KEY,
  officeId INT NOT NULL,
  employeeId INT NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (officeId) REFERENCES offices(id) ON DELETE CASCADE,
  FOREIGN KEY (employeeId) REFERENCES employees(id) ON DELETE CASCADE,
  UNIQUE KEY unique_office_employee (officeId, employeeId),
  INDEX idx_officeId (officeId),
  INDEX idx_employeeId (employeeId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: document_types
CREATE TABLE IF NOT EXISTS document_types (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  isActive BOOLEAN DEFAULT TRUE,
  dateCreated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  dateUploaded VARCHAR(255) DEFAULT '',
  timeUploaded VARCHAR(255) DEFAULT '',
  uploadedBy VARCHAR(255) DEFAULT '',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_name (name),
  INDEX idx_isActive (isActive)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: documents
CREATE TABLE IF NOT EXISTS documents (
  id INT AUTO_INCREMENT PRIMARY KEY,
  documentId VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(255) NOT NULL,
  dateUploaded TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status ENUM('Submitted', 'Under Review', 'Approved', 'Rejected', 'Processing', 'On Hold', 'Returned') DEFAULT 'Submitted',
  submittedBy VARCHAR(255) DEFAULT '',
  description TEXT,
  reviewer VARCHAR(255) DEFAULT '',
  reviewDate TIMESTAMP NULL,
  comments TEXT,
  filePath VARCHAR(500) DEFAULT '',
  nextOffice VARCHAR(255) DEFAULT '',
  qrCode TEXT,
  barcode TEXT,
  priority ENUM('Low', 'Normal', 'High', 'Urgent') DEFAULT 'Normal',
  currentOffice VARCHAR(255) DEFAULT '',
  expectedProcessingTime INT DEFAULT 24,
  currentStageStartTime TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  isDelayed BOOLEAN DEFAULT FALSE,
  delayedHours INT DEFAULT 0,
  routingHistory JSON DEFAULT NULL,
  scanHistory JSON DEFAULT NULL,
  tags JSON DEFAULT NULL,
  department VARCHAR(255) DEFAULT '',
  category VARCHAR(255) DEFAULT '',
  currentHandlerId INT NULL,
  forwardedBy VARCHAR(255) DEFAULT '',
  forwardedDate TIMESTAMP NULL,
  travelOrderDepartureDate TIMESTAMP NULL,
  travelOrderDepartureTime VARCHAR(50) DEFAULT '',
  travelOrderReturnDate TIMESTAMP NULL,
  travelOrderReturnTime VARCHAR(50) DEFAULT '',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (currentHandlerId) REFERENCES employees(id) ON DELETE SET NULL,
  INDEX idx_documentId (documentId),
  INDEX idx_status (status),
  INDEX idx_submittedBy (submittedBy),
  INDEX idx_type (type),
  INDEX idx_currentHandlerId (currentHandlerId),
  INDEX idx_dateUploaded (dateUploaded)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Junction table for document-employee assignment (many-to-many)
CREATE TABLE IF NOT EXISTS document_employees (
  id INT AUTO_INCREMENT PRIMARY KEY,
  documentId INT NOT NULL,
  employeeId INT NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (documentId) REFERENCES documents(id) ON DELETE CASCADE,
  FOREIGN KEY (employeeId) REFERENCES employees(id) ON DELETE CASCADE,
  UNIQUE KEY unique_document_employee (documentId, employeeId),
  INDEX idx_documentId (documentId),
  INDEX idx_employeeId (employeeId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: notifications
CREATE TABLE IF NOT EXISTS notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId VARCHAR(255) NOT NULL,
  employeeId INT NULL,
  type ENUM('document_uploaded', 'document_updated', 'document_assigned', 'document_forwarded', 'document_approved', 'document_rejected', 'file_updated') NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  documentId INT NULL,
  documentName VARCHAR(255) DEFAULT '',
  `read` BOOLEAN DEFAULT FALSE,
  metadata JSON DEFAULT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (employeeId) REFERENCES employees(id) ON DELETE CASCADE,
  FOREIGN KEY (documentId) REFERENCES documents(id) ON DELETE CASCADE,
  INDEX idx_userId (userId),
  INDEX idx_employeeId (employeeId),
  INDEX idx_documentId (documentId),
  INDEX idx_read (`read`),
  INDEX idx_createdAt (createdAt),
  INDEX idx_user_read_created (userId, `read`, createdAt),
  INDEX idx_employee_read_created (employeeId, `read`, createdAt)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: verification_codes
CREATE TABLE IF NOT EXISTS verification_codes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  code VARCHAR(10) NOT NULL,
  userId INT NOT NULL,
  expiresAt TIMESTAMP NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_email (email),
  INDEX idx_code (code),
  INDEX idx_userId (userId),
  INDEX idx_expiresAt (expiresAt),
  INDEX idx_email_code_used (email, code, used)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create a stored procedure to clean up expired verification codes (optional)
DELIMITER //
CREATE PROCEDURE IF NOT EXISTS cleanup_expired_codes()
BEGIN
  DELETE FROM verification_codes WHERE expiresAt < NOW() AND used = FALSE;
END //
DELIMITER ;

-- Create an event to run cleanup daily (optional, requires EVENT_SCHEDULER enabled)
-- SET GLOBAL event_scheduler = ON;
-- CREATE EVENT IF NOT EXISTS cleanup_expired_codes_event
-- ON SCHEDULE EVERY 1 DAY
-- DO
--   CALL cleanup_expired_codes();
