# Email Setup Instructions

## Gmail SMTP Configuration

To enable email verification and password reset functionality, you need to configure Gmail SMTP. Follow these steps:

### 1. Enable 2-Factor Authentication on Gmail

1. Go to your Google Account settings: https://myaccount.google.com/
2. Navigate to **Security** → **2-Step Verification**
3. Follow the prompts to enable 2FA if not already enabled

### 2. Generate App Password

1. In Google Account settings, go to **Security** → **App passwords**
2. Select **Mail** as the app and **Other** as the device
3. Enter "FinanceFlow Backend" as the device name
4. Copy the generated 16-character app password (remove spaces)

### 3. Update Environment Variables

Update your `.env` file with your Gmail credentials:

```env
# Email Configuration (Gmail SMTP)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-actual-gmail@gmail.com
EMAIL_PASS=your-16-character-app-password
EMAIL_FROM=FinanceFlow <your-actual-gmail@gmail.com>
```

### 4. Test Email Configuration

You can test the email configuration by registering a new user. The system will:

1. Send a verification email to the user's email address
2. Log email sending status in the console
3. Require email verification before allowing login

### 5. Frontend URL Configuration

Make sure your `FRONTEND_URL` in the `.env` file matches your actual frontend URL:

```env
# For development
FRONTEND_URL=http://localhost:8081

# For production
FRONTEND_URL=https://your-domain.com
```

### 6. Email Templates

The system includes beautiful HTML email templates for:

- **Email Verification**: Welcome email with verification link
- **Password Reset**: Secure password reset email with time-limited link

### 7. Security Features

- Verification tokens expire after 24 hours
- Password reset tokens expire after 1 hour
- Tokens are cryptographically secure (32 random bytes)
- Password reset tokens are hashed before storage
- No sensitive information is revealed in error messages

### 8. Troubleshooting

**Email not sending?**
- Check your app password is correct (16 characters, no spaces)
- Verify 2FA is enabled on your Gmail account
- Check console logs for detailed error messages
- Ensure Gmail SMTP settings are correct

**Verification links not working?**
- Check that `FRONTEND_URL` is correctly set
- Verify the token hasn't expired
- Check that the user exists in the database

**Common Error Messages:**
- `Invalid login` → Check app password
- `Connection refused` → Check SMTP settings
- `Authentication failed` → Regenerate app password 