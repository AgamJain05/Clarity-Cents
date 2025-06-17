import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { Goal } from '../models/Goal';
import { asyncHandler } from '../middleware/errorHandler';

const router = express.Router();

// Get all goals for user
router.get('/', asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const goals = await Goal.find({ 
    userId: req.user?.userId 
  }).sort({ createdAt: -1 });

  res.json({
    success: true,
    data: { goals }
  });
}));

// Create new goal
router.post('/', [
  body('title').trim().notEmpty().withMessage('Goal title is required'),
  body('targetAmount').isNumeric().withMessage('Target amount must be a number'),
  body('targetDate').isISO8601().withMessage('Target date must be valid ISO8601 date'),
  body('category').trim().notEmpty().withMessage('Category is required'),
  body('priority').optional().isIn(['low', 'medium', 'high']).withMessage('Priority must be low, medium, or high'),
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

  const goalData = {
    ...req.body,
    userId: req.user?.userId,
  };

  const goal = new Goal(goalData);
  await goal.save();

  res.status(201).json({
    success: true,
    message: 'Goal created successfully',
    data: { goal }
  });
}));

// Update goal
router.put('/:id', [
  body('title').optional().trim().notEmpty().withMessage('Goal title cannot be empty'),
  body('targetAmount').optional().isNumeric().withMessage('Target amount must be a number'),
  body('currentAmount').optional().isNumeric().withMessage('Current amount must be a number'),
  body('status').optional().isIn(['active', 'completed', 'paused', 'cancelled']).withMessage('Invalid status'),
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

  const goal = await Goal.findOneAndUpdate(
    { _id: req.params.id, userId: req.user?.userId },
    req.body,
    { new: true, runValidators: true }
  );

  if (!goal) {
    res.status(404).json({
      success: false,
      message: 'Goal not found'
    });
    return;
  }

  res.json({
    success: true,
    message: 'Goal updated successfully',
    data: { goal }
  });
}));

// Delete goal
router.delete('/:id', asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const goal = await Goal.findOneAndDelete({
    _id: req.params.id,
    userId: req.user?.userId
  });

  if (!goal) {
    res.status(404).json({
      success: false,
      message: 'Goal not found'
    });
    return;
  }

  res.json({
    success: true,
    message: 'Goal deleted successfully'
  });
}));

export default router;