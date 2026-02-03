const express = require('express');
const router = express.Router();
const Office = require('../models/Office');
const Employee = require('../models/Employee');
const sequelize = require('../config/database');
const { Op } = require('sequelize');
const { formatResponse } = require('../utils/responseFormatter');

// Helper function to clean office names (remove [UPDATED])
const cleanOfficeName = (name) => {
  if (!name) return name;
  return name.replace(/\s*\[UPDATED\]\s*/gi, '').trim();
};

// Get all offices
router.get('/', async (req, res) => {
  try {
    const offices = await Office.findAll({
      include: [{
        model: Employee,
        as: 'employees',
        attributes: ['id', 'employeeId', 'name', 'position', 'department']
      }]
    });
    
    // Add numberOfEmployees virtual field and clean office names
    const officesWithCount = offices.map(office => {
      const officeData = office.toJSON();
      officeData.name = cleanOfficeName(officeData.name);
      officeData.numberOfEmployees = officeData.employees ? officeData.employees.length : 0;
      return officeData;
    });
    
    res.json(formatResponse(officesWithCount));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get one office
router.get('/:id', async (req, res) => {
  try {
    const office = await Office.findByPk(req.params.id, {
      include: [{
        model: Employee,
        as: 'employees',
        attributes: ['id', 'employeeId', 'name', 'position', 'department']
      }]
    });
    if (office == null) {
      return res.status(404).json({ message: 'Cannot find office' });
    }
    const officeData = office.toJSON();
    officeData.name = cleanOfficeName(officeData.name);
    officeData.numberOfEmployees = officeData.employees ? officeData.employees.length : 0;
    res.json(formatResponse(officeData));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create one office
router.post('/', async (req, res) => {
  try {
    const newOffice = await Office.create({
      officeId: req.body.officeId,
      name: cleanOfficeName(req.body.name),
      department: req.body.department,
      location: req.body.location || ''
    });
    const officeData = newOffice.toJSON();
    officeData.numberOfEmployees = 0;
    res.status(201).json(formatResponse(officeData));
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Update one office
router.patch('/:id', async (req, res) => {
  try {
    const office = await Office.findByPk(req.params.id);
    if (office == null) {
      return res.status(404).json({ message: 'Cannot find office' });
    }
    
    const updateData = {};
    if (req.body.officeId != null) updateData.officeId = req.body.officeId;
    if (req.body.name != null) updateData.name = cleanOfficeName(req.body.name);
    if (req.body.department != null) updateData.department = req.body.department;
    if (req.body.location !== undefined) updateData.location = req.body.location;
    
    await office.update(updateData);
    const updatedOffice = await Office.findByPk(req.params.id, {
      include: [{
        model: Employee,
        as: 'employees',
        attributes: ['id', 'employeeId', 'name', 'position', 'department']
      }]
    });
    const officeData = updatedOffice.toJSON();
    officeData.name = cleanOfficeName(officeData.name);
    officeData.numberOfEmployees = officeData.employees ? officeData.employees.length : 0;
    res.json(formatResponse(officeData));
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete one office
router.delete('/:id', async (req, res) => {
  try {
    const office = await Office.findByPk(req.params.id);
    if (office == null) {
      return res.status(404).json({ message: 'Cannot find office' });
    }
    
    // Remove office reference from all employees in this office
    await Employee.update(
      { officeId: null },
      { where: { officeId: req.params.id } }
    );
    
    // Remove from junction table
    await sequelize.query(
      `DELETE FROM office_employees WHERE officeId = ?`,
      { replacements: [req.params.id] }
    );
    
    await office.destroy();
    res.json({ message: 'Deleted Office' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Assign employee to office
router.post('/:id/assign-employee', async (req, res) => {
  try {
    const officeId = parseInt(req.params.id) || req.params.id;
    const employeeId = parseInt(req.body.employeeId) || req.body.employeeId;

    const office = await Office.findByPk(officeId);
    if (!office) {
      return res.status(404).json({ message: 'Office not found' });
    }

    const employee = await Employee.findByPk(employeeId);
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    // Check if employee is already in this office (via junction table)
    const [existing] = await sequelize.query(
      `SELECT * FROM office_employees WHERE officeId = ? AND employeeId = ?`,
      { replacements: [officeId, employeeId] }
    );
    
    if (existing && existing.length > 0) {
      return res.status(400).json({ message: 'Employee already assigned to this office' });
    }

    // Remove employee from previous office if any
    if (employee.officeId) {
      await sequelize.query(
        `DELETE FROM office_employees WHERE officeId = ? AND employeeId = ?`,
        { replacements: [employee.officeId, employeeId] }
      );
    }

    // Add employee to new office (update officeId and add to junction table)
    await employee.update({ officeId: officeId });
    
    await sequelize.query(
      `INSERT INTO office_employees (officeId, employeeId, createdAt) VALUES (?, ?, NOW())`,
      { replacements: [officeId, employeeId] }
    );

    const updatedOffice = await Office.findByPk(officeId, {
      include: [{
        model: Employee,
        as: 'employees',
        attributes: ['id', 'employeeId', 'name', 'position', 'department']
      }]
    });
    
    const officeData = updatedOffice.toJSON();
    officeData.numberOfEmployees = officeData.employees ? officeData.employees.length : 0;
    
    res.json({ 
      message: 'Employee assigned to office successfully',
      office: officeData
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Remove employee from office
router.post('/:id/remove-employee', async (req, res) => {
  try {
    const officeId = parseInt(req.params.id) || req.params.id;
    const office = await Office.findByPk(officeId);
    if (!office) {
      return res.status(404).json({ message: 'Office not found' });
    }

    const employeeId = parseInt(req.body.employeeId) || req.body.employeeId;
    const employee = await Employee.findByPk(employeeId);
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    // Remove employee from office (junction table and officeId)
    await sequelize.query(
      `DELETE FROM office_employees WHERE officeId = ? AND employeeId = ?`,
      { replacements: [officeId, employeeId] }
    );
    
    if (employee.officeId == officeId) {
      await employee.update({ officeId: null });
    }

    const updatedOffice = await Office.findByPk(officeId, {
      include: [{
        model: Employee,
        as: 'employees',
        attributes: ['id', 'employeeId', 'name', 'position', 'department']
      }]
    });
    
    const officeData = updatedOffice.toJSON();
    officeData.numberOfEmployees = officeData.employees ? officeData.employees.length : 0;

    res.json({ 
      message: 'Employee removed from office successfully',
      office: officeData
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Get all employees in an office
router.get('/:id/employees', async (req, res) => {
  try {
    const officeId = parseInt(req.params.id) || req.params.id;
    const office = await Office.findByPk(officeId, {
      include: [{
        model: Employee,
        as: 'employees',
        attributes: ['id', 'employeeId', 'name', 'position', 'department']
      }]
    });
    if (!office) {
      return res.status(404).json({ message: 'Office not found' });
    }
    res.json(formatResponse(office.employees || []));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;

