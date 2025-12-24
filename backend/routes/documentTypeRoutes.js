const express = require('express');
const router = express.Router();
const DocumentType = require('../models/DocumentType');
const { Op } = require('sequelize');
const { formatResponse } = require('../utils/responseFormatter');

// Get all document types
router.get('/', async (req, res) => {
  try {
    const documentTypes = await DocumentType.findAll({
      order: [['name', 'ASC']]
    });
    res.json(formatResponse(documentTypes));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get one document type
router.get('/:id', async (req, res) => {
  try {
    const documentType = await DocumentType.findByPk(req.params.id);
    if (documentType == null) {
      return res.status(404).json({ message: 'Cannot find document type' });
    }
    res.json(formatResponse(documentType));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create one document type
router.post('/', async (req, res) => {
  try {
    const newDocumentType = await DocumentType.create({
      name: req.body.name,
      description: req.body.description || '',
      isActive: req.body.isActive !== undefined ? req.body.isActive : true,
      dateUploaded: req.body.dateUploaded || '',
      timeUploaded: req.body.timeUploaded || '',
      uploadedBy: req.body.uploadedBy || ''
    });
    res.status(201).json(newDocumentType);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Update one document type
router.patch('/:id', async (req, res) => {
  try {
    const documentType = await DocumentType.findByPk(req.params.id);
    if (documentType == null) {
      return res.status(404).json({ message: 'Cannot find document type' });
    }
    
    const updateData = {};
    if (req.body.name != null) updateData.name = req.body.name;
    if (req.body.description != null) updateData.description = req.body.description;
    if (req.body.isActive !== undefined) updateData.isActive = req.body.isActive;
    if (req.body.dateUploaded != null) updateData.dateUploaded = req.body.dateUploaded;
    if (req.body.timeUploaded != null) updateData.timeUploaded = req.body.timeUploaded;
    if (req.body.uploadedBy != null) updateData.uploadedBy = req.body.uploadedBy;
    
    await documentType.update(updateData);
    res.json(formatResponse(documentType));
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete one document type
router.delete('/:id', async (req, res) => {
  try {
    const documentType = await DocumentType.findByPk(req.params.id);
    if (documentType == null) {
      return res.status(404).json({ message: 'Cannot find document type' });
    }
    await documentType.destroy();
    res.json({ message: 'Deleted Document Type' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
