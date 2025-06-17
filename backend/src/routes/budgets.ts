import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { BudgetCategory } from '../models/Budget';
import { asyncHandler } from '../middleware/errorHandler';

const router = express.Router();

// Get all budgets for user in app
router.get('/', asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const budgets = await BudgetCategory.find({ 
    userId: req.user?.userId,
    isActive: true 
  }).sort({ createdAt: -1 });

  res.json({
    success: true,
    data: { budgets }
  });
}));

// Create new budget
router.post('/', [
  body('name').trim().notEmpty().withMessage('Budget name is required'),
  body('allocated').isNumeric().withMessage('Allocated amount must be a number'),
  body('period').isIn(['weekly', 'monthly', 'yearly']).withMessage('Period must be weekly, monthly, or yearly'),
  body('startDate').isISO8601().withMessage('Start date must be valid ISO8601 date'),
  body('endDate').isISO8601().withMessage('End date must be valid ISO8601 date'),
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

  const budgetData = {
    ...req.body,
    userId: req.user?.userId,
  };

  const budget = new BudgetCategory(budgetData);
  await budget.save();

  res.status(201).json({
    success: true,
    message: 'Budget created successfully',
    data: { budget }
  });
}));

// Update budget
router.put('/:id', [
  body('name').optional().trim().notEmpty().withMessage('Budget name cannot be empty'),
  body('allocated').optional().isNumeric().withMessage('Allocated amount must be a number'),
  body('spent').optional().isNumeric().withMessage('Spent amount must be a number'),
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

  const budget = await BudgetCategory.findOneAndUpdate(
    { _id: req.params.id, userId: req.user?.userId },
    req.body,
    { new: true, runValidators: true }
  );

  if (!budget) {
    res.status(404).json({
      success: false,
      message: 'Budget not found'
    });
    return;
  }

  res.json({
    success: true,
    message: 'Budget updated successfully',
    data: { budget }
  });
}));

// Delete budget
router.delete('/:id', asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const budget = await BudgetCategory.findOneAndUpdate(
    { _id: req.params.id, userId: req.user?.userId },
    { isActive: false },
    { new: true }
  );

  if (!budget) {
    res.status(404).json({
      success: false,
      message: 'Budget not found'
    });
    return;
  }

  res.json({
    success: true,
    message: 'Budget deleted successfully'
  });
}));

export default router;