const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Program = sequelize.define('Program', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  programId: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  description: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  officeId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'offices',
      key: 'id'
    }
  }
}, {
  tableName: 'programs',
  timestamps: true,
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
});

// Define associations
Program.associate = function(models) {
  // Program belongs to Office (Faculty)
  Program.belongsTo(models.Office, { foreignKey: 'officeId', as: 'office' });
  
  // Program has many Employees
  Program.hasMany(models.Employee, { foreignKey: 'programId', as: 'employees' });
};

module.exports = Program;

