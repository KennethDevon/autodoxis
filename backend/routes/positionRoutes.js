const express = require('express');
const router = express.Router();
const Position = require('../models/Position');
const { formatResponse } = require('../utils/responseFormatter');

// Get all positions
router.get('/', async (req, res) => {
  try {
    const positions = await Position.findAll({
      order: [['name', 'ASC']]
    });
    res.json(formatResponse(positions));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get one position
router.get('/:id', async (req, res) => {
  try {
    const position = await Position.findByPk(req.params.id);
    if (position == null) {
      return res.status(404).json({ message: 'Cannot find position' });
    }
    res.json(formatResponse(position));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create one position
router.post('/', async (req, res) => {
  try {
    const newPosition = await Position.create({
      name: req.body.name
    });
    
    res.status(201).json(formatResponse(newPosition));
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Update one position
router.patch('/:id', async (req, res) => {
  try {
    const positionId = parseInt(req.params.id) || req.params.id;
    const position = await Position.findByPk(positionId);
    if (position == null) {
      return res.status(404).json({ message: 'Cannot find position' });
    }
    
    // Update fields
    const updateData = {};
    if (req.body.name != null) updateData.name = req.body.name;
    
    await position.update(updateData);
    const updatedPosition = await Position.findByPk(positionId);
    res.json(formatResponse(updatedPosition));
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete one position
router.delete('/:id', async (req, res) => {
  try {
    const positionId = parseInt(req.params.id) || req.params.id;
    const position = await Position.findByPk(positionId);
    if (position == null) {
      return res.status(404).json({ message: 'Cannot find position' });
    }
    
    await position.destroy();
    res.json({ message: 'Deleted Position' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;

