const express = require('express');
const router = express.Router();
const Employee = require('../models/Employee');
const User = require('../models/User');
const Office = require('../models/Office');
const Program = require('../models/Program');
const bcrypt = require('bcryptjs');
const sequelize = require('../config/database');
const { Op } = require('sequelize');
const { formatResponse } = require('../utils/responseFormatter');

const normalizeNullableInt = (value) => {
  if (value === undefined) return undefined;
  if (value === null || value === '' || value === 'null' || value === 'undefined') return null;
  const parsed = parseInt(value, 10);
  return Number.isNaN(parsed) ? null : parsed;
};

// Get all employees
router.get('/', async (req, res) => {
  try {
    const employees = await Employee.findAll({
      include: [
        { model: Office, as: 'office' },
        { model: Program, as: 'program' }
      ]
    });
    res.json(formatResponse(employees));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get one employee
router.get('/:id', async (req, res) => {
  try {
    const employee = await Employee.findByPk(req.params.id, {
      include: [
        { model: Office, as: 'office' },
        { model: Program, as: 'program' }
      ]
    });
    if (employee == null) {
      return res.status(404).json({ message: 'Cannot find employee' });
    }
    res.json(formatResponse(employee));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create one employee
router.post('/', async (req, res) => {
  try {
    const newEmployee = await Employee.create({
      employeeId: req.body.employeeId,
      name: req.body.name,
      position: req.body.position,
      department: req.body.department,
      role: req.body.role || '',
      officeId: normalizeNullableInt(req.body.officeId),
      programId: normalizeNullableInt(req.body.programId)
    });
    
    // Automatically create a user account for the employee
    try {
      // Check if user already exists with this employeeId
      const existingUser = await User.findOne({ where: { employeeId: req.body.employeeId } });
      
      if (!existingUser) {
        // Hash the password (employee ID will be the password)
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(req.body.employeeId, salt);
        
        // Generate email from employee name (replace spaces with dots and make lowercase)
        const emailUsername = req.body.name.toLowerCase().replace(/\s+/g, '.');
        const email = `${emailUsername}@employee.com`;
        
        // Check if email already exists, if so, append employeeId
        let finalEmail = email;
        let emailExists = await User.findOne({ where: { email: finalEmail } });
        if (emailExists) {
          finalEmail = `${emailUsername}.${req.body.employeeId}@employee.com`;
        }
        
        // Check if username already exists, if so, append employeeId
        let finalUsername = req.body.name;
        let usernameExists = await User.findOne({ where: { username: finalUsername } });
        if (usernameExists) {
          finalUsername = `${req.body.name} (${req.body.employeeId})`;
        }
        
        // Create user account with role 'User' for employees
        await User.create({
          username: finalUsername,
          email: finalEmail,
          password: hashedPassword,
          role: 'User',
          employeeId: req.body.employeeId
        });
        
        console.log(`✅ Auto-created user account for employee: ${req.body.name} (${req.body.employeeId})`);
        console.log(`   - Username: ${finalUsername}`);
        console.log(`   - Email: ${finalEmail}`);
        console.log(`   - Role: User`);
      } else {
        console.log(`⚠️ User account already exists for employee ID: ${req.body.employeeId}`);
      }
    } catch (userError) {
      console.error('❌ Error auto-creating user account:', userError);
      console.error('   Error details:', userError.message);
      if (userError.errors) {
        console.error('   Validation errors:', userError.errors);
      }
      // Don't fail the employee creation if user creation fails
    }
    
    res.status(201).json(formatResponse(newEmployee));
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Update one employee (accepts both id and _id)
router.patch('/:id', async (req, res) => {
  try {
    const employeeId = parseInt(req.params.id) || req.params.id;
    const employee = await Employee.findByPk(employeeId);
    if (employee == null) {
      return res.status(404).json({ message: 'Cannot find employee' });
    }
    
    // Update fields
    const updateData = {};
    if (req.body.employeeId != null) updateData.employeeId = req.body.employeeId;
    if (req.body.name != null) updateData.name = req.body.name;
    if (req.body.position != null) updateData.position = req.body.position;
    if (req.body.department != null) updateData.department = req.body.department;
    if (req.body.role != null) updateData.role = req.body.role;
    if (req.body.officeId !== undefined) updateData.officeId = normalizeNullableInt(req.body.officeId);
    if (req.body.programId !== undefined) updateData.programId = normalizeNullableInt(req.body.programId);
    
    await employee.update(updateData);
    const updatedEmployee = await Employee.findByPk(employeeId, {
      include: [{ model: Office, as: 'office' }]
    });
    res.json(formatResponse(updatedEmployee));
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete one employee (accepts both id and _id)
router.delete('/:id', async (req, res) => {
  try {
    const employeeId = parseInt(req.params.id) || req.params.id;
    const employee = await Employee.findByPk(employeeId);
    if (employee == null) {
      return res.status(404).json({ message: 'Cannot find employee' });
    }
    
    // Remove employee from office_employees junction table if they have one
    if (employee.officeId) {
      try {
        await sequelize.query(
          `DELETE FROM office_employees WHERE employeeId = ?`,
          { replacements: [employee.id] }
        );
        console.log(`✅ Removed employee from office associations`);
      } catch (officeError) {
        console.error('Error removing employee from office:', officeError);
      }
    }
    
    // Store the employee's string ID before deletion (needed to find associated user)
    const employeeStringId = employee.employeeId;
    
    // Delete the employee
    await employee.destroy();
    
    // Also delete the associated user account if it exists
    // Use employee.employeeId (the string ID like "2022-1000") not the database ID
    try {
      const user = await User.findOne({ where: { employeeId: employeeStringId } });
      if (user) {
        // Protect the admin account from deletion
        if (user.email === 'sadmin@gmail.com') {
          console.log('⚠️ Skipping deletion of protected admin account');
        } else {
          await user.destroy();
          console.log(`✅ Deleted user account for employee: ${employee.name} (${employeeStringId})`);
        }
      } else {
        console.log(`ℹ️ No user account found for employee ID: ${employeeStringId}`);
      }
    } catch (userError) {
      console.error('Error deleting user account:', userError);
      // Don't fail the employee deletion if user deletion fails
    }
    
    res.json({ message: 'Deleted Employee' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
