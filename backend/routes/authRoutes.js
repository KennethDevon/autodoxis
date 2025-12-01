const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Employee = require('../models/Employee');
const bcrypt = require('bcryptjs');

// Register User
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, role, employeeId } = req.body;

    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    // Check if username already exists
    user = await User.findOne({ username });
    if (user) {
      return res.status(400).json({ message: 'Username already exists' });
    }

    // If employeeId is provided, automatically set role to 'User'
    const finalRole = employeeId ? 'User' : (role || 'Employee');

    // Create new user
    user = new User({
      username,
      email,
      password,
      role: finalRole,
      employeeId: employeeId || null,
    });

    // Hash password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    // Save user
    const savedUser = await user.save();

    // Remove password from response
    const { password: _, ...userWithoutPassword } = savedUser.toObject();

    res.status(201).json({ 
      message: 'User registered successfully',
      user: userWithoutPassword
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// Login User
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // First try regular user login with email/password
    let user = await User.findOne({ email });
    if (user) {
      const isMatch = await bcrypt.compare(password, user.password);
      if (isMatch) {
        // Get role from user record directly
        let role = user.role || '';
        
        // If no role in user record, try to get from employee record
        if (!role && user.employeeId) {
          const employee = await Employee.findOne({ employeeId: user.employeeId });
          role = employee ? employee.role : '';
        }

        // Force Admin role for sadmin@gmail.com regardless of database role
        if (user.email === 'sadmin@gmail.com') {
          role = 'Admin';
        }

        return res.json({ 
          message: 'Logged in successfully',
          user: {
            id: user._id,
            username: user.username,
            email: user.email,
            employeeId: user.employeeId,
            role: role
          }
        });
      }
    }

    // If email/password login fails, try employee login with name/employeeId
    // First check if there's a user account with this employeeId
    const userWithEmployeeId = await User.findOne({ employeeId: password });
    if (userWithEmployeeId) {
      // Verify the name matches
      if (userWithEmployeeId.username.toLowerCase() === email.toLowerCase() || 
          userWithEmployeeId.email.toLowerCase() === email.toLowerCase()) {
        return res.json({ 
          message: 'Logged in successfully',
          user: {
            id: userWithEmployeeId._id,
            username: userWithEmployeeId.username,
            email: userWithEmployeeId.email,
            employeeId: userWithEmployeeId.employeeId,
            role: userWithEmployeeId.role || 'User'
          }
        });
      }
    }
    
    // Fallback: try employee login with name/employeeId (for backward compatibility)
    const employee = await Employee.findOne({ 
      name: email, // Using email field as name for employee login
      employeeId: password // Using password field as employeeId for employee login
    });

    if (employee) {
      // Check if user account exists for this employee
      const employeeUser = await User.findOne({ employeeId: employee.employeeId });
      
      if (employeeUser) {
        // Use the actual user account
        return res.json({ 
          message: 'Logged in successfully',
          user: {
            id: employeeUser._id,
            username: employeeUser.username,
            email: employeeUser.email,
            employeeId: employeeUser.employeeId,
            role: employeeUser.role || 'User'
          }
        });
      } else {
        // Create a virtual user object for employee login (backward compatibility)
        const virtualUser = {
          id: employee._id,
          username: employee.name,
          email: employee.name, // Using name as email for consistency
          employeeId: employee.employeeId,
          role: 'User' // Default to 'User' role
        };

        return res.json({ 
          message: 'Logged in successfully',
          user: virtualUser
        });
      }
    }

    // If both login methods fail
    return res.status(400).json({ message: 'Invalid Credentials' });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Basic logout route (no actual session management yet)
router.post('/logout', (req, res) => {
  // In a real application, you would clear server-side sessions or invalidate tokens here
  res.json({ message: 'Logged out successfully' });
});

// Get all users (for super admin dashboard)
router.get('/users', async (req, res) => {
  try {
    const users = await User.find({}, { password: 0 }); // Exclude password field
    res.json(users);
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Update user profile (username, email, password)
router.put('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if username is being changed and if it's unique
    if (req.body.username && req.body.username !== user.username) {
      const existingUser = await User.findOne({ username: req.body.username });
      if (existingUser) {
        return res.status(400).json({ message: 'Username already exists' });
      }
      user.username = req.body.username;
    }

    // Check if email is being changed and if it's unique
    if (req.body.email && req.body.email !== user.email) {
      const existingUser = await User.findOne({ email: req.body.email });
      if (existingUser) {
        return res.status(400).json({ message: 'Email already exists' });
      }
      user.email = req.body.email;
    }

    // Handle password update if provided
    if (req.body.password && req.body.password.trim() !== '') {
      // Validate password length
      if (req.body.password.length < 6) {
        return res.status(400).json({ message: 'Password must be at least 6 characters long' });
      }
      
      // Hash the new password
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(req.body.password, salt);
    }

    const updatedUser = await user.save();
    // Remove password from response
    const { password, ...userWithoutPassword } = updatedUser.toObject();
    res.json(userWithoutPassword);
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Update user role
router.patch('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Protect sadmin@gmail.com from role changes
    if (user.email === 'sadmin@gmail.com') {
      return res.status(403).json({ 
        message: 'Access denied: Cannot modify the Admin account role. This account is protected.' 
      });
    }

    if (req.body.role !== undefined) {
      user.role = req.body.role;
    }

    const updatedUser = await user.save();
    res.json(updatedUser);
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Delete user
router.delete('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Protect sadmin@gmail.com from deletion
    if (user.email === 'sadmin@gmail.com') {
      return res.status(403).json({ 
        message: 'Access denied: Cannot delete the Admin account. This account is protected.' 
      });
    }

    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error while deleting user' });
  }
});

module.exports = router;
