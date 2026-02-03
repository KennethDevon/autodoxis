const express = require('express');
const router = express.Router();
const Program = require('../models/Program');
const Office = require('../models/Office');
const Employee = require('../models/Employee');
const { formatResponse } = require('../utils/responseFormatter');

// Helper function to clean program names (remove [UPDATED])
const cleanProgramName = (name) => {
  if (!name) return name;
  return name.replace(/\s*\[UPDATED\]\s*/gi, '').trim();
};

// Get all programs
router.get('/', async (req, res) => {
  try {
    const programs = await Program.findAll({
      include: [
        {
          model: Office,
          as: 'office',
          attributes: ['id', 'officeId', 'name', 'department']
        },
        {
          model: Employee,
          as: 'employees',
          attributes: ['id', 'employeeId', 'name', 'position', 'department']
        }
      ]
    });
    
    // Clean program names and add employee count
    const programsWithCleanNames = programs.map(program => {
      const programData = program.toJSON();
      programData.name = cleanProgramName(programData.name);
      programData.numberOfEmployees = programData.employees ? programData.employees.length : 0;
      return programData;
    });
    
    res.json(formatResponse(programsWithCleanNames));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get one program
router.get('/:id', async (req, res) => {
  try {
    const program = await Program.findByPk(req.params.id, {
      include: [
        {
          model: Office,
          as: 'office',
          attributes: ['id', 'officeId', 'name', 'department']
        },
        {
          model: Employee,
          as: 'employees',
          attributes: ['id', 'employeeId', 'name', 'position', 'department']
        }
      ]
    });
    if (program == null) {
      return res.status(404).json({ message: 'Cannot find program' });
    }
    const programData = program.toJSON();
    programData.name = cleanProgramName(programData.name);
    programData.numberOfEmployees = programData.employees ? programData.employees.length : 0;
    res.json(formatResponse(programData));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create one program
router.post('/', async (req, res) => {
  try {
    const newProgram = await Program.create({
      programId: req.body.programId,
      name: cleanProgramName(req.body.name),
      description: req.body.description,
      officeId: req.body.officeId || null
    });
    const programData = newProgram.toJSON();
    programData.numberOfEmployees = 0;
    res.status(201).json(formatResponse(programData));
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Update one program
router.patch('/:id', async (req, res) => {
  try {
    const program = await Program.findByPk(req.params.id);
    if (program == null) {
      return res.status(404).json({ message: 'Cannot find program' });
    }
    
    const updateData = {};
    if (req.body.programId != null) updateData.programId = req.body.programId;
    if (req.body.name != null) updateData.name = cleanProgramName(req.body.name);
    if (req.body.description != null) updateData.description = req.body.description;
    if (req.body.officeId !== undefined) updateData.officeId = req.body.officeId;
    
    await program.update(updateData);
    const updatedProgram = await Program.findByPk(req.params.id, {
      include: [
        {
          model: Office,
          as: 'office',
          attributes: ['id', 'officeId', 'name', 'department']
        },
        {
          model: Employee,
          as: 'employees',
          attributes: ['id', 'employeeId', 'name', 'position', 'department']
        }
      ]
    });
    const programData = updatedProgram.toJSON();
    programData.name = cleanProgramName(programData.name);
    programData.numberOfEmployees = programData.employees ? programData.employees.length : 0;
    res.json(formatResponse(programData));
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete one program
router.delete('/:id', async (req, res) => {
  try {
    const program = await Program.findByPk(req.params.id);
    if (program == null) {
      return res.status(404).json({ message: 'Cannot find program' });
    }
    
    // Remove program reference from all employees in this program
    await Employee.update(
      { programId: null },
      { where: { programId: req.params.id } }
    );
    
    await program.destroy();
    res.json({ message: 'Deleted Program' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get all employees in a program
router.get('/:id/employees', async (req, res) => {
  try {
    const programId = parseInt(req.params.id) || req.params.id;
    const program = await Program.findByPk(programId, {
      include: [{
        model: Employee,
        as: 'employees',
        attributes: ['id', 'employeeId', 'name', 'position', 'department']
      }]
    });
    if (!program) {
      return res.status(404).json({ message: 'Program not found' });
    }
    res.json(formatResponse(program.employees || []));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;

