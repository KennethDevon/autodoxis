// Try Resend first (recommended for cloud), fallback to Gmail SMTP
// Note: Railway blocks SMTP on Free/Trial/Hobby plans, so Resend is required
let Resend;
try {
  const resendModule = require('resend');
  Resend = resendModule.Resend || resendModule;
} catch (e) {
  console.log('Resend not installed, will use Gmail SMTP (may not work on Railway Free/Trial plans)');
}

const nodemailer = require('nodemailer');

// Use Resend if API key is available (better for cloud environments)
const useResend = () => {
  return Resend && process.env.RESEND_API_KEY;
};

// Create Gmail transporter (fallback)
const createGmailTransporter = () => {
  const appPassword = (process.env.EMAIL_PASS || 'your-app-password').replace(/\s/g, '');
  const emailUser = process.env.EMAIL_USER || 'your-email@gmail.com';
  
  console.log('Creating Gmail transporter with:', {
    user: emailUser,
    passwordLength: appPassword.length,
    passwordPreview: appPassword.substring(0, 4) + '...' + appPassword.substring(appPassword.length - 4)
  });
  
  return nodemailer.createTransport({
    service: 'gmail',
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    requireTLS: true,
    auth: {
      user: emailUser,
      pass: appPassword
    },
    connectionTimeout: 20000,
    greetingTimeout: 15000,
    socketTimeout: 20000,
    tls: {
      rejectUnauthorized: false
    }
  });
};

// Send verification email
const sendVerificationEmail = async (email, verificationCode) => {
  try {
    const htmlContent = `
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

    // Try Resend first (recommended for cloud)
    if (useResend()) {
      console.log('Using Resend to send verification email to:', email);
      const resend = new Resend(process.env.RESEND_API_KEY);
      
      const { data, error } = await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || 'Autodoxis <onboarding@resend.dev>',
        to: email,
        subject: 'Admin Login Verification Code - Autodoxis',
        html: htmlContent
      });

      if (error) {
        console.error('❌ Resend error:', error);
        throw new Error(`Resend error: ${error.message}`);
      }

      console.log('✅ Verification email sent via Resend!', {
        id: data?.id,
        to: email
      });
      return { success: true, messageId: data?.id };
    }

    // Fallback to Gmail SMTP
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      throw new Error('EMAIL_USER and EMAIL_PASS must be set, or use RESEND_API_KEY for Resend');
    }

    console.log('Using Gmail SMTP to send verification email to:', email);
    const transporter = createGmailTransporter();
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Admin Login Verification Code - Autodoxis',
      html: htmlContent
    };

    const sendWithTimeout = (transporter, mailOptions, timeoutMs = 30000) => {
      return Promise.race([
        transporter.sendMail(mailOptions),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Email send timeout after 30 seconds')), timeoutMs)
        )
      ]);
    };
    
    const info = await sendWithTimeout(transporter, mailOptions);
    console.log('✅ Verification email sent via Gmail!', {
      messageId: info.messageId,
      to: email,
      response: info.response
    });
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Error sending verification email:', {
      error: error.message,
      code: error.code,
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

