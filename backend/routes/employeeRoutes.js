const express = require('express');
const router = express.Router();
const Employee = require('../models/Employee');
const User = require('../models/User');
const Office = require('../models/Office');
const bcrypt = require('bcryptjs');

// Get all employees
router.get('/', async (req, res) => {
  try {
    const employees = await Employee.find().populate('office');
    res.json(employees);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get one employee
router.get('/:id', async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id).populate('office');
    if (employee == null) {
      return res.status(404).json({ message: 'Cannot find employee' });
    }
    res.json(employee);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create one employee
router.post('/', async (req, res) => {
  const employee = new Employee({
    employeeId: req.body.employeeId,
    name: req.body.name,
    position: req.body.position,
    department: req.body.department,
    role: req.body.role || '',
  });

  try {
    const newEmployee = await employee.save();
    
    // Automatically create a user account for the employee
    try {
      // Check if user already exists with this employeeId
      const existingUser = await User.findOne({ employeeId: req.body.employeeId });
      
      if (!existingUser) {
        // Hash the password (employee ID will be the password)
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(req.body.employeeId, salt);
        
        // Generate email from employee name (replace spaces with dots and make lowercase)
        const emailUsername = req.body.name.toLowerCase().replace(/\s+/g, '.');
        const email = `${emailUsername}@employee.com`;
        
        // Check if email already exists, if so, append employeeId
        let finalEmail = email;
        let emailExists = await User.findOne({ email: finalEmail });
        if (emailExists) {
          finalEmail = `${emailUsername}.${req.body.employeeId}@employee.com`;
        }
        
        // Check if username already exists, if so, append employeeId
        let finalUsername = req.body.name;
        let usernameExists = await User.findOne({ username: finalUsername });
        if (usernameExists) {
          finalUsername = `${req.body.name} (${req.body.employeeId})`;
        }
        
        // Create user account with role 'User' for employees
        const user = new User({
          username: finalUsername,
          email: finalEmail,
          password: hashedPassword,
          role: 'User',
          employeeId: req.body.employeeId
        });
        
        await user.save();
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
    
    res.status(201).json(newEmployee);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Update one employee
router.patch('/:id', async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (employee == null) {
      return res.status(404).json({ message: 'Cannot find employee' });
    }
    if (req.body.employeeId != null) {
      employee.employeeId = req.body.employeeId;
    }
    if (req.body.name != null) {
      employee.name = req.body.name;
    }
    if (req.body.position != null) {
      employee.position = req.body.position;
    }
    if (req.body.department != null) {
      employee.department = req.body.department;
    }
    if (req.body.role != null) {
      employee.role = req.body.role;
    }
    const updatedEmployee = await employee.save();
    res.json(updatedEmployee);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete one employee
router.delete('/:id', async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (employee == null) {
      return res.status(404).json({ message: 'Cannot find employee' });
    }
    
    // Get the employeeId before deleting the employee
    const employeeId = employee.employeeId;
    
    // Remove employee from their office if they have one
    if (employee.office) {
      try {
        const office = await Office.findById(employee.office);
        if (office) {
          office.employees = office.employees.filter(
            empId => empId.toString() !== req.params.id
          );
          office.numberOfEmployees = office.employees.length;
          await office.save();
          console.log(`✅ Removed employee from office: ${office.name}`);
        }
      } catch (officeError) {
        console.error('Error removing employee from office:', officeError);
      }
    }
    
    // Delete the employee
    await Employee.deleteOne({ _id: req.params.id });
    
    // Also delete the associated user account if it exists
    try {
      const user = await User.findOne({ employeeId: employeeId });
      if (user) {
        // Protect the admin account from deletion
        if (user.email === 'sadmin@gmail.com') {
          console.log('⚠️ Skipping deletion of protected admin account');
        } else {
          await User.deleteOne({ _id: user._id });
          console.log(`✅ Deleted user account for employee: ${employee.name} (${employeeId})`);
        }
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
