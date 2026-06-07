const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Employee = require('../models/Employee');
const VerificationCode = require('../models/VerificationCode');
const bcrypt = require('bcryptjs');
const { sendVerificationEmail } = require('../utils/emailService');
const { Op } = require('sequelize');
const { formatResponse } = require('../utils/responseFormatter');

// Register User
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, role, employeeId } = req.body;

    // Check if user already exists
    let user = await User.findOne({ where: { email } });
    if (user) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    // Check if username already exists
    user = await User.findOne({ where: { username } });
    if (user) {
      return res.status(400).json({ message: 'Username already exists' });
    }

    // If employeeId is provided, automatically set role to 'User'
    const finalRole = employeeId ? 'User' : (role || 'Employee');

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user
    const savedUser = await User.create({
      username,
      email,
      password: hashedPassword,
      role: finalRole,
      employeeId: employeeId || null
    });

    // Remove password from response
    const { password: _, ...userWithoutPassword } = savedUser.toJSON();

    res.status(201).json({ 
      message: 'User registered successfully',
      user: formatResponse(userWithoutPassword)
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
    const normalizeLoginText = (value) => String(value || '')
      .toLowerCase()
      .normalize('NFKC')
      .replace(/[^a-z0-9]/g, '');
    
    // Validate input
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }
    
    // Debug logging
    console.log('Login attempt:', { email, passwordLength: password?.length });

    // First try regular user login with email/password
    let user = await User.findOne({ where: { email } });
    console.log('User lookup result:', user ? `Found: ${user.email} (ID: ${user.id})` : 'Not found');
    
    if (user) {
      // Check if password is provided
      if (!user.password) {
        console.log('User has no password set');
        return res.status(400).json({ message: 'Account setup incomplete. Please contact administrator.' });
      }
      
      const isMatch = await bcrypt.compare(password, user.password);
      console.log('Password match:', isMatch);
      
      if (isMatch) {
        // Get role from user record directly
        let role = user.role || '';
        
        // If no role in user record, try to get from employee record
        if (!role && user.employeeId) {
          const employee = await Employee.findOne({ where: { employeeId: user.employeeId } });
          role = employee ? employee.role : '';
        }

        // Force Admin role for admin emails regardless of database role
        const adminEmails = ['kennethdevon2004@gmail.com', 'kennethdevon2004.updated@gmail.com', 'sadmin@gmail.com'];
        const isAdmin = adminEmails.includes(user.email.toLowerCase()) || role === 'Admin';
        if (isAdmin) {
          role = 'Admin';
          
          // For ALL admin users, require email verification
          // Generate 6-digit verification code
          const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
          
          // Save verification code to database
          await VerificationCode.destroy({ 
            where: { email: user.email, used: false } 
          });
          await VerificationCode.create({
            email: user.email,
            code: verificationCode,
            userId: user.id,
            expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
          });
          
          // Log the verification code for debugging (only in development)
          if (process.env.NODE_ENV !== 'production') {
            console.log(`🔐 Verification code for ${user.email}: ${verificationCode}`);
          }
          
          // Check if email is configured (Resend for production, Gmail SMTP for local)
          const hasResend = process.env.RESEND_API_KEY;
          const hasGmail = process.env.EMAIL_USER && process.env.EMAIL_PASS;
          
          if (!hasResend && !hasGmail) {
            // In development, still allow login but show code in console
            if (process.env.NODE_ENV !== 'production') {
              console.log(`⚠️ Email service not configured. Verification code: ${verificationCode}`);
              return res.json({ 
                message: `Verification code generated. Check console for code: ${verificationCode}`,
                requiresVerification: true,
                userId: user.id.toString(),
                email: user.email,
                verificationCode: verificationCode // Include code in response for development
              });
            }
            
            const errorMsg = 'Email service not configured. Please set RESEND_API_KEY in Railway variables. Railway blocks SMTP, so Resend API is required.';
            console.error('Email service not configured:', errorMsg);
            return res.status(500).json({ 
              message: errorMsg,
              requiresVerification: true,
              error: 'EMAIL_NOT_CONFIGURED'
            });
          }
          
          // Send verification email and confirm delivery result before responding
          const emailResult = await sendVerificationEmail(user.email, verificationCode);
          if (!emailResult.success) {
            console.error('❌ Failed to send verification email:', emailResult.error);
            
            // In development, include code fallback to avoid login dead-end
            if (process.env.NODE_ENV !== 'production') {
              console.log(`⚠️ Email failed. Verification code: ${verificationCode}`);
              return res.status(500).json({
                message: `Verification email failed to send: ${emailResult.error}. Check backend email config. Using development fallback code.`,
                requiresVerification: true,
                userId: user.id.toString(),
                email: user.email,
                verificationCode: verificationCode
              });
            }

            return res.status(500).json({
              message: `Failed to send verification email: ${emailResult.error}. Please check email service configuration.`,
              requiresVerification: true,
              error: 'EMAIL_SEND_FAILED'
            });
          }

          console.log('✅ Verification email sent successfully to', user.email);
          return res.json({ 
            message: 'Verification code sent to your email. Please check your inbox (and spam folder).',
            requiresVerification: true,
            userId: user.id.toString(),
            email: user.email
          });
        }

        return res.json({ 
          message: 'Logged in successfully',
          user: formatResponse({
            id: user.id,
            _id: user.id, // Add _id for compatibility
            username: user.username,
            email: user.email,
            employeeId: user.employeeId,
            role: role
          })
        });
      }
    }

    // If email/password login fails, try employee login with name/employeeId
    // First check if there's a user account with this employeeId
    const userWithEmployeeId = await User.findOne({ where: { employeeId: password } });
    if (userWithEmployeeId) {
      // Verify the name matches
      const loginKey = normalizeLoginText(email);
      const usernameKey = normalizeLoginText(userWithEmployeeId.username);
      const userEmailKey = normalizeLoginText(userWithEmployeeId.email);
      if (usernameKey === loginKey || userEmailKey === loginKey) {
        return res.json({ 
          message: 'Logged in successfully',
          user: formatResponse({
            id: userWithEmployeeId.id,
            _id: userWithEmployeeId.id,
            username: userWithEmployeeId.username,
            email: userWithEmployeeId.email,
            employeeId: userWithEmployeeId.employeeId,
            role: userWithEmployeeId.role || 'User'
          })
        });
      }
    }
    
    // Fallback: try employee login with flexible name matching + employeeId
    const employee = await Employee.findOne({ where: { employeeId: password } });

    if (employee) {
      const loginKey = normalizeLoginText(email);
      const employeeNameKey = normalizeLoginText(employee.name);
      if (loginKey !== employeeNameKey) {
        console.log('Employee login name mismatch:', { input: email, employeeName: employee.name });
        return res.status(400).json({
          message: 'Invalid Credentials',
          details: 'Name does not match employee record.'
        });
      }

      // Check if user account exists for this employee
      const employeeUser = await User.findOne({ where: { employeeId: employee.employeeId } });
      
      if (employeeUser) {
        // Use the actual user account
        return res.json({ 
          message: 'Logged in successfully',
          user: formatResponse({
            id: employeeUser.id,
            _id: employeeUser.id,
            username: employeeUser.username,
            email: employeeUser.email,
            employeeId: employeeUser.employeeId,
            role: employeeUser.role || 'User'
          })
        });
      } else {
        // Create a virtual user object for employee login (backward compatibility)
        const virtualUser = {
          id: employee.id,
          username: employee.name,
          email: employee.name, // Using name as email for consistency
          employeeId: employee.employeeId,
          role: 'User' // Default to 'User' role
        };

        return res.json({ 
          message: 'Logged in successfully',
          user: formatResponse(virtualUser)
        });
      }
    }

    // If both login methods fail
    console.log('All login methods failed for:', email);
    return res.status(400).json({ 
      message: 'Invalid Credentials',
      details: 'Please check your email and password. If you forgot your password, contact your administrator.'
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ 
      message: 'Server error during login', 
      error: err.message,
      details: 'Please try again later or contact support if the problem persists.'
    });
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
    const users = await User.findAll({ 
      attributes: { exclude: ['password'] }
    });
    res.json(formatResponse(users));
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Update user profile (username, email, password)
router.put('/users/:id', async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const updateData = {};

    // Check if username is being changed and if it's unique
    if (req.body.username && req.body.username !== user.username) {
      const existingUser = await User.findOne({ where: { username: req.body.username } });
      if (existingUser) {
        return res.status(400).json({ message: 'Username already exists' });
      }
      updateData.username = req.body.username;
    }

    // Check if email is being changed and if it's unique
    if (req.body.email && req.body.email !== user.email) {
      const existingUser = await User.findOne({ where: { email: req.body.email } });
      if (existingUser) {
        return res.status(400).json({ message: 'Email already exists' });
      }
      updateData.email = req.body.email;
    }

    // Handle password update if provided
    if (req.body.password && req.body.password.trim() !== '') {
      // Validate password length
      if (req.body.password.length < 6) {
        return res.status(400).json({ message: 'Password must be at least 6 characters long' });
      }
      
      // Hash the new password
      const salt = await bcrypt.genSalt(10);
      updateData.password = await bcrypt.hash(req.body.password, salt);
    }

    await user.update(updateData);
    // Remove password from response
    const { password, ...userWithoutPassword } = user.toJSON();
    res.json(formatResponse(userWithoutPassword));
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Update user role and email
router.patch('/users/:id', async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const updateData = {};

    // Check if email is being changed and if it's unique
    if (req.body.email && req.body.email !== user.email) {
      const existingUser = await User.findOne({ where: { email: req.body.email } });
      if (existingUser) {
        return res.status(400).json({ message: 'Email already exists' });
      }
      updateData.email = req.body.email;
    }

    if (req.body.role !== undefined) {
      updateData.role = req.body.role;
    }

    await user.update(updateData);
    // Remove password from response
    const { password, ...userWithoutPassword } = user.toJSON();
    res.json(formatResponse(userWithoutPassword));
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Delete user
router.delete('/users/:id', async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Protect sadmin@gmail.com from deletion
    if (user.email === 'sadmin@gmail.com') {
      return res.status(403).json({ 
        message: 'Access denied: Cannot delete the Admin account. This account is protected.' 
      });
    }

    await user.destroy();
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
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Find valid verification code
    const verification = await VerificationCode.findOne({
      where: {
        userId: userId,
        email: user.email,
        code: code,
        used: false,
        expiresAt: { [Op.gt]: new Date() }
      }
    });

    if (!verification) {
      return res.status(400).json({ message: 'Invalid or expired verification code' });
    }

    // Mark code as used
    await verification.update({ used: true });

    // Get role
    let role = user.role || '';
    if (user.email === 'sadmin@gmail.com') {
      role = 'Admin';
    }

    // Return user data for login
    return res.json({ 
      message: 'Verification successful',
      user: formatResponse({
        id: user.id,
        _id: user.id,
        username: user.username,
        email: user.email,
        employeeId: user.employeeId,
        role: role
      })
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
    const user = await User.findByPk(userId);
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
    await VerificationCode.destroy({ 
      where: { email: user.email, used: false } 
    });
    
    // Save new verification code
    await VerificationCode.create({
      email: user.email,
      code: verificationCode,
      userId: user.id,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
    });
    
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
