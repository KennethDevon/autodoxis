const express = require('express');
const router = express.Router();
const Document = require('../models/Document');
const Employee = require('../models/Employee');
const Office = require('../models/Office');
const QRCode = require('qrcode');
const JsBarcode = require('jsbarcode');

// Get all documents
router.get('/', async (req, res) => {
  try {
    const documents = await Document.find();
    res.json(documents);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get documents by user
router.get('/user/:submittedBy', async (req, res) => {
  try {
    const documents = await Document.find({ submittedBy: req.params.submittedBy });
    res.json(documents);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get one document
router.get('/:id', async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);
    if (document == null) {
      return res.status(404).json({ message: 'Cannot find document' });
    }
    res.json(document);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create one document
router.post('/', async (req, res) => {
  try {
    console.log('Creating document with data:', req.body);
    
    const document = new Document({
      documentId: req.body.documentId,
      name: req.body.name,
      type: req.body.type,
      dateUploaded: req.body.dateUploaded,
      status: req.body.status || 'Submitted',
      submittedBy: req.body.submittedBy,
      description: req.body.description || '',
      reviewer: req.body.reviewer || '',
      reviewDate: req.body.reviewDate || null,
      comments: req.body.comments || '',
      filePath: req.body.filePath || '',
      nextOffice: req.body.nextOffice || '',
      currentOffice: req.body.nextOffice || '', // Set currentOffice to match nextOffice initially
      category: req.body.category || '', // Save document category
      // Employee assignment fields
      assignedTo: req.body.assignedTo || [],
      currentHandler: req.body.currentHandler || null,
      forwardedBy: req.body.forwardedBy || '',
      forwardedDate: req.body.forwardedDate || null,
      // Travel Order specific fields
      travelOrderDepartureDate: req.body.travelOrderDepartureDate || null,
      travelOrderDepartureTime: req.body.travelOrderDepartureTime || '',
      travelOrderReturnDate: req.body.travelOrderReturnDate || null,
      travelOrderReturnTime: req.body.travelOrderReturnTime || ''
    });

    // If document is assigned to an employee, add routing history
    if (req.body.currentHandler) {
      const employee = await Employee.findById(req.body.currentHandler);
      if (employee) {
        document.routingHistory.push({
          office: employee.office?.name || employee.department || 'Employee',
          action: 'forwarded',
          handler: employee.name,
          timestamp: new Date(),
          comments: `Document forwarded to ${employee.name} by ${req.body.forwardedBy || 'System'}`
        });
      }
    }

    const newDocument = await document.save();
    console.log('Document created successfully:', newDocument._id);
    console.log('Assigned to employees:', newDocument.assignedTo);
    console.log('Current handler:', newDocument.currentHandler);
    
    res.status(201).json(newDocument);
  } catch (err) {
    console.error('Error creating document:', err);
    res.status(400).json({ message: err.message });
  }
});

// Update one document
router.patch('/:id', async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);
    if (document == null) {
      return res.status(404).json({ message: 'Cannot find document' });
    }
    if (req.body.documentId != null) {
      document.documentId = req.body.documentId;
    }
    if (req.body.name != null) {
      document.name = req.body.name;
    }
    if (req.body.type != null) {
      document.type = req.body.type;
    }
    if (req.body.dateUploaded != null) {
      document.dateUploaded = req.body.dateUploaded;
    }
    if (req.body.status != null) {
      document.status = req.body.status;
    }
    if (req.body.submittedBy != null) {
      document.submittedBy = req.body.submittedBy;
    }
    if (req.body.description != null) {
      document.description = req.body.description;
    }
    if (req.body.reviewer != null) {
      document.reviewer = req.body.reviewer;
    }
    if (req.body.reviewDate != null) {
      document.reviewDate = req.body.reviewDate;
    }
    if (req.body.comments != null) {
      document.comments = req.body.comments;
    }
    if (req.body.filePath != null) {
      document.filePath = req.body.filePath;
    }
    if (req.body.nextOffice != null) {
      document.nextOffice = req.body.nextOffice;
    }
    if (req.body.currentOffice != null) {
      document.currentOffice = req.body.currentOffice;
    }
    if (req.body.category != null) {
      document.category = req.body.category;
    }
    
    // Handle routing history update if provided
    if (req.body.$push && req.body.$push.routingHistory) {
      const historyEntry = req.body.$push.routingHistory;
      
      // Calculate processing time for previous stage
      if (document.routingHistory.length > 0) {
        const lastEntry = document.routingHistory[document.routingHistory.length - 1];
        const processingTime = (new Date() - new Date(lastEntry.timestamp || lastEntry.date || new Date())) / (1000 * 60 * 60);
        lastEntry.processingTime = Math.round(processingTime * 10) / 10;
      }
      
      // Add routing history entry
      document.routingHistory.push({
        office: historyEntry.toOffice || historyEntry.office || document.nextOffice || document.currentOffice,
        action: historyEntry.action || 'forwarded',
        handler: historyEntry.performedBy || historyEntry.handler || document.reviewer || 'Unknown',
        timestamp: new Date(historyEntry.date || Date.now()),
        comments: historyEntry.comments || '',
        processingTime: 0
      });
    }
    
    const updatedDocument = await document.save();
    console.log('✓ Document updated:', updatedDocument.documentId, '- Status:', updatedDocument.status, '- nextOffice:', updatedDocument.nextOffice, '- currentOffice:', updatedDocument.currentOffice);
    res.json(updatedDocument);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Get documents by status
router.get('/status/:status', async (req, res) => {
  try {
    const documents = await Document.find({ status: req.params.status });
    res.json(documents);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get documents pending review
router.get('/pending/review', async (req, res) => {
  try {
    const documents = await Document.find({ 
      status: { $in: ['Submitted', 'Under Review'] } 
    });
    res.json(documents);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Approve document
router.patch('/:id/approve', async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);
    if (document == null) {
      return res.status(404).json({ message: 'Cannot find document' });
    }
    
    document.status = 'Approved';
    document.reviewer = req.body.reviewer || '';
    document.reviewDate = new Date();
    document.comments = req.body.comments || '';
    
    const updatedDocument = await document.save();
    res.json(updatedDocument);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Reject document
router.patch('/:id/reject', async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);
    if (document == null) {
      return res.status(404).json({ message: 'Cannot find document' });
    }
    
    document.status = 'Rejected';
    document.reviewer = req.body.reviewer || '';
    document.reviewDate = new Date();
    document.comments = req.body.comments || '';
    
    const updatedDocument = await document.save();
    res.json(updatedDocument);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Receive document (Receiver workflow)
router.patch('/:id/receive', async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);
    if (document == null) {
      return res.status(404).json({ message: 'Cannot find document' });
    }
    
    document.status = 'On Hold';
    document.reviewer = req.body.reviewer || '';
    document.reviewDate = new Date();
    document.comments = req.body.comments || '';
    
    const updatedDocument = await document.save();
    res.json(updatedDocument);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Return document (Receiver workflow)
router.patch('/:id/return', async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);
    if (document == null) {
      return res.status(404).json({ message: 'Cannot find document' });
    }
    
    document.status = 'Returned';
    document.reviewer = req.body.reviewer || '';
    document.reviewDate = new Date();
    document.comments = req.body.comments || '';
    
    const updatedDocument = await document.save();
    res.json(updatedDocument);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Forward document to next office
router.patch('/:id/forward', async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);
    if (document == null) {
      return res.status(404).json({ message: 'Cannot find document' });
    }
    
    // Calculate processing time for previous stage
    if (document.routingHistory.length > 0) {
      const lastEntry = document.routingHistory[document.routingHistory.length - 1];
      const processingTime = (new Date() - new Date(lastEntry.timestamp)) / (1000 * 60 * 60);
      lastEntry.processingTime = Math.round(processingTime * 10) / 10;
    }
    
    // Add routing history entry
    if (req.body.nextOffice) {
      document.routingHistory.push({
        office: req.body.nextOffice,
        action: 'forwarded',
        handler: req.body.reviewer || 'Admin',
        timestamp: new Date(),
        comments: req.body.comments || `Forwarded to ${req.body.nextOffice}`,
        processingTime: 0
      });
    }
    
    document.status = req.body.status || 'Processing';
    document.reviewer = req.body.reviewer || '';
    document.reviewDate = new Date();
    document.comments = req.body.comments || '';
    document.nextOffice = req.body.nextOffice || '';
    if (req.body.currentOffice) {
      document.currentOffice = req.body.currentOffice;
    }
    // Update current stage start time
    document.currentStageStartTime = new Date();
    // Reset delay status for new stage
    document.isDelayed = false;
    document.delayedHours = 0;
    
    const updatedDocument = await document.save();
    res.json(updatedDocument);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Get documents by reviewer
router.get('/reviewer/:reviewer', async (req, res) => {
  try {
    const documents = await Document.find({ reviewer: req.params.reviewer });
    res.json(documents);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get document statistics
router.get('/stats/overview', async (req, res) => {
  try {
    const stats = await Document.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);
    
    const formattedStats = {};
    stats.forEach(stat => {
      formattedStats[stat._id] = stat.count;
    });
    
    res.json(formattedStats);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete one document
router.delete('/:id', async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);
    if (document == null) {
      return res.status(404).json({ message: 'Cannot find document' });
    }
    await Document.deleteOne({ _id: req.params.id });
    res.json({ message: 'Deleted Document' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Generate QR code for document
router.get('/:id/qrcode', async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);
    if (document == null) {
      return res.status(404).json({ message: 'Cannot find document' });
    }

    // Create QR code data with document information
    const qrData = {
      documentId: document.documentId,
      name: document.name,
      type: document.type,
      status: document.status,
      url: `${req.protocol}://${req.get('host')}/documents/${document._id}`,
      timestamp: new Date().toISOString()
    };

    // Generate QR code as data URL
    const qrCodeDataURL = await QRCode.toDataURL(JSON.stringify(qrData), {
      errorCorrectionLevel: 'M',
      type: 'image/png',
      quality: 0.92,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });

    // Update document with QR code if not already set
    if (!document.qrCode) {
      document.qrCode = qrCodeDataURL;
      await document.save();
    }

    res.json({
      qrCode: qrCodeDataURL,
      documentId: document.documentId,
      documentName: document.name
    });
  } catch (err) {
    console.error('Error generating QR code:', err);
    res.status(500).json({ message: err.message });
  }
});

// Generate barcode for document
router.get('/:id/barcode', async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);
    if (document == null) {
      return res.status(404).json({ message: 'Cannot find document' });
    }

    // Generate barcode using document ID
    const canvas = require('canvas').createCanvas(200, 50);
    JsBarcode(canvas, document.documentId, {
      format: "CODE128",
      width: 2,
      height: 50,
      displayValue: true,
      fontSize: 14,
      margin: 10
    });

    const barcodeDataURL = canvas.toDataURL();

    // Update document with barcode if not already set
    if (!document.barcode) {
      document.barcode = barcodeDataURL;
      await document.save();
    }

    res.json({
      barcode: barcodeDataURL,
      documentId: document.documentId,
      documentName: document.name
    });
  } catch (err) {
    console.error('Error generating barcode:', err);
    res.status(500).json({ message: err.message });
  }
});

// Scan document (track access)
router.post('/:id/scan', async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);
    if (document == null) {
      return res.status(404).json({ message: 'Cannot find document' });
    }

    // Add scan history entry
    const scanEntry = {
      scannedAt: new Date(),
      scannedBy: req.body.scannedBy || 'Anonymous',
      location: req.body.location || 'Unknown',
      action: req.body.action || 'viewed'
    };

    document.scanHistory.push(scanEntry);
    await document.save();

    res.json({
      message: 'Scan recorded successfully',
      document: {
        documentId: document.documentId,
        name: document.name,
        status: document.status,
        lastScanned: scanEntry.scannedAt
      }
    });
  } catch (err) {
    console.error('Error recording scan:', err);
    res.status(500).json({ message: err.message });
  }
});

// Get document scan history
router.get('/:id/scan-history', async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);
    if (document == null) {
      return res.status(404).json({ message: 'Cannot find document' });
    }

    res.json({
      documentId: document.documentId,
      documentName: document.name,
      scanHistory: document.scanHistory.sort((a, b) => new Date(b.scannedAt) - new Date(a.scannedAt))
    });
  } catch (err) {
    console.error('Error fetching scan history:', err);
    res.status(500).json({ message: err.message });
  }
});

// Auto-generate QR codes and barcodes for new documents
router.post('/', async (req, res) => {
  try {
    const document = new Document({
      documentId: req.body.documentId,
      name: req.body.name,
      type: req.body.type,
      dateUploaded: req.body.dateUploaded,
      status: req.body.status || 'Submitted',
      submittedBy: req.body.submittedBy,
      description: req.body.description || '',
      reviewer: req.body.reviewer || '',
      reviewDate: req.body.reviewDate || null,
      comments: req.body.comments || '',
      filePath: req.body.filePath || '',
      nextOffice: req.body.nextOffice || ''
    });

    const newDocument = await document.save();

    // Generate QR code and barcode for the new document
    try {
      const qrData = {
        documentId: newDocument.documentId,
        name: newDocument.name,
        type: newDocument.type,
        status: newDocument.status,
        url: `${req.protocol}://${req.get('host')}/documents/${newDocument._id}`,
        timestamp: new Date().toISOString()
      };

      const qrCodeDataURL = await QRCode.toDataURL(JSON.stringify(qrData));
      newDocument.qrCode = qrCodeDataURL;

      // Generate barcode
      const canvas = require('canvas').createCanvas(200, 50);
      JsBarcode(canvas, newDocument.documentId, {
        format: "CODE128",
        width: 2,
        height: 50,
        displayValue: true,
        fontSize: 14,
        margin: 10
      });
      newDocument.barcode = canvas.toDataURL();

      await newDocument.save();
    } catch (qrError) {
      console.error('Error generating QR/barcode for new document:', qrError);
      // Don't fail the document creation if QR/barcode generation fails
    }

    res.status(201).json(newDocument);
  } catch (err) {
    console.error('Error creating document:', err);
    res.status(400).json({ message: err.message });
  }
});

// Advanced Search Route
router.post('/search/advanced', async (req, res) => {
  try {
    const { 
      documentId, 
      name, 
      type, 
      status, 
      submittedBy, 
      currentOffice, 
      priority,
      department,
      category,
      dateFrom, 
      dateTo,
      tags 
    } = req.body;

    let query = {};

    // Build search query based on provided filters
    if (documentId) {
      query.documentId = { $regex: documentId, $options: 'i' };
    }
    if (name) {
      query.name = { $regex: name, $options: 'i' };
    }
    if (type) {
      query.type = { $regex: type, $options: 'i' };
    }
    if (status) {
      query.status = status;
    }
    if (submittedBy) {
      query.submittedBy = { $regex: submittedBy, $options: 'i' };
    }
    if (currentOffice) {
      query.currentOffice = { $regex: currentOffice, $options: 'i' };
    }
    if (priority) {
      query.priority = priority;
    }
    if (department) {
      query.department = { $regex: department, $options: 'i' };
    }
    if (category) {
      query.category = { $regex: category, $options: 'i' };
    }
    if (dateFrom || dateTo) {
      query.dateUploaded = {};
      if (dateFrom) query.dateUploaded.$gte = new Date(dateFrom);
      if (dateTo) query.dateUploaded.$lte = new Date(dateTo);
    }
    if (tags && tags.length > 0) {
      query.tags = { $in: tags };
    }

    const documents = await Document.find(query).sort({ dateUploaded: -1 });
    res.json(documents);
  } catch (err) {
    console.error('Error in advanced search:', err);
    res.status(500).json({ message: err.message });
  }
});

// Check for delayed documents and update their status
router.get('/delays/check', async (req, res) => {
  try {
    const documents = await Document.find({ 
      status: { $in: ['Submitted', 'Under Review', 'Processing', 'On Hold'] }
    });

    const delayedDocs = [];
    const now = new Date();

    for (const doc of documents) {
      const timeDiff = (now - new Date(doc.currentStageStartTime)) / (1000 * 60 * 60); // hours
      
      if (timeDiff > doc.expectedProcessingTime) {
        doc.isDelayed = true;
        doc.delayedHours = Math.floor(timeDiff - doc.expectedProcessingTime);
        await doc.save();
        
        delayedDocs.push({
          _id: doc._id,
          documentId: doc.documentId,
          name: doc.name,
          type: doc.type,
          currentOffice: doc.currentOffice,
          priority: doc.priority,
          status: doc.status,
          delayedHours: doc.delayedHours,
          submittedBy: doc.submittedBy,
          expectedProcessingTime: doc.expectedProcessingTime,
          actualTime: Math.floor(timeDiff)
        });
      } else if (doc.isDelayed) {
        // Reset if no longer delayed
        doc.isDelayed = false;
        doc.delayedHours = 0;
        await doc.save();
      }
    }

    res.json({
      totalDelayed: delayedDocs.length,
      delayedDocuments: delayedDocs
    });
  } catch (err) {
    console.error('Error checking delays:', err);
    res.status(500).json({ message: err.message });
  }
});

// Get all delayed documents
router.get('/delays/all', async (req, res) => {
  try {
    const delayedDocuments = await Document.find({ isDelayed: true })
      .sort({ delayedHours: -1 });
    
    res.json(delayedDocuments);
  } catch (err) {
    console.error('Error fetching delayed documents:', err);
    res.status(500).json({ message: err.message });
  }
});

// Get document routing history with detailed timeline
router.get('/:id/routing-history', async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // Calculate processing time for each stage
    const history = document.routingHistory.map((entry, index) => {
      let processingTime = 0;
      if (index > 0) {
        const prevEntry = document.routingHistory[index - 1];
        processingTime = (new Date(entry.timestamp) - new Date(prevEntry.timestamp)) / (1000 * 60 * 60);
      }

      return {
        ...entry.toObject(),
        processingTimeHours: Math.round(processingTime * 10) / 10
      };
    });

    res.json({
      documentId: document.documentId,
      documentName: document.name,
      currentOffice: document.currentOffice,
      status: document.status,
      isDelayed: document.isDelayed,
      delayedHours: document.delayedHours,
      routingHistory: history,
      totalProcessingTime: history.reduce((sum, entry) => sum + (entry.processingTimeHours || 0), 0)
    });
  } catch (err) {
    console.error('Error fetching routing history:', err);
    res.status(500).json({ message: err.message });
  }
});

// Add routing history entry when document moves
router.post('/:id/routing-history', async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    const { office, action, handler, comments } = req.body;

    // Calculate processing time for previous stage
    if (document.routingHistory.length > 0) {
      const lastEntry = document.routingHistory[document.routingHistory.length - 1];
      const processingTime = (new Date() - new Date(lastEntry.timestamp)) / (1000 * 60 * 60);
      lastEntry.processingTime = Math.round(processingTime * 10) / 10;
    }

    // Add new routing history entry
    document.routingHistory.push({
      office: office || document.currentOffice,
      action,
      handler: handler || '',
      timestamp: new Date(),
      comments: comments || '',
      processingTime: 0
    });

    // Update current stage start time and office
    document.currentStageStartTime = new Date();
    if (office) {
      document.currentOffice = office;
    }

    // Reset delay status for new stage
    document.isDelayed = false;
    document.delayedHours = 0;

    await document.save();

    res.json({
      message: 'Routing history updated successfully',
      document
    });
  } catch (err) {
    console.error('Error adding routing history:', err);
    res.status(500).json({ message: err.message });
  }
});

// Get delay analytics/reports
router.get('/analytics/delays', async (req, res) => {
  try {
    const { startDate, endDate, office } = req.query;

    let query = { isDelayed: true };
    
    if (startDate || endDate) {
      query.dateUploaded = {};
      if (startDate) query.dateUploaded.$gte = new Date(startDate);
      if (endDate) query.dateUploaded.$lte = new Date(endDate);
    }

    if (office) {
      query.currentOffice = office;
    }

    const delayedDocs = await Document.find(query);

    // Analytics by office
    const delaysByOffice = {};
    delayedDocs.forEach(doc => {
      const office = doc.currentOffice || 'Unknown';
      if (!delaysByOffice[office]) {
        delaysByOffice[office] = {
          count: 0,
          totalDelayedHours: 0,
          documents: []
        };
      }
      delaysByOffice[office].count++;
      delaysByOffice[office].totalDelayedHours += doc.delayedHours;
      delaysByOffice[office].documents.push({
        documentId: doc.documentId,
        name: doc.name,
        delayedHours: doc.delayedHours
      });
    });

    // Calculate average delays
    Object.keys(delaysByOffice).forEach(office => {
      delaysByOffice[office].averageDelay = 
        Math.round((delaysByOffice[office].totalDelayedHours / delaysByOffice[office].count) * 10) / 10;
    });

    res.json({
      totalDelayed: delayedDocs.length,
      totalDelayedHours: delayedDocs.reduce((sum, doc) => sum + doc.delayedHours, 0),
      averageDelayHours: delayedDocs.length > 0 
        ? Math.round((delayedDocs.reduce((sum, doc) => sum + doc.delayedHours, 0) / delayedDocs.length) * 10) / 10 
        : 0,
      delaysByOffice,
      delaysByPriority: {
        Urgent: delayedDocs.filter(d => d.priority === 'Urgent').length,
        High: delayedDocs.filter(d => d.priority === 'High').length,
        Normal: delayedDocs.filter(d => d.priority === 'Normal').length,
        Low: delayedDocs.filter(d => d.priority === 'Low').length,
      }
    });
  } catch (err) {
    console.error('Error fetching delay analytics:', err);
    res.status(500).json({ message: err.message });
  }
});

// Get daily activity statistics
router.get('/analytics/daily-activity', async (req, res) => {
  try {
    const { startDate, endDate, office } = req.query;
    
    console.log('Daily activity request - office:', office, 'startDate:', startDate, 'endDate:', endDate);
    
    // Default to last 30 days if no dates provided
    const end = endDate ? new Date(endDate) : new Date();
    const start = startDate ? new Date(startDate) : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    // Set time to start/end of day
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    let query = {
      dateUploaded: { $gte: start, $lte: end }
    };

    let documents = await Document.find(query);
    console.log(`Found ${documents.length} documents in date range`);

    // If office filter is provided, filter documents that have passed through that office
    if (office && office.trim() !== '') {
      const initialCount = documents.length;
      documents = documents.filter(doc => {
        // Check if document's current office matches
        if (doc.currentOffice && doc.currentOffice.trim() === office.trim()) {
          return true;
    }

        // Check if document's next office matches
        if (doc.nextOffice && doc.nextOffice.trim() === office.trim()) {
          return true;
        }
        
        // Check routing history - if document has been in this office
        if (doc.routingHistory && doc.routingHistory.length > 0) {
          const hasOffice = doc.routingHistory.some(entry => 
            entry.office && entry.office.trim() === office.trim()
          );
          return hasOffice;
        }
        
        return false;
      });
      console.log(`After office filter (${office}): ${documents.length} documents (filtered from ${initialCount})`);
    }

    // Group documents by date
    const dailyStats = {};
    
    // Create date range
    const currentDate = new Date(start);
    while (currentDate <= end) {
      const dateKey = currentDate.toISOString().split('T')[0];
      dailyStats[dateKey] = {
        date: dateKey,
        pending: 0,
        forwarded: 0,
        completed: 0,
        approved: 0,
        rejected: 0,
        underReview: 0,
        delayed: 0,
        totalDelayedHours: 0,
        totalDocuments: 0
      };
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Count documents by status and date
    documents.forEach(doc => {
      // Handle date conversion properly - account for timezone
      const docDateObj = new Date(doc.dateUploaded);
      // Get date in YYYY-MM-DD format, accounting for timezone
      const docDate = docDateObj.toISOString().split('T')[0];
      
      // Ensure the date is within our range (handle edge cases)
      if (dailyStats[docDate]) {
        dailyStats[docDate].totalDocuments++;
        
        // Count by status
        switch (doc.status) {
          case 'Pending':
          case 'Submitted':
            dailyStats[docDate].pending++;
            break;
          case 'Forwarded':
          case 'Processing':
            dailyStats[docDate].forwarded++;
            break;
          case 'Completed':
          case 'Archived':
            dailyStats[docDate].completed++;
            break;
          case 'Approved':
            dailyStats[docDate].approved++;
            break;
          case 'Rejected':
            dailyStats[docDate].rejected++;
            break;
          case 'Under Review':
            dailyStats[docDate].underReview++;
            break;
        }

        // Count delays
        if (doc.isDelayed) {
          dailyStats[docDate].delayed++;
          dailyStats[docDate].totalDelayedHours += doc.delayedHours;
        }
      } else {
        // Log documents that don't match any date in range (shouldn't happen, but helps debug)
        console.log(`Document ${doc.documentId} has date ${docDate} which is not in dailyStats range`);
      }
    });

    // Convert to array and sort by date
    const dailyArray = Object.values(dailyStats).sort((a, b) => 
      new Date(b.date) - new Date(a.date)
    );

    // Verify total documents match - sum up daily totals
    const totalFromDailyBreakdown = dailyArray.reduce((sum, day) => sum + day.totalDocuments, 0);
    
    // If there's a mismatch, log it for debugging
    if (totalFromDailyBreakdown !== documents.length) {
      console.log(`⚠️ Document count mismatch: Total documents: ${documents.length}, Daily breakdown sum: ${totalFromDailyBreakdown}`);
      console.log('Documents by date:', documents.map(d => ({
        id: d.documentId,
        date: new Date(d.dateUploaded).toISOString().split('T')[0],
        status: d.status
      })));
    }

    // Get submitter office breakdown
    const officeBreakdown = {};
    
    // Get all employees to map submitter names to offices
    const employees = await Employee.find().populate('office');
    
    // Create a map of submitter names to their offices
    const submitterToOffice = {};
    employees.forEach(emp => {
      if (emp.office && emp.office.name) {
        submitterToOffice[emp.name] = emp.office.name;
      } else if (emp.department) {
        submitterToOffice[emp.name] = emp.department;
      }
    });
    
    // Group documents by submitter's office
    documents.forEach(doc => {
      let submitterOffice = 'Unknown';
      
      if (doc.submittedBy) {
        // Try to find the submitter's office
        if (submitterToOffice[doc.submittedBy]) {
          submitterOffice = submitterToOffice[doc.submittedBy];
        } else {
          // Try to find by matching name partially
          const matchingEmployee = employees.find(emp => 
            emp.name.toLowerCase().includes(doc.submittedBy.toLowerCase()) ||
            doc.submittedBy.toLowerCase().includes(emp.name.toLowerCase())
          );
          
          if (matchingEmployee) {
            if (matchingEmployee.office && matchingEmployee.office.name) {
              submitterOffice = matchingEmployee.office.name;
            } else if (matchingEmployee.department) {
              submitterOffice = matchingEmployee.department;
            }
          }
        }
      }
      
      // If document has department field, use it as fallback
      if (submitterOffice === 'Unknown' && doc.department) {
        submitterOffice = doc.department;
      }
      
      if (!officeBreakdown[submitterOffice]) {
        officeBreakdown[submitterOffice] = {
          office: submitterOffice,
          totalDocuments: 0,
          pending: 0,
          forwarded: 0,
          completed: 0,
          approved: 0,
          rejected: 0,
          underReview: 0,
          delayed: 0
        };
      }
      
      officeBreakdown[submitterOffice].totalDocuments++;
      
      // Count by status
      switch (doc.status) {
        case 'Pending':
        case 'Submitted':
          officeBreakdown[submitterOffice].pending++;
          break;
        case 'Forwarded':
        case 'Processing':
          officeBreakdown[submitterOffice].forwarded++;
          break;
        case 'Completed':
        case 'Archived':
          officeBreakdown[submitterOffice].completed++;
          break;
        case 'Approved':
          officeBreakdown[submitterOffice].approved++;
          break;
        case 'Rejected':
          officeBreakdown[submitterOffice].rejected++;
          break;
        case 'Under Review':
          officeBreakdown[submitterOffice].underReview++;
          break;
      }
      
      if (doc.isDelayed) {
        officeBreakdown[submitterOffice].delayed++;
      }
    });
    
    // Convert to array and sort by total documents (descending)
    const officeBreakdownArray = Object.values(officeBreakdown).sort((a, b) => 
      b.totalDocuments - a.totalDocuments
    );

    // Calculate summary statistics
    const summary = {
      totalDocuments: documents.length,
      totalPending: documents.filter(d => ['Pending', 'Submitted'].includes(d.status)).length,
      totalForwarded: documents.filter(d => ['Forwarded', 'Processing'].includes(d.status)).length,
      totalCompleted: documents.filter(d => ['Completed', 'Archived', 'Approved'].includes(d.status)).length,
      totalDelayed: documents.filter(d => d.isDelayed).length,
      totalDelayedHours: documents.reduce((sum, doc) => sum + (doc.delayedHours || 0), 0),
      averagePerDay: Math.round(documents.length / Math.max(dailyArray.length, 1) * 10) / 10,
      dateRange: {
        start: start.toISOString().split('T')[0],
        end: end.toISOString().split('T')[0]
      },
      // Add verification info
      _verification: {
        totalFromDailyBreakdown,
        documentsInRange: documents.length,
        datesInRange: dailyArray.length
      }
    };

    res.json({
      summary,
      dailyActivity: dailyArray,
      office: office || 'All Offices',
      officeBreakdown: officeBreakdownArray
    });
  } catch (err) {
    console.error('Error fetching daily activity:', err);
    res.status(500).json({ message: err.message });
  }
});

// Get trend analysis - time-series data for performance over time
router.get('/analytics/trends', async (req, res) => {
  try {
    const { period = 'monthly', office, documentType, months = 6 } = req.query;
    
    // Calculate date range based on period
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - parseInt(months));
    
    const documents = await Document.find({
      dateUploaded: { $gte: startDate, $lte: endDate }
    });

    // Group documents by time period
    const timeSeriesData = {};
    
    documents.forEach(doc => {
      let periodKey;
      const docDate = new Date(doc.dateUploaded);
      
      if (period === 'monthly') {
        periodKey = `${docDate.getFullYear()}-${String(docDate.getMonth() + 1).padStart(2, '0')}`;
      } else if (period === 'weekly') {
        const weekNum = Math.ceil(docDate.getDate() / 7);
        periodKey = `${docDate.getFullYear()}-${String(docDate.getMonth() + 1).padStart(2, '0')}-W${weekNum}`;
      } else {
        periodKey = docDate.toISOString().split('T')[0];
      }
      
      if (!timeSeriesData[periodKey]) {
        timeSeriesData[periodKey] = {
          period: periodKey,
          totalDocuments: 0,
          delayedDocuments: 0,
          totalProcessingTime: 0,
          averageProcessingTime: 0,
          completedDocuments: 0,
          pendingDocuments: 0,
          offices: {},
          documentTypes: {}
        };
      }
      
      const data = timeSeriesData[periodKey];
      data.totalDocuments++;
      
      if (doc.isDelayed) data.delayedDocuments++;
      if (['Completed', 'Approved', 'Archived'].includes(doc.status)) data.completedDocuments++;
      if (['Submitted', 'Pending', 'Under Review'].includes(doc.status)) data.pendingDocuments++;
      
      // Calculate total processing time from routing history
      const totalTime = doc.routingHistory.reduce((sum, entry) => sum + (entry.processingTime || 0), 0);
      data.totalProcessingTime += totalTime;
      
      // Track by office
      if (doc.currentOffice) {
        if (!data.offices[doc.currentOffice]) {
          data.offices[doc.currentOffice] = { count: 0, delayed: 0 };
        }
        data.offices[doc.currentOffice].count++;
        if (doc.isDelayed) data.offices[doc.currentOffice].delayed++;
      }
      
      // Track by document type
      if (doc.type) {
        if (!data.documentTypes[doc.type]) {
          data.documentTypes[doc.type] = { count: 0, delayed: 0 };
        }
        data.documentTypes[doc.type].count++;
        if (doc.isDelayed) data.documentTypes[doc.type].delayed++;
      }
    });
    
    // Calculate averages and trends
    const timeSeriesArray = Object.values(timeSeriesData).sort((a, b) => a.period.localeCompare(b.period));
    
    timeSeriesArray.forEach(data => {
      data.averageProcessingTime = data.completedDocuments > 0 
        ? Math.round((data.totalProcessingTime / data.completedDocuments) * 10) / 10 
        : 0;
      data.delayRate = data.totalDocuments > 0 
        ? Math.round((data.delayedDocuments / data.totalDocuments) * 100) 
        : 0;
      data.completionRate = data.totalDocuments > 0 
        ? Math.round((data.completedDocuments / data.totalDocuments) * 100) 
        : 0;
    });
    
    // Calculate trends (improving/declining)
    const trends = {
      processingTime: { status: 'stable', change: 0 },
      delayRate: { status: 'stable', change: 0 },
      completionRate: { status: 'stable', change: 0 }
    };
    
    if (timeSeriesArray.length >= 2) {
      const recent = timeSeriesArray[timeSeriesArray.length - 1];
      const previous = timeSeriesArray[timeSeriesArray.length - 2];
      
      // Processing time trend
      const ptChange = recent.averageProcessingTime - previous.averageProcessingTime;
      trends.processingTime.change = Math.round(ptChange * 10) / 10;
      trends.processingTime.status = ptChange < -2 ? 'improving' : ptChange > 2 ? 'declining' : 'stable';
      
      // Delay rate trend
      const drChange = recent.delayRate - previous.delayRate;
      trends.delayRate.change = Math.round(drChange);
      trends.delayRate.status = drChange < -5 ? 'improving' : drChange > 5 ? 'declining' : 'stable';
      
      // Completion rate trend
      const crChange = recent.completionRate - previous.completionRate;
      trends.completionRate.change = Math.round(crChange);
      trends.completionRate.status = crChange > 5 ? 'improving' : crChange < -5 ? 'declining' : 'stable';
    }
    
    res.json({
      period,
      months: parseInt(months),
      dateRange: {
        start: startDate.toISOString().split('T')[0],
        end: endDate.toISOString().split('T')[0]
      },
      timeSeries: timeSeriesArray,
      trends,
      summary: {
        totalDocuments: documents.length,
        averageDelayRate: timeSeriesArray.length > 0 
          ? Math.round(timeSeriesArray.reduce((sum, d) => sum + d.delayRate, 0) / timeSeriesArray.length) 
          : 0,
        averageCompletionRate: timeSeriesArray.length > 0 
          ? Math.round(timeSeriesArray.reduce((sum, d) => sum + d.completionRate, 0) / timeSeriesArray.length) 
          : 0
      }
    });
  } catch (err) {
    console.error('Error fetching trend analysis:', err);
    res.status(500).json({ message: err.message });
  }
});

// Get pattern detection - identify recurring delays and bottlenecks
router.get('/analytics/patterns', async (req, res) => {
  try {
    const { months = 3 } = req.query;
    
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - parseInt(months));
    
    const documents = await Document.find({
      dateUploaded: { $gte: startDate }
    });
    
    // Pattern 1: Office-DocumentType combinations with high delay rates
    const officeDocTypePatterns = {};
    const officeStats = {};
    const docTypeStats = {};
    
    documents.forEach(doc => {
      const office = doc.currentOffice || 'Unknown';
      const docType = doc.type || 'Unknown';
      const key = `${office}|${docType}`;
      
      // Track office-doctype combinations
      if (!officeDocTypePatterns[key]) {
        officeDocTypePatterns[key] = {
          office,
          documentType: docType,
          total: 0,
          delayed: 0,
          totalDelayHours: 0
        };
      }
      officeDocTypePatterns[key].total++;
      if (doc.isDelayed) {
        officeDocTypePatterns[key].delayed++;
        officeDocTypePatterns[key].totalDelayHours += doc.delayedHours;
      }
      
      // Track office performance
      if (!officeStats[office]) {
        officeStats[office] = {
          office,
          total: 0,
          delayed: 0,
          totalProcessingTime: 0,
          documentTypes: new Set()
        };
      }
      officeStats[office].total++;
      if (doc.isDelayed) officeStats[office].delayed++;
      officeStats[office].documentTypes.add(docType);
      
      const totalTime = doc.routingHistory.reduce((sum, entry) => sum + (entry.processingTime || 0), 0);
      officeStats[office].totalProcessingTime += totalTime;
      
      // Track document type performance
      if (!docTypeStats[docType]) {
        docTypeStats[docType] = {
          documentType: docType,
          total: 0,
          delayed: 0,
          totalProcessingTime: 0,
          offices: new Set()
        };
      }
      docTypeStats[docType].total++;
      if (doc.isDelayed) docTypeStats[docType].delayed++;
      docTypeStats[docType].offices.add(office);
      docTypeStats[docType].totalProcessingTime += totalTime;
    });
    
    // Identify patterns with high delay rates (>30%)
    const recurringDelayPatterns = Object.values(officeDocTypePatterns)
      .filter(p => p.total >= 3 && (p.delayed / p.total) > 0.3)
      .map(p => ({
        ...p,
        delayRate: Math.round((p.delayed / p.total) * 100),
        averageDelayHours: Math.round((p.totalDelayHours / p.delayed) * 10) / 10,
        severity: (p.delayed / p.total) > 0.5 ? 'high' : 'medium'
      }))
      .sort((a, b) => b.delayRate - a.delayRate);
    
    // Identify bottleneck offices
    const bottleneckOffices = Object.values(officeStats)
      .filter(o => o.total >= 5)
      .map(o => ({
        office: o.office,
        total: o.total,
        delayed: o.delayed,
        delayRate: Math.round((o.delayed / o.total) * 100),
        averageProcessingTime: Math.round((o.totalProcessingTime / o.total) * 10) / 10,
        documentTypesHandled: o.documentTypes.size,
        isBottleneck: (o.delayed / o.total) > 0.3 || (o.totalProcessingTime / o.total) > 48
      }))
      .filter(o => o.isBottleneck)
      .sort((a, b) => b.delayRate - a.delayRate);
    
    // Identify problematic document types
    const problematicDocTypes = Object.values(docTypeStats)
      .filter(d => d.total >= 5)
      .map(d => ({
        documentType: d.documentType,
        total: d.total,
        delayed: d.delayed,
        delayRate: Math.round((d.delayed / d.total) * 100),
        averageProcessingTime: Math.round((d.totalProcessingTime / d.total) * 10) / 10,
        officesInvolved: d.offices.size,
        isProblematic: (d.delayed / d.total) > 0.3
      }))
      .filter(d => d.isProblematic)
      .sort((a, b) => b.delayRate - a.delayRate);
    
    // Generate insights and recommendations
    const insights = [];
    
    // Insight 1: Recurring delay patterns
    if (recurringDelayPatterns.length > 0) {
      const top = recurringDelayPatterns[0];
      insights.push({
        type: 'recurring_delay',
        severity: top.severity,
        title: `Recurring Delay Pattern Detected`,
        description: `${top.office} consistently delays ${top.documentType} documents (${top.delayRate}% delay rate)`,
        recommendation: `Review workflow at ${top.office} for ${top.documentType} processing. Consider additional training or resources.`,
        data: top
      });
    }
    
    // Insight 2: Bottleneck offices
    if (bottleneckOffices.length > 0) {
      const worst = bottleneckOffices[0];
      insights.push({
        type: 'bottleneck_office',
        severity: 'high',
        title: `Bottleneck Office Identified`,
        description: `${worst.office} is a major bottleneck with ${worst.delayRate}% delay rate and ${worst.averageProcessingTime}h average processing time`,
        recommendation: `Increase staffing at ${worst.office} or redistribute ${worst.documentTypesHandled} document types to other offices.`,
        data: worst
      });
    }
    
    // Insight 3: Problematic document types
    if (problematicDocTypes.length > 0) {
      const worst = problematicDocTypes[0];
      insights.push({
        type: 'problematic_doctype',
        severity: 'medium',
        title: `Document Type Requires Attention`,
        description: `${worst.documentType} has ${worst.delayRate}% delay rate across ${worst.officesInvolved} offices`,
        recommendation: `Standardize ${worst.documentType} processing workflow. Provide clear guidelines and expected timelines.`,
        data: worst
      });
    }
    
    // Insight 4: Performance comparison
    const officeArray = Object.values(officeStats);
    if (officeArray.length >= 2) {
      const avgProcessingTime = officeArray.reduce((sum, o) => sum + (o.totalProcessingTime / o.total), 0) / officeArray.length;
      const slowOffices = officeArray.filter(o => (o.totalProcessingTime / o.total) > avgProcessingTime * 1.5);
      
      if (slowOffices.length > 0) {
        slowOffices.forEach(office => {
          const pct = Math.round(((office.totalProcessingTime / office.total) / avgProcessingTime - 1) * 100);
          insights.push({
            type: 'slow_office',
            severity: pct > 100 ? 'high' : 'medium',
            title: `Office Processing Slower Than Average`,
            description: `${office.office} processes documents ${pct}% slower than the system average`,
            recommendation: `Investigate workload at ${office.office}. Consider process optimization or additional resources.`,
            data: {
              office: office.office,
              averageTime: Math.round((office.totalProcessingTime / office.total) * 10) / 10,
              systemAverage: Math.round(avgProcessingTime * 10) / 10,
              percentSlower: pct
            }
          });
        });
      }
    }
    
    res.json({
      analysisPeriod: `Last ${months} months`,
      dateRange: {
        start: startDate.toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0]
      },
      recurringDelayPatterns,
      bottleneckOffices,
      problematicDocTypes,
      insights,
      summary: {
        totalPatternsDetected: recurringDelayPatterns.length,
        totalBottlenecks: bottleneckOffices.length,
        totalProblematicTypes: problematicDocTypes.length,
        totalInsights: insights.length
      }
    });
  } catch (err) {
    console.error('Error detecting patterns:', err);
    res.status(500).json({ message: err.message });
  }
});

// Document tracking by scan/location
router.get('/:id/current-location', async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    const lastScan = document.scanHistory.length > 0 
      ? document.scanHistory[document.scanHistory.length - 1]
      : null;

    const lastRouting = document.routingHistory.length > 0
      ? document.routingHistory[document.routingHistory.length - 1]
      : null;

    res.json({
      documentId: document.documentId,
      documentName: document.name,
      status: document.status,
      currentOffice: document.currentOffice,
      isDelayed: document.isDelayed,
      delayedHours: document.delayedHours,
      lastKnownLocation: lastScan?.location || document.currentOffice || 'Unknown',
      lastScannedBy: lastScan?.scannedBy || 'N/A',
      lastScannedAt: lastScan?.scannedAt || null,
      lastAction: lastRouting?.action || 'N/A',
      lastHandler: lastRouting?.handler || 'N/A',
      stageStartTime: document.currentStageStartTime,
      expectedCompletionTime: new Date(
        new Date(document.currentStageStartTime).getTime() + 
        (document.expectedProcessingTime * 60 * 60 * 1000)
      )
    });
  } catch (err) {
    console.error('Error fetching current location:', err);
    res.status(500).json({ message: err.message });
  }
});

// Get documents assigned to a specific employee
router.get('/employee/:employeeId', async (req, res) => {
  try {
    console.log('Fetching documents for employee ID:', req.params.employeeId);
    const documents = await Document.find({
      $or: [
        { assignedTo: req.params.employeeId },
        { currentHandler: req.params.employeeId }
      ]
    }).populate('assignedTo').populate('currentHandler');
    
    console.log('Found documents:', documents.length);
    res.json(documents);
  } catch (err) {
    console.error('Error fetching employee documents:', err);
    res.status(500).json({ message: err.message });
  }
});

// Forward document to employee
router.post('/:id/forward-to-employee', async (req, res) => {
  try {
    console.log('Forward request - Document ID:', req.params.id, 'Employee ID:', req.body.employeeId);
    
    const document = await Document.findById(req.params.id);
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    const employee = await Employee.findById(req.body.employeeId);
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    console.log('Forwarding to employee:', employee.name, 'ID:', employee._id);

    // Add employee to assignedTo array if not already there
    if (!document.assignedTo.includes(req.body.employeeId)) {
      document.assignedTo.push(req.body.employeeId);
    }

    // Set as current handler
    document.currentHandler = req.body.employeeId;
    document.forwardedBy = req.body.forwardedBy || 'Admin';
    document.forwardedDate = new Date();
    document.status = 'Under Review';

    // Add to routing history
    document.routingHistory.push({
      office: employee.office?.name || employee.department || 'Employee',
      action: 'forwarded',
      handler: employee.name,
      timestamp: new Date(),
      comments: req.body.comments || `Document forwarded to ${employee.name}`
    });

    await document.save();
    console.log('Document saved with assignedTo:', document.assignedTo, 'currentHandler:', document.currentHandler);

    res.json({
      message: `Document forwarded to ${employee.name} successfully`,
      document: await Document.findById(req.params.id)
        .populate('assignedTo')
        .populate('currentHandler')
    });
  } catch (err) {
    console.error('Error forwarding document:', err);
    res.status(400).json({ message: err.message });
  }
});

// Remove employee access from document
router.post('/:id/remove-employee-access', async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // Remove employee from assignedTo array
    document.assignedTo = document.assignedTo.filter(
      empId => empId.toString() !== req.body.employeeId
    );

    // Clear current handler if it's this employee
    if (document.currentHandler && document.currentHandler.toString() === req.body.employeeId) {
      document.currentHandler = null;
    }

    await document.save();

    res.json({
      message: 'Employee access removed successfully',
      document: await Document.findById(req.params.id)
        .populate('assignedTo')
        .populate('currentHandler')
    });
  } catch (err) {
    console.error('Error removing employee access:', err);
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;
