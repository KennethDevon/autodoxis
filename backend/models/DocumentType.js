const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const DocumentType = sequelize.define('DocumentType', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true
  },
  description: {
    type: DataTypes.TEXT,
    defaultValue: ''
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  dateCreated: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  dateUploaded: {
    type: DataTypes.STRING(255),
    defaultValue: ''
  },
  timeUploaded: {
    type: DataTypes.STRING(255),
    defaultValue: ''
  },
  uploadedBy: {
    type: DataTypes.STRING(255),
    defaultValue: ''
  }
}, {
  tableName: 'document_types',
  timestamps: true,
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
});

module.exports = DocumentType;
