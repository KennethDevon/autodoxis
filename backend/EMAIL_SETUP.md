# Email Verification Setup Guide

This guide will help you configure email sending for the admin login verification feature.

## Prerequisites

- A Gmail account (or another email service provider)
- Access to your email account settings

## Gmail Setup (Recommended)

### Step 1: Enable 2-Step Verification
1. Go to your Google Account settings: https://myaccount.google.com/
2. Navigate to **Security** → **2-Step Verification**
3. Enable 2-Step Verification if not already enabled

### Step 2: Generate App Password
1. Go to **Security** → **2-Step Verification** → **App passwords**
2. Select **Mail** as the app
3. Select **Other (Custom name)** as the device
4. Enter "Autodoxis" as the name
5. Click **Generate**
6. Copy the 16-character password (you'll need this for the `.env` file)

### Step 3: Configure Environment Variables

Add these variables to your `backend/.env` file:

```env
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-16-character-app-password
```

**Important:** 
- Use your Gmail address for `EMAIL_USER`
- Use the App Password (not your regular Gmail password) for `EMAIL_PASS`
- Never commit your `.env` file to version control

## Other Email Providers

If you want to use a different email provider (Outlook, Yahoo, etc.), you'll need to modify the `backend/utils/emailService.js` file with the appropriate SMTP settings.

### Example for Outlook:
```javascript
const transporter = nodemailer.createTransport({
  host: 'smtp-mail.outlook.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});
```

## Testing

After configuration, test the email service by:
1. Logging in as an admin user
2. Check your email inbox for the verification code
3. Enter the code to complete login

## Troubleshooting

### "Failed to send verification email"
- Verify your `EMAIL_USER` and `EMAIL_PASS` are correct
- Make sure you're using an App Password (not regular password) for Gmail
- Check that 2-Step Verification is enabled
- Verify your email account is not locked or restricted

### "Invalid credentials"
- Double-check the App Password was copied correctly (no spaces)
- Ensure the email address matches exactly

### Code not received
- Check spam/junk folder
- Verify email address is correct
- Wait a few minutes and try resending

## Security Notes

- Verification codes expire after 10 minutes
- Each code can only be used once
- Old unused codes are automatically deleted
- Codes are stored securely in the database with expiration dates

