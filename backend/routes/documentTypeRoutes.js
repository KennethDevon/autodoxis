const express = require('express');
const router = express.Router();
const DocumentType = require('../models/DocumentType');

// Get all document types
router.get('/', async (req, res) => {
  try {
    const documentTypes = await DocumentType.find().sort({ name: 1 });
    res.json(documentTypes);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get one document type
router.get('/:id', async (req, res) => {
  try {
    const documentType = await DocumentType.findById(req.params.id);
    if (documentType == null) {
      return res.status(404).json({ message: 'Cannot find document type' });
    }
    res.json(documentType);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create one document type
router.post('/', async (req, res) => {
  const documentType = new DocumentType({
    name: req.body.name,
    description: req.body.description || '',
    isActive: req.body.isActive !== undefined ? req.body.isActive : true,
    dateUploaded: req.body.dateUploaded || '',
    timeUploaded: req.body.timeUploaded || '',
    uploadedBy: req.body.uploadedBy || '',
  });

  try {
    const newDocumentType = await documentType.save();
    res.status(201).json(newDocumentType);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Update one document type
router.patch('/:id', async (req, res) => {
  try {
    const documentType = await DocumentType.findById(req.params.id);
    if (documentType == null) {
      return res.status(404).json({ message: 'Cannot find document type' });
    }
    if (req.body.name != null) {
      documentType.name = req.body.name;
    }
    if (req.body.description != null) {
      documentType.description = req.body.description;
    }
    if (req.body.isActive !== undefined) {
      documentType.isActive = req.body.isActive;
    }
    if (req.body.dateUploaded != null) {
      documentType.dateUploaded = req.body.dateUploaded;
    }
    if (req.body.timeUploaded != null) {
      documentType.timeUploaded = req.body.timeUploaded;
    }
    if (req.body.uploadedBy != null) {
      documentType.uploadedBy = req.body.uploadedBy;
    }
    const updatedDocumentType = await documentType.save();
    res.json(updatedDocumentType);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete one document type
router.delete('/:id', async (req, res) => {
  try {
    const documentType = await DocumentType.findById(req.params.id);
    if (documentType == null) {
      return res.status(404).json({ message: 'Cannot find document type' });
    }
    await DocumentType.deleteOne({ _id: req.params.id });
    res.json({ message: 'Deleted Document Type' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;

