const mongoose = require('mongoose');

const documentTypeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  description: {
    type: String,
    default: '',
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  dateCreated: {
    type: Date,
    default: Date.now,
  },
  dateUploaded: {
    type: String,
    default: '',
  },
  timeUploaded: {
    type: String,
    default: '',
  },
  uploadedBy: {
    type: String,
    default: '',
  },
});

module.exports = mongoose.model('DocumentType', documentTypeSchema);

