const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Employee = require('../models/Employee');
const VerificationCode = require('../models/VerificationCode');
const bcrypt = require('bcryptjs');
const { sendVerificationEmail } = require('../utils/emailService');

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
    
    // Debug logging
    console.log('Login attempt:', { email, passwordLength: password?.length });

    // First try regular user login with email/password
    let user = await User.findOne({ email });
    console.log('User lookup result:', user ? `Found: ${user.email}` : 'Not found');
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
        const isAdmin = user.email === 'sadmin@gmail.com' || role === 'Admin';
        if (isAdmin) {
          role = 'Admin';
          
          // For admin users, require email verification
          // Generate 6-digit verification code
          const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
          
          // Save verification code to database
          await VerificationCode.deleteMany({ email: user.email, used: false });
          const verification = new VerificationCode({
            email: user.email,
            code: verificationCode,
            userId: user._id,
            expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
          });
          await verification.save();
          
          // Check if email is configured (Resend for production, Gmail SMTP for local)
          const hasResend = process.env.RESEND_API_KEY;
          const hasGmail = process.env.EMAIL_USER && process.env.EMAIL_PASS;
          
          if (!hasResend && !hasGmail) {
            const errorMsg = process.env.NODE_ENV === 'production' 
              ? 'Email service not configured. Please set RESEND_API_KEY in Railway variables. Railway blocks SMTP, so Resend API is required.'
              : 'Email service not configured. For local development: set EMAIL_USER and EMAIL_PASS in .env file. For production: set RESEND_API_KEY in Railway variables.';
            
            console.error('Email service not configured:', errorMsg);
            return res.status(500).json({ 
              message: errorMsg,
              requiresVerification: true,
              error: 'EMAIL_NOT_CONFIGURED'
            });
          }
          
          // Send verification email in background (non-blocking)
          // This allows login to respond immediately
          sendVerificationEmail(user.email, verificationCode)
            .then(result => {
              if (result.success) {
                console.log('Verification email sent successfully to', user.email);
              } else {
                console.error('Failed to send verification email:', result.error);
              }
            })
            .catch(err => {
              console.error('Error sending verification email:', err);
            });
          
          // Return immediately - email is sent in background
          return res.json({ 
            message: 'Verification code sent to your email',
            requiresVerification: true,
            userId: user._id.toString(),
            email: user.email
          });
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

// Update user role and email
router.patch('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if email is being changed and if it's unique
    if (req.body.email && req.body.email !== user.email) {
      const existingUser = await User.findOne({ email: req.body.email });
      if (existingUser) {
        return res.status(400).json({ message: 'Email already exists' });
      }
      user.email = req.body.email;
    }

    if (req.body.role !== undefined) {
      user.role = req.body.role;
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

// Verify email code for admin login
router.post('/verify-code', async (req, res) => {
  try {
    const { userId, code } = req.body;

    if (!userId || !code) {
      return res.status(400).json({ message: 'User ID and verification code are required' });
    }

    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Find valid verification code
    const verification = await VerificationCode.findOne({
      userId: userId,
      email: user.email,
      code: code,
      used: false,
      expiresAt: { $gt: new Date() }
    });

    if (!verification) {
      return res.status(400).json({ message: 'Invalid or expired verification code' });
    }

    // Mark code as used
    verification.used = true;
    await verification.save();

    // Get role
    let role = user.role || '';
    if (user.email === 'sadmin@gmail.com') {
      role = 'Admin';
    }

    // Return user data for login
    return res.json({ 
      message: 'Verification successful',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        employeeId: user.employeeId,
        role: role
      }
    });
  } catch (err) {
    console.error('Verification error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Resend verification code
router.post('/resend-code', async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if email is configured (Resend for production, Gmail SMTP for local)
    const hasResend = process.env.RESEND_API_KEY;
    const hasGmail = process.env.EMAIL_USER && process.env.EMAIL_PASS;
    
    if (!hasResend && !hasGmail) {
      const errorMsg = process.env.NODE_ENV === 'production' 
        ? 'Email service not configured. Please set RESEND_API_KEY in Railway variables. Railway blocks SMTP, so Resend API is required.'
        : 'Email service not configured. For local development: set EMAIL_USER and EMAIL_PASS in .env file. For production: set RESEND_API_KEY in Railway variables.';
      
      console.error('Email service not configured:', errorMsg);
      return res.status(500).json({ 
        message: errorMsg,
        error: 'EMAIL_NOT_CONFIGURED'
      });
    }

    // Generate new 6-digit verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Delete old unused codes
    await VerificationCode.deleteMany({ email: user.email, used: false });
    
    // Save new verification code
    const verification = new VerificationCode({
      email: user.email,
      code: verificationCode,
      userId: user._id,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
    });
    await verification.save();
    
    // Send verification email
    const emailResult = await sendVerificationEmail(user.email, verificationCode);
    
    if (!emailResult.success) {
      console.error('Failed to send verification email:', emailResult.error);
      return res.status(500).json({ 
        message: `Failed to send verification email: ${emailResult.error}. Please check email configuration in backend/.env file.`,
        error: emailResult.error
      });
    }
    
    return res.json({ 
      message: 'Verification code resent to your email'
    });
  } catch (err) {
    console.error('Resend code error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
