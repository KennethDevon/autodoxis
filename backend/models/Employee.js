const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema({
  employeeId: {
    type: String,
    required: true,
    unique: true,
  },
  name: {
    type: String,
    required: true,
  },
  position: {
    type: String,
    required: true,
  },
  department: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    default: '',
  },
  office: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Office',
    default: null,
  },
});

module.exports = mongoose.model('Employee', employeeSchema);
