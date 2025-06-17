import express, { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import { User } from '../models/User';
import { authenticateToken } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';

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

  // Create user (password will be hashed by the model's pre-save middleware)
  const user = new User({
    name,
    email,
    password, // Don't hash here - let the model do it
  });

  console.log('🟡 BACKEND REGISTER STEP 5: Saving user to database...');
  await user.save();
  console.log('🟡 BACKEND REGISTER STEP 6: User saved to database');
  console.log('🟡 Saved user ID:', user._id);

  // Generate JWT token
  const token = (jwt.sign as any)(
    { userId: user._id, email: user.email },
    process.env.JWT_SECRET || 'your-secret-key',
    { expiresIn: '30d' }
  );

  console.log('🟡 BACKEND REGISTER STEP 7: Token generated');

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

  console.log('🟡 BACKEND REGISTER STEP 8: Sending success response');

  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    data: {
      user: userResponse,
      token
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
  const user = await User.findOne({ email });

  // Always return success for security (don't reveal if email exists)
  res.json({
    success: true,
    message: 'If an account with this email exists, you will receive password reset instructions.'
  });

  // If user exists, you would typically send an email here
  if (user) {
    console.log(`Password reset requested for user: ${user.email}`);
    // TODO: Implement email sending logic
  }
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

export default router;
