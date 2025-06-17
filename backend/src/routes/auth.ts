import express, { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { body, validationResult } from 'express-validator';
import { User } from '../models/User';
import { authenticateToken } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import emailService from '../utils/emailService';

const router = express.Router();

// Register
router.post('/register', [
  body('name').trim().isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
], asyncHandler(async (req: Request, res: Response): Promise<void> => {
  console.log('🟡 BACKEND REGISTER STEP 1: Registration request received');
  console.log('🟡 Request body:', { 
    name: req.body.name,
    email: req.body.email, 
    password: req.body.password ? '[PASSWORD PROVIDED]' : '[NO PASSWORD]',
    passwordLength: req.body.password ? req.body.password.length : 0
  });

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log('🟡 BACKEND REGISTER ERROR: Validation failed:', errors.array());
    res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
    return;
  }

  const { name, email, password } = req.body;
  console.log('🟡 BACKEND REGISTER STEP 2: Checking if user exists with email:', email);

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  console.log('🟡 BACKEND REGISTER STEP 3: Existing user check result:', {
    userExists: !!existingUser,
    existingUserId: existingUser?._id
  });

  if (existingUser) {
    console.log('🟡 BACKEND REGISTER ERROR: User already exists');
    res.status(400).json({
      success: false,
      message: 'User with this email already exists'
    });
    return;
  }

  console.log('🟡 BACKEND REGISTER STEP 4: Creating user (password will be hashed by model)...');
  console.log('🟡 Original password:', password);

  // Generate email verification token
  const emailVerificationToken = emailService.generateVerificationToken();
  const emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  console.log('🟡 BACKEND REGISTER STEP 5: Generated email verification token');

  // Create user (password will be hashed by the model's pre-save middleware)
  const user = new User({
    name,
    email,
    password, // Don't hash here - let the model do it
    emailVerificationToken,
    emailVerificationExpires,
  });

  console.log('🟡 BACKEND REGISTER STEP 6: Saving user to database...');
  await user.save();
  console.log('🟡 BACKEND REGISTER STEP 7: User saved to database');
  console.log('🟡 Saved user ID:', user._id);

  console.log('🟡 BACKEND REGISTER STEP 8: Sending verification email...');
  
  // Send verification email
  const emailSent = await emailService.sendEmailVerification(email, name, emailVerificationToken);
  
  if (!emailSent) {
    console.log('🟡 BACKEND REGISTER WARNING: Email sending failed, but user was created');
  } else {
    console.log('🟡 BACKEND REGISTER STEP 9: Verification email sent successfully');
  }

  console.log('🟡 BACKEND REGISTER STEP 10: Sending success response');

  res.status(201).json({
    success: true,
    message: 'User registered successfully. Please check your email to verify your account.',
    data: {
      message: 'A verification email has been sent to your email address.',
      email: user.email,
      emailSent
    }
  });
}));

// Login
router.post('/login', [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').exists().withMessage('Password is required'),
], asyncHandler(async (req: Request, res: Response): Promise<void> => {
  console.log('🟢 BACKEND LOGIN STEP 1: Login request received');
  console.log('🟢 Request body:', { 
    email: req.body.email, 
    password: req.body.password ? '[PASSWORD PROVIDED]' : '[NO PASSWORD]',
    passwordLength: req.body.password ? req.body.password.length : 0
  });

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log('🟢 BACKEND LOGIN ERROR: Validation failed:', errors.array());
    res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
    return;
  }

  const { email, password } = req.body;
  console.log('🟢 BACKEND LOGIN STEP 2: Searching for user with email:', email);

  // Find user
  const user = await User.findOne({ email }).select('+password');
  console.log('🟢 BACKEND LOGIN STEP 3: User search result:', {
    userFound: !!user,
    userId: user?._id,
    userEmail: user?.email,
    hasPassword: !!user?.password,
    passwordLength: user?.password ? user.password.length : 0
  });

  if (!user) {
    console.log('🟢 BACKEND LOGIN ERROR: User not found in database');
    res.status(401).json({
      success: false,
      message: 'Invalid credentials'
    });
    return;
  }

  // Check if email is verified
  console.log('🟢 BACKEND LOGIN STEP 3: Checking email verification status...');
  console.log('🟢 User email:', user.email);
  console.log('🟢 User isEmailVerified:', user.isEmailVerified);
  console.log('🟢 User emailVerificationToken:', user.emailVerificationToken);
  console.log('🟢 User emailVerificationExpires:', user.emailVerificationExpires);
  
  if (!user.isEmailVerified) {
    console.log('🟢 BACKEND LOGIN ERROR: Email not verified for user:', user.email);
    res.status(401).json({
      success: false,
      message: 'Please verify your email address before logging in. Check your inbox for the verification email.',
      emailVerificationRequired: true
    });
    return;
  }

  console.log('🟢 BACKEND LOGIN STEP 3.5: Email verification check passed');

  console.log('🟢 BACKEND LOGIN STEP 4: Comparing passwords...');
  console.log('🟢 Provided password:', password);
  console.log('🟢 Stored password hash:', user.password);

  // Check password
  const isPasswordValid = await bcrypt.compare(password, user.password);
  console.log('🟢 BACKEND LOGIN STEP 5: Password comparison result:', isPasswordValid);

  if (!isPasswordValid) {
    console.log('🟢 BACKEND LOGIN ERROR: Password comparison failed');
    console.log('🟢 Debugging password comparison:');
    
    // Additional debugging
    try {
      const testHash = await bcrypt.hash(password, 12);
      console.log('🟢 Test hash of provided password:', testHash);
      const testCompare = await bcrypt.compare(password, testHash);
      console.log('🟢 Test comparison with new hash:', testCompare);
    } catch (debugError) {
      console.log('🟢 Debug error:', debugError);
    }

    res.status(401).json({
      success: false,
      message: 'Invalid credentials'
    });
    return;
  }

  console.log('🟢 BACKEND LOGIN STEP 6: Password valid, generating token...');

  // Generate JWT token
  const token = (jwt.sign as any)(
    { userId: user._id, email: user.email },
    process.env.JWT_SECRET || 'your-secret-key',
    { expiresIn: '30d' }
  );

  console.log('🟢 BACKEND LOGIN STEP 7: Token generated successfully');

  // Return user data (without password)
  const userResponse = {
    id: user._id,
    name: user.name,
    email: user.email,
    avatar: user.avatar,
    isPremium: user.isPremium,
    joinDate: user.joinDate,
    preferences: user.preferences,
  };

  console.log('🟢 BACKEND LOGIN STEP 8: Sending success response');

  res.json({
    success: true,
    message: 'Login successful',
    data: {
      user: userResponse,
      token
    }
  });
}));

// Verify token
router.get('/verify', authenticateToken, asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const user = await User.findById(req.user?.userId).select('-password');
  if (!user) {
    res.status(404).json({
      success: false,
      message: 'User not found'
    });
    return;
  }

  const userResponse = {
    id: user._id,
    name: user.name,
    email: user.email,
    avatar: user.avatar,
    isPremium: user.isPremium,
    joinDate: user.joinDate,
    preferences: user.preferences,
  };

  res.json({
    success: true,
    data: { user: userResponse }
  });
}));

// Reset password request
router.post('/forgot-password', [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
], asyncHandler(async (req: Request, res: Response): Promise<void> => {
  console.log('🔑 FORGOT PASSWORD STEP 1: Request received');
  
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
    return;
  }

  const { email } = req.body;
  console.log('🔑 FORGOT PASSWORD STEP 2: Looking for user with email:', email);

  const user = await User.findOne({ email });

  // Always return success for security (don't reveal if email exists)
  const successMessage = 'If an account with this email exists, you will receive password reset instructions.';

  if (!user) {
    console.log('🔑 FORGOT PASSWORD: User not found, but returning success for security');
    res.json({
      success: true,
      message: successMessage
    });
    return;
  }

  if (!user.isEmailVerified) {
    console.log('🔑 FORGOT PASSWORD: User email not verified');
    res.json({
      success: true,
      message: successMessage
    });
    return;
  }

  console.log('🔑 FORGOT PASSWORD STEP 3: Generating reset token');

  // Generate password reset token
  const resetToken = crypto.randomBytes(32).toString('hex');
  const passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  const passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  user.passwordResetToken = passwordResetToken;
  user.passwordResetExpires = passwordResetExpires;
  await user.save();

  console.log('🔑 FORGOT PASSWORD STEP 4: Sending reset email');

  // Send password reset email
  const emailSent = await emailService.sendPasswordReset(user.email, user.name, resetToken);

  if (emailSent) {
    console.log('🔑 FORGOT PASSWORD STEP 5: Reset email sent successfully');
  } else {
    console.log('🔑 FORGOT PASSWORD WARNING: Email sending failed');
  }

  res.json({
    success: true,
    message: successMessage
  });
}));

// Logout
router.post('/logout', authenticateToken, asyncHandler(async (req: Request, res: Response): Promise<void> => {
  // In a stateless JWT system, logout is typically handled on the client side
  // by removing the token. However, we can log the logout event and return success.
  
  console.log(`User ${req.user?.userId} logged out at ${new Date().toISOString()}`);
  
  // In a more advanced system, you might:
  // 1. Add the token to a blacklist
  // 2. Store logout events in the database
  // 3. Invalidate refresh tokens
  
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
}));

// Verify Email
router.post('/verify-email', [
  body('token').notEmpty().withMessage('Verification token is required'),
], asyncHandler(async (req: Request, res: Response): Promise<void> => {
  console.log('📧 EMAIL VERIFICATION STEP 1: Request received');
  
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log('📧 EMAIL VERIFICATION ERROR: Validation failed:', errors.array());
    res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
    return;
  }

  const { token } = req.body;
  console.log('📧 EMAIL VERIFICATION STEP 2: Looking for user with token');

  // Find user with the verification token
  const user = await User.findOne({
    emailVerificationToken: token,
    emailVerificationExpires: { $gt: Date.now() }
  });

  if (!user) {
    console.log('📧 EMAIL VERIFICATION ERROR: Invalid or expired token');
    res.status(400).json({
      success: false,
      message: 'Invalid or expired verification token'
    });
    return;
  }

  console.log('📧 EMAIL VERIFICATION STEP 3: Verifying user email');
  console.log('📧 Before verification - User:', {
    email: user.email,
    isEmailVerified: user.isEmailVerified,
    emailVerificationToken: user.emailVerificationToken,
    emailVerificationExpires: user.emailVerificationExpires
  });

  // Update user as verified
  user.isEmailVerified = true;
  user.emailVerificationToken = undefined;
  user.emailVerificationExpires = undefined;
  await user.save();

  console.log('📧 EMAIL VERIFICATION STEP 4: User email verified successfully');
  console.log('📧 After verification - User:', {
    email: user.email,
    isEmailVerified: user.isEmailVerified,
    emailVerificationToken: user.emailVerificationToken,
    emailVerificationExpires: user.emailVerificationExpires
  });

  // Double-check by querying the user again from database
  const verifiedUser = await User.findById(user._id);
  console.log('📧 Double-check from database - User:', {
    email: verifiedUser?.email,
    isEmailVerified: verifiedUser?.isEmailVerified,
    emailVerificationToken: verifiedUser?.emailVerificationToken,
    emailVerificationExpires: verifiedUser?.emailVerificationExpires
  });

  // Generate JWT token for immediate login
  const authToken = (jwt.sign as any)(
    { userId: user._id, email: user.email },
    process.env.JWT_SECRET || 'your-secret-key',
    { expiresIn: '30d' }
  );

  // Return user data
  const userResponse = {
    id: user._id,
    name: user.name,
    email: user.email,
    avatar: user.avatar,
    isPremium: user.isPremium,
    joinDate: user.joinDate,
    preferences: user.preferences,
  };

  res.json({
    success: true,
    message: 'Email verified successfully! You are now logged in.',
    email: user.email, // Add email at top level for easy access
    data: {
      user: userResponse,
      token: authToken
    }
  });
}));

// Resend Email Verification
router.post('/resend-verification', [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
], asyncHandler(async (req: Request, res: Response): Promise<void> => {
  console.log('📧 RESEND VERIFICATION STEP 1: Request received');
  
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
    return;
  }

  const { email } = req.body;
  console.log('📧 RESEND VERIFICATION STEP 2: Looking for user with email:', email);

  const user = await User.findOne({ email });
  if (!user) {
    // Don't reveal if email exists for security
    res.json({
      success: true,
      message: 'If an account with this email exists and is not verified, a new verification email has been sent.'
    });
    return;
  }

  if (user.isEmailVerified) {
    res.json({
      success: true,
      message: 'This email is already verified. You can log in normally.'
    });
    return;
  }

  // Generate new verification token
  const emailVerificationToken = emailService.generateVerificationToken();
  const emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  user.emailVerificationToken = emailVerificationToken;
  user.emailVerificationExpires = emailVerificationExpires;
  await user.save();

  // Send verification email
  const emailSent = await emailService.sendEmailVerification(user.email, user.name, emailVerificationToken);

  res.json({
    success: true,
    message: 'If an account with this email exists and is not verified, a new verification email has been sent.',
    data: { emailSent }
  });
}));

// Reset Password
router.post('/reset-password', [
  body('token').notEmpty().withMessage('Reset token is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
], asyncHandler(async (req: Request, res: Response): Promise<void> => {
  console.log('🔑 RESET PASSWORD STEP 1: Request received');
  
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
    return;
  }

  const { token, password } = req.body;
  console.log('🔑 RESET PASSWORD STEP 2: Looking for user with reset token');

  // Hash the token to compare with stored hash
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() }
  });

  if (!user) {
    console.log('🔑 RESET PASSWORD ERROR: Invalid or expired reset token');
    res.status(400).json({
      success: false,
      message: 'Invalid or expired reset token'
    });
    return;
  }

  console.log('🔑 RESET PASSWORD STEP 3: Updating user password');

  // Update password (will be hashed by pre-save middleware)
  user.password = password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  console.log('🔑 RESET PASSWORD STEP 4: Password updated successfully');

  res.json({
    success: true,
    message: 'Password reset successfully. You can now log in with your new password.'
  });
}));

export default router;
