// Support both Resend API (production/Railway) and Gmail SMTP (local development)
const nodemailer = require('nodemailer');
let Resend = null;

// Try to load Resend (optional - only needed for production)
try {
  Resend = require('resend').Resend;
} catch (e) {
  console.log('Resend not available, will use Gmail SMTP for local development');
}

// Initialize Resend client lazily (only for production)
let resend = null;

const getResendClient = () => {
  if (!resend && Resend) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error('RESEND_API_KEY must be set in environment variables. Railway blocks SMTP, so Resend API is required.');
    }
    resend = new Resend(apiKey);
  }
  return resend;
};

// Create Gmail transporter (for local development)
const createGmailTransporter = () => {
  const appPassword = (process.env.EMAIL_PASS || '').replace(/\s/g, '');
  const emailUser = process.env.EMAIL_USER || 'your-email@gmail.com';
  
  console.log('Creating Gmail transporter for local development:', {
    user: emailUser,
    passwordLength: appPassword.length
  });
  
  return nodemailer.createTransport({
    service: 'gmail',
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: emailUser,
      pass: appPassword
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 10000,
    tls: {
      rejectUnauthorized: false
    }
  });
};

// HTML content for verification email
const getEmailHTML = (verificationCode) => `
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
`;

// Send verification email - uses Resend API if available, otherwise Gmail SMTP
const sendVerificationEmail = async (email, verificationCode) => {
  try {
    // Try Resend API first (for production/Railway)
    if (process.env.RESEND_API_KEY && Resend) {
      const resendClient = getResendClient();
      const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
      
      console.log('Attempting to send verification email via Resend to:', email);
      
      const { data, error } = await resendClient.emails.send({
        from: `Autodoxis <${fromEmail}>`,
        to: email,
        subject: 'Admin Login Verification Code - Autodoxis',
        html: getEmailHTML(verificationCode)
      });

      if (error) {
        console.error('❌ Resend API error:', error);
        throw new Error(`Resend API error: ${error.message}`);
      }

      console.log('✅ Verification email sent successfully via Resend!', {
        id: data?.id,
        to: email
      });

      return { success: true, messageId: data?.id };
    }
    
    // Fallback to Gmail SMTP (for local development)
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      throw new Error('For local development: EMAIL_USER and EMAIL_PASS must be set in .env file. For production: RESEND_API_KEY must be set in Railway variables.');
    }

    console.log('Using Gmail SMTP for local development. Sending to:', email);
    const transporter = createGmailTransporter();
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Admin Login Verification Code - Autodoxis',
      html: getEmailHTML(verificationCode)
    };

    // Send email with timeout
    const sendWithTimeout = (transporter, mailOptions, timeoutMs = 30000) => {
      return Promise.race([
        transporter.sendMail(mailOptions),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Email send timeout after 30 seconds')), timeoutMs)
        )
      ]);
    };
    
    const info = await sendWithTimeout(transporter, mailOptions);
    console.log('✅ Verification email sent successfully via Gmail SMTP!', {
      messageId: info.messageId,
      to: email,
      response: info.response
    });
    
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Error sending verification email:', {
      error: error.message,
      to: email
    });
    if (error.stack) {
      console.error('Error stack:', error.stack);
    }
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendVerificationEmail
};
