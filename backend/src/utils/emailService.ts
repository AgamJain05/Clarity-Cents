import nodemailer from 'nodemailer';
import crypto from 'crypto';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    // Debug environment variables
    console.log('🔧 EMAIL DEBUG - Environment variables:');
    console.log('🔧 EMAIL_HOST:', process.env.EMAIL_HOST);
    console.log('🔧 EMAIL_PORT:', process.env.EMAIL_PORT);
    console.log('🔧 EMAIL_USER:', process.env.EMAIL_USER ? `SET (${process.env.EMAIL_USER})` : 'NOT SET');
    console.log('🔧 EMAIL_PASS:', process.env.EMAIL_PASS ? `SET (length: ${process.env.EMAIL_PASS.length})` : 'NOT SET');
    console.log('🔧 EMAIL_FROM:', process.env.EMAIL_FROM);
    
    // Debug actual values being passed to transporter
    const authConfig = {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    };
    console.log('🔧 AUTH CONFIG:', {
      user: authConfig.user ? `"${authConfig.user}"` : 'undefined',
      pass: authConfig.pass ? `"${authConfig.pass.substring(0, 4)}..."` : 'undefined',
      userType: typeof authConfig.user,
      passType: typeof authConfig.pass,
      userEmpty: authConfig.user === '',
      passEmpty: authConfig.pass === ''
    });

    // Check for common credential issues
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.error('❌ MISSING EMAIL CREDENTIALS!');
      console.error('EMAIL_USER:', process.env.EMAIL_USER ? 'SET' : 'MISSING');
      console.error('EMAIL_PASS:', process.env.EMAIL_PASS ? 'SET' : 'MISSING');
    }

    if (process.env.EMAIL_USER && process.env.EMAIL_USER.trim() === '') {
      console.error('❌ EMAIL_USER is empty string!');
    }

    if (process.env.EMAIL_PASS && process.env.EMAIL_PASS.trim() === '') {
      console.error('❌ EMAIL_PASS is empty string!');
    }

    const transportConfig = {
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    };

    console.log('🔧 FINAL TRANSPORT CONFIG:', {
      ...transportConfig,
      auth: {
        user: transportConfig.auth.user ? 'SET' : 'NOT SET',
        pass: transportConfig.auth.pass ? 'SET' : 'NOT SET'
      }
    });

    this.transporter = nodemailer.createTransport(transportConfig);

    // Test the connection on startup
    this.verifyConnection();
  }

  private async verifyConnection() {
    try {
      console.log('🔧 Testing email connection...');
      await this.transporter.verify();
      console.log('✅ Email connection verified successfully!');
    } catch (error) {
      console.error('❌ Email connection failed:', error);
      console.error('❌ This is why emails will fail to send');
    }
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      const mailOptions = {
        from: process.env.EMAIL_FROM || 'FinanceFlow <noreply@financeflow.com>',
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      };

      console.log('📧 Attempting to send email...');
      console.log('📧 To:', options.to);
      console.log('📧 From:', mailOptions.from);
      console.log('📧 Subject:', options.subject);
      
      // Check transporter auth before sending
      const transporterOptions = this.transporter.options as any;
      console.log('📧 Transporter auth at send time:', {
        user: transporterOptions.auth?.user ? 'SET' : 'NOT SET',
        pass: transporterOptions.auth?.pass ? 'SET' : 'NOT SET'
      });
      
      const result = await this.transporter.sendMail(mailOptions);
      console.log('📧 Email sent successfully:', result.messageId);
      return true;
    } catch (error) {
      console.error('📧 Email sending failed:', error);
      
      // Additional error analysis
      if (error && typeof error === 'object' && 'code' in error && error.code === 'EAUTH') {
        console.error('❌ AUTHENTICATION ERROR - Common causes:');
        console.error('   1. Incorrect Gmail app password');
        console.error('   2. Gmail 2FA not enabled');
        console.error('   3. App password not generated correctly');
        console.error('   4. Environment variables not loaded');
      }
      
      return false;
    }
  }

  generateVerificationToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  async sendEmailVerification(email: string, name: string, token: string): Promise<boolean> {
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #007AFF; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background-color: #007AFF; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to FinanceFlow!</h1>
          </div>
          <div class="content">
            <h2>Hi ${name},</h2>
            <p>Thank you for signing up for FinanceFlow! To complete your registration and start managing your finances, please verify your email address.</p>
            
            <p>Click the button below to verify your email:</p>
            <a href="${verificationUrl}" class="button">Verify Email Address</a>
            
            <p>Or copy and paste this link into your browser:</p>
            <p><a href="${verificationUrl}">${verificationUrl}</a></p>
            
            <p>This verification link will expire in 24 hours.</p>
            
            <p>If you didn't create an account with FinanceFlow, please ignore this email.</p>
            
            <p>Best regards,<br>The FinanceFlow Team</p>
          </div>
          <div class="footer">
            <p>This is an automated email. Please do not reply to this message.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
      Welcome to FinanceFlow!
      
      Hi ${name},
      
      Thank you for signing up for FinanceFlow! To complete your registration, please verify your email address by clicking the link below:
      
      ${verificationUrl}
      
      This verification link will expire in 24 hours.
      
      If you didn't create an account with FinanceFlow, please ignore this email.
      
      Best regards,
      The FinanceFlow Team
    `;

    return this.sendEmail({
      to: email,
      subject: 'Verify Your Email - FinanceFlow',
      html,
      text,
    });
  }

  async sendPasswordReset(email: string, name: string, token: string): Promise<boolean> {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #FF3B30; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background-color: #FF3B30; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 14px; }
          .warning { background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Password Reset Request</h1>
          </div>
          <div class="content">
            <h2>Hi ${name},</h2>
            <p>You recently requested to reset your password for your FinanceFlow account. Click the button below to reset it:</p>
            
            <a href="${resetUrl}" class="button">Reset Password</a>
            
            <p>Or copy and paste this link into your browser:</p>
            <p><a href="${resetUrl}">${resetUrl}</a></p>
            
            <div class="warning">
              <strong>Important:</strong> This password reset link will expire in 1 hour for security reasons.
            </div>
            
            <p>If you didn't request a password reset, please ignore this email or contact support if you have concerns.</p>
            
            <p>Best regards,<br>The FinanceFlow Team</p>
          </div>
          <div class="footer">
            <p>This is an automated email. Please do not reply to this message.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
      Password Reset Request - FinanceFlow
      
      Hi ${name},
      
      You recently requested to reset your password for your FinanceFlow account. Click the link below to reset it:
      
      ${resetUrl}
      
      This password reset link will expire in 1 hour for security reasons.
      
      If you didn't request a password reset, please ignore this email.
      
      Best regards,
      The FinanceFlow Team
    `;

    return this.sendEmail({
      to: email,
      subject: 'Reset Your Password - FinanceFlow',
      html,
      text,
    });
  }
}

export default new EmailService(); 