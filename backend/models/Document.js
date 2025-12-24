const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Document = sequelize.define('Document', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  documentId: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  type: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  dateUploaded: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  status: {
    type: DataTypes.ENUM('Submitted', 'Under Review', 'Approved', 'Rejected', 'Processing', 'On Hold', 'Returned'),
    defaultValue: 'Submitted'
  },
  submittedBy: {
    type: DataTypes.STRING(255),
    defaultValue: ''
  },
  description: {
    type: DataTypes.TEXT,
    defaultValue: ''
  },
  reviewer: {
    type: DataTypes.STRING(255),
    defaultValue: ''
  },
  reviewDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  comments: {
    type: DataTypes.TEXT,
    defaultValue: ''
  },
  filePath: {
    type: DataTypes.STRING(500),
    defaultValue: ''
  },
  nextOffice: {
    type: DataTypes.STRING(255),
    defaultValue: ''
  },
  qrCode: {
    type: DataTypes.TEXT,
    defaultValue: ''
  },
  barcode: {
    type: DataTypes.TEXT,
    defaultValue: ''
  },
  priority: {
    type: DataTypes.ENUM('Low', 'Normal', 'High', 'Urgent'),
    defaultValue: 'Normal'
  },
  currentOffice: {
    type: DataTypes.STRING(255),
    defaultValue: ''
  },
  expectedProcessingTime: {
    type: DataTypes.INTEGER,
    defaultValue: 24
  },
  currentStageStartTime: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  isDelayed: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  delayedHours: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  routingHistory: {
    type: DataTypes.JSON,
    allowNull: true
  },
  scanHistory: {
    type: DataTypes.JSON,
    allowNull: true
  },
  tags: {
    type: DataTypes.JSON,
    allowNull: true
  },
  department: {
    type: DataTypes.STRING(255),
    defaultValue: ''
  },
  category: {
    type: DataTypes.STRING(255),
    defaultValue: ''
  },
  currentHandlerId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'employees',
      key: 'id'
    }
  },
  forwardedBy: {
    type: DataTypes.STRING(255),
    defaultValue: ''
  },
  forwardedDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  travelOrderDepartureDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  travelOrderDepartureTime: {
    type: DataTypes.STRING(50),
    defaultValue: ''
  },
  travelOrderReturnDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  travelOrderReturnTime: {
    type: DataTypes.STRING(50),
    defaultValue: ''
  }
}, {
  tableName: 'documents',
  timestamps: true,
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
});

// Define associations after Employee model is loaded
Document.associate = function(models) {
  Document.belongsTo(models.Employee, { foreignKey: 'currentHandlerId', as: 'currentHandler' });
  
  // Many-to-many relationship for assigned employees
  Document.belongsToMany(models.Employee, { 
    through: 'document_employees', 
    foreignKey: 'documentId', 
    otherKey: 'employeeId', 
    as: 'assignedTo' 
  });
};

module.exports = Document;
