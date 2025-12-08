const nodemailer = require('nodemailer');

// Create transporter - using Gmail as default
// For production, you should use environment variables
const createTransporter = () => {
  // Remove spaces from app password if present (Gmail app passwords can have spaces)
  const appPassword = (process.env.EMAIL_PASS || 'your-app-password').replace(/\s/g, '');
  const emailUser = process.env.EMAIL_USER || 'your-email@gmail.com';
  
  console.log('Creating email transporter with:', {
    user: emailUser,
    passwordLength: appPassword.length,
    passwordPreview: appPassword.substring(0, 4) + '...' + appPassword.substring(appPassword.length - 4)
  });
  
  return nodemailer.createTransport({
    service: 'gmail',
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: emailUser,
      pass: appPassword // Use App Password, not regular password
    },
    tls: {
      rejectUnauthorized: false
    }
  });
};

// Send verification email
const sendVerificationEmail = async (email, verificationCode) => {
  try {
    // Validate email configuration
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      throw new Error('EMAIL_USER and EMAIL_PASS must be set in environment variables');
    }
    
    const transporter = createTransporter();
    
    // Skip verify() to speed up login - it can be slow
    // The email will still send, and errors will be caught
    
    const mailOptions = {
      from: process.env.EMAIL_USER || 'your-email@gmail.com',
      to: email,
      subject: 'Admin Login Verification Code - Autodoxis',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #3498db 0%, #2980b9 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0;">Autodoxis Routing System</h1>
          </div>
          <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e0e0e0;">
            <h2 style="color: #2c3e50; margin-top: 0;">Admin Login Verification</h2>
            <p style="color: #555; font-size: 16px; line-height: 1.6;">
              You have requested to log in as an administrator. Please use the verification code below to complete your login:
            </p>
            <div style="background: white; border: 2px dashed #3498db; border-radius: 8px; padding: 20px; text-align: center; margin: 30px 0;">
              <div style="font-size: 36px; font-weight: bold; color: #3498db; letter-spacing: 8px; font-family: 'Courier New', monospace;">
                ${verificationCode}
              </div>
            </div>
            <p style="color: #e74c3c; font-size: 14px; margin-top: 20px;">
              <strong>Security Notice:</strong> This code will expire in 10 minutes. If you did not request this login, please ignore this email.
            </p>
            <p style="color: #7f8c8d; font-size: 12px; margin-top: 30px; border-top: 1px solid #e0e0e0; padding-top: 20px;">
              This is an automated message from Autodoxis Routing System. Please do not reply to this email.
            </p>
          </div>
        </div>
      `
    };

    // Send email (non-blocking - called from background)
    console.log('Attempting to send verification email to:', email);
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Verification email sent successfully!', {
      messageId: info.messageId,
      to: email,
      response: info.response
    });
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Error sending verification email:', {
      error: error.message,
      code: error.code,
      command: error.command,
      response: error.response,
      to: email
    });
    // Log full error for debugging
    if (error.stack) {
      console.error('Error stack:', error.stack);
    }
    // Don't fail login if email fails - just log it
    // Return success anyway so user can still get verification code via resend
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendVerificationEmail
};

