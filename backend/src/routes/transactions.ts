import express, { Request, Response } from 'express';
import { body, validationResult, query } from 'express-validator';
import { Transaction } from '../models/Transaction';
import { asyncHandler } from '../middleware/errorHandler';

const router = express.Router();

// Get all transactions for user
router.get('/', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('category').optional().isString().withMessage('Category must be a string'),
  query('type').optional().isIn(['income', 'expense']).withMessage('Type must be income or expense'),
  query('startDate').optional().isISO8601().withMessage('Start date must be valid ISO8601 date'),
  query('endDate').optional().isISO8601().withMessage('End date must be valid ISO8601 date'),
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

  const userId = req.user?.userId;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const skip = (page - 1) * limit;

  // Build filter
  const filter: any = { userId };
  
  if (req.query.category) {
    filter.category = req.query.category;
  }
  
  if (req.query.type) {
    filter.type = req.query.type;
  }
  
  if (req.query.startDate || req.query.endDate) {
    filter.date = {};
    if (req.query.startDate) {
      filter.date.$gte = new Date(req.query.startDate as string);
    }
    if (req.query.endDate) {
      filter.date.$lte = new Date(req.query.endDate as string);
    }
  }

  const [transactions, total] = await Promise.all([
    Transaction.find(filter)
      .sort({ date: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Transaction.countDocuments(filter)
  ]);

  res.json({
    success: true,
    data: {
      transactions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    }
  });
}));

// Get transaction statistics (move this above /:id!)
router.get('/stats/summary', asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.userId;
  const startDate = req.query.startDate ? new Date(req.query.startDate as string) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const endDate = req.query.endDate ? new Date(req.query.endDate as string) : new Date();

  const stats = await Transaction.aggregate([
    {
      $match: {
        userId: userId,
        date: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: '$type',
        total: { $sum: '$amount' },
        count: { $sum: 1 }
      }
    }
  ]);

  const categoryStats = await Transaction.aggregate([
    {
      $match: {
        userId: userId,
        date: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: { category: '$category', type: '$type' },
        total: { $sum: '$amount' },
        count: { $sum: 1 }
      }
    },
    {
      $sort: { total: -1 }
    }
  ]);

  res.json({
    success: true,
    data: {
      summary: stats,
      categoryBreakdown: categoryStats,
      period: {
        startDate,
        endDate
      }
    }
  });
}));

// Get transaction by ID
router.get('/:id', asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const transaction = await Transaction.findOne({
    _id: req.params.id,
    userId: req.user?.userId
  });

  if (!transaction) {
    res.status(404).json({
      success: false,
      message: 'Transaction not found'
    });
    return;
  }

  res.json({
    success: true,
    data: { transaction }
  });
}));

// Create new transaction
router.post('/', [
  body('merchant').trim().notEmpty().withMessage('Merchant is required'),
  body('amount').isNumeric().withMessage('Amount must be a number'),
  body('category').trim().notEmpty().withMessage('Category is required'),
  body('date').isISO8601().withMessage('Date must be valid ISO8601 date'),
  body('type').isIn(['income', 'expense']).withMessage('Type must be income or expense'),
  body('description').optional().trim().isLength({ max: 500 }).withMessage('Description cannot exceed 500 characters'),
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

  const transactionData = {
    ...req.body,
    userId: req.user?.userId,
    time: new Date().toLocaleTimeString()
  };

  const transaction = new Transaction(transactionData);
  await transaction.save();

  res.status(201).json({
    success: true,
    message: 'Transaction created successfully',
    data: { transaction }
  });
}));

// Update transaction
router.put('/:id', [
  body('merchant').optional().trim().notEmpty().withMessage('Merchant cannot be empty'),
  body('amount').optional().isNumeric().withMessage('Amount must be a number'),
  body('category').optional().trim().notEmpty().withMessage('Category cannot be empty'),
  body('date').optional().isISO8601().withMessage('Date must be valid ISO8601 date'),
  body('type').optional().isIn(['income', 'expense']).withMessage('Type must be income or expense'),
  body('description').optional().trim().isLength({ max: 500 }).withMessage('Description cannot exceed 500 characters'),
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

  const transaction = await Transaction.findOneAndUpdate(
    { _id: req.params.id, userId: req.user?.userId },
    req.body,
    { new: true, runValidators: true }
  );

  if (!transaction) {
    res.status(404).json({
      success: false,
      message: 'Transaction not found'
    });
    return;
  }

  res.json({
    success: true,
    message: 'Transaction updated successfully',
    data: { transaction }
  });
}));

// Delete transaction
router.delete('/:id', asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const transaction = await Transaction.findOneAndDelete({
    _id: req.params.id,
    userId: req.user?.userId
  });

  if (!transaction) {
    res.status(404).json({
      success: false,
      message: 'Transaction not found'
    });
    return;
  }

  res.json({
    success: true,
    message: 'Transaction deleted successfully'
  });
}));

export default router;