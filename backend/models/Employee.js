const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Employee = sequelize.define('Employee', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  employeeId: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  position: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  department: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  role: {
    type: DataTypes.STRING(50),
    defaultValue: ''
  },
  officeId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'offices',
      key: 'id'
    }
  },
  programId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'programs',
      key: 'id'
    }
  }
}, {
  tableName: 'employees',
  timestamps: true,
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
});

// Define associations after Office model is loaded
Employee.associate = function(models) {
  Employee.belongsTo(models.Office, { foreignKey: 'officeId', as: 'office' });
  Employee.belongsTo(models.Program, { foreignKey: 'programId', as: 'program' });
  
  // Many-to-many relationship through junction table
  Employee.belongsToMany(models.Office, { 
    through: 'office_employees', 
    foreignKey: 'employeeId', 
    otherKey: 'officeId', 
    as: 'employeeOffices' 
  });
};

module.exports = Employee;
