const express = require('express');
const router = express.Router();
const Office = require('../models/Office');
const Employee = require('../models/Employee');

// Get all offices
router.get('/', async (req, res) => {
  try {
    const offices = await Office.find().populate('employees');
    res.json(offices);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get one office
router.get('/:id', async (req, res) => {
  try {
    const office = await Office.findById(req.params.id).populate('employees');
    if (office == null) {
      return res.status(404).json({ message: 'Cannot find office' });
    }
    res.json(office);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create one office
router.post('/', async (req, res) => {
  const office = new Office({
    officeId: req.body.officeId,
    name: req.body.name,
    department: req.body.department,
    numberOfEmployees: req.body.numberOfEmployees,
  });

  try {
    const newOffice = await office.save();
    res.status(201).json(newOffice);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Update one office
router.patch('/:id', async (req, res) => {
  try {
    const office = await Office.findById(req.params.id);
    if (office == null) {
      return res.status(404).json({ message: 'Cannot find office' });
    }
    if (req.body.officeId != null) {
      office.officeId = req.body.officeId;
    }
    if (req.body.name != null) {
      office.name = req.body.name;
    }
    if (req.body.department != null) {
      office.department = req.body.department;
    }
    if (req.body.numberOfEmployees != null) {
      office.numberOfEmployees = req.body.numberOfEmployees;
    }
    const updatedOffice = await office.save();
    res.json(updatedOffice);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete one office
router.delete('/:id', async (req, res) => {
  try {
    const office = await Office.findById(req.params.id);
    if (office == null) {
      return res.status(404).json({ message: 'Cannot find office' });
    }
    
    // Remove office reference from all employees in this office
    await Employee.updateMany(
      { office: req.params.id },
      { $set: { office: null } }
    );
    
    await Office.deleteOne({ _id: req.params.id });
    res.json({ message: 'Deleted Office' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Assign employee to office
router.post('/:id/assign-employee', async (req, res) => {
  try {
    const office = await Office.findById(req.params.id);
    if (!office) {
      return res.status(404).json({ message: 'Office not found' });
    }

    const employee = await Employee.findById(req.body.employeeId);
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    // Check if employee is already in this office
    if (office.employees.includes(req.body.employeeId)) {
      return res.status(400).json({ message: 'Employee already assigned to this office' });
    }

    // Remove employee from previous office if any
    if (employee.office) {
      const previousOffice = await Office.findById(employee.office);
      if (previousOffice) {
        previousOffice.employees = previousOffice.employees.filter(
          empId => empId.toString() !== req.body.employeeId
        );
        previousOffice.numberOfEmployees = previousOffice.employees.length;
        await previousOffice.save();
      }
    }

    // Add employee to new office
    office.employees.push(req.body.employeeId);
    office.numberOfEmployees = office.employees.length;
    await office.save();

    // Update employee's office reference
    employee.office = req.params.id;
    await employee.save();

    res.json({ 
      message: 'Employee assigned to office successfully',
      office: await Office.findById(req.params.id).populate('employees')
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Remove employee from office
router.post('/:id/remove-employee', async (req, res) => {
  try {
    const office = await Office.findById(req.params.id);
    if (!office) {
      return res.status(404).json({ message: 'Office not found' });
    }

    const employee = await Employee.findById(req.body.employeeId);
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    // Remove employee from office
    office.employees = office.employees.filter(
      empId => empId.toString() !== req.body.employeeId
    );
    office.numberOfEmployees = office.employees.length;
    await office.save();

    // Remove office reference from employee
    employee.office = null;
    await employee.save();

    res.json({ 
      message: 'Employee removed from office successfully',
      office: await Office.findById(req.params.id).populate('employees')
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Get all employees in an office
router.get('/:id/employees', async (req, res) => {
  try {
    const office = await Office.findById(req.params.id).populate('employees');
    if (!office) {
      return res.status(404).json({ message: 'Office not found' });
    }
    res.json(office.employees);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
