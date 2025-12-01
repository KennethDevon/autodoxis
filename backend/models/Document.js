const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
  documentId: {
    type: String,
    required: true,
    unique: true,
  },
  name: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    required: true,
  },
  dateUploaded: {
    type: Date,
    default: Date.now,
  },
  status: {
    type: String,
    enum: ['Submitted', 'Under Review', 'Approved', 'Rejected', 'Processing', 'On Hold', 'Returned'],
    default: 'Submitted',
  },
  submittedBy: {
    type: String,
    default: '',
  },
  description: {
    type: String,
    default: '',
  },
  reviewer: {
    type: String,
    default: '',
  },
  reviewDate: {
    type: Date,
    default: null,
  },
  comments: {
    type: String,
    default: '',
  },
  filePath: {
    type: String,
    default: '',
  },
  nextOffice: {
    type: String,
    default: '',
  },
  qrCode: {
    type: String,
    default: '',
  },
  barcode: {
    type: String,
    default: '',
  },
  // Delay Detection & Tracking Fields
  priority: {
    type: String,
    enum: ['Low', 'Normal', 'High', 'Urgent'],
    default: 'Normal',
  },
  currentOffice: {
    type: String,
    default: '',
  },
  expectedProcessingTime: {
    type: Number, // in hours
    default: 24,
  },
  currentStageStartTime: {
    type: Date,
    default: Date.now,
  },
  isDelayed: {
    type: Boolean,
    default: false,
  },
  delayedHours: {
    type: Number,
    default: 0,
  },
  routingHistory: [{
    office: {
      type: String,
      required: true,
    },
    action: {
      type: String,
      enum: ['received', 'reviewed', 'approved', 'rejected', 'forwarded', 'on_hold', 'returned'],
      required: true,
    },
    handler: {
      type: String,
      default: '',
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    comments: {
      type: String,
      default: '',
    },
    processingTime: {
      type: Number, // in hours
      default: 0,
    },
  }],
  scanHistory: [{
    scannedAt: {
      type: Date,
      default: Date.now,
    },
    scannedBy: {
      type: String,
      default: '',
    },
    location: {
      type: String,
      default: '',
    },
    action: {
      type: String,
      enum: ['viewed', 'downloaded', 'printed', 'transferred'],
      default: 'viewed',
    },
  }],
  // Searchable tags for advanced search
  tags: [{
    type: String,
  }],
  department: {
    type: String,
    default: '',
  },
  category: {
    type: String,
    default: '',
  },
  // Employee Access Control
  assignedTo: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee'
  }],
  currentHandler: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    default: null
  },
  forwardedBy: {
    type: String,
    default: '',
  },
  forwardedDate: {
    type: Date,
    default: null,
  },
});

module.exports = mongoose.model('Document', documentSchema);
