const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Office = sequelize.define('Office', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  officeId: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  department: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  location: {
    type: DataTypes.STRING(255),
    defaultValue: ''
  }
}, {
  tableName: 'offices',
  timestamps: true,
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
});

// Define associations after Employee model is loaded
Office.associate = function(models) {
  Office.hasMany(models.Employee, { foreignKey: 'officeId', as: 'employees' });
  
  // Many-to-many relationship through junction table
  Office.belongsToMany(models.Employee, { 
    through: 'office_employees', 
    foreignKey: 'officeId', 
    otherKey: 'employeeId', 
    as: 'officeEmployees' 
  });
};

module.exports = Office;
