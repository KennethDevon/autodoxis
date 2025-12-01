const mongoose = require('mongoose');

const officeSchema = new mongoose.Schema({
  officeId: {
    type: String,
    required: true,
    unique: true,
  },
  name: {
    type: String,
    required: true,
  },
  department: {
    type: String,
    required: true,
  },
  location: {
    type: String,
    default: '',
  },
  employees: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee'
  }],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Virtual field to calculate numberOfEmployees from the employees array
officeSchema.virtual('numberOfEmployees').get(function() {
  return this.employees ? this.employees.length : 0;
});

// Ensure virtual fields are included when converting to JSON
officeSchema.set('toJSON', { virtuals: true });
officeSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Office', officeSchema);
