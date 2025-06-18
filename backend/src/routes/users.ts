import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { User } from '../models/User';
import { asyncHandler } from '../middleware/errorHandler';

const router = express.Router();

// Get user profile
router.get('/profile', asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const user = await User.findById(req.user?.userId).select('-password');
  
  if (!user) {
    res.status(404).json({
      success: false,
      message: 'User not found'
    });
    return;
  }

  res.json({
    success: true,
    data: { user }
  });
}));

// Update user profile
router.put('/profile', [
  body('name').optional().trim().isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters'),
  body('avatar').optional().isURL().withMessage('Avatar must be a valid URL'),
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

  const user = await User.findByIdAndUpdate(
    req.user?.userId,
    req.body,
    { new: true, runValidators: true }
  ).select('-password');

  if (!user) {
    res.status(404).json({
      success: false,
      message: 'User not found'
    });
    return;
  }

  res.json({
    success: true,
    message: 'Profile updated successfully',
    data: { user }
  });
}));

// Update user preferences
router.put('/preferences', [
  body('currency').optional().isIn(['USD', 'INR']).withMessage('Invalid currency'),
  body('notifications').optional().isBoolean().withMessage('Notifications must be boolean'),
  body('biometricAuth').optional().isBoolean().withMessage('Biometric auth must be boolean'),
  body('darkMode').optional().isBoolean().withMessage('Dark mode must be boolean'),
  body('language').optional().isIn(['en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'ja', 'ko', 'zh']).withMessage('Invalid language'),
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

  // Build the preferences update object
  const preferencesUpdate: any = {};
  Object.keys(req.body).forEach(key => {
    preferencesUpdate[`preferences.${key}`] = req.body[key];
  });

  const user = await User.findByIdAndUpdate(
    req.user?.userId,
    { $set: preferencesUpdate },
    { new: true, runValidators: true }
  ).select('-password');

  if (!user) {
    res.status(404).json({
      success: false,
      message: 'User not found'
    });
    return;
  }

  res.json({
    success: true,
    message: 'Preferences updated successfully',
    data: { user }
  });
}));

export default router;